// Prüft die Bildraten-Probe der Darstellungsqualität: Stufe nach 12 s simulierter Bilder je Bildrate.
// Läuft ohne Browser und Testframework: node tests/quality.test.js

import assert from 'assert';

const el = () => ({ value: '', textContent: '', setAttribute() {}, addEventListener() {} });
globalThis.document = { hidden: false, getElementById: el };

let run = 0;
// frische Modulinstanz je Fall (eigene Probe, eigener Startwert)
async function stageAfter(fps, { search = '', stored = null, hang = 0 } = {}) {
  globalThis.location = { search };
  globalThis.localStorage = { getItem: () => stored, setItem() {} };
  const { quality } = await import(`../web/js/quality.js?run=${++run}`);
  for (let t = 0; t < 12; t += 1 / fps) {
    quality.tick(Math.min(0.25, 1 / fps));
    if (hang && t > 2 && t < 2 + 1 / fps) quality.tick(0.25);   // einzelner Ladehänger
  }
  return quality.get().id;
}

let failed = 0;
async function test(name, fn) {
  try { await fn(); console.log(`✓ ${name}`); }
  catch (err) { failed++; console.log(`✗ ${name}\n  ${err.message}`); }
}

(async () => {
  await test('Probe: 60 fps Fein, 30 fps Mittel, 15/6/4/2 fps Leicht', async () => {
    assert.equal(await stageAfter(60), 'fine');
    assert.equal(await stageAfter(30), 'medium');
    for (const fps of [15, 6, 4, 2]) assert.equal(await stageAfter(fps), 'light', `${fps} fps`);
  });
  await test('Probe: einzelne Ladehänger senken die Stufe nicht', async () => {
    assert.equal(await stageAfter(60, { hang: 1 }), 'fine');
  });
  await test('Probe: ?q und gespeicherte Wahl bleiben auch bei 4 fps', async () => {
    assert.equal(await stageAfter(4, { search: '?q=3' }), 'fine');
    assert.equal(await stageAfter(4, { stored: '1' }), 'medium');
  });
  if (failed) { console.log(`\n${failed} Test(s) fehlgeschlagen`); process.exit(1); }
  console.log('\nAlle Tests bestanden');
})();
