// ============================================================
// Ansicht "Einstellungen" (über das Menü)
// Bisher: Feiertage (Bundesland, neu laden, feste Termine
// an Feiertagen ausfallen lassen). Weitere Einstellungen
// (Schriftgröße, Baumanagement-Modus) folgen später.
// ============================================================

const EinstellungenView = (() => {
  const esc = (s) => Editor.esc(s);
  let busy = false;

  async function render(container) {
    const settings = await Store.getSettings();
    const st = Holidays.state;
    const status = Holidays.status;
    const loadedAt = Object.entries(settings.feiertageCache || {})
      .filter(([k]) => k.endsWith("-" + st))
      .map(([, v]) => v.fetchedAt)
      .sort()
      .pop();
    const next = Holidays.upcoming(6);

    container.innerHTML = `
      <h3 class="list-group">Feiertage</h3>
      <div class="form-group settings">
        <label class="row"><span>Bundesland</span>
          <select name="land">
            ${Object.entries(Holidays.STATES).map(([code, name]) => `<option value="${code}" ${code === st ? "selected" : ""}>${name}</option>`).join("")}
          </select>
        </label>
        <label class="row"><span>Feste Termine fallen an Feiertagen aus <small class="muted">z. B. Vorlesungen</small></span>
          <input type="checkbox" class="switch" name="skip" ${Holidays.skipFixed ? "checked" : ""}>
        </label>
        <div class="row row--stack">
          <span class="${status.ok === false ? "meta--warn" : "muted"}">${esc(status.message)}${loadedAt ? ` · zuletzt geladen ${new Date(loadedAt).toLocaleDateString("de-DE")}` : ""}</span>
          <button type="button" class="link-btn" data-reload>${busy ? "Lädt …" : "Jetzt neu laden"}</button>
        </div>
      </div>
      ${next.length ? `
        <h3 class="list-group">Nächste Feiertage <span>${esc(Holidays.STATES[st])}</span></h3>
        <ul class="wl">
          ${next.map((h) => `<li class="wl-row wl-row--holiday" style="--c:var(--holiday)">
            <span class="wl-time">${Schedule.parseDate(h.date).toLocaleDateString("de-DE", { weekday: "short", day: "numeric", month: "short" })}</span>
            <span class="wl-title">${esc(h.name)}</span></li>`).join("")}
        </ul>` : ""}
      <p class="plan-hint plan-hint--small">Quelle: Nager.Date (date.nager.at), kostenlos und ohne Anmeldung. Abgefragt werden nur Jahr und Land, keine persönlichen Daten.</p>`;

    container.querySelector('[name="land"]').addEventListener("change", async (e) => {
      busy = true;
      await render(container);
      await Holidays.setState(e.target.value);
      busy = false;
      await render(container);
    });
    container.querySelector('[name="skip"]').addEventListener("change", (e) => Holidays.setSkipFixed(e.target.checked));
    container.querySelector("[data-reload]").addEventListener("click", async () => {
      busy = true;
      await render(container);
      await Holidays.refresh({ force: true });
      busy = false;
      await render(container);
    });
  }

  return { render, leave() {} };
})();
