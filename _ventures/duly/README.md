# Duly: New Zealand deadlines, counted properly

**What it is:** a website, JSON API and MCP server that works out New Zealand
statutory deadlines under the definition of “working day” that actually applies.

**Why it can make money while you sleep:** every New Zealand Act defines
“working day” its own way, and nobody has built the one tool that handles all of
them. The OIA stops counting from 25 December to 15 January, the RMA from
20 December to 10 January, and the Construction Contracts Act from 24 December
to 5 January. Some definitions skip the anniversary day of the province where
the property is; others don’t. Some skip Mondayised holidays; some don’t.
Lawyers, conveyancers, councils, property managers, quantity surveyors,
journalists and AI assistants get this wrong every summer. The only free
calculator covers the OIA alone (the Ombudsman’s), and generic “working days”
tools ignore all of it.

Duly is:

1. **Free calculators** (static, zero hosting cost) that rank for searches like
   *OIA deadline calculator*, *RMA working days*, *payment schedule 20 working
   days*, *public holidays 2027* and *Auckland anniversary day 2027*, and that
   people share, because every answer is a permalink receipt showing its working.
2. **A paid API and MCP server** for the software and AI agents that need the
   same answers all day: property-management and practice-management software,
   council systems, legal-AI products, in-house assistants. Self-serve on
   Stripe: pay, receive a key instantly, cancel any time. No accounts, no
   emails to send, nothing to sell by hand.

It is “agent-native” on purpose: AI assistants are bad at date arithmetic and
don’t know NZ’s holiday rules, so an MCP tool that returns a cited, exact
answer is the kind of thing assistants (and the companies building them) will
call and pay for.

## The numbers, honestly

| | |
|---|---|
| Running cost | ~$0. Cloudflare Workers’ free tier covers 100k requests a day; static pages are free and unlimited. Domain ~NZ$35/yr. |
| Your time once live | ~2 hours a year: each December, bump the holiday years and re-check the definitions (a checklist is below). |
| Prices | Free / **Pro NZ$29/mo** (NZ$290/yr) / **Platform NZ$199/mo** (NZ$1,990/yr) |
| Realistic year one | Slow: SEO takes 3–9 months. 10 Pro + 2 Platform subscribers is ≈ NZ$690/mo (≈ NZ$8.3k/yr). One property-management or legal-software platform is worth more than all the small accounts together. |
| Upside levers | Australia (each state has its own holidays and “business day” rules, about 5× the market), personalised IRD due-date calendars, a sponsor slot on the busiest pages. |

This is a compounding asset rather than a jackpot. It costs almost nothing to run
and needs almost no attention, and the moat (correct rules, tests, citations,
search rankings) gets deeper every year it exists.

## What’s built

```
_ventures/duly/
├── src/engine/      Rules engine: pure ES modules, zero dependencies; runs in browser, Worker and Node
│   ├── holidays.js  National holidays, Mondayisation, Matariki to 2052, 12 anniversary days
│   ├── regimes.js   22 definitions of “working day”, with citations and common timeframes
│   ├── definitions.js  The statutory definitions, verbatim (consolidated to 18 Sep 2026)
│   ├── compute.js   Deadlines forwards/backwards, counts, calendar days with roll-forward, full audit trail
│   └── ics.js       Calendar files
├── src/worker/      Cloudflare Worker: REST API (/v1), MCP server (/mcp), Stripe billing, rate limits
├── site/            Static assets (CSS, calculator front-end, fonts, embed.js) and site config
├── scripts/build.js Generates public/ (30 pages, calendar feeds, sitemap, llms.txt) from the engine
├── public/          The built site (committed; CI checks it is up to date)
└── test/            45 tests, including every MBIE holiday table from 2010 to 2027
```

- **Holidays are tested against the official record**: all 187 national
  holiday observations and 216 anniversary days in MBIE’s published tables for
  2010–2027 match. The tests caught two errors in MBIE’s own tables: the weekday
  for Anzac Day 2027, and South Canterbury 2022, which moved because of
  Queen Elizabeth II Memorial Day. Matariki is checked against Te Papa’s
  schedule to 2052.
- **Definitions are quoted, not paraphrased**: each statutory definition is
  verbatim from the Parliamentary Counsel Office’s legislation data
  (consolidated to 18 Sep 2026), and every preset timeframe was checked against
  its section. That check caught things most people (and my first draft) get wrong:
  - the RTA closes **24 Dec–3 Jan** (not 25 Dec–15 Jan) and skips **Good Friday
    to Easter Tuesday**; tenancy.govt.nz’s own example (posted Mon 22 Dec 2025 →
    served Wed 7 Jan 2026) is a test case;
  - an owner moving in now needs **42 days’** notice, not 63;
  - **LGOIMA, the Building Act and the CCA skip the local anniversary day**
    (the Ombudsman’s own LGOIMA calculator doesn’t);
  - the RTA and Property Law Act don’t exclude a New Year holiday observed on
    4 January (2027, 2028), so Duly counts it and tells the user why;
  - IRD due dates move past weekends and holidays but *not* the summer period;
  - the sale and purchase agreement moves non-working dates *back*, and posted
    notices now take 5 working days (edition 2022 (4)).
- **Every answer shows its working**: each skipped day with its reason, the
  citation, the engine version and the date the rules were last checked.
- **The site**: calculator with shareable permalinks, .ics export and print;
  one SEO page per regime with its definition, common timeframes, this summer’s
  closed period and FAQs (with FAQPage schema); holiday pages for 2025–2030;
  subscribable calendar feeds per province; developer docs; pricing; sources
  and changelog; terms; privacy; an embeddable widget.
- **The API and MCP server**: `/v1/deadline`, `/v1/count`,
  `/v1/is-working-day`, `/v1/calendar-days`, `/v1/holidays` (JSON or ICS),
  `/v1/regimes`, `/v1/batch`; six MCP tools over Streamable HTTP; per-minute
  rate limits per plan; usage analytics.
- **Billing with no accounts**: `/checkout/pro-monthly` → Stripe Checkout →
  `/claim` shows the key → webhooks keep the key in step with the subscription →
  `/billing` opens Stripe’s customer portal. Keys are stored only as hashes.

## Run it

```bash
cd _ventures/duly
npm test            # 45 tests, no dependencies to install
npm run build       # regenerate public/
npm run dev         # local Worker + site at http://localhost:8787 (downloads wrangler)
```

## Launch checklist (each step is yours to approve; nothing has been bought, posted or deployed)

1. **Name and domain.** `duly.nz`, `workingdays.nz`, `deadline.nz` and
   `deadlines.nz` had no DNS on 21 Oct 2026, which usually means they are
   unregistered. Register `duly.nz` (and optionally `workingdays.nz` to
   redirect). If you pick another name, change `origin` in `site/site.json`
   and run `npm run build`.
2. **Spot-check the law (30–45 min).** legislation.govt.nz blocks automated
   access, so the definitions came from an unofficial rendering of the PCO’s
   official XML (github.com/tonyandrewmeyer/nz-acts, consolidated to
   18 Sep 2026). Open these in a browser and compare:
   - the RMA s 2 definition and timeframes **after 30 Oct 2026**, when the
     Planning Act transition amendments start;
   - District Court Rules r 1.4 and r 2.1 (only official extracts were
     available; the regime is marked `partial` and says so to users);
   - the settlement-notice period (12 working days, cl 11) in the current
     sale and purchase agreement.
   Each regime’s `status` in `src/engine/regimes.js` drives the caveat users
   see.
3. **Deploy to Cloudflare** (free plan is fine):
   ```bash
   npx wrangler@4 login
   npx wrangler@4 kv namespace create KEYS   # paste the id into wrangler.toml and uncomment
   npm run deploy
   ```
   Then add the domain in Cloudflare and uncomment `routes` in `wrangler.toml`.
4. **Stripe** (Singh Studio account):
   - Products: *Duly Pro* with prices NZ$29/month and NZ$290/year, lookup keys
     `duly_pro_monthly` and `duly_pro_yearly`; *Duly Platform* with NZ$199/month
     and NZ$1,990/year, lookup keys `duly_platform_monthly` and `duly_platform_yearly`.
   - Turn on the Customer Portal (cancel, switch plan, update card, invoices).
   - Add a webhook endpoint `https://duly.nz/webhooks/stripe` for
     `customer.subscription.updated` and `customer.subscription.deleted`.
   - `npx wrangler@4 secret put STRIPE_SECRET_KEY` and `… STRIPE_WEBHOOK_SECRET`.
   - GST: if you want Stripe Tax to add GST, set it up in Stripe and set
     `STRIPE_AUTOMATIC_TAX = "true"` in `wrangler.toml`; otherwise set prices GST-inclusive.
   - Until Stripe is connected, the pricing buttons show a friendly “email Kris”
     page, so the site can launch before payments are switched on.
5. **Get found** (public actions, so your call):
   Google Search Console and the sitemap; the official MCP Registry,
   Smithery, Glama and PulseMCP listings for the MCP server; a LinkedIn post
   timed for early December (“your OIA clock stops on 25 Dec, the RMA’s on
   20 Dec”); and a note to FYI.org.nz, NZ property-management software vendors
   and legal-tech newsletters.

## Yearly upkeep (December)

- Add the next year to `holidayYears` in `site/site.json`.
- Re-check the definitions and bump `RULES_VERIFIED` in `src/engine/version.js`.
- Watch for: new public holidays, anniversary-day changes by councils, the
  RMA’s replacement legislation, and Matariki dates after 2052 (the engine
  refuses to answer past the last scheduled date rather than guess).
- `npm run build && npm test && npm run deploy`, then add a line to
  `site/changelog.json`.

## Guardrails

- Not legal advice. The terms limit liability to three months’ fees, exclude the
  CGA and FTA for business users (the s 43 / s 5D contracting-out route) and say
  plainly what Duly can’t know (extensions, service rules, contract terms).
- No tracking on the site. The calculators run in the browser.
- The engine refuses dates it can’t vouch for (before 2023, after 2052) instead of guessing.
