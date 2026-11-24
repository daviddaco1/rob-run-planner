// Rob Run Planner · catálogo central de datos del juego.
// Fuente única para precios, requisitos, efectos y límites. Lo usan core.js (validaciones y cálculos) y la interfaz.
// Kefir no publica tablas de precios: todo viene de wikis de fans (muchas copian robrun.info), contrastado entre varias.
//
// conf (nivel de confianza):
//   'confirmado'  = 2 o más fuentes independientes coinciden (no probado en el juego por nosotros)
//   'una-fuente'  = solo una fuente
//   'discrepancia'= las fuentes no coinciden; se usa el valor mayoritario y se anota la alternativa en `alt`
//   'jugador'     = comprobado por el propio jugador en el juego
//   'estimado'    = cálculo o dato de la comunidad sin respaldo claro
//   'pendiente'   = no encontrado; el valor es un marcador editable
// src: claves de SOURCES. Cómo actualizar este archivo: ver DATOS.md.
(function (G) {
  const SOURCES = {
    wipeplanner: { url: 'https://wipeplanner.online/guide/land-plots-settlements', date: '2026-11-18' },
    timesaver_plot: { url: 'https://timesaver.gg/blog/rob-run-plot-guide', date: '2026-11-20' },
    timesaver_grow: { url: 'https://timesaver.gg/blog/rob-run-grow-room-guide', date: '2026-11-19' },
    timesaver_cargo: { url: 'https://timesaver.gg/blog/rob-run-cargo-guide', date: '2026-11-19' },
    timesaver_chem: { url: 'https://timesaver.gg/blog/rob-run-chem-lab-guide', date: '2026-11-19' },
    timesaver_money: { url: 'https://timesaver.gg/blog/rob-run-money-guide', date: '2026-11-24' },
    timesaver_wipe: { url: 'https://timesaver.gg/blog/rob-run-wipe-schedule', date: '2026-11-21' },
    timesaver_map: { url: 'https://timesaver.gg/blog/rob-run-map', date: '2026-11-23' },
    showgamer_titles: { url: 'https://showgamer.com/en/guides/7519', date: '2026-11-13' },
    showgamer_bench: { url: 'https://showgamer.com/en/guides/7617-rob-run-vse-verstaki-kak-ustanovit-uluchshit-i-ispolzovat-na-baze', date: '2026-11-16' },
    showgamer_contraband: { url: 'https://showgamer.com/en/guides/7578', date: '2026-11-16' },
    showgamer_reagents: { url: 'https://showgamer.com/en/guides/7506-reagenty-v-rob-run-gde-nayti-kak-pererabotat-i-prodat', date: '2026-11-12' },
    robrunwiki_net: { url: 'https://robrunwiki.net/weed-farm', date: '2026-11-17' },
    robrunwiki_com: { url: 'https://robrunwiki.com/en/', date: '2026-11-13' },
    robrun_pro_farm: { url: 'https://robrun.pro/en/farm', date: '2026-11' },
    robrun_pro_lab: { url: 'https://robrun.pro/en/guides/lab_workbench', date: '2026-11' },
    robrun_run: { url: 'https://robrun.run/guides/money/contraband/', date: '2026-11-13' },
    robrunwipe: { url: 'https://robrunwipe.com/guides/contraband-workbench', date: '2026-11-13' },
    robrunmap: { url: 'https://robrunmap.com/wiki/workbench', date: '2026-11-15' },
    robrundb: { url: 'https://www.robrundb.wiki/guide/rob-run-cargo-workbench', date: '2026-11-19' },
    robrungg: { url: 'https://robrungg.wiki/database/base-structures', date: '2026-11-19' },
    wikily_calc: { url: 'https://wikily.gg/rob-run/weed-farm-calculator', date: '2026-11-17' },
    wikily_bench: { url: 'https://wikily.gg/rob-run/base-items/contraband-workbench', date: '2026-11-23' },
    wikily_defense: { url: 'https://wikily.gg/rob-run/base-defense', date: '2026-11-24' },
    igamemag_lab: { url: 'https://igamemag.com/rob-run-lab-guide', date: '2026-11-23' },
    robrun_game_lab: { url: 'https://robrun-game.com/guides/chemical-lab', date: '2026-11-16' },
    robrun_fyi: { url: 'https://robrun.fyi/grow-room-and-lab', date: '2026-11-15' },
    robrun_fyi_patches: { url: 'https://robrun.fyi/patch-notes', date: '2026-11-24' },
    robrun_info_updates: { url: 'https://robrun.info/en/updates/', date: '2026-11-23' },
    usuario: { url: '', date: '2026-11-24', note: 'Comprobado por el jugador en su partida' },
  };

  // tier: nivel de laptop necesario (= nivel del distrito de tu parcela). tier>1 implica tener parcela en ese distrito,
  // que core.js trata como requisito «land_title_<tier>».
  // requires: elementos que hay que tener (investigados o comprados) antes. unique: solo se compra una vez.
  const items = {
    // --- Títulos (árbol de Larry/Lenny > Documentos; se compran en el laptop de comercio > Construcción) ---
    land_title_1: { name: 'Land Plot Title Nv1', cat: 'Título', type: 'Título', research: 50000, buy: 100000, tier: 1, unique: true, requires: [],
      conf: 'confirmado', src: ['timesaver_plot', 'showgamer_titles', 'wipeplanner'], where: 'Laptop > árbol de Lenny/Larry > Documentos',
      notes: 'Desde el 4 nov, alquilar en nivel 1 cuesta documentos en vez de dinero.' },
    land_title_2: { name: 'Land Plot Title Nv2', cat: 'Título', type: 'Título', research: 200000, buy: 800000, tier: 1, unique: true, requires: ['land_title_1'], conf_requires: 'confirmado',
      conf: 'confirmado', src: ['timesaver_plot', 'showgamer_titles', 'wipeplanner'], notes: 'Basta con el Nv1 investigado (una fuente); el título debe coincidir con el nivel del distrito.' },
    land_title_3: { name: 'Land Plot Title Nv3', cat: 'Título', type: 'Título', research: 1000000, buy: 2000000, tier: 2, unique: true, requires: ['land_title_2'], conf_requires: 'confirmado',
      conf: 'confirmado', src: ['timesaver_plot', 'showgamer_titles', 'wipeplanner'], notes: 'Pide laptop tier II (parcela en distrito 2).' },
    settlement_title_1: { name: 'Settlement Title Nv1', cat: 'Título', type: 'Título', research: 100000, buy: 200000, tier: 1, unique: true, requires: [],
      conf: 'confirmado', src: ['timesaver_plot', 'showgamer_titles', 'wipeplanner'], notes: 'Asentamiento propio (Uncommon). Máximo 5 asentamientos por jugador.' },
    settlement_title_2: { name: 'Settlement Title Nv2', cat: 'Título', type: 'Título', research: 500000, buy: 2000000, tier: 1, unique: true, requires: ['settlement_title_1'], conf_requires: 'una-fuente',
      conf: 'confirmado', src: ['timesaver_plot', 'showgamer_titles', 'wipeplanner'], notes: 'Epic.' },
    settlement_title_3: { name: 'Settlement Title Nv3', cat: 'Título', type: 'Título', research: 2000000, buy: 6000000, tier: 2, unique: true, requires: ['settlement_title_2'], conf_requires: 'una-fuente',
      conf: 'confirmado', src: ['timesaver_plot', 'showgamer_titles', 'wipeplanner'], notes: 'Legendary. Nadie puede quitártelo antes del wipe.' },

    // --- Bases ---
    trailer: { name: 'Tráiler (base)', cat: 'Base', type: 'Comprar', research: 0, buy: 10000, tier: 1, requires: ['land_title_1'], conf: 'una-fuente', src: ['robrungg'],
      notes: '1 hueco de banco de trabajo, 9 fusibles.' },
    small_house: { name: 'Small House (base)', cat: 'Base', type: 'Comprar', research: 100000, buy: 600000, tier: 2, requires: ['land_title_1'], conf: 'una-fuente', src: ['robrungg'],
      notes: '2 huecos de banco de trabajo, 27 fusibles.' },
    mansion: { name: 'Mansion (base)', cat: 'Base', type: 'Comprar', research: 0, buy: 1500000, tier: 3, requires: ['land_title_1'], conf: 'una-fuente', src: ['robrungg', 'wikily_defense'],
      notes: '3 huecos de banco de trabajo, 42 fusibles. Investigación no encontrada.' },
    workshop: { name: 'Workshop (base)', cat: 'Base', type: 'Comprar', research: 125000, buy: 75000, tier: 1, requires: ['land_title_1'], conf: 'una-fuente', src: ['robrungg'],
      notes: '4 huecos de banco de trabajo, 9 fusibles.' },

    // --- Cultivo ---
    grow_room: { name: 'Grow Room', cat: 'Cultivo', type: 'Taller / mejora', research: 150000, buy: 100000, tier: 1, requires: ['land_title_1'], conf_requires: 'discrepancia',
      conf: 'confirmado', src: ['robrunwiki_net', 'timesaver_grow', 'robrun_run', 'robrungg'], where: 'Investigar en Shipments (H); comprar en Mercado negro > Construcción',
      notes: 'Requisito en discusión: unas guías dicen título Nv1, otra Nv2. Comprobado por el jugador: 2 Grow Rooms caben en la misma base.' },
    grow_table: { name: 'Grow Table', cat: 'Cultivo', type: 'Taller / mejora', research: 30000, buy: 40000, tier: 1, requires: ['grow_room'], conf_requires: 'confirmado',
      conf: 'confirmado', src: ['robrunwiki_net', 'timesaver_grow', 'robrun_run'], alt: 'IGN invierte investigación y compra', notes: '6 plantas por mesa, 6 mesas por sala.' },
    fan: { name: 'Fan', cat: 'Cultivo', type: 'Taller / mejora', research: 100000, buy: 25000, tier: 1, requires: ['grow_table'], conf_requires: 'confirmado', effect: { speed: 0.12 },
      conf: 'confirmado', src: ['timesaver_grow', 'robrunwiki_net', 'robrun_run', 'wikily_calc'], notes: '+12% velocidad. Un hueco por mesa, solo afecta a su mesa.' },
    water_pump: { name: 'Water Pump', cat: 'Cultivo', type: 'Taller / mejora', research: 200000, buy: 70000, tier: 2, requires: ['grow_table'], conf_requires: 'confirmado', effect: { speed: 0.14 },
      conf: 'confirmado', src: ['timesaver_grow', 'robrunwiki_net', 'robrun_run', 'wikily_calc'], notes: '+14% velocidad.' },
    uv_lamp: { name: 'UV Lamp', cat: 'Cultivo', type: 'Taller / mejora', research: 500000, buy: 250000, tier: 3, requires: ['grow_table'], conf_requires: 'confirmado', effect: { speed: 0.24 },
      conf: 'confirmado', src: ['timesaver_grow', 'robrunwiki_net', 'robrun_run', 'wikily_calc'], notes: '+24% velocidad.' },

    // --- Contrabando ---
    contraband_bench: { name: 'Contraband Workbench', cat: 'Contrabando', type: 'Reempaquetado', research: 20000, buy: 20000, tier: 1, requires: ['land_title_1'], conf_requires: 'confirmado',
      conf: 'confirmado', src: ['robrunmap', 'showgamer_contraband', 'robrunwipe', 'robrun_run', 'timesaver_cargo'], where: 'Shipments > árbol de Larry (Muebles); Mercado negro',
      notes: 'Reempaqueta 1 caja cada vez (~30 min). Ocupa un hueco de banco de trabajo de la base.' },
    label_printer_u: { name: 'Label Printer (Uncommon)', cat: 'Contrabando', type: 'Reempaquetado', research: 15000, buy: 30000, tier: 1, requires: ['contraband_bench'], conf_requires: 'confirmado',
      effect: { speed: 0.15 }, conf: 'confirmado', src: ['robrunmap', 'showgamer_contraband', 'timesaver_cargo', 'robrunwipe'], notes: '+15% velocidad de reempaquetado.' },
    label_printer_l: { name: 'Label Printer (Legendary)', cat: 'Contrabando', type: 'Reempaquetado', research: 75000, buy: 150000, tier: 3, requires: ['label_printer_u'], conf_requires: 'una-fuente',
      effect: { speed: 0.25 }, conf: 'discrepancia', src: ['robrunmap', 'showgamer_contraband', 'robrun_run'], alt: 'robrun.run: efecto sin confirmar', notes: '+25% (una fuente).' },
    tool_box_e: { name: 'Tool Box (Epic)', cat: 'Contrabando', type: 'Reempaquetado', research: 150000, buy: 200000, tier: 2, requires: ['contraband_bench'], conf_requires: 'una-fuente',
      effect: { slots: 1 }, conf: 'discrepancia', src: ['robrunmap', 'showgamer_contraband', 'robrunwipe'], alt: 'otras guías: «más capacidad» sin cifra', notes: '+1 hueco de caja en cola (no reempaqueta en paralelo).' },
    tool_box_l: { name: 'Tool Box (Legendary)', cat: 'Contrabando', type: 'Reempaquetado', research: 300000, buy: 400000, tier: 3, requires: ['tool_box_e'], conf_requires: 'una-fuente',
      effect: { slots: 2 }, conf: 'discrepancia', src: ['robrunmap', 'showgamer_contraband'], notes: '+2 huecos en cola (una fuente). Va en el mismo hueco que la Epic.' },
    cargo_bench: { name: 'Cargo Workbench', cat: 'Contrabando', type: 'Taller / mejora', research: 5000, buy: 15000, tier: 1, requires: ['land_title_1'], conf: 'confirmado',
      src: ['robrundb', 'robrunmap', 'showgamer_bench', 'timesaver_cargo'], notes: 'Abre cargamentos (no admite contrabando). 2 huecos. Abrir: 30-60 min según caja.' },
    locksmith_tools: { name: 'Locksmith Tools', cat: 'Contrabando', type: 'Taller / mejora', research: 20000, buy: 15000, tier: 1, requires: ['cargo_bench'], effect: { speed: 0.2 },
      conf: 'confirmado', src: ['robrunmap', 'timesaver_cargo'], notes: '+20% velocidad de apertura.' },
    cargo_saw: { name: 'Cargo Saw', cat: 'Contrabando', type: 'Taller / mejora', research: 45000, buy: 41000, tier: 2, requires: ['cargo_bench'], effect: { speed: 0.2 },
      conf: 'confirmado', src: ['robrunmap', 'timesaver_cargo'], notes: '+20% velocidad de apertura.' },
    bench_vise: { name: 'Bench Vise', cat: 'Contrabando', type: 'Taller / mejora', research: 100000, buy: 250000, tier: 3, requires: ['cargo_bench'],
      conf: 'discrepancia', src: ['robrunmap', 'timesaver_cargo'], alt: '«más espacio» vs «un hueco más»', notes: 'Efecto descrito de forma distinta según la guía.' },

    // --- Laboratorio químico ---
    chem_lab: { name: 'Chemical Laboratory', cat: 'Química', type: 'Taller químico', research: 160000, buy: 110000, tier: 1, requires: ['land_title_1'], conf_requires: 'una-fuente',
      conf: 'confirmado', src: ['timesaver_chem', 'igamemag_lab', 'robrun_game_lab', 'robrun_fyi'], where: 'Shipments > Producción; se coloca con el plano de la parcela',
      notes: 'Edificio con solo 3 de defensa; el humo delata la base. Mínimo para producir: lab + reactor + congelador ≈ $365k.' },
    reactor_1: { name: 'Chemical Reactor I', cat: 'Química', type: 'Taller químico', research: 20000, buy: 40000, tier: 1, requires: ['chem_lab'], conf_requires: 'confirmado',
      cycle: 60, conf: 'confirmado', src: ['timesaver_chem', 'igamemag_lab', 'robrun_game_lab'], notes: '4 ciclos de 900 s (≈60 min por tanda; tiempos de una fuente).' },
    reactor_2: { name: 'Chemical Reactor II', cat: 'Química', type: 'Taller químico', research: 150000, buy: 300000, tier: 2, requires: ['reactor_1'], conf_requires: 'una-fuente',
      cycle: 53, conf: 'confirmado', src: ['timesaver_chem', 'igamemag_lab'], notes: '6 ciclos de 530 s (≈53 min; una fuente).' },
    reactor_3: { name: 'Chemical Reactor III', cat: 'Química', type: 'Taller químico', research: 350000, buy: 700000, tier: 3, requires: ['reactor_2'], conf_requires: 'una-fuente',
      cycle: 45, conf: 'confirmado', src: ['timesaver_chem', 'igamemag_lab'], notes: '8 ciclos de 337 s (≈45 min; una fuente).' },
    freezer_1: { name: 'Industrial Freezer I', cat: 'Química', type: 'Taller químico', research: 15000, buy: 20000, tier: 1, requires: ['chem_lab'], conf: 'confirmado',
      src: ['igamemag_lab', 'timesaver_chem'], notes: '4 bandejas. Congelado: 360 s por paso (timesaver) o ~30 min (jugadores): sin confirmar.' },
    freezer_2: { name: 'Industrial Freezer II', cat: 'Química', type: 'Taller químico', research: 30000, buy: 90000, tier: 2, requires: ['freezer_1'], conf: 'confirmado', src: ['igamemag_lab', 'timesaver_chem'], notes: '6 bandejas.' },
    freezer_3: { name: 'Industrial Freezer III', cat: 'Química', type: 'Taller químico', research: 100000, buy: 250000, tier: 3, requires: ['freezer_2'], conf: 'confirmado', src: ['igamemag_lab', 'timesaver_chem'], notes: '8 bandejas.' },
    evaporator: { name: 'Improved Evaporator', cat: 'Química', type: 'Taller químico', research: 40000, buy: 100000, tier: 2, requires: ['freezer_1'], effect: { freeze: 0.117 },
      conf: 'confirmado', src: ['timesaver_chem', 'igamemag_lab'], notes: 'Congela un 11,7% más rápido.' },
    refrigerant: { name: 'Quality Refrigerant', cat: 'Química', type: 'Taller químico', research: 100000, buy: 250000, tier: 3, requires: ['freezer_1'], effect: { freeze: 0.13 },
      conf: 'confirmado', src: ['timesaver_chem', 'igamemag_lab'], notes: 'Congela un 13% más rápido; se suma al evaporador.' },
    lab_table: { name: 'Lab Table', cat: 'Química', type: 'Taller químico', research: 10000, buy: 15000, tier: 1, requires: ['chem_lab'], conf: 'confirmado',
      src: ['timesaver_chem', 'igamemag_lab', 'robrun_game_lab'], notes: 'Rompe Hard Crystals en polvo (~10 s). Opcional según la guía.' },
    lab_scales: { name: 'Laboratory Scales', cat: 'Química', type: 'Taller químico', research: 15000, buy: 15000, tier: 2, requires: ['lab_table'], conf: 'confirmado',
      src: ['timesaver_chem', 'igamemag_lab', 'robrun_fyi'], notes: 'Pide 335 años de condena acumulada. Efecto no publicado.' },

    // --- Otros ---
    collection_table: { name: 'Collection Table', cat: 'Otro', type: 'Taller / mejora', research: 5000, buy: 15000, tier: 1, requires: ['land_title_1'], conf: 'confirmado',
      src: ['timesaver_cargo', 'showgamer_bench'], notes: 'Colecciones: $50k (básica), $150k (especial), $500k (única).' },
    bank_account: { name: 'Cuenta bancaria', cat: 'Otro', type: 'Comprar', research: 0, buy: 5000, tier: 1, requires: [], unique: true, conf: 'una-fuente', src: ['timesaver_money'],
      notes: 'Ábrela sin máscara (modo Civil). El dinero del banco se pierde igualmente en el wipe.' },
    fuse_u: { name: 'Fusible Uncommon', cat: 'Defensa', type: 'Comprar', research: 0, buy: 20000, tier: 1, requires: ['land_title_1'], conf: 'una-fuente', src: ['wikily_defense'], notes: '+1 defensa.' },
    fuse_e: { name: 'Fusible Epic', cat: 'Defensa', type: 'Comprar', research: 0, buy: 100000, tier: 1, requires: ['land_title_1'], conf: 'una-fuente', src: ['wikily_defense'], notes: '+3 defensa.' },
    fuse_l: { name: 'Fusible Legendary', cat: 'Defensa', type: 'Comprar', research: 0, buy: 250000, tier: 1, requires: ['land_title_1'], conf: 'una-fuente', src: ['wikily_defense'], notes: '+5 defensa.' },
  };
  for (const [id, it] of Object.entries(items)) it.id = id;

  // Precios de venta y valores por defecto de las estaciones (todos editables en la app).
  const defaults = {
    plant_cycle_min: { value: 60, conf: 'confirmado', src: ['wikily_calc', 'robrun_pro_farm'], notes: '100 puntos, 1 punto cada 36 s. Algunos jugadores reportan 1-2 h.' },
    bags_per_plant: { value: 3, conf: 'confirmado', src: ['robrun_pro_farm', 'timesaver_grow', 'wikily_calc'], notes: '2-4 bolsas por cosecha (media 3). El edificio Reservoir del distrito da 50% de +1-2.' },
    bag_price_g: { value: 4000, conf: 'confirmado', src: ['robrunwiki_com', 'timesaver_grow', 'robrun_run'], alt: 'robrun.pro: $10k', notes: 'Bolsa Uncommon (verde) al Fence, notoriedad 1.' },
    bag_price_p: { value: 6000, conf: 'confirmado', src: ['robrunwiki_com', 'timesaver_grow', 'robrun_run'], alt: 'robrun.pro: $15k', notes: 'Bolsa Epic (morada).' },
    bag_price_o: { value: 8000, conf: 'confirmado', src: ['robrunwiki_com', 'timesaver_grow', 'robrun_run'], alt: 'robrun.pro: $20k', notes: 'Bolsa Legendary (dorada).' },
    repack_cycle_min: { value: 30, conf: 'estimado', src: ['robrun_run', 'robrunwipe', 'timesaver_cargo'], notes: 'Pruebas de la comunidad; Kefir no lo publica.' },
    repack_sell: { value: 35000, conf: 'confirmado', src: ['robrunmap', 'timesaver_cargo', 'showgamer_contraband'], notes: 'Premium Cargo $35k; Rarity Cargo $40k (probabilidad desconocida). Smuggler, notoriedad 1.' },
    repack_cost: { value: 10000, conf: 'discrepancia', src: ['robrunmap', 'timesaver_cargo', 'showgamer_contraband'], alt: '$5k en el Sales Center (descuento de asentamiento)', notes: 'Contraband Cargo en Lenny / vendedor de carga.' },
    chem_reactor_tier: { value: 1, conf: 'confirmado', src: ['timesaver_chem'] },
    chem_freeze_min: { value: 30, conf: 'discrepancia', src: ['timesaver_chem', 'robrun_pro_lab'], alt: '6 min (360 s, timesaver)', notes: 'Jugadores reportan ~30 min.' },
    crystal_price_u: { value: 30000, conf: 'confirmado', src: ['timesaver_chem', 'igamemag_lab', 'robrun_pro_lab'], notes: 'Hard Crystals Uncommon al Smuggler, notoriedad 1.' },
    crystal_price_e: { value: 45000, conf: 'confirmado', src: ['timesaver_chem', 'igamemag_lab', 'robrun_pro_lab'] },
    crystal_price_l: { value: 75000, conf: 'confirmado', src: ['timesaver_chem', 'igamemag_lab', 'robrun_pro_lab'] },
    reagent_value: { value: 20000, conf: 'confirmado', src: ['robrun_pro_lab', 'timesaver_chem'], notes: 'Reagent Canister vendido al Smuggler: lo que dejas de ganar al gastarlo. Quality Reagents $30k.' },
  };

  // Bonus de venta por notoriedad (nivel 1..5).
  const notoriety = {
    fence: { values: [0, 0.10, 0.20, 0.35, 0.50], conf: 'confirmado', src: ['robrunwiki_com', 'robrunwiki_net', 'timesaver_chem'], notes: 'Fence: bolsas de cultivo, polvo.' },
    smuggler: { values: [0, 0.05, 0.10, 0.15, 0.25], conf: 'discrepancia', src: ['timesaver_cargo', 'robrunwiki_com'], alt: 'robrun.info marca los niveles intermedios sin probar', notes: 'Smuggler: cargamentos, cristales, plantas enteras.' },
  };

  const limits = {
    bushes_per_table: { value: 6, conf: 'confirmado', src: ['timesaver_grow', 'robrunwiki_net', 'robrun_pro_farm', 'wikily_calc'] },
    tables_per_room: { value: 6, conf: 'confirmado', src: ['timesaver_grow', 'robrunwiki_net', 'robrun_pro_farm'] },
    rooms_per_base: { value: 2, conf: 'jugador', src: ['usuario'], notes: 'Al menos 2 (comprobado por el jugador). Ninguna guía da el máximo.' },
    upgrade_slots_per_table: { value: 3, conf: 'confirmado', src: ['timesaver_grow', 'wikily_calc'], notes: 'Uno de cada tipo.' },
    settlements_per_player: { value: 5, conf: 'confirmado', src: ['timesaver_plot', 'wipeplanner'] },
    wipe_days: { value: 7, conf: 'confirmado', src: ['timesaver_wipe', 'robrun_fyi_patches'], notes: '7 días desde que abre cada servidor. Se pierde todo salvo cosméticos, nombre, ajustes y años de condena.' },
  };
  // Huecos de banco de trabajo por tipo de base (bancos de contrabando + de carga).
  const bases = {
    trailer: { name: 'Tráiler', workbenches: 1, conf: 'confirmado', src: ['showgamer_bench', 'robrunmap', 'wikily_bench'] },
    small_house: { name: 'Small House', workbenches: 2, conf: 'confirmado', src: ['showgamer_bench', 'robrunmap'] },
    mansion: { name: 'Mansion', workbenches: 3, conf: 'confirmado', src: ['showgamer_bench', 'wikily_bench'] },
    workshop: { name: 'Workshop', workbenches: 4, conf: 'confirmado', src: ['showgamer_bench', 'robrunmap'] },
  };

  G.RR_CATALOG = {
    version: '2026-11-24',
    game: '0.7.0.4005-0.7.0.4040 (Early Access; las fuentes no coinciden en la build exacta)',
    verified: '2026-11-24',
    SOURCES, items, defaults, notoriety, limits, bases,
  };
})(typeof globalThis !== 'undefined' ? globalThis : this);
