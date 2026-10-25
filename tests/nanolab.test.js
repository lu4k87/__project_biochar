// Prüft das virtuelle Nano-Labor (web/js/nanolab.js): Knudsen-Rennen, Bragg/Scherrer, Raman I_D/I_G.
// Aufruf: node tests/nanolab.test.js
import assert from 'assert';
import { GASES, meanSpeed, knudsenD, race, twoTheta, scherrerWidth, xrd, xrdCurve, raman, ramanCurve, D_GRAPHITE } from '../web/js/nanolab.js';

let failed = 0;
function test(name, fn) {
  try { fn(); console.log(`✅ ${name}`); } catch (e) { failed++; console.log(`❌ ${name}\n   ${e.message}`); }
}
const near = (a, b, tol, msg) => assert.ok(Math.abs(a - b) <= tol, `${msg}: ${a} ≠ ${b} ± ${tol}`);

test('Kinetische Gastheorie: CO₂ ≈ 379 m/s, CH₄ ≈ 628 m/s bei 25 °C', () => {
  near(meanSpeed(44.01), 379, 2, 'CO₂');
  near(meanSpeed(16.04), 628, 2, 'CH₄');
});

test('Knudsen: D ∝ 1/√M, 6-nm-Pore → CO₂ ≈ 7,6·10⁻⁷ m²/s, Reihenfolge CH₄ › H₂O › N₂ › CO₂', () => {
  near(knudsenD(6, 44.01), 7.58e-7, 0.05e-7, 'D(CO₂)');
  const r = race(6);
  assert.deepStrictEqual(r.map((g) => g.id), ['ch4', 'h2o', 'n2', 'co2']);
  for (let i = 1; i < r.length; i++) assert.ok(r[i - 1].v > r[i].v, `${r[i - 1].name} schneller als ${r[i].name}`);
  near(r[3].rel, Math.sqrt(16.04 / 44.01), 1e-9, 'rel ∝ √(M_CH₄/M_CO₂)');
  assert.ok(r[0].knudsen > 10, 'Knudsen-Zahl ≫ 1 in der 6-nm-Pore');
});

test('Kinetische Durchmesser nach Breck: H₂O < CO₂ < N₂ < CH₄, aber Masse entscheidet das Rennen', () => {
  const byD = [...GASES].sort((a, b) => a.d - b.d).map((g) => g.id);
  assert.deepStrictEqual(byD, ['h2o', 'co2', 'n2', 'ch4']);
  assert.notDeepStrictEqual(byD, race(6).map((g) => g.id));
});

test('Bragg (Cu Kα): Graphit d002 0,3354 nm → 2θ ≈ 26,6°; Modell 0,40 → 0,36 nm → 22,2° → 24,7°', () => {
  near(twoTheta(D_GRAPHITE), 26.56, 0.05, 'Graphit');
  near(xrd(350).p002, 22.2, 0.1, '350 °C');
  near(xrd(800).p002, 24.7, 0.1, '800 °C');
  assert.ok(xrd(800).p002 < xrd(800).graphite, 'Kohle bleibt unter dem Graphit-Peak');
});

test('Scherrer: Peak wird mit der Temperatur schärfer (Stapelhöhe wächst), Lc 0,5 → 1,1 nm', () => {
  near(xrd(350).Lc, 0.5, 0.01, 'Lc 350');
  near(xrd(800).Lc, 1.08, 0.01, 'Lc 800');
  assert.ok(xrd(800).w002 < xrd(500).w002 && xrd(500).w002 < xrd(350).w002, 'Halbwertsbreite sinkt');
  near(scherrerWidth(1.08, 24.7, 0.9), 7.5, 0.2, 'β(Lc = 1,08 nm) ≈ 7,5° 2θ');
  const c = xrdCurve(650);
  assert.strictEqual(c.length, 101);
  assert.ok(Math.max(...c.map((p) => p[1])) === 1 && c.every((p) => p[1] >= 0 && p[1] <= 1), 'normiert');
});

test('Raman: I_D/I_G = 0,0055·La² (Å) unter 2 nm, 4,4/La darüber, stetig bei 2 nm; D 1350, G 1585–1600 cm⁻¹', () => {
  const r350 = raman(350), r800 = raman(800);
  near(r350.ratio, 0.0055 * (r350.La * 10) ** 2, 1e-9, 'FR-Regime');
  assert.strictEqual(r800.regime, 'Tuinstra & Koenig');
  near(r800.ratio, 4.4 / r800.La, 1e-9, 'TK-Regime');
  near(0.0055 * 20 ** 2, 4.4 / 2, 1e-9, 'beide Gesetze treffen sich bei 2 nm');
  assert.strictEqual(r350.D, 1350);
  assert.ok(r350.G >= 1585 && r800.G <= 1600, 'G-Bande');
  const c = ramanCurve(600);
  assert.ok(c.length === 121 && Math.max(...c.map((p) => p[1])) === 1, 'normiert');
});

if (failed) { console.log(`\n${failed} Test(s) rot`); process.exit(1); }
console.log('\nalle Nano-Labor-Tests grün');
