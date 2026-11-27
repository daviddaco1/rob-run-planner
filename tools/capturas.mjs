// Capturas de la interfaz en varias resoluciones y escalados (Edge headless, perfil temporal: no toca tus datos).
// Uso: node tools/capturas.mjs <carpeta-salida> [rapido]
// Carga ruta-escalado.html por file://, siembra una granja, escenarios y raideos de ejemplo y guarda un PNG por pestaña y tamaño.
import { spawn } from 'node:child_process';
import { mkdtempSync, rmSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { connect, sleep } from '../tests/cdp.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const out = resolve(process.argv[2] || join(root, 'capturas'));
const quick = process.argv[3] === 'rapido';
mkdirSync(out, { recursive: true });
const url = pathToFileURL(join(root, 'ruta-escalado.html')).href;
const edge = ['C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', 'C:/Program Files/Microsoft/Edge/Application/msedge.exe'].find(existsSync);
if (!edge) { console.log('SKIP: Edge no encontrado'); process.exit(0); }
const profile = mkdtempSync(join(tmpdir(), 'rr-cap-'));
const port = 9247;
const proc = spawn(edge, ['--headless=new', `--remote-debugging-port=${port}`, `--user-data-dir=${profile}`, '--no-first-run', '--disable-gpu', '--hide-scrollbars', 'about:blank'], { stdio: 'ignore' });

const SIZES = quick ? [[1366, 768, 1]] : [[800, 600, 1], [1280, 720, 1], [1280, 720, 1.5], [1366, 768, 1], [1920, 1080, 1], [2560, 1440, 1], [3440, 1440, 1]];
const seed = `(() => {
  RRApp.commit(st => {
    RR.ops.setFarm(st, 'baseType', 'workshop');
    const a = RR.ops.addStation(st, 'plant'); RR.ops.setStation(st, a.id, 'g', 4); RR.ops.setStation(st, a.id, 'p', 2); RR.ops.setStation(st, a.id, 'fan', true); RR.ops.startStation(st, a.id);
    const b = RR.ops.addStation(st, 'repack'); RR.ops.startStation(st, b.id, Date.now() - 3 * 3600e3);
    const c = RR.ops.addStation(st, 'chem'); RR.ops.setStation(st, c.id, 'crystals', 4);
    if (RR.ops.addSim) {
      const s1 = RR.ops.addSim(st, 'A · 4 mesas de cultivo'); const g1 = RR.ops.addSimGroup(st, s1.id, 'plant'); RR.ops.setSimGroup(st, s1.id, g1.id, 'count', 4); RR.ops.setSimGroup(st, s1.id, g1.id, 'g', 6);
      const s2 = RR.ops.addSim(st, 'B · 2 mesas + 2 bancos'); RR.ops.setSim(st, s2.id, 'baseType', 'small_house');
      const g2 = RR.ops.addSimGroup(st, s2.id, 'plant'); RR.ops.setSimGroup(st, s2.id, g2.id, 'count', 2); RR.ops.setSimGroup(st, s2.id, g2.id, 'g', 6);
      const g3 = RR.ops.addSimGroup(st, s2.id, 'repack'); RR.ops.setSimGroup(st, s2.id, g3.id, 'count', 2); RR.ops.setSimGroup(st, s2.id, g3.id, 'box', 'tool_box_e');
      RR.ops.addSimFromFarm(st, 'C · mi granja actual');
    }
    if (RR.ops.addRaid) {
      const r = RR.ops.addRaid(st, 'Casa del vecino');
      const x = RR.ops.addRaidStruct(st, r.id, 'concrete_fence'); RR.ops.setRaidStruct(st, r.id, x.id, 'fu', 4);
      const y = RR.ops.addRaidStruct(st, r.id, 'small_house'); RR.ops.setRaidStruct(st, r.id, y.id, 'fe', 6);
      RR.ops.addRaidStruct(st, r.id, 'grow_room');
      RR.ops.setRaid(st, r.id, 'inv', { u: 10, e: 4, l: 0 });
    }
  }, { allowErrors: true });
  return true; })()`;
const TABS = ['ruta', 'granja', 'calc', 'datos', 'copias'];
const SUBS = ['prod', 'sim', 'cmp', 'opt', 'raid'];
try {
  const c = await connect(port);
  await c.send('Page.addScriptToEvaluateOnNewDocument', { source: `window.confirm = () => true; window.prompt = () => 'Ruta'; try { localStorage.setItem('robrun-update-check', String(Date.now())); } catch {}` });
  await c.send('Page.navigate', { url }); await sleep(1200);
  await c.evaluate(seed); await sleep(300);
  const hasSubs = await c.evaluate('typeof RRApp.showCalc === "function"');
  const shots = [];
  for (const [w, h, dpr] of SIZES) {
    await c.send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: dpr, mobile: false });
    const views = TABS.flatMap(t => t === 'calc' && hasSubs ? SUBS.map(s => [t, s]) : [[t, '']]);
    for (const [tab, sub] of views) {
      if (quick === false && w !== 1366 && tab !== 'ruta' && tab !== 'granja' && tab !== 'calc') continue; // datos y copias solo a 1366
      await c.evaluate(`RRApp.showTab(${JSON.stringify(tab)}); ${sub ? `RRApp.showCalc(${JSON.stringify(sub)});` : ''} window.scrollTo(0, 0); true`);
      await sleep(350);
      const { result } = await c.send('Page.captureScreenshot', { format: 'png' });
      const name = `${tab}${sub ? '-' + sub : ''}-${w}x${h}${dpr !== 1 ? '@' + dpr : ''}.png`;
      writeFileSync(join(out, name), Buffer.from(result.data, 'base64')); shots.push(name);
    }
  }
  const overflow = await c.evaluate('document.documentElement.scrollWidth > innerWidth');
  console.log(`${shots.length} capturas en ${out}${overflow ? ' · ¡scroll horizontal en la última!' : ''}`);
  if (c.errors.length) { console.log('Errores de JavaScript:', c.errors); process.exitCode = 1; }
  c.close();
} finally {
  proc.kill(); await sleep(800); try { rmSync(profile, { recursive: true, force: true }); } catch {}
}
