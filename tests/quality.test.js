// Prüft die Bildraten-Probe der Darstellungsqualität: Stufe nach 12 s simulierter Bilder je Bildrate.
// Läuft ohne Browser und Testframework: node tests/quality.test.js

import assert from 'assert';

const el = () => ({ value: '', textContent: '', setAttribute() {}, addEventListener() {} });
globalThis.document = { hidden: false, getElementById: el };

let run = 0;
// frische Modulinstanz je Fall (eigene Probe, eigener Startwert); stored = Id im neuen Schlüssel, old = Index im alten (0–2)
async function fresh({ search = '', stored = null, old = null } = {}) {
  globalThis.location = { search };
  globalThis.localStorage = { getItem: (k) => (k === 'biochar-quality.v2' ? stored : k === 'biochar-quality' ? old : null), setItem() {}, removeItem() {} };
  return (await import(`../web/js/quality.js?run=${++run}`)).quality;
}
const run_ = (quality, fps, sec, budget) => { for (let t = 0; t < sec; t += 1 / fps) quality.tick(Math.min(0.25, 1 / fps), budget); };
async function stageAfter(fps, { search = '', stored = null, old = null, hang = 0 } = {}) {
  const quality = await fresh({ search, stored, old });
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
  await test('Probe: 60 fps Fein, 30 fps Mittel, 15 fps Leicht (Wache danach Sparsam), 6/4/2 fps gleich Sparsam', async () => {
    assert.equal(await stageAfter(60), 'fine');
    assert.equal(await stageAfter(30), 'medium');
    const q = await fresh();
    run_(q, 15, 6);
    assert.equal(q.get().id, 'light');
    run_(q, 15, 4);
    assert.equal(q.get().id, 'eco');
    for (const fps of [6, 4, 2]) assert.equal(await stageAfter(fps), 'eco', `${fps} fps`);
  });
  await test('Schwaches Gerät: Software-Renderer, wenig Speicher oder Kerne', async () => {
    const { weakDevice } = await import(`../web/js/quality.js?run=${++run}`);
    assert.equal(weakDevice({ renderer: 'ANGLE (Google, Vulkan 1.3.0 (SwiftShader Device (Subzero)), SwiftShader driver)' }), true);
    assert.equal(weakDevice({ renderer: 'llvmpipe (LLVM 15.0.7, 256 bits)' }), true);
    assert.equal(weakDevice({ renderer: 'ANGLE (Intel, Mesa Intel(R) UHD Graphics 620)', memory: 8, cores: 8 }), false);
    assert.equal(weakDevice({ renderer: 'ANGLE (Intel, Mesa Intel(R) UHD Graphics 620)', memory: 2 }), true);
    assert.equal(weakDevice({ cores: 2 }), true);
  });
  await test('Erkennung: schwaches Gerät startet Auto in Sparsam, feste Wahl bleibt', async () => {
    const gl = { getExtension: () => null, getParameter: () => 'SwiftShader', RENDERER: 0 };
    globalThis.navigator = { deviceMemory: 8, hardwareConcurrency: 8 };
    let q = await fresh();
    q.detect(gl);
    assert.equal(q.get().id, 'eco');
    assert.equal(q.isAuto(), true);
    q = await fresh({ stored: 'medium' });
    q.detect(gl);
    assert.equal(q.get().id, 'medium');
  });
  await test('Gespeicherte Wahl: neue Id, alter Index 0–2 = Leicht…Fein, ?q=0 = Sparsam', async () => {
    assert.equal((await fresh({ stored: 'eco' })).get().id, 'eco');
    assert.equal((await fresh({ old: '0' })).get().id, 'light');
    assert.equal((await fresh({ old: '2' })).get().id, 'fine');
    assert.equal((await fresh({ search: '?q=0' })).get().id, 'eco');
  });
  await test('Probe: einzelne Ladehänger senken die Stufe nicht', async () => {
    assert.equal(await stageAfter(60, { hang: 1 }), 'fine');
  });
  await test('Probe: ?q und gespeicherte Wahl bleiben auch bei 4 fps', async () => {
    assert.equal(await stageAfter(4, { search: '?q=3' }), 'fine');
    assert.equal(await stageAfter(4, { stored: 'medium' }), 'medium');
  });
  await test('Wache (Auto): später anhaltend 20 fps → eine Stufe herunter, kurze Hänger nicht', async () => {
    const q = await fresh();
    run_(q, 60, 8);
    assert.equal(q.get().id, 'fine');
    run_(q, 20, 2);
    assert.equal(q.get().id, 'fine', 'nach 2 s noch nicht');
    run_(q, 20, 3);
    assert.equal(q.get().id, 'medium');
  });
  await test('Wache (Auto): viel Luft → eine Stufe herauf, frühestens nach 30 s', async () => {
    const q = await fresh();
    run_(q, 15, 12);   // Probe → Leicht, Wache → Sparsam
    assert.equal(q.get().id, 'eco');
    run_(q, 120, 20);
    assert.equal(q.get().id, 'eco', 'Sperrzeit 30 s');
    run_(q, 120, 15);
    assert.equal(q.get().id, 'light');
  });
  await test('Wache (Auto): 60-Hz-Takt nach Absenkung → wieder herauf', async () => {
    const q = await fresh();
    run_(q, 15, 12);   // Probe → Leicht, Wache → Sparsam
    assert.equal(q.get().id, 'eco');
    run_(q, 60, 46);
    assert.equal(q.get().id, 'light');
  });
  await test('Wache (Auto): neue Stufe schafft den Takt nicht → zurück, längere Sperre', async () => {
    const q = await fresh();
    run_(q, 15, 12);   // Probe → Leicht, Wache → Sparsam
    run_(q, 60, 28);   // herauf nach ≈ 27 s, Probezeit läuft noch
    assert.equal(q.get().id, 'light');
    run_(q, 35, 7);
    assert.equal(q.get().id, 'eco', 'Probezeit');
    run_(q, 60, 50);
    assert.equal(q.get().id, 'eco', 'Sperre jetzt 60 s');
    run_(q, 60, 15);
    assert.equal(q.get().id, 'light');
  });
  await test('Bildraten-Deckel 30: gedeckelte 30 fps senken die Stufe nicht', async () => {
    const q = await fresh();
    run_(q, 30, 40, 1 / 30);
    assert.equal(q.get().id, 'fine');
  });
  await test('Feste Wahl → Auto: misst neu und darf wieder schalten', async () => {
    const q = await fresh({ stored: 'fine' });
    run_(q, 4, 10);
    assert.equal(q.get().id, 'fine');
    assert.equal(q.isAuto(), false);
    q.setAuto();
    assert.equal(q.isAuto(), true);
    run_(q, 4, 10);
    assert.equal(q.get().id, 'eco');
  });
  if (failed) { console.log(`\n${failed} Test(s) fehlgeschlagen`); process.exit(1); }
  console.log('\nAlle Tests bestanden');
})();
