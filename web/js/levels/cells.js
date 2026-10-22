// Ebene 3: dieselben Zellen als 3D-Bruchstück (Einheit µm): Stirnfläche als Wabe, seitlich längs aufgebrochene Röhren.

import * as THREE from 'three';
import { woodTissue } from '../wood.js';
import { buildWalls, disposeGroup } from '../walls.js';
import { mulberry32, fbm3 } from '../util.js';

const LZ = 340;

export function create(ctx) {
  const wood = woodTissue();
  const rand = mulberry32(777);
  const v = wood.dive;
  const XC = v.x + v.r * 0.3;                // Bruchebene öffnet das Einstiegsgefäß der Länge nach
  const cx = v.x - 75, cy = v.y;
  const inside = (x, y) => {
    const ang = Math.atan2(y - cy, x - cx);
    const rr = Math.hypot((x - cx) / 160, (y - cy) / 118);
    return rr < 1 - 0.14 * fbm3(Math.cos(ang) * 2 + 9, Math.sin(ang) * 2 + 9, 0.3, 3);
  };

  const walls = [];
  for (const e of wood.edges) {
    let a = e.a, b = e.b, openEnd = false;
    if (a[0] > XC && b[0] > XC) continue;
    if (a[0] > XC) [a, b] = [b, a];
    if (b[0] > XC) {
      const t = (XC - a[0]) / (b[0] - a[0]);
      b = [XC, a[1] + (b[1] - a[1]) * t];
      openEnd = true;
    }
    const mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2;
    if (!inside(mx, my) || Math.hypot(b[0] - a[0], b[1] - a[1]) < 0.3) continue;
    let z1 = -2.5 * fbm3(mx * 0.03, my * 0.03, 2.5, 3) - rand() * 0.6;
    // Faserbruch: nahe der Bruchkante enden viele Wände früher → gestufte Kante wie im REM-Bild
    if (mx > XC - 45 && rand() < 0.45) z1 = -(15 + rand() * 170);
    else if (rand() < 0.03) z1 -= 5 + rand() * 30;
    const z0 = -LZ - rand() * 40;
    walls.push({ a, b, t: e.t, kind: e.kind, seed: e.seed, late: e.late, z0, z1, openEnd });
  }

  const scene = new THREE.Scene();
  scene.add(buildWalls(walls, { openZ: 0, openX: XC, depth: 26, base: 0.38, edge: 0.55, edgeW: 0.45, noise: 0.9 }));

  // Hotspots: Gefäßwand an der Bruchkante, ein ganzes Gefäß, Faser, Strahl, offener Kanal
  const pitWall = walls
    .filter((w) => w.kind === 1 && Math.abs(w.b[1] - w.a[1]) > 1.4 * Math.abs(w.b[0] - w.a[0]) && w.z1 > -20)
    .map((w) => ({ w, d: Math.hypot((w.a[0] + w.b[0]) / 2 - v.x, (w.a[1] + w.b[1]) / 2 - v.y) }))
    .sort((p, q) => p.d - q.d)[0]?.w;
  const pitPos = pitWall
    ? new THREE.Vector3((pitWall.a[0] + pitWall.b[0]) / 2 + pitWall.t / 2 + 0.4, (pitWall.a[1] + pitWall.b[1]) / 2, -120)
    : new THREE.Vector3(v.x, v.y, -120);
  const nearest = (type, tx, ty) => {
    let best = null, bd = Infinity;
    for (const s of wood.sites) {
      if (s.type !== type || s.x > XC - 15 || !inside(s.x, s.y)) continue;
      const d = Math.hypot(s.x - tx, s.y - ty);
      if (d < bd) { bd = d; best = s; }
    }
    return best;
  };
  const vessel = nearest(1, cx - 40, cy - 40) || v;
  const fiber = nearest(0, cx - 30, cy + 70);
  const ray = nearest(2, cx - 60, cy);
  const hotspots = [
    { id: 'pitwall', kind: 'dive', pos: pitPos, normal: new THREE.Vector3(1, 0, 0) },
    { id: 'vessel', kind: 'info', pos: new THREE.Vector3(vessel.x, vessel.y, 0), normal: new THREE.Vector3(0, 0, 1) },
    { id: 'habitat', kind: 'info', pos: new THREE.Vector3(XC, v.y + 4, -250), normal: new THREE.Vector3(1, 0, 0) },
  ];
  if (fiber) hotspots.push({ id: 'fiber', kind: 'info', pos: new THREE.Vector3(fiber.x, fiber.y, 0), normal: new THREE.Vector3(0, 0, 1) });
  if (ray && Math.hypot(ray.x - cx, ray.y - cy) < 150) hotspots.push({ id: 'ray', kind: 'info', pos: new THREE.Vector3(ray.x, ray.y, 0), normal: new THREE.Vector3(0, 0, 1) });

  const camera = new THREE.PerspectiveCamera(35, ctx.aspect, 1, 4000);
  return {
    scene, camera,
    unit: 1e-6,
    method: 'REM · Sekundärelektronen (Modell)',
    tone: 0,
    grain: 0.07,
    home: { pos: new THREE.Vector3(v.x + 235, v.y + 100, 215), target: new THREE.Vector3(v.x - 30, v.y + 5, -95) },
    orbit: { minDistance: 60, maxDistance: 800, minPolarAngle: 0.2, maxPolarAngle: 2.9, enablePan: true },
    hotspots,
    dispose() { disposeGroup(scene); },
  };
}
