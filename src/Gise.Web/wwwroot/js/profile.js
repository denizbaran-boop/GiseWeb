/* Profil: pass sheet (HTML partial via fetch), ticket refund, reminders toggle, organizer publish. */
(function () {
  const { $, api, esc, ic, toast, openSheet, closeSheet, sheetHead, confirmSheet, busy } = G;

  document.addEventListener("click", async e => {
    const a = e.target.closest("[data-act]"); if (!a) return;
    const act = a.dataset.act;

    if (act === "showPass") {
      busy(a, true, "Açılıyor…");
      try {
        const res = await fetch(`/bilet/goster/${a.dataset.id}`, { headers: { Accept: "text/html" } });
        if (!res.ok) throw new Error(res.status === 404 ? "Bilet bulunamadı." : "Bilet yüklenemedi; tekrar dene.");
        openSheet(sheetHead("Biletin") + await res.text(), { label: "Bilet" });
      } catch (err) { toast(err.message, null, "bad"); }
      finally { busy(a, false); }
    }

    if (act === "cancelTicket") {
      if (a.dataset.refundable !== "1") { toast("İade süresi doldu: etkinliğe 48 saatten az kaldı.", null, "bad"); return; }
      openSheet(`${sheetHead("Bileti iptal et")}
        <p class="subhead" style="margin-bottom:8px"><b>${esc(a.dataset.title)}</b> için bu bileti iptal etmek üzeresin.</p>
        <p class="footnote" style="display:flex;gap:8px;margin:8px 0 22px">${ic("info", "i-sm")}<span>${esc(a.dataset.price)} kartına iade edilir. Bilet koltuğu yeniden satışa açılır; bu işlem geri alınamaz.</span></p>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px"><button class="btn btn-gray btn-large" type="button" data-act="closeSheet">Vazgeç</button><button class="btn btn-destructive btn-large" type="button" data-act="confirmCancel" data-id="${a.dataset.id}">İptal Et</button></div>`, { label: "Bileti iptal et" });
    }

    if (act === "confirmCancel") {
      busy(a, true, "İptal ediliyor…");
      try {
        const r = await api(`/api/tickets/${a.dataset.id}/cancel`, { method: "POST" });
        closeSheet();
        const stub = document.querySelector(`.stub[data-ticket="${a.dataset.id}"]`);
        if (stub) stub.animate([{ opacity: 1, transform: "none" }, { opacity: 0, transform: "translateX(24px)" }], { duration: 260, easing: "ease-in" }).onfinish = () => stub.remove();
        const c = $("#activeCount"); if (c) c.textContent = Math.max(0, +c.textContent - 1);
        toast(r.message);
      } catch (err) { busy(a, false); toast(err.message, null, "bad"); }
    }

    if (act === "deleteEvent") {
      confirmSheet({
        title: "Etkinliği sil",
        html: `<p class="subhead"><b>${esc(a.dataset.title)}</b> kalıcı olarak silinecek. Bu işlem geri alınamaz.</p>`,
        confirm: "Sil",
        onConfirm: async () => {
          await api(`/api/organizer/events/${a.dataset.id}`, { method: "DELETE" });
          const row = a.closest("[data-event]");
          row.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 220 }).onfinish = () => row.remove();
          toast("Etkinlik silindi.");
        }
      });
    }

    if (act === "setStatus") {
      busy(a, true, "Kaydediliyor…");
      try {
        await api(`/api/organizer/events/${a.dataset.id}/status`, { method: "POST", body: { status: a.dataset.v } });
        const row = a.closest("[data-event]");
        row.querySelector("[data-status-pill]").innerHTML = '<span class="pill ok"><span class="dot"></span>Yayında</span>';
        a.outerHTML = `<a class="btn btn-gray btn-sm" href="/giris-kontrol?etkinlik=${a.dataset.id}">Giriş Kontrolü</a>`;
        toast("Yayınlandı. Etkinliğin Keşfet'te görünüyor.");
      } catch (err) { busy(a, false); toast(err.message, null, "bad"); }
    }
  });

  const notif = $("#notif");
  if (notif) notif.addEventListener("change", async () => {
    try {
      await api("/api/account/preferences", { method: "PUT", body: { remindersEnabled: notif.checked } });
      toast(notif.checked ? "Etkinlikten bir gün önce hatırlatacağız." : "Hatırlatmalar kapatıldı.");
    } catch (err) { notif.checked = !notif.checked; toast(err.message, null, "bad"); }
  });
})();
