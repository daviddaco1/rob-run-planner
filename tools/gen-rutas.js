// Regenera rutas-incluidas.js desde los JSON de rutas incluidas. Uso: npm run rutas
const fs = require('node:fs'), path = require('node:path');
const root = path.join(__dirname, '..');
const FILES = ['ruta-2-granjas.json', 'ruta-reempaquetado.json', 'ruta-taller-quimico.json'];
const rutas = FILES.map(f => JSON.parse(fs.readFileSync(path.join(root, f), 'utf8')));
fs.writeFileSync(path.join(root, 'rutas-incluidas.js'),
  '// Generado por tools/gen-rutas.js (no editar a mano). La app añade cada ruta una vez por id y avisa si sube la versión.\n' +
  'window.RUTAS = ' + JSON.stringify(rutas, null, 2) + ';\n');
console.log('rutas-incluidas.js:', rutas.map(r => `${r.id} v${r.version}`).join(', '));
