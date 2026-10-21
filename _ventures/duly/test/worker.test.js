import { test } from 'node:test';
import assert from 'node:assert/strict';
import worker from '../src/worker/index.js';
import { verifyStripeSignature, sha256 } from '../src/worker/billing.js';

function kv() {
  const m = new Map();
  return {
    m,
    async get(k, type) { const v = m.get(k); return v === undefined ? null : type === 'json' ? JSON.parse(v) : v; },
    async put(k, v) { m.set(k, typeof v === 'string' ? v : JSON.stringify(v)); },
  };
}

function env(extra = {}) {
  return { KEYS: kv(), ASSETS: { fetch: async () => new Response('asset') }, ...extra };
}

const call = (e, path, init) => worker.fetch(new Request(`https://duly.test${path}`, init), e);
const rpc = (e, body, path = '/mcp', headers = {}) => call(e, path, { method: 'POST', headers: { 'content-type': 'application/json', ...headers }, body: JSON.stringify(body) });

test('REST: a deadline, free tier', async () => {
  const res = await call(env(), '/v1/deadline?regime=oia&from=2026-10-21&days=20');
  assert.equal(res.status, 200);
  assert.equal(res.headers.get('x-duly-plan'), 'free');
  assert.equal(res.headers.get('access-control-allow-origin'), '*');
  const body = await res.json();
  assert.equal(body.result, '2026-11-19');
  assert.equal(body.trace, undefined); // only with trace=true
  assert.match(body.summary, /Thursday 19 November 2026/);
});

test('REST: POST JSON, trace on request', async () => {
  const res = await call(env(), '/v1/deadline', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ regime: 'rma', from: '2026-12-01', days: 20, trace: true }) });
  const body = await res.json();
  assert.equal(res.status, 200);
  assert.ok(Array.isArray(body.trace) && body.trace.length > 20);
});

test('REST: errors are 400s with a message', async () => {
  for (const q of ['regime=oia&from=2026-10-21', 'regime=oia&from=2026-13-01&days=5', 'regime=zzz&from=2026-10-21&days=5', 'regime=adls&from=2026-10-21&days=5']) {
    const res = await call(env(), `/v1/deadline?${q}`);
    assert.equal(res.status, 400, q);
    assert.ok((await res.json()).error.message.length > 10);
  }
  assert.equal((await call(env(), '/v1/nope')).status, 404);
});

test('REST: holidays as JSON and as a calendar file', async () => {
  const json = await (await call(env(), '/v1/holidays?year=2027&province=canterbury')).json();
  assert.equal(json.anniversary[0].date, '2027-11-12');
  assert.ok(json.national.some((h) => h.key === 'matariki' && h.date === '2027-06-25'));
  const ics = await call(env(), '/v1/holidays?year=2027&format=ics');
  assert.match(ics.headers.get('content-type'), /text\/calendar/);
  assert.match(await ics.text(), /BEGIN:VCALENDAR[\s\S]*DTSTART;VALUE=DATE:20270625/);
});

test('REST: regimes list and one regime in full', async () => {
  const list = await (await call(env(), '/v1/regimes')).json();
  assert.ok(list.regimes.length >= 10);
  const one = await (await call(env(), '/v1/regimes/oia')).json();
  assert.equal(one.id, 'oia');
  assert.ok(one.presets.length);
});

test('batch needs a paid key', async () => {
  const res = await call(env(), '/v1/batch', { method: 'POST', headers: { 'content-type': 'application/json' }, body: '[]' });
  assert.equal(res.status, 402);
});

test('API keys: unknown, active, inactive', async () => {
  const e = env();
  const key = 'duly_live_' + 'a'.repeat(32);
  assert.equal((await call(e, '/v1/regimes', { headers: { authorization: `Bearer ${key}` } })).status, 401);
  await e.KEYS.put(`key:${await sha256(key)}`, JSON.stringify({ plan: 'pro', status: 'active' }));
  const ok = await call(e, '/v1/batch', { method: 'POST', headers: { authorization: `Bearer ${key}`, 'content-type': 'application/json' }, body: JSON.stringify([{ op: 'deadline', regime: 'oia', from: '2026-10-21', days: 20 }, { op: 'deadline', regime: 'oia' }]) });
  assert.equal(ok.status, 200);
  assert.equal(ok.headers.get('x-duly-plan'), 'pro');
  const { results } = await ok.json();
  assert.equal(results[0].result.result, '2026-11-19');
  assert.equal(results[1].ok, false);
  const key2 = 'duly_live_' + 'b'.repeat(32);
  await e.KEYS.put(`key:${await sha256(key2)}`, JSON.stringify({ plan: 'pro', status: 'inactive' }));
  assert.equal((await call(e, '/v1/regimes', { headers: { 'x-api-key': key2 } })).status, 402);
  assert.equal((await call(e, '/v1/regimes', { headers: { authorization: 'Bearer nonsense' } })).status, 401);
});

test('rate limits answer 429', async () => {
  const e = env({ RL_FREE: { limit: async () => ({ success: false }) } });
  const res = await call(e, '/v1/regimes');
  assert.equal(res.status, 429);
});

test('MCP: initialize, list tools, call a tool', async () => {
  const e = env();
  const init = await (await rpc(e, { jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2025-06-18', capabilities: {}, clientInfo: { name: 't', version: '1' } } })).json();
  assert.equal(init.result.protocolVersion, '2025-06-18');
  assert.ok(init.result.capabilities.tools);
  const note = await rpc(e, { jsonrpc: '2.0', method: 'notifications/initialized' });
  assert.equal(note.status, 202);
  const list = await (await rpc(e, { jsonrpc: '2.0', id: 2, method: 'tools/list' })).json();
  const names = list.result.tools.map((t) => t.name);
  assert.deepEqual(names, ['nz_deadline', 'nz_count_working_days', 'nz_is_working_day', 'nz_calendar_deadline', 'nz_public_holidays', 'nz_working_day_definitions']);
  for (const t of list.result.tools) assert.equal(t.inputSchema.type, 'object');
  const res = await (await rpc(e, { jsonrpc: '2.0', id: 3, method: 'tools/call', params: { name: 'nz_deadline', arguments: { regime: 'lgoima', from: '2026-12-12', days: 20 } } })).json();
  assert.equal(res.result.isError, false);
  assert.match(res.result.content[0].text, /Under LGOIMA/);
  assert.equal(res.result.structuredContent.regime.id, 'lgoima');
  const bad = await (await rpc(e, { jsonrpc: '2.0', id: 4, method: 'tools/call', params: { name: 'nz_deadline', arguments: { regime: 'oia', from: 'soon', days: 3 } } })).json();
  assert.equal(bad.result.isError, true);
  const missing = await (await rpc(e, { jsonrpc: '2.0', id: 5, method: 'nope' })).json();
  assert.equal(missing.error.code, -32601);
  assert.equal((await call(e, '/mcp')).status, 405);
  const holidays = await (await rpc(e, { jsonrpc: '2.0', id: 6, method: 'tools/call', params: { name: 'nz_public_holidays', arguments: { year: 2026, province: 'otago' } } })).json();
  assert.match(holidays.result.content[0].text, /2026-03-23 Otago Anniversary Day/);
});

test('MCP: key in the path is honoured', async () => {
  const e = env();
  const key = 'duly_test_' + 'c'.repeat(30);
  await e.KEYS.put(`key:${await sha256(key)}`, JSON.stringify({ plan: 'platform', status: 'active' }));
  let seen;
  e.RL_PLATFORM = { limit: async ({ key: k }) => { seen = k; return { success: true }; } };
  const res = await rpc(e, { jsonrpc: '2.0', id: 1, method: 'ping' }, `/mcp/k/${key}`);
  assert.equal(res.status, 200);
  assert.ok(seen);
});

test('static paths fall through to assets', async () => {
  assert.equal(await (await call(env(), '/oia/')).text(), 'asset');
});

// ---- Stripe ----------------------------------------------------------------

async function sign(payload, secret, t = Math.floor(Date.now() / 1000)) {
  const k = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const mac = new Uint8Array(await crypto.subtle.sign('HMAC', k, new TextEncoder().encode(`${t}.${payload}`)));
  return `t=${t},v1=${[...mac].map((b) => b.toString(16).padStart(2, '0')).join('')}`;
}

test('webhook signatures: valid, tampered, stale', async () => {
  const payload = '{"id":"evt_1"}';
  assert.equal(await verifyStripeSignature(payload, await sign(payload, 'whsec_x'), 'whsec_x'), true);
  assert.equal(await verifyStripeSignature(payload + ' ', await sign(payload, 'whsec_x'), 'whsec_x'), false);
  assert.equal(await verifyStripeSignature(payload, await sign(payload, 'whsec_y'), 'whsec_x'), false);
  assert.equal(await verifyStripeSignature(payload, await sign(payload, 'whsec_x', Math.floor(Date.now() / 1000) - 3600), 'whsec_x'), false);
});

test('checkout without Stripe configured explains itself', async () => {
  const res = await call(env(), '/checkout/pro-monthly');
  assert.equal(res.status, 503);
  assert.match(await res.text(), /kris@singhstudio\.co\.nz/);
});

test('paying, claiming a key, using it, then cancelling', async (t) => {
  const e = env({ STRIPE_SECRET_KEY: 'sk_test_x', STRIPE_WEBHOOK_SECRET: 'whsec_test' });
  const realFetch = globalThis.fetch;
  t.after(() => { globalThis.fetch = realFetch; });
  globalThis.fetch = async (url, init) => {
    const u = new URL(url);
    assert.equal(init.headers.Authorization, 'Bearer sk_test_x');
    if (u.pathname === '/v1/prices') return Response.json({ data: [{ id: 'price_123', lookup_key: u.searchParams.get('lookup_keys[]') }] });
    if (u.pathname === '/v1/checkout/sessions' && init.method === 'POST') {
      const body = new URLSearchParams(init.body);
      assert.equal(body.get('line_items[0][price]'), 'price_123');
      assert.equal(body.get('mode'), 'subscription');
      assert.match(body.get('success_url'), /\/claim\?session_id=\{CHECKOUT_SESSION_ID\}$/);
      return Response.json({ url: 'https://checkout.stripe.com/c/pay/cs_test_abc' });
    }
    if (u.pathname === '/v1/checkout/sessions/cs_test_abc') {
      return Response.json({ status: 'complete', payment_status: 'paid', mode: 'subscription', subscription: 'sub_1', customer: 'cus_1', customer_details: { email: 'a@b.nz' }, line_items: { data: [{ price: { lookup_key: 'duly_pro_monthly' } }] } });
    }
    if (u.pathname === '/v1/billing_portal/sessions') return Response.json({ url: 'https://billing.stripe.com/p/session/x' });
    throw new Error(`unexpected fetch ${url}`);
  };

  const go = await call(e, '/checkout/pro-monthly');
  assert.equal(go.status, 303);
  assert.equal(go.headers.get('location'), 'https://checkout.stripe.com/c/pay/cs_test_abc');

  const page = await call(e, '/claim?session_id=cs_test_abc');
  assert.equal(page.status, 200);
  const html = await page.text();
  const key = /duly_test_[A-Za-z0-9]+/.exec(html)[0];
  // Re-opening the page shows the same key; it is never minted twice.
  assert.match(await (await call(e, '/claim?session_id=cs_test_abc')).text(), new RegExp(key));

  const use = await call(e, '/v1/deadline?regime=oia&from=2026-10-21&days=20', { headers: { authorization: `Bearer ${key}` } });
  assert.equal(use.status, 200);
  assert.equal(use.headers.get('x-duly-plan'), 'pro');

  const portal = await call(e, '/billing', { method: 'POST', body: new URLSearchParams({ key }) });
  assert.equal(portal.status, 303);

  const payload = JSON.stringify({ type: 'customer.subscription.deleted', data: { object: { id: 'sub_1', status: 'canceled', items: { data: [{ price: { lookup_key: 'duly_pro_monthly' } }] } } } });
  const hook = await call(e, '/webhooks/stripe', { method: 'POST', headers: { 'stripe-signature': await sign(payload, 'whsec_test') }, body: payload });
  assert.equal(hook.status, 200);
  const rec = JSON.parse(e.KEYS.m.get(`key:${await sha256(key)}`));
  assert.equal(rec.status, 'inactive');

  const forged = await call(e, '/webhooks/stripe', { method: 'POST', headers: { 'stripe-signature': 't=1,v1=00' }, body: payload });
  assert.equal(forged.status, 400);
});
