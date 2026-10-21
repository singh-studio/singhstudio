// Statutory and contractual definitions of "working day". Each regime is data:
// which holidays it skips, whether Waitangi Day and Anzac Day (or the New Year
// holidays) are skipped on their Mondayised dates, its summer closed period,
// and whether it skips a provincial anniversary day.
//
// status: "confirmed" = checked against the text of the provision;
//         "pending"   = taken from reliable secondary sources, not yet checked
//                       against the provision itself (the UI says so).

import { formatMonthDay } from './dates.js';

const CORE = ['waitangi', 'good-friday', 'easter-monday', 'anzac', 'sovereign', 'matariki', 'labour'];
const ALL = ['new-year', 'day-after-new-year', ...CORE, 'christmas', 'boxing'];
const LEG = 'https://www.legislation.govt.nz/act/public';

const HOLIDAY_NAMES = {
  'new-year': "New Year's Day", 'day-after-new-year': '2 January', waitangi: 'Waitangi Day', 'good-friday': 'Good Friday',
  'easter-monday': 'Easter Monday', anzac: 'Anzac Day', sovereign: "the King's Birthday", matariki: 'Matariki',
  labour: 'Labour Day', christmas: 'Christmas Day', boxing: 'Boxing Day',
};

export const REGIMES = [
  {
    id: 'oia', slug: 'oia', short: 'OIA', family: 'information',
    title: 'Official Information Act 1982', menuLabel: 'OIA request (Official Information Act)',
    citation: 'Official Information Act 1982, s 2 (“working day”)',
    url: `${LEG}/1982/0156/latest/DLM64785.html`,
    status: 'pending',
    rules: { weekends: true, holidays: CORE, mondayised: ['waitangi', 'anzac'], blackout: { from: '12-25', to: '01-15' }, anniversary: null },
    presets: [
      { id: 'decision', label: 'Decision on a request', days: 20, trigger: 'Request received', cite: 's 15(1)' },
      { id: 'transfer', label: 'Transfer to another agency', days: 10, trigger: 'Request received', cite: 's 14' },
    ],
    page: {
      h1: 'OIA deadline calculator',
      title: 'OIA deadline calculator: 20 working days under the Official Information Act',
      description: 'Work out when an Official Information Act response is due. Skips weekends, public holidays, Mondayised days and the 25 December to 15 January period, and shows every skipped day.',
      lede: 'When must a Minister or agency decide on your Official Information Act request? Enter the day they received it.',
      card: 'Requests to government agencies and Ministers. 20 working days, with 25 Dec – 15 Jan excluded.',
      related: ['lgoima', 'privacy'],
      faq: [
        { q: 'How long does an agency have to answer an OIA request?', a: 'The decision must be made and communicated as soon as reasonably practicable, and no later than 20 working days after the day the request is received (s 15(1)). The agency can extend that limit by notice under s 15A, and it must give the extension notice within the original 20 working days.' },
        { q: 'Does the Christmas break count?', a: 'No. Under the OIA, no day from 25 December to 15 January counts as a working day, so a request made in mid-December usually isn’t due until February.' },
        { q: 'Do anniversary days count?', a: 'Yes. The OIA’s definition doesn’t exclude provincial anniversary days, so they count as working days even if the agency’s office is closed.' },
      ],
    },
  },
  {
    id: 'lgoima', slug: 'lgoima', short: 'LGOIMA', family: 'information',
    title: 'Local Government Official Information and Meetings Act 1987', menuLabel: 'LGOIMA request (councils)',
    citation: 'Local Government Official Information and Meetings Act 1987, s 2 (“working day”)',
    url: `${LEG}/1987/0174/latest/DLM122248.html`,
    status: 'pending',
    rules: { weekends: true, holidays: CORE, mondayised: ['waitangi', 'anzac'], blackout: { from: '12-20', to: '01-10' }, anniversary: null },
    presets: [
      { id: 'decision', label: 'Decision on a request', days: 20, trigger: 'Request received', cite: 's 13(1)' },
      { id: 'transfer', label: 'Transfer to another agency', days: 10, trigger: 'Request received', cite: 's 12' },
    ],
    page: {
      h1: 'LGOIMA deadline calculator',
      title: 'LGOIMA deadline calculator: council information requests',
      description: 'When must a council answer a LGOIMA request? Duly counts 20 working days under the Local Government Official Information and Meetings Act, skipping the 20 December to 10 January period and public holidays.',
      lede: 'Councils and council organisations answer under LGOIMA, which shuts down over a different summer period from the OIA.',
      card: 'Requests to councils and CCOs. 20 working days, with 20 Dec – 10 Jan excluded.',
      related: ['oia', 'rma'],
      faq: [
        { q: 'How long does a council have to answer?', a: 'The decision must be made and communicated no later than 20 working days after the day the request is received (s 13(1)), unless the council extends the limit by notice under s 14.' },
        { q: 'Is LGOIMA’s Christmas period the same as the OIA’s?', a: 'No. LGOIMA excludes 20 December to 10 January; the OIA excludes 25 December to 15 January. The same request date can give different deadlines.' },
      ],
    },
  },
  {
    id: 'privacy', slug: 'privacy-act', short: 'Privacy Act', family: 'information',
    title: 'Privacy Act 2020', menuLabel: 'Privacy Act access request',
    citation: 'Privacy Act 2020, s 7 (“working day”)',
    url: `${LEG}/2020/0031/latest/LMS23223.html`,
    status: 'pending',
    rules: { weekends: true, holidays: CORE, mondayised: ['waitangi', 'anzac'], blackout: { from: '12-25', to: '01-15' }, anniversary: null },
    presets: [
      { id: 'access', label: 'Respond to an access request', days: 20, trigger: 'Request received', cite: 's 44' },
      { id: 'transfer', label: 'Transfer to another agency', days: 10, trigger: 'Request received', cite: 's 43' },
    ],
    page: {
      h1: 'Privacy Act request deadline calculator',
      title: 'Privacy Act request deadline: 20 working days to respond',
      description: 'Work out when an agency must respond to a request for your personal information under the Privacy Act 2020, with public holidays and the 25 December to 15 January period excluded.',
      lede: 'Asked an organisation for the information it holds about you? It has 20 working days to decide whether it will give it to you.',
      card: 'Personal information requests to any agency. 20 working days.',
      related: ['oia', 'lgoima'],
      faq: [
        { q: 'How long does an agency have to respond?', a: 'It must decide and tell you as soon as reasonably practicable, and no later than 20 working days after receiving the request (s 44), unless it extends the time limit under s 48.' },
      ],
    },
  },
  {
    id: 'rma', slug: 'rma', short: 'RMA', family: 'planning',
    title: 'Resource Management Act 1991', menuLabel: 'Resource consent (RMA)',
    citation: 'Resource Management Act 1991, s 2 (“working day”)',
    url: `${LEG}/1991/0069/latest/DLM230272.html`,
    status: 'pending',
    rules: { weekends: true, holidays: CORE, mondayised: ['waitangi', 'anzac'], blackout: { from: '12-20', to: '01-10' }, anniversary: null },
    presets: [
      { id: 'non-notified', label: 'Decision on a non-notified consent', days: 20, trigger: 'Application first lodged', cite: 's 115' },
      { id: 'submissions', label: 'Submissions close', days: 20, trigger: 'Application notified', cite: 's 97' },
      { id: 'objection', label: 'Objection to a council decision', days: 15, trigger: 'Decision notified', cite: 's 357C' },
      { id: 'appeal', label: 'Appeal to the Environment Court', days: 15, trigger: 'Decision received', cite: 's 121' },
    ],
    page: {
      h1: 'RMA working days calculator',
      title: 'RMA working days calculator: resource consent timeframes',
      description: 'Count Resource Management Act working days for resource consent processing, submissions, objections and appeals, skipping the 20 December to 10 January period and public holidays.',
      lede: 'Resource consent clocks run in RMA working days, which stop from 20 December to 10 January.',
      card: 'Resource consents, submissions, objections and appeals. 20 Dec – 10 Jan excluded.',
      related: ['building', 'lgoima'],
      faq: [
        { q: 'Do processing clocks stop when the council asks for more information?', a: 'Often, yes. Requests for further information and some other steps put the statutory clock on hold. Duly counts plain working days; add any days the clock was stopped.' },
      ],
    },
  },
  {
    id: 'building', slug: 'building-act', short: 'Building Act', family: 'planning',
    title: 'Building Act 2004', menuLabel: 'Building consent (Building Act)',
    citation: 'Building Act 2004, s 7 (“working day”)',
    url: `${LEG}/2004/0072/latest/DLM306036.html`,
    status: 'pending',
    rules: { weekends: true, holidays: CORE, mondayised: ['waitangi', 'anzac'], blackout: { from: '12-20', to: '01-10' }, anniversary: null },
    presets: [
      { id: 'consent', label: 'Decide a building consent', days: 20, trigger: 'Application received', cite: 's 48' },
      { id: 'ccc', label: 'Decide a code compliance certificate', days: 20, trigger: 'Application received', cite: 's 93' },
    ],
    page: {
      h1: 'Building consent working days calculator',
      title: 'Building consent working days calculator (Building Act 2004)',
      description: 'When is a building consent or code compliance certificate decision due? Duly counts 20 working days under the Building Act 2004, skipping 20 December to 10 January and public holidays.',
      lede: 'Councils have 20 working days to decide building consents and code compliance certificates. Here is the date.',
      card: 'Building consents and code compliance certificates. 20 working days.',
      related: ['rma', 'cca'],
      faq: [
        { q: 'Does a request for information stop the clock?', a: 'Yes. When the building consent authority asks for further information, the 20 working days are suspended until it receives that information (s 48(2)). Add the suspended days to Duly’s answer.' },
      ],
    },
  },
  {
    id: 'rta', slug: 'tenancy', short: 'RTA', family: 'property',
    title: 'Residential Tenancies Act 1986', menuLabel: 'Tenancy (Residential Tenancies Act)',
    citation: 'Residential Tenancies Act 1986, s 2 (“working day”)',
    url: `${LEG}/1986/0120/latest/DLM94278.html`,
    status: 'pending',
    rules: { weekends: true, holidays: ALL, mondayised: ['waitangi', 'anzac'], blackout: { from: '12-25', to: '01-15' }, anniversary: 'location', locationNoun: 'premises' },
    presets: [
      { id: 'bond', label: 'Lodge the bond with Tenancy Services', days: 23, trigger: 'Bond received', cite: 's 19' },
      { id: 'periodic-90', label: 'Landlord notice to end a periodic tenancy', days: 90, unit: 'calendar', trigger: 'Notice served', cite: 's 51' },
      { id: 'periodic-63', label: 'Landlord notice: owner or family moving in', days: 63, unit: 'calendar', trigger: 'Notice served', cite: 's 51' },
      { id: 'tenant-21', label: 'Tenant notice to end a periodic tenancy', days: 21, unit: 'calendar', trigger: 'Notice served', cite: 's 51' },
      { id: 'rent-60', label: 'Notice of a rent increase', days: 60, unit: 'calendar', trigger: 'Notice served', cite: 's 24' },
    ],
    page: {
      h1: 'Tenancy notice and deadline calculator',
      title: 'Tenancy notice calculator NZ: notice periods and working days (RTA)',
      description: 'Work out tenancy notice end dates and Residential Tenancies Act working-day deadlines, including deemed delivery by post or email and the anniversary day where the premises are.',
      lede: 'Notice periods under the Residential Tenancies Act are in calendar days, but delivery and some deadlines run in working days. Duly does both.',
      card: 'Notice periods, bond lodgement and deemed delivery of notices.',
      related: ['adls', 'pla'],
      faq: [],
    },
  },
  {
    id: 'adls', slug: 'sale-and-purchase', short: 'ADLS agreement', family: 'property',
    title: 'ADLS/REINZ Agreement for Sale and Purchase of Real Estate', menuLabel: 'Sale and purchase agreement (ADLS/REINZ)',
    citation: 'ADLS/REINZ Agreement for Sale and Purchase of Real Estate, cl 1 (“working day”)',
    url: 'https://www.adls.org.nz/',
    status: 'pending',
    rules: { weekends: true, holidays: CORE, mondayised: ['waitangi', 'anzac'], blackout: { from: '12-24', to: '01-05' }, anniversary: 'location', locationNoun: 'property' },
    presets: [
      { id: 'finance', label: 'Finance condition', days: 10, trigger: 'Date of the agreement', cite: 'cl 9 (period as agreed)', note: 'Use the number of working days written into your agreement.' },
      { id: 'lim', label: 'LIM condition', days: 10, trigger: 'Date of the agreement', cite: 'cl 9 (period as agreed)' },
      { id: 'requisitions', label: 'Requisitions on title', days: 10, trigger: 'Date of the agreement', cite: 'cl 6', note: 'Or the 5th working day before settlement, if earlier.' },
      { id: 'settlement-notice', label: 'Settle after a settlement notice', days: 12, trigger: 'Settlement notice served', cite: 'cl 11' },
    ],
    page: {
      h1: 'Sale and purchase agreement date calculator',
      title: 'Sale and purchase agreement working days calculator (ADLS/REINZ)',
      description: 'Work out condition dates under the ADLS/REINZ Agreement for Sale and Purchase of Real Estate: finance, LIM and due diligence periods, requisitions and settlement notices, with 24 December to 5 January and the local anniversary day excluded.',
      lede: 'Condition dates in the standard sale and purchase agreement run in its own working days: no weekends, public holidays, 24 December to 5 January, or the anniversary day where the property is.',
      card: 'Condition dates, requisitions and settlement notices for property sales.',
      related: ['rta', 'pla'],
      faq: [
        { q: 'What time does a working day end?', a: 'The standard agreement treats a working day as running from 9am to 5pm. A notice served after 5pm, or on a day that isn’t a working day, is treated as served on the next working day.' },
        { q: 'Which anniversary day applies?', a: 'The anniversary day of the province where the property is, so an Auckland property skips Auckland Anniversary Day and a Wellington property skips Wellington Anniversary Day.' },
      ],
    },
  },
  {
    id: 'pla', slug: 'property-law-act', short: 'Property Law Act', family: 'property',
    title: 'Property Law Act 2007', menuLabel: 'Property Law Act notices',
    citation: 'Property Law Act 2007, s 4 (“working day”)',
    url: `${LEG}/2007/0091/latest/DLM968967.html`,
    status: 'pending',
    rules: { weekends: true, holidays: ALL, mondayised: ['waitangi', 'anzac', 'new-year', 'day-after-new-year'], blackout: { from: '12-25', to: '01-02' }, anniversary: null },
    presets: [
      { id: 'mortgage-default', label: 'Mortgagee’s notice to remedy a default', days: 20, trigger: 'Notice served', cite: 's 121' },
    ],
    page: {
      h1: 'Property Law Act working days calculator',
      title: 'Property Law Act working days calculator',
      description: 'Count working days under the Property Law Act 2007 for mortgagee and lease notices, skipping public holidays and the Christmas to New Year period.',
      lede: 'Mortgage and lease notices under the Property Law Act run in its own working days.',
      card: 'Mortgagee and lease notices.',
      related: ['adls', 'rta'],
      faq: [],
    },
  },
  {
    id: 'cca', slug: 'construction-contracts', short: 'CCA', family: 'construction',
    title: 'Construction Contracts Act 2002', menuLabel: 'Payment claim (Construction Contracts Act)',
    citation: 'Construction Contracts Act 2002, s 5 (“working day”)',
    url: `${LEG}/2002/0046/latest/DLM162681.html`,
    status: 'pending',
    rules: { weekends: true, holidays: CORE, mondayised: ['waitangi', 'anzac'], blackout: { from: '12-24', to: '01-05' }, anniversary: null },
    presets: [
      { id: 'schedule', label: 'Payment schedule in reply to a claim', days: 20, trigger: 'Payment claim served', cite: 's 22', note: 'Applies when the contract sets no time. If it does, use the contract’s.' },
      { id: 'adjudication-response', label: 'Response to an adjudication claim', days: 5, trigger: 'Adjudication claim received', cite: 's 37' },
    ],
    page: {
      h1: 'Construction Contracts Act payment schedule calculator',
      title: 'Payment schedule deadline calculator (Construction Contracts Act 2002)',
      description: 'When is a payment schedule due under the Construction Contracts Act? Duly counts 20 working days from service of the payment claim, skipping 24 December to 5 January and public holidays.',
      lede: 'Miss the payment schedule deadline and the claimed amount can become a debt due. Get the date right.',
      card: 'Payment claims, payment schedules and adjudication. 24 Dec – 5 Jan excluded.',
      related: ['building', 'companies'],
      faq: [
        { q: 'What if the contract sets its own date?', a: 'If the construction contract says when a payment schedule must be given, that date applies. The 20 working days only apply when the contract is silent (s 22).' },
      ],
    },
  },
  {
    id: 'hcr', slug: 'high-court', short: 'High Court Rules', family: 'courts',
    title: 'High Court Rules 2016', menuLabel: 'High Court filing',
    citation: 'High Court Rules 2016, r 1.3 (“working day”)',
    url: 'https://www.legislation.govt.nz/regulation/public/2016/0225/latest/DLM6959801.html',
    status: 'pending',
    rules: { weekends: true, holidays: CORE, mondayised: ['waitangi', 'anzac'], blackout: { from: '12-25', to: '01-15' }, anniversary: null },
    presets: [
      { id: 'defence', label: 'File a statement of defence', days: 25, trigger: 'Statement of claim served', cite: 'r 5.47' },
      { id: 'appeal', label: 'Appeal to the Court of Appeal', days: 20, trigger: 'Decision given', cite: 'Senior Courts Act 2016, s 56' },
    ],
    page: {
      h1: 'High Court working days calculator',
      title: 'High Court Rules working days calculator',
      description: 'Count working days under the High Court Rules 2016 for statements of defence and other steps, skipping the court’s Christmas period and public holidays.',
      lede: 'High Court time limits run in working days that skip the Christmas vacation.',
      card: 'Statements of defence and other High Court steps.',
      related: ['dcr', 'companies'],
      faq: [],
    },
  },
  {
    id: 'dcr', slug: 'district-court', short: 'District Court Rules', family: 'courts',
    title: 'District Court Rules 2014', menuLabel: 'District Court filing',
    citation: 'District Court Rules 2014, r 1.3 (“working day”)',
    url: 'https://www.legislation.govt.nz/regulation/public/2014/0179/latest/DLM6129566.html',
    status: 'pending',
    rules: { weekends: true, holidays: CORE, mondayised: ['waitangi', 'anzac'], blackout: { from: '12-25', to: '01-15' }, anniversary: null },
    presets: [
      { id: 'defence', label: 'File a statement of defence', days: 25, trigger: 'Notice of claim served', cite: 'r 5.47' },
    ],
    page: {
      h1: 'District Court working days calculator',
      title: 'District Court Rules working days calculator',
      description: 'Count working days under the District Court Rules 2014, skipping the Christmas period and public holidays.',
      lede: 'District Court time limits in working days, with the Christmas period left out.',
      card: 'Civil steps in the District Court.',
      related: ['hcr'],
      faq: [],
    },
  },
  {
    id: 'companies', slug: 'companies-act', short: 'Companies Act', family: 'business',
    title: 'Companies Act 1993', menuLabel: 'Companies Act (statutory demands, meetings)',
    citation: 'Companies Act 1993, s 2 (“working day”)',
    url: `${LEG}/1993/0105/latest/DLM319576.html`,
    status: 'pending',
    rules: { weekends: true, holidays: CORE, mondayised: ['waitangi', 'anzac', 'new-year', 'day-after-new-year'], blackout: { from: '12-25', to: '01-02' }, anniversary: null },
    presets: [
      { id: 'statutory-demand', label: 'Comply with a statutory demand', days: 15, trigger: 'Demand served', cite: 's 289' },
      { id: 'set-aside', label: 'Apply to set aside a statutory demand', days: 10, trigger: 'Demand served', cite: 's 290' },
      { id: 'meeting', label: 'Notice of a shareholders’ meeting', days: 10, direction: 'before', trigger: 'Meeting date', cite: 'Sch 1 cl 2', note: 'Counted back from the meeting. Notice must be given before this day.' },
    ],
    page: {
      h1: 'Companies Act working days calculator',
      title: 'Statutory demand deadline calculator (Companies Act 1993)',
      description: 'Work out statutory demand and shareholder meeting dates under the Companies Act 1993, which skips 25 December to 2 January and public holidays.',
      lede: 'A statutory demand gives 15 working days to pay. Under the Companies Act those working days skip 25 December to 2 January.',
      card: 'Statutory demands, set-aside applications and meeting notices.',
      related: ['hcr', 'taa'],
      faq: [],
    },
  },
  {
    id: 'taa', slug: 'tax', short: 'Tax Administration Act', family: 'business',
    title: 'Tax Administration Act 1994', menuLabel: 'Tax (IRD due dates)',
    citation: 'Tax Administration Act 1994, s 3 (“working day”)',
    url: `${LEG}/1994/0166/latest/DLM348343.html`,
    status: 'pending',
    rules: { weekends: true, holidays: CORE, mondayised: ['waitangi', 'anzac'], blackout: { from: '12-25', to: '01-15' }, anniversary: null },
    presets: [
      { id: 'due-date', label: 'Check a due date (moves if not a working day)', days: 0, unit: 'calendar', roll: true, trigger: 'Due date' },
    ],
    page: {
      h1: 'IRD due date calculator',
      title: 'IRD due date calculator: when a due date falls on a weekend or holiday',
      description: 'When an IRD due date lands on a weekend, public holiday or in the summer break, payment is due the next working day. Duly works out that date under the Tax Administration Act 1994.',
      lede: 'If a tax due date isn’t a working day, it moves to the next one. Enter the due date to see where it lands.',
      card: 'Tax due dates that fall on weekends and holidays.',
      related: ['companies'],
      faq: [],
    },
  },
  {
    id: 'legislation-act', slug: 'working-days', short: 'Legislation Act', family: 'general',
    title: 'Legislation Act 2019', menuLabel: 'Any other Act (Legislation Act default)',
    citation: 'Legislation Act 2019, s 13 (“working day”)',
    url: `${LEG}/2019/0058/latest/LMS268898.html`,
    status: 'pending',
    rules: { weekends: true, holidays: ALL, mondayised: ['waitangi', 'anzac', 'new-year', 'day-after-new-year'], blackout: { from: '12-25', to: '01-02' }, anniversary: null },
    presets: [
      { id: 'ten', label: '10 working days', days: 10, trigger: 'Start date' },
      { id: 'twenty', label: '20 working days', days: 20, trigger: 'Start date' },
    ],
    page: {
      h1: 'NZ working days calculator',
      title: 'NZ working days calculator (Legislation Act 2019 definition)',
      description: 'Count New Zealand working days for any Act that doesn’t define its own: weekends, public holidays and 25 December to 2 January excluded, under the Legislation Act 2019.',
      lede: 'Where an Act uses “working day” without defining it, the Legislation Act 2019 definition applies.',
      card: 'The default definition for Acts without their own. 25 Dec – 2 Jan excluded.',
      related: ['business-day', 'companies'],
      faq: [],
    },
  },
  {
    id: 'business-day', slug: 'business-days', short: 'Banking business day', family: 'general',
    title: 'Business day (banks open in Auckland and Wellington)', menuLabel: 'Business days (banks in Auckland and Wellington)',
    citation: 'Common contract definition of “business day”',
    url: 'https://www.employment.govt.nz/leave-and-holidays/public-holidays/public-holidays-and-anniversary-dates',
    status: 'convention',
    compare: true,
    rules: { weekends: true, holidays: ALL, mondayised: ['new-year', 'day-after-new-year', 'waitangi', 'anzac', 'christmas', 'boxing'], blackout: null, anniversary: ['auckland', 'wellington'] },
    presets: [
      { id: 'two', label: 'Two business days', days: 2, trigger: 'Start date' },
      { id: 'five', label: 'Five business days', days: 5, trigger: 'Start date' },
    ],
    page: {
      h1: 'NZ business days calculator',
      title: 'NZ business days calculator (banks open in Auckland and Wellington)',
      description: 'Count New Zealand business days the way most finance and commercial contracts define them: weekends, public holidays and Auckland and Wellington anniversary days excluded.',
      lede: 'Most loan, settlement and commercial contracts define a business day as a day banks are open in Auckland and Wellington.',
      card: 'Finance and commercial contracts. No summer shutdown; both anniversary days skipped.',
      related: ['working-days', 'adls'],
      faq: [
        { q: 'Where does this definition come from?', a: 'It is a contract convention rather than a statute: “a day (other than a Saturday or Sunday) on which registered banks are open for general banking business in Auckland and Wellington”. Check the definition in your own contract, because some name other cities or add the summer period.' },
      ],
    },
  },
];

// Ready-made summaries, computed from the rules so text can never disagree with counting.
for (const r of REGIMES) {
  r.summaryLine = `Skips ${describeRules(r)}.`;
}

export const REGIME_IDS = REGIMES.map((r) => r.id);
const BY_ID = Object.fromEntries(REGIMES.flatMap((r) => [[r.id, r], [r.slug, r]]));

export const PRESETS = Object.fromEntries(REGIMES.map((r) => [r.id, r.presets || []]));

export function getRegime(id) {
  const r = BY_ID[id];
  if (!r) throw new RangeError(`Unknown regime ${JSON.stringify(id)}. Use one of: ${REGIME_IDS.join(', ')}`);
  return r;
}

function listJoin(items) {
  if (items.length <= 1) return items.join('');
  return `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`;
}

function blackoutCovers(r, key) {
  const b = r.rules.blackout;
  if (!b) return false;
  const md = { christmas: '12-25', boxing: '12-26', 'new-year': '01-01', 'day-after-new-year': '01-02' }[key];
  if (!md) return false;
  return b.from <= b.to ? md >= b.from && md <= b.to : md >= b.from || md <= b.to;
}

// Bullet points for "not a working day if it is…"
export function describeRulesList(r) {
  const { holidays, mondayised, blackout, anniversary } = r.rules;
  const out = [];
  if (r.rules.weekends) out.push('a Saturday or Sunday');
  const named = holidays.filter((k) => !blackoutCovers(r, k)).map((k) => HOLIDAY_NAMES[k]);
  if (named.length) out.push(listJoin(named));
  const moved = mondayised.filter((k) => !['christmas', 'boxing'].includes(k) || !blackout);
  if (moved.length) {
    const names = moved.map((k) => HOLIDAY_NAMES[k]);
    out.push(`the Monday (or Tuesday) a holiday moves to when it falls on a weekend: ${listJoin(names)}`);
  }
  if (blackout) out.push(`any day from ${formatMonthDay(blackout.from)} to ${formatMonthDay(blackout.to)}`);
  if (anniversary === 'location') out.push(`the anniversary day of the province where the ${r.rules.locationNoun || 'place'} is`);
  else if (Array.isArray(anniversary)) out.push(`${listJoin(anniversary.map((p) => p[0].toUpperCase() + p.slice(1)))} Anniversary Day`);
  return out;
}

// One-line form used in tables and the API.
export function describeRules(r) {
  const { blackout, anniversary } = r.rules;
  const bits = ['weekends', 'public holidays'];
  if (blackout) bits.push(`${formatMonthDay(blackout.from)} – ${formatMonthDay(blackout.to)}`);
  if (anniversary === 'location') bits.push(`the local anniversary day`);
  else if (Array.isArray(anniversary)) bits.push(`${listJoin(anniversary.map((p) => p[0].toUpperCase() + p.slice(1)))} anniversary days`);
  return listJoin(bits);
}
