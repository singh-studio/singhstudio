// Self-serve paid plans on Stripe, with no accounts and no emails to send:
//   /checkout/<plan>-<interval>  → Stripe Checkout (subscription)
//   /claim?session_id=…          → mints the customer's API key and shows it once
//   /webhooks/stripe             → keeps each key in step with its subscription
//   /billing                     → Stripe's customer portal (cancel, card, invoices)
//
// Keys are stored hashed in KV:  key:<sha256> → record,  sub:<id> → sha256.

import { HttpError, escapeHtml, html, page } from './http.js';

const API = 'https://api.stripe.com/v1';
export const PLAN_LOOKUP = /^duly_(pro|platform)_(monthly|yearly)$/;
const ACTIVE = new Set(['active', 'trialing', 'past_due']);
const CLAIM_TTL = 60 * 60 * 24; // the plaintext key can be re-shown for a day

export function planFromLookup(lookup) {
  const m = PLAN_LOOKUP.exec(lookup || '');
  return m ? m[1] : null;
}

function form(obj, prefix = '', out = new URLSearchParams()) {
  for (const [k, v] of Object.entries(obj)) {
    const key = prefix ? `${prefix}[${k}]` : k;
    if (v === undefined || v === null) continue;
    if (typeof v === 'object') form(v, key, out);
    else out.append(key, String(v));
  }
  return out;
}

async function stripe(env, method, path, params) {
  if (!env.STRIPE_SECRET_KEY) throw new HttpError(503, 'Payments are not switched on yet. Email kris@singhstudio.co.nz and I will set you up by hand.');
  const url = new URL(API + path);
  const init = { method, headers: { Authorization: `Bearer ${env.STRIPE_SECRET_KEY}` } };
  if (params && method === 'GET') url.search = form(params).toString();
  if (params && method !== 'GET') {
    init.body = form(params);
    init.headers['Content-Type'] = 'application/x-www-form-urlencoded';
  }
  const res = await fetch(url, init);
  const body = await res.json();
  if (!res.ok) throw new HttpError(res.status >= 500 ? 502 : 400, body?.error?.message || 'Stripe request failed');
  return body;
}

export async function sha256(text) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

export function newKey(live = true) {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  let s = '';
  for (const b of bytes) s += alphabet[b % alphabet.length];
  return `duly_${live ? 'live' : 'test'}_${s}`;
}

// GET /checkout/pro-monthly etc.
export async function checkout(request, env, url) {
  const m = /^\/checkout\/(pro|platform)-(monthly|yearly)$/.exec(url.pathname);
  if (!m) throw new HttpError(404, 'Unknown plan');
  if (!env.STRIPE_SECRET_KEY || !env.KEYS) {
    return html(page('Coming soon', `<h1>Almost ready</h1><p class="lede">Paid plans open shortly. Email <a href="mailto:kris@singhstudio.co.nz?subject=Duly%20${m[1]}%20plan">kris@singhstudio.co.nz</a> and I’ll set you up by hand today.</p><p><a class="btn" href="/pricing/">Back to pricing</a></p>`), 503);
  }
  const lookup = `duly_${m[1]}_${m[2]}`;
  const prices = await stripe(env, 'GET', '/prices', { 'lookup_keys[]': lookup, active: 'true' });
  const price = prices.data?.[0];
  if (!price) throw new HttpError(503, `No Stripe price has the lookup key ${lookup} yet`);
  const origin = url.origin;
  const session = await stripe(env, 'POST', '/checkout/sessions', {
    mode: 'subscription',
    line_items: { 0: { price: price.id, quantity: 1 } },
    success_url: `${origin}/claim?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/pricing/`,
    allow_promotion_codes: 'true',
    billing_address_collection: 'auto',
    tax_id_collection: { enabled: 'true' },
    automatic_tax: env.STRIPE_AUTOMATIC_TAX === 'true' ? { enabled: 'true' } : undefined,
    subscription_data: { metadata: { product: 'duly', plan: m[1] } },
  });
  return Response.redirect(session.url, 303);
}

// GET /claim?session_id=cs_… (Stripe sends the customer here after paying)
export async function claim(request, env, url) {
  const sessionId = url.searchParams.get('session_id') || '';
  if (!/^cs_(test|live)_[A-Za-z0-9]+$/.test(sessionId)) throw new HttpError(400, 'Missing or malformed session_id');
  if (!env.KEYS) throw new HttpError(503, 'API keys are not enabled on this deployment yet');

  let key = await env.KEYS.get(`claim:${sessionId}`);
  let plan;
  if (!key) {
    const s = await stripe(env, 'GET', `/checkout/sessions/${sessionId}`, { 'expand[]': 'line_items' });
    if (s.status !== 'complete' || !['paid', 'no_payment_required'].includes(s.payment_status) || s.mode !== 'subscription' || !s.subscription) {
      throw new HttpError(402, 'That checkout is not complete yet. If you have just paid, refresh in a few seconds.');
    }
    const lookup = s.line_items?.data?.[0]?.price?.lookup_key;
    plan = planFromLookup(lookup);
    if (!plan) throw new HttpError(500, 'Paid for an unrecognised plan; email kris@singhstudio.co.nz');
    const subscription = typeof s.subscription === 'string' ? s.subscription : s.subscription.id;
    const customer = typeof s.customer === 'string' ? s.customer : s.customer?.id;
    // One key per subscription, even if the claim page is opened twice.
    const existing = await env.KEYS.get(`sub:${subscription}`);
    if (existing) {
      return html(page('Key already issued', '<h1>Your key was already issued</h1><p class="lede">For security a key is shown once. If you have lost it, email kris@singhstudio.co.nz from the address you paid with and I’ll rotate it.</p>'), 409);
    }
    key = newKey(sessionId.startsWith('cs_live_'));
    const hash = await sha256(key);
    await env.KEYS.put(`key:${hash}`, JSON.stringify({
      plan, status: 'active', subscription, customer, lookup, created: new Date().toISOString(),
      email: s.customer_details?.email || null,
    }));
    await env.KEYS.put(`sub:${subscription}`, hash);
    await env.KEYS.put(`claim:${sessionId}`, key, { expirationTtl: CLAIM_TTL });
  } else {
    const rec = await env.KEYS.get(`key:${await sha256(key)}`, 'json');
    plan = rec?.plan;
  }
  const origin = url.origin;
  return html(page('Your API key', `
<p class="eyebrow">/ ${escapeHtml(plan === 'platform' ? 'Platform' : 'Pro')} plan active</p>
<h1>Here’s your API key</h1>
<p class="lede">Copy it somewhere safe now. It won’t be shown again after today.</p>
<div class="keybox"><code id="k">${escapeHtml(key)}</code><button class="btn" type="button" onclick="navigator.clipboard.writeText(document.getElementById('k').textContent);this.textContent='Copied'">Copy</button></div>
<h2>Try it</h2>
<pre><code>curl -H "Authorization: Bearer ${escapeHtml(key)}" \\
  "${escapeHtml(origin)}/v1/deadline?regime=oia&amp;from=2026-12-01&amp;days=20"</code></pre>
<h2>Connect an AI assistant (MCP)</h2>
<pre><code>${escapeHtml(origin)}/mcp/k/${escapeHtml(key)}</code></pre>
<p>Or send the key as an <code>Authorization: Bearer</code> header to <code>${escapeHtml(origin)}/mcp</code>.</p>
<p><a href="/developers/">Developer docs</a> · <a href="/billing">Manage billing</a></p>`));
}

// Stripe-Signature: t=…,v1=…  — HMAC-SHA256 over "t.payload".
export async function verifyStripeSignature(payload, header, secret, toleranceSec = 300, now = Date.now()) {
  if (!header || !secret) return false;
  const parts = Object.fromEntries(header.split(',').map((p) => p.split('=')).filter((p) => p.length === 2).map(([k, v]) => [k.trim(), v.trim()]));
  const sigs = header.split(',').filter((p) => p.trim().startsWith('v1=')).map((p) => p.trim().slice(3));
  const t = Number(parts.t);
  if (!t || !sigs.length || Math.abs(now / 1000 - t) > toleranceSec) return false;
  const cryptoKey = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const mac = new Uint8Array(await crypto.subtle.sign('HMAC', cryptoKey, new TextEncoder().encode(`${t}.${payload}`)));
  const expected = [...mac].map((b) => b.toString(16).padStart(2, '0')).join('');
  return sigs.some((sig) => timingSafeEqual(sig, expected));
}

function timingSafeEqual(a, b) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

// POST /webhooks/stripe
export async function webhook(request, env) {
  if (request.method !== 'POST') throw new HttpError(405, 'POST only');
  const payload = await request.text();
  const ok = await verifyStripeSignature(payload, request.headers.get('stripe-signature'), env.STRIPE_WEBHOOK_SECRET);
  if (!ok) throw new HttpError(400, 'Bad signature');
  const event = JSON.parse(payload);
  if (!event.type?.startsWith('customer.subscription.') || !env.KEYS) return new Response('ignored', { status: 200 });
  const sub = event.data.object;
  const hash = await env.KEYS.get(`sub:${sub.id}`);
  if (!hash) return new Response('unknown subscription', { status: 200 });
  const rec = (await env.KEYS.get(`key:${hash}`, 'json')) || {};
  const lookup = sub.items?.data?.[0]?.price?.lookup_key;
  const status = event.type === 'customer.subscription.deleted' || !ACTIVE.has(sub.status) ? 'inactive' : 'active';
  await env.KEYS.put(`key:${hash}`, JSON.stringify({
    ...rec, status, stripeStatus: sub.status, plan: planFromLookup(lookup) || rec.plan, lookup: lookup || rec.lookup,
    updated: new Date().toISOString(),
  }));
  return new Response('ok', { status: 200 });
}

// GET /billing shows a form; POST with a key opens Stripe's customer portal.
export async function billing(request, env, url) {
  if (request.method === 'GET') {
    return html(page('Manage billing', `<h1>Manage billing</h1>
<p class="lede">Paste your API key to open the Stripe billing portal, where you can change plan, update your card, download invoices or cancel.</p>
<form method="post" class="stack"><label>API key<input name="key" required autocomplete="off" spellcheck="false" placeholder="duly_live_…"></label><button class="btn" type="submit">Open billing portal</button></form>`));
  }
  const key = String((await request.formData()).get('key') || '').trim();
  if (!env.KEYS) throw new HttpError(503, 'Billing is not enabled on this deployment yet');
  const rec = await env.KEYS.get(`key:${await sha256(key)}`, 'json');
  if (!rec?.customer) throw new HttpError(404, 'No subscription found for that key');
  const portal = await stripe(env, 'POST', '/billing_portal/sessions', { customer: rec.customer, return_url: `${url.origin}/pricing/` });
  return Response.redirect(portal.url, 303);
}
