// Bedienoberfläche über der 3D-Szene: Skalen-Leiter, Infotafel, Hotspots, REM-Datenleiste, Regler.

import { LEVELS, SOURCES } from './content.js';
import { properties, fmt, T_MIN, T_MAX } from './science.js';

const $ = (sel) => document.querySelector(sel);
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

export function createHud(handlers) {
  const ladder = $('#ladder');
  const panel = $('#panel-body');
  const layer = $('#hotspots');
  const meter = $('#edge-meter');
  let markers = [];
  let current = -1;
  let level = null;
  let selected = null;

  ladder.innerHTML = LEVELS.map((l, i) => `
    <li><button type="button" data-level="${i}" aria-label="Ebene ${i + 1}: ${esc(l.title)}, ${esc(l.scale)}">
      <span class="lad-scale">${esc(l.scale)}</span><span class="lad-name">${esc(l.name)}</span>
    </button></li>`).join('');
  ladder.addEventListener('click', (e) => {
    const b = e.target.closest('button[data-level]');
    if (b) handlers.onJump(+b.dataset.level);
  });
  $('#btn-up').addEventListener('click', () => handlers.onUp());
  $('#btn-down').addEventListener('click', () => handlers.onDown());
  $('#btn-panel').addEventListener('click', () => {
    const open = document.body.classList.toggle('panel-collapsed');
    $('#btn-panel').setAttribute('aria-expanded', String(!open));
  });

  function facts(list) {
    return `<div class="facts">${list.map((f) => `
      <div class="fact"><span class="fact-value">${esc(f.value)}</span><span class="fact-label">${esc(f.label)}</span></div>`).join('')}</div>`;
  }

  function labTable(t) {
    const p = properties(t);
    const row = (k, v, warn = false) => `<tr${warn ? ' class="warn"' : ''}><th scope="row">${k}</th><td>${v}</td></tr>`;
    return `
      <table class="lab">
        ${row('Masseausbeute', `${fmt(p.yield)} %`)}
        ${row('Kohlenstoffgehalt', `${fmt(p.carbon)} %`)}
        ${row('H/Corg (EBC < 0,7)', `${fmt(p.hc, 2)} ${p.hc < 0.7 ? '✓' : '⚠ über Grenzwert'}`, p.hc >= 0.7)}
        ${row('O/Corg (EBC < 0,4)', `${fmt(p.oc, 2)} ✓`)}
        ${row('BET-Oberfläche', `≈ ${fmt(p.bet)} m²/g`)}
        ${row('pH-Wert', fmt(p.ph, 1))}
        ${row('nach 100 Jahren im Boden (IPCC)', `${fmt(p.fperm * 100)} % des C`)}
        ${row('dauerhaft gebundenes CO₂', `${fmt(p.co2, 1)} t je t Biochar`)}
        ${row('Strukturtyp (Keiluweit 2010)', p.charClass)}
      </table>
      <p class="note">Richtwerte für Holz, langsame Pyrolyse – reale Kohlen streuen je Rohstoff und Verfahren. CO₂ = C-Gehalt × IPCC-Faktor × 44/12.</p>`;
  }

  function render(state) {
    const l = LEVELS[current];
    const dyn = level && level.facts ? level.facts() : [];
    const hsList = level ? level.hotspots : [];
    const refs = l.refs.map((r) => `<a href="#quelle-${r}">[${r}]</a>`).join(' ');
    let detail = '';
    if (selected) {
      const h = l.hotspots[selected.id];
      detail = `
        <section class="detail" aria-live="polite">
          <h2>${esc(h.title)}</h2>
          <p>${esc(h.text)}</p>
          ${selected.kind === 'dive' ? '<button type="button" class="btn-primary" id="btn-dive">Hineinzoomen</button>' : ''}
        </section>`;
    }
    panel.innerHTML = `
      <p class="eyebrow">Ebene ${current + 1} von ${LEVELS.length} · Größenordnung ${esc(l.scale)}</p>
      <h1>${esc(l.title)}</h1>
      <p class="lead">${esc(l.lead)}</p>
      ${detail}
      <section>
        <h2 class="sub">Entdecken</h2>
        <ul class="explore">${hsList.map((h) => `
          <li><button type="button" data-hs="${h.id}" class="${h.kind === 'dive' ? 'is-dive' : ''}${selected && selected.id === h.id ? ' is-active' : ''}">
            <span class="dot" aria-hidden="true"></span>${esc(l.hotspots[h.id].title)}${h.kind === 'dive' ? ' <span class="tag">tiefer</span>' : ''}
          </button></li>`).join('')}
        </ul>
      </section>
      ${facts([...l.facts, ...dyn])}
      <section class="controls">
        <h2 class="sub">Pyrolyse-Labor</h2>
        <label class="slider">
          <span>Pyrolysetemperatur <output id="out-temp">${fmt(state.temp)} °C</output></span>
          <input id="in-temp" type="range" min="${T_MIN}" max="${T_MAX}" step="10" value="${state.temp}">
        </label>
        ${l.id === 'meso' ? `
        <label class="slider">
          <span>Relative Luftfeuchte <output id="out-rh">${fmt(state.rh * 100)} %</output></span>
          <input id="in-rh" type="range" min="0" max="0.99" step="0.01" value="${state.rh}">
        </label>` : ''}
        <div id="lab">${labTable(state.temp)}</div>
      </section>
      <section class="sources">
        <h2 class="sub">Quellen dieser Ebene ${refs}</h2>
        <details>
          <summary>Alle Quellen</summary>
          <ol>${SOURCES.map((s) => `<li id="quelle-${s.id}"><a href="${s.url}" target="_blank" rel="noopener">${esc(s.text)}</a></li>`).join('')}</ol>
        </details>
      </section>`;

    panel.querySelectorAll('button[data-hs]').forEach((b) => b.addEventListener('click', () => handlers.onHotspot(b.dataset.hs)));
    const dive = panel.querySelector('#btn-dive');
    if (dive) dive.addEventListener('click', () => handlers.onDive(selected.id));
    const temp = panel.querySelector('#in-temp');
    temp.addEventListener('input', () => {
      panel.querySelector('#out-temp').textContent = `${fmt(+temp.value)} °C`;
      panel.querySelector('#lab').innerHTML = labTable(+temp.value);
      handlers.onTemp(+temp.value);
    });
    temp.addEventListener('change', () => refreshFacts());
    const rh = panel.querySelector('#in-rh');
    if (rh) {
      rh.addEventListener('input', () => {
        panel.querySelector('#out-rh').textContent = `${fmt(+rh.value * 100)} %`;
        handlers.onRh(+rh.value);
      });
      rh.addEventListener('change', () => refreshFacts());
    }
  }

  let lastState = null;
  function refreshFacts() {
    if (!lastState || !level) return;
    const box = panel.querySelector('.facts');
    const l = LEVELS[current];
    if (box) box.outerHTML = facts([...l.facts, ...(level.facts ? level.facts() : [])]);
  }

  function buildMarkers() {
    const l = LEVELS[current];
    layer.innerHTML = '';
    markers = level.hotspots.map((h) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = `hs ${h.kind === 'dive' ? 'hs--dive' : 'hs--info'}`;
      b.innerHTML = `<span class="hs-ring" aria-hidden="true"></span><span class="hs-label">${esc(l.hotspots[h.id].title)}</span>`;
      b.setAttribute('aria-label', `${l.hotspots[h.id].title}${h.kind === 'dive' ? ' – hineinzoomen' : ''}`);
      b.addEventListener('click', () => handlers.onHotspot(h.id, true));
      layer.appendChild(b);
      return { h, el: b };
    });
  }

  return {
    setLevel(index, lv, state) {
      current = index;
      level = lv;
      selected = null;
      lastState = state;
      ladder.querySelectorAll('button').forEach((b, i) => {
        b.classList.toggle('is-current', i === index);
        if (i === index) b.setAttribute('aria-current', 'step'); else b.removeAttribute('aria-current');
      });
      $('#btn-up').disabled = index === 0;
      $('#btn-down').disabled = !lv.hotspots.some((h) => h.kind === 'dive');
      $('#sb-method').textContent = lv.method;
      render(state);
      buildMarkers();
    },
    select(id, state) {
      selected = level.hotspots.find((h) => h.id === id) || null;
      lastState = state;
      render(state);
      markers.forEach((m) => m.el.classList.toggle('is-active', selected && m.h.id === id));
      const d = panel.querySelector('.detail');
      if (d) d.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    },
    refreshFacts,
    hideMarkers(hidden) {
      layer.classList.toggle('is-hidden', hidden);
    },
    updateMarkers(camera, width, height) {
      const v = camera.position.clone();
      const panel = document.getElementById('panel').getBoundingClientRect();
      const flipAt = (panel.width > 0 && panel.left > width * 0.5 ? panel.left : width) - 240;
      for (const { h, el } of markers) {
        const p = h.pos.clone().project(camera);
        let visible = p.z < 1 && Math.abs(p.x) < 1.05 && Math.abs(p.y) < 1.05;
        if (visible && h.normal) visible = h.normal.dot(v.clone().sub(h.pos)) > 0;
        el.classList.toggle('is-off', !visible);
        if (!visible) continue;
        const x = ((p.x + 1) / 2) * width;
        el.style.transform = `translate(${x}px, ${((1 - p.y) / 2) * height}px)`;
        el.classList.toggle('is-left', x > flipAt);
      }
    },
    updateScale(hfwMeters, widthPx) {
      // runde Balkenlänge 1/2/5 × 10^n, etwa ein Fünftel der Bildbreite
      const target = hfwMeters * 0.2;
      const pow = Math.pow(10, Math.floor(Math.log10(target)));
      const nice = [1, 2, 5, 10].map((k) => k * pow).reduce((a, b) => (Math.abs(b - target) < Math.abs(a - target) ? b : a));
      $('#scalebar-bar').style.width = `${Math.round((nice / hfwMeters) * widthPx)}px`;
      $('#scalebar-label').textContent = formatLength(nice);
      $('#sb-hfw').textContent = formatLength(hfwMeters, true);
      const mag = 0.127 / hfwMeters;   // Vergrößerung bezogen auf 127 mm Bildbreite (REM-Konvention)
      $('#sb-mag').textContent = mag < 1e5 ? `${fmt(mag, mag < 10 ? 1 : 0)} ×` : `${fmt(mag / 1e6, 1)} Mio. ×`;
    },
    setEdgeMeter(dir, amount) {
      meter.classList.toggle('is-on', amount > 0.02);
      meter.dataset.dir = dir;
      meter.style.setProperty('--amount', amount.toFixed(3));
      meter.querySelector('span').textContent = dir === 'down' ? 'Weiter scrollen: eine Ebene tiefer' : 'Weiter scrollen: eine Ebene zurück';
    },
    setLoading(on) {
      document.body.classList.toggle('is-loading', on);
    },
  };
}

function formatLength(m, approx = false) {
  const units = [[1e-2, 'cm'], [1e-3, 'mm'], [1e-6, 'µm'], [1e-9, 'nm']];
  for (const [u, name] of units) {
    if (m >= u * 0.999) {
      const v = m / u;
      return `${approx ? '≈ ' : ''}${fmt(v, v < 10 && approx ? 1 : 0)} ${name}`;
    }
  }
  return `${approx ? '≈ ' : ''}${fmt(m / 1e-9, 1)} nm`;
}
