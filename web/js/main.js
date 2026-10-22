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

// ---------- Zusammenführung: Tonemapping je Ebene, Portal-Übergang, Vignette, Korn ----------
const comp = new THREE.ShaderMaterial({
  uniforms: {
    tOuter: { value: null }, tInner: { value: null },
    uAnchor: { value: new THREE.Vector2(0.5, 0.5) }, uRes: { value: new THREE.Vector2(1, 1) },
    uProg: { value: 0 }, uAspect: { value: 1 }, uTime: { value: 0 }, uFade: { value: 0 },
    uToneOuter: { value: 0 }, uToneInner: { value: 0 }, uGrainOuter: { value: 0 }, uGrainInner: { value: 0 },
    uRing: { value: new THREE.Color(1.0, 0.62, 0.28) },
  },
  vertexShader: /* glsl */ `
    varying vec2 vUv;
    void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }`,
  fragmentShader: /* glsl */ `
    uniform sampler2D tOuter, tInner;
    uniform vec2 uAnchor, uRes;
    uniform float uProg, uAspect, uTime, uFade, uToneOuter, uToneInner, uGrainOuter, uGrainInner;
    uniform vec3 uRing;
    varying vec2 vUv;
    vec3 aces(vec3 x) { return clamp((x * (2.51 * x + 0.03)) / (x * (2.43 * x + 0.59) + 0.14), 0.0, 1.0); }
    vec3 toSRGB(vec3 c) { c = max(c, 0.0); return mix(c * 12.92, 1.055 * pow(c, vec3(1.0 / 2.4)) - 0.055, step(0.0031308, c)); }
    vec3 zoomSample(sampler2D t, vec2 uv, vec2 c, float scale, float blur) {
      vec2 base = c + (uv - c) / scale;
      if (blur < 0.002) return texture2D(t, base).rgb;
      vec3 acc = vec3(0.0);
      for (int i = 0; i < 10; i++) acc += texture2D(t, c + (base - c) * (1.0 - blur * float(i) / 10.0)).rgb;
      return acc / 10.0;
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
        vec3 o = zoomSample(tOuter, uv, uAnchor, mix(1.0, 3.0, p * p), 0.18 * p);
        o = mix(o, aces(o), uToneOuter);
        vec2 q = (uv - uAnchor) * vec2(uAspect, 1.0);
        float r = length(q);
        float R = 1.9 * smoothstep(0.0, 1.0, p);
        vec3 ii = zoomSample(tInner, uv, uAnchor, clamp(R / 0.9, 0.08, 1.0), 0.12 * (1.0 - p));
        ii = mix(ii, aces(ii), uToneInner);
        float m = 1.0 - smoothstep(R - 0.02 - 0.08 * p, R, r);
        col = mix(o * (1.0 - 0.35 * p), ii, m);
        col += uRing * exp(-pow((r - R) / (0.006 + 0.012 * p), 2.0)) * (1.0 - smoothstep(0.7, 1.0, p)) * 0.9;
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
const easeIn = (t) => t * t * t;
const easeOut = (t) => 1 - Math.pow(1 - t, 3);
const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
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

function projectUV(world, camera) {
  const p = world.clone().project(camera);
  return new THREE.Vector2(Math.min(0.95, Math.max(0.05, (p.x + 1) / 2)), Math.min(0.95, Math.max(0.05, (p.y + 1) / 2)));
}

function viewSize() {
  return { w: window.innerWidth, h: window.innerHeight, dpr: renderer.getPixelRatio() };
}

// Bildmitte der Szene in die freie Fläche zwischen Skalen-Leiter und Infotafel legen
function stageShift() {
  const panel = document.getElementById('panel');
  const ladder = document.querySelector('.ladder');
  if (window.innerWidth <= 860 || document.body.classList.contains('panel-collapsed')) return 0;
  return (panel.getBoundingClientRect().width - ladder.getBoundingClientRect().width) / 2;
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
  c.dampingFactor = 0.08;
  c.rotateSpeed = 0.6;
  c.zoomSpeed = 0.9;
  Object.assign(c, { ...lv.orbit, autoRotate: !reduced && !!lv.orbit.autoRotate });
  c.autoRotateSpeed = 0.45;
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
  let anchorWorld, anchorUV = new THREE.Vector2(0.5, 0.5);
  if (down) {
    anchorWorld = via ? via.pos.clone() : state.controls.target.clone();
    if (via) anchorUV = projectUV(anchorWorld, from.camera);
    state.poses.set(from.index, { ...pose(from.camera.position, state.controls.target), anchorWorld, anchorUV, adjacent: adjacent && !!via });
  } else {
    const saved = state.poses.get(to.index);
    if (saved && saved.adjacent && adjacent) { anchorWorld = saved.anchorWorld.clone(); anchorUV = saved.anchorUV.clone(); }
    else anchorWorld = to.home.target.clone();
  }
  state.controls.enabled = false;
  state.focus = null;

  const near = (p) => {
    const dir = p.pos.clone().sub(anchorWorld);
    const dist = dir.length();
    return { pos: anchorWorld.clone().addScaledVector(dir.normalize(), Math.max(dist * 0.08, 1e-4)), target: anchorWorld.clone() };
  };
  let outerFrom, outerTo, innerFrom, innerTo;
  if (down) {
    outerFrom = pose(from.camera.position, state.controls.target);
    outerTo = near(outerFrom);
    innerTo = pose(to.home.pos, to.home.target);
    innerFrom = { pos: innerTo.target.clone().add(innerTo.pos.clone().sub(innerTo.target).multiplyScalar(2.6)), target: innerTo.target.clone() };
  } else {
    const saved = state.poses.get(to.index);
    outerTo = saved && adjacent ? pose(saved.pos, saved.target) : pose(to.home.pos, to.home.target);
    outerFrom = near(outerTo);
    innerFrom = pose(from.camera.position, state.controls.target);
    innerTo = { pos: innerFrom.target.clone().add(innerFrom.pos.clone().sub(innerFrom.target).multiplyScalar(2.6)), target: innerFrom.target.clone() };
  }
  comp.uniforms.uAnchor.value.copy(anchorUV);
  state.tr = {
    t: 0, dur: reduced ? 0.8 : adjacent ? 2.6 : 2.0, down, outer, inner, to,
    outerFrom, outerTo, innerFrom, innerTo,
  };
  hud.hideMarkers(true);
}

function stepTransition(dt) {
  const tr = state.tr;
  tr.t = freeze !== null ? freeze : Math.min(1, tr.t + dt / tr.dur);
  const t = tr.t;
  if (reduced) {
    comp.uniforms.uProg.value = tr.down ? t : 1 - t;
  } else {
    lerpPose(tr.outer.camera, tr.outerFrom, tr.outerTo, tr.down ? easeIn(t) : easeOut(t));
    lerpPose(tr.inner.camera, tr.innerFrom, tr.innerTo, tr.down ? easeOut(smooth(0.2, 1, t)) : easeIn(smooth(0, 0.8, t)));
    comp.uniforms.uProg.value = tr.down ? smooth(0.22, 1, t) : 1 - smooth(0, 0.78, t);
  }
  if (t >= 1) {
    const to = tr.to;
    const end = tr.down ? tr.innerTo : tr.outerTo;
    to.camera.position.copy(end.pos);
    to.camera.lookAt(end.target);
    to.target = end.target.clone();
    state.tr = null;
    comp.uniforms.uProg.value = 0;
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
    state.controls.autoRotate = false;
    state.focus = { from: state.controls.target.clone(), to: state.controls.target.clone().lerp(h.pos, 0.6), t: 0 };
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

// Tour für Ausstellungen: ?tour (optional &dwell=Sekunden) taucht selbständig durch alle Ebenen
const params = new URLSearchParams(location.search);
// Prüfhilfe für Screenshots: ?freeze=0.5 hält den ersten Übergang bei diesem Fortschritt an
const freeze = params.has('freeze') ? Math.min(0.999, Math.max(0, +params.get('freeze'))) : null;
const tour = params.has('tour') ? { dwell: Math.max(1, +params.get('dwell') || 10), since: 0 } : null;
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
  if (state.tr) {
    stepTransition(real);
  } else {
    stepTour(real);
  }
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
      state.intro.t = Math.min(1, state.intro.t + real / 2.4);
      lerpPose(lv.camera, state.intro.from, state.intro.to, easeOut(state.intro.t));
      if (state.intro.t >= 1) { state.intro = null; state.controls.enabled = true; state.controls.update(); }
    } else {
      if (state.focus) {
        state.focus.t = Math.min(1, state.focus.t + real / 0.9);
        state.controls.target.lerpVectors(state.focus.from, state.focus.to, easeOut(state.focus.t));
        if (state.focus.t >= 1) state.focus = null;
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
  comp.uniforms.uFade.value = Math.min(1, comp.uniforms.uFade.value + real / 1.2);
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
  if (first === 0 && !reduced) {
    const to = pose(lv.home.pos, lv.home.target);
    const from = { pos: to.target.clone().add(to.pos.clone().sub(to.target).multiplyScalar(1.9)).add(new THREE.Vector3(0, 2.5, 0)), target: to.target.clone() };
    lerpPose(lv.camera, from, to, 0);
    state.controls.enabled = false;
    state.intro = { t: 0, from, to };
  }
  document.body.classList.add('is-ready');
  requestAnimationFrame(frame);
  if (freeze !== null) {
    state.intro = null;
    state.controls.enabled = true;
    diveHotspot();
  }
}

start().catch((err) => {
  console.error(err);
  document.body.classList.add('has-error');
});
