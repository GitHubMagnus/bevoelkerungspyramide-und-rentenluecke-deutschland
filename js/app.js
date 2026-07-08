/* ============================================================
   Bevölkerungspyramide Deutschland 1950-2070 (16. kBVB)
   und Rentenlücken-Modell. Vanilla JS, keine Abhängigkeiten.
   ============================================================ */
(async function () {
  "use strict";

  const NS = "http://www.w3.org/2000/svg";

  // ---------- Daten laden ----------
  const [POP, RENTE] = await Promise.all([
    fetch("data/population.json").then(r => r.json()),
    fetch("data/renten.json").then(r => r.json()),
  ]);

  // ---------- Varianten der 16. kBVB (Nummern = Spalte "Variante" der Destatis-Daten) ----------
  // Bezeichnungen und Beschreibungstexte wörtlich übernommen aus dem Quellcode der
  // interaktiven Bevölkerungspyramide (Destatis): https://service.destatis.de/bevoelkerungspyramide/
  // Datei js/16te_main_2026-03-11.js, siehe README, Abschnitt "Datenquellen".
  const VARIANTS = {
    1:  ["V1 · G2L2W1",  "Moderate Geburtenrate u. Lebenserwartung, niedriger Wanderungssaldo"],
    2:  ["V2 · G2L2W2",  "Moderate Entwicklung von Geburten, Lebenserwartung und Wanderung (Standardvariante)"],
    3:  ["V3 · G2L2W3",  "Moderate Geburtenrate u. Lebenserwartung, hoher Wanderungssaldo"],
    4:  ["V4 · G1L3W1",  "Relativ alte Bevölkerung"],
    5:  ["V5 · G3L1W3",  "Relativ junge Bevölkerung"],
    6:  ["V6 · G1L2W2",  "Auswirkungen einer niedrigen Geburtenrate"],
    7:  ["V7 · G3L2W2",  "Auswirkungen einer deutlich steigenden Geburtenrate"],
    8:  ["V8 · G2L1W2",  "Auswirkungen eines geringen Anstiegs der Lebenserwartung"],
    9:  ["V9 · G2L3W2",  "Auswirkungen eines starken Anstiegs der Lebenserwartung"],
    10: ["V10 · G1L1W1", "Bevölkerungsminimum"],
    11: ["V11 · G3L3W3", "Bevölkerungsmaximum"],
    12: ["V12 · G1L2W1", "Niedrige Geburtenrate, moderate Lebenserwartung, niedrige Wanderung"],
    13: ["V13 · G2L1W1", "Moderate Geburtenrate, geringe Lebenserwartung, niedrige Wanderung"],
    14: ["V14 · G2L3W1", "Moderate Geburtenrate, starker Anstieg Lebenserwartung, niedrige Wanderung"],
    15: ["V15 · G1L1W2", "Niedrige Geburtenrate, geringe Lebenserwartung, moderate Wanderung"],
    16: ["V16 · G1L3W2", "Niedrige Geburtenrate, starker Anstieg Lebenserwartung, moderate Wanderung"],
    17: ["V17 · G3L1W2", "Steigende Geburtenrate, geringe Lebenserwartung, moderate Wanderung"],
    18: ["V18 · G3L3W2", "Steigende Geburtenrate, starker Anstieg Lebenserwartung, moderate Wanderung"],
    19: ["V19 · G2L1W3", "Moderate Geburtenrate, geringe Lebenserwartung, hohe Wanderung"],
    20: ["V20 · G2L3W3", "Moderate Geburtenrate, starker Anstieg Lebenserwartung, hohe Wanderung"],
    21: ["V21 · G3L2W3", "Steigende Geburtenrate, moderate Lebenserwartung, hohe Wanderung"],
    22: ["V22 · G3L1W1", "Steigende Geburtenrate, geringe Lebenserwartung, niedrige Wanderung"],
    23: ["V23 · G3L2W1", "Steigende Geburtenrate, moderate Lebenserwartung, niedrige Wanderung"],
    24: ["V24 · G3L3W1", "Steigende Geburtenrate, starker Anstieg Lebenserwartung, niedrige Wanderung"],
    25: ["V25 · G1L1W3", "Niedrige Geburtenrate, geringe Lebenserwartung, hohe Wanderung"],
    26: ["V26 · G1L2W3", "Niedrige Geburtenrate, moderate Lebenserwartung, hohe Wanderung"],
    27: ["V27 · G1L3W3", "Niedrige Geburtenrate, starker Anstieg Lebenserwartung, hohe Wanderung"],
    28: ["M1 · G2L2W0",  "Modellrechnung: keine Außenwanderung"],
    29: ["M2 · GRL2W0",  "Modellrechnung: Geburtenrate 2,1 (Bestandserhalt), keine Außenwanderung"],
  };

  // ---------- Zustand (synchron zur URL: #!y=2051&a=20,67&v=28) ----------
  const state = { year: 2024, variant: 2, a1: 20, a2: 67, compare: 2024 };

  (function parseHash() {
    const m = location.hash.match(/y=(\d{4})/); if (m) state.year = +m[1];
    const v = location.hash.match(/v=(\d{1,2})/); if (v && VARIANTS[+v[1]]) state.variant = +v[1];
    const a = location.hash.match(/a=(\d{1,2}),(\d{1,2})/);
    if (a) { state.a1 = Math.min(+a[1], +a[2]); state.a2 = Math.max(+a[1], +a[2]); }
    state.year = Math.max(1950, Math.min(2070, state.year));
  })();

  function writeHash() {
    history.replaceState(null, "",
      `#!y=${state.year}&a=${state.a1},${state.a2}&v=${state.variant}`);
  }

  // ---------- Zugriff auf Bevölkerungsdaten ----------
  // Werte in Tsd. Personen, Alter 0–99. Bis 2024 Ist-Daten (Variante 0), ab 2025 Szenario.
  function popOf(year, variant = state.variant) {
    if (year <= 2024) return POP[0][year];
    return (POP[variant] && POP[variant][year]) || null;
  }
  const sum = a => a.reduce((x, y) => x + y, 0);
  const sumRange = (p, from, to) =>
    sum(p.m.slice(from, to)) + sum(p.w.slice(from, to)); // [from, to)

  // globales Maximum einer Alters-Balkenlänge → feste Skala über alle Jahre
  let XMAX = 0;
  for (const v of Object.keys(POP))
    for (const y of Object.keys(POP[v])) {
      const p = POP[v][y];
      for (let i = 0; i < 100; i++) {
        if (p.m[i] > XMAX) XMAX = p.m[i];
        if (p.w[i] > XMAX) XMAX = p.w[i];
      }
    }
  XMAX = Math.ceil(XMAX / 100) * 100; // z. B. 800 Tsd.

  // ---------- Rentenmodell ----------
  const CAL = RENTE.kalibrierung;
  const basePop = POP[0][CAL.jahr];
  const beta = (CAL.standardbeitragszahlerMio * 1e6) / (sumRange(basePop, 20, 67) * 1e3);
  const rho  = (CAL.standardrentnerMio * 1e6) / (sumRange(basePop, 67, 100) * 1e3);
  const contribPerPayer = (CAL.beitraegeMrd * 1e9) / (CAL.standardbeitragszahlerMio * 1e6);
  const spendPerRentner = (CAL.ausgabenMrd * 1e9) / (CAL.standardrentnerMio * 1e6);

  // Demografisches Modell: konstante Löhne/Preise (2024), konstanter Beitragssatz,
  // konstantes Rentenniveau — zeigt den reinen Altersstruktur-Effekt.
  function model(year, variant = state.variant, a1 = state.a1, a2 = state.a2) {
    const p = popOf(year, variant);
    if (!p) return null;
    const payers = beta * sumRange(p, a1, a2) * 1e3;
    const rentner = rho * sumRange(p, a2, 100) * 1e3;
    const beitraege = payers * contribPerPayer;
    const ausgaben = rentner * spendPerRentner;
    return {
      payers, rentner,
      gapMrd: (ausgaben - beitraege) / 1e9,
      kehrwert: payers / rentner,
      bsNeeded: CAL.beitragssatzProzent * ausgaben / beitraege,
    };
  }

  // ---------- Formatierung ----------
  const fmt = new Intl.NumberFormat("de-DE", { maximumFractionDigits: 1, minimumFractionDigits: 1 });
  const fmt2 = new Intl.NumberFormat("de-DE", { maximumFractionDigits: 2, minimumFractionDigits: 2 });
  const fmt0 = new Intl.NumberFormat("de-DE", { maximumFractionDigits: 0 });
  const pct = x => fmt.format(x) + " %";

  // ---------- DOM ----------
  const $ = id => document.getElementById(id);
  const yearRange = $("yearRange"), yearOut = $("yearOut"), yearBadge = $("yearBadge");
  const variantSel = $("variantSel"), variantHint = $("variantHint");
  const ageLow = $("ageLow"), ageHigh = $("ageHigh");
  const compareSel = $("compareSel");
  const tooltip = $("tooltip");

  // Variantenauswahl füllen
  {
    const groups = [
      ["Hauptvarianten", [1,2,3,4,5,6,7,8,9]],
      ["Weitere Varianten", [10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27]],
      ["Modellrechnungen", [28,29]],
    ];
    for (const [label, ids] of groups) {
      const og = document.createElement("optgroup");
      og.label = label;
      for (const id of ids) {
        const o = document.createElement("option");
        o.value = id;
        o.textContent = `${VARIANTS[id][0]}: ${VARIANTS[id][1]}`;
        og.appendChild(o);
      }
      variantSel.appendChild(og);
    }
    variantSel.value = state.variant;
  }

  // Vergleichsjahr-Auswahl
  {
    const none = document.createElement("option");
    none.value = ""; none.textContent = "kein Umriss";
    compareSel.appendChild(none);
    const years = [1950, 1960, 1970, 1980, 1990, 2000, 2010, 2020, 2024, 2030, 2040, 2050, 2060, 2070];
    for (const y of years) {
      const o = document.createElement("option");
      o.value = y; o.textContent = y;
      compareSel.appendChild(o);
    }
    compareSel.value = state.compare;
    if (compareSel.value === "") { state.compare = null; }
  }

  ageLow.value = state.a1; ageHigh.value = state.a2;
  yearRange.value = state.year;

  // ============================================================
  //  PYRAMIDE
  // ============================================================
  const PY = { W: 760, H: 560, top: 16, bottom: 34, side: 46, mid: 44 };
  PY.plotH = PY.H - PY.top - PY.bottom;
  PY.halfW = (PY.W - 2 * PY.side - PY.mid) / 2;
  PY.barH = PY.plotH / 100;
  PY.cxL = PY.side + PY.halfW;          // rechter Rand der Männer-Seite
  PY.cxR = PY.side + PY.halfW + PY.mid; // linker Rand der Frauen-Seite
  const xScale = v => v / XMAX * PY.halfW;
  const yOfAge = a => PY.top + (99 - a) * PY.barH; // Alter 0 unten

  function el(name, attrs, parent) {
    const n = document.createElementNS(NS, name);
    for (const k in attrs) n.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(n);
    return n;
  }

  const psvg = el("svg", { viewBox: `0 0 ${PY.W} ${PY.H}`, "aria-label": "Bevölkerungspyramide" });
  $("pyramid").appendChild(psvg);

  // Bänder (jung / alt)
  const bandYoung = el("rect", { class: "band young", x: 0, width: PY.W }, psvg);
  const bandOld   = el("rect", { class: "band old",   x: 0, width: PY.W, y: PY.top }, psvg);

  // Achsen
  const axis = el("g", { class: "axis" }, psvg);
  for (let t = 0; t <= XMAX; t += 200) {
    const dx = xScale(t);
    for (const [x, anchor] of [[PY.cxL - dx, "m"], [PY.cxR + dx, "w"]]) {
      el("line", { x1: x, x2: x, y1: PY.top, y2: PY.top + PY.plotH, "stroke-dasharray": t ? "2 4" : "" }, axis);
      if (t > 0 || anchor === "m")
        el("text", { x, y: PY.H - 16, "text-anchor": "middle" }, axis).textContent = t === 0 ? "0" : fmt0.format(t);
    }
  }
  el("text", { x: PY.side, y: PY.H - 2, class: "age-label" }, axis).textContent = "in Tsd. Personen je Altersjahr";
  // Altersachse in der Mitte
  for (let a = 0; a <= 90; a += 10) {
    el("text", {
      x: PY.cxL + PY.mid / 2, y: yOfAge(a) + 3.5, class: "age-label", "text-anchor": "middle",
    }, axis).textContent = a;
  }
  el("text", { x: PY.cxL + PY.mid / 2, y: PY.top - 3, class: "age-label", "text-anchor": "middle" }, axis).textContent = "Alter";
  el("text", { x: PY.cxL - 6, y: PY.top + 10, class: "age-label", "text-anchor": "end", "font-weight": "600" }, axis).textContent = "♂";
  el("text", { x: PY.cxR + 6, y: PY.top + 10, class: "age-label", "font-weight": "600" }, axis).textContent = "♀";

  // Balken
  const gM = el("g", {}, psvg), gW = el("g", {}, psvg);
  const barsM = [], barsW = [];
  for (let a = 0; a < 100; a++) {
    barsM.push(el("rect", { class: "bar-m", y: yOfAge(a), height: Math.max(PY.barH - .7, 1.2), x: PY.cxL, width: 0 }, gM));
    barsW.push(el("rect", { class: "bar-w", y: yOfAge(a), height: Math.max(PY.barH - .7, 1.2), x: PY.cxR, width: 0 }, gW));
  }

  // Vergleichs-Umriss
  const comparePath = el("path", { class: "compare-path", d: "" }, psvg);

  // Tooltip-Fläche (liegt UNTER den Markern, damit diese ziehbar bleiben)
  const overlay = el("rect", { x: 0, y: PY.top, width: PY.W, height: PY.plotH, fill: "transparent" }, psvg);

  // Altersgrenzen-Marker (ganze Linie ziehbar, breite unsichtbare Trefferfläche)
  const markers = {};
  for (const key of ["a1", "a2"]) {
    const g = el("g", { class: "marker" }, psvg);
    markers[key] = {
      g,
      line: el("line", { class: "marker-line", x1: PY.side - 6, x2: PY.W - PY.side + 6 }, g),
      hit: el("line", {
        x1: PY.side - 6, x2: PY.W - PY.side + 6,
        stroke: "transparent", "stroke-width": 16, "pointer-events": "stroke",
      }, g),
      grip: el("g", { class: "marker-grip", tabindex: 0, role: "slider" }, g),
    };
    g.style.touchAction = "none";
    el("rect", { x: PY.W - PY.side - 2, y: -9, width: 44, height: 18, rx: 4 }, markers[key].grip);
    markers[key].label = el("text", { x: PY.W - PY.side + 20, y: 4 }, markers[key].grip);
  }

  function pyramidUpdate() {
    const p = popOf(state.year);
    if (!p) return;
    for (let a = 0; a < 100; a++) {
      const wm = xScale(p.m[a]), ww = xScale(p.w[a]);
      barsM[a].setAttribute("x", PY.cxL - wm);
      barsM[a].setAttribute("width", wm);
      barsW[a].setAttribute("width", ww);
    }
    // Bänder
    const y1 = yOfAge(state.a1 - 1); // Unterkante Erwerbsband
    const y2 = yOfAge(state.a2 - 1);
    bandYoung.setAttribute("y", y1 + PY.barH);
    bandYoung.setAttribute("height", PY.top + PY.plotH - y1 - PY.barH);
    bandOld.setAttribute("height", Math.max(0, y2 + PY.barH - PY.top));
    // Marker
    for (const [key, age] of [["a1", state.a1], ["a2", state.a2]]) {
      const y = yOfAge(age) + PY.barH; // Linie an Unterkante des Altersjahrs
      for (const ln of [markers[key].line, markers[key].hit]) {
        ln.setAttribute("y1", y);
        ln.setAttribute("y2", y);
      }
      markers[key].grip.setAttribute("transform", `translate(0 ${y})`);
      markers[key].label.textContent = age;
    }
    // Vergleichs-Umriss
    if (state.compare && popOf(state.compare) && +state.compare !== +state.year) {
      const c = popOf(state.compare);
      let d = "";
      // linke Seite (Männer), von unten nach oben
      d += `M ${PY.cxL - xScale(c.m[0])} ${PY.top + PY.plotH}`;
      for (let a = 0; a < 100; a++) {
        const x = PY.cxL - xScale(c.m[a]);
        d += ` L ${x} ${yOfAge(a) + PY.barH} L ${x} ${yOfAge(a)}`;
      }
      d += ` L ${PY.cxL} ${PY.top}`;
      // rechte Seite (Frauen), von oben nach unten
      d += ` M ${PY.cxR} ${PY.top}`;
      for (let a = 99; a >= 0; a--) {
        const x = PY.cxR + xScale(c.w[a]);
        d += ` L ${x} ${yOfAge(a)} L ${x} ${yOfAge(a) + PY.barH}`;
      }
      comparePath.setAttribute("d", d);
      $("legendCompare").textContent = `Umriss ${state.compare}`;
    } else {
      comparePath.setAttribute("d", "");
      $("legendCompare").textContent = "kein Umriss";
    }
  }

  // Tooltip
  overlay.addEventListener("mousemove", e => {
    const pt = psvg.createSVGPoint();
    pt.x = e.clientX; pt.y = e.clientY;
    const loc = pt.matrixTransform(psvg.getScreenCTM().inverse());
    const age = Math.max(0, Math.min(99, Math.floor(99 - (loc.y - PY.top) / PY.barH)));
    const p = popOf(state.year);
    if (!p) return;
    tooltip.hidden = false;
    tooltip.innerHTML =
      `<b>${age} Jahre</b> · Jahrgang ${state.year - age}<br>` +
      `<span class="tt-m">♂ ${fmt0.format(p.m[age] * 1000)}</span> · ` +
      `<span class="tt-w">♀ ${fmt0.format(p.w[age] * 1000)}</span>`;
    const wrap = $("pyramid").getBoundingClientRect();
    tooltip.style.left = (e.clientX - wrap.left) + "px";
    tooltip.style.top = (e.clientY - wrap.top) + "px";
  });
  overlay.addEventListener("mouseleave", () => { tooltip.hidden = true; });

  // Marker ziehen (ganze Gruppe: Linie + Griff)
  for (const key of ["a1", "a2"]) {
    const grp = markers[key].g;
    const grip = markers[key].grip;
    let dragging = false;
    const toAge = clientY => {
      const pt = psvg.createSVGPoint();
      pt.x = 0; pt.y = clientY;
      const loc = pt.matrixTransform(psvg.getScreenCTM().inverse());
      return Math.round(99 - (loc.y - PY.top) / PY.barH + 1);
    };
    grp.addEventListener("pointerdown", e => {
      dragging = true;
      grp.setPointerCapture(e.pointerId);
      e.preventDefault();
    });
    grp.addEventListener("pointermove", e => {
      if (!dragging) return;
      let age = Math.max(1, Math.min(99, toAge(e.clientY)));
      if (key === "a1") age = Math.min(age, state.a2 - 1);
      else age = Math.max(age, state.a1 + 1);
      if (age !== state[key]) { state[key] = age; syncAgeInputs(); update(); }
    });
    grp.addEventListener("pointerup", () => { dragging = false; });
    grp.addEventListener("pointercancel", () => { dragging = false; });
    grip.addEventListener("keydown", e => {
      const d = e.key === "ArrowUp" ? 1 : e.key === "ArrowDown" ? -1 : 0;
      if (!d) return;
      e.preventDefault();
      let age = state[key] + d;
      if (key === "a1") age = Math.max(1, Math.min(age, state.a2 - 1));
      else age = Math.min(99, Math.max(age, state.a1 + 1));
      state[key] = age; syncAgeInputs(); update();
    });
  }
  function syncAgeInputs() { ageLow.value = state.a1; ageHigh.value = state.a2; }

  // ============================================================
  //  PERSONEN-PIKTOGRAMM (Beitragszahler je Rentner)
  // ============================================================
  const PERSON = "M0-8.6a2.6 2.6 0 1 0 .001 0zM-3.4-2.9h6.8c1.5 0 2.4 1.1 2.4 2.6v6.2h-2.1v8.5h-2.4V6.6h-2.6v7.8h-2.4V5.9h-2.1V-.3c0-1.5.9-2.6 2.4-2.6z";
  function drawSupport(kehrwert, isModel) {
    const box = $("supportViz");
    box.innerHTML = "";
    const svg = el("svg", { viewBox: "0 0 250 46", width: "100%", height: "56" });
    box.appendChild(svg);
    // 1 Rentner
    el("path", { d: PERSON, transform: "translate(16 24) scale(1.35)", fill: "var(--old)" }, svg);
    el("text", { x: 16, y: 45, "text-anchor": "middle", "font-size": 8, fill: "var(--ink-soft)", "font-family": "var(--mono)" }, svg).textContent = "1 Rente";
    el("line", { x1: 38, x2: 38, y1: 6, y2: 40, stroke: "var(--rule)" }, svg);
    // n Beitragszahler
    const full = Math.floor(kehrwert), frac = kehrwert - full;
    const maxIcons = 5;
    for (let i = 0; i < Math.min(full, maxIcons); i++)
      el("path", { d: PERSON, transform: `translate(${60 + i * 30} 24) scale(1.35)`, fill: "var(--men)", opacity: isModel ? .85 : 1 }, svg);
    if (frac > 0.03 && full < maxIcons) {
      const x = 60 + full * 30;
      const g = el("g", { transform: `translate(${x} 24) scale(1.35)` }, svg);
      const clip = el("clipPath", { id: "fracClip" }, svg);
      el("rect", { x: -6, y: -9 + 24 * (1 - frac), width: 12, height: 24 * frac }, clip);
      el("path", { d: PERSON, fill: "var(--rule)" }, g);
      el("path", { d: PERSON, fill: "var(--men)", "clip-path": "url(#fracClip)" }, g);
    }
  }

  // ============================================================
  //  ZEITREIHEN-CHARTS
  // ============================================================
  function lineChart(container, opts) {
    container.innerHTML = "";
    const W = 540, H = 250, L = 44, R = 14, T = 14, B = 30;
    const svg = el("svg", { viewBox: `0 0 ${W} ${H}` });
    container.appendChild(svg);
    const x = y => L + (y - opts.x0) / (opts.x1 - opts.x0) * (W - L - R);
    const y = v => T + (1 - (v - opts.y0) / (opts.y1 - opts.y0)) * (H - T - B);
    const ax = el("g", { class: "chart-axis" }, svg);
    for (const t of opts.yTicks) {
      el("line", { x1: L, x2: W - R, y1: y(t), y2: y(t), "stroke-dasharray": t ? "2 4" : "" }, ax);
      el("text", { x: L - 6, y: y(t) + 3.5, "text-anchor": "end" }, ax).textContent = fmt0.format(t);
    }
    for (let t = Math.ceil(opts.x0 / 20) * 20; t <= opts.x1; t += 20) {
      el("text", { x: x(t), y: H - 10, "text-anchor": "middle" }, ax).textContent = t;
    }
    // Trennlinie Ist | Projektion
    el("line", { x1: x(2024.5), x2: x(2024.5), y1: T, y2: H - B, stroke: "var(--ink)", "stroke-width": 1, opacity: .5 }, svg);
    el("text", { x: x(2024.5) + 4, y: T + 10, "font-size": 9.5, fill: "var(--ink-soft)", "font-family": "var(--mono)" }, svg).textContent = "Projektion →";
    return { svg, x, y, W, H, T, B, L, R };
  }

  function pathFrom(pts, cx, cy) {
    return pts.map((p, i) => `${i ? "L" : "M"} ${cx(p[0])} ${cy(p[1])}`).join(" ");
  }

  function drawGapChart() {
    const hist = Object.entries(RENTE.historie)
      .map(([y, v]) => [+y, v.ausgaben - v.beitraege])
      .sort((a, b) => a[0] - b[0]);
    const proj = [];
    for (let y = 2025; y <= 2070; y++) {
      const m = model(y);
      if (m) proj.push([y, m.gapMrd]);
    }
    const allVals = hist.concat(proj).map(p => p[1]);
    const ymax = Math.max(120, Math.ceil(Math.max(...allVals) / 40) * 40);
    const c = lineChart($("gapChart"), {
      x0: 1957, x1: 2070, y0: 0, y1: ymax,
      yTicks: Array.from({ length: ymax / 40 + 1 }, (_, i) => i * 40),
    });
    // Ist-Fläche + Linie
    const histArea = pathFrom(hist, c.x, c.y) +
      ` L ${c.x(hist[hist.length - 1][0])} ${c.y(0)} L ${c.x(hist[0][0])} ${c.y(0)} Z`;
    el("path", { d: histArea, fill: "var(--accent)", opacity: .12 }, c.svg);
    el("path", { d: pathFrom(hist, c.x, c.y), fill: "none", stroke: "var(--accent)", "stroke-width": 2 }, c.svg);
    // Modell-Linie
    if (proj.length) {
      el("path", { d: pathFrom(proj, c.x, c.y), fill: "none", stroke: "var(--accent)", "stroke-width": 2, "stroke-dasharray": "6 4" }, c.svg);
    }
    // Marker aktuelles Jahr
    const cur = state.year <= 2024
      ? hist.find(p => p[0] === state.year)
      : proj.find(p => p[0] === state.year);
    if (cur) {
      el("circle", { cx: c.x(cur[0]), cy: c.y(cur[1]), r: 4.5, fill: "var(--accent)", stroke: "var(--card)", "stroke-width": 1.5 }, c.svg);
      el("text", { x: c.x(cur[0]), y: c.y(cur[1]) - 9, "text-anchor": "middle", "font-size": 11, "font-family": "var(--mono)", "font-weight": 600, fill: "var(--accent)" }, c.svg)
        .textContent = fmt.format(cur[1]);
    }
  }

  function drawSupportChart() {
    const hist = Object.entries(RENTE.kehrwertHistorie)
      .map(([y, v]) => [+y, v]).sort((a, b) => a[0] - b[0]);
    const proj = [];
    for (let y = 2025; y <= 2070; y++) {
      const m = model(y);
      if (m) proj.push([y, m.kehrwert]);
    }
    const c = lineChart($("supportChart"), {
      x0: 1957, x1: 2070, y0: 0, y1: 4, yTicks: [0, 1, 2, 3, 4],
    });
    el("path", { d: pathFrom(hist, c.x, c.y), fill: "none", stroke: "var(--men)", "stroke-width": 2 }, c.svg);
    if (proj.length)
      el("path", { d: pathFrom(proj, c.x, c.y), fill: "none", stroke: "var(--men)", "stroke-width": 2, "stroke-dasharray": "6 4" }, c.svg);
    // DRV-Referenzpunkte
    for (const [y, v] of Object.entries(RENTE.drvKehrwertProjektion)) {
      if (isNaN(+y)) continue;
      el("rect", {
        x: c.x(+y) - 3.4, y: c.y(v) - 3.4, width: 6.8, height: 6.8,
        transform: `rotate(45 ${c.x(+y)} ${c.y(v)})`,
        fill: "var(--paper)", stroke: "var(--ink)", "stroke-width": 1.2,
      }, c.svg);
    }
    const cur = state.year <= 2024
      ? hist.find(p => p[0] === state.year)
      : proj.find(p => p[0] === state.year);
    if (cur) {
      el("circle", { cx: c.x(cur[0]), cy: c.y(cur[1]), r: 4.5, fill: "var(--men)", stroke: "var(--card)", "stroke-width": 1.5 }, c.svg);
      el("text", { x: c.x(cur[0]), y: c.y(cur[1]) - 9, "text-anchor": "middle", "font-size": 11, "font-family": "var(--mono)", "font-weight": 600, fill: "var(--men)" }, c.svg)
        .textContent = fmt2.format(cur[1]);
    }
  }

  // ============================================================
  //  KENNZAHLEN
  // ============================================================
  function updateFigures() {
    const p = popOf(state.year);
    if (!p) return;
    const total = sumRange(p, 0, 100);
    $("figTotal").textContent = fmt.format(total / 1000);

    const young = sumRange(p, 0, state.a1);
    const work = sumRange(p, state.a1, state.a2);
    const old = sumRange(p, state.a2, 100);
    $("grpYoungLbl").textContent = `unter ${state.a1}`;
    $("grpWorkLbl").textContent = `${state.a1}-${state.a2 - 1}`;
    $("grpOldLbl").textContent = `ab ${state.a2}`;
    $("grpYoung").textContent = `${fmt.format(young / 1000)} Mio · ${fmt.format(young / total * 100)} %`;
    $("grpWork").textContent = `${fmt.format(work / 1000)} Mio · ${fmt.format(work / total * 100)} %`;
    $("grpOld").textContent = `${fmt.format(old / 1000)} Mio · ${fmt.format(old / total * 100)} %`;

    const isHist = state.year <= 2024;
    $("supportYear").textContent = state.year;
    $("gapYear").textContent = state.year;

    // Beitragszahler je Rentner
    let kehrwert = null, supNote = "";
    if (isHist && RENTE.kehrwertHistorie[state.year] != null) {
      kehrwert = RENTE.kehrwertHistorie[state.year];
      supNote = "Ist-Wert (DRV): Standardbeitragszahler je Standardrentner.";
    } else {
      const m = model(state.year);
      if (m) {
        kehrwert = m.kehrwert;
        supNote = `Modellwert für ${VARIANTS[state.variant][0]} bei Erwerbsalter ${state.a1}-${state.a2 - 1}.`;
      } else supNote = "Für dieses Jahr liegen keine DRV-Ist-Werte vor.";
    }
    if (kehrwert != null) {
      $("figSupport").textContent = fmt2.format(kehrwert);
      drawSupport(kehrwert, !isHist);
      const first = RENTE.kehrwertHistorie["1960"];
      $("supportNote").textContent = supNote + ` Zum Vergleich 1960: ${fmt2.format(first)}.`;
    } else {
      $("figSupport").textContent = "–";
      $("supportViz").innerHTML = "";
      $("supportNote").textContent = supNote;
    }

    // Rentenlücke
    const gapNote = $("gapNote"), figBS = $("figBS");
    if (isHist) {
      const h = RENTE.historie[state.year];
      if (h) {
        const gap = h.ausgaben - h.beitraege;
        $("figGap").textContent = fmt.format(gap);
        gapNote.innerHTML = `Ist-Wert (nominal${h.west ? ", alte Bundesländer" : ""}): Ausgaben ${fmt.format(h.ausgaben)} − Beiträge ${fmt.format(h.beitraege)} Mrd. €. Davon durch Bundeszuschüsse gedeckt: ${fmt.format(h.zuschuss)} Mrd. €.`;
        figBS.parentElement.style.display = "none";
      } else {
        $("figGap").textContent = "–";
        gapNote.textContent = "Für dieses Jahr liegen keine Ist-Finanzdaten vor (Reihe: 1960-1990 fünfjährlich, ab 1991 jährlich).";
        figBS.parentElement.style.display = "none";
      }
    } else {
      const m = model(state.year);
      $("figGap").textContent = m ? fmt.format(m.gapMrd) : "–";
      gapNote.textContent = m
        ? `Modellrechnung in Preisen von 2024: ${VARIANTS[state.variant][0]}, Erwerbsalter ${state.a1}-${state.a2 - 1}, Renteneintritt ${state.a2}. Beitragssatz und Rentenniveau konstant.`
        : "";
      figBS.parentElement.style.display = "";
      figBS.textContent = m ? pct(m.bsNeeded) : "–";
    }
  }

  // ============================================================
  //  GESAMT-UPDATE
  // ============================================================
  function update() {
    yearOut.value = state.year;
    yearBadge.textContent = state.year <= 2024 ? "Ist-Daten" : VARIANTS[state.variant][0];
    yearBadge.classList.toggle("proj", state.year > 2024);
    variantHint.textContent = VARIANTS[state.variant][1];
    pyramidUpdate();
    updateFigures();
    drawGapChart();
    drawSupportChart();
    writeHash();
  }

  // ---------- Events ----------
  yearRange.addEventListener("input", () => { state.year = +yearRange.value; update(); });
  function commitYearOut() {
    let y = yearOut.value === "" ? NaN : Math.round(+yearOut.value);
    if (!Number.isFinite(y)) y = state.year;
    y = Math.max(1950, Math.min(2070, y));
    state.year = y;
    yearRange.value = y;
    update();
  }
  yearOut.addEventListener("change", commitYearOut);
  yearOut.addEventListener("keydown", e => {
    if (e.key === "Enter") { e.preventDefault(); commitYearOut(); yearOut.blur(); }
  });
  variantSel.addEventListener("change", () => { state.variant = +variantSel.value; update(); });
  compareSel.addEventListener("change", () => {
    state.compare = compareSel.value ? +compareSel.value : null;
    pyramidUpdate();
  });
  ageLow.addEventListener("change", () => {
    state.a1 = Math.max(1, Math.min(+ageLow.value || 20, state.a2 - 1));
    syncAgeInputs(); update();
  });
  ageHigh.addEventListener("change", () => {
    state.a2 = Math.min(99, Math.max(+ageHigh.value || 67, state.a1 + 1));
    syncAgeInputs(); update();
  });

  // Animation
  const playBtn = $("playBtn");
  let timer = null;
  function stop() { clearInterval(timer); timer = null; playBtn.classList.remove("playing"); }
  function play() {
    if (state.year >= 2070) state.year = 1950;
    playBtn.classList.add("playing");
    timer = setInterval(() => {
      state.year++;
      yearRange.value = state.year;
      update();
      if (state.year >= 2070) stop();
    }, 130);
  }
  playBtn.addEventListener("click", () => (timer ? stop() : play()));
  document.addEventListener("keydown", e => {
    if (e.code === "Space" && !/INPUT|SELECT/.test(document.activeElement.tagName)) {
      e.preventDefault();
      timer ? stop() : play();
    }
    if (e.key === "ArrowRight" && state.year < 2070) { state.year++; yearRange.value = state.year; update(); }
    if (e.key === "ArrowLeft" && state.year > 1950) { state.year--; yearRange.value = state.year; update(); }
  });

  update();
})();
