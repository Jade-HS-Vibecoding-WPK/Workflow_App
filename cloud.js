// ============================================================
// Konto & Abgleich (Azure Stufe 1)
//
// Nur in der Online-Version auf Azure Static Web Apps aktiv. Auf
// GitHub Pages bleibt die App rein lokal (kein Konto, kein Server).
//
// Ablauf: Die App speichert wie immer zuerst auf dem Gerät (Store).
// Ist man angemeldet, schickt sie den Stand an den Server (/api/data);
// der gleicht ihn mit dem Stand der anderen Geräte ab und schickt das
// Ergebnis zurück. Regel: pro Eintrag gewinnt die neueste Änderung.
// Anmelden übernimmt Azure (GitHub- oder Microsoft-Konto) – die App
// sieht nie ein Passwort.
// ============================================================

const Cloud = (() => {
  // Läuft die App auf Azure? (Für Tests: window.WORKFLOW_CLOUD = true)
  const enabled = () => location.hostname.endsWith(".azurestaticapps.net") || window.WORKFLOW_CLOUD === true;

  let me = null;         // angemeldeter Nutzer (von Azure) oder null
  let state = "aus";     // aus | bereit | läuft | ok | fehler | offline
  let lastSync = null;
  let busy = false, again = false, timer = null;

  // Gleiche Regel wie auf dem Server (api/src/merge.js)
  function merge(a, b) {
    a = a || {}; b = b || {};
    const entries = {};
    const deleted = { ...(a.deleted || {}) };
    for (const [id, at] of Object.entries(b.deleted || {})) if (!deleted[id] || at > deleted[id]) deleted[id] = at;
    const ids = new Set([...Object.keys(a.entries || {}), ...Object.keys(b.entries || {})]);
    for (const id of ids) {
      const x = (a.entries || {})[id], y = (b.entries || {})[id];
      const win = !x ? y : !y ? x : String(y.updatedAt || "") > String(x.updatedAt || "") ? y : x;
      if (deleted[id] && String(deleted[id]) >= String(win.updatedAt || "")) continue;
      entries[id] = win;
      delete deleted[id];
    }
    const aS = a.settingsUpdatedAt || "", bS = b.settingsUpdatedAt || "";
    const newer = bS > aS ? b : a;
    return { entries, deleted, settings: newer.settings || {}, settingsUpdatedAt: newer.settingsUpdatedAt || null };
  }

  async function whoAmI() {
    try {
      const r = await fetch("/.auth/me", { cache: "no-store" });
      if (!r.ok) return null;
      const j = await r.json();
      return j && j.clientPrincipal ? j.clientPrincipal : null;
    } catch {
      return null;
    }
  }

  async function sync() {
    if (!me) return;
    if (busy) { again = true; return; }
    if (!navigator.onLine) { state = "offline"; render(); return; }
    busy = true; state = "läuft"; render();
    try {
      const res = await fetch("/api/data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(await Store.syncSnapshot()),
      });
      if (res.status === 401) { me = null; state = "bereit"; render(); return; } // abgemeldet
      if (!res.ok) throw new Error("Server antwortet " + res.status);
      await Store.syncMerge(await res.json());
      lastSync = new Date();
      state = "ok";
    } catch (err) {
      console.warn("Abgleich fehlgeschlagen:", err);
      state = navigator.onLine ? "fehler" : "offline";
    } finally {
      busy = false;
      render();
      if (again) { again = false; schedule(); }
    }
  }

  // Nach Änderungen kurz warten, dann abgleichen (viele Änderungen = ein Abgleich)
  function schedule() {
    clearTimeout(timer);
    timer = setTimeout(sync, 2500);
  }

  // ---------- Konto-Bereich im Menü ----------
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const back = () => encodeURIComponent(location.pathname + location.hash);

  function render() {
    const box = document.getElementById("konto");
    if (!box) return;
    box.hidden = !enabled();
    if (!enabled()) return;
    if (!me) {
      box.innerHTML = `
        <div class="menu__group-label">Konto</div>
        <div class="konto">
          <p>Melde dich an, um deine Daten auf allen Geräten zu haben. Ohne Anmeldung bleibt alles nur auf diesem Gerät.</p>
          <a class="konto__btn" href="/.auth/login/github?post_login_redirect_uri=${back()}">Mit GitHub anmelden</a>
          <a class="konto__btn" href="/.auth/login/aad?post_login_redirect_uri=${back()}">Mit Microsoft anmelden</a>
        </div>`;
      return;
    }
    const prov = { github: "GitHub", aad: "Microsoft" }[me.identityProvider] || me.identityProvider;
    const status = {
      läuft: "gleicht ab …",
      ok: lastSync ? `abgeglichen ${lastSync.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })} Uhr` : "abgeglichen",
      fehler: "Abgleich gerade nicht möglich – deine Daten sind auf dem Gerät sicher",
      offline: "offline – wird nachgeholt",
      bereit: "",
    }[state] || "";
    box.innerHTML = `
      <div class="menu__group-label">Konto</div>
      <div class="konto">
        <p><b>${esc(me.userDetails)}</b> <small>(${esc(prov)})</small><br><small class="konto__status konto__status--${state}">${esc(status)}</small></p>
        <div class="konto__row">
          <button class="link-btn" data-sync-now>Jetzt abgleichen</button>
          <a class="link-btn" href="/.auth/logout?post_logout_redirect_uri=/">Abmelden</a>
        </div>
      </div>`;
    box.querySelector("[data-sync-now]").onclick = () => sync();
  }

  async function init() {
    render();
    if (!enabled()) return;
    me = await whoAmI();
    state = me ? "bereit" : "aus";
    render();
    if (!me) return;
    await sync();
    // Eigene Änderungen hochladen (nicht die, die gerade vom Server kamen)
    Store.subscribe((c) => { if (c.action !== "abgleich") schedule(); });
    // Änderungen anderer Geräte holen: beim Zurückkehren in die App, online, jede Minute
    document.addEventListener("visibilitychange", () => { if (document.visibilityState === "visible") sync(); });
    window.addEventListener("online", () => sync());
    setInterval(() => { if (document.visibilityState === "visible") sync(); }, 60 * 1000);
  }

  return { init, merge, sync, enabled, get user() { return me; } };
})();
