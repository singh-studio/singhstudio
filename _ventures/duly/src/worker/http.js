// Small HTTP helpers shared by the API, MCP and billing routes.

export const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Authorization, Content-Type, X-Api-Key, Mcp-Session-Id, MCP-Protocol-Version',
  'Access-Control-Expose-Headers': 'X-Duly-Plan, Mcp-Session-Id',
  'Access-Control-Max-Age': '86400',
};

export function json(body, status = 200, headers = {}) {
  return new Response(JSON.stringify(body, null, 2), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...CORS, ...headers },
  });
}

export function problem(status, message, extra = {}) {
  return json({ error: { status, message, ...extra } }, status);
}

export function html(body, status = 200) {
  return new Response(body, {
    status,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Robots-Tag': 'noindex',
      'Referrer-Policy': 'no-referrer',
    },
  });
}

export function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

// A bare page in the site's look for the few server-rendered screens
// (key claimed, billing, errors). The stylesheet comes from the static assets.
export function page(title, body) {
  return `<!doctype html><html lang="en-NZ"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escapeHtml(title)} · Duly</title>
<meta name="robots" content="noindex">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="stylesheet" href="/assets/duly.css">
</head><body class="plain"><header class="bar"><a class="brand" href="/">Duly<span class="brand-dot">.</span></a></header>
<main class="wrap narrow">${body}</main></body></html>`;
}

export async function readParams(request, url) {
  const params = Object.fromEntries(url.searchParams);
  if (request.method === 'POST') {
    const type = request.headers.get('content-type') || '';
    if (type.includes('application/json')) {
      let body;
      try { body = await request.json(); } catch { throw new HttpError(400, 'Body is not valid JSON'); }
      if (body && typeof body === 'object' && !Array.isArray(body)) Object.assign(params, body);
      else if (Array.isArray(body)) return body;
    } else if (type.includes('form')) {
      Object.assign(params, Object.fromEntries(await request.formData()));
    }
  }
  return params;
}

export class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}
