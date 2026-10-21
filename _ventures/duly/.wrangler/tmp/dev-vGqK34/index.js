var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// src/engine/dates.js
var ISO_RE = /^(\d{4})-(\d{2})-(\d{2})$/;
var DAY_MS = 864e5;
var WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
var MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December"
];
function isISODate(s) {
  if (typeof s !== "string") return false;
  const m = ISO_RE.exec(s);
  if (!m) return false;
  const y = +m[1], mo = +m[2], d = +m[3];
  if (mo < 1 || mo > 12 || d < 1) return false;
  return d <= daysInMonth(y, mo);
}
__name(isISODate, "isISODate");
function assertISODate(s, label = "date") {
  if (!isISODate(s)) throw new RangeError(`${label} must be a real calendar date written YYYY-MM-DD (got ${JSON.stringify(s)})`);
  return s;
}
__name(assertISODate, "assertISODate");
function daysInMonth(y, m) {
  return new Date(Date.UTC(y, m, 0)).getUTCDate();
}
__name(daysInMonth, "daysInMonth");
function toDayNumber(iso) {
  const [y, m, d] = iso.split("-").map(Number);
  return Math.round(Date.UTC(y, m - 1, d) / DAY_MS);
}
__name(toDayNumber, "toDayNumber");
function fromDayNumber(n) {
  return new Date(n * DAY_MS).toISOString().slice(0, 10);
}
__name(fromDayNumber, "fromDayNumber");
function ymd(y, m, d) {
  return `${String(y).padStart(4, "0")}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}
__name(ymd, "ymd");
function addDays(iso, n) {
  return fromDayNumber(toDayNumber(iso) + n);
}
__name(addDays, "addDays");
function diffDays(a, b) {
  return toDayNumber(b) - toDayNumber(a);
}
__name(diffDays, "diffDays");
function weekday(iso) {
  return (toDayNumber(iso) % 7 + 7 + 4) % 7;
}
__name(weekday, "weekday");
function yearOf(iso) {
  return +iso.slice(0, 4);
}
__name(yearOf, "yearOf");
function isWeekend(iso) {
  const w = weekday(iso);
  return w === 0 || w === 6;
}
__name(isWeekend, "isWeekend");
function nthWeekday(y, m, dow, n) {
  if (n > 0) {
    const first = ymd(y, m, 1);
    const offset = (dow - weekday(first) + 7) % 7;
    return addDays(first, offset + (n - 1) * 7);
  }
  const last = ymd(y, m, daysInMonth(y, m));
  return addDays(last, -((weekday(last) - dow + 7) % 7));
}
__name(nthWeekday, "nthWeekday");
function nearestMonday(iso) {
  const w = weekday(iso);
  const back = (w + 6) % 7;
  return back <= 3 ? addDays(iso, -back) : addDays(iso, 7 - back);
}
__name(nearestMonday, "nearestMonday");
function formatLong(iso) {
  const [y, m, d] = iso.split("-").map(Number);
  return `${WEEKDAYS[weekday(iso)]} ${d} ${MONTHS[m - 1]} ${y}`;
}
__name(formatLong, "formatLong");
function formatShort(iso) {
  const [y, m, d] = iso.split("-").map(Number);
  return `${WEEKDAYS[weekday(iso)].slice(0, 3)} ${d} ${MONTHS[m - 1].slice(0, 3)} ${y}`;
}
__name(formatShort, "formatShort");
function formatMonthDay(md) {
  const [m, d] = md.split("-").map(Number);
  return `${d} ${MONTHS[m - 1]}`;
}
__name(formatMonthDay, "formatMonthDay");

// src/engine/ics.js
function escapeText(s) {
  return String(s).replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/([,;])/g, "\\$1");
}
__name(escapeText, "escapeText");
function fold(line) {
  const bytes = new TextEncoder().encode(line);
  if (bytes.length <= 75) return line;
  const out = [];
  let current = "";
  let size = 0;
  for (const ch of line) {
    const n = new TextEncoder().encode(ch).length;
    if (size + n > (out.length ? 74 : 75)) {
      out.push(current);
      current = "";
      size = 0;
    }
    current += ch;
    size += n;
  }
  out.push(current);
  return out.join("\r\n ");
}
__name(fold, "fold");
var compact = /* @__PURE__ */ __name((iso) => iso.replace(/-/g, ""), "compact");
function toICS({ name, description, events, stamp, domain = "duly.nz", refreshDays }) {
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    `PRODID:-//Duly//${domain}//EN`,
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    `X-WR-CALNAME:${escapeText(name)}`,
    "X-WR-TIMEZONE:Pacific/Auckland"
  ];
  if (description) lines.push(`X-WR-CALDESC:${escapeText(description)}`);
  if (refreshDays) lines.push(`REFRESH-INTERVAL;VALUE=DURATION:P${refreshDays}D`, `X-PUBLISHED-TTL:P${refreshDays}D`);
  const dtstamp = `${compact(stamp)}T000000Z`;
  for (const e of events) {
    lines.push(
      "BEGIN:VEVENT",
      `UID:${e.uid}@${domain}`,
      `DTSTAMP:${dtstamp}`,
      `DTSTART;VALUE=DATE:${compact(e.date)}`,
      `DTEND;VALUE=DATE:${compact(addDays(e.date, 1))}`,
      `SUMMARY:${escapeText(e.summary)}`
    );
    if (e.description) lines.push(`DESCRIPTION:${escapeText(e.description)}`);
    if (e.url) lines.push(`URL:${e.url}`);
    lines.push("TRANSP:TRANSPARENT", "END:VEVENT");
  }
  lines.push("END:VCALENDAR");
  return lines.map(fold).join("\r\n") + "\r\n";
}
__name(toICS, "toICS");

// src/engine/holidays.js
var FIRST_YEAR = 2010;
var LAST_YEAR = 2052;
var MATARIKI = {
  2022: "06-24",
  2023: "07-14",
  2024: "06-28",
  2025: "06-20",
  2026: "07-10",
  2027: "06-25",
  2028: "07-14",
  2029: "07-06",
  2030: "06-21",
  2031: "07-11",
  2032: "07-02",
  2033: "06-24",
  2034: "07-07",
  2035: "06-29",
  2036: "07-18",
  2037: "07-10",
  2038: "06-25",
  2039: "07-15",
  2040: "07-06",
  2041: "07-19",
  2042: "07-11",
  2043: "07-03",
  2044: "06-24",
  2045: "07-07",
  2046: "06-29",
  2047: "07-19",
  2048: "07-03",
  2049: "06-25",
  2050: "07-15",
  2051: "06-30",
  2052: "06-21"
};
var WAITANGI_ANZAC_MONDAYISED_FROM = 2014;
function checkYear(year) {
  if (!Number.isInteger(year) || year < FIRST_YEAR || year > LAST_YEAR) {
    throw new RangeError(`Duly covers ${FIRST_YEAR}\u2013${LAST_YEAR}; Matariki dates after ${LAST_YEAR} are not yet set in law (got ${year})`);
  }
}
__name(checkYear, "checkYear");
function easterSunday(year) {
  const a = year % 19, b = Math.floor(year / 100), c = year % 100;
  const d = Math.floor(b / 4), e = b % 4, f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3), h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4), k = c % 4, l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = (h + l - 7 * m + 114) % 31 + 1;
  return ymd(year, month, day);
}
__name(easterSunday, "easterSunday");
function sovereignName(year) {
  return year >= 2023 ? "King's Birthday" : "Queen's Birthday";
}
__name(sovereignName, "sovereignName");
function nationalHolidays(year) {
  checkYear(year);
  const out = [];
  const add = /* @__PURE__ */ __name((key, name, date2, mondayised = false, actual = date2) => out.push({ key, name, date: date2, mondayised, actual }), "add");
  const ny = ymd(year, 1, 1), ny2 = ymd(year, 1, 2);
  add("new-year", "New Year's Day", ny);
  add("day-after-new-year", "Day after New Year's Day", ny2);
  const nyDow = weekday(ny);
  if (nyDow === 5) add("day-after-new-year", "Day after New Year's Day", ymd(year, 1, 4), true, ny2);
  if (nyDow === 6) {
    add("new-year", "New Year's Day", ymd(year, 1, 3), true, ny);
    add("day-after-new-year", "Day after New Year's Day", ymd(year, 1, 4), true, ny2);
  }
  if (nyDow === 0) add("new-year", "New Year's Day", ymd(year, 1, 3), true, ny);
  const waitangi = ymd(year, 2, 6);
  add("waitangi", "Waitangi Day", waitangi);
  if (year >= WAITANGI_ANZAC_MONDAYISED_FROM && [0, 6].includes(weekday(waitangi))) {
    add("waitangi", "Waitangi Day", addDays(waitangi, weekday(waitangi) === 6 ? 2 : 1), true, waitangi);
  }
  const easter = easterSunday(year);
  add("good-friday", "Good Friday", addDays(easter, -2));
  add("easter-monday", "Easter Monday", addDays(easter, 1));
  const anzac = ymd(year, 4, 25);
  add("anzac", "Anzac Day", anzac);
  if (year >= WAITANGI_ANZAC_MONDAYISED_FROM && [0, 6].includes(weekday(anzac))) {
    add("anzac", "Anzac Day", addDays(anzac, weekday(anzac) === 6 ? 2 : 1), true, anzac);
  }
  add("sovereign", sovereignName(year), nthWeekday(year, 6, 1, 1));
  if (MATARIKI[year]) add("matariki", "Matariki", `${year}-${MATARIKI[year]}`);
  add("labour", "Labour Day", nthWeekday(year, 10, 1, 4));
  if (year === 2022) add("qe2-memorial", "Queen Elizabeth II Memorial Day", "2022-09-26");
  const xmas = ymd(year, 12, 25), boxing = ymd(year, 12, 26);
  add("christmas", "Christmas Day", xmas);
  add("boxing", "Boxing Day", boxing);
  const xDow = weekday(xmas);
  if (xDow === 5) add("boxing", "Boxing Day", ymd(year, 12, 28), true, boxing);
  if (xDow === 6) {
    add("christmas", "Christmas Day", ymd(year, 12, 27), true, xmas);
    add("boxing", "Boxing Day", ymd(year, 12, 28), true, boxing);
  }
  if (xDow === 0) add("christmas", "Christmas Day", ymd(year, 12, 27), true, xmas);
  return out.sort((a, b) => a.date < b.date ? -1 : a.date > b.date ? 1 : 0);
}
__name(nationalHolidays, "nationalHolidays");
var PROVINCES = [
  {
    id: "wellington",
    name: "Wellington",
    actual: "22 January",
    rule: "Monday nearest 22 January",
    areas: "Wellington, Wairarapa, Manawat\u016B, Whanganui"
  },
  {
    id: "auckland",
    name: "Auckland",
    actual: "29 January",
    rule: "Monday nearest 29 January",
    areas: "Auckland, Northland, Waikato, Coromandel, Bay of Plenty, Gisborne"
  },
  {
    id: "nelson",
    name: "Nelson",
    actual: "1 February",
    rule: "Monday nearest 1 February",
    areas: "Nelson, Tasman, Buller"
  },
  {
    id: "taranaki",
    name: "Taranaki",
    actual: "31 March",
    rule: "Second Monday in March (moved to avoid Easter)",
    areas: "Taranaki"
  },
  {
    id: "otago",
    name: "Otago",
    actual: "23 March",
    rule: "Monday nearest 23 March (Tuesday if that is Easter Monday)",
    areas: "Otago, Dunedin, Queenstown, Central Otago",
    note: "MBIE notes there is no single agreed day of observance across Otago; employment agreements and local custom can differ."
  },
  {
    id: "southland",
    name: "Southland",
    actual: "17 January",
    rule: "Easter Tuesday",
    areas: "Southland, Invercargill, Gore, Fiordland"
  },
  {
    id: "south-canterbury",
    name: "South Canterbury",
    actual: "16 December",
    rule: "Fourth Monday in September (Dominion Day)",
    areas: "Timaru, Mackenzie, Waimate"
  },
  {
    id: "hawkes-bay",
    name: "Hawke's Bay",
    actual: "1 November",
    rule: "Friday before Labour Day",
    areas: "Napier, Hastings, Central Hawke's Bay"
  },
  {
    id: "marlborough",
    name: "Marlborough",
    actual: "1 November",
    rule: "First Monday after Labour Day",
    areas: "Marlborough, Blenheim, Picton"
  },
  {
    id: "canterbury",
    name: "Canterbury",
    actual: "16 December",
    rule: "Christchurch Show Day: second Friday after the first Tuesday in November",
    areas: "Christchurch, North and Central Canterbury, Ashburton"
  },
  {
    id: "chatham-islands",
    name: "Chatham Islands",
    actual: "30 November",
    rule: "Monday nearest 30 November",
    areas: "Chatham Islands"
  },
  {
    id: "westland",
    name: "Westland",
    actual: "1 December",
    rule: "Monday nearest 1 December (as observed in Greymouth)",
    areas: "Westland, Greymouth, Hokitika",
    note: "Observance varies across Westland; Greymouth keeps the official day."
  }
];
var PROVINCE_IDS = PROVINCES.map((p) => p.id);
var BY_ID = Object.fromEntries(PROVINCES.map((p) => [p.id, p]));
function getProvince(id) {
  const p = BY_ID[id];
  if (!p) throw new RangeError(`Unknown province ${JSON.stringify(id)}. Use one of: ${PROVINCE_IDS.join(", ")}`);
  return p;
}
__name(getProvince, "getProvince");
var EXCEPTIONS = {
  "south-canterbury": {
    // 26 Sep 2022 became Queen Elizabeth II Memorial Day, so the three South
    // Canterbury councils moved the anniversary. (MBIE's table still shows 26 Sep.)
    2022: { date: "2022-11-11", source: "Timaru, Mackenzie and Waimate district councils (Stuff, 20 Sep 2022)" }
  }
};
function anniversaryDay(provinceId, year) {
  checkYear(year);
  const p = getProvince(provinceId);
  const exception = EXCEPTIONS[provinceId]?.[year];
  if (exception) return { ...base(p), date: exception.date, exception: exception.source };
  let date2;
  switch (provinceId) {
    case "wellington":
      date2 = nearestMonday(ymd(year, 1, 22));
      break;
    case "auckland":
      date2 = nearestMonday(ymd(year, 1, 29));
      break;
    case "nelson":
      date2 = nearestMonday(ymd(year, 2, 1));
      break;
    case "taranaki":
      date2 = nthWeekday(year, 3, 1, 2);
      break;
    case "otago": {
      date2 = nearestMonday(ymd(year, 3, 23));
      const easterMonday = addDays(easterSunday(year), 1);
      if (date2 === easterMonday) date2 = addDays(easterMonday, 1);
      break;
    }
    case "southland":
      date2 = year >= 2012 ? addDays(easterSunday(year), 2) : nearestMonday(ymd(year, 1, 17));
      break;
    case "south-canterbury":
      date2 = nthWeekday(year, 9, 1, 4);
      break;
    case "hawkes-bay":
      date2 = addDays(nthWeekday(year, 10, 1, 4), -3);
      break;
    case "marlborough":
      date2 = addDays(nthWeekday(year, 10, 1, 4), 7);
      break;
    case "canterbury": {
      const firstTuesday = nthWeekday(year, 11, 2, 1);
      date2 = addDays(firstTuesday, 3 + 7);
      break;
    }
    case "chatham-islands":
      date2 = nearestMonday(ymd(year, 11, 30));
      break;
    case "westland":
      date2 = nearestMonday(ymd(year, 12, 1));
      break;
  }
  return { ...base(p), date: date2 };
}
__name(anniversaryDay, "anniversaryDay");
function base(p) {
  return { key: `anniversary:${p.id}`, province: p.id, name: `${p.name} Anniversary Day`, rule: p.rule, ...p.note ? { note: p.note } : {} };
}
__name(base, "base");

// src/engine/definitions.js
var DEFINITIONS = {
  "oia": "\u201CWorking day\u201D means any day of the week other than\u2014 (a) a Saturday, a Sunday, Waitangi Day, Good Friday, Easter Monday, Anzac Day, the Sovereign's birthday, Te R\u0101 Aro ki a Matariki/Matariki Observance Day, and Labour Day; and (ab) if Waitangi Day or Anzac Day falls on a Saturday or a Sunday, the following Monday; and (b) a day in the period commencing with 25 December in any year and ending with 15 January in the following year.",
  "lgoima": "\u201CWorking day\u201D means any day of the week other than\u2014 (a) a Saturday, a Sunday, Waitangi Day, Good Friday, Easter Monday, Anzac Day, the Sovereign's birthday, Te R\u0101 Aro ki a Matariki/Matariki Observance Day, and Labour Day; and (ab) if Waitangi Day or Anzac Day falls on a Saturday or a Sunday, the following Monday; and (b) the day observed in the appropriate area as the anniversary of the province of which the area forms a part; and (c) a day in the period commencing with 20 December in any year and ending with 10 January in the following year.",
  "privacy": "\u201CWorking day\u201D means any day of the week other than\u2014 (a) a Saturday, a Sunday, Waitangi Day, Good Friday, Easter Monday, Anzac Day, the Sovereign's birthday, Te R\u0101 Aro ki a Matariki/Matariki Observance Day, or Labour Day; or (b) if Waitangi Day or Anzac Day falls on a Saturday or a Sunday, the following Monday; or (c) a day in the period commencing on 25 December in one year and ending with 15 January in the next year.",
  "rma": "\u201CWorking day\u201D means a day of the week other than\u2014 (a) a Saturday, a Sunday, Waitangi Day, Good Friday, Easter Monday, Anzac Day, the Sovereign's birthday, Te R\u0101 Aro ki a Matariki/Matariki Observance Day, and Labour Day; and (b) if Waitangi Day or Anzac Day falls on a Saturday or a Sunday, the following Monday; and (c) a day in the period commencing on 20 December in any year and ending with 10 January in the following year.",
  "building": "\u201CWorking day\u201D means any day except\u2014 (a) a Saturday, a Sunday, Waitangi Day, Good Friday, Easter Monday, Anzac Day, the Sovereign's birthday, Te R\u0101 Aro ki a Matariki/Matariki Observance Day, and Labour Day; and (ab) if Waitangi Day or Anzac Day falls on a Saturday or a Sunday, the following Monday; and (b) the day observed in the appropriate area as the anniversary of the province of which the area forms a part; and (c) a day in the period beginning on 20 December in any year and ending with the close of 10 January in the following year.",
  "rta": "\u201CWorking day\u201D means any day other than\u2014 (a) a Saturday, a Sunday, Waitangi Day, Anzac Day, the Sovereign's birthday, Te R\u0101 Aro ki a Matariki/Matariki Observance Day, and Labour Day; and (b) if Waitangi Day or Anzac Day falls on a Saturday or a Sunday, the following Monday; and (c) the day observed in the appropriate area as the anniversary of the province of which the area forms part; and (d) a day in the period commencing with Good Friday and expiring with the Tuesday after Easter; and (e) a day in the period commencing with 24 December and expiring with 3 January.",
  "cca": "\u201CWorking day\u201D means a day of the week (irrespective of whether or not work is actually carried out on that day) other than\u2014 (a) a Saturday, a Sunday, Waitangi Day, Good Friday, Easter Monday, Anzac Day, the Sovereign's birthday, Te R\u0101 Aro ki a Matariki/Matariki Observance Day, and Labour Day; and (ab) if Waitangi Day or Anzac Day falls on a Saturday or a Sunday, the following Monday; and (b) the day observed in the appropriate area as the anniversary of the province of which the area forms a part; and (c) for the purposes of sections 18, 22, 24A, 33, 35 to 37A, 46, 47, 59, and 66, a day in the period commencing on 24 December in any year and ending with the close of 5 January in the following year; and (d) for the purposes of sections 71B, 74, and 75, a day in the period commencing on 25 December in any year and ending with the close of 15 January in the following year.",
  "pla": "\u201CWorking day\u201D means a day of the week other than\u2014 (a) a Saturday, a Sunday, Waitangi Day, Good Friday, Easter Monday, Anzac Day, the Sovereign's birthday, Te R\u0101 Aro ki a Matariki/Matariki Observance Day, and Labour Day; and (ab) if Waitangi Day or Anzac Day falls on a Saturday or a Sunday, the following Monday; and (b) a day in the period commencing with 25 December and ending with 2 January in the following year; and (c) the day observed as the anniversary of any province in which an act is to be done.",
  "lta": "\u201CWorking day\u201D means a day of the week other than\u2014 (a) a Saturday, a Sunday, Waitangi Day, Good Friday, Easter Monday, Anzac Day, the Sovereign's birthday, Te R\u0101 Aro ki a Matariki/Matariki Observance Day, and Labour Day; and (b) a day in the period commencing on 25 December and ending on 2 January in the following year; and (c) if 1 January falls on a Friday, the following Monday; and (d) if 1 January falls on a Saturday or a Sunday, the following Monday and Tuesday; and (e) if Waitangi Day or Anzac Day falls on a Saturday or a Sunday, the following Monday.",
  "companies": "\u201CWorking day\u201D means a day of the week other than\u2014 (a) a Saturday, a Sunday, Waitangi Day, Good Friday, Easter Monday, Anzac Day, the Sovereign's birthday, Te R\u0101 Aro ki a Matariki/Matariki Observance Day, and Labour Day; and (ab) if Waitangi Day or Anzac Day falls on a Saturday or a Sunday, the following Monday; and (b) a day in the period commencing with 25 December in any year and ending with 2 January in the following year; and (c) if 1 January in any year falls on a Friday, the following Monday; and (d) if 1 January in any year falls on a Saturday or a Sunday, the following Monday and Tuesday.",
  "legislation-act": "\u201CWorking day\u201D means a day of a week other than\u2014 (a) a Saturday, a Sunday, Waitangi Day, Good Friday, Easter Monday, Anzac Day, the Sovereign's birthday, Te R\u0101 Aro ki a Matariki/Matariki Observance Day, and Labour Day; and (b) a day in the period commencing with 25 December in a year and ending with 2 January in the following year; and (c) if 1 January falls on a Friday, the following Monday; and (d) if 1 January falls on a Saturday or a Sunday, the following Monday and Tuesday; and (e) if Waitangi Day or Anzac Day falls on a Saturday or a Sunday, the following Monday.",
  "tax-acts": "\u201CWorking day\u201D means any day of the week other than\u2014 (a) a Saturday, a Sunday, Waitangi Day, Good Friday, Easter Monday, Anzac Day, the Sovereign's birthday, Te R\u0101 Aro ki a Matariki/Matariki Observance Day, and Labour Day; and (ab) if Waitangi Day or Anzac Day falls on a Saturday or a Sunday, the following Monday; and (b) a day in the period starting on 25 December in a year and ending on 15 January (both dates inclusive) in the following year.",
  "ppsa": "\u201CWorking day\u201D means a day of the week other than\u2014 (a) a Saturday, a Sunday, Waitangi Day, Good Friday, Easter Monday, Anzac Day, the Sovereign's birthday, Te R\u0101 Aro ki a Matariki/Matariki Observance Day, and Labour Day; and (ab) if Waitangi Day or Anzac Day falls on a Saturday or a Sunday, the following Monday; and (b) a day in the period commencing on 25 December in any year and,\u2014 (i) except in sections 165, 167A, 168, and 178, ending with 2 January in the following year; and (ii) in sections 165, 167A, 168, and 178, ending with 15 January in the following year.",
  "senior-courts": "\u201CWorking day\u201D means a day that is not\u2014 (a) a Saturday, a Sunday, Waitangi Day, Good Friday, Easter Monday, Anzac Day, the Sovereign's birthday, Te R\u0101 Aro ki a Matariki/Matariki Observance Day, or Labour Day; or (b) the day observed as the anniversary day of the province in which the court is located; or (c) if Waitangi Day or Anzac Day falls on a Saturday or a Sunday, the following Monday; or (d) a day in the period commencing on 25 December in one year and ending with 15 January in the next year.",
  "district-court-act": "\u201CWorking day\u201D, in relation to the court, means a day other than\u2014 (a) a Saturday, a Sunday, Good Friday, Easter Monday, Anzac Day, Labour Day, the Sovereign's birthday, Te R\u0101 Aro ki a Matariki/Matariki Observance Day, or Waitangi Day; or (b) the day observed as the anniversary day of the former province in which the relevant office of the court is located; or (c) if Waitangi Day or Anzac Day falls on a Saturday or a Sunday, the following Monday; or (d) a day in the period commencing on 25 December in a year and ending on 15 January in the following year."
};

// src/engine/regimes.js
var CORE = ["waitangi", "good-friday", "easter-monday", "anzac", "sovereign", "matariki", "labour"];
var ALL = ["new-year", "day-after-new-year", ...CORE, "christmas", "boxing"];
var WA = ["waitangi", "anzac"];
var WA_NY = ["waitangi", "anzac", "new-year", "day-after-new-year"];
var LEG = "https://www.legislation.govt.nz/act/public";
var RECEIVED = "Request received";
var REGIMES = [
  // ---- Official information ------------------------------------------------
  {
    id: "oia",
    slug: "oia",
    short: "OIA",
    family: "information",
    title: "Official Information Act 1982",
    menuLabel: "OIA request (Official Information Act)",
    citation: "Official Information Act 1982, s 2(1)",
    url: `${LEG}/1982/0156/latest/DLM64785.html`,
    status: "confirmed",
    rules: { weekends: true, holidays: CORE, mondayised: WA, blackout: { from: "12-25", to: "01-15" }, anniversary: null },
    presets: [
      { id: "decision", label: "Decision on a request", days: 20, trigger: RECEIVED, cite: "s 15(1)" },
      { id: "transfer", label: "Transfer to another agency", days: 10, trigger: RECEIVED, cite: "s 14" },
      { id: "clarify", label: "Last day to ask the requester to clarify", days: 7, trigger: RECEIVED, cite: "s 15(1AB)(b)", note: "Ask within this time and the clarified request can be treated as a new one (s 15(1AA))." }
    ],
    page: {
      h1: "OIA deadline calculator",
      title: "OIA deadline calculator: 20 working days under the Official Information Act",
      description: "Work out when an Official Information Act response is due. Skips weekends, public holidays, Mondayised days and 25 December to 15 January, and shows every skipped day.",
      lede: "When must a Minister or agency decide on your Official Information Act request? Enter the day they received it.",
      card: "Requests to government agencies and Ministers. 20 working days, with 25 Dec \u2013 15 Jan excluded.",
      related: ["lgoima", "privacy"],
      faq: [
        { q: "How long does an agency have to answer an OIA request?", a: "It must decide as soon as reasonably practicable, and no later than 20 working days after the day it receives the request (s 15(1)). It can extend that limit by notice under s 15A, given within the original 20 working days." },
        { q: "Does the Christmas break count?", a: "No. No day from 25 December to 15 January is a working day under the OIA, so a request made in mid-December usually isn\u2019t due until February." },
        { q: "Do anniversary days count?", a: "Yes. The OIA\u2019s definition doesn\u2019t mention provincial anniversary days, so they count as working days even if the agency\u2019s office is closed. (Councils are different: see the LGOIMA calculator.)" },
        { q: "What if the agency asks me to clarify my request?", a: "If you amend or clarify a request, the agency may treat it as a new request that replaces the original (s 15(1AA)), so the 20 working days can start again. Where the agency asked for the clarification, it can only do that if it asked within 7 working days of receiving the request (s 15(1AB))." }
      ]
    }
  },
  {
    id: "lgoima",
    slug: "lgoima",
    short: "LGOIMA",
    family: "information",
    article: false,
    title: "Local Government Official Information and Meetings Act 1987",
    menuLabel: "LGOIMA request (councils)",
    citation: "Local Government Official Information and Meetings Act 1987, s 2(1)",
    url: `${LEG}/1987/0174/latest/DLM122248.html`,
    status: "confirmed",
    rules: { weekends: true, holidays: CORE, mondayised: WA, blackout: { from: "12-20", to: "01-10" }, anniversary: "location", locationNoun: "council" },
    presets: [
      { id: "decision", label: "Decision on a request", days: 20, trigger: RECEIVED, cite: "s 13(1)" },
      { id: "transfer", label: "Transfer to another agency", days: 10, trigger: RECEIVED, cite: "s 12" }
    ],
    notes: ["LGOIMA skips the anniversary day \u201Cobserved in the appropriate area\u201D, a phrase the Act doesn\u2019t define. Duly uses the province where the council is. The Ombudsman\u2019s own LGOIMA calculator leaves anniversary days out, so its dates can be a day early."],
    page: {
      h1: "LGOIMA deadline calculator",
      title: "LGOIMA deadline calculator: council information requests",
      description: "When must a council answer a LGOIMA request? Duly counts 20 working days, skipping 20 December to 10 January, public holidays and the local anniversary day.",
      lede: "Councils answer under LGOIMA, which shuts down over a different summer period from the OIA and also skips the local anniversary day.",
      card: "Requests to councils and CCOs. 20 working days, 20 Dec \u2013 10 Jan and the anniversary day excluded.",
      related: ["oia", "rma"],
      faq: [
        { q: "How long does a council have to answer?", a: "It must decide as soon as reasonably practicable, and no later than 20 working days after the day it receives the request (s 13(1)), unless it extends the limit under s 14." },
        { q: "Is LGOIMA\u2019s Christmas period the same as the OIA\u2019s?", a: "No. LGOIMA excludes 20 December to 10 January; the OIA excludes 25 December to 15 January. LGOIMA also skips the anniversary day, which the OIA counts." }
      ]
    }
  },
  {
    id: "privacy",
    slug: "privacy-act",
    short: "Privacy Act",
    family: "information",
    title: "Privacy Act 2020",
    menuLabel: "Privacy Act request for personal information",
    citation: "Privacy Act 2020, s 7(1)",
    url: `${LEG}/2020/0031/latest/LMS23223.html`,
    status: "confirmed",
    rules: { weekends: true, holidays: CORE, mondayised: WA, blackout: { from: "12-25", to: "01-15" }, anniversary: null },
    presets: [
      { id: "access", label: "Respond to a request for your information", days: 20, trigger: RECEIVED, cite: "s 44(1)" },
      { id: "transfer", label: "Transfer to another agency", days: 10, trigger: RECEIVED, cite: "s 43(2)" }
    ],
    page: {
      h1: "Privacy Act request deadline calculator",
      title: "Privacy Act request deadline: 20 working days to respond",
      description: "Work out when an agency must respond to a request for your personal information under the Privacy Act 2020, with public holidays and 25 December to 15 January excluded.",
      lede: "Asked an organisation for the information it holds about you? It has 20 working days to decide.",
      card: "Requests for your personal information, to any agency. 20 working days.",
      related: ["oia", "lgoima"],
      faq: [
        { q: "How long does an agency have to respond?", a: "As soon as reasonably practicable, and no later than 20 working days after the day it receives the request (s 44(1)), unless it extends the limit under s 48." }
      ]
    }
  },
  // ---- Planning and building ----------------------------------------------
  {
    id: "rma",
    slug: "rma",
    short: "RMA",
    family: "planning",
    title: "Resource Management Act 1991",
    menuLabel: "Resource consent (RMA)",
    citation: "Resource Management Act 1991, s 2(1)",
    url: `${LEG}/1991/0069/latest/DLM230272.html`,
    status: "confirmed",
    rules: { weekends: true, holidays: CORE, mondayised: WA, blackout: { from: "12-20", to: "01-10" }, anniversary: null },
    presets: [
      { id: "non-notified", label: "Decision: not notified, no hearing", days: 20, trigger: "Application first lodged", cite: "s 115(3)" },
      { id: "notification", label: "Decide whether to notify", days: 20, trigger: "Application first lodged", cite: "s 95(2)(b)" },
      { id: "submissions", label: "Submissions close", days: 20, trigger: "Date of notification", cite: "s 97" },
      { id: "after-hearing", label: "Decision after a hearing", days: 15, trigger: "End of the hearing", cite: "s 115(2)" },
      { id: "objection", label: "Object to the council\u2019s decision", days: 15, trigger: "Decision notified to you", cite: "s 357C(1)" },
      { id: "appeal", label: "Appeal to the Environment Court", days: 15, trigger: "Notice of decision received", cite: "s 121(1)(c)" },
      { id: "incomplete", label: "Return an incomplete application", days: 10, trigger: "Application first lodged", cite: "s 88(3)" }
    ],
    notes: ["The RMA is being replaced. The Planning Act 2026 and Natural Environment Act 2026 received Royal assent on 30 September 2026, and an amended RMA applies during a transition from 30 October 2026. These timeframes and the definition are as at 18 September 2026: check whether your matter is under the RMA or the new Acts."],
    page: {
      h1: "RMA working days calculator",
      title: "RMA working days calculator: resource consent timeframes",
      description: "Count Resource Management Act working days for consent decisions, notification, submissions, objections and appeals, skipping 20 December to 10 January and public holidays.",
      lede: "Resource consent clocks run in RMA working days, which stop from 20 December to 10 January.",
      card: "Consent decisions, submissions, objections and appeals. 20 Dec \u2013 10 Jan excluded.",
      related: ["building", "lgoima"],
      faq: [
        { q: "Do processing clocks stop when the council asks for more information?", a: "Often, yes: requests for further information and some other steps put the statutory clock on hold under the Act\u2019s time-limit rules. Duly counts plain working days, so add any days the clock was stopped." },
        { q: "Do anniversary days count?", a: "Yes. The RMA\u2019s definition doesn\u2019t exclude provincial anniversary days." }
      ]
    }
  },
  {
    id: "building",
    slug: "building-act",
    short: "Building Act",
    family: "planning",
    title: "Building Act 2004",
    menuLabel: "Building consent (Building Act)",
    citation: "Building Act 2004, s 7(1)",
    url: `${LEG}/2004/0072/latest/DLM306036.html`,
    status: "confirmed",
    rules: { weekends: true, holidays: CORE, mondayised: WA, blackout: { from: "12-20", to: "01-10" }, anniversary: "location", locationNoun: "building consent authority" },
    presets: [
      { id: "consent", label: "Decide a building consent", days: 20, trigger: "Application received", cite: "s 48(1A)(b)" },
      { id: "consent-fast", label: "Multiple-use approval or whole-building modular", days: 10, trigger: "Application received", cite: "s 48(1A)(a), (aa)" },
      { id: "ccc", label: "Decide a code compliance certificate", days: 20, trigger: "Application made", cite: "s 93(1)(a)" }
    ],
    notes: ["The Building Act skips the anniversary day \u201Cobserved in the appropriate area\u201D, which it doesn\u2019t define. Duly uses the province where the building consent authority is."],
    page: {
      h1: "Building consent working days calculator",
      title: "Building consent working days calculator (Building Act 2004)",
      description: "When is a building consent or code compliance certificate decision due? Duly counts working days under the Building Act 2004, skipping 20 December to 10 January, public holidays and the local anniversary day.",
      lede: "Councils have 20 working days to decide most building consents and code compliance certificates. Here is the date.",
      card: "Building consents and code compliance certificates. 20 working days.",
      related: ["rma", "cca"],
      faq: [
        { q: "Does a request for information stop the clock?", a: "Yes. When the building consent authority asks for further information, the time limit is suspended until it receives that information (s 48(2)). Add the suspended days to Duly\u2019s answer." }
      ]
    }
  },
  // ---- Property and tenancy -------------------------------------------------
  {
    id: "rta",
    slug: "tenancy",
    short: "RTA",
    family: "property",
    title: "Residential Tenancies Act 1986",
    menuLabel: "Tenancy notice (Residential Tenancies Act)",
    citation: "Residential Tenancies Act 1986, s 2(1)",
    url: `${LEG}/1986/0120/latest/DLM94278.html`,
    status: "confirmed",
    rules: {
      weekends: true,
      holidays: ["waitangi", "anzac", "sovereign", "matariki", "labour", "good-friday", "easter-monday", "easter-tuesday"],
      mondayised: WA,
      blackout: { from: "12-24", to: "01-03" },
      anniversary: "location",
      locationNoun: "premises"
    },
    presets: [
      { id: "periodic-90", label: "Landlord ends a periodic tenancy", days: 90, unit: "calendar", trigger: "Notice given", cite: "s 51(1)" },
      { id: "periodic-42", label: "Landlord: owner or family moving in, or sold with vacant possession", days: 42, unit: "calendar", trigger: "Notice given", cite: "s 51(2)" },
      { id: "tenant-21", label: "Tenant ends a periodic tenancy", days: 21, unit: "calendar", trigger: "Notice given", cite: "s 51(2A)" },
      { id: "rent-60", label: "Rent increase takes effect", days: 60, unit: "calendar", trigger: "Notice given", cite: "s 24(1)(c)" },
      { id: "remedy-14", label: "Notice to remedy a breach", days: 14, unit: "calendar", trigger: "Notice given", cite: "s 56(1)(b)" },
      { id: "bond", label: "Lodge the bond with Tenancy Services", days: 23, trigger: "Bond paid", cite: "s 19(1)(b)" }
    ],
    service: [
      { id: "personal", label: "Handed to the person", addWorkingDays: 0, cite: "s 136(1)(a)" },
      { id: "email-before-5", label: "Emailed before 5pm", addWorkingDays: 0, cite: "s 136(8)" },
      { id: "email-after-5", label: "Emailed after 5pm (next working day)", addWorkingDays: 1, cite: "s 136(8)" },
      { id: "mailbox", label: "Put in the mailbox or on the door (2nd working day)", addWorkingDays: 2, cite: "s 136(7)" },
      { id: "post", label: "Posted (4th working day)", addWorkingDays: 4, cite: "s 136(6)" }
    ],
    notes: [
      "Notice periods start the day after the notice is given or treated as given, and end at the close of the last day (s 136A). Choose how the notice was given and Duly does both steps.",
      "The RTA closes 24 December to 3 January only, and skips Good Friday to Easter Tuesday. Read literally, it doesn\u2019t exclude a New Year holiday observed on 4 January (as in 2027 and 2028), so Duly counts it and says so."
    ],
    page: {
      h1: "Tenancy notice calculator",
      title: "Tenancy notice calculator NZ: notice periods and service dates (RTA)",
      description: "Work out when a tenancy notice is treated as given and when the notice period ends under the Residential Tenancies Act, including posting (4 working days), mailbox delivery (2) and email after 5pm.",
      lede: "Notice periods are in calendar days, but a posted or letterboxed notice only counts as given some working days later. Duly works out both.",
      card: "Notice periods, deemed delivery by post, mailbox or email, and bond lodgement.",
      related: ["sale-purchase", "pla"],
      faq: [
        { q: "When does a posted notice count as given?", a: "On the fourth working day after posting, unless there is evidence otherwise (s 136(6)). A notice put in the mailbox or attached to the door counts as given on the second working day after delivery (s 136(7)), and an email sent after 5pm counts as given the next working day (s 136(8))." },
        { q: "How much notice does a landlord have to give?", a: "For a periodic tenancy, at least 90 days in any case, or at least 42 days if the owner or a family member is moving in, or the property has been sold with vacant possession (s 51). A tenant must give at least 21 days (s 51(2A))." },
        { q: "Which working days does the RTA skip?", a: "Weekends, Waitangi Day, Anzac Day (and their Mondayised dates), the King\u2019s Birthday, Matariki, Labour Day, Good Friday to Easter Tuesday, 24 December to 3 January, and the anniversary day where the premises are." }
      ]
    }
  },
  {
    id: "sale-purchase",
    slug: "sale-and-purchase",
    short: "Sale and purchase agreement",
    family: "property",
    title: "Agreement for Sale and Purchase of Real Estate (TLANZ/REINZ)",
    menuLabel: "Property sale and purchase agreement",
    citation: "TLANZ/REINZ Agreement for Sale and Purchase of Real Estate, 11th ed (2022) (4), cl 1.1",
    url: "https://thelawassociation.nz/",
    status: "confirmed",
    definition: { paraphrase: "Any day other than a weekend, Waitangi Day, Good Friday, Easter Monday, Anzac Day, the Sovereign\u2019s Birthday, Labour Day, Matariki, any other day the Government declares a public holiday, Waitangi Day or Anzac Day\u2019s Mondayised date, a day from 24 December to 5 January (to 15 January for the LIM date), or the anniversary day of the province where the property is. A working day runs from 9am to 5pm." },
    rules: { weekends: true, holidays: CORE, mondayised: WA, blackout: { from: "12-24", to: "01-05" }, anniversary: "location", locationNoun: "property" },
    presets: [
      { id: "finance", label: "Finance condition", days: 10, trigger: "Date of the agreement", note: "Use the number of working days written into your agreement." },
      { id: "lim", label: "LIM date (summer runs to 15 January)", days: 10, trigger: "Date of the agreement", regime: "sale-purchase-lim", note: "The LIM date has a longer summer exclusion. Use the period in your agreement." },
      { id: "building-report", label: "Building report condition", days: 10, trigger: "Date of the agreement", note: "Use the number of working days written into your agreement." },
      { id: "settlement-notice", label: "Settle after a settlement notice", days: 12, trigger: "Settlement notice served", cite: "cl 11", note: "Check the settlement-notice period in your edition of the agreement." },
      { id: "date-check", label: "A date in the agreement that isn\u2019t a working day", days: 0, unit: "calendar", roll: "previous", trigger: "Date in the agreement", cite: "cl 1.3(1)", note: "The agreement moves it back to the last working day before." }
    ],
    service: [
      { id: "personal", label: "Delivered or emailed before 5pm on a working day", addWorkingDays: 0, cite: "cl 1.3(2)" },
      { id: "after-hours", label: "Emailed after 5pm or on a non-working day (next working day)", addWorkingDays: 1, cite: "cl 1.3(2)" },
      { id: "secure-web", label: "Secure web document exchange (1st working day)", addWorkingDays: 1, cite: "cl 1.4(4)" },
      { id: "dx", label: "Document exchange (2nd working day)", addWorkingDays: 2, cite: "cl 1.4(4)" },
      { id: "post", label: "Ordinary mail (5th working day)", addWorkingDays: 5, cite: "cl 1.4(4)" }
    ],
    notes: ["Edition 2022 (4) changed posted notices to the fifth working day after posting (it was the third). Check which edition your agreement uses."],
    page: {
      h1: "Sale and purchase agreement date calculator",
      title: "Sale and purchase agreement working days calculator (TLANZ/REINZ, ADLS)",
      description: "Work out condition dates under the TLANZ/REINZ (formerly ADLS) Agreement for Sale and Purchase of Real Estate: finance, LIM and building conditions and settlement notices, with 24 December to 5 January and the local anniversary day excluded.",
      lede: "Condition dates in the standard agreement run in its own working days: no weekends, no public holidays, nothing from 24 December to 5 January, and not the anniversary day where the property is.",
      card: "Condition dates, settlement notices and notice service for property sales.",
      related: ["rta", "pla"],
      faq: [
        { q: "What time does a working day end?", a: "The agreement treats a working day as running from 9am to 5pm. Anything done after 5pm, or on a day that isn\u2019t a working day, is treated as done at 9am on the next working day (cl 1.3(2))." },
        { q: "What if a condition or settlement date isn\u2019t a working day?", a: "Under cl 1.3(1) it becomes the last working day before that date, not the next one. Use the \u201Cdate in the agreement\u201D option to check." },
        { q: "Which anniversary day applies?", a: "The anniversary day of the province where the property is, so an Auckland property skips Auckland Anniversary Day and a Wellington property skips Wellington Anniversary Day." },
        { q: "Is this the ADLS agreement?", a: "Yes. ADLS is now The Law Association of New Zealand (TLANZ); the agreement is published with REINZ." }
      ]
    }
  },
  {
    id: "sale-purchase-lim",
    slug: "sale-and-purchase-lim",
    short: "Sale and purchase (LIM date)",
    family: "property",
    compare: false,
    title: "Agreement for Sale and Purchase of Real Estate: the LIM date",
    menuLabel: "Property sale and purchase: LIM date",
    citation: "TLANZ/REINZ Agreement for Sale and Purchase of Real Estate, 11th ed (2022) (4), cl 1.1(c)",
    url: "https://thelawassociation.nz/",
    status: "confirmed",
    rules: { weekends: true, holidays: CORE, mondayised: WA, blackout: { from: "12-24", to: "01-15" }, anniversary: "location", locationNoun: "property" },
    presets: [{ id: "lim", label: "LIM date", days: 10, trigger: "Date of the agreement", note: "Use the period in your agreement." }]
  },
  {
    id: "pla",
    slug: "property-law-act",
    short: "Property Law Act",
    family: "property",
    title: "Property Law Act 2007",
    menuLabel: "Property Law Act notices (mortgages, leases)",
    citation: "Property Law Act 2007, s 4",
    url: `${LEG}/2007/0091/latest/DLM968967.html`,
    status: "confirmed",
    rules: { weekends: true, holidays: CORE, mondayised: WA, blackout: { from: "12-25", to: "01-02" }, anniversary: "location", locationNoun: "place where the act is to be done" },
    presets: [
      { id: "mortgage-default", label: "Mortgagee\u2019s notice: time to remedy the default", days: 20, trigger: "Notice served", cite: "s 120(c)", note: "At least 20 working days after service, or longer if the mortgage says so." }
    ],
    notes: ["The Property Law Act\u2019s summer period ends on 2 January and, unlike the Legislation Act, has no rule for New Year holidays observed on 3 or 4 January. Read literally those days count, and Duly says so when it counts one."],
    page: {
      h1: "Property Law Act working days calculator",
      title: "Property Law Act working days calculator (mortgagee notices)",
      description: "Count working days under the Property Law Act 2007 for mortgagee and lease notices: weekends, public holidays, 25 December to 2 January and the anniversary day where the act is to be done.",
      lede: "A mortgagee\u2019s notice must give at least 20 working days to fix a default, counted under the Property Law Act\u2019s own definition.",
      card: "Mortgagee and lease notices. 25 Dec \u2013 2 Jan and the anniversary day excluded.",
      related: ["sale-purchase", "lta"],
      faq: []
    }
  },
  {
    id: "lta",
    slug: "land-transfer-act",
    short: "Land Transfer Act",
    family: "property",
    title: "Land Transfer Act 2017",
    menuLabel: "Land Transfer Act (caveats)",
    citation: "Land Transfer Act 2017, s 5(1)",
    url: `${LEG}/2017/0030/latest/DLM6731023.html`,
    status: "confirmed",
    rules: { weekends: true, holidays: CORE, mondayised: WA_NY, blackout: { from: "12-25", to: "01-02" }, anniversary: null },
    presets: [
      { id: "caveat-notice", label: "Caveator tells the Registrar a court application has been made", days: 10, trigger: "Registrar gives notice of lapse application", cite: "s 143(3)(a)" },
      { id: "caveat-order", label: "Court order served on the Registrar", days: 20, trigger: "Caveator\u2019s notice to the Registrar", cite: "s 143(3)(b)" }
    ],
    page: {
      h1: "Caveat lapse calculator",
      title: "Caveat lapse calculator (Land Transfer Act 2017, s 143)",
      description: "When does a caveat lapse? Count Land Transfer Act working days for a caveator\u2019s notice (10 working days) and the court order (20 more), skipping 25 December to 2 January and public holidays.",
      lede: "A caveat lapses unless the caveator acts within 10 working days of the Registrar\u2019s notice, then serves a court order within 20 more.",
      card: "Lapse of caveats against dealings. 10 + 20 working days.",
      related: ["pla", "sale-purchase"],
      faq: []
    }
  },
  {
    id: "ppsa",
    slug: "ppsa",
    short: "PPSA",
    family: "property",
    compare: false,
    title: "Personal Property Securities Act 1999",
    menuLabel: "Personal Property Securities Act",
    citation: "Personal Property Securities Act 1999, s 16(1)",
    url: `${LEG}/1999/0126/latest/DLM45629.html`,
    status: "confirmed",
    rules: { weekends: true, holidays: CORE, mondayised: WA, blackout: { from: "12-25", to: "01-02" }, anniversary: null },
    presets: [],
    notes: ["For sections 165, 167A, 168 and 178 the PPSA\u2019s summer period runs to 15 January, not 2 January."]
  },
  // ---- Construction -----------------------------------------------------------
  {
    id: "cca",
    slug: "construction-contracts",
    short: "CCA",
    family: "construction",
    title: "Construction Contracts Act 2002",
    menuLabel: "Payment claim (Construction Contracts Act)",
    citation: "Construction Contracts Act 2002, s 5",
    url: `${LEG}/2002/0046/latest/DLM162681.html`,
    status: "confirmed",
    rules: { weekends: true, holidays: CORE, mondayised: WA, blackout: { from: "12-24", to: "01-05" }, anniversary: "location", locationNoun: "construction site" },
    presets: [
      { id: "schedule", label: "Payment schedule in reply to a claim", days: 20, trigger: "Payment claim served", cite: "s 22(b)(ii)", note: "Only if the contract sets no time. If it does, use the contract\u2019s." },
      { id: "adjudication-response", label: "Response to an adjudication claim", days: 5, trigger: "Adjudication claim received", cite: "s 37(1)(a)" }
    ],
    notes: [
      "This 24 December to 5 January period applies to ss 18, 22, 24A, 33, 35\u201337A, 46, 47, 59 and 66. Sections 71B, 74 and 75 use 25 December to 15 January instead, and the retention-money sections (18C, 18K) aren\u2019t in either list.",
      "The Act skips the anniversary day \u201Cobserved in the appropriate area\u201D, which it doesn\u2019t define (MBIE\u2019s prescribed forms leave it out). Duly uses the province where the site is."
    ],
    page: {
      h1: "Payment schedule deadline calculator",
      title: "Payment schedule deadline calculator (Construction Contracts Act 2002)",
      description: "When is a payment schedule due under the Construction Contracts Act? Duly counts 20 working days from service of the payment claim, skipping 24 December to 5 January, public holidays and the local anniversary day.",
      lede: "Miss the payment schedule deadline and the claimed amount can become a debt due. Get the date right.",
      card: "Payment claims, payment schedules and adjudication. 24 Dec \u2013 5 Jan excluded.",
      related: ["building", "companies"],
      faq: [
        { q: "What if the contract sets its own date?", a: "If the construction contract says when a payment schedule must be given, that applies. The 20 working days only apply when the contract is silent (s 22(b))." }
      ]
    }
  },
  // ---- Courts -------------------------------------------------------------------
  {
    id: "hcr",
    slug: "high-court",
    short: "High Court Rules",
    family: "courts",
    title: "High Court Rules 2016",
    menuLabel: "High Court Rules",
    citation: "High Court Rules 2016, r 1.3(1)",
    url: "https://www.legislation.govt.nz/regulation/public/2016/0225/latest/DLM6951106.html",
    status: "confirmed",
    rules: { weekends: true, holidays: CORE, mondayised: WA, blackout: { from: "12-25", to: "01-15" }, anniversary: null },
    presets: [
      { id: "defence", label: "File a statement of defence", days: 25, trigger: "Statement of claim served", cite: "r 5.47" }
    ],
    service: [
      { id: "electronic-late", label: "Served electronically after 5pm or on a non-working day (next working day)", addWorkingDays: 1, cite: "r 6.6(3)" },
      { id: "dx", label: "Document exchange (2nd working day)", addWorkingDays: 2, cite: "r 6.6" },
      { id: "po-box", label: "Posted to a PO box (5th working day)", addWorkingDays: 5, cite: "r 6.6" }
    ],
    notes: ["Registries also close on court holidays: Good Friday to Easter Tuesday, 24 December to 3 January, and the anniversary day where the court is (r 3.2). If time runs out on a day the registry is closed, filing on the next day it is open is in time (r 1.18). Statutory appeal periods use the Senior Courts Act definition, which also skips that anniversary day."],
    page: {
      h1: "High Court working days calculator",
      title: "High Court Rules working days calculator",
      description: "Count working days under the High Court Rules 2016 for statements of defence and other steps, skipping 25 December to 15 January and public holidays, with deemed service dates.",
      lede: "High Court time limits run in working days that skip 25 December to 15 January.",
      card: "Statements of defence, service and other High Court steps.",
      related: ["dcr", "companies"],
      faq: []
    }
  },
  {
    id: "senior-courts",
    slug: "senior-courts-act",
    short: "Senior Courts Act",
    family: "courts",
    compare: false,
    title: "Senior Courts Act 2016",
    menuLabel: "Senior Courts Act (appeals and leave)",
    citation: "Senior Courts Act 2016, s 4",
    url: `${LEG}/2016/0048/latest/DLM5759293.html`,
    status: "confirmed",
    rules: { weekends: true, holidays: CORE, mondayised: WA, blackout: { from: "12-25", to: "01-15" }, anniversary: "location", locationNoun: "court" },
    presets: [
      { id: "leave", label: "Ask the Court of Appeal for leave after the High Court refuses", days: 20, trigger: "High Court refuses leave", cite: "s 56(5)" }
    ]
  },
  {
    id: "dcr",
    slug: "district-court",
    short: "District Court Rules",
    family: "courts",
    title: "District Court Rules 2014",
    menuLabel: "District Court Rules",
    citation: "District Court Rules 2014, r 1.4(1)",
    url: "https://www.legislation.govt.nz/regulation/public/2014/0179/latest/DLM4891280.html",
    status: "partial",
    rules: { weekends: true, holidays: CORE, mondayised: WA, blackout: { from: "12-25", to: "01-15" }, anniversary: null },
    presets: [
      { id: "ten", label: "10 working days", days: 10, trigger: "Start date" },
      { id: "twenty", label: "20 working days", days: 20, trigger: "Start date" }
    ],
    notes: ["Checked against official extracts of r 1.4(1) rather than the full text. Statutory periods under the District Court Act 2016 use its own definition, which also skips the anniversary day where the court office is."],
    page: {
      h1: "District Court working days calculator",
      title: "District Court Rules working days calculator",
      description: "Count working days under the District Court Rules 2014, skipping 25 December to 15 January and public holidays.",
      lede: "District Court time limits in working days, with 25 December to 15 January left out.",
      card: "Civil steps in the District Court.",
      related: ["hcr", "companies"],
      faq: []
    }
  },
  {
    id: "district-court-act",
    slug: "district-court-act",
    short: "District Court Act",
    family: "courts",
    compare: false,
    title: "District Court Act 2016",
    menuLabel: "District Court Act (statutory periods)",
    citation: "District Court Act 2016, s 4",
    url: `${LEG}/2016/0049/latest/DLM6942203.html`,
    status: "confirmed",
    rules: { weekends: true, holidays: CORE, mondayised: WA, blackout: { from: "12-25", to: "01-15" }, anniversary: "location", locationNoun: "court office" },
    presets: []
  },
  // ---- Companies, tax, employment and contracts -----------------------------
  {
    id: "companies",
    slug: "companies-act",
    short: "Companies Act",
    family: "business",
    title: "Companies Act 1993",
    menuLabel: "Companies Act (statutory demands, meetings)",
    citation: "Companies Act 1993, s 2(1)",
    url: `${LEG}/1993/0105/latest/DLM319576.html`,
    status: "confirmed",
    rules: { weekends: true, holidays: CORE, mondayised: WA_NY, blackout: { from: "12-25", to: "01-02" }, anniversary: null },
    presets: [
      { id: "statutory-demand", label: "Comply with a statutory demand", days: 15, trigger: "Demand served", cite: "s 289(2)(d)" },
      { id: "set-aside", label: "Apply to set aside a statutory demand", days: 10, trigger: "Demand served", cite: "s 290(2)" }
    ],
    service: [
      { id: "email", label: "Emailed (received the next working day)", addWorkingDays: 1, cite: "s 392(1)(ca)" },
      { id: "post", label: "Posted or sent by document exchange (5 working days)", addWorkingDays: 5, cite: "s 392(1)(b)" }
    ],
    page: {
      h1: "Statutory demand deadline calculator",
      title: "Statutory demand deadline calculator (Companies Act 1993)",
      description: "Work out statutory demand deadlines under the Companies Act 1993: 15 working days to comply and 10 to apply to set it aside, with 25 December to 2 January, public holidays and deemed service by post or email.",
      lede: "A statutory demand gives 15 working days to pay, and 10 to apply to set it aside. Companies Act working days skip 25 December to 2 January.",
      card: "Statutory demands and set-aside applications, with deemed service.",
      related: ["hcr", "ird-due-date"],
      faq: [
        { q: "When is a posted demand treated as received?", a: "A document posted or sent by document exchange is treated as received 5 working days after posting, and an email the working day after it is sent (s 392(1)). Choose how it was served and Duly adds that first." }
      ]
    }
  },
  {
    id: "ird-due-date",
    slug: "tax",
    short: "IRD due dates",
    family: "business",
    article: false,
    compare: false,
    title: "IRD due dates that fall on a weekend or public holiday",
    menuLabel: "Tax due date (IRD)",
    citation: "Inland Revenue, \u201CWhen to pay\u201D; Legislation Act 2019, s 55",
    url: "https://www.ird.govt.nz/managing-my-tax/make-a-payment/when-to-pay",
    status: "convention",
    definition: { paraphrase: "\u201CFor due dates that fall on a weekend or public holiday, we need to receive your payment on or before the next working day.\u201D (Inland Revenue)" },
    rules: { weekends: true, holidays: ALL, mondayised: ALL, blackout: null, anniversary: null },
    presets: [
      { id: "due-date", label: "Where a due date lands", days: 0, unit: "calendar", roll: "next", trigger: "Due date" }
    ],
    notes: [
      "Anniversary days don\u2019t move electronic payments: if a due date falls on your anniversary day, pay electronically by the due date itself (IRD Standard Practice Statement 21/03).",
      "IRD\u2019s due dates (such as 15 January) are not moved by the 25 December to 15 January period in the tax Acts\u2019 own definition of working day."
    ],
    page: {
      h1: "IRD due date calculator",
      title: "IRD due date calculator: when a due date falls on a weekend or holiday",
      description: "When an IRD due date falls on a weekend or public holiday, payment is due the next working day. Duly works out the date, including Mondayised holidays.",
      lede: "If a tax due date isn\u2019t a working day, Inland Revenue accepts payment on the next one. Enter the due date to see where it lands.",
      card: "Tax due dates that fall on weekends and holidays.",
      related: ["companies", "working-days"],
      faq: [
        { q: "What about the 25 December to 15 January period?", a: "The Income Tax Act and GST Act define working days to exclude 25 December to 15 January, but IRD still sets due dates such as 15 January, and the weekend and public holiday rule is what moves them." }
      ]
    }
  },
  {
    id: "tax-acts",
    slug: "tax-acts",
    short: "Tax Acts",
    family: "business",
    article: false,
    compare: false,
    title: "Income Tax Act 2007 and GST Act 1985 (used by the Tax Administration Act)",
    menuLabel: "Tax Acts (working-day periods)",
    citation: "Income Tax Act 2007, s YA 1; Goods and Services Tax Act 1985, s 2(1)",
    url: `${LEG}/2007/0097/latest/DLM1520575.html`,
    status: "confirmed",
    rules: { weekends: true, holidays: CORE, mondayised: WA, blackout: { from: "12-25", to: "01-15" }, anniversary: null },
    presets: [],
    notes: ["The Tax Administration Act 1994 takes this definition from the Income Tax Act (s 3(2)). Provincial anniversary days are working days."]
  },
  {
    id: "era",
    slug: "personal-grievance",
    short: "Employment Relations Act",
    family: "business",
    compare: false,
    title: "Employment Relations Act 2000",
    menuLabel: "Personal grievance or trial period (Employment Relations Act)",
    citation: "Employment Relations Act 2000 (no own definition; Legislation Act 2019, s 13 applies)",
    url: `${LEG}/2000/0024/latest/DLM58317.html`,
    status: "confirmed",
    rules: { weekends: true, holidays: ALL, mondayised: WA_NY, blackout: { from: "12-25", to: "01-02" }, anniversary: null },
    presets: [
      { id: "pg-90", label: "Raise a personal grievance", days: 90, unit: "calendar", startRule: "on", roll: "next", trigger: "Action happened or came to your notice", cite: "s 114(7)(b)", note: "The 90 days begin with that day. If day 90 isn\u2019t a working day, the next working day is in time (Legislation Act 2019, s 55)." },
      { id: "trial-90", label: "Last day of a 90-day trial period", days: 90, unit: "calendar", startRule: "on", trigger: "First day of employment", cite: "s 67A(2)(a)", note: "A trial period can be shorter; it can\u2019t be longer than 90 days." }
    ],
    notes: ["Sexual harassment grievances have 12 months (s 114(7)(a)), not 90 days."],
    page: {
      h1: "Personal grievance 90-day calculator",
      title: "Personal grievance 90-day deadline calculator (Employment Relations Act)",
      description: "Work out the last day to raise a personal grievance: 90 days beginning with the day the action happened or came to your notice, moved to the next working day if needed. Plus the last day of a 90-day trial period.",
      lede: "A personal grievance must be raised within 90 days, beginning with the day the action happened or came to your notice.",
      card: "The 90-day window to raise a grievance, and 90-day trial periods.",
      related: ["working-days", "companies"],
      faq: [
        { q: "Does the first day count?", a: "Yes. The 90 days begin with the day of the action (or the day it came to your notice, if later), so that day is day 1 (Legislation Act 2019, s 54)." },
        { q: "What if day 90 is a weekend or holiday?", a: "Then raising it on the next working day is in time (Legislation Act 2019, s 55). Duly moves the date for you." }
      ]
    }
  },
  {
    id: "legislation-act",
    slug: "working-days",
    short: "Legislation Act",
    family: "general",
    title: "Legislation Act 2019",
    menuLabel: "Any other Act (Legislation Act default)",
    citation: "Legislation Act 2019, s 13",
    url: `${LEG}/2019/0058/latest/LMS268898.html`,
    status: "confirmed",
    rules: { weekends: true, holidays: CORE, mondayised: WA_NY, blackout: { from: "12-25", to: "01-02" }, anniversary: null },
    presets: [
      { id: "ten", label: "10 working days", days: 10, trigger: "Start date" },
      { id: "twenty", label: "20 working days", days: 20, trigger: "Start date" }
    ],
    notes: ["Applies wherever legislation uses \u201Cworking day\u201D without its own definition, for example the Employment Relations Act and the Unit Titles Act."],
    page: {
      h1: "NZ working days calculator",
      title: "NZ working days calculator (Legislation Act 2019 definition)",
      description: "Count New Zealand working days for any Act without its own definition: weekends, public holidays, Mondayised days and 25 December to 2 January excluded, under the Legislation Act 2019.",
      lede: "Where an Act uses \u201Cworking day\u201D without defining it, the Legislation Act 2019 definition applies.",
      card: "The default definition for Acts without their own. 25 Dec \u2013 2 Jan excluded.",
      related: ["business-day", "era"],
      faq: [
        { q: "Does the start day count?", a: "It depends on the wording (Legislation Act 2019, s 54). A period \u201Cafter\u201D or \u201Cfrom\u201D a day, or \u201Cwithin\u201D a number of days of it, leaves that day out. A period \u201Cstarting on\u201D or \u201Cbeginning with\u201D a day includes it: tick \u201CCount the start date itself as day 1\u201D." },
        { q: "What if the last day isn\u2019t a working day?", a: "If something must be done on a day, or by the last day of a period, and that day isn\u2019t a working day, it can be done on the next working day (s 55)." }
      ]
    }
  },
  {
    id: "business-day",
    slug: "business-days",
    short: "Business days",
    family: "general",
    article: false,
    title: "Business day (banks open in Auckland and Wellington)",
    menuLabel: "Business days (banks in Auckland and Wellington)",
    citation: "Common contract definition of \u201Cbusiness day\u201D",
    url: "https://www.employment.govt.nz/leave-and-holidays/public-holidays/public-holidays-and-anniversary-dates",
    status: "convention",
    definition: { paraphrase: "\u201CA day (other than a Saturday or Sunday) on which registered banks are open for general banking business in Auckland and Wellington.\u201D" },
    rules: { weekends: true, holidays: ALL, mondayised: ALL, blackout: null, anniversary: ["auckland", "wellington"] },
    presets: [
      { id: "two", label: "Two business days", days: 2, trigger: "Start date" },
      { id: "five", label: "Five business days", days: 5, trigger: "Start date" }
    ],
    page: {
      h1: "NZ business days calculator",
      title: "NZ business days calculator (banks open in Auckland and Wellington)",
      description: "Count New Zealand business days as most finance and commercial contracts define them: weekends, public holidays and Auckland and Wellington anniversary days excluded.",
      lede: "Most loan, settlement and commercial contracts define a business day as a day banks are open in Auckland and Wellington.",
      card: "Finance and commercial contracts. No summer shutdown; both anniversary days skipped.",
      related: ["legislation-act", "sale-purchase"],
      faq: [
        { q: "Where does this definition come from?", a: "It is a contract convention, not a statute. Check the definition in your own contract: some name other cities, or add a summer period." }
      ]
    }
  }
];
var REGIME_IDS = REGIMES.map((r) => r.id);
var BY_ID2 = Object.fromEntries(REGIMES.flatMap((r) => [[r.slug, r], [r.id, r]]));
var PRESETS = Object.fromEntries(REGIMES.map((r) => [r.id, r.presets || []]));
function getRegime(id) {
  const r = BY_ID2[id];
  if (!r) throw new RangeError(`Unknown regime ${JSON.stringify(id)}. Use one of: ${REGIME_IDS.join(", ")}`);
  return r;
}
__name(getRegime, "getRegime");
function listJoin(items) {
  if (items.length <= 1) return items.join("");
  return `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;
}
__name(listJoin, "listJoin");
var anniversaryNames = /* @__PURE__ */ __name((ids) => listJoin(ids.map((p) => p[0].toUpperCase() + p.slice(1))), "anniversaryNames");
function describeRules(r) {
  const { blackout, anniversary, holidays } = r.rules;
  const bits = ["weekends", "public holidays"];
  if (holidays.includes("easter-tuesday")) bits.push("Good Friday to Easter Tuesday");
  if (blackout) bits.push(`${formatMonthDay(blackout.from)} \u2013 ${formatMonthDay(blackout.to)}`);
  if (anniversary === "location") bits.push("the local anniversary day");
  else if (Array.isArray(anniversary)) bits.push(`${anniversaryNames(anniversary)} anniversary days`);
  return listJoin(bits);
}
__name(describeRules, "describeRules");
for (const r of REGIMES) {
  if (!r.definition) r.definition = {};
  if (DEFINITIONS[r.id]) r.definition.quote = DEFINITIONS[r.id];
  r.summaryLine = `Skips ${describeRules(r)}.`;
  r.the = r.article === false ? r.short : `the ${r.short}`;
}

// src/engine/version.js
var ENGINE_VERSION = "1.0.0";
var RULES_VERIFIED = "2026-10-21";

// src/engine/compute.js
var FIRST_DATE = "2023-01-01";
var LAST_DATE = "2052-12-31";
var MAX_DAYS = 2e3;
var cap = /* @__PURE__ */ __name((s) => s[0].toUpperCase() + s.slice(1), "cap");
var yearCache = /* @__PURE__ */ new Map();
function excludedByHoliday(regime2, province2, year) {
  const key = `${regime2.id}|${province2 || ""}|${year}`;
  if (yearCache.has(key)) return yearCache.get(key);
  const map = /* @__PURE__ */ new Map();
  const push = /* @__PURE__ */ __name((date2, reason) => {
    if (!map.has(date2)) map.set(date2, []);
    map.get(date2).push(reason);
  }, "push");
  const { holidays, mondayised } = regime2.rules;
  for (const h of nationalHolidays(year)) {
    if (!h.mondayised && holidays.includes(h.key)) push(h.date, { code: "holiday", label: h.name });
    if (h.mondayised && mondayised.includes(h.key)) {
      push(h.date, { code: "mondayised", label: `${h.name} (observed; ${formatShort(h.actual)} falls on a weekend)` });
    }
  }
  if (holidays.includes("easter-tuesday")) push(addDays(easterSunday(year), 2), { code: "holiday", label: "Easter Tuesday" });
  for (const p of anniversaryProvinces(regime2, province2)) {
    const a = anniversaryDay(p, year);
    push(a.date, { code: "anniversary", label: a.name });
  }
  yearCache.set(key, map);
  return map;
}
__name(excludedByHoliday, "excludedByHoliday");
var observedCache = /* @__PURE__ */ new Map();
function observedHoliday(date2) {
  const y = yearOf(date2);
  if (!observedCache.has(y)) {
    observedCache.set(y, new Map(nationalHolidays(y).filter((h) => !isWeekend(h.date)).map((h) => [h.date, h])));
  }
  return observedCache.get(y).get(date2);
}
__name(observedHoliday, "observedHoliday");
function countedHolidayNotes(trace, regime2) {
  const notes = [];
  for (const t of trace) {
    if (!t.working || !t.n) continue;
    const h = observedHoliday(t.date);
    if (h) {
      notes.push(`${formatLong(t.date)} is counted: it is ${h.mondayised ? `the observed ${h.name} public holiday` : `${h.name}`}, but the definition of working day in ${regime2.citation} doesn\u2019t exclude it.`);
    }
  }
  return notes;
}
__name(countedHolidayNotes, "countedHolidayNotes");
function anniversaryProvinces(regime2, province2) {
  const rule = regime2.rules.anniversary;
  if (!rule) return [];
  if (Array.isArray(rule)) return rule;
  return province2 ? [province2] : [];
}
__name(anniversaryProvinces, "anniversaryProvinces");
function inBlackout(date2, blackout) {
  if (!blackout) return false;
  const md = date2.slice(5);
  return blackout.from <= blackout.to ? md >= blackout.from && md <= blackout.to : md >= blackout.from || md <= blackout.to;
}
__name(inBlackout, "inBlackout");
function blackoutLabel(blackout) {
  return `${formatMonthDay(blackout.from)} \u2013 ${formatMonthDay(blackout.to)} period`;
}
__name(blackoutLabel, "blackoutLabel");
function reasonsExcluded(date2, regime2, province2) {
  const reasons = [];
  if (regime2.rules.weekends && isWeekend(date2)) reasons.push({ code: "weekend", label: WEEKDAYS[weekday(date2)] });
  const hol = excludedByHoliday(regime2, province2, yearOf(date2)).get(date2);
  if (hol) reasons.push(...hol);
  if (inBlackout(date2, regime2.rules.blackout)) reasons.push({ code: "blackout", label: blackoutLabel(regime2.rules.blackout) });
  return reasons;
}
__name(reasonsExcluded, "reasonsExcluded");
function resolve(opts) {
  const regime2 = getRegime(opts.regime ?? "legislation-act");
  let province2 = opts.province || null;
  const needsProvince = regime2.rules.anniversary === "location";
  if (province2) getProvince(province2);
  else if (needsProvince && opts.requireProvince !== false) {
    throw new RangeError(`${cap(regime2.the)} excludes the anniversary day of the province where the ${regime2.rules.locationNoun || "place"} is. Pass a province (e.g. "auckland").`);
  }
  if (!needsProvince) province2 = null;
  return { regime: regime2, province: province2 };
}
__name(resolve, "resolve");
function checkDate(date2, label) {
  assertISODate(date2, label);
  if (date2 < FIRST_DATE || date2 > LAST_DATE) {
    throw new RangeError(`${label} must be between ${FIRST_DATE} and ${LAST_DATE} (got ${date2})`);
  }
}
__name(checkDate, "checkDate");
function checkCount(n, label = "days") {
  if (!Number.isInteger(n) || n < 0 || n > MAX_DAYS) throw new RangeError(`${label} must be a whole number from 0 to ${MAX_DAYS} (got ${JSON.stringify(n)})`);
}
__name(checkCount, "checkCount");
function regimeSummary(regime2) {
  return {
    id: regime2.id,
    title: regime2.title,
    short: regime2.short,
    the: regime2.the,
    citation: regime2.citation,
    url: regime2.url,
    status: regime2.status
  };
}
__name(regimeSummary, "regimeSummary");
function regimeNotes(regime2, province2) {
  const notes = [...regime2.notes || []];
  if (regime2.status === "partial") notes.push(`This definition was checked against official extracts of ${regime2.citation}, not its full text.`);
  if (regime2.status === "convention") notes.push("This is a common convention rather than a statutory definition; check the wording that applies to you.");
  if (province2) {
    const p = getProvince(province2);
    if (p.note) notes.push(p.note);
  }
  return notes;
}
__name(regimeNotes, "regimeNotes");
function step(date2, regime2, province2) {
  const reasons = reasonsExcluded(date2, regime2, province2);
  return { date: date2, working: reasons.length === 0, reasons };
}
__name(step, "step");
function envelope(kind, regime2, province2, input, body) {
  return {
    kind,
    regime: regimeSummary(regime2),
    province: province2 ? { id: province2, name: getProvince(province2).name } : null,
    input,
    ...body,
    notes: regimeNotes(regime2, province2),
    engine: { version: ENGINE_VERSION, rulesVerified: RULES_VERIFIED }
  };
}
__name(envelope, "envelope");
function excludedSummary(trace) {
  const skipped = trace.filter((t) => !t.working && t.role !== "trigger");
  const byCode = {};
  for (const t of skipped) for (const r of t.reasons) byCode[r.code] = (byCode[r.code] || 0) + 1;
  return {
    days: skipped.length,
    byReason: byCode,
    list: skipped.filter((t) => t.reasons.some((r) => r.code !== "weekend")).map((t) => ({ date: t.date, reasons: t.reasons.map((r) => r.label) }))
  };
}
__name(excludedSummary, "excludedSummary");
function compactSkips(list) {
  const runs = [];
  for (const e of list) {
    const key = e.reasons.filter((r) => !WEEKDAYS.includes(r)).join("; ");
    const last = runs[runs.length - 1];
    if (last && last.key === key && addDays(last.to, 1) === e.date) last.to = e.date;
    else runs.push({ from: e.date, to: e.date, key });
  }
  return runs.map((r) => `${formatShort(r.from)}${r.to !== r.from ? ` \u2013 ${formatShort(r.to)}` : ""} (${r.key})`).join(", ");
}
__name(compactSkips, "compactSkips");
function isWorkingDay(opts) {
  const { regime: regime2, province: province2 } = resolve(opts);
  checkDate(opts.date, "date");
  const s = step(opts.date, regime2, province2);
  return envelope("is-working-day", regime2, province2, { date: opts.date }, {
    result: s.working,
    reasons: s.reasons.map((r) => r.label),
    summary: s.working ? `${formatLong(opts.date)} is a working day under ${regime2.the}.` : `${formatLong(opts.date)} is not a working day under ${regime2.the}: ${s.reasons.map((r) => r.label).join("; ")}.`
  });
}
__name(isWorkingDay, "isWorkingDay");
function addWorkingDays(opts) {
  const { regime: regime2, province: province2 } = resolve(opts);
  const from = opts.from;
  checkDate(from, "from");
  checkCount(opts.days);
  const days = opts.days;
  const direction = opts.direction === "before" ? "before" : "after";
  const startRule = opts.startRule === "on" && direction === "after" ? "on" : "after";
  const sign = direction === "before" ? -1 : 1;
  const trigger = { ...step(from, regime2, province2), role: "trigger" };
  const trace = [trigger];
  let count = 0;
  let current = from;
  if (startRule === "on" && trigger.working && days > 0) {
    count = 1;
    trigger.n = 1;
  }
  while (count < days) {
    current = addDays(current, sign);
    if (current < FIRST_DATE || current > LAST_DATE) {
      throw new RangeError(`The count runs past the dates Duly covers (${FIRST_DATE} to ${LAST_DATE}).`);
    }
    const s = step(current, regime2, province2);
    if (s.working) s.n = ++count;
    trace.push(s);
  }
  const result = days === 0 ? from : current;
  const excluded = excludedSummary(trace);
  const counted = days === 0 ? 0 : days;
  const phrase = direction === "before" ? `${counted} working day${counted === 1 ? "" : "s"} before ${formatLong(from)}` : startRule === "on" ? `${counted} working day${counted === 1 ? "" : "s"} counting ${formatLong(from)} as day 1` : `${counted} working day${counted === 1 ? "" : "s"} after ${formatLong(from)}`;
  const resultIsWorking = step(result, regime2, province2).working;
  const notes = countedHolidayNotes(trace, regime2);
  if (days === 0) notes.push("Zero working days: the answer is the start date itself.");
  else if (direction === "after" && !trigger.working) {
    notes.push(`${formatLong(from)} is not itself a working day (${trigger.reasons.map((r) => r.label).join("; ")}); counting starts from the next working day either way.`);
  }
  return envelope("deadline", regime2, province2, { from, days, direction, startRule }, {
    result,
    resultLong: formatLong(result),
    resultIsWorkingDay: resultIsWorking,
    calendarDays: Math.abs(diffDays(from, result)),
    excluded,
    summary: `Under ${regime2.the} (${regime2.citation}), ${phrase} is ${formatLong(result)}.` + (excluded.list.length ? ` Skipped besides weekends: ${compactSkips(excluded.list)}.` : ""),
    countingNotes: notes,
    trace: opts.trace === false ? void 0 : trace
  });
}
__name(addWorkingDays, "addWorkingDays");
function countWorkingDays(opts) {
  const { regime: regime2, province: province2 } = resolve(opts);
  checkDate(opts.from, "from");
  checkDate(opts.to, "to");
  const { from, to } = opts;
  if (to < from) throw new RangeError('"to" must be on or after "from"');
  if (diffDays(from, to) > MAX_DAYS * 2) throw new RangeError("Date range too long");
  const trace = [{ ...step(from, regime2, province2), role: "trigger" }];
  let n = 0;
  for (let d = addDays(from, 1); d <= to; d = addDays(d, 1)) {
    const s = step(d, regime2, province2);
    if (s.working) s.n = ++n;
    trace.push(s);
  }
  const excluded = excludedSummary(trace);
  return envelope("count", regime2, province2, { from, to }, {
    result: n,
    calendarDays: diffDays(from, to),
    excluded,
    summary: `Under ${regime2.the} (${regime2.citation}), there ${n === 1 ? "is" : "are"} ${n} working day${n === 1 ? "" : "s"} after ${formatLong(from)} up to and including ${formatLong(to)}.`,
    countingNotes: countedHolidayNotes(trace, regime2),
    trace: opts.trace === false ? void 0 : trace
  });
}
__name(countWorkingDays, "countWorkingDays");
function addCalendarDays(opts) {
  const roll = normaliseRoll(opts.roll);
  const { regime: regime2, province: province2 } = resolve({ ...opts, requireProvince: roll !== "none" });
  checkDate(opts.from, "from");
  checkCount(opts.days);
  const inclusive = opts.startRule === "on" && opts.days > 0;
  const raw = addDays(opts.from, inclusive ? opts.days - 1 : opts.days);
  checkDate(raw, "result");
  let result = raw;
  const rolledOver = [];
  if (roll !== "none") {
    const stepBy = roll === "previous" ? -1 : 1;
    let s = step(result, regime2, province2);
    while (!s.working) {
      rolledOver.push({ date: result, reasons: s.reasons.map((r) => r.label) });
      result = addDays(result, stepBy);
      checkDate(result, "result");
      s = step(result, regime2, province2);
    }
  }
  const period = `${opts.days} calendar day${opts.days === 1 ? "" : "s"} ${inclusive ? `beginning with ${formatLong(opts.from)} end on` : `after ${formatLong(opts.from)} is`} ${formatLong(raw)}`;
  return envelope("calendar", regime2, province2, { from: opts.from, days: opts.days, roll, startRule: inclusive ? "on" : "after" }, {
    result,
    resultLong: formatLong(result),
    unrolled: raw,
    rolledOver,
    summary: period + (rolledOver.length ? `, which is not a working day under ${regime2.the}, so it moves ${roll === "previous" ? "back" : "forward"} to ${formatLong(result)}.` : ".")
  });
}
__name(addCalendarDays, "addCalendarDays");
function normaliseRoll(roll) {
  if (roll === "next" || roll === "next-working-day" || roll === true) return "next";
  if (roll === "previous" || roll === "previous-working-day") return "previous";
  return "none";
}
__name(normaliseRoll, "normaliseRoll");

// src/worker/http.js
var CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Authorization, Content-Type, X-Api-Key, Mcp-Session-Id, MCP-Protocol-Version",
  "Access-Control-Expose-Headers": "X-Duly-Plan, Mcp-Session-Id",
  "Access-Control-Max-Age": "86400"
};
function json(body, status = 200, headers = {}) {
  return new Response(JSON.stringify(body, null, 2), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", ...CORS, ...headers }
  });
}
__name(json, "json");
function problem(status, message, extra = {}) {
  return json({ error: { status, message, ...extra } }, status);
}
__name(problem, "problem");
function html(body, status = 200) {
  return new Response(body, {
    status,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Robots-Tag": "noindex",
      "Referrer-Policy": "no-referrer"
    }
  });
}
__name(html, "html");
function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
}
__name(escapeHtml, "escapeHtml");
function page(title, body) {
  return `<!doctype html><html lang="en-NZ"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escapeHtml(title)} \xB7 Duly</title>
<meta name="robots" content="noindex">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="stylesheet" href="/assets/duly.css">
</head><body class="plain"><header class="bar"><a class="brand" href="/">Duly<span class="brand-dot">.</span></a></header>
<main class="wrap narrow">${body}</main></body></html>`;
}
__name(page, "page");
async function readParams(request, url) {
  const params = Object.fromEntries(url.searchParams);
  if (request.method === "POST") {
    const type = request.headers.get("content-type") || "";
    if (type.includes("application/json")) {
      let body;
      try {
        body = await request.json();
      } catch {
        throw new HttpError(400, "Body is not valid JSON");
      }
      if (body && typeof body === "object" && !Array.isArray(body)) Object.assign(params, body);
      else if (Array.isArray(body)) return body;
    } else if (type.includes("form")) {
      Object.assign(params, Object.fromEntries(await request.formData()));
    }
  }
  return params;
}
__name(readParams, "readParams");
var HttpError = class extends Error {
  static {
    __name(this, "HttpError");
  }
  constructor(status, message) {
    super(message);
    this.status = status;
  }
};

// src/worker/billing.js
var API = "https://api.stripe.com/v1";
var PLAN_LOOKUP = /^duly_(pro|platform)_(monthly|yearly)$/;
var ACTIVE = /* @__PURE__ */ new Set(["active", "trialing", "past_due"]);
var CLAIM_TTL = 60 * 60 * 24;
function planFromLookup(lookup) {
  const m = PLAN_LOOKUP.exec(lookup || "");
  return m ? m[1] : null;
}
__name(planFromLookup, "planFromLookup");
function form(obj, prefix = "", out = new URLSearchParams()) {
  for (const [k, v] of Object.entries(obj)) {
    const key = prefix ? `${prefix}[${k}]` : k;
    if (v === void 0 || v === null) continue;
    if (typeof v === "object") form(v, key, out);
    else out.append(key, String(v));
  }
  return out;
}
__name(form, "form");
async function stripe(env, method, path, params) {
  if (!env.STRIPE_SECRET_KEY) throw new HttpError(503, "Payments are not switched on yet. Email kris@singhstudio.co.nz and I will set you up by hand.");
  const url = new URL(API + path);
  const init = { method, headers: { Authorization: `Bearer ${env.STRIPE_SECRET_KEY}` } };
  if (params && method === "GET") url.search = form(params).toString();
  if (params && method !== "GET") {
    init.body = form(params);
    init.headers["Content-Type"] = "application/x-www-form-urlencoded";
  }
  const res = await fetch(url, init);
  const body = await res.json();
  if (!res.ok) throw new HttpError(res.status >= 500 ? 502 : 400, body?.error?.message || "Stripe request failed");
  return body;
}
__name(stripe, "stripe");
async function sha256(text) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}
__name(sha256, "sha256");
function newKey(live = true) {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  let s = "";
  for (const b of bytes) s += alphabet[b % alphabet.length];
  return `duly_${live ? "live" : "test"}_${s}`;
}
__name(newKey, "newKey");
async function checkout(request, env, url) {
  const m = /^\/checkout\/(pro|platform)-(monthly|yearly)$/.exec(url.pathname);
  if (!m) throw new HttpError(404, "Unknown plan");
  if (!env.STRIPE_SECRET_KEY || !env.KEYS) {
    return html(page("Coming soon", `<h1>Almost ready</h1><p class="lede">Paid plans open shortly. Email <a href="mailto:kris@singhstudio.co.nz?subject=Duly%20${m[1]}%20plan">kris@singhstudio.co.nz</a> and I\u2019ll set you up by hand today.</p><p><a class="btn" href="/pricing/">Back to pricing</a></p>`), 503);
  }
  const lookup = `duly_${m[1]}_${m[2]}`;
  const prices = await stripe(env, "GET", "/prices", { "lookup_keys[]": lookup, active: "true" });
  const price = prices.data?.[0];
  if (!price) throw new HttpError(503, `No Stripe price has the lookup key ${lookup} yet`);
  const origin = url.origin;
  const session = await stripe(env, "POST", "/checkout/sessions", {
    mode: "subscription",
    line_items: { 0: { price: price.id, quantity: 1 } },
    success_url: `${origin}/claim?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/pricing/`,
    allow_promotion_codes: "true",
    billing_address_collection: "auto",
    tax_id_collection: { enabled: "true" },
    automatic_tax: env.STRIPE_AUTOMATIC_TAX === "true" ? { enabled: "true" } : void 0,
    subscription_data: { metadata: { product: "duly", plan: m[1] } }
  });
  return Response.redirect(session.url, 303);
}
__name(checkout, "checkout");
async function claim(request, env, url) {
  const sessionId = url.searchParams.get("session_id") || "";
  if (!/^cs_(test|live)_[A-Za-z0-9]+$/.test(sessionId)) throw new HttpError(400, "Missing or malformed session_id");
  if (!env.KEYS) throw new HttpError(503, "API keys are not enabled on this deployment yet");
  let key = await env.KEYS.get(`claim:${sessionId}`);
  let plan;
  if (!key) {
    const s = await stripe(env, "GET", `/checkout/sessions/${sessionId}`, { "expand[]": "line_items" });
    if (s.status !== "complete" || !["paid", "no_payment_required"].includes(s.payment_status) || s.mode !== "subscription" || !s.subscription) {
      throw new HttpError(402, "That checkout is not complete yet. If you have just paid, refresh in a few seconds.");
    }
    const lookup = s.line_items?.data?.[0]?.price?.lookup_key;
    plan = planFromLookup(lookup);
    if (!plan) throw new HttpError(500, "Paid for an unrecognised plan; email kris@singhstudio.co.nz");
    const subscription = typeof s.subscription === "string" ? s.subscription : s.subscription.id;
    const customer = typeof s.customer === "string" ? s.customer : s.customer?.id;
    const existing = await env.KEYS.get(`sub:${subscription}`);
    if (existing) {
      return html(page("Key already issued", '<h1>Your key was already issued</h1><p class="lede">For security a key is shown once. If you have lost it, email kris@singhstudio.co.nz from the address you paid with and I\u2019ll rotate it.</p>'), 409);
    }
    key = newKey(sessionId.startsWith("cs_live_"));
    const hash = await sha256(key);
    await env.KEYS.put(`key:${hash}`, JSON.stringify({
      plan,
      status: "active",
      subscription,
      customer,
      lookup,
      created: (/* @__PURE__ */ new Date()).toISOString(),
      email: s.customer_details?.email || null
    }));
    await env.KEYS.put(`sub:${subscription}`, hash);
    await env.KEYS.put(`claim:${sessionId}`, key, { expirationTtl: CLAIM_TTL });
  } else {
    const rec = await env.KEYS.get(`key:${await sha256(key)}`, "json");
    plan = rec?.plan;
  }
  const origin = url.origin;
  return html(page("Your API key", `
<p class="eyebrow">/ ${escapeHtml(plan === "platform" ? "Platform" : "Pro")} plan active</p>
<h1>Here\u2019s your API key</h1>
<p class="lede">Copy it somewhere safe now. It won\u2019t be shown again after today.</p>
<div class="keybox"><code id="k">${escapeHtml(key)}</code><button class="btn" type="button" onclick="navigator.clipboard.writeText(document.getElementById('k').textContent);this.textContent='Copied'">Copy</button></div>
<h2>Try it</h2>
<pre><code>curl -H "Authorization: Bearer ${escapeHtml(key)}" \\
  "${escapeHtml(origin)}/v1/deadline?regime=oia&amp;from=2026-12-01&amp;days=20"</code></pre>
<h2>Connect an AI assistant (MCP)</h2>
<pre><code>${escapeHtml(origin)}/mcp/k/${escapeHtml(key)}</code></pre>
<p>Or send the key as an <code>Authorization: Bearer</code> header to <code>${escapeHtml(origin)}/mcp</code>.</p>
<p><a href="/developers/">Developer docs</a> \xB7 <a href="/billing">Manage billing</a></p>`));
}
__name(claim, "claim");
async function verifyStripeSignature(payload, header, secret, toleranceSec = 300, now = Date.now()) {
  if (!header || !secret) return false;
  const parts = Object.fromEntries(header.split(",").map((p) => p.split("=")).filter((p) => p.length === 2).map(([k, v]) => [k.trim(), v.trim()]));
  const sigs = header.split(",").filter((p) => p.trim().startsWith("v1=")).map((p) => p.trim().slice(3));
  const t = Number(parts.t);
  if (!t || !sigs.length || Math.abs(now / 1e3 - t) > toleranceSec) return false;
  const cryptoKey = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const mac = new Uint8Array(await crypto.subtle.sign("HMAC", cryptoKey, new TextEncoder().encode(`${t}.${payload}`)));
  const expected = [...mac].map((b) => b.toString(16).padStart(2, "0")).join("");
  return sigs.some((sig) => timingSafeEqual(sig, expected));
}
__name(verifyStripeSignature, "verifyStripeSignature");
function timingSafeEqual(a, b) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}
__name(timingSafeEqual, "timingSafeEqual");
async function webhook(request, env) {
  if (request.method !== "POST") throw new HttpError(405, "POST only");
  const payload = await request.text();
  const ok = await verifyStripeSignature(payload, request.headers.get("stripe-signature"), env.STRIPE_WEBHOOK_SECRET);
  if (!ok) throw new HttpError(400, "Bad signature");
  const event = JSON.parse(payload);
  if (!event.type?.startsWith("customer.subscription.") || !env.KEYS) return new Response("ignored", { status: 200 });
  const sub = event.data.object;
  const hash = await env.KEYS.get(`sub:${sub.id}`);
  if (!hash) return new Response("unknown subscription", { status: 200 });
  const rec = await env.KEYS.get(`key:${hash}`, "json") || {};
  const lookup = sub.items?.data?.[0]?.price?.lookup_key;
  const status = event.type === "customer.subscription.deleted" || !ACTIVE.has(sub.status) ? "inactive" : "active";
  await env.KEYS.put(`key:${hash}`, JSON.stringify({
    ...rec,
    status,
    stripeStatus: sub.status,
    plan: planFromLookup(lookup) || rec.plan,
    lookup: lookup || rec.lookup,
    updated: (/* @__PURE__ */ new Date()).toISOString()
  }));
  return new Response("ok", { status: 200 });
}
__name(webhook, "webhook");
async function billing(request, env, url) {
  if (request.method === "GET") {
    return html(page("Manage billing", `<h1>Manage billing</h1>
<p class="lede">Paste your API key to open the Stripe billing portal, where you can change plan, update your card, download invoices or cancel.</p>
<form method="post" class="stack"><label>API key<input name="key" required autocomplete="off" spellcheck="false" placeholder="duly_live_\u2026"></label><button class="btn" type="submit">Open billing portal</button></form>`));
  }
  const key = String((await request.formData()).get("key") || "").trim();
  if (!env.KEYS) throw new HttpError(503, "Billing is not enabled on this deployment yet");
  const rec = await env.KEYS.get(`key:${await sha256(key)}`, "json");
  if (!rec?.customer) throw new HttpError(404, "No subscription found for that key");
  const portal = await stripe(env, "POST", "/billing_portal/sessions", { customer: rec.customer, return_url: `${url.origin}/pricing/` });
  return Response.redirect(portal.url, 303);
}
__name(billing, "billing");

// src/worker/ops.js
function int(v, name) {
  const n = typeof v === "number" ? v : Number(String(v ?? "").trim());
  if (v === void 0 || v === null || v === "" || !Number.isInteger(n)) throw new HttpError(400, `"${name}" must be a whole number`);
  return n;
}
__name(int, "int");
function req(v, name) {
  if (v === void 0 || v === null || v === "") throw new HttpError(400, `"${name}" is required`);
  return String(v);
}
__name(req, "req");
function bool(v, dflt) {
  if (v === void 0 || v === null || v === "") return dflt;
  return v === true || v === "true" || v === "1" || v === 1;
}
__name(bool, "bool");
function regimeInfo(r, full = false) {
  const base2 = {
    id: r.id,
    short: r.short,
    title: r.title,
    citation: r.citation,
    url: r.url,
    status: r.status,
    family: r.family,
    rules: describeRules(r),
    needsProvince: r.rules.anniversary === "location"
  };
  if (!full) return base2;
  return { ...base2, definition: r.definition, presets: r.presets, notes: r.notes || [] };
}
__name(regimeInfo, "regimeInfo");
var OPS = {
  regimes: /* @__PURE__ */ __name(() => ({
    regimes: REGIMES.map((r) => regimeInfo(r)),
    provinces: PROVINCES.map(({ id, name, rule, areas }) => ({ id, name, rule, areas })),
    engine: { version: ENGINE_VERSION, rulesVerified: RULES_VERIFIED }
  }), "regimes"),
  regime: /* @__PURE__ */ __name((p) => regimeInfo(getRegime(req(p.id ?? p.regime, "regime")), true), "regime"),
  deadline: /* @__PURE__ */ __name((p) => addWorkingDays({
    regime: req(p.regime, "regime"),
    from: req(p.from, "from"),
    days: int(p.days, "days"),
    direction: p.direction === "before" ? "before" : "after",
    startRule: p.start_rule === "on" || p.startRule === "on" ? "on" : "after",
    province: p.province || void 0,
    trace: bool(p.trace, false)
  }), "deadline"),
  count: /* @__PURE__ */ __name((p) => countWorkingDays({
    regime: req(p.regime, "regime"),
    from: req(p.from, "from"),
    to: req(p.to, "to"),
    province: p.province || void 0,
    trace: bool(p.trace, false)
  }), "count"),
  "is-working-day": /* @__PURE__ */ __name((p) => isWorkingDay({
    regime: req(p.regime, "regime"),
    date: req(p.date, "date"),
    province: p.province || void 0
  }), "is-working-day"),
  "calendar-days": /* @__PURE__ */ __name((p) => addCalendarDays({
    regime: p.regime || "legislation-act",
    from: req(p.from, "from"),
    days: int(p.days, "days"),
    roll: p.roll,
    startRule: p.start_rule === "on" || p.startRule === "on" ? "on" : "after",
    province: p.province || void 0
  }), "calendar-days"),
  holidays: /* @__PURE__ */ __name((p) => {
    const year = int(p.year ?? (/* @__PURE__ */ new Date()).getUTCFullYear(), "year");
    const national = nationalHolidays(year).map(({ key, name, date: date2, mondayised, actual }) => ({
      key,
      name,
      date: date2,
      ...mondayised ? { mondayised: true, actual } : {}
    }));
    const provinces = (p.province ? [p.province] : PROVINCES.map((x) => x.id)).map((id) => {
      const a = anniversaryDay(id, year);
      return { province: id, name: a.name, date: a.date, rule: a.rule, ...a.note ? { note: a.note } : {}, ...a.exception ? { exception: a.exception } : {} };
    });
    return { year, national, anniversary: provinces };
  }, "holidays")
};
function runOp(name, params) {
  const op = OPS[name];
  if (!op) throw new HttpError(404, `Unknown operation "${name}"`);
  try {
    return op(params || {});
  } catch (e) {
    if (e instanceof HttpError) throw e;
    if (e instanceof RangeError || e instanceof TypeError) throw new HttpError(400, e.message);
    throw e;
  }
}
__name(runOp, "runOp");

// src/worker/mcp.js
var PROTOCOL_VERSIONS = ["2025-11-25", "2025-06-18", "2025-03-26", "2024-11-05"];
var date = { type: "string", pattern: "^\\d{4}-\\d{2}-\\d{2}$", description: "Calendar date, YYYY-MM-DD (2023-01-01 to 2052-12-31)" };
var regime = {
  type: "string",
  enum: REGIME_IDS,
  description: 'Which definition of "working day" applies. ' + REGIMES.map((r) => `${r.id} = ${r.short}`).join("; ")
};
var province = {
  type: "string",
  enum: PROVINCE_IDS,
  description: "Provincial anniversary day to exclude, for regimes that depend on where the property, premises or site is (Duly says when it is required)."
};
var READ_ONLY = { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false };
var TOOLS = [
  {
    name: "nz_deadline",
    title: "NZ statutory deadline",
    description: 'Work out the date that is N working days after (or before) a date under a specific New Zealand Act or standard contract. Use this for any NZ timeframe stated in working days: Official Information Act and LGOIMA requests, Privacy Act requests, resource and building consents, tenancy notices, sale and purchase agreement conditions, construction payment schedules, court filings, company and tax deadlines. Each Act defines "working day" differently (the OIA skips 25 Dec\u201315 Jan, the RMA 20 Dec\u201310 Jan, some include provincial anniversary days), so do not count by hand. Returns the date, every skipped day with its reason, and the citation. Day 1 is the first working day after the start date unless start_rule is "on".',
    inputSchema: {
      type: "object",
      properties: {
        regime,
        from: { ...date, description: "The trigger date, e.g. the day a request was received or a notice was served" },
        days: { type: "integer", minimum: 0, maximum: 2e3, description: "Number of working days" },
        direction: { type: "string", enum: ["after", "before"], default: "after" },
        start_rule: { type: "string", enum: ["after", "on"], default: "after", description: '"after": day 1 is the next working day (statutory default). "on": the start date counts as day 1.' },
        province
      },
      required: ["regime", "from", "days"],
      additionalProperties: false
    },
    annotations: { title: "NZ statutory deadline", ...READ_ONLY },
    op: "deadline"
  },
  {
    name: "nz_count_working_days",
    title: "Count NZ working days",
    description: 'Count the working days after one date up to and including another, under a specific New Zealand definition of "working day". Use it to check how much of a statutory period has elapsed or whether a response was on time.',
    inputSchema: {
      type: "object",
      properties: { regime, from: date, to: date, province },
      required: ["regime", "from", "to"],
      additionalProperties: false
    },
    annotations: { title: "Count NZ working days", ...READ_ONLY },
    op: "count"
  },
  {
    name: "nz_is_working_day",
    title: "Is it an NZ working day?",
    description: "Say whether a date is a working day under a specific New Zealand definition, and if not, why (weekend, which public holiday, the Christmas period, or an anniversary day).",
    inputSchema: {
      type: "object",
      properties: { regime, date, province },
      required: ["regime", "date"],
      additionalProperties: false
    },
    annotations: { title: "Is it an NZ working day?", ...READ_ONLY },
    op: "is-working-day"
  },
  {
    name: "nz_calendar_deadline",
    title: "NZ calendar-day deadline",
    description: 'Add calendar days to a date (e.g. 42 or 90 days for tenancy notices, 60 days for a rent increase, 90 days to raise a personal grievance) and optionally move the answer to the next working day (Legislation Act s 55, IRD due dates) or the previous one (sale and purchase agreement cl 1.3(1)) if it is not a working day under the chosen regime. Use start_rule "on" for periods "beginning with" a day.',
    inputSchema: {
      type: "object",
      properties: {
        from: date,
        days: { type: "integer", minimum: 0, maximum: 2e3 },
        roll: { type: "string", enum: ["none", "next", "previous"], default: "none" },
        start_rule: { type: "string", enum: ["after", "on"], default: "after", description: '"on" for periods beginning with the start date (it counts as day 1)' },
        regime: { ...regime, description: "Definition used to decide whether the answer is a working day (default legislation-act)" },
        province
      },
      required: ["from", "days"],
      additionalProperties: false
    },
    annotations: { title: "NZ calendar-day deadline", ...READ_ONLY },
    op: "calendar-days"
  },
  {
    name: "nz_public_holidays",
    title: "NZ public holidays",
    description: "List New Zealand public holidays for a year (2010\u20132052), including Mondayised observances, Matariki, and provincial anniversary days with the rule each follows.",
    inputSchema: {
      type: "object",
      properties: { year: { type: "integer", minimum: 2010, maximum: 2052 }, province },
      required: ["year"],
      additionalProperties: false
    },
    annotations: { title: "NZ public holidays", ...READ_ONLY },
    op: "holidays"
  },
  {
    name: "nz_working_day_definitions",
    title: "NZ working-day definitions",
    description: 'List every definition of "working day" Duly supports, with its statute and section, what it excludes, and common timeframes. Call this first if unsure which regime applies.',
    inputSchema: { type: "object", properties: {}, additionalProperties: false },
    annotations: { title: "NZ working-day definitions", ...READ_ONLY },
    op: "regimes"
  }
];
var BY_NAME = Object.fromEntries(TOOLS.map((t) => [t.name, t]));
var INSTRUCTIONS = 'Duly answers New Zealand date questions that depend on statutory definitions of "working day". Prefer nz_deadline over counting days yourself. Quote the returned summary and citation, mention any notes, and remind the user to check the timeframe section of the Act for their situation. Duly is not legal advice.';
function rpcResult(id, result) {
  return { jsonrpc: "2.0", id, result };
}
__name(rpcResult, "rpcResult");
function rpcError(id, code, message) {
  return { jsonrpc: "2.0", id: id ?? null, error: { code, message } };
}
__name(rpcError, "rpcError");
function toolText(name, out) {
  if (name === "nz_working_day_definitions") {
    return out.regimes.map((r) => `${r.id}: ${r.short} \u2014 ${r.title} (${r.citation}). Excludes ${r.rules}.`).join("\n");
  }
  if (name === "nz_public_holidays") {
    const lines = out.national.map((h) => `${h.date} ${h.name}${h.mondayised ? ` (observed; actual ${h.actual})` : ""}`);
    const anniv = out.anniversary.map((a) => `${a.date} ${a.name} \u2014 ${a.rule}`);
    return `New Zealand public holidays ${out.year}:
${lines.join("\n")}
Provincial anniversary days:
${anniv.join("\n")}`;
  }
  const notes = [...out.countingNotes || [], ...out.notes || []];
  return `${out.summary}${notes.length ? `
Notes: ${notes.join(" ")}` : ""}
Source: ${out.regime.citation} ${out.regime.url}
Computed by Duly ${out.engine.version} (rules verified ${out.engine.rulesVerified}). Not legal advice.`;
}
__name(toolText, "toolText");
function handleRpc(msg) {
  if (!msg || msg.jsonrpc !== "2.0" || typeof msg.method !== "string") return rpcError(msg?.id, -32600, "Invalid Request");
  const { id, method, params } = msg;
  const isNotification = id === void 0;
  switch (method) {
    case "initialize": {
      const asked = params?.protocolVersion;
      const protocolVersion = PROTOCOL_VERSIONS.includes(asked) ? asked : PROTOCOL_VERSIONS[0];
      return rpcResult(id, {
        protocolVersion,
        capabilities: { tools: { listChanged: false } },
        serverInfo: { name: "duly", title: "Duly: New Zealand statutory deadlines", version: ENGINE_VERSION },
        instructions: INSTRUCTIONS
      });
    }
    case "ping":
      return isNotification ? null : rpcResult(id, {});
    case "tools/list":
      return rpcResult(id, { tools: TOOLS.map(({ op, ...t }) => t) });
    case "tools/call": {
      const tool = BY_NAME[params?.name];
      if (!tool) return rpcError(id, -32602, `Unknown tool: ${params?.name}`);
      try {
        const out = runOp(tool.op, params.arguments || {});
        if (out.trace === void 0) delete out.trace;
        return rpcResult(id, { content: [{ type: "text", text: toolText(tool.name, out) }], structuredContent: out, isError: false });
      } catch (e) {
        if (e instanceof HttpError) return rpcResult(id, { content: [{ type: "text", text: e.message }], isError: true });
        throw e;
      }
    }
    default:
      if (isNotification) return null;
      return rpcError(id, -32601, `Method not found: ${method}`);
  }
}
__name(handleRpc, "handleRpc");
async function handleMcp(request) {
  if (request.method === "GET" || request.method === "DELETE") {
    return new Response(null, { status: 405, headers: { Allow: "POST, OPTIONS", ...CORS } });
  }
  if (request.method !== "POST") return new Response(null, { status: 405, headers: CORS });
  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json(rpcError(null, -32700, "Parse error"), { status: 400, headers: CORS });
  }
  const batch = Array.isArray(body);
  const replies = (batch ? body : [body]).map(handleRpc).filter(Boolean);
  if (!replies.length) return new Response(null, { status: 202, headers: CORS });
  return new Response(JSON.stringify(batch ? replies : replies[0]), {
    status: 200,
    headers: { "Content-Type": "application/json", ...CORS }
  });
}
__name(handleMcp, "handleMcp");

// src/worker/index.js
var KEY_RE = /^duly_(live|test)_[A-Za-z0-9]{24,64}$/;
var BATCH_LIMIT = { free: 0, pro: 100, platform: 500 };
var keyCache = /* @__PURE__ */ new Map();
function presentedKey(request, url) {
  const auth = request.headers.get("authorization") || "";
  if (auth.toLowerCase().startsWith("bearer ")) return auth.slice(7).trim();
  const header = request.headers.get("x-api-key");
  if (header) return header.trim();
  const m = /^\/mcp\/k\/([^/]+)$/.exec(url.pathname);
  return m ? decodeURIComponent(m[1]) : null;
}
__name(presentedKey, "presentedKey");
async function identify(request, env, url) {
  const key = presentedKey(request, url);
  if (!key) return { plan: "free", id: request.headers.get("cf-connecting-ip") || "anonymous" };
  if (!KEY_RE.test(key)) throw new HttpError(401, "That does not look like a Duly API key");
  if (!env.KEYS) throw new HttpError(503, "API keys are not enabled on this deployment yet");
  const hash = await sha256(key);
  const hit = keyCache.get(hash);
  let rec = hit && hit.until > Date.now() ? hit.rec : null;
  if (!rec) {
    rec = await env.KEYS.get(`key:${hash}`, "json");
    keyCache.set(hash, { rec, until: Date.now() + 6e4 });
  }
  if (!rec) throw new HttpError(401, "Unknown API key");
  if (rec.status !== "active") throw new HttpError(402, "The subscription for this key is not active. Manage it at /billing");
  return { plan: rec.plan, id: hash.slice(0, 24) };
}
__name(identify, "identify");
async function rateLimit(env, who) {
  const limiter = env[`RL_${who.plan.toUpperCase()}`];
  if (!limiter) return;
  const { success } = await limiter.limit({ key: who.id });
  if (!success) {
    throw new HttpError(429, who.plan === "free" ? "Free tier limit reached (per minute). Add an API key for higher limits: /pricing/" : "Rate limit reached for your plan; slow down for a minute.");
  }
}
__name(rateLimit, "rateLimit");
function track(env, who, endpoint, regime2) {
  try {
    env.USAGE?.writeDataPoint({ blobs: [who.plan, endpoint, regime2 || ""], doubles: [1], indexes: [who.plan === "free" ? "free" : who.id] });
  } catch {
  }
}
__name(track, "track");
var ROUTES = {
  "/v1/regimes": "regimes",
  "/v1/deadline": "deadline",
  "/v1/count": "count",
  "/v1/is-working-day": "is-working-day",
  "/v1/calendar-days": "calendar-days",
  "/v1/holidays": "holidays"
};
async function api(request, env, url) {
  const who = await identify(request, env, url);
  await rateLimit(env, who);
  const headers = { "X-Duly-Plan": who.plan };
  const path = url.pathname.replace(/\/+$/, "") || "/v1";
  if (path === "/v1") {
    return json({
      name: "Duly API",
      docs: `${url.origin}/developers/`,
      endpoints: Object.keys(ROUTES).concat("/v1/regimes/{id}", "/v1/batch (POST, paid plans)"),
      mcp: `${url.origin}/mcp`
    }, 200, headers);
  }
  const regimeMatch = /^\/v1\/regimes\/([a-z0-9-]+)$/.exec(path);
  if (regimeMatch) return json(runOp("regime", { id: regimeMatch[1] }), 200, headers);
  if (path === "/v1/batch") {
    if (request.method !== "POST") throw new HttpError(405, 'POST a JSON array of {"op": \u2026, \u2026params}');
    const limit = BATCH_LIMIT[who.plan] || 0;
    if (!limit) throw new HttpError(402, "Batch requests need a Pro or Platform key: /pricing/");
    const items = await readParams(request, url);
    const list = Array.isArray(items) ? items : items.requests;
    if (!Array.isArray(list)) throw new HttpError(400, 'Send a JSON array, or {"requests": [...]}');
    if (list.length > limit) throw new HttpError(413, `Your plan allows ${limit} items per batch`);
    const results = list.map((item) => {
      try {
        return { ok: true, result: runOp(item.op, item) };
      } catch (e) {
        return { ok: false, error: e.message };
      }
    });
    track(env, who, "batch");
    return json({ results }, 200, headers);
  }
  const op = ROUTES[path];
  if (!op) throw new HttpError(404, `No such endpoint: ${path}. See ${url.origin}/developers/`);
  const params = await readParams(request, url);
  if (Array.isArray(params)) throw new HttpError(400, "Send one JSON object (use /v1/batch for many)");
  const result = runOp(op, params);
  track(env, who, op, params.regime);
  if (op === "holidays" && params.format === "ics") {
    const events = result.national.map((h) => ({ uid: `${h.date}-${h.key}`, date: h.date, summary: h.name + (h.mondayised ? " (observed)" : "") })).concat(result.anniversary.map((a) => ({ uid: `${a.date}-${a.province}`, date: a.date, summary: a.name })));
    return new Response(toICS({ name: `NZ public holidays ${result.year}`, events, stamp: RULES_VERIFIED, domain: url.hostname }), {
      headers: { "Content-Type": "text/calendar; charset=utf-8", ...CORS, ...headers }
    });
  }
  return json(result, 200, headers);
}
__name(api, "api");
async function mcp(request, env, url) {
  if (request.method === "POST") {
    const who = await identify(request, env, url);
    await rateLimit(env, who);
    track(env, who, "mcp");
  }
  return handleMcp(request);
}
__name(mcp, "mcp");
var worker_default = {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;
    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS });
    try {
      if (path === "/mcp" || path.startsWith("/mcp/")) return await mcp(request, env, url);
      if (path === "/v1" || path.startsWith("/v1/")) return await api(request, env, url);
      if (path.startsWith("/checkout/")) return await checkout(request, env, url);
      if (path === "/claim") return await claim(request, env, url);
      if (path === "/billing") return await billing(request, env, url);
      if (path === "/webhooks/stripe") return await webhook(request, env);
      return env.ASSETS ? env.ASSETS.fetch(request) : new Response("Not found", { status: 404 });
    } catch (e) {
      if (e instanceof HttpError) return problem(e.status, e.message);
      console.error(e);
      return problem(500, "Something went wrong on our side. Please try again.");
    }
  }
};

// ../../../../../root/.npm/_npx/c943b712072b77c4/node_modules/wrangler/templates/middleware/middleware-ensure-req-body-drained.ts
var drainBody = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } finally {
    try {
      if (request.body !== null && !request.bodyUsed) {
        const reader = request.body.getReader();
        while (!(await reader.read()).done) {
        }
      }
    } catch (e) {
      console.error("Failed to drain the unused request body.", e);
    }
  }
}, "drainBody");
var middleware_ensure_req_body_drained_default = drainBody;

// ../../../../../root/.npm/_npx/c943b712072b77c4/node_modules/wrangler/templates/middleware/middleware-miniflare3-json-error.ts
function reduceError(e) {
  return {
    name: e?.name,
    message: e?.message ?? String(e),
    stack: e?.stack,
    cause: e?.cause === void 0 ? void 0 : reduceError(e.cause)
  };
}
__name(reduceError, "reduceError");
var jsonError = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } catch (e) {
    const error = reduceError(e);
    const body = JSON.stringify(error);
    const headers = {
      "Content-Type": "application/json",
      "MF-Experimental-Error-Stack": "true"
    };
    const encoded = encodeURIComponent(body);
    if (encoded.length <= 8192) {
      headers["MF-Experimental-Error-Stack-Payload"] = encoded;
    }
    return new Response(body, { status: 500, headers });
  }
}, "jsonError");
var middleware_miniflare3_json_error_default = jsonError;

// .wrangler/tmp/bundle-3PicDC/middleware-insertion-facade.js
var __INTERNAL_WRANGLER_MIDDLEWARE__ = [
  middleware_ensure_req_body_drained_default,
  middleware_miniflare3_json_error_default
];
var middleware_insertion_facade_default = worker_default;

// ../../../../../root/.npm/_npx/c943b712072b77c4/node_modules/wrangler/templates/middleware/common.ts
var __facade_middleware__ = [];
function __facade_register__(...args) {
  __facade_middleware__.push(...args.flat());
}
__name(__facade_register__, "__facade_register__");
function __facade_invokeChain__(request, env, ctx, dispatch, middlewareChain) {
  const [head, ...tail] = middlewareChain;
  const middlewareCtx = {
    dispatch,
    next(newRequest, newEnv) {
      return __facade_invokeChain__(newRequest, newEnv, ctx, dispatch, tail);
    }
  };
  return head(request, env, ctx, middlewareCtx);
}
__name(__facade_invokeChain__, "__facade_invokeChain__");
function __facade_invoke__(request, env, ctx, dispatch, finalMiddleware) {
  return __facade_invokeChain__(request, env, ctx, dispatch, [
    ...__facade_middleware__,
    finalMiddleware
  ]);
}
__name(__facade_invoke__, "__facade_invoke__");

// .wrangler/tmp/bundle-3PicDC/middleware-loader.entry.ts
var __Facade_ScheduledController__ = class ___Facade_ScheduledController__ {
  constructor(scheduledTime, cron, noRetry) {
    this.scheduledTime = scheduledTime;
    this.cron = cron;
    this.#noRetry = noRetry;
  }
  scheduledTime;
  cron;
  static {
    __name(this, "__Facade_ScheduledController__");
  }
  #noRetry;
  noRetry() {
    if (!(this instanceof ___Facade_ScheduledController__)) {
      throw new TypeError("Illegal invocation");
    }
    this.#noRetry();
  }
};
function wrapExportedHandler(worker) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return worker;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  const fetchDispatcher = /* @__PURE__ */ __name(function(request, env, ctx) {
    if (worker.fetch === void 0) {
      throw new Error("Handler does not export a fetch() function.");
    }
    return worker.fetch(request, env, ctx);
  }, "fetchDispatcher");
  return {
    ...worker,
    fetch(request, env, ctx) {
      const dispatcher = /* @__PURE__ */ __name(function(type, init) {
        if (type === "scheduled" && worker.scheduled !== void 0) {
          const controller = new __Facade_ScheduledController__(
            Date.now(),
            init.cron ?? "",
            () => {
            }
          );
          return worker.scheduled(controller, env, ctx);
        }
      }, "dispatcher");
      return __facade_invoke__(request, env, ctx, dispatcher, fetchDispatcher);
    }
  };
}
__name(wrapExportedHandler, "wrapExportedHandler");
function wrapWorkerEntrypoint(klass) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return klass;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  return class extends klass {
    #fetchDispatcher = /* @__PURE__ */ __name((request, env, ctx) => {
      this.env = env;
      this.ctx = ctx;
      if (super.fetch === void 0) {
        throw new Error("Entrypoint class does not define a fetch() function.");
      }
      return super.fetch(request);
    }, "#fetchDispatcher");
    #dispatcher = /* @__PURE__ */ __name((type, init) => {
      if (type === "scheduled" && super.scheduled !== void 0) {
        const controller = new __Facade_ScheduledController__(
          Date.now(),
          init.cron ?? "",
          () => {
          }
        );
        return super.scheduled(controller);
      }
    }, "#dispatcher");
    fetch(request) {
      return __facade_invoke__(
        request,
        this.env,
        this.ctx,
        this.#dispatcher,
        this.#fetchDispatcher
      );
    }
  };
}
__name(wrapWorkerEntrypoint, "wrapWorkerEntrypoint");
var WRAPPED_ENTRY;
if (typeof middleware_insertion_facade_default === "object") {
  WRAPPED_ENTRY = wrapExportedHandler(middleware_insertion_facade_default);
} else if (typeof middleware_insertion_facade_default === "function") {
  WRAPPED_ENTRY = wrapWorkerEntrypoint(middleware_insertion_facade_default);
}
var middleware_loader_entry_default = WRAPPED_ENTRY;
export {
  OPS,
  __INTERNAL_WRANGLER_MIDDLEWARE__,
  middleware_loader_entry_default as default,
  identify
};
//# sourceMappingURL=index.js.map
