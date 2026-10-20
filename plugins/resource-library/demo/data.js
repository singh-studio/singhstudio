// Demo only. A made-up resource blog for Harbourlight Church and the Harbourlight Community Trust, shaped the way
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
    return '<div class="sqs-block audio-block sqs-block-audio"><div class="sqs-block-content"><div class="sqs-audio-embed" data-url="' + url + '" data-title="' + title + '" data-author="Harbourlight Church" data-show-download="true"></div></div></div>';
  };
  var ask = p('Questions? Email ' + a('mailto:office@harbourlight.example', 'the church office') + ' and we’ll point you to the right person.');

  // [title, days ago, art id ('' = no thumbnail), categories, tags, excerpt, body]
  var R = [
    ['Safeguarding policy &amp; procedures', 6, 'safeguarding-policy', ['Safeguarding', 'Featured'], ['Audience: Volunteers', 'Audience: Leaders'],
      'How we keep children, young people and vulnerable adults safe at every Harbourlight event. Read it before you start serving, and again each year.',
      p('This is the policy every volunteer and leader at Harbourlight agrees to. It covers what safe practice looks like, how we recruit, and exactly what to do if you’re worried about someone.') +
      btn(real('harbourlight-safeguarding-policy.pdf'), 'Download the policy') + ask],
    ['Volunteer onboarding pack', 12, 'onboarding-pack', ['Volunteering', 'Featured'], ['Audience: Volunteers'],
      'Everything a new volunteer needs in one place: a welcome letter, role descriptions, the Sunday rota and who to call when something comes up.',
      p('Welcome! Start with the pack, then have a look at the role descriptions and pick a Sunday on the rota.') +
      btn('/s/volunteer-onboarding-pack.pdf', 'Download') + p(a('/s/volunteer-role-descriptions.docx', 'Role descriptions (Word)')) +
      p(a(real('sunday-rota-template.csv'), 'Sunday rota template')) + ask],
    ['Welcome to Harbourlight: a short film for new volunteers', 20, 'welcome-film', ['Volunteering', 'Training', 'Featured'], ['Audience: Volunteers'],
      'Seven minutes on who we are, how a Sunday runs behind the scenes, and the people you’ll be serving alongside.',
      yt('hlDemoVid01') + p('Filmed at the harbour-side hall over two Sundays in winter. Thanks to everyone who appears in it.')],
    ['Reporting a concern: what to do', 41, '', ['Safeguarding'], ['Audience: Leaders', 'Audience: Volunteers'],
      'A one-page flowchart for the moment you’re worried about a child or adult: who to tell, what to write down, and what not to do.',
      p('Print this and keep it in the kids’ ministry room and the youth hall.') + btn('/s/reporting-a-concern-flowchart.pdf', 'Download')],
    ['Police vetting: how to apply', 95, 'police-vetting', ['Safeguarding', 'Volunteering'], ['Audience: Volunteers'],
      'Anyone who works with children or young people at Harbourlight is police vetted. Here’s how it works and how long it takes.',
      p('Police vetting is free and usually takes two to four weeks. The church office starts the request for you, and you’ll get an email asking you to confirm your details.') +
      p('Bring two forms of ID to the office on a Sunday or a weekday morning. We’ll let you know as soon as your result comes back, and we keep it private.') + ask],
    ['Photo consent form', 130, '', ['Safeguarding', 'Kids'], ['Type: Form', 'Audience: Families'],
      'One form per child, once a year, so we know which photos we can and can’t share.',
      p('Fill this in and hand it to the kids’ ministry team.') + p(a('/s/photo-consent-form.docx', 'Photo consent form'))],
    ['Incident report form', 210, 'incident-form', ['Safeguarding'], ['Type: Form', 'Audience: Leaders'],
      'For accidents, near misses and anything else that should be written down on the day. It saves straight to the safeguarding team.',
      p('Open the form, make a copy, and fill it in while it’s fresh.') + btn('https://docs.google.com/document/d/1hlDemoIncidentReportFormX/edit?usp=sharing', 'Open the form')],
    ['Safeguarding training, part 1: recognising harm', 160, 'training-harm', ['Safeguarding', 'Training'], ['Audience: Volunteers', 'Audience: Leaders'],
      'The first of our recorded training sessions: the signs of harm, and why it matters to notice small things.',
      yt('hlDemoVid02') + p('About 25 minutes. Watch it with a cup of tea, then talk it over with your team leader.')],
    ['Sunday rota template', 75, '', ['Volunteering'], ['Audience: Volunteers'],
      'The spreadsheet our teams use to plan Sundays a term at a time. Copy it for your own team.',
      p('One tab per team, one row per Sunday.') + btn(real('sunday-rota-template.csv'), 'Download the template')],
    ['Welcome team handbook', 300, 'welcome-handbook', ['Volunteering'], ['Audience: Volunteers'],
      'Greeting at the door, helping newcomers find their way, and what to do when someone arrives upset.',
      btn('/s/welcome-team-handbook.pdf', 'Download')],
    ['Hospitality roster (shared sheet)', 52, '', ['Volunteering'], [],
      'Morning tea, the Thursday lunch and the big shared meals: put your name down for a spot that suits you.',
      p('Anyone with the link can add their name.') + btn('https://docs.google.com/spreadsheets/d/1hlDemoHospitalityRosterX/edit', 'Open the roster')],
    ['Youth group games: 50 that need no gear', 3, 'youth-games', ['Youth'], ['Audience: Leaders'],
      'Fifty tried-and-tested games for the start of youth night, sorted by group size, with notes on keeping everyone included.',
      p('Collected over ten years of Friday nights.') + btn('/s/youth-group-games.pdf', 'Download the games')],
    ['Term planner for youth leaders', 25, 'term-planner', ['Youth'], ['Audience: Leaders'],
      'Plan a whole term of youth nights on one page: themes, talks, games and who’s leading.',
      btn('https://docs.google.com/spreadsheets/d/1hlDemoTermPlannerX/copy', 'Make a copy')],
    ['Youth night talk outlines: Term 4', 33, 'talk-outlines', ['Youth'], ['Audience: Leaders'],
      'Eight short talks with slides, questions for small groups and an idea for the week ahead.',
      btn('/s/youth-night-talks-term-4.pptx', 'Download the slides')],
    ['Parent permission form for trips', 180, '', ['Youth'], ['Type: Form', 'Audience: Families'],
      'Needed for every trip away from the church, from the beach day to camp.',
      p(a('/s/trip-permission-form.docx', 'Download') + ' and return it to a youth leader before the trip.')],
    ['Kids&#39; activity sheets: Creation week', 15, 'kids-creation', ['Kids'], ['Audience: Families'],
      'Colouring, mazes and a make-at-home craft for each day of creation. Print as many as you like.',
      btn('/s/kids-activity-creation.pdf', 'Download')],
    ['Kids’ activity sheets: Jonah', 60, 'kids-jonah', ['Kids'], ['Audience: Families'],
      'A big fish, a grumpy prophet and a lot of mercy, in puzzles and pictures for ages four to ten.',
      btn('/s/kids-activity-jonah.pdf', 'Download')],
    ['Holiday programme registration', 44, 'holiday-programme', ['Kids'], ['Audience: Families'],
      'Five mornings of games, stories and crafts in the January holidays. Places are limited, so register early.',
      p('Registration takes about five minutes.') + btn('https://forms.gle/hlDemoHolidayForm', 'Register')],
    ['Kids’ worship playlist', 260, '', ['Kids', 'Worship'], ['Audience: Families'],
      'The songs we sing on Sundays, for the car and the kitchen.',
      p(a('https://open.spotify.com/playlist/hlDemoKidsWorship', 'Listen on Spotify'))],
    ['Come and See, week 1: the first disciples', 9, 'come-and-see-1', ['Small groups'], ['Audience: Leaders'],
      'John 1:35–51. Questions for groups, a short reading plan and a prayer to close.',
      btn('/s/come-and-see-week-1.pdf', 'Download the study')],
    ['Come and See, week 2: water into wine', 16, 'come-and-see-2', ['Small groups'], ['Audience: Leaders'],
      'John 2:1–11. A wedding, a crisis and the first sign.',
      btn('/s/come-and-see-week-2.pdf', 'Download the study')],
    ['Come and See, week 3: a conversation at night', 23, 'come-and-see-3', ['Small groups'], ['Audience: Leaders'],
      'John 3:1–21. Nicodemus asks what everyone is thinking.',
      btn('/s/come-and-see-week-3.pdf', 'Download the study')],
    ['Come and See, week 4: the well', 30, 'come-and-see-4', ['Small groups'], ['Audience: Leaders'],
      'John 4:1–42. Living water, and the people nobody expected.',
      btn('/s/come-and-see-week-4.pdf', 'Download the study')],
    ['Come and See: the whole series', 5, 'come-and-see-all', ['Small groups'], ['Audience: Leaders'],
      'All four study guides and the leader’s notes in one place, for groups starting the series late or running it again.',
      p('Everything for the Come and See series, John 1–4.') + p(a('/s/come-and-see-week-1.pdf', 'Week 1: the first disciples')) + p(a('/s/come-and-see-week-2.pdf', 'Week 2: water into wine')) +
      p(a('/s/come-and-see-week-3.pdf', 'Week 3: a conversation at night')) + p(a('/s/come-and-see-week-4.pdf', 'Week 4: the well')) +
      p(a('https://www.dropbox.com/scl/fi/hl0demo/come-and-see-leaders-notes.docx?rlkey=hldemo&dl=0', 'Leader’s notes'))],
    ['Come and See: leader’s notes', 10, '', ['Small groups'], ['Audience: Leaders'],
      'Background for each week, the questions people tend to ask, and how to keep a group discussion on track.',
      p(a('https://www.dropbox.com/scl/fi/hl0demo/come-and-see-leaders-notes.docx?rlkey=hldemo&dl=0', 'Leader’s notes (Word)'))],
    ['Leading a good discussion (recorded talk)', 120, 'leading-discussion', ['Small groups', 'Training'], ['Audience: Leaders'],
      'Forty minutes on asking open questions, handling silence, and making room for the quiet person.',
      audio('/s/leading-a-good-discussion.mp3', 'Leading a good discussion') + p('Recorded at the leaders’ evening in May.')],
    ['한인 소그룹 가이드 (Korean small group guide)', 70, '', ['Small groups'], ['Audience: Leaders'],
      '한인 소그룹 리더를 위한 안내서입니다. A guide for leaders of our Korean-speaking small groups.',
      btn('/s/korean-small-group-guide.pdf', '다운로드')],
    ['Chord charts: the Come and See set', 8, 'chords-come-and-see', ['Worship'], ['Audience: Volunteers'],
      'Chords, lyrics and the keys we play them in for the Come and See series.',
      btn('/s/chord-charts-come-and-see.pdf', 'Download the charts')],
    ['Tūtira mai: waiata for Sunday', 90, 'waiata', ['Worship'], [],
      'Song sheets with te reo Māori and English side by side, and a guide to pronunciation for the band.',
      btn('/s/waiata-song-sheets.pdf', 'Download the song sheets')],
    ['Worship team rehearsal notes', 18, '', ['Worship'], ['Audience: Volunteers'],
      'This term’s set lists, rehearsal times and who’s on which Sunday.',
      btn('https://docs.google.com/document/d/1hlDemoRehearsalNotesX/edit', 'Open the notes')],
    ['Sound desk quick start', 150, 'sound-desk', ['Worship', 'Training'], ['Audience: Volunteers'],
      'Twelve minutes on switching everything on, getting a clean mix and switching it all off again.',
      vimeo('900000101')],
    ['Annual report 2025', 200, 'annual-report', ['Community Trust'], ['Audience: Community groups'],
      'What the Harbourlight Community Trust did last year: 6,200 meals, 41 grants and the people who made it happen.',
      btn('/s/hct-annual-report-2025.pdf', 'Download the report')],
    ['Grant application template', 55, 'grant-template', ['Community Trust'], ['Type: Form', 'Audience: Community groups'],
      'Applying for a community grant? Start with this template. It asks the same questions the trustees will.',
      btn('/s/hct-grant-application.docx', 'Download the template')],
    ['Grant budget template', 56, '', ['Community Trust'], ['Audience: Community groups'],
      'A simple budget to send with your application, with an example filled in.',
      btn('/s/hct-grant-budget.xlsx', 'Download the budget')],
    ['Funding calendar 2026–27', 85, 'funding-calendar', ['Community Trust'], ['Audience: Community groups'],
      'When each grant round opens and closes, and when the trustees meet to decide.',
      p('Round one opens in February and closes on the last Friday of March. Round two opens in July and closes in late August.') +
      p('The trustees meet six weeks after each round closes. We’ll email every applicant within a week of the meeting.')],
    ['Foodbank volunteer guide', 110, 'foodbank', ['Community Trust', 'Volunteering'], ['Audience: Volunteers'],
      'Packing, the Tuesday and Friday shifts, and how to welcome people with dignity.',
      btn('/s/foodbank-volunteer-guide.pdf', 'Download the guide')],
    ['Trust deed and governance', 520, 'trust-deed', ['Community Trust'], ['Audience: Community groups'],
      'The Harbourlight Community Trust’s deed, its governance policy, and how trustees are appointed.',
      p(a('/s/hct-trust-deed.pdf', 'Trust deed')) + p(a('/s/hct-governance-policy.pdf', 'Governance policy'))],
    ['Community funding guide', 150, '', ['Community Trust'], ['Audience: Community groups'],
      'A plain-English guide to finding funding for community projects in Aotearoa, from a partner organisation.',
      p('Our friends at Community Matters keep this up to date.') + btn('https://www.communitymatters.example/funding-guide', 'Read the guide')],
    ['First aid refresher (recorded training)', 190, 'first-aid', ['Training'], ['Audience: Volunteers', 'Audience: Leaders'],
      'A refresher on the basics, recorded with our first aid trainer. It doesn’t replace a certificate course.',
      yt('hlDemoVid03')],
    ['Welcoming newcomers (recorded training)', 280, 'welcoming', ['Training', 'Volunteering'], ['Audience: Volunteers'],
      'What it feels like to walk into a church for the first time, and small things that make a big difference.',
      vimeo('900000102')],
    ['Pastoral care basics', 360, '', ['Training'], ['Audience: Leaders'],
      'Listening well, knowing your limits, and when to bring someone else in.',
      p('Pastoral care at Harbourlight is shared by many people, not just the staff. These notes are a starting point for anyone who finds themselves supporting someone through a hard season.') +
      p('Listen more than you talk. Ask before you pray for someone, and ask what would help. Keep what you hear private unless someone is at risk, and if they are, follow the safeguarding policy.')],
    ['Kids ministry network: ideas and training', 230, '', ['Kids', 'Training'], ['Audience: Leaders'],
      'A national network for people who run kids’ ministry, with free training days and an ideas library.',
      btn('https://kidsministry.example.org/', 'Visit the network')],
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
      excerpt: '<p class="" style="white-space:pre-wrap;">' + r[5] + '</p>', body: r[6], author: { displayName: 'Harbourlight Church' }
    };
  }).sort(function (x, y) { return y.publishOn - x.publishOn; });
  window.DEMO_DATA = window.DEMO_DATA || {};
  window.DEMO_DATA['/resources'] = {
    type: 'blog',
    collection: { id: 'hl-resources', title: 'Resources', typeName: 'blog', itemCount: items.length, updatedOn: today, fullUrl: '/resources' },
    items: items
  };
})();
