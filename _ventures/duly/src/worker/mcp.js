// A stateless MCP server (Streamable HTTP transport, JSON responses). Any MCP
// client — Claude, ChatGPT connectors, Cursor, agents — can call Duly's tools
// at https://<host>/mcp. No sessions, no SSE: each POST is answered directly.

import { PROVINCE_IDS, REGIMES, REGIME_IDS, ENGINE_VERSION } from '../engine/index.js';
import { runOp } from './ops.js';
import { CORS, HttpError } from './http.js';

const PROTOCOL_VERSIONS = ['2025-11-25', '2025-06-18', '2025-03-26', '2024-11-05'];

const date = { type: 'string', pattern: '^\\d{4}-\\d{2}-\\d{2}$', description: 'Calendar date, YYYY-MM-DD (2023-01-01 to 2052-12-31)' };
const regime = {
  type: 'string',
  enum: REGIME_IDS,
  description: 'Which definition of "working day" applies. '
    + REGIMES.map((r) => `${r.id} = ${r.short}`).join('; '),
};
const province = {
  type: 'string',
  enum: PROVINCE_IDS,
  description: 'Provincial anniversary day to exclude, for regimes that depend on where the property, premises or site is (Duly says when it is required).',
};
const READ_ONLY = { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false };

export const TOOLS = [
  {
    name: 'nz_deadline',
    title: 'NZ statutory deadline',
    description: 'Work out the date that is N working days after (or before) a date under a specific New Zealand Act or standard contract. '
      + 'Use this for any NZ timeframe stated in working days: Official Information Act and LGOIMA requests, Privacy Act requests, '
      + 'resource and building consents, tenancy notices, sale and purchase agreement conditions, construction payment schedules, '
      + 'court filings, company and tax deadlines. Each Act defines "working day" differently (the OIA skips 25 Dec–15 Jan, the RMA '
      + '20 Dec–10 Jan, some include provincial anniversary days), so do not count by hand. Returns the date, every skipped day with '
      + 'its reason, and the citation. Day 1 is the first working day after the start date unless start_rule is "on".',
    inputSchema: {
      type: 'object',
      properties: {
        regime,
        from: { ...date, description: 'The trigger date, e.g. the day a request was received or a notice was served' },
        days: { type: 'integer', minimum: 0, maximum: 2000, description: 'Number of working days' },
        direction: { type: 'string', enum: ['after', 'before'], default: 'after' },
        start_rule: { type: 'string', enum: ['after', 'on'], default: 'after', description: '"after": day 1 is the next working day (statutory default). "on": the start date counts as day 1.' },
        province,
      },
      required: ['regime', 'from', 'days'],
      additionalProperties: false,
    },
    annotations: { title: 'NZ statutory deadline', ...READ_ONLY },
    op: 'deadline',
  },
  {
    name: 'nz_count_working_days',
    title: 'Count NZ working days',
    description: 'Count the working days after one date up to and including another, under a specific New Zealand definition of "working day". '
      + 'Use it to check how much of a statutory period has elapsed or whether a response was on time.',
    inputSchema: {
      type: 'object',
      properties: { regime, from: date, to: date, province },
      required: ['regime', 'from', 'to'],
      additionalProperties: false,
    },
    annotations: { title: 'Count NZ working days', ...READ_ONLY },
    op: 'count',
  },
  {
    name: 'nz_is_working_day',
    title: 'Is it an NZ working day?',
    description: 'Say whether a date is a working day under a specific New Zealand definition, and if not, why (weekend, which public holiday, the Christmas period, or an anniversary day).',
    inputSchema: {
      type: 'object',
      properties: { regime, date, province },
      required: ['regime', 'date'],
      additionalProperties: false,
    },
    annotations: { title: 'Is it an NZ working day?', ...READ_ONLY },
    op: 'is-working-day',
  },
  {
    name: 'nz_calendar_deadline',
    title: 'NZ calendar-day deadline',
    description: 'Add calendar days to a date (e.g. 42 or 90 days for tenancy notices, 60 days for a rent increase, 90 days to raise a personal grievance) and optionally move the answer to the next working day (Legislation Act s 55, IRD due dates) or the previous one (sale and purchase agreement cl 1.3(1)) if it is not a working day under the chosen regime. Use start_rule "on" for periods "beginning with" a day.',
    inputSchema: {
      type: 'object',
      properties: {
        from: date,
        days: { type: 'integer', minimum: 0, maximum: 2000 },
        roll: { type: 'string', enum: ['none', 'next', 'previous'], default: 'none' },
        start_rule: { type: 'string', enum: ['after', 'on'], default: 'after', description: '"on" for periods beginning with the start date (it counts as day 1)' },
        regime: { ...regime, description: 'Definition used to decide whether the answer is a working day (default legislation-act)' },
        province,
      },
      required: ['from', 'days'],
      additionalProperties: false,
    },
    annotations: { title: 'NZ calendar-day deadline', ...READ_ONLY },
    op: 'calendar-days',
  },
  {
    name: 'nz_public_holidays',
    title: 'NZ public holidays',
    description: 'List New Zealand public holidays for a year (2010–2052), including Mondayised observances, Matariki, and provincial anniversary days with the rule each follows.',
    inputSchema: {
      type: 'object',
      properties: { year: { type: 'integer', minimum: 2010, maximum: 2052 }, province },
      required: ['year'],
      additionalProperties: false,
    },
    annotations: { title: 'NZ public holidays', ...READ_ONLY },
    op: 'holidays',
  },
  {
    name: 'nz_working_day_definitions',
    title: 'NZ working-day definitions',
    description: 'List every definition of "working day" Duly supports, with its statute and section, what it excludes, and common timeframes. Call this first if unsure which regime applies.',
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
    annotations: { title: 'NZ working-day definitions', ...READ_ONLY },
    op: 'regimes',
  },
];

const BY_NAME = Object.fromEntries(TOOLS.map((t) => [t.name, t]));

const INSTRUCTIONS = 'Duly answers New Zealand date questions that depend on statutory definitions of "working day". '
  + 'Prefer nz_deadline over counting days yourself. Quote the returned summary and citation, mention any notes, '
  + 'and remind the user to check the timeframe section of the Act for their situation. Duly is not legal advice.';

function rpcResult(id, result) { return { jsonrpc: '2.0', id, result }; }
function rpcError(id, code, message) { return { jsonrpc: '2.0', id: id ?? null, error: { code, message } }; }

function toolText(name, out) {
  if (name === 'nz_working_day_definitions') {
    return out.regimes.map((r) => `${r.id}: ${r.short} — ${r.title} (${r.citation}). Excludes ${r.rules}.`).join('\n');
  }
  if (name === 'nz_public_holidays') {
    const lines = out.national.map((h) => `${h.date} ${h.name}${h.mondayised ? ` (observed; actual ${h.actual})` : ''}`);
    const anniv = out.anniversary.map((a) => `${a.date} ${a.name} — ${a.rule}`);
    return `New Zealand public holidays ${out.year}:\n${lines.join('\n')}\nProvincial anniversary days:\n${anniv.join('\n')}`;
  }
  const notes = [...(out.countingNotes || []), ...(out.notes || [])];
  return `${out.summary}${notes.length ? `\nNotes: ${notes.join(' ')}` : ''}\nSource: ${out.regime.citation} ${out.regime.url}\nComputed by Duly ${out.engine.version} (rules verified ${out.engine.rulesVerified}). Not legal advice.`;
}

export function handleRpc(msg) {
  if (!msg || msg.jsonrpc !== '2.0' || typeof msg.method !== 'string') return rpcError(msg?.id, -32600, 'Invalid Request');
  const { id, method, params } = msg;
  const isNotification = id === undefined;
  switch (method) {
    case 'initialize': {
      const asked = params?.protocolVersion;
      const protocolVersion = PROTOCOL_VERSIONS.includes(asked) ? asked : PROTOCOL_VERSIONS[0];
      return rpcResult(id, {
        protocolVersion,
        capabilities: { tools: { listChanged: false } },
        serverInfo: { name: 'duly', title: 'Duly: New Zealand statutory deadlines', version: ENGINE_VERSION },
        instructions: INSTRUCTIONS,
      });
    }
    case 'ping':
      return isNotification ? null : rpcResult(id, {});
    case 'tools/list':
      return rpcResult(id, { tools: TOOLS.map(({ op, ...t }) => t) });
    case 'tools/call': {
      const tool = BY_NAME[params?.name];
      if (!tool) return rpcError(id, -32602, `Unknown tool: ${params?.name}`);
      try {
        const out = runOp(tool.op, params.arguments || {});
        if (out.trace === undefined) delete out.trace;
        return rpcResult(id, { content: [{ type: 'text', text: toolText(tool.name, out) }], structuredContent: out, isError: false });
      } catch (e) {
        if (e instanceof HttpError) return rpcResult(id, { content: [{ type: 'text', text: e.message }], isError: true });
        throw e;
      }
    }
    default:
      if (isNotification) return null; // notifications/initialized, cancelled, etc.
      return rpcError(id, -32601, `Method not found: ${method}`);
  }
}

export async function handleMcp(request) {
  if (request.method === 'GET' || request.method === 'DELETE') {
    // No server-initiated stream and no sessions to end.
    return new Response(null, { status: 405, headers: { Allow: 'POST, OPTIONS', ...CORS } });
  }
  if (request.method !== 'POST') return new Response(null, { status: 405, headers: CORS });
  let body;
  try { body = await request.json(); } catch {
    return Response.json(rpcError(null, -32700, 'Parse error'), { status: 400, headers: CORS });
  }
  const batch = Array.isArray(body);
  const replies = (batch ? body : [body]).map(handleRpc).filter(Boolean);
  if (!replies.length) return new Response(null, { status: 202, headers: CORS });
  return new Response(JSON.stringify(batch ? replies : replies[0]), {
    status: 200,
    headers: { 'Content-Type': 'application/json', ...CORS },
  });
}
