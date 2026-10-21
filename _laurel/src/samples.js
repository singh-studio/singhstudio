/* Laurel: example clubs (made up, generated deterministically) and starter templates.
   Shared by the editor and the build. Every name here is fictional. */
(function (root) {
  'use strict';

  function rng(seed) {
    var s = seed >>> 0;
    return function () { s = (s + 0x6D2B79F5) >>> 0; var t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  }

  var OLD_SUR = ['Wallace', 'McKenzie', 'Fraser', 'Hamilton', 'Reid', 'Campbell', 'Murray', 'Henderson', 'Duncan', 'Sinclair', 'Gallagher', "O'Brien", 'Walsh', 'Kerr', 'Ross', 'Hughes', 'Bennett', 'Harper', 'Morrison', 'Paterson', 'Gordon', 'Russell', 'Lindsay', 'Macdonald', 'Kingsley', 'Ashworth', 'Prendergast', 'Whitcombe', 'Dalziel', 'Ngata', 'Parata', 'Te Rangi'];
  var MID_SUR = ['Barnett', 'de Vries', 'Hēnare', 'Tipene', 'Wihongi', 'Coleman', 'Jansen', 'Rāwiri', 'Bryant', 'Kowalski', 'Fitzgerald', 'Tamihana', 'Lim', 'Chand', 'Moana', 'Hollis', 'Prasad', 'Sutherland', 'van der Berg', 'Faleolo', 'Driscoll', 'Pōtae', 'Manson', 'Yee'];
  var NEW_SUR = ['Sharma', 'Chen', 'Taufa', 'Wihongi', 'Wong', "O'Connell", 'Kaur', 'Patel', 'Tuilagi', 'Kim', 'McKay', 'Nair', 'Taʻala', 'Rāwiri', 'Nguyen', 'Brennan', 'Fonoti', 'Singh', 'Hēnare', 'Liu', 'Kerr', 'Matagi', 'Gill', 'Morgan', 'Tupou', 'Dsouza', 'Ngata', 'Park'];
  var MEN_OLD = 'ABCDEGHJLMNPRSTW', WOMEN_OLD = 'ABCDEFGHJKLMNPRSV';
  var MEN_MID = ['Graham', 'Hēmi', 'Peter', 'Wiremu', 'Ross', 'Bruce', 'Tama', 'Kevin', 'Rajesh', 'Andrew', 'Sione', 'Murray', 'Dean', 'Craig'];
  var WOMEN_MID = ['Mere', 'Judith', 'Aroha', 'Lynette', 'Sandra', 'Anahera', 'Raewyn', 'Linda', 'Mei', 'Christine', 'Losa', 'Heather', 'Gail'];
  var MEN_NEW = ['Liam', 'Daniel', 'Sione', 'Rawiri', 'Jack', 'Arjun', 'Ethan', 'Tane', 'Josh', 'Ravi', 'Mateo', 'Hamish', 'Kauri', 'Leo'];
  var WOMEN_NEW = ['Priya', 'Aroha', 'Grace', 'Mei Lin', 'Ana', 'Ella', 'Harpreet', 'Ruby', 'Kahurangi', 'Losa', 'Sophie', 'Ngaio', 'Isla', 'Mia'];

  function svgData(svg) {
    var b = typeof btoa === 'function' ? btoa(unescape(encodeURIComponent(svg))) : Buffer.from(svg, 'utf8').toString('base64');
    return 'data:image/svg+xml;base64,' + b;
  }
  var GOLD = '<linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f8e6ae"/><stop offset=".55" stop-color="#d4a94f"/><stop offset="1" stop-color="#a97a2c"/></linearGradient>';
  var SHIELD = 'M100 6L188 30V108C188 166 148 206 100 228C52 206 12 166 12 108V30Z';
  var SHIELD_IN = 'M100 22L174 42V108C174 158 141 192 100 211C59 192 26 158 26 108V42Z';
  var CRESTS = {
    golf: svgData('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 236"><defs>' + GOLD + '</defs><path d="' + SHIELD + '" fill="#1d3a2a" stroke="url(#g)" stroke-width="8"/><path d="' + SHIELD_IN + '" fill="none" stroke="url(#g)" stroke-width="2" opacity=".7"/><path d="M42 160q15-10 30 0t30 0t30 0t30 0M54 180q12-8 24 0t24 0t24 0t24 0" fill="none" stroke="url(#g)" stroke-width="5" stroke-linecap="round"/><path d="M106 60V146" stroke="url(#g)" stroke-width="5" stroke-linecap="round"/><path d="M108 62L150 77L108 92Z" fill="url(#g)"/><circle cx="106" cy="148" r="5" fill="url(#g)"/><path d="M40 72C56 58 74 55 92 60" fill="none" stroke="url(#g)" stroke-width="3" stroke-linecap="round"/><path d="M52 66c-6 9-6 19 0 28c6-9 6-19 0-28zM67 61c-6 9-6 19 0 28c6-9 6-19 0-28zM82 60c-5 8-5 16 0 24c5-8 5-16 0-24z" fill="#f2c94c"/></svg>'),
    school: svgData('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 236"><defs>' + GOLD + '</defs><path d="' + SHIELD + '" fill="#1e2c4a" stroke="url(#g)" stroke-width="8"/><path d="' + SHIELD_IN + '" fill="none" stroke="url(#g)" stroke-width="2" opacity=".7"/><path d="M52 118q48-18 48 2q0-20 48-2v50q-48-18-48 2q0-20-48-2z" fill="#f4ecdc" stroke="url(#g)" stroke-width="4" stroke-linejoin="round"/><path d="M100 120v50" stroke="#1e2c4a" stroke-width="2"/><g fill="url(#g)"><path d="M100 46l4 10h10l-8 6 3 10-9-6-9 6 3-10-8-6h10z"/><path d="M70 74l3 7h7l-6 4 2 7-6-4-6 4 2-7-6-4h7z"/><path d="M130 74l3 7h7l-6 4 2 7-6-4-6 4 2-7-6-4h7z"/><path d="M100 92l2.5 6h6l-5 3.5 2 6-5.5-3.5-5.5 3.5 2-6-5-3.5h6z"/></g></svg>'),
    rugby: svgData('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 236"><path d="' + SHIELD + '" fill="#0d1b2a" stroke="#e0b43a" stroke-width="8"/><path d="M12 108L188 60V30L100 6L12 30Z" fill="#e0b43a" opacity=".95"/><ellipse cx="100" cy="140" rx="46" ry="28" transform="rotate(-30 100 140)" fill="none" stroke="#f4f1ea" stroke-width="6"/><path d="M80 152l40-24M86 136l6 10M96 130l6 10M106 124l6 10" stroke="#f4f1ea" stroke-width="4" stroke-linecap="round"/><text x="100" y="62" text-anchor="middle" font-family="Arial,sans-serif" font-weight="700" font-size="30" fill="#0d1b2a">NDRFC</text></svg>')
  };

  function pick(r, a) { return a[Math.floor(r() * a.length)]; }
  function initials(r, set) { var n = r() < 0.6 ? 2 : 1, s = ''; for (var i = 0; i < n; i++) s += pick(r, set.split('')) + '. '; return s; }
  function person(r, year, women) {
    if (year < 1965) return initials(r, women ? WOMEN_OLD : MEN_OLD) + pick(r, OLD_SUR);
    if (year < 1995) return (r() < 0.35 ? initials(r, women ? WOMEN_OLD : MEN_OLD) : pick(r, women ? WOMEN_MID : MEN_MID) + ' ') + pick(r, r() < 0.7 ? MID_SUR : OLD_SUR);
    return pick(r, women ? WOMEN_NEW : MEN_NEW) + ' ' + pick(r, r() < 0.8 ? NEW_SUR : MID_SUR);
  }
  // A list with the odd dynasty: champions often win a few years running.
  function winners(r, from, to, women, opts) {
    opts = opts || {};
    var rows = [], cur = null, left = 0;
    for (var y = from; y <= to; y++) {
      if (opts.gaps && opts.gaps.indexOf(y) >= 0) { rows.push([String(y), opts.gapText || 'Not contested']); continue; }
      if (!cur || left <= 0 || r() < 0.55) { cur = person(r, y, women); left = r() < 0.25 ? 3 : r() < 0.5 ? 1 : 0; }
      else left--;
      rows.push([String(y), cur]);
    }
    return rows;
  }
  function terms(r, from, to, women, len) {
    var rows = [], y = from;
    while (y <= to) {
      var n = len[0] + Math.floor(r() * (len[1] - len[0] + 1));
      var end = Math.min(to, y + n - 1);
      rows.push([n > 1 ? y + '–' + String(end).slice(-2) : String(y), person(r, y, women)]);
      y = end + 1;
    }
    return rows;
  }
  function rows(list) { return list.map(function (c) { return { c: c }; }); }
  var WAR = [1940, 1941, 1942, 1943, 1944, 1945];

  function golfClub() {
    var r = rng(1926);
    var men = winners(r, 1926, 2026, false, { gaps: WAR });
    var women = winners(r, 1931, 2026, true, { gaps: WAR });
    // a couple of famous names that turn up across boards
    men[5][1] = men[6][1] = men[9][1] = 'J. R. Wallace';
    men[62][1] = men[63][1] = 'Hēmi Tipene';
    women[50][1] = 'Mere Hēnare'; women[51][1] = 'Mere Hēnare'; women[55][1] = 'Mere Hēnare';
    men[100][1] = 'Arjun Nair'; women[95][1] = 'Kahurangi Ngata';
    var pres = terms(r, 1926, 2026, false, [1, 3]);
    pres[8][1] = 'J. R. Wallace';
    var caps = [];
    for (var y = 1952; y <= 2026; y++) caps.push([String(y), person(r, y, false), person(r, y, true)]);
    caps[18][1] = 'Hēmi Tipene';
    var life = [['1951', 'J. R. Wallace'], ['1958', 'E. M. Harper'], ['1966', 'D. A. Sinclair'], ['1974', 'R. T. Ngata'], ['1983', 'Judith Fitzgerald'], ['1990', 'Hēmi Tipene'], ['1997', 'Lynette Coleman'], ['2004', 'Mere Hēnare'], ['2011', 'Peter de Vries'], ['2019', 'Sione Faleolo'], ['2025', 'Christine Lim']];
    var lifeRows = rows(life);
    lifeRows[0].text = 'Club champion three times, president through the war years and the man who laid out the back nine by hand with a borrowed tractor.';
    lifeRows[5].text = 'Two club titles, men’s captain in 1970 and thirty years on the greens committee. The 14th green still carries his name.';
    lifeRows[7].text = 'Three club titles, women’s captain and the founder of the junior programme that has run every Saturday morning since 1994.';
    var hio = [];
    var holes = ['2nd', '5th', '7th', '11th', '14th', '16th'];
    for (var i = 0; i < 34; i++) { var yy = 1931 + Math.floor((i / 34) * 95) + Math.floor(r() * 2); hio.push([String(yy), person(r, yy, r() < 0.35), pick(r, holes) + ' hole']); }
    hio.sort(function (a, b) { return a[0] - b[0]; });
    var juniors = winners(r, 1972, 2026, r() < 0.3);
    for (var j = 0; j < juniors.length; j++) juniors[j][1] = person(r, Number(juniors[j][0]), j % 3 === 0);
    juniors[juniors.length - 7][1] = 'Arjun Nair';
    return {
      org: { name: 'Kōwhai Bay Golf Club', short: 'Kōwhai Bay', founded: '1926', tagline: 'Where the bush meets the bay', crest: CRESTS.golf, url: 'https://www.singhstudio.co.nz/laurel/demo/' },
      look: { theme: 'timber', wood: 'rimu', caps: true },
      screen: { seconds: 12, cover: true, spotlight: true, features: true, qr: true },
      boards: [
        { title: 'Club Champions', subtitle: 'Men', group: 'Championships', kind: 'champions', cols: [{ label: 'Year', role: 'year' }, { label: 'Champion', role: 'name' }], rows: rows(men) },
        { title: 'Club Champions', subtitle: 'Women', group: 'Championships', kind: 'champions', cols: [{ label: 'Year', role: 'year' }, { label: 'Champion', role: 'name' }], rows: rows(women) },
        { title: 'Junior Champions', subtitle: '', group: 'Championships', kind: 'champions', cols: [{ label: 'Year', role: 'year' }, { label: 'Champion', role: 'name' }], rows: rows(juniors) },
        { title: 'Course Records', subtitle: 'Gross', group: 'Championships', kind: 'records', cols: [{ label: 'Tees', role: 'text' }, { label: 'Holder', role: 'name' }, { label: 'Score', role: 'text' }, { label: 'Year', role: 'year' }], sort: 'none',
          rows: rows([['Men · Blue', 'Arjun Nair', '64', '2024'], ['Men · White', 'Hēmi Tipene', '66', '1988'], ['Women · Red', 'Kahurangi Ngata', '67', '2021'], ['Women · Gold', 'Mere Hēnare', '69', '2003'], ['Juniors', 'Leo Matagi', '70', '2026']]) },
        { title: 'Presidents', subtitle: '', group: 'Office holders', kind: 'office', cols: [{ label: 'Years', role: 'year' }, { label: 'President', role: 'name' }], rows: rows(pres) },
        { title: 'Club Captains', subtitle: '', group: 'Office holders', kind: 'office', cols: [{ label: 'Year', role: 'year' }, { label: 'Men’s captain', role: 'name' }, { label: 'Women’s captain', role: 'name' }], rows: rows(caps) },
        { title: 'Life Members', subtitle: '', group: 'Office holders', kind: 'members', cols: [{ label: 'Elected', role: 'year' }, { label: 'Life member', role: 'name' }], rows: lifeRows },
        { title: 'Hole in One', subtitle: '', group: 'Celebrations', kind: 'custom', cols: [{ label: 'Year', role: 'year' }, { label: 'Name', role: 'name' }, { label: 'Hole', role: 'text' }], rows: rows(hio) }
      ],
      updated: '2026-10-21T09:00:00.000Z'
    };
  }

  function school() {
    var r = rng(1958);
    var dux = [], prox = [], heads = [], sport = [];
    var sports = ['Athletics', 'Rugby', 'Netball', 'Rowing', 'Football', 'Hockey', 'Swimming', 'Basketball', 'Cricket', 'Waka ama', 'Cycling', 'Volleyball'];
    for (var y = 1958; y <= 2026; y++) {
      dux.push([String(y), person(r, y + 15, r() < 0.5)]);
      prox.push([String(y), person(r, y + 15, r() < 0.5)]);
      heads.push([String(y), person(r, y + 15, false), person(r, y + 15, true)]);
      if (y >= 1975) sport.push([String(y), person(r, y + 15, r() < 0.5), pick(r, sports)]);
    }
    dux[dux.length - 1][1] = 'Priya Sharma';
    var fame = rows([['1972', 'Dr Anahera Tipene', 'Medicine'], ['1981', 'Kevin Faleolo', 'Sport'], ['1990', 'Mei Lin Wong', 'Science'], ['2003', 'Rawiri Moana', 'Arts']]);
    fame[0].text = 'Dux in 1972, and later the doctor who set up the free clinic on Harbour Road. Still volunteers there on Thursdays.';
    fame[1].text = 'Played 52 tests for Samoa and came home to coach the First XV for a decade.';
    fame[2].text = 'Marine scientist whose work on the harbour’s seagrass beds changed how the region manages its estuaries.';
    fame[3].text = 'Composer and kapa haka tutor; wrote the school waiata sung at every prizegiving since 2006.';
    return {
      org: { name: 'Harbourview College', short: 'Harbourview', founded: '1958', tagline: 'Kia māia · Be courageous', crest: CRESTS.school, url: 'https://www.singhstudio.co.nz/laurel/demo/school/' },
      look: { theme: 'heritage', paper: 'ivory', caps: true },
      boards: [
        { title: 'Dux Litterarum', group: 'Academic', kind: 'champions', cols: [{ label: 'Year', role: 'year' }, { label: 'Dux', role: 'name' }], rows: rows(dux) },
        { title: 'Proxime Accessit', group: 'Academic', kind: 'champions', cols: [{ label: 'Year', role: 'year' }, { label: 'Name', role: 'name' }], rows: rows(prox) },
        { title: 'Head Students', group: 'Leadership', kind: 'office', cols: [{ label: 'Year', role: 'year' }, { label: 'Head boy', role: 'name' }, { label: 'Head girl', role: 'name' }], rows: rows(heads) },
        { title: 'Sportsperson of the Year', group: 'Sport', kind: 'champions', cols: [{ label: 'Year', role: 'year' }, { label: 'Name', role: 'name' }, { label: 'Sport', role: 'text' }], rows: rows(sport) },
        { title: 'Hall of Fame', subtitle: 'Old collegians', group: 'Community', kind: 'fame', cols: [{ label: 'Inducted', role: 'year' }, { label: 'Name', role: 'name' }, { label: 'Field', role: 'text' }], rows: fame }
      ],
      updated: '2026-10-21T09:00:00.000Z'
    };
  }

  function rugbyClub() {
    var r = rng(1904);
    var prem = [], poty = [], caps = [], cent = [];
    var grades = ['Premier', 'Premier Reserve', 'Colts', 'Women’s Premier'];
    for (var y = 1904; y <= 2026; y++) {
      if (WAR.indexOf(y) >= 0 || y === 1918 || y === 2020) continue;
      if (r() < 0.22) prem.push([String(y), y >= 1995 ? pick(r, grades) : pick(r, grades.slice(0, 3)), person(r, y, y >= 1995 && r() < 0.3)]);
      if (y >= 1950) poty.push([String(y), person(r, y, y >= 1995 && r() < 0.35)]);
      if (y >= 1960) caps.push([String(y), person(r, y, false)]);
      if (y >= 1968 && r() < 0.3) cent.push([String(y), person(r, y, y >= 1998 && r() < 0.4), String(100 + Math.floor(r() * 4) * 50)]);
    }
    prem.push(['2026', 'Women’s Premier', 'Ana Tuilagi']);
    poty[poty.length - 1][1] = 'Ana Tuilagi';
    var pres = terms(r, 1904, 2026, false, [1, 3]);
    var life = rows([['1931', 'W. G. Prendergast'], ['1962', 'T. H. Parata'], ['1979', 'Bruce Kowalski'], ['1988', 'Kevin Faleolo'], ['2001', 'Raewyn Sutherland'], ['2012', 'Sione Taufa'], ['2024', 'Losa Fonoti']]);
    life[3].text = 'Player, coach and the voice on the sideline PA for thirty-one seasons.';
    life[6].text = 'Founded the women’s team in 2009 and captained it to its first premiership.';
    return {
      org: { name: 'Northern Districts Rugby Football Club', short: 'Northern Districts RFC', founded: '1904', tagline: 'Play hard, play fair, play for each other', crest: CRESTS.rugby, url: 'https://www.singhstudio.co.nz/laurel/demo/rugby/' },
      look: { theme: 'modern', bg: '#0d1b2a', accent: '#e0b43a', caps: true },
      boards: [
        { title: 'Premiership Winners', group: 'Silverware', kind: 'detail', cols: [{ label: 'Year', role: 'year' }, { label: 'Grade', role: 'text' }, { label: 'Captain', role: 'name' }], rows: rows(prem) },
        { title: 'Player of the Year', group: 'Awards', kind: 'champions', cols: [{ label: 'Year', role: 'year' }, { label: 'Player', role: 'name' }], rows: rows(poty) },
        { title: 'Centurions', subtitle: 'Club games milestones', group: 'Awards', kind: 'detail', cols: [{ label: 'Year', role: 'year' }, { label: 'Player', role: 'name' }, { label: 'Games', role: 'text' }], rows: rows(cent) },
        { title: 'Club Captains', group: 'Office holders', kind: 'office', cols: [{ label: 'Year', role: 'year' }, { label: 'Captain', role: 'name' }], rows: rows(caps) },
        { title: 'Presidents', group: 'Office holders', kind: 'office', cols: [{ label: 'Years', role: 'year' }, { label: 'President', role: 'name' }], rows: rows(pres) },
        { title: 'Life Members', group: 'Office holders', kind: 'members', cols: [{ label: 'Elected', role: 'year' }, { label: 'Life member', role: 'name' }], rows: life }
      ],
      updated: '2026-10-21T09:00:00.000Z'
    };
  }

  function empty(title, subtitle, cols, kind, group) {
    return { title: title, subtitle: subtitle || '', group: group || '', kind: kind || 'champions', cols: cols, rows: [] };
  }
  var YN = function (n) { return [{ label: 'Year', role: 'year' }, { label: n || 'Name', role: 'name' }]; };
  var TEAM = function (n) { return [{ label: 'Year', role: 'year' }, { label: n || 'Team', role: 'name', multi: true }]; };
  var TEMPLATES = {
    golf: { label: 'Golf club', theme: 'timber', boards: [empty('Club Champions', 'Men', YN('Champion')), empty('Club Champions', 'Women', YN('Champion')), empty('Club Champions', 'Juniors', YN('Champion')), empty('Course Records', '', [{ label: 'Tees', role: 'text' }, { label: 'Holder', role: 'name' }, { label: 'Score', role: 'text' }, { label: 'Year', role: 'year' }], 'records'), empty('Presidents', '', [{ label: 'Years', role: 'year' }, { label: 'President', role: 'name' }], 'office'), empty('Club Captains', '', [{ label: 'Year', role: 'year' }, { label: 'Men’s captain', role: 'name' }, { label: 'Women’s captain', role: 'name' }], 'office'), empty('Life Members', '', [{ label: 'Elected', role: 'year' }, { label: 'Life member', role: 'name' }], 'members'), empty('Hole in One', '', [{ label: 'Year', role: 'year' }, { label: 'Name', role: 'name' }, { label: 'Hole', role: 'text' }], 'custom')] },
    bowls: { label: 'Bowling club', theme: 'timber', boards: [empty('Champion of Champions', '', YN('Champion')), empty('Singles', '', YN('Champion')), empty('Pairs', '', TEAM('Pair')), empty('Triples', '', TEAM('Team')), empty('Fours', '', TEAM('Team')), empty('Presidents', '', [{ label: 'Years', role: 'year' }, { label: 'President', role: 'name' }], 'office'), empty('Life Members', '', [{ label: 'Elected', role: 'year' }, { label: 'Life member', role: 'name' }], 'members')] },
    school: { label: 'School', theme: 'heritage', boards: [empty('Dux', '', YN('Dux')), empty('Proxime Accessit', '', YN()), empty('Head Students', '', [{ label: 'Year', role: 'year' }, { label: 'Head boy', role: 'name' }, { label: 'Head girl', role: 'name' }], 'office'), empty('Sportsperson of the Year', '', [{ label: 'Year', role: 'year' }, { label: 'Name', role: 'name' }, { label: 'Sport', role: 'text' }]), empty('Hall of Fame', 'Old students', [{ label: 'Inducted', role: 'year' }, { label: 'Name', role: 'name' }, { label: 'Field', role: 'text' }], 'fame')] },
    sport: { label: 'Sports club', theme: 'modern', boards: [empty('Premiership Winners', '', [{ label: 'Year', role: 'year' }, { label: 'Grade', role: 'text' }, { label: 'Captain', role: 'name' }]), empty('Player of the Year', '', YN('Player')), empty('Club Captains', '', YN('Captain'), 'office'), empty('Presidents', '', [{ label: 'Years', role: 'year' }, { label: 'President', role: 'name' }], 'office'), empty('Life Members', '', [{ label: 'Elected', role: 'year' }, { label: 'Life member', role: 'name' }], 'members'), empty('Centurions', '100 games', [{ label: 'Year', role: 'year' }, { label: 'Player', role: 'name' }, { label: 'Games', role: 'text' }])] },
    service: { label: 'Rotary, Lions or service club', theme: 'heritage', boards: [empty('Past Presidents', '', [{ label: 'Years', role: 'year' }, { label: 'President', role: 'name' }], 'office'), empty('Paul Harris Fellows', '', YN('Fellow')), empty('Life Members', '', [{ label: 'Elected', role: 'year' }, { label: 'Life member', role: 'name' }], 'members'), empty('Citizen of the Year', '', YN())] },
    blank: { label: 'Something else', theme: 'timber', boards: [empty('Honours', '', YN())] }
  };

  // Ready-made board shapes for "Add a board".
  var KINDS = [
    { kind: 'champions', label: 'Winners by year', hint: 'Champions, dux, player of the year', title: 'Champions', cols: [{ label: 'Year', role: 'year' }, { label: 'Name', role: 'name' }] },
    { kind: 'office', label: 'Office holders', hint: 'Presidents, captains, head students', title: 'Presidents', cols: [{ label: 'Years', role: 'year' }, { label: 'Name', role: 'name' }] },
    { kind: 'detail', label: 'Winners with a detail', hint: 'Score, sport, team or hole', title: 'Awards', cols: [{ label: 'Year', role: 'year' }, { label: 'Name', role: 'name' }, { label: 'Detail', role: 'text' }] },
    { kind: 'records', label: 'Records', hint: 'Event, holder, mark, year', title: 'Records', sort: 'none', cols: [{ label: 'Event', role: 'text' }, { label: 'Holder', role: 'name' }, { label: 'Record', role: 'text' }, { label: 'Year', role: 'year' }] },
    { kind: 'fame', label: 'Hall of fame', hint: 'Room for a photo and a few words each', title: 'Hall of Fame', cols: [{ label: 'Inducted', role: 'year' }, { label: 'Name', role: 'name' }, { label: 'Known for', role: 'text' }] },
    { kind: 'members', label: 'A plain list of names', hint: 'Life members, founders, volunteers', title: 'Life Members', cols: [{ label: 'Year', role: 'year' }, { label: 'Name', role: 'name' }] }
  ];

  var api = { golfClub: golfClub, school: school, rugbyClub: rugbyClub, TEMPLATES: TEMPLATES, KINDS: KINDS, CRESTS: CRESTS };
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.LaurelSamples = api;
})(typeof window !== 'undefined' ? window : this);
