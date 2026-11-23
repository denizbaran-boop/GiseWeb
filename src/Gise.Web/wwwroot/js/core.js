/* Gişe — shared client code: fetch wrapper, validation, toasts, sheets, theme, icons.
   Every page script uses window.G. No frameworks; plain ES2020. */
(function () {
  "use strict";
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const num = n => Number(n).toLocaleString("tr-TR");
  const tl = n => "₺" + num(n);
  const debounce = (fn, ms = 250) => { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; };

  /* ---------- icons (same paths as Helpers/Ui.cs) ---------- */
  const P = {
    search: '<circle cx="10.5" cy="10.5" r="6.5"/><path d="m15.5 15.5 4.5 4.5"/>',
    check: '<path d="m5 12.5 4.5 4.5L19 7.5"/>', x: '<path d="m6.5 6.5 11 11M17.5 6.5l-11 11"/>',
    info: '<circle cx="12" cy="12" r="8.5"/><path d="M12 11v5.5M12 7.8v.2"/>',
    slash: '<circle cx="12" cy="12" r="8.5"/><path d="m6 6 12 12"/>',
    chevR: '<path d="m9.5 5 7 7-7 7"/>', card: '<rect x="3" y="5.5" width="18" height="13" rx="3"/><path d="M3 10h18M7 15h3"/>',
    clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>', lock: '<rect x="5" y="10.5" width="14" height="10" rx="3"/><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2.8v2M12 19.2v2M2.8 12h2M19.2 12h2M5.5 5.5l1.4 1.4M17.1 17.1l1.4 1.4M5.5 18.5l1.4-1.4M17.1 6.9l1.4-1.4"/>',
    moon: '<path d="M19.5 14.5A7.8 7.8 0 0 1 9.5 4.5a7.8 7.8 0 1 0 10 10z"/>',
    sparkle: '<path d="M12 3.5c.6 4.4 2.1 5.9 6.5 6.5-4.4.6-5.9 2.1-6.5 6.5-.6-4.4-2.1-5.9-6.5-6.5 4.4-.6 5.9-2.1 6.5-6.5z"/>',
    arrowUp: '<path d="M12 19V5M6 11l6-6 6 6"/>', mic: '<rect x="9" y="3.5" width="6" height="11" rx="3"/><path d="M5.5 11.5a6.5 6.5 0 0 0 13 0M12 18v3"/>',
    globe: '<circle cx="12" cy="12" r="8.5"/><path d="M3.5 12h17M12 3.5c2.5 2.6 3.5 5.6 3.5 8.5s-1 5.9-3.5 8.5c-2.5-2.6-3.5-5.6-3.5-8.5s1-5.9 3.5-8.5z"/>',
    newchat: '<path d="M13 4.5H7.5a3 3 0 0 0-3 3v9a3 3 0 0 0 3 3h9a3 3 0 0 0 3-3V11"/><path d="M17.5 3.5l3 3-7.5 7.5H10v-3z"/>',
    ticket: '<path d="M4 7.5A2.5 2.5 0 0 1 6.5 5h11A2.5 2.5 0 0 1 20 7.5v2a2.5 2.5 0 0 0 0 5v2a2.5 2.5 0 0 1-2.5 2.5h-11A2.5 2.5 0 0 1 4 16.5v-2a2.5 2.5 0 0 0 0-5z"/>',
    refresh: '<path d="M19.5 12a7.5 7.5 0 1 1-2.2-5.3"/><path d="M19.5 4.5v4h-4"/>'
  };
  const ic = (n, cls = "", w = 1.8) => `<span class="i ${cls}" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round">${P[n] || ""}</svg></span>`;
  const AV = [["#FF5C8A", "#C81E52"], ["#5E5CE6", "#3634A3"], ["#30B0C7", "#0A7C8C"], ["#FF9F0A", "#C93400"], ["#34C759", "#1F7A35"], ["#BF5AF2", "#8944AB"]];
  const avatarBg = n => { let h = 0; for (const c of n) h = (h * 31 + c.charCodeAt(0)) >>> 0; const p = AV[h % AV.length]; return `linear-gradient(145deg,${p[0]},${p[1]})`; };
  const initials = n => n.split(" ").filter(Boolean).map(p => p[0]).slice(0, 2).join("").toLocaleUpperCase("tr-TR");
  const avatar = n => `<span class="avatar" style="background:${avatarBg(n)}" aria-hidden="true">${esc(initials(n))}</span>`;

  /* ---------- motion: Apple-style springs as CSS linear() ---------- */
  function springCurve(response = .4, damping = 1) {
    const w = 2 * Math.PI / response, wd = w * Math.sqrt(Math.max(1 - damping * damping, 1e-6));
    const x = t => damping < 1 ? 1 - Math.exp(-damping * w * t) * (Math.cos(wd * t) + (damping * w / wd) * Math.sin(wd * t)) : 1 - Math.exp(-w * t) * (1 + w * t);
    let T = .1; for (; T < 3; T += .01) { let ok = true; for (let t = T; t < T + .25; t += .02) { if (Math.abs(1 - x(t)) > .002) { ok = false; break; } } if (ok) break; }
    const pts = []; for (let i = 0; i <= 48; i++) pts.push(+x(T * i / 48).toFixed(4)); pts[48] = 1;
    return { easing: `linear(${pts.join(",")})`, duration: Math.round(T * 1000) };
  }
  const LINEAR_OK = typeof CSS !== "undefined" && CSS.supports && CSS.supports("animation-timing-function", "linear(0, 1)");
  const REDUCED = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
  const spring = (r, d) => { const s = springCurve(r, d); return LINEAR_OK ? s : { easing: "cubic-bezier(.2,.8,.2,1)", duration: Math.min(s.duration, 450) }; };

  /* ---------- API: fetch + CSRF + timeout + ProblemDetails ---------- */
  class ApiError extends Error {
    constructor(status, title, errors) { super(title); this.status = status; this.errors = errors || {}; }
  }
  const csrf = () => $('meta[name="csrf-token"]')?.content || "";

  async function api(url, { method = "GET", body, timeout = 12000, keepalive = false } = {}) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), timeout);
    let res;
    try {
      res = await fetch(url, {
        method, keepalive, signal: ctrl.signal, credentials: "same-origin",
        headers: { "Accept": "application/json", ...(body !== undefined ? { "Content-Type": "application/json" } : {}), ...(method !== "GET" ? { "X-CSRF-TOKEN": csrf() } : {}) },
        body: body !== undefined ? JSON.stringify(body) : undefined
      });
    } catch (e) {
      throw new ApiError(0, e.name === "AbortError" ? "Sunucu zamanında yanıt vermedi. Tekrar dene." : "Bağlantı kurulamadı. İnternetini kontrol edip tekrar dene.");
    } finally { clearTimeout(timer); }

    if (res.status === 204) return null;
    const type = res.headers.get("content-type") || "";
    const data = type.includes("json") ? await res.json().catch(() => null) : null;
    if (res.ok) return data;

    if (res.status === 401) { G.toast("Oturumun sona erdi; yeniden giriş yap."); setTimeout(() => location.href = "/giris?returnUrl=" + encodeURIComponent(location.pathname + location.search), 1200); }
    const errors = {};
    if (data?.errors) for (const [k, v] of Object.entries(data.errors)) errors[normKey(k)] = Array.isArray(v) ? v[0] : String(v);
    const fallback = { 400: "Gönderilen bilgileri kontrol et.", 403: "Bu işlem için yetkin yok.", 404: "Aradığın kayıt bulunamadı.", 409: "Bu işlem şu an yapılamıyor.", 429: "Çok fazla deneme yaptın; biraz bekle.", 500: "Sunucuda bir hata oluştu. Tekrar dene." };
    let title = data?.title || fallback[res.status] || "Bir şeyler ters gitti.";
    if (title === "One or more validation errors occurred.") title = Object.values(errors)[0] || fallback[400];
    throw new ApiError(res.status, title, errors);
  }
  const normKey = k => { k = k.replace(/^\$\.?/, ""); const last = k.split(".").pop(); return last.charAt(0).toLowerCase() + last.slice(1); };

  /* ---------- validation: reads the data-val-* attributes ASP.NET generates from DataAnnotations ---------- */
  const visible = el => !!(el.offsetWidth || el.offsetHeight || el.getClientRects().length) && !el.closest("[hidden]");
  function ruleFor(el) {
    const d = el.dataset, v = el.type === "checkbox" ? el.checked : el.value.trim();
    if (el.disabled || (el.type !== "hidden" && !visible(el) && el.type !== "checkbox")) return "";
    if (d.valRequired !== undefined && el.type !== "checkbox" && v === "") return d.valRequired;
    if (d.valRequiredif !== undefined && visible(el) && v === "") return d.valRequiredif;
    if (d.valMustbetrue !== undefined && !v) return d.valMustbetrue;
    if (v === "" || v === false) return "";
    if (d.valLength !== undefined) { const min = +(d.valLengthMin || 0), max = +(d.valLengthMax || 1e9); if (v.length < min || v.length > max) return d.valLength; }
    if (d.valMaxlength !== undefined && v.length > +d.valMaxlengthMax) return d.valMaxlength;
    if (d.valMinlength !== undefined && v.length < +d.valMinlengthMin) return d.valMinlength;
    if (d.valRegex !== undefined && !new RegExp(d.valRegexPattern).test(v)) return d.valRegex;
    if (d.valEmail !== undefined && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)) return d.valEmail;
    if (d.valRange !== undefined) { const n = Number(v.replace(/\./g, "")); if (!Number.isFinite(n) || n < +d.valRangeMin || n > +d.valRangeMax) return d.valRange; }
    if (d.valLuhn !== undefined && !luhn(v)) return d.valLuhn;
    if (d.valExpiry !== undefined) { const m = /^(\d{2})\/(\d{2})$/.exec(v); if (!m || +m[1] < 1 || +m[1] > 12) return d.valExpiry; const end = new Date(2000 + +m[2], +m[1], 1); if (end <= new Date()) return "Kartının son kullanma tarihi geçmiş."; }
    if (d.valNumber !== undefined && !/^-?\d+$/.test(v)) return d.valNumber;
    if (d.valEqualto !== undefined || d.valEqualtoOther) {
      const other = (d.valEqualtoOther || "").replace(/^\*\./, "");
      const o = el.form?.querySelector(`[name="${other}" i],[name$=".${other}" i]`);
      if (o && o.value !== el.value) return d.valEqualto || "Değerler aynı değil.";
    }
    if (el.dataset.check && el.validationMessageCustom) return el.validationMessageCustom;
    return "";
  }
  function luhn(s) {
    if (/[^\d ]/.test(s)) return false;
    const d = s.replace(/\D/g, ""); if (d.length < 13 || d.length > 19) return false;
    let sum = 0; for (let i = 0; i < d.length; i++) { let x = +d[d.length - 1 - i]; if (i % 2) { x *= 2; if (x > 9) x -= 9; } sum += x; }
    return sum % 10 === 0;
  }
  function msgEl(el) {
    const f = el.form || el.closest("form") || document;
    return $$(`[data-valmsg-for]`, f).find(s => s.dataset.valmsgFor.toLowerCase() === el.name.toLowerCase()) || null;
  }
  function setError(el, msg) {
    el.setAttribute("aria-invalid", msg ? "true" : "false");
    const s = msgEl(el);
    if (s) {
      if (!s.dataset.hint) s.dataset.hint = s.classList.contains("msg") ? s.textContent : "";
      s.textContent = msg || s.dataset.hint || "";
      s.classList.toggle("field-validation-error", !!msg);
      if (s.classList.contains("msg")) s.style.color = msg ? "var(--bad)" : "var(--label-2)";
      if (s.id) el.setAttribute("aria-describedby", s.id); else { s.id = "e-" + Math.random().toString(36).slice(2, 8); el.setAttribute("aria-describedby", s.id); }
    }
    return !msg;
  }
  function errorBox(form, msg) {
    const sel = form.dataset.errorBox; if (!sel) return;
    const box = $(sel); if (!box) return;
    if (!msg && box.dataset.hint === undefined) { box.hidden = true; return; }
    if (box.dataset.hint === undefined && !box.hidden && box.textContent.trim() && !box.classList.contains("err")) box.dataset.hint = box.textContent;
    const span = box.querySelector("span:last-child") || box;
    if (msg) { box.hidden = false; box.classList.add("err"); box.classList.remove("okm"); box.style.color = ""; span.textContent = msg; }
    else if (box.dataset.hint) { box.classList.remove("err"); box.style.color = "var(--label-2)"; span.textContent = box.dataset.hint; }
    else { box.hidden = true; span.textContent = ""; }
  }
  const fields = form => $$("input[name],select[name],textarea[name]", form).filter(el => el.type !== "hidden" || el.dataset.val);
  function validateField(el) { return setError(el, ruleFor(el)); }
  function validateForm(form) {
    let first = null, firstMsg = "";
    for (const el of fields(form)) { const m = ruleFor(el); setError(el, m); if (m && !first) { first = el; firstMsg = m; } }
    errorBox(form, first && !msgEl(first) ? firstMsg : ""); // the box is only for fields without their own message
    if (first) first.focus({ preventScroll: false });
    return !first;
  }
  function bindValidation(form) {
    form.addEventListener("focusout", e => { const el = e.target; if (el.name && el.matches("input,select,textarea")) { el.dataset.touched = "1"; validateField(el); } });
    form.addEventListener("input", e => { const el = e.target; if (el.dataset.touched || el.getAttribute("aria-invalid") === "true") validateField(el); if (form.dataset.errorBox) errorBox(form, ""); });
    form.addEventListener("change", e => { if (e.target.type === "checkbox") validateField(e.target); });
  }
  /** Shows ProblemDetails field errors next to the matching inputs; returns true if any matched. */
  function applyServerErrors(form, err) {
    let matched = false, shownInline = true;
    for (const [k, msg] of Object.entries(err.errors || {})) {
      const el = fields(form).find(x => x.name.toLowerCase() === k.toLowerCase() || x.name.toLowerCase().endsWith("." + k.toLowerCase()));
      if (!el) continue;
      setError(el, msg); if (!matched) el.focus(); matched = true;
      if (!msgEl(el)) shownInline = false;
    }
    // Inline messages are enough when every matched field has its own; otherwise use the form's error box.
    errorBox(form, matched && shownInline ? "" : err.message);
    return matched;
  }
  function busy(btn, on, label) {
    if (!btn) return;
    if (on) { btn.dataset.label = btn.innerHTML; btn.disabled = true; btn.setAttribute("aria-busy", "true"); btn.innerHTML = `<span class="spinner" aria-hidden="true"></span>${esc(label || "Bekle…")}`; }
    else { btn.disabled = false; btn.removeAttribute("aria-busy"); if (btn.dataset.label) btn.innerHTML = btn.dataset.label; }
  }

  /* ---------- toast ---------- */
  let toastT = null;
  function toast(msg, undo, tone) {
    $$(".toast").forEach(t => t.remove());
    const t = document.createElement("div"); t.className = "toast glass" + (tone ? " toast-" + tone : ""); t.setAttribute("role", tone === "bad" ? "alert" : "status");
    t.innerHTML = `<span>${esc(msg)}</span>${undo ? `<button class="btn btn-plain btn-sm" type="button">Geri Al</button>` : '<span style="width:8px"></span>'}`;
    document.body.appendChild(t);
    const sp = spring(.35, 1); if (!REDUCED()) t.animate([{ transform: "translate(-50%,24px)", opacity: 0 }, { transform: "translate(-50%,0)", opacity: 1 }], { duration: sp.duration, easing: sp.easing });
    if (undo) $("button", t).onclick = () => { t.remove(); undo(); };
    clearTimeout(toastT); toastT = setTimeout(() => { t.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 200 }).onfinish = () => t.remove(); }, undo ? 5000 : 3200);
  }

  /* ---------- bottom sheet (drag to dismiss) ---------- */
  let sheetEl = null, scrimEl = null, onCloseCb = null, lastFocus = null;
  function openSheet(html, { onClose, label = "Pencere" } = {}) {
    closeSheet(true);
    lastFocus = document.activeElement;
    const L = $("#layer");
    L.innerHTML = `<div class="overlay"><div class="scrim" data-act="closeSheet"></div><div class="sheet glass" role="dialog" aria-modal="true" aria-label="${esc(label)}"><div class="grabber" data-drag aria-hidden="true"></div>${html}</div></div>`;
    sheetEl = $(".sheet", L); scrimEl = $(".scrim", L); onCloseCb = onClose || null;
    document.body.classList.add("sheet-open");
    const sp = spring(.32, .86);
    if (REDUCED()) sheetEl.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 200 });
    else sheetEl.animate([{ transform: "translateY(105%)" }, { transform: "translateY(0)" }], { duration: sp.duration, easing: sp.easing });
    scrimEl.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 250, fill: "forwards" });
    bindDrag(sheetEl);
    setTimeout(() => { const f = sheetEl && sheetEl.querySelector("input:not([type=hidden]),select,textarea,button:not([data-act=closeSheet])"); f && f.focus({ preventScroll: true }); }, 60);
    return sheetEl;
  }
  const currentY = el => new DOMMatrixReadOnly(getComputedStyle(el).transform).m42;
  function closeSheet(instant = false, velocity = 0) {
    if (!sheetEl) return;
    const el = sheetEl, sc = scrimEl, cb = onCloseCb; sheetEl = null; scrimEl = null; onCloseCb = null;
    document.body.classList.remove("sheet-open");
    if (cb) try { cb(); } catch (e) { console.error(e); }
    if (lastFocus && document.contains(lastFocus)) lastFocus.focus({ preventScroll: true });
    if (instant) { $("#layer").innerHTML = ""; return; }
    const from = currentY(el), h = el.offsetHeight + 40, sp = spring(.3, 1);
    const a = REDUCED() ? el.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 160, fill: "forwards" }) : el.animate([{ transform: `translateY(${from}px)` }, { transform: `translateY(${h}px)` }], { duration: Math.max(180, sp.duration * (velocity > 1500 ? .6 : 1)), easing: sp.easing, fill: "forwards" });
    sc.animate([{ opacity: getComputedStyle(sc).opacity }, { opacity: 0 }], { duration: 220, fill: "forwards" });
    a.onfinish = () => { if (!sheetEl) $("#layer").innerHTML = ""; };
  }
  function bindDrag(el) {
    let start = 0, y = 0, hist = [], dragging = false;
    const rubber = (o, dim, c = .55) => (o * dim * c) / (dim + c * Math.abs(o));
    el.addEventListener("pointerdown", e => {
      if (!e.target.closest("[data-drag]") || e.target.closest("button")) return;
      dragging = true; el.setPointerCapture(e.pointerId);
      el.getAnimations().forEach(a => { const cy = currentY(el); a.cancel(); el.style.transform = `translateY(${cy}px)`; });
      start = e.clientY - currentY(el); hist = [{ y: e.clientY, t: performance.now() }];
    });
    el.addEventListener("pointermove", e => {
      if (!dragging) return; let dy = e.clientY - start; if (dy < 0) dy = rubber(dy, el.offsetHeight);
      y = dy; el.style.transform = `translateY(${y}px)`; hist.push({ y: e.clientY, t: performance.now() }); if (hist.length > 6) hist.shift();
      if (scrimEl) scrimEl.style.opacity = String(Math.max(0, 1 - y / el.offsetHeight));
    });
    const end = () => {
      if (!dragging) return; dragging = false;
      const a = hist[0], b = hist[hist.length - 1]; const v = b.t > a.t ? (b.y - a.y) / ((b.t - a.t) / 1000) : 0;
      const projected = y + (v / 1000) * .998 / (1 - .998);
      if (projected > el.offsetHeight * .5 || v > 900) closeSheet(false, v);
      else { const sp = spring(.32, .8); el.animate([{ transform: `translateY(${y}px)` }, { transform: "translateY(0)" }], { duration: sp.duration, easing: sp.easing }); el.style.transform = ""; if (scrimEl) scrimEl.style.opacity = ""; }
    };
    el.addEventListener("pointerup", end); el.addEventListener("pointercancel", end);
  }
  const sheetHead = title => `<div class="sheet-head" data-drag><h2 class="title2">${esc(title)}</h2><button class="icon-btn" type="button" data-act="closeSheet" aria-label="Kapat">${ic("x", "i-sm", 2.2)}</button></div>`;

  /* ---------- theme ---------- */
  const themeGet = () => { try { return localStorage.getItem("gise-theme") || "system"; } catch (e) { return "system"; } };
  const isDark = () => { const t = themeGet(); return t === "dark" || (t === "system" && matchMedia("(prefers-color-scheme: dark)").matches); };
  function paintTheme() {
    const t = themeGet(), r = document.documentElement;
    if (t === "system") r.removeAttribute("data-theme"); else r.setAttribute("data-theme", t);
    const dk = isDark();
    $$(".theme-btn").forEach(b => { b.innerHTML = ic(dk ? "sun" : "moon", "", 2); b.setAttribute("aria-label", dk ? "Açık moda geç" : "Koyu moda geç"); b.title = dk ? "Açık mod" : "Koyu mod"; });
    $$('[data-act="theme"]').forEach(b => b.setAttribute("aria-pressed", String(b.dataset.v === t)));
  }
  function setTheme(t) {
    try { localStorage.setItem("gise-theme", t); } catch (e) { }
    if (document.startViewTransition && !REDUCED()) document.startViewTransition(paintTheme); else paintTheme();
  }
  matchMedia("(prefers-color-scheme: dark)").addEventListener("change", paintTheme);

  /* ---------- event card (mirrors Views/Shared/_EventCard.cshtml) ---------- */
  function card(e) {
    const low = e.left > 0 && e.left <= 50;
    return `<a class="card" href="${e.url}" aria-label="${esc(e.title)}, ${esc(e.shortDate)}, ${esc(e.venue)}">
      <div class="cover"><img src="${esc(e.cover)}" alt="" loading="lazy"><div class="date-badge" aria-hidden="true"><b class="num">${e.dayNum}</b><span>${esc(e.month)}</span></div>
      <span class="cover-shade" aria-hidden="true"></span><span class="cover-cat" aria-hidden="true">${esc(e.category)}</span></div>
      <div class="card-body"><h3 class="card-title">${esc(e.title)}</h3><p class="card-meta">${esc(e.shortDate)}</p><p class="card-meta">${esc(e.venue)}, ${esc(e.district)}</p>
      <div class="card-foot"><span class="price num">${tl(e.priceFrom)}<small>'den başlayan</small></span>${e.left === 0 ? '<span class="pill neutral">Tükendi</span>' : low ? `<span class="pill warn"><span class="dot"></span>Son ${e.left} bilet</span>` : ""}</div></div></a>`;
  }

  /* ---------- global wiring ---------- */
  document.addEventListener("click", e => {
    const a = e.target.closest("[data-act]"); if (!a) return;
    switch (a.dataset.act) {
      case "toggleTheme": setTheme(isDark() ? "light" : "dark"); break;
      case "theme": setTheme(a.dataset.v); break;
      case "closeSheet": closeSheet(); break;
    }
  });
  document.addEventListener("keydown", e => { if (e.key === "Escape" && sheetEl) closeSheet(); });
  window.addEventListener("unhandledrejection", e => { if (e.reason instanceof ApiError) { toast(e.reason.message, null, "bad"); e.preventDefault(); } });

  window.G = { $, $$, esc, tl, num, debounce, ic, avatar, avatarBg, initials, spring, REDUCED, api, ApiError, validateForm, validateField, bindValidation, applyServerErrors, setError, busy, toast, openSheet, closeSheet, sheetHead, card, setTheme, isDark };

  document.addEventListener("DOMContentLoaded", () => {
    paintTheme();
    $$("form[novalidate]").forEach(bindValidation);
    const flash = $("#flash"); if (flash) { try { setTimeout(() => toast(JSON.parse(flash.textContent)), 300); } catch (e) { } }
    const main = $("#main main, main.page"); if (main && !REDUCED()) { const sp = spring(.42, 1); main.animate([{ opacity: 0, transform: "translateY(10px)" }, { opacity: 1, transform: "none" }], { duration: sp.duration, easing: sp.easing }); }
  });
})();
