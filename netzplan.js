// ============================================================
// Netzplan eines Ziels (Kästchen mit Pfeilen)
//
// Jedes Unterziel ist ein Kästchen mit Name, Dauer und Puffer.
// Spalten = Reihenfolge der Abhängigkeiten (links startet zuerst).
// Farben: kritisch (rot), eng (orange), Hauptpfad (grau, dick).
// Pfeile: Abhängigkeiten, beschriftet wie im Baumanagement:
//   NF = Normalfolge (Ende → Anfang), AF = Anfangsfolge (Anfang → Anfang),
//   EF = Endfolge (Ende → Ende), SF = Sprungfolge (Anfang → Ende)
// Antippen eines Kästchens zeigt alle Werte im Netzplan-Kästchen
// nach DIN 69900: FAZ · Dauer · FEZ / Name / SAZ · Puffer · SEZ.
// Abhängigkeiten werden (noch) im Formular des Unterziels angelegt.
// ============================================================

const Netzplan = (() => {
  const S = Schedule;
  const DEP = Model.DEP_TYPES;
  const esc = (s) => Editor.esc(s);
  const W = 160, H = 86, GX = 50, GY = 16, PAD = 14, PADX = 40; // PADX: Platz für Pfeile, die links herumlaufen (AF/SF)
  const SHORT = { [DEP.EA]: "NF", [DEP.AA]: "AF", [DEP.EE]: "EF", [DEP.AE]: "SF" };
  const LONG = { [DEP.EA]: "Ende → Anfang", [DEP.AA]: "Anfang → Anfang", [DEP.EE]: "Ende → Ende", [DEP.AE]: "Anfang → Ende" };
  const dShort = (iso) => S.parseDate(iso).toLocaleDateString("de-DE", { day: "numeric", month: "numeric" });

  // Spalten und Zeilen festlegen
  function layout(subs) {
    const byId = Object.fromEntries(subs.map((s) => [s.id, s]));
    const level = {};
    const lvl = (id, seen = new Set()) => {
      if (level[id] != null) return level[id];
      if (seen.has(id)) return 0; // Sicherheit bei Kreisen
      seen.add(id);
      const preds = (byId[id].dependencies || []).filter((d) => byId[d.fromId]);
      level[id] = preds.length ? 1 + Math.max(...preds.map((d) => lvl(d.fromId, seen))) : 0;
      return level[id];
    };
    subs.forEach((s) => lvl(s.id));
    const cols = [];
    subs.forEach((s) => { (cols[level[s.id]] = cols[level[s.id]] || []).push(s); });
    const row = {};
    cols.forEach((col, c) => {
      // Reihenfolge: in der Nähe der Vorgänger (weniger Überkreuzungen)
      if (c > 0) {
        const bary = (s) => {
          const ps = (s.dependencies || []).filter((d) => row[d.fromId] != null).map((d) => row[d.fromId]);
          return ps.length ? ps.reduce((a, b) => a + b, 0) / ps.length : 99;
        };
        col.sort((a, b) => bary(a) - bary(b) || a.order - b.order);
      }
      col.forEach((s, r) => { row[s.id] = r; });
    });
    const rows = Math.max(1, ...cols.map((c) => c.length));
    const pos = {};
    cols.forEach((col, c) => col.forEach((s, r) => {
      const offset = ((rows - col.length) * (H + GY)) / 2; // Spalte mittig
      pos[s.id] = { x: PADX + c * (W + GX), y: PAD + offset + r * (H + GY) };
    }));
    const endPos = { x: PADX + cols.length * (W + GX), y: PAD + ((rows - 1) * (H + GY)) / 2 + (H - 56) / 2 };
    return { pos, endPos, width: endPos.x + 96 + PAD, height: PAD * 2 + rows * (H + GY) - GY };
  }

  function durationText(sg, n, bau) {
    if (sg.done) return "erledigt";
    if (bau) {
      const g = sg.assignee && sg.assignee !== Model.OWNER_LOCAL ? sg.assignee + " · " : "";
      return `${g}${n ? n.D : sg.durationDays} AT`; // AT = Arbeitstage
    }
    if (sg.mode === "dauer") return GoalMath.fmtDays(n ? n.D : sg.durationDays);
    const h = Model.restzeitStunden(sg);
    return `${GoalMath.fmtHours(h)}${n ? ` ≈ ${GoalMath.fmtDays(n.D)}` : ""}`;
  }

  function edgePath(a, b, type) {
    // Anfang = linke Kante, Ende = rechte Kante
    const fromEnd = type === DEP.EA || type === DEP.EE;
    const toStart = type === DEP.EA || type === DEP.AA;
    const x1 = a.x + (fromEnd ? W : 0), y1 = a.y + H / 2;
    const x2 = b.x + (toStart ? 0 : W), y2 = b.y + H / 2;
    const k = Math.max(30, Math.abs(x2 - x1) / 2);
    const c1 = x1 + (fromEnd ? k : -k), c2 = x2 + (toStart ? -k : k);
    // Beschriftung kurz vor der Pfeilspitze (im Zwischenraum, nicht hinter einem Kästchen)
    return { d: `M${x1},${y1} C${c1},${y1} ${c2},${y2} ${x2},${y2}`, lx: x2 + (toStart ? -8 : 8), ly: y2 - 8, anchor: toStart ? "end" : "start" };
  }

  function html(goal, res) {
    const subs = [...goal.subgoals].sort((a, b) => a.order - b.order);
    if (!subs.length) return `<p class="plan-hint">Noch keine Unterziele – lege welche an, dann entsteht hier der Netzplan.</p>`;
    if (res && res.cycle) return `<div class="advice advice--crit">Die Abhängigkeiten bilden einen Kreis – so lässt sich kein Netzplan zeichnen.</div>`;
    const nodes = (res && res.nodes) || {};
    const bau = goal.area === "bau";
    const { pos, endPos, width, height } = layout(subs);
    const byId = Object.fromEntries(subs.map((s) => [s.id, s]));
    const hasSucc = new Set();

    const edges = [];
    subs.forEach((s) => (s.dependencies || []).forEach((d) => {
      if (!byId[d.fromId]) return;
      hasSucc.add(d.fromId);
      const type = d.type || DEP.EA;
      const p = edgePath(pos[d.fromId], pos[s.id], type);
      const crit = nodes[s.id] && nodes[d.fromId] && nodes[s.id].critical && nodes[d.fromId].critical;
      const lag = Number(d.lagDays) || 0;
      const label = type !== DEP.EA || lag ? `${SHORT[type]}${lag ? ` ${lag > 0 ? "+" : "−"}${Math.abs(lag)} Tg` : ""}` : "";
      edges.push(`<path class="nz-edge ${crit ? "nz-edge--crit" : ""}" d="${p.d}" marker-end="url(#nz-arrow${crit ? "-crit" : ""})"/>`
        + (label ? `<text class="nz-label" x="${p.lx}" y="${p.ly}" text-anchor="${p.anchor}">${esc(label)}</text>` : ""));
    }));
    // Unterziele ohne Nachfolger führen zum Ziel
    subs.filter((s) => !hasSucc.has(s.id)).forEach((s) => {
      const a = pos[s.id];
      const x1 = a.x + W, y1 = a.y + H / 2, x2 = endPos.x, y2 = endPos.y + 28;
      edges.push(`<path class="nz-edge nz-edge--end" d="M${x1},${y1} C${x1 + 24},${y1} ${x2 - 24},${y2} ${x2},${y2}" marker-end="url(#nz-arrow)"/>`);
    });

    const boxes = subs.map((s, i) => {
      const n = nodes[s.id];
      const p = pos[s.id];
      const cls = ["nz-node", s.done ? "nz-node--done" : "", n && n.level ? "nz-node--" + n.level : "", n && n.mainPath ? "nz-node--main" : ""].join(" ");
      const fmtD = (d) => (bau ? `${d} ${Math.abs(d) === 1 ? "Tag" : "Tage"}` : GoalMath.fmtDays(d));
      const puffer = s.done || !n ? "" : n.behind ? `<b class="meta--warn">${fmtD(-n.TF)} zu spät</b>` : `Puffer ${fmtD(n.TF)}`;
      return `
        <button class="${cls}" data-node="${esc(s.id)}" style="left:${p.x}px;top:${p.y}px;width:${W}px;height:${H}px;--c:${goal.color}"
          aria-label="${esc(s.title)}: ${esc(durationText(s, n, bau))}${puffer ? ", " + puffer.replace(/<[^>]+>/g, "") : ""}">
          <span class="nz-title"><span class="nz-num">${i + 1}</span>${s.done ? "✓ " : ""}${esc(s.title)}</span>
          <span class="nz-meta">${esc(durationText(s, n, bau))}</span>
          <span class="nz-meta">${puffer}</span>
          ${n && !s.done ? `<span class="nz-dates">${dShort(n.startDate)}–${dShort(n.endDate)}</span>` : ""}
        </button>`;
    }).join("");

    const end = `
      <div class="nz-end" style="left:${endPos.x}px;top:${endPos.y}px">
        <b>Ziel</b><span>${goal.deadline ? esc(dShort(goal.deadline)) : "ohne Deadline"}</span>
      </div>`;

    return `
      <div class="nz-wrap">
        <div class="nz-canvas" style="width:${width}px;height:${height}px">
          <svg class="nz-svg" width="${width}" height="${height}" aria-hidden="true">
            <defs>
              <marker id="nz-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" class="nz-arrowhead"/></marker>
              <marker id="nz-arrow-crit" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" class="nz-arrowhead nz-arrowhead--crit"/></marker>
            </defs>
            ${edges.join("")}
          </svg>
          ${boxes}${end}
        </div>
      </div>
      <p class="month-legend">
        <span><i class="nz-key nz-key--kritisch"></i>kritisch</span>
        <span><i class="nz-key nz-key--eng"></i>eng</span>
        <span><i class="nz-key nz-key--main"></i>Hauptpfad</span>
        <span>NF/AF/EF/SF = Art der Folge</span>
      </p>
      <p class="plan-hint plan-hint--small">Kästchen antippen = alle Werte · zur Seite wischen, wenn der Plan breiter ist</p>`;
  }

  // Netzplan-Kästchen nach DIN mit allen Werten
  function openNode(goal, res, sgId) {
    const sg = goal.subgoals.find((x) => x.id === sgId);
    const n = res && !res.cycle ? res.nodes[sgId] : null;
    if (!sg) return;
    const d = (iso) => esc(S.parseDate(iso).toLocaleDateString("de-DE", { weekday: "short", day: "numeric", month: "numeric" }));
    const idx = [...goal.subgoals].sort((a, b) => a.order - b.order).findIndex((x) => x.id === sgId) + 1;
    const byId = Object.fromEntries(goal.subgoals.map((x) => [x.id, x]));
    const deps = (sg.dependencies || []).filter((x) => byId[x.fromId]).map((x) =>
      `${esc(byId[x.fromId].title)} <small class="muted">${SHORT[x.type || DEP.EA]} (${LONG[x.type || DEP.EA]})${Number(x.lagDays) ? `, ${x.lagDays > 0 ? "+" : ""}${x.lagDays} Tage` : ""}</small>`);
    const box = n && !sg.done ? `
      <div class="din-box" style="--c:${goal.color}">
        <div class="din-row"><span><small>FAZ</small>${d(n.startDate)}</span><span><small>Dauer</small>${goal.area === "bau" ? `${n.D} AT` : GoalMath.fmtDays(n.D)}</span><span><small>FEZ</small>${d(n.endDate)}</span></div>
        <div class="din-name"><small>Nr. ${idx}${goal.area === "bau" && sg.assignee && sg.assignee !== Model.OWNER_LOCAL ? ` · ${esc(sg.assignee)}` : ""}</small><b>${esc(sg.title)}</b> ${GoalMath.levelBadges(n)}</div>
        <div class="din-row"><span><small>SAZ</small>${d(n.latestStart)}</span><span><small>GP</small>${goal.area === "bau" ? `${n.TF} Tg` : GoalMath.fmtDays(n.TF)}</span><span><small>SEZ</small>${d(n.latestEnd)}</span></div>
      </div>
      <dl class="cpm-values">
        <dt>Freier Puffer (FP)</dt><dd>${goal.area === "bau" ? `${n.FF} Tage` : GoalMath.fmtDays(n.FF)}</dd>
        ${n.neededHours > 0 ? `<dt>Auslastung</dt><dd>${GoalMath.pct(n.utilization)} (${GoalMath.fmtHours(n.neededHours)} von ${GoalMath.fmtHours(n.availableHours)} frei)</dd>` : ""}
        <dt>${sg.mode === "dauer" ? "Dauer" : "Restaufwand"}</dt><dd>${esc(durationText(sg, n, goal.area === "bau"))}</dd>
      </dl>` : `<p class="notice">${sg.done ? "Dieses Unterziel ist erledigt." : "Keine Werte (Ziel ohne Berechnung)."}</p>`;

    Editor.show(`
      <div class="sheet sheet--small" role="dialog" aria-modal="true" aria-labelledby="sheet-title">
        <div class="sheet__head">
          <button class="link-btn" data-close>Schließen</button>
          <h2 id="sheet-title">Vorgang ${idx}</h2>
          <span class="sheet__spacer"></span>
        </div>
        ${box}
        ${deps.length ? `<p class="notice"><b>Wartet auf:</b><br>${deps.join("<br>")}</p>` : ""}
        <p class="hint hint--plain">FAZ/FEZ = frühester Anfang/frühestes Ende · SAZ/SEZ = spätester Anfang/spätestes Ende · GP = Gesamtpuffer · FP = freier Puffer (Verzug, ohne den Nachfolger zu verschieben)</p>
        <div class="form-group form-actions">
          ${sg.done ? "" : `<button class="action" data-a="progress">Fortschritt eintragen</button>`}
          <button class="action" data-a="edit">Bearbeiten</button>
        </div>
      </div>`);
    const layer = document.querySelector(".sheet-layer");
    layer.querySelector("[data-close]").onclick = Editor.close;
    layer.querySelectorAll("[data-a]").forEach((b) => {
      b.onclick = () => {
        Editor.close();
        if (b.dataset.a === "progress") Goals.openProgress(goal.id, sgId);
        else Goals.editSubgoal(goal.id, sgId);
      };
    });
  }

  function wire(container, goal, res) {
    container.querySelectorAll("[data-node]").forEach((b) => b.addEventListener("click", () => openNode(goal, res, b.dataset.node)));
  }

  return { html, wire, openNode };
})();
