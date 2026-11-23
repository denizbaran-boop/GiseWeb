/* Keşfet: filters call GET /api/events and re-render the grid without reloading the page. */
(function () {
  const { $, $$, api, card, debounce, ic, esc } = G;
  const form = $("#filters"), grid = $("#grid"), count = $("#count"), q = $("#q"), sort = $("#sort"), maxPrice = $("#maxPrice"), cat = $("#kategori");
  if (!form) return;
  let seq = 0;

  async function load() {
    const id = ++seq;
    const params = new URLSearchParams();
    if (q.value.trim()) params.set("q", q.value.trim());
    if (cat.value) params.set("category", cat.value);
    if (sort.value !== "date") params.set("sort", sort.value);
    if (maxPrice.value) params.set("maxPrice", maxPrice.value);

    // Keep the address bar shareable (same Turkish names the server understands).
    const pretty = new URLSearchParams();
    if (params.get("q")) pretty.set("q", params.get("q"));
    if (cat.value) pretty.set("kategori", cat.value);
    if (sort.value !== "date") pretty.set("sirala", sort.value);
    if (maxPrice.value) pretty.set("enFazla", maxPrice.value);
    history.replaceState(null, "", "/" + (pretty.toString() ? "?" + pretty : ""));

    const recs = $("#recs"); if (recs) recs.hidden = !!(params.get("q") || cat.value || maxPrice.value);
    grid.setAttribute("aria-busy", "true");
    try {
      const list = await api("/api/events?" + params);
      if (id !== seq) return; // a newer request already answered
      count.textContent = `${list.length} etkinlik`;
      grid.innerHTML = list.length ? list.map(card).join("") :
        `<div class="empty">${ic("search")}<p class="headline">Eşleşen etkinlik yok</p><p class="subhead">Başka bir kelime dene ya da filtreleri kaldır.</p><button class="btn btn-gray" type="button" data-act="clearFilters">Filtreleri Temizle</button></div>`;
    } catch (err) {
      if (id !== seq) return;
      grid.innerHTML = `<div class="empty">${ic("info")}<p class="headline">Etkinlikler yüklenemedi</p><p class="subhead">${esc(err.message)}</p><button class="btn btn-gray" type="button" data-act="retry">Tekrar Dene</button></div>`;
    } finally {
      if (id === seq) grid.setAttribute("aria-busy", "false");
    }
  }

  const loadSoon = debounce(load, 250);
  q.addEventListener("input", loadSoon);
  sort.addEventListener("change", load);
  maxPrice.addEventListener("change", load);
  form.addEventListener("submit", e => { e.preventDefault(); load(); });

  document.addEventListener("click", e => {
    const chip = e.target.closest(".chip[data-cat]");
    if (chip) {
      e.preventDefault();
      cat.value = chip.dataset.cat;
      $$(".chip[data-cat]").forEach(c => c.setAttribute("aria-pressed", String(c === chip)));
      load();
      return;
    }
    const a = e.target.closest("[data-act]"); if (!a) return;
    if (a.dataset.act === "clearFilters") {
      e.preventDefault();
      q.value = ""; cat.value = ""; sort.value = "date"; maxPrice.value = "";
      $$(".chip[data-cat]").forEach(c => c.setAttribute("aria-pressed", String(c.dataset.cat === "")));
      load();
    }
    if (a.dataset.act === "retry") load();
  });
})();
