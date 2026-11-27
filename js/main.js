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
  document.querySelectorAll(".nav-links a").forEach((a) => {
    const target = a.getAttribute("href").split("#")[0];
    const isThoughts = target === "thoughts.html" && here.startsWith("thought");
    if ((target && target === here) || isThoughts) {
      a.classList.add("current");
      a.setAttribute("aria-current", "page");
    }
  });
})();

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
        about = ("landed on " + path + (ref ? " via " + ref : "")).replace(/[^\w\s&-]/g, "").trim().slice(0, 60);
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

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (btn.getAttribute("aria-disabled") === "true") return; // already sending
    if (form.botcheck.checked) return; // honeypot

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

    if (!CONFIG.web3formsKey) {
      const body = (text ? text + "\n\n" : "") +
        "Need: " + need + "\nTiming: " + timing +
        "\n\n— " + name + "\n" + email;
      location.href = "mailto:" + CONFIG.email + "?subject=" + encodeURIComponent(subject) + "&body=" + encodeURIComponent(body);
      return;
    }

    btn.setAttribute("aria-disabled", "true");
    const prev = btn.innerHTML;
    btn.innerHTML = "Sending…";
    const payload = { name, email, need, timing, message: text, about, submissionId, botcheck: false };
    const viaEmail = fetch("https://api.web3forms.com/submit", { method: "POST", body: new FormData(form) })
      .then((res) => { if (!res.ok) throw new Error(String(res.status)); return res.json(); })
      .then((data) => { if (!data || data.success === false) throw new Error("rejected"); return true; });
    const viaHub = hubOn ? sendToHub(payload) : Promise.reject(new Error("hub off"));
    try {
      await firstSuccess([viaEmail, viaHub]);
      submissionId = newId();
      track("enquiry_submit", { label: need + (about ? " / " + about : "") });
      form.reset();
      applyAbout();
      fitAll();
      btn.removeAttribute("aria-disabled");
      btn.innerHTML = prev;
      updateCount();
      more.hidden = true; addNote.hidden = false; addNote.setAttribute("aria-expanded", "false");
      form.hidden = true;
      sent.hidden = false;
      sentHead.focus();
    } catch {
      err.textContent = "That didn’t send. Try again, or write to kris@singhstudio.co.nz.";
      err.hidden = false;
      btn.removeAttribute("aria-disabled");
      btn.innerHTML = prev;
      updateCount();
    }
  });
})();
