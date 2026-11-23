/* Giriş Kontrolü: POST /api/organizer/checkin with a typed code or a camera-scanned QR (BarcodeDetector where supported). */
(function () {
  const { $, api, esc, ic, busy, setError } = G;
  const form = $("#checkinForm"); if (!form) return;
  const code = $("#code"), sel = $("#eventId"), result = $("#ciResult"), log = $("#ciLog");
  let first = true, stream = null, detecting = false;

  function counter(checkedIn, issued) {
    $("#ciCount").textContent = `${checkedIn} / ${issued}`;
    $("#ciBar").style.width = (issued ? Math.round(checkedIn / issued * 100) : 0) + "%";
  }
  async function stats() {
    try { const s = await api(`/api/organizer/events/${sel.value}/checkin-stats`); counter(s.checkedIn, s.issued); }
    catch (err) { $("#ciCount").textContent = "–"; }
  }
  function show(ok, title, sub) {
    result.hidden = false;
    result.className = "ci-result " + (ok ? "ok" : "bad");
    result.innerHTML = `<span class="ci-icon">${ic(ok ? "check" : "x", "", 2.6)}</span><div><p class="title3">${esc(title)}</p><p class="subhead">${esc(sub)}</p></div>`;
    result.animate([{ transform: "scale(.96)", opacity: 0 }, { transform: "none", opacity: 1 }], { duration: 220, easing: "ease-out" });
    if (navigator.vibrate) navigator.vibrate(ok ? 40 : [60, 40, 60]);
  }
  function addLog(ok, text) {
    if (first) { log.innerHTML = ""; first = false; }
    const time = new Date().toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
    log.insertAdjacentHTML("afterbegin", `<li class="row"><span class="pill ${ok ? "ok" : "bad"}">${ok ? "Geçerli" : "Red"}</span><div class="row-main"><p class="row-title">${esc(text)}</p></div><span class="caption num">${time}</span></li>`);
    while (log.children.length > 8) log.lastElementChild.remove();
  }

  async function check(value) {
    value = (value || code.value).trim();
    if (!value) { setError(code, "Bilet kodunu gir ya da QR okut."); code.focus(); return; }
    setError(code, "");
    const btn = form.querySelector('button[type="submit"]');
    busy(btn, true, "Kontrol…");
    try {
      const r = await api("/api/organizer/checkin", { method: "POST", body: { eventId: +sel.value, code: value } });
      show(true, `Giriş onaylandı: ${r.attendeeName}`, `${r.tierName} · ${r.code}`);
      addLog(true, `${r.attendeeName} · ${r.tierName}`);
      counter(r.checkedIn, r.issued);
      code.value = "";
    } catch (err) {
      show(false, "Giriş reddedildi", err.message);
      addLog(false, `${value.slice(0, 24)} · ${err.message}`);
    } finally { busy(btn, false); code.focus(); }
  }

  form.addEventListener("submit", e => { e.preventDefault(); check(); });
  sel.addEventListener("change", () => { history.replaceState(null, "", "/giris-kontrol?etkinlik=" + sel.value); result.hidden = true; stats(); });
  document.addEventListener("click", e => {
    const a = e.target.closest("[data-act]"); if (!a) return;
    if (a.dataset.act === "fillCode") { code.value = a.dataset.v; check(a.dataset.v); }
    if (a.dataset.act === "scan") stream ? stopCam() : startCam();
  });

  // Camera scanning where the browser supports the Barcode Detection API (Chrome/Edge on Android & macOS).
  if ("BarcodeDetector" in window && navigator.mediaDevices?.getUserMedia) $("#scanBtn").hidden = false;
  async function startCam() {
    const video = $("#cam");
    try {
      stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      video.srcObject = stream; video.hidden = false; await video.play();
      const detector = new BarcodeDetector({ formats: ["qr_code"] });
      detecting = true;
      const loop = async () => {
        if (!detecting) return;
        try { const codes = await detector.detect(video); if (codes.length) { stopCam(); check(codes[0].rawValue); return; } } catch { }
        requestAnimationFrame(loop);
      };
      loop();
    } catch (err) { show(false, "Kamera açılamadı", "Tarayıcıya kamera izni ver ya da kodu elle yaz."); stopCam(); }
  }
  function stopCam() { detecting = false; stream?.getTracks().forEach(t => t.stop()); stream = null; $("#cam").hidden = true; }

  stats();
})();
