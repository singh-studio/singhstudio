# Content Guide — Singh Studio

Every human-visible copy block on the site, page by page, in the order a visitor meets them. Use this as your editing checklist: tick a box once the block is final (your own words, or confirmed as keeping the draft).

**How to use a row**: the *Locator* tells you the file and a snippet you can `grep` for to jump straight to the line. *Current copy* is the text as it stands today (verbatim, or first sentence + "…" if it’s long prose — open the file for the rest). *Job* is a one-line brief for what the block has to do, so a rewrite still hits the mark.

Not included: ARIA labels, `aria-hidden` decorative strings, JSON-LD/schema values that mirror visible copy, and JS-only strings (console messages, class names). Meta titles/descriptions and og: tags **are** included, since buyers and search results read those.

**Re-verified 2026-07-08 (post-elevation, Wave 6).** index.html's document head, preloader, nav labels and hero copy (the surfaces a brand-reconciliation pass explicitly rewrote) have been re-checked against the live HTML and corrected below where they'd drifted — old positioning ("web design first", "Every discipline. One message.") is gone sitewide, and nav is now 4 items (Disciplines/Work/Thoughts/Kris) not 5. Section numbering (01–07) itself hadn't actually changed — only two eyebrow *labels* had ("02 / Services" → "02 / Disciplines", "06 / The studio" → "06 / Kris"), both corrected below. Everything **below** the sections marked "corrected"/checked `[x]` in this pass (case pages, together.html, kris.html, archive.html, thoughts.html body copy, templates.html) was spot-checked for a few high-risk claims (frame counts, meta-description truncation — both confirmed fixed independently, see `LAUNCH-CHECKLIST.md`) but was not re-verified line-by-line — a full re-audit of ~250 content rows was out of scope for this pass. Treat unmarked `[ ]` rows as "probably still accurate, not guaranteed" rather than "verified."

---

## index.html (homepage)

### Document head / meta — corrected 2026-07-08

- [x] **Meta title** — `index.html`, grep `A Multidisciplinary Creative Studio, Aotearoa NZ` — *"Singh Studio — A Multidisciplinary Creative Studio, Aotearoa NZ"* — job: browser tab + primary search snippet title, keep under ~60 characters.
- [x] **Meta description** — `index.html`, grep `Singh Studio is a multidisciplinary creative studio` — *"Singh Studio is a multidisciplinary creative studio in Aotearoa New Zealand. Strategy-led web, film, photography, audio, apps and AI. Telling stories that matter."* — job: search-result snippet, sell the range in one breath, ends on the brand line.
- [x] **og:title** — `index.html`, grep `Telling stories that matter.` — *"Singh Studio — Telling stories that matter."* — job: link-share headline (Slack/iMessage/socials).
- [x] **og:description** — `index.html`, grep `og:description` — identical to meta description above (this is enforced by `bin/check-site.py` now — og:description must equal meta description on every indexable page).

### Preloader — corrected 2026-07-08

- [x] **Loader wordmark** — `index.html`, grep `TELLING STORIES / THAT MATTER` — *"TELLING STORIES / THAT MATTER"* — job: first thing a visitor reads, sets tone in one line, matches the hero serif line below.

### Nav (repeats on every page — see "Sitewide repeating blocks" below for the footer twin) — corrected 2026-07-08

- [x] **Primary nav labels** — `index.html`, grep `<span class="nl-num">01</span>Disciplines` — *Disciplines / Work / Thoughts / Kris* — job: wayfinding, 4 items not 5 (Services/Templates/Engagements/Studio consolidated or moved). `bin/check-site.py` enforces this label set + order sitewide now (nav/menu/footer all compared).
- [ ] **Nav book button** — `index.html`, grep `btn-book" href="#contact"` — *"Book a call"* — job: persistent CTA, never lengthen past 2 words or it wraps. (Unchanged.)
- [ ] **Mobile menu footer line** — `index.html`, grep `menu-foot` — *"Singh Studio, Aotearoa New Zealand<br>kris@singhstudio.co.nz"* — job: reassurance + contact in the overlay menu. (Unchanged.)

### Hero — corrected 2026-07-08

- [x] **Hero eyebrow / promise line** — `index.html`, grep `A multidisciplinary creative studio in Aotearoa` — *"/ A multidisciplinary creative studio in Aotearoa New Zealand."* — job: hero promise, now matches the sitewide brand line exactly (see head/meta above).
- [ ] **Hero title** — `index.html`, grep `SINGH</span>` — *"SINGH / STUDIO"* — job: brand lockup, structural — leave as is. (Unchanged.)
- [x] **Hero serif line** — `index.html`, grep `Telling stories <em>that matter` — *"Telling stories that matter."* — job: the one-sentence thesis, sits under the logo, matches the preloader word exactly.
- [ ] **Hero CTA — primary** — `index.html`, grep `Book a 20-min call</a>` — *"Book a 20-min call"* — job: main hero conversion button. (Unchanged; now also carries `data-track="book_click" data-track-label="hero"`.)
- [ ] **Hero CTA — secondary** — `index.html`, grep `See the work</a>` — *"See the work"* — job: low-commitment escape hatch for browsers. (Unchanged.)
- [ ] **Hero scroll hint** — `index.html`, grep `hf-scroll` — *"Scroll"* — job: microcopy, nudges the first scroll. (Unchanged.)
- [x] **Hero frame caption** — `index.html`, grep `FR&nbsp;000&nbsp;—&nbsp;KRIS` — *"FR 000 — KRIS SINGH / DIRECTOR"* — job: photo-credit-style microcopy under the hero image, now matches the current hero photo (`hero-kris-portrait.jpg`, a brick-wall portrait — the hero moved off the red-pigment dancer shot referenced in the old row here).

### Client proof band

- [ ] **Proof label** — `index.html`, grep `Trusted across Aotearoa` — *"Trusted across Aotearoa<br>10+ years, 25+ organisations"* — job: quick trust stat, update the numbers if they change.
- [ ] **Proof client list** — `index.html`, grep `The Salvation Army NZ</span>` — *15 client/org names: The Salvation Army NZ, Amplify, More Conference, Band Camp, Joy Florals, Butterfly Builds, Wellington Church Network, Firezone, AFC Financial Care, Peniel Trust, Albany Bays, HardKase, Next Gen, NDCU, MSB Tour* — job: name-drop credibility — confirm every name is one you can legally display (client permission), especially the ones with no case study of their own.

### 01 / Position

- [ ] **Section eyebrow** — `index.html`, grep `01 /</span> Position` — *"01 / Position"* — job: section wayfinding label.
- [ ] **Position statement** — `index.html`, grep `Most studios sell deliverables` — *"Most studios sell deliverables. Singh Studio starts with the message, then builds whatever carries it best: a website, an app, a campaign, a film, a photograph, a room full of sound."* — job: the studio’s positioning thesis, one big verified claim — keep it a single confident sentence-family.

### 02 / Disciplines (seven accordion rows — heading corrected 2026-07-08, was "02 / Services")

- [x] **Section eyebrow + note** — `index.html`, grep `02 /</span> Disciplines` — *"02 / Disciplines"* / *"Seven disciplines. Click to open."* — job: section label + interaction hint. (Eyebrow corrected 2026-07-08 — was "Services", now matches the "Disciplines" nav label.)
- [ ] **/01 Web Design** — `index.html`, grep `Fast, handsome sites your team can actually run` — *"Fast, handsome sites your team can actually run: conference platforms, brand sites and landing pages that read as well as they load."* + tag line *"design · build · CMS"* + bullets *Design systems & UI / Build & CMS setup / Performance & SEO / Care & iteration* — job: sell the lead discipline in one sentence, first of seven so it sets the tone.
- [ ] **/02 Strategy & Comms** — `index.html`, grep `The thinking layer, and where every job here starts` — *"The thinking layer, and where every job here starts. Positioning, narrative, key messages and the plan for where they travel, whether that’s internal, external, or six columns deep in the press."* + tag *"positioning · messaging · campaigns · media"* + bullets *Comms strategy & planning / Message architecture / Campaign development / Media & issues management* — job: justify why a "web studio" also does strategy.
- [ ] **/03 App Development** — `index.html`, grep `Small, sharp software: internal tools` — *"Small, sharp software: internal tools, member platforms and prototypes that get an idea in front of real users fast."* + tag *"product · prototypes · tools"* + bullets *Product design / Web apps & platforms / Rapid prototyping / Integrations* — job: scope-set expectations (small/sharp, not enterprise).
- [ ] **/04 AI Systems** — `index.html`, grep `Practical AI wired into real workflows` — *"Practical AI wired into real workflows: content pipelines, agents and automations that save Tuesdays, not just make headlines. Plus straight-talking advisory for teams working out where to start."* + tag *"automation · agents · advisory"* + bullets *Workflow automation / Custom agents & assistants / Content & comms pipelines / AI strategy & training* — job: differentiate practical AI from hype.
- [ ] **/05 Photography** — `index.html`, grep `Stills that hold a story` — *"Stills that hold a story. Studio builds, brand libraries, events, and the quiet documentary frames in between. See the light table below."* (contains inline link to `#light-table`) + tag *"editorial · documentary · commercial"* + bullets *Brand & campaign shoots / Editorial & portraiture / Events & documentary / Retouch & colour* — job: bridge to the homepage’s own photo section.
- [ ] **/06 Video & Film** — `index.html`, grep `Concept to colour grade, directed, shot and finished` — *"Concept to colour grade, directed, shot and finished under one roof: brand films, broadcast openers, event coverage and social cuts."* + tag *"direction · production · post"* + bullets *Direction & production / Edit, grade & motion / Broadcast & event packages / Social-first formats* — job: signal full-service film capability.
- [ ] **/07 Audio & Music** — `index.html`, grep `Original score, sound design, podcasts and mixes` — *"Original score, sound design, podcasts and mixes. The message has a sound, and default library music isn’t it."* + tag *"production · composition · mix"* + bullets *Music production & composition / Podcast & voice production / Sound design for film / Mix & master* — job: last of seven, closes on a memorable line about stock music.

### 03 / Selected work

- [ ] **Section eyebrow + note** — `index.html`, grep `03 /</span> Selected work` — *"03 / Selected work"* / *"Web-led builds. Open a card for the full case."*
- [ ] **Work card — Amplify** — `index.html`, grep `Amplify Conference` — title *"Amplify Conference"*, desc *"National youth conference platform, three years running."*, tags *"Web · Identity · Motion 2023–25"* — job: one-line proof point per card, must match the case page’s facts.
- [ ] **Work card — More Conference** — `index.html`, grep `More Conference website design` — title *"More Conference"*, desc *"Conference site and campaign for a national gathering."*, tags *"Web · Campaign 2023–24"*.
- [ ] **Work card — Band Camp** — `index.html`, grep `Band Camp website design` — title *"Band Camp"*, desc *"Brand and build for a national music camp."*, tags *"Web · Photography 2024"*.
- [ ] **Work card — Firezone** — `index.html`, grep `Firezone website design` — title *"Firezone"*, desc *"Community platform for a nationwide youth network."*, tags *"Web · Brand 2023"*.
- [ ] **Work stats** — `index.html`, grep `years behind code,<br>cameras` — *"10+ years behind code, cameras & consoles"*, *"25+ organisations served"*, *"7 disciplines under one roof"*, *"1 point of contact, start to shipped"* — job: four proof numbers, update if the underlying facts change (counts also live in `js/main.js` as `data-count-to` values, keep in sync).
- [ ] **Templates promo banner** — `index.html`, grep `New</span>` near `tpl-banner` — kicker *"/ New"*, title *"Website templates: proven layouts, tailored and built for you"*, CTA *"Browse the shelf →"* — job: cross-sell into templates.html without stealing hero attention.

### 04 / Voices

- [ ] **Section eyebrow + note** — `index.html`, grep `04 /</span> Voices` — *"04 / Voices"* / *"Two minutes with the people we make for."*
- [ ] **Video testimonial — Joy Florals** — `index.html`, grep `Play the film` — play-button label *"▶  Play the film — 1:57"*, badge *"Film / shot & scored in-house"*, name *"Joy Florals"*, role *"Brand feature: direction, camera, edit, score"* — job: proof-of-craft video slide, real client, keep as is.
- [ ] **Reserved testimonial slide (PLACEHOLDER — must replace before launch)** — `index.html`, grep `This seat is saved` — *"The best endorsements are specific, so we’re collecting ours properly: signed, dated, on the record."* / name *"This seat is saved"* / role *"Client words landing here soon"* — job: **bracketed-style placeholder** (see README’s "Voices" section) — swap for a real client quote before launch, following the `<article class="voice" data-kind="text">` pattern documented in the README.
- [ ] **Voice slider counter** — `index.html`, grep `voiceCount` — *"01 / 02"* — job: auto-updates via JS to match however many slides exist; don’t hand-edit.

### 05 / How it runs

- [ ] **Section eyebrow + note** — `index.html`, grep `05 /</span> How it runs` — *"05 / How it runs"* / *"Four steps. No account managers in between."*
- [ ] **Step /01 Kōrero** — `index.html`, grep `A 20-minute call. The problem in your words` — *"A 20-minute call. The problem in your words, no deck, no discovery-phase invoice."*
- [ ] **Step /02 The message** — `index.html`, grep `Strategy first: what we’re saying` — *"Strategy first: what we’re saying, who it’s for, and where it has to land."*
- [ ] **Step /03 Production** — `index.html`, grep `Design and build first: sites, apps, campaigns` — *"Design and build first: sites, apps, campaigns, films. Whatever carries it best, made in-house."*
- [ ] **Step /04 Ship & steer** — `index.html`, grep `Launch, measure, adjust. The one who took the brief` — *"Launch, measure, adjust. The one who took the brief stays to steer it."*
- [ ] **Process tail line** — `index.html`, grep `Most briefs go from first call to shipped` — *"Most briefs go from first call to shipped inside a month. See how engagements work →"* — job: closing claim + cross-link to together.html, keep the timeframe honest.

### 06 / Kris (heading corrected 2026-07-08, was "06 / The studio")

- [x] **Section eyebrow + note** — `index.html`, grep `06 /</span> Kris` — *"06 / Kris"* / *"Small by design. Senior by default."* (Eyebrow corrected 2026-07-08 — was "The studio", note text unchanged.)
- [ ] **Portrait figcaption** — `index.html`, grep `Kris Singh, Director` — *"Kris Singh, Director"*.
- [ ] **Candid figcaption** — `index.html`, grep `En route: wherever the brief is` — *"En route: wherever the brief is"*.
- [ ] **Studio heading** — `index.html`, grep `Run by Kris Singh.<br>Built around` — *"Run by Kris Singh. Built around your message."*
- [ ] **Studio lede** — `index.html`, grep `Communications professional by trade` — *"Communications professional by trade. Web designer and builder by obsession, with a camera bag never far away."*
- [ ] **Studio body paragraph** — `index.html`, grep `Deliberately small: one senior person takes the brief` — *"Deliberately small: one senior person takes the brief, holds the strategy and makes the work. No juniors learning on your budget, no account layer in between. A production floor’s range behind a single desk."*
- [ ] **Studio facts — Base** — `index.html`, grep `Aotearoa New Zealand, working anywhere` — *"Aotearoa New Zealand, working anywhere"*.
- [ ] **Studio facts — Background** — `index.html`, grep `10+ years in communications &amp; production` — *"10+ years in communications & production"*.
- [ ] **Studio facts — Range** — `index.html`, grep `Web, apps &amp; AI, backed by photography` — *"Web, apps & AI, backed by photography, film & sound"*.
- [ ] **Studio facts — Status (auto-updates)** — `index.html`, grep `data-booking-window` — static fallback text *"Currently booking"*, live-replaced by JS with "Booking new briefs — [Month Year]" — don’t hand-edit the wording without also checking `js/main.js`'s booking-window string.
- [ ] **Profile link** — `index.html`, grep `Full profile &amp; CV →` — *"Full profile & CV →"*.
- [ ] **Studio pull-quote** — `index.html`, grep `If it carries the message,` — *"If it carries the message, it's in scope."* (note: source uses a straight apostrophe here, unlike most of the site's curly ones) — job: memorable one-liner, the studio's philosophy in seven words.

### From the archive (light table)

- [ ] **Section eyebrow** — `index.html`, grep `From the archive` — *"/ From the archive"*.
- [ ] **Drag hint + link** — `index.html`, grep `lt-drag-hint` — *"Keep scrolling — the table moves sideways."* + *"Browse the full archive →"*.
- [ ] **Light table figcaptions ×12** — `index.html`, grep `FR 00` — *"FR 001: Movement study / pigment"* through *"FR 012: Stone bridge / wander"* — job: photo-credit-style microcopy, each must describe its actual image; renumber if you add/remove frames.
- [ ] **Light table end-card** — `index.html`, grep `See the<br>full archive` — *"See the full archive"* / *"40 frames / 4 sets →"* — job: **note this count (40/4) is hand-typed here and does NOT auto-sync** with archive.html’s live-counted total (currently 37 frames per `archiveCount`) — reconcile the two numbers before launch.

### 07 / Start (contact)

- [ ] **Section eyebrow** — `index.html`, grep `07 /</span> Start` — *"07 / Start"*.
- [ ] **Contact title** — `index.html`, grep `LET'S` — *"LET'S / TALK"* (straight apostrophe in source) — structural lockup, leave as is.
- [ ] **Booking card — Format row** — `index.html`, grep `Intro call, 20 minutes, Google` — *"Intro call, 20 minutes, Google Meet"*.
- [ ] **Booking card — Agenda row** — `index.html`, grep `No deck required. Bring the problem` — *"No deck required. Bring the problem, we'll bring the questions."* (straight apostrophe in source)
- [ ] **Booking card — Engagements row** — `index.html`, grep `Project · Retainer · Sprint` — *"Project · Retainer · Sprint."* + link *"Full details →"*.
- [ ] **Booking card — Availability row (auto-updates)** — `index.html`, grep `id="bookingWindow"` — static fallback *"Currently booking"*, JS-replaced with the current booking month.
- [ ] **Book button** — `index.html`, grep `Book a Google&nbsp;Meet` — *"Book a Google Meet →"* — job: the site’s single highest-value CTA. **Does nothing useful until `CONFIG.bookingUrl` in `js/main.js` is set** — see Launch Checklist.
- [ ] **Email alt-contact** — `index.html`, grep `or write: kris@singhstudio.co.nz` — *"or write: kris@singhstudio.co.nz"*.
- [ ] **Contact note** — `index.html`, grep `Replies within one business day` — *"Replies within one business day, NZT. Usually faster."*

### Lightbox (structural, no copy) — skipped.

---

## templates.html

### Meta

- [ ] **Meta title** — `templates.html`, grep `<title>Website templates` — *"Website templates — Singh Studio"*.
- [ ] **Meta description** — `templates.html`, grep `Proven website layouts, tailored to your brand and content` — *"Proven website layouts, tailored to your brand and content and built by the studio. Seven starting points for trades, hospitality, practices, community, events, portfolios and retail."*
- [ ] **og:description (differs slightly from meta description)** — `templates.html`, grep `Seven starting points, each with a working demo` — *"Proven website layouts, tailored and built by the studio. Seven starting points, each with a working demo."*

### Hero

- [ ] **Hero eyebrow** — `templates.html`, grep `/</span> Templates` — *"/ Templates"*.
- [ ] **Hero title** — `templates.html`, grep `Ready<em class` — *"Ready / to go"*.
- [ ] **Hero lede** — `templates.html`, grep `Not files to wrangle yourself: Kris builds it for you` — *"Proven layouts, tailored to your brand and content, built by the studio. Not files to wrangle yourself: Kris builds it for you."*
- [ ] **Hero meta — Format** — `templates.html`, grep `A proven layout with a working demo, tailored to you` — *"A proven layout with a working demo, tailored to you"*.
- [ ] **Hero meta — Includes** — `templates.html`, grep `Design, build, content load, launch` — *"Design, build, content load, launch"*.
- [ ] **Hero meta — Timeline** — `templates.html`, grep `Quoted on the intro call` — *"Quoted on the intro call"*.
- [ ] **Hero meta — Custom instead link** — `templates.html`, grep `See engagements →` — *"See engagements →"*.

### 01 / Find your fit (the Finder)

- [ ] **Section eyebrow + heading** — `templates.html`, grep `Tell us who<br>you are` — *"01 / Find your fit"* / *"Tell us who you are."*
- [ ] **Section lead** — `templates.html`, grep `Pick what you are, then what the site has to do first` — *"Pick what you are, then what the site has to do first. The shelf narrows and one template steps forward."*
- [ ] **Finder row 1 label** — `templates.html`, grep `I&rsquo;m a&hellip;` — *"I’m a…"*.
- [ ] **Finder type chips ×6 + reset** — `templates.html`, grep `data-type="trade"` — *"Trade or service business"*, *"Café, food or retail"*, *"Professional practice"*, *"Community, church or charity"*, *"Event or conference"*, *"Creative or portfolio"*, plus reset chip *"Show everything"* — job: category self-selection, wording drives the recommendation logic in `js/templates.js` — don’t change without checking that file’s `TYPE_FILTER` map.
- [ ] **Finder row 2 label** — `templates.html`, grep `and I mostly need` — *"…and I mostly need"*.
- [ ] **Finder priority chips ×4** — `templates.html`, grep `data-priority="found"` — *"Get found locally"*, *"Take bookings or registrations"*, *"Look established"*, *"Sell or showcase work"* — same JS-coupling caveat as above.

### 02 / The shelf (seven template cards — same shape repeats ×7)

- [ ] **Section eyebrow + heading + lead** — `templates.html`, grep `Seven starting<br>points` — *"02 / The shelf"* / *"Seven starting points."* / *"Each one is a real layout the studio has built before, with a working demo, ready to carry your brand and your words."*
- [ ] **Card 1 — Toolbelt** — `templates.html`, grep `For sparkies, builders, plumbers and cleaners` — kicker *"Trades & services"*, name *"The Toolbelt"*, desc *"For sparkies, builders, plumbers and cleaners who need to be found, trusted and phoned before the competition."*, includes *Home, services, gallery, contact / Click-to-call & quote form / Service-area & local SEO setup / Reviews and past-job strip*, tags *Local / Direct / Trust-first*.
- [ ] **Card 2 — Counter** — `templates.html`, grep `For caf&eacute;s, eateries and small venues` — kicker *"Café & hospitality"*, name *"The Counter"*, desc *"For cafés, eateries and small venues: appetite on the homepage, hours and location one tap away."*, includes *Home, menu, hours, find us / Menu that's easy to update (straight apostrophe in source) / Map, parking & booking link / Gallery and socials feed*, tags *Warm / Appetising / Mobile-first*.
- [ ] **Card 3 — Ledger** — `templates.html`, grep `For accountants, consultants and legal practices` — kicker *"Professional practice"*, name *"The Ledger"*, desc *"For accountants, consultants and legal practices: quiet authority, clear services, an easy way to make contact."*, includes *Home, services, about, contact / Team & credentials layout / Enquiry form & booking link / Insights or resources page*, tags *Assured / Editorial / Restrained*.
- [ ] **Card 4 — Commons** — `templates.html`, grep `For churches, clubs and charities` — kicker *"Community & charity"*, name *"The Commons"*, desc *"For churches, clubs and charities: gather people, tell the story, and make giving or joining simple."*, includes *Home, about, events, give / Service or meeting times / Donate & sign-up links / News and newsletter capture*, tags *Welcoming / Clear / Human*.
- [ ] **Card 5 — Programme** — `templates.html`, grep `For conferences and one-off events` — kicker *"Events & conferences"*, name *"The Programme"*, desc *"For conferences and one-off events: sell the line-up, then send people straight to register."*, includes *Home, speakers, schedule, register / Registration & ticketing link / Speakers and sessions grid / Venue, travel & FAQ*, tags *Bold / Timed / Register-led*.
- [ ] **Card 6 — Folio** — `templates.html`, grep `For photographers, designers and makers` — kicker *"Creative portfolio"*, name *"The Folio"*, desc *"For photographers, designers and makers: the work up front, big and uncluttered, with an easy way to commission."*, includes *Home, work, about, contact / Project pages & galleries / Lightbox and captions / Enquiry form & socials*, tags *Visual / Spacious / Work-first*.
- [ ] **Card 7 — Storefront** — `templates.html`, grep `For a tight range of products` — kicker *"Small retail & product"*, name *"The Storefront"*, desc *"For a tight range of products: one hero product forward, checkout close, nothing in the way of the buy."*, includes *Home, shop, product, cart / Small catalogue & checkout / Product pages with gallery / Shipping, returns & contact*, tags *Focused / Buy-ready / Tidy*.
- [ ] **Card CTAs ×7 (identical pair on every card)** — `templates.html`, grep `View the demo <span class="tc-ar"` — *"View the demo →"* + *"Enquire"* — job: repeated button-label pair, structural, listed once here.
- [ ] **Commented price slots ×7 (BLOCKER)** — `templates.html`, grep `<!-- <p class="tpl-price">From NZ\$X,XXX</p> -->` (7 matches, one per card) — job: **currently commented out sitewide** — decide pricing and either fill+uncomment all seven or confirm "quoted on the intro call" stays the only pricing signal. See Launch Checklist.

### 03 / How template builds run

- [ ] **Section eyebrow + heading + lead** — `templates.html`, grep `A head start,<br>not a shortcut` — *"03 / How template builds run"* / *"A head start, not a shortcut."* / *"The layout is settled, so the work goes into your brand and your words, not into starting from a blank page."*
- [ ] **Step /01 Pick** — `templates.html`, grep `Browse the shelf, or use the finder above` — *"Browse the shelf, or use the finder above to narrow it to your fit. Open any demo to see it working. There’s no wrong answer; we confirm it together."*
- [ ] **Step /02 Kōrero** — `templates.html`, grep `Twenty minutes on a call. We cover your content` — *"Twenty minutes on a call. We cover your content, your brand, and what the site has to do first."*
- [ ] **Step /03 Tailor** — `templates.html`, grep `Your brand, your words, your photos, dropped` — *"Your brand, your words, your photos, dropped into the layout and shaped to fit. Never a stock demo with your logo dropped on top."*
- [ ] **Step /04 Live** — `templates.html`, grep `Launch, a proper handover, and a light care` — *"Launch, a proper handover, and a light care arrangement if you want one for the tweaks that follow."*
- [ ] **How-tail line** — `templates.html`, grep `A settled layout is the fastest honest way` — *"A settled layout is the fastest honest way to a good website. The timeline still depends on your content, so we quote it on the call rather than promise a number here."*

### Closer

- [ ] **Closer cross-link + CTA** — `templates.html`, grep `Prefer fully custom` — *"Prefer fully custom"* / *"Engagements →"* + button *"Not sure? Book the intro call →"*.

---

## together.html

### Meta

- [ ] **Meta title** — `together.html`, grep `<title>Working together` — *"Working together — Singh Studio"*.
- [ ] **Meta description / og:description (identical)** — `together.html`, grep `Three ways to work with Singh Studio` — *"Three ways to work with Singh Studio: fixed-scope projects, a monthly retainer, or a one-week sprint. Every engagement starts with a 20-minute Google Meet."*

### Hero

- [ ] **Hero eyebrow** — `together.html`, grep `Working together</p>` — *"/ Working together"*.
- [ ] **Hero title** — `together.html`, grep `Three<em class` — *"Three / ways in"*.
- [ ] **Hero lede** — `together.html`, grep `Every one of them starts with the same 20-minute call` — *"Every one of them starts with the same 20-minute call."*

### Engagement cards ×3

- [ ] **Card /01 Project** — `together.html`, grep `One defined thing, shipped` — tag *"One defined thing, shipped."*, best-for *"Launches with a date on them: a new website, a campaign, a film."*, body *"You get a written scope and a fixed quote before work starts, weekly check-ins while it’s underway, and a ship date we hit. No hourly meter running."*, visible meta *"Typical: 2–6 weeks · fixed quote"*.
- [ ] **Card /01 price slot (commented, BLOCKER)** — `together.html`, grep `<!-- <p class="tg-meta">From NZ\$X,XXX</p> -->` — currently `From NZ$X,XXX` commented out.
- [ ] **Card /02 Retainer** — `together.html`, grep `A studio on your bench` — tag *"A studio on your bench."*, best-for *"Teams that ship every month but don’t want a design hire."*, body *"A set number of studio days each month, covering web, design and comms as needed. Priority scheduling, a standing check-in, and no re-explaining your world every brief."*, visible meta *"Monthly · three-month minimum"*.
- [ ] **Card /02 price slot (commented, BLOCKER)** — `together.html`, grep `From NZ\$X,XXX / month` — currently commented out.
- [ ] **Card /03 Sprint** — `together.html`, grep `One week, one problem` — tag *"One week, one problem."*, best-for *"Urgent, single-minded problems: a message, a prototype, a launch kit."*, body *"The studio’s full week on your one problem. Brief on Monday morning, working sessions midweek, finished work in your hands Friday."*, visible meta *"Five working days · flat rate"*.
- [ ] **Card /03 price slot (commented, BLOCKER)** — `together.html`, grep `NZ\$X,XXX flat` — currently commented out.
- [ ] **Templates cross-link** — `together.html`, grep `Something standard-shaped?` — *"Something standard-shaped?"* + *"Template builds: proven layouts with working demos →"*.

### How it runs (together.html’s own 4-step process — distinct copy from index.html’s)

- [ ] **Step /01 Kōrero** — `together.html`, grep `Twenty minutes on Google Meet. We listen` — *"Twenty minutes on Google Meet. We listen, ask questions, and work out if it’s a fit."*
- [ ] **Step /02 Scope** — `together.html`, grep `A written proposal inside two working days` — *"A written proposal inside two working days, scope and number set out together."*
- [ ] **Step /03 Build** — `together.html`, grep `One desk, weekly check-ins, shipped` — *"One desk, weekly check-ins, shipped. The person who took the brief does the work."*
- [ ] **Step /04 Care** — `together.html`, grep `Handover, then a light ongoing arrangement` — *"Handover, then a light ongoing arrangement if you want one: updates, tweaks, a fast lane."*

### FAQ (four `<details>` blocks)

- [ ] **FAQ — budgets** — `together.html`, grep `How do budgets work?` — Q: *"How do budgets work?"* A: *"Openly, on the first call. Scope and number always arrive together, in writing, so you never reach proposal stage and find a surprise."*
- [ ] **FAQ — who writes copy** — `together.html`, grep `Who writes the copy?` — Q: *"Who writes the copy?"* A: *"Usually us. Communications is the trade: you bring the facts and the voice, we bring the words, and you get final say."*
- [ ] **FAQ — international** — `together.html`, grep `Do you work outside New Zealand?` — Q: *"Do you work outside New Zealand?"* A: *"Yes. The desk is in Aotearoa, the work ships anywhere. Most collaboration runs async, with a weekly call in your timezone."*
- [ ] **FAQ — after launch** — `together.html`, grep `What happens after launch?` — Q: *"What happens after launch?"* A: *"Every build ships with a proper handover. Most clients keep a light care arrangement for updates and the occasional "can we just…", answered fast."*

### Closer

- [ ] **Closer cross-link + CTA** — `together.html`, grep `Proof first?` — *"Proof first?"* / *"See the work →"* + button *"Book the intro call →"*.

---

## kris.html

### Meta

- [ ] **Meta title** — `kris.html`, grep `<title>Kris Singh` — *"Kris Singh — Profile & CV — Singh Studio"*.
- [ ] **Meta description / og:description (identical)** — `kris.html`, grep `Kris Singh, director of Singh Studio: a communications professional` — *"Kris Singh, director of Singh Studio: a communications professional who leads with web design and build, backed by photography, film, audio and AI."*

### Hero

- [ ] **Hero eyebrow** — `kris.html`, grep `/</span> Profile` — *"/ Profile"*.
- [ ] **Hero title** — `kris.html`, grep `Kris<em class` — *"Kris / Singh"*.
- [ ] **Hero lede** — `kris.html`, grep `A communications professional who designs and builds, not just briefs` — *"A communications professional who designs and builds, not just briefs."*
- [ ] **Hero meta strip** — `kris.html`, grep `Director, Singh Studio</dd>` — Role *"Director, Singh Studio"*, Base *"Aotearoa New Zealand"*, Background *"10+ years, communications & production"*, Contact *kris@singhstudio.co.nz*.

### 01 / The short version

- [ ] **Para 1** — `kris.html`, grep `Kris Singh is a communications professional who runs Singh Studio` — *"Kris Singh is a communications professional who runs Singh Studio from Aotearoa New Zealand. The trade is strategy and message first, but the work leads with web design and build: sites and platforms designed, built and shipped in-house."*
- [ ] **Para 2** — `kris.html`, grep `Alongside the web work, he shoots photography` — *"Alongside the web work, he shoots photography, documentary and editorial frames shot since around 2018, directs and edits film, produces audio, and builds apps and AI workflows for the same clients who come back for the web…"* — job: establishes range without sounding scattered.
- [ ] **Para 3** — `kris.html`, grep `Most of the client list is long-running rather than one-off` — *"Most of the client list is long-running rather than one-off: three consecutive years building the Amplify conference platform, a second year rebooked for More Conference, and a working list of community organisations, conferences and small businesses across the country who keep returning for the next brief."*

### 02 / Professional skills (four groups)

- [ ] **Section note** — `kris.html`, grep `Four groups. One desk running all of them` — *"Four groups. One desk running all of them."*
- [ ] **Group — Communications & strategy** — `kris.html`, grep `Positioning, messaging and campaigns that set the brief` — desc *"Positioning, messaging and campaigns that set the brief before any design starts."*, bullets *Comms strategy & planning / Message architecture / Campaign development / Media & issues management*.
- [ ] **Group — Web design & build** — `kris.html`, grep `The lead discipline: design systems and builds` — desc *"The lead discipline: design systems and builds that clients can run themselves after handover."*, bullets *Design systems & UI / Front-end build & CMS setup / Performance & SEO / Care & iteration*.
- [ ] **Group — Photography & film** — `kris.html`, grep `Stills and motion shot, directed and edited in-house` — desc *"Stills and motion shot, directed and edited in-house, from documentary frames to finished brand film."*, bullets *Documentary & editorial photography / Brand & commercial shoots / Direction & production / Edit, grade & motion*.
- [ ] **Group — Audio, apps & AI** — `kris.html`, grep `Sound, software and automation built to carry` — desc *"Sound, software and automation built to carry the same message as the rest of the work."*, bullets *Audio production & mix / Web apps & prototypes / Workflow automation / Custom AI agents & assistants*.

### 03 / Selected history

- [ ] **Section note** — `kris.html`, grep `Provable, dated engagements. Earlier roles to follow` — *"Provable, dated engagements. Earlier roles to follow."*
- [ ] **History rows ×5** — `kris.html`, grep `Amplify conference: identity, motion and web` — *"2023 – 2025 — Amplify conference: identity, motion and web, three consecutive builds"*, *"2023 – 2024 — More Conference: site and campaign, rebooked for a second year"*, *"2024 — Band Camp: brand, site and photography"*, *"2023 — Firezone: platform for a youth network across NZ, Fiji, Tonga and Samoa"*, *"2018 – now — Photography practice: documentary, editorial and commercial"*.
- [ ] **Earlier-roles comment slot (BLOCKER)** — `kris.html`, grep `Add earlier roles:` — currently a commented-out `<div class="fact">` template awaiting pre-2018 history, if Kris wants it included. See Launch Checklist.

### 04 / The full CV

- [ ] **Body line** — `kris.html`, grep `The complete CV, references included, is available on request` — *"The complete CV, references included, is available on request."*
- [ ] **CV request button** — `kris.html`, grep `Request the CV</a>` — *"Request the CV"* (mailto link) — job: **current live state**; the PDF-download swap sits commented directly below it (grep `assets/kris-singh-cv.pdf`) and needs the actual file dropped in before switching over. See Launch Checklist.
- [ ] **Closer cross-link + CTA** — `kris.html`, grep `The studio</span>` — *"The studio"* / *"← Back to the studio"* + button *"Book a call"*.

---

## archive.html

### Meta

- [ ] **Meta title** — `archive.html`, grep `<title>The Archive` — *"The Archive — Singh Studio Photography"*.
- [ ] **Meta description** — `archive.html`, grep `The Singh Studio photography archive — movement studies` — *"The Singh Studio photography archive — movement studies, documentary frames, portraits and landscapes from Aotearoa New Zealand and beyond."*
- [ ] **og:title / og:description (shorter than meta description)** — `archive.html`, grep `Selected photography: movement, documentary, people, land` — *"Singh Studio — The Archive"* / *"Selected photography: movement, documentary, people, land."*

### Hero

- [ ] **Hero eyebrow** — `archive.html`, grep `08 /</span> The archive` — *"08 / The archive"*.
- [ ] **Hero title** — `archive.html`, grep `The<em class` — *"The / Archive"*.
- [ ] **Hero lede** — `archive.html`, grep `Selected frames: the studio’s eye across movement` — *"Selected frames: the studio’s eye across movement, documentary, people and land."*
- [ ] **Frame count (auto-updates from DOM, don’t hand-edit)** — `archive.html`, grep `id="archiveCount"` — static fallback *"37 frames / 4 sets"*, JS recounts live from the actual `.ph` figures — **note: this doesn’t match the "40 frames / 4 sets" hard-coded on index.html’s light-table end-card**, reconcile before launch.

### Set tabs (four sets — labels only, counts auto-update)

- [ ] **Tab labels** — `archive.html`, grep `set-tab active` — *"Movement"*, *"Documentary"*, *"People"*, *"Land & Wild"* (the superscript numbers next to each are JS-recounted, don’t hand-edit).

### Set 01 — Movement

- [ ] **Set blurb** — `archive.html`, grep `A studio dance production: pigment, shadow` — *"A studio dance production: pigment, shadow and a white cyclorama."*
- [ ] **Figcaptions ×9** — `archive.html`, grep `Movement study / pigment I` — *"Movement study / pigment I"*, *"Company / flight"*, *"Movement study / shadow"*, *"Solo / dark stage"*, *"The cyc / scale"*, *"On set / the frame inside the frame"*, *"Pigment floor / aftermath"*, *"Solo / white"*, *"On set / direction"*.

### Set 02 — Documentary

- [ ] **Set blurb** — `archive.html`, grep `Streets, parades, kitchens and weather` — *"Streets, parades, kitchens and weather: life as it happens."*
- [ ] **Figcaptions ×12** — `archive.html`, grep `Brass in the rain</figcaption>` — *"Brass in the rain"*, *"Festival / orange"*, *"Festival floor"*, *"The bandmaster"*, *"Colours / parade"*, *"Café / warm"*, *"Kitchen shift"*, *"Alley / monochrome"*, *"Red wall / street"*, *"After hours"*, *"The raptor / monochrome"*, *"After the cyclone"*.

### Set 03 — People

- [ ] **Set blurb** — `archive.html`, grep `Weddings, portraits and the companions in between` — *"Weddings, portraits and the companions in between."*
- [ ] **Figcaptions ×11** — `archive.html`, grep `The cloak / ceremony</figcaption>` — *"The cloak / ceremony"*, *"Window light"*, *"The gazebo"*, *"Bouquet / gold"*, *"The groom / detail"*, *"Joy Florals / commercial"*, *"Golden hour"*, *"First snow"*, *"At home / low light"*, *"Companion / golden"*, *"The photographer / occasionally in frame"*.

### Set 04 — Land & Wild

- [ ] **Set blurb** — `archive.html`, grep `Aotearoa’s ranges and harbours, with detours` — *"Aotearoa’s ranges and harbours, with detours across the Tasman."*
- [ ] **Figcaptions ×8** — `archive.html`, grep `Braided river</figcaption>` — *"Braided river"*, *"The range / winter"*, *"Harbour crossing"*, *"High country / flock"*, *"Stone bridge"*, *"Last light"*, *"Across the Tasman / roo"*, *"Across the Tasman / giant"*.

### Closing CTA

- [ ] **CTA heading + body** — `archive.html`, grep `Need frames like these?` — *"Need frames like these? Let's talk."* (straight apostrophe in source) / *"Brand libraries, events, documentary projects: the camera bag is packed."*
- [ ] **Footer note (archive-specific, differs from every other page’s footer)** — `archive.html`, grep `Every frame above — ours` — *"Every frame above — ours."* — job: this replaces the usual *"Designed & built in-house. Obviously."* footer-note on every other page — a deliberate archive-only variant, don’t accidentally overwrite it with the generic one.

---

## thoughts.html (listing page)

### Meta

- [ ] **Meta title** — `thoughts.html`, grep `<title>Thoughts` — *"Thoughts — Singh Studio"*.
- [ ] **Meta description / og:description (identical)** — `thoughts.html`, grep `Occasional observations on messages, websites and the people` — *"Occasional observations on messages, websites and the people they're for, from Singh Studio."* (straight apostrophe in source)

### Hero

- [ ] **Hero eyebrow** — `thoughts.html`, grep `/</span> Observations` — *"/ Observations"*.
- [ ] **Hero title** — `thoughts.html`, grep `<span class="ht-inner" data-letters>Thoughts` — *"Thoughts"*.
- [ ] **Hero lede** — `thoughts.html`, grep `Occasional observations on messages, websites, and the people` — *"Occasional observations on messages, websites, and the people they’re for."*
- [ ] **Count line** — `thoughts.html`, grep `02 observations` — *"02 observations · RSS ↗"* — job: hand-typed count, update when you add/remove posts.

### Featured post card

- [ ] **Featured kicker** — `thoughts.html`, grep `Latest /</span> Method` — *"Latest / Method — June 2026 · 3 min"*.
- [ ] **Featured title + sub** — `thoughts.html`, grep `Why the artefact is the last decision, not the first: the three questions` — title *"Start with the message"*, sub *"Why the artefact is the last decision, not the first: the three questions that come before it."*
- [ ] **Featured read CTA** — `thoughts.html`, grep `Read the thought →` — *"Read the thought →"*.

### Topic filter chips

- [ ] **Topic chip labels ×3** — `thoughts.html`, grep `data-topic="all"` — *"All"*, *"Method"*, *"Briefing"* (superscript counts are hand-typed here, not JS-recounted — update if you add a topic or post).

### Post index (two rows — mirrors the featured card’s info in list form)

- [ ] **Index label** — `thoughts.html`, grep `The index</p>` — *"/ The index"*.
- [ ] **Row 1 — Start with the message** — `thoughts.html`, grep `Why the artefact is the last decision, not the first.</p>` — title *"Start with the message"*, sub *"Why the artefact is the last decision, not the first."*, date *"June 2026"*, tag *"Method"*, read-time *"3 min"*.
- [ ] **Row 2 — The 20-minute brief** — `thoughts.html`, grep `What to bring to an intro call` — title *"The 20-minute brief"*, sub *"What to bring to an intro call — and what to leave at home."*, date *"May 2026"*, tag *"Briefing"*, read-time *"2 min"*.

---

## thought-start-with-the-message.html (post 1)

### Meta

- [ ] **Meta title** — `thought-start-with-the-message.html`, grep `<title>Start with the message` — *"Start with the message — Singh Studio"*.
- [ ] **Meta description / og:description (identical)** — `thought-start-with-the-message.html`, grep `Why the artefact is the last decision, not the first.` — *"Why the artefact is the last decision, not the first."*

### Header

- [ ] **Eyebrow** — `thought-start-with-the-message.html`, grep `Thoughts — Method` — *"/ Thoughts — Method"*.
- [ ] **Post title + lede** — `thought-start-with-the-message.html`, grep `<h1 class="sub-title post-title">Start with the message` — *"Start with the message"* / *"Why the artefact is the last decision, not the first."*
- [ ] **Byline** — `thought-start-with-the-message.html`, grep `pb-name` — *"Kris Singh"*, *"June 2026 · 3 min read"*.

### Body (DRAFT — verify it reads as Kris’s voice before launch)

- [ ] **Opening para** — grep `Most briefs arrive pre-solved` — *"Most briefs arrive pre-solved. "We need a new website." "We need a video." Someone chose the artefact before anyone said the problem out loud, usually because it’s what the last supplier sold."*
- [ ] **Intro to method** — grep `Here’s the method we use instead` — *"Here’s the method we use instead. Three questions, in order."*
- [ ] **H2 — What has to be true afterwards?** — grep `<h2>What has to be true afterwards?</h2>` — heading, plus body *"Not what you want. What must be different in the world once this work has done its job?…"*
- [ ] **Sidenote a** — grep `Audiences” is plural thinking` — *"“Audiences” is plural thinking. Action is singular."*
- [ ] **H2 — Who has to act?** — grep `<h2>Who has to act?</h2>` — heading, plus body *"Messages don’t land on "audiences." They land on a person with a Tuesday: a parent deciding whether camp is safe, a board member skimming on a phone between meetings…"*
- [ ] **Margin figure caption** — grep `The carrier is a choice, Wellington Harbour` — *"The carrier is a choice, Wellington Harbour, from the archive"*.
- [ ] **H2 — Where will they meet it?** — grep `<h2>Where will they meet it?</h2>` — heading, plus body *"Only now does the artefact conversation start, and it’s a routing question rather than a taste one…"* — mentions Amplify’s three years as a concrete example.
- [ ] **Pull quote (margin)** — grep `Know the road first` — *"Know the road first."*
- [ ] **Blockquote — the essay’s signature line (FLAGGED — own or soften before launch)** — grep `We’ve built the wrong artefact for the right brief before` — *"You don’t choose the vehicle until you know the road. We’ve built the wrong artefact for the right brief before. It’s an expensive way to learn that."* — job: this is a confident, specific claim (implies a real past mistake) — decide if it’s true and you’re happy naming it publicly, or soften to something more general. See Launch Checklist.
- [ ] **Sidenote b** — grep `This is also why we’ll sometimes talk you out` — *"This is also why we’ll sometimes talk you out of the thing you came to buy. Cheaper than shipping the wrong artefact."*
- [ ] **Closing argument para** — grep `This is the honest case for a studio that does more than one thing` — *"This is the honest case for a studio that does more than one thing: not "we do everything," but we’re not stuck defaulting to whatever we happen to sell…"*
- [ ] **Final para / CTA-in-prose** — grep `Bring us the problem before you’ve solved it` — *"Bring us the problem before you’ve solved it. The three questions work just as well on a project that’s already underway, so if you’re mid-brief and something feels off, that’s usually why."*

### Footer of post

- [ ] **Share row label** — grep `Share /</span>` — *"Share /"* + buttons *"LinkedIn"* / *"X"* / *"Copy link"*.
- [ ] **Next-post nav** — grep `Next thought</span>` — *"Next thought"* / *"The 20-minute brief →"*.
- [ ] **Closer CTA** — grep `Bring us the problem</a>` — *"Bring us the problem"* (button).

---

## thought-the-20-minute-brief.html (post 2)

### Meta

- [ ] **Meta title** — `thought-the-20-minute-brief.html`, grep `<title>The 20-minute brief` — *"The 20-minute brief — Singh Studio"*.
- [ ] **Meta description / og:description (identical)** — grep `What to bring to an intro call — and what to leave at home.` — *"What to bring to an intro call — and what to leave at home."*

### Header

- [ ] **Eyebrow** — grep `Thoughts — Briefing` — *"/ Thoughts — Briefing"*.
- [ ] **Post title + lede** — grep `<h1 class="sub-title post-title">The 20-minute brief` — *"The 20-minute brief"* / *"What to bring to an intro call — and what to leave at home."*
- [ ] **Byline** — grep `pb-name` — *"Kris Singh"*, *"May 2026 · 2 min read"*.

### Body (DRAFT — verify it reads as Kris’s voice before launch)

- [ ] **Opening para** — grep `The intro call is twenty minutes on Google Meet` — *"The intro call is twenty minutes on Google Meet. People sometimes apologise for not having "a proper brief" ready. Good news: the proper brief is usually just the problem, said plainly."*
- [ ] **Margin figure caption** — grep `Twenty minutes of plain words, from the archive` — *"Twenty minutes of plain words, from the archive"*.
- [ ] **H2 — Bring these five things** — grep `<h2>Bring these five things</h2>` — heading + ordered list:
  - [ ] Item 1 — grep `The problem, in one sentence` — *"The problem, in one sentence. Plain words beat strategy language. "Nobody under 25 registers until the last week" is a good brief."*
  - [ ] Item 2 — grep `What "worked" looks like` — *"What "worked" looks like. If we’re celebrating in twelve months, what happened?"*
  - [ ] Item 3 — grep `Who has to care.</strong> The actual person` — *"Who has to care. The actual person, not the demographic."*
  - [ ] Item 4 — grep `What already exists` — *"What already exists. The current site, last year’s campaign, the photo folder nobody opens. If your team already runs its own CMS, bring the login: it tells us more than a description would."*
  - [ ] Item 5 — grep `The real deadline` — *"The real deadline. Not the padded one. We can work with honest."*
- [ ] **Sidenote a** — grep `If you can only bring one thing, bring №1` — *"If you can only bring one thing, bring №1. The rest we can excavate together."*
- [ ] **H2 — Leave these at home** — grep `<h2>Leave these at home</h2>` — heading + body *"The slide deck can stay home; it answers questions nobody’s asked yet…"*
- [ ] **Sidenote b** — grep `Inside two working days” is a promise, not a target` — *"“Inside two working days” is a promise, not a target. Hold us to it."*
- [ ] **Blockquote** — grep `You don’t need the answers on the call` — *"You don’t need the answers on the call. That’s what the twenty minutes is for."*
- [ ] **Closing para** — grep `Afterwards, you get a written scope inside two working days` — *"Afterwards, you get a written scope inside two working days: what we’d make, why, and the number, together. No surprises at proposal stage, ever. If the scope doesn’t match what you said on the call, that’s on us to explain, not you to accept."*

### Footer of post

- [ ] **Share row + next-post nav + closer CTA** — same shape as post 1, grep `Next thought</span>` — *"Next thought"* / *"Start with the message →"*.

---

## case-amplify.html

### Meta

- [ ] **Meta title** — grep `<title>Amplify — a Singh Studio case` — *"Amplify — a Singh Studio case"*.
- [ ] **Meta description / og:description (identical, complete sentence — not truncated)** — grep `Salvation Army NZ Youth needed an annual conference site` — *"Salvation Army NZ Youth needed an annual conference site with a fresh identity each year — Singh Studio has rebuilt it three years running."*

### Case header

- [ ] **Eyebrow + back-link** — grep `Case /01</span> Selected work` — *"Case /01"* / *"Selected work"* + *"← All work"*.
- [ ] **Case title** — grep `data-letters>Amplify` — *"Amplify"*.
- [ ] **Case meta strip** — grep `The Salvation Army NZ — Youth` — Client *"The Salvation Army NZ — Youth"*, Years *"2023 – 2025"*, Scope *"Web · Identity · Motion"*, Role *"Design & build"*.

### Body

- [ ] **The brief** — grep `The Salvation Army’s national youth conference needed a digital home` — *"The Salvation Army’s national youth conference needed a digital home that could carry a fresh identity every year, take registrations without friction, and feel the way the event sounds: loud, young, certain."*
- [ ] **The approach** — grep `An identity-led build: each year’s theme drives the type` — *"An identity-led build: each year’s theme drives the type, colour and motion across the site. The registration flow and information architecture stay deliberately boring…"* + bullets *Annual identity extension / Design & front-end build / Registration flow / Motion & launch assets*.
- [ ] **The outcome facts ×3** — grep `Three consecutive builds: 2023, 2024, 2025` — *"Renewed — Three consecutive builds: 2023, 2024, 2025"*, *"Runs on — A CMS the youth team updates themselves"*, *"One desk — Identity, motion and web from a single supplier"*.
- [ ] **Pull quote** — grep `The best outcome a studio can show: the client came back` — *"“The best outcome a studio can show: the client came back. Twice.”"*

### Footer of case

- [ ] **Next-case nav** — grep `Next case</span>` — *"Next case"* / *"More Conference →"*.
- [ ] **Templates cross-link** — grep `Want this shape, sooner?` — *"Want this shape, sooner? Templates →"*.
- [ ] **Closer CTA** — grep `Start your brief</a>` — *"Start your brief"*.

---

## case-more.html

### Meta

- [ ] **Meta title** — grep `<title>More Conference — a Singh Studio case` — *"More Conference — a Singh Studio case"*.
- [ ] **Meta description / og:description (identical, complete sentence — not truncated)** — grep `A national conference needed its story told twice` — *"A national conference needed its story told twice — once to fill the room, and again to carry the message past the weekend."*

### Case header

- [ ] **Eyebrow + back-link** — grep `Case /02</span>` — *"Case /02"* / *"Selected work"* + *"← All work"*.
- [ ] **Case title** — grep `data-letters>More Conference` — *"More Conference"*.
- [ ] **Case meta strip** — grep `<dd>More Conference</dd>` — Client *"More Conference"*, Years *"2023 – 2024"*, Scope *"Web · Campaign"*, Role *"Design & build"*.

### Body

- [ ] **The brief** — grep `A national conference needed its story told twice: once to fill the room` — *"A national conference needed its story told twice: once to fill the room, and again to carry the message past the weekend."*
- [ ] **The approach** — grep `A campaign-first site: one clear promise above the fold` — *"A campaign-first site: one clear promise above the fold, programme and speakers a scroll away, and social assets cut from the same design system so the feed and the site speak with one voice."* + bullets *Site design & build / Campaign asset system / Programme & speaker content model / Launch support*.
- [ ] **The outcome facts ×3** — grep `Rebooked the following year` — *"Returned — Rebooked the following year — 2023 → 2024"*, *"Managed by — The conference team, no developer needed"*, *"System — Web and social cut from one design language"*.
- [ ] **Pull quote** — grep `One message, told at every size` — *"“One message, told at every size: billboard to browser tab.”"*

### Footer of case

- [ ] **Next-case nav** — grep `Band Camp →` — *"Next case"* / *"Band Camp →"*.
- [ ] **Templates cross-link + closer CTA** — same shape as Amplify.

---

## case-bandcamp.html

### Meta

- [ ] **Meta title** — grep `<title>Band Camp — a Singh Studio case` — *"Band Camp — a Singh Studio case"*.
- [ ] **Meta description / og:description (identical)** — grep `A national music camp with years of heritage needed a 2024 identity` — *"A national music camp with years of heritage needed a 2024 identity and a site that made signing up feel as good as showing up."*

### Case header

- [ ] **Eyebrow + back-link** — grep `Case /03</span>` — *"Case /03"* / *"Selected work"* + *"← All work"*.
- [ ] **Case title** — grep `data-letters>Band Camp` — *"Band Camp"*.
- [ ] **Case meta strip** — grep `<dd>The Salvation Army NZ</dd>` — Client *"The Salvation Army NZ"*, Years *"2024"*, Scope *"Brand · Web · Photography"*, Role *"Design, build & shoot"*.

### Body

- [ ] **The brief** — grep `Years of heritage came with an expectation to match` — *"Years of heritage came with an expectation to match: this national music camp needed a 2024 identity and a site that made signing up feel as good as showing up."*
- [ ] **The approach** — grep `Brand refresh first: a mark that works on a hoodie` — *"Brand refresh first: a mark that works on a hoodie and a hero section alike. Then a focused build, with dates, registration and FAQs up front, and photography from the camp floor doing the persuasion."* + bullets *2024 identity refresh / Site design & build / On-the-ground photography / Print & merch assets*.
- [ ] **The outcome facts ×3** — grep `Brand, web and photography from one supplier` — *"Range — Brand, web and photography from one supplier"*, *"Refresh — 2024 identity across web, print and merch"*, *"Photography — Shot on the camp floor, not a stock library"*.
- [ ] **Pull quote** — grep `When the same eye designs the mark and shoots the floor` — *"“When the same eye designs the mark and shoots the floor, everything matches.”"*

### Footer of case

- [ ] **Next-case nav** — grep `Firezone →` — *"Next case"* / *"Firezone →"*.
- [ ] **Templates cross-link + closer CTA** — same shape as Amplify.

---

## case-firezone.html

### Meta

- [ ] **Meta title** — grep `<title>Firezone — a Singh Studio case` — *"Firezone — a Singh Studio case"*.
- [ ] **Meta description / og:description (identical, complete sentence — not truncated)** — grep `A youth network spanning NZ, Fiji, Tonga and Samoa` — *"A youth network spanning NZ, Fiji, Tonga and Samoa needed one home base — Singh Studio built a single platform a small team runs itself."*

### Case header

- [ ] **Eyebrow + back-link** — grep `Case /04</span>` — *"Case /04"* / *"Selected work"* + *"← All work"*.
- [ ] **Case title** — grep `data-letters>Firezone` — *"Firezone"*.
- [ ] **Case meta strip** — grep `The Salvation Army — Youth</dd>` — Client *"The Salvation Army — Youth"*, Years *"2023"*, Scope *"Web · Brand"*, Role *"Design & build"*.

### Body

- [ ] **The brief** — grep `One digital home base was missing` — *"One digital home base was missing: events, resources and identity for a youth network spanning Aotearoa, Fiji, Tonga and Samoa, a community spread across the Pacific."*
- [ ] **The approach** — grep `A platform build with a content model shaped around regions` — *"A platform build with a content model shaped around regions and events, designed to be maintained by a small national team and read on the phones it would actually be opened on."* + bullets *Platform design & build / Brand system / Content architecture / Team handover*.
- [ ] **The outcome facts ×3** — grep `Youth across NZ, Fiji, Tonga &amp; Samoa` — *"Reach — Youth across NZ, Fiji, Tonga & Samoa"*, *"Built for — Small-team maintenance, mobile-first reading"*, *"Shipped — Brand and build together, 2023"*.
- [ ] **Pull quote** — grep `Four countries, one platform, and a small team` — *"“Four countries, one platform, and a small team who can run it themselves.”"*

### Footer of case

- [ ] **Next-case nav** — grep `Amplify →` — *"Next case"* / *"Amplify →"* (case studies form a closed loop: Amplify → More → Band Camp → Firezone → Amplify).
- [ ] **Templates cross-link + closer CTA** — same shape as Amplify.

---

## 404.html

- [ ] **Meta title** — grep `<title>404 — Singh Studio` — *"404 — Singh Studio"*.
- [ ] **Eyebrow** — grep `/</span> 404` — *"/ 404"*.
- [ ] **Heading** — grep `Lost the<em class` — *"Lost the / thread"*.
- [ ] **Lede** — grep `This page doesn’t exist — but the studio does` — *"This page doesn’t exist — but the studio does."*
- [ ] **CTAs** — grep `Back to the studio</a>` — *"Back to the studio"* + *"See the work"*.
- [ ] **Footer note (unique — 404 has no full footer, just this line)** — grep `Wrong turn, right studio` — *"Wrong turn, right studio."*

---

## Sitewide repeating blocks (appear identically across most/all root pages) — corrected 2026-07-08

These blocks are duplicated verbatim across pages rather than pulled from a shared template (no build step, remember), so a wording change means editing every file that contains it. Listed once here; don’t re-edit page by page without a find-and-replace pass. **`bin/check-site.py` now enforces the nav/menu/footer label rows below automatically on every push** — it fails the build if any of the 12 nav'd pages' labels or order drift from each other, so manual cross-page grepping for these three specifically is no longer the only safety net.

- [x] **Primary nav** (`nav-links`) — appears on all 12 non-404 pages, grep `<span class="nl-num">01</span>Disciplines` — *Disciplines / Work / Thoughts / Kris*. (Corrected — was *Work / Services / Templates / Engagements / Studio*, a 5-item set from before the brand-reconciliation pass.)
- [ ] **Mobile menu** (`menu-links` + `menu-foot`) — same 12 pages, grep `menu-foot` — labels *Disciplines / Work / Thoughts / Kris / Book a call*, foot text *"Singh Studio, Aotearoa New Zealand<br>kris@singhstudio.co.nz"* (foot text unchanged).
- [x] **Footer nav** (`footer-links`) — same 12 pages, grep `<a href="#index">Disciplines</a>` (or `index.html#index` on non-homepage pages) — *Disciplines / Work / Thoughts / Kris / Contact*. (Corrected — was an 8-item list, *Work / Templates / Engagements / Services / Archive / Thoughts / Profile / Contact*, that no longer matches any page's actual footer.)
- [x] ~~**Footer social links (PLACEHOLDER — BLOCKER)**~~ — **RESOLVED, differently than scoped** — social links were removed sitewide rather than filled in with real URLs (no real profiles existed). No footer page has a social-links row currently. See `README.md`'s "Social links — removed, how to re-add" for the markup to bring them back once real profile URLs exist.
- [ ] **Footer copyright + mail + hint** — same 12 pages, grep `© <span id="year">` — *"© [year] Singh Studio, Aotearoa New Zealand"*, mailto *kris@singhstudio.co.nz*, hint *"Press / anywhere. The slash starts the conversation"* (checked 2026-07-08: index.html now reads "Press <kbd>/</kbd> anywhere. The slash starts the conversation" with a full stop; other pages use an em dash in the same spot — "Press / anywhere — the slash starts the conversation" — this em-dash/full-stop split is real and still present, not fixed in this pass, worth normalising).
- [ ] **Footer note "Designed & built in-house. Obviously."** — 11 of 13 root pages (all except archive.html’s *"Every frame above — ours."* and 404.html’s *"Wrong turn, right studio."*) — grep `Designed &amp; built in-house. Obviously.` (Unchanged.)

---

## Templates shopfront demos (templates/*.html) — summarised, not itemised

The seven demo sites (`templates/toolbelt.html`, `counter.html`, `ledger.html`, `commons.html`, `programme.html`, `folio.html`, `storefront.html`) each build out a **fictional NZ business** (a plumber, a café, an accountancy practice, a church, a conference, a photographer’s portfolio, a small shop) with fully invented names, addresses, prices, opening hours and testimonials. This copy is deliberately fictional demo dressing and is **not** part of the launch content pass — leave it alone.

Two things on each demo genuinely belong to Singh Studio and should stay accurate:

- [ ] **The demo bar** — one line per file, grep `ss-demo-label` — e.g. *"Template demo · The Toolbelt · a Singh Studio build"* (all seven follow this pattern, template name changes per file) — job: keeps the demo honestly labelled as a demo, not a real business.
- [ ] **`noindex` meta tag** — present in all seven demo files — job: keeps fictional businesses out of search results. Verify it stays if you ever copy a demo to start an eighth template.

Also note: several demos reuse real Singh Studio photography as set-dressing for the fictional business (e.g. `commons.html` uses `gal-pasifika.jpg` for a "community gathering", `counter.html` uses `gal-cafe-doc.jpg` for the fictional café's interior). Full list is in `IMAGE-MAP.md` under "Cross-use in demos" — if you replace one of those source photos sitewide, check that section before you do, or a demo page will break.

---

## Total count

**267 checkbox rows** across the 13 root pages, the sitewide repeating-block section, and the demo-summary section. Recount by running `grep -c "^- \[ \]" CONTENT-GUIDE.md` after any edit to this file.
