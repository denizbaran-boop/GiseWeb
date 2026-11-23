/* Giriş / Kayıt: client-side validation (same rules as the server), demo accounts, live username check. */
(function () {
  const { $, $$, api, debounce, validateForm, toast, busy } = G;

  for (const form of $$("#loginForm, #regForm")) {
    form.addEventListener("submit", e => {
      if (!validateForm(form)) { e.preventDefault(); return; }
      busy($('button[type="submit"]', form), true, form.id === "loginForm" ? "Giriş yapılıyor…" : "Hesap oluşturuluyor…");
    });
  }

  document.addEventListener("click", e => {
    const a = e.target.closest("[data-act]"); if (!a) return;
    if (a.dataset.act === "demo") {
      const f = $("#loginForm");
      $("#Login", f).value = a.dataset.login;
      $("#Password", f).value = a.dataset.pass;
      $$('[data-act="demo"]').forEach(b => b.setAttribute("aria-pressed", String(b === a)));
      f.requestSubmit();
    }
    if (a.dataset.act === "forgot") toast("Şifre sıfırlama bu ders projesinde yok; demo hesapların şifresi aşağıda yazıyor.");
    if (a.dataset.act === "regType") {
      $("#accountType").value = a.dataset.v;
      $$('[data-act="regType"]').forEach(b => b.setAttribute("aria-pressed", String(b === a)));
      $("#orgRow").hidden = a.dataset.v !== "Organizer";
      if (a.dataset.v === "Organizer") $("#OrganizationName").focus();
    }
  });

  // Live availability check: GET /api/account/username-available
  const user = $("[data-check-username]"), hint = $("#userHint");
  if (user && hint) {
    let seq = 0;
    user.addEventListener("input", debounce(async () => {
      const v = user.value.trim(), id = ++seq;
      if (v.length < 3) { hint.textContent = ""; hint.className = "caption hint"; return; }
      try {
        const r = await api("/api/account/username-available?username=" + encodeURIComponent(v));
        if (id !== seq) return;
        hint.textContent = r.message;
        hint.className = "caption hint " + (r.available ? "ok" : "bad");
      } catch { hint.textContent = ""; }
    }, 350));
  }
})();
