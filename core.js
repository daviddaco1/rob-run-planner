// Rob Run Planner · núcleo (sin dependencias). Funciona en navegador (file://, WebView2) y en node (tests).
// Todo lo que decide si una ruta es válida, cómo se migra/sanea el estado y cómo se calcula la producción vive aquí;
// la interfaz (ruta-escalado.html) solo pinta y llama a estas funciones.
(function (G) {
  'use strict';
  const SCHEMA = 4;
  const APP_VERSION = '2.4.0';
  const REPO = 'daviddaco1/rob-run-planner'; // actualizaciones: releases de este repo de GitHub
  // ¿La etiqueta de release (p. ej. "v2.1.3") es más nueva que la versión instalada?
  function isNewer(tag, cur = APP_VERSION) {
    const p = v => (/^v?(\d+)\.(\d+)\.(\d+)$/.exec(String(v).trim()) || []).slice(1).map(Number);
    const a = p(tag), b = p(cur);
    if (a.length !== 3 || b.length !== 3) return false;
    for (let i = 0; i < 3; i++) if (a[i] !== b[i]) return a[i] > b[i];
    return false;
  }
  const PHASES = ['Early', 'Mid', 'Late'];
  const TYPES = ['Dinero', 'Comprar', 'Conseguir item', 'Craftear', 'Taller / mejora', 'Título', 'Plantas', 'Reempaquetado', 'Taller químico', 'Otro'];
  const QUAL = { g: 'Verde', p: 'Morada', o: 'Dorada' };
  const RANK = { g: 1, p: 2, o: 3 };
  const LIM = { text: 300, notes: 5000, name: 120, subs: 200, steps: 500, routes: 200, stations: 200, log: 30,
    sims: 40, simGroups: 30, simCount: 50, raids: 40, raidStructs: 60, raidRoutes: 20 };
  const cat = () => G.RR_CATALOG || { items: {}, limits: {}, defaults: {} };

  // ---------- utilidades seguras ----------
  const uid = () => {
    try { const a = new Uint32Array(2); G.crypto.getRandomValues(a); return a[0].toString(36) + a[1].toString(36); }
    catch { return Math.random().toString(36).slice(2, 10) + Date.now().toString(36); }
  };
  const num = (v, min = 0, max = 1e13) => { const n = typeof v === 'number' ? v : typeof v === 'string' && v.trim() !== '' ? Number(v) : NaN;
    return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : min; };
  const int = (v, min = 0, max = 1e9) => Math.floor(num(v, min, max));
  const str = (v, max = LIM.text) => (typeof v === 'string' ? v : typeof v === 'number' ? String(v) : '').replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, '').slice(0, max);
  const bool = v => v === true;
  const clone = o => JSON.parse(JSON.stringify(o));
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const isObj = v => v !== null && typeof v === 'object' && !Array.isArray(v);
  const arr = v => Array.isArray(v) ? v : [];
  const NF = new Intl.NumberFormat('es', { maximumFractionDigits: 0, useGrouping: 'always' });
  const fmtN = n => NF.format(Math.round(Number(n) || 0)); // 7.500 y no 7500

  // ---------- estaciones de producción ----------
  // Las mejoras y sus efectos salen del catálogo; aquí solo se dice qué mejora va en qué estación.
  const KINDS = {
    plant: { short: 'Mesa', label: 'Mesa de cultivo', msg: 'hora de cosechar y replantar', btn: 'Plantado / cosechado ahora',
      item: 'grow_table', upg: ['fan', 'water_pump', 'uv_lamp'] },
    repack: { short: 'Banco', label: 'Banco de contrabando (reempaquetado)', msg: 'cajas reempaquetadas listas', btn: 'Cajas cargadas ahora',
      item: 'contraband_bench', upg: ['label_printer_u', 'label_printer_l'], slotUpg: ['tool_box_e', 'tool_box_l'] },
    chem: { short: 'Lab', label: 'Taller químico', msg: 'lote listo', btn: 'Lote iniciado ahora', item: 'chem_lab', upg: ['evaporator', 'refrigerant'] },
  };
  const CRYSTAL = { u: 'Uncommon', e: 'Epic', l: 'Legendary' };
  const DEF = {
    plant: () => ({ g: 0, p: 0, o: 0 }),
    repack: () => ({ box: '', base: dflt('repack_cycle_min', 30), sell: dflt('repack_sell', 35000), cost: dflt('repack_cost', 10000) }),
    chem: () => ({ reactor: dflt('chem_reactor_tier', 1), freeze: dflt('chem_freeze_min', 30), crystals: 0, quality: 'u', value: 0, cost: dflt('reagent_value', 20000) }),
  };
  const reactorMin = tier => cat().items[`reactor_${tier}`]?.cycle || [60, 53, 45][tier - 1] || 60;
  const notorietyBonus = (who, lvl) => (cat().notoriety?.[who]?.values || [0, 0, 0, 0, 0])[Math.min(5, Math.max(1, lvl || 1)) - 1] || 0;
  function dflt(k, fb) { const d = cat().defaults?.[k]; return typeof d?.value === 'number' ? d.value : fb; }
  const effect = (id, k) => cat().items[id]?.effect?.[k] || 0;
  const maxBush = () => cat().limits?.bushes_per_table?.value || 6;

  // ---------- normalización (nunca lanza) ----------
  function normSub(x) {
    if (typeof x === 'string') return { id: uid(), text: str(x), done: false };
    if (!isObj(x)) return null;
    return { id: str(x.id, 40) || uid(), text: str(x.text), done: bool(x.done) };
  }
  function normStep(x) {
    if (!isObj(x)) return null;
    const type = TYPES.includes(x.type) ? x.type : 'Otro';
    const s = {
      id: str(x.id, 40) || uid(),
      phase: PHASES.includes(x.phase) ? x.phase : 'Early',
      type,
      text: str(x.text),
      target: num(x.target),
      progress: num(x.progress),
      done: bool(x.done),            // marcado a mano (las demás vías de completar se calculan)
      notes: str(x.notes, LIM.notes),
      subs: arr(x.subs).slice(0, LIM.subs).map(normSub).filter(Boolean),
      q: RANK[x.q] ? x.q : 'p',
      down: bool(x.down),
      item: typeof x.item === 'string' && x.item ? str(x.item, 60) : '',
      requires: [...new Set(arr(x.requires).filter(v => typeof v === 'string').map(v => str(v, 40)))],
    };
    if (type === 'Plantas') { s.target = int(s.target, 0, 100000); s.done = false; }
    return s;
  }
  function normRoute(r) {
    if (!isObj(r)) return null;
    const steps = arr(r.steps).slice(0, LIM.steps).map(normStep).filter(Boolean);
    // ids de paso únicos dentro de la ruta
    const seen = new Set();
    for (const s of steps) { if (seen.has(s.id)) s.id = uid(); seen.add(s.id); }
    for (const s of steps) s.requires = s.requires.filter(id => id !== s.id && seen.has(id));
    const out = { id: str(r.id, 40) || uid(), name: str(r.name, LIM.name).trim() || 'Sin nombre', goal: str(r.goal, LIM.text),
      draft: bool(r.draft), have: [...new Set(arr(r.have).filter(v => typeof v === 'string').map(v => str(v, 60)))], steps };
    if (isObj(r.origin) && typeof r.origin.id === 'string') out.origin = { id: str(r.origin.id, 60), version: int(r.origin.version, 0) };
    return out;
  }
  function normStation(t) {
    if (!isObj(t)) return null;
    const kind = KINDS[t.kind] ? t.kind : 'plant';
    const base = DEF[kind]();
    const s = { id: str(t.id, 40) || uid(), kind, name: str(t.name, LIM.name) || KINDS[kind].short, ...base,
      upg: {}, start: null, end: null, notified: false, log: [] };
    for (const k of KINDS[kind].upg) s.upg[k] = bool(t.upg?.[k] ?? t[legacyUpg[k]]);
    if (kind === 'plant') {
      let left = maxBush();
      for (const q of ['o', 'p', 'g']) { s[q] = Math.min(int(t[q]), left); left -= s[q]; } // nunca más de 6 plantas
    } else if (kind === 'repack') {
      s.box = KINDS.repack.slotUpg.includes(t.box) ? t.box : legacyBox[t.box] || '';
      s.base = num(t.base ?? base.base, 0.01, 10000); s.sell = num(t.sell ?? base.sell); s.cost = num(t.cost ?? base.cost);
    } else {
      s.reactor = int(t.reactor ?? base.reactor, 1, 3); s.freeze = num(t.freeze ?? base.freeze, 0, 10000);
      s.crystals = int(t.crystals, 0, 10000); s.quality = CRYSTAL[t.quality] ? t.quality : 'u';
      // v1 tenía «base» (min por lote) y «cost» libre: se respeta como valor manual
      if (t.base !== undefined && t.reactor === undefined) { s.reactor = 1; s.freeze = Math.max(0, num(t.base, 0.01, 10000) - reactorMin(1)); }
      s.value = num(t.value); s.cost = num(t.cost ?? base.cost);
    }
    const st = num(t.start, 0, 9e15), en = num(t.end, 0, 9e15);
    if (st > 0) { s.start = st; s.end = en > st ? en : st + calc(s, null).cycle * 60000; s.notified = bool(t.notified); }
    s.log = arr(t.log).filter(isObj).slice(-LIM.log).map(l => ({ at: num(l.at, 0, 9e15), value: num(l.value) }));
    return s;
  }
  const legacyUpg = { fan: 'fan', water_pump: 'pump', uv_lamp: 'uv', label_printer_u: 'lp1', label_printer_l: 'lp2' };
  const legacyBox = { 0: '', 1: 'tool_box_e', 2: 'tool_box_l', '0': '', '1': 'tool_box_e', '2': 'tool_box_l' };
  function normFarm(f) {
    f = isObj(f) ? f : {};
    const farm = { base: num(f.base ?? dflt('plant_cycle_min', 60), 0.01, 10000), bags: num(f.bags ?? dflt('bags_per_plant', 3), 0, 100),
      bonus: num(f.bonus, 0, 1000), pg: num(f.pg ?? dflt('bag_price_g', 4000)), pp: num(f.pp ?? dflt('bag_price_p', 6000)),
      po: num(f.po ?? dflt('bag_price_o', 8000)), stacking: ['add', 'mult', 'reduce'].includes(f.stacking) ? f.stacking : 'add', tier: int(f.tier ?? 1, 1, 3),
      notoriety: int(f.notoriety ?? 1, 1, 5), baseType: cat().bases?.[f.baseType] ? f.baseType : 'trailer', tables: [] };
    const seen = new Set();
    for (const t of arr(f.tables).slice(0, LIM.stations)) { const s = normStation(t); if (!s) continue; if (seen.has(s.id)) s.id = uid(); seen.add(s.id); farm.tables.push(s); }
    for (const s of farm.tables) if (s.start) s.end = s.end || s.start + calc(s, farm).cycle * 60000;
    return farm;
  }
  // Estado completo v2. Acepta cualquier cosa y devuelve algo válido.
  function normState(s) {
    s = isObj(s) ? s : {};
    const routes = [];
    const seen = new Set();
    for (const r of arr(s.routes).slice(0, LIM.routes)) { const n = normRoute(r); if (!n) continue; if (seen.has(n.id)) n.id = uid(); seen.add(n.id); routes.push(n); }
    if (!routes.length) routes.push(exampleRoute());
    const st = { schema: SCHEMA, routes, cur: routes.some(r => r.id === s.cur) ? s.cur : routes[0].id,
      included: {}, farm: null, farms: {}, farmOf: '', tab: ['ruta', 'granja', 'calc'].includes(s.tab) ? s.tab : 'ruta', sims: [], raids: [] };
    // Escenarios del simulador y bases a raidear (esquema 4). Aislados de rutas y granjas.
    for (const [key, norm, max] of [['sims', normSim, LIM.sims], ['raids', normRaid, LIM.raids]]) {
      const ids = new Set();
      for (const x of arr(s[key]).slice(0, max)) { const n = norm(x); if (!n) continue; if (ids.has(n.id)) n.id = uid(); ids.add(n.id); st[key].push(n); }
    }
    if (isObj(s.included)) for (const [k, v] of Object.entries(s.included)) st.included[str(k, 60)] = int(v, 0);
    // Cada ruta (perfil) tiene su granja. st.farm es la de la ruta activa; las demás van en st.farms[idRuta].
    const has = id => routes.some(r => r.id === id);
    if (isObj(s.farms)) for (const [k, v] of Object.entries(s.farms)) if (has(k)) st.farms[k] = normFarm(v);
    const farmOf = typeof s.farmOf === 'string' ? s.farmOf : st.cur; // antes del esquema 3 había una sola granja: pasa a la ruta activa
    if (has(farmOf)) st.farms[farmOf] = normFarm(s.farm);              // si su ruta se borró, su granja se fue con ella
    swapFarm(st, st.farms[st.cur] || normFarm(null));
    return st;
  }
  function swapFarm(S, farm) { S.farm = farm; delete S.farms[S.cur]; S.farmOf = S.cur; }
  // Tras cambiar S.cur: guarda la granja activa con su ruta y saca la de la nueva ruta activa.
  function syncFarm(S) {
    if (!isObj(S.farms)) S.farms = {};
    for (const k of Object.keys(S.farms)) if (!S.routes.some(r => r.id === k)) delete S.farms[k];
    if (S.farmOf === S.cur) return;
    if (S.routes.some(r => r.id === S.farmOf)) S.farms[S.farmOf] = S.farm;
    swapFarm(S, S.farms[S.cur] || normFarm(null));
  }
  function exampleRoute() {
    return normRoute({ name: 'Ruta ejemplo', goal: 'Título tier 3 con talleres mejorados', steps: [
      { type: 'Dinero', text: 'Farmear dinero inicial', target: 100000 },
      { type: 'Comprar', text: 'Comprar X' },
      { phase: 'Mid', type: 'Dinero', text: 'Farmear para el primer taller', target: 500000 },
      { phase: 'Mid', type: 'Taller / mejora', text: 'Montar taller X' },
      { phase: 'Late', type: 'Título', text: 'Conseguir título tier 3' }] });
  }

  // ---------- migraciones ----------
  // v1 (sin campo schema): done mezclaba "a mano" y "automático", rutas incluidas por nombre (added), mejoras sueltas en la mesa.
  function migrate(raw, bundled = []) {
    const notes = [];
    if (!isObj(raw)) return { state: normState(null), from: null, notes: ['Datos vacíos o ilegibles: empiezo con la ruta de ejemplo.'] };
    const from = int(raw.schema, 1, 1e6);
    if (from > SCHEMA) notes.push(`Los datos son de una versión más nueva de la app (esquema ${from}). Se leen lo mejor posible; actualiza la app.`);
    let src = raw;
    if (from < 2) {
      src = clone(raw);
      for (const r of arr(src.routes)) for (const s of arr(r?.steps)) {
        if (!isObj(s)) continue;
        const subsAll = arr(s.subs).length && arr(s.subs).every(x => isObj(x) ? x.done : false);
        const byTarget = num(s.target) > 0 && num(s.progress) >= num(s.target);
        if (s.type === 'Plantas' || byTarget || subsAll) s.done = false; // ahora se calcula solo
      }
      src.included = {};
      // quien ya tenía una ruta incluida (por nombre) tenía su versión 1: así ve el aviso de versión nueva
      for (const name of arr(src.added)) { const b = bundled.find(x => x.name === name || arr(x.aliases).includes(name)); if (b?.id) src.included[b.id] = 1; }
      notes.push('Datos actualizados al formato 2 (copia de seguridad guardada antes).');
    }
    if (from < 3) {
      const cur = arr(raw.routes).find(r => isObj(r) && r.id === raw.cur) || arr(raw.routes)[0];
      if (arr(raw.farm?.tables).length) notes.push(`Ahora cada ruta tiene su propia granja. La que tenías queda en la ruta «${str(cur?.name, LIM.name) || 'activa'}»; las demás rutas empiezan con la granja vacía.`);
    }
    // 3 → 4: añade escenarios del simulador y bases a raidear, vacíos. Rutas, granjas y temporizadores no cambian.
    if (from < 4 && from >= 3) notes.push('Nuevo en Calculadoras: simulador de farmeo, comparador, optimizador y calculadora de raideos. Tus rutas y granjas siguen igual.');
    return { state: normState(src), from, notes };
  }

  // ---------- estado de cada paso ----------
  // Reglas (en este orden):
  //  Plantas: completada si hay ≥ meta de la calidad pedida; provisional si acepta inferior y hay ≥ meta de cualquier calidad.
  //  Resto:   completada si se marcó a mano, o Meta>0 y Llevo≥Meta, o tiene subtareas y están todas hechas.
  //  bloqueada: no completada y alguno de sus "requires" no está completado.
  //  en progreso: Llevo>0 o alguna subtarea hecha (o alguna planta en Plantas). Si no, pendiente.
  function plantCount(farm, q) {
    return arr(farm?.tables).filter(t => t.kind === 'plant').reduce((a, t) =>
      a + Object.keys(RANK).filter(k => RANK[k] >= RANK[q]).reduce((b, k) => b + (t[k] || 0), 0), 0);
  }
  function baseStatus(s, farm) {
    if (s.type === 'Plantas') {
      const have = plantCount(farm, s.q), any = plantCount(farm, 'g');
      if (s.target > 0 && have >= s.target) return 'done';
      if (s.target > 0 && s.down && any >= s.target) return 'prov';
      if (s.target === 0) return 'done';
      return (s.down ? any : have) > 0 ? 'progress' : 'pending'; // sin «acepta inferior», las de peor calidad no cuentan
    }
    if (s.done) return 'done';
    if (s.target > 0 && s.progress >= s.target) return 'done';
    if (s.subs.length && s.subs.every(x => x.done)) return 'done';
    return s.progress > 0 || s.subs.some(x => x.done) ? 'progress' : 'pending';
  }
  function statuses(route, farm) {
    const base = new Map(route.steps.map(s => [s.id, baseStatus(s, farm)]));
    const out = new Map();
    for (const s of route.steps) {
      const b = base.get(s.id), complete = b === 'done' || b === 'prov';
      out.set(s.id, !complete && s.requires.some(id => !['done', 'prov'].includes(base.get(id))) ? 'blocked' : b);
    }
    return out;
  }
  const ordered = r => PHASES.flatMap(ph => r.steps.filter(s => s.phase === ph));
  const isComplete = st => st === 'done' || st === 'prov';
  function nextStep(route, farm) {
    const st = statuses(route, farm), list = ordered(route);
    return list.find(s => !isComplete(st.get(s.id)) && st.get(s.id) !== 'blocked') || list.find(s => !isComplete(st.get(s.id))) || null;
  }

  // ---------- validación ----------
  // level: 'error' = imposible/inválido (no se puede activar ni exportar como válida),
  //        'warn'  = posible pero dudoso o basado en datos sin confirmar, 'info' = sugerencia.
  function findCycles(route) {
    const req = new Map(route.steps.map(s => [s.id, s.requires]));
    const color = new Map(), cycles = [];
    const visit = (id, path) => {
      color.set(id, 1); path.push(id);
      for (const r of req.get(id) || []) {
        if (color.get(r) === 1) cycles.push(path.slice(path.indexOf(r)));
        else if (!color.get(r)) visit(r, path);
      }
      path.pop(); color.set(id, 2);
    };
    for (const id of req.keys()) if (!color.get(id)) visit(id, []);
    return cycles;
  }
  function validateRoute(route, farm) {
    const C = cat(), issues = [], list = ordered(route), pos = new Map(list.map((s, i) => [s.id, i]));
    const st = statuses(route, farm), byId = new Map(route.steps.map(s => [s.id, s]));
    const add = (level, code, msg, stepId, fix) => issues.push({ level, code, msg, stepId: stepId || null, fix: fix || null });
    const label = s => `#${pos.get(s.id) + 1} «${s.text || '(sin texto)'}»`;

    for (const cyc of findCycles(route)) {
      add('error', 'cycle', `Dependencia circular: ${cyc.map(id => label(byId.get(id))).join(' → ')} → vuelve al inicio. Ninguno podrá empezar.`,
        cyc[0], { kind: 'dropRequire', stepId: cyc[cyc.length - 1], req: cyc[0] });
    }
    for (const s of list) {
      for (const rid of s.requires) {
        const r = byId.get(rid);
        if (!r) continue;
        if (pos.get(rid) > pos.get(s.id) && !isComplete(st.get(rid)) && !isComplete(st.get(s.id)))
          add('error', 'order', `${label(s)} depende de ${label(r)}, que está después en la ruta.`, s.id, { kind: 'moveBefore', stepId: rid, before: s.id });
      }
      if (s.type !== 'Plantas' && s.target > 0 && s.progress > s.target * 10 && s.progress > 1e6)
        add('info', 'overshoot', `${label(s)}: «Llevo» es mucho mayor que la meta. ¿Es correcto?`, s.id);
      if (s.done && s.target > 0 && s.progress < s.target)
        add('info', 'manualDone', `${label(s)} está marcada a mano aunque «Llevo» no llega a la meta.`, s.id);
      if (s.type === 'Plantas') {
        const lim = C.limits || {}, cap = (lim.bushes_per_table?.value || 6) * (lim.tables_per_room?.value || 6) * (lim.rooms_per_base?.value || 0);
        if (s.target === 0) add('warn', 'plantsZero', `${label(s)} pide 0 plantas: se da por completada.`, s.id);
        if (cap && s.target > cap) {
          const confirmed = ['bushes_per_table', 'tables_per_room', 'rooms_per_base'].every(k => lim[k]?.conf === 'confirmado');
          add(confirmed ? 'error' : 'warn', 'plantsCap', `${label(s)} pide ${s.target} plantas y una base admite como máximo ${cap} (${lim.bushes_per_table?.value || 6} por mesa × ${lim.tables_per_room?.value || 6} mesas × ${lim.rooms_per_base?.value} salas)${confirmed ? '' : ', según datos sin confirmar'}.`, s.id);
        }
      }
      // requisitos del catálogo
      if (s.item) {
        const it = C.items[s.item];
        if (!it) { add('warn', 'unknownItem', `${label(s)} hace referencia a «${s.item}», que ya no está en el catálogo. El paso sigue funcionando como texto.`, s.id, { kind: 'clearItem', stepId: s.id }); continue; }
        // tier > 1 = necesitas parcela en un distrito de ese nivel (= título de parcela de ese nivel)
        const reqs = [...new Set([...arr(it.requires), ...(it.tier > 1 && s.item !== `land_title_${it.tier}` ? [`land_title_${it.tier}`] : [])])];
        for (const req of reqs) {
          if (route.have.includes(req)) continue;
          const providers = list.filter(x => x.item === req);
          const ri = C.items[req], rname = ri?.name || req, sure = (ri && it.conf_requires !== 'pendiente') ? it.conf_requires || 'una-fuente' : 'pendiente';
          if (!providers.length) {
            add('warn', 'missingReq', `${label(s)} (${it.name}) necesita «${rname}» y no está en la ruta. Añádelo o márcalo como «Ya lo tengo».`, s.id,
              { kind: 'addReq', stepId: s.id, item: req });
          } else if (providers.every(p => pos.get(p.id) > pos.get(s.id) && !isComplete(st.get(p.id))) && !isComplete(st.get(s.id))) {
            add(sure === 'confirmado' ? 'error' : 'warn', 'reqAfter', `${label(s)} (${it.name}) necesita «${rname}», pero ese paso está después${sure === 'confirmado' ? '' : ' (requisito sin confirmar)'}.`, s.id,
              { kind: 'moveBefore', stepId: providers[0].id, before: s.id });
          }
        }
      }
    }
    // duplicados de compra única
    const once = new Map();
    for (const s of list) if (s.item && C.items[s.item]?.unique) { if (once.has(s.item)) add('info', 'dupItem', `${label(s)} repite «${C.items[s.item].name}», que solo se compra una vez.`, s.id); else once.set(s.item, s); }
    if (!route.steps.length) add('info', 'empty', 'La ruta no tiene pasos todavía. Añade el primero con «+ Añadir paso».', null);
    return issues;
  }
  const errorsOf = issues => issues.filter(i => i.level === 'error');
  // Clave estable de los errores, para saber si una edición añade errores nuevos.
  const errorKeys = issues => new Set(errorsOf(issues).map(i => i.code + '|' + i.stepId + '|' + i.msg));

  function validateFarm(farm) {
    const issues = [], add = (level, code, msg, stationId) => issues.push({ level, code, msg, stationId: stationId || null });
    const C = cat();
    for (const t of farm.tables) {
      const K = KINDS[t.kind];
      const used = K.upg.filter(k => t.upg[k]).concat(t.box ? [t.box] : []).concat(t.kind === 'chem' ? [`reactor_${t.reactor}`] : []);
      for (const k of used) {
        const it = C.items[k];
        if (it?.tier > farm.tier)
          add('warn', 'tier', `${t.name}: ${it.name} es de tier ${it.tier} y tu laptop es tier ${farm.tier}. No podrás comprarla hasta tener parcela en un distrito de nivel ${it.tier}.`, t.id);
      }
      if (t.kind === 'plant' && t.g + t.p + t.o === 0) add('info', 'emptyTable', `${t.name} no tiene plantas: no produce.`, t.id);
      if (t.kind === 'chem' && t.crystals === 0 && t.value === 0) add('info', 'chemNoValue', `${t.name}: apunta cuántos Hard Crystals sacas por lote (o el valor del lote) para ver la ganancia. No hay datos públicos fiables de cantidades.`, t.id);
      if (t.kind === 'repack' && calc(t, farm).harvest <= 0) add('warn', 'repackLoss', `${t.name}: vendes la caja por menos de lo que cuesta.`, t.id);
      if (t.kind === 'chem' && t.crystals > 0 && calc(t, farm).harvest <= 0) add('warn', 'chemLoss', `${t.name}: el lote vale menos que los reactivos que gasta.`, t.id);
      if (!t.start && calc(t, farm).perHour > 0) add('info', 'idle', `${t.name} está parada. Pulsa «${K.btn}» cuando la pongas a producir.`, t.id);
    }
    const base = C.bases?.[farm.baseType], benches = farm.tables.filter(t => t.kind === 'repack').length;
    if (base && benches > base.workbenches)
      add('error', 'benchSlots', `Tienes ${benches} bancos de contrabando y un ${base.name} solo admite ${base.workbenches} banco(s) de trabajo. Cambia de base o quita bancos.`, null);
    const rooms = C.limits?.rooms_per_base, tablesCap = (C.limits?.tables_per_room?.value || 6) * (rooms?.value || 2), tables = farm.tables.filter(t => t.kind === 'plant').length;
    if (rooms && tables > tablesCap)
      add(rooms.conf === 'confirmado' ? 'error' : 'warn', 'tableCap', `Tienes ${tables} mesas; en una base caben ${tablesCap} (${C.limits.tables_per_room.value} por Grow Room × ${rooms.value} salas${rooms.conf === 'confirmado' ? '' : ', máximo de salas sin confirmar'}).`, null);
    if (farm.stacking !== 'mult') add('info', 'stacking', `Las mejoras de velocidad se ${farm.stacking === 'add' ? 'suman y dividen el tiempo (Fan+Pump+UV: 60 → 40 min)' : 'restan del tiempo (Fan+Pump+UV: 60 → 30 min)'}. Kefir no lo ha confirmado: compáralo con tu partida y cámbialo si no cuadra.`, null);
    return issues;
  }

  // ---------- producción ----------
  // Cómo se combinan las mejoras de velocidad (no confirmado por Kefir):
  //  'add'    suma y divide el tiempo: 60 / (1 + 0,12 + 0,14 + 0,24) = 40 min (robrun.pro, wikily)
  //  'mult'   multiplica: 60 / (1,12 × 1,14 × 1,24) ≈ 38 min
  //  'reduce' resta del tiempo: 60 × (1 − 0,50) = 30 min (lectura de wikily/tposegaming)
  function applySpeed(base, effects, mode) {
    if (mode === 'mult') return base / effects.reduce((a, e) => a * (1 + e), 1);
    const sum = effects.reduce((a, e) => a + e, 0);
    return mode === 'reduce' ? base * Math.max(0.05, 1 - sum) : base / (1 + sum);
  }
  function calc(t, farm) {
    const F = farm || normFarm({});
    const K = KINDS[t.kind], on = k => !!t.upg?.[k];
    let cycle, harvest, slots = 1, autonomy;
    if (t.kind === 'plant') {
      cycle = applySpeed(F.base, K.upg.filter(on).map(k => effect(k, 'speed')), F.stacking);
      harvest = (t.g * F.pg + t.p * F.pp + t.o * F.po) * F.bags * (1 + notorietyBonus('fence', F.notoriety) + F.bonus / 100);
    } else if (t.kind === 'repack') {
      // Una caja cada vez (2+ fuentes). La Tool Box añade huecos de cola: más tiempo sin atender, no más velocidad.
      cycle = applySpeed(t.base, K.upg.filter(on).map(k => effect(k, 'speed')), F.stacking);
      slots = 1 + (t.box ? effect(t.box, 'slots') : 0);
      harvest = t.sell * (1 + notorietyBonus('smuggler', F.notoriety)) - t.cost;
      autonomy = slots * cycle;
    } else {
      const freeze = applySpeed(t.freeze, K.upg.filter(on).map(k => effect(k, 'freeze')), F.stacking);
      cycle = reactorMin(t.reactor) + freeze;
      const price = dflt(`crystal_price_${t.quality}`, { u: 30000, e: 45000, l: 75000 }[t.quality]);
      const gross = t.crystals > 0 ? t.crystals * price * (1 + notorietyBonus('smuggler', F.notoriety)) : t.value;
      // sin cristales ni valor apuntados no hay datos: no se inventa una pérdida
      harvest = t.crystals > 0 || t.value > 0 ? gross - t.cost : 0;
      var noData = !(t.crystals > 0 || t.value > 0);
    }
    const real = t.log?.length ? t.log.reduce((a, l) => a + l.value, 0) / t.log.length : null;
    return { cycle, harvest, perHour: cycle > 0 ? harvest * 60 / cycle : 0, slots, autonomy: autonomy ?? cycle, noData: !!noData,
      real, realPerHour: real != null && cycle > 0 ? real * 60 / cycle : null };
  }
  // Coste de compra (sin investigación) de la estación y de sus mejoras puestas.
  function investment(t) {
    const C = cat(), K = KINDS[t.kind], buy = id => C.items[id]?.buy || 0;
    let total = buy(K.item);
    for (const k of K.upg) if (t.upg?.[k]) total += buy(k);
    if (t.box) total += buy(t.box);
    if (t.kind === 'chem') total += buy(`reactor_${t.reactor}`) + buy('freezer_1');
    return total;
  }
  // ¿Qué mejora compensa más? ganancia $/h, coste (compra + investigación si no se ha investigado), horas para recuperarla.
  function upgradeOptions(t, farm) {
    const C = cat(), K = KINDS[t.kind], now = calc(t, farm).perHour, opts = [];
    const tryUp = (key, apply) => {
      const it = C.items[key]; if (!it) return;
      const sim = clone(t); apply(sim);
      const gain = calc(sim, farm).perHour - now, cost = (it.buy || 0);
      opts.push({ key, name: it.name, tier: it.tier || 1, gain, cost, research: it.research || 0, payback: gain > 0 ? cost / gain : null, conf: it.conf || 'pendiente', locked: (it.tier || 1) > farm.tier });
    };
    for (const k of K.upg) if (!t.upg[k]) tryUp(k, s => { s.upg[k] = true; });
    for (const k of K.slotUpg || []) if (t.box !== k && effect(k, 'slots') > (t.box ? effect(t.box, 'slots') : 0)) tryUp(k, s => { s.box = k; });
    if (t.kind === 'chem') for (let r = t.reactor + 1; r <= 3; r++) tryUp(`reactor_${r}`, s => { s.reactor = r; });
    return opts.sort((a, b) => (a.payback ?? Infinity) - (b.payback ?? Infinity));
  }
  function farmTotals(farm) {
    const n = k => farm.tables.filter(t => t.kind === k).length;
    const per = farm.tables.reduce((a, t) => a + calc(t, farm).perHour, 0);
    const running = farm.tables.reduce((a, t) => a + (t.start ? calc(t, farm).perHour : 0), 0);
    return { plant: n('plant'), repack: n('repack'), chem: n('chem'), plants: plantCount(farm, 'g'), perHour: per, runningPerHour: running };
  }
  // Comparador: $/h por cada $ invertido en una estación "tipo" con los valores por defecto.
  function stationComparison(farm) {
    return Object.keys(KINDS).map(kind => {
      const t = normStation({ kind, g: kind === 'plant' ? maxBush() : 0 });
      const c = calc(t, farm), inv = investment(t);
      return { kind, label: KINDS[kind].label, perHour: c.perHour, investment: inv, payback: c.perHour > 0 ? inv / c.perHour : null, noData: c.noData };
    });
  }
  // Coste pendiente de la ruta y tiempo estimado al ritmo actual de la granja.
  function routeSummary(route, farm) {
    const st = statuses(route, farm), C = cat();
    let money = 0, catalogCost = 0;
    const counts = { done: 0, prov: 0, progress: 0, pending: 0, blocked: 0 };
    for (const s of route.steps) {
      const x = st.get(s.id); counts[x]++;
      if (isComplete(x)) continue;
      if (s.type !== 'Plantas' && s.target > 0) money += Math.max(0, s.target - s.progress);
      else if (s.item && C.items[s.item]) catalogCost += (C.items[s.item].research || 0) + (C.items[s.item].buy || 0);
    }
    const rate = farmTotals(farm).perHour;
    return { counts, money, catalogCost, total: money + catalogCost, rate, etaHours: rate > 0 ? (money + catalogCost) / rate : null };
  }
  // Cuellos de botella y sugerencias a partir de la ruta + granja.
  function bottlenecks(route, farm, now = Date.now()) {
    const out = [], st = statuses(route, farm);
    const ready = farm.tables.filter(t => t.start && t.end <= now);
    if (ready.length) out.push(`${ready.length} estación(es) lista(s) sin recoger: estás perdiendo producción.`);
    const plantSteps = route.steps.filter(s => s.type === 'Plantas' && !isComplete(st.get(s.id)));
    const cap = farm.tables.filter(t => t.kind === 'plant').length * maxBush();
    for (const s of plantSteps) if (s.target > cap) { out.push(`«${s.text}» pide ${s.target} plantas y tus mesas solo admiten ${cap}: necesitas ${Math.ceil((s.target - cap) / maxBush())} mesa(s) más.`); break; }
    const best = farm.tables.flatMap(t => upgradeOptions(t, farm).filter(o => !o.locked && o.payback != null).map(o => ({ ...o, station: t.name })))
      .sort((a, b) => a.payback - b.payback)[0];
    if (best) out.push(`Mejora más rentable ahora: ${best.name} en ${best.station} (+$${fmtN(best.gain)}/h, se paga en ${best.payback.toFixed(1)} h).`);
    return out;
  }

  // ---------- simulador de farmeo (escenarios aislados: nunca tocan la granja real) ----------
  const fin = (v, d = 0) => Number.isFinite(v) ? v : d;          // nada de NaN ni Infinity en los resultados
  const div = (a, b, d = null) => b > 0 && Number.isFinite(a) ? a / b : d;
  const FARM_KEYS = ['base', 'bags', 'bonus', 'pg', 'pp', 'po', 'stacking', 'tier', 'notoriety', 'baseType'];
  const INPUT = { repack: 'box', chem: 'reagent' };               // insumo comprado que gasta cada ciclo
  const UNIT = { plant: 'bolsas', repack: 'cajas', chem: 'cristales' };
  function normSimGroup(g) {
    if (!isObj(g)) return null;
    const s = normStation({ ...g, start: 0, end: 0, log: [] }); if (!s) return null;
    delete s.start; delete s.end; delete s.notified; delete s.log;
    s.count = int(g.count ?? 1, 0, LIM.simCount); s.opCost = num(g.opCost, 0, 1e9);
    return s;
  }
  function normSim(x) {
    if (!isObj(x)) return null;
    const f = normFarm({ ...x, tables: [] });
    const opt = v => v === null || v === undefined || v === '' ? null : num(v, 0, 1e6);
    const sim = { id: str(x.id, 40) || uid(), name: str(x.name, LIM.name).trim() || 'Escenario' };
    for (const k of FARM_KEYS) sim[k] = f[k];
    Object.assign(sim, { rooms: int(x.rooms ?? (cat().limits?.rooms_per_base?.value || 2), 1, 20),
      hours: num(x.hours ?? 4, 0.25, 168), active: num(x.active ?? x.hours ?? 4, 0, 168), check: num(x.check ?? 15, 0, 1440),
      supplyBox: opt(x.supplyBox), supplyReagent: opt(x.supplyReagent), stockBox: num(x.stockBox, 0, 1e6), stockReagent: num(x.stockReagent, 0, 1e6),
      research: bool(x.research), goal: num(x.goal ?? 1000000), groups: [] });
    sim.active = Math.min(sim.active, sim.hours);
    if (sim.check > 0 && sim.check < 1) sim.check = 1;
    const seen = new Set();
    for (const g of arr(x.groups).slice(0, LIM.simGroups)) { const s = normSimGroup(g); if (!s) continue; if (seen.has(s.id)) s.id = uid(); seen.add(s.id); sim.groups.push(s); }
    return sim;
  }
  const simParams = sim => FARM_KEYS.reduce((a, k) => (a[k] = sim[k], a), {});
  // Granja equivalente (cada grupo repetido «count» veces) para reutilizar las reglas de validateFarm.
  function simFarm(sim) {
    return { ...simParams(sim), tables: sim.groups.flatMap(g => Array.from({ length: g.count }, () => g)) };
  }
  function validateSim(sim) {
    const issues = [], seen = new Set(), add = (level, code, msg, groupId = null, fix = null) => {
      const k = code + '|' + groupId; if (seen.has(k)) return; seen.add(k); issues.push({ level, code, msg, groupId, fix }); };
    const C = cat(), farm = simFarm(sim);
    for (const i of validateFarm(farm)) if (!['idle', 'stacking', 'tableCap'].includes(i.code)) add(i.level, i.code, i.msg.replace(/^[^:]+: /, ''), i.stationId);
    const rooms = sim.rooms, tables = farm.tables.filter(t => t.kind === 'plant').length, cap = (C.limits?.tables_per_room?.value || 6) * rooms;
    if (tables > cap) add('error', 'tableCap', `Hay ${tables} mesas de cultivo y en ${rooms} Grow Room(s) caben ${cap}. Quita mesas o sube el número de salas.`, null, { kind: 'rooms', value: Math.ceil(tables / (C.limits?.tables_per_room?.value || 6)) });
    const base = C.bases?.[sim.baseType], benches = farm.tables.filter(t => t.kind === 'repack').length;
    if (base && benches > base.workbenches) {
      const better = Object.entries(C.bases).find(([, b]) => b.workbenches >= benches);
      issues.forEach(i => { if (i.code === 'benchSlots') i.fix = better ? { kind: 'baseType', value: better[0] } : null; });
    }
    if (!sim.groups.length) add('info', 'empty', 'Añade estaciones al escenario para ver resultados.');
    for (const g of sim.groups) if (g.count === 0) add('info', 'zero', `${g.name}: cantidad 0, no cuenta en los resultados.`, g.id);
    if (sim.active < sim.hours) add('info', 'away', `Estás ${fmtN(sim.hours - sim.active)} h sin atender: las estaciones terminan lo que tienen en marcha y se paran.`);
    for (const [k, cap2, label] of [['repack', sim.supplyBox, 'cajas de contrabando'], ['chem', sim.supplyReagent, 'lotes de reactivos']])
      if (cap2 === 0 && !(k === 'repack' ? sim.stockBox : sim.stockReagent) && sim.groups.some(g => g.kind === k && g.count))
        add('warn', 'noSupply', `Has puesto 0 ${label} por hora y sin reservas: las estaciones de ese tipo no pueden producir.`);
    return issues;
  }
  // Línea de tiempo de UNA estación. El jugador atiende en t=0 y luego cada «check» min mientras está activo (check 0 = atento siempre).
  // Al atender, rellena la cola: 1 ciclo (mesa, laboratorio) o tantas cajas como huecos (banco + Tool Box). Sin atender, nada se reinicia.
  function stationTimeline(t, F, H, A, check) {
    const c = calc(t, F), cyc = c.cycle, Hm = H * 60, Am = A * 60, slots = t.kind === 'repack' ? c.slots : 1;
    const done = []; let queueEnd = 0, actions = 0, tau = 0;
    if (!(cyc > 0)) return { done, actions, c };
    for (let guard = 0; tau <= Am + 1e-9 && guard < 20000 && done.length < 20000; guard++) {
      const pending = queueEnd > tau + 1e-9 ? Math.ceil((queueEnd - tau) / cyc - 1e-9) : 0, add = slots - pending;
      if (add > 0) { const from = Math.max(queueEnd, tau); actions++; for (let i = 1; i <= add; i++) if (from + i * cyc <= Hm + 1e-9) done.push(from + i * cyc); queueEnd = from + add * cyc; }
      const next = check > 0 ? tau + check : queueEnd;
      if (!(next > tau)) break; tau = next;
    }
    return { done, actions, c };
  }
  function perCycle(g, c, F) {
    const sm = 1 + notorietyBonus('smuggler', F.notoriety);
    if (g.kind === 'plant') return { gross: c.harvest, cost: g.opCost, units: (g.g + g.p + g.o) * F.bags };
    if (g.kind === 'repack') return { gross: g.sell * sm, cost: g.cost + g.opCost, units: 1 };
    return c.noData ? { gross: 0, cost: 0, units: 0, noData: true } : { gross: c.harvest + g.cost, cost: g.cost + g.opCost, units: g.crystals };
  }
  function researchOf(g) {
    const K = KINDS[g.kind], ids = [K.item, ...K.upg.filter(k => g.upg[k])];
    if (g.box) ids.push(g.box); if (g.kind === 'chem') ids.push(`reactor_${g.reactor}`, 'freezer_1');
    return ids;
  }
  function simulate(sim, opts = {}) {
    const C = cat(), F = simParams(sim), H = num(opts.hours ?? sim.hours, 0.25, 168), A = Math.min(sim.active, H), check = sim.check;
    const groups = [], events = [];
    let inv = 0; const research = new Set();
    for (const g of sim.groups) {
      if (!g.count) continue;
      const tl = stationTimeline(g, F, H, A, check), pc = perCycle(g, tl.c, F), net = pc.gross - pc.cost;
      const r = { id: g.id, name: g.name, kind: g.kind, count: g.count, cycle: tl.c.cycle, slots: tl.c.slots, perCycle: pc, net,
        thPerHour: fin(div(net * 60, tl.c.cycle, 0) * g.count), thCycles: fin(div(H * 60, tl.c.cycle, 0) * g.count),
        cycles: 0, gross: 0, cost: 0, units: 0, actions: tl.actions * g.count, noData: !!pc.noData, inv: investment(g) * g.count };
      inv += r.inv; researchOf(g).forEach(id => research.add(id));
      for (const at of tl.done) events.push({ at, r, n: g.count });
      groups.push(r);
    }
    // Insumos comprados: cada ciclo gasta 1 caja (banco) o 1 lote de reactivos (laboratorio). Con tope por hora, los primeros ciclos se llevan el insumo.
    const avail = { box: [sim.stockBox, sim.supplyBox], reagent: [sim.stockReagent, sim.supplyReagent] }, used = { box: 0, reagent: 0 }, short = { box: 0, reagent: 0 };
    events.sort((a, b) => a.at - b.at);
    for (const e of events) {
      const kind = INPUT[e.r.kind]; let n = e.n;
      if (kind) { const [stock, rate] = avail[kind];
        if (rate !== null) { const cap = Math.floor(stock + rate * e.at / 60 + 1e-9) - used[kind]; if (cap < n) { short[kind] += n - Math.max(0, cap); n = Math.max(0, cap); } }
        used[kind] += n; }
      e.r.cycles += n; e.r.gross += n * e.r.perCycle.gross; e.r.cost += n * e.r.perCycle.cost; e.r.units += n * e.r.perCycle.units; e.acc = n;
    }
    const researchCost = sim.research ? [...research].reduce((a, id) => a + (C.items[id]?.research || 0), 0) : 0;
    const investTotal = inv + researchCost;
    const gross = groups.reduce((a, r) => a + r.gross, 0), cost = groups.reduce((a, r) => a + r.cost, 0), net = gross - cost;
    const thPerHour = groups.reduce((a, r) => a + r.thPerHour, 0), structures = groups.reduce((a, r) => a + r.count, 0);
    const effPerHour = fin(net / H), thCycles = groups.reduce((a, r) => a + r.thCycles, 0), cycles = groups.reduce((a, r) => a + r.cycles, 0);
    // curva de beneficio acumulado (efectivo, por ciclos completos) frente a la teórica continua
    const curve = []; let k = 0, acc = 0;
    for (let i = 0; i <= 48; i++) { const tm = H * 60 * i / 48;
      while (k < events.length && events[k].at <= tm + 1e-9) { acc += events[k].acc * (events[k].r.perCycle.gross - events[k].r.perCycle.cost); k++; }
      curve.push({ h: tm / 60, eff: acc - investTotal, th: thPerHour * tm / 60 - investTotal }); }
    const hit = curve.find(p => p.eff >= 0 && investTotal > 0);
    const paybackEff = investTotal <= 0 ? 0 : hit ? hit.h : div(investTotal, effPerHour);
    const benches = groups.filter(r => r.kind === 'repack').reduce((a, r) => a + r.count, 0), tables = groups.filter(r => r.kind === 'plant').reduce((a, r) => a + r.count, 0);
    const bushes = sim.groups.filter(g => g.kind === 'plant').reduce((a, g) => a + (g.g + g.p + g.o) * g.count, 0);
    const base = C.bases?.[sim.baseType], tablesCap = (C.limits?.tables_per_room?.value || 6) * sim.rooms;
    const res = {
      hours: H, active: A, structures, investment: inv, researchCost, investTotal, gross, cost, net,
      grossPerHour: fin(gross / H), costPerHour: fin(cost / H), effPerHour, thPerHour, cycles, thCycles,
      efficiency: thCycles > 0 ? fin(cycles / thCycles) : null, actions: groups.reduce((a, r) => a + r.actions, 0),
      actionsPerHour: fin(groups.reduce((a, r) => a + r.actions, 0) / H),
      paybackTh: div(investTotal, thPerHour), paybackEff, paybackExtrapolated: !hit && investTotal > 0,
      roi: div(net - investTotal, investTotal), perStructure: div(effPerHour, structures), perSlot: div(effPerHour, structures),
      goalHours: div(sim.goal + investTotal, effPerHour),
      inputs: { box: used.box, reagent: used.reagent }, shortage: short, inputCostPerHour: fin(cost / H),
      outputs: groups.reduce((a, r) => (a[UNIT[r.kind]] = (a[UNIT[r.kind]] || 0) + r.units, a), {}),
      capacity: { benches, benchCap: base?.workbenches || 0, tables, tablesCap, bushes, bushCap: tables * maxBush() },
      groups, curve, noData: groups.some(r => r.noData),
    };
    res.bottlenecks = simBottlenecks(sim, res);
    return res;
  }
  function simBottlenecks(sim, r) {
    const out = [];
    if (r.efficiency !== null && r.efficiency < 0.75) out.push({ level: 'warn', msg: `Solo aprovechas el ${Math.round(r.efficiency * 100)}% de la producción teórica: las estaciones esperan a que las atiendas. Revisa más a menudo${sim.groups.some(g => g.kind === 'repack' && !g.box) ? ' o pon Tool Box en los bancos (más cajas en cola)' : ''}.` });
    for (const [k, label] of [['box', 'cajas de contrabando'], ['reagent', 'lotes de reactivos']])
      if (r.shortage[k] > 0) out.push({ level: 'warn', msg: `Faltan ${fmtN(r.shortage[k])} ${label}: con el suministro que pusiste, parte de los ciclos no se hacen (estación ociosa). Sube el suministro o quita estaciones de ese tipo.` });
    if (r.capacity.bushCap > r.capacity.bushes) out.push({ level: 'info', msg: `Tienes ${r.capacity.bushCap - r.capacity.bushes} hueco(s) de planta vacíos en las mesas: plantarlos sube la producción sin comprar mesas.` });
    if (r.capacity.benchCap > r.capacity.benches && r.capacity.benches > 0) out.push({ level: 'info', msg: `Quedan ${r.capacity.benchCap - r.capacity.benches} hueco(s) de banco de trabajo libres en la base.` });
    for (const g of r.groups) {
      if (g.noData) out.push({ level: 'info', msg: `${g.name}: apunta cristales por lote (o el valor del lote); sin eso no se calcula su ganancia.` });
      else if (g.net <= 0) out.push({ level: 'warn', msg: `${g.name}: cada ciclo pierde dinero (${fmtN(g.net)} $). Revisa precios o quítala.` });
    }
    const best = r.groups.map(g => ({ g, h: div(g.net * g.count * 60, g.cycle, 0) })).sort((a, b) => b.h - a.h)[0];
    if (best && r.groups.length > 1) out.push({ level: 'info', msg: `La que más rinde por hora es ${best.g.name} (${fmtN(best.h)} $/h teóricos con ${best.g.count}).` });
    return out;
  }
  const SIM_HOURS = [1, 2, 4, 8, 12, 24];
  const simIntervals = sim => SIM_HOURS.map(h => { const r = simulate(sim, { hours: h }); return { hours: h, net: r.net, effPerHour: r.effPerHour, th: r.thPerHour * h, cycles: r.cycles }; });
  // Comparador: mismos parámetros de tiempo para todos; marca el mejor en cada criterio.
  function compareSims(sims, hours) {
    const rows = sims.map(s => ({ id: s.id, name: s.name, r: simulate(s, { hours }), issues: errorsOf(validateSim(s)) }));
    const pick = (f, better) => { const ok = rows.filter(x => !x.issues.length && Number.isFinite(f(x)) && x.r.structures > 0); if (!ok.length) return null;
      return ok.reduce((a, b) => better(f(b), f(a)) ? b : a).id; };
    const hi = (a, b) => a > b, lo = (a, b) => a < b;
    const best = { profit: pick(x => x.r.effPerHour, hi), invest: pick(x => x.r.investTotal, lo), payback: pick(x => x.r.paybackEff ?? Infinity, lo),
      slot: pick(x => x.r.perSlot ?? -Infinity, hi), inputs: pick(x => x.r.inputCostPerHour, lo), manual: pick(x => x.r.actionsPerHour, lo) };
    return { rows, best };
  }
  // ---------- optimizador ----------
  // Las estaciones no se influyen entre sí (salvo límites de huecos y presupuesto), así que se evalúa cada variante una vez
  // y se combinan sumando. Variantes dominadas (más caras y que rinden menos) se descartan antes de combinar.
  const subsets = list => list.reduce((acc, x) => acc.concat(acc.map(s => [...s, x])), [[]]);
  function optimize(o) {
    const C = cat(), t0 = Date.now(), tier = int(o.tier ?? 1, 1, 3), allowed = id => (C.items[id]?.tier || 1) <= tier && (!o.upgrades || o.upgrades.includes(id));
    const base = normSim({ ...o, name: 'opt', groups: [] }), notes = [];
    const variants = { plant: [], repack: [], chem: [] }, q = ['g', 'p', 'o'].includes(o.quality) ? o.quality : 'g';
    const evalOne = g => { const sim = { ...base, groups: [normSimGroup({ ...g, count: 1 })] }, r = simulate(sim);
      return { g: sim.groups[0], net: r.effPerHour, th: r.thPerHour, inv: r.investment, actions: r.actionsPerHour, research: researchOf(sim.groups[0]), noData: r.noData }; };
    if (o.kinds?.plant !== false) for (const up of subsets(KINDS.plant.upg.filter(allowed))) variants.plant.push(evalOne({ kind: 'plant', [q]: maxBush(), upg: Object.fromEntries(up.map(k => [k, true])) }));
    if (o.kinds?.repack !== false && allowed('contraband_bench')) for (const up of subsets(KINDS.repack.upg.filter(allowed))) for (const box of ['', ...KINDS.repack.slotUpg.filter(allowed)])
      variants.repack.push(evalOne({ kind: 'repack', box, upg: Object.fromEntries(up.map(k => [k, true])) }));
    if (o.kinds?.chem !== false) {
      if (!(num(o.crystals) > 0)) notes.push('Laboratorio fuera: apunta cristales por lote (no hay datos públicos) para incluirlo.');
      else for (const reactor of [1, 2, 3].filter(r => allowed(`reactor_${r}`))) for (const up of subsets(KINDS.chem.upg.filter(allowed)))
        variants.chem.push(evalOne({ kind: 'chem', reactor, crystals: num(o.crystals), quality: o.crystalQ || 'u', upg: Object.fromEntries(up.map(k => [k, true])) }));
    }
    for (const k of Object.keys(variants)) variants[k] = variants[k].filter(v => v.net > 0 && !variants[k].some(w => w !== v && w.inv <= v.inv && w.net >= v.net && w.actions <= v.actions && (w.inv < v.inv || w.net > v.net || w.actions < v.actions)));
    const tablesCap = (C.limits?.tables_per_room?.value || 6) * base.rooms, benchCap = C.bases?.[base.baseType]?.workbenches || 0, labCap = int(o.labs ?? 1, 0, 10);
    const budget = num(o.budget ?? 1e9), maxEval = int(o.maxEval ?? 300000, 10, 2e6), goal = num(o.goal ?? base.goal), start = num(o.start ?? budget);
    const opts = k => [{ v: null, n: 0 }, ...variants[k].flatMap(v => Array.from({ length: k === 'plant' ? tablesCap : k === 'repack' ? benchCap : labCap }, (_, i) => ({ v, n: i + 1 })))];
    const score = { profit: c => c.net, invest: c => c.net > 0 ? -c.inv : -Infinity, payback: c => -div(c.inv, c.net, Infinity), manual: c => c.net / Math.max(0.01, c.actions),
      space: c => c.net / Math.max(1, c.n), goal: c => -div(Math.max(0, goal - (start - c.inv)), c.net, Infinity) }[o.objective] || (c => c.net);
    const top = []; let evals = 0, truncated = false;
    outer: for (const a of opts('plant')) for (const b of opts('repack')) for (const ch of opts('chem')) {
      if (++evals > maxEval) { truncated = true; break outer; }
      const parts = [a, b, ch].filter(p => p.n);
      if (!parts.length) continue;
      const research = new Set(parts.flatMap(p => p.v.research));
      const inv = parts.reduce((s, p) => s + p.v.inv * p.n, 0) + (o.research ? [...research].reduce((s, id) => s + (C.items[id]?.research || 0), 0) : 0);
      if (inv > budget) continue;
      const c = { parts, inv, net: parts.reduce((s, p) => s + p.v.net * p.n, 0), th: parts.reduce((s, p) => s + p.v.th * p.n, 0),
        actions: parts.reduce((s, p) => s + p.v.actions * p.n, 0), n: parts.reduce((s, p) => s + p.n, 0), research: [...research] };
      c.score = score(c); if (!Number.isFinite(c.score)) continue;
      if (top.length < 5 || c.score > top[top.length - 1].score) { top.push(c); top.sort((x, y) => y.score - x.score); if (top.length > 5) top.pop(); }
    }
    if (truncated) notes.push(`Búsqueda cortada tras ${fmtN(maxEval)} combinaciones: el resultado es el mejor encontrado, no necesariamente el óptimo.`);
    const results = top.map(c => {
      const need = new Set(); for (const id of c.research) { const it = C.items[id]; if (it?.tier > 1) need.add(`land_title_${it.tier}`); }
      return { ...c, payback: div(c.inv, c.net), goalHours: div(Math.max(0, goal - (start - c.inv)), c.net),
        groups: c.parts.map(p => ({ ...clone(p.v.g), count: p.n, name: KINDS[p.v.g.kind].short })),
        requires: [...need], why: optWhy(o.objective, c) };
    });
    return { results, evals: Math.min(evals, maxEval), truncated, notes, ms: Date.now() - t0, variants: Object.fromEntries(Object.entries(variants).map(([k, v]) => [k, v.length])) };
  }
  function optWhy(obj, c) {
    const pay = div(c.inv, c.net);
    const base = `${fmtN(c.net)} $/h efectivos con ${c.n} estación(es), inversión ${fmtN(c.inv)} $${pay != null ? `, se paga en ${pay.toFixed(1)} h` : ''}.`;
    return ({ profit: 'Es la que más gana por hora dentro del presupuesto. ', invest: 'Es la más barata que da beneficio. ', payback: 'Es la que antes recupera lo invertido. ',
      manual: 'Es la que más gana por cada vez que tienes que atenderla. ', space: 'Es la que más gana por estación colocada. ', goal: 'Es la que antes llega a tu objetivo de dinero. ' }[obj] || '') + base;
  }

  // ---------- raideos ----------
  const DEC = ['l', 'e', 'u'];
  function normRaid(x) {
    if (!isObj(x)) return null;
    const R = cat().raid || {}, ST = R.structures || {};
    const r = { id: str(x.id, 40) || uid(), name: str(x.name, LIM.name).trim() || 'Base objetivo', structs: [], routes: [],
      inv: { u: int(x.inv?.u, 0, 9999), e: int(x.inv?.e, 0, 9999), l: int(x.inv?.l, 0, 9999) },
      values: { u: x.values?.u == null || x.values?.u === '' ? null : num(x.values.u), e: x.values?.e == null || x.values?.e === '' ? null : num(x.values.e), l: x.values?.l == null || x.values?.l === '' ? null : num(x.values.l) },
      buy: ['u', 'e', 'l'].includes(x.buy) ? x.buy : 'e', barter: x.barter === undefined ? true : bool(x.barter), reserve: num(x.reserve, 0, 500),
      keys: int(x.keys, 0, 999), keyCost: num(x.keyCost), loot: num(x.loot), finance: str(x.finance, 40), notes: str(x.notes, LIM.notes) };
    const seen = new Set();
    for (const s of arr(x.structs).slice(0, LIM.raidStructs)) {
      if (!isObj(s)) continue;
      const kind = ST[s.kind] ? s.kind : 'custom', slots = kind === 'custom' ? 200 : ST[kind].fuseSlots;
      const o = { id: str(s.id, 40) || uid(), kind, name: str(s.name, LIM.name), defense: kind === 'custom' ? int(s.defense, 0, 2000) : ST[kind].defense,
        fu: 0, fe: 0, fl: 0, bonus: bool(s.bonus), safes: int(s.safes, 0, 99), note: str(s.note) };
      let left = slots; for (const k of ['fl', 'fe', 'fu']) { o[k] = Math.min(int(s[k], 0, 999), left); left -= o[k]; } // nunca más fusibles que huecos
      if (seen.has(o.id)) o.id = uid(); seen.add(o.id); r.structs.push(o);
    }
    const ids = new Set(r.structs.map(s => s.id)), rseen = new Set();
    for (const p of arr(x.routes).slice(0, LIM.raidRoutes)) {
      if (!isObj(p)) continue;
      const o = { id: str(p.id, 40) || uid(), name: str(p.name, LIM.name).trim() || 'Ruta', steps: [...new Set(arr(p.steps).filter(v => ids.has(v)))] };
      if (rseen.has(o.id)) o.id = uid(); rseen.add(o.id); r.routes.push(o);
    }
    return r; // finance: id de un escenario del simulador (o '' = la granja real); si ya no existe, la UI usa la granja real
  }
  const structInfo = s => { const ST = cat().raid?.structures || {}; return s.kind === 'custom' ? { name: s.name || 'Estructura', defense: s.defense, fuseSlots: 200, conf: 'jugador' } : ST[s.kind]; };
  function structDefense(s) {
    const R = cat().raid || {}, F = R.fuses || {};
    return structInfo(s).defense + s.fu * (F.u?.points ?? 1) + s.fe * (F.e?.points ?? 3) + s.fl * (F.l?.points ?? 5) + (s.bonus ? R.settlementBonus?.value || 0 : 0);
  }
  const decInfo = () => cat().raid?.decoders || { u: { points: 1, value: 1000 }, e: { points: 3, value: 5000 }, l: { points: 5, value: 40000 } };
  const decValue = (raid, k) => raid.values[k] ?? decInfo()[k].value;
  // Coste de conseguir un decodificador que falta: el Epic por trueque son 3 Uncommon + $10.000 (si se permite); el resto, su valor.
  function acquireCost(raid, k) {
    const b = decInfo().e.barter;
    return k === 'e' && raid.barter && b ? b.u * decValue(raid, 'u') + b.cash : decValue(raid, k);
  }
  // Mejor reparto para una defensa D con el inventario dado: primero lo que ya tienes (sin desperdiciar puntos si se puede), lo que falte del tipo «buy».
  function planStructure(D, inv, raid) {
    const P = { u: decInfo().u.points, e: decInfo().e.points, l: decInfo().l.points }, buy = raid.buy;
    let best = null;
    for (let nl = 0; nl <= Math.min(inv.l, Math.ceil(D / P.l)); nl++)
      for (let ne = 0; ne <= Math.min(inv.e, Math.ceil(Math.max(0, D - nl * P.l) / P.e)); ne++) {
        const rest = Math.max(0, D - nl * P.l - ne * P.e), nu = Math.min(inv.u, Math.ceil(rest / P.u)), left = Math.max(0, rest - nu * P.u);
        const miss = Math.ceil(left / P[buy]), pts = nl * P.l + ne * P.e + nu * P.u + miss * P[buy];
        const cost = nl * decValue(raid, 'l') + ne * decValue(raid, 'e') + nu * decValue(raid, 'u') + miss * acquireCost(raid, buy);
        const c = { use: { l: nl, e: ne, u: nu }, miss: { u: 0, e: 0, l: 0, [buy]: miss }, waste: pts - D, cost, count: nl + ne + nu + miss };
        if (!best || c.cost < best.cost - 1e-9 || Math.abs(c.cost - best.cost) < 1e-9 && (c.waste < best.waste || c.waste === best.waste && c.count < best.count)) best = c;
      }
    return best || { use: { l: 0, e: 0, u: 0 }, miss: { u: 0, e: 0, l: 0 }, waste: 0, cost: 0, count: 0 };
  }
  function raidPlan(raid, routeId) {
    const R = cat().raid || {}, sec = R.secondsPerDecoder?.value || 12, P = { u: decInfo().u.points, e: decInfo().e.points, l: decInfo().l.points };
    const path = routeId ? raid.routes.find(p => p.id === routeId)?.steps.map(id => raid.structs.find(s => s.id === id)).filter(Boolean) : raid.structs;
    const inv = { ...raid.inv }, rows = [], tot = { use: { u: 0, e: 0, l: 0 }, miss: { u: 0, e: 0, l: 0 }, cost: 0, waste: 0, seconds: 0, defense: 0, min: 0, safes: 0 };
    for (const s of path || []) {
      const D = structDefense(s), p = planStructure(D, inv, raid);
      for (const k of DEC) { inv[k] -= p.use[k]; tot.use[k] += p.use[k]; tot.miss[k] += p.miss[k]; }
      const n = p.count; tot.cost += p.cost; tot.waste += p.waste; tot.seconds += n * sec; tot.defense += D; tot.min += Math.ceil(D / P.l); tot.safes += s.safes;
      rows.push({ id: s.id, kind: s.kind, name: s.name || structInfo(s).name, defense: D, ...p, seconds: n * sec, safes: s.safes, conf: structInfo(s).conf });
    }
    // reserva: un % del total de decodificadores del plan, en el tipo que compras
    const missType = raid.buy, missing = tot.miss[missType], reserve = Math.ceil((DEC.reduce((a, k) => a + tot.use[k] + tot.miss[k], 0)) * raid.reserve / 100 - 1e-9);
    const keysMissing = Math.max(0, tot.safes - raid.keys), keysCost = keysMissing * raid.keyCost;
    const invValue = DEC.reduce((a, k) => a + tot.use[k] * decValue(raid, k), 0);
    const extra = missing * acquireCost(raid, missType) + reserve * acquireCost(raid, missType) + keysCost; // dinero que hay que poner
    const total = invValue + extra;                                                                       // incluye el valor de lo que gastas del inventario
    const b = decInfo().e.barter, materials = missType === 'e' && raid.barter && b ? { u: (missing + reserve) * b.u, cash: (missing + reserve) * b.cash } : null;
    const warnings = [];
    const F = R.formula; if (F?.conf && F.conf !== 'confirmado') warnings.push(`Fórmula no confirmada por Kefir: ${F.notes}`);
    if (missType === 'l' && missing) warnings.push('No hay una forma conocida y fiable de conseguir Decoders Legendary: planifica con Epic o Uncommon.');
    if (rows.some(r => r.conf === 'jugador')) warnings.push('Hay estructuras con defensa puesta a mano: el cálculo depende de ese dato.');
    if (tot.safes && !raid.keyCost) warnings.push('Las cajas fuertes necesitan Master Key y su precio no está publicado: apunta lo que te cuesta.');
    if (R.accessMinutes) warnings.push(`Tras abrir, el dueño puede reparar y echarte; las fuentes dan ${R.accessMinutes.value} min de margen (${R.accessMinutes.alt}).`);
    const lootProfit = raid.loot ? { loot: raid.loot, profit: raid.loot - total, roi: div(raid.loot - total, total), breakeven: total } : null;
    return { rows, tot, missing: tot.miss, reserve, reserveType: missType, keysMissing, keysCost, invValue, extra, total, materials,
      minTheoretical: tot.min, feasible: !missing && !keysMissing, seconds: tot.seconds, warnings, lootProfit };
  }
  function compareRaidRoutes(raid) {
    const rows = (raid.routes.length ? raid.routes : [{ id: '', name: 'Todas las estructuras', steps: raid.structs.map(s => s.id) }]).map(p => ({ id: p.id, name: p.name, plan: raidPlan(raid, p.id || null) }));
    const best = (f, lo = true) => rows.length ? rows.reduce((a, b) => (lo ? f(b) < f(a) : f(b) > f(a)) ? b : a).id : null;
    return { rows, best: { decoders: best(x => x.plan.tot.use.u + x.plan.tot.use.e + x.plan.tot.use.l + x.plan.missing.u + x.plan.missing.e + x.plan.missing.l), cost: best(x => x.plan.total),
      time: best(x => x.plan.seconds), feasible: rows.filter(x => x.plan.feasible).map(x => x.id) } };
  }

  // ---------- operaciones (mutan el estado que reciben; la UI las aplica sobre una copia) ----------
  const route = (S, id = S.cur) => S.routes.find(r => r.id === id) || S.routes[0];
  const ops = {
    addStep(S, phase, partial = {}) { const r = route(S); if (r.steps.length >= LIM.steps) throw new UserError(`Máximo ${LIM.steps} pasos por ruta.`);
      const s = normStep({ type: 'Dinero', ...partial, phase, id: uid() }); r.steps.push(s); return s; },
    dependents(S, id) { return route(S).steps.filter(s => s.requires.includes(id)); },
    deleteStep(S, id) { const r = route(S); r.steps = r.steps.filter(s => s.id !== id); for (const s of r.steps) s.requires = s.requires.filter(x => x !== id); },
    duplicateStep(S, id) { const r = route(S), i = r.steps.findIndex(s => s.id === id); if (i < 0) return null;
      const c = normStep({ ...clone(r.steps[i]), id: uid(), done: false, progress: 0, subs: r.steps[i].subs.map(x => ({ text: x.text })) });
      r.steps.splice(i + 1, 0, c); return c; },
    moveStep(S, id, dir) { const r = route(S), i = r.steps.findIndex(s => s.id === id); if (i < 0) return;
      const same = r.steps.map((x, k) => x.phase === r.steps[i].phase ? k : -1).filter(k => k >= 0);
      const j = same[same.indexOf(i) + (dir < 0 ? -1 : 1)]; if (j !== undefined) [r.steps[i], r.steps[j]] = [r.steps[j], r.steps[i]]; },
    // Coloca el paso `id` justo antes de `before` (cambiando de fase si hace falta).
    moveBefore(S, id, before) { const r = route(S), s = r.steps.find(x => x.id === id), b = r.steps.find(x => x.id === before); if (!s || !b || s === b) return;
      r.steps = r.steps.filter(x => x !== s); s.phase = b.phase; r.steps.splice(r.steps.indexOf(b), 0, s); },
    setStep(S, id, field, value) {
      const r = route(S), s = r.steps.find(x => x.id === id); if (!s) return;
      const raw = { ...s, [field]: value };
      if (field === 'type' && value === 'Plantas') raw.target = int(s.target, 0, 100000);
      if (field === 'type' && s.type === 'Plantas' && value !== 'Plantas') raw.done = false;
      Object.assign(s, normStep(raw), { id: s.id });
      if (field === 'requires') s.requires = s.requires.filter(x => x !== id && r.steps.some(y => y.id === x));
    },
    addSub(S, id, text = '') { const s = route(S).steps.find(x => x.id === id); if (s && s.subs.length < LIM.subs) s.subs.push({ id: uid(), text: str(text), done: false }); },
    setSub(S, id, sid, field, value) { const s = route(S).steps.find(x => x.id === id), x = s?.subs.find(y => y.id === sid); if (!x) return;
      if (field === 'done') x.done = !!value; else if (field === 'text') x.text = str(value); },
    delSub(S, id, sid) { const s = route(S).steps.find(x => x.id === id); if (s) s.subs = s.subs.filter(x => x.id !== sid); },
    newRoute(S, name) { const r = normRoute({ name, steps: [] }); S.routes.push(r); S.cur = r.id; syncFarm(S); return r; },
    newWipe(S) { const src = route(S);
      const r = normRoute({ ...clone(src), id: uid(), origin: undefined, name: `${src.name} · wipe ${new Date().toLocaleDateString('es')}`.slice(0, LIM.name),
        steps: src.steps.map(s => ({ ...s, progress: 0, done: false, subs: s.subs.map(x => ({ ...x, done: false })) })) });
      // mantener las referencias entre pasos: normRoute conserva los ids de paso de la copia
      S.routes.push(r); S.cur = r.id; syncFarm(S); return r; }, // wipe nuevo: granja vacía
    duplicateRoute(S, id, suffix = ' (copia)') { const src = route(S, id); const r = normRoute({ ...clone(src), id: uid(), origin: undefined, name: (src.name + suffix).slice(0, LIM.name) });
      const farm = src.id === S.cur ? S.farm : S.farms[src.id];
      S.routes.push(r); S.cur = r.id; syncFarm(S);
      if (farm) S.farm = normFarm({ ...clone(farm), tables: farm.tables.map(t => ({ ...t, id: undefined, start: 0, end: 0 })) }); // copia la granja, con los temporizadores parados
      return r; },
    deleteRoute(S, id) { if (S.routes.length < 2) throw new UserError('Debe quedar al menos una ruta. Crea otra antes de borrar esta.');
      S.routes = S.routes.filter(r => r.id !== id); if (!S.routes.some(r => r.id === S.cur)) S.cur = S.routes[0].id; syncFarm(S); },
    setRoute(S, field, value) { const r = route(S);
      if (field === 'name') r.name = str(value, LIM.name).trim() || 'Sin nombre';
      else if (field === 'goal') r.goal = str(value);
      else if (field === 'have') r.have = [...new Set(arr(value).map(v => str(v, 60)))];
      else if (field === 'draft') r.draft = !!value; },
    setCur(S, id) { if (S.routes.some(r => r.id === id)) { S.cur = id; syncFarm(S); } },
    // Estaciones
    addStation(S, kind) { const f = S.farm; if (f.tables.length >= LIM.stations) throw new UserError(`Máximo ${LIM.stations} estaciones.`);
      const t = normStation({ kind, name: `${KINDS[kind].short} ${f.tables.filter(x => x.kind === kind).length + 1}` }); f.tables.push(t); return t; },
    deleteStation(S, id) { S.farm.tables = S.farm.tables.filter(t => t.id !== id); },
    // Cambiar mejoras con el temporizador en marcha NO mueve el final del ciclo actual: se aplica en el siguiente.
    setStation(S, id, field, value) { const t = S.farm.tables.find(x => x.id === id); if (!t) return;
      const keep = { start: t.start, end: t.end, notified: t.notified, log: t.log };
      const raw = clone(t);
      if (KINDS[t.kind].upg.includes(field)) raw.upg[field] = !!value;
      else if (t.kind === 'plant' && field in RANK) { const others = Object.keys(RANK).filter(k => k !== field).reduce((a, k) => a + t[k], 0); raw[field] = Math.min(int(value), maxBush() - others); }
      else raw[field] = value;
      Object.assign(t, normStation(raw), keep, { id: t.id }); },
    startStation(S, id, now = Date.now()) { const t = S.farm.tables.find(x => x.id === id); if (!t) return; t.start = now; t.end = now + calc(t, S.farm).cycle * 60000; t.notified = false; },
    stopStation(S, id) { const t = S.farm.tables.find(x => x.id === id); if (t) { t.start = null; t.end = null; t.notified = false; } },
    logHarvest(S, id, value, now = Date.now()) { const t = S.farm.tables.find(x => x.id === id); if (!t) return; t.log.push({ at: now, value: num(value) }); t.log = t.log.slice(-LIM.log); },
    setFarm(S, field, value) { const f = S.farm, raw = { ...f, [field]: value }; const n = normFarm(raw); for (const k of ['base', 'bags', 'bonus', 'pg', 'pp', 'po', 'stacking', 'tier', 'notoriety', 'baseType']) f[k] = n[k]; },
    // Escenarios del simulador: copias independientes, nunca tocan S.farm ni sus temporizadores.
    addSim(S, name = 'Escenario nuevo') { if (S.sims.length >= LIM.sims) throw new UserError(`Máximo ${LIM.sims} escenarios.`);
      const s = normSim({ ...simParams(S.farm), name: str(name, LIM.name) || 'Escenario nuevo' }); S.sims.push(s); return s; },
    addSimFromFarm(S, name) { if (S.sims.length >= LIM.sims) throw new UserError(`Máximo ${LIM.sims} escenarios.`);
      const groups = S.farm.tables.slice(0, LIM.simGroups).map(t => ({ ...clone(t), id: uid(), count: 1 }));
      const s = normSim({ ...simParams(S.farm), name: name || `Copia de la granja · ${route(S).name}`, groups }); S.sims.push(s); return s; },
    setSim(S, id, field, value) { const s = S.sims.find(x => x.id === id); if (!s || ['id', 'groups'].includes(field)) return;
      Object.assign(s, normSim({ ...s, [field]: value }), { id: s.id, groups: s.groups }); },
    dupSim(S, id) { const s = S.sims.find(x => x.id === id); if (!s) return null; if (S.sims.length >= LIM.sims) throw new UserError(`Máximo ${LIM.sims} escenarios.`);
      const c = normSim({ ...clone(s), id: uid(), name: `${s.name} (copia)`.slice(0, LIM.name), groups: s.groups.map(g => ({ ...clone(g), id: uid() })) });
      S.sims.splice(S.sims.indexOf(s) + 1, 0, c); return c; },
    delSim(S, id) { S.sims = S.sims.filter(x => x.id !== id); for (const r of S.raids) if (r.finance === id) r.finance = ''; },
    addSimGroup(S, id, kind) { const s = S.sims.find(x => x.id === id); if (!s) return null;
      if (s.groups.length >= LIM.simGroups) throw new UserError(`Máximo ${LIM.simGroups} grupos por escenario.`);
      const g = normSimGroup({ kind, name: `${KINDS[kind]?.short || 'Estación'} ${s.groups.filter(x => x.kind === kind).length + 1}`, count: 1 }); s.groups.push(g); return g; },
    setSimGroup(S, id, gid, field, value) { const s = S.sims.find(x => x.id === id), g = s?.groups.find(x => x.id === gid); if (!g) return;
      const raw = clone(g);
      if (KINDS[g.kind].upg.includes(field)) raw.upg[field] = !!value;
      else if (g.kind === 'plant' && field in RANK) { const others = Object.keys(RANK).filter(k => k !== field).reduce((a, k) => a + g[k], 0); raw[field] = Math.min(int(value), maxBush() - others); }
      else raw[field] = value;
      Object.assign(g, normSimGroup(raw), { id: g.id }); },
    delSimGroup(S, id, gid) { const s = S.sims.find(x => x.id === id); if (s) s.groups = s.groups.filter(g => g.id !== gid); },
    // Aplica una propuesta del optimizador como escenario nuevo (no toca la granja).
    addSimFromPlan(S, name, base, groups) { if (S.sims.length >= LIM.sims) throw new UserError(`Máximo ${LIM.sims} escenarios.`);
      const s = normSim({ ...base, id: uid(), name, groups: groups.map(g => ({ ...clone(g), id: uid() })) }); S.sims.push(s); return s; },
    // Bases a raidear
    addRaid(S, name = 'Base objetivo') { if (S.raids.length >= LIM.raids) throw new UserError(`Máximo ${LIM.raids} bases guardadas.`);
      const r = normRaid({ name }); S.raids.push(r); return r; },
    setRaid(S, id, field, value) { const r = S.raids.find(x => x.id === id); if (!r || ['id', 'structs', 'routes'].includes(field)) return;
      Object.assign(r, normRaid({ ...r, [field]: value }), { id: r.id, structs: r.structs, routes: r.routes }); },
    dupRaid(S, id) { const r = S.raids.find(x => x.id === id); if (!r) return null; if (S.raids.length >= LIM.raids) throw new UserError(`Máximo ${LIM.raids} bases guardadas.`);
      const c = normRaid({ ...clone(r), id: uid(), name: `${r.name} (copia)`.slice(0, LIM.name) }); S.raids.splice(S.raids.indexOf(r) + 1, 0, c); return c; },
    delRaid(S, id) { S.raids = S.raids.filter(x => x.id !== id); },
    addRaidStruct(S, id, kind) { const r = S.raids.find(x => x.id === id); if (!r) return null;
      if (r.structs.length >= LIM.raidStructs) throw new UserError(`Máximo ${LIM.raidStructs} estructuras por base.`);
      const s = normRaid({ structs: [{ kind }] }).structs[0]; r.structs.push(s); for (const p of r.routes) p.steps.push(s.id); return s; },
    setRaidStruct(S, id, sid, field, value) { const r = S.raids.find(x => x.id === id), s = r?.structs.find(x => x.id === sid); if (!s) return;
      if (['fu', 'fe', 'fl'].includes(field)) { const slots = structInfo(s).fuseSlots, others = ['fu', 'fe', 'fl'].filter(k => k !== field).reduce((a, k) => a + s[k], 0);
        if (int(value, 0, 999) + others > slots) throw new UserError(`${structInfo(s).name} admite ${slots} fusibles en total y ya tiene ${others} de otros tipos. Quita alguno antes o pon como mucho ${slots - others}.`); }
      const n = normRaid({ structs: [{ ...s, [field]: value }] }).structs[0]; Object.assign(s, n, { id: s.id }); },
    dupRaidStruct(S, id, sid) { const r = S.raids.find(x => x.id === id), i = r?.structs.findIndex(x => x.id === sid); if (!r || i < 0) return null;
      if (r.structs.length >= LIM.raidStructs) throw new UserError(`Máximo ${LIM.raidStructs} estructuras por base.`);
      const c = normRaid({ structs: [{ ...clone(r.structs[i]), id: uid() }] }).structs[0]; r.structs.splice(i + 1, 0, c); return c; },
    moveRaidStruct(S, id, sid, dir) { const r = S.raids.find(x => x.id === id), i = r?.structs.findIndex(x => x.id === sid); if (!r || i < 0) return;
      const j = i + (dir < 0 ? -1 : 1); if (j >= 0 && j < r.structs.length) [r.structs[i], r.structs[j]] = [r.structs[j], r.structs[i]]; },
    delRaidStruct(S, id, sid) { const r = S.raids.find(x => x.id === id); if (!r) return; r.structs = r.structs.filter(x => x.id !== sid); for (const p of r.routes) p.steps = p.steps.filter(x => x !== sid); },
    addRaidRoute(S, id, name) { const r = S.raids.find(x => x.id === id); if (!r) return null; if (r.routes.length >= LIM.raidRoutes) throw new UserError(`Máximo ${LIM.raidRoutes} rutas por base.`);
      const p = { id: uid(), name: str(name, LIM.name) || `Ruta ${r.routes.length + 1}`, steps: r.structs.map(s => s.id) }; r.routes.push(p); return p; },
    setRaidRoute(S, id, pid, field, value) { const r = S.raids.find(x => x.id === id), p = r?.routes.find(x => x.id === pid); if (!p) return;
      if (field === 'name') p.name = str(value, LIM.name).trim() || 'Ruta';
      else if (field === 'toggle') p.steps = p.steps.includes(value) ? p.steps.filter(x => x !== value) : r.structs.filter(s => p.steps.includes(s.id) || s.id === value).map(s => s.id); },
    delRaidRoute(S, id, pid) { const r = S.raids.find(x => x.id === id); if (r) r.routes = r.routes.filter(p => p.id !== pid); },
    // Arreglos sugeridos por la validación
    applyFix(S, fix) {
      if (!fix) return;
      if (fix.kind === 'moveBefore') ops.moveBefore(S, fix.stepId, fix.before);
      else if (fix.kind === 'dropRequire') { const s = route(S).steps.find(x => x.id === fix.stepId); if (s) s.requires = s.requires.filter(x => x !== fix.req); }
      else if (fix.kind === 'clearItem') { const s = route(S).steps.find(x => x.id === fix.stepId); if (s) s.item = ''; }
      else if (fix.kind === 'have') { const r = route(S); if (!r.have.includes(fix.item)) r.have.push(fix.item); }
      else if (fix.kind === 'addReq') {
        const r = route(S), s = r.steps.find(x => x.id === fix.stepId), it = cat().items[fix.item]; if (!s || !it) return;
        const n = normStep({ id: uid(), phase: s.phase, type: it.type || 'Comprar', text: it.name, item: fix.item, target: (it.research || 0) + (it.buy || 0),
          notes: itemNote(fix.item), subs: itemSubs(fix.item) });
        r.steps.splice(r.steps.indexOf(s), 0, n); s.requires = [...new Set([...s.requires, n.id])];
      }
    },
  };
  function itemNote(id) { const it = cat().items[id]; if (!it) return '';
    const p = [it.research ? `investigación $${fmtN(it.research)}` : '', it.buy ? `compra $${fmtN(it.buy)}` : '', it.tier ? `tier ${it.tier}` : ''].filter(Boolean).join(' · ');
    return `${p}${it.where ? '. ' + it.where : ''}${it.conf && it.conf !== 'confirmado' ? ` (dato ${it.conf})` : ''}`; }
  function itemSubs(id) { const it = cat().items[id]; if (!it) return [];
    return [it.research ? `Investigar ${it.name} ($${fmtN(it.research)})` : '', it.buy ? `Comprar ${it.name} ($${fmtN(it.buy)})` : ''].filter(Boolean); }
  class UserError extends Error {}

  // ---------- importar / exportar ----------
  // Devuelve rutas listas para añadir (ids nuevos) y un informe. Nunca lanza con JSON malformado.
  function parseImport(text, farm) {
    let data;
    try { data = JSON.parse(String(text).replace(/^﻿/, '')); } catch (e) { return { ok: false, routes: [], report: [`No es un JSON válido: ${e.message}`] }; }
    const report = [];
    let list;
    if (isObj(data) && Array.isArray(data.routes)) list = data.routes;
    else if (Array.isArray(data)) list = data;
    else if (isObj(data) && Array.isArray(data.steps)) list = [data];
    else return { ok: false, routes: [], report: ['El archivo no tiene rutas: hace falta {"name", "steps": [...]} o {"routes": [...]}.'] };
    const full = isObj(data) && Array.isArray(data.routes) && isObj(data.farm) ? data : null;
    const routes = [];
    list.slice(0, LIM.routes).forEach((raw, i) => {
      if (!isObj(raw) || !Array.isArray(raw.steps)) { report.push(`Ruta ${i + 1}: ignorada (le falta "steps").`); return; }
      const dropped = raw.steps.filter(s => !isObj(s)).length;
      const r = normRoute({ ...raw, id: uid() });
      // ids de paso nuevos manteniendo las dependencias internas
      const map = new Map(r.steps.map(s => [s.id, uid()]));
      for (const s of r.steps) { s.id = map.get(s.id); s.requires = s.requires.map(x => map.get(x)).filter(Boolean); }
      for (const s of r.steps) for (const x of s.subs) x.id = uid();
      if (dropped) report.push(`«${r.name}»: ${dropped} paso(s) no válidos descartados.`);
      const bad = raw.steps.filter(s => isObj(s) && (s.type && !TYPES.includes(s.type) || s.phase && !PHASES.includes(s.phase))).length;
      if (bad) report.push(`«${r.name}»: ${bad} paso(s) con tipo o fase desconocidos (se pusieron como «Otro» / «Early»).`);
      const errs = errorsOf(validateRoute(r, farm));
      if (errs.length) { r.draft = true; report.push(`«${r.name}»: ${errs.length} error(es); se importa como borrador hasta que los corrijas.`); }
      routes.push(r);
    });
    return { ok: routes.length > 0, routes, report, full };
  }
  function exportRoute(r) {
    const strip = s => ({ phase: s.phase, type: s.type, text: s.text, ...(s.target ? { target: s.target } : {}), ...(s.progress ? { progress: s.progress } : {}),
      ...(s.done ? { done: true } : {}), ...(s.notes ? { notes: s.notes } : {}), ...(s.subs.length ? { subs: s.subs.map(x => x.done ? { text: x.text, done: true } : x.text) } : {}),
      ...(s.type === 'Plantas' ? { q: s.q, down: s.down } : {}), ...(s.item ? { item: s.item } : {}), ...(s.requires.length ? { requires: s.requires } : {}), id: s.id });
    return { format: 'robrun-ruta', schema: SCHEMA, name: r.name, goal: r.goal, ...(r.draft ? { draft: true } : {}), ...(r.have.length ? { have: r.have } : {}), steps: r.steps.map(strip) };
  }

  // ---------- rutas incluidas (id estable + versión) ----------
  function syncIncluded(S, bundled) {
    const notes = [], fresh = !Object.keys(S.included).length; // solo la primera vez se elige ruta activa
    for (const b of arr(bundled)) {
      if (!isObj(b) || typeof b.id !== 'string') continue;
      const v = int(b.version, 1), have = S.included[b.id];
      if (have === undefined) {
        const [r] = parseImport(JSON.stringify(b), S.farm).routes; if (!r) continue;
        r.origin = { id: b.id, version: v }; S.routes.push(r); S.included[b.id] = v;
        if (fresh && !notes.length) { S.cur = r.id; syncFarm(S); }
        notes.push({ kind: 'added', id: b.id, name: r.name });
      } else if (v > have) notes.push({ kind: 'update', id: b.id, name: str(b.name, LIM.name), version: v });
    }
    return notes;
  }
  // Añade la versión nueva como ruta aparte (nunca pisa el progreso de la anterior).
  function addIncludedVersion(S, b) {
    const [r] = parseImport(JSON.stringify(b), S.farm).routes; if (!r) return null;
    r.origin = { id: b.id, version: int(b.version, 1) }; r.name = `${r.name} (v${r.origin.version})`.slice(0, LIM.name);
    S.routes.push(r); S.cur = r.id; S.included[b.id] = r.origin.version; return r;
  }

  // ---------- temporizadores ----------
  // Acepta una granja o el estado completo (todas las granjas: la producción sigue aunque cambies de ruta).
  function timerList(x) {
    const farms = Array.isArray(x?.tables) ? [[x, '']] : [[x.farm, ''], ...Object.entries(x.farms || {}).map(([id, f]) => [f, x.routes.find(r => r.id === id)?.name || ''])];
    return farms.flatMap(([farm, rn]) => farm.tables.filter(t => t.start).map(t => ({ id: t.id, due: Math.round(t.end), text: `${t.name}: ${KINDS[t.kind].msg}${rn ? ` (${rn})` : ''}` })));
  }

  // ---------- invariantes (usadas por los tests y al cargar) ----------
  function checkInvariants(S) {
    const bad = [];
    if (S.schema !== SCHEMA) bad.push('schema');
    if (!S.routes.length) bad.push('sin rutas');
    if (!S.routes.some(r => r.id === S.cur)) bad.push('cur no existe');
    const rid = new Set();
    for (const r of S.routes) {
      if (rid.has(r.id)) bad.push('id de ruta repetido'); rid.add(r.id);
      const ids = new Set(r.steps.map(s => s.id)); if (ids.size !== r.steps.length) bad.push('id de paso repetido');
      for (const s of r.steps) {
        if (!PHASES.includes(s.phase) || !TYPES.includes(s.type) || !RANK[s.q]) bad.push('enum');
        if (!(s.target >= 0) || !(s.progress >= 0) || !Number.isFinite(s.target) || !Number.isFinite(s.progress)) bad.push('número');
        if (s.requires.some(x => !ids.has(x) || x === s.id)) bad.push('referencia rota');
        if (s.type === 'Plantas' && s.done) bad.push('plantas con done manual');
      }
    }
    if (S.farmOf !== S.cur) bad.push('granja de otra ruta');
    for (const k of Object.keys(S.farms || {})) if (k === S.cur || !S.routes.some(r => r.id === k)) bad.push('granja huérfana');
    for (const t of [S.farm, ...Object.values(S.farms || {})].flatMap(f => f.tables)) {
      if (!KINDS[t.kind]) bad.push('kind');
      if (t.kind === 'plant' && t.g + t.p + t.o > maxBush()) bad.push('más de 6 plantas');
      if (t.start && !(t.end > t.start)) bad.push('temporizador');
      for (const k of ['base', 'sell', 'cost', 'value']) if (k in t && !Number.isFinite(t[k])) bad.push('número estación');
    }
    const sids = new Set();
    for (const s of S.sims || []) {
      if (sids.has(s.id)) bad.push('id de escenario repetido'); sids.add(s.id);
      if (![s.hours, s.active, s.check].every(Number.isFinite) || s.active > s.hours) bad.push('tiempos de escenario');
      for (const g of s.groups) if (!KINDS[g.kind] || !(g.count >= 0) || g.kind === 'plant' && g.g + g.p + g.o > maxBush()) bad.push('grupo de escenario');
    }
    for (const r of S.raids || []) {
      const ids = new Set(r.structs.map(s => s.id));
      for (const s of r.structs) if (s.fu + s.fe + s.fl > structInfo(s).fuseSlots || !Number.isFinite(structDefense(s))) bad.push('fusibles');
      for (const p of r.routes) if (p.steps.some(x => !ids.has(x))) bad.push('ruta de raideo rota');
    }
    return bad;
  }

  const api = { SCHEMA, APP_VERSION, REPO, isNewer, PHASES, TYPES, QUAL, RANK, KINDS, CRYSTAL, LIM, uid, fmtN, notorietyBonus, reactorMin, applySpeed, num, str, esc, clone,
    normStep, normRoute, normStation, normFarm, normState, migrate, exampleRoute,
    plantCount, baseStatus, statuses, ordered, nextStep, isComplete, findCycles, validateRoute, validateFarm, errorsOf, errorKeys,
    calc, investment, upgradeOptions, farmTotals, stationComparison, routeSummary, bottlenecks,
    ops, UserError, itemNote, itemSubs, parseImport, exportRoute, syncIncluded, addIncludedVersion, timerList, checkInvariants,
    normSim, normSimGroup, validateSim, simulate, simIntervals, compareSims, stationTimeline, optimize, SIM_HOURS, UNIT,
    normRaid, structDefense, structInfo, planStructure, raidPlan, compareRaidRoutes, acquireCost };
  G.RR = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
