// Prüft die Kennwerte (IPCC, EBC, Kelvin) und die Voronoi-Zerlegung gegen bekannte Werte.
// Läuft ohne Testframework (auch mit älterem Node): node tests/science.test.js

import assert from 'assert';
import { properties, fperm, kelvinDiameterNm, fillDiameterNm, kelvinRh, desorbDiameterNm, wetDiameterNm, poreClass, filledShare, isotherm, nanoStructure, pyroState, glowColor, DRAPER, tissueScale, conductivity, fmtOhm, wettability, capillaryRise, capillaryTime, shrinkPercent, sessileDrop, dropPenetration, rhDay, PHONON, phononHz } from '../web/js/science.js';
import { powerCells, polygonArea } from '../web/js/voronoi.js';
import { mulberry32 } from '../web/js/util.js';
import { LEVELS, SOURCES } from '../web/js/content.js';

let failed = 0;
function test(name, fn) {
  try { fn(); console.log(`✓ ${name}`); }
  catch (err) { failed++; console.log(`✗ ${name}\n  ${err.message}`); }
}

test('IPCC Fperm nach Temperaturklasse (Tab. 4Ap.2)', () => {
  assert.equal(fperm(400), 0.65);
  assert.equal(fperm(450), 0.8);
  assert.equal(fperm(600), 0.8);
  assert.equal(fperm(650), 0.89);
});

test('H/C sinkt mit der Temperatur, EBC-Grenze erst ab ≈ 400 °C erfüllt', () => {
  assert.equal(properties(350).ebcOk, false);
  assert.equal(properties(450).ebcOk, true);
  for (let t = 350; t < 800; t += 50) assert.ok(properties(t + 50).hc < properties(t).hc);
});

test('CO2-Äquivalent = C × Fperm × 44/12', () => {
  const p = properties(700);
  assert.ok(Math.abs(p.co2 - 0.9 * 0.89 * 44 / 12) < 1e-9);
});

test('Kelvin-Gleichung: Füllast (zylindrischer Meniskus) wie im Infotext', () => {
  assert.equal(fillDiameterNm(0), 0);
  assert.ok(Math.abs(fillDiameterNm(0.5) - 2.1) < 0.05);
  assert.ok(Math.abs(fillDiameterNm(0.9) - 10.6) < 0.1);
  assert.ok(Math.abs(fillDiameterNm(0.99) - 105) < 0.5);
  // halbkugeliger Meniskus (zwei Krümmungen): doppelter Kelvin-Radius
  assert.ok(Math.abs(kelvinDiameterNm(0.5) - 3.6) < 0.1);
  assert.ok(Math.abs(kelvinDiameterNm(0.9) - 20.5) < 0.2);
  // Umkehrung: Mikro bis ≈ 47 %, Meso bis ≈ 98 % (Skala unter dem Regler)
  assert.ok(Math.abs(kelvinRh(2) - 0.472) < 0.002 && Math.abs(kelvinRh(50) - 0.979) < 0.002);
  assert.ok(Math.abs(fillDiameterNm(kelvinRh(30)) - 30) < 1e-6);
  // Schlitze 2–3,2 nm füllen wie Zylinder gleicher Weite: ≈ 45–65 % (Infotext) – gleiche Feuchte wie die frühere Regel
  // „halbkugeliger Meniskus, Ø 2w − 0,6 nm“
  assert.ok(kelvinRh(2) > 0.45 && kelvinRh(3.2) < 0.68);
  for (const w of [2, 3.2]) assert.ok(Math.abs(kelvinRh(w) - Math.exp(-2.1 / (2 * w - 1.2))) < 1e-9);
});

test('Clustergröße wächst mit der Temperatur', () => {
  assert.equal(nanoStructure(350).rings, 3);
  assert.equal(nanoStructure(800).rings, 19);
  assert.ok(nanoStructure(600).rings > nanoStructure(450).rings);
});

test('Schichtdurchmesser folgt den Domänengrößen nach Wood et al. (2023)', () => {
  assert.ok(Math.abs(nanoStructure(400).sheetNm - 0.89) < 0.03);   // ≈ 12 Ringe
  assert.ok(Math.abs(nanoStructure(600).sheetNm - 1.65) < 0.08);   // ≈ 41 Ringe
  assert.ok(Math.abs(nanoStructure(800).sheetNm - 3.2) < 0.1);     // ≈ 155 Ringe
});

test('Pyrolyse-Zeitraffer: Masse fällt stetig und trifft die Tabelle bei 350 °C', () => {
  assert.ok(Math.abs(pyroState(350).mass - properties(350).yield) < 0.5);
  assert.equal(pyroState(25).mass, 100);
  for (let t = 25; t < 800; t += 25) assert.ok(pyroState(t + 25).mass <= pyroState(t).mass + 1e-9);
});

test('Pyrolyse-Zeitraffer: Zersetzungsbereiche nach Yang et al. (2007)', () => {
  assert.equal(pyroState(210).hemi, 1);                 // Hemizellulose bis 220 °C unberührt
  assert.ok(pyroState(315).hemi < 1e-9);                // bei 315 °C weitgehend zersetzt
  assert.equal(pyroState(310).cell, 1);                 // Zellulose beginnt erst bei 315 °C
  assert.ok(pyroState(400).cell < 1e-9);
  assert.ok(pyroState(800).lignin > 0.4 && pyroState(800).lignin < 1);   // Lignin zersetzt sich breit, nie ganz
});

test('Pyrolyse-Zeitraffer: Rotglut erst ab dem Draper-Punkt, Phasen in Reihenfolge', () => {
  assert.equal(pyroState(DRAPER - 1).glow, 0);
  assert.ok(pyroState(650).glow > 0);
  assert.equal(pyroState(150).phase, 'Trocknung');
  assert.equal(pyroState(250).phase, 'Hemizellulose zerfällt');
  assert.equal(pyroState(350).phase, 'Zellulose zerfällt');
  const [r, g, b] = glowColor(800);
  assert.ok(r > g && g > b);
});

test('Gewebe-Schwindung: Ausgangsbild bei 550 °C, kühler größer, quer stärker als längs, Wand dünner mit Masseverlust', () => {
  const ref = tissueScale(550);
  assert.ok(ref.xy === 1 && ref.z === 1 && ref.wall === 1);
  for (let t = 25; t < 800; t += 25) {
    const a = tissueScale(t), b = tissueScale(t + 25);
    assert.ok(b.xy <= a.xy + 1e-9 && b.z <= a.z + 1e-9 && b.wall <= a.wall + 1e-9);
  }
  assert.ok(tissueScale(25).xy - 1 > tissueScale(25).z - 1);   // quer schwindet stärker als längs
});

test('Schwundrisse: im Holz zu, breiter Strahl reißt zuerst, Jahrringgrenze zuletzt, bei 800 °C alle offen', () => {
  const wood = tissueScale(25), hot = tissueScale(800);
  assert.ok(wood.crack === 0 && wood.crackRay === 0 && wood.crackRing === 0);
  assert.ok(hot.crack === 1 && hot.crackRay === 1 && hot.crackRing === 1);
  for (let t = 300; t < 800; t += 10) {
    const k = tissueScale(t);
    assert.ok(k.crack >= k.crackRay && k.crackRay >= k.crackRing);
  }
});

test('Power-Diagramm zerlegt die Fläche lückenlos', () => {
  const rand = mulberry32(1);
  const bounds = { x0: 0, y0: 0, x1: 100, y1: 80 };
  const sites = Array.from({ length: 120 }, () => ({ x: rand() * 100, y: rand() * 80, w: rand() < 0.1 ? 60 : 0 }));
  const cells = powerCells(sites, bounds, 40);
  const total = cells.reduce((s, c) => s + (c ? Math.abs(polygonArea(c)) : 0), 0);
  assert.ok(Math.abs(total - 8000) < 1e-6 * 8000);
});

test('Holz → Kohle je Ebene (Modell): Stärke, Tüpfelmembran, Fibrillen verschwinden – Schichten, Poren entstehen', () => {
  const w = pyroState(25), m = pyroState(330), c = pyroState(450);
  for (const k of ['starch', 'membrane', 'fibril', 'matrix']) assert.equal(w[k], 1, `${k} im Holz`);
  for (const k of ['sheets', 'open', 'glassy']) assert.equal(w[k], 0, `${k} im Holz`);
  assert.equal(m.starch, 0);
  for (const k of ['fibril', 'membrane', 'matrix']) assert.equal(c[k], 0, `${k} in der Kohle`);
  for (const k of ['sheets', 'open', 'glassy']) assert.equal(c[k], 1, `${k} in der Kohle`);
  for (let t = 25; t < 800; t += 25) {
    const a = pyroState(t), b = pyroState(t + 25);
    assert.ok(b.sheets >= a.sheets && b.open >= a.open && b.fibril <= a.fibril && b.starch <= a.starch && b.membrane <= a.membrane, `monoton bei ${t} °C`);
  }
});

test('Hysterese: Füllen nach Kelvin, Entleeren erst bei tieferer Feuchte (Cohan, Modell)', () => {
  // Entleerungsast = halbkugeliger Meniskus, liegt bei gleicher Feuchte über dem Füllast: p_Entleeren = p_Füllen²
  assert.equal(desorbDiameterNm(0.9), kelvinDiameterNm(0.9));
  assert.ok(desorbDiameterNm(0.9) > fillDiameterNm(0.9));
  assert.ok(Math.abs(desorbDiameterNm(0.81) - fillDiameterNm(0.9)) < 1e-9);
  // vorwärts folgt der Füllast, zurück bleibt das Wasser stehen, bis der Entleerungsast erreicht ist
  let d = 0;
  for (const rh of [0.2, 0.5, 0.8, 0.95]) d = wetDiameterNm(d, rh);
  assert.ok(Math.abs(d - fillDiameterNm(0.95)) < 1e-9);
  const full = d;
  d = wetDiameterNm(d, 0.93);
  assert.equal(d, full);                                    // leichtes Zurückdrehen: Poren bleiben gefüllt
  d = wetDiameterNm(d, 0.6);
  assert.ok(Math.abs(d - desorbDiameterNm(0.6)) < 1e-9);    // tiefer: auf dem Entleerungsast
  assert.ok(d > fillDiameterNm(0.6));
  assert.equal(wetDiameterNm(d, 0), 0);                     // trocken
});

test('Porenklassen und Isotherme (Modell)', () => {
  assert.deepEqual([0, 1.5, 10, 55].map(poreClass), ['', 'micro', 'meso', 'macro']);
  assert.equal(filledShare(0), 0);
  assert.ok(Math.abs(filledShare(100) - 1) < 1e-9);
  const iso = isotherm(50);
  for (let i = 1; i < iso.ads.length; i++) {
    assert.ok(iso.ads[i][1] >= iso.ads[i - 1][1] - 1e-12);                  // monoton
    assert.ok(iso.des[i][1] >= iso.ads[i][1] - 1e-12);                      // Entleerungsast nie unter dem Füllast
  }
  assert.ok(iso.ads[iso.ads.length - 1][1] > 0.99);
});

test('Quellen: Nummer = Platz in der Liste, jeder Verweis [n] hat ein Ziel, Link mit https', () => {
  SOURCES.forEach((s, i) => assert.strictEqual(s.id, i + 1, `Quelle an Platz ${i + 1} hat id ${s.id}`));
  const ids = new Set(SOURCES.map((s) => s.id));
  LEVELS.forEach((l) => l.refs.forEach((r) => assert.ok(ids.has(r), `${l.id}: Verweis [${r}] ohne Quelle`)));
  SOURCES.forEach((s) => assert.match(s.url, /^https:\/\//, `Quelle ${s.id}: ${s.url}`));
});

test('Leitfähigkeit (Modell): monoton, 500 → 700 °C um ≥ 3 Dekaden, ≈ 1 S/m bei 600 °C, 300–3000 S/m bei 1000 °C', () => {
  let last = 0;
  for (let T = 25; T <= 1000; T += 25) { const s = conductivity(T).sigma; assert.ok(s >= last, `σ fällt bei ${T} °C`); last = s; }
  assert.ok(Math.log10(conductivity(700).sigma / conductivity(500).sigma) >= 3);
  assert.ok(Math.abs(Math.log10(conductivity(600).sigma)) < 0.3);
  assert.ok(conductivity(1000).sigma > 300 && conductivity(1000).sigma < 3000);
  assert.equal(conductivity(400).k, 0);
  assert.equal(conductivity(800).k, 1);
  assert.equal(fmtOhm(1700), '1,7 kΩ');
  assert.equal(fmtOhm(3e9), 'OL');
});

test('Benetzung + Lucas-Washburn: 300–400 °C hydrophob ohne Aufstieg, ab 550 °C h ∝ √t (≈ 0,58 mm je ms bei r = 12 µm)', () => {
  assert.ok(wettability(350).hydrophobic && wettability(400).hydrophobic);
  assert.ok(!wettability(100).hydrophobic && !wettability(550).hydrophobic);
  assert.equal(capillaryRise(12, 1, 380), 0);
  const h1 = capillaryRise(12, 1e-3, 550), h4 = capillaryRise(12, 4e-3, 550);
  assert.ok(Math.abs(h4 / h1 - 2) < 1e-9);
  assert.ok(h1 > 500 && h1 < 650, `h(1 ms) = ${h1} µm`);
  assert.ok(Math.abs(capillaryTime(12, h1, 550) - 1e-3) < 1e-12);
  assert.equal(capillaryTime(12, 100, 380), Infinity);
});

test('Schwund-Richtungen: tangential > radial > längs, Mittel = Querschwindung; Ebene-2-Skalen x < y < z', () => {
  const p = shrinkPercent(800);
  assert.ok(p.tan > p.rad && p.rad > p.lon);
  assert.ok(Math.abs((p.tan + p.rad) / 2 - 100 * pyroState(800).shrinkT) < 1e-9);
  const k = tissueScale(800), w = tissueScale(25);
  assert.ok(k.x < k.y && k.y < k.z);
  assert.ok(w.x > w.y && w.y > w.z && w.x > 1);
});

test('Tropfen: Kugelkappe hält das Volumen, θ = 90° ist eine Halbkugel', () => {
  for (const th of [40, 60, 90, 110]) {
    const { R, h } = sessileDrop(10, th);
    const v = (Math.PI * h * h * (3 * R - h)) / 3;          // Kappenvolumen aus Höhe und Radius
    assert.ok(Math.abs(v - 10) < 1e-9, `θ ${th}: ${v}`);
  }
  const half = sessileDrop(10, 90);
  assert.ok(Math.abs(half.a - half.R) < 1e-9 && Math.abs(half.h - half.R) < 1e-9);
  assert.ok(sessileDrop(10, 40).a > sessileDrop(10, 110).a);   // benetzend = flach und breit
});

test('Eindringzeit: Klassen nach Doerr 1998, über 90° versickert nichts', () => {
  assert.ok(dropPenetration(40).s < 5 && dropPenetration(40).cls === 'benetzbar');
  assert.ok(dropPenetration(60).s > 5 && dropPenetration(60).s < 60);
  assert.equal(dropPenetration(110).s, Infinity);
  assert.equal(dropPenetration(110).cls, 'extrem wasserabweisend');
});

test('Tagesgang: 95 % vor Sonnenaufgang, 45 % am Nachmittag, stetig über Mitternacht', () => {
  assert.ok(Math.abs(rhDay(5) - 0.95) < 1e-9 && Math.abs(rhDay(15) - 0.45) < 1e-9);
  assert.ok(Math.abs(rhDay(0) - rhDay(24)) < 1e-9 && Math.abs(rhDay(23.999) - rhDay(0)) < 1e-3);
  for (let h = 0; h < 24; h += 0.25) assert.ok(rhDay(h) >= 0.45 - 1e-9 && rhDay(h) <= 0.95 + 1e-9);
  assert.ok(Math.abs(rhDay(10) - 0.7) < 1e-9 && Math.abs(rhDay(22) - 0.7) < 1e-9);   // fällt in 10 h, steigt in 14 h
});

test('Raman: G-Mode schwingt schneller als D-Mode, ≈ 47 THz', () => {
  assert.ok(Math.abs(phononHz(PHONON.G) / 1e12 - 47.4) < 0.2);
  assert.ok(PHONON.G / PHONON.D > 1.15 && PHONON.G / PHONON.D < 1.2);
});

process.exitCode = failed ? 1 : 0;
