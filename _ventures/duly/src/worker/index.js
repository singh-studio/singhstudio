// Duly on Cloudflare Workers: the static site (served straight from assets),
// plus the routes listed in wrangler.toml's run_worker_first.

import { toICS } from '../engine/ics.js';
import { RULES_VERIFIED } from '../engine/index.js';
import { billing, checkout, claim, sha256, webhook } from './billing.js';
import { CORS, HttpError, json, problem, readParams } from './http.js';
import { handleMcp } from './mcp.js';
import { OPS, runOp } from './ops.js';

const KEY_RE = /^duly_(live|test)_[A-Za-z0-9]{24,64}$/;
const BATCH_LIMIT = { free: 0, pro: 100, platform: 500 };
const keyCache = new Map(); // per-isolate, short-lived

function presentedKey(request, url) {
  const auth = request.headers.get('authorization') || '';
  if (auth.toLowerCase().startsWith('bearer ')) return auth.slice(7).trim();
  const header = request.headers.get('x-api-key');
  if (header) return header.trim();
  const m = /^\/mcp\/k\/([^/]+)$/.exec(url.pathname);
  return m ? decodeURIComponent(m[1]) : null;
}

// Who is calling, on which plan. Free callers are identified by IP.
export async function identify(request, env, url) {
  const key = presentedKey(request, url);
  if (!key) return { plan: 'free', id: request.headers.get('cf-connecting-ip') || 'anonymous' };
  if (!KEY_RE.test(key)) throw new HttpError(401, 'That does not look like a Duly API key');
  if (!env.KEYS) throw new HttpError(503, 'API keys are not enabled on this deployment yet');
  const hash = await sha256(key);
  const hit = keyCache.get(hash);
  let rec = hit && hit.until > Date.now() ? hit.rec : null;
  if (!rec) {
    rec = await env.KEYS.get(`key:${hash}`, 'json');
    keyCache.set(hash, { rec, until: Date.now() + 60_000 });
  }
  if (!rec) throw new HttpError(401, 'Unknown API key');
  if (rec.status !== 'active') throw new HttpError(402, 'The subscription for this key is not active. Manage it at /billing');
  return { plan: rec.plan, id: hash.slice(0, 24) };
}

async function rateLimit(env, who) {
  const limiter = env[`RL_${who.plan.toUpperCase()}`];
  if (!limiter) return;
  const { success } = await limiter.limit({ key: who.id });
  if (!success) {
    throw new HttpError(429, who.plan === 'free'
      ? 'Free tier limit reached (per minute). Add an API key for higher limits: /pricing/'
      : 'Rate limit reached for your plan; slow down for a minute.');
  }
}

function track(env, who, endpoint, regime) {
  try {
    env.USAGE?.writeDataPoint({ blobs: [who.plan, endpoint, regime || ''], doubles: [1], indexes: [who.plan === 'free' ? 'free' : who.id] });
  } catch { /* analytics must never break a request */ }
}

const ROUTES = {
  '/v1/regimes': 'regimes',
  '/v1/deadline': 'deadline',
  '/v1/count': 'count',
  '/v1/is-working-day': 'is-working-day',
  '/v1/calendar-days': 'calendar-days',
  '/v1/holidays': 'holidays',
};

async function api(request, env, url) {
  const who = await identify(request, env, url);
  await rateLimit(env, who);
  const headers = { 'X-Duly-Plan': who.plan };
  const path = url.pathname.replace(/\/+$/, '') || '/v1';

  if (path === '/v1') {
    return json({
      name: 'Duly API', docs: `${url.origin}/developers/`,
      endpoints: Object.keys(ROUTES).concat('/v1/regimes/{id}', '/v1/batch (POST, paid plans)'), mcp: `${url.origin}/mcp`,
    }, 200, headers);
  }
  const regimeMatch = /^\/v1\/regimes\/([a-z0-9-]+)$/.exec(path);
  if (regimeMatch) return json(runOp('regime', { id: regimeMatch[1] }), 200, headers);

  if (path === '/v1/batch') {
    if (request.method !== 'POST') throw new HttpError(405, 'POST a JSON array of {"op": …, …params}');
    const limit = BATCH_LIMIT[who.plan] || 0;
    if (!limit) throw new HttpError(402, 'Batch requests need a Pro or Platform key: /pricing/');
    const items = await readParams(request, url);
    const list = Array.isArray(items) ? items : items.requests;
    if (!Array.isArray(list)) throw new HttpError(400, 'Send a JSON array, or {"requests": [...]}');
    if (list.length > limit) throw new HttpError(413, `Your plan allows ${limit} items per batch`);
    const results = list.map((item) => {
      try { return { ok: true, result: runOp(item.op, item) }; } catch (e) { return { ok: false, error: e.message }; }
    });
    track(env, who, 'batch');
    return json({ results }, 200, headers);
  }

  const op = ROUTES[path];
  if (!op) throw new HttpError(404, `No such endpoint: ${path}. See ${url.origin}/developers/`);
  const params = await readParams(request, url);
  if (Array.isArray(params)) throw new HttpError(400, 'Send one JSON object (use /v1/batch for many)');
  const result = runOp(op, params);
  track(env, who, op, params.regime);

  if (op === 'holidays' && params.format === 'ics') {
    const events = result.national.map((h) => ({ uid: `${h.date}-${h.key}`, date: h.date, summary: h.name + (h.mondayised ? ' (observed)' : '') }))
      .concat(result.anniversary.map((a) => ({ uid: `${a.date}-${a.province}`, date: a.date, summary: a.name })));
    return new Response(toICS({ name: `NZ public holidays ${result.year}`, events, stamp: RULES_VERIFIED, domain: url.hostname }), {
      headers: { 'Content-Type': 'text/calendar; charset=utf-8', ...CORS, ...headers },
    });
  }
  return json(result, 200, headers);
}

async function mcp(request, env, url) {
  if (request.method === 'POST') {
    const who = await identify(request, env, url);
    await rateLimit(env, who);
    track(env, who, 'mcp');
  }
  return handleMcp(request);
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS });
    try {
      if (path === '/mcp' || path.startsWith('/mcp/')) return await mcp(request, env, url);
      if (path === '/v1' || path.startsWith('/v1/')) return await api(request, env, url);
      if (path.startsWith('/checkout/')) return await checkout(request, env, url);
      if (path === '/claim') return await claim(request, env, url);
      if (path === '/billing') return await billing(request, env, url);
      if (path === '/webhooks/stripe') return await webhook(request, env);
      return env.ASSETS ? env.ASSETS.fetch(request) : new Response('Not found', { status: 404 });
    } catch (e) {
      if (e instanceof HttpError) return problem(e.status, e.message);
      console.error(e);
      return problem(500, 'Something went wrong on our side. Please try again.');
    }
  },
};

export { OPS };
