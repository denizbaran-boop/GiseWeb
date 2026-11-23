/* Yönetim: user search/filter (GET /api/admin/users), ban/unban with undo, event moderation. */
(function () {
  const { $, $$, api, esc, ic, avatar, toast, openSheet, closeSheet, sheetHead, confirmSheet, debounce, busy, validateForm, bindValidation, applyServerErrors } = G;
  const body = $("#ubody");
  let users = [], filter = "Tümü", seq = 0;

  const statusCell = u => u.banned ? `<span class="pill bad">${ic("slash", "i-sm", 2.2)}Banlı · ${esc(u.until)}</span>` : `<span class="pill ok"><span class="dot"></span>Aktif</span>`;
  const roleCell = u => u.role === "Admin" ? '<span class="pill accent">Admin</span>' : u.role === "Organizer" ? '<span class="pill neutral">Organizatör</span>' : '<span class="footnote" style="font-size:15px">Katılımcı</span>';
  const actionCell = u => u.role === "Admin" ? '<span class="footnote">—</span>' : u.banned
    ? `<button class="btn btn-gray btn-sm" data-act="unban" data-id="${u.id}">Banı Kaldır</button>`
    : `<button class="btn btn-ban btn-sm" data-act="ban" data-id="${u.id}">Banla</button>`;
  const row = u => `<tr data-user="${u.id}"><td><div class="who">${avatar(u.name)}<div><div style="font-weight:600">${esc(u.name)}</div><div class="footnote">${esc(u.email)}</div></div></div></td>
    <td>${roleCell(u)}</td><td class="num">${esc(u.joined)}</td><td class="num">${u.tickets}</td><td>${statusCell(u)}${u.banned && u.reason ? `<div class="caption" style="margin-top:4px">${esc(u.reason)}</div>` : ""}</td><td style="text-align:right">${actionCell(u)}</td></tr>`;

  function draw() {
    body.innerHTML = users.length ? users.map(row).join("") : `<tr><td colspan="6" style="text-align:center;padding:40px" class="subhead">Bu filtreyle eşleşen kullanıcı yok.</td></tr>`;
    $("#ucount").textContent = `${users.length} kullanıcı gösteriliyor`;
  }
  async function load() {
    const id = ++seq;
    body.setAttribute("aria-busy", "true");
    try {
      const p = new URLSearchParams({ filter }); const q = $("#aq").value.trim(); if (q) p.set("q", q);
      const list = await api("/api/admin/users?" + p);
      if (id !== seq) return;
      users = list; draw();
    } catch (err) {
      body.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:40px"><p class="subhead">${esc(err.message)}</p><button class="btn btn-gray btn-sm" data-act="reload" style="margin-top:10px">Tekrar Dene</button></td></tr>`;
    } finally { body.removeAttribute("aria-busy"); }
  }
  function replace(u) {
    const i = users.findIndex(x => x.id === u.id); if (i >= 0) users[i] = u;
    if (filter === "Banlı" && !u.banned) users.splice(i, 1);
    draw();
    const bc = $("#bannedCount"); if (bc) bc.textContent = Math.max(0, +bc.textContent + (u.banned ? 1 : -1));
  }

  function banSheet(u) {
    const reasons = $("#banReasons").innerHTML.split("|");
    const sheet = openSheet(`${sheetHead("Kullanıcıyı banla")}
      <div class="who" style="margin-bottom:20px">${avatar(u.name)}<div><div class="headline">${esc(u.name)}</div><div class="footnote">${esc(u.email)} · ${u.tickets} bilet</div></div></div>
      <form id="banForm" novalidate>
        <input type="hidden" name="duration" value="7">
        <div class="field" style="margin-bottom:16px"><span class="label">Süre</span><div class="seg seg-block" role="group" aria-label="Ban süresi">
          ${[["7", "7 Gün"], ["30", "30 Gün"], ["perm", "Kalıcı"]].map(([k, l]) => `<button type="button" data-act="bdur" data-v="${k}" aria-pressed="${k === "7"}">${l}</button>`).join("")}</div></div>
        <div class="field" style="margin-bottom:16px"><label for="bReason">Sebep</label><select class="input" id="bReason" name="reason" data-val-required="Bir sebep seç."><option value="">Seç…</option>${reasons.map(r => `<option>${esc(r)}</option>`).join("")}</select><span class="field-error" data-valmsg-for="reason"></span></div>
        <div class="field"><label for="bNote">Not (isteğe bağlı)</label><textarea class="input" id="bNote" name="note" style="min-height:80px" maxlength="300" placeholder="Diğer adminler için kısa açıklama" data-val-length="Not en fazla 300 karakter olabilir." data-val-length-max="300"></textarea><span class="field-error" data-valmsg-for="note"></span></div>
        <p class="footnote" style="display:flex;gap:8px;margin:16px 0 20px">${ic("info", "i-sm")}<span>Banlanan kullanıcının oturumu hemen kapanır; giriş yapamaz ve bilet alamaz. Daha önce aldığı biletler geçerli kalır.</span></p>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px"><button class="btn btn-gray btn-large" type="button" data-act="closeSheet">Vazgeç</button><button class="btn btn-destructive btn-large" type="submit">Banla</button></div>
      </form>`, { label: "Kullanıcıyı banla" });
    const form = $("#banForm", sheet);
    bindValidation(form);
    form.addEventListener("click", e => { const b = e.target.closest('[data-act="bdur"]'); if (!b) return; form.duration.value = b.dataset.v; $$('[data-act="bdur"]', form).forEach(x => x.setAttribute("aria-pressed", String(x === b))); });
    form.addEventListener("submit", async e => {
      e.preventDefault(); if (!validateForm(form)) return;
      const btn = $('button[type="submit"]', form); busy(btn, true, "Banlanıyor…");
      try {
        const updated = await api(`/api/admin/users/${u.id}/ban`, { method: "POST", body: Object.fromEntries(new FormData(form)) });
        closeSheet(); replace(updated);
        toast(`${u.name} banlandı.`, () => unban(updated, true));
      } catch (err) { busy(btn, false); if (!applyServerErrors(form, err)) toast(err.message, null, "bad"); }
    });
  }

  async function unban(u, isUndo) {
    try {
      const updated = await api(`/api/admin/users/${u.id}/unban`, { method: "POST" });
      replace(updated);
      toast(isUndo ? "Ban geri alındı." : `${u.name} için ban kaldırıldı.`);
    } catch (err) { toast(err.message, null, "bad"); }
  }

  document.addEventListener("click", async e => {
    const a = e.target.closest("[data-act]"); if (!a) return;
    const u = users.find(x => x.id === +a.dataset.id);
    switch (a.dataset.act) {
      case "afilter": filter = a.dataset.v; $$('[data-act="afilter"]').forEach(b => b.setAttribute("aria-pressed", String(b === a))); load(); break;
      case "ban": if (u) banSheet(u); break;
      case "unban": if (u) { busy(a, true, "…"); await unban(u); } break;
      case "reload": load(); break;
      case "deleteEvent":
        confirmSheet({
          title: "Etkinliği sil",
          html: `<p class="subhead"><b>${esc(a.dataset.title)}</b> kalıcı olarak silinecek. Bu işlem geri alınamaz.</p>`,
          confirm: "Sil",
          onConfirm: async () => { await api(`/api/organizer/events/${a.dataset.id}`, { method: "DELETE" }); a.closest("tr").remove(); toast("Etkinlik silindi."); }
        });
        break;
      case "setStatus": {
        busy(a, true, "Kaydediliyor…");
        try {
          const r = await api(`/api/organizer/events/${a.dataset.id}/status`, { method: "POST", body: { status: a.dataset.v } });
          const tr = a.closest("tr"), on = r.status === "Published";
          tr.querySelector("[data-status-pill]").innerHTML = on ? '<span class="pill ok"><span class="dot"></span>Yayında</span>' : '<span class="pill bad">Kaldırıldı</span>';
          a.outerHTML = on
            ? `<button class="btn btn-ban btn-sm" data-act="setStatus" data-id="${a.dataset.id}" data-v="Unpublished">Yayından Kaldır</button>`
            : `<button class="btn btn-gray btn-sm" data-act="setStatus" data-id="${a.dataset.id}" data-v="Published">Yeniden Yayınla</button>`;
          toast(on ? "Etkinlik yeniden yayında." : "Etkinlik yayından kaldırıldı; artık Keşfet'te görünmüyor.");
        } catch (err) { busy(a, false); toast(err.message, null, "bad"); }
        break;
      }
    }
  });

  if (body) { $("#aq").addEventListener("input", debounce(load, 250)); load(); }
})();
