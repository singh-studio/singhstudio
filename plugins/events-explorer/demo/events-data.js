// Demo only. Harbourlight Church's events, shaped like a Squarespace 7.1 events collection (?format=json),
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
    church: place('Harbourlight Church', '27 Lantern Quay', 'Devonport, Auckland 0624', -36.82915, 174.79562),
    hall: place('Harbourlight Community Hall', '29 Lantern Quay', 'Devonport, Auckland 0624', -36.82931, 174.79591),
    room: place('Pōhutukawa Room, Harbourlight Church', '27 Lantern Quay', 'Devonport, Auckland 0624', -36.82915, 174.79562),
    cafe: place('The Lighthouse Café', '14 Beacon Rise', 'Takapuna, Auckland 0622', -36.78765, 174.77118),
    trust: place('Harbourlight Community Trust', '8 Saltwind Terrace', 'Onehunga, Auckland 1061', -36.92241, 174.78563),
    reserve: place('Tidewater Reserve', 'Lamplighter Lane', 'Mission Bay, Auckland 1071', -36.84783, 174.83352),
    camp: place('Camp Tūī Ridge', '400 Ridgelight Road', 'Waitākere Ranges, Auckland 0604', -36.94892, 174.55121),
    online: { mapZoom: 12, mapLat: NYC.mapLat, mapLng: NYC.mapLng, markerLat: NYC.mapLat, markerLng: NYC.mapLng, addressTitle: 'Online (Zoom)', addressLine1: '', addressLine2: '', addressCountry: '' },
    none: { mapZoom: 12, mapLat: NYC.mapLat, mapLng: NYC.mapLng, markerLat: NYC.mapLat, markerLng: NYC.mapLng, addressTitle: '', addressLine1: '', addressLine2: '', addressCountry: '' }
  };
  var SS = 'Services &amp; Specials', Y = 'Youth', KF = 'Kids &amp; Families', CO = 'Community', PR = 'Prayer', MI = 'Mission';

  // [title, start, end, categories, venue, image, excerpt]
  var E = [
    // Happening now, today and tomorrow
    ['Light in the City Art Trail', at(-2, 0, 0), at(3, 23, 59), [CO], V.church, 'art', 'Twelve local artists fill the church, the hall and the garden with work about light. Wander through any time, and stay for a cuppa.'],
    ['Op Shop Half-Price Day', at(0, 0, 0), at(0, 23, 59), [CO], place('Harbourlight Op Shop', '31 Lantern Quay', 'Devonport, Auckland 0624', -36.82944, 174.79604), '', 'Everything on the racks is half price for one day only. Every dollar goes to the Harbourlight Community Trust foodbank.'],
    ['Youth Night', at(0, 19, 0), at(0, 21, 0), [Y], V.hall, 'youth', 'Games, food and a short talk for years 9 to 13. Bring a friend. Parents, pick-up is at 9pm sharp.'],
    ['Mainly Music', at(1, 9, 30), at(1, 11, 0), [KF], V.hall, 'kids', 'Songs, stories and morning tea for under-fives and the grown-ups who bring them. $3 a family, first visit free.'],
    // The next four months
    ['Sunday Gathering', at(next(SUN, 0), 9, 30), at(next(SUN, 0), 11, 0), [SS], V.church, 'sunday', 'Our Sunday morning service, with kids’ programmes running alongside. Coffee from 9am.'],
    ['한인 예배 Korean Fellowship Service', at(next(SUN, 0), 13, 30), at(next(SUN, 0), 15, 0), [SS], V.room, '', '한인 교인을 위한 주일 오후 예배입니다. A Korean-language service every second Sunday, with lunch to follow.'],
    ['Online Prayer Meeting', at(next(WED, 0), 20, 0), at(next(WED, 0), 21, 0), [PR], V.online, '', 'Half an hour of prayer for our city and the world, from wherever you are. The Zoom link is in the weekly email.'],
    ['Foodbank Packing Morning', at(next(SAT, 0), 9, 0), at(next(SAT, 0), 12, 0), [CO, MI], V.trust, 'foodbank', 'Help pack 120 food parcels for families on the North Shore and in Onehunga. No experience needed, and there’s morning tea.'],
    ['Night of Prayer &amp; Worship', at(next(FRI, 1), 19, 0), at(next(FRI, 1), 21, 30), [PR, SS], V.church, 'prayer', 'An unhurried evening of songs, silence and prayer stations. Come for ten minutes or stay the whole night.'],
    ['Community Dinner', at(next(THU, 1), 18, 0), at(next(THU, 1), 20, 0), [CO], V.hall, 'dinner', 'A free three-course dinner, cooked by our volunteers. Everyone is welcome, and you don’t need to book.'],
    ['Alpha: Is There More?', at(next(WED, 1), 18, 30), at(next(WED, 1), 21, 0), [MI], V.hall, 'alpha', 'The first night of an eleven-week course on life, faith and meaning. Dinner, a short film and an honest conversation.'],
    ['Messy Church', at(next(SUN, 2), 16, 0), at(next(SUN, 2), 18, 0), [KF], V.hall, 'kids', 'Crafts, a Bible story, a short celebration and dinner together. Made for families with children of every age.'],
    ['Evening Service', at(next(SUN, 2), 18, 0), at(next(SUN, 2), 19, 15), [SS], V.church, 'sunday', 'A quieter service on Sunday evening, with candles, a short reflection and communion.'],
    ['Prayer Breakfast', at(next(SAT, 2), 7, 30), at(next(SAT, 2), 9, 0), [PR], V.cafe, '', 'Breakfast and prayer for the week ahead at The Lighthouse Café. $12 at the door.'],
    ['Youth Night', at(next(FRI, 3), 19, 0), at(next(FRI, 3), 21, 0), [Y], V.hall, 'youth', 'Games, food and a short talk for years 9 to 13. This week: the dodgeball rematch.'],
    ['Short-term Mission Info Night: Vanuatu', at(next(TUE, 3), 19, 0), at(next(TUE, 3), 20, 30), [MI], V.room, 'mission', 'Thinking about joining the Vanuatu building team in the next school holidays? Come and hear what’s involved and ask anything.'],
    ['Mission Sunday: Stories from Tonga', at(next(SUN, 4), 10, 0), at(next(SUN, 4), 12, 0), [MI, SS], V.church, 'mission', 'Our partners from Nukuʻalofa share what your giving made possible this year. Shared lunch afterwards.'],
    ['Youth Leaders Training Day', at(next(SAT, 4), 9, 0), at(next(SAT, 4), 16, 0), [Y], V.room, '', 'A full day for new and returning youth leaders: safety, small groups and a long lunch.'],
    ['Community Dinner', at(next(THU, 5), 18, 0), at(next(THU, 5), 20, 0), [CO], V.hall, 'dinner', 'A free three-course dinner, cooked by our volunteers. Everyone is welcome, and you don’t need to book.'],
    ['Night Vigil', at(next(FRI, 5), 22, 0), at(next(FRI, 5) + 1, 1, 0), [PR], V.church, 'prayer', 'Three hours of prayer through the night, with the church open and the candles lit.'],
    ['Marriage Course', at(next(TUE, 6), 19, 0), at(next(TUE, 6), 21, 0), [CO], V.room, '', 'Dinner for two and a conversation that matters, one evening a week for seven weeks. Open to any couple.'],
    ['Grandparents &amp; Grandkids Picnic', at(next(SAT, 6), 11, 0), at(next(SAT, 6), 14, 0), [KF, CO], V.reserve, '', 'Bring a rug and a picnic. We’ll bring the games, the sack races and the ice blocks.'],
    ['Youth Summer Camp', at(next(FRI, 7), 17, 0), at(next(FRI, 7) + 2, 14, 0), [Y], V.camp, 'camp', 'Three days in the bush at Camp Tūī Ridge: kayaks, the flying fox, campfire nights and a lot of laughter. Registrations close a fortnight before.'],
    ['Harbour Lights Concert', at(next(SAT, 8), 19, 30), at(next(SAT, 8), 21, 30), [SS, CO], V.church, 'concert', 'Our choir, the youth band and friends from across the harbour, in one long evening of music. Koha at the door.'],
    ['Baptism Sunday', at(next(SUN, 9), 9, 30), at(next(SUN, 9), 11, 30), [SS], V.church, 'sunday', 'Six people are being baptised this morning. Come and celebrate with them.'],
    ['Kids’ Holiday Club', at(next(MON, 9), 9, 0), at(next(MON, 9) + 4, 15, 0), [KF], V.hall, 'kids', 'Five mornings and afternoons of games, crafts, songs and stories for years 1 to 6. $40 for the week, with sibling discounts.'],
    ['Pacific Fiafia Night', at(next(FRI, 10), 18, 0), at(next(FRI, 10), 21, 0), [CO], V.hall, 'fiafia', 'Talofa lava! Food, dance and music from across the Pacific, hosted by our Samoan and Tongan families.'],
    ['Women’s Breakfast', at(next(SAT, 10), 8, 0), at(next(SAT, 10), 10, 0), [CO], V.cafe, '', 'A cooked breakfast and a guest speaker on finding rest in a full life.'],
    ['Community Garden Working Bee', at(next(SAT, 13), 9, 0), at(next(SAT, 13), 12, 0), [CO], V.none, '', 'Weeding, planting and a barbecue to finish. Bring gloves if you have them.'],
    ['Quiz Night for the Vanuatu Team', at(next(FRI, 14), 19, 0), at(next(FRI, 14), 21, 30), [CO, MI], V.hall, '', 'Tables of six, $10 a head, and a dessert auction at half-time. All proceeds go to the building team.'],
    ['Prayer Walk: Onehunga', at(next(SAT, 15), 9, 0), at(next(SAT, 15), 11, 0), [PR, MI], V.trust, '', 'We walk the streets around the Trust and pray for the shops, schools and homes we pass.'],
    // Past
    ['Sunday Gathering', at(last(SUN, 0), 9, 30), at(last(SUN, 0), 11, 0), [SS], V.church, 'sunday', 'Our Sunday morning service, with kids’ programmes running alongside.'],
    ['Mainly Music', at(last(THU, 0), 9, 30), at(last(THU, 0), 11, 0), [KF], V.hall, 'kids', 'Songs, stories and morning tea for under-fives.'],
    ['Foodbank Packing Morning', at(last(SAT, 1), 9, 0), at(last(SAT, 1), 12, 0), [CO, MI], V.trust, 'foodbank', '112 food parcels packed and delivered. Thank you!'],
    ['Community Dinner', at(last(THU, 1), 18, 0), at(last(THU, 1), 20, 0), [CO], V.hall, 'dinner', 'A free three-course dinner, cooked by our volunteers.'],
    ['Quiz Night for the Tonga Mission', at(last(FRI, 2), 19, 0), at(last(FRI, 2), 21, 30), [CO, MI], V.hall, '', 'We raised $4,310 for the Tonga partnership. The winning table was, once again, the Bible study group.'],
    ['Messy Church', at(last(SUN, 3), 16, 0), at(last(SUN, 3), 18, 0), [KF], V.hall, 'kids', 'Crafts, a Bible story and dinner together.'],
    ['Prayer Breakfast', at(last(SAT, 3), 7, 30), at(last(SAT, 3), 9, 0), [PR], V.cafe, '', 'Breakfast and prayer for the week ahead.'],
    ['Worship Night', at(last(FRI, 4), 19, 0), at(last(FRI, 4), 21, 0), [PR, SS], V.church, 'prayer', 'An evening of songs old and new.'],
    ['Mission Sunday: Stories from Fiji', at(last(SUN, 5), 10, 0), at(last(SUN, 5), 12, 0), [MI, SS], V.church, 'mission', 'Bula! Our friends from Suva shared their year.'],
    ['Kids’ Holiday Club', at(last(MON, 6), 9, 0), at(last(MON, 6) + 4, 15, 0), [KF], V.hall, 'kids', 'Five days of games, crafts, songs and stories for years 1 to 6.'],
    ['Harbourlight Art Market', at(last(SAT, 6), 10, 0), at(last(SAT, 6), 14, 0), [CO], V.church, 'art', 'Local makers, a sausage sizzle and live music.'],
    ['Alpha Celebration Dinner', at(last(WED, 7), 18, 30), at(last(WED, 7), 21, 0), [MI], V.hall, 'alpha', 'The last night of the winter Alpha course, with dinner and stories.'],
    ['Youth Winter Camp', at(last(FRI, 8), 17, 0), at(last(FRI, 8) + 2, 14, 0), [Y], V.camp, 'camp', 'A cold, muddy and very happy weekend at Camp Tūī Ridge.'],
    ['Annual General Meeting', at(last(SUN, 9), 12, 0), at(last(SUN, 9), 13, 30), [CO], V.church, '', 'Reports, the budget and the election of the church council. Lunch provided.'],
    ['Youth Leaders Retreat', at(last(SAT, 11), 0, 0), at(last(SAT, 11), 23, 59), [Y], V.camp, '', 'A day away to rest, pray and plan the next term.']
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
