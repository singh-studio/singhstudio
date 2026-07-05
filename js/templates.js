/* ============================================================
   SINGH STUDIO — templates page
   THE FINDER: one field-driven mechanism that replaces the old
   three-step chooser AND the separate shelf filter row.
   Runs alongside main.js (nav/cursor/clock/reveals/etc.).
   Progressive: the two chip rows and all seven cards are real
   HTML. JS filters the shelf live, injects a recommendation
   ribbon onto the matching card, and computes a "why" line from
   a table (6 types × 4 priorities = 24 combinations).
   ============================================================ */

/* ------------------------------------------------------------
   Template catalogue — names + demo path so the ribbon can
   name the recommended template and link to its live demo.
------------------------------------------------------------ */
const TEMPLATES = {
  toolbelt:   { name: "The Toolbelt",   demo: "templates/toolbelt.html" },
  counter:    { name: "The Counter",    demo: "templates/counter.html" },
  ledger:     { name: "The Ledger",     demo: "templates/ledger.html" },
  commons:    { name: "The Commons",    demo: "templates/commons.html" },
  programme:  { name: "The Programme",  demo: "templates/programme.html" },
  folio:      { name: "The Folio",      demo: "templates/folio.html" },
  storefront: { name: "The Storefront", demo: "templates/storefront.html" },
};

/* ------------------------------------------------------------
   The mapping: business type is primary. Each type resolves to
   a base template, and the chosen priority selects a "why" line.
   Two "sell/showcase" redirects send hospitality → storefront
   and creative → storefront when selling is the first job.
   Covers all 6 types × 4 priorities = 24 combinations.
------------------------------------------------------------ */
const CHOOSER = {
  trade: {
    base: "toolbelt",
    why: {
      found: "Built to get a trade found locally and phoned before the competition.",
      book:  "A quote form and click-to-call sit front and centre, so enquiries land while the interest is hot.",
      trust: "A clean past-jobs strip and reviews do the reassuring, so new customers take the risk on you.",
      sell:  "Your services and past work lead the page, framed to turn a browse into a booked job.",
    },
  },
  cafe: {
    base: "counter",
    redirect: { sell: "storefront" },
    why: {
      found: "Hours, location and a tempting first look are one tap from the top, exactly what a hungry local needs.",
      book:  "The booking link sits right alongside the menu, so a table is only ever a tap away.",
      trust: "A warm, appetising homepage makes a small venue read as a place worth the trip.",
      sell:  "A tight shopfront puts your product forward with checkout close behind: ideal if you're selling as much as serving.",
    },
  },
  practice: {
    base: "ledger",
    why: {
      found: "A clear services page and local signals help the right clients find a practice they can trust.",
      book:  "An enquiry form and booking link make the first contact effortless, without a hint of hard sell.",
      trust: "Quiet, editorial and assured, the layout does the work of looking established.",
      sell:  "Services and credentials lead, framed to turn a considered visitor into a first conversation.",
    },
  },
  community: {
    base: "commons",
    why: {
      found: "Service times, location and a warm welcome sit up top, so newcomers know they're in the right place.",
      book:  "Sign-ups and event registrations are one tap from the homepage, so it's easy to take the next step.",
      trust: "A welcoming, human layout tells your story and makes an organisation feel real and worth joining.",
      sell:  "Your story leads, with giving and joining made simple: the gentle version of a call to act.",
    },
  },
  event: {
    base: "programme",
    why: {
      found: "The date, the line-up and the pitch land immediately, so an interested visitor gets it in seconds.",
      book:  "Register is the loudest thing on the page, with the schedule right behind it to seal the decision.",
      trust: "A bold, timed layout makes a first-year event feel every bit as sorted as its tenth.",
      sell:  "Speakers and sessions do the selling, with register never more than a tap away.",
    },
  },
  creative: {
    base: "folio",
    redirect: { sell: "storefront" },
    why: {
      found: "The work leads, big and uncluttered, so the right client remembers you and gets in touch.",
      book:  "An easy enquiry sits under work that's done the convincing, so the commission follows naturally.",
      trust: "Spacious and work-first, the layout lets the portfolio carry the credibility on its own.",
      sell:  "A tidy shopfront puts prints or products forward with checkout close, so a browse can become a buy.",
    },
  },
};

/* Type → the first "why" shown before a priority is picked.
   Uses the type's base template and its "found" line as a
   sensible opener, so the ribbon reads well on type alone. */
const TYPE_OPENER = {
  trade:     "The go-to for trades that need to be found, trusted and phoned.",
  cafe:      "Appetite up front, hours and location one tap away.",
  practice:  "Quiet authority, clear services, an easy way to make contact.",
  community: "Gather people, tell the story, make joining or giving simple.",
  event:     "Sell the line-up, then send people straight to register.",
  creative:  "The work up front, big and uncluttered, with an easy way to commission.",
};

/* Priority label lookup — used in the ribbon's small framing note */
const PRIORITY_LABEL = {
  found: "Get found locally",
  book:  "Take bookings or registrations",
  trust: "Look established",
  sell:  "Sell or showcase work",
};

/* ============================================================
   THE FINDER — guarded module
   ============================================================ */
(() => {
  const finder = document.getElementById("finder");
  const grid = document.getElementById("tplGrid");
  if (!finder || !grid) return; // guard: bail if this page has no finder/shelf

  const shelf = document.querySelector(".tpl-shelf");
  const cards = [...grid.querySelectorAll(".tpl-card")];
  const typeBtns = [...finder.querySelectorAll("[data-type]")];
  const prioBtns = [...finder.querySelectorAll("[data-priority]")];
  const resetBtns = [...finder.querySelectorAll("[data-reset]")];
  const priorityRow = document.getElementById("finderPriorityRow");

  const state = { type: null, priority: null };
  const reduceMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---- filter map: type → the data-filter value(s) that match ---- */
  const TYPE_FILTER = {
    trade: ["trade"],
    cafe: ["cafe"],
    practice: ["practice"],
    community: ["community"],
    event: ["event"],
    creative: ["showcase"], // folio + storefront share the showcase group
  };

  const pressGroup = (btns, active) => {
    btns.forEach((b) => b.setAttribute("aria-pressed", String(b === active)));
  };

  /* Resolve the recommended template key + why line from state. */
  const resolve = () => {
    const cfg = CHOOSER[state.type];
    if (!cfg) return null;
    if (state.priority) {
      const key = (cfg.redirect && cfg.redirect[state.priority]) || cfg.base;
      return { key, why: cfg.why[state.priority] || cfg.why.found };
    }
    // type only, no priority yet
    return { key: cfg.base, why: TYPE_OPENER[state.type] };
  };

  /* ---- filter the shelf to the picked type ----
     The recommended card is always kept visible, even when a
     "sell" priority redirects outside the type's own filter
     group (e.g. café + sell → storefront, which lives in the
     "showcase" group). Without this, the redirected card would
     be hidden and the ribbon would have nothing to attach to. */
  const filterShelf = (recKey) => {
    const wanted = state.type ? [...TYPE_FILTER[state.type]] : null;
    const recCard = recKey ? cards.find((c) => c.dataset.tpl === recKey) : null;
    if (wanted && recCard && !wanted.includes(recCard.dataset.filter)) {
      wanted.push(recCard.dataset.filter);
    }
    cards.forEach((card) => {
      card.hidden = !!wanted && !wanted.includes(card.dataset.filter);
    });
  };

  /* ---- the recommendation ribbon (injected atop the matching card) ---- */
  const removeRibbon = () => {
    cards.forEach((c) => {
      c.classList.remove("tpl-recommended");
      const r = c.querySelector(".tpl-ribbon");
      if (r) r.remove();
    });
  };

  const injectRibbon = (key, why) => {
    const tpl = TEMPLATES[key];
    const card = cards.find((c) => c.dataset.tpl === key);
    if (!tpl || !card) return null;

    // clear any prior ribbon/highlight, then mark this card
    removeRibbon();
    card.classList.add("tpl-recommended");

    const note = state.priority ? PRIORITY_LABEL[state.priority] : null;

    const ribbon = document.createElement("div");
    ribbon.className = "tpl-ribbon";
    ribbon.setAttribute("role", "status"); // screen readers announce updates
    ribbon.innerHTML =
      '<p class="tr-tag">/ Recommended' +
      (note ? ' <span class="tr-note">&middot; ' + note + "</span>" : "") +
      "</p>" +
      '<p class="tr-why">' + why + "</p>" +
      '<a class="tr-demo" href="' + tpl.demo + '" data-cursor="OPEN">View the demo <span aria-hidden="true">&rarr;</span></a>';

    card.insertBefore(ribbon, card.firstChild);
    return card;
  };

  /* ---- enable / mute the priority row ---- */
  const setPriorityEnabled = (on) => {
    priorityRow.classList.toggle("is-locked", !on);
    prioBtns.forEach((b) => { b.disabled = !on; });
  };

  /* ---- bring the shelf into view after a pick ---- */
  const revealShelf = () => {
    const target = shelf || grid;
    target.scrollIntoView({ behavior: reduceMotion() ? "auto" : "smooth", block: "start" });
  };

  /* ---- apply current state to the DOM ---- */
  const update = ({ scroll } = {}) => {
    const res = resolve();
    filterShelf(res && res.key);       // keep the recommended card visible
    if (res) injectRibbon(res.key, res.why);
    if (scroll) revealShelf();
  };

  /* ---- reset everything ---- */
  const reset = () => {
    state.type = null;
    state.priority = null;
    pressGroup(typeBtns, null);
    pressGroup(prioBtns, null);
    setPriorityEnabled(false);
    removeRibbon();
    cards.forEach((c) => { c.hidden = false; }); // show all seven
  };

  /* ---- events: type chips ---- */
  typeBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      state.type = btn.dataset.type;
      state.priority = null;          // picking a new type resets the refinement
      pressGroup(typeBtns, btn);
      pressGroup(prioBtns, null);
      setPriorityEnabled(true);
      update({ scroll: true });
    });
  });

  /* ---- events: priority chips (refine only; type must be set) ---- */
  prioBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      if (!state.type) return;        // guard: row is disabled anyway
      state.priority = btn.dataset.priority;
      pressGroup(prioBtns, btn);
      update({ scroll: false });      // refine in place, no jump
    });
  });

  /* ---- events: "Show everything" reset ---- */
  resetBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      reset();
    });
  });

  /* start muted */
  setPriorityEnabled(false);
})();
