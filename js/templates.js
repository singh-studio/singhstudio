(() => {
  const KEYS = { all: "All", trades: 1, cafes: 1, practice: 1, community: 1, events: 1, creative: 1, retail: 1 };
  const grid = document.getElementById("tpGrid");
  const status = document.getElementById("tpStatus");
  const chipsBox = document.getElementById("tpChips");
  const chips = [...chipsBox.querySelectorAll(".tp-chip")];
  const cards = [...grid.querySelectorAll(".tp-card[data-type]")];
  const help = grid.querySelector(".tp-help");

  function apply(key) {
    if (!(key in KEYS)) key = "all";
    let n = 0;
    cards.forEach((c) => {
      const show = key === "all" || c.dataset.type === key;
      c.hidden = !show;
      c.classList.toggle("tp-wide", show && (key !== "all" || c === cards[0]));
      if (show) n++;
    });
    help.hidden = false;
    grid.dataset.view = key;
    chips.forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.key === key)));
    status.textContent = "Showing " + n + (n === 1 ? " template" : " templates");
    return key;
  }

  function keepChipInView(chip) {
    // Nudge the chip row sideways only, never the page or focus.
    const box = chipsBox;
    const l = chip.offsetLeft, r = l + chip.offsetWidth;
    const pad = 40;
    if (l - pad < box.scrollLeft) box.scrollTo({ left: l - pad, behavior: "smooth" });
    else if (r + pad > box.scrollLeft + box.clientWidth) box.scrollTo({ left: r + pad - box.clientWidth, behavior: "smooth" });
  }

  chips.forEach((b) => b.addEventListener("click", () => {
    const key = apply(b.dataset.key);
    const url = key === "all" ? location.pathname + location.search : "#" + key;
    try { history.replaceState(null, "", url); } catch (e) { /* file:// or sandbox */ }
    keepChipInView(b);
  }));

  const fromHash = () => {
    const k = apply(location.hash.slice(1));
    const chip = chips.find((b) => b.dataset.key === k);
    if (chip) requestAnimationFrame(() => keepChipInView(chip));
  };
  window.addEventListener("hashchange", fromHash);
  fromHash();

  // Sticky filter bar follows the nav's hide/show.
  const nav = document.getElementById("nav");
  const root = document.documentElement;
  const measure = () => root.style.setProperty("--tp-nav-h", nav.offsetHeight + "px");
  const sync = () => root.classList.toggle("tp-nav-hidden", nav.classList.contains("hidden"));
  measure(); sync();
  new MutationObserver(sync).observe(nav, { attributes: true, attributeFilter: ["class"] });
  addEventListener("resize", measure);
  addEventListener("load", measure);
})();
