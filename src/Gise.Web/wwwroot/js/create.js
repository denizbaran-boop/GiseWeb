/* Yeni Etkinlik: live preview card, dynamic ticket tiers, client validation, "AI ile yaz" (POST /api/organizer/copy). */
(function () {
  const { $, $$, api, card, validateForm, setError, busy, toast } = G;
  const form = $("#cf"); if (!form) return;
  const box = $("#tierBox"), tpl = $("#tierTpl"), addBtn = $("#addTier");
  const MAX_TIERS = 5;
  let uploadUrl = null;

  const val = id => (form.querySelector(`#${id}`)?.value || "").trim();
  const MON = ["OCA", "ŞUB", "MAR", "NİS", "MAY", "HAZ", "TEM", "AĞU", "EYL", "EKİ", "KAS", "ARA"];
  const DAY = ["Paz", "Pzt", "Sal", "Çar", "Per", "Cum", "Cmt"];
  const MONS = ["Oca", "Şub", "Mar", "Nis", "May", "Haz", "Tem", "Ağu", "Eyl", "Eki", "Kas", "Ara"];

  function preview() {
    const d = val("Date") ? new Date(val("Date") + "T" + (val("Time") || "20:00")) : new Date(Date.now() + 14 * 864e5);
    const prices = $$("[data-f=price]", box).map(i => +i.value.replace(/\D/g, "")).filter(n => n > 0);
    const caps = $$("[data-f=cap]", box).map(i => +i.value.replace(/\D/g, "")).filter(n => n > 0);
    const cover = uploadUrl || `/img/covers/${form.querySelector('input[name="CoverPreset"]:checked')?.value || 1}.jpg`;
    const html = card({
      url: "#", title: val("Title") || "Etkinlik adı", venue: val("Venue") || "Mekân", district: val("District") || "İlçe",
      category: val("Category"), cover, dayNum: d.getDate(), month: MON[d.getMonth()],
      shortDate: `${DAY[d.getDay()]}, ${d.getDate()} ${MONS[d.getMonth()]} · ${val("Time") || "20:00"}`,
      priceFrom: prices.length ? Math.min(...prices) : 0, left: caps.reduce((a, b) => a + b, 0) || 999
    });
    $("#pv").innerHTML = html.replace('href="#"', 'href="#" tabindex="-1" aria-hidden="true"');
  }

  /** Keeps Tiers[i].Name / Tiers[i].Price / Tiers[i].Capacity indexes continuous so model binding works. */
  function reindex() {
    const rows = $$("[data-row]", box);
    rows.forEach((row, i) => {
      for (const input of $$("input", row)) {
        const prop = input.dataset.n || input.name.split(".").pop();
        input.dataset.n = prop;
        input.name = `Tiers[${i}].${prop}`;
        input.id = `Tiers_${i}__${prop}`;
        const label = input.closest(".field").querySelector("label"); if (label) label.htmlFor = input.id;
        const err = input.closest(".field").querySelector("[data-valmsg-for]"); if (err) err.dataset.valmsgFor = input.name;
      }
      $('[data-act="rmTier"]', row).disabled = rows.length < 2;
    });
    addBtn.hidden = rows.length >= MAX_TIERS;
  }

  form.addEventListener("input", e => {
    const t = e.target;
    if (t.dataset.f === "price" || t.dataset.f === "cap") t.value = t.value.replace(/\D/g, "").slice(0, 6);
    preview();
  });
  form.addEventListener("change", e => {
    if (e.target.name === "CoverPreset") { uploadUrl = null; $("#CoverUpload").value = ""; preview(); }
    if (e.target.id === "CoverUpload") {
      const f = e.target.files[0]; if (!f) return;
      if (f.size > 3 * 1024 * 1024) { setError(e.target, "Kapak görseli en fazla 3 MB olabilir."); e.target.value = ""; return; }
      if (!["image/jpeg", "image/png", "image/webp"].includes(f.type)) { setError(e.target, "Kapak görseli JPG, PNG ya da WEBP olmalı."); e.target.value = ""; return; }
      setError(e.target, "");
      uploadUrl = URL.createObjectURL(f);
      $$('input[name="CoverPreset"]', form).forEach(r => r.checked = false);
      preview();
    }
  });

  form.addEventListener("click", async e => {
    const a = e.target.closest("[data-act]"); if (!a) return;
    if (a.dataset.act === "addTier") {
      const row = tpl.content.firstElementChild.cloneNode(true);
      box.insertBefore(row, addBtn); reindex(); $("input", row).focus();
    }
    if (a.dataset.act === "rmTier") { a.closest("[data-row]").remove(); reindex(); preview(); }
    if (a.dataset.act === "aiCopy") aiCopy(a);
  });

  // Publish validates everything; "draft" only needs a title.
  form.addEventListener("submit", e => {
    const intent = e.submitter?.dataset.intent || "publish";
    if (intent === "draft") {
      if (!val("Title")) { e.preventDefault(); setError($("#Title"), "Taslak için en az etkinlik adını gir."); $("#Title").focus(); }
      return;
    }
    if (!validateForm(form)) {
      e.preventDefault();
      const s = $("#cErr"); s.innerHTML = "<span>Yayınlamadan önce işaretli alanları düzelt.</span>"; s.classList.add("show");
      return;
    }
    busy(e.submitter, true, "Yayınlanıyor…");
  });

  // FR-07 / NFR-05: AI copy with a visible loading state and graceful failure.
  async function aiCopy(btn) {
    const title = $("#Title");
    if (val("Title").length < 3) { setError(title, "Önce etkinlik adını yaz (en az 3 karakter)."); title.focus(); return; }
    const desc = $("#Description"), before = desc.value, tagsBefore = $("#Tags").value;
    busy(btn, true, "Yazılıyor…");
    const note = $("#aiNote");
    try {
      const r = await api("/api/organizer/copy", { method: "POST", timeout: 8000, body: { title: val("Title"), category: val("Category"), venue: val("Venue"), district: val("District") } });
      desc.value = r.description + "\n\n" + r.rules;
      if (!val("Tags")) $("#Tags").value = r.tags;
      setError(desc, "");
      note.hidden = false;
      note.textContent = r.source === "llm" ? "Metin yapay zekâ ile oluşturuldu; yayınlamadan önce gözden geçir." : "LLM anahtarı tanımlı olmadığı için hazır şablon kullanıldı; metni düzenleyebilirsin.";
      desc.animate([{ background: "var(--accent-soft)" }, { background: "transparent" }], { duration: 900 });
      if (before.trim()) toast("Açıklama AI metniyle değiştirildi.", () => { desc.value = before; $("#Tags").value = tagsBefore; });
    } catch (err) {
      note.hidden = false;
      note.textContent = "AI şu an yanıt vermiyor; açıklamayı kendin yazabilirsin. (" + err.message + ")";
      toast("AI metni alınamadı; formu doldurmaya devam edebilirsin.", null, "bad");
    } finally { busy(btn, false); }
  }

  reindex(); preview();
  // Server-side validation errors from a failed post: show the summary box.
  const summary = $("#cErr"); if (summary && summary.querySelector("li")) { summary.classList.add("show"); summary.scrollIntoView({ block: "center" }); }
})();
