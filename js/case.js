/* Case study format behaviour.
   Runs beside js/main.js. Four jobs: keep the sticky section bar clear of the
   site nav, mark the current section, lift the hero image a little on scroll,
   and turn the before/after pairs into one tabbed, draggable comparer. */
(() => {
  "use strict";
  const root = document.documentElement;
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---- 1. Offset for the site nav, which hides when you scroll down ---- */
  const nav = document.getElementById("nav");
  const syncTop = () => {
    if (!nav) return;
    const h = nav.offsetHeight;
    root.style.setProperty("--cx-nav", h + "px");
    root.style.setProperty("--cx-top", nav.classList.contains("hidden") ? "0px" : h + "px");
  };
  if (nav) {
    new MutationObserver(syncTop).observe(nav, { attributes: true, attributeFilter: ["class"] });
    window.addEventListener("resize", syncTop);
    syncTop();
  }

  /* Layout position of an element, ignoring the 16px reveal offset a block has until it has been seen. */
  const pageY = (el) => { let y = 0; for (let e = el; e; e = e.offsetParent) y += e.offsetTop; return y; };

  /* ---- 2. Section nav: mark the section being read ---- */
  const bar = document.querySelector(".cx-bar");
  if (bar) {
    const inner = bar.querySelector(".cx-bar-in");
    const links = [...bar.querySelectorAll('a[href^="#"]')];
    const heads = links.map((a) => document.getElementById(a.hash.slice(1)));
    let current = -1;
    const mark = (i) => {
      if (i === current) return;
      current = i;
      links.forEach((a, n) => {
        if (n === i) a.setAttribute("aria-current", "location");
        else a.removeAttribute("aria-current");
      });
      const a = links[i];
      if (a && inner.scrollWidth > inner.clientWidth + 2) {
        inner.scrollTo({
          left: a.offsetLeft - (inner.clientWidth - a.offsetWidth) / 2,
          behavior: reduce ? "auto" : "smooth",
        });
      }
    };
    const spy = () => {
      const line = bar.getBoundingClientRect().bottom + 110;
      let idx = 0;
      heads.forEach((h, i) => { if (h && pageY(h) - window.scrollY <= line) idx = i; });
      if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4) idx = heads.length - 1;
      mark(idx);
    };
    let spyTick = false;
    window.addEventListener("scroll", () => {
      if (spyTick) return;
      spyTick = true;
      requestAnimationFrame(() => { spyTick = false; spy(); });
    }, { passive: true });
    window.addEventListener("resize", spy);
    spy();

    /* Jumps: land the heading 28px under the bar whether or not the site nav is showing.
       Going down the nav will hide; going up it will show. */
    links.forEach((a, i) => a.addEventListener("click", (e) => {
      const h = heads[i];
      if (!h) return;
      e.preventDefault();
      const barH = bar.offsetHeight;
      const hy = pageY(h);
      const navH = nav ? nav.offsetHeight : 0;
      const yDown = hy - barH - 28;
      const down = yDown > window.scrollY;
      const navHides = down && yDown > 320;
      const y = navHides ? yDown : yDown - navH;
      window.scrollTo({ top: Math.max(0, y), behavior: reduce ? "auto" : "smooth" });
      try { history.replaceState(null, "", a.hash); } catch (err) { /* ignore */ }
    }));
  }

  /* ---- 3. Hero image rises a little on scroll ---- */
  const rise = document.querySelector("[data-rise]");
  if (rise && !reduce) {
    let t = false;
    const go = () => {
      t = false;
      rise.style.setProperty("--rise", -Math.min(window.scrollY * 0.05, 24).toFixed(1) + "px");
    };
    window.addEventListener("scroll", () => { if (!t) { t = true; requestAnimationFrame(go); } }, { passive: true });
  }

  /* ---- 4. Before / after comparer ---- */
  document.querySelectorAll("[data-cmp]").forEach((cmp, ci) => {
    const panels = [...cmp.querySelectorAll(".cmp-panel")];
    if (!panels.length) return;
    const tabsHost = document.querySelector("[data-cmp-tabs]");
    const captionEl = document.querySelector("[data-cmp-caption]");
    const tabs = [];

    const setValue = (panel, v) => {
      const pair = panel.querySelector(".cmp-pair");
      const input = panel.querySelector(".cmp-range");
      v = Math.max(0, Math.min(100, v));
      input.value = v;
      pair.style.setProperty("--pn", (v / 100).toFixed(4));
      input.setAttribute("aria-valuetext", Math.round(v) + "% of the way across: before on the left, after on the right");
    };

    panels.forEach((panel, i) => {
      const id = `cmp${ci}-${i}`;
      const title = panel.dataset.title;
      const pair = panel.querySelector(".cmp-pair");
      const sides = pair.querySelectorAll(".cmp-side");
      sides[0].classList.add("is-before");
      sides[1].classList.add("is-after");
      // Tags live above both layers so both stay readable while dragging.
      pair.querySelectorAll(".cmp-tag").forEach((t, n) => { t.classList.add(n === 0 ? "is-before" : "is-after"); pair.appendChild(t); });

      const line = document.createElement("div");
      line.className = "cmp-line";
      line.setAttribute("aria-hidden", "true");
      const label = document.createElement("label");
      label.className = "cx-sr";
      label.htmlFor = id + "-range";
      label.textContent = `Comparison divider for ${title}. Move it to reveal more of the old or the new page.`;
      const input = document.createElement("input");
      input.type = "range"; input.min = "0"; input.max = "100"; input.step = "1"; input.value = "50";
      input.id = id + "-range"; input.className = "cmp-range";
      pair.append(line, label, input);
      setValue(panel, 50);
      input.addEventListener("input", () => setValue(panel, +input.value));

      // Drag anywhere on the image, mouse or touch. The native thumb handles itself.
      let drag = false;
      const at = (e) => {
        const r = pair.getBoundingClientRect();
        setValue(panel, ((e.clientX - r.left - 22) / (r.width - 44)) * 100);
      };
      pair.addEventListener("pointerdown", (e) => {
        if (e.target === input || (e.pointerType === "mouse" && e.button !== 0)) return;
        drag = true;
        pair.setPointerCapture(e.pointerId);
        at(e);
        input.focus({ preventScroll: true });
      });
      pair.addEventListener("pointermove", (e) => { if (drag) at(e); });
      const end = (e) => { drag = false; if (pair.hasPointerCapture(e.pointerId)) pair.releasePointerCapture(e.pointerId); };
      pair.addEventListener("pointerup", end);
      pair.addEventListener("pointercancel", end);

      panel.id = id + "-panel";
      panel.setAttribute("role", "tabpanel");
      panel.setAttribute("aria-labelledby", id + "-tab");
      const tab = document.createElement("button");
      tab.type = "button"; tab.id = id + "-tab"; tab.textContent = title;
      tab.setAttribute("role", "tab");
      tab.setAttribute("aria-controls", panel.id);
      tabs.push(tab);
      tabsHost.appendChild(tab);
    });

    const select = (i, focus) => {
      tabs.forEach((t, n) => {
        const on = n === i;
        t.setAttribute("aria-selected", on ? "true" : "false");
        t.tabIndex = on ? 0 : -1;
        panels[n].hidden = !on;
      });
      if (captionEl) captionEl.textContent = panels[i].dataset.caption || "";
      if (focus) tabs[i].focus();
    };
    tabs.forEach((t, i) => t.addEventListener("click", () => select(i)));
    tabsHost.addEventListener("keydown", (e) => {
      const i = tabs.indexOf(document.activeElement);
      if (i < 0) return;
      let n = null;
      if (e.key === "ArrowRight" || e.key === "ArrowDown") n = (i + 1) % tabs.length;
      else if (e.key === "ArrowLeft" || e.key === "ArrowUp") n = (i - 1 + tabs.length) % tabs.length;
      else if (e.key === "Home") n = 0;
      else if (e.key === "End") n = tabs.length - 1;
      if (n === null) return;
      e.preventDefault();
      select(n, true);
    });
    tabsHost.hidden = false;
    select(0);
  });
})();

/* Bearers: "Play here" puts one Spotify player on the page at a time. Nothing is requested from Spotify until a press. */
(() => {
  "use strict";
  const rels = [...document.querySelectorAll(".bx-rel")].filter((r) => r.querySelector(".bx-play"));
  if (!rels.length) return;
  const clear = (r) => {
    const slot = r.querySelector(".bx-player");
    if (slot) slot.textContent = "";
    r.querySelector(".bx-play").hidden = false;
  };
  rels.forEach((r) => {
    const btn = r.querySelector(".bx-play");
    btn.hidden = false;
    btn.addEventListener("click", () => {
      rels.forEach(clear);
      const f = document.createElement("iframe");
      f.src = "https://open.spotify.com/embed/album/" + btn.dataset.spotify;
      f.width = "100%"; f.height = "152"; f.setAttribute("frameborder", "0");
      f.style.border = "0"; f.style.borderRadius = "12px";
      f.allow = "autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture";
      f.loading = "lazy";
      f.title = btn.dataset.title + " by Bearers, Spotify player";
      r.querySelector(".bx-player").appendChild(f);
      btn.hidden = true;
      f.focus();
    });
  });
})();
