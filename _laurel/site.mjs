// The Laurel pages on singhstudio.co.nz/laurel/, written as data and rendered with one layout.
// Run by build.mjs. Prices and checkout links live in PRICES and the config block below.
// Prices and checkout links come from _laurel/shop.json (see _laurel/LAUNCH.md).
import { createRequire } from 'node:module';
const Samples = createRequire(import.meta.url)('./src/samples.js');
export const SITE = 'https://www.singhstudio.co.nz';
let PRICES = { club: 149, trade: 449, dfy: 349 };
let CHECKOUT = { club: '', trade: '' };

const LOGO = '<svg viewBox="0 0 32 32" aria-hidden="true"><rect width="32" height="32" rx="8" fill="#d9b35c"/><path d="M16 27V11" stroke="#17140f" stroke-width="2" stroke-linecap="round"/><path d="M16 12c-.6-3.4-2.7-5.6-6.2-6.4.3 3.5 2.5 5.7 6.2 6.4zM16 12c.6-3.4 2.7-5.6 6.2-6.4-.3 3.5-2.5 5.7-6.2 6.4zM16 18.5c-1.6-2.8-4.3-4.2-7.9-4.1 1.2 3.1 3.9 4.5 7.9 4.1zM16 18.5c1.6-2.8 4.3-4.2 7.9-4.1-1.2 3.1-3.9 4.5-7.9 4.1zM16 24.4c-2.2-2.2-5-3-8.3-2.3 1.7 2.7 4.5 3.5 8.3 2.3zM16 24.4c2.2-2.2 5-3 8.3-2.3-1.7 2.7-4.5 3.5-8.3 2.3z" fill="#17140f"/></svg>';
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function layout({ path, title, description, body, jsonld = [], current = '', image = 'og-laurel.jpg' }) {
  const depth = path.split('/').filter(Boolean).length; // laurel/ = 1, laurel/guide/ = 2
  const up = '../'.repeat(depth - 1);
  const url = SITE + '/' + path;
  const nav = [['', 'Laurel'], ['guide/', 'Setup guide'], ['#pricing', 'Pricing']];
  return `<!doctype html>
<html lang="en-NZ">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<link rel="canonical" href="${url}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="Laurel by Singh Studio">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:url" content="${url}">
<meta property="og:image" content="${SITE}/laurel/assets/img/${image}">
<meta name="twitter:card" content="summary_large_image">
<meta name="theme-color" content="#0c0b09">
<link rel="icon" href="${up}assets/img/favicon.svg" type="image/svg+xml">
<link rel="preload" href="${up}../assets/fonts/switzer-variable.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="${up}assets/laurel.css">
${jsonld.map((j) => `<script type="application/ld+json">${JSON.stringify(j)}</script>`).join('\n')}
</head>
<body>
<a class="skip" href="#main">Skip to content</a>
<header class="top">
  <div class="wrap">
    <a class="mark" href="${SITE}/" aria-label="Singh Studio home">S<span class="d">·</span><span class="s">/</span><span class="d">·</span>S</a>
    <a class="prod" href="${up || './'}">${LOGO}Laurel</a>
    <nav aria-label="Laurel">
      <a href="${up || './'}#how">How it works</a>
      <a href="${up}guide/"${current === 'guide' ? ' aria-current="page"' : ''}>Setup guide</a>
      <a href="${up || './'}#pricing">Pricing</a>
    </nav>
    <a class="btn btn--sm" href="${up}app/" data-track="try_click" data-track-label="header">Try it free</a>
  </div>
</header>
<main id="main">
${body}
</main>
<footer class="foot">
  <div class="wrap">
    <span>Laurel by <a href="${SITE}/">Singh Studio</a>, Aotearoa New Zealand</span>
    <nav aria-label="More about Laurel">
      <a href="${up}guide/">Setup guide</a>
      <a href="${up}golf/">Golf clubs</a>
      <a href="${up}bowls/">Bowling clubs</a>
      <a href="${up}schools/">Schools</a>
      <a href="${up}sports-clubs/">Sports clubs</a>
      <a href="${up}licence/">Licence &amp; terms</a>
      <a href="${up}licence/#privacy">Privacy</a>
      <a href="mailto:kris@singhstudio.co.nz">kris@singhstudio.co.nz</a>
    </nav>
  </div>
</footer>
<script type="application/json" id="laurel-config">${JSON.stringify({ checkout: CHECKOUT, email: 'kris@singhstudio.co.nz' })}</script>
<script src="${up}assets/laurel.js" defer></script>
</body>
</html>
`;
}

const tick = (items) => `<ul class="ticks">${items.map((i) => `<li>${i}</li>`).join('')}</ul>`;
const faq = (items) => `<div class="faq">${items.map(([q, a]) => `<details><summary>${q}</summary><div>${a.split('\n\n').map((p) => `<p>${p}</p>`).join('')}</div></details>`).join('')}</div>`;
const faqLD = (items) => ({ '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: items.map(([q, a]) => ({ '@type': 'Question', name: q.replace(/<[^>]+>/g, ''), acceptedAnswer: { '@type': 'Answer', text: a.replace(/<[^>]+>/g, '') } })) });
const crumbs = (list) => ({ '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: list.map(([name, p], i) => ({ '@type': 'ListItem', position: i + 1, name, item: SITE + '/' + p })) });
const product = () => ({
  '@context': 'https://schema.org', '@type': 'SoftwareApplication', name: 'Laurel', applicationCategory: 'BusinessApplication', operatingSystem: 'Any modern web browser',
  description: 'Digital honours boards for clubs and schools: one file for the clubhouse TV, the club website and a touchscreen. One payment, no subscription.',
  url: SITE + '/laurel/', image: SITE + '/laurel/assets/img/tv-timber.webp',
  publisher: { '@type': 'Organization', name: 'Singh Studio', url: SITE + '/' },
  offers: [
    { '@type': 'Offer', name: 'Club licence', price: String(PRICES.club), priceCurrency: 'USD', url: SITE + '/laurel/#pricing' },
    { '@type': 'Offer', name: 'Trade licence', price: String(PRICES.trade), priceCurrency: 'USD', url: SITE + '/laurel/#pricing' },
  ],
});

const tvDemo = (up = '') => `
      <div class="tvwrap rise">
        <div class="tv"><div class="tv-screen"><iframe src="${up}demo/?embed=1#screen" title="Live demo: the honours boards of Kōwhai Bay Golf Club, a made-up club" loading="lazy" tabindex="-1"></iframe></div></div>
        <div class="tv-stand" aria-hidden="true"></div>
        <div class="tv-switch" role="group" aria-label="Try a style">
          <button class="chip" type="button" aria-pressed="true" data-demo="${up}demo/?embed=1#screen">Timber &amp; gold</button>
          <button class="chip" type="button" aria-pressed="false" data-demo="${up}demo/school/?embed=1#screen">Heritage</button>
          <button class="chip" type="button" aria-pressed="false" data-demo="${up}demo/rugby/?embed=1#screen">Modern</button>
          <a class="chip" href="${up}demo/#screen" data-demo-open target="_blank" rel="noopener">Full screen ↗</a>
        </div>
      </div>`;

const HOME_FAQ = [
  ['What do we need for the TV?', 'Any TV with an HDMI socket, plus something that runs a web browser: an old laptop, a small mini PC, or a streaming stick with a browser. Open the file, press F for full screen and leave it running. <a href="guide/#tv">The setup guide</a> walks through each option.'],
  ['Do we need the internet?', 'No. Everything is inside the file: names, fonts, crest and pictures, so it runs offline. You only need the internet to put the board on your website, or if you want a streaming stick to load it from there.'],
  ['How do members search from home?', 'Download the website file and put it on your club website, or on a free host like Netlify. Then add that address in Laurel, and your TV shows a QR code to it. <a href="guide/#website">Here’s how.</a>'],
  ['How do we add names next season?', 'Open the editor, open your file (or carry on where you left off), add the new names and download again. Replace the old file on the TV or website. A screen that loads the board from your website notices the new file and refreshes itself.'],
  ['How many names will it hold?', 'Thousands. Long boards flow across as many pages as they need on the TV, and the website lists everything with search and a filter on each board.'],
  ['We have a portrait TV in the hallway.', 'Good: Laurel lays boards out to suit a tall screen, the way a real honours board hangs.'],
  ['Can we see it with our own names before we pay?', 'Yes, and I’d encourage it. The free trial does everything with your names, on your own TV. Files made in the trial carry a small “Laurel trial” ribbon until you buy a licence.'],
  ['Is it a subscription?', 'No. One payment, and every update to version 1 is included.'],
  ['What if Singh Studio disappears?', 'Your files keep working. They don’t call home, need an account or rely on my servers. You can download the editor itself and keep it, too.'],
  ['Do you collect any data?', 'No. While you work, your names stay in your own browser. Checking a licence key sends the key to Lemon Squeezy, my payment provider, and nothing else. The boards themselves have no tracking or cookies. <a href="licence/#privacy">Privacy details.</a>'],
  ['Can we keep some names off the internet?', 'Yes. Any board can be kept off the website and touchscreen with one switch, and its names are left out of those files completely. Schools use it for current students.'],
  ['Refunds?', 'Because you can try everything free first, purchases aren’t refundable. If it isn’t working the way you hoped, email me and I’ll help you get it right.'],
];

function home() {
  const body = `
  <section class="hero">
    <div class="wrap hero-grid">
      <div>
        <p class="label"><b>Digital honours boards</b> · for clubs and schools</p>
        <h1 style="margin-top:22px">The honours board that never runs out of <em>wall.</em></h1>
        <p class="lede">Laurel puts your club’s honours on the clubhouse TV, on your website and on a touchscreen, all from one file. Type or paste the names, choose a look and save. One payment, no subscription, nothing to install.</p>
        <div class="cta"><a class="btn" href="app/" data-track="try_click" data-track-label="hero">Try it free with your names</a><a class="btn btn--ghost" href="app/#example" data-track="example_click">Open the example club</a></div>
        <p class="fine">Free to try · US$${PRICES.club} once per club · Works offline</p>
      </div>${tvDemo()}
    </div>
  </section>
  <div class="band" aria-label="Made for"><div class="wrap"><span>Golf clubs</span><span>Bowling clubs</span><span>Schools</span><span>Rugby, cricket, netball and hockey</span><span>Rowing and surf clubs</span><span>Rotary and Lions</span><span>Lodges, bands and choirs</span></div></div>

  <section class="block">
    <div class="wrap">
      <div class="head rise"><div><p class="label">Why go digital</p><h2>Timber boards are beautiful. They’re also <em>full.</em></h2></div>
        <p>Laurel keeps the look and the dignity of a real honours board, and takes away the three things every club secretary knows too well.</p></div>
      <div class="trio">
        <div class="problem rise"><h3>The wall runs out</h3><p>Sooner or later the last board has no room left, and another one means another fundraiser and another stretch of wall you don’t have.</p></div>
        <div class="problem rise"><h3>Every name costs</h3><p>New names wait for the signwriter and arrive with a bill, every season. A spelling mistake is there for good.</p></div>
        <div class="problem rise"><h3>Nobody can find themselves</h3><p>Eighty years of champions across a dozen boards, and a grandchild visiting can’t find Grandad. The names deserve better than a squint from across the room.</p></div>
      </div>
    </div>
  </section>

  <section class="block bone" id="how">
    <div class="wrap">
      <div class="head rise"><div><p class="label"><b>How it works</b></p><h2>Three steps. <em>One afternoon.</em></h2></div>
        <p>The editor runs in your browser and saves as you go. There’s nothing to install and no account to make, and your names never leave your computer while you work.</p></div>
      <ol class="steps3">
        <li class="rise"><h3>Type or paste your names</h3><p>Copy straight from Excel, Google Sheets or a Word document. Laurel splits “1987 J. Smith” into the year and the name for you, and lines up columns from a spreadsheet.</p></li>
        <li class="rise"><h3>Choose a look</h3><p>Timber &amp; gold, Heritage or Modern, with your crest and your club colours. A live preview shows it on a TV, a phone and a touchscreen as you go.</p></li>
        <li class="rise"><h3>Save one file</h3><p>Download it for the TV, the website or a touchscreen. It works offline, runs on almost anything with a browser, and it’s yours to keep.</p></li>
      </ol>
      <figure class="rise" style="margin:clamp(30px,4vw,56px) 0 0"><img src="assets/img/editor.webp" width="1600" height="1000" alt="The Laurel editor: a board’s names in a table on the left and a live TV preview on the right" loading="lazy" style="border-radius:14px;box-shadow:0 30px 70px rgba(12,11,9,.18);border:1px solid var(--hair-dark)"><figcaption class="fine" style="margin-top:12px;color:var(--mute-dark)">The editor, with the example club loaded. The preview on the right is the real board, updating as you type.</figcaption></figure>
    </div>
  </section>

  <section class="block">
    <div class="wrap">
      <div class="head rise"><div><p class="label">One file, three places</p><h2>On the TV. On the website. <em>In their hands.</em></h2></div>
        <p>The same names and the same look everywhere, so the honours in the clubhouse and the honours online always agree.</p></div>
      <div class="surface rise">
        <img src="assets/img/tv-timber.webp" width="1600" height="900" alt="A golf club’s men’s champions board on a TV: gold lettering on timber, three columns of years and names, with a QR code in the corner" loading="lazy">
        <div><p class="label"><b>01</b> · The clubhouse TV</p><h3>A slideshow with the dignity of the real thing.</h3>
          <p>A cover with your crest, this year’s honours, then every board in turn. Long lists flow across pages by themselves, in landscape or portrait.</p>
          ${tick(['Runs from a laptop, a mini PC or a streaming stick', 'A QR code lets members look themselves up on their phones', 'Drifts a hair between slides to protect screens from burn-in', 'Re-upload the file and screens loading it from your website refresh themselves'])}</div>
      </div>
      <div class="surface flip rise">
        <div class="phone"><img src="assets/img/web-phone.webp" width="600" height="1298" alt="A member’s page on a phone listing all of their honours across the club’s boards" loading="lazy"></div>
        <div><p class="label"><b>02</b> · Your website</p><h3>Every member gets a page of their own.</h3>
          <p>A searchable honours page people can use from home and share. Each person’s page gathers every honour they’ve earned across every board.</p>
          ${tick(['Search ignores accents, so “henare” finds Hēnare', 'Type a year to see everyone honoured that year', 'Readable by search engines, screen readers and printers', 'No tracking, no cookies, no accounts'])}</div>
      </div>
      <div class="surface rise">
        <img src="assets/img/kiosk.webp" width="1600" height="900" alt="A touchscreen showing A to Z surname buttons and a list of members named Hamilton" loading="lazy">
        <div><p class="label"><b>03</b> · A touchscreen in the foyer</p><h3>Plays until someone touches it.</h3>
          <p>The slideshow runs until someone walks up, then it turns into a search with big surname buttons. When they walk away it goes back to the slideshow on its own.</p>
          ${tick(['Big A–Z buttons for browsing by surname', 'Works on any touchscreen that runs a browser', 'Back to the slideshow after 90 seconds'])}</div>
      </div>
    </div>
  </section>

  <section class="block bone">
    <div class="wrap">
      <div class="head rise"><div><p class="label"><b>Made for the people who look after it</b></p><h2>Easy for the secretary. <em>Proper for the club.</em></h2></div>
        <p>Most honours boards are kept by a volunteer with a spreadsheet and good intentions. Laurel is built for exactly that person.</p></div>
      <div class="feats">
        <div class="feat rise"><h3>Built for volunteers</h3><p>Big buttons, plain words, undo on everything, and it saves as you go. If you can use a spreadsheet you can use Laurel.</p></div>
        <div class="feat rise"><h3>Paste from anywhere</h3><p>Excel, Google Sheets, Word or a typed list. Years and names land in the right columns.</p></div>
        <div class="feat rise"><h3>This year’s honours</h3><p>A spotlight slide for the newest names, and a quiet mark beside them on their boards.</p></div>
        <div class="feat rise"><h3>Stories, not just names</h3><p>Give a life member or inductee a photo and a few words, and they get a slide of their own.</p></div>
        <div class="feat rise"><h3>Pairs, fours and crews</h3><p>A winning team is credited to every person in it, so everyone finds every honour.</p></div>
        <div class="feat rise"><h3>One person, one page</h3><p>“A. B. Jones”, “A.B. JONES” and “Ab Jones” are recognised as the same person.</p></div>
        <div class="feat rise"><h3>Macrons and accents</h3><p>Māori, Samoan, Tongan, Dutch and Irish names render properly in every style, and you can rename any word on the boards.</p></div>
        <div class="feat rise"><h3>Yours for good</h3><p>No subscription and no account. The file keeps working whatever happens to Singh Studio.</p></div>
        <div class="feat rise"><h3>Private by design</h3><p>Names stay on your computer while you work. Keep any board off the internet with one switch.</p></div>
      </div>
    </div>
  </section>

  <section class="block">
    <div class="wrap">
      <div class="head rise"><div><p class="label">What it costs</p><h2>The sums are <em>simple.</em></h2></div>
        <p>Laurel works alongside your timber boards, too: keep the old boards for their history and put everything since on the screen.</p></div>
      <div class="table-scroll rise"><table class="compare">
        <thead><tr><th scope="col"><span class="sr">Compared on</span></th><th scope="col">Timber boards</th><th scope="col">Subscription screen systems</th><th scope="col">Laurel</th></tr></thead>
        <tbody>
          <tr><th scope="row">Up front</th><td>A new board each time one fills</td><td>Often a hardware package or a set-up fee</td><td class="us">US$${PRICES.club}, once</td></tr>
          <tr><th scope="row">Every year</th><td>Signwriting for each new name</td><td>Licence fees, often thousands</td><td class="us">Nothing</td></tr>
          <tr><th scope="row">Room for more</th><td>Until the wall runs out</td><td>Plenty</td><td class="us">Thousands of names</td></tr>
          <tr><th scope="row">Searchable</th><td>No</td><td>Usually</td><td class="us">On the TV, the website and phones</td></tr>
          <tr><th scope="row">Runs on</th><td>One wall</td><td>Their screens and their software</td><td class="us">Any screen with a web browser</td></tr>
        </tbody>
      </table></div>
    </div>
  </section>

  <section class="block" id="pricing" style="padding-top:0">
    <div class="wrap">
      <div class="head rise"><div><p class="label"><b>Pricing</b></p><h2>Pay once. <em>Keep it for good.</em></h2></div>
        <p>Try everything free first with your own names. When you buy, enter your key in the editor and download your files again without the trial ribbon.</p></div>
      <div class="prices">
        <div class="price feature rise"><p class="label"><b>Most clubs</b></p><h3>Club licence</h3><p class="amt">US$${PRICES.club}<small>once</small></p><p class="per">For one club, school or organisation</p>
          ${tick(['Every TV, website and touchscreen you run', 'As many boards and names as you like', 'Free updates to version 1', 'Help by email from me'])}
          <a class="btn" href="#" data-buy="club" data-price="${PRICES.club}" data-name="Laurel Club licence">Buy the Club licence</a></div>
        <div class="price rise"><p class="label">For the trade</p><h3>Trade licence</h3><p class="amt">US$${PRICES.trade}<small>once</small></p><p class="per">For signwriters, trophy shops, AV installers and web designers</p>
          ${tick(['Make boards for any number of clubs', 'Remove the small Laurel mark', 'Sell the boards you make as part of your service', 'Help by email from me'])}
          <a class="btn btn--ghost" href="#" data-buy="trade" data-price="${PRICES.trade}" data-name="Laurel Trade licence">Buy the Trade licence</a></div>
        <div class="price rise"><p class="label">Done for you</p><h3>I’ll set it up</h3><p class="amt" style="font-size:44px">from US$${PRICES.dfy}</p><p class="per">Club licence included</p>
          ${tick(['Send me photos of your old boards', 'I type up every name and check them with you', 'You get finished files for your TV and website'])}
          <a class="btn btn--ghost" href="mailto:kris@singhstudio.co.nz?subject=${encodeURIComponent('Laurel: done for you')}&amp;body=${encodeURIComponent('Hi Kris,\n\nWe’d like you to set up Laurel for us.\n\nClub or school: \nRoughly how many boards: \nWebsite: \n\nThanks!')}" data-track="dfy_click">Ask about it</a></div>
      </div>
      <p class="fine" style="margin-top:22px">Prices are in US dollars. Checkout is run by Lemon Squeezy as merchant of record, which charges any GST, VAT or sales tax that applies where you are and emails your receipt and licence key.</p>
    </div>
  </section>

  <section class="block bone" id="faq">
    <div class="wrap">
      <div class="head rise"><div><p class="label"><b>Questions</b></p><h2>Before you <em>start.</em></h2></div><p>Something not covered here? Email <a href="mailto:kris@singhstudio.co.nz">kris@singhstudio.co.nz</a> and you’ll hear back from me, the person who made it.</p></div>
      ${faq(HOME_FAQ)}
    </div>
  </section>

  <section class="cta-band">
    <div class="wrap">
      <h2>Put every name back <em>in the light.</em></h2>
      <p>Start with the example club or with your own names. It takes a few minutes to see your boards on a screen.</p>
      <div class="cta"><a class="btn" href="app/" data-track="try_click" data-track-label="footer">Try Laurel free</a><a class="btn btn--ghost" href="guide/">Read the setup guide</a></div>
    </div>
  </section>`;
  return layout({
    path: 'laurel/', current: 'home',
    title: 'Laurel · Digital honours boards for clubs and schools',
    description: 'Put your club or school’s honours boards on the clubhouse TV, your website and a touchscreen from one file. Type or paste the names, choose a look, save. One payment, no subscription. Free to try.',
    body, jsonld: [product(), faqLD(HOME_FAQ), crumbs([['Singh Studio', ''], ['Laurel', 'laurel/']])],
  });
}

function guide() {
  const body = `
  <section class="page-hero">
    <div class="wrap">
      <p class="label"><b>Setup guide</b></p>
      <h1 style="margin-top:20px;font-size:clamp(40px,6vw,84px)">Putting Laurel on a <em>screen.</em></h1>
      <p class="lede">Each of these takes ten to thirty minutes, and none needs anyone technical. If you get stuck, email me a photo of what you’re seeing.</p>
      <div class="toc"><a class="chip" href="#tv">On a TV</a><a class="chip" href="#website">On your website</a><a class="chip" href="#touchscreen">On a touchscreen</a><a class="chip" href="#names">Getting names in</a><a class="chip" href="#update">Next season</a><a class="chip" href="#trouble">If something’s not right</a></div>
    </div>
  </section>
  <section class="block bone" style="padding-top:clamp(40px,6vw,80px)">
    <div class="wrap split">
      <article class="prose">
        <h2 id="tv" style="margin-top:0">On a TV</h2>
        <p>In the editor, go to <b>Save &amp; publish</b> and download the file <b>For a TV</b>. It’s a single file with everything inside it. Then pick whichever of these suits your clubhouse.</p>
        <h3>A laptop or mini PC (simplest, works offline)</h3>
        <ol>
          <li>Copy the TV file onto the computer, from a USB stick or by email.</li>
          <li>Plug the computer into the TV with an HDMI cable.</li>
          <li>Double-click the file. It opens in the web browser (Chrome or Edge are best).</li>
          <li>Click once, or press <kbd>F</kbd>, for full screen.</li>
          <li>Stop the computer going to sleep. On Windows: <b>Settings → System → Power</b>, and set the screen and sleep times to <b>Never</b>. On a Mac: <b>System Settings → Lock Screen</b>, and set the display to never turn off.</li>
        </ol>
        <p class="tip">To have it start by itself whenever the computer turns on (Windows): press <kbd>Win</kbd>+<kbd>R</kbd>, type <code>shell:startup</code>, and in the folder that opens make a shortcut with this target, using your own file’s location: <code>"C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe" --kiosk "C:\\Honours\\our-club-honours-tv.html"</code></p>
        <p>A small fanless mini PC tucked behind the TV is the tidiest version of this, and it’s what I’d buy if the club doesn’t have a spare laptop.</p>
        <h3>A streaming stick or Android TV box</h3>
        <p>These need the board to be on your website first (see below), because they open web addresses rather than files.</p>
        <ol>
          <li>Install a web browser on the stick. Most streaming sticks offer one in their app store; a kiosk browser app is ideal because it can open full screen and reopen after a power cut.</li>
          <li>Open your board’s web address with <code>#screen</code> on the end, for example <code>https://yourclub.co.nz/honours/#screen</code>.</li>
          <li>Set the browser to full screen and to open that address when it starts.</li>
        </ol>
        <p>The board checks your website every ten minutes for a newer file, so when you upload new names, the TV picks them up by itself.</p>
        <h3>The TV’s own web browser</h3>
        <p>Many smart TVs have a browser. Open your board’s web address with <code>#screen</code> on the end. It works, but TV browsers vary and some switch themselves off after a while, so the first two options are more dependable.</p>
        <h3>Portrait screens</h3>
        <p>Mount the TV on its side and set the computer’s display to portrait (Windows: <b>Settings → System → Display → Display orientation → Portrait</b>). Laurel notices and lays the boards out tall, like a real honours board.</p>

        <h2 id="website">On your website</h2>
        <p>Download the file <b>For your website</b>. It’s one page with every board, a search box and a page for every person.</p>
        <h3>If your web host lets you upload files</h3>
        <p>Most hosting does: cPanel’s file manager, FTP, or your host’s own uploader. Make a folder called <code>honours</code>, upload the file into it and rename it <code>index.html</code>. Your board is now at <code>yourclub.co.nz/honours/</code>.</p>
        <h3>If you don’t have hosting, or your site is built on Squarespace or Wix</h3>
        <p>Website builders like Squarespace and Wix can’t host a file like this themselves, so put it on a free host and link to it.</p>
        <ol>
          <li>Make a free account at <a href="https://www.netlify.com/" rel="noopener">Netlify</a>.</li>
          <li>Put the website file in a folder on your computer and rename it <code>index.html</code>.</li>
          <li>In Netlify, choose to deploy manually and drag that folder onto the page. You’ll get a web address straight away.</li>
          <li>Add a link to that address in your club website’s menu. On Squarespace or Wix you can also show it inside a page with an embed block.</li>
        </ol>
        <p>Your web person can point a tidy address like <code>honours.yourclub.co.nz</code> at it later.</p>
        <h3>WordPress</h3>
        <p>WordPress’s media library won’t accept web pages, so upload the file with your host’s file manager as above, or use the Netlify route and link to it.</p>
        <h3>Then add the QR code</h3>
        <p>Once the board is live, paste its address into <b>Step 1 → Your honours page on the web</b> in the editor, and download the TV file again. The TV now shows a QR code members can scan to look themselves up.</p>

        <h2 id="touchscreen">On a touchscreen</h2>
        <p>Download the file <b>For a touchscreen</b>. It plays the slideshow until someone touches it, lets them search, then goes back to the slideshow after 90 seconds without a touch.</p>
        <ul>
          <li><b>A Windows touchscreen or all-in-one PC:</b> open it in Chrome’s kiosk mode, as in the TV tip above, so nobody can wander off to other websites.</li>
          <li><b>An Android tablet or touchscreen:</b> use a kiosk browser app and point it at the file, or at your board’s web address with <code>#kiosk</code> on the end.</li>
        </ul>

        <h2 id="names">Getting the names in</h2>
        <h3>Typing</h3>
        <p>Click a cell and type. <kbd>Enter</kbd> moves down a row and adds a new one at the bottom. Everything saves as you go, and <kbd>Ctrl</kbd>+<kbd>Z</kbd> undoes.</p>
        <h3>From a spreadsheet</h3>
        <p>Select the year and name cells in Excel or Google Sheets, copy, click the first cell in Laurel and paste. The rows land in place, starting from the cell you clicked.</p>
        <h3>From a typed list</h3>
        <p>Use <b>Paste a list…</b> on any board. It understands lines like <code>1987 J. Smith</code>, <code>1987 – J. Smith</code> and <code>J. Smith (1987)</code>, and shows you how it read them before adding them.</p>
        <h3>A whole club at once</h3>
        <p>Save a spreadsheet as CSV with these columns, then use <b>Open a saved file</b> (or <b>Import a spreadsheet</b> on the boards step):</p>
        <div class="table-scroll"><table><thead><tr><th>Board</th><th>Subtitle</th><th>Year</th><th>Name</th><th>Detail</th></tr></thead>
          <tbody><tr><td>Club Champions</td><td>Men</td><td>1987</td><td>J. Smith</td><td></td></tr><tr><td>Hole in One</td><td></td><td>2024</td><td>Ana Tupou</td><td>7th hole</td></tr></tbody></table></div>
        <h3>From photos of your old boards</h3>
        <p>Photograph each board straight on, in good light. Type them up, or ask an AI assistant to turn a photo into lines of <code>year name</code>, and then check every line against the photo before pasting: lettering on old boards is easy to misread. Or <a href="mailto:kris@singhstudio.co.nz?subject=Laurel%3A%20done%20for%20you">send me the photos</a> and I’ll do it.</p>
        <h3>Teams, gaps and odd entries</h3>
        <ul>
          <li>Pairs and teams: separate names with <code>&amp;</code> or <code>/</code>. For bowls fours and rowing crews, tick <b>Team</b> on the name column, and names separated by commas each get the honour.</li>
          <li>Years with no winner: type <i>Not contested</i>, <i>Vacant</i> or <i>War years</i>. They show quietly on the board and aren’t treated as people.</li>
          <li>Notes in brackets, like <i>J. Smith (skip)</i>, are shown but ignored when matching people.</li>
        </ul>

        <h2 id="update">Next season</h2>
        <ol>
          <li>Open the editor. Your boards are where you left them. On a different computer, use <b>Open a saved file</b> and choose your backup or any board file.</li>
          <li>Add the new names. They get a small mark and a place on this year’s honours slide.</li>
          <li>Download the files again and replace the old ones on the TV and website.</li>
          <li>Download a fresh backup and keep it somewhere the next secretary can find it.</li>
        </ol>

        <h2 id="trouble">If something’s not right</h2>
        <h3>The TV shows a plain list instead of the slideshow</h3>
        <p>The browser is too old to run Laurel, so it falls back to a plain list of every board. Use a current version of Chrome, Edge, Firefox or Safari.</p>
        <h3>The screen goes black after a while</h3>
        <p>That’s the computer or the TV saving power. Set the computer’s screen and sleep times to <b>Never</b>, and turn off any power saving or auto standby on the TV.</p>
        <h3>There’s no QR code on the TV</h3>
        <p>Add your website address in <b>Step 1</b> of the editor and download the TV file again.</p>
        <h3>Pasted names went into the wrong columns</h3>
        <p>Press <kbd>Ctrl</kbd>+<kbd>Z</kbd>, click the cell where the first year should go, and paste again. Or use <b>Paste a list…</b>, which shows you the columns before anything changes.</p>
        <h3>My work has disappeared from the editor</h3>
        <p>Browsers sometimes clear what sites have saved. Open your latest backup or board file with <b>Open a saved file</b>. This is why the editor reminds you to keep a backup.</p>
        <p style="margin-top:28px">Still stuck? Email <a href="mailto:kris@singhstudio.co.nz?subject=Laurel%20help">kris@singhstudio.co.nz</a> with a photo or screenshot and I’ll help.</p>
      </article>
      <aside class="aside-card">
        <h3>Try it with your names</h3>
        <p>The editor is free to use. Files made in the trial carry a small ribbon until you buy a licence.</p>
        <a class="btn btn--ink" href="../app/" data-track="try_click" data-track-label="guide">Open the editor</a>
        <a class="btn btn--ghost" style="color:var(--ink);border-color:var(--hair-dark)" href="../demo/#screen" target="_blank" rel="noopener">See the demo full screen</a>
      </aside>
    </div>
  </section>`;
  return layout({
    path: 'laurel/guide/', current: 'guide',
    title: 'How to put your honours boards on a TV, website or touchscreen · Laurel',
    description: 'Step-by-step setup for Laurel digital honours boards: a clubhouse TV with a laptop, mini PC or streaming stick, your club website, a touchscreen kiosk, and getting names in from spreadsheets or photos.',
    body, jsonld: [crumbs([['Singh Studio', ''], ['Laurel', 'laurel/'], ['Setup guide', 'laurel/guide/']])],
  });
}

function licence() {
  const body = `
  <section class="page-hero">
    <div class="wrap">
      <p class="label"><b>Licence &amp; terms</b></p>
      <h1 style="margin-top:20px;font-size:clamp(40px,6vw,84px)">Licence, terms <em>and privacy.</em></h1>
      <p class="lede">Laurel is sold by Singh Studio, Aotearoa New Zealand. Checkout is run by Lemon Squeezy as merchant of record: they process your payment, charge any GST, VAT or sales tax that applies where you are, and email your receipt and licence key.</p>
    </div>
  </section>
  <section class="block bone" style="padding-top:clamp(40px,6vw,80px)">
    <div class="wrap">
      <article class="prose">
        <h2 style="margin-top:0">What you can do</h2>
        <p><b>Club licence:</b> use Laurel to make honours boards for one club, school or organisation, and show them on any number of screens, websites and touchscreens that organisation runs, for as long as you like.</p>
        <p><b>Trade licence:</b> use Laurel to make honours boards for any number of organisations, including as part of a paid service to your clients, and remove the small Laurel mark from boards you make. Your clients may keep using the boards after your work for them ends.</p>
        <p>With either licence you may change the board files you make for the organisations the licence covers.</p>
        <h2>What you can’t do</h2>
        <p>You may not sell, share or publish the Laurel editor, or offer Laurel itself as a product or service for others to make their own boards. Putting the boards you make on screens and websites is exactly what Laurel is for; giving other people the tool is not.</p>
        <h2>The free trial</h2>
        <p>You can use every part of Laurel free. Files made without a licence show a small “Laurel trial” ribbon. You’re welcome to use trial files, ribbon and all.</p>
        <h2>Licence keys</h2>
        <p>Your key is in your receipt email. Enter it in the editor once while online; the editor checks it with Lemon Squeezy and then works offline. Each key can be active on a few computers at once, so a committee can share the work. Moving computers? Deactivate the key on the old one from the editor.</p>
        <h2>Updates and help</h2>
        <p>Updates to version 1 are free for both licences. Help is by email, offered in good faith, usually within two working days.</p>
        <h2>Refunds</h2>
        <p>Because everything can be tried free before you buy, purchases aren’t refundable. If Laurel isn’t working the way you hoped, email <a href="mailto:kris@singhstudio.co.nz">kris@singhstudio.co.nz</a> and I’ll help you get it working.</p>
        <h2>No warranty</h2>
        <p>Laurel is provided as it is. Singh Studio isn’t liable for any loss arising from its use, to the extent the law allows. You’re responsible for the names and words you publish with it, including having permission to publish them where that’s needed.</p>
        <h2 id="privacy">Privacy</h2>
        <p><b>The editor</b> runs in your browser. Your boards, names and pictures are saved in that browser on your computer and in the files you download. They are never sent to Singh Studio or anyone else.</p>
        <p><b>Licence checks</b> send your licence key, and a label made from your organisation’s name and type of computer, to Lemon Squeezy, so they can confirm the key. This happens when you activate, about once a week after that while you use the editor online, and when you deactivate.</p>
        <p><b>Board files</b> contain no tracking, cookies or analytics, and don’t contact anyone. A board hosted on a website checks that same website for a newer copy of itself every ten minutes, so screens update after you upload a new file.</p>
        <p><b>These pages</b> may use privacy-friendly analytics to count visits and clicks on buy buttons; they don’t use advertising cookies. When you buy, Lemon Squeezy’s privacy policy covers your payment details.</p>
        <h2>General</h2>
        <p>These terms are governed by the laws of New Zealand. Nothing in them limits rights you have under consumer law that can’t be excluded.</p>
      </article>
    </div>
  </section>`;
  return layout({
    path: 'laurel/licence/', current: 'licence',
    title: 'Licence, terms and privacy · Laurel',
    description: 'The Club and Trade licences for Laurel digital honours boards, the free trial, licence keys, updates, refunds and privacy. Your names stay on your computer.',
    body, jsonld: [crumbs([['Singh Studio', ''], ['Laurel', 'laurel/'], ['Licence & terms', 'laurel/licence/']])],
  });
}

const SEGMENTS = [
  {
    slug: 'golf', tpl: 'golf', label: 'Golf clubs', one: 'golf club', img: 'tv-timber.webp', alt: 'A golf club’s champions board on a TV in gold lettering on timber',
    title: 'Digital honours boards for golf clubs · Laurel',
    description: 'Club champions, captains, presidents, life members, hole-in-ones and course records on the clubhouse TV, your website and members’ phones. One payment, no subscription.',
    h1: 'Digital honours boards for <em>golf clubs.</em>',
    lede: 'Club champions, captains, presidents, life members, hole-in-ones and course records on the clubhouse TV and your website. The gold leaf stays; the shortage of wall goes.',
    extra: 'Add your own as well: pennants, matchplay, foursomes, junior pennants or any trophy with a history.',
    why: [
      ['The bar already has a TV', 'Between the cricket and the rugby, let it show a hundred years of champions, with this year’s winners first.'],
      ['A hole-in-one, honoured the same day', 'Add the name, download the file and it’s on the screen before the round of drinks is finished. No waiting for the signwriter.'],
      ['New members find the history', 'A QR code on the screen opens the honours on their phone, with every member’s achievements gathered on one page.'],
      ['Your committee will manage it', 'If whoever looks after your handicap spreadsheet can copy and paste, they can look after Laurel.'],
    ],
    faq: [
      ['Can it show competition results or leaderboards?', 'Laurel is for honours, the names that stay for good. Live scores and leaderboards belong in your golf software; Laurel can sit on the same TV between them.'],
      ['We already have beautiful timber boards.', 'Keep them. Leave the history on the wall up to the year it filled, and put everything since, plus the whole archive, on the screen and website.'],
      ['How do we get eighty years of names in?', 'Copy them from a spreadsheet if you have one, type them, or send me photos of the boards and I’ll do it for you.'],
    ],
  },
  {
    slug: 'bowls', tpl: 'bowls', label: 'Bowling clubs', one: 'bowling club', img: 'tv-spot.webp', alt: 'This year’s honours slide on a TV in gold on timber',
    title: 'Digital honours boards for bowling clubs · Laurel',
    description: 'Champion of champions, singles, pairs, triples and fours, presidents and life members on the clubhouse TV and website. Every member of a winning team gets the honour.',
    h1: 'Digital honours boards for <em>bowling clubs.</em>',
    lede: 'Champion of champions, singles, pairs, triples and fours, presidents and life members, on the clubhouse TV, your website and members’ phones.',
    extra: 'Add your own as well: men’s, women’s and mixed events, club captains, centre and national representatives, or any trophy with a history.',
    why: [
      ['Fours are four people', 'Tick “Team” on a board and every player in a winning team is credited, so each member finds all of their titles on their own page.'],
      ['Room for every event', 'Clubs run dozens of competitions a season. A timber board for each was never realistic; Laurel holds the lot.'],
      ['In the clubhouse and online', 'The TV shows the slideshow, and members and their families can look the club’s history up from home.'],
      ['Made for the club secretary', 'Big buttons, plain words and undo on everything. It saves as you go.'],
    ],
    faq: [
      ['How do I enter a fours team?', 'Type the team into one cell with commas between the names, and tick “Team” on that column. The board shows the team as you wrote it, and each person gets the honour.'],
      ['Can we show who skipped?', 'Write it however you normally do, for example “J. Smith (skip)”. Notes in brackets show on the board but are ignored when matching people.'],
      ['Our clubhouse TV is old. Will it work?', 'It needs something that runs a web browser plugged into it, like an old laptop. The TV itself only needs an HDMI socket.'],
    ],
  },
  {
    slug: 'schools', tpl: 'school', label: 'Schools', one: 'school', img: 'tv-heritage.webp', alt: 'A school’s dux board in the Heritage style: navy ink on ivory paper',
    title: 'Digital honours boards for schools · Laurel',
    description: 'Dux, proxime accessit, head students, sportsperson of the year and an old students’ hall of fame on the foyer screen and school website. Keep current students off the internet with one switch.',
    h1: 'Digital honours boards for <em>schools.</em>',
    lede: 'Dux, proxime accessit, head students, sports and cultural awards and old students of note, on the foyer screen, the school website and at prizegiving.',
    extra: 'Add your own as well: cultural and service awards, scholarships, prefects, house captains or principals.',
    why: [
      ['Current students stay offline', 'Any board can be kept off the website with one switch, and its names are left out of the website file completely, not just hidden.'],
      ['Prizegiving, reunions and open days', 'Run the slideshow on the hall projector at prizegiving, and send old students the website link before a reunion.'],
      ['Works with the screen you have', 'Run it on its own screen, or add its web address as a slide in the signage software your school already uses.'],
      ['Honours with a story', 'Hall of Fame inductees get a photo and a citation on their own slide, so students see what their predecessors went on to do.'],
    ],
    faq: [
      ['Do we need consent to publish names?', 'Laurel shows only what you enter. Inside the school, a screen is no different from the boards you already have. For the website, follow your school’s privacy policy, and keep any board off the internet with one switch.'],
      ['Can it show te reo Māori?', 'Yes. Macrons display properly in every style, and you can rename any word on the boards, such as “Honours” or the search prompt.'],
      ['Who looks after it when staff change?', 'Keep the backup file in the school’s shared drive. Anyone can open it in the editor next year and carry on.'],
    ],
  },
  {
    slug: 'sports-clubs', tpl: 'sport', label: 'Sports clubs', one: 'sports club', img: 'tv-modern.webp', alt: 'A rugby club’s premiership winners board in bold type in navy and gold',
    title: 'Digital honours boards for rugby, cricket, netball and hockey clubs · Laurel',
    description: 'Premierships, players of the year, centurions, captains, coaches and life members on the clubrooms TV and in every member’s pocket, in your club colours.',
    h1: 'Digital honours boards for <em>sports clubs.</em>',
    lede: 'Premierships, players of the year, centurions, captains, coaches and life members: every honour your club has earned, on the clubrooms TV and in every member’s pocket.',
    extra: 'Add your own as well: coaches, players of the year by grade, or representative honours from region to national team.',
    why: [
      ['In your club colours', 'The Modern style uses your colours and big, bold type, made to be read from across the clubrooms.'],
      ['Prizegiving night', 'Put the slideshow on the projector while the room fills, with this season’s winners first.'],
      ['Juniors next to the greats', 'Young players see their names on the same boards as the club’s legends, and share their page with whānau.'],
      ['Team photos too', 'Add the premiership team photo to a winning year and it gets a slide of its own.'],
    ],
    faq: [
      ['Can we have a board for each grade?', 'Yes, or one board with a Grade column. One board per honour, with the grade beside the year, usually reads best.'],
      ['Does it work for cricket, netball, hockey, football, rowing and surf?', 'Yes. Boards are just lists you set up, with your own column headings, so they fit any sport.'],
      ['Can it show sponsors?', 'Laurel is for honours. Your sponsors can share the same TV through your normal screen setup.'],
    ],
  },
];

function segment(s) {
  const body = `
  <section class="hero">
    <div class="wrap hero-grid">
      <div>
        <p class="label"><b>Laurel</b> · for ${s.label.toLowerCase()}</p>
        <h1 style="margin-top:22px;font-size:clamp(40px,6.2vw,92px)">${s.h1}</h1>
        <p class="lede">${s.lede}</p>
        <div class="cta"><a class="btn" href="../app/#template=${s.tpl}" data-track="try_click" data-track-label="${s.slug}">Start a ${s.one} board free</a><a class="btn btn--ghost" href="../">How Laurel works</a></div>
        <p class="fine">Free to try · US$${PRICES.club} once · No subscription</p>
      </div>
      <div class="rise"><div class="tv"><div class="tv-screen"><img src="../assets/img/${s.img}" width="1600" height="900" alt="${esc(s.alt)}"></div></div><div class="tv-stand" aria-hidden="true"></div></div>
    </div>
  </section>
  <section class="block bone">
    <div class="wrap split">
      <article class="prose">
        <h2 style="margin-top:0">The boards it sets up for you</h2>
        <p>Start from the ${s.one} template and these boards are ready for your names. Rename them, add your own, or remove any you don’t keep.</p>
        <ul>${Samples.TEMPLATES[s.tpl].boards.map((b) => `<li><b>${b.title}${b.subtitle ? ' (' + b.subtitle + ')' : ''}</b>: ${b.cols.map((c) => c.label.toLowerCase()).join(', ')}</li>`).join('')}</ul>
        <p>${s.extra}</p>
        <h2>Why it suits ${s.label.toLowerCase()}</h2>
        ${s.why.map(([h, p]) => `<h3>${h}</h3><p>${p}</p>`).join('\n        ')}
        <h2>Questions</h2>
        ${s.faq.map(([q, a]) => `<h3>${q}</h3><p>${a}</p>`).join('\n        ')}
        <p style="margin-top:28px">More on <a href="../guide/">putting it on a TV, website or touchscreen</a>, or <a href="../#pricing">pricing</a>.</p>
      </article>
      <aside class="aside-card">
        <h3>See it with your own names</h3>
        <p>Open the editor with the ${s.one} template. It’s free to try, nothing to install, and your names stay on your computer.</p>
        <a class="btn btn--ink" href="../app/#template=${s.tpl}" data-track="try_click" data-track-label="${s.slug}-aside">Start free</a>
        <a class="btn btn--ghost" style="color:var(--ink);border-color:var(--hair-dark)" href="../demo/#screen" target="_blank" rel="noopener">Watch the demo</a>
      </aside>
    </div>
  </section>
  <section class="cta-band">
    <div class="wrap">
      <h2>Every name, every year, <em>on every screen.</em></h2>
      <p>US$${PRICES.club} once for your club. Try it free first with your own names.</p>
      <div class="cta"><a class="btn" href="../#pricing">See pricing</a><a class="btn btn--ghost" href="../app/#template=${s.tpl}">Try it free</a></div>
    </div>
  </section>`;
  return layout({
    path: `laurel/${s.slug}/`, current: s.slug, title: s.title, description: s.description, body,
    jsonld: [crumbs([['Singh Studio', ''], ['Laurel', 'laurel/'], [s.label, `laurel/${s.slug}/`]])],
  });
}

export function pages(shop = {}) {
  if (shop.prices) PRICES = { ...PRICES, ...shop.prices };
  if (shop.checkout) CHECKOUT = { ...CHECKOUT, ...shop.checkout };
  const out = { 'index.html': home(), 'guide/index.html': guide(), 'licence/index.html': licence() };
  for (const s of SEGMENTS) out[`${s.slug}/index.html`] = segment(s);
  const urls = ['laurel/', 'laurel/guide/', 'laurel/licence/', ...SEGMENTS.map((s) => `laurel/${s.slug}/`)];
  out['sitemap-laurel.xml'] = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map((u) => `  <url><loc>${SITE}/${u}</loc></url>`).join('\n')}\n</urlset>\n`;
  out['assets/img/favicon.svg'] = LOGO.replace('<svg ', '<svg xmlns="http://www.w3.org/2000/svg" ').replace(' aria-hidden="true"', '');
  return { files: out, urls };
}
