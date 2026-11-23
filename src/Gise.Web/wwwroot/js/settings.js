/* Hesap Ayarları: each section is a separate PUT to /api/account/* with inline validation. */
(function () {
  const { $, $$, api, debounce, validateForm, applyServerErrors, setError, busy, toast } = G;

  async function submit(form, after) {
    if (!validateForm(form)) return;
    const btn = $('button[type="submit"]', form), msg = $("[data-form-msg]", form);
    busy(btn, true, "Kaydediliyor…");
    try {
      const body = Object.fromEntries(new FormData(form));
      const res = await api(form.dataset.endpoint, { method: "PUT", body });
      if (msg) { msg.hidden = false; msg.className = "msg okm"; msg.style.color = ""; msg.textContent = res.message; delete msg.dataset.hint; }
      after && after(res);
    } catch (err) {
      applyServerErrors(form, err); // marks the field and writes the message into the form's error box
    } finally { busy(btn, false); }
  }

  // Username with debounced availability check.
  const fUser = $("#fUser"), nu = $("#username"), nuBtn = $("#nuBtn"), nuMsg = $("#nuMsg");
  const current = () => $("#curUser").textContent.replace("@", "");
  let seq = 0;
  nu.addEventListener("input", debounce(async () => {
    const v = nu.value.trim(), id = ++seq;
    nuBtn.disabled = true;
    if (!v) { setError(nu, ""); return; }
    if (v === current()) { setError(nu, "Bu zaten senin kullanıcı adın."); return; }
    try {
      const r = await api("/api/account/username-available?username=" + encodeURIComponent(v));
      if (id !== seq) return;
      if (r.available) { setError(nu, ""); nuMsg.style.color = "var(--ok)"; nuMsg.textContent = r.message; nuBtn.disabled = false; }
      else setError(nu, r.message);
    } catch (err) { setError(nu, err.message); }
  }, 300));
  fUser.addEventListener("submit", e => {
    e.preventDefault();
    submit(fUser, res => {
      $("#curUser").textContent = "@" + res.username;
      nu.value = ""; nuBtn.disabled = true; nuMsg.style.color = "var(--label-2)"; nuMsg.textContent = "3–20 karakter; harf, rakam, nokta ve alt çizgi.";
      toast(res.message, async () => {
        try { const r = await api("/api/account/username", { method: "PUT", body: { username: res.previous } }); $("#curUser").textContent = "@" + r.username; toast("Geri alındı."); }
        catch (err) { toast(err.message, null, "bad"); }
      });
    });
  });

  const fMail = $("#fMail");
  fMail.addEventListener("submit", e => { e.preventDefault(); submit(fMail, res => { $("#curMail").textContent = res.email; fMail.reset(); }); });

  // Password strength meter + rule checklist.
  const fPass = $("#fPass"), np = $("#np"), np2 = $("#np2");
  const check = () => {
    const v = np.value, r = { len: v.length >= 8, up: /[A-ZÇĞİÖŞÜ]/.test(v), num: /\d/.test(v), match: v.length > 0 && v === np2.value };
    $$("#rules li").forEach(li => li.classList.toggle("on", r[li.dataset.r]));
    $("#meter").dataset.s = String(!v ? 0 : [r.len, r.up, r.num, v.length >= 12].filter(Boolean).length || 1);
  };
  np.addEventListener("input", check); np2.addEventListener("input", check);
  fPass.addEventListener("submit", e => { e.preventDefault(); submit(fPass, () => { fPass.reset(); check(); }); });
})();
