// Ebene 6: turbostratischer Kohlenstoff (Einheit nm) – gewellte Graphen-Schichten in kleinen Stapeln,
// Mikroporen dazwischen, Gasmoleküle. Größe und Ordnung folgen der Pyrolysetemperatur (science.js).

import * as THREE from 'three';
import { mulberry32, gauss, clamp } from '../util.js';
import { nanoStructure, fmt } from '../science.js';

const HALF = new THREE.Vector3(5.5, 3.6, 4.2);

const SHEET_VERT = /* glsl */ `
attribute vec4 aSheet;     // Krümmung, Sattel/Schale (−1/1), Durchmesser nm, Seed
varying vec2 vLocal;
varying vec4 vSheet;
varying vec3 vN;
varying vec3 vWorld;
varying float vView;
void main() {
  vec3 p = position;
  p.z = aSheet.x * (p.x * p.x + aSheet.y * p.y * p.y);
  vec3 n = normalize(vec3(-2.0 * aSheet.x * p.x, -2.0 * aSheet.x * aSheet.y * p.y, 1.0));
  vLocal = position.xy;
  vSheet = aSheet;
  vec4 wp = modelMatrix * instanceMatrix * vec4(p, 1.0);
  vWorld = wp.xyz;
  vN = normalize(mat3(modelMatrix) * mat3(instanceMatrix) * n);
  vec4 mv = viewMatrix * wp;
  vView = -mv.z;
  gl_Position = projectionMatrix * mv;
}
`;

const SHEET_FRAG = /* glsl */ `
uniform vec3 uColor;
uniform float uFogStart;
varying vec2 vLocal;
varying vec4 vSheet;
varying vec3 vN;
varying vec3 vWorld;
varying float vView;
float hexDist(vec2 p) { p = abs(p); return max(dot(p, vec2(0.5, 0.8660254)), p.x); }
vec4 hexCoords(vec2 uv) {
  const vec2 s = vec2(1.0, 1.7320508);
  vec4 hC = floor(vec4(uv, uv - vec2(0.5, 1.0)) / s.xyxy) + 0.5;
  vec4 h = vec4(uv - hC.xy * s, uv - (hC.zw + 0.5) * s);
  return dot(h.xy, h.xy) < dot(h.zw, h.zw) ? vec4(h.xy, hC.xy) : vec4(h.zw, hC.zw + 0.5);
}
void main() {
  float r = length(vLocal);
  float ang = atan(vLocal.y, vLocal.x);
  float rim = 0.5 * (0.86 + 0.08 * sin(ang * 5.0 + vSheet.w * 20.0) + 0.06 * sin(ang * 9.0 + vSheet.w * 7.0));
  if (r > rim) discard;
  vec2 uv = vLocal * vSheet.z / 0.246 + vSheet.w * 13.0;   // Gitterkonstante 0,246 nm, C–C 0,142 nm
  vec4 hc = hexCoords(uv);
  float e = 0.5 - hexDist(hc.xy);
  vec2 q = abs(hc.xy);
  float dv = min(length(q - vec2(0.5, 0.288675)), length(q - vec2(0.0, 0.57735)));
  float aa = fwidth(uv.x) * 0.9;
  float bond = 1.0 - smoothstep(0.045 - aa, 0.06 + aa, e);
  float atom = 1.0 - smoothstep(0.09 - aa, 0.12 + aa, dv);
  float detail = smoothstep(0.55, 0.2, fwidth(uv.x));          // aus der Ferne: Fläche statt Gitter
  float m = mix(0.55, max(bond * 0.8, atom), detail);
  float fog = exp(-max(vView - uFogStart, 0.0) * 0.16);
  vec3 V = normalize(cameraPosition - vWorld);
  float facing = abs(dot(normalize(vN), V));
#ifdef SHEET_FILL
  gl_FragColor = vec4(uColor * (0.05 + 0.05 * (1.0 - facing)) * fog, 1.0);
#else
  if (m < 0.35) discard;
  float edgeGlow = smoothstep(rim - 0.05, rim, r);
  vec3 col = uColor * (0.35 + 0.55 * atom + 0.35 * (1.0 - facing) + 0.4 * edgeGlow) * fog;
  gl_FragColor = vec4(pow(col, vec3(2.2)), 1.0);
#endif
}
`;

const MOLECULES = {
  co2: [['C', 0, 0, 0], ['O', 0.116, 0, 0], ['O', -0.116, 0, 0]],
  n2: [['N', 0.055, 0, 0], ['N', -0.055, 0, 0]],
  h2o: [['O', 0, 0, 0], ['H', 0.0757, 0.0586, 0], ['H', -0.0757, 0.0586, 0]],
};
const ELEMENT = {
  C: { r: 0.085, color: new THREE.Color(0.32, 0.33, 0.36) },
  O: { r: 0.08, color: new THREE.Color(0.9, 0.24, 0.22) },
  N: { r: 0.08, color: new THREE.Color(0.3, 0.5, 0.95) },
  H: { r: 0.05, color: new THREE.Color(0.95, 0.95, 0.97) },
};

function generate(T, seed) {
  const rand = mulberry32(seed);
  const ns = nanoStructure(T);
  const units = [];
  const sheets = [];
  const target = Math.round(260 - 70 * ns.k);
  for (let tries = 0; tries < 5000 && units.length < target; tries++) {
    const c = new THREE.Vector3((rand() * 2 - 1) * HALF.x, (rand() * 2 - 1) * HALF.y, (rand() * 2 - 1) * HALF.z);
    const d = clamp(gauss(rand, ns.sheetNm, ns.sheetNm * 0.25), 0.45, 2.6);
    if (units.some((u) => u.c.distanceTo(c) < 0.42 * (u.d + d) + 0.15)) continue;
    const n = new THREE.Vector3(gauss(rand), gauss(rand), gauss(rand)).normalize();
    // bei hoher Temperatur lokal besser ausgerichtet (Domänen)
    if (ns.k > 0.3) n.lerp(new THREE.Vector3(0.25, 1, 0.1).normalize(), (ns.k - 0.3) * 0.35).normalize();
    const layers = clamp(Math.round(gauss(rand, ns.layers, 0.7)), 1, 4);
    const u = { c, d, n, layers };
    units.push(u);
    const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), n);
    q.multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), rand() * 6.28));
    for (let k = 0; k < layers; k++) {
      const off = (k - (layers - 1) / 2) * ns.d002 * (1 + (rand() - 0.5) * 0.08);
      sheets.push({
        pos: c.clone().addScaledVector(n, off), q: q.clone().multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), (rand() - 0.5) * 0.5)),
        d: d * (0.85 + rand() * 0.3), curv: ns.curvature * (0.5 + rand()), shape: rand() < 0.5 ? -1 : 1, seed: rand(), unit: u,
      });
    }
  }
  return { ns, units, sheets };
}

// Abstand eines Punktes zur nächsten Schicht (Scheibe mit Radius R); Schichten als Zahlenfelder für Tempo
function sheetTable(sheets) {
  const n = new THREE.Vector3();
  return sheets.map((s) => {
    n.set(0, 0, 1).applyQuaternion(s.q);
    return [s.pos.x, s.pos.y, s.pos.z, n.x, n.y, n.z, s.d * 0.45];
  });
}

function nearestSheet(table, px, py, pz, stopBelow) {
  let d = Infinity;
  for (const [cx, cy, cz, nx, ny, nz, R] of table) {
    const vx = px - cx, vy = py - cy, vz = pz - cz;
    const dist2 = vx * vx + vy * vy + vz * vz;
    if (dist2 > (d + R) * (d + R)) continue;
    const h = vx * nx + vy * ny + vz * nz;
    const radial = Math.sqrt(Math.max(0, dist2 - h * h));
    const dd = radial < R ? Math.abs(h) : Math.hypot(h, radial - R);
    if (dd < d) {
      d = dd;
      if (d < stopBelow) break;
    }
  }
  return d;
}

export function create(ctx) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x05070b);
  scene.environment = ctx.env;
  scene.environmentIntensity = 0.8;
  const key = new THREE.DirectionalLight(0xffffff, 1.6);
  key.position.set(4, 8, 6);
  scene.add(key);

  const geo = new THREE.RingGeometry(0.001, 0.5, 48, 8);
  const uniforms = { uColor: { value: new THREE.Color(0.62, 0.8, 1.0) }, uFogStart: { value: 10 } };
  const lineMat = new THREE.ShaderMaterial({ uniforms, vertexShader: SHEET_VERT, fragmentShader: SHEET_FRAG, side: THREE.DoubleSide });
  const fillMat = new THREE.ShaderMaterial({
    uniforms, vertexShader: SHEET_VERT, fragmentShader: SHEET_FRAG, side: THREE.DoubleSide,
    defines: { SHEET_FILL: '' }, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false,
  });
  const group = new THREE.Group();
  scene.add(group);

  // Mikropore als Sonde
  const probe = new THREE.Mesh(new THREE.SphereGeometry(1, 32, 20), new THREE.MeshBasicMaterial({
    color: 0xffa040, transparent: true, opacity: 0.16, blending: THREE.AdditiveBlending, depthWrite: false,
  }));
  scene.add(probe);

  // Gasmoleküle
  const rand = mulberry32(55);
  const mols = [];
  const kinds = [...Array(20).fill('co2'), ...Array(12).fill('n2'), ...Array(10).fill('h2o')];
  for (const kind of kinds) {
    mols.push({
      kind, pos: new THREE.Vector3((rand() * 2 - 1) * HALF.x, (rand() * 2 - 1) * HALF.y, (rand() * 2 - 1) * HALF.z),
      vel: new THREE.Vector3(gauss(rand), gauss(rand), gauss(rand)).multiplyScalar(0.35),
      q: new THREE.Quaternion().setFromEuler(new THREE.Euler(rand() * 6, rand() * 6, rand() * 6)),
      spin: new THREE.Vector3(gauss(rand), gauss(rand), gauss(rand)).multiplyScalar(0.8),
    });
  }
  const atomCount = mols.reduce((n, m) => n + MOLECULES[m.kind].length, 0);
  const atomMesh = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 18, 12), new THREE.MeshStandardMaterial({ roughness: 0.35 }), atomCount);
  {
    let i = 0;
    for (const m of mols) for (const [el] of MOLECULES[m.kind]) atomMesh.setColorAt(i++, ELEMENT[el].color);
  }
  scene.add(atomMesh);

  const hs = {
    sheet: { id: 'sheet', kind: 'dive', pos: new THREE.Vector3(), normal: new THREE.Vector3() },
    stack: { id: 'stack', kind: 'info', pos: new THREE.Vector3(), normal: null },
    micropore: { id: 'micropore', kind: 'info', pos: new THREE.Vector3(), normal: null },
    gas: { id: 'gas', kind: 'info', pos: new THREE.Vector3(), normal: null },
  };
  let model = null;
  let poreD = 0;
  const camera = new THREE.PerspectiveCamera(45, ctx.aspect, 0.05, 200);
  const homePos = new THREE.Vector3(1.2, 1.6, 13);

  function rebuild(T) {
    for (const c of [...group.children]) { group.remove(c); }
    model = generate(T, 1234);
    const { sheets } = model;
    const data = new Float32Array(sheets.length * 4);
    const lines = new THREE.InstancedMesh(geo, lineMat, sheets.length);
    const m = new THREE.Matrix4();
    sheets.forEach((s, k) => {
      lines.setMatrixAt(k, m.compose(s.pos, s.q, new THREE.Vector3(s.d, s.d, s.d)));
      data.set([s.curv, s.shape, s.d, s.seed], k * 4);
    });
    geo.setAttribute('aSheet', new THREE.InstancedBufferAttribute(data, 4));
    const fill = new THREE.InstancedMesh(geo, fillMat, sheets.length);
    fill.instanceMatrix = lines.instanceMatrix;
    group.add(lines, fill);

    // Hotspots: großer Cluster nahe der Mitte (Tauchziel), dicker Stapel, größte leere Kugel, ein CO2-Molekül
    const near = (u) => u.c.length() + Math.abs(u.c.z - 1.5) * 0.3;
    const big = model.units.filter((u) => u.d >= model.ns.sheetNm).sort((a, b) => near(a) - near(b))[0] || model.units[0];
    const nrm = big.n.clone();
    if (nrm.dot(homePos.clone().sub(big.c)) < 0) nrm.negate();
    hs.sheet.pos.copy(big.c).addScaledVector(nrm, 0.25);
    hs.sheet.normal.copy(nrm);
    const stack = model.units.filter((u) => u.layers >= 2 && u !== big).sort((a, b) => a.c.distanceTo(new THREE.Vector3(-2.5, 1, 1)) - b.c.distanceTo(new THREE.Vector3(-2.5, 1, 1)))[0] || big;
    hs.stack.pos.copy(stack.c);
    const r = mulberry32(99);
    const table = sheetTable(sheets);
    let best = null, bestD = 0;
    for (let k = 0; k < 2500; k++) {
      const px = (r() * 2 - 1) * 3, py = (r() * 2 - 1) * 2, pz = (r() * 2 - 1) * 2.5;
      const d = nearestSheet(table, px, py, pz, bestD);
      if (d > bestD && d < 1.0) { bestD = d; best = new THREE.Vector3(px, py, pz); }
    }
    poreD = 2 * bestD;
    hs.micropore.pos.copy(best || new THREE.Vector3());
    probe.position.copy(hs.micropore.pos);
    probe.scale.setScalar(Math.max(bestD - 0.05, 0.05));
  }

  function placeMolecules(dt) {
    let i = 0;
    const m = new THREE.Matrix4(), s = new THREE.Vector3(), q = new THREE.Quaternion(), p = new THREE.Vector3();
    for (const mol of mols) {
      if (dt > 0) {
        mol.vel.x += gauss(rand) * 0.6 * dt; mol.vel.y += gauss(rand) * 0.6 * dt; mol.vel.z += gauss(rand) * 0.6 * dt;
        mol.vel.clampLength(0.1, 0.6);
        mol.pos.addScaledVector(mol.vel, dt);
        for (const ax of ['x', 'y', 'z']) {
          if (Math.abs(mol.pos[ax]) > HALF[ax]) { mol.pos[ax] = Math.sign(mol.pos[ax]) * HALF[ax]; mol.vel[ax] *= -1; }
        }
        q.setFromEuler(new THREE.Euler(mol.spin.x * dt, mol.spin.y * dt, mol.spin.z * dt));
        mol.q.multiply(q);
      }
      for (const [el, x, y, z] of MOLECULES[mol.kind]) {
        p.set(x, y, z).applyQuaternion(mol.q).add(mol.pos);
        s.setScalar(ELEMENT[el].r);
        atomMesh.setMatrixAt(i++, m.compose(p, q.identity(), s));
      }
    }
    atomMesh.instanceMatrix.needsUpdate = true;
    hs.gas.pos.copy(mols[0].pos);
  }

  rebuild(ctx.temp);
  placeMolecules(0);
  const level = {
    scene, camera,
    unit: 1e-9,
    method: 'Modell nach XRD und HRTEM',
    tone: 1,
    grain: 0.025,
    home: { pos: homePos, target: new THREE.Vector3(0, 0, 0) },
    orbit: { minDistance: 3, maxDistance: 26, enablePan: false, autoRotate: false },
    hotspots: [hs.sheet, hs.stack, hs.micropore, hs.gas],
    facts: () => [
      { value: `≈ ${fmt(model.ns.sheetNm, 1)} nm · ${fmt(model.ns.layers, 1)}`, label: 'mittlere Schichtgröße · Schichten je Stapel (Modell)' },
      { value: `${fmt(poreD, 1)} nm`, label: 'Durchmesser der markierten Mikropore' },
    ],
    update(dt) {
      uniforms.uFogStart.value = camera.position.length() - 2;
      placeMolecules(dt);
      return true;
    },
    setParam(name, value) {
      if (name !== 'temp') return;
      rebuild(value);
      level.dirty = true;
    },
    dispose() {
      geo.dispose(); lineMat.dispose(); fillMat.dispose();
      atomMesh.geometry.dispose(); atomMesh.material.dispose();
      probe.geometry.dispose(); probe.material.dispose();
    },
  };
  return level;
}
