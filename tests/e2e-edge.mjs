// E2E en Edge headless contra file:// con un perfil temporal (no toca tus datos). Ejecutar: node tests/e2e-edge.mjs
import { spawn } from 'node:child_process';
import { mkdtempSync, rmSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import assert from 'node:assert/strict';
import { connect, sleep } from './cdp.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const url = pathToFileURL(join(root, 'ruta-escalado.html')).href;
const edge = ['C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', 'C:/Program Files/Microsoft/Edge/Application/msedge.exe'].find(existsSync);
if (!edge) { console.log('SKIP: Edge no encontrado'); process.exit(0); }
const profile = mkdtempSync(join(tmpdir(), 'rr-e2e-'));
const port = 9241;
const proc = spawn(edge, ['--headless=new', `--remote-debugging-port=${port}`, `--user-data-dir=${profile}`, '--no-first-run', '--disable-gpu', 'about:blank'], { stdio: 'ignore' });

let passed = 0;
const results = [];
async function step(name, fn) {
  try { await fn(); passed++; results.push('✔ ' + name); }
  catch (e) { results.push('✖ ' + name + '\n    ' + (e.stack || e).toString().split('\n').slice(0, 4).join('\n    ')); process.exitCode = 1; }
  console.log(results.at(-1));
}
try {
  const c = await connect(port);
  const go = async () => { await c.send('Page.navigate', { url }); await sleep(900); };
  const ev = c.evaluate;
  // los diálogos nativos bloquearían la prueba: se aceptan solos en cada carga
  await c.send('Page.addScriptToEvaluateOnNewDocument', { source: `window.confirm = () => true; window.prompt = () => 'Ruta E2E'; try { localStorage.setItem('robrun-update-check', String(Date.now())); } catch {}` });
  await go();
  const S = () => ev('JSON.parse(JSON.stringify(RRApp.S))');
  const toasts = () => ev(`[...document.querySelectorAll('.toast')].map(t => t.textContent)`);
  const setVal = (sel, v) => ev(`(() => { const el = document.querySelector(${JSON.stringify(sel)}); el.value = ${JSON.stringify(v)}; el.dispatchEvent(new Event('change', { bubbles: true })); return true; })()`);
  const click = sel => ev(`(() => { const el = document.querySelector(${JSON.stringify(sel)}); if (!el) throw new Error('no existe ' + ${JSON.stringify(sel)}); el.click(); return true; })()`);

  await step('carga limpia: ruta incluida añadida, invariantes OK, sin errores de consola', async () => {
    const s = await S();
    assert.ok(s.routes.some(r => r.origin?.id === 'dos-granjas'));
    assert.deepEqual(await ev('RR.checkInvariants(RRApp.S)'), []);
    assert.equal(await ev(`document.querySelectorAll('#phases .step').length`), s.routes.find(r => r.id === s.cur).steps.length);
  });

  await step('añadir, editar, duplicar y borrar paso (con deshacer)', async () => {
    const s0 = await S(), n0 = s0.routes.find(r => r.id === s0.cur).steps.length;
    await click('[data-add=Mid]');
    let s = await S(), r = s.routes.find(x => x.id === s.cur);
    assert.equal(r.steps.length, n0 + 1);
    const id = r.steps.at(-1).id;
    await setVal(`#step-${id} [data-f=text]`, 'Paso E2E');
    await click(`#step-${id} [data-act=dup]`);
    s = await S(); r = s.routes.find(x => x.id === s.cur);
    assert.equal(r.steps.filter(x => x.text === 'Paso E2E').length, 2);
    await click(`#step-${id} [data-act=del]`);
    await ev('RRApp.undo(); true');
    s = await S(); r = s.routes.find(x => x.id === s.cur);
    assert.equal(r.steps.filter(x => x.text === 'Paso E2E').length, 2);
  });

  await step('edición que crea un error en una ruta activa se rechaza y se ofrece borrador', async () => {
    let s = await S(); const r = s.routes.find(x => x.id === s.cur);
    const first = r.steps.find(x => x.phase === 'Early' && !x.requires.length && !x.done), last = r.steps.filter(x => x.phase === 'Late').at(-1);
    await setVal(`#step-${first.id} [data-f=addreq]`, last.id);
    s = await S();
    assert.equal(s.routes.find(x => x.id === r.id).steps.find(x => x.id === first.id).requires.includes(last.id), false, 'no debe aplicarse');
    assert.ok((await toasts()).some(t => t.includes('No se aplicó')));
    await ev(`[...document.querySelectorAll('.toast button')].find(b => b.textContent.includes('borrador')).click(); true`);
    s = await S();
    const draft = s.routes.find(x => x.id === s.cur);
    assert.equal(draft.draft, true);
    assert.ok(draft.steps.find(x => x.id === first.id).requires.includes(last.id));
    assert.equal(await ev(`document.querySelector('#activate').disabled`), true);
    // arreglarlo con el botón sugerido y activar
    await ev(`[...document.querySelectorAll('#issues button[data-fix]')][0].click(); true`);
    await click('#activate');
    s = await S();
    assert.equal(s.routes.find(x => x.id === s.cur).draft, false);
  });

  await step('elemento del catálogo: requisito que falta, arreglo «Ya lo tengo»', async () => {
    await ev(`RRApp.commit(st => RR.ops.newRoute(st, 'Cat'), { allowErrors: true }); true`);
    await click('[data-add=Early]');
    let s = await S(); const id = s.routes.find(x => x.id === s.cur).steps[0].id;
    await setVal(`#step-${id} [data-f=item]`, 'Fan');
    assert.ok(await ev(`!!document.querySelector('#issues [data-fix]')`));
    await ev(`[...document.querySelectorAll('#issues button')].find(b => b.textContent === 'Ya lo tengo').click(); true`);
    s = await S();
    assert.ok(s.routes.find(x => x.id === s.cur).have.includes('grow_table'));
    await setVal(`#step-${id} [data-f=item]`, 'Esto no existe');
    assert.ok((await toasts()).some(t => t.includes('no está en el catálogo')));
  });

  await step('granja: añadir estaciones, límite de bancos por base, temporizador y aviso', async () => {
    await ev(`RRApp.showTab('granja'); true`);
    await click('[data-addst=repack]');
    await click('[data-addst=repack]'); // el tráiler solo admite 1 banco
    let s = await S();
    assert.equal(s.farm.tables.filter(t => t.kind === 'repack').length, 1);
    assert.ok((await toasts()).some(t => t.includes('solo admite')));
    await setVal('[data-g=baseType]', 'workshop');
    await click('[data-addst=repack]');
    s = await S();
    assert.equal(s.farm.tables.filter(t => t.kind === 'repack').length, 2);
    await click('[data-addst=chem]');
    await click('[data-addst=plant]');
    await setVal('[data-g=base]', '0.01');
    const plant = (await S()).farm.tables.find(t => t.kind === 'plant');
    await setVal(`.step[data-id="${plant.id}"] [data-t=g]`, '6');
    await click(`.step[data-id="${plant.id}"] [data-tact=start]`);
    await sleep(2200);
    assert.match(await ev('document.title'), /Producción lista/);
    assert.equal((await S()).farm.tables.find(t => t.id === plant.id).notified, true);
  });

  await step('pestañas Calculadoras, Datos y Copias se pintan', async () => {
    for (const t of ['calc', 'datos', 'copias']) await ev(`RRApp.showTab('${t}'); true`);
    await ev(`RRApp.showTab('calc'); true`);
    await ev(`RRApp.showCalc('prod'); true`);
    assert.ok(await ev(`document.querySelector('#calcBody').textContent.includes('Comparador')`));
    assert.ok(await ev(`document.querySelector('#calcBody').textContent.includes('Se paga en')`));
    await ev(`RRApp.showTab('datos'); true`);
    assert.ok(await ev(`document.querySelectorAll('#datosBody tr').length > 40`));
    await ev(`RRApp.showTab('ruta'); true`);
  });

  await step('simulador, comparador y optimizador: escenarios aislados de la granja real', async () => {
    const farmBefore = await ev('JSON.stringify([RRApp.S.farm, RRApp.S.farms])');
    await ev(`RRApp.showCalc('sim'); true`);
    await click('[data-simact=farm]');
    assert.ok(await ev(`RRApp.S.sims.length === 1 && RRApp.S.sims[0].groups.length === RRApp.S.farm.tables.length`));
    await click('[data-simadd=plant]');
    const gid = await ev(`RRApp.S.sims[0].groups.at(-1).id`);
    await setVal(`[data-gid="${gid}"] [data-t=g]`, '6');
    await click(`[data-gid="${gid}"] [data-gact=inc]`);
    assert.equal(await ev(`RRApp.S.sims[0].groups.at(-1).count`), 2);
    await click('[data-sc-h="8"]');
    assert.equal(await ev('RRApp.S.sims[0].hours'), 8);
    assert.ok(await ev(`document.querySelector('#calcBody').textContent.includes('Beneficio neto efectivo')`));
    assert.ok(await ev(`!!document.querySelector('#calcBody .chart svg polyline')`));
    assert.equal(await ev('JSON.stringify([RRApp.S.farm, RRApp.S.farms])'), farmBefore, 'el simulador cambió la granja');
    await click('[data-simact=dup]');
    await ev(`RRApp.showCalc('cmp'); true`);
    assert.ok(await ev(`document.querySelectorAll('#calcBody table.cmp tr').length === 3`));
    await ev(`RRApp.showCalc('opt'); true`);
    await click('[data-optrun]');
    await sleep(600);
    assert.ok(await ev(`document.querySelectorAll('#calcBody .opt-res').length > 0`));
    await click('[data-optuse="0"]');
    assert.equal(await ev('RRApp.S.sims.length'), 3);
    assert.equal(await ev('JSON.stringify([RRApp.S.farm, RRApp.S.farms])'), farmBefore, 'el optimizador cambió la granja');
  });

  await step('raideos: base objetivo, fusibles por encima del límite rechazados, plan y persistencia', async () => {
    await ev(`RRApp.showCalc('raid'); true`);
    await ev(`window.prompt = () => 'Base E2E'; true`);
    await click('[data-raidact=new]');
    await setVal('[data-raidadd]', 'small_house');
    const sid = await ev(`RRApp.S.raids[0].structs[0].id`);
    await setVal(`[data-rsid="${sid}"] [data-rs=fe]`, '10');
    assert.equal(await ev('RRApp.S.raids[0].structs[0].fe'), 10);
    assert.ok(await ev(`document.querySelector('#calcBody').textContent.includes('Decodificadores necesarios')`));
    await setVal(`[data-rsid="${sid}"] [data-rs=fu]`, '30'); // 10 + 30 > 27 huecos
    assert.equal(await ev('RRApp.S.raids[0].structs[0].fu'), 0);
    assert.ok((await toasts()).some(t => t.includes('admite 27 fusibles')));
    await ev('location.reload(); true'); await sleep(1200);
    assert.equal(await ev('RRApp.S.raids[0].structs[0].fe'), 10);
    assert.equal(await ev('RRApp.S.sims.length'), 3);
    await ev(`RRApp.showTab('ruta'); true`);
  });

  await step('importar por la interfaz: ruta con XSS y con errores entra como borrador sin ejecutar nada', async () => {
    const evil = JSON.stringify({ name: '<img src=x onerror="window.__xss=1">', steps: [{ id: 'a', text: '<script>window.__xss=2</script>', requires: ['b'] }, { id: 'b', requires: ['a'] }] });
    await ev(`(() => { const dt = new DataTransfer(); dt.items.add(new File([${JSON.stringify(evil)}], 'x.json', { type: 'application/json' }));
      const i = document.querySelector('#importFile'); i.files = dt.files; i.dispatchEvent(new Event('change')); return true; })()`);
    await sleep(300);
    const s = await S(), r = s.routes.find(x => x.id === s.cur);
    assert.ok(r.name.startsWith('<img'));
    assert.equal(r.draft, true);
    assert.equal(await ev('window.__xss'), undefined);
  });

  await step('persistencia: recargar conserva todo', async () => {
    const before = await S();
    await go();
    const after = await S();
    assert.equal(after.routes.length, before.routes.length);
    assert.equal(after.farm.tables.length, before.farm.tables.length);
  });

  await step('datos dañados: se guarda copia, se avisa y la app sigue funcionando', async () => {
    await ev(`localStorage.setItem('robrun-rutas-v1', '{roto'); true`);
    await go();
    assert.ok(await ev(`document.querySelector('#notices').textContent.includes('dañados')`));
    assert.ok(await ev(`RRApp.backups().some(b => b.data === '{roto')`));
    assert.deepEqual(await ev('RR.checkInvariants(RRApp.S)'), []);
  });

  await step('migración desde v1: copia previa, ruta incluida por nombre y aviso de versión nueva', async () => {
    const v1 = { routes: [{ id: 'r1', name: 'Full farmeo: 2 granjas completas', steps: [{ id: 's', type: 'Dinero', target: 10, progress: 10, done: true }] }], cur: 'r1',
      added: ['Full farmeo: 2 granjas completas'], farm: { tables: [{ name: 'A-1', fan: true, g: 6 }] }, tab: 'ruta' };
    await ev(`localStorage.setItem('robrun-rutas-v1', ${JSON.stringify(JSON.stringify(v1))}); true`);
    await go();
    const s = await S();
    assert.equal(s.schema, await ev('RR.SCHEMA'));
    assert.equal(s.included['dos-granjas'], 1);
    assert.ok(await ev(`RRApp.backups().some(b => b.reason.startsWith('Antes de actualizar'))`));
    assert.ok(await ev(`document.querySelector('#notices').textContent.includes('versión nueva')`));
    assert.equal(s.farm.tables[0].upg.fan, true);
    await ev(`[...document.querySelectorAll('#notices button')].find(b => b.textContent.includes('Añadir la versión')).click(); true`);
    assert.equal(s.cur, 'r1'); // las rutas incluidas nuevas no cambian la ruta activa
    const s2 = await S();
    assert.equal(s2.routes.length, s.routes.length + 1);
    assert.equal(s2.routes[0].steps[0].progress, 10); // la vieja intacta
  });

  await step('restaurar una copia y borrar todo se pueden deshacer', async () => {
    const n = (await S()).routes.length;
    await ev(`RRApp.showTab('copias'); true`);
    await click('#resetAll');
    assert.equal((await S()).routes.length, 1);
    await ev('RRApp.undo(); true');
    assert.equal((await S()).routes.length, n);
  });

  await step('granja por ruta: el selector de la pestaña Granja cambia de granja y de ruta', async () => {
    await ev(`RRApp.showTab('granja'); RRApp.commit(st => RR.ops.addStation(st, 'repack'), { allowErrors: true }); true`);
    const s = await S(), n = s.farm.tables.length, other = s.routes.find(r => r.id !== s.cur).id;
    await ev(`const el = document.getElementById('farmRoute'); el.value = ${JSON.stringify(other)}; el.dispatchEvent(new Event('change', { bubbles: true })); true`);
    const s2 = await S();
    assert.equal(s2.cur, other);
    assert.equal(s2.farms[s.cur].tables.length, n);
    assert.equal(await ev(`document.getElementById('farmRoute').value`), other); // la pestaña se repintó con la otra granja
    assert.equal(await ev(`document.querySelectorAll('#tables [data-timer]').length`), s2.farm.tables.length);
    await ev('RRApp.undo(); true');
    assert.equal((await S()).cur, s.cur);
  });

  await step('sin errores de JavaScript en toda la sesión', async () => { assert.deepEqual(c.errors, []); });
  c.close();
} finally {
  proc.kill();
  await sleep(500);
  try { rmSync(profile, { recursive: true, force: true }); } catch {}
}
console.log(results.join('\n'));
console.log(`\nE2E Edge: ${passed}/${results.length} OK`);
