// Demo only. A made-up resource blog for Harbourlight Community Trust, shaped the way
// Squarespace returns /resources?format=json. Dates are relative to today, so "New" badges always have something to show.
(function () {
  var DAY = 864e5, now = Date.now();
  var here = location.pathname.replace(/[^/]*$/, ''); // this demo folder, wherever it's served from
  var art = function (id) { return id ? here + 'art/' + id + '.jpg' : 'https://static1.squarespace.com/static/hl-demo/t/' + Math.random().toString(36).slice(2, 10) + '/1790000000000/'; };
  var real = function (f) { return here + 'files/' + f; };
  // Squarespace body markup, cut down to what matters.
  var p = function (t) { return '<p class="" style="white-space:pre-wrap;">' + t + '</p>'; };
  var a = function (href, label) { return '<a href="' + href + '">' + label + '</a>'; };
  var btn = function (href, label) {
    return '<div class="sqs-block button-block sqs-block-button"><div class="sqs-block-content"><div class="sqs-block-button-container sqs-block-button-container--center">' +
      '<a href="' + href + '" class="sqs-block-button-element--medium sqs-button-element--primary sqs-block-button-element">' + label + '</a></div></div></div>';
  };
  var yt = function (id) {
    return '<div class="sqs-block video-block sqs-block-video" data-block-json="{&quot;url&quot;:&quot;https://www.youtube.com/watch?v=' + id + '&quot;,&quot;resolvedBy&quot;:&quot;youtube&quot;}"><div class="sqs-block-content">' +
      '<div class="sqs-video-wrapper" data-html="&lt;iframe width=&quot;200&quot; height=&quot;113&quot; src=&quot;https://www.youtube.com/embed/' + id + '?feature=oembed&quot; allowfullscreen&gt;&lt;/iframe&gt;"></div></div></div>';
  };
  var vimeo = function (id) {
    return '<div class="sqs-block video-block sqs-block-video" data-block-json="{&quot;url&quot;:&quot;https://vimeo.com/' + id + '&quot;}"><div class="sqs-block-content">' +
      '<div class="sqs-video-wrapper" data-html="&lt;iframe src=&quot;https://player.vimeo.com/video/' + id + '?app_id=122963&quot;&gt;&lt;/iframe&gt;"></div></div></div>';
  };
  var audio = function (url, title) {
    return '<div class="sqs-block audio-block sqs-block-audio"><div class="sqs-block-content"><div class="sqs-audio-embed" data-url="' + url + '" data-title="' + title + '" data-author="Harbourlight Community Trust" data-show-download="true"></div></div></div>';
  };
  var ask = p('Questions? Email ' + a('mailto:office@harbourlight.example', 'the trust office') + ' and we’ll point you to the right person.');

  // [title, days ago, art id ('' = no thumbnail), categories, tags, excerpt, body]
  var R = [
    ['Safeguarding policy &amp; procedures', 6, 'safeguarding-policy', ['Safeguarding', 'Featured'], ['Audience: Volunteers', 'Audience: Leaders'],
      'How we keep children, young people and vulnerable adults safe at every Harbourlight programme. Read it before you start volunteering, and again each year.',
      p('This is the policy every staff member, volunteer and leader at Harbourlight agrees to. It covers what safe practice looks like, how we recruit, and exactly what to do if you’re worried about someone.') +
      btn(real('harbourlight-safeguarding-policy.pdf'), 'Download the policy') + ask],
    ['Volunteer onboarding pack', 12, 'onboarding-pack', ['Volunteering', 'Featured'], ['Audience: Volunteers'],
      'Everything a new volunteer needs in one place: a welcome letter, role descriptions, the shift rota and who to call when something comes up.',
      p('Welcome! Start with the pack, then have a look at the role descriptions and pick a shift on the rota.') +
      btn('/s/volunteer-onboarding-pack.pdf', 'Download') + p(a('/s/volunteer-role-descriptions.docx', 'Role descriptions (Word)')) +
      p(a(real('volunteer-rota-template.csv'), 'Volunteer rota template')) + ask],
    ['Welcome to Harbourlight: a short film for new volunteers', 20, 'welcome-film', ['Volunteering', 'Training', 'Featured'], ['Audience: Volunteers'],
      'Seven minutes on who we are, how a busy day at the centre runs behind the scenes, and the people you’ll be working alongside.',
      yt('hlDemoVid01') + p('Filmed at the harbour-side centre over two weeks in winter. Thanks to everyone who appears in it.')],
    ['Reporting a concern: what to do', 41, '', ['Safeguarding'], ['Audience: Leaders', 'Audience: Volunteers'],
      'A one-page flowchart for the moment you’re worried about a child or adult: who to tell, what to write down, and what not to do.',
      p('Print this and keep it in the holiday programme room and the youth hall.') + btn('/s/reporting-a-concern-flowchart.pdf', 'Download')],
    ['Police vetting: how to apply', 95, 'police-vetting', ['Safeguarding', 'Volunteering'], ['Audience: Volunteers'],
      'Anyone who works with children or young people at Harbourlight is police vetted. Here’s how it works and how long it takes.',
      p('Police vetting is free and usually takes two to four weeks. The trust office starts the request for you, and you’ll get an email asking you to confirm your details.') +
      p('Bring two forms of ID to the front desk on any weekday morning. We’ll let you know as soon as your result comes back, and we keep it private.') + ask],
    ['Photo consent form', 130, '', ['Safeguarding', 'Kids'], ['Type: Form', 'Audience: Families'],
      'One form per child, once a year, so we know which photos we can and can’t share.',
      p('Fill this in and hand it to the holiday programme team.') + p(a('/s/photo-consent-form.docx', 'Photo consent form'))],
    ['Incident report form', 210, 'incident-form', ['Safeguarding'], ['Type: Form', 'Audience: Leaders'],
      'For accidents, near misses and anything else that should be written down on the day. It saves straight to the safeguarding team.',
      p('Open the form, make a copy, and fill it in while it’s fresh.') + btn('https://docs.google.com/document/d/1hlDemoIncidentReportFormX/edit?usp=sharing', 'Open the form')],
    ['Safeguarding training, part 1: recognising harm', 160, 'training-harm', ['Safeguarding', 'Training'], ['Audience: Volunteers', 'Audience: Leaders'],
      'The first of our recorded training sessions: the signs of harm, and why it matters to notice small things.',
      yt('hlDemoVid02') + p('About 25 minutes. Watch it with a cup of tea, then talk it over with your team leader.')],
    ['Volunteer rota template', 75, '', ['Volunteering'], ['Audience: Volunteers'],
      'The spreadsheet our food bank and op shop teams use to plan shifts a term at a time. Copy it for your own team.',
      p('One tab per team, one row per week.') + btn(real('volunteer-rota-template.csv'), 'Download the template')],
    ['Food bank volunteer handbook', 300, 'foodbank-handbook', ['Volunteering'], ['Audience: Volunteers'],
      'Packing parcels, the Tuesday and Friday shifts, welcoming people with dignity, and what to do when someone arrives upset.',
      btn('/s/food-bank-volunteer-handbook.pdf', 'Download')],
    ['Community lunch roster (shared sheet)', 52, '', ['Volunteering'], [],
      'Morning tea, the Wednesday community lunch and the big shared dinners: put your name down for a spot that suits you.',
      p('Anyone with the link can add their name.') + btn('https://docs.google.com/spreadsheets/d/1hlDemoLunchRosterX/edit', 'Open the roster')],
    ['Youth group games: 50 that need no gear', 3, 'youth-games', ['Youth'], ['Audience: Leaders'],
      'Fifty tried-and-tested games for the start of youth night, sorted by group size, with notes on keeping everyone included.',
      p('Collected over ten years of Friday nights.') + btn('/s/youth-group-games.pdf', 'Download the games')],
    ['Term planner for youth leaders', 25, 'term-planner', ['Youth'], ['Audience: Leaders'],
      'Plan a whole term of youth nights on one page: themes, activities, games and who’s leading.',
      btn('https://docs.google.com/spreadsheets/d/1hlDemoTermPlannerX/copy', 'Make a copy')],
    ['Youth night workshop plans: Term 4', 33, 'workshop-plans', ['Youth'], ['Audience: Leaders'],
      'Eight short workshops on money, mates and making plans, with slides, questions for small groups and a challenge for the week ahead.',
      btn('/s/youth-night-workshops-term-4.pptx', 'Download the slides')],
    ['Parent permission form for trips', 180, '', ['Youth'], ['Type: Form', 'Audience: Families'],
      'Needed for every trip away from the centre, from the beach day to camp.',
      p(a('/s/trip-permission-form.docx', 'Download') + ' and return it to a youth leader before the trip.')],
    ['Kids&#39; activity sheets: Ocean week', 15, 'kids-ocean', ['Kids'], ['Audience: Families'],
      'Colouring, mazes and a make-at-home craft for each day of the week, all about the sea. Print as many as you like.',
      btn('/s/kids-activity-ocean.pdf', 'Download')],
    ['Kids’ activity sheets: Space', 60, 'kids-space', ['Kids'], ['Audience: Families'],
      'Rockets, planets and a very long trip to the moon, in puzzles and pictures for ages four to ten.',
      btn('/s/kids-activity-space.pdf', 'Download')],
    ['Holiday programme registration', 44, 'holiday-programme', ['Kids'], ['Audience: Families'],
      'Five mornings of games, stories and crafts in the January holidays. Places are limited, so register early.',
      p('Registration takes about five minutes.') + btn('https://forms.gle/hlDemoHolidayForm', 'Register')],
    ['Holiday programme playlist', 260, '', ['Kids', 'Music'], ['Audience: Families'],
      'The songs we sing at the holiday programme, for the car and the kitchen.',
      p(a('https://open.spotify.com/playlist/hlDemoKidsSongs', 'Listen on Spotify'))],
    ['Making It Stretch, week 1: where the money goes', 9, 'stretch-1', ['Adult learning'], ['Audience: Leaders'],
      'The first of four sessions: a spending diary to try for a week, and questions to talk over as a group.',
      btn('/s/making-it-stretch-week-1.pdf', 'Download the session')],
    ['Making It Stretch, week 2: a plan that fits', 16, 'stretch-2', ['Adult learning'], ['Audience: Leaders'],
      'A budget that works for real life, with room in it for birthdays, school trips and the car.',
      btn('/s/making-it-stretch-week-2.pdf', 'Download the session')],
    ['Making It Stretch, week 3: debt, and a way through', 23, 'stretch-3', ['Adult learning'], ['Audience: Leaders'],
      'Talking about debt without shame, which debts to tackle first, and who can help.',
      btn('/s/making-it-stretch-week-3.pdf', 'Download the session')],
    ['Making It Stretch, week 4: saving for what matters', 30, 'stretch-4', ['Adult learning'], ['Audience: Leaders'],
      'Small savings that add up, and a plan for the things that matter most to your family.',
      btn('/s/making-it-stretch-week-4.pdf', 'Download the session')],
    ['Making It Stretch: the whole course', 5, 'stretch-all', ['Adult learning'], ['Audience: Leaders'],
      'All four session guides and the facilitator’s notes in one place, for groups starting the course late or running it again.',
      p('Everything for the Making It Stretch budgeting course, weeks 1 to 4.') + p(a('/s/making-it-stretch-week-1.pdf', 'Week 1: where the money goes')) + p(a('/s/making-it-stretch-week-2.pdf', 'Week 2: a plan that fits')) +
      p(a('/s/making-it-stretch-week-3.pdf', 'Week 3: debt, and a way through')) + p(a('/s/making-it-stretch-week-4.pdf', 'Week 4: saving for what matters')) +
      p(a('https://www.dropbox.com/scl/fi/hl0demo/making-it-stretch-facilitators-notes.docx?rlkey=hldemo&dl=0', 'Facilitator’s notes'))],
    ['Making It Stretch: facilitator’s notes', 10, '', ['Adult learning'], ['Audience: Leaders'],
      'Background for each week, the questions people tend to ask, and how to keep a group discussion on track.',
      p(a('https://www.dropbox.com/scl/fi/hl0demo/making-it-stretch-facilitators-notes.docx?rlkey=hldemo&dl=0', 'Facilitator’s notes (Word)'))],
    ['Leading a good discussion (recorded talk)', 120, 'leading-discussion', ['Adult learning', 'Training'], ['Audience: Leaders'],
      'Forty minutes on asking open questions, handling silence, and making room for the quiet person.',
      audio('/s/leading-a-good-discussion.mp3', 'Leading a good discussion') + p('Recorded at the tutors’ evening in May.')],
    ['한인 소그룹 가이드 (Korean small group guide)', 70, '', ['Adult learning'], ['Audience: Leaders'],
      '한인 소그룹 리더를 위한 안내서입니다. A guide for leaders of our Korean-speaking conversation groups.',
      btn('/s/korean-small-group-guide.pdf', '다운로드')],
    ['Chord charts: the spring concert set', 8, 'chords-spring', ['Music'], ['Audience: Volunteers'],
      'Chords, lyrics and the keys we sing them in, for the community choir’s spring concert.',
      btn('/s/chord-charts-spring-concert.pdf', 'Download the charts')],
    ['Tūtira mai: waiata for the choir', 90, 'waiata', ['Music'], [],
      'Song sheets with te reo Māori and English side by side, and a guide to pronunciation for the choir.',
      btn('/s/waiata-song-sheets.pdf', 'Download the song sheets')],
    ['Choir rehearsal notes', 18, '', ['Music'], ['Audience: Volunteers'],
      'This term’s song list, rehearsal times and who’s singing which part.',
      btn('https://docs.google.com/document/d/1hlDemoRehearsalNotesX/edit', 'Open the notes')],
    ['Sound desk quick start', 150, 'sound-desk', ['Music', 'Training'], ['Audience: Volunteers'],
      'Twelve minutes on switching everything on, getting a clean mix and switching it all off again.',
      vimeo('900000101')],
    ['Annual report 2025', 200, 'annual-report', ['About the trust'], ['Audience: Community groups'],
      'What Harbourlight Community Trust did last year: 6,200 food parcels, 41 community grants and the people who made it happen.',
      btn('/s/hct-annual-report-2025.pdf', 'Download the report')],
    ['Grant application template', 55, 'grant-template', ['About the trust'], ['Type: Form', 'Audience: Community groups'],
      'Applying for one of our small community grants? Start with this template. It asks the same questions the trustees will.',
      btn('/s/hct-grant-application.docx', 'Download the template')],
    ['Grant budget template', 56, '', ['About the trust'], ['Audience: Community groups'],
      'A simple budget to send with your application, with an example filled in.',
      btn('/s/hct-grant-budget.xlsx', 'Download the budget')],
    ['Funding calendar 2026–27', 85, 'funding-calendar', ['About the trust'], ['Audience: Community groups'],
      'When each grant round opens and closes, and when the trustees meet to decide.',
      p('Round one opens in February and closes on the last Friday of March. Round two opens in July and closes in late August.') +
      p('The trustees meet six weeks after each round closes. We’ll email every applicant within a week of the meeting.')],
    ['Becoming a trustee', 110, 'trustee', ['About the trust', 'Volunteering'], ['Audience: Volunteers'],
      'What the role asks of you, how often the board meets, and how to put your name forward before the AGM.',
      btn('/s/becoming-a-trustee.pdf', 'Download the guide')],
    ['Trust deed and governance', 520, 'trust-deed', ['About the trust'], ['Audience: Community groups'],
      'The Harbourlight Community Trust’s deed, its governance policy, and how trustees are appointed.',
      p(a('/s/hct-trust-deed.pdf', 'Trust deed')) + p(a('/s/hct-governance-policy.pdf', 'Governance policy'))],
    ['Community funding guide', 150, '', ['About the trust'], ['Audience: Community groups'],
      'A plain-English guide to finding funding for community projects in Aotearoa, from a partner organisation.',
      p('Our friends at Community Matters keep this up to date.') + btn('https://www.communitymatters.example/funding-guide', 'Read the guide')],
    ['First aid refresher (recorded training)', 190, 'first-aid', ['Training'], ['Audience: Volunteers', 'Audience: Leaders'],
      'A refresher on the basics, recorded with our first aid trainer. It doesn’t replace a certificate course.',
      yt('hlDemoVid03')],
    ['Welcoming newcomers (recorded training)', 280, 'welcoming', ['Training', 'Volunteering'], ['Audience: Volunteers'],
      'What it feels like to walk into a community centre for the first time, and small things that make a big difference.',
      vimeo('900000102')],
    ['Supporting someone through a hard time', 360, '', ['Training'], ['Audience: Leaders'],
      'Listening well, knowing your limits, and when to bring someone else in.',
      p('Looking out for people at Harbourlight is shared by many of us, not just the staff. These notes are a starting point for anyone who finds themselves supporting someone through a hard season.') +
      p('Listen more than you talk, and ask what would help before you offer advice. Keep what you hear private unless someone is at risk, and if they are, follow the safeguarding policy.')],
    ['Holiday programme network: ideas and training', 230, '', ['Kids', 'Training'], ['Audience: Leaders'],
      'A national network for people who run school-holiday programmes, with free training days and an ideas library.',
      btn('https://holidayprogrammes.example.org/', 'Visit the network')],
    ['Photo library for volunteers', 65, '', ['Volunteering'], ['Audience: Volunteers'],
      'Approved photos for posters, slides and the newsletter, all with consent.',
      btn('https://drive.google.com/drive/folders/1hlDemoPhotoLibraryX', 'Open the folder')]
  ];
  var today = Math.floor(now / DAY) * DAY;
  var items = R.map(function (r, i) {
    var at = now - r[1] * DAY - i * 37e5;
    var slug = r[0].replace(/&[#\w]+;/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'resource-' + i;
    return {
      id: 'hl-res-' + (i < 9 ? '0' : '') + (i + 1), title: r[0], fullUrl: '/resources/' + slug, urlId: slug,
      publishOn: at, addedOn: at, updatedOn: at, assetUrl: art(r[2]), categories: r[3], tags: r[4],
      excerpt: '<p class="" style="white-space:pre-wrap;">' + r[5] + '</p>', body: r[6], author: { displayName: 'Harbourlight Community Trust' }
    };
  }).sort(function (x, y) { return y.publishOn - x.publishOn; });
  window.DEMO_DATA = window.DEMO_DATA || {};
  window.DEMO_DATA['/resources'] = {
    type: 'blog',
    collection: { id: 'hl-resources', title: 'Resources', typeName: 'blog', itemCount: items.length, updatedOn: today, fullUrl: '/resources' },
    items: items
  };
})();
