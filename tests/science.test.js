// Prüft die Kennwerte (IPCC, EBC, Kelvin) und die Voronoi-Zerlegung gegen bekannte Werte.
// Läuft ohne Testframework (auch mit älterem Node): node tests/science.test.js

import assert from 'assert';
import { properties, fperm, kelvinDiameterNm, nanoStructure, pyroState, glowColor, DRAPER, tissueScale } from '../web/js/science.js';
import { powerCells, polygonArea } from '../web/js/voronoi.js';
import { mulberry32 } from '../web/js/util.js';

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

test('Kelvin-Gleichung: gefüllte Porendurchmesser wie im Infotext', () => {
  assert.equal(kelvinDiameterNm(0), 0);
  assert.ok(Math.abs(kelvinDiameterNm(0.5) - 3.6) < 0.1);
  assert.ok(Math.abs(kelvinDiameterNm(0.9) - 20.5) < 0.2);
  assert.ok(Math.abs(kelvinDiameterNm(0.99) - 209.5) < 1);
});

test('Clustergröße wächst mit der Temperatur', () => {
  assert.equal(nanoStructure(350).rings, 3);
  assert.equal(nanoStructure(800).rings, 19);
  assert.ok(nanoStructure(600).rings > nanoStructure(450).rings);
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

process.exitCode = failed ? 1 : 0;
