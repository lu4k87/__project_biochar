// Ebene 1: ein Stück Buchen-Pflanzenkohle (Einheit cm). Prozedurale Texturen: Jahrringe, Strahlen, Gefäße, Schwundrisse.

import * as THREE from 'three';
import { mulberry32, fbm3, smoothstep, clamp, lerp } from '../util.js';
import { disposeGroup } from '../walls.js';

const W = 4.4, H = 2.4, D = 2.2;

// schnelles 2D-Wertrauschen auf einem Zufallsgitter
function noise2(rand) {
  const S = 256, g = new Float32Array(S * S);
  for (let i = 0; i < g.length; i++) g[i] = rand();
  return (x, y) => {
    const ix = Math.floor(x), iy = Math.floor(y);
    const fx = x - ix, fy = y - iy;
    const ux = fx * fx * (3 - 2 * fx), uy = fy * fy * (3 - 2 * fy);
    const a = g[(ix & 255) + (iy & 255) * S], b = g[((ix + 1) & 255) + (iy & 255) * S];
    const c = g[(ix & 255) + ((iy + 1) & 255) * S], d = g[((ix + 1) & 255) + ((iy + 1) & 255) * S];
    return a + (b - a) * ux + (c - a) * uy + (a - b - c + d) * ux * uy;
  };
}

function canvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return c;
}

// Riss als gezackte Linie; zeichnet in Farbe (schwarz) und Relief (R = 0)
function crackPath(points, widthAt, ...ctxs) {
  for (const [ctx, style] of ctxs) {
    ctx.fillStyle = style;
    for (let i = 1; i < points.length; i++) {
      const [x0, y0] = points[i - 1], [x1, y1] = points[i];
      const w = widthAt(i / points.length);
      const nx = -(y1 - y0), ny = x1 - x0, l = Math.hypot(nx, ny) || 1;
      ctx.beginPath();
      ctx.moveTo(x0 + nx / l * w, y0 + ny / l * w);
      ctx.lineTo(x1 + nx / l * w, y1 + ny / l * w);
      ctx.lineTo(x1 - nx / l * w, y1 - ny / l * w);
      ctx.lineTo(x0 - nx / l * w, y0 - ny / l * w);
      ctx.fill();
    }
  }
}

function endGrainTextures(rand) {
  const N = 1024;
  const n = noise2(rand);
  const col = canvas(N, N), rb = canvas(N, N);
  const cc = col.getContext('2d'), rc = rb.getContext('2d', { willReadFrequently: true });
  const img = cc.createImageData(N, N), rimg = rc.createImageData(N, N);
  const pith = [-0.6 * N, 1.4 * N];    // Mark liegt außerhalb des Stücks
  const ringW = 0.115 * N;
  const phaseAt = (x, y) => (((Math.hypot(x - pith[0], y - pith[1]) + 10 * n(x * 0.012, y * 0.012)) / ringW) % 1);
  for (let y = 0; y < N; y++) {
    for (let x = 0; x < N; x++) {
      const ph = phaseAt(x, y);
      const late = smoothstep(0.55, 0.96, ph);
      const grain = n(x * 0.45, y * 0.45);
      let v = 31 - 8 * late + 11 * (grain - 0.5);
      if (ph > 0.965) v -= 9;
      const i = (y * N + x) * 4;
      img.data[i] = v * 1.03; img.data[i + 1] = v; img.data[i + 2] = v * 0.97; img.data[i + 3] = 255;
      rimg.data[i] = 165 + 45 * late + 40 * (grain - 0.5);     // R: Relief
      rimg.data[i + 1] = 205 - 25 * late;                        // G: Rauheit (matt)
      rimg.data[i + 2] = 0; rimg.data[i + 3] = 255;
    }
  }
  cc.putImageData(img, 0, 0);
  rc.putImageData(rimg, 0, 0);

  // Holzstrahlen: radial vom Mark, wenige breite („Spiegel“) und viele schmale
  const ca = Math.atan2(0 - pith[1], 0 - pith[0]), cb = Math.atan2(N - pith[1], N - pith[0]);
  const aLo = Math.min(ca, cb), aHi = Math.max(ca, cb);
  for (let k = 0; k < 90; k++) {
    const broad = k % 14 === 0;
    const ang = lerp(aLo, aHi, rand()) + (rand() - 0.5) * 0.02;
    cc.strokeStyle = broad ? 'rgba(78,76,72,0.75)' : 'rgba(58,57,55,0.35)';
    rc.strokeStyle = broad ? 'rgba(235,150,0,0.9)' : 'rgba(215,180,0,0.5)';
    for (const ctx of [cc, rc]) {
      ctx.lineWidth = broad ? 2.2 + rand() * 1.2 : 0.7;
      ctx.beginPath();
      for (let r = 0.25 * N; r < 2.6 * N; r += 8) {
        const w = Math.sin(r * 0.02 + k) * 1.5;
        const x = pith[0] + Math.cos(ang) * r - Math.sin(ang) * w;
        const y = pith[1] + Math.sin(ang) * r + Math.cos(ang) * w;
        if (r === 0.25 * N) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
  }

  // Gefäße (zerstreutporig): feine dunkle Punkte, im Frühholz dichter
  for (let k = 0; k < 14000; k++) {
    const x = rand() * N, y = rand() * N;
    const late = smoothstep(0.55, 0.96, phaseAt(x, y));
    if (rand() < 0.6 * late) continue;
    const r = (0.6 + rand() * 0.9) * (1 - 0.4 * late);
    cc.fillStyle = 'rgba(4,4,4,0.85)';
    rc.fillStyle = 'rgba(80,215,0,1)';
    for (const ctx of [cc, rc]) { ctx.beginPath(); ctx.ellipse(x, y, r, r * 0.85, 0, 0, Math.PI * 2); ctx.fill(); }
  }

  // Schwundrisse: radial entlang der Strahlen + ein Ringriss
  const cracks = [];
  for (let k = 0; k < 4; k++) {
    const ang = lerp(aLo, aHi, 0.15 + 0.7 * rand());
    const r0 = Math.hypot(N * 0.5 - pith[0], N * 0.5 - pith[1]) + (rand() - 0.5) * 0.5 * N;
    const len = (0.18 + rand() * 0.3) * N;
    const pts = [];
    for (let r = r0; r < r0 + len; r += 5) {
      const j = (n(r * 0.05, k * 9.1) - 0.5) * 7;
      pts.push([pith[0] + Math.cos(ang) * r - Math.sin(ang) * j, pith[1] + Math.sin(ang) * r + Math.cos(ang) * j]);
    }
    crackPath(pts, (t) => (1 - t) * (2.5 + 2.5 * rand()) + 0.4, [cc, 'rgb(2,2,2)'], [rc, 'rgb(0,230,0)']);
    cracks.push(pts);
  }
  const ringR = Math.round((Math.hypot(N * 0.55 - pith[0], N * 0.45 - pith[1])) / ringW) * ringW - 1;
  const ringPts = [];
  for (let a = lerp(aLo, aHi, 0.12); a < lerp(aLo, aHi, 0.62); a += 0.002) {
    const r = ringR + (n(a * 40, 3.3) - 0.5) * 4;
    ringPts.push([pith[0] + Math.cos(a) * r, pith[1] + Math.sin(a) * r]);
  }
  crackPath(ringPts, (t) => 1.6 * Math.sin(Math.PI * t) + 0.3, [cc, 'rgb(3,3,3)'], [rc, 'rgb(0,230,0)']);
  return { col, rb, N };
}

function sideTextures(rand) {
  const NW = 2048, NH = 1024;
  const n = noise2(rand);
  const col = canvas(NW, NH), rb = canvas(NW, NH);
  const cc = col.getContext('2d'), rc = rb.getContext('2d', { willReadFrequently: true });
  const img = cc.createImageData(NW, NH), rimg = rc.createImageData(NW, NH);
  for (let y = 0; y < NH; y++) {
    for (let x = 0; x < NW; x++) {
      const streak = n(x * 0.0035, y * 0.23);          // Faserrichtung entlang u
      const fine = n(x * 0.05, y * 0.9);
      const v = 30 + 14 * (streak - 0.5) + 7 * (fine - 0.5);
      const i = (y * NW + x) * 4;
      img.data[i] = v * 1.02; img.data[i + 1] = v; img.data[i + 2] = v * 0.98; img.data[i + 3] = 255;
      rimg.data[i] = 175 + 50 * (streak - 0.5) + 25 * (fine - 0.5);
      rimg.data[i + 1] = 140 + 40 * (fine - 0.5);       // seidig, glatter als die Stirnfläche
      rimg.data[i + 2] = 0; rimg.data[i + 3] = 255;
    }
  }
  cc.putImageData(img, 0, 0);
  rc.putImageData(rimg, 0, 0);
  // Strahl-Spiegel: spindelförmige, glänzende Flecken längs der Faser
  for (let k = 0; k < 420; k++) {
    const x = rand() * NW, y = rand() * NH;
    const len = 18 + rand() * 60, w = 1.2 + rand() * 2.6;
    cc.fillStyle = 'rgba(70,68,64,0.55)';
    rc.fillStyle = 'rgba(205,70,0,0.8)';
    for (const ctx of [cc, rc]) { ctx.beginPath(); ctx.ellipse(x, y, len, w, 0, 0, Math.PI * 2); ctx.fill(); }
  }
  // Längsrisse
  for (let k = 0; k < 3; k++) {
    const y0 = (0.2 + 0.6 * rand()) * NH, x0 = rand() * 0.4 * NW, len = (0.35 + 0.45 * rand()) * NW;
    const pts = [];
    for (let x = x0; x < Math.min(NW - 4, x0 + len); x += 6) pts.push([x, y0 + (n(x * 0.02, k * 7) - 0.5) * 18]);
    crackPath(pts, (t) => (Math.sin(Math.PI * t) * (2 + 3 * rand())) + 0.4, [cc, 'rgb(2,2,2)'], [rc, 'rgb(0,230,0)']);
  }
  return { col, rb, N: NW, NH };
}

function sampler(canvasEl) {
  const w = canvasEl.width, h = canvasEl.height;
  const data = canvasEl.getContext('2d').getImageData(0, 0, w, h).data;
  return (u, v) => {
    const x = clamp(Math.round(u * (w - 1)), 0, w - 1);
    const y = clamp(Math.round((1 - v) * (h - 1)), 0, h - 1);
    return data[(y * w + x) * 4] / 255;
  };
}

function texture(c, srgb) {
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace;
  t.anisotropy = 8;
  return t;
}

export function create(ctx) {
  const rand = mulberry32(31337);
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0b0b0d);
  scene.environment = ctx.env;
  scene.environmentIntensity = 0.65;

  const end = endGrainTextures(rand);
  const sideA = sideTextures(rand);
  const sideB = sideTextures(rand);
  const heights = [sampler(end.rb), sampler(end.rb), sampler(sideA.rb), sampler(sideA.rb), sampler(sideB.rb), sampler(sideB.rb)];

  const geo = new THREE.BoxGeometry(W, H, D, 110, 60, 56);
  const pos = geo.attributes.position, nor = geo.attributes.normal, uv = geo.attributes.uv;
  const faceOf = new Int8Array(pos.count);
  const index = geo.index.array;
  geo.groups.forEach((g) => { for (let i = g.start; i < g.start + g.count; i++) faceOf[index[i]] = g.materialIndex; });

  // Abgeschlagene Kanten/Ecken und eine schräge Bruchfläche (Punkte auf Ebenen projizieren)
  const corners = [];
  for (const sx of [-1, 1]) for (const sy of [-1, 1]) for (const sz of [-1, 1]) corners.push([sx * W / 2, sy * H / 2, sz * D / 2]);
  const chips = [];
  const addChip = (n, depth) => {
    const l = Math.hypot(...n);
    const nn = n.map((v) => v / l);
    const c = Math.max(...corners.map((p) => p[0] * nn[0] + p[1] * nn[1] + p[2] * nn[2])) - depth;
    chips.push({ n: nn, c });
  };
  for (let k = 0; k < 4; k++) addChip([(rand() - 0.5) * 0.3, (k & 1 ? 1 : -1) * (0.6 + rand() * 0.6), (k & 2 ? 1 : -1) * (0.6 + rand() * 0.6)], 0.1 + rand() * 0.28);
  for (let k = 0; k < 7; k++) {
    const c = corners[Math.floor(rand() * 8)];
    addChip([c[0] * (0.4 + rand()), c[1] * (0.6 + rand()), c[2] * (0.6 + rand())], 0.25 + rand() * 0.4);
  }
  addChip([-1, (rand() - 0.5) * 0.7, (rand() - 0.5) * 0.9], 0.45);   // Bruchende links

  const p = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) {
    p.fromBufferAttribute(pos, i);
    const n = [nor.getX(i), nor.getY(i), nor.getZ(i)];
    for (const ch of chips) {
      const d = p.x * ch.n[0] + p.y * ch.n[1] + p.z * ch.n[2] - ch.c;
      if (d > 0) p.set(p.x - ch.n[0] * d, p.y - ch.n[1] * d, p.z - ch.n[2] * d);
    }
    const u = uv.getX(i), v = uv.getY(i), f = faceOf[i];
    const h = heights[f](u, v);
    const crack = clamp((0.22 - h) / 0.22, 0, 1) * smoothstep(0, 0.05, Math.min(u, 1 - u, v, 1 - v));
    const bump = fbm3(p.x * 1.4 + 3, p.y * 1.4, p.z * 1.4, 3) - 0.5;
    const k = -crack * 0.13 + bump * (f < 2 ? 0.05 : 0.09);
    p.set(p.x + n[0] * k, p.y + n[1] * k, p.z + n[2] * k);
    pos.setXYZ(i, p.x, p.y, p.z);
  }
  geo.computeVertexNormals();
  geo.computeBoundingBox();

  const matEnd = new THREE.MeshStandardMaterial({
    map: texture(end.col, true), bumpMap: texture(end.rb, false), bumpScale: 2.2,
    roughnessMap: texture(end.rb, false), roughness: 1, metalness: 0.08,
  });
  const sideMat = (t) => new THREE.MeshStandardMaterial({
    map: texture(t.col, true), bumpMap: texture(t.rb, false), bumpScale: 1.6,
    roughnessMap: texture(t.rb, false), roughness: 1, metalness: 0.22,
  });
  const matA = sideMat(sideA), matB = sideMat(sideB);
  const mats = [matEnd, matA, matB];
  const piece = new THREE.Mesh(geo, [matEnd, matEnd, matA, matA, matB, matB]);
  scene.add(piece);

  // Krümel und Kontaktschatten
  const floorY = geo.boundingBox.min.y;
  for (let k = 0; k < 6; k++) {
    const g = new THREE.IcosahedronGeometry(1, 2);
    const gp = g.attributes.position;
    for (let i = 0; i < gp.count; i++) {
      p.fromBufferAttribute(gp, i);
      p.multiplyScalar(0.75 + 0.5 * fbm3(p.x * 1.5 + k * 5, p.y * 1.5, p.z * 1.5, 2));
      p.y *= 0.6;
      gp.setXYZ(i, p.x, p.y, p.z);
    }
    g.computeVertexNormals();
    const s = 0.06 + rand() * 0.13;
    const crumb = new THREE.Mesh(g, k % 2 ? matA : matB);
    const ang = rand() * Math.PI * 2, r = 2.6 + rand() * 1.4;
    crumb.position.set(Math.cos(ang) * r, floorY + s * 0.5, Math.sin(ang) * r * 0.8);
    crumb.rotation.set(rand() * 3, rand() * 3, rand() * 3);
    crumb.scale.setScalar(s);
    scene.add(crumb);
  }
  const sc = canvas(256, 256), sx = sc.getContext('2d');
  const grad = sx.createRadialGradient(128, 128, 10, 128, 128, 128);
  grad.addColorStop(0, 'rgba(0,0,0,0.85)');
  grad.addColorStop(0.55, 'rgba(0,0,0,0.35)');
  grad.addColorStop(1, 'rgba(0,0,0,0)');
  sx.fillStyle = grad;
  sx.fillRect(0, 0, 256, 256);
  const shadow = new THREE.Mesh(new THREE.PlaneGeometry(W * 1.7, D * 2.1),
    new THREE.MeshBasicMaterial({ map: texture(sc, true), transparent: true, depthWrite: false }));
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = floorY - 0.005;
  scene.add(shadow);
  const floor = new THREE.Mesh(new THREE.CircleGeometry(30, 64), new THREE.MeshStandardMaterial({ color: 0x0d0d0f, roughness: 0.92 }));
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = floorY - 0.01;
  scene.add(floor);

  const key = new THREE.DirectionalLight(0xfff0dc, 2.7);
  key.position.set(5, 7, 6);
  const rim = new THREE.DirectionalLight(0xc4d6ff, 2.6);
  rim.position.set(-7, 3, -6);
  const fill = new THREE.HemisphereLight(0x8090a0, 0x050505, 0.35);
  scene.add(key, rim, fill);

  // Hotspots aus der verformten Geometrie
  const pick = (face, test) => {
    let best = null, bestScore = Infinity;
    for (let i = 0; i < pos.count; i++) {
      if (faceOf[i] !== face) continue;
      const s = test(i);
      if (s < bestScore) { bestScore = s; best = i; }
    }
    return new THREE.Vector3().fromBufferAttribute(pos, best);
  };
  const endPos = pick(0, (i) => Math.hypot(pos.getY(i) - 0.15, pos.getZ(i) - 0.1));
  const crackPos = pick(4, (i) => {
    const u = uv.getX(i), v = uv.getY(i);
    if (u < 0.3 || u > 0.85 || v < 0.2 || v > 0.8) return Infinity;
    return heights[4](u, v) + Math.abs(u - 0.6) * 0.2;
  });
  const sheenPos = pick(2, (i) => Math.hypot(pos.getX(i) + 0.6, pos.getZ(i) - 0.25));

  const camera = new THREE.PerspectiveCamera(32, ctx.aspect, 0.05, 200);
  const level = {
    scene, camera,
    unit: 0.01,
    method: 'Makroaufnahme · Modell',
    tone: 1,
    grain: 0.018,
    home: { pos: new THREE.Vector3(7.6, 3.1, 5.4), target: new THREE.Vector3(0.5, -0.15, 0) },
    orbit: { minDistance: 3.2, maxDistance: 16, maxPolarAngle: 1.5, enablePan: false, autoRotate: true },
    hotspots: [
      { id: 'endgrain', kind: 'dive', pos: endPos.add(new THREE.Vector3(0.03, 0, 0)), normal: new THREE.Vector3(1, 0, 0) },
      { id: 'cracks', kind: 'info', pos: crackPos.add(new THREE.Vector3(0, 0, 0.04)), normal: new THREE.Vector3(0, 0, 1) },
      { id: 'sheen', kind: 'info', pos: sheenPos.add(new THREE.Vector3(0, 0.04, 0)), normal: new THREE.Vector3(0, 1, 0) },
    ],
    setParam(name, value) {
      if (name !== 'temp') return;
      // niedrig verkohlt: bräunlich und matt · hoch verkohlt: neutral schwarz, seidig glänzend
      const k = clamp((value - 350) / 450, 0, 1);
      const brown = clamp((450 - value) / 100, 0, 1);   // ab ≈ 450 °C tiefschwarz
      const tint = new THREE.Color(lerp(0.72, 1.9, brown), lerp(0.72, 1.3, brown), lerp(0.74, 0.95, brown));
      for (const m of mats) {
        m.color.copy(tint);
        m.metalness = m === matEnd ? lerp(0.02, 0.1, k) : lerp(0.04, 0.3, k);
        m.roughness = lerp(1.15, 0.85, k);
      }
      level.dirty = true;
    },
    dispose() { disposeGroup(scene); },
  };
  level.setParam('temp', ctx.temp);
  return level;
}
