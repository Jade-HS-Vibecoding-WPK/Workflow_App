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
  const W = 160, H = 86, GX = 76, GY = 18, PAD = 14, PADX = 16, LANE = 7, R = 7;
  const SHORT = { [DEP.EA]: "NF", [DEP.AA]: "AF", [DEP.EE]: "EF", [DEP.AE]: "SF" };
  const LONG = { [DEP.EA]: "Ende → Anfang", [DEP.AA]: "Anfang → Anfang", [DEP.EE]: "Ende → Ende", [DEP.AE]: "Anfang → Ende" };
  const dShort = (iso) => S.parseDate(iso).toLocaleDateString("de-DE", { day: "numeric", month: "numeric" });

  // ---------- 1. Welche Pfeile werden gezeichnet? ----------
  // Indirekte Pfeile ausblenden: Wartet C auf A, und gibt es schon den
  // Weg A → B → C (alles "Ende → Anfang" ohne Wartezeit), dann sagt
  // der Pfeil A → C nichts Neues. Gerechnet wird trotzdem mit allen.
  function displayEdges(subs) {
    const byId = Object.fromEntries(subs.map((s) => [s.id, s]));
    const all = [];
    subs.forEach((s) => (s.dependencies || []).forEach((d) => {
      if (byId[d.fromId]) all.push({ from: d.fromId, to: s.id, type: d.type || DEP.EA, lag: Number(d.lagDays) || 0 });
    }));
    const strict = all.filter((e) => e.type === DEP.EA && e.lag >= 0);
    const reach = (from, to, skip) => {
      const stack = [from], seen = new Set();
      while (stack.length) {
        const id = stack.pop();
        for (const e of strict) {
          if (e === skip || e.from !== id || seen.has(e.to)) continue;
          if (e.to === to) return true;
          seen.add(e.to);
          stack.push(e.to);
        }
      }
      return false;
    };
    const shown = all.filter((e) => !(e.type === DEP.EA && e.lag === 0 && reach(e.from, e.to, e)));
    return { all, shown, hidden: all.length - shown.length };
  }

  // ---------- 2. Spalten und Zeilen ----------
  function layout(subs, edges) {
    const preds = {}, succs = {};
    subs.forEach((s) => { preds[s.id] = []; succs[s.id] = []; });
    edges.forEach((e) => { preds[e.to].push(e.from); succs[e.from].push(e.to); });
    // Spalte = längste Kette davor (frühestmöglich)
    const col = {};
    const colOf = (id, seen = new Set()) => {
      if (col[id] != null) return col[id];
      if (seen.has(id)) return 0;
      seen.add(id);
      col[id] = preds[id].length ? 1 + Math.max(...preds[id].map((p) => colOf(p, seen))) : 0;
      return col[id];
    };
    subs.forEach((s) => colOf(s.id));
    // Anfangs-Kästchen ohne Vorgänger direkt vor ihren Nachfolger schieben (kurze Pfeile)
    [...subs].sort((a, b) => col[b.id] - col[a.id]).forEach((s) => {
      if (!preds[s.id].length && succs[s.id].length) col[s.id] = Math.max(col[s.id], Math.min(...succs[s.id].map((t) => col[t])) - 1);
    });
    const cols = [];
    subs.forEach((s) => { (cols[col[s.id]] = cols[col[s.id]] || []).push(s); });
    for (let c = 0; c < cols.length; c++) cols[c] = cols[c] || [];
    // Reihenfolge in der Spalte: nahe bei den Vorgängern (weniger Kreuzungen)
    const row = {};
    cols.forEach((list) => {
      const bary = (s) => {
        const ps = preds[s.id].filter((p) => row[p] != null).map((p) => row[p]);
        return ps.length ? ps.reduce((a, b) => a + b, 0) / ps.length : null;
      };
      list.sort((a, b) => {
        const x = bary(a), y = bary(b);
        if (x == null && y == null) return a.order - b.order;
        if (x == null) return 1;
        if (y == null) return -1;
        return x - y || a.order - b.order;
      });
      list.forEach((s, r) => { row[s.id] = r; });
    });
    return { col, cols, preds, succs };
  }

  // Linienzug mit abgerundeten Ecken
  function roundPath(pts) {
    const p = pts.filter((q, i) => i === 0 || q[0] !== pts[i - 1][0] || q[1] !== pts[i - 1][1]);
    let d = `M${p[0][0]},${p[0][1]}`;
    for (let i = 1; i < p.length - 1; i++) {
      const [x0, y0] = p[i - 1], [x, y] = p[i], [x1, y1] = p[i + 1];
      const l0 = Math.hypot(x - x0, y - y0), l1 = Math.hypot(x1 - x, y1 - y);
      const r = Math.min(R, l0 / 2, l1 / 2);
      const ax = x - ((x - x0) / (l0 || 1)) * r, ay = y - ((y - y0) / (l0 || 1)) * r;
      const bx = x + ((x1 - x) / (l1 || 1)) * r, by = y + ((y1 - y) / (l1 || 1)) * r;
      d += ` L${ax},${ay} Q${x},${y} ${bx},${by}`;
    }
    const last = p[p.length - 1];
    return d + ` L${last[0]},${last[1]}`;
  }

  function durationText(sg, n, bau) {
    if (sg.done) return "erledigt";
    if (bau) {
      const g = sg.assignee && sg.assignee !== Model.OWNER_LOCAL ? sg.assignee + " · " : "";
      if (Number(sg.durationDays) === 0) return `${g}◆ Meilenstein`; // DIN 69900: Ereignis ohne Dauer
      return `${g}${n ? n.D : sg.durationDays} AT`; // AT = Arbeitstage
    }
    if (sg.mode === "dauer") return GoalMath.fmtDays(n ? n.D : sg.durationDays);
    const h = Model.restzeitStunden(sg);
    return `${GoalMath.fmtHours(h)}${n ? ` ≈ ${GoalMath.fmtDays(n.D)}` : ""}`;
  }

  function html(goal, res) {
    const subs = [...goal.subgoals].sort((a, b) => a.order - b.order);
    if (!subs.length) return `<p class="plan-hint">Noch keine Unterziele – lege welche an, dann entsteht hier der Netzplan.</p>`;
    if (res && res.cycle) return `<div class="advice advice--crit">Die Abhängigkeiten bilden einen Kreis – so lässt sich kein Netzplan zeichnen.</div>`;
    const nodes = (res && res.nodes) || {};
    const bau = goal.area === "bau";
    const { shown, hidden } = displayEdges(subs);
    const { col, cols, succs } = layout(subs, shown);
    const endCol = cols.length;
    const sinks = subs.filter((s) => !succs[s.id].length).map((s) => s.id);

    // Pfeile, die direkt in die nächste Spalte gehen ("Normalfolge"), laufen
    // im Zwischenraum; alle anderen über einen Kanal oberhalb der Kästchen.
    const isDirect = (e) => e.type === DEP.EA && col[e.to] - col[e.from] === 1;
    const channel = shown.filter((e) => !isDirect(e));
    const top = channel.length ? 12 + channel.length * LANE : 0;

    const rows = Math.max(1, ...cols.map((c) => c.length));
    const colX = (c) => PADX + c * (W + GX);
    const pos = {};
    cols.forEach((list, c) => list.forEach((s, r) => {
      const offset = ((rows - list.length) * (H + GY)) / 2; // Spalte mittig
      pos[s.id] = { x: colX(c), y: top + PAD + offset + r * (H + GY) };
    }));
    const endPos = { x: colX(endCol), y: top + PAD + ((rows - 1) * (H + GY)) / 2 + (H - 56) / 2 };
    const width = endPos.x + 84 + PADX;
    const height = top + PAD * 2 + rows * (H + GY) - GY;

    // Eigene senkrechte "Spur" im Zwischenraum für jedes Ziel-Kästchen
    const laneX = {};
    const targetsByCol = {};
    shown.filter(isDirect).forEach((e) => { (targetsByCol[col[e.to]] = targetsByCol[col[e.to]] || new Set()).add(e.to); });
    Object.entries(targetsByCol).forEach(([c, set]) => {
      const list = [...set].sort((a, b) => pos[a].y - pos[b].y);
      const mid = colX(Number(c)) - GX / 2;
      list.forEach((id, i) => { laneX[id] = mid + (i - (list.length - 1) / 2) * LANE * 1.6; });
    });

    const edgeHtml = (e, d, crit, label, lx, ly, anchor) =>
      `<path class="nz-edge ${crit ? "nz-edge--crit" : ""} ${e.end ? "nz-edge--end" : ""}" data-from="${esc(e.from)}" data-to="${esc(e.to)}" d="${d}" marker-end="url(#nz-arrow${crit ? "-crit" : ""})"/>`
      + (label ? `<text class="nz-label" data-from="${esc(e.from)}" data-to="${esc(e.to)}" x="${lx}" y="${ly}" text-anchor="${anchor}">${esc(label)}</text>` : "");

    const out = [];
    let ch = 0;
    shown.forEach((e) => {
      const a = pos[e.from], b = pos[e.to];
      const fromEnd = e.type === DEP.EA || e.type === DEP.EE;
      const toStart = e.type === DEP.EA || e.type === DEP.AA;
      const x1 = a.x + (fromEnd ? W : 0), y1 = a.y + H / 2;
      const x2 = b.x + (toStart ? 0 : W), y2 = b.y + H / 2;
      let pts;
      if (isDirect(e)) {
        const xl = laneX[e.to];
        pts = [[x1, y1], [xl, y1], [xl, y2], [x2, y2]];
      } else {
        const k = ch++;
        const yc = 8 + k * LANE;
        const xs = x1 + (fromEnd ? 1 : -1) * (10 + (k % 4) * LANE);
        const xe = x2 + (toStart ? -1 : 1) * (10 + (k % 4) * LANE);
        pts = [[x1, y1], [xs, y1], [xs, yc], [xe, yc], [xe, y2], [x2, y2]];
      }
      const crit = nodes[e.to] && nodes[e.from] && nodes[e.to].critical && nodes[e.from].critical;
      const label = e.type !== DEP.EA || e.lag ? `${SHORT[e.type]}${e.lag ? ` ${e.lag > 0 ? "+" : "−"}${Math.abs(e.lag)} Tg` : ""}` : "";
      out.push(edgeHtml(e, roundPath(pts), crit, label, x1 + (fromEnd ? 5 : -5), y1 - 5, fromEnd ? "start" : "end"));
    });
    // Kästchen ohne Nachfolger führen zum Ziel (gemeinsame Spur)
    const endLane = colX(endCol) - GX / 2;
    sinks.forEach((id) => {
      const a = pos[id];
      const y1 = a.y + H / 2, y2 = endPos.y + 28;
      out.push(edgeHtml({ from: id, to: "ziel", end: true }, roundPath([[a.x + W, y1], [endLane, y1], [endLane, y2], [endPos.x, y2]]), false, "", 0, 0, "start"));
    });

    const boxes = subs.map((s, i) => {
      const n = nodes[s.id];
      const p = pos[s.id];
      const cls = ["nz-node", bau && Number(s.durationDays) === 0 ? "nz-node--ms" : "", s.done ? "nz-node--done" : "", n && n.level ? "nz-node--" + n.level : "", n && n.mainPath ? "nz-node--main" : ""].join(" ");
      const fmtD = (d) => (bau ? `${d} AT` : GoalMath.fmtDays(d)); // AT = Arbeitstage
      const puffer = s.done || !n ? "" : n.behind ? `<b class="meta--warn">${fmtD(-n.TF)} zu spät</b>` : `Puffer ${fmtD(GoalMath.shownTF(n, res))}`;
      return `
        <button class="${cls}" data-node="${esc(s.id)}" style="left:${p.x}px;top:${p.y}px;width:${W}px;height:${H}px;--c:${goal.color}"
          aria-label="${esc(s.title)}: ${esc(durationText(s, n, bau))}${puffer ? ", " + puffer.replace(/<[^>]+>/g, "") : ""}">
          <span class="nz-title"><span class="nz-num">${i + 1}</span>${s.done ? "✓ " : ""}${esc(s.title)}</span>
          <span class="nz-meta">${esc(durationText(s, n, bau))}</span>
          <span class="nz-meta">${puffer}</span>
          ${n && !s.done ? `<span class="nz-dates">${n.startDate === n.endDate ? dShort(n.startDate) : `${dShort(n.startDate)}–${dShort(n.endDate)}`}</span>` : ""}
        </button>`;
    }).join("");

    // "+"-Griff rechts am Kästchen: Nachfolger verbinden (antippen oder ziehen)
    const handles = subs.map((s) => {
      const p = pos[s.id];
      return `<button class="nz-handle" data-handle="${esc(s.id)}" style="left:${p.x + W - 11}px;top:${p.y + H / 2 - 11}px" aria-label="${esc(s.title)}: Nachfolger verbinden">+</button>`;
    }).join("");

    const end = `
      <div class="nz-end" style="left:${endPos.x}px;top:${endPos.y}px">
        <b>Ziel</b><span>${goal.deadline ? esc(dShort(goal.deadline)) : "ohne Deadline"}</span>
      </div>`;

    return `
      <div class="nz-connect-bar" hidden>
        <span>Tippe auf das Kästchen, das nach <b></b> kommt.</span>
        <button class="link-btn" data-connect-cancel>Abbrechen</button>
      </div>
      <div class="nz-wrap">
        <div class="nz-canvas" style="width:${width}px;height:${height}px">
          <svg class="nz-svg" width="${width}" height="${height}" aria-hidden="true">
            <defs>
              <marker id="nz-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" class="nz-arrowhead"/></marker>
              <marker id="nz-arrow-crit" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" class="nz-arrowhead nz-arrowhead--crit"/></marker>
            </defs>
            ${out.join("")}
            <path class="nz-temp" d=""/>
          </svg>
          ${boxes}${handles}${end}
        </div>
      </div>
      <p class="month-legend">
        <span><i class="nz-key nz-key--kritisch"></i>kritisch</span>
        <span><i class="nz-key nz-key--eng"></i>eng</span>
        <span><i class="nz-key nz-key--main"></i>Hauptpfad</span>
        <span>NF/AF/EF/SF = Art der Folge</span>
      </p>
      <p class="plan-hint plan-hint--small">Kästchen antippen = alle Werte · „+“ antippen oder ziehen = Nachfolger verbinden${hidden ? ` · ${hidden} indirekte${hidden === 1 ? "r" : ""} Pfeil${hidden === 1 ? "" : "e"} ausgeblendet (ergibt sich schon über andere)` : ""} · breiter Plan: zur Seite wischen</p>`;
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
      `<span class="dep-line"><span>${esc(byId[x.fromId].title)} <small class="muted">${SHORT[x.type || DEP.EA]} (${LONG[x.type || DEP.EA]})${Number(x.lagDays) ? `, ${x.lagDays > 0 ? "+" : ""}${x.lagDays} Tage` : ""}</small></span>
        <button class="link-btn dep-remove" data-undep="${esc(x.fromId)}" aria-label="Abhängigkeit von ${esc(byId[x.fromId].title)} entfernen">Entfernen</button></span>`);
    const box = n && !sg.done ? `
      <div class="din-box" style="--c:${goal.color}">
        <div class="din-row"><span><small>FAZ</small>${d(n.startDate)}</span><span><small>Dauer</small>${goal.area === "bau" ? `${n.D} AT` : GoalMath.fmtDays(n.D)}</span><span><small>FEZ</small>${d(n.endDate)}</span></div>
        <div class="din-name"><small>Nr. ${idx}${goal.area === "bau" && sg.assignee && sg.assignee !== Model.OWNER_LOCAL ? ` · ${esc(sg.assignee)}` : ""}</small><b>${esc(sg.title)}</b> ${GoalMath.levelBadges(n)}</div>
        <div class="din-row"><span><small>SAZ</small>${d(n.latestStart)}</span><span><small>GP</small>${goal.area === "bau" ? `${n.TF} AT` : GoalMath.fmtDays(n.TF)}</span><span><small>SEZ</small>${d(n.latestEnd)}</span></div>
      </div>
      <dl class="cpm-values">
        <dt>Freier Puffer (FP)</dt><dd>${goal.area === "bau" ? `${n.FF} AT` : GoalMath.fmtDays(n.FF)}</dd>
        ${goal.area === "bau" && n.FRP != null ? `<dt>Freier Rückwärtspuffer (FRP)</dt><dd>${n.FRP} AT</dd><dt>Unabhängiger Puffer (UP)</dt><dd>${n.UP} AT</dd>` : ""}
        ${n.neededHours > 0 ? `<dt>Auslastung</dt><dd>${GoalMath.pct(n.utilization)} (${GoalMath.fmtHours(n.neededHours)} von ${GoalMath.fmtHours(n.availableHours)} frei)</dd>` : ""}
        <dt>${sg.mode === "dauer" ? "Dauer" : "Restaufwand"}</dt><dd>${esc(durationText(sg, n, goal.area === "bau"))}</dd>
        ${goal.area === "bau" ? `<dt>Arbeitszeit</dt><dd>${esc(sg.workFrom || Schedule.bauZeit.von)}–${esc(sg.workTo || Schedule.bauZeit.bis)} Uhr, Mo–Fr${sg.workFrom ? "" : " (Standard)"}</dd>` : ""}
      </dl>` : `<p class="notice">${sg.done ? "Dieses Unterziel ist erledigt." : "Keine Werte (Ziel ohne Berechnung)."}</p>`;

    Editor.show(`
      <div class="sheet sheet--small" role="dialog" aria-modal="true" aria-labelledby="sheet-title">
        <div class="sheet__head">
          <button class="link-btn" data-close>Schließen</button>
          <h2 id="sheet-title">${goal.area === "bau" && Number(sg.durationDays) === 0 ? "Meilenstein" : "Vorgang"} ${idx}</h2>
          <span class="sheet__spacer"></span>
        </div>
        ${box}
        ${deps.length ? `<div class="notice"><b>Wartet auf:</b>${deps.join("")}</div>` : ""}
        <p class="hint hint--plain">FAZ/FEZ = frühester Anfang/frühestes Ende · SAZ/SEZ = spätester Anfang/spätestes Ende · GP = Gesamtpuffer · FP = freier Puffer (Verzug, ohne den Nachfolger zu verschieben)${goal.area === "bau" ? " · FRP = so viel früher geht es, auch wenn alle Vorgänger spät liegen · UP = Spielraum, selbst wenn Vorgänger spät und Nachfolger früh liegen · AT = Arbeitstage, Werte nach DIN 69900" : ""}</p>
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
    layer.querySelectorAll("[data-undep]").forEach((b) => {
      b.onclick = async () => {
        const fromId = b.dataset.undep;
        const subgoals = goal.subgoals.map((x) => (x.id === sgId ? { ...x, dependencies: (x.dependencies || []).filter((d) => d.fromId !== fromId) } : x));
        Editor.close();
        await Store.save({ ...goal, subgoals });
        Toast.show(`„${sg.title}“ wartet nicht mehr auf „${byId[fromId].title}“`, () => Store.save(goal));
      };
    });
  }

  function wire(container, goal, res) {
    const canvas = container.querySelector(".nz-canvas");
    if (!canvas) return;
    const bar = container.querySelector(".nz-connect-bar");
    const temp = canvas.querySelector(".nz-temp");
    const byId = Object.fromEntries(goal.subgoals.map((x) => [x.id, x]));
    let source = null;

    // Darf "to" auf "from" warten? (nicht sich selbst, nicht doppelt, kein Kreis)
    const canConnect = (from, to) => from !== to && byId[to]
      && !(byId[to].dependencies || []).some((d) => d.fromId === from) && !CPM.wouldCycle(goal, from, to);

    async function connect(from, to) {
      if (!canConnect(from, to)) {
        Toast.show(from === to ? "Ein Kästchen kann nicht auf sich selbst warten" : CPM.wouldCycle(goal, from, to) ? "Das würde einen Kreis bilden" : "Diese Verbindung gibt es schon");
        return;
      }
      const subgoals = goal.subgoals.map((x) => (x.id === to ? { ...x, dependencies: [...(x.dependencies || []), { fromId: from, type: DEP.EA, lagDays: 0 }] } : x));
      await Store.save({ ...goal, subgoals });
      Toast.show(`„${byId[to].title}“ startet nach „${byId[from].title}“`, () => Store.save(goal));
    }

    function startConnect(id) {
      source = id;
      canvas.classList.add("nz--connect");
      canvas.querySelectorAll("[data-node]").forEach((n) => {
        n.classList.toggle("nz-node--source", n.dataset.node === id);
        n.classList.toggle("nz-node--target", canConnect(id, n.dataset.node));
      });
      bar.querySelector("b").textContent = `„${byId[id].title}“`;
      bar.hidden = false;
    }
    function stopConnect() {
      source = null;
      canvas.classList.remove("nz--connect");
      canvas.querySelectorAll(".nz-node--source, .nz-node--target").forEach((n) => n.classList.remove("nz-node--source", "nz-node--target"));
      bar.hidden = true;
      temp.setAttribute("d", "");
    }
    bar.querySelector("[data-connect-cancel]").addEventListener("click", stopConnect);

    // "+"-Griff: antippen = Verbinden-Modus, ziehen = direkt verbinden
    canvas.querySelectorAll("[data-handle]").forEach((h) => {
      const id = h.dataset.handle;
      let start = null, moved = false;
      h.addEventListener("pointerdown", (e) => {
        e.preventDefault();
        h.setPointerCapture(e.pointerId);
        start = { x: e.clientX, y: e.clientY };
        moved = false;
      });
      h.addEventListener("pointermove", (e) => {
        if (!start) return;
        if (Math.hypot(e.clientX - start.x, e.clientY - start.y) > 8) moved = true;
        if (!moved) return;
        const r = canvas.getBoundingClientRect();
        const hx = h.offsetLeft + 11, hy = h.offsetTop + 11;
        const z = (window.UIZoom || 1); // Größe der App: Bildschirm-Pixel → Plan-Pixel
        temp.setAttribute("d", `M${hx},${hy} L${(e.clientX - r.left) / z},${(e.clientY - r.top) / z}`);
      });
      h.addEventListener("pointerup", (e) => {
        if (!start) return;
        start = null;
        temp.setAttribute("d", "");
        if (moved) {
          h.style.pointerEvents = "none"; // Griff selbst nicht als Ziel finden
          const el = document.elementFromPoint(e.clientX, e.clientY);
          h.style.pointerEvents = "";
          const target = el && el.closest("[data-node]");
          if (target) connect(id, target.dataset.node);
          return;
        }
        if (source === id) stopConnect(); else startConnect(id);
      });
      h.addEventListener("pointercancel", () => { start = null; temp.setAttribute("d", ""); });
    });

    container.querySelectorAll("[data-node]").forEach((b) => {
      b.addEventListener("click", () => {
        if (source) {
          // Verbinden-Modus: dieses Kästchen kommt nach dem gewählten
          if (b.dataset.node === source) { stopConnect(); return; }
          const from = source;
          stopConnect();
          connect(from, b.dataset.node);
          return;
        }
        openNode(goal, res, b.dataset.node);
      });
      // Pfeile dieses Kästchens hervorheben, alle anderen blass
      const on = () => {
        const id = b.dataset.node;
        canvas.classList.add("nz--focus");
        canvas.querySelectorAll("[data-from]").forEach((el) => el.classList.toggle("is-on", el.dataset.from === id || el.dataset.to === id));
      };
      const off = () => canvas.classList.remove("nz--focus");
      b.addEventListener("mouseenter", on);
      b.addEventListener("focus", on);
      b.addEventListener("mouseleave", off);
      b.addEventListener("blur", off);
    });
  }

  return { html, wire, openNode };
})();
