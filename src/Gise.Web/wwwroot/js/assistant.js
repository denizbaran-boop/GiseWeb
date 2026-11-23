/* Gişe Asistan: rule-based TR/EN event assistant (from the Project #2 prototype), now reading live data from GET /api/events. */
(function () {
  const { $, api, esc, tl, ic, spring, REDUCED, toast } = G;
  const root = $("#ai-root"); if (!root) return;
  const KEY = "gise-ai-v2";
  let EVENTS = null;
  const S = (() => { try { return JSON.parse(sessionStorage.getItem(KEY)) || {}; } catch { return {}; } })();
  S.chat = S.chat || []; S.ctx = S.ctx || { lastIds: [] }; S.open = !!S.open;
  const save = () => { try { sessionStorage.setItem(KEY, JSON.stringify({ chat: S.chat.slice(-40), ctx: S.ctx, open: S.open })); } catch { } };

  async function loadEvents() {
    if (EVENTS) return EVENTS;
    const list = await api("/api/events");
    EVENTS = list.map(e => {
      const tam = e.tiers.find(t => /^tam$/i.test(t.name)) || e.tiers.slice().sort((a, b) => a.price - b.price)[0];
      const ogr = e.tiers.find(t => /öğrenci|ogrenci|student/i.test(t.name)) || null;
      return { id: e.id, title: e.title, cat: e.category, venue: e.venue, district: e.district, date: e.date, time: e.time, doors: e.doors, price: e.priceFrom, left: e.left, age: e.ageLimit, cover: e.cover, url: e.url, shortDate: e.shortDate, longDate: e.longDate, tam, ogr };
    });
    return EVENTS;
  }
  const ev = id => (EVENTS || []).find(e => e.id === +id);
  const d = e => new Date(e.date + "T" + (e.time || "20:00"));

  const DIST = { "KüçükÇiftlik Park": 8, "Salon İKSV": 11, "Maximum Uniq Hall": 1, "Moda Sahnesi": 22, "Haliç Kongre Merkezi": 13, "Kadıköy Rıhtım": 20, "Zorlu PSM": 6, "Sinan Erdem Spor Salonu": 26, "Bostancı Gösteri Merkezi": 27, "Maslak Bilim Merkezi": 1, "Galata Rıhtımı": 13, "Cemal Reşit Rey": 12 };
  const distOf = e => DIST[e.venue] ?? 15;
  const TRW = new Set("ve bir var mı mi mu mü en hangi hangileri yakın yakınımdaki yakındaki bilet bileti konser konserler bu hafta sonu ucuz öğrenci için ne nerede alalım al alayım olsun tiyatro komedi çocuk aile ay kasım aralık ocak şubat merhaba selam göster istiyorum lazım kaçta saat kapı tam olanı olan şu o cumartesi pazar yarın bugün etkinlik etkinlikler fiyat kaç yok gibi".split(" "));
  const ENW = new Set("the any is are what where near nearest nearby me show shows concert concerts ticket tickets cheap cheapest student this weekend week month jazz comedy for in i i'm im want find buy hello hi please with under one a an of to do does bring id when time door doors how much price get book".split(" "));
  function detectLang(text) {
    const t = text.toLocaleLowerCase("tr-TR"), toks = t.split(/[^a-zçğıöşü0-9']+/).filter(Boolean);
    let tr = (t.match(/[çğışöü]/g) || []).length * 1.5, en = 0;
    toks.forEach(k => { if (TRW.has(k)) tr++; if (ENW.has(k)) en++; });
    return en > tr ? "en" : "tr";
  }
  const aiTokens = text => { const t = text.toLocaleLowerCase("tr-TR"); return { t, toks: t.split(/[^a-zçğıöşü0-9₺]+/).filter(Boolean) }; };
  const hasW = ({ t, toks }, ...ws) => ws.some(w => w.includes(" ") ? t.includes(w) : toks.some(k => k === w || (w.length >= 4 && k.startsWith(w))));
  const day0 = x => { x = new Date(x); x.setHours(0, 0, 0, 0); return x; };
  const addD = (x, n) => { x = new Date(x); x.setDate(x.getDate() + n); return x; };
  const enDate = e => d(e).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" }) + " · " + e.time;
  const enLong = e => d(e).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" });
  const ogrPrice = e => e.ogr ? e.ogr.price : null;
  const CATW = [["Konser", ["konser", "concert", "müzik", "music", "gig", "canlı"]], ["Klasik", ["klasik", "classical", "senfoni", "symphon", "orkestra", "orchestra", "opera", "gala"]], ["Tiyatro", ["tiyatro", "theat", "play"]], ["Komedi", ["komedi", "comedy", "stand", "standup", "güldür", "funny"]], ["Festival", ["festival", "yemek", "food", "lezzet"]], ["Spor", ["spor", "sport", "basket", "maç", "match"]], ["Atölye", ["atölye", "workshop", "fotoğraf", "photo", "kurs"]], ["Konferans", ["konferans", "conference", "zirve", "summit", "yapay", "teknoloji", "tech"]], ["Aile", ["aile", "family", "çocuk", "kid", "child", "bilim", "science"]]];
  const TITLEW = [["Caz", ["caz", "jazz"]], ["Elektronik", ["elektronik", "electronic", "dj", "techno", "tekno"]], ["Akustik", ["akustik", "acoustic", "rock", "indie"]], ["Film", ["film", "movie", "sinema", "cinema"]], ["Hamlet", ["hamlet", "shakespeare"]], ["Derbi", ["derbi", "derby"]], ["Uzay", ["uzay", "space", "roket", "rocket"]], ["Yılbaşı", ["yılbaşı", "new year"]]];
  const MONTHS = [["ocak", "january"], ["şubat", "february"], ["mart", "march"], ["nisan", "april"], ["mayıs", "may"], ["haziran", "june"], ["temmuz", "july"], ["ağustos", "august"], ["eylül", "september"], ["ekim", "october"], ["kasım", "november"], ["aralık", "december"]];

  function resolveEvent(q, ctx) {
    const ids = ctx.lastIds || [];
    const ord = [["ilk", "first", "birinci", "ilki"], ["ikinci", "second", "ikincisi"], ["üçüncü", "third", "üçüncüsü"]].findIndex(ws => hasW(q, ...ws));
    if (ord >= 0 && ids[ord]) return ev(ids[ord]);
    let cand = [];
    TITLEW.forEach(([k, ws]) => { if (hasW(q, ...ws)) cand.push(...EVENTS.filter(e => e.title.includes(k))); });
    if (!cand.length) {
      const stop = new Set(["konser", "etkinlik", "bilet", "gecesi", "gece", "için", "olan", "olanı", "event", "show", "ticket", "tickets"]);
      EVENTS.forEach(e => { const words = e.title.toLocaleLowerCase("tr-TR").split(/[^a-zçğıöşü]+/).filter(w => w.length >= 4 && !stop.has(w)); if (words.some(w => q.toks.some(k => k.length >= 4 && (k.startsWith(w.slice(0, 5)) || w.startsWith(k.slice(0, 5)))))) cand.push(e); });
    }
    cand = [...new Set(cand)];
    if (cand.length > 1 && ids.length) { const inCtx = cand.filter(e => ids.includes(e.id)); if (inCtx.length) cand = inCtx; }
    if (cand.length) return cand.sort((a, b) => d(a) - d(b))[0];
    if (ids.length === 1) return ev(ids[0]);
    return null;
  }

  function reply(text) {
    const lang = detectLang(text), tr = lang === "tr", q = aiTokens(text), ctx = S.ctx;
    const now = day0(new Date());
    const greet = q.toks.length <= 3 && hasW(q, "merhaba", "selam", "hello", "hi", "hey", "günaydın");
    const buy = hasW(q, "al", "alalım", "alayım", "alırım", "satın", "buy", "book", "reserve", "rezerv") || /\d+\s*(tam|öğrenci|bilet|ticket|student|kişi|person|seat)/.test(q.t);
    const infoQ = hasW(q, "kaçta", "saat", "kapı", "kapılar", "when", "time", "door", "doors", "nerede", "where", "fiyat", "price", "kaç", "how much", "tarih", "date", "yaş", "age", "kimlik", "id", "bring", "getir", "detay", "detail");
    const student = hasW(q, "öğrenci", "student");
    if (greet) return { lang, html: tr ? "Merhaba! Etkinlik bulmana yardım edebilirim. Kategori, tarih, bütçe ya da yakınlığa göre sorabilirsin." : "Hi! I can help you find events. Ask by category, date, budget or distance.", chips: tr ? ["Yakınımdaki konserler", "Bu hafta sonu ne var?", "300 TL altı etkinlikler"] : ["Concerts near me", "What's on this weekend?", "Events under 300 TL"] };

    const one = (buy || infoQ) ? resolveEvent(q, ctx) : null;
    if (buy && one) {
      const n = Math.min(6, Math.max(1, +(q.t.match(/(\d+)/) || [0, 1])[1] || 1));
      const T = student && one.ogr ? one.ogr : one.tam;
      const tn = tr ? T.name : (T === one.ogr ? "Student" : T.name === "Tam" ? "Regular" : T.name);
      if (student && !one.ogr) return { lang, html: tr ? `<b>${esc(one.title)}</b> için öğrenci bileti yok.` : `There's no student ticket for <b>${esc(one.title)}</b>.`, actions: [{ label: tr ? "Etkinliğe Git" : "View Event", act: "aiGo", v: one.id }] };
      if (!T.available) return { lang, html: tr ? `<b>${esc(one.title)}</b> için ${esc(T.name)} biletler tükenmiş.` : `${esc(tn)} tickets for <b>${esc(one.title)}</b> are sold out.`, actions: [{ label: tr ? "Etkinliğe Git" : "View Event", act: "aiGo", v: one.id }] };
      const qn = Math.min(n, T.available); ctx.lastIds = [one.id];
      return {
        lang, html: tr ? `<b>${esc(one.title)}</b> için ${qn} × ${esc(tn)} bilet, toplam <b>${tl(qn * T.price)}</b>. Seçimi hazırladım; ödemeyi sen onaylarsın.` : `${qn} × ${esc(tn)} for <b>${esc(one.title)}</b>, total <b>${tl(qn * T.price)}</b>. I've prepared the selection; you confirm the payment.`,
        actions: [{ label: tr ? "Ödemeye Geç" : "Go to Checkout", act: "aiCheckout", v: `${one.id}|${T.id}:${qn}`, primary: true }, { label: tr ? "Etkinliğe Git" : "View Event", act: "aiGo", v: one.id }]
      };
    }
    if (infoQ && one && !hasW(q, "hangi", "which", "list", "listele", "neler", "what's on")) {
      ctx.lastIds = [one.id];
      const sid = hasW(q, "kimlik", "id", "bring", "getir"), op = ogrPrice(one);
      const html = tr ? `<b>${esc(one.title)}</b>: ${esc(one.longDate)}, saat ${one.time} (kapılar ${one.doors}). ${esc(one.venue)}, ${esc(one.district)}. Tam ${tl(one.tam.price)}${op ? `, öğrenci ${tl(op)}` : ""}. Yaş sınırı: ${esc(one.age)}.${sid ? " Öğrenci biletinde girişte öğrenci kimliği kontrol ediliyor." : ""}`
        : `<b>${esc(one.title)}</b>: ${enLong(one)} at ${one.time} (doors ${one.doors}). ${esc(one.venue)}, ${esc(one.district)}. Regular ${tl(one.tam.price)}${op ? `, student ${tl(op)}` : ""}. Age: ${one.age === "Herkes" ? "all ages" : esc(one.age)}.${sid ? " Yes, student IDs are checked at the door." : ""}`;
      return { lang, html, actions: [{ label: tr ? "Bilet Al" : "Get Tickets", act: "aiGo", v: one.id, primary: true }], chips: tr ? ["2 tam bilet al", "Öğrenci bileti al"] : ["Buy 2 tickets", "Buy a student ticket"] };
    }

    let list = EVENTS.filter(e => day0(d(e)) >= now); const notes = [];
    const cats = CATW.filter(([, ws]) => hasW(q, ...ws)).map(([c]) => c);
    if (cats.includes("Konser") && !cats.includes("Klasik")) cats.push("Klasik");
    const titleKeys = TITLEW.filter(([, ws]) => hasW(q, ...ws)).map(([k]) => k);
    if (cats.length || titleKeys.length) { list = list.filter(e => cats.includes(e.cat) || titleKeys.some(k => e.title.includes(k))); notes.push(tr ? "kategori" : "category"); }
    let range = null;
    if (hasW(q, "hafta sonu", "haftasonu", "weekend")) { const dw = now.getDay(); const sat = dw === 0 ? addD(now, -1) : addD(now, (6 - dw + 7) % 7); range = [dw === 0 ? now : sat, addD(sat, 2)]; }
    else if (hasW(q, "bugün", "today", "tonight", "bu akşam")) range = [now, addD(now, 1)];
    else if (hasW(q, "yarın", "tomorrow")) range = [addD(now, 1), addD(now, 2)];
    else if (hasW(q, "gelecek hafta", "next week", "haftaya")) range = [addD(now, 7), addD(now, 14)];
    else if (hasW(q, "bu hafta", "this week")) range = [now, addD(now, 7)];
    else if (hasW(q, "bu ay", "this month")) range = [now, new Date(now.getFullYear(), now.getMonth() + 1, 1)];
    else { const mi = MONTHS.findIndex(ws => hasW(q, ...ws)); if (mi >= 0) { const y = mi < now.getMonth() ? now.getFullYear() + 1 : now.getFullYear(); range = [new Date(y, mi, 1), new Date(y, mi + 1, 1)]; } }
    let shifted = false;
    if (range) { const base = list; list = list.filter(e => { const x = d(e); return x >= range[0] && x < range[1]; }); notes.push(tr ? "tarih" : "date"); if (!list.length) { list = base.filter(e => d(e) >= range[1]); shifted = list.length > 0; } }
    const pm = q.t.match(/(\d{2,5})\s*(tl|₺|lira)?/); let maxP = null;
    if (pm && hasW(q, "altı", "altında", "alti", "under", "below", "less", "max", "fazla", "kadar", "bütçe", "budget")) maxP = +pm[1];
    const priceOf = e => student && e.ogr ? e.ogr.price : e.price;
    if (student) { list = list.filter(e => e.ogr && e.ogr.available > 0); notes.push(tr ? "öğrenci bileti" : "student tickets"); }
    if (maxP) { list = list.filter(e => priceOf(e) <= maxP); notes.push(tr ? `en fazla ${tl(maxP)}` : `max ${tl(maxP)}`); }
    const near = hasW(q, "yakın", "yakınımdaki", "yakındaki", "near", "nearest", "nearby", "close", "closest", "civar");
    const cheap = hasW(q, "ucuz", "ucuzları", "cheap", "cheapest", "uygun");
    if (near) { list.sort((a, b) => distOf(a) - distOf(b)); notes.push(tr ? "Konum: Maslak" : "near Maslak"); }
    else if (cheap) list.sort((a, b) => priceOf(a) - priceOf(b));
    else list.sort((a, b) => d(a) - d(b));
    const status = (tr ? `${EVENTS.length} etkinlik tarandı` : `Searched ${EVENTS.length} events`) + (notes.length ? " · " + notes.join(", ") : "");
    if (!list.length) { ctx.lastIds = []; return { lang, status, html: tr ? "Bu kriterlere uyan etkinlik bulamadım. Tarihi genişletmeyi ya da başka bir kategori denemeyi öneririm." : "I couldn't find events matching that. Try a wider date range or another category.", chips: tr ? ["Bu ay ne var?", "Yakınımdaki konserler"] : ["What's on this month?", "Concerts near me"] }; }
    const generic = !notes.length && !cheap;
    const ids = list.slice(0, 3).map(e => e.id); ctx.lastIds = ids;
    let html;
    if (generic) html = tr ? "Tam anlayamadım ama yaklaşan etkinliklerden birkaçı şunlar. Kategori, tarih ya da bütçe söylersen daraltırım." : "Not sure I got that, but here are some upcoming events. Tell me a category, date or budget to narrow it down.";
    else if (shifted) html = tr ? "Bu tarih aralığında uygun etkinlik yok. En yakın tarihli olanlar:" : "Nothing in that date range. Here are the next ones:";
    else if (near) html = tr ? `Maslak'a en yakın ${ids.length} etkinlik, yakından uzağa sıraladım:` : `The ${ids.length} closest to Maslak, nearest first:`;
    else if (cheap) html = tr ? `En uygun fiyatlı ${ids.length} etkinlik:` : `The ${ids.length} most affordable:`;
    else html = tr ? `${list.length} etkinlik buldum${list.length > 3 ? ", ilk 3'ü" : ""}:` : `Found ${list.length} event${list.length > 1 ? "s" : ""}${list.length > 3 ? ", here are the top 3" : ""}:`;
    const turkishOnly = ids.map(ev).filter(e => ["Komedi", "Tiyatro"].includes(e.cat));
    const after = !tr && turkishOnly.length ? `Heads-up: ${turkishOnly.map(e => e.title).join(" and ")} ${turkishOnly.length > 1 ? "are" : "is"} performed in Turkish.` : null;
    return { lang, status, html, ids, near, student, after, chips: tr ? ["Öğrenci bileti olanlar", "Bu hafta sonu", "En ucuzları"] : ["Student tickets only", "This weekend", "Cheapest first"] };
  }

  function optHTML(id, m) {
    const e = ev(id); if (!e) return "";
    const tr = m.lang !== "en", low = e.left > 0 && e.left <= 50;
    const meta2 = `${esc(e.venue)}${m.near ? ` · ${distOf(e)} km` : ""}`;
    const price = m.student && e.ogr ? (tr ? `Öğrenci ${tl(e.ogr.price)}` : `Student ${tl(e.ogr.price)}`) : (tr ? `${tl(e.price)}'den` : `from ${tl(e.price)}`);
    return `<a class="opt" href="${e.url}"><img src="${esc(e.cover)}" alt=""><div class="opt-main"><p class="opt-title">${esc(e.title)}</p><p class="opt-meta">${tr ? esc(e.shortDate) : enDate(e)}</p><p class="opt-meta">${meta2}</p></div><div class="opt-side"><span class="opt-price">${price}</span>${low ? `<span class="pill warn">${tr ? "Son" : "Last"} ${e.left}</span>` : ""}</div>${ic("chevR", "chev i-sm", 2.2)}</a>`;
  }
  function msgHTML(m) {
    if (m.who === "me") return `<div class="bubble b-me">${esc(m.text)}</div>${m.note ? `<div class="lang">${ic("globe", "i-sm", 1.8)}${esc(m.note)}</div>` : ""}`;
    if (m.typing) return `<div class="bubble b-ai typing" aria-label="Asistan yazıyor"><span></span><span></span><span></span></div>`;
    let h = "";
    if (m.status) h += `<div class="ai-status">${ic("check", "i-sm", 2.4)}${esc(m.status)}</div>`;
    if (m.html) h += `<div class="bubble b-ai">${m.html}</div>`;
    if (m.ids && m.ids.length && EVENTS) h += `<div class="opts">${m.ids.map(id => optHTML(id, m)).join("")}</div>`;
    if (m.after) h += `<div class="bubble b-ai">${esc(m.after)}</div>`;
    if (m.actions) h += `<div class="ai-row">${m.actions.map(a => `<button type="button" class="btn ${a.primary ? "btn-primary" : "btn-gray"} btn-sm" data-ai="${a.act}" data-v="${esc(a.v)}">${esc(a.label)}</button>`).join("")}</div>`;
    if (m.chips) h += `<div class="ai-row">${m.chips.map(c => `<button type="button" class="sugg" data-ai="aiChip" data-v="${esc(c)}">${esc(c)}</button>`).join("")}</div>`;
    return h;
  }
  const welcome = () => ({ who: "ai", lang: "tr", html: "Merhaba! Ben Gişe Asistan. Etkinlik bulmana yardım ederim; Türkçe ya da İngilizce yazabilirsin.", chips: ["Yakınımdaki konserler", "Bu hafta sonu ne var?", "Comedy or jazz for students?"] });

  function render() {
    if (!S.chat.length) S.chat = [welcome()];
    if (!S.open) { root.innerHTML = `<button type="button" class="ai-fab glass" data-ai="aiOpen" aria-label="Gişe Asistan'ı aç"><span class="ai-mark">${ic("sparkle", "", 2)}</span>Asistan</button>`; return; }
    root.innerHTML = `<aside class="ai glass" aria-label="Gişe Asistan">
      <header class="ai-head"><div class="ai-id"><span class="ai-mark">${ic("sparkle", "", 2)}</span><div><p class="headline">Gişe Asistan</p><p class="caption">Türkçe ve İngilizce anlar</p></div><span class="pill accent">Beta</span></div>
        <div class="ai-actions"><button type="button" class="icon-btn" data-ai="aiNew" aria-label="Yeni sohbet" title="Yeni sohbet">${ic("newchat", "i-sm", 1.9)}</button><button type="button" class="icon-btn" data-ai="aiClose" aria-label="Asistanı kapat">${ic("x", "i-sm", 2.2)}</button></div></header>
      <div class="ai-body" id="aiBody" aria-live="polite">${S.chat.map(msgHTML).join("")}</div>
      <footer class="ai-foot"><form class="ai-input" id="aiForm"><label class="sr" for="aiIn">Asistana sor</label><input id="aiIn" autocomplete="off" maxlength="200" placeholder="Etkinlik, sanatçı ya da mekân sor…"><button type="button" class="ai-mic" data-ai="aiMic" aria-label="Sesle yaz">${ic("mic", "i-sm", 1.9)}</button><button type="submit" class="ai-send" aria-label="Gönder">${ic("arrowUp", "i-sm", 2.4)}</button></form>
        <p class="caption" style="text-align:center">Yanıtlar canlı etkinlik verisinden kurallarla üretilir.</p></footer></aside>`;
    const body = $("#aiBody"); body.scrollTop = body.scrollHeight;
    $("#aiForm").onsubmit = e => { e.preventDefault(); const v = $("#aiIn").value.trim(); if (v) send(v); };
  }

  async function send(text) {
    const lang = detectLang(text);
    S.chat.push({ who: "me", text, note: lang === "en" ? "English detected · replying in English" : "Türkçe algılandı" });
    S.chat.push({ who: "ai", typing: true }); render(); $("#aiIn")?.focus();
    let r;
    try { await Promise.all([loadEvents(), new Promise(res => setTimeout(res, REDUCED() ? 100 : 600))]); r = reply(text); }
    catch (err) { r = { lang, html: lang === "en" ? "I couldn't load events right now. Please try again." : "Etkinlikleri şu an yükleyemedim. Birazdan tekrar dene.", chips: [text] }; }
    S.chat = S.chat.filter(m => !m.typing); S.chat.push({ who: "ai", ...r }); save(); render(); $("#aiIn")?.focus();
  }

  document.addEventListener("click", e => {
    const a = e.target.closest("[data-ai]"); if (!a) return;
    const v = a.dataset.v;
    switch (a.dataset.ai) {
      case "aiOpen": S.open = true; save(); render(); loadEvents().then(render).catch(() => { });
        { const el = $(".ai"); if (el && !REDUCED()) { const sp = spring(.35, 1); el.animate([{ opacity: 0, transform: "translateY(16px) scale(.98)", filter: "blur(6px)" }, { opacity: 1, transform: "none", filter: "blur(0)" }], { duration: sp.duration, easing: sp.easing }); } }
        setTimeout(() => $("#aiIn")?.focus(), 60); break;
      case "aiClose": S.open = false; save(); render(); break;
      case "aiNew": S.chat = [welcome()]; S.ctx = { lastIds: [] }; save(); render(); break;
      case "aiChip": send(v); break;
      case "aiMic": toast("Sesli giriş henüz yok; yazarak sorabilirsin."); break;
      case "aiGo": location.href = `/etkinlik/${v}`; break;
      case "aiCheckout": { const [id, sec] = v.split("|"); location.href = `/etkinlik/${id}?sec=${sec}&odeme=1`; break; }
    }
  });

  render();
  if (S.open && S.chat.some(m => m.ids)) loadEvents().then(render).catch(() => { });
})();
