// Ablauf: Ebenen laden, Kamera steuern, Ebenen per „Portal“-Übergang wechseln, Bild zusammenführen.

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { createHud } from './hud.js';

const LOADERS = [
  () => import('./levels/piece.js'),
  () => import('./levels/tissue.js'),
  () => import('./levels/cells.js'),
  () => import('./levels/wall.js'),
  () => import('./levels/meso.js'),
  () => import('./levels/micro.js'),
  () => import('./levels/atoms.js'),
];

const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const params = new URLSearchParams(location.search);
// Prüfhilfe für Screenshots: ?freeze=0.5 hält den ersten Übergang bei diesem Fortschritt an
const freeze = params.has('freeze') ? Math.min(0.999, Math.max(0, +params.get('freeze'))) : null;
// Tour für Ausstellungen: ?tour (optional &dwell=Sekunden) taucht selbständig durch alle Ebenen
const tour = params.has('tour') ? { dwell: Math.max(1, +params.get('dwell') || 12), since: 0 } : null;

const canvas = document.getElementById('stage');
let renderer;
try {
  renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance' });
} catch (err) {
  document.body.classList.add('no-webgl');
  throw err;
}
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
const env = new THREE.PMREMGenerator(renderer).fromScene(new RoomEnvironment(), 0.04).texture;

const state = {
  index: -1, active: null, controls: null, tr: null, intro: null, focus: null,
  temp: 550, rh: 0.8, pendingTemp: null, lastTemp: 0,
  levels: new Map(), loading: new Map(), poses: new Map(), time: 0,
};

// Übergang mit gleicher Zoomrate beider Bilder (je Faktor 7,2): außen fliegt die Kamera auf 1/4 des Abstands
// und das Bild wird 1,8× vergrößert, innen kommt die Kamera von 1,8× Abstand und das Bild wächst von 1/4 auf 1.
const ZOOM = { near: 0.25, tex: 1.8, innerFar: 1.8 };

// ---------- Zusammenführung: Tonemapping je Ebene, Portal-Übergang, Vignette, Korn ----------
const comp = new THREE.ShaderMaterial({
  uniforms: {
    tOuter: { value: null }, tInner: { value: null },
    uAnchor: { value: new THREE.Vector2(0.5, 0.5) }, uRes: { value: new THREE.Vector2(1, 1) },
    uProg: { value: 0 }, uZoomOut: { value: 1 }, uInnerS: { value: 1 }, uMaskR: { value: 0 }, uMaskW: { value: 0.02 }, uBlur: { value: 0 },
    uAspect: { value: 1 }, uTime: { value: 0 }, uFade: { value: 0 },
    uToneOuter: { value: 0 }, uToneInner: { value: 0 }, uGrainOuter: { value: 0 }, uGrainInner: { value: 0 },
    uRing: { value: new THREE.Color(1.0, 0.6, 0.26) },
  },
  vertexShader: /* glsl */ `
    varying vec2 vUv;
    void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }`,
  fragmentShader: /* glsl */ `
    uniform sampler2D tOuter, tInner;
    uniform vec2 uAnchor, uRes;
    uniform float uProg, uZoomOut, uInnerS, uMaskR, uMaskW, uBlur, uAspect, uTime, uFade;
    uniform float uToneOuter, uToneInner, uGrainOuter, uGrainInner;
    uniform vec3 uRing;
    varying vec2 vUv;
    vec3 aces(vec3 x) { return clamp((x * (2.51 * x + 0.03)) / (x * (2.43 * x + 0.59) + 0.14), 0.0, 1.0); }
    vec3 toSRGB(vec3 c) { c = max(c, 0.0); return mix(c * 12.92, 1.055 * pow(c, vec3(1.0 / 2.4)) - 0.055, step(0.0031308, c)); }
    // Bild um c mit Faktor scale vergrößern, optional radial verwischen (Zoom-Bewegung)
    vec3 zoomSample(sampler2D t, vec2 uv, vec2 c, float scale, float blur) {
      vec2 base = c + (uv - c) / scale;
      if (blur < 0.002) return texture2D(t, base).rgb;
      vec3 acc = vec3(0.0);
      for (int i = 0; i < 12; i++) {
        float k = (float(i) / 11.0 - 0.5) * blur;
        acc += texture2D(t, c + (base - c) * (1.0 + k)).rgb;
      }
      return acc / 12.0;
    }
    float hash(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
    void main() {
      vec2 uv = vUv;
      float p = uProg;
      vec3 col;
      float grain;
      if (p <= 0.0001) {
        col = texture2D(tOuter, uv).rgb; col = mix(col, aces(col), uToneOuter); grain = uGrainOuter;
      } else if (p >= 0.9999) {
        col = texture2D(tInner, uv).rgb; col = mix(col, aces(col), uToneInner); grain = uGrainInner;
      } else {
        vec2 q = (uv - uAnchor) * vec2(uAspect, 1.0);
        float r = length(q);
        vec3 o = zoomSample(tOuter, uv, uAnchor, uZoomOut, uBlur);
        o = mix(o, aces(o), uToneOuter);
        // inneres Bild: ganzer Frame, um den Anker auf uInnerS verkleinert
        vec2 iuv = 0.5 + (uv - uAnchor) / uInnerS;
        vec3 ii = zoomSample(tInner, iuv, vec2(0.5), 1.0, uBlur * 0.6);
        ii = mix(ii, aces(ii), uToneInner);
        float inFrame = step(0.0, iuv.x) * step(iuv.x, 1.0) * step(0.0, iuv.y) * step(iuv.y, 1.0);
        float m = (1.0 - smoothstep(uMaskR - uMaskW, uMaskR, r)) * inFrame;
        col = mix(o * (1.0 - 0.45 * p), ii, m);
        float ring = exp(-pow((r - uMaskR) / (0.006 + 0.02 * p), 2.0)) + 0.3 * exp(-pow((r - uMaskR) / 0.09, 2.0));
        col += uRing * ring * (1.0 - smoothstep(0.7, 1.0, p)) * 0.9;
        grain = mix(uGrainOuter, uGrainInner, m);
      }
      vec2 d = (uv - 0.5) * vec2(uAspect, 1.0);
      col *= mix(1.0, smoothstep(1.35, 0.25, length(d)), 0.45);
      col = toSRGB(col);
      col += (hash(uv * uRes + fract(uTime) * 91.7) - 0.5) * grain;
      gl_FragColor = vec4(col * uFade, 1.0);
    }`,
  depthTest: false,
  depthWrite: false,
});
const compScene = new THREE.Scene();
const compQuad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), comp);
compQuad.frustumCulled = false;
compScene.add(compQuad);
const compCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

// ---------- Hilfen ----------
const clampf = (x, a, b) => Math.min(b, Math.max(a, x));
const smootherstep = (t) => { t = clampf(t, 0, 1); return t * t * t * (t * (t * 6 - 15) + 10); };
const smooth = (a, b, x) => { const t = clampf((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
const pose = (pos, target) => ({ pos: pos.clone(), target: target.clone() });

// Kamera zwischen zwei Posen: Ziel linear, Abstand logarithmisch (gleichmäßiges Zoomgefühl)
function lerpPose(cam, a, b, k) {
  const tgt = a.target.clone().lerp(b.target, k);
  const da = a.pos.clone().sub(a.target), db = b.pos.clone().sub(b.target);
  const la = Math.max(da.length(), 1e-6), lb = Math.max(db.length(), 1e-6);
  const dir = da.divideScalar(la).lerp(db.divideScalar(lb), k).normalize();
  cam.position.copy(tgt).addScaledVector(dir, la * Math.pow(lb / la, k));
  cam.lookAt(tgt);
  return tgt;
}

function viewSize() {
  return { w: window.innerWidth, h: window.innerHeight, dpr: renderer.getPixelRatio() };
}

// Bildmitte der Szene in die freie Fläche zwischen Skalen-Leiter und Infotafel legen
function stageShift() {
  if (window.innerWidth <= 860 || document.body.classList.contains('panel-collapsed')) return 0;
  const panel = document.getElementById('panel').getBoundingClientRect();
  const ladder = document.querySelector('.ladder').getBoundingClientRect();
  return (panel.width - ladder.width) / 2;
}

function fitLevel(lv) {
  const { w, h, dpr } = viewSize();
  const s = lv.resScale || 1;
  lv.rt.setSize(Math.max(2, Math.round(w * dpr * s)), Math.max(2, Math.round(h * dpr * s)));
  lv.camera.aspect = w / h;
  lv.camera.setViewOffset(w, h, stageShift(), 0, w, h);
  lv.dirty = true;
}

function resize() {
  const { w, h, dpr } = viewSize();
  renderer.setSize(w, h, false);
  comp.uniforms.uAspect.value = w / h;
  comp.uniforms.uRes.value.set(w * dpr, h * dpr);
  for (const lv of state.levels.values()) fitLevel(lv);
}

// ---------- Ebenen ----------
// quiet = Vorladen im Hintergrund ohne Ladeanzeige
function getLevel(i, quiet = false) {
  if (state.levels.has(i)) return Promise.resolve(state.levels.get(i));
  let job = state.loading.get(i);
  if (!job) job = buildLevel(i);
  if (!quiet) {
    hud.setLoading(true);
    job.finally(() => hud.setLoading(state.loading.size > 0));
  }
  return job;
}

function buildLevel(i) {
  const job = (async () => {
    await new Promise((r) => requestAnimationFrame(() => setTimeout(r, 0)));
    const mod = await LOADERS[i]();
    const lv = mod.create({ env, aspect: window.innerWidth / window.innerHeight, temp: state.temp, rh: state.rh });
    lv.index = i;
    lv.rt = new THREE.WebGLRenderTarget(2, 2, { type: THREE.HalfFloatType, samples: (lv.resScale || 1) < 1 ? 0 : 4 });
    lv.camera.position.copy(lv.home.pos);
    lv.camera.lookAt(lv.home.target);
    lv.target = lv.home.target.clone();
    fitLevel(lv);
    renderer.compile(lv.scene, lv.camera);
    state.levels.set(i, lv);
    state.loading.delete(i);
    return lv;
  })();
  state.loading.set(i, job);
  return job;
}

function idle(fn) {
  (window.requestIdleCallback || ((f) => setTimeout(f, 400)))(fn, { timeout: 2500 });
}

function activate(lv) {
  state.index = lv.index;
  state.active = lv;
  if (state.controls) state.controls.dispose();
  const c = new OrbitControls(lv.camera, canvas);
  c.enableDamping = true;
  c.dampingFactor = 0.045;
  c.rotateSpeed = 0.5;
  c.zoomSpeed = 0.7;
  c.panSpeed = 0.6;
  Object.assign(c, { ...lv.orbit, autoRotate: !reduced && !!lv.orbit.autoRotate });
  c.autoRotateSpeed = 0.22;
  c.target.copy(lv.target);
  c.addEventListener('start', () => { c.autoRotate = false; state.focus = null; });
  c.update();
  state.controls = c;
  hud.setLevel(lv.index, lv, state);
  history.replaceState(null, '', `#ebene=${lv.index + 1}`);
  lv.dirty = true;
  for (const [k, other] of state.levels) {
    if (Math.abs(k - lv.index) > 1) {
      other.dispose();
      other.rt.dispose();
      state.levels.delete(k);
    }
  }
  idle(() => {
    if (lv.index + 1 < LOADERS.length && state.index === lv.index) getLevel(lv.index + 1, true);
  });
}

async function goTo(target, via = null) {
  if (state.tr || state.intro || !state.active || target === state.index || target < 0 || target >= LOADERS.length) return;
  const from = state.active;
  const to = await getLevel(target);
  if (state.tr || state.active !== from) return;
  const down = target > from.index;
  const adjacent = Math.abs(target - from.index) === 1;
  const outer = down ? from : to;
  const inner = down ? to : from;
  let anchorWorld;
  if (down) {
    anchorWorld = via ? via.pos.clone() : state.controls.target.clone();
    state.poses.set(from.index, { ...pose(from.camera.position, state.controls.target), anchorWorld: anchorWorld.clone(), adjacent: adjacent && !!via });
  } else {
    const saved = state.poses.get(to.index);
    anchorWorld = saved && saved.adjacent && adjacent ? saved.anchorWorld.clone() : to.home.target.clone();
  }
  state.controls.enabled = false;
  state.focus = null;

  const near = (p) => {
    const dir = p.pos.clone().sub(anchorWorld);
    const dist = dir.length();
    return { pos: anchorWorld.clone().addScaledVector(dir.normalize(), Math.max(dist * ZOOM.near, 1e-4)), target: anchorWorld.clone() };
  };
  const far = (p) => ({ pos: p.target.clone().add(p.pos.clone().sub(p.target).multiplyScalar(ZOOM.innerFar)), target: p.target.clone() });
  let outerFrom, outerTo, innerFrom, innerTo;
  if (down) {
    outerFrom = pose(from.camera.position, state.controls.target);
    outerTo = near(outerFrom);
    innerTo = pose(to.home.pos, to.home.target);
    innerFrom = far(innerTo);
  } else {
    const saved = state.poses.get(to.index);
    outerTo = saved && adjacent ? pose(saved.pos, saved.target) : pose(to.home.pos, to.home.target);
    outerFrom = near(outerTo);
    innerFrom = pose(from.camera.position, state.controls.target);
    innerTo = far(innerFrom);
  }
  state.tr = {
    t: 0, dur: reduced ? 1.0 : adjacent ? 4.4 : 3.4, down, outer, inner, to, anchorWorld,
    outerFrom, outerTo, innerFrom, innerTo,
  };
  hud.hideMarkers(true);
}

function stepTransition(dt) {
  const tr = state.tr;
  tr.t = freeze !== null ? freeze : Math.min(1, tr.t + dt / tr.dur);
  const e = smootherstep(tr.t);
  const p = tr.down ? e : 1 - e;            // 0 = nur äußeres Bild, 1 = nur inneres
  if (reduced) {
    lerpPose(tr.outer.camera, tr.outerFrom, tr.outerTo, tr.down ? 0 : 1);
    lerpPose(tr.inner.camera, tr.innerFrom, tr.innerTo, tr.down ? 1 : 0);
  } else {
    lerpPose(tr.outer.camera, tr.outerFrom, tr.outerTo, e);
    lerpPose(tr.inner.camera, tr.innerFrom, tr.innerTo, e);
  }
  // Anker im äußeren Bild – wandert mit der Kamerafahrt zur Bildmitte
  const a = tr.anchorWorld.clone().project(tr.outer.camera);
  const u = comp.uniforms;
  u.uAnchor.value.set(clampf((a.x + 1) / 2, 0.08, 0.92), clampf((a.y + 1) / 2, 0.08, 0.92));
  u.uProg.value = p;
  u.uZoomOut.value = Math.pow(ZOOM.tex, p);
  const s = Math.pow(ZOOM.near, 1 - p);     // Größe des inneren Bildes
  u.uInnerS.value = s;
  const frameR = s * 0.46 * Math.min(1, u.uAspect.value) * smooth(0, 0.1, p);
  u.uMaskR.value = frameR + (1.8 - frameR) * smooth(0.55, 1, p);
  u.uMaskW.value = 0.012 + 0.1 * p;
  u.uBlur.value = reduced ? 0 : 0.14 * Math.sin(Math.PI * p);
  if (tr.t >= 1) {
    const to = tr.to;
    const end = tr.down ? tr.innerTo : tr.outerTo;
    to.camera.position.copy(end.pos);
    to.camera.lookAt(end.target);
    to.target = end.target.clone();
    state.tr = null;
    u.uProg.value = 0;
    u.uBlur.value = 0;
    activate(to);
    hud.hideMarkers(false);
  }
}

function render(lv, dt, force) {
  const animated = lv.update ? lv.update(dt, state.time) : false;
  lv.camera.updateMatrixWorld();
  const e = lv.camera.matrixWorld.elements, p = lv.camera.projectionMatrix.elements;
  const last = lv.lastCam || (lv.lastCam = new Float64Array(32));
  let moved = false;
  for (let i = 0; i < 16; i++) {
    if (last[i] !== e[i]) { moved = true; last[i] = e[i]; }
    if (last[16 + i] !== p[i]) { moved = true; last[16 + i] = p[i]; }
  }
  if (force || animated || moved || lv.dirty) {
    renderer.setRenderTarget(lv.rt);
    renderer.render(lv.scene, lv.camera);
    lv.dirty = false;
  }
}

// ---------- Eingaben ----------
function diveHotspot(id) {
  const lv = state.active;
  const h = id ? lv.hotspots.find((x) => x.id === id) : lv.hotspots.find((x) => x.kind === 'dive');
  if (h && h.kind === 'dive') goTo(lv.index + 1, h);
}

const hud = createHud({
  onJump: (i) => goTo(i),
  onUp: () => goTo(state.index - 1),
  onDown: () => diveHotspot(),
  onDive: (id) => diveHotspot(id),
  onHotspot: (id, fromMarker) => {
    if (state.tr || !state.active) return;
    const h = state.active.hotspots.find((x) => x.id === id);
    if (!h) return;
    if (fromMarker && h.kind === 'dive') { diveHotspot(id); return; }
    hud.select(id, state);
    const c = state.controls;
    c.autoRotate = false;
    // Blick sanft zum Punkt schwenken und ein Stück heranfahren
    state.focus = {
      t: 0,
      fromT: c.target.clone(), toT: c.target.clone().lerp(h.pos, 0.6),
      fromP: c.object.position.clone(), toP: c.object.position.clone().lerp(h.pos, 0.1),
    };
  },
  onTemp: (v) => { state.pendingTemp = v; },
  onRh: (v) => {
    state.rh = v;
    for (const lv of state.levels.values()) if (lv.setParam) lv.setParam('rh', v);
  },
});

const wheel = { acc: 0, dir: '', timer: 0 };
canvas.addEventListener('wheel', (e) => {
  if (state.tr || !state.controls) return;
  const c = state.controls;
  const dist = c.object.position.distanceTo(c.target);
  const dy = e.deltaY * (e.deltaMode === 1 ? 33 : 1);
  let dir = '';
  if (dy > 0 && dist >= c.maxDistance * 0.985 && state.index > 0) dir = 'up';
  if (dy < 0 && dist <= c.minDistance * 1.015 && state.active.hotspots.some((h) => h.kind === 'dive')) dir = 'down';
  if (!dir || (wheel.dir && wheel.dir !== dir)) { wheel.acc = 0; wheel.dir = ''; hud.setEdgeMeter('', 0); return; }
  wheel.dir = dir;
  wheel.acc += Math.abs(dy);
  hud.setEdgeMeter(dir, Math.min(1, wheel.acc / 500));
  clearTimeout(wheel.timer);
  wheel.timer = setTimeout(() => { wheel.acc = 0; wheel.dir = ''; hud.setEdgeMeter('', 0); }, 700);
  if (wheel.acc > 500) {
    wheel.acc = 0; wheel.dir = '';
    hud.setEdgeMeter('', 0);
    if (dir === 'up') goTo(state.index - 1); else diveHotspot();
  }
}, { passive: true });

window.addEventListener('keydown', (e) => {
  if (e.target.closest('input, textarea, select') || e.metaKey || e.ctrlKey || e.altKey) return;
  if (e.key === 'Escape' || e.key === 'PageUp') { e.preventDefault(); goTo(state.index - 1); }
  else if (e.key === 'PageDown') { e.preventDefault(); diveHotspot(); }
  else if (/^[1-7]$/.test(e.key)) goTo(+e.key - 1);
});

window.addEventListener('hashchange', () => {
  const m = /ebene=(\d)/.exec(location.hash);
  if (m && +m[1] - 1 !== state.index) goTo(+m[1] - 1);
});
window.addEventListener('resize', resize);
document.getElementById('btn-panel').addEventListener('click', () => requestAnimationFrame(resize));

if (tour) ['pointerdown', 'wheel', 'keydown'].forEach((ev) => window.addEventListener(ev, () => { tour.dwell = Infinity; }, { once: true }));
function stepTour(real) {
  if (!tour || state.tr || state.intro || !state.active) return;
  tour.since += real;
  if (tour.since < tour.dwell) return;
  tour.since = 0;
  if (state.active.hotspots.some((h) => h.kind === 'dive')) diveHotspot();
  else goTo(0);
}

// ---------- Schleife ----------
let last = performance.now();
function frame(now) {
  // echte Zeit für Einblenden, Intro und Übergänge (auch bei wenigen Bildern pro Sekunde),
  // gedeckelte Zeit für Bewegungen in den Szenen
  const real = Math.min(0.25, (now - last) / 1000);
  const dt = Math.min(0.05, real);
  last = now;
  state.time += dt;
  if (state.pendingTemp !== null && now - state.lastTemp > 140) {
    state.temp = state.pendingTemp;
    state.pendingTemp = null;
    state.lastTemp = now;
    for (const lv of state.levels.values()) if (lv.setParam) lv.setParam('temp', state.temp);
  }
  const { w, h } = viewSize();
  const lv = state.active;
  if (state.tr) stepTransition(real);
  else stepTour(real);
  if (state.tr) {
    render(state.tr.outer, dt, true);
    render(state.tr.inner, dt, true);
    comp.uniforms.tOuter.value = state.tr.outer.rt.texture;
    comp.uniforms.tInner.value = state.tr.inner.rt.texture;
    comp.uniforms.uToneOuter.value = state.tr.outer.tone;
    comp.uniforms.uToneInner.value = state.tr.inner.tone;
    comp.uniforms.uGrainOuter.value = state.tr.outer.grain;
    comp.uniforms.uGrainInner.value = state.tr.inner.grain;
  } else if (lv) {
    if (state.intro) {
      state.intro.t = Math.min(1, state.intro.t + real / state.intro.dur);
      lerpPose(lv.camera, state.intro.from, state.intro.to, smootherstep(state.intro.t));
      if (state.intro.t >= 1) { state.intro = null; state.controls.enabled = true; state.controls.update(); }
    } else {
      if (state.focus) {
        const f = state.focus;
        f.t = Math.min(1, f.t + real / 1.6);
        const k = smootherstep(f.t);
        state.controls.target.lerpVectors(f.fromT, f.toT, k);
        lv.camera.position.lerpVectors(f.fromP, f.toP, k);
        if (f.t >= 1) state.focus = null;
      }
      state.controls.update(dt);
    }
    render(lv, dt, false);
    comp.uniforms.tOuter.value = lv.rt.texture;
    comp.uniforms.uToneOuter.value = lv.tone;
    comp.uniforms.uGrainOuter.value = lv.grain;
    const c = state.controls;
    const dist = lv.camera.position.distanceTo(c.target);
    const hfw = 2 * dist * Math.tan(THREE.MathUtils.degToRad(lv.camera.fov) / 2) * lv.camera.aspect * lv.unit;
    hud.updateScale(hfw, w);
    hud.updateMarkers(lv.camera, w, h);
  }
  comp.uniforms.uFade.value = Math.min(1, comp.uniforms.uFade.value + real / 1.4);
  comp.uniforms.uTime.value = state.time;
  renderer.setRenderTarget(null);
  renderer.render(compScene, compCam);
  requestAnimationFrame(frame);
}

async function start() {
  resize();
  const m = /ebene=(\d)/.exec(location.hash);
  const first = m ? Math.min(LOADERS.length - 1, Math.max(0, +m[1] - 1)) : 0;
  const lv = await getLevel(first);
  activate(lv);
  if (first === 0 && !reduced && freeze === null) {
    // Auftakt: von weiter weg und leicht versetzt langsam heranfahren
    const to = pose(lv.home.pos, lv.home.target);
    const off = to.pos.clone().sub(to.target).multiplyScalar(2.4).applyAxisAngle(new THREE.Vector3(0, 1, 0), -0.55);
    off.y += 2.2;
    const from = { pos: to.target.clone().add(off), target: to.target.clone() };
    lerpPose(lv.camera, from, to, 0);
    state.controls.enabled = false;
    state.intro = { t: 0, dur: 5.2, from, to };
  }
  document.body.classList.add('is-ready');
  requestAnimationFrame(frame);
  if (freeze !== null) {
    state.controls.enabled = true;
    diveHotspot();
  }
}

start().catch((err) => {
  console.error(err);
  document.body.classList.add('has-error');
});
