// Demo only. Harbourlight Community Trust's events, shaped like a Squarespace 7.1 events collection (?format=json),
// with every date worked out from today in Auckland so the demo always looks current. All names and places are fictional.
(function () {
  var TZ = 'Pacific/Auckland', DAY = 864e5;
  var fmt = new Intl.DateTimeFormat('en-US', { timeZone: TZ, hourCycle: 'h23', year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric', second: 'numeric', weekday: 'short' });
  function parts(ms) {
    var o = {}, WD = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
    fmt.formatToParts(new Date(ms)).forEach(function (p) { o[p.type] = p.value; });
    return { y: +o.year, m: +o.month, d: +o.day, h: +o.hour % 24, mi: +o.minute, s: +o.second, wd: WD[o.weekday] };
  }
  function offset(ms) { var p = parts(ms); return (Date.UTC(p.y, p.m - 1, p.d, p.h, p.mi, p.s) - Math.floor(ms / 1000) * 1000) / 60000; }
  function zoned(y, m, d, h, mi) {
    var guess = Date.UTC(y, m - 1, d, h, mi), off = offset(guess), t = guess - off * 60000, off2 = offset(t);
    return off2 === off ? t : guess - off2 * 60000;
  }
  var today = parts(Date.now());
  // A wall-clock time in Auckland, `days` from today. Squarespace adds stray milliseconds to every date, so this does too.
  function at(days, h, mi, ms) {
    var t = new Date(Date.UTC(today.y, today.m - 1, today.d + days));
    return zoned(t.getUTCFullYear(), t.getUTCMonth() + 1, t.getUTCDate(), h, mi || 0) + (ms == null ? 437 : ms);
  }
  function next(wd, k) { return (((wd - today.wd + 7) % 7) || 7) + 7 * (k || 0); }   // the k-th weekday after today
  function last(wd, k) { return -((((today.wd - wd + 7) % 7) || 7) + 7 * (k || 0)); } // the k-th weekday before today
  var SUN = 0, MON = 1, TUE = 2, WED = 3, THU = 4, FRI = 5, SAT = 6;

  var NYC = { mapLat: 40.7207559, mapLng: -74.0007613 }; // Squarespace's starting pin for a new event
  function place(title, line1, line2, lat, lng) {
    return { mapZoom: 14, mapLat: lat, mapLng: lng, markerLat: lat, markerLng: lng, addressTitle: title, addressLine1: line1, addressLine2: line2, addressCountry: 'New Zealand' };
  }
  var V = {
    centre: place('Harbourlight Community Centre', '27 Lantern Quay', 'Devonport, Auckland 0624', -36.82915, 174.79562),
    hall: place('Harbourlight Community Hall', '29 Lantern Quay', 'Devonport, Auckland 0624', -36.82931, 174.79591),
    room: place('Pōhutukawa Room, Harbourlight Community Centre', '27 Lantern Quay', 'Devonport, Auckland 0624', -36.82915, 174.79562),
    cafe: place('The Lighthouse Café', '14 Beacon Rise', 'Takapuna, Auckland 0622', -36.78765, 174.77118),
    foodbank: place('Harbourlight Food Bank', '8 Saltwind Terrace', 'Onehunga, Auckland 1061', -36.92241, 174.78563),
    reserve: place('Tidewater Reserve', 'Lamplighter Lane', 'Mission Bay, Auckland 1071', -36.84783, 174.83352),
    camp: place('Camp Tūī Ridge', '400 Ridgelight Road', 'Waitākere Ranges, Auckland 0604', -36.94892, 174.55121),
    online: { mapZoom: 12, mapLat: NYC.mapLat, mapLng: NYC.mapLng, markerLat: NYC.mapLat, markerLng: NYC.mapLng, addressTitle: 'Online (Zoom)', addressLine1: '', addressLine2: '', addressCountry: '' },
    none: { mapZoom: 12, mapLat: NYC.mapLat, mapLng: NYC.mapLng, markerLat: NYC.mapLat, markerLng: NYC.mapLng, addressTitle: '', addressLine1: '', addressLine2: '', addressCountry: '' }
  };
  var CW = 'Classes &amp; Workshops', Y = 'Youth', KF = 'Kids &amp; Families', CO = 'Community', VO = 'Volunteering', FR = 'Fundraising';

  // [title, start, end, categories, venue, image, excerpt]
  var E = [
    // Happening now, today and tomorrow
    ['Light in the City Art Trail', at(-2, 0, 0), at(3, 23, 59), [CO], V.centre, 'art', 'Twelve local artists fill the community centre, the hall and the garden with work about light. Wander through any time, and stay for a cuppa.'],
    ['Op Shop Half-Price Day', at(0, 0, 0), at(0, 23, 59), [CO, FR], place('Harbourlight Op Shop', '31 Lantern Quay', 'Devonport, Auckland 0624', -36.82944, 174.79604), '', 'Everything on the racks is half price for one day only. Every dollar goes to the Harbourlight food bank.'],
    ['Youth Night', at(0, 19, 0), at(0, 21, 0), [Y], V.hall, 'youth', 'Games, food and a new challenge every week for years 9 to 13. Bring a friend. Parents, pick-up is at 9pm sharp.'],
    ['Toddler Music Morning', at(1, 9, 30), at(1, 11, 0), [KF], V.hall, 'kids', 'Songs, stories and morning tea for under-fives and the grown-ups who bring them. $3 a family, first visit free.'],
    // The next four months
    ['Repair Café', at(next(SUN, 0), 9, 30), at(next(SUN, 0), 11, 30), [CO], V.hall, 'repair', 'Bring your wobbly chairs, broken toasters and torn jackets, and our volunteer fixers will mend them with you. Free, with coffee from 9am.'],
    ['한인 학부모 모임 Korean Parents’ Group', at(next(SUN, 0), 13, 30), at(next(SUN, 0), 15, 0), [CO], V.room, '', '한인 학부모님들을 위한 모임입니다. A get-together for Korean-speaking parents every second Sunday, with lunch to follow.'],
    ['Online Budgeting Workshop', at(next(WED, 0), 20, 0), at(next(WED, 0), 21, 0), [CW], V.online, '', 'An hour on setting up a budget that works, from wherever you are. The Zoom link is in the weekly email.'],
    ['Food Bank Packing Morning', at(next(SAT, 0), 9, 0), at(next(SAT, 0), 12, 0), [VO, CO], V.foodbank, 'foodbank', 'Help pack 120 food parcels for families on the North Shore and in Onehunga. No experience needed, and there’s morning tea.'],
    ['Open Mic &amp; Pizza Night', at(next(FRI, 1), 19, 0), at(next(FRI, 1), 21, 30), [CO, Y], V.centre, 'openmic', 'Bring a song, a poem or just yourself. Sign up on the night for a five-minute spot, and the pizza is on us.'],
    ['Community Dinner', at(next(THU, 1), 18, 0), at(next(THU, 1), 20, 0), [CO], V.hall, 'dinner', 'A free three-course dinner, cooked by our volunteers. Everyone is welcome, and you don’t need to book.'],
    ['Cooking on a Budget: Week One', at(next(WED, 1), 18, 30), at(next(WED, 1), 21, 0), [CW], V.hall, 'cooking', 'The first night of a six-week course on feeding a family well for less. We cook together, then sit down and share what we made.'],
    ['Family Craft Afternoon', at(next(SUN, 2), 16, 0), at(next(SUN, 2), 18, 0), [KF], V.hall, 'kids', 'Crafts, games, a story and dinner together. Made for families with children of every age.'],
    ['Te Reo Māori for Beginners', at(next(SUN, 2), 18, 0), at(next(SUN, 2), 19, 15), [CW], V.room, 'learning', 'A relaxed evening class with waiata, everyday phrases and plenty of practice. The first class of the term is free.'],
    ['Business Breakfast', at(next(SAT, 2), 7, 30), at(next(SAT, 2), 9, 0), [CO, FR], V.cafe, '', 'Breakfast and a short talk from a local business owner at The Lighthouse Café. $12 at the door, and it all goes to the youth programme.'],
    ['Youth Night', at(next(FRI, 3), 19, 0), at(next(FRI, 3), 21, 0), [Y], V.hall, 'youth', 'Games, food and a new challenge every week for years 9 to 13. This week: the dodgeball rematch.'],
    ['Volunteer Info Night', at(next(TUE, 3), 19, 0), at(next(TUE, 3), 20, 30), [VO], V.room, 'volunteer', 'Thinking about helping at the food bank, the op shop or the holiday programme? Come and hear what’s involved and ask anything.'],
    ['Open Day: Meet the Trust', at(next(SUN, 4), 10, 0), at(next(SUN, 4), 12, 0), [CO, FR], V.centre, 'openday', 'Tours of the centre, a sausage sizzle and a chance to meet the people behind the food bank, the op shop and the classes.'],
    ['Youth Leaders Training Day', at(next(SAT, 4), 9, 0), at(next(SAT, 4), 16, 0), [Y], V.room, '', 'A full day for new and returning youth leaders: safety, small groups and a long lunch.'],
    ['Community Dinner', at(next(THU, 5), 18, 0), at(next(THU, 5), 20, 0), [CO], V.hall, 'dinner', 'A free three-course dinner, cooked by our volunteers. Everyone is welcome, and you don’t need to book.'],
    ['Stargazing Night', at(next(FRI, 5), 22, 0), at(next(FRI, 5) + 1, 1, 0), [CO, KF], V.reserve, 'stars', 'Three hours under the stars with telescopes from the local astronomy club. Dress warmly and bring a thermos.'],
    ['Parenting Teens Course', at(next(TUE, 6), 19, 0), at(next(TUE, 6), 21, 0), [CW], V.room, '', 'Seven Tuesday evenings for parents of teenagers: sleep, screens, money and keeping the door open. Open to any parent or caregiver.'],
    ['Grandparents &amp; Grandkids Picnic', at(next(SAT, 6), 11, 0), at(next(SAT, 6), 14, 0), [KF, CO], V.reserve, '', 'Bring a rug and a picnic. We’ll bring the games, the sack races and the ice blocks.'],
    ['Youth Summer Camp', at(next(FRI, 7), 17, 0), at(next(FRI, 7) + 2, 14, 0), [Y], V.camp, 'camp', 'Three days in the bush at Camp Tūī Ridge: kayaks, the flying fox, campfire nights and a lot of laughter. Registrations close a fortnight before.'],
    ['Harbour Lights Concert', at(next(SAT, 8), 19, 30), at(next(SAT, 8), 21, 30), [FR, CO], V.centre, 'concert', 'Our community choir, the youth band and friends from across the harbour, in one long evening of music. Koha at the door.'],
    ['Graduation Morning', at(next(SUN, 9), 9, 30), at(next(SUN, 9), 11, 30), [CW], V.centre, 'learning', 'Thirty learners finish their courses this term. Come and celebrate with them, and stay for morning tea.'],
    ['Kids’ Holiday Programme', at(next(MON, 9), 9, 0), at(next(MON, 9) + 4, 15, 0), [KF], V.hall, 'kids', 'Five mornings and afternoons of games, crafts, songs and stories for years 1 to 6. $40 for the week, with sibling discounts.'],
    ['Pacific Fiafia Night', at(next(FRI, 10), 18, 0), at(next(FRI, 10), 21, 0), [CO], V.hall, 'fiafia', 'Talofa lava! Food, dance and music from across the Pacific, hosted by our Samoan and Tongan families.'],
    ['Women’s Breakfast', at(next(SAT, 10), 8, 0), at(next(SAT, 10), 10, 0), [CO], V.cafe, '', 'A cooked breakfast and a guest speaker on finding rest in a full life.'],
    ['Community Garden Working Bee', at(next(SAT, 13), 9, 0), at(next(SAT, 13), 12, 0), [VO, CO], V.none, '', 'Weeding, planting and a barbecue to finish. Bring gloves if you have them.'],
    ['Quiz Night for the Holiday Programme', at(next(FRI, 14), 19, 0), at(next(FRI, 14), 21, 30), [FR, CO], V.hall, '', 'Tables of six, $10 a head, and a dessert auction at half-time. All proceeds go to the January holiday programme.'],
    ['Neighbourhood Clean-up: Onehunga', at(next(SAT, 15), 9, 0), at(next(SAT, 15), 11, 0), [VO, CO], V.foodbank, '', 'We meet at the food bank and spend the morning picking up litter around the shops, the schools and the park.'],
    // Past
    ['Repair Café', at(last(SUN, 0), 9, 30), at(last(SUN, 0), 11, 30), [CO], V.hall, 'repair', 'Forty-three things fixed, from a lamp to a ukulele. Thank you, fixers!'],
    ['Toddler Music Morning', at(last(THU, 0), 9, 30), at(last(THU, 0), 11, 0), [KF], V.hall, 'kids', 'Songs, stories and morning tea for under-fives.'],
    ['Food Bank Packing Morning', at(last(SAT, 1), 9, 0), at(last(SAT, 1), 12, 0), [VO, CO], V.foodbank, 'foodbank', '112 food parcels packed and delivered. Thank you!'],
    ['Community Dinner', at(last(THU, 1), 18, 0), at(last(THU, 1), 20, 0), [CO], V.hall, 'dinner', 'A free three-course dinner, cooked by our volunteers.'],
    ['Quiz Night for the Food Bank', at(last(FRI, 2), 19, 0), at(last(FRI, 2), 21, 30), [FR, CO], V.hall, '', 'We raised $4,310 for the food bank. The winning table was, once again, the Tuesday walking group.'],
    ['Family Craft Afternoon', at(last(SUN, 3), 16, 0), at(last(SUN, 3), 18, 0), [KF], V.hall, 'kids', 'Crafts, a story and dinner together.'],
    ['Business Breakfast', at(last(SAT, 3), 7, 30), at(last(SAT, 3), 9, 0), [CO, FR], V.cafe, '', 'Breakfast and a talk from the owner of the Beacon Rise bakery.'],
    ['Acoustic Night', at(last(FRI, 4), 19, 0), at(last(FRI, 4), 21, 0), [CO], V.centre, 'openmic', 'An evening of songs old and new from local musicians.'],
    ['Volunteer Thank-you Lunch', at(last(SUN, 5), 10, 0), at(last(SUN, 5), 12, 0), [VO], V.centre, 'volunteer', 'A long lunch to thank the 120 people who give their time to the trust.'],
    ['Kids’ Holiday Programme', at(last(MON, 6), 9, 0), at(last(MON, 6) + 4, 15, 0), [KF], V.hall, 'kids', 'Five days of games, crafts, songs and stories for years 1 to 6.'],
    ['Harbourlight Art Market', at(last(SAT, 6), 10, 0), at(last(SAT, 6), 14, 0), [CO], V.centre, 'art', 'Local makers, a sausage sizzle and live music.'],
    ['Cooking on a Budget: Graduation Dinner', at(last(WED, 7), 18, 30), at(last(WED, 7), 21, 0), [CW], V.hall, 'cooking', 'The last night of the winter course, with dinner cooked by the class.'],
    ['Youth Winter Camp', at(last(FRI, 8), 17, 0), at(last(FRI, 8) + 2, 14, 0), [Y], V.camp, 'camp', 'A cold, muddy and very happy weekend at Camp Tūī Ridge.'],
    ['Annual General Meeting', at(last(SUN, 9), 12, 0), at(last(SUN, 9), 13, 30), [CO], V.centre, '', 'Reports, the budget and the election of trustees. Lunch provided.'],
    ['Youth Leaders Retreat', at(last(SAT, 11), 0, 0), at(last(SAT, 11), 23, 59), [Y], V.camp, '', 'A day away to rest, reflect and plan the next term.']
  ];

  var dayStart = at(0, 0, 0, 0);
  function slug(s) { return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/&amp;/g, 'and').replace(/[^a-z0-9가-힣]+/g, '-').replace(/^-|-$/g, ''); }
  var items = E.map(function (e, i) {
    var id = 'hl-ev-' + (100 + i), url = slug(e[0]) + '-' + (100 + i), excerpt = '<p class="" style="white-space:pre-wrap;">' + e[6].replace(/&(?!amp;)/g, '&amp;') + '</p>';
    return {
      id: id, collectionId: 'harbourlight-events', recordType: 12, title: e[0], urlId: url, fullUrl: '/events/' + url,
      startDate: e[1], endDate: e[2], publishOn: dayStart - (60 - i) * DAY, addedOn: dayStart - (60 - i) * DAY, updatedOn: dayStart - 2 * DAY,
      categories: e[3], tags: i % 5 === 0 ? ['Harbourlight'] : [],
      location: JSON.parse(JSON.stringify(e[4])),
      // A post without a thumbnail still has an assetUrl: its own folder, which serves a blank.
      assetUrl: e[5] ? 'art/' + e[5] + '.jpg' : 'https://images.squarespace-cdn.com/content/v1/demo/' + id + '/',
      contentType: e[5] ? 'image/jpeg' : '',
      excerpt: excerpt,
      body: '<div class="sqs-layout sqs-grid-12 columns-12" data-type="item"><div class="sqs-block html-block"><div class="sqs-block-content">' + excerpt + '</div></div></div>',
      structuredContent: { _type: 'CalendarEvent', startDate: e[1], endDate: e[2] }
    };
  });
  var now = Date.now();
  window.DEMO_DATA = window.DEMO_DATA || {};
  window.DEMO_DATA['/events'] = {
    type: 'events',
    collection: { id: 'harbourlight-events', typeName: 'events-stacked', title: 'Events', urlId: 'events', fullUrl: '/events', itemCount: items.length, updatedOn: dayStart, pageSize: 30 },
    upcoming: items.filter(function (i) { return i.endDate > now; }).sort(function (a, b) { return a.startDate - b.startDate; }),
    past: items.filter(function (i) { return i.endDate <= now; }).sort(function (a, b) { return b.startDate - a.startDate; })
  };
})();
