// Statutory and contractual definitions of "working day". Each regime is data:
// which holidays it skips, whether Waitangi Day and Anzac Day (or the New Year
// holidays) are skipped on their Mondayised dates, its summer closed period,
// and whether it skips a provincial anniversary day.
//
// status: "confirmed"  = checked against the text of the provision
//         "partial"    = checked against official extracts, not the full text
//         "convention" = a contract convention or official practice, not statute
// Statute text is verbatim in definitions.js (consolidated to 18 September 2026).

import { formatMonthDay } from './dates.js';
import { DEFINITIONS } from './definitions.js';

const CORE = ['waitangi', 'good-friday', 'easter-monday', 'anzac', 'sovereign', 'matariki', 'labour'];
const ALL = ['new-year', 'day-after-new-year', ...CORE, 'christmas', 'boxing'];
const WA = ['waitangi', 'anzac'];
const WA_NY = ['waitangi', 'anzac', 'new-year', 'day-after-new-year'];
const LEG = 'https://www.legislation.govt.nz/act/public';

const HOLIDAY_NAMES = {
  'new-year': "New Year's Day", 'day-after-new-year': '2 January', waitangi: 'Waitangi Day', 'good-friday': 'Good Friday',
  'easter-monday': 'Easter Monday', 'easter-tuesday': 'Easter Tuesday', anzac: 'Anzac Day', sovereign: "the King's Birthday",
  matariki: 'Matariki', labour: 'Labour Day', christmas: 'Christmas Day', boxing: 'Boxing Day',
};

const RECEIVED = 'Request received';

export const REGIMES = [
  // ---- Official information ------------------------------------------------
  {
    id: 'oia', slug: 'oia', short: 'OIA', family: 'information',
    title: 'Official Information Act 1982', menuLabel: 'OIA request (Official Information Act)',
    citation: 'Official Information Act 1982, s 2(1)',
    url: `${LEG}/1982/0156/latest/DLM64785.html`,
    status: 'confirmed',
    rules: { weekends: true, holidays: CORE, mondayised: WA, blackout: { from: '12-25', to: '01-15' }, anniversary: null },
    presets: [
      { id: 'decision', label: 'Decision on a request', days: 20, trigger: RECEIVED, cite: 's 15(1)' },
      { id: 'transfer', label: 'Transfer to another agency', days: 10, trigger: RECEIVED, cite: 's 14' },
      { id: 'clarify', label: 'Last day to ask the requester to clarify', days: 7, trigger: RECEIVED, cite: 's 15(1AB)(b)', note: 'Ask within this time and the clarified request can be treated as a new one (s 15(1AA)).' },
    ],
    page: {
      h1: 'OIA deadline calculator',
      title: 'OIA deadline calculator: 20 working days under the Official Information Act',
      description: 'Work out when an Official Information Act response is due. Skips weekends, public holidays, Mondayised days and 25 December to 15 January, and shows every skipped day.',
      lede: 'When must a Minister or agency decide on your Official Information Act request? Enter the day they received it.',
      card: 'Requests to government agencies and Ministers. 20 working days, with 25 Dec – 15 Jan excluded.',
      related: ['lgoima', 'privacy'],
      faq: [
        { q: 'How long does an agency have to answer an OIA request?', a: 'It must decide as soon as reasonably practicable, and no later than 20 working days after the day it receives the request (s 15(1)). It can extend that limit by notice under s 15A, given within the original 20 working days.' },
        { q: 'Does the Christmas break count?', a: 'No. No day from 25 December to 15 January is a working day under the OIA, so a request made in mid-December usually isn’t due until February.' },
        { q: 'Do anniversary days count?', a: 'Yes. The OIA’s definition doesn’t mention provincial anniversary days, so they count as working days even if the agency’s office is closed. (Councils are different: see the LGOIMA calculator.)' },
        { q: 'What if the agency asks me to clarify my request?', a: 'If you amend or clarify a request, the agency may treat it as a new request that replaces the original (s 15(1AA)), so the 20 working days can start again. Where the agency asked for the clarification, it can only do that if it asked within 7 working days of receiving the request (s 15(1AB)).' },
      ],
    },
  },
  {
    id: 'lgoima', slug: 'lgoima', short: 'LGOIMA', family: 'information', article: false,
    title: 'Local Government Official Information and Meetings Act 1987', menuLabel: 'LGOIMA request (councils)',
    citation: 'Local Government Official Information and Meetings Act 1987, s 2(1)',
    url: `${LEG}/1987/0174/latest/DLM122248.html`,
    status: 'confirmed',
    rules: { weekends: true, holidays: CORE, mondayised: WA, blackout: { from: '12-20', to: '01-10' }, anniversary: 'location', locationNoun: 'council' },
    presets: [
      { id: 'decision', label: 'Decision on a request', days: 20, trigger: RECEIVED, cite: 's 13(1)' },
      { id: 'transfer', label: 'Transfer to another agency', days: 10, trigger: RECEIVED, cite: 's 12' },
    ],
    notes: ['LGOIMA skips the anniversary day “observed in the appropriate area”, a phrase the Act doesn’t define. Duly uses the province where the council is. The Ombudsman’s own LGOIMA calculator leaves anniversary days out, so its dates can be a day early.'],
    page: {
      h1: 'LGOIMA deadline calculator',
      title: 'LGOIMA deadline calculator: council information requests',
      description: 'When must a council answer a LGOIMA request? Duly counts 20 working days, skipping 20 December to 10 January, public holidays and the local anniversary day.',
      lede: 'Councils answer under LGOIMA, which shuts down over a different summer period from the OIA and also skips the local anniversary day.',
      card: 'Requests to councils and CCOs. 20 working days, 20 Dec – 10 Jan and the anniversary day excluded.',
      related: ['oia', 'rma'],
      faq: [
        { q: 'How long does a council have to answer?', a: 'It must decide as soon as reasonably practicable, and no later than 20 working days after the day it receives the request (s 13(1)), unless it extends the limit under s 14.' },
        { q: 'Is LGOIMA’s Christmas period the same as the OIA’s?', a: 'No. LGOIMA excludes 20 December to 10 January; the OIA excludes 25 December to 15 January. LGOIMA also skips the anniversary day, which the OIA counts.' },
      ],
    },
  },
  {
    id: 'privacy', slug: 'privacy-act', short: 'Privacy Act', family: 'information',
    title: 'Privacy Act 2020', menuLabel: 'Privacy Act request for personal information',
    citation: 'Privacy Act 2020, s 7(1)',
    url: `${LEG}/2020/0031/latest/LMS23223.html`,
    status: 'confirmed',
    rules: { weekends: true, holidays: CORE, mondayised: WA, blackout: { from: '12-25', to: '01-15' }, anniversary: null },
    presets: [
      { id: 'access', label: 'Respond to a request for your information', days: 20, trigger: RECEIVED, cite: 's 44(1)' },
      { id: 'transfer', label: 'Transfer to another agency', days: 10, trigger: RECEIVED, cite: 's 43(2)' },
    ],
    page: {
      h1: 'Privacy Act request deadline calculator',
      title: 'Privacy Act request deadline: 20 working days to respond',
      description: 'Work out when an agency must respond to a request for your personal information under the Privacy Act 2020, with public holidays and 25 December to 15 January excluded.',
      lede: 'Asked an organisation for the information it holds about you? It has 20 working days to decide.',
      card: 'Requests for your personal information, to any agency. 20 working days.',
      related: ['oia', 'lgoima'],
      faq: [
        { q: 'How long does an agency have to respond?', a: 'As soon as reasonably practicable, and no later than 20 working days after the day it receives the request (s 44(1)), unless it extends the limit under s 48.' },
      ],
    },
  },

  // ---- Planning and building ----------------------------------------------
  {
    id: 'rma', slug: 'rma', short: 'RMA', family: 'planning',
    title: 'Resource Management Act 1991', menuLabel: 'Resource consent (RMA)',
    citation: 'Resource Management Act 1991, s 2(1)',
    url: `${LEG}/1991/0069/latest/DLM230272.html`,
    status: 'confirmed',
    rules: { weekends: true, holidays: CORE, mondayised: WA, blackout: { from: '12-20', to: '01-10' }, anniversary: null },
    presets: [
      { id: 'non-notified', label: 'Decision: not notified, no hearing', days: 20, trigger: 'Application first lodged', cite: 's 115(3)' },
      { id: 'notification', label: 'Decide whether to notify', days: 20, trigger: 'Application first lodged', cite: 's 95(2)(b)' },
      { id: 'submissions', label: 'Submissions close', days: 20, trigger: 'Date of notification', cite: 's 97' },
      { id: 'after-hearing', label: 'Decision after a hearing', days: 15, trigger: 'End of the hearing', cite: 's 115(2)' },
      { id: 'objection', label: 'Object to the council’s decision', days: 15, trigger: 'Decision notified to you', cite: 's 357C(1)' },
      { id: 'appeal', label: 'Appeal to the Environment Court', days: 15, trigger: 'Notice of decision received', cite: 's 121(1)(c)' },
      { id: 'incomplete', label: 'Return an incomplete application', days: 10, trigger: 'Application first lodged', cite: 's 88(3)' },
    ],
    notes: ['The RMA is being replaced. The Planning Act 2026 and Natural Environment Act 2026 received Royal assent on 30 September 2026, and an amended RMA applies during a transition from 30 October 2026. These timeframes and the definition are as at 18 September 2026: check whether your matter is under the RMA or the new Acts.'],
    page: {
      h1: 'RMA working days calculator',
      title: 'RMA working days calculator: resource consent timeframes',
      description: 'Count Resource Management Act working days for consent decisions, notification, submissions, objections and appeals, skipping 20 December to 10 January and public holidays.',
      lede: 'Resource consent clocks run in RMA working days, which stop from 20 December to 10 January.',
      card: 'Consent decisions, submissions, objections and appeals. 20 Dec – 10 Jan excluded.',
      related: ['building', 'lgoima'],
      faq: [
        { q: 'Do processing clocks stop when the council asks for more information?', a: 'Often, yes: requests for further information and some other steps put the statutory clock on hold under the Act’s time-limit rules. Duly counts plain working days, so add any days the clock was stopped.' },
        { q: 'Do anniversary days count?', a: 'Yes. The RMA’s definition doesn’t exclude provincial anniversary days.' },
      ],
    },
  },
  {
    id: 'building', slug: 'building-act', short: 'Building Act', family: 'planning',
    title: 'Building Act 2004', menuLabel: 'Building consent (Building Act)',
    citation: 'Building Act 2004, s 7(1)',
    url: `${LEG}/2004/0072/latest/DLM306036.html`,
    status: 'confirmed',
    rules: { weekends: true, holidays: CORE, mondayised: WA, blackout: { from: '12-20', to: '01-10' }, anniversary: 'location', locationNoun: 'building consent authority' },
    presets: [
      { id: 'consent', label: 'Decide a building consent', days: 20, trigger: 'Application received', cite: 's 48(1A)(b)' },
      { id: 'consent-fast', label: 'Multiple-use approval or whole-building modular', days: 10, trigger: 'Application received', cite: 's 48(1A)(a), (aa)' },
      { id: 'ccc', label: 'Decide a code compliance certificate', days: 20, trigger: 'Application made', cite: 's 93(1)(a)' },
    ],
    notes: ['The Building Act skips the anniversary day “observed in the appropriate area”, which it doesn’t define. Duly uses the province where the building consent authority is.'],
    page: {
      h1: 'Building consent working days calculator',
      title: 'Building consent working days calculator (Building Act 2004)',
      description: 'When is a building consent or code compliance certificate decision due? Duly counts working days under the Building Act 2004, skipping 20 December to 10 January, public holidays and the local anniversary day.',
      lede: 'Councils have 20 working days to decide most building consents and code compliance certificates. Here is the date.',
      card: 'Building consents and code compliance certificates. 20 working days.',
      related: ['rma', 'cca'],
      faq: [
        { q: 'Does a request for information stop the clock?', a: 'Yes. When the building consent authority asks for further information, the time limit is suspended until it receives that information (s 48(2)). Add the suspended days to Duly’s answer.' },
      ],
    },
  },

  // ---- Property and tenancy -------------------------------------------------
  {
    id: 'rta', slug: 'tenancy', short: 'RTA', family: 'property',
    title: 'Residential Tenancies Act 1986', menuLabel: 'Tenancy notice (Residential Tenancies Act)',
    citation: 'Residential Tenancies Act 1986, s 2(1)',
    url: `${LEG}/1986/0120/latest/DLM94278.html`,
    status: 'confirmed',
    rules: {
      weekends: true, holidays: ['waitangi', 'anzac', 'sovereign', 'matariki', 'labour', 'good-friday', 'easter-monday', 'easter-tuesday'],
      mondayised: WA, blackout: { from: '12-24', to: '01-03' }, anniversary: 'location', locationNoun: 'premises',
    },
    presets: [
      { id: 'periodic-90', label: 'Landlord ends a periodic tenancy', days: 90, unit: 'calendar', trigger: 'Notice given', cite: 's 51(1)' },
      { id: 'periodic-42', label: 'Landlord: owner or family moving in, or sold with vacant possession', days: 42, unit: 'calendar', trigger: 'Notice given', cite: 's 51(2)' },
      { id: 'tenant-21', label: 'Tenant ends a periodic tenancy', days: 21, unit: 'calendar', trigger: 'Notice given', cite: 's 51(2A)' },
      { id: 'rent-60', label: 'Rent increase takes effect', days: 60, unit: 'calendar', trigger: 'Notice given', cite: 's 24(1)(c)' },
      { id: 'remedy-14', label: 'Notice to remedy a breach', days: 14, unit: 'calendar', trigger: 'Notice given', cite: 's 56(1)(b)' },
      { id: 'bond', label: 'Lodge the bond with Tenancy Services', days: 23, trigger: 'Bond paid', cite: 's 19(1)(b)' },
    ],
    service: [
      { id: 'personal', label: 'Handed to the person', addWorkingDays: 0, cite: 's 136(1)(a)' },
      { id: 'email-before-5', label: 'Emailed before 5pm', addWorkingDays: 0, cite: 's 136(8)' },
      { id: 'email-after-5', label: 'Emailed after 5pm (next working day)', addWorkingDays: 1, cite: 's 136(8)' },
      { id: 'mailbox', label: 'Put in the mailbox or on the door (2nd working day)', addWorkingDays: 2, cite: 's 136(7)' },
      { id: 'post', label: 'Posted (4th working day)', addWorkingDays: 4, cite: 's 136(6)' },
    ],
    notes: [
      'Notice periods start the day after the notice is given or treated as given, and end at the close of the last day (s 136A). Choose how the notice was given and Duly does both steps.',
      'The RTA closes 24 December to 3 January only, and skips Good Friday to Easter Tuesday. Read literally, it doesn’t exclude a New Year holiday observed on 4 January (as in 2027 and 2028), so Duly counts it and says so.',
    ],
    page: {
      h1: 'Tenancy notice calculator',
      title: 'Tenancy notice calculator NZ: notice periods and service dates (RTA)',
      description: 'Work out when a tenancy notice is treated as given and when the notice period ends under the Residential Tenancies Act, including posting (4 working days), mailbox delivery (2) and email after 5pm.',
      lede: 'Notice periods are in calendar days, but a posted or letterboxed notice only counts as given some working days later. Duly works out both.',
      card: 'Notice periods, deemed delivery by post, mailbox or email, and bond lodgement.',
      related: ['sale-purchase', 'pla'],
      faq: [
        { q: 'When does a posted notice count as given?', a: 'On the fourth working day after posting, unless there is evidence otherwise (s 136(6)). A notice put in the mailbox or attached to the door counts as given on the second working day after delivery (s 136(7)), and an email sent after 5pm counts as given the next working day (s 136(8)).' },
        { q: 'How much notice does a landlord have to give?', a: 'For a periodic tenancy, at least 90 days in any case, or at least 42 days if the owner or a family member is moving in, or the property has been sold with vacant possession (s 51). A tenant must give at least 21 days (s 51(2A)).' },
        { q: 'Which working days does the RTA skip?', a: 'Weekends, Waitangi Day, Anzac Day (and their Mondayised dates), the King’s Birthday, Matariki, Labour Day, Good Friday to Easter Tuesday, 24 December to 3 January, and the anniversary day where the premises are.' },
      ],
    },
  },
  {
    id: 'sale-purchase', slug: 'sale-and-purchase', short: 'Sale and purchase agreement', family: 'property',
    title: 'Agreement for Sale and Purchase of Real Estate (TLANZ/REINZ)', menuLabel: 'Property sale and purchase agreement',
    citation: 'TLANZ/REINZ Agreement for Sale and Purchase of Real Estate, 11th ed (2022) (4), cl 1.1',
    url: 'https://thelawassociation.nz/',
    status: 'confirmed',
    definition: { paraphrase: 'Any day other than a weekend, Waitangi Day, Good Friday, Easter Monday, Anzac Day, the Sovereign’s Birthday, Labour Day, Matariki, any other day the Government declares a public holiday, Waitangi Day or Anzac Day’s Mondayised date, a day from 24 December to 5 January (to 15 January for the LIM date), or the anniversary day of the province where the property is. A working day runs from 9am to 5pm.' },
    rules: { weekends: true, holidays: CORE, mondayised: WA, blackout: { from: '12-24', to: '01-05' }, anniversary: 'location', locationNoun: 'property' },
    presets: [
      { id: 'finance', label: 'Finance condition', days: 10, trigger: 'Date of the agreement', note: 'Use the number of working days written into your agreement.' },
      { id: 'lim', label: 'LIM date (summer runs to 15 January)', days: 10, trigger: 'Date of the agreement', regime: 'sale-purchase-lim', note: 'The LIM date has a longer summer exclusion. Use the period in your agreement.' },
      { id: 'building-report', label: 'Building report condition', days: 10, trigger: 'Date of the agreement', note: 'Use the number of working days written into your agreement.' },
      { id: 'settlement-notice', label: 'Settle after a settlement notice', days: 12, trigger: 'Settlement notice served', cite: 'cl 11', note: 'Check the settlement-notice period in your edition of the agreement.' },
      { id: 'date-check', label: 'A date in the agreement that isn’t a working day', days: 0, unit: 'calendar', roll: 'previous', trigger: 'Date in the agreement', cite: 'cl 1.3(1)', note: 'The agreement moves it back to the last working day before.' },
    ],
    service: [
      { id: 'personal', label: 'Delivered or emailed before 5pm on a working day', addWorkingDays: 0, cite: 'cl 1.3(2)' },
      { id: 'after-hours', label: 'Emailed after 5pm or on a non-working day (next working day)', addWorkingDays: 1, cite: 'cl 1.3(2)' },
      { id: 'secure-web', label: 'Secure web document exchange (1st working day)', addWorkingDays: 1, cite: 'cl 1.4(4)' },
      { id: 'dx', label: 'Document exchange (2nd working day)', addWorkingDays: 2, cite: 'cl 1.4(4)' },
      { id: 'post', label: 'Ordinary mail (5th working day)', addWorkingDays: 5, cite: 'cl 1.4(4)' },
    ],
    notes: ['Edition 2022 (4) changed posted notices to the fifth working day after posting (it was the third). Check which edition your agreement uses.'],
    page: {
      h1: 'Sale and purchase agreement date calculator',
      title: 'Sale and purchase agreement working days calculator (TLANZ/REINZ, ADLS)',
      description: 'Work out condition dates under the TLANZ/REINZ (formerly ADLS) Agreement for Sale and Purchase of Real Estate: finance, LIM and building conditions and settlement notices, with 24 December to 5 January and the local anniversary day excluded.',
      lede: 'Condition dates in the standard agreement run in its own working days: no weekends, no public holidays, nothing from 24 December to 5 January, and not the anniversary day where the property is.',
      card: 'Condition dates, settlement notices and notice service for property sales.',
      related: ['rta', 'pla'],
      faq: [
        { q: 'What time does a working day end?', a: 'The agreement treats a working day as running from 9am to 5pm. Anything done after 5pm, or on a day that isn’t a working day, is treated as done at 9am on the next working day (cl 1.3(2)).' },
        { q: 'What if a condition or settlement date isn’t a working day?', a: 'Under cl 1.3(1) it becomes the last working day before that date, not the next one. Use the “date in the agreement” option to check.' },
        { q: 'Which anniversary day applies?', a: 'The anniversary day of the province where the property is, so an Auckland property skips Auckland Anniversary Day and a Wellington property skips Wellington Anniversary Day.' },
        { q: 'Is this the ADLS agreement?', a: 'Yes. ADLS is now The Law Association of New Zealand (TLANZ); the agreement is published with REINZ.' },
      ],
    },
  },
  {
    id: 'sale-purchase-lim', slug: 'sale-and-purchase-lim', short: 'Sale and purchase (LIM date)', family: 'property', compare: false,
    title: 'Agreement for Sale and Purchase of Real Estate: the LIM date', menuLabel: 'Property sale and purchase: LIM date',
    citation: 'TLANZ/REINZ Agreement for Sale and Purchase of Real Estate, 11th ed (2022) (4), cl 1.1(c)',
    url: 'https://thelawassociation.nz/',
    status: 'confirmed',
    rules: { weekends: true, holidays: CORE, mondayised: WA, blackout: { from: '12-24', to: '01-15' }, anniversary: 'location', locationNoun: 'property' },
    presets: [{ id: 'lim', label: 'LIM date', days: 10, trigger: 'Date of the agreement', note: 'Use the period in your agreement.' }],
  },
  {
    id: 'pla', slug: 'property-law-act', short: 'Property Law Act', family: 'property',
    title: 'Property Law Act 2007', menuLabel: 'Property Law Act notices (mortgages, leases)',
    citation: 'Property Law Act 2007, s 4',
    url: `${LEG}/2007/0091/latest/DLM968967.html`,
    status: 'confirmed',
    rules: { weekends: true, holidays: CORE, mondayised: WA, blackout: { from: '12-25', to: '01-02' }, anniversary: 'location', locationNoun: 'place where the act is to be done' },
    presets: [
      { id: 'mortgage-default', label: 'Mortgagee’s notice: time to remedy the default', days: 20, trigger: 'Notice served', cite: 's 120(c)', note: 'At least 20 working days after service, or longer if the mortgage says so.' },
    ],
    notes: ['The Property Law Act’s summer period ends on 2 January and, unlike the Legislation Act, has no rule for New Year holidays observed on 3 or 4 January. Read literally those days count, and Duly says so when it counts one.'],
    page: {
      h1: 'Property Law Act working days calculator',
      title: 'Property Law Act working days calculator (mortgagee notices)',
      description: 'Count working days under the Property Law Act 2007 for mortgagee and lease notices: weekends, public holidays, 25 December to 2 January and the anniversary day where the act is to be done.',
      lede: 'A mortgagee’s notice must give at least 20 working days to fix a default, counted under the Property Law Act’s own definition.',
      card: 'Mortgagee and lease notices. 25 Dec – 2 Jan and the anniversary day excluded.',
      related: ['sale-purchase', 'lta'],
      faq: [],
    },
  },
  {
    id: 'lta', slug: 'land-transfer-act', short: 'Land Transfer Act', family: 'property',
    title: 'Land Transfer Act 2017', menuLabel: 'Land Transfer Act (caveats)',
    citation: 'Land Transfer Act 2017, s 5(1)',
    url: `${LEG}/2017/0030/latest/DLM6731023.html`,
    status: 'confirmed',
    rules: { weekends: true, holidays: CORE, mondayised: WA_NY, blackout: { from: '12-25', to: '01-02' }, anniversary: null },
    presets: [
      { id: 'caveat-notice', label: 'Caveator tells the Registrar a court application has been made', days: 10, trigger: 'Registrar gives notice of lapse application', cite: 's 143(3)(a)' },
      { id: 'caveat-order', label: 'Court order served on the Registrar', days: 20, trigger: 'Caveator’s notice to the Registrar', cite: 's 143(3)(b)' },
    ],
    page: {
      h1: 'Caveat lapse calculator',
      title: 'Caveat lapse calculator (Land Transfer Act 2017, s 143)',
      description: 'When does a caveat lapse? Count Land Transfer Act working days for a caveator’s notice (10 working days) and the court order (20 more), skipping 25 December to 2 January and public holidays.',
      lede: 'A caveat lapses unless the caveator acts within 10 working days of the Registrar’s notice, then serves a court order within 20 more.',
      card: 'Lapse of caveats against dealings. 10 + 20 working days.',
      related: ['pla', 'sale-purchase'],
      faq: [],
    },
  },
  {
    id: 'ppsa', slug: 'ppsa', short: 'PPSA', family: 'property', compare: false,
    title: 'Personal Property Securities Act 1999', menuLabel: 'Personal Property Securities Act',
    citation: 'Personal Property Securities Act 1999, s 16(1)',
    url: `${LEG}/1999/0126/latest/DLM45629.html`,
    status: 'confirmed',
    rules: { weekends: true, holidays: CORE, mondayised: WA, blackout: { from: '12-25', to: '01-02' }, anniversary: null },
    presets: [],
    notes: ['For sections 165, 167A, 168 and 178 the PPSA’s summer period runs to 15 January, not 2 January.'],
  },

  // ---- Construction -----------------------------------------------------------
  {
    id: 'cca', slug: 'construction-contracts', short: 'CCA', family: 'construction',
    title: 'Construction Contracts Act 2002', menuLabel: 'Payment claim (Construction Contracts Act)',
    citation: 'Construction Contracts Act 2002, s 5',
    url: `${LEG}/2002/0046/latest/DLM162681.html`,
    status: 'confirmed',
    rules: { weekends: true, holidays: CORE, mondayised: WA, blackout: { from: '12-24', to: '01-05' }, anniversary: 'location', locationNoun: 'construction site' },
    presets: [
      { id: 'schedule', label: 'Payment schedule in reply to a claim', days: 20, trigger: 'Payment claim served', cite: 's 22(b)(ii)', note: 'Only if the contract sets no time. If it does, use the contract’s.' },
      { id: 'adjudication-response', label: 'Response to an adjudication claim', days: 5, trigger: 'Adjudication claim received', cite: 's 37(1)(a)' },
    ],
    notes: [
      'This 24 December to 5 January period applies to ss 18, 22, 24A, 33, 35–37A, 46, 47, 59 and 66. Sections 71B, 74 and 75 use 25 December to 15 January instead, and the retention-money sections (18C, 18K) aren’t in either list.',
      'The Act skips the anniversary day “observed in the appropriate area”, which it doesn’t define (MBIE’s prescribed forms leave it out). Duly uses the province where the site is.',
    ],
    page: {
      h1: 'Payment schedule deadline calculator',
      title: 'Payment schedule deadline calculator (Construction Contracts Act 2002)',
      description: 'When is a payment schedule due under the Construction Contracts Act? Duly counts 20 working days from service of the payment claim, skipping 24 December to 5 January, public holidays and the local anniversary day.',
      lede: 'Miss the payment schedule deadline and the claimed amount can become a debt due. Get the date right.',
      card: 'Payment claims, payment schedules and adjudication. 24 Dec – 5 Jan excluded.',
      related: ['building', 'companies'],
      faq: [
        { q: 'What if the contract sets its own date?', a: 'If the construction contract says when a payment schedule must be given, that applies. The 20 working days only apply when the contract is silent (s 22(b)).' },
      ],
    },
  },

  // ---- Courts -------------------------------------------------------------------
  {
    id: 'hcr', slug: 'high-court', short: 'High Court Rules', family: 'courts',
    title: 'High Court Rules 2016', menuLabel: 'High Court Rules',
    citation: 'High Court Rules 2016, r 1.3(1)',
    url: 'https://www.legislation.govt.nz/regulation/public/2016/0225/latest/DLM6951106.html',
    status: 'confirmed',
    rules: { weekends: true, holidays: CORE, mondayised: WA, blackout: { from: '12-25', to: '01-15' }, anniversary: null },
    presets: [
      { id: 'defence', label: 'File a statement of defence', days: 25, trigger: 'Statement of claim served', cite: 'r 5.47' },
    ],
    service: [
      { id: 'electronic-late', label: 'Served electronically after 5pm or on a non-working day (next working day)', addWorkingDays: 1, cite: 'r 6.6(3)' },
      { id: 'dx', label: 'Document exchange (2nd working day)', addWorkingDays: 2, cite: 'r 6.6' },
      { id: 'po-box', label: 'Posted to a PO box (5th working day)', addWorkingDays: 5, cite: 'r 6.6' },
    ],
    notes: ['Registries also close on court holidays: Good Friday to Easter Tuesday, 24 December to 3 January, and the anniversary day where the court is (r 3.2). If time runs out on a day the registry is closed, filing on the next day it is open is in time (r 1.18). Statutory appeal periods use the Senior Courts Act definition, which also skips that anniversary day.'],
    page: {
      h1: 'High Court working days calculator',
      title: 'High Court Rules working days calculator',
      description: 'Count working days under the High Court Rules 2016 for statements of defence and other steps, skipping 25 December to 15 January and public holidays, with deemed service dates.',
      lede: 'High Court time limits run in working days that skip 25 December to 15 January.',
      card: 'Statements of defence, service and other High Court steps.',
      related: ['dcr', 'companies'],
      faq: [],
    },
  },
  {
    id: 'senior-courts', slug: 'senior-courts-act', short: 'Senior Courts Act', family: 'courts', compare: false,
    title: 'Senior Courts Act 2016', menuLabel: 'Senior Courts Act (appeals and leave)',
    citation: 'Senior Courts Act 2016, s 4',
    url: `${LEG}/2016/0048/latest/DLM5759293.html`,
    status: 'confirmed',
    rules: { weekends: true, holidays: CORE, mondayised: WA, blackout: { from: '12-25', to: '01-15' }, anniversary: 'location', locationNoun: 'court' },
    presets: [
      { id: 'leave', label: 'Ask the Court of Appeal for leave after the High Court refuses', days: 20, trigger: 'High Court refuses leave', cite: 's 56(5)' },
    ],
  },
  {
    id: 'dcr', slug: 'district-court', short: 'District Court Rules', family: 'courts',
    title: 'District Court Rules 2014', menuLabel: 'District Court Rules',
    citation: 'District Court Rules 2014, r 1.4(1)',
    url: 'https://www.legislation.govt.nz/regulation/public/2014/0179/latest/DLM4891280.html',
    status: 'partial',
    rules: { weekends: true, holidays: CORE, mondayised: WA, blackout: { from: '12-25', to: '01-15' }, anniversary: null },
    presets: [
      { id: 'ten', label: '10 working days', days: 10, trigger: 'Start date' },
      { id: 'twenty', label: '20 working days', days: 20, trigger: 'Start date' },
    ],
    notes: ['Checked against official extracts of r 1.4(1) rather than the full text. Statutory periods under the District Court Act 2016 use its own definition, which also skips the anniversary day where the court office is.'],
    page: {
      h1: 'District Court working days calculator',
      title: 'District Court Rules working days calculator',
      description: 'Count working days under the District Court Rules 2014, skipping 25 December to 15 January and public holidays.',
      lede: 'District Court time limits in working days, with 25 December to 15 January left out.',
      card: 'Civil steps in the District Court.',
      related: ['hcr', 'companies'],
      faq: [],
    },
  },
  {
    id: 'district-court-act', slug: 'district-court-act', short: 'District Court Act', family: 'courts', compare: false,
    title: 'District Court Act 2016', menuLabel: 'District Court Act (statutory periods)',
    citation: 'District Court Act 2016, s 4',
    url: `${LEG}/2016/0049/latest/DLM6942203.html`,
    status: 'confirmed',
    rules: { weekends: true, holidays: CORE, mondayised: WA, blackout: { from: '12-25', to: '01-15' }, anniversary: 'location', locationNoun: 'court office' },
    presets: [],
  },

  // ---- Companies, tax, employment and contracts -----------------------------
  {
    id: 'companies', slug: 'companies-act', short: 'Companies Act', family: 'business',
    title: 'Companies Act 1993', menuLabel: 'Companies Act (statutory demands, meetings)',
    citation: 'Companies Act 1993, s 2(1)',
    url: `${LEG}/1993/0105/latest/DLM319576.html`,
    status: 'confirmed',
    rules: { weekends: true, holidays: CORE, mondayised: WA_NY, blackout: { from: '12-25', to: '01-02' }, anniversary: null },
    presets: [
      { id: 'statutory-demand', label: 'Comply with a statutory demand', days: 15, trigger: 'Demand served', cite: 's 289(2)(d)' },
      { id: 'set-aside', label: 'Apply to set aside a statutory demand', days: 10, trigger: 'Demand served', cite: 's 290(2)' },
    ],
    service: [
      { id: 'email', label: 'Emailed (received the next working day)', addWorkingDays: 1, cite: 's 392(1)(ca)' },
      { id: 'post', label: 'Posted or sent by document exchange (5 working days)', addWorkingDays: 5, cite: 's 392(1)(b)' },
    ],
    page: {
      h1: 'Statutory demand deadline calculator',
      title: 'Statutory demand deadline calculator (Companies Act 1993)',
      description: 'Work out statutory demand deadlines under the Companies Act 1993: 15 working days to comply and 10 to apply to set it aside, with 25 December to 2 January, public holidays and deemed service by post or email.',
      lede: 'A statutory demand gives 15 working days to pay, and 10 to apply to set it aside. Companies Act working days skip 25 December to 2 January.',
      card: 'Statutory demands and set-aside applications, with deemed service.',
      related: ['hcr', 'ird-due-date'],
      faq: [
        { q: 'When is a posted demand treated as received?', a: 'A document posted or sent by document exchange is treated as received 5 working days after posting, and an email the working day after it is sent (s 392(1)). Choose how it was served and Duly adds that first.' },
      ],
    },
  },
  {
    id: 'ird-due-date', slug: 'tax', short: 'IRD due dates', family: 'business', article: false, compare: false,
    title: 'IRD due dates that fall on a weekend or public holiday', menuLabel: 'Tax due date (IRD)',
    citation: 'Inland Revenue, “When to pay”; Legislation Act 2019, s 55',
    url: 'https://www.ird.govt.nz/managing-my-tax/make-a-payment/when-to-pay',
    status: 'convention',
    definition: { paraphrase: '“For due dates that fall on a weekend or public holiday, we need to receive your payment on or before the next working day.” (Inland Revenue)' },
    rules: { weekends: true, holidays: ALL, mondayised: ALL, blackout: null, anniversary: null },
    presets: [
      { id: 'due-date', label: 'Where a due date lands', days: 0, unit: 'calendar', roll: 'next', trigger: 'Due date' },
    ],
    notes: [
      'Anniversary days don’t move electronic payments: if a due date falls on your anniversary day, pay electronically by the due date itself (IRD Standard Practice Statement 21/03).',
      'IRD’s due dates (such as 15 January) are not moved by the 25 December to 15 January period in the tax Acts’ own definition of working day.',
    ],
    page: {
      h1: 'IRD due date calculator',
      title: 'IRD due date calculator: when a due date falls on a weekend or holiday',
      description: 'When an IRD due date falls on a weekend or public holiday, payment is due the next working day. Duly works out the date, including Mondayised holidays.',
      lede: 'If a tax due date isn’t a working day, Inland Revenue accepts payment on the next one. Enter the due date to see where it lands.',
      card: 'Tax due dates that fall on weekends and holidays.',
      related: ['companies', 'working-days'],
      faq: [
        { q: 'What about the 25 December to 15 January period?', a: 'The Income Tax Act and GST Act define working days to exclude 25 December to 15 January, but IRD still sets due dates such as 15 January, and the weekend and public holiday rule is what moves them.' },
      ],
    },
  },
  {
    id: 'tax-acts', slug: 'tax-acts', short: 'Tax Acts', family: 'business', article: false, compare: false,
    title: 'Income Tax Act 2007 and GST Act 1985 (used by the Tax Administration Act)', menuLabel: 'Tax Acts (working-day periods)',
    citation: 'Income Tax Act 2007, s YA 1; Goods and Services Tax Act 1985, s 2(1)',
    url: `${LEG}/2007/0097/latest/DLM1520575.html`,
    status: 'confirmed',
    rules: { weekends: true, holidays: CORE, mondayised: WA, blackout: { from: '12-25', to: '01-15' }, anniversary: null },
    presets: [],
    notes: ['The Tax Administration Act 1994 takes this definition from the Income Tax Act (s 3(2)). Provincial anniversary days are working days.'],
  },
  {
    id: 'era', slug: 'personal-grievance', short: 'Employment Relations Act', family: 'business', compare: false,
    title: 'Employment Relations Act 2000', menuLabel: 'Personal grievance or trial period (Employment Relations Act)',
    citation: 'Employment Relations Act 2000 (no own definition; Legislation Act 2019, s 13 applies)',
    url: `${LEG}/2000/0024/latest/DLM58317.html`,
    status: 'confirmed',
    rules: { weekends: true, holidays: ALL, mondayised: WA_NY, blackout: { from: '12-25', to: '01-02' }, anniversary: null },
    presets: [
      { id: 'pg-90', label: 'Raise a personal grievance', days: 90, unit: 'calendar', startRule: 'on', roll: 'next', trigger: 'Action happened or came to your notice', cite: 's 114(7)(b)', note: 'The 90 days begin with that day. If day 90 isn’t a working day, the next working day is in time (Legislation Act 2019, s 55).' },
      { id: 'trial-90', label: 'Last day of a 90-day trial period', days: 90, unit: 'calendar', startRule: 'on', trigger: 'First day of employment', cite: 's 67A(2)(a)', note: 'A trial period can be shorter; it can’t be longer than 90 days.' },
    ],
    notes: ['Sexual harassment grievances have 12 months (s 114(7)(a)), not 90 days.'],
    page: {
      h1: 'Personal grievance 90-day calculator',
      title: 'Personal grievance 90-day deadline calculator (Employment Relations Act)',
      description: 'Work out the last day to raise a personal grievance: 90 days beginning with the day the action happened or came to your notice, moved to the next working day if needed. Plus the last day of a 90-day trial period.',
      lede: 'A personal grievance must be raised within 90 days, beginning with the day the action happened or came to your notice.',
      card: 'The 90-day window to raise a grievance, and 90-day trial periods.',
      related: ['working-days', 'companies'],
      faq: [
        { q: 'Does the first day count?', a: 'Yes. The 90 days begin with the day of the action (or the day it came to your notice, if later), so that day is day 1 (Legislation Act 2019, s 54).' },
        { q: 'What if day 90 is a weekend or holiday?', a: 'Then raising it on the next working day is in time (Legislation Act 2019, s 55). Duly moves the date for you.' },
      ],
    },
  },
  {
    id: 'legislation-act', slug: 'working-days', short: 'Legislation Act', family: 'general',
    title: 'Legislation Act 2019', menuLabel: 'Any other Act (Legislation Act default)',
    citation: 'Legislation Act 2019, s 13',
    url: `${LEG}/2019/0058/latest/LMS268898.html`,
    status: 'confirmed',
    rules: { weekends: true, holidays: CORE, mondayised: WA_NY, blackout: { from: '12-25', to: '01-02' }, anniversary: null },
    presets: [
      { id: 'ten', label: '10 working days', days: 10, trigger: 'Start date' },
      { id: 'twenty', label: '20 working days', days: 20, trigger: 'Start date' },
    ],
    notes: ['Applies wherever legislation uses “working day” without its own definition, for example the Employment Relations Act and the Unit Titles Act.'],
    page: {
      h1: 'NZ working days calculator',
      title: 'NZ working days calculator (Legislation Act 2019 definition)',
      description: 'Count New Zealand working days for any Act without its own definition: weekends, public holidays, Mondayised days and 25 December to 2 January excluded, under the Legislation Act 2019.',
      lede: 'Where an Act uses “working day” without defining it, the Legislation Act 2019 definition applies.',
      card: 'The default definition for Acts without their own. 25 Dec – 2 Jan excluded.',
      related: ['business-day', 'era'],
      faq: [
        { q: 'Does the start day count?', a: 'It depends on the wording (Legislation Act 2019, s 54). A period “after” or “from” a day, or “within” a number of days of it, leaves that day out. A period “starting on” or “beginning with” a day includes it: tick “Count the start date itself as day 1”.' },
        { q: 'What if the last day isn’t a working day?', a: 'If something must be done on a day, or by the last day of a period, and that day isn’t a working day, it can be done on the next working day (s 55).' },
      ],
    },
  },
  {
    id: 'business-day', slug: 'business-days', short: 'Business days', family: 'general', article: false,
    title: 'Business day (banks open in Auckland and Wellington)', menuLabel: 'Business days (banks in Auckland and Wellington)',
    citation: 'Common contract definition of “business day”',
    url: 'https://www.employment.govt.nz/leave-and-holidays/public-holidays/public-holidays-and-anniversary-dates',
    status: 'convention',
    definition: { paraphrase: '“A day (other than a Saturday or Sunday) on which registered banks are open for general banking business in Auckland and Wellington.”' },
    rules: { weekends: true, holidays: ALL, mondayised: ALL, blackout: null, anniversary: ['auckland', 'wellington'] },
    presets: [
      { id: 'two', label: 'Two business days', days: 2, trigger: 'Start date' },
      { id: 'five', label: 'Five business days', days: 5, trigger: 'Start date' },
    ],
    page: {
      h1: 'NZ business days calculator',
      title: 'NZ business days calculator (banks open in Auckland and Wellington)',
      description: 'Count New Zealand business days as most finance and commercial contracts define them: weekends, public holidays and Auckland and Wellington anniversary days excluded.',
      lede: 'Most loan, settlement and commercial contracts define a business day as a day banks are open in Auckland and Wellington.',
      card: 'Finance and commercial contracts. No summer shutdown; both anniversary days skipped.',
      related: ['legislation-act', 'sale-purchase'],
      faq: [
        { q: 'Where does this definition come from?', a: 'It is a contract convention, not a statute. Check the definition in your own contract: some name other cities, or add a summer period.' },
      ],
    },
  },
];

export const REGIME_IDS = REGIMES.map((r) => r.id);
const BY_ID = Object.fromEntries(REGIMES.flatMap((r) => [[r.slug, r], [r.id, r]]));

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

function inBlackout(r, md) {
  const b = r.rules.blackout;
  if (!b) return false;
  return b.from <= b.to ? md >= b.from && md <= b.to : md >= b.from || md <= b.to;
}

const FIXED = { christmas: '12-25', boxing: '12-26', 'new-year': '01-01', 'day-after-new-year': '01-02' };
const anniversaryNames = (ids) => listJoin(ids.map((p) => p[0].toUpperCase() + p.slice(1)));

// Bullet points for "not a working day if it is…"
export function describeRulesList(r) {
  const { holidays, mondayised, blackout, anniversary } = r.rules;
  const out = [];
  if (r.rules.weekends) out.push('a Saturday or Sunday');
  const easterPeriod = holidays.includes('easter-tuesday');
  const named = holidays
    .filter((k) => !(FIXED[k] && inBlackout(r, FIXED[k])))
    .filter((k) => !(easterPeriod && ['good-friday', 'easter-monday', 'easter-tuesday'].includes(k)))
    .map((k) => HOLIDAY_NAMES[k]);
  if (named.length) out.push(listJoin(named));
  if (easterPeriod) out.push('any day from Good Friday to Easter Tuesday');
  const moved = mondayised.filter((k) => !(FIXED[k] && blackout && ['christmas', 'boxing'].includes(k)));
  if (moved.length) out.push(`the weekday ${listJoin(moved.map((k) => HOLIDAY_NAMES[k]))} ${moved.length > 1 ? 'are' : 'is'} observed on when ${moved.length > 1 ? 'they fall' : 'it falls'} on a weekend`);
  if (blackout) out.push(`any day from ${formatMonthDay(blackout.from)} to ${formatMonthDay(blackout.to)}`);
  if (anniversary === 'location') out.push(`the anniversary day of the province where the ${r.rules.locationNoun || 'place'} is`);
  else if (Array.isArray(anniversary)) out.push(`${anniversaryNames(anniversary)} Anniversary Day`);
  return out;
}

// One-line form used in tables and the API.
export function describeRules(r) {
  const { blackout, anniversary, holidays } = r.rules;
  const bits = ['weekends', 'public holidays'];
  if (holidays.includes('easter-tuesday')) bits.push('Good Friday to Easter Tuesday');
  if (blackout) bits.push(`${formatMonthDay(blackout.from)} – ${formatMonthDay(blackout.to)}`);
  if (anniversary === 'location') bits.push('the local anniversary day');
  else if (Array.isArray(anniversary)) bits.push(`${anniversaryNames(anniversary)} anniversary days`);
  return listJoin(bits);
}

for (const r of REGIMES) {
  if (!r.definition) r.definition = {};
  if (DEFINITIONS[r.id]) r.definition.quote = DEFINITIONS[r.id];
  // Ready-made summary, computed from the rules so text can never disagree with counting.
  r.summaryLine = `Skips ${describeRules(r)}.`;
  // "the OIA", "the RMA", but "LGOIMA" and "business days".
  r.the = r.article === false ? r.short : `the ${r.short}`;
}
