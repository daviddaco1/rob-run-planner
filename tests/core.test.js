// Unit + integración del núcleo. Ejecutar: node --test tests/
const test = require('node:test');
const assert = require('node:assert/strict');
const { RR, readJSON } = require('./helpers');

const farmWith = tables => RR.normFarm({ tables });
const stateWith = (route, tables = []) => RR.normState({ routes: [route], farm: { tables } });

test('normState: cualquier entrada da un estado válido con al menos una ruta', () => {
  for (const x of [null, undefined, 1, 'x', [], {}, { routes: 'no' }, { routes: [null, 5] }]) {
    const S = RR.normState(x);
    assert.equal(S.schema, RR.SCHEMA);
    assert.ok(S.routes.length >= 1);
    assert.deepEqual(RR.checkInvariants(S), []);
  }
});

test('normStep: sanea tipos, fases, números y textos', () => {
  const s = RR.normStep({ type: 'Hackear', phase: 'Ultra', target: -5, progress: 'abc', text: 'x'.repeat(1000), q: 'z', subs: ['a', null, { text: 1 }], requires: [1, 'a', 'a'] });
  assert.equal(s.type, 'Otro'); assert.equal(s.phase, 'Early'); assert.equal(s.target, 0); assert.equal(s.progress, 0);
  assert.equal(s.text.length, RR.LIM.text); assert.equal(s.q, 'p'); assert.equal(s.subs.length, 2); assert.deepEqual(s.requires, ['a']);
});

test('normRoute: ids de paso únicos y dependencias rotas o a sí mismo eliminadas', () => {
  const r = RR.normRoute({ steps: [{ id: 'a', requires: ['a', 'zz'] }, { id: 'a' }, { id: 'b', requires: ['a'] }] });
  assert.equal(new Set(r.steps.map(s => s.id)).size, 3);
  assert.deepEqual(r.steps[0].requires, []);
  assert.deepEqual(r.steps[2].requires, ['a']);
});

test('estaciones: nunca más de 6 plantas por mesa; temporizador con fin coherente', () => {
  const t = RR.normStation({ kind: 'plant', g: 5, p: 5, o: 5, start: 1000 });
  assert.equal(t.g + t.p + t.o, 6);
  assert.ok(t.end > t.start);
  assert.equal(RR.normStation({ kind: 'nada' }).kind, 'plant');
});

test('migración v1 → v2: done automático pasa a calcularse, mejoras y rutas incluidas por nombre', () => {
  const bundled = [{ id: 'dos-granjas', version: 2, name: 'Nueva', aliases: ['Full farmeo: 2 granjas completas'], steps: [] }];
  const v1 = {
    routes: [{ id: 'r1', name: 'A', steps: [
      { id: 's1', type: 'Dinero', target: 100, progress: 100, done: true },          // completada por meta
      { id: 's2', type: 'Otro', done: true },                                          // a mano
      { id: 's3', type: 'Plantas', target: 6, q: 'p', done: true },                    // se recalcula
      { id: 's4', type: 'Otro', done: true, subs: [{ text: 'x', done: true }] }] }],   // por subtareas
    cur: 'r1', added: ['Full farmeo: 2 granjas completas'],
    farm: { tables: [{ name: 'M', fan: true, pump: false, uv: true, g: 6, start: 5000 }, { kind: 'repack', lp1: true, box: 2 }] },
  };
  const { state, from } = RR.migrate(v1, bundled);
  assert.equal(from, 1);
  const [s1, s2, s3, s4] = state.routes[0].steps;
  assert.equal(s1.done, false); assert.equal(s2.done, true); assert.equal(s3.done, false); assert.equal(s4.done, false);
  const st = RR.statuses(state.routes[0], state.farm);
  assert.equal(st.get('s1'), 'done'); assert.equal(st.get('s2'), 'done'); assert.equal(st.get('s4'), 'done');
  assert.equal(st.get('s3'), 'pending'); // 6 verdes no son moradas y no acepta inferior
  assert.deepEqual(state.included, { 'dos-granjas': 1 });
  const [m, b] = state.farm.tables;
  assert.deepEqual(m.upg, { fan: true, water_pump: false, uv_lamp: true });
  assert.equal(b.upg.label_printer_u, true); assert.equal(b.box, 'tool_box_l');
  assert.ok(m.end > m.start);
  assert.deepEqual(RR.checkInvariants(state), []);
});

test('migración: datos de una versión futura se leen con aviso', () => {
  const res = RR.migrate({ schema: 99, routes: [{ name: 'X', steps: [] }] });
  assert.ok(res.notes.some(n => n.includes('más nueva')));
  assert.equal(res.state.routes[0].name, 'X');
});

test('estados: plantas completas, provisionales, en progreso y pendientes', () => {
  const r = RR.normRoute({ steps: [{ id: 'a', type: 'Plantas', target: 6, q: 'p', down: true }, { id: 'b', type: 'Plantas', target: 6, q: 'p' }] });
  assert.equal(RR.statuses(r, farmWith([])).get('a'), 'pending');
  assert.equal(RR.statuses(r, farmWith([{ g: 3 }])).get('a'), 'progress');
  assert.equal(RR.statuses(r, farmWith([{ g: 6 }])).get('a'), 'prov');
  assert.equal(RR.statuses(r, farmWith([{ g: 6 }])).get('b'), 'pending'); // verdes no cuentan si no acepta inferior
  assert.equal(RR.statuses(r, farmWith([{ g: 3, p: 2 }])).get('b'), 'progress');
  assert.equal(RR.statuses(r, farmWith([{ o: 6 }])).get('b'), 'done'); // dorada cuenta como morada o mejor
});

test('estados: bloqueado hasta completar la dependencia; siguiente salta bloqueados', () => {
  const r = RR.normRoute({ steps: [{ id: 'a', type: 'Otro', text: 'A' }, { id: 'b', type: 'Otro', text: 'B', requires: ['c'] }, { id: 'c', type: 'Otro', text: 'C' }] });
  const st = RR.statuses(r, farmWith([]));
  assert.equal(st.get('b'), 'blocked');
  r.steps[0].done = true;
  assert.equal(RR.nextStep(r, farmWith([])).id, 'c');
});

test('validación: dependencia circular es error y tiene arreglo', () => {
  const r = RR.normRoute({ steps: [{ id: 'a', requires: ['b'] }, { id: 'b', requires: ['a'] }] });
  const issues = RR.validateRoute(r, farmWith([]));
  const cyc = issues.find(i => i.code === 'cycle');
  assert.equal(cyc.level, 'error');
  const S = stateWith(r); RR.ops.applyFix(S, cyc.fix);
  assert.equal(RR.findCycles(RR.normRoute(S.routes[0])).length, 0);
});

test('validación: depender de un paso posterior es error; moverlo lo arregla', () => {
  const r = RR.normRoute({ steps: [{ id: 'a', text: 'A', requires: ['b'] }, { id: 'b', text: 'B' }] });
  const i = RR.validateRoute(r, farmWith([])).find(x => x.code === 'order');
  assert.equal(i.level, 'error');
  const S = stateWith(r); RR.ops.applyFix(S, i.fix);
  assert.equal(RR.errorsOf(RR.validateRoute(S.routes[0], S.farm)).length, 0);
  // si el requisito ya está hecho, no es error (el jugador lo hizo antes)
  r.steps[1].done = true;
  assert.equal(RR.validateRoute(r, farmWith([])).some(x => x.code === 'order'), false);
});

test('validación: requisitos del catálogo (falta, después, ya lo tengo, tier implícito)', () => {
  const r = RR.normRoute({ steps: [{ id: 'fan', item: 'fan' }] });
  let issues = RR.validateRoute(r, farmWith([]));
  const miss = issues.find(i => i.code === 'missingReq');
  assert.equal(miss.level, 'warn'); // posible: puede que ya lo tenga
  r.have = ['grow_table'];
  assert.equal(RR.validateRoute(r, farmWith([])).some(i => i.code === 'missingReq'), false);
  // requisito confirmado que va después: error
  const r2 = RR.normRoute({ steps: [{ id: 'f', item: 'fan' }, { id: 't', item: 'grow_table' }], have: ['grow_room'] });
  assert.equal(RR.validateRoute(r2, farmWith([])).find(i => i.code === 'reqAfter').level, 'error');
  // Water Pump es tier II: necesita parcela nivel 2 aunque tenga la mesa
  const r3 = RR.normRoute({ steps: [{ id: 'w', item: 'water_pump' }], have: ['grow_table'] });
  assert.ok(RR.validateRoute(r3, farmWith([])).some(i => i.code === 'missingReq' && i.fix.item === 'land_title_2'));
  // elemento eliminado del catálogo: advertencia, no error
  const r4 = RR.normRoute({ steps: [{ id: 'x', item: 'no_existe' }] });
  assert.equal(RR.validateRoute(r4, farmWith([]))[0].level, 'warn');
});

test('arreglo «añadir requisito» inserta el paso antes con precio y dependencia', () => {
  const S = stateWith(RR.normRoute({ steps: [{ id: 'f', item: 'fan' }] }));
  const fix = RR.validateRoute(S.routes[0], S.farm).find(i => i.code === 'missingReq').fix;
  RR.ops.applyFix(S, fix);
  const r = S.routes[0];
  assert.equal(r.steps[0].item, 'grow_table'); assert.equal(r.steps[0].target, 70000);
  assert.deepEqual(r.steps[1].requires, [r.steps[0].id]);
});

test('validación: más plantas de las que caben en la base (límite sin confirmar = advertencia)', () => {
  const r = RR.normRoute({ steps: [{ type: 'Plantas', target: 1000 }] });
  const i = RR.validateRoute(r, farmWith([])).find(x => x.code === 'plantsCap');
  assert.equal(i.level, 'warn');
});

test('granja: bancos por encima de los huecos de la base es error; mesas por encima del límite sin confirmar es aviso', () => {
  const f = RR.normFarm({ baseType: 'trailer', tables: [{ kind: 'repack' }, { kind: 'repack' }] });
  assert.ok(RR.validateFarm(f).some(i => i.code === 'benchSlots' && i.level === 'error'));
  const f2 = RR.normFarm({ tables: Array.from({ length: 13 }, () => ({ kind: 'plant' })) });
  assert.equal(RR.validateFarm(f2).find(i => i.code === 'tableCap').level, 'warn');
  const f3 = RR.normFarm({ tier: 1, tables: [{ kind: 'plant', upg: { uv_lamp: true } }] });
  assert.ok(RR.validateFarm(f3).some(i => i.code === 'tier'));
});

test('cálculo de cultivo: 6 verdes = $72.000/h base; con las 3 mejoras según el modo de apilado', () => {
  const t = RR.normStation({ kind: 'plant', g: 6 });
  assert.equal(RR.calc(t, RR.normFarm({})).perHour, 72000);
  t.upg = { fan: true, water_pump: true, uv_lamp: true };
  assert.equal(Math.round(RR.calc(t, RR.normFarm({ stacking: 'add' })).cycle), 40);
  assert.equal(Math.round(RR.calc(t, RR.normFarm({ stacking: 'reduce' })).cycle), 30);
  assert.equal(Math.round(RR.calc(t, RR.normFarm({ stacking: 'mult' })).cycle * 10) / 10, 37.9);
});

test('notoriedad: Fence +50% en nivel 5 para bolsas; Smuggler +25% para cajas', () => {
  const t = RR.normStation({ kind: 'plant', g: 6 });
  assert.equal(RR.calc(t, RR.normFarm({ notoriety: 5 })).harvest, 6 * 4000 * 3 * 1.5);
  const b = RR.normStation({ kind: 'repack' });
  assert.equal(RR.calc(b, RR.normFarm({ notoriety: 5 })).harvest, 35000 * 1.25 - 10000);
});

test('banco de contrabando: una caja por ciclo; la Tool Box da cola, no velocidad', () => {
  const b = RR.normStation({ kind: 'repack' }), F = RR.normFarm({});
  const base = RR.calc(b, F);
  assert.equal(base.harvest, 25000); assert.equal(base.perHour, 50000);
  b.box = 'tool_box_l';
  const withBox = RR.calc(b, F);
  assert.equal(withBox.perHour, 50000); assert.equal(withBox.slots, 3); assert.equal(withBox.autonomy, 90);
});

test('laboratorio: sin cristales apuntados no inventa pérdidas; con cristales calcula', () => {
  const t = RR.normStation({ kind: 'chem' }), F = RR.normFarm({});
  assert.equal(RR.calc(t, F).noData, true); assert.equal(RR.calc(t, F).perHour, 0);
  t.crystals = 2; t.quality = 'e';
  const c = RR.calc(t, F);
  assert.equal(c.cycle, 60 + 30); assert.equal(c.harvest, 2 * 45000 - 20000);
  t.upg = { evaporator: true, refrigerant: true };
  assert.ok(RR.calc(t, F).cycle < 90);
});

test('ops: borrar un paso quita las dependencias que apuntaban a él', () => {
  const S = stateWith(RR.normRoute({ steps: [{ id: 'a' }, { id: 'b', requires: ['a'] }] }));
  assert.equal(RR.ops.dependents(S, 'a').length, 1);
  RR.ops.deleteStep(S, 'a');
  assert.deepEqual(S.routes[0].steps[0].requires, []);
  assert.deepEqual(RR.checkInvariants(RR.normState(S)), []);
});

test('ops: cambiar mejoras con el temporizador en marcha no mueve el fin del ciclo', () => {
  const S = RR.normState({ farm: { tables: [{ id: 't', kind: 'plant', g: 6 }] } });
  RR.ops.startStation(S, 't', 1000);
  const end = S.farm.tables[0].end;
  RR.ops.setStation(S, 't', 'uv_lamp', true);
  assert.equal(S.farm.tables[0].end, end);
  assert.equal(S.farm.tables[0].upg.uv_lamp, true);
});

test('ops: no se puede borrar la última ruta; borrar la seleccionada cambia de ruta', () => {
  const S = RR.normState({});
  assert.throws(() => RR.ops.deleteRoute(S, S.cur), RR.UserError);
  RR.ops.newRoute(S, 'B');
  RR.ops.deleteRoute(S, S.cur);
  assert.ok(S.routes.some(r => r.id === S.cur));
});

test('ops: Nuevo wipe resetea progreso y subtareas pero conserva dependencias', () => {
  const S = stateWith(RR.normRoute({ steps: [{ id: 'a', progress: 5, done: true, subs: [{ text: 'x', done: true }] }, { id: 'b', requires: ['a'] }] }));
  const r = RR.ops.newWipe(S);
  assert.equal(r.steps[0].progress, 0); assert.equal(r.steps[0].done, false); assert.equal(r.steps[0].subs[0].done, false);
  assert.deepEqual(r.steps[1].requires, [r.steps[0].id]);
});

test('importar: JSON roto, sin rutas, ruta suelta, export completo y rutas con errores como borrador', () => {
  assert.equal(RR.parseImport('{', RR.normFarm({})).ok, false);
  assert.equal(RR.parseImport('{"a":1}', RR.normFarm({})).ok, false);
  assert.equal(RR.parseImport('{"name":"x","steps":[]}', RR.normFarm({})).routes.length, 1);
  const full = RR.parseImport(JSON.stringify({ routes: [{ name: 'a', steps: [] }], farm: {} }), RR.normFarm({}));
  assert.ok(full.full);
  const bad = RR.parseImport(JSON.stringify({ name: 'c', steps: [{ id: 'a', requires: ['b'] }, { id: 'b', requires: ['a'] }, 5] }), RR.normFarm({}));
  assert.equal(bad.routes[0].draft, true);
  assert.ok(bad.report.some(m => m.includes('descartados')));
  // ids nuevos pero dependencias internas conservadas
  const deps = bad.routes[0].steps;
  assert.ok(deps[0].requires[0] === deps[1].id && deps[0].id !== 'a');
  assert.ok(RR.parseImport('﻿{"name":"bom","steps":[]}', RR.normFarm({})).ok);
});

test('exportar → importar conserva la ruta', () => {
  const r = RR.normRoute(readJSON('ruta-2-granjas.json'));
  const back = RR.parseImport(JSON.stringify(RR.exportRoute(r)), RR.normFarm({})).routes[0];
  assert.equal(back.steps.length, r.steps.length);
  assert.deepEqual(back.steps.map(s => [s.text, s.item, s.requires.length, s.subs.length]), r.steps.map(s => [s.text, s.item, s.requires.length, s.subs.length]));
});

test('rutas de ejemplo e incluidas: sin errores', () => {
  for (const f of ['ruta-2-granjas.json', 'ruta-base-wipe.json']) {
    const r = RR.parseImport(require('fs').readFileSync(require('path').join(__dirname, '..', f), 'utf8'), RR.normFarm({})).routes[0];
    assert.deepEqual(RR.errorsOf(RR.validateRoute(r, RR.normFarm({}))), [], f);
  }
});

test('ejemplos de COMO-CREAR-RUTAS.md: el ejemplo completo importa sin errores', () => {
  const md = require('fs').readFileSync(require('path').join(__dirname, '..', 'COMO-CREAR-RUTAS.md'), 'utf8');
  const block = md.split('```json').map(b => b.split('```')[0]).find(b => b.includes('Mi ruta: primera granja'));
  const res = RR.parseImport(block, RR.normFarm({}));
  assert.ok(res.ok);
  assert.deepEqual(RR.errorsOf(RR.validateRoute(res.routes[0], RR.normFarm({}))), []);
  assert.equal(res.routes[0].draft, false);
});

test('rutas incluidas: se añaden una vez por id; versión nueva avisa y se añade aparte sin tocar la antigua', () => {
  const b1 = { id: 'x', version: 1, name: 'X', steps: [{ text: 'a' }] };
  const S = RR.normState({});
  assert.equal(RR.syncIncluded(S, [b1])[0].kind, 'added');
  assert.equal(RR.syncIncluded(S, [b1]).length, 0);
  const old = S.routes.find(r => r.origin?.id === 'x'); old.steps[0].done = true;
  const notes = RR.syncIncluded(S, [{ ...b1, version: 2 }]);
  assert.equal(notes[0].kind, 'update');
  RR.addIncludedVersion(S, { ...b1, version: 2 });
  assert.equal(S.routes.filter(r => r.origin?.id === 'x').length, 2);
  assert.equal(old.steps[0].done, true);
  assert.equal(RR.syncIncluded(S, [{ ...b1, version: 2 }]).length, 0);
  // una ruta incluida nueva no cambia la ruta activa del usuario
  const cur = S.cur;
  assert.equal(RR.syncIncluded(S, [{ ...b1, id: 'y' }])[0].kind, 'added');
  assert.equal(S.cur, cur);
});

test('cada ruta tiene su granja: cambiar de ruta cambia de granja sin perder nada', () => {
  const S = RR.normState({ routes: [{ id: 'a', name: 'A', steps: [] }, { id: 'b', name: 'B', steps: [] }], cur: 'a' });
  RR.ops.addStation(S, 'plant'); RR.ops.startStation(S, S.farm.tables[0].id, 1000);
  RR.ops.setCur(S, 'b');
  assert.equal(S.farm.tables.length, 0);
  RR.ops.addStation(S, 'repack'); RR.ops.addStation(S, 'chem');
  // los temporizadores de otras rutas siguen avisando
  assert.equal(RR.timerList(S).length, 1);
  assert.match(RR.timerList(S)[0].text, /\(A\)$/);
  const back = RR.normState(JSON.parse(JSON.stringify(S))); // guardar y cargar
  assert.deepEqual(RR.checkInvariants(back), []);
  RR.ops.setCur(back, 'a');
  assert.deepEqual(back.farm.tables.map(t => t.kind), ['plant']);
  assert.deepEqual(back.farms.b.tables.map(t => t.kind), ['repack', 'chem']);
  // duplicar copia la granja con los temporizadores parados; borrar una ruta se lleva su granja
  RR.ops.duplicateRoute(back, 'a');
  assert.equal(back.farm.tables.length, 1); assert.equal(back.farm.tables[0].start, null);
  assert.notEqual(back.farm.tables[0].id, back.farms.a.tables[0].id);
  RR.ops.deleteRoute(back, 'b');
  assert.equal(back.farms.b, undefined);
  assert.deepEqual(RR.checkInvariants(back), []);
});

test('migración 2 → 3: la granja única pasa a la ruta activa', () => {
  const v2 = { schema: 2, routes: [{ id: 'a', name: 'A', steps: [] }, { id: 'b', name: 'Mi ruta', steps: [] }], cur: 'b', farm: { tables: [{ kind: 'plant', name: 'A-1', g: 6 }] } };
  const { state, from, notes } = RR.migrate(v2);
  assert.equal(from, 2); assert.equal(state.schema, RR.SCHEMA);
  assert.equal(state.farm.tables[0].name, 'A-1'); assert.equal(state.farmOf, 'b');
  assert.ok(notes.some(n => n.includes('«Mi ruta»')));
  RR.ops.setCur(state, 'a'); assert.equal(state.farm.tables.length, 0);
});

test('isNewer compara versiones semver de las releases', () => {
  assert.equal(RR.isNewer('v2.1.1', '2.1.0'), true);
  assert.equal(RR.isNewer('v2.10.0', '2.9.9'), true);
  assert.equal(RR.isNewer('v2.1.0', '2.1.0'), false);
  assert.equal(RR.isNewer('v1.9.9', '2.0.0'), false);
  for (const bad of ['', 'latest', 'v2.1', null, '<script>', 'v2.1.0-beta']) assert.equal(RR.isNewer(bad, '2.0.0'), false);
});

test('las rutas incluidas del repo importan sin errores ni avisos', () => {
  const fs = require('node:fs'), path = require('node:path');
  for (const f of ['ruta-2-granjas.json', 'ruta-reempaquetado.json', 'ruta-taller-quimico.json']) {
    const r = RR.parseImport(fs.readFileSync(path.join(__dirname, '..', f), 'utf8'), RR.normFarm({})).routes[0];
    assert.ok(r && !r.draft, f);
    assert.deepEqual(RR.validateRoute(r, RR.normFarm({})).filter(i => i.level !== 'info').map(i => i.code), [], f);
  }
});

test('XSS: esc cubre los 5 caracteres peligrosos', () => {
  assert.equal(RR.esc(`<a href="x" onclick='y'>&`), '&lt;a href=&quot;x&quot; onclick=&#39;y&#39;&gt;&amp;');
});

test('calculadoras: comparador, opciones de mejora, resumen de ruta y cuellos de botella', () => {
  const F = RR.normFarm({ tables: [{ id: 't', kind: 'plant', g: 6, start: 1, end: 2 }] });
  const opts = RR.upgradeOptions(F.tables[0], F);
  assert.equal(opts[0].key, 'fan'); // la única no bloqueada por tier y la que antes se paga
  assert.ok(opts.find(o => o.key === 'uv_lamp').locked);
  const r = RR.normRoute({ steps: [{ type: 'Dinero', target: 144000 }, { type: 'Plantas', target: 36 }] });
  const sum = RR.routeSummary(r, F);
  assert.equal(sum.money, 144000); assert.equal(sum.etaHours, 2);
  const b = RR.bottlenecks(r, F, 10);
  assert.ok(b.some(m => m.includes('lista')) && b.some(m => m.includes('mesa(s) más')));
  assert.equal(RR.stationComparison(F).length, 3);
});

test('temporizadores: lista para la app nativa', () => {
  const F = RR.normFarm({ tables: [{ id: 't', kind: 'repack', name: 'B', start: 1000, end: 61000 }, { id: 'u' }] });
  assert.deepEqual(RR.timerList(F), [{ id: 't', due: 61000, text: 'B: cajas reempaquetadas listas' }]);
});

test('iconos: cada elemento del catálogo, tipo de paso, estación y fase tiene un icono que existe', () => {
  require('../iconos.js');
  const IC = globalThis.RR_ICONS, CAT = globalThis.RR_CATALOG;
  const has = n => typeof IC.paths[n] === 'string' && IC.paths[n].length > 0;
  for (const it of Object.values(CAT.items)) assert.ok(has(IC.items[it.id] || IC.cats[it.cat]?.icon), `sin icono: ${it.id}`);
  for (const t of RR.TYPES) assert.ok(has(IC.types[t]), `tipo sin icono: ${t}`);
  for (const k of Object.keys(RR.KINDS)) assert.ok(has(IC.kinds[k]), `estación sin icono: ${k}`);
  for (const p of RR.PHASES) assert.ok(has(IC.phases[p]), `fase sin icono: ${p}`);
  for (const k of [...Object.keys(CAT.raid.structures), 'custom']) assert.ok(has(IC.raid[k]), `estructura sin icono: ${k}`);
  for (const k of Object.keys(IC.items)) assert.ok(CAT.items[k], `icono para un elemento que ya no existe: ${k}`);
  assert.match(IC.sprite(), /<symbol id="i-money" viewBox="0 0 24 24">/);
});

// ---------- simulador, comparador, optimizador y raideos (esquema 4) ----------
const simWith = (groups, extra = {}) => RR.normSim({ name: 'T', hours: 4, active: 4, check: 15, ...extra, groups });

test('simulador: 4 mesas con 6 verdes, sin mejoras = 4 × 72.000 $/h, teórico = efectivo si atiendes a tiempo', () => {
  const r = RR.simulate(simWith([{ kind: 'plant', g: 6, count: 4 }]));
  assert.equal(r.thPerHour, 288000);
  assert.equal(r.effPerHour, 288000);
  assert.equal(r.cycles, 16);
  assert.equal(r.investment, 4 * 40000);
  assert.equal(r.paybackEff, 1);
  assert.equal(r.efficiency, 1);
});

test('simulador: revisar cada 50 min con ciclos de 60 hace perder ciclos; ausente no se reinicia nada', () => {
  const sim = simWith([{ kind: 'plant', g: 6, count: 1 }], { hours: 8, active: 8, check: 50 });
  const r = RR.simulate(sim);
  // atiende en 0, 50, 100, ... → reinicia en 0, 100, 200, ... (ciclos de 100 min efectivos): terminan en 60, 160, 260, 360 y 460 → 5 ciclos
  assert.equal(r.cycles, 5);
  assert.ok(r.effPerHour < r.thPerHour);
  const away = RR.simulate({ ...sim, active: 1 });
  assert.equal(away.cycles, 1); // solo el que dejó en marcha
});

test('simulador: la Tool Box deja más cajas en cola y aguanta sin atender', () => {
  const base = { kind: 'repack', count: 1 }, opt = { hours: 4, active: 0, check: 15 };
  assert.equal(RR.simulate(simWith([base], opt)).cycles, 1);
  const withBox = RR.simulate(simWith([{ ...base, box: 'tool_box_e' }], opt));
  assert.ok(withBox.cycles > 1);
  assert.ok(withBox.actionsPerHour <= RR.simulate(simWith([base], { ...opt, active: 4 })).actionsPerHour);
});

test('simulador: insumos limitados → déficit, estaciones ociosas y sin contar dos veces el coste', () => {
  const sim = simWith([{ kind: 'repack', count: 2, sell: 35000, cost: 10000 }], { hours: 2, active: 2, check: 0, supplyBox: 1, stockBox: 0 });
  const r = RR.simulate(sim);
  assert.ok(r.shortage.box > 0);
  assert.equal(r.inputs.box, r.cycles);                  // cada ciclo gasta exactamente una caja
  assert.equal(r.cost, r.cycles * 10000);                 // el coste de la caja se cuenta una vez
  assert.equal(r.gross, r.cycles * 35000);
  assert.ok(r.bottlenecks.some(b => /Faltan/.test(b.msg)));
});

test('simulador: validación de límites del juego y arreglo propuesto', () => {
  const sim = simWith([{ kind: 'repack', count: 3 }], { baseType: 'trailer' });
  const err = RR.validateSim(sim).find(i => i.code === 'benchSlots');
  assert.equal(err.level, 'error');
  assert.deepEqual(err.fix, { kind: 'baseType', value: 'mansion' });
  const many = simWith([{ kind: 'plant', g: 6, count: 13 }], { rooms: 2 });
  assert.ok(RR.validateSim(many).some(i => i.code === 'tableCap' && i.level === 'error'));
  assert.ok(RR.validateSim(simWith([{ kind: 'chem', count: 1 }])).some(i => i.code === 'chemNoValue'));
});

test('simulador: datos extremos o basura no dan NaN ni infinitos', () => {
  for (const x of [{}, { hours: -5, active: 99, check: -1 }, { hours: 1e9, groups: [{ kind: 'plant', g: 99, count: 1e9 }] }, { groups: [null, 5, { kind: 'chem', crystals: 'x' }] }]) {
    const sim = RR.normSim(x), r = RR.simulate(sim);
    for (const k of ['effPerHour', 'thPerHour', 'net', 'investTotal']) assert.ok(Number.isFinite(r[k]), k);
    assert.ok(sim.active <= sim.hours);
  }
});

test('comparador: marca el mejor en beneficio, inversión y recuperación', () => {
  const a = simWith([{ kind: 'plant', g: 6, count: 4 }]), b = simWith([{ kind: 'plant', g: 6, count: 1 }]);
  a.id = 'a'; b.id = 'b';
  const c = RR.compareSims([a, b], 4);
  assert.equal(c.best.profit, 'a');
  assert.equal(c.best.invest, 'b');
});

test('optimizador: respeta presupuesto, huecos de banco y tier; explica la recomendación', () => {
  const o = RR.optimize({ budget: 300000, tier: 1, baseType: 'trailer', rooms: 1, objective: 'profit', hours: 4, active: 4, check: 15 });
  assert.ok(o.results.length);
  for (const x of o.results) {
    assert.ok(x.inv <= 300000);
    assert.ok(x.groups.filter(g => g.kind === 'repack').reduce((a, g) => a + g.count, 0) <= 1);
    assert.ok(x.groups.filter(g => g.kind === 'plant').reduce((a, g) => a + g.count, 0) <= 6);
    for (const g of x.groups) for (const k of Object.keys(g.upg)) if (g.upg[k]) assert.ok((global.RR_CATALOG.items[k].tier || 1) <= 1);
    assert.match(x.why, /\$\/h/);
  }
  assert.ok(o.notes.some(n => /cristales/.test(n))); // sin cristales apuntados el laboratorio no entra
  const cheap = RR.optimize({ budget: 1e7, tier: 3, baseType: 'workshop', objective: 'invest', hours: 4, active: 4, check: 15 });
  assert.ok(cheap.results[0].inv <= Math.min(...cheap.results.map(x => x.inv)));
  const capped = RR.optimize({ budget: 1e9, tier: 3, baseType: 'workshop', objective: 'profit', maxEval: 50 });
  assert.equal(capped.truncated, true);
});

test('raideo: Small House con 10 fusibles Epic = 45 puntos = 15 Decoders Epic', () => {
  const raid = RR.normRaid({ buy: 'e', barter: false, structs: [{ kind: 'small_house', fe: 10 }] });
  assert.equal(RR.structDefense(raid.structs[0]), 45);
  const p = RR.raidPlan(raid);
  assert.equal(p.missing.e, 15);
  assert.equal(p.rows[0].waste, 0);
  assert.equal(p.seconds, 15 * 12);
  assert.equal(p.total, 15 * 5000);
  assert.equal(p.feasible, false);
});

test('raideo: usa primero el inventario, minimiza el coste y calcula los materiales del trueque', () => {
  const raid = RR.normRaid({ buy: 'e', barter: true, inv: { u: 2, e: 1, l: 0 }, structs: [{ kind: 'trailer' }] }); // 5 puntos
  const p = RR.raidPlan(raid);
  assert.deepEqual(p.rows[0].use, { l: 0, e: 1, u: 2 });
  assert.equal(p.missing.e, 0);
  assert.equal(p.feasible, true);
  const more = RR.raidPlan(RR.normRaid({ ...raid, inv: { u: 0, e: 0, l: 0 }, reserve: 50 }));
  assert.equal(more.missing.e, 2);
  assert.equal(more.reserve, 1);
  assert.deepEqual(more.materials, { u: 9, cash: 30000 }); // (2 + 1 reserva) × (3 Uncommon + $10.000)
});

test('raideo: fusibles por encima de los huecos se rechazan con explicación; rutas alternativas', () => {
  const S = RR.normState({});
  const r = RR.ops.addRaid(S, 'X'), fence = RR.ops.addRaidStruct(S, r.id, 'mesh_fence'), house = RR.ops.addRaidStruct(S, r.id, 'mansion');
  assert.throws(() => RR.ops.setRaidStruct(S, r.id, fence.id, 'fl', 4), RR.UserError);
  const a = RR.ops.addRaidRoute(S, r.id, 'Por la valla'), b = RR.ops.addRaidRoute(S, r.id, 'Solo la casa');
  RR.ops.setRaidRoute(S, r.id, b.id, 'toggle', fence.id);
  const c = RR.compareRaidRoutes(S.raids[0]);
  assert.equal(c.best.decoders, b.id);
  assert.equal(c.best.time, b.id);
  RR.ops.delRaidStruct(S, r.id, house.id);
  assert.deepEqual(RR.checkInvariants(RR.normState(S)), []);
});

test('raideo: rentabilidad con el botín y punto de equilibrio', () => {
  const p = RR.raidPlan(RR.normRaid({ buy: 'u', loot: 20000, structs: [{ kind: 'trailer' }] }));
  assert.equal(p.total, 5000);
  assert.equal(p.lootProfit.profit, 15000);
  assert.equal(p.lootProfit.breakeven, 5000);
});

test('migración 3 → 4: rutas y granjas intactas, escenarios y raideos vacíos, aviso', () => {
  const v3 = { schema: 3, routes: [{ id: 'r1', name: 'Mía', steps: [{ id: 's1', text: 'x', target: 5 }] }], cur: 'r1', farmOf: 'r1', farm: { tables: [{ id: 't1', kind: 'plant', g: 4 }] }, farms: {} };
  const m = RR.migrate(v3);
  assert.equal(m.state.schema, 4);
  assert.deepEqual(m.state.sims, []);
  assert.deepEqual(m.state.raids, []);
  assert.equal(m.state.farm.tables[0].g, 4);
  assert.equal(m.state.routes[0].steps[0].target, 5);
  assert.ok(m.notes.some(n => /simulador/.test(n)));
  // escenarios y raideos sobreviven a guardar y cargar
  const S = m.state; RR.ops.addSimFromFarm(S); RR.ops.addRaid(S, 'Base');
  const again = RR.migrate(JSON.parse(JSON.stringify(S))).state;
  assert.equal(again.sims[0].groups[0].g, 4);
  assert.equal(again.raids[0].name, 'Base');
  assert.equal(again.farm.tables[0].start, null); // la copia al simulador no arranca temporizadores
});
