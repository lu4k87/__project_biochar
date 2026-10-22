// Ebene 2: Querschnitt des Holzgewebes (Einheit µm), REM-Ansicht eines Bruchstücks.

import * as THREE from 'three';
import { woodTissue, ringY } from '../wood.js';
import { buildWalls, disposeGroup } from '../walls.js';
import { mulberry32, fbm3 } from '../util.js';
import { fmt } from '../science.js';

const DEPTH = 160;

export function create(ctx) {
  const wood = woodTissue();
  const rand = mulberry32(4242);
  const inside = (x, y) => {
    const ang = Math.atan2(y, x);
    const rr = Math.pow(Math.pow(Math.abs(x) / 440, 4) + Math.pow(Math.abs(y) / 296, 4), 0.25);
    return rr < 0.98 - 0.09 * fbm3(Math.cos(ang) * 2.2 + 5, Math.sin(ang) * 2.2 + 5, 0.5, 3);
  };
  const walls = [];
  for (const e of wood.edges) {
    const mx = (e.a[0] + e.b[0]) / 2, my = (e.a[1] + e.b[1]) / 2;
    if (!inside(mx, my)) continue;
    // leicht unebene Bruchfläche, vereinzelt abgebrochene Wände
    let z1 = -4 * fbm3(mx * 0.006, my * 0.006, 1.5, 3) - rand() * 0.5;
    if (rand() < 0.015) z1 -= 6 + rand() * 25;
    walls.push({ a: e.a, b: e.b, t: e.t, kind: e.kind, seed: e.seed, late: e.late, z0: -DEPTH, z1 });
  }

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x000000);
  scene.add(buildWalls(walls, { openZ: 0, depth: 34, base: 0.36, edge: 0.5, edgeW: 1.1, noise: 0.45, pits: false }));

  const camera = new THREE.PerspectiveCamera(35, ctx.aspect, 1, 6000);
  const dv = wood.dive;
  const porosity = wood.porosity(-400, -270, 400, 270);
  return {
    scene, camera,
    unit: 1e-6,
    method: 'REM · Sekundärelektronen (Modell)',
    tone: 0,
    grain: 0.065,
    home: { pos: new THREE.Vector3(40, -120, 760), target: new THREE.Vector3(0, 0, -20) },
    orbit: { minDistance: 220, maxDistance: 1250, minAzimuthAngle: -0.75, maxAzimuthAngle: 0.75, minPolarAngle: 0.95, maxPolarAngle: 2.2, enablePan: true },
    hotspots: [
      { id: 'vessels', kind: 'dive', pos: new THREE.Vector3(dv.x, dv.y, 0), normal: new THREE.Vector3(0, 0, 1) },
      { id: 'ring', kind: 'info', pos: new THREE.Vector3(-270, ringY(-270), 0), normal: new THREE.Vector3(0, 0, 1) },
      { id: 'ray', kind: 'info', pos: new THREE.Vector3(wood.rayX(wood.broad, -160), -160, 0), normal: new THREE.Vector3(0, 0, 1) },
      { id: 'porosity', kind: 'info', pos: new THREE.Vector3(300, -150, 0), normal: new THREE.Vector3(0, 0, 1) },
    ],
    facts: () => [{ value: `${fmt(porosity * 100)} %`, label: 'Porenanteil dieses Modells (Zelllumen / Fläche)' }],
    dispose() { disposeGroup(scene); },
  };
}
