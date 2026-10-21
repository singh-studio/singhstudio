// Minimal RFC 5545 calendar writer for all-day events (holiday feeds and
// "add this deadline to my calendar").

import { addDays } from './dates.js';

function escapeText(s) {
  return String(s).replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/([,;])/g, '\\$1');
}

// Fold lines longer than 75 octets, as the spec requires.
function fold(line) {
  const bytes = new TextEncoder().encode(line);
  if (bytes.length <= 75) return line;
  const out = [];
  let current = '';
  let size = 0;
  for (const ch of line) {
    const n = new TextEncoder().encode(ch).length;
    if (size + n > (out.length ? 74 : 75)) {
      out.push(current);
      current = '';
      size = 0;
    }
    current += ch;
    size += n;
  }
  out.push(current);
  return out.join('\r\n ');
}

const compact = (iso) => iso.replace(/-/g, '');

// events: [{ uid, date: 'YYYY-MM-DD', summary, description?, url? }]
export function toICS({ name, description, events, stamp, domain = 'duly.nz', refreshDays }) {
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    `PRODID:-//Duly//${domain}//EN`,
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:${escapeText(name)}`,
    'X-WR-TIMEZONE:Pacific/Auckland',
  ];
  if (description) lines.push(`X-WR-CALDESC:${escapeText(description)}`);
  if (refreshDays) lines.push(`REFRESH-INTERVAL;VALUE=DURATION:P${refreshDays}D`, `X-PUBLISHED-TTL:P${refreshDays}D`);
  const dtstamp = `${compact(stamp)}T000000Z`;
  for (const e of events) {
    lines.push(
      'BEGIN:VEVENT',
      `UID:${e.uid}@${domain}`,
      `DTSTAMP:${dtstamp}`,
      `DTSTART;VALUE=DATE:${compact(e.date)}`,
      `DTEND;VALUE=DATE:${compact(addDays(e.date, 1))}`,
      `SUMMARY:${escapeText(e.summary)}`,
    );
    if (e.description) lines.push(`DESCRIPTION:${escapeText(e.description)}`);
    if (e.url) lines.push(`URL:${e.url}`);
    lines.push('TRANSP:TRANSPARENT', 'END:VEVENT');
  }
  lines.push('END:VCALENDAR');
  return lines.map(fold).join('\r\n') + '\r\n';
}
