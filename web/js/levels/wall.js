// Ebene 4: Innenwand eines Gefäßes (Einheit µm) – Hoftüpfel, Mikrorisse, Bruchkante, Bakterien, Pilzhyphe, Asche.

import * as THREE from 'three';
import { SEM_GLSL, semMaterial } from '../sem.js';
import { disposeGroup } from '../walls.js';
import { mulberry32, gauss, fbm3, vnoisef } from '../util.js';

const R = 16;          // Gefäßradius (Lumen Ø 32 µm)
const TH = 1.6;        // Wanddicke
const S = 15;          // halbe Bogenlänge des Ausschnitts
const Y0 = -17;
const PIT = { sx: 6.0, sy: 5.8, rb: 2.5 };
const HYPHA_PIT = new THREE.Vector2(3.0, -8.7);   // erweiterter Tüpfel (Zelle 0/−2), in den die Hyphe wächst

const topY = (s) => 6.5 + 4.4 * (fbm3(s * 0.12 + 4, 1.3, 0.7, 3) - 0.5) + 0.9 * (fbm3(s * 0.9, 7.1, 2.2, 2) - 0.5);
const surf = (s, y, r) => new THREE.Vector3(r * Math.sin(s / R), y, -r * Math.cos(s / R));
const inward = (s) => new THREE.Vector3(-Math.sin(s / R), 0, Math.cos(s / R));
const along = (s) => new THREE.Vector3(Math.cos(s / R), 0, Math.sin(s / R));

// Risslinie in (s, y) – gleiche Formel im Shader
const crack1Y = (s) => -5 + 4.4 * (vnoisef(s * 0.35, 1, 2) - 0.5) + 0.5 * (vnoisef(s * 1.7, 3, 1) - 0.5);

const FRAG_COMMON = /* glsl */ `
uniform vec3 uDet;
uniform vec3 uTint;
uniform float uR;
uniform vec2 uHyPit;
varying vec2 vUv;
varying vec3 vWorld;
varying vec3 vNormal;
${SEM_GLSL}
vec2 hash22(vec2 p) { return vec2(hash13(vec3(p, 1.7)), hash13(vec3(p, 9.2))); }
float crack1Y(float s) { return -5.0 + 4.4 * (vnoise(vec3(s * 0.35, 1.0, 2.0)) - 0.5) + 0.5 * (vnoise(vec3(s * 1.7, 3.0, 1.0)) - 0.5); }
float crack2S(float y) { return 11.0 + 3.0 * (vnoise(vec3(y * 0.3, 4.0, 6.0)) - 0.5) + 0.4 * (vnoise(vec3(y * 1.9, 2.0, 8.0)) - 0.5); }
// Risse: 0 außerhalb, sonst Abstand zur Risskante (< 0 = im Riss)
float cracks(vec2 st, out float rim) {
  float w1 = (0.16 + 0.14 * vnoise(vec3(st.x * 0.8, 5.0, 0.0))) * smoothstep(-15.5, -11.0, st.x) * smoothstep(3.5, -0.5, st.x);
  float d1 = abs(st.y - crack1Y(st.x)) - w1;
  float w2 = (0.12 + 0.12 * vnoise(vec3(st.y * 0.9, 1.0, 7.0))) * smoothstep(-17.0, -12.0, st.y);
  float d2 = abs(st.x - crack2S(st.y)) - w2;
  rim = 0.0;
  if (w1 > 0.02) rim = max(rim, 1.0 - smoothstep(0.0, 0.25, d1));
  if (w2 > 0.02) rim = max(rim, 1.0 - smoothstep(0.0, 0.25, d2));
  return min(w1 > 0.02 ? d1 : 1.0, w2 > 0.02 ? d2 : 1.0);
}
`;

const SURF_FRAG = /* glsl */ `
uniform float uSide;
${FRAG_COMMON}
void main() {
  vec2 st = vUv;
  vec3 N = normalize(vNormal);
  float phi = st.x / uR;
  vec3 Ts = vec3(cos(phi), 0.0, sin(phi));
  vec2 grad = vec2(0.0);
  float extra = 0.0;
  if (st.x > -12.5 && st.x < 9.0 && st.y > -15.0 && st.y < 3.5) {
    // Hoftüpfel, versetzt angeordnet
    vec2 q = st / vec2(${PIT.sx.toFixed(1)}, ${PIT.sy.toFixed(1)});
    q.x += mod(floor(q.y), 2.0) * 0.5;
    vec2 cell = floor(q);
    vec2 f = (fract(q) - 0.5) * vec2(${PIT.sx.toFixed(1)}, ${PIT.sy.toFixed(1)}) - (hash22(cell) - 0.5) * 0.5;
    float h = hash13(vec3(cell, 4.0));
    float r = length(f);
    if (h < 0.9 && r < ${PIT.rb.toFixed(1)}) {
      grad += -1.1 * f / ${(PIT.rb * PIT.rb).toFixed(2)};
      float ang = 0.75 + (h - 0.5) * 0.6;
      vec2 rf = mat2(cos(ang), -sin(ang), sin(ang), cos(ang)) * f;
      float slit = length(rf / vec2(0.9, h > 0.62 ? 0.7 : 0.26));
      if (slit < 1.0) discard;
      extra += 0.5 * (1.0 - smoothstep(0.0, 0.35, slit - 1.0));                                   // Rand des Porus
      extra += 0.34 * (1.0 - smoothstep(0.0, 0.5, abs(r - ${(PIT.rb - 0.35).toFixed(2)})));        // Hofrand (Wulst)
      extra -= 0.14 * (1.0 - smoothstep(0.2, 1.9, r));                                            // Kammer fällt zum Porus ab
    }
  } else {
    // vereinzelte einfache Tüpfel
    vec2 q = st / 4.0;
    vec2 cell = floor(q);
    vec2 f = (fract(q) - 0.5) * 4.0 - (hash22(cell) - 0.5) * 2.0;
    if (hash13(vec3(cell, 8.0)) < 0.18) {
      float r = length(f / vec2(0.45, 0.32));
      if (r < 1.0) discard;
      extra += 0.4 * (1.0 - smoothstep(0.0, 0.6, r - 1.0));
    }
  }
  vec2 hf = st - uHyPit;
  float hr = length(hf);
  if (hr < 1.7) discard;
  extra += 0.5 * (1.0 - smoothstep(0.0, 0.4, hr - 1.7));
  float rim;
  if (cracks(st, rim) < 0.0) discard;
  extra += 0.55 * rim;
  N = normalize(N - uSide * (grad.x * Ts + grad.y * vec3(0.0, 1.0, 0.0)));
  vec3 V = normalize(cameraPosition - vWorld);
  float g = semShade(N, V, uDet, 0.4) + extra;
  g *= 0.86 + 0.28 * vnoise(vWorld * 3.2);
  gl_FragColor = semOut(g, uTint);
}
`;

const EDGE_FRAG = /* glsl */ `
${FRAG_COMMON}
void main() {
  vec3 N = normalize(vNormal);
  vec3 V = normalize(cameraPosition - vWorld);
  float g = semShade(N, V, uDet, 0.42);
  // Bruchfläche: Schichten der Zellwand und Nanoporen als dunkle Körnung
  g *= 0.85 + 0.15 * sin(vUv.y * 6.2832 * 3.0 + vnoise(vWorld * 2.0) * 2.0);
  float pore = smoothstep(0.6, 0.72, vnoise(vWorld * 11.0));
  g = mix(g, 0.08, 0.75 * pore) + 0.25 * smoothstep(0.52, 0.6, vnoise(vWorld * 11.0)) * (1.0 - pore);
  float rim;
  if (cracks(vec2(vUv.x, vWorld.y), rim) < 0.0) discard;
  gl_FragColor = semOut(g + 0.5 * rim, uTint);
}
`;

const VERT = /* glsl */ `
varying vec2 vUv;
varying vec3 vWorld;
varying vec3 vNormal;
void main() {
  vUv = uv;
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vWorld = wp.xyz;
  vNormal = normalize(mat3(modelMatrix) * normal);
  gl_Position = projectionMatrix * viewMatrix * wp;
}
`;

function uniforms(extra = {}) {
  return {
    uDet: { value: new THREE.Vector3(-0.45, 0.75, 0.5).normalize() },
    uTint: { value: new THREE.Color(0.93, 0.95, 0.98) },
    uR: { value: R },
    uHyPit: { value: HYPHA_PIT },
    ...extra,
  };
}

function wallSurface(radius, side) {
  const NS = 200, NY = 150;
  const pos = [], nrm = [], uv = [], idx = [];
  for (let i = 0; i < NS; i++) {
    const s = -S + (2 * S * i) / (NS - 1);
    const top = topY(s);
    const n = inward(s).multiplyScalar(side);
    for (let j = 0; j < NY; j++) {
      const y = Y0 + ((top - Y0) * j) / (NY - 1);
      const p = surf(s, y, radius);
      pos.push(p.x, p.y, p.z);
      nrm.push(n.x, n.y, n.z);
      uv.push(s, y);
    }
  }
  for (let i = 0; i < NS - 1; i++) {
    for (let j = 0; j < NY - 1; j++) {
      const a = i * NY + j, b = (i + 1) * NY + j;
      if (side > 0) idx.push(a, b, a + 1, b, b + 1, a + 1);
      else idx.push(a, a + 1, b, b, a + 1, b + 1);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(nrm, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  return g;
}

function fractureRibbon() {
  const NS = 400, NT = 6;
  const pos = [], uv = [], idx = [];
  for (let i = 0; i < NS; i++) {
    const s = -S + (2 * S * i) / (NS - 1);
    const y = topY(s);
    for (let j = 0; j < NT; j++) {
      const t = j / (NT - 1);
      const p = surf(s, y + 0.25 * Math.sin(t * Math.PI) * (fbm3(s * 2, t, 1, 2) - 0.3), R + TH * t);
      pos.push(p.x, p.y, p.z);
      uv.push(s, t);
    }
  }
  for (let i = 0; i < NS - 1; i++) {
    for (let j = 0; j < NT - 1; j++) {
      const a = i * NT + j, b = (i + 1) * NT + j;
      idx.push(a, a + 1, b, b, a + 1, b + 1);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  g.computeVertexNormals();
  const n = g.attributes.normal;
  let up = 0;
  for (let i = 0; i < n.count; i++) up += n.getY(i);
  if (up < 0) { idx.reverse(); g.setIndex(idx); g.computeVertexNormals(); }
  return g;
}

// Röhrenradius entlang der Kurve modulieren (Septen, leichte Wellen)
function modulateTube(geo, curve, segs, radial, f) {
  const pos = geo.attributes.position;
  const c = new THREE.Vector3(), v = new THREE.Vector3();
  for (let i = 0; i <= segs; i++) {
    curve.getPointAt(i / segs, c);
    const k = f(i);
    for (let j = 0; j <= radial; j++) {
      const idx = i * (radial + 1) + j;
      v.fromBufferAttribute(pos, idx).sub(c).multiplyScalar(k).add(c);
      pos.setXYZ(idx, v.x, v.y, v.z);
    }
  }
  geo.computeVertexNormals();
  return geo;
}

export function create(ctx) {
  const rand = mulberry32(9001);
  const scene = new THREE.Scene();

  const inner = new THREE.Mesh(wallSurface(R, 1), new THREE.ShaderMaterial({
    uniforms: uniforms({ uSide: { value: 1 } }), vertexShader: VERT, fragmentShader: SURF_FRAG,
  }));
  const outer = new THREE.Mesh(wallSurface(R + TH, -1), new THREE.ShaderMaterial({
    uniforms: uniforms({ uSide: { value: 0 } }), vertexShader: VERT, fragmentShader: SURF_FRAG,
  }));
  const edge = new THREE.Mesh(fractureRibbon(), new THREE.ShaderMaterial({
    uniforms: uniforms(), vertexShader: VERT, fragmentShader: EDGE_FRAG,
  }));
  scene.add(inner, outer, edge);

  const onWall = (s, y, lift) => surf(s, y, R).add(inward(s).multiplyScalar(lift));
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), sc = new THREE.Vector3();
  const yAxis = new THREE.Vector3(0, 1, 0);

  // Bakterien: Stäbchen ≈ 0,7 µm dick, 1,5–2,5 µm lang, flach auf der Wand
  const BAC = { s: 7.2, y: -3.6 };
  const bacteria = [];
  for (let k = 0; k < 26; k++) {
    let s = gauss(rand, BAC.s, 1.6), y = gauss(rand, BAC.y, 1.4);
    if (Math.hypot(s - HYPHA_PIT.x, y - HYPHA_PIT.y) < 3) continue;
    const ang = rand() * Math.PI;
    bacteria.push({ s, y, ang, len: 0.7 + rand() * 0.6, ph: rand() * 6.28 });
  }
  const bacMesh = new THREE.InstancedMesh(new THREE.CapsuleGeometry(0.36, 1, 4, 12), semMaterial({ base: 0.5, noise: 4 }), bacteria.length);
  const placeBacteria = (t) => {
    bacteria.forEach((b, k) => {
      const a = b.ang + 0.05 * Math.sin(t * 0.7 + b.ph);
      const dir = along(b.s).multiplyScalar(Math.cos(a)).addScaledVector(yAxis, Math.sin(a)).normalize();
      q.setFromUnitVectors(yAxis, dir);
      sc.set(1, b.len, 1);
      bacMesh.setMatrixAt(k, m.compose(onWall(b.s, b.y, 0.33), q, sc));
    });
    bacMesh.instanceMatrix.needsUpdate = true;
  };
  placeBacteria(0);
  scene.add(bacMesh);

  // Pilzhyphe: Ø 1,8 µm, wächst über die Wand und in den erweiterten Tüpfel; ein Seitenast
  const hyMat = semMaterial({ base: 0.42, noise: 2.5 });
  const path = [[-17, 1.5], [-12, -0.8], [-7, -2.2], [-2.5, -4.6], [1.2, -7.4]].map(([s, y]) => onWall(s, y, 0.92));
  path.push(onWall(HYPHA_PIT.x, HYPHA_PIT.y, 0.2), onWall(HYPHA_PIT.x + 0.3, HYPHA_PIT.y - 0.2, -2.6));
  const hyCurve = new THREE.CatmullRomCurve3(path);
  const septum = (i) => 1 + 0.05 * Math.sin(i * 0.9) - 0.16 * Math.exp(-Math.pow(((i % 34) - 17) / 2.2, 2));
  scene.add(new THREE.Mesh(modulateTube(new THREE.TubeGeometry(hyCurve, 160, 0.9, 14), hyCurve, 160, 14, septum), hyMat));
  const branch = new THREE.CatmullRomCurve3([[-7, -2.2], [-6.2, 0.6], [-4.4, 3.2], [-2.6, 4.6]].map(([s, y]) => onWall(s, y, 0.85)));
  scene.add(new THREE.Mesh(new THREE.TubeGeometry(branch, 60, 0.8, 12), hyMat));
  const tip = new THREE.Mesh(new THREE.SphereGeometry(0.8, 16, 12), hyMat);
  tip.position.copy(branch.getPoint(1));
  scene.add(tip);

  // Asche: kleine Kristalle, teils eingebettet, und ein Nadelbüschel
  const crystals = [];
  for (let k = 0; k < 18; k++) crystals.push({ s: -14 + rand() * 27, y: -16 + rand() * 18, size: 0.25 + rand() * 0.65, needle: false });
  const NEEDLE = { s: -9.5, y: -12.2 };
  for (let k = 0; k < 8; k++) crystals.push({ s: NEEDLE.s, y: NEEDLE.y, size: 1, needle: true, k });
  const crMesh = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), semMaterial({ base: 0.48, noise: 5 }), crystals.length);
  crystals.forEach((c, k) => {
    const base = onWall(c.s, c.y, c.needle ? 0.1 : c.size * 0.2);
    if (c.needle) {
      const n = inward(c.s);
      const dir = n.clone().multiplyScalar(0.9).addScaledVector(along(c.s), Math.cos(c.k * 0.8) * 0.8).addScaledVector(yAxis, Math.sin(c.k * 0.8) * 0.8).normalize();
      q.setFromUnitVectors(yAxis, dir);
      sc.set(0.12, 1.2 + (c.k % 3) * 0.3, 0.12);
      base.addScaledVector(dir, sc.y / 2);
    } else {
      q.setFromEuler(new THREE.Euler(rand() * 3, rand() * 3, rand() * 3));
      sc.set(c.size, c.size * (0.6 + rand() * 0.6), c.size * (0.7 + rand() * 0.5));
    }
    crMesh.setMatrixAt(k, m.compose(base, q, sc));
  });
  crMesh.instanceMatrix.needsUpdate = true;
  scene.add(crMesh);

  // Hotspot-Stellen: Tüpfel (Gitterzelle −1/−1), Riss, Bruchkante
  const pitCell = [-1, -1];
  const pitS = (pitCell[0] + 0.5 - (Math.abs(pitCell[1]) % 2) * 0.5) * PIT.sx;
  const pitY = (pitCell[1] + 0.5) * PIT.sy;
  const crackS = -9;
  const edgeS = -2.5;
  const edgePos = surf(edgeS, topY(edgeS) + 0.15, R + TH / 2);
  const camera = new THREE.PerspectiveCamera(40, ctx.aspect, 0.1, 400);
  return {
    scene, camera,
    unit: 1e-6,
    method: 'REM · Sekundärelektronen (Modell)',
    tone: 0,
    grain: 0.07,
    home: { pos: new THREE.Vector3(3, 12, 6), target: surf(0, -3, R) },
    orbit: { minDistance: 5, maxDistance: 38, minAzimuthAngle: -0.9, maxAzimuthAngle: 1.1, minPolarAngle: 0.35, maxPolarAngle: 1.75, enablePan: false },
    hotspots: [
      { id: 'fracture', kind: 'dive', pos: edgePos, normal: new THREE.Vector3(0, 1, 0) },
      { id: 'pits', kind: 'info', pos: onWall(pitS, pitY, 0.4), normal: inward(pitS) },
      { id: 'bacteria', kind: 'info', pos: onWall(BAC.s, BAC.y, 0.9), normal: inward(BAC.s) },
      { id: 'hypha', kind: 'info', pos: hyCurve.getPoint(0.3).add(inward(-9).multiplyScalar(0.9)), normal: inward(-9) },
      { id: 'ash', kind: 'info', pos: onWall(NEEDLE.s, NEEDLE.y, 1.4), normal: inward(NEEDLE.s) },
      { id: 'crack', kind: 'info', pos: onWall(crackS, crack1Y(crackS), 0.2), normal: inward(crackS) },
    ],
    update(dt, t) {
      placeBacteria(t);
      return true;
    },
    dispose() { disposeGroup(scene); },
  };
}

