/* ============================================================
   SINGH STUDIO — interactions
   Vanilla JS, no dependencies.
   ============================================================ */

/* ------------------------------------------------------------
   CONFIG — the one block Kris needs to touch.
   Create a Google Calendar "appointment schedule" (it attaches
   a Google Meet link automatically) and paste the share URL
   below, e.g. "https://calendar.app.google/AbC123..."
   Until then, the book buttons fall back to a pre-filled email.
------------------------------------------------------------ */
const CONFIG = {
  bookingUrl: "https://calendar.app.google/vMWDbHmj9NgqmHc48",
  email: "kris@singhstudio.co.nz",
  // Web3Forms access key (public-by-design). Create the free account with
  // kris@singhstudio.co.nz at web3forms.com and paste the key here — the
  // enquiry form posts through their API from that moment. Until then the
  // form falls back to composing a structured email instead.
  web3formsKey: "824b0ab2-38a3-495a-9d44-074b13c574cd",
  // GA4 measurement ID, e.g. "G-XXXXXXXXXX". Create the property at
  // analytics.google.com and paste the ID here — gtag loads (with ads
  // personalisation and signals off) from that moment. Empty = no
  // analytics script is ever loaded.
  ga4Id: "",
  // Cloudflare Web Analytics beacon token. Empty = the beacon is never
  // loaded and no request is made.
  cfBeaconToken: "",
  // Studio Hub: each enquiry also becomes a lead in the hub, alongside the
  // Web3Forms email. Leave either value empty and only Web3Forms is used.
  hubEnquiryUrl: "https://hub.singhstudio.co.nz/api/public/enquiry",
  // Cloudflare Turnstile site key for the hub post (public by design).
  turnstileSiteKey: "",
};

// Local preview: post to the hub's dev server with Cloudflare's test keys.
// ?ts=quiet, ?ts=fail or ?ts=challenge pick the other test keys.
if (location.hostname === "localhost" || location.hostname === "127.0.0.1") {
  const ts = new URLSearchParams(location.search).get("ts");
  CONFIG.hubEnquiryUrl = "http://localhost:5173/api/public/enquiry";
  CONFIG.turnstileSiteKey = { quiet: "1x00000000000000000000BB", fail: "2x00000000000000000000AB", challenge: "3x00000000000000000000FF" }[ts] || "1x00000000000000000000AA";
}

const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const isCoarse = window.matchMedia("(pointer: coarse)").matches;
const clamp = (v, min, max) => Math.min(max, Math.max(min, v));
const lerp = (a, b, t) => a + (b - a) * t;
let restoringFocus = false; // set while the lightbox hands focus back, so that never scrolls the light table

/* ============================================================
   TRACKING — provider-agnostic wrapper. No provider is loaded
   yet (D1 pending); this must no-op safely until one is.
   ============================================================ */

/* Track — thin wrapper so the provider can change without touching call sites */
const track = (name, props = {}) => {
  try {
    if (window.gtag) gtag("event", name, props);
    else if (window.plausible) plausible(name, { props });
  } catch { /* analytics must never break the page */ }
};

/* Delegated click tracking — one listener, not per-element */
document.addEventListener("click", (e) => {
  const el = e.target.closest("[data-track]");
  if (el) track(el.dataset.track, { label: el.dataset.trackLabel || el.textContent.trim().slice(0, 60) });
});

/* GA4 — loads only when CONFIG.ga4Id is set, from this one place, on all
   pages. Privacy-tilted: IP anonymised, Google signals and ads
   personalisation off. Empty id = zero analytics bytes shipped. */
(() => {
  if (!CONFIG.ga4Id) return;
  const s = document.createElement("script");
  s.async = true;
  s.src = "https://www.googletagmanager.com/gtag/js?id=" + encodeURIComponent(CONFIG.ga4Id);
  document.head.appendChild(s);
  window.dataLayer = window.dataLayer || [];
  window.gtag = function () { dataLayer.push(arguments); };
  gtag("js", new Date());
  gtag("config", CONFIG.ga4Id, {
    anonymize_ip: true,
    allow_google_signals: false,
    allow_ad_personalization_signals: false,
  });
})();

/* Cloudflare Web Analytics — loads only when CONFIG.cfBeaconToken is set,
   once per page. Empty token = nothing loads, no request is made. */
(() => {
  if (!CONFIG.cfBeaconToken) return;
  if (document.querySelector("script[data-cf-beacon]")) return;
  const s = document.createElement("script");
  s.defer = true;
  s.src = "https://static.cloudflareinsights.com/beacon.min.js";
  s.setAttribute("data-cf-beacon", JSON.stringify({ token: CONFIG.cfBeaconToken }));
  document.head.appendChild(s);
})();

/* Landing page and referrer for this visit, kept for the enquiry form */
(() => {
  try {
    if (!sessionStorage.getItem("ss_landing")) {
      sessionStorage.setItem("ss_landing", location.pathname);
      if (document.referrer) {
        const h = new URL(document.referrer).hostname;
        if (h && h !== location.hostname) sessionStorage.setItem("ss_ref", h);
      }
    }
  } catch { /* storage or URL unavailable: no attribution */ }
})();

/* ============================================================
   PRELOADER
   ============================================================ */
(() => {
  const loader = document.getElementById("loader");
  const count = document.getElementById("loaderCount");
  if (!loader) { document.body.classList.add("ready"); return; }
  const finish = () => {
    loader.classList.add("done");
    document.body.removeAttribute("data-loading");
    document.body.classList.add("ready");
    setTimeout(() => loader.remove(), 1200);
  };
  const markSeen = () => {
    try { sessionStorage.setItem("ss-seen", "1"); } catch { /* private mode */ }
  };

  let seen = false;
  try { seen = sessionStorage.getItem("ss-seen") !== null; } catch { /* private mode */ }
  if (seen) { finish(); return; }

  // Arriving from another site: skip the animation, so a search result lands on the page at once
  let fromElsewhere = false;
  try {
    const host = (h) => h.replace(/^www\./, "");
    fromElsewhere = !!document.referrer && host(new URL(document.referrer).hostname) !== host(location.hostname);
  } catch { /* no URL API: treat as a direct visit */ }
  if (fromElsewhere) { finish(); markSeen(); return; }

  if (prefersReduced) { finish(); markSeen(); return; }

  const start = performance.now();
  const DURATION = 1250;
  const tick = (now) => {
    const p = clamp((now - start) / DURATION, 0, 1);
    const eased = 1 - Math.pow(1 - p, 3);
    count.textContent = String(Math.round(eased * 100)).padStart(3, "0");
    if (p < 1) requestAnimationFrame(tick);
    else setTimeout(finish, 180);
  };
  requestAnimationFrame(tick);
  markSeen();
})();

/* ============================================================
   CUSTOM CURSOR + MAGNETIC BUTTONS
   ============================================================ */
(() => {
  if (isCoarse || prefersReduced) return;
  const cursor = document.getElementById("cursor");
  const label = document.getElementById("cursorLabel");
  let cx = -100, cy = -100, tx = -100, ty = -100, shown = false;

  window.addEventListener("mousemove", (e) => {
    tx = e.clientX; ty = e.clientY;
    if (!shown) { shown = true; cursor.classList.add("on"); cx = tx; cy = ty; }
  }, { passive: true });

  const loop = () => {
    cx = lerp(cx, tx, 0.22);
    cy = lerp(cy, ty, 0.22);
    cursor.style.transform = `translate(${cx}px, ${cy}px)`;
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);

  // Cursor states from data-cursor attributes
  document.addEventListener("mouseover", (e) => {
    const t = e.target.closest("[data-cursor]");
    if (t) {
      label.textContent = t.dataset.cursor;
      cursor.classList.add("big");
    } else if (e.target.closest("a, button")) {
      cursor.classList.remove("big");
      cursor.style.setProperty("--hover", 1);
    }
  });
  document.addEventListener("mouseout", (e) => {
    if (e.target.closest("[data-cursor]")) cursor.classList.remove("big");
  });

  // Magnetic pull
  document.querySelectorAll("[data-magnetic]").forEach((el) => {
    const strength = 18;
    el.addEventListener("mousemove", (e) => {
      const r = el.getBoundingClientRect();
      const relX = (e.clientX - (r.left + r.width / 2)) / (r.width / 2);
      const relY = (e.clientY - (r.top + r.height / 2)) / (r.height / 2);
      el.style.transform = `translate(${relX * strength}px, ${relY * strength * 0.6}px)`;
    });
    el.addEventListener("mouseleave", () => { el.style.transform = ""; });
  });
})();

/* ============================================================
   NAV — hide on scroll down, glass on scroll, burger menu
   ============================================================ */
(() => {
  const nav = document.getElementById("nav");
  const burger = document.getElementById("navBurger");
  const menu = document.getElementById("menu");
  let lastY = window.scrollY;

  // Dialog semantics — set once, the menu is a modal overlay whenever open
  menu.setAttribute("role", "dialog");
  menu.setAttribute("aria-modal", "true");

  window.addEventListener("scroll", () => {
    const y = window.scrollY;
    nav.classList.toggle("scrolled", y > 60);
    if (Math.abs(y - lastY) > 6) {
      nav.classList.toggle("hidden", y > lastY && y > 320 && !menu.classList.contains("open"));
      lastY = y;
    }
  }, { passive: true });

  const setMenu = (open) => {
    menu.classList.toggle("open", open);
    nav.classList.toggle("menu-open", open);
    burger.setAttribute("aria-expanded", String(open));
    burger.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    menu.setAttribute("aria-hidden", String(!open));
    document.body.style.overflow = open ? "hidden" : "";
    if (open) {
      const first = menu.querySelector("a, button");
      if (first) first.focus();
    } else {
      burger.focus();
    }
  };
  burger.addEventListener("click", () => setMenu(!menu.classList.contains("open")));
  menu.querySelectorAll("a").forEach((a) => a.addEventListener("click", () => setMenu(false)));

  // Focus trap + Escape while the menu is open
  menu.addEventListener("keydown", (e) => {
    if (!menu.classList.contains("open")) return;

    if (e.key === "Escape") {
      e.preventDefault();
      setMenu(false);
      return;
    }

    if (e.key !== "Tab") return;
    const focusable = [...menu.querySelectorAll("a, button")].filter((el) => !el.disabled);
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  });
})();

/* ============================================================
   CLOCK — live NZ time in the nav
   ============================================================ */
(() => {
  const el = document.getElementById("navClock");
  if (!el) return;
  const fmt = new Intl.DateTimeFormat("en-NZ", {
    hour: "2-digit", minute: "2-digit", second: "2-digit",
    hour12: false, timeZone: "Pacific/Auckland",
  });
  const tick = () => { el.textContent = `NZ — ${fmt.format(new Date())}`; };
  tick();
  setInterval(tick, 1000);
})();

/* ============================================================
   SCROLL PROGRESS HAIRLINE
   ============================================================ */
(() => {
  const bar = document.getElementById("progressBar");
  const update = () => {
    const max = document.documentElement.scrollHeight - innerHeight;
    bar.style.transform = `scaleX(${max > 0 ? window.scrollY / max : 0})`;
  };
  window.addEventListener("scroll", update, { passive: true });
  update();
})();

/* ============================================================
   REVEALS
   ============================================================ */
(() => {
  const io = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); }
    });
  }, { threshold: 0.18, rootMargin: "0px 0px -6% 0px" });
  document.querySelectorAll("[data-reveal]").forEach((el) => io.observe(el));

  // Contact headline lines
  const contact = document.querySelector(".contact");
  if (!contact) return;
  const cio = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (en.isIntersecting) { contact.classList.add("in"); cio.disconnect(); }
    });
  }, { threshold: 0.3 });
  cio.observe(contact);
})();

/* ============================================================
   POSITION STATEMENT — words light up as you read/scroll
   ============================================================ */
(() => {
  const el = document.querySelector("[data-words]");
  if (!el) return;
  el.innerHTML = el.textContent.trim().split(/\s+/)
    .map((w) => `<span class="pw">${w}</span>`).join(" ");
  const words = [...el.querySelectorAll(".pw")];

  if (prefersReduced) { words.forEach((w) => w.classList.add("lit")); return; }

  const update = () => {
    const r = el.getBoundingClientRect();
    // progress: statement enters at 85% viewport, fully lit by 35%
    const p = clamp((innerHeight * 0.85 - r.top) / (innerHeight * 0.5 + r.height * 0.6), 0, 1);
    const lit = Math.round(p * words.length);
    words.forEach((w, i) => w.classList.toggle("lit", i < lit));
  };
  window.addEventListener("scroll", update, { passive: true });
  update();
})();

/* ============================================================
   INDEX — accordion rows
   ============================================================ */
(() => {
  const rows = [...document.querySelectorAll(".ix-row")];
  if (!rows.length) return;

  const closeAll = () => {
    rows.forEach((r) => {
      r.classList.remove("open");
      r.querySelector(".ix-head").setAttribute("aria-expanded", "false");
    });
  };

  const openRow = (row, { scroll } = {}) => {
    closeAll();
    row.classList.add("open");
    row.querySelector(".ix-head").setAttribute("aria-expanded", "true");
    history.replaceState(null, "", "#" + row.id);
    if (scroll) {
      row.scrollIntoView({ block: "center", behavior: prefersReduced ? "auto" : "smooth" });
    }
  };

  rows.forEach((row) => {
    const head = row.querySelector(".ix-head");
    head.addEventListener("click", () => {
      const isOpen = row.classList.contains("open");
      if (isOpen) {
        closeAll();
        history.replaceState(null, "", "#index");
      } else {
        openRow(row);
      }
    });
  });

  // Deep links — open the matching row on load and on hash changes,
  // without disturbing the plain "#index" nav link.
  const applyHash = () => {
    const id = location.hash.slice(1);
    const row = rows.find((r) => r.id === id);
    if (row) openRow(row, { scroll: true });
  };
  applyHash();
  window.addEventListener("hashchange", applyHash);
})();

/* ============================================================
   LIGHT TABLE — vertical scroll drives horizontal travel
   ============================================================ */
(() => {
  const section = document.querySelector(".lt");
  const track = document.getElementById("ltTrack");
  if (!section || !track) return;
  const mq = window.matchMedia("(max-width: 900px)");
  const sticky = section.querySelector(".lt-sticky");

  // Keyboard focus: bring the focused card on screen. Mouse focus never scrolls.
  track.addEventListener("focusin", (e) => {
    if (restoringFocus || !e.target.matches(":focus-visible")) return;
    const item = e.target.closest(".lt-item");
    if (!item) return;
    // Keep the browser from sliding the clipped stage sideways
    [sticky, section].forEach((el) => { if (el) el.scrollLeft = 0; });
    if (mq.matches || prefersReduced) {
      item.scrollIntoView({ inline: "center", block: "nearest" });
      return;
    }
    // Desktop: the track is driven by page scroll, so invert the travel maths
    // (translate = p * travel; p = -rect.top / (height - innerHeight)).
    const travel = Math.max(0, track.scrollWidth - innerWidth);
    const total = section.offsetHeight - innerHeight;
    const want = clamp(item.offsetLeft + item.offsetWidth / 2 - innerWidth / 2, 0, travel);
    const p = travel ? want / travel : 0;
    const top = section.getBoundingClientRect().top + window.scrollY + p * total;
    window.scrollTo({ top, behavior: "instant" });
    requestAnimationFrame(() => { [sticky, section].forEach((el) => { if (el) el.scrollLeft = 0; }); });
  });

  if (prefersReduced) return;
  let current = 0;

  const loop = () => {
    if (!mq.matches) {
      const rect = section.getBoundingClientRect();
      const total = rect.height - innerHeight;
      const p = clamp(-rect.top / total, 0, 1);
      const travel = Math.max(0, track.scrollWidth - innerWidth);
      current = lerp(current, p * travel, 0.085);
      track.style.transform = `translateX(${-current}px)`;
    }
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
})();

/* ============================================================
   LIGHTBOX
   ============================================================ */
(() => {
  const dialog = document.getElementById("lightbox");
  if (!dialog) return; // only index/archive carry the lightbox — must bail everywhere else or every module below dies
  const img = document.getElementById("lightboxImg");
  const cap = document.getElementById("lightboxCap");
  let opener = null;
  document.querySelectorAll(".lt-item:not(.lt-end):not(.lt-film)").forEach((item) => {
    item.addEventListener("click", (e) => {
      opener = item.querySelector(".ph-open");
      restoringFocus = e.detail > 0; // pointer open: the focus handed back on close must not scroll the page
      const src = item.querySelector("img");
      img.src = src.src;
      img.alt = src.alt;
      cap.textContent = item.querySelector("figcaption")?.textContent || "";
      dialog.showModal();
    });
  });
  document.getElementById("lightboxClose").addEventListener("click", () => dialog.close());
  dialog.addEventListener("click", (e) => { if (e.target === dialog) dialog.close(); });
  dialog.addEventListener("close", () => {
    if (opener) { restoringFocus = true; opener.focus({ preventScroll: true }); restoringFocus = false; }
    opener = null;
  });
})();

/* ============================================================
   COUNTERS
   ============================================================ */
(() => {
  const els = document.querySelectorAll("[data-count-to]");
  // Markup may carry the real figure so it reads right without script;
  // start the count from zero only once we know it will run.
  if (!prefersReduced) els.forEach((el) => { el.textContent = "0"; });
  const io = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (!en.isIntersecting) return;
      io.unobserve(en.target);
      const el = en.target;
      const to = parseInt(el.dataset.countTo, 10);
      if (prefersReduced) { el.textContent = to; return; }
      const start = performance.now();
      const D = 1400;
      const tick = (now) => {
        const p = clamp((now - start) / D, 0, 1);
        el.textContent = Math.round((1 - Math.pow(1 - p, 3)) * to);
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
  }, { threshold: 0.5 });
  els.forEach((el) => io.observe(el));
})();

/* ============================================================
   BOOKING — Google Meet link with graceful email fallback
   ============================================================ */
(() => {
  const btn = document.getElementById("bookBtn");
  const navBtns = document.querySelectorAll(".btn-book");

  if (btn) {
    const mailto = `mailto:${CONFIG.email}?subject=${encodeURIComponent("Intro call — Singh Studio")}&body=${encodeURIComponent(
      "Kia ora Kris,\n\nKeen to book a 20-minute intro call.\n\nWhat we're working on:\n\nA few times that suit (NZT):\n\nNgā mihi,"
    )}`;
    if (CONFIG.bookingUrl) {
      btn.href = CONFIG.bookingUrl;
      btn.target = "_blank";
      btn.rel = "noopener";
    } else {
      btn.href = mailto;
      console.info(
        "%cS·/·S %cAdd your Google Calendar appointment-schedule link in js/main.js → CONFIG.bookingUrl to send bookings straight to Google Meet. Falling back to email for now.",
        "color:#e23b22;font-weight:bold", "color:inherit"
      );
    }
  }
  [document.getElementById("gcBookSent")].forEach((a) => {
    if (!a) return;
    if (CONFIG.bookingUrl) {
      a.href = CONFIG.bookingUrl;
      a.target = "_blank";
      a.rel = "noopener";
    } else {
      a.href = `mailto:${CONFIG.email}?subject=${encodeURIComponent("Intro call — Singh Studio")}`;
    }
  });
  const yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();
})();

/* ============================================================
   ELEVATION PASS
   ============================================================ */

/* Per-letter headline choreography */
(() => {
  if (prefersReduced) return;
  const heads = new Map(); // heading -> line index
  document.querySelectorAll("[data-hero-line], [data-contact-line], [data-letters]").forEach((inner) => {
    const h = inner.closest("h1, h2");
    if (h && !h.hasAttribute("aria-label")) h.setAttribute("aria-label", h.textContent.trim());
    const line = heads.get(h) || 0;
    heads.set(h, line + 1);
    inner.style.setProperty("--line-d", `${line * 0.14}s`);

    let ci = 0;
    const wrap = (content) => {
      const s = document.createElement("span");
      s.className = "ch";
      s.style.setProperty("--ci", ci++);
      if (typeof content === "string") s.textContent = content === " " ? " " : content;
      else s.appendChild(content);
      return s;
    };
    [...inner.childNodes].forEach((node) => {
      if (node.nodeType === 3) {
        const frag = document.createDocumentFragment();
        [...node.textContent].forEach((c) => frag.appendChild(wrap(c)));
        inner.replaceChild(frag, node);
      } else if (node.nodeType === 1) {
        const holder = wrap(node.cloneNode(true));
        inner.replaceChild(holder, node);
      }
    });
    inner.classList.add("letterized", inner.hasAttribute("data-contact-line") ? "lz-contact" : "lz-load");
  });
})();

/* Clip-mask reveals for imagery */
(() => {
  // .case-shot is listed here rather than hardcoding data-mask in its markup:
  // the attribute (and the opacity:0 it brings) must only ever come from the
  // same module that reveals it, so a script failure leaves content visible.
  // Overlapping stacks reveal as one piece: clip-path would cut the shadow
  // off the capture carried in front.
  const els = [...document.querySelectorAll(".lt-item, .ph, .wc-media, .case-shot, .case-screen:not(.hl-stack > .case-screen), .hl-stack, .ho-page, [data-mask]")];
  if (!els.length) return;
  const perParent = new Map();
  els.forEach((el) => {
    el.setAttribute("data-mask", "");
    const n = perParent.get(el.parentElement) || 0;
    el.style.setProperty("--i", n % 6);
    perParent.set(el.parentElement, n + 1);
  });
  const io = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); }
    });
  }, { threshold: 0.1, rootMargin: "0px 0px -4% 0px" });
  els.forEach((el) => io.observe(el));
})();

/* Scroll parallax — measured from untransformed parents */
(() => {
  if (prefersReduced) return;
  const els = [...document.querySelectorAll("[data-plx]")].map((el) => ({
    el, s: parseFloat(el.dataset.plx) || 0.08,
  }));
  if (!els.length) return;
  const mq = window.matchMedia("(max-width: 900px)");
  const loop = () => {
    if (!mq.matches) {
      const mid = innerHeight / 2;
      els.forEach(({ el, s }) => {
        const r = el.parentElement.getBoundingClientRect();
        if (r.bottom < -120 || r.top > innerHeight + 120) return;
        const y = (r.top + r.height / 2 - mid) * -s;
        el.style.transform = `translate3d(0, ${y.toFixed(1)}px, 0)`;
      });
    }
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
})();

/* Rolling button labels */
(() => {
  document.querySelectorAll(".btn").forEach((btn) => {
    [...btn.childNodes].forEach((n) => {
      if (n.nodeType !== 3 || !n.textContent.trim()) return;
      const roll = document.createElement("span");
      roll.className = "roll";
      const a = document.createElement("span");
      a.textContent = n.textContent;
      const b = a.cloneNode(true);
      b.setAttribute("aria-hidden", "true");
      roll.append(a, b);
      btn.replaceChild(roll, n);
    });
  });
})();

/* "/" — the slash starts the conversation */
(() => {
  addEventListener("keydown", (e) => {
    if (e.key !== "/" || e.metaKey || e.ctrlKey || e.altKey) return;
    if (e.target.closest?.("input, textarea, [contenteditable]")) return;
    if (document.querySelector("dialog[open]")) return;
    e.preventDefault();
    const contact = document.getElementById("contact");
    if (contact) contact.scrollIntoView({ behavior: prefersReduced ? "auto" : "smooth" });
    else location.href = "index.html#contact";
  });
})();

/* Voices — focused testimonial slider (scroll-snap + controls).
   The homepage now uses a static grid, so this bails when #voicesTrack is missing. */
(() => {
  const track = document.getElementById("voicesTrack");
  if (!track) return;
  const slides = [...track.querySelectorAll(".voice")];
  const prev = document.getElementById("voicePrev");
  const next = document.getElementById("voiceNext");
  const count = document.getElementById("voiceCount");
  let index = 0;

  const pad = (n) => String(n).padStart(2, "0");
  const update = () => {
    // clientWidth can measure 0 (hidden/backgrounded layout) — guard the division or the counter reads "NaN"
    index = clamp(Math.round(track.scrollLeft / (track.clientWidth || 1)), 0, slides.length - 1);
    count.textContent = `${pad(index + 1)} / ${pad(slides.length)}`;
    prev.disabled = index === 0;
    next.disabled = index === slides.length - 1;
    // leaving a slide pauses its video
    slides.forEach((s, i) => {
      const v = s.querySelector("video");
      if (v && i !== index && !v.paused) v.pause();
    });
  };
  const go = (dir) => {
    track.scrollTo({
      left: (index + dir) * track.clientWidth,
      behavior: prefersReduced ? "auto" : "smooth",
    });
  };
  prev.addEventListener("click", () => go(-1));
  next.addEventListener("click", () => go(1));
  track.addEventListener("scroll", update, { passive: true });
  track.addEventListener("keydown", (e) => {
    if (e.key === "ArrowRight") { e.preventDefault(); go(1); }
    if (e.key === "ArrowLeft") { e.preventDefault(); go(-1); }
  });
  update();

  // video slides: overlay play, native controls once running
  slides.forEach((s) => {
    const v = s.querySelector("video");
    const overlay = s.querySelector(".voice-play");
    if (!v || !overlay) return;
    overlay.addEventListener("click", () => {
      overlay.classList.add("hidden");
      v.controls = true;
      v.play();
    });
    v.addEventListener("ended", () => {
      overlay.classList.remove("hidden");
      v.controls = false;
    });
    v.addEventListener("pause", () => { if (v.ended) return; });
  });
})();

/* Archive film — inline play inside the light-table strip */
(() => {
  const fig = document.querySelector(".lt-film");
  if (!fig) return;
  const v = fig.querySelector("video");
  const overlay = fig.querySelector(".voice-play");
  if (!v || !overlay) return;
  overlay.addEventListener("click", () => {
    overlay.classList.add("hidden");
    v.controls = true;
    v.play();
  });
  v.addEventListener("ended", () => {
    overlay.classList.remove("hidden");
    v.controls = false;
  });
})();

/* Case screens — recorded loops of client sites. The still underneath is
   the content; the video loads as it nears the viewport, plays while a
   third of it is on screen, and pauses when it leaves. Reduced-motion
   visitors get the still and a Play button. A pause from the visitor
   sticks until they press Play again. */
(() => {
  const small = window.matchMedia("(max-width: 800px)");
  const films = [...document.querySelectorAll(".case-screen")].map((fig) => {
    const video = fig.querySelector("video");
    const btn = fig.querySelector(".screen-toggle");
    if (!video || !btn) return null;
    const label = btn.querySelector(".st-label");
    const f = { fig, video, want: !prefersReduced, seen: false, loaded: false };
    const sync = () => {
      const paused = video.paused;
      btn.classList.toggle("is-paused", paused);
      label.textContent = paused ? "Play" : "Pause";
      btn.setAttribute("aria-label", `${paused ? "Play" : "Pause"} the recording`);
    };
    f.load = () => {
      if (f.loaded) return;
      f.loaded = true;
      video.src = small.matches && video.dataset.srcSm ? video.dataset.srcSm : video.dataset.src;
    };
    f.play = () => {
      f.load();
      const p = video.play();
      if (p) p.catch(sync); // autoplay refused (e.g. low-power mode): leave the Play button showing
    };
    video.addEventListener("playing", () => { fig.classList.add("is-live"); sync(); });
    video.addEventListener("pause", sync);
    btn.addEventListener("click", () => {
      f.want = video.paused;
      if (f.want) f.play(); else video.pause();
    });
    btn.hidden = false;
    sync();
    return f;
  }).filter(Boolean);
  if (!films.length) return;

  const find = (el) => films.find((f) => f.fig === el);
  const near = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      const f = find(en.target);
      if (en.isIntersecting && f.want) f.load();
    });
  }, { rootMargin: "600px 0px" });
  const onScreen = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      const f = find(en.target);
      f.seen = en.isIntersecting;
      if (f.seen && f.want && !document.hidden) f.play();
      else if (!f.seen && !f.video.paused) f.video.pause();
    });
  }, { threshold: 0.35 });
  films.forEach((f) => { near.observe(f.fig); onScreen.observe(f.fig); });
  document.addEventListener("visibilitychange", () => {
    films.forEach((f) => {
      if (document.hidden) f.video.pause();
      else if (f.seen && f.want) f.play();
    });
  });
})();

/* Post niceties — heading anchors + copy-link share */
(() => {
  const prose = document.querySelector(".prose");
  if (!prose) return;
  prose.querySelectorAll("h2").forEach((h) => {
    const id = h.textContent.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
    h.id = id;
    const a = document.createElement("a");
    a.className = "h-anchor";
    a.href = `#${id}`;
    a.textContent = "#";
    a.setAttribute("aria-label", "Link to this section");
    h.appendChild(a);
  });
  const copy = document.getElementById("copyLink");
  if (copy) copy.setAttribute("aria-live", "polite");
  if (copy) copy.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(location.href.split("#")[0]);
      copy.textContent = "Copied ✓";
      setTimeout(() => { copy.textContent = "Copy link"; }, 2000);
    } catch { /* clipboard unavailable — leave the button be */ }
  });
})();

/* Theme — time-aware boot happens inline in <head>; this is the manual dial */
(() => {
  const html = document.documentElement;
  if (!html.dataset.theme) html.dataset.theme = "dark";
  const right = document.querySelector(".nav-right");
  if (!right) return;
  const btn = document.createElement("button");
  btn.className = "theme-toggle";
  btn.type = "button";
  btn.innerHTML = '<span class="tt-dot" aria-hidden="true"></span>';
  const meta = document.querySelector('meta[name="theme-color"]');
  const label = () => {
    const next = html.dataset.theme === "dark" ? "light" : "dark";
    btn.setAttribute("aria-label", `Switch to ${next} mode`);
    btn.title = `Switch to ${next} mode`;
    if (meta) meta.content = html.dataset.theme === "dark" ? "#0c0b09" : "#efeae1";
  };
  label();
  btn.addEventListener("click", () => {
    html.dataset.theme = html.dataset.theme === "dark" ? "light" : "dark";
    try { localStorage.setItem("ss-theme", html.dataset.theme); } catch { /* private mode */ }
    label();
  });
  right.insertBefore(btn, right.firstElementChild);
})();

/* Back to top — earns its place after a viewport of travel */
(() => {
  const btn = document.createElement("button");
  btn.className = "to-top-btn";
  btn.type = "button";
  btn.setAttribute("aria-label", "Back to top");
  btn.textContent = "↑";
  document.body.appendChild(btn);
  const onScroll = () => btn.classList.toggle("on", scrollY > innerHeight * 1.2);
  addEventListener("scroll", onScroll, { passive: true });
  onScroll();
  btn.addEventListener("click", () => window.scrollTo({ top: 0, behavior: prefersReduced ? "auto" : "smooth" }));
})();

/* Thoughts landing — topic filter */
(() => {
  const chips = [...document.querySelectorAll(".topic-chip")];
  if (!chips.length) return;
  const rows = [...document.querySelectorAll(".post-list [data-topic]")];
  chips.forEach((chip) => chip.addEventListener("click", (e) => {
    e.preventDefault();
    chips.forEach((c) => {
      c.classList.toggle("active", c === chip);
      if (c === chip) c.setAttribute("aria-current", "true");
      else c.removeAttribute("aria-current");
    });
    const t = chip.dataset.topic;
    rows.forEach((r) => { r.style.display = t === "all" || r.dataset.topic === t ? "" : "none"; });
  }));
})();

/* Nav — mark the current page */
(() => {
  const here = location.pathname.split("/").pop() || "index.html";
  const onServices = /\/services(\/|$)/.test(location.pathname);
  document.querySelectorAll(".nav-links a").forEach((a) => {
    if (onServices) {
      if (/\/services\/?$/.test(a.pathname)) { a.classList.add("current"); a.setAttribute("aria-current", "page"); }
      return;
    }
    const target = a.getAttribute("href").split("#")[0];
    const isThoughts = target === "thoughts.html" && here.startsWith("thought");
    if ((target && target === here) || isThoughts) {
      a.classList.add("current");
      a.setAttribute("aria-current", "page");
    }
  });
})();

/* ============================================================
   ENQUIRY SENDER — the one send path for every enquiry form (the home
   sentence and the Services configurator). Web3Forms email plus the Studio
   Hub post with Turnstile; the first one to succeed wins.
   ============================================================ */
const makeEnquirySender = (form) => {
  // Studio Hub post. Turnstile loads on the first touch of the form, never on page load.
  const hubOn = !!(CONFIG.hubEnquiryUrl && CONFIG.turnstileSiteKey);
  const newId = () => (crypto.randomUUID ? crypto.randomUUID()
    : [...crypto.getRandomValues(new Uint8Array(16))].map((x) => x.toString(16).padStart(2, "0")).join(""));
  let submissionId = newId();
  let tsToken = "", tsWidget = null, tsStarted = false;
  const tsWaiters = [];
  const tsBox = document.createElement("div");
  tsBox.className = "se-ts";
  tsBox.style.lineHeight = "0";
  const tsShow = (on) => { tsBox.style.lineHeight = on ? "" : "0"; tsBox.style.marginTop = on ? "1.4rem" : ""; };
  if (hubOn) form.querySelector(".se-actions").before(tsBox);
  const loadTurnstile = () => {
    if (!hubOn || tsStarted) return;
    tsStarted = true;
    window.ssTurnstileReady = () => {
      tsWidget = window.turnstile.render(tsBox, {
        sitekey: CONFIG.turnstileSiteKey, action: "enquiry", appearance: "interaction-only",
        theme: document.documentElement.dataset.theme === "dark" ? "dark" : "light",
        "response-field": false, "refresh-expired": "auto",
        callback: (t) => { tsToken = t; tsWaiters.splice(0).forEach((w) => w(t)); },
        "expired-callback": () => { tsToken = ""; },
        "error-callback": () => { tsToken = ""; },
        "before-interactive-callback": () => tsShow(true),
        "after-interactive-callback": () => tsShow(false),
      });
    };
    const s = document.createElement("script");
    s.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit&onload=ssTurnstileReady";
    s.async = true;
    document.head.appendChild(s);
  };
  form.addEventListener("focusin", loadTurnstile);
  form.addEventListener("pointerdown", loadTurnstile);
  const tokenWithin = (ms) => tsToken ? Promise.resolve(tsToken) : new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error("no token")), ms);
    tsWaiters.push((v) => { clearTimeout(t); resolve(v); });
  });
  const sendToHub = async (payload) => {
    loadTurnstile();
    const token = await tokenWithin(8000);
    tsToken = "";
    const ac = new AbortController();
    const timer = setTimeout(() => ac.abort(), 10000);
    try {
      const res = await fetch(CONFIG.hubEnquiryUrl, {
        method: "POST", headers: { "Content-Type": "application/json" }, credentials: "omit", signal: ac.signal,
        body: JSON.stringify({ ...payload, turnstileToken: token }),
      });
      if (!res.ok) throw new Error(String(res.status));
      return true;
    } finally {
      clearTimeout(timer);
      try { if (tsWidget !== null) window.turnstile.reset(tsWidget); } catch { /* widget gone */ }
    }
  };
  // Resolves on the first success; rejects only when every post failed.
  const firstSuccess = (list) => new Promise((resolve, reject) => {
    let left = list.length;
    list.forEach((p) => p.then(resolve, () => { if (--left === 0) reject(new Error("not sent")); }));
  });

  // Honeypot ticked, or a send already in flight: do nothing
  const blocked = (btn) => btn.getAttribute("aria-disabled") === "true" || !!(form.botcheck && form.botcheck.checked);

  // fields: name, email, need, timing, message, about. formData() builds the Web3Forms body.
  // onSent(restore) and onFailed() draw the form's own states; restore() puts the button back.
  const send = async ({ btn, err, subject, mailBody, fields, formData, onSent, onFailed }) => {
    if (!CONFIG.web3formsKey) {
      location.href = "mailto:" + CONFIG.email + "?subject=" + encodeURIComponent(subject) + "&body=" + encodeURIComponent(mailBody);
      return;
    }
    btn.setAttribute("aria-disabled", "true");
    const prev = btn.innerHTML;
    btn.innerHTML = "Sending…";
    const restore = () => { btn.removeAttribute("aria-disabled"); btn.innerHTML = prev; };
    const payload = { ...fields, submissionId, botcheck: false };
    const viaEmail = fetch("https://api.web3forms.com/submit", { method: "POST", body: formData() })
      .then((res) => { if (!res.ok) throw new Error(String(res.status)); return res.json(); })
      .then((data) => { if (!data || data.success === false) throw new Error("rejected"); return true; });
    const viaHub = hubOn ? sendToHub(payload) : Promise.reject(new Error("hub off"));
    try {
      await firstSuccess([viaEmail, viaHub]);
      submissionId = newId();
      track("enquiry_submit", { label: fields.need + (fields.about ? " / " + fields.about : "") });
      onSent(restore);
    } catch {
      err.textContent = "That didn’t send. Try again, or write to kris@singhstudio.co.nz.";
      err.hidden = false;
      restore();
      if (onFailed) onFailed();
    }
  };

  return { blocked, send };
};

/* ============================================================
   SENTENCE ENQUIRY — one sentence the visitor completes. Posts through
   Web3Forms once CONFIG.web3formsKey is set; until then, submitting
   composes a structured email instead. Blanks size to their content;
   context from templates and cases arrives via the ?about= parameter.
   ============================================================ */
(() => {
  const gc = document.getElementById("gc");
  const form = document.getElementById("enquiryForm");
  if (!gc || !form) return;
  const sent = document.getElementById("enquirySent");
  const sentHead = document.getElementById("enquirySentHead");
  const btn = form.querySelector('button[type="submit"]');
  const err = document.getElementById("enquiryStatus");
  const keyField = form.querySelector('input[name="access_key"]');
  if (CONFIG.web3formsKey && keyField) keyField.value = CONFIG.web3formsKey;

  const f = {
    name: form.elements.name, need: form.elements.need,
    timing: form.elements.timing, email: form.elements.email,
  };
  const label = { name: "your name", need: "what you need", timing: "when you’d like to start", email: "your email" };
  const emailOk = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

  // Blanks size to their content: a hidden mirror span measures the text
  const mirror = document.createElement("span");
  mirror.className = "se-mirror";
  mirror.setAttribute("aria-hidden", "true");
  document.body.appendChild(mirror);
  const blanks = [...form.querySelectorAll(".se-blank")];
  const fit = (el) => {
    const cs = getComputedStyle(el);
    const sel = el.tagName === "SELECT";
    mirror.style.font = cs.font;
    mirror.style.letterSpacing = cs.letterSpacing;
    mirror.textContent = sel ? el.options[el.selectedIndex].text : (el.value || el.placeholder);
    let w = mirror.getBoundingClientRect().width;
    // While typing, keep at least the placeholder's width so the sentence
    // doesn't jump on the first keystroke; it hugs the value again on blur
    if (!sel && el.value && document.activeElement === el) {
      mirror.textContent = el.placeholder;
      w = Math.max(w, mirror.getBoundingClientRect().width);
    }
    const pad = parseFloat(cs.paddingLeft) + parseFloat(cs.paddingRight);
    el.style.width = Math.ceil(w + pad + (sel ? 0 : 1)) + "px";
  };
  const fitAll = () => blanks.forEach(fit);
  // A blank that shrinks on blur can pull the Send button out from under a
  // press that's still in progress, so the click is lost (seen in Safari).
  // While a pointer is down, hold the re-fit until just after the click lands.
  let pressing = false;
  const pendingFit = new Set();
  document.addEventListener("pointerdown", () => { pressing = true; }, true);
  const release = () => {
    pressing = false;
    if (!pendingFit.size) return;
    setTimeout(() => { pendingFit.forEach(fit); pendingFit.clear(); }, 0);
  };
  document.addEventListener("pointerup", release, true);
  document.addEventListener("pointercancel", release, true);
  blanks.forEach((el) => {
    el.addEventListener("input", () => fit(el));
    el.addEventListener("change", () => fit(el));
    el.addEventListener("blur", () => { if (pressing) pendingFit.add(el); else fit(el); });
  });
  window.addEventListener("resize", fitAll);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(fitAll);

  // Context from ?about= — a template or case name travels with the enquiry
  let about = "";
  try {
    const raw = new URLSearchParams(location.search).get("about") || "";
    about = raw.replace(/[^\w\s&-]/g, "").trim().slice(0, 60);
  } catch { /* no URL API, no context */ }
  const ctx = document.getElementById("gcCtx");
  const ctxText = document.getElementById("gcCtxText");
  const applyAbout = () => { if (about && /template/i.test(about)) f.need.value = "a template build"; };
  if (about) {
    if (ctxText) ctxText.textContent = "Re: " + about;
    if (ctx) ctx.hidden = false;
    applyAbout();
  }
  // No ?about=: fall back to the landing page and referrer (not shown on the page)
  if (!about) {
    try {
      const landing = sessionStorage.getItem("ss_landing");
      if (landing) {
        const path = landing === "/" ? "home" : landing.replace(/\.html$/, "").replace(/\//g, " ").trim() || "home";
        const ref = (sessionStorage.getItem("ss_ref") || "").replace(/^www\./, "");
        about = ("landed on " + path + (ref ? " via " + ref : "")).replace(/[^\w\s.&-]/g, "").trim().slice(0, 60);
      }
    } catch { /* storage unavailable */ }
  }
  fitAll();

  // Send button counts the gaps left; the arrow appears only when all are filled
  const keys = ["name", "need", "timing", "email"];
  const cursor = document.getElementById("seCursor");
  let cursorGone = false;
  const dropCursor = () => { cursorGone = true; if (cursor) { cursor.classList.remove("on"); cursor.remove(); } };
  const updateCount = () => {
    const left = keys.filter((k) => f[k].value.trim() === "").length;
    // looked up each time: the button's markup is replaced while sending
    // Only write when the words change: Safari fires "change" on blur, mid-press
    // on Send, and replacing the label's text then swallows the click
    const label = document.getElementById("seSendLabel");
    const text = left === 0 ? "Send it " : left + (left === 1 ? " gap" : " gaps") + " to go";
    if (label.textContent !== text) label.textContent = text;
    const arrow = btn.querySelector(".btn-arrow");
    if (left === 0 && !arrow) {
      const a = document.createElement("span");
      a.className = "btn-arrow"; a.textContent = "→";
      btn.appendChild(a);
    } else if (left > 0 && arrow) arrow.remove();
    if (left < 4) dropCursor();
  };
  // Blinking cursor invites the first word; it starts once the form is in view
  // and goes for good as soon as any gap is touched
  if (cursor && "IntersectionObserver" in window) {
    const io = new IntersectionObserver((es) => {
      if (!es.some((x) => x.isIntersecting)) return;
      if (!cursorGone && !document.activeElement.closest(".se-form")) cursor.classList.add("on");
      io.disconnect();
    }, { threshold: 0.5 });
    io.observe(form);
  }
  form.addEventListener("focusin", dropCursor);
  Object.values(f).forEach((el) => {
    el.addEventListener("input", updateCount);
    el.addEventListener("change", updateCount);
  });
  updateCount();

  // Optional note stays tucked away until asked for
  const more = document.getElementById("seMore");
  const addNote = document.getElementById("seAddNote");
  addNote.addEventListener("click", () => {
    more.hidden = false;
    addNote.setAttribute("aria-expanded", "true");
    addNote.hidden = true;
    more.querySelector("textarea").focus();
  });

  const clearInvalid = (el) => {
    el.removeAttribute("aria-invalid");
    if (!form.querySelector('[aria-invalid="true"]')) err.hidden = true;
  };
  Object.values(f).forEach((el) => {
    el.addEventListener("input", () => clearInvalid(el));
    el.addEventListener("change", () => clearInvalid(el));
  });

  const sender = makeEnquirySender(form);

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (sender.blocked(btn)) return; // already sending, or the honeypot is ticked

    const bad = [];
    for (const k of ["name", "need", "timing", "email"]) {
      const v = f[k].value.trim();
      const ok = k === "email" ? emailOk(v) : v !== "";
      if (ok) f[k].removeAttribute("aria-invalid");
      else { f[k].setAttribute("aria-invalid", "true"); bad.push(k); }
    }
    if (bad.length) {
      const names = bad.map((k) => label[k]);
      const list = names.length > 1 ? names.slice(0, -1).join(", ") + " and " + names.slice(-1) : names[0];
      err.textContent = "Add " + list + " so I can reply.";
      err.hidden = false;
      f[bad[0]].focus();
      return;
    }
    err.hidden = true;

    const name = f.name.value.trim();
    const email = f.email.value.trim();
    const need = f.need.value;
    const timing = f.timing.value;
    const text = form.elements.message.value.trim();
    const subject = "Enquiry from " + name + ": " + need + (about ? " (" + about + ")" : "");
    form.elements.subject.value = subject;
    if (about && !form.elements.context) {
      const c = document.createElement("input");
      c.type = "hidden"; c.name = "context"; c.value = about;
      form.appendChild(c);
    }

    const mailBody = (text ? text + "\n\n" : "") +
      "Need: " + need + "\nTiming: " + timing +
      "\n\n— " + name + "\n" + email;
    sender.send({
      btn, err, subject, mailBody,
      fields: { name, email, need, timing, message: text, about },
      formData: () => new FormData(form),
      onSent: (restore) => {
        form.reset();
        applyAbout();
        fitAll();
        restore();
        updateCount();
        more.hidden = true; addNote.hidden = false; addNote.setAttribute("aria-expanded", "false");
        form.hidden = true;
        sent.hidden = false;
        sentHead.focus();
      },
      onFailed: () => updateCount(),
    });
  });
})();

/* ============================================================
   SERVICES CONFIGURATOR — /services/. The visitor builds an enquiry from
   choices; the summary is a sentence plus a price breakdown, and it sends
   through the same sender as the home sentence. Runs only on that page.
   ============================================================ */
(function () {
  "use strict";
  var root = document.getElementById("svConfig");
  var form = document.getElementById("enquiryForm");
  if (!root || !form) return;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var reduce = prefersReduced;

  var sent = $("#enquirySent"), sentHead = $("#enquirySentHead"), sumBody = $("#sumBody");
  var btn = $("#seSend"), err = $("#enquiryStatus"), summaryEl = $("#summary");
  var keyField = form.querySelector('input[name="access_key"]');
  if (CONFIG.web3formsKey && keyField) keyField.value = CONFIG.web3formsKey;
  var sender = makeEnquirySender(form);
  var f = { name: $("#seName"), email: $("#seEmail") };
  var talk = $("#talkRush");
  var steps = { 1: $("#step1"), 2: $("#step2"), 3: $("#step3"), 4: $("#step4"), 5: $("#step5"), 6: $("#step6"), 7: $("#step7") };
  var done = false;

  var TIERS = {
    template: { name: "Template", price: 3500, std: "About 2 to 3 weeks", rush: "About 1 to 2 weeks" },
    designed: { name: "Designed", price: 7500, std: "About 5 to 7 weeks", rush: "About 3 to 4 weeks" },
    bespoke: { name: "Bespoke", price: 15000, from: true, std: "About 8 to 14 weeks" }
  };
  var CARES = {
    care: { name: "Care", month: 150 },
    plus: { name: "Care Plus", month: 450 },
    partner: { name: "Partner", month: 1500 },
    none: { name: "No care" }
  };
  var SITE_WORDS = {
    template: "a Template site", designed: "a Designed site", bespoke: "a Bespoke site",
    refresh: "a refresh of our current site",
    fix: "a website fix", words: "help with words, film or audio", unsure: "help working out what I need"
  };
  var EXTRAS = {
    words: { name: "Words and strategy", short: "words", phrase: "words and strategy", code: "w" },
    film: { name: "Film and photography", short: "film", phrase: "film and photography", code: "f" },
    audio: { name: "Audio", short: "audio", phrase: "audio", code: "a" }
  };
  var EXTRA_KEYS = ["words", "film", "audio"];
  var FIX_TEXT = "A website fix is NZ$750. I spend a week on the site you already have and sort out what’s hurting it most: speed, search, broken pieces and the words on the home page. If you go on to a new site within three months, the NZ$750 comes off its price.";
  var EXTRA_PRICE = "From NZ$950 a day";
  /* items like "film and photography" already hold an "and", so the last join gets a comma to keep the list readable */
  var natList = function (a) { if (a.length < 2) return a.join(""); var sep = a.some(function (x) { return / and /.test(x); }) ? ", and " : " and "; return a.slice(0, -1).join(", ") + sep + a[a.length - 1]; };
  var PLATFORM_WORDS = { squarespace: "on Squarespace", current: "on the platform we already use", choose: "on whichever platform suits" };
  /* short labels for the enquiry's "need" line */
  var SITE_SHORT = {
    template: "Template site", designed: "Designed site", bespoke: "Bespoke site", refresh: "Refresh",
    fix: "Website fix", words: "Words, film or audio", unsure: "Not sure yet"
  };
  var PLATFORM_SHORT = { squarespace: "Squarespace", current: "Current platform", choose: "Platform to choose" };
  var SQ_LINE = "Plus your Squarespace plan, paid to them, about NZ$228 a year.";
  var money = function (n) { return "NZ$" + n.toLocaleString("en-NZ"); };
  var emailOk = function (v) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v); };
  var val = function (n) { var c = form.querySelector('input[name="' + n + '"]:checked'); return c ? c.value : ""; };
  var setText = function (el, t) { if (el.textContent !== t) el.textContent = t; };

  function state() {
    var site = val("site"), tier = TIERS[site] || null;
    var hasPlat = site === "designed" || site === "bespoke";
    var careOn0 = !!tier || site === "refresh";
    var picked = EXTRA_KEYS.filter(function (k) { var c = form.querySelector('input[name="extra"][value="' + k + '"]'); return c && c.checked; });
    return {
      extras: careOn0 ? picked : [],
      site: site, tier: tier,
      rushable: site === "template" || site === "designed",
      hasPlat: hasPlat,
      careOn: !!tier || site === "refresh",
      platform: hasPlat ? val("platform") : "",
      pace: val("pace"), care: val("care"), timing: val("timing"),
      name: f.name.value.trim(), email: f.email.value.trim(), talk: talk.checked
    };
  }
  /* Template is always Squarespace; Designed and Bespoke only when chosen */
  function sqPath(s) { return s.site === "template" || (s.hasPlat && s.platform === "squarespace"); }

  /* blanks size to their content (mirror span), as on the home page */
  var mirror = document.createElement("span");
  mirror.className = "se-mirror"; mirror.setAttribute("aria-hidden", "true");
  document.body.appendChild(mirror);
  var blanks = $$(".se-blank", form);
  function fit(el) {
    var cs = getComputedStyle(el);
    if (el.offsetParent === null) return;
    mirror.style.font = cs.font; mirror.style.letterSpacing = cs.letterSpacing;
    mirror.textContent = el.value || el.placeholder;
    var w = mirror.getBoundingClientRect().width;
    if (el.value && document.activeElement === el) {
      mirror.textContent = el.placeholder;
      w = Math.max(w, mirror.getBoundingClientRect().width);
    }
    var pad = parseFloat(cs.paddingLeft) + parseFloat(cs.paddingRight);
    el.style.width = Math.ceil(w + pad + 1) + "px";
  }
  var pressing = false, pendingFit = [];
  /* while a pointer is down, hold any re-fit until just after the click lands */
  function fitSoon(el) { if (pressing) { if (pendingFit.indexOf(el) < 0) pendingFit.push(el); } else fit(el); }
  function fitAll() { blanks.forEach(fitSoon); }
  document.addEventListener("pointerdown", function () { pressing = true; }, true);
  function release() {
    pressing = false;
    if (!pendingFit.length) return;
    setTimeout(function () { pendingFit.forEach(fit); pendingFit = []; }, 0);
  }
  document.addEventListener("pointerup", release, true);
  document.addEventListener("pointercancel", release, true);
  blanks.forEach(function (el) {
    el.addEventListener("input", function () { fitSoon(el); });
    el.addEventListener("change", function () { fitSoon(el); });
    el.addEventListener("blur", function () { fitSoon(el); });
  });
  window.addEventListener("resize", fitAll);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(fitAll);

  /* blinking cursor invites the first word, until anything is filled */
  var cursor = $("#seCursor"), cursorGone = false;
  function dropCursor() { cursorGone = true; if (cursor) { cursor.classList.remove("on"); cursor.remove(); cursor = null; } }
  if (cursor && "IntersectionObserver" in window) {
    var cio = new IntersectionObserver(function (es) {
      if (!es.some(function (x) { return x.isIntersecting; })) return;
      if (!cursorGone && cursor && !document.activeElement.closest(".se-form")) cursor.classList.add("on");
      cio.disconnect();
    }, { threshold: 0.5 });
    cio.observe(summaryEl);
  }
  form.addEventListener("focusin", dropCursor);

  /* keyboard or pointer: focus only follows a keyboard user */
  var lastKb = false;
  document.addEventListener("keydown", function (e) { if (!e.metaKey && !e.ctrlKey) lastKb = true; }, true);
  document.addEventListener("pointerdown", function () { lastKb = false; }, true);

  /* which gaps are left */
  function gaps(s) {
    var g = [];
    if (!s.name) g.push("name");
    if (!s.site) g.push("site");
    if (s.hasPlat && !s.platform) g.push("platform");
    if (s.rushable && !s.pace) g.push("pace");
    if (s.careOn && !s.care) g.push("care");
    if (s.site !== "unsure" && !s.timing) g.push("timing");
    if (!s.email) g.push("email");
    return g;
  }
  /* send button counts the gaps left; write the label only when its text changes (Safari) */
  function updateCount(s) {
    var left = gaps(s).length;
    var label = $("#seSendLabel");
    var text = left === 0 ? "Send it " : left + (left === 1 ? " gap" : " gaps") + " to go";
    if (label.textContent !== text) label.textContent = text;
    var arrow = btn.querySelector(".btn-arrow");
    if (left === 0 && !arrow) {
      var a = document.createElement("span");
      a.className = "btn-arrow"; a.textContent = "→";
      btn.appendChild(a);
    } else if (left > 0 && arrow) arrow.remove();
  }

  /* the sentence: each phrase fills in, or shows as a gap you can click */
  var slots = { site: $("#slSite"), plat: $("#slPlat"), pace: $("#slPace"), care: $("#slCare"), extra: $("#slExtra"), time: $("#slTime") };
  function setSlot(el, spec) {
    var sig = spec ? [spec.prefix, spec.text, spec.filled ? 1 : 0, spec.step].join("|") : "";
    if (el._sig === sig) return;
    el._sig = sig;
    el.textContent = "";
    if (!spec) return;
    if (spec.prefix) el.appendChild(document.createTextNode(spec.prefix));
    if (spec.filled) {
      var s = document.createElement("span");
      s.className = "fill pop"; s.textContent = spec.text;
      el.appendChild(s);
    } else {
      var b = document.createElement("button");
      b.type = "button"; b.className = "gap"; b.setAttribute("data-step", spec.step);
      b.textContent = "[" + spec.text + "]";
      b.setAttribute("aria-label", "Go to step " + spec.step + ": " + spec.text);
      el.appendChild(b);
    }
  }
  function slotSpecs(s) {
    var sp = {};
    sp.site = s.site
      ? { prefix: "", text: SITE_WORDS[s.site], filled: true, step: 1 }
      : { prefix: "", text: "a site", filled: false, step: 1 };
    sp.plat = null;
    if (s.hasPlat) {
      sp.plat = s.platform
        ? { prefix: ", ", text: PLATFORM_WORDS[s.platform], filled: true, step: 2 }
        : { prefix: ", ", text: "platform", filled: false, step: 2 };
    }
    sp.pace = null;
    if (s.rushable) {
      sp.pace = s.pace
        ? { prefix: ", ", text: s.pace === "rush" ? "as a rush build" : "at a standard pace", filled: true, step: 3 }
        : { prefix: ", ", text: "pace", filled: false, step: 3 };
    } else if (s.site === "bespoke" && s.talk) {
      sp.pace = { prefix: ", ", text: "possibly as a rush build", filled: true, step: 3 };
    }
    sp.care = null;
    if (s.careOn) {
      var none = s.site === "refresh" ? "with no care plan" : "with no care after the first three months";
      sp.care = s.care
        ? { prefix: ", ", text: s.care === "none" ? none : "with " + CARES[s.care].name + " after launch", filled: true, step: 4 }
        : { prefix: ", ", text: "care after launch", filled: false, step: 4 };
    }
    sp.extra = null;
    if (s.extras.length) sp.extra = { prefix: ", ", text: "plus " + natList(s.extras.map(function (k) { return EXTRAS[k].phrase; })) + " for launch", filled: true, step: 5 };
    sp.time = null;
    if (s.site) {
      if (s.timing) sp.time = { prefix: ", and I’d like to start ", text: s.timing, filled: true, step: 6 };
      else if (s.site !== "unsure") sp.time = { prefix: ", and I’d like to start ", text: "when", filled: false, step: 6 };
    }
    return sp;
  }
  function paintSentence(s) {
    var sp = slotSpecs(s);
    setSlot(slots.site, sp.site);
    setSlot(slots.plat, sp.plat);
    setSlot(slots.pace, sp.pace);
    setSlot(slots.care, sp.care);
    setSlot(slots.extra, sp.extra);
    setSlot(slots.time, sp.time);
  }

  /* price breakdown */
  function quote(s) {
    var rows = [];
    if (!s.site) return { rows: rows, total: { text: "Choose a site to see what it costs." } };
    if (s.site === "fix") return { rows: rows, total: { text: "NZ$750, taken off a new site within three months" } };
    if (s.site === "words") return { rows: rows, total: { text: "From NZ$950 a day, quoted per project" } };
    if (s.site === "unsure") return { rows: rows, total: { text: "We’ll work it out together on a call" } };
    var careRow = (s.care && CARES[s.care].month)
      ? [CARES[s.care].name + (s.site === "refresh" ? ", monthly" : ", from month four"), money(CARES[s.care].month) + " a month"] : null;
    var extraRows = s.extras.map(function (k) { return [EXTRAS[k].name, EXTRA_PRICE]; });
    if (s.site === "refresh") {
      if (careRow) rows.push(careRow);
      extraRows.forEach(function (r) { rows.push(r); });
      return { rows: rows, total: { text: "Refresh, from NZ$2,500, on the platform you already use" } };
    }
    var t = s.tier, rushOn = s.rushable && s.pace === "rush";
    var otherPlat = s.hasPlat && s.platform && s.platform !== "squarespace";
    if (s.site === "bespoke") {
      rows.push(["Bespoke site", "From " + money(t.price)]);
      if (otherPlat) rows.push(["Other platforms", "Price confirmed on a call"]);
      if (s.talk) rows.push(["Rush", "Quoted on request"]);
      if (careRow) rows.push(careRow);
      extraRows.forEach(function (r) { rows.push(r); });
      return { rows: rows, total: { text: "From NZ$15,000, most land between NZ$15,000 and NZ$30,000" } };
    }
    rows.push([t.name + " site", money(t.price)]);
    if (otherPlat) rows.push(["Other platforms", "Price confirmed on a call"]);
    var add = Math.round(t.price * 0.3);
    if (rushOn) rows.push(["Rush", "+" + money(add)]);
    if (careRow) rows.push(careRow);
    extraRows.forEach(function (r) { rows.push(r); });
    return { rows: rows, total: { label: "Total to build", amount: money(t.price + (rushOn ? add : 0)) } };
  }
  var pbList = $("#pbList"), pbTotal = $("#pbTotal");
  function paintQuote(s) {
    var q = quote(s);
    var rsig = q.rows.map(function (r) { return r.join("|"); }).join("~");
    if (pbList._sig !== rsig) {
      pbList._sig = rsig; pbList.textContent = "";
      q.rows.forEach(function (r) {
        var li = document.createElement("li");
        var a = document.createElement("span"), b = document.createElement("span");
        a.textContent = r[0]; b.textContent = r[1];
        li.appendChild(a); li.appendChild(b); pbList.appendChild(li);
      });
    }
    var tsig = q.total.text || (q.total.label + "|" + q.total.amount);
    if (pbTotal._sig !== tsig) {
      pbTotal._sig = tsig; pbTotal.textContent = "";
      if (q.total.text) {
        var p = document.createElement("span"); p.className = "pb-text"; p.textContent = q.total.text; pbTotal.appendChild(p);
      } else {
        var l = document.createElement("span"); l.className = "pb-tl"; l.textContent = q.total.label;
        var a2 = document.createElement("span"); a2.className = "pb-ta"; a2.textContent = q.total.amount;
        pbTotal.appendChild(l); pbTotal.appendChild(a2);
      }
    }
    return q;
  }

  /* restorable choices: a short ?q= code, choices only, never a name, email or note */
  var Q_SITES = ["template", "designed", "bespoke", "refresh", "fix", "words", "unsure"];
  var Q_PLAT = { squarespace: "sq", current: "cur", choose: "any" };
  var Q_PACE = { standard: "std", rush: "rush" };
  var Q_CARE = { care: "care", plus: "careplus", partner: "partner", none: "nocare" };
  var Q_TIME = ["asap", "soon", "later"];
  var inv = function (o) { var r = {}; Object.keys(o).forEach(function (k) { r[o[k]] = k; }); return r; };
  function qCode(s) {
    if (!s.site) return "";
    var t = [s.site];
    if (s.hasPlat && s.platform) t.push(Q_PLAT[s.platform]);
    if (s.rushable && s.pace) t.push(Q_PACE[s.pace]);
    else if (s.site === "bespoke" && s.talk) t.push("talk");
    if (s.careOn && s.care) t.push(Q_CARE[s.care]);
    if (s.extras.length) t.push("x-" + s.extras.map(function (k) { return EXTRAS[k].code; }).join(""));
    if (s.timing) {
      var ti = $$('input[name="timing"]', form).map(function (i) { return i.value; }).indexOf(s.timing);
      if (ti >= 0) t.push(Q_TIME[ti]);
    }
    return t.join(".");
  }
  function applyQ() {
    var raw = "";
    try { raw = new URLSearchParams(location.search).get("q") || ""; } catch (e) { return; }
    if (!raw || raw.length > 60 || !/^[a-z]+(\.[a-z]+(-[a-z]+)?)*$/.test(raw)) return;
    var t = raw.split("."), site = t.shift();
    if (Q_SITES.indexOf(site) < 0) return;
    var hasPlat = site === "designed" || site === "bespoke";
    var rushable = site === "template" || site === "designed";
    var careOn = rushable || site === "bespoke" || site === "refresh";
    var P = inv(Q_PLAT), A = inv(Q_PACE), C = inv(Q_CARE);
    var got = {};
    for (var n = 0; n < t.length; n++) {
      var k = t[n], cat = null, v = null;
      if (P[k]) { cat = "platform"; v = P[k]; }
      else if (A[k]) { cat = "pace"; v = A[k]; }
      else if (C[k]) { cat = "care"; v = C[k]; }
      else if (Q_TIME.indexOf(k) >= 0) { cat = "timing"; v = k; }
      else if (k === "talk") { cat = "talk"; v = true; }
      else if (/^x-[wfa]+$/.test(k)) {
        var xl = k.slice(2).split("");
        if (xl.some(function (c, i) { return xl.indexOf(c) !== i; })) return;
        cat = "extras"; v = EXTRA_KEYS.filter(function (e) { return xl.indexOf(EXTRAS[e].code) >= 0; });
      }
      if (!cat || got[cat] !== undefined) return;
      if ((cat === "platform" && !hasPlat) || (cat === "pace" && !rushable) || (cat === "care" && !careOn) || (cat === "talk" && site !== "bespoke") || (cat === "extras" && !careOn)) return;
      got[cat] = v;
    }
    var radio = function (name, value) {
      var r = $$('input[name="' + name + '"]', form).filter(function (i) { return i.value === value; })[0];
      if (r) r.checked = true;
    };
    radio("site", site);
    if (got.platform) radio("platform", got.platform);
    if (got.pace) radio("pace", got.pace);
    if (got.care) radio("care", got.care);
    if (got.timing) {
      var tv = $$('input[name="timing"]', form)[Q_TIME.indexOf(got.timing)];
      if (tv) tv.checked = true;
    }
    if (got.talk) talk.checked = true;
    if (got.extras) got.extras.forEach(function (e) { var c = form.querySelector('input[name="extra"][value="' + e + '"]'); if (c) c.checked = true; });
  }

  /* the printable quote: one A4 page filled from the same choices, shown only when printing */
  var docEl = $("#svDoc"), docRef = "";
  var DOC_TITLES = {
    designed: ["Designed", "Website"], template: ["Template", "Website"], bespoke: ["Bespoke", "Website"],
    refresh: ["Website", "Refresh"], fix: ["Website", "Fix"], words: ["Words, film", "and audio"], unsure: ["Let’s work", "it out"]
  };
  var DOC_STEPS = ["Meet", "Scope", "Build", "Care"];
  function nzDate(opts) {
    try { return new Intl.DateTimeFormat("en-NZ", Object.assign({ timeZone: "Pacific/Auckland" }, opts)); } catch (e) { return null; }
  }
  function mk(tag, cls, text, parent) {
    var el = document.createElement(tag);
    if (cls) el.className = cls;
    if (text != null) el.textContent = text;
    if (parent) parent.appendChild(el);
    return el;
  }
  function liTexts(sel) { return $$(sel + " li").map(function (li) { return li.textContent.trim(); }); }
  function docList(parent, items, cls) {
    var ul = mk("ul", cls || "sd-list", null, parent);
    items.forEach(function (t) { mk("li", "", t, ul); });
  }
  function docRows(parent, rows) {
    rows.forEach(function (r) {
      var d = mk("div", "sd-row", null, parent);
      mk("span", "", r[0], d); mk("span", "", r[1], d);
    });
  }
  /* what the numbers column shows, from the same choices as the on-page breakdown */
  function docNumbers(s, q) {
    var n = { rows: [], monthly: [], monthHead: "Monthly, from month four", total: null, note: "", timing: "" };
    if (s.careOn && s.care && CARES[s.care].month) n.monthly.push([CARES[s.care].name, money(CARES[s.care].month) + " a month"]);
    if (s.site === "refresh") n.monthHead = "Monthly";
    if (!s.site) return n;
    if (s.site === "fix") {
      n.rows.push(["Website fix", "NZ$750"]);
      n.total = ["Fixed price", "NZ$750"]; n.note = "Taken off a new site within three months."; n.timing = "About a week";
    } else if (s.site === "words") {
      n.rows.push(["Words, film or audio", "From NZ$950 a day"]);
      n.total = ["Day rate", "From NZ$950"]; n.note = "Quoted per project.";
    } else if (s.site === "unsure") {
      n.total = ["Price", "On a call"]; n.note = "We’ll work it out together.";
    } else if (s.site === "refresh") {
      n.rows.push(["Refresh", "From NZ$2,500"]);
      n.total = ["Total to build", "From NZ$2,500"]; n.note = "On the platform you already use.";
    } else {
      n.rows = q.rows.filter(function (r) { return !/ a month$/.test(r[1]) && r[1] !== EXTRA_PRICE; });
      if (s.site === "bespoke") {
        n.total = ["Total to build", "From NZ$15,000"]; n.note = "Most land between NZ$15,000 and NZ$30,000.";
        n.timing = TIERS.bespoke.std;
      } else {
        n.total = [q.total.label, q.total.amount];
        n.timing = s.pace === "rush" ? s.tier.rush + " (rush)" : s.tier.std + (s.pace ? " (standard)" : "");
      }
    }
    return n;
  }
  function paintDoc() {
    var s = state(), q = quote(s), sp = slotSpecs(s);
    if (!docRef) {
      var ymd = nzDate({ year: "2-digit", month: "2-digit", day: "2-digit" }), code = "";
      if (ymd) ymd.formatToParts(new Date()).forEach(function (p) { if (p.type === "year" || p.type === "month" || p.type === "day") code += p.value; });
      var hex = Math.floor(Math.random() * 65536).toString(16).toUpperCase();
      docRef = "SS-" + (code || "000000") + "-" + ("0000" + hex).slice(-4);
    }
    var dfmt = nzDate({ day: "numeric", month: "long", year: "numeric" });
    setText($("#sdRef"), "Ref " + docRef);
    setText($("#sdDate"), "Prepared " + (dfmt ? dfmt.format(new Date()) : new Date().toDateString()));

    var T = DOC_TITLES[s.site] || ["Quote", "Summary"];
    setText($("#sdT1"), T[0]);
    var t2 = $("#sdT2"); t2.textContent = "";
    mk("span", "sd-sl", "/", t2); t2.appendChild(document.createTextNode(T[1]));

    var who = $("#sdFor"); who.textContent = "";
    if (s.name) mk("p", "sd-name", s.name, who); else mk("p", "sd-blank", "Your name", who);
    if (s.email) mk("p", "sd-sub", s.email, who); else mk("p", "sd-blank", "Your email", who);

    var parts = [sp.site, sp.plat, sp.pace, sp.care, sp.extra, sp.time].filter(function (x) { return x && x.filled; });
    $("#sdWords").hidden = !parts.length;
    setText($("#sdSentence"), parts.length ? "I’d like " + parts.map(function (x, i) { return (i ? x.prefix : "") + x.text; }).join("") + "." : "");

    var inc = $("#sdInc"); inc.textContent = "";
    if (s.tier) docList(inc, liTexts("#sd-" + s.site + " .sv-list"));
    else if (s.site === "fix") mk("p", "sd-para", FIX_TEXT, inc);
    else if (s.site === "refresh") mk("p", "sd-para", "Improve the site you have, on the platform you already use.", inc);
    else if (s.site === "words") {
      EXTRA_KEYS.forEach(function (k) {
        var d = mk("div", "sd-item", null, inc);
        mk("h3", "", $("#extra-" + k).closest(".opt").querySelector(".opt-name").textContent.trim(), d);
        mk("p", "", $("#xd-" + k + " .opt-line").textContent.trim(), d);
      });
    } else if (s.site === "unsure") {
      n.total = ["Price", "On a call"]; n.note = "We’ll work it out together.";
    } else if (s.site === "refresh") {
      n.rows.push(["Refresh", "From NZ$2,500"]);
      n.total = ["Total to build", "From NZ$2,500"]; n.note = "On the platform you already use.";
    } else {
      n.rows = q.rows.filter(function (r) { return !/ a month$/.test(r[1]) && r[1] !== EXTRA_PRICE; });
      if (s.site === "bespoke") {
        n.total = ["Total to build", "From NZ$15,000"]; n.note = "Most land between NZ$15,000 and NZ$30,000.";
        n.timing = TIERS.bespoke.std;
      } else {
        n.total = [q.total.label, q.total.amount];
        n.timing = s.pace === "rush" ? s.tier.rush + " (rush)" : s.tier.std + (s.pace ? " (standard)" : "");
      }
    }
    return n;
  }
  function paintDoc() {
    var s = state(), q = quote(s), sp = slotSpecs(s);
    if (!docRef) {
      var ymd = nzDate({ year: "2-digit", month: "2-digit", day: "2-digit" }), code = "";
      if (ymd) ymd.formatToParts(new Date()).forEach(function (p) { if (p.type === "year" || p.type === "month" || p.type === "day") code += p.value; });
      var hex = Math.floor(Math.random() * 65536).toString(16).toUpperCase();
      docRef = "SS-" + (code || "000000") + "-" + ("0000" + hex).slice(-4);
    }
    var dfmt = nzDate({ day: "numeric", month: "long", year: "numeric" });
    setText($("#sdRef"), "Ref " + docRef);
    setText($("#sdDate"), "Prepared " + (dfmt ? dfmt.format(new Date()) : new Date().toDateString()));

    var T = DOC_TITLES[s.site] || ["Quote", "Summary"];
    setText($("#sdT1"), T[0]);
    var t2 = $("#sdT2"); t2.textContent = "";
    mk("span", "sd-sl", "/", t2); t2.appendChild(document.createTextNode(T[1]));

    var who = $("#sdFor"); who.textContent = "";
    if (s.name) mk("p", "sd-name", s.name, who); else mk("p", "sd-blank", "Your name", who);
    if (s.email) mk("p", "sd-sub", s.email, who); else mk("p", "sd-blank", "Your email", who);

    var parts = [sp.site, sp.plat, sp.pace, sp.care, sp.extra, sp.time].filter(function (x) { return x && x.filled; });
    $("#sdWords").hidden = !parts.length;
    setText($("#sdSentence"), parts.length ? "I’d like " + parts.map(function (x, i) { return (i ? x.prefix : "") + x.text; }).join("") + "." : "");

    var inc = $("#sdInc"); inc.textContent = "";
    if (s.tier) docList(inc, liTexts("#sd-" + s.site + " .sv-list"));
    else if (s.site === "fix") mk("p", "sd-para", FIX_TEXT, inc);
    else if (s.site === "refresh") mk("p", "sd-para", "Improve the site you have, on the platform you already use.", inc);
    else if (s.site === "words") {
      $$(".sv-beyond").forEach(function (p) {
        var d = mk("div", "sd-item", null, inc);
        mk("h3", "", p.parentNode.querySelector("h3").textContent.trim(), d);
        mk("p", "", p.textContent.trim(), d);
      });
    } else if (s.site === "unsure") mk("p", "sd-para", "We’ll work out on a call which of these fits: a website, words, film or audio.", inc);
    if (s.careOn && s.care && s.care !== "none") {
      mk("p", "sd-mono sd-lab sd-sublab", null, inc).appendChild(document.createTextNode(""));
      var lab = inc.lastChild;
      mk("span", "sd-r", "/", lab);
      lab.appendChild(document.createTextNode(CARES[s.care].name + (s.site === "refresh" ? ", monthly" : ", from month four")));
      docList(inc, liTexts("#cd-" + s.care + " .sv-list"));
    }
    if (s.extras.length) {
      mk("p", "sd-mono sd-lab sd-sublab", null, inc).appendChild(document.createTextNode(""));
      var xlab = inc.lastChild;
      mk("span", "sd-r", "/", xlab);
      xlab.appendChild(document.createTextNode("Extras to go live with the site"));
      docList(inc, s.extras.map(function (k) { return EXTRAS[k].name + ", from NZ$950 a day, quoted on the call"; }));
    }

    var N = docNumbers(s, q);
    var rows = $("#sdRows"); rows.textContent = ""; docRows(rows, N.rows);
    var tot = $("#sdTotal"); tot.textContent = "";
    if (N.total) {
      mk("p", "sd-mono", N.total[0], tot); mk("p", "sd-amt", N.total[1], tot);
      if (N.note) mk("p", "sd-tnote", N.note, tot);
    }
    var mo = $("#sdMonth"); mo.textContent = "";
    if (N.monthly.length) { mk("p", "sd-mono sd-lab", N.monthHead, mo); docRows(mo, N.monthly); }
    var tm = $("#sdTime"); tm.textContent = "";
    if (N.timing) { mk("p", "sd-mono sd-lab", "Timing", tm); mk("p", "sd-tv", N.timing, tm); }

    var know = $("#sdKnow"); know.textContent = "";
    ["Half when we start, half at launch."]
      .concat(["You own it all: the site, the domain and the words are in your name."])
      .concat(sqPath(s) ? [SQ_LINE] : [])
      .concat(["Prices in NZ dollars. Singh Studio is not GST-registered."])
      .forEach(function (t) { mk("li", "", t, know); });

    var again = $("#sdAgain"), qc = qCode(s);
    again.textContent = "";
    if (qc) {
      again.appendChild(document.createTextNode("See this again: "));
      var a = mk("a", "", "singhstudio.co.nz/services/?q=" + qc, again);
      a.href = "https://www.singhstudio.co.nz/services/?q=" + qc;
    }
  }
  window.addEventListener("beforeprint", paintDoc);
  $("#svSave").addEventListener("click", async function () {
    paintDoc();
    try {
      if (document.fonts && document.fonts.ready) await document.fonts.ready;
      var logo = $("#sdLogo");
      if (logo && logo.decode) await logo.decode();
    } catch (e) { /* print anyway */ }
    window.print();
  });

  /* phone and tablet bar: the choice and total on the left, Next on the right, on steps 1 to 5 */
  var bar = $("#svBar"), goBtn = $("#svBarGo"), inBuilder = false;
  /* two lines: the choice, then its price */
  function barLabel(s) {
    if (!s.site) return null;
    if (s.site === "fix") return ["Website fix", "NZ$750"];
    if (s.site === "refresh") return ["Refresh" + (s.extras.length ? ", + " + s.extras.map(function (k) { return EXTRAS[k].short; }).join(", ") : ""), "From NZ$2,500"];
    if (s.site === "words") return ["Words, film or audio", "From NZ$950 a day"];
    if (s.site === "unsure") return ["Help working it out", ""];
    var t = s.tier;
    var xs = s.extras.length ? ", + " + s.extras.map(function (k) { return EXTRAS[k].short; }).join(", ") : "";
    if (s.site === "bespoke") return ["Bespoke" + xs, "From " + money(t.price)];
    var rushOn = s.pace === "rush";
    return [t.name + (rushOn ? ", rush" : "") + xs, money(t.price + (rushOn ? Math.round(t.price * 0.3) : 0))];
  }
  var barName = $("#svBarName"), barPrice = $("#svBarPrice");
  function paintBar(s) {
    var t = barLabel(s);
    setText(barName, t ? t[0] : "Choose a website"); setText(barPrice, t ? t[1] : "");
    $("#svBarText").classList.toggle("is-empty", !t);
    bar.classList.toggle("on", flow && cur < 7 && inBuilder && !done);
  }
  /* the back-to-top button would sit on the sticky panel, so it steps aside while the configurator is in view */
  if ("IntersectionObserver" in window) {
    new IntersectionObserver(function (es) { document.body.classList.toggle("sv-cfg-view", es[0].isIntersecting); }, { threshold: 0 }).observe(root);
    new IntersectionObserver(function (es) { inBuilder = es[0].isIntersecting; paintBar(state()); }, { rootMargin: "-62% 0px -72px 0px", threshold: 0 }).observe(root);
  } else { inBuilder = true; }

  /* ---- phone and tablet: one step at a time ---- */
  var flowMQ = window.matchMedia("(max-width: 1023.98px)");
  var flow = flowMQ.matches, cur = 1;
  var prog = { n: $("#cfgProgN"), fill: $("#cfgProgFill"), back: $("#cfgBack") };
  var revHead = $("#revHead"), actionsEl = $(".se-actions", summaryEl);
  var motionOK = function () { return !window.matchMedia("(prefers-reduced-motion: reduce)").matches; };
  function visSteps(s) {
    return s.site ? [1, s.hasPlat ? 2 : 0, s.tier ? 3 : 0, s.careOn ? 4 : 0, s.careOn ? 5 : 0, 6, 7].filter(Boolean) : [1, 2, 3, 4, 5, 6, 7];
  }
  function stepDone(n, s) {
    if (n === 1) return !!s.site;
    if (n === 2) return !!s.platform;
    if (n === 3) return s.rushable ? !!s.pace : true;
    if (n === 4) return !!s.care;
    return true; /* extras (5) and timing (6) never block Next */
  }
  function stepAfter(s, from, dir) {
    var v = visSteps(s), i = v.indexOf(from);
    if (i < 0) return dir > 0 ? 7 : 1;
    return v[Math.min(v.length - 1, Math.max(0, i + dir))];
  }
  /* where to open: the first of steps 1 to 4 still to answer, or the review */
  function entryStep(s) {
    if (!s.site) return 1;
    var v = visSteps(s);
    for (var i = 0; i < v.length; i++) if (v[i] <= 4 && !stepDone(v[i], s)) return v[i];
    return 7;
  }
  function paintFlow(s) {
    if (!flow) return;
    var v = visSteps(s), idx = Math.max(0, v.indexOf(cur));
    setText(prog.n, "Step " + (idx + 1) + " of " + v.length);
    prog.fill.style.width = ((idx + 1) / v.length * 100) + "%";
    prog.back.hidden = cur === 1;
    goBtn.disabled = !(cur < 7 && stepDone(cur, s));
    paintBar(s);
  }

  /* the reveal animates three phrase groups; they exist only below 1024px so the desktop text runs are untouched */
  function wrapSentence(on) {
    var p = $("#sentence"), has = !!p.querySelector(".rv-0");
    if (!on) {
      if (!has) return;
      ["rv-0", "rv-1", "rv-e"].forEach(function (c) {
        var w = p.querySelector("." + c);
        while (w.firstChild) p.insertBefore(w.firstChild, w);
        w.remove();
      });
      return;
    }
    if (has) return;
    var kids = Array.prototype.slice.call(p.childNodes);
    var iName = kids.indexOf(p.querySelector(".se-nw")), iSite = kids.indexOf($("#slSite")), iTime = kids.indexOf($("#slTime"));
    var group = function (cls, from, to) {
      var w = document.createElement("span"); w.className = "rv " + cls;
      p.insertBefore(w, kids[from]);
      for (var i = from; i <= to; i++) w.appendChild(kids[i]);
    };
    group("rv-0", 0, iName);
    group("rv-1", iName + 1, iSite);
    group("rv-e", iTime + 1, kids.length - 1);
  }

  /* the reveal: the sentence writes itself, then the numbers, then the buttons */
  var revOn = false, revT = 0, revIO = null;
  function endReveal() {
    clearTimeout(revT);
    if (revIO) { revIO.disconnect(); revIO = null; }
    document.removeEventListener("keydown", skipReveal, true);
    summaryEl.removeEventListener("pointerdown", skipReveal, true);
    var was = revOn;
    revOn = false;
    summaryEl.classList.remove("rev-play", "rev-hold");
    actionsEl.removeAttribute("inert");
    return was;
  }
  function focusRevHead() {
    var a = document.activeElement;
    if (flow && cur === 7 && (!a || a === document.body || a === goBtn || a === prog.back)) revHead.focus({ preventScroll: true });
  }
  function skipReveal() { if (endReveal()) focusRevHead(); }
  function startReveal(initial) {
    endReveal();
    if (!flow) return;
    if (!motionOK()) { if (!initial) focusRevHead(); return; }
    revOn = true;
    summaryEl.classList.add("rev-play");
    actionsEl.setAttribute("inert", "");
    document.addEventListener("keydown", skipReveal, true);
    summaryEl.addEventListener("pointerdown", skipReveal, true);
    var arm = function () {
      summaryEl.classList.remove("rev-hold");
      revT = setTimeout(function () { if (endReveal() && !initial) focusRevHead(); }, 1500);
    };
    if (initial && "IntersectionObserver" in window) {
      summaryEl.classList.add("rev-hold");
      revIO = new IntersectionObserver(function (es) {
        if (!es.some(function (x) { return x.isIntersecting; })) return;
        revIO.disconnect(); revIO = null; arm();
      }, { threshold: 0.2 });
      revIO.observe(summaryEl);
    } else arm();
  }

  function showStep(n, o) {
    o = o || {};
    cur = n;
    root.setAttribute("data-cur", String(n));
    paintFlow(state());
    fitAll();
    if (n === 7) startReveal(!!o.initial); else endReveal();
    if (o.scroll) root.scrollIntoView({ block: "start", behavior: motionOK() ? "smooth" : "instant" });
    if (o.focus && n !== 7) { var lg = $("#fs" + n + " legend"); if (lg) lg.focus({ preventScroll: true }); }
  }
  goBtn.addEventListener("click", function () {
    var s = state();
    if (cur < 7 && stepDone(cur, s)) showStep(stepAfter(s, cur, 1), { scroll: true, focus: true });
  });
  prog.back.addEventListener("click", function () { showStep(stepAfter(state(), cur, -1), { scroll: true, focus: true }); });
  /* the "what happens next" list is a closed disclosure beside the form and always open in the phone flow */
  var nextD = $("#cfgNext");
  function syncNext() { if (nextD) nextD.open = flow; }
  flowMQ.addEventListener("change", function (e) {
    flow = e.matches;
    syncNext();
    wrapSentence(flow);
    if (flow) { var s = state(); showStep(s.site ? entryStep(s) : 1, {}); }
    else { endReveal(); paintBar(state()); }
  });

  /* disclosures: What's included on an option, and the other ways to start */
  form.addEventListener("click", function (e) {
    var b = e.target.closest(".opt-more-btn, .cfg-other-btn");
    if (!b) return;
    var box = b.parentNode, open = !box.classList.contains("is-open");
    box.classList.toggle("is-open", open);
    b.setAttribute("aria-expanded", open ? "true" : "false");
  });
  /* the Choose row in the compare grid picks a site as tapping its option does, then closes the grid */
  $$("[data-cmp-pick]").forEach(function (b) {
    b.addEventListener("click", function () {
      var r = $("#site-" + b.getAttribute("data-cmp-pick"));
      if (!r) return;
      r.checked = true;
      dropCursor(); clearInvalid(r); render();
      var d = $("#cmpDetails");
      if (d) d.open = false;
      r.focus({ preventScroll: true });
      var card = r.closest(".opt");
      if (card) card.scrollIntoView({ block: "nearest", behavior: reduce ? "auto" : "smooth" });
    });
  });
  function openOther() {
    var box = $(".cfg-other"), q = $(".opt-quiet .opt-in:checked");
    if (!q) return;
    box.classList.add("is-open");
    $(".cfg-other-btn").setAttribute("aria-expanded", "true");
  }

  /* render everything from the choices; returns the steps that just opened */
  var catalog = { amt: $("#paceStdAmt"), stdTime: $("#paceStdTime"), rushAmt: $("#paceRushAmt"), rushTime: $("#paceRushTime") };
  function render() {
    var s = state();
    var vis = { 2: s.hasPlat, 3: !!s.tier, 4: s.careOn, 5: s.careOn, 6: !!s.site };
    var opened = [];
    [2, 3, 4, 5, 6].forEach(function (n) {
      var el = steps[n], was = !el.classList.contains("is-off");
      el.classList.toggle("is-off", !vis[n]);
      if (vis[n]) el.removeAttribute("inert"); else el.setAttribute("inert", "");
      if (vis[n] && !was) opened.push(n);
    });
    if (s.tier) {
      $("#paceCards").hidden = !s.rushable;
      $("#paceBespoke").hidden = s.rushable;
      if (s.rushable) {
        setText(catalog.amt, s.tier.price.toLocaleString("en-NZ"));
        setText(catalog.stdTime, s.tier.std);
        setText(catalog.rushAmt, Math.round(s.tier.price * 1.3).toLocaleString("en-NZ"));
        setText(catalog.rushTime, s.tier.rush);
        var wks = function (t) { return t.replace(/^About /, "").replace(/ weeks$/, ""); };
        setText($("#paceRushUp"), "Live in about " + s.tier.rush.replace(/^About /, "") + " instead of " + wks(s.tier.std) + ", for " + money(Math.round(s.tier.price * 0.3)) + " more.");
      }
    }
    if (s.careOn) {
      var refresh = s.site === "refresh";
      setText($("#careIntro"), refresh ? "Care starts once the refresh is done. Pick a plan, or none:"
        : s.site === "bespoke" ? "Three months of Care Plus are included. After that:" : "Three months of Care are included. After that:");
      setText($("#careNoneName"), refresh ? "No care plan" : "No care after three months");
      setText($("#careNoneLine"), refresh ? "No monthly charge." : "No monthly charge after the first three months.");
    }
    $("#timingOpt").hidden = s.site !== "unsure";
    paintSentence(s);
    var q = paintQuote(s);
    $("#sqLine").hidden = !sqPath(s);
    $("#exLine").hidden = !s.extras.length;
    $("#svSave").hidden = !s.site;
    updateCount(s);
    paintFlow(s);
    paintBar(s);
    fitAll();
    return opened;
  }

  function focusIn(step) {
    var el = steps[step];
    var target = el.querySelector("input:checked") || $$("input", el).filter(function (i) { return i.offsetParent !== null; })[0];
    if (target) target.focus({ preventScroll: true });
    return target;
  }
  /* a keyboard user's focus stays in view once the step has finished opening */
  function keepInView(target) {
    if (!target) return;
    setTimeout(function () {
      var r = target.closest(".opt, .sv-chip, .opt-q") ? target.closest(".opt, .sv-chip, .opt-q").getBoundingClientRect() : target.getBoundingClientRect();
      if (r.top < 90 || r.bottom > window.innerHeight) target.scrollIntoView({ block: "nearest", behavior: reduce ? "auto" : "smooth" });
    }, reduce ? 0 : 340);
  }

  function clearInvalid(el) {
    if (el) el.removeAttribute("aria-invalid");
    if (el && el.name) { var fs = el.closest("fieldset"); if (fs) fs.removeAttribute("data-invalid"); }
    if (!form.querySelector('[aria-invalid="true"], fieldset[data-invalid="true"]')) err.hidden = true;
  }
  function onChange(e, quiet) {
    var t = e.target;
    if (!t || !t.name) return;
    dropCursor();
    clearInvalid(t);
    var opened = render();
    if (t.name === "site") openOther();
    if (!flow && !quiet && lastKb && opened.length && e.type === "change") {
      keepInView(focusIn(opened[0]));
    }
  }
  form.addEventListener("change", function (e) { onChange(e, false); });
  form.addEventListener("input", function (e) { if (e.target.type === "text" || e.target.type === "email") onChange(e, true); });

  /* gaps in the sentence take you to the step */
  function goStep(n) {
    if (flow) { showStep(n, { scroll: true, focus: true }); return; }
    var fs = $("#fs" + n);
    fs.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
    focusIn(n);
  }
  $("#sentence").addEventListener("click", function (e) {
    var g = e.target.closest(".gap");
    if (g) goStep(+g.getAttribute("data-step"));
  });

  /* the two buttons that pick a path from elsewhere on the page */
  function goForm() {
    if (flow) { showStep(entryStep(state()), { scroll: true, focus: true }); return; }
    var h = $("#h-cfg");
    h.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
    setTimeout(function () { h.focus({ preventScroll: true }); }, reduce ? 0 : 700);
  }
  $$("[data-pick-site]").forEach(function (b) {
    b.addEventListener("click", function () {
      var r = $("#site-" + b.getAttribute("data-pick-site"));
      r.checked = true;
      dropCursor(); clearInvalid(r); render(); goForm();
    });
  });
  function goSummary() {
    summaryEl.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
    f.name.focus({ preventScroll: true });
  }
  $("#goSummary").addEventListener("click", goSummary);

  /* optional note */
  var more = $("#seMore"), addNote = $("#seAddNote");
  addNote.addEventListener("click", function () {
    more.hidden = false; addNote.setAttribute("aria-expanded", "true"); addNote.hidden = true;
    $("textarea", more).focus();
  });

  /* the enquiry as the hub and the email carry it */
  function needLine(s) {
    var parts = [SITE_SHORT[s.site]];
    if (s.rushable && s.pace) parts.push(s.pace === "rush" ? "rush" : "standard");
    else if (s.site === "bespoke" && s.talk) parts.push("rush talk");
    if (s.careOn && s.care) parts.push(s.care === "none" ? "no care" : CARES[s.care].name);
    if (s.hasPlat && s.platform) parts.push(PLATFORM_SHORT[s.platform]);
    else if (s.site === "template") parts.push("Squarespace");
    var base = parts.join(", ");
    if (s.extras.length) {
      var ext = " + " + s.extras.map(function (k) { return EXTRAS[k].short; }).join(", ");
      if ((base + ext).length > 80) ext = " + extras";
      base += ext;
    }
    return base.slice(0, 80);
  }
  function messageText(q, note) {
    var lines = ["Configured on the Services page:"];
    q.rows.forEach(function (r) { lines.push(r[0] + ": " + r[1]); });
    lines.push(q.total.text ? q.total.text : q.total.label + ": " + q.total.amount);
    var m = lines.join("\n");
    return note ? m + "\n\n" + note : m;
  }

  var labels = { name: "your name", site: "the site you would like", platform: "which platform", pace: "how soon", care: "care after launch", timing: "when you’d like to start", email: "your email" };
  var stepOf = { site: 1, platform: 2, pace: 3, care: 4, timing: 6 };
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    if (sender.blocked(btn)) return; // already sending, or the honeypot is ticked
    var s = state(), bad = gaps(s);
    if (s.email && !emailOk(s.email) && bad.indexOf("email") < 0) bad.push("email");
    $$("[aria-invalid]", form).forEach(function (el) { el.removeAttribute("aria-invalid"); });
    $$("fieldset[data-invalid]", form).forEach(function (el) { el.removeAttribute("data-invalid"); });
    if (bad.length) {
      var order = ["name", "site", "platform", "pace", "care", "timing", "email"];
      bad.sort(function (a, b) { return order.indexOf(a) - order.indexOf(b); });
      bad.forEach(function (k) {
        if (k === "name" || k === "email") f[k].setAttribute("aria-invalid", "true");
        else $("#fs" + stepOf[k]).setAttribute("data-invalid", "true");
      });
      var names = bad.map(function (k) { return labels[k]; });
      var list = names.length > 1 ? names.slice(0, -1).join(", ") + " and " + names.slice(-1) : names[0];
      err.textContent = "Add " + list + " so I can reply.";
      err.hidden = false;
      var first = bad[0];
      if (first === "name" || first === "email") f[first].focus();
      else goStep(stepOf[first]);
      return;
    }
    err.hidden = true;

    var need = needLine(s);
    var timing = s.timing || "(not given)";
    var about = "services page";
    var note = ((form.elements.message && form.elements.message.value) || "").trim();
    var message = messageText(quote(s), note);
    var subject = "Enquiry from " + s.name + ": " + need + " (" + about + ")";
    form.elements.subject.value = subject;
    var mailBody = message + "\n\nTiming: " + timing + "\n\n— " + s.name + "\n" + s.email;
    sender.send({
      btn: btn, err: err, subject: subject, mailBody: mailBody,
      fields: { name: s.name, email: s.email, need: need, timing: timing, message: message, about: about },
      formData: function () {
        var fd = new FormData();
        fd.append("access_key", keyField ? keyField.value : "");
        fd.append("subject", subject);
        fd.append("name", s.name); fd.append("need", need); fd.append("timing", timing);
        fd.append("email", s.email); fd.append("message", message); fd.append("context", about);
        return fd;
      },
      onSent: function (restore) {
        restore();
        done = true; paintBar(s);
        sumBody.hidden = true; sent.hidden = false;
        sentHead.focus();
      }
    });
  });

  applyQ();
  syncNext();
  render();
  openOther();
  wrapSentence(flow);
  if (flow) { var s0 = state(); showStep(s0.site ? entryStep(s0) : 1, { initial: true }); }
})();

/* Services and landing pages on a phone: the swipe rows of quotes take a keyboard stop each */
(function () {
  "use strict";
  if (!document.body.classList.contains("pg-phone")) return;
  var mq = window.matchMedia("(max-width: 759.98px)");
  var quotes = Array.prototype.slice.call(document.querySelectorAll(".sv-quote"));
  function set() {
    quotes.forEach(function (q) {
      if (mq.matches) q.setAttribute("tabindex", "0"); else q.removeAttribute("tabindex");
    });
  }
  set();
  mq.addEventListener("change", set);
})();
