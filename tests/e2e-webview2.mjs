// E2E de la app nativa (WebView2) con carpeta de datos y copia de archivos temporales: no toca tus datos ni tu instalación.
// Requiere RobRunPlanner.exe compilado en la raíz. Ejecutar: node tests/e2e-webview2.mjs
import { spawn } from 'node:child_process';
import { mkdtempSync, rmSync, existsSync, copyFileSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';
import { connect, sleep } from './cdp.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
if (!existsSync(join(root, 'RobRunPlanner.exe'))) { console.log('SKIP: falta RobRunPlanner.exe'); process.exit(0); }
const dir = mkdtempSync(join(tmpdir(), 'rr-wv2-'));
for (const f of ['RobRunPlanner.exe', 'ruta-escalado.html', 'core.js', 'catalogo.js', 'rutas-incluidas.js']) copyFileSync(join(root, f), join(dir, f));
const log = join(dir, 'avisos.log'), port = 9242;
const proc = spawn(join(dir, 'RobRunPlanner.exe'), [], { env: { ...process.env, ROBRUN_DATA_DIR: join(dir, 'data'), ROBRUN_TEST_LOG: log,
  WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS: `--remote-debugging-port=${port}` }, stdio: 'ignore' });

const results = [];
async function step(name, fn) {
  try { await fn(); results.push('✔ ' + name); } catch (e) { results.push('✖ ' + name + '\n    ' + String(e.stack || e).split('\n').slice(0, 3).join('\n    ')); process.exitCode = 1; }
  console.log(results.at(-1));
}
try {
  const c = await connect(port, { match: p => p.url.includes('robrun.app'), timeout: 30000 });
  await sleep(1500);
  const ev = c.evaluate;
  await step('carga en WebView2 con el puente nativo y la ruta incluida', async () => {
    assert.equal(await ev('!!window.chrome?.webview'), true);
    assert.equal(await ev(`document.querySelector('#notify').hidden || (RRApp.showTab('granja'), document.querySelector('#notify').hidden)`), true);
    assert.ok(await ev(`RRApp.S.routes.some(r => r.origin?.id === 'dos-granjas')`));
    assert.deepEqual(await ev('RR.checkInvariants(RRApp.S)'), []);
  });
  await step('el aviso nativo salta aunque la página no avise (host lleva los temporizadores)', async () => {
    await ev(`RRApp.commit(st => { const t = RR.ops.addStation(st, 'chem'); t.name = 'PRUEBA'; RR.ops.setStation(st, t.id, 'freeze', 0); RR.ops.startStation(st, t.id, Date.now() - 3600e3); }, { allowErrors: true }); true`);
    await sleep(3000);
    assert.ok(existsSync(log), 'no se escribió el registro de avisos');
    assert.match(readFileSync(log, 'utf8'), /PRUEBA: lote listo/);
  });
  await step('localStorage persiste en la carpeta de datos indicada', async () => {
    await ev('location.reload(); true'); await sleep(2500);
    assert.ok(await ev(`RRApp.S.farm.tables.some(t => t.name === 'PRUEBA')`));
  });
  await step('sin errores de JavaScript', async () => assert.deepEqual(c.errors, []));
  c.close();
} finally {
  proc.kill(); await sleep(1500);
  try { rmSync(dir, { recursive: true, force: true }); } catch {}
}
console.log(`\nE2E WebView2: ${results.filter(r => r.startsWith('✔')).length}/${results.length} OK`);
