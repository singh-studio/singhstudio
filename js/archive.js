/* ============================================================
   SINGH STUDIO — archive page
   Set tabs (scrollspy) + sequential lightbox.
   Runs alongside main.js, which handles nav/cursor/clock/etc.
   ============================================================ */

/* ---------- Scrollspy tabs ---------- */
(() => {
  const tabs = [...document.querySelectorAll(".set-tab")];
  const sets = [...document.querySelectorAll(".set")];
  if (!tabs.length || !sets.length) return;

  const byHash = Object.fromEntries(tabs.map((t) => [t.getAttribute("href"), t]));
  const setActive = (id) => {
    tabs.forEach((t) => {
      const on = t === byHash["#" + id];
      t.classList.toggle("active", on);
      if (on) t.setAttribute("aria-current", "true");
      else t.removeAttribute("aria-current");
    });
  };

  const io = new IntersectionObserver((entries) => {
    // pick the entry nearest the top band of the viewport
    const visible = entries.filter((e) => e.isIntersecting);
    if (visible.length) setActive(visible[0].target.id);
  }, { rootMargin: "-18% 0px -66% 0px" });
  sets.forEach((s) => io.observe(s));
  setActive(sets[0].id);

  // keep the active tab scrolled into view within the tab strip
  const strip = document.getElementById("setTabs");
  const mo = new MutationObserver(() => {
    const active = strip.querySelector(".set-tab.active");
    if (active) active.scrollIntoView({ block: "nearest", inline: "center", behavior: "smooth" });
  });
  tabs.forEach((t) => mo.observe(t, { attributes: true, attributeFilter: ["class"] }));

  // live counts (sup per tab + total) so edits to the grids stay honest
  let total = 0;
  sets.forEach((s) => {
    const n = s.querySelectorAll(".ph").length;
    total += n;
    const tab = byHash["#" + s.id];
    const sup = tab && tab.querySelector("sup");
    if (sup) sup.textContent = String(n).padStart(2, "0");
  });
  const count = document.getElementById("archiveCount");
  if (count) count.textContent = `${total} frames / ${sets.length} sets`;
})();

/* ---------- Sequential lightbox ---------- */
(() => {
  const dialog = document.getElementById("lightbox");
  const img = document.getElementById("lightboxImg");
  const cap = document.getElementById("lightboxCap");
  const counter = document.getElementById("lbCounter");
  const prevBtn = document.getElementById("lbPrev");
  const nextBtn = document.getElementById("lbNext");
  const frames = [...document.querySelectorAll(".ph")];
  if (!dialog || !frames.length) return;

  let current = 0;

  const show = (i) => {
    current = (i + frames.length) % frames.length;
    const source = frames[current].querySelector("img");
    img.src = source.src;
    img.alt = source.alt;
    cap.textContent = frames[current].querySelector("figcaption")?.textContent || "";
    counter.textContent = `${String(current + 1).padStart(2, "0")} / ${String(frames.length).padStart(2, "0")}`;
    // nudge the neighbours into cache
    [current + 1, current - 1].forEach((n) => {
      const neighbour = frames[(n + frames.length) % frames.length].querySelector("img");
      new Image().src = neighbour.src;
    });
  };

  frames.forEach((f, i) => {
    f.addEventListener("click", () => { show(i); dialog.showModal(); });
  });
  prevBtn.addEventListener("click", () => show(current - 1));
  nextBtn.addEventListener("click", () => show(current + 1));
  dialog.addEventListener("keydown", (e) => {
    if (e.key === "ArrowRight") show(current + 1);
    if (e.key === "ArrowLeft") show(current - 1);
  });
})();
