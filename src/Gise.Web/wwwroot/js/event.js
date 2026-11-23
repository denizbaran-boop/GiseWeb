/* Etkinlik detayı: pick tiers → POST /api/orders/hold (10-minute hold) → card form → POST /api/orders/{code}/pay. */
(function () {
  const { $, $$, api, tl, esc, ic, toast, openSheet, closeSheet, sheetHead, busy, validateForm, bindValidation, applyServerErrors, setError } = G;
  const buy = $("#buy"); if (!buy) return;
  const eventId = +buy.dataset.eventId, signedIn = buy.dataset.signedIn === "1", canBuy = buy.dataset.canBuy === "1";
  const max = +buy.dataset.max;
  const qty = {};
  const tiers = () => $$(".tier[data-tier]", buy);
  let hold = null, paid = false, timer = null;

  function render() {
    let count = 0, total = 0;
    for (const t of tiers()) {
      const id = t.dataset.tier, n = qty[id] || 0, avail = +t.dataset.available;
      count += n; total += n * +t.dataset.price;
      const out = $("output", t); if (out) out.textContent = n;
    }
    for (const t of tiers()) {
      const n = qty[t.dataset.tier] || 0, avail = +t.dataset.available;
      const [minus, plus] = $$("button", t);
      if (minus) minus.disabled = n === 0;
      if (plus) plus.disabled = count >= max || n >= avail;
    }
    $("#totalLabel").textContent = count ? `${count} bilet` : "Toplam";
    $("#totalValue").textContent = tl(total);
    const btn = $("#checkoutBtn");
    btn.disabled = !count || !canBuy;
    if (canBuy) btn.textContent = count ? "Bilet Al" : (max === 0 ? "Bilet sınırına ulaştın" : "Bilet Seç");
    $("#buyErr").hidden = true;
  }
  const selection = () => Object.entries(qty).filter(([, n]) => n > 0).map(([tierId, quantity]) => ({ tierId: +tierId, quantity }));
  const showErr = msg => { const b = $("#buyErr"); b.hidden = false; $("span", b).textContent = msg; };

  buy.addEventListener("click", e => {
    const b = e.target.closest("[data-act]"); if (!b) return;
    if (b.dataset.act === "qty") {
      const id = b.closest(".tier").dataset.tier;
      qty[id] = Math.max(0, (qty[id] || 0) + +b.dataset.d);
      render();
    }
    if (b.dataset.act === "checkout") startCheckout(b);
  });

  /** Refresh availability after a conflict (someone else bought the last seats). */
  async function refreshTiers() {
    try {
      const ev = await api(`/api/events/${eventId}`);
      for (const t of ev.tiers) {
        const row = $(`.tier[data-tier="${t.id}"]`, buy); if (!row) continue;
        row.dataset.available = t.available;
        if ((qty[t.id] || 0) > t.available) qty[t.id] = t.available;
        if (t.available === 0) { $(".tier-main .footnote", row).innerHTML = '<span class="pill neutral">Tükendi</span>'; $(".stepper", row)?.remove(); }
      }
      render();
    } catch { /* keep the previous numbers */ }
  }

  async function startCheckout(btn) {
    const lines = selection();
    if (!signedIn) {
      const sec = lines.map(l => `${l.tierId}:${l.quantity}`).join(",");
      location.href = "/giris?returnUrl=" + encodeURIComponent(`/etkinlik/${eventId}?sec=${sec}&odeme=1`);
      return;
    }
    busy(btn, true, "Biletler ayrılıyor…");
    try {
      hold = await api("/api/orders/hold", { method: "POST", body: { eventId, lines } });
      paid = false;
      openCheckout(lines);
    } catch (err) {
      showErr(err.message);
      if (err.status === 409) refreshTiers();
    } finally {
      busy(btn, false); render();
    }
  }

  function lineRows(lines) {
    return lines.map(l => { const t = $(`.tier[data-tier="${l.tierId}"]`, buy); return `<div class="line"><span>${l.quantity} × ${esc(t.dataset.name)}</span><span>${tl(l.quantity * +t.dataset.price)}</span></div>`; }).join("");
  }

  function openCheckout(lines) {
    const html = `${sheetHead("Siparişi onayla")}
      <div class="hold-timer" id="holdTimer" role="timer" aria-live="off">${ic("clock", "i-sm", 2)}<span>Biletlerin <b id="holdLeft" class="num">10:00</b> boyunca senin için ayrıldı.</span></div>
      <div style="display:flex;gap:14px;align-items:center;margin-bottom:12px"><img src="${esc(buy.dataset.cover)}" alt="" style="width:56px;height:70px;border-radius:12px;object-fit:cover"><div><p class="headline">${esc(buy.dataset.title)}</p><p class="footnote">${esc(buy.dataset.meta)}</p></div></div>
      <div class="list no-icons" style="background:var(--fill);padding:4px 16px;border-radius:18px">${lineRows(lines)}
        <div class="line" style="border-top:1px solid var(--separator)"><span class="headline">Toplam</span><span class="headline">${tl(hold.total)}</span></div></div>
      <form id="payForm" novalidate data-error-box="#payErr">
        <p class="section-head" style="margin:20px 4px 8px">Kart bilgileri</p>
        <div class="grouped-fields pay-fields">
          <label class="sr" for="cardName">Kart üzerindeki ad</label>
          <input class="input" id="cardName" name="cardName" autocomplete="cc-name" placeholder="Kart üzerindeki ad" maxlength="60" data-val-required="Kart üzerindeki adı gir." data-val-length="Kart üzerindeki ad 3–60 karakter olmalı." data-val-length-min="3" data-val-length-max="60">
          <div class="sep"></div>
          <label class="sr" for="cardNumber">Kart numarası</label>
          <input class="input num" id="cardNumber" name="cardNumber" inputmode="numeric" autocomplete="cc-number" placeholder="Kart numarası" maxlength="23" data-val-required="Kart numarasını gir." data-val-luhn="Kart numarası geçerli değil; 16 haneyi kontrol et.">
          <div class="sep"></div>
          <div class="pay-row">
            <label class="sr" for="expiry">Son kullanma (AA/YY)</label>
            <input class="input num" id="expiry" name="expiry" inputmode="numeric" autocomplete="cc-exp" placeholder="AA/YY" maxlength="5" data-val-required="Son kullanma tarihini gir." data-val-expiry="Son kullanma tarihini AA/YY biçiminde gir.">
            <label class="sr" for="cvc">CVC</label>
            <input class="input num" id="cvc" name="cvc" inputmode="numeric" autocomplete="cc-csc" placeholder="CVC" maxlength="4" data-val-required="CVC kodunu gir." data-val-regex="CVC 3 ya da 4 haneli olmalı." data-val-regex-pattern="^\\d{3,4}$">
          </div>
        </div>
        <ul class="pay-errors">${["cardName", "cardNumber", "expiry", "cvc"].map(n => `<li class="field-error" data-valmsg-for="${n}"></li>`).join("")}</ul>
        <p class="msg err" id="payErr" hidden role="alert">${ic("info", "i-sm")}<span></span></p>
        <p class="caption test-cards">Test kartı <button type="button" class="link num" data-act="fillCard" data-v="4242 4242 4242 4242">4242 4242 4242 4242</button> · Reddedilen kart <button type="button" class="link num" data-act="fillCard" data-v="4000 0000 0000 0002">4000 0000 0000 0002</button></p>
        <button class="btn btn-primary btn-large btn-block" type="submit" id="payBtn" style="margin-top:14px">${tl(hold.total)} Öde</button>
        <p class="caption" style="text-align:center;margin-top:10px">${ic("lock", "i-sm")} Kart numaran saklanmaz; yalnızca son 4 hanesi siparişte görünür.</p>
      </form>`;
    const sheet = openSheet(html, { onClose: releaseIfUnpaid, label: "Siparişi onayla" });
    const form = $("#payForm", sheet);
    bindValidation(form);
    // Input masks.
    $("#cardNumber", form).addEventListener("input", e => { const d = e.target.value.replace(/\D/g, "").slice(0, 19); e.target.value = d.replace(/(.{4})/g, "$1 ").trim(); });
    $("#expiry", form).addEventListener("input", e => { let d = e.target.value.replace(/\D/g, "").slice(0, 4); if (d.length >= 3) d = d.slice(0, 2) + "/" + d.slice(2); e.target.value = d; });
    $("#cvc", form).addEventListener("input", e => { e.target.value = e.target.value.replace(/\D/g, "").slice(0, 4); });
    form.addEventListener("click", e => { const b = e.target.closest('[data-act="fillCard"]'); if (!b) return; const f = $("#cardNumber", form); f.value = b.dataset.v; setError(f, ""); if (!$("#cardName", form).value) $("#cardName", form).value = "Elif Kaya"; if (!$("#expiry", form).value) $("#expiry", form).value = "08/29"; if (!$("#cvc", form).value) $("#cvc", form).value = "123"; });
    form.addEventListener("submit", e => { e.preventDefault(); pay(form); });
    startTimer(hold.secondsLeft);
  }

  function startTimer(seconds) {
    clearInterval(timer);
    const endAt = Date.now() + seconds * 1000;
    const tick = () => {
      const left = Math.max(0, Math.round((endAt - Date.now()) / 1000));
      const el = $("#holdLeft"); if (!el) { clearInterval(timer); return; }
      el.textContent = `${String(Math.floor(left / 60)).padStart(2, "0")}:${String(left % 60).padStart(2, "0")}`;
      $("#holdTimer").classList.toggle("urgent", left <= 60);
      if (left === 0) { clearInterval(timer); expired("10 dakikalık rezervasyon süren doldu; biletleri yeniden seç."); }
    };
    tick(); timer = setInterval(tick, 1000);
  }

  function expired(msg) {
    hold = null; clearInterval(timer);
    const sheet = $(".sheet"); if (!sheet) return;
    sheet.innerHTML = `<div class="grabber" data-drag aria-hidden="true"></div>${sheetHead("Süre doldu")}
      <div class="empty" style="padding:24px 8px">${ic("clock")}<p class="headline">${esc(msg)}</p><p class="subhead">Ayırdığın biletler başka katılımcılara açıldı.</p>
      <button class="btn btn-primary" type="button" data-act="closeSheet">Yeniden Seç</button></div>`;
    refreshTiers();
  }

  async function pay(form) {
    if (!validateForm(form)) return;
    const btn = $("#payBtn", form);
    busy(btn, true, "Ödeme onaylanıyor…");
    const body = Object.fromEntries(new FormData(form));
    try {
      const res = await api(`/api/orders/${hold.code}/pay`, { method: "POST", body, timeout: 20000 });
      paid = true; clearInterval(timer);
      btn.innerHTML = `${ic("check", "i-sm", 2.6)} Ödendi`;
      location.href = res.redirect;
    } catch (err) {
      busy(btn, false);
      if (err.status === 410) { expired(err.message); return; }
      if (!applyServerErrors(form, err)) { const box = $("#payErr", form); box.hidden = false; $("span", box).textContent = err.message; }
    }
  }

  function releaseIfUnpaid() {
    clearInterval(timer);
    if (hold && !paid) {
      const code = hold.code; hold = null;
      api(`/api/orders/${code}`, { method: "DELETE", keepalive: true })
        .then(() => toast("Rezervasyon iptal edildi; biletler serbest bırakıldı."))
        .catch(() => { /* the server releases it automatically after 10 minutes */ });
    }
  }
  addEventListener("pagehide", () => { if (hold && !paid) api(`/api/orders/${hold.code}`, { method: "DELETE", keepalive: true }).catch(() => { }); });

  // Selection handed over from login or the assistant: ?sec=tierId:qty,...&odeme=1
  const params = new URLSearchParams(location.search);
  if (params.get("sec")) {
    for (const part of params.get("sec").split(",")) {
      const [id, n] = part.split(":").map(Number);
      const row = $(`.tier[data-tier="${id}"]`, buy);
      if (row && n > 0) qty[id] = Math.min(n, +row.dataset.available, max);
    }
    history.replaceState(null, "", location.pathname);
  }
  render();
  if (params.get("odeme") === "1" && signedIn && canBuy && selection().length) setTimeout(() => startCheckout($("#checkoutBtn")), 350);
})();
