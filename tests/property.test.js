// Pruebas basadas en propiedades y fuzzing (semillas fijas: si falla, el mensaje dice qué semilla reproducir).
const test = require('node:test');
const assert = require('node:assert/strict');
const { RR, rng, junk, randomRoute } = require('./helpers');

const roundtrip = S => RR.normState(JSON.parse(JSON.stringify(S)));

test('fuzz: migrate/normState nunca lanzan y siempre cumplen las invariantes', () => {
  for (let seed = 1; seed <= 1500; seed++) {
    const r = rng(seed), raw = junk(r);
    const { state } = RR.migrate(raw, []);
    assert.deepEqual(RR.checkInvariants(state), [], `semilla ${seed}`);
    assert.deepEqual(RR.checkInvariants(roundtrip(state)), [], `semilla ${seed} (ida y vuelta)`);
  }
});

test('fuzz: parseImport con texto o JSON arbitrario nunca lanza y devuelve rutas válidas', () => {
  for (let seed = 1; seed <= 1500; seed++) {
    const r = rng(seed);
    const text = r.next() < 0.2 ? JSON.stringify(junk(r)).slice(0, r.int(0, 200)) : JSON.stringify(r.bool() ? { routes: [junk(r), randomRoute(r)] } : randomRoute(r));
    const res = RR.parseImport(text, RR.normFarm({}));
    for (const route of res.routes) {
      const S = RR.normState({ routes: [route] });
      assert.deepEqual(RR.checkInvariants(S), [], `semilla ${seed}`);
      // si la ruta importada no es borrador, no tiene errores bloqueantes
      if (!route.draft) assert.equal(RR.errorsOf(RR.validateRoute(route, S.farm)).length, 0, `semilla ${seed}`);
    }
  }
});

test('propiedad: los ciclos de dependencias siempre se detectan', () => {
  for (let seed = 1; seed <= 400; seed++) {
    const r = rng(seed), n = r.int(2, 8);
    const steps = Array.from({ length: n }, (_, i) => ({ id: 'c' + i, requires: ['c' + ((i + 1) % n)] }));
    const route = RR.normRoute({ steps });
    assert.ok(RR.findCycles(route).length > 0, `semilla ${seed}`);
    assert.ok(RR.validateRoute(route, RR.normFarm({})).some(i => i.code === 'cycle' && i.level === 'error'));
  }
});

test('propiedad: secuencias aleatorias de operaciones mantienen el estado válido y recuperable', () => {
  const OPS = ['addStep', 'deleteStep', 'duplicateStep', 'moveStep', 'moveBefore', 'setStep', 'addSub', 'setSub', 'delSub', 'newRoute', 'newWipe',
    'duplicateRoute', 'deleteRoute', 'setRoute', 'setCur', 'addStation', 'deleteStation', 'setStation', 'startStation', 'stopStation', 'logHarvest', 'setFarm', 'applyFix'];
  const FIELDS = ['type', 'phase', 'text', 'target', 'progress', 'done', 'q', 'down', 'item', 'requires', 'notes'];
  for (let seed = 1; seed <= 300; seed++) {
    const r = rng(seed);
    let S = RR.normState({ routes: [randomRoute(r)], farm: { tables: [{ kind: 'plant', g: 3 }] } });
    for (let k = 0; k < 60; k++) {
      const op = r.pick(OPS), route = S.routes.find(x => x.id === S.cur), step = route.steps.length ? r.pick(route.steps) : null;
      const st = S.farm.tables.length ? r.pick(S.farm.tables) : null, any = () => junk(r);
      try {
        switch (op) {
          case 'addStep': RR.ops.addStep(S, r.pick(RR.PHASES), { type: r.pick(RR.TYPES) }); break;
          case 'deleteStep': step && RR.ops.deleteStep(S, step.id); break;
          case 'duplicateStep': step && RR.ops.duplicateStep(S, step.id); break;
          case 'moveStep': step && RR.ops.moveStep(S, step.id, r.pick([-1, 1])); break;
          case 'moveBefore': step && RR.ops.moveBefore(S, step.id, r.pick(route.steps).id); break;
          case 'setStep': step && RR.ops.setStep(S, step.id, r.pick(FIELDS), r.bool() ? any() : r.pick([0, 5, 'Plantas', 'Mid', 'o', true, [route.steps[0]?.id]])); break;
          case 'addSub': step && RR.ops.addSub(S, step.id, 'x'); break;
          case 'setSub': step?.subs.length && RR.ops.setSub(S, step.id, step.subs[0].id, r.pick(['done', 'text']), any()); break;
          case 'delSub': step?.subs.length && RR.ops.delSub(S, step.id, step.subs[0].id); break;
          case 'newRoute': RR.ops.newRoute(S, String(any())); break;
          case 'newWipe': RR.ops.newWipe(S); break;
          case 'duplicateRoute': RR.ops.duplicateRoute(S, S.cur); break;
          case 'deleteRoute': RR.ops.deleteRoute(S, S.cur); break;
          case 'setRoute': RR.ops.setRoute(S, r.pick(['name', 'goal', 'have', 'draft']), any()); break;
          case 'setCur': RR.ops.setCur(S, r.pick(S.routes).id); break;
          case 'addStation': RR.ops.addStation(S, r.pick(['plant', 'repack', 'chem'])); break;
          case 'deleteStation': st && RR.ops.deleteStation(S, st.id); break;
          case 'setStation': st && RR.ops.setStation(S, st.id, r.pick(['g', 'p', 'o', 'fan', 'uv_lamp', 'label_printer_u', 'evaporator', 'box', 'base', 'sell', 'cost', 'reactor', 'freeze', 'crystals', 'quality', 'value', 'name']), r.bool() ? any() : r.int(0, 9)); break;
          case 'startStation': st && RR.ops.startStation(S, st.id, r.int(1, 1e12)); break;
          case 'stopStation': st && RR.ops.stopStation(S, st.id); break;
          case 'logHarvest': st && RR.ops.logHarvest(S, st.id, any(), r.int(1, 1e12)); break;
          case 'setFarm': RR.ops.setFarm(S, r.pick(['base', 'bags', 'bonus', 'pg', 'stacking', 'tier', 'notoriety', 'baseType']), r.bool() ? any() : r.int(0, 9)); break;
          case 'applyFix': { const i = RR.validateRoute(route, S.farm).find(x => x.fix); i && RR.ops.applyFix(S, i.fix); break; }
        }
      } catch (e) { if (!(e instanceof RR.UserError)) throw new Error(`semilla ${seed}, paso ${k}, ${op}: ${e.stack}`); }
      // la UI siempre normaliza tras cada operación: el resultado debe ser válido y sobrevivir a guardar/cargar
      S = RR.normState(S);
      const bad = RR.checkInvariants(S);
      assert.deepEqual(bad, [], `semilla ${seed}, paso ${k}, ${op}`);
      assert.deepEqual(RR.checkInvariants(roundtrip(S)), [], `semilla ${seed}, paso ${k}, ${op} (ida y vuelta)`);
      // los cálculos nunca dan NaN
      for (const t of S.farm.tables) { const c = RR.calc(t, S.farm); assert.ok(Number.isFinite(c.cycle) && Number.isFinite(c.perHour), `semilla ${seed} calc`); }
      const sum = RR.routeSummary(S.routes.find(x => x.id === S.cur), S.farm);
      assert.ok(Number.isFinite(sum.total), `semilla ${seed} resumen`);
    }
  }
});

test('propiedad: el estado de cada paso es coherente con sus datos', () => {
  for (let seed = 1; seed <= 500; seed++) {
    const r = rng(seed), route = RR.normRoute(randomRoute(r)), farm = RR.normFarm({ tables: [{ g: r.int(0, 6), p: r.int(0, 6), o: r.int(0, 6) }] });
    const st = RR.statuses(route, farm);
    for (const s of route.steps) {
      const x = st.get(s.id);
      if (s.type !== 'Plantas' && s.target > 0 && s.progress >= s.target) assert.equal(x, 'done', `semilla ${seed}`);
      if (s.type !== 'Plantas' && s.done) assert.equal(x, 'done', `semilla ${seed}`);
      if (x === 'blocked') assert.ok(s.requires.some(id => !RR.isComplete(RR.baseStatus(route.steps.find(y => y.id === id), farm))), `semilla ${seed}`);
      if (x === 'prov') assert.ok(s.type === 'Plantas' && s.down, `semilla ${seed}`);
    }
  }
});
