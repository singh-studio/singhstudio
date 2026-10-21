# Laurel: launch plan

*Written 21 October 2026. Nothing has been published, listed, emailed or posted. All of this sits on the
branch `claude/friendly-bohr-tz2rvn` until you merge it.*

## What it is

**Laurel** is digital honours boards for clubs and schools. A volunteer types or pastes the names
(club champions, presidents, life members, dux…), picks a look, and downloads one self-contained HTML
file for each place it's going:

- **TV:** a slideshow with gold leaf on timber (or Heritage or Modern), long lists paginated, a
  "this year's honours" slide, a QR code to the website, and burn-in drift.
- **Website:** a searchable page with a page for every person, gathering all their honours.
- **Touchscreen:** the slideshow until someone touches it, then A–Z search, then back after 90 s idle.

No servers, no accounts, no subscription. You sell it once through Lemon Squeezy; buyers unlock it
with a licence key.

## Why this niche

- **Incumbents are expensive turnkey B2B.** US "digital hall of fame" vendors' own buying guides put
  software at roughly US$2,000–8,000 a year, and packages at US$10,000+ with hardware
  ([digitalrecordboard.com](https://digitalrecordboard.com/blog/turnkey-digital-hall-of-fame-pricing-content-setup-training/),
  [touchstone-ds.com](https://touchstone-ds.com/blog/how-much-does-a-digital-hall-of-fame-and-donor-wall-cost/)).
  UK golf clubs are buying bespoke systems ([Redditch GC, 2025](https://thegolfbusiness.co.uk/2025/04/redditch-golf-club-installs-digital-honours-board-system/)).
  I found **no self-serve, pay-once option**. That's the gap.
- **Huge long tail in the Commonwealth honours-board tradition**: NZ/AU/UK golf, bowls, rugby,
  cricket, netball, rowing and surf clubs, schools (dux boards), Rotary/Lions, lodges. Every one has
  a wall that's full and a signwriter bill every year.
- **It's your audience and your craft**: community organisations, schools, design taste, and the
  same Lemon Squeezy rails as the plugin store. But it isn't Squarespace-dependent.
- **Passive by construction**: static files on GitHub Pages, buyers self-serve, the board files never
  call home. Support load is mostly "how do I get it on the TV", which the guide answers.

Honest caveats: demand is inferred from competitor pricing and the problem's ubiquity, not tested
with a single club yet. TV browsers vary (mitigated: plain-list fallback, laptop route documented).

## Status

| Piece | Where | State |
|---|---|---|
| Editor (the product) | `laurel/app/` | Done. 51/51 end-to-end checks pass |
| Board runtime (TV, website, kiosk; 3 styles) | built into every exported file | Done, ES2017 for older smart-TV browsers |
| Landing page, setup guide, licence & privacy | `laurel/`, `laurel/guide/`, `laurel/licence/` | Done |
| SEO pages | `laurel/golf/`, `bowls/`, `schools/`, `sports-clubs/` | Done |
| Demos (made-up clubs, noindex) | `laurel/demo/`, `demo/school/`, `demo/rugby/` | Done |
| Sitemap + site checker | `sitemap.xml`, `bin/check-site.py` | Updated, ALL GREEN |
| Lemon Squeezy product + checkout links | — | **Needs you** |
| Link from the main site nav | — | **Your call** (I didn't touch the global nav) |

Until you add checkout links, the buy buttons open a pre-filled email to you, exactly like the plugin
store. Until you add the store ID, the editor says "Licences aren't on sale just yet".

## Launch checklist (about 45 minutes)

1. **Look at it.** From the repo root: `python3 -m http.server 4173`, then open
   `http://localhost:4173/laurel/` and `http://localhost:4173/laurel/app/` (try "Try it with an
   example club", then *Save & publish → Open it here first*).
2. **Create the product in Lemon Squeezy** (Store → Products → New):
   - Name: *Laurel: digital honours boards*. Two variants: **Club licence** US$149 and **Trade
     licence** US$449. The variant name must contain "Trade" for the trade one; that's how the
     editor tells them apart.
   - Turn on **License keys** for both. Activation limit: Club 3, Trade 10. No expiry.
   - Confirmation / receipt text, suggested: *"Thank you! Open the editor at
     https://www.singhstudio.co.nz/laurel/app/, click 'Free trial' at the top, paste your key and
     download your files again. Setup guide: https://www.singhstudio.co.nz/laurel/guide/"*
   - No file is needed; the key is the product. (Optionally attach nothing, or a PDF of the guide.)
3. **Copy four values into `_laurel/shop.json`:** `storeId` (Settings → Stores), the product ID in
   `productIds`, and each variant's checkout link in `checkout.club` / `checkout.trade` (Share →
   checkout link). Prices live there too.
4. **Rebuild and check:** `node _laurel/build.mjs && python3 bin/check-site.py`.
5. **Test a real activation** with a Lemon Squeezy test-mode purchase: paste the key in the editor
   (top bar → *Free trial*), download a TV file, confirm the "Laurel trial" ribbon is gone. Then
   *Deactivate on this computer* to free the activation.
6. **Merge the branch to `main`.** GitHub Pages publishes `/laurel/` with everything else.
7. Optional: submit `https://www.singhstudio.co.nz/sitemap.xml` in Google Search Console; add a
   "Laurel" link to the site nav/footer (`bin/check-site.py` enforces the nav labels, so update
   `EXPECTED_NAV`/`EXPECTED_FOOTER` with it).

## Pricing and the knobs

- **Club US$149 once.** Cheap against a single new timber board or one year of signwriting, and far
  under any subscription system. Committees can approve it without a meeting.
- **Trade US$449 once.** For signwriters, trophy/engraving shops, AV installers and web designers.
  Removes the Laurel mark. This is the channel play (below).
- **Done for you from US$349** (Club licence included). A service, not passive; drop it from
  `_laurel/site.mjs` if you'd rather not. Transcribing old boards is fast with an AI vision model
  and a careful human check.
- Change prices in `_laurel/shop.json` and rebuild.
- Illustrative only (Lemon Squeezy takes about 5% + 50¢ per sale): 5 Club sales a month ≈ US$700
  net; 20 ≈ US$2,800; add one Trade sale and one done-for-you a month ≈ +US$750.

## Getting it found (all optional, nothing sent)

Built in: four SEO pages, structured data, and a **"Made with Laurel" link on every published
board**, which turns each club's honours page into a quiet referral.

Ideas, roughly in order of leverage. Every one needs your go-ahead, and cold email in NZ must follow
the Unsolicited Electronic Messages Act (business addresses published for that role, clear sender,
working unsubscribe).

1. **Trade partners.** Signwriters and trophy/engraving shops already sell honours boards to every
   club in town. Offer them the Trade licence (or a revenue share) as the digital option they can
   upsell. A handful of partners is a sales force. *Draft A below.*
2. **Schools, now.** Prizegiving season is November–December. *Draft B* for business managers.
3. **Golf and bowls associations' club newsletters** (regional), and club administrators' groups.
4. **Your network post.** *Draft C.*

### Draft A: trade partner (not sent)

> Subject: A digital honours board you can sell alongside the timber ones
>
> Kia ora [name], I'm Kris from Singh Studio in [city]. I've built Laurel, digital honours boards
> that run on a clubhouse TV, the club website and a touchscreen from one file. Clubs that have run
> out of wall still want the gold-leaf look, and Laurel keeps it.
>
> I think it fits beside your boards rather than against them: the club keeps its timber history,
> and you set up the screen for everything since. The Trade licence lets you make boards for as many
> clubs as you like, unbranded. Demo: https://www.singhstudio.co.nz/laurel/
>
> Happy to show you in ten minutes, or set you up with a free trade licence for your first club.
> Kris

### Draft B: schools (not sent)

> Subject: Your dux boards on the foyer screen before prizegiving
>
> Kia ora [name], Laurel turns a school's honours boards (dux, head students, sportsperson of the
> year, old students of note) into a slideshow for the foyer screen and a searchable page for the
> website. Current students can be kept off the internet with one switch. US$149 once, no
> subscription, and you can try it with your own names first: https://www.singhstudio.co.nz/laurel/schools/
>
> Kris Singh, Singh Studio

### Draft C: LinkedIn / Facebook (not posted)

> Every club I know has the same wall: honours boards, full, and a signwriter bill every season.
> So I built Laurel. Your honours on the clubhouse TV, your website and a touchscreen, from one file.
> Gold leaf on timber if you like. Search for any name, a page for every member, a QR code on the
> screen. Pay once, no subscription, nothing to install. Try it free with your own names:
> https://www.singhstudio.co.nz/laurel/

## Running it

- **Support:** most questions are answered in `laurel/guide/`. Typical replies: power settings (screen
  goes black), "add your web address in Step 1 for the QR code", "open your backup with *Open a saved
  file*". Activation-limit emails: deactivate an old instance in Lemon Squeezy (Licenses → key →
  instances).
- **Refunds:** the licence says no refunds because there's a full free trial; Lemon Squeezy lets you
  refund anyway, and refunding disables the key. The editor re-checks keys weekly.
- **Updating Laurel:** edit `_laurel/src/`, then `node _laurel/build.mjs`, run the tests (see
  `_laurel/README.md`), push. Buyers using the hosted editor get the update automatically; their
  existing board files keep working unchanged.

## Next, if it sells

1. **Laurel Cloud** (subscription, ~US$5/month): publish from the editor to a hosted address, so
   screens and websites update the moment names change. A small Cloudflare Worker + R2, keyed by the
   licence. This is where recurring revenue comes from.
2. **Live from Google Sheets** for clubs that keep their records there.
3. More styles (marble for memorial rolls, a school-crest heritage variant), video export of the
   slideshow for social media at prizegiving.
