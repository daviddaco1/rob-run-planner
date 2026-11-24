// Carga catálogo + núcleo igual que el navegador (globalThis) y utilidades de pruebas sin dependencias.
const path = require('path');
require(path.join(__dirname, '..', 'catalogo.js'));
const RR = require(path.join(__dirname, '..', 'core.js'));
const fs = require('fs');

// PRNG con semilla (mulberry32) para que los tests aleatorios sean reproducibles.
function rng(seed) {
  let a = seed >>> 0;
  const next = () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  const r = { next, int: (lo, hi) => lo + Math.floor(next() * (hi - lo + 1)), pick: list => list[Math.floor(next() * list.length)], bool: () => next() < 0.5 };
  return r;
}
// Valor JSON arbitrario (para fuzzing): mezcla tipos válidos e inválidos.
function junk(r, depth = 0) {
  const k = r.int(0, depth > 3 ? 6 : 9);
  switch (k) {
    case 0: return null;
    case 1: return r.bool();
    case 2: return r.pick([0, -1, 1e308, -0, 3.5, 1e21, NaN, Infinity].map(x => Number.isFinite(x) ? x : 0));
    case 3: return r.pick(['', 'Early', 'Late', 'Plantas', 'Dinero', 'g', 'o', 'x'.repeat(r.int(0, 600)), '<img src=x onerror=alert(1)>', '__proto__', 'constructor']);
    case 4: return r.int(-1e6, 1e9);
    case 5: return String(r.int(-5, 500));
    case 6: return r.pick(['land_title_1', 'grow_table', 'uv_lamp', 'no_existe']);
    case 7: { const a = []; for (let i = r.int(0, 5); i > 0; i--) a.push(junk(r, depth + 1)); return a; }
    default: {
      const o = {};
      const keys = ['id', 'name', 'goal', 'steps', 'routes', 'phase', 'type', 'text', 'target', 'progress', 'done', 'subs', 'q', 'down', 'item', 'requires',
        'farm', 'tables', 'kind', 'g', 'p', 'o', 'start', 'end', 'upg', 'box', 'base', 'sell', 'cost', 'reactor', 'crystals', 'schema', 'cur', 'included', 'added', 'draft', 'have', 'log'];
      for (let i = r.int(0, 8); i > 0; i--) o[r.pick(keys)] = junk(r, depth + 1);
      return o;
    }
  }
}
// Ruta aleatoria "casi válida": estructura correcta con valores aleatorios y dependencias al azar.
function randomRoute(r) {
  const n = r.int(0, 12), ids = Array.from({ length: n }, (_, i) => 's' + i);
  const items = Object.keys(RR_CATALOG.items);
  return {
    name: 'R' + r.int(0, 999), goal: 'g',
    steps: ids.map(id => ({
      id, phase: r.pick(RR.PHASES), type: r.pick(RR.TYPES), text: 'paso ' + id, target: r.pick([0, r.int(0, 1e6)]), progress: r.pick([0, r.int(0, 1e6)]),
      done: r.bool(), q: r.pick(['g', 'p', 'o']), down: r.bool(), item: r.next() < 0.3 ? r.pick(items) : '',
      requires: r.next() < 0.4 ? [r.pick(ids)] : [], subs: r.next() < 0.5 ? ['a', { text: 'b', done: r.bool() }] : [],
    })),
  };
}
const readJSON = f => JSON.parse(fs.readFileSync(path.join(__dirname, '..', f), 'utf8'));
module.exports = { RR, rng, junk, randomRoute, readJSON };
