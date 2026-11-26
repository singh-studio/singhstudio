/* The Commons, show home. Every fact on the page comes from here. */
(function () {
  'use strict';
  var photoMeta = {
    hero: ['6223212', 'Someone in a mustard shirt tying the back of an apron, with a busy kitchen behind.', 5208, 3472],
    kai: ['35382036', 'Hands passing a small plate of food across a table.', 6000, 4000],
    kitchen: ['6822591', 'Hands slicing leeks on a wooden board beside chopped chilli and herbs.', 5730, 3820],
    homework: ['8466780', 'A desk covered in coloured pencils, with a drawing under way.', 6016, 4016],
    repair: ['7484788', 'A workshop wall with a rack of screwdrivers and chisels.', 5977, 3985],
    story: ['36356530', 'Hands hemming a pale cloth with a needle, sleeves of a blue jumper.', 5713, 4570],
    hall: ['33686723', 'Stacks of black, red, orange and blue hall chairs against a wall.', 6000, 4000],
    cups: ['31671827', 'Two patterned cups and saucers on a pale wooden table.', 3889, 2343],
    house: ['37257686', 'The white weatherboard gable of a small hall against a blue sky.', 6016, 4016],
    pantry: ['33438410', 'A wooden crate of peppers, tomatoes and aubergines seen from above.', 4128, 2322],
    playgroup: ['4473494', 'Wooden blocks spilled across a red rug.', 5922, 3673],
    reo: ['6328973', 'A hand writing notes in an open notebook.', 4978, 3319],
    garden: ['27177895', 'A gloved hand holding freshly picked tomatoes.', 5472, 3648]
  };
  /* Photos are local files, img/<name>-<width>.webp. Callers put the page's root in front of the path. */
  function photo(key, w) { return 'img/' + key + '-' + w + '.webp'; }
  function srcset(key) { return [640, 1200, 2400].map(function (w) { return photo(key, w) + ' ' + w + 'w'; }).join(', '); }

  var D = {
    tz: 'Pacific/Auckland',
    org: { name: 'Tide Street', full: 'Tide Street Community House', town: 'Lower Hutt', street: '14 Tide Street', since: 'March 2012', weeksOpen: 48,
      email: 'hello@tidestreet.example', phone: '04 555 0129', charity: 'CC00000' },
    /* Closed for the summer break every year from 24 December to 20 January, which is the four weeks that make 48. */
    closure: { from: [12, 24], to: [1, 20], label: 'the summer break' },
    counts: { seats: 90, coming: 73, maxPick: 6, plates: 4320, tuesdays: 48, things: 214, fixed: 171, kids: 32, tutors: 11, volunteers: 64, households: 40, platePrice: 6 },
    kinds: {
      food: { label: 'Food' }, learning: { label: 'Learning' }, making: { label: 'Making' }, little: { label: 'Little ones' }
    },
    sessions: [
      { id: 'kai', name: 'Kai Night', verb: 'is on', kind: 'food', open: '17:15', start: '17:30', end: '19:30', rule: { type: 'weekly', dows: [2] },
        line: 'Dinner at three long tables.', cost: 'Free, koha if you can', seats: 90,
        detail: 'Doors open at 5.15pm and dinner is served at 5.45pm. Graeme starts cooking at three, and everyone sits at one of the three long tables, so you will end up next to someone new.',
        bring: 'Nothing at all. A container is handy if you would like to take some home.',
        access: 'Step-free from Tide Street, an accessible toilet, and a hearing loop in the hall.' },
      { id: 'homework', name: 'Homework Club', verb: 'is on', kind: 'learning', start: '15:30', end: '17:00', rule: { type: 'weekly', dows: [1, 3] },
        line: 'Years 4 to 10, with tutors.', cost: 'Free',
        detail: 'Snacks are out at 3.30pm. There are 32 kids on the roster and 11 tutors, and every table has someone who has time to sit and work through it.',
        bring: 'Whatever homework you have, a water bottle and your school bag.',
        access: 'Step-free from Tide Street, and the quiet room is free if you want to work alone.' },
      { id: 'reo', name: 'Te reo for beginners', verb: 'is on', kind: 'learning', start: '19:00', end: '20:30', rule: { type: 'weekly', dows: [3] },
        line: 'Eight-week terms, 18 seats.', cost: '$40 a term, koha places kept', seats: 18,
        detail: 'Each term runs eight weeks and has 18 seats. A few places are always kept for people who can give what they can.',
        bring: 'A notebook and a pen. Tea is on the bench.',
        access: 'Step-free from Tide Street, an accessible toilet, and a hearing loop in the hall.' },
      { id: 'pantry', name: 'The pantry', verb: 'is open', kind: 'food', start: '10:00', end: '12:00', rule: { type: 'weekly', dows: [4] },
        line: 'Choose what you need.', cost: 'Free, no referral, no forms',
        detail: 'About 40 households come through each week. You choose what goes in your bag, and nobody will ask you to explain.',
        bring: 'A bag or two. We have spares if you forget.',
        access: 'Step-free from Tide Street, with a trolley you can borrow.' },
      { id: 'playgroup', name: 'Playgroup', verb: 'is on', kind: 'little', start: '09:30', end: '11:30', rule: { type: 'weekly', dows: [5] },
        line: 'Under fives with a grown-up.', cost: '$2 a family',
        detail: 'For under fives and the grown-up who brought them. There is a warm corner for babies, a messy corner for painting and a kettle that is always on.',
        bring: 'A change of clothes for the little one, and a drink bottle.',
        access: 'Step-free from Tide Street, an accessible toilet, and a baby change table.' },
      { id: 'repair', name: 'Repair Café', verb: 'is on', kind: 'making', start: '10:00', end: '13:00', rule: { type: 'nth', dow: 6, n: 1 },
        line: 'Bring it along and one of the fixers will open it up with you.', cost: 'Free, koha for parts',
        detail: 'On the first Saturday of the month. Last year 214 things came in and 171 left working. Fixers have a bench each and a very large box of screws.',
        bring: 'The thing that needs fixing, and the charger or cord that goes with it.',
        access: 'Step-free from Tide Street, with benches at wheelchair height.' },
      { id: 'garden', name: 'Garden morning', verb: 'is on', kind: 'making', start: '09:00', end: '11:00', rule: { type: 'alt', dow: 6, anchor: [2026, 11, 14] },
        line: 'Gloves and tea supplied.', cost: 'Free',
        detail: 'Every other Saturday. Gloves and tea are supplied, and there is always a job for whatever your back is feeling like that morning.',
        bring: 'Boots or shoes that can get muddy, and a hat.',
        access: 'Step-free paths to the raised beds, with seats along the way.' }
    ],
    sundayNote: 'The hall is hired out.',
    programmes: [
      { id: 'kai', name: 'Kai Night', when: 'Tuesdays, 5.30 to 7.30pm', line: 'Ninety seats, three long tables, and Graeme in the kitchen from three o’clock.', kind: 'food', photo: 'kai', pos: '50% 50%' },
      { id: 'homework', name: 'Homework Club', when: 'Mondays and Wednesdays, 3.30 to 5pm', line: 'A quiet room, a full fruit bowl and a tutor who remembers being stuck.', kind: 'learning', photo: 'homework', pos: '50% 50%' },
      { id: 'repair', name: 'Repair Café', when: 'First Saturday of the month, 10am to 1pm', line: 'Bring the lamp, the zip or the bike. Someone here has probably fixed one before.', kind: 'making', photo: 'repair', pos: '50% 45%' },
      { id: 'pantry', name: 'The pantry', when: 'Thursdays, 10am to noon', line: 'Come on a Thursday and choose what you need. Nobody will ask you to explain.', kind: 'food' },
      { id: 'reo', name: 'Te reo for beginners', when: 'Wednesdays, 7 to 8.30pm', line: 'Eight weeks, eighteen people and plenty of laughing at ourselves.', kind: 'learning' },
      { id: 'playgroup', name: 'Playgroup', when: 'Fridays, 9.30 to 11.30am', line: 'Blocks, paint, hot coffee and other adults to talk to.', kind: 'little' }
    ],
    roles: [
      { id: 'dish', name: 'Dish pit', when: 'Tuesdays, 7 to 8.30pm', needed: 2 },
      { id: 'packer', name: 'Pantry packer', when: 'Thursdays, 9 to 10am', needed: 1 },
      { id: 'tutor', name: 'Homework tutor', when: 'Mondays or Wednesdays, 3.15 to 5.15pm', needed: 3, vetted: true },
      { id: 'fixer', name: 'Fixer', when: 'First Saturday, 9.45am to 1.15pm', needed: 2 },
      { id: 'garden', name: 'Garden lead', when: 'Every other Saturday, 9 to 11am', needed: 1 }
    ],
    rooms: [
      { name: 'The main hall', size: '90 seated', rate: 35 },
      { name: 'The kitchen', size: 'Fully equipped', rate: 25 },
      { name: 'The front room', size: '14 seated', rate: 18 }
    ],
    people: [
      ['Moana Reweti', 'runs the house'], ['Graeme Pollock', 'cooks'], ['Priya Nair', 'homework club'],
      ['Hemi Walker', 'repairs and the building'], ['Ana Fifita', 'looks after volunteers'], ['Judith Lowe', 'chairs the board']
    ],
    palettes: {
      kitchen: { name: 'Kitchen', ink: '#2a1a2e', page: '#ffffff', main: '#ffcf4a', accent: '#c9361a', soft: '#bfdfe8', second: '#b9d17a', tint: '#f6f1f4' },
      harbour: { name: 'Harbour', ink: '#0f2438', page: '#ffffff', main: '#9fd3e6', accent: '#b23a0e', soft: '#ffe0b0', second: '#c9dca8', tint: '#eef4f7' },
      garden: { name: 'Garden', ink: '#17301f', page: '#ffffff', main: '#b9d17a', accent: '#8a2f5b', soft: '#f6d9e0', second: '#ffd98a', tint: '#f2f6ec' },
      dusk: { name: 'Dusk', ink: '#1d1a3a', page: '#ffffff', main: '#f2a7b5', accent: '#4c3fb5', soft: '#ffe1a8', second: '#c4c0ee', tint: '#f5f2fb' }
    },
    types: {
      table: { name: 'Table', note: 'Bricolage and Instrument Sans' },
      workshop: { name: 'Workshop', note: 'Familjen Grotesk', css: 'Familjen+Grotesk:wght@400..700' },
      hall: { name: 'Hall', note: 'Young Serif and Hanken Grotesk', css: 'Young+Serif&family=Hanken+Grotesk:wght@400..700' }
    },
    keepUrl: 'https://www.singhstudio.co.nz/index.html?about=The%20Commons#contact',
    photoMeta: photoMeta, photo: photo, srcset: srcset
  };
  window.COMMONS = D;
})();
