// Demo only. Harbourlight Community Trust is made up, and so is everyone here.
// Each person is one post in a hidden "Team Members" blog, written the way people really fill these in:
// some with a "Role:" line, some with the role as the first paragraph, an empty first paragraph, an editor's note,
// prefixed tags, a few people without photos and two without roles.
(function () {
  var DAY = 864e5, now = Date.now();
  // Squarespace wraps every post body in a layout and adds the text block's own styles after it.
  function layout(inner, i) {
    var id = '6aafbd00000000000000' + (i < 10 ? '0' : '') + i;
    return '<div class="sqs-layout sqs-grid-12 columns-12" data-layout-label="Post Body" data-type="item" id="item-' + id + '"><div class="row sqs-row"><div class="col sqs-col-12 span-12">' +
      '<div class="sqs-block html-block sqs-block-html" data-block-type="2" data-sqsp-block="text" id="block-' + id + '"><div class="sqs-block-content"><div class="sqs-html-content" data-sqsp-text-block-content>' + inner + '</div></div></div>' +
      '<style>#block-' + id + ' {\n}\n#block-' + id + ' .sqs-html-content {\n}</style></div></div></div>';
  }
  function p(t) { return '<p class="" style="white-space:pre-wrap;">' + t + '</p>'; }
  var M = '@harbourlight.example';

  // [title, categories, tags, has photo, body, excerpt, extra]
  var people = [
    ['Hemi Walker', ['Leadership'], ['Team: Board', 'Partnerships', 'Community development'], true,
      p('General Manager') + p('<strong>Email:</strong> <a href="mailto:hemi.walker' + M + '">hemi.walker' + M + '</a>') + p('Phone: (04) 555 0101') + p('Pronouns: he/him') + p('Languages: English, te reo Māori') + p('Location: Petone') + p('Ask me about: partnerships, hiring the centre and joining the board'),
      'Hemi has led Harbourlight since 2014. He grew up in Ōtaki, opened the Porirua hub in 2019 and still makes the tea at the Wednesday community lunch.', { sourceUrl: '/team/hemi-walker' }],
    ['Leilani Faleolo', ['Leadership'], ['Location: Porirua', 'Language: English', 'Language: Samoan', 'Social services', 'Counselling'], true,
      p('Deputy General Manager') + p('Email: leilani.faleolo' + M) + p('Pronouns: she/her') + p('Ask me about: our services in Porirua, the Samoan parents’ group'),
      'Leilani runs the Porirua hub day to day and leads the Samoan parents’ group on Saturday mornings.'],
    ['Grace Liu', ['Leadership'], ['Adult learning', 'Workshops'], true,
      p('Role: Programmes Manager') + p('Email: grace.liu' + M) + p('Phone: 021 555 0103') + p('Languages: English, Mandarin') + p('Location: Wellington Central') + p('Ask me about: classes, workshops and the term timetable'),
      'Grace plans the term timetable, which means the classes, the workshops and a room for every one of them.'],
    ['Tom Ashworth', ['Leadership'], ['Funding'], false,
      p('') + p('Partnerships lead, schools and funders') + p('Phone: <a href="tel:+6445550104">(04) 555 0104</a>') + p('Location: Lower Hutt'),
      'Tom looks after the schools, councils and funders we work with, and writes most of our grant applications.'],

    ['Mere Paki', ['Youth &amp; Families'], ['Youth work', 'Mentoring'], true,
      p('Youth Coordinator') + p('Email: mere.paki' + M) + p('Phone: 021 555 0105') + p('Pronouns: she/her') + p('Languages: English, te reo Māori') + p('Location: Porirua') + p('Ask me about: youth nights, camps and mentoring'),
      'Mere runs Friday youth and the winter camp at Ōtaki Forks, and keeps a spare hoodie for anyone who forgets theirs.'],
    ['Sione Taufa', ['Youth &amp; Families'], ['Location: Porirua', 'Language: English', 'Language: Tongan', 'Youth work', 'Sport'], true,
      p('Youth Worker') + p('Email: sione.taufa' + M) + p('Pronouns: he/him'),
      'Sione coaches the Saturday touch team and helps run Friday youth. Ask him about the holiday basketball programme.'],
    ['Hannah Brooks', ['Youth &amp; Families'], ['Children’s programmes', 'First aid'], true,
      p('Children’s Programmes Lead') + p('Email: hannah.brooks' + M) + p('Location: Petone') + p('Ask me about: after-school club, the holiday programme'),
      'Hannah runs the after-school club every weekday and the holiday programme in January and July.'],
    ['Jayden Kim', ['Youth &amp; Families'], ['Mentoring'], true,
      p('Young Adults Coordinator') + p('Email: jayden.kim' + M) + p('Languages: English, Korean') + p('Location: Wellington Central'),
      'Jayden runs young adults on Thursday nights in the city and the monthly shared dinner.'],
    ['Ana Tuilagi', ['Youth &amp; Families'], ['Location: Porirua', 'Language: Samoan', 'Language: English', 'Playgroup'], true,
      p('Ana has been part of Harbourlight since she was five, and now runs the Tuesday playgroup for parents and toddlers in the Porirua hall.') + p('Email: ana.tuilagi' + M),
      ''],
    ['Ruby Thompson', ['Youth &amp; Families'], ['Social media', 'Youth work'], true,
      p('Youth Intern') + p('Pronouns: they/them') + p('Email: ruby.thompson' + M) + p('Location: Petone'),
      'Ruby is in the second year of a youth work internship and looks after the youth Instagram, among other things.'],

    ['Matiu Rangi', ['Arts &amp; Learning'], ['Music', 'Kapa haka'], true,
      p('Arts Coordinator') + p('Email: matiu.rangi' + M) + p('Pronouns: he/him') + p('Languages: English, te reo Māori') + p('Location: Petone') + p('Ask me about: kapa haka, the community choir, waiata'),
      'Matiu leads the kapa haka group and the community choir, and has written a fair few of the waiata they sing.'],
    ['Esther Wong', ['Arts &amp; Learning'], ['Music', 'Choir'], true,
      p('Music Tutor') + p('Email: esther.wong' + M) + p('Languages: English, Mandarin') + p('Location: Wellington Central'),
      'Esther teaches the piano and ukulele classes and trains the community choir for everything from show tunes to the Christmas concert.'],
    ['Liam O&#8217;Connor', ['Arts &amp; Learning'], ['Sound', 'Events'], true,
      p('Production Lead') + p('Email: <a href="mailto:liam.oconnor' + M + '">liam.oconnor' + M + '</a>') + p('Location: Petone') + p('Ask me about: hiring the hall, the sound desk'),
      'Liam runs sound and lights for the hall’s concerts and events, and trains the volunteers who keep it all going.'],
    ['Talia Moana', ['Arts &amp; Learning'], ['Design', 'Art'], false,
      p('Creative Arts Coordinator') + p('Pronouns: she/her') + p('Email: talia.moana' + M) + p('Location: Porirua'),
      'Talia runs the Saturday art classes and looks after the gallery wall and the banners for every festival.'],

    ['Fiona MacLeod', ['Operations'], ['Facilities'], true,
      p('Operations Manager') + p('Email: fiona.macleod' + M) + p('Phone: (04) 555 0115') + p('Location: Petone') + p('Ask me about: room bookings, keys and the van'),
      'Fiona keeps the buildings, the budget and the calendar in order. She also knows where the spare keys are.'],
    ['Raj Patel', ['Operations'], ['Finance'], true,
      '<h3>Raj Patel</h3>' + p('Finance Administrator') + p('Email: raj.patel' + M) + p('Location: Petone'),
      'Raj handles donations, invoices and the end of year donation receipts. Office hours: Tuesday to Thursday.'],
    ['Kiri Hēnare', ['Operations'], ['Admin'], true,
      p('Office Administrator') + p('Email: office' + M) + p('Phone: (04) 555 0100') + p('Pronouns: she/her') + p('Languages: English, te reo Māori') + p('Location: Petone'),
      'Kiri is usually the first voice you’ll hear when you ring the office, Monday to Friday, 9 till 3.'],
    ['Ben Harris', ['Operations'], ['Maintenance', 'First aid'], true,
      p('Facilities &amp; Property') + p('Phone: 027 555 0118') + p('Location: Lower Hutt'),
      'Ben fixes what breaks, mows what grows and runs the working bee on the first Saturday of each month.'],

    ['Losa Pele', ['Community Support'], ['Team: Board', 'Social services'], true,
      p('Community Support Manager, Harbourlight Community Trust') + p('Email: losa.pele' + M) + p('Phone: (04) 555 0119') + p('Pronouns: she/her') + p('Languages: English, Samoan') + p('Location: Porirua') + p('Ask me about: food bank referrals, budgeting help, volunteering'),
      'Losa manages community support: the food bank, the budgeting service and the community lunch on Wednesdays. She’s also the staff representative on the board.'],
    ['Mikaere Hohaia', ['Community Support'], ['Food rescue'], true,
      p('Food Bank Coordinator') + p('Email: mikaere.hohaia' + M) + p('Phone: 022 555 0120') + p('Pronouns: he/him') + p('Languages: English, te reo Māori') + p('Location: Porirua'),
      'Mikaere runs the food bank from the Porirua hall, with food rescued from local supermarkets and grown in the community garden.'],
    ['Wei Chen', ['Community Support'], ['Budgeting'], true,
      p('Budget Mentor') + p('Email: wei.chen' + M) + p('Languages: English, Mandarin') + p('Location: Wellington Central'),
      'Wei meets people one to one to sort out budgets, debts and the paperwork nobody enjoys.'],
    ['Sarah Mitchell', ['Community Support'], ['Volunteers'], true,
      p('Volunteer Lead') + p('Email: volunteer' + M) + p('Location: Lower Hutt') + p('Ask me about: volunteering, the op shop'),
      'Sarah matches volunteers with the food bank, the op shop and the holiday programme.'],

    ['Dr Helen Fraser', ['Board'], ['Governance'], true,
      p('Role: Board Chair') + p('[Update her term dates after the AGM]') + p('Email: board' + M),
      'Helen chairs the trust board. She’s a retired GP and has been part of Harbourlight for thirty years.'],
    ['Viliami Fifita', ['Board'], ['Finance', 'Governance'], true,
      p('Treasurer') + p('Languages: English, Tongan') + p('Location: Lower Hutt'),
      'Viliami is the board’s treasurer and an accountant by day.'],
    ['Peter Sinclair', ['Board'], ['Governance'], false,
      p('Board Secretary') + p('Email: board' + M),
      'Peter keeps the minutes and the trust deed, and organises the AGM each March.'],
    ['Aroha Ngata', ['Board'], ['Governance', 'Tikanga'], true,
      p('Pronouns: she/her') + p('Languages: English, Te reo Māori') + p('Location: Porirua'),
      'Aroha is a trustee and guides the trust on tikanga and its relationship with mana whenua.']
  ];

  function slug(s) { return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/&#8217;|’/g, '').replace(/^(rev|dr)\.?\s+/, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''); }
  var items = people.map(function (x, i) {
    var s = slug(x[0]), at = now - (people.length - i) * 2 * DAY - 9 * 36e5;
    var item = {
      id: '6aafbd0000000000000000' + (i < 10 ? '0' : '') + i, collectionId: '6aafbd0000000000000000ff', recordType: 1,
      title: x[0], urlId: s, fullUrl: '/team-members/' + s, sourceUrl: '',
      assetUrl: x[3] ? 'portraits/' + s + '.jpg' : 'https://static1.squarespace.com/static/5f0demo/t/6aafbd00000000000000' + (i < 10 ? '0' : '') + i + '/',
      categories: x[1], tags: x[2], body: layout(x[4], i), excerpt: x[5] ? '<p>' + x[5] + '</p>' : '',
      publishOn: at, addedOn: at, updatedOn: at
    };
    if (x[6]) Object.keys(x[6]).forEach(function (k) { item[k] = x[6][k]; });
    return item;
  }).sort(function (a, b) { return b.publishOn - a.publishOn; });

  window.DEMO_PEOPLE = people.map(function (x) { return { name: x[0].replace('&#8217;', '’'), slug: slug(x[0]), photo: x[3] }; });
  window.DEMO_DATA = window.DEMO_DATA || {};
  window.DEMO_DATA['/team-members'] = {
    type: 'blog',
    collection: { id: '6aafbd0000000000000000ff', title: 'Team Members', urlId: 'team-members', fullUrl: '/team-members', typeName: 'blog', itemCount: items.length, updatedOn: 1790000000000 },
    items: items
  };
})();
