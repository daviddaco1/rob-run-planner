// Iconos de Rob Run Planner → globalThis.RR_ICONS
// Dibujados para este proyecto (SVG 24×24, trazo con currentColor), con la misma licencia que el resto del repo.
// NO son los iconos del juego: Kefir no publica sus recursos con una licencia que permita redistribuirlos
// (ni press kit ni términos de uso de assets). Ver DATOS.md › «Iconos».
// Los elementos del catálogo se enlazan por id (items) y, si no hay icono propio, por categoría (cats).
(function (root) {
  'use strict';
  const P = {
    // dinero y producción
    money: '<rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="2.6"/><path d="M6 10v4M18 10v4"/>',
    coin: '<circle cx="12" cy="12" r="8.5"/><path d="M14.5 9.2c-.6-.8-1.5-1.2-2.5-1.2-1.4 0-2.5.8-2.5 2s1.1 1.6 2.5 2 2.5.8 2.5 2-1.1 2-2.5 2c-1 0-2-.4-2.6-1.2M12 6.5v1.5M12 16v1.5"/>',
    bag: '<path d="M6 8h12l-1 12H7z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/>',
    plant: '<path d="M12 21v-9"/><path d="M12 12C12 8 9 5 4.5 5c0 4 3 7 7.5 7z"/><path d="M12 14c0-3.5 2.6-6 6.5-6 0 3.5-2.6 6-6.5 6z"/>',
    seed: '<path d="M12 3c4 3 6 7 6 10a6 6 0 0 1-12 0c0-3 2-7 6-10z"/><path d="M12 9v9"/>',
    gem: '<path d="M6 3h12l4 6-10 12L2 9z"/><path d="M2 9h20M12 21L8 9l4-6 4 6z"/>',
    crate: '<path d="M3 8l9-5 9 5v8l-9 5-9-5z"/><path d="M3 8l9 5 9-5M12 13v8"/>',
    trend: '<path d="M3 17l6-6 4 4 8-8M15 7h6v6"/>',
    // títulos y bases
    title: '<path d="M6 3h9l4 4v14H6z"/><path d="M15 3v4h4M9 11h7M9 14h5"/><circle cx="15" cy="18" r="1.6"/>',
    scroll: '<path d="M8 4h11v13a3 3 0 0 1-3 3H6"/><path d="M8 4a2 2 0 0 0-4 0v2h4M6 20a2 2 0 0 0 2-2V4M11 9h5M11 13h5"/>',
    trailer: '<rect x="2" y="7" width="15" height="10" rx="2"/><path d="M17 14h4M6 10h4"/><circle cx="7" cy="18" r="1.8"/><circle cx="12" cy="18" r="1.8"/>',
    house: '<path d="M3 11l9-7 9 7"/><path d="M5 10v10h14V10M10 20v-5h4v5"/>',
    mansion: '<path d="M2 20h20M4 20V10l4-3 4 3M12 20V8l4-4 4 4v12M7 13h2M15 10h2M15 14h2M7 16h2"/>',
    factory: '<path d="M3 20V10l5 3v-3l5 3V7h3l1-3h2l1 3v13z"/><path d="M7 17h2M12 17h2"/>',
    bank: '<path d="M3 10l9-6 9 6M5 10v8M9.5 10v8M14.5 10v8M19 10v8M3 20h18"/>',
    // cultivo
    greenhouse: '<path d="M3 20V10l9-6 9 6v10z"/><path d="M12 20v-6M12 16c0-2 1.5-3 3-3M12 17c0-2-1.5-3-3-3"/>',
    planter: '<path d="M4 13h16l-1.5 7h-13z"/><path d="M12 13V7M12 9.5c0-2.3 1.6-4 4-4 0 2.3-1.6 4-4 4zM12 10.5c0-2-1.4-3.5-3.5-3.5 0 2 1.4 3.5 3.5 3.5z"/>',
    fan: '<circle cx="12" cy="12" r="1.8"/><path d="M12 10.2C12 6 13 3.5 15.5 3.5S19 6.5 13.6 11M13.8 12.4c3.6 2.1 5.4 4.1 4.1 6.3s-4.5 1.5-7.4-3.5M10.6 13.2C7 15.3 4.3 15.7 3.1 13.5S4.2 8.9 10 9.2"/>',
    drop: '<path d="M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11z"/><path d="M9.5 15a2.5 2.5 0 0 0 2.5 2.5"/>',
    bulb: '<path d="M9 18h6M10 21h4"/><path d="M12 3a6 6 0 0 0-3.6 10.8c.6.5 1 1.3 1 2.2h5.2c0-.9.4-1.7 1-2.2A6 6 0 0 0 12 3z"/>',
    // contrabando y carga
    printer: '<path d="M6 9V3h12v6"/><rect x="3" y="9" width="18" height="8" rx="2"/><path d="M7 14h10v7H7z"/>',
    toolbox: '<rect x="3" y="8" width="18" height="12" rx="2"/><path d="M9 8V5h6v3M3 13h18M10 13v2h4v-2"/>',
    truck: '<path d="M2 6h12v10H2zM14 10h4l3 3v3h-7"/><circle cx="6" cy="17.5" r="1.8"/><circle cx="17" cy="17.5" r="1.8"/>',
    key: '<circle cx="8" cy="15" r="4"/><path d="M11 12l9-9M17 6l3 3M14.5 8.5l2 2"/>',
    saw: '<path d="M3 17L15 5l4 4L7 21H3z"/><path d="M6 14l1.5 1.5M9 11l1.5 1.5M12 8l1.5 1.5"/>',
    vise: '<path d="M4 20h16M7 20v-5h10v5M5 10h14v5H5zM12 10V5M9 5h6"/>',
    // química
    flask: '<path d="M9 3h6M10 3v6l-5.5 9.5A1.6 1.6 0 0 0 5.9 21h12.2a1.6 1.6 0 0 0 1.4-2.5L14 9V3"/><path d="M7.5 15h9"/>',
    atom: '<circle cx="12" cy="12" r="1.5"/><ellipse cx="12" cy="12" rx="9" ry="3.6"/><ellipse cx="12" cy="12" rx="9" ry="3.6" transform="rotate(60 12 12)"/><ellipse cx="12" cy="12" rx="9" ry="3.6" transform="rotate(120 12 12)"/>',
    snow: '<path d="M12 2v20M3.3 7l17.4 10M3.3 17L20.7 7M9 4l3 2 3-2M9 20l3-2 3 2"/>',
    steam: '<path d="M4 5h16M6 20c0-2 2-2 2-4s-2-2-2-4M12 20c0-2 2-2 2-4s-2-2-2-4M18 20c0-2 2-2 2-4s-2-2-2-4"/>',
    thermo: '<path d="M10 14V5a2 2 0 0 1 4 0v9a4 4 0 1 1-4 0z"/><path d="M12 9v7"/>',
    bench: '<path d="M3 13h18M5 13v8M19 13v8M8 5h4M9 5v4l-2 4M11 5v4l2 4M15 8h3v5h-3z"/>',
    scales: '<path d="M12 3v18M7 21h10M5 7h14M5 7l-3 6a3 3 0 0 0 6 0zM19 7l-3 6a3 3 0 0 0 6 0z"/>',
    table: '<path d="M3 9h18M5 9v11M19 9v11M5 14h14"/>',
    // defensa
    bolt: '<path d="M13 2L4 14h7l-1 8 9-12h-7z"/>',
    shield: '<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/>',
    // tareas y progreso
    route: '<circle cx="6" cy="19" r="2"/><circle cx="18" cy="5" r="2"/><path d="M8 19h7a3.5 3.5 0 0 0 0-7H9a3.5 3.5 0 0 1 0-7h7"/>',
    flag: '<path d="M5 21V4M5 4h11l-2 4 2 4H5"/>',
    task: '<rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 4V3h6v1M9 10h6M9 14h6M9 18h3"/>',
    list: '<path d="M9 6h11M9 12h11M9 18h11M4.5 6h.01M4.5 12h.01M4.5 18h.01"/>',
    link: '<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>',
    cart: '<circle cx="9" cy="20" r="1.5"/><circle cx="18" cy="20" r="1.5"/><path d="M2 3h3l2.7 12.4a2 2 0 0 0 2 1.6h7.7a2 2 0 0 0 2-1.6L21 7H6"/>',
    hammer: '<path d="M13 4l7 7-3 3-7-7zM12 11l-8 9"/>',
    upgrade: '<path d="M12 20V6M6 12l6-6 6 6M5 3h14"/>',
    sprout: '<path d="M12 21v-7M12 14c0-3-2-5-6-5 0 3 2 5 6 5zM12 14c0-3 2-5 6-5 0 3-2 5-6 5z"/>',
    tree: '<path d="M12 21v-5M12 3l6 8h-3l4 5H5l4-5H6z"/>',
    crown: '<path d="M3 18h18M4 18L3 7l5 4 4-6 4 6 5-4-1 11"/>',
    st_pending: '<circle cx="12" cy="12" r="8.5"/>',
    st_progress: '<circle cx="12" cy="12" r="8.5"/><path d="M12 3.5a8.5 8.5 0 0 1 0 17z" fill="currentColor"/>',
    st_done: '<circle cx="12" cy="12" r="8.5"/><path d="M8 12.5l3 3 5-6"/>',
    st_prov: '<circle cx="12" cy="12" r="8.5" stroke-dasharray="3 2.6"/><path d="M8 12.5l3 3 5-6"/>',
    st_blocked: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
    // tiempo y estadísticas
    timer: '<circle cx="12" cy="13" r="8"/><path d="M12 9v4l2.5 2.5M10 2h4"/>',
    hourglass: '<path d="M6 2h12M6 22h12M7 2v4l5 6 5-6V2M7 22v-4l5-6 5 6v4"/>',
    chart: '<path d="M4 20V4M4 20h16M8 16v-4M12 16V8M16 16v-6"/>',
    star: '<path d="M12 3l2.8 5.7 6.2.9-4.5 4.4 1 6.2L12 17.3 6.5 20.2l1-6.2L3 9.6l6.2-.9z"/>',
    calc: '<rect x="5" y="2.5" width="14" height="19" rx="2"/><path d="M8 6h8v3H8zM8 13h.01M12 13h.01M16 13h.01M8 17h.01M12 17h.01M16 17h.01"/>',
    book: '<path d="M4 4.5A1.5 1.5 0 0 1 5.5 3H20v15H5.5A1.5 1.5 0 0 0 4 19.5zM4 19.5A1.5 1.5 0 0 0 5.5 21H20v-3"/>',
    db: '<ellipse cx="12" cy="5" rx="8" ry="3"/><path d="M4 5v14c0 1.7 3.6 3 8 3s8-1.3 8-3V5M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3"/>',
    bell: '<path d="M6 16V11a6 6 0 0 1 12 0v5l2 2H4zM10 21h4"/>',
    sliders: '<path d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12M20 18h0"/><circle cx="16" cy="6" r="2"/><circle cx="10" cy="12" r="2"/><circle cx="18" cy="18" r="2"/>',
    // avisos
    error: '<circle cx="12" cy="12" r="9"/><path d="M9 9l6 6M15 9l-6 6"/>',
    warn: '<path d="M12 3l10 18H2z"/><path d="M12 10v5M12 18h.01"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5h.01"/>',
    check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
    // acciones
    plus: '<path d="M12 5v14M5 12h14"/>',
    x: '<path d="M6 6l12 12M18 6L6 18"/>',
    trash: '<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>',
    copy: '<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3"/>',
    up: '<path d="M12 19V5M6 11l6-6 6 6"/>',
    down: '<path d="M12 5v14M6 13l6 6 6-6"/>',
    play: '<path d="M7 4l13 8-13 8z"/>',
    stop: '<rect x="6" y="6" width="12" height="12" rx="1.5"/>',
    download: '<path d="M12 4v11M7 10l5 5 5-5M4 20h16"/>',
    upload: '<path d="M12 16V5M7 10l5-5 5 5M4 20h16"/>',
    search: '<circle cx="11" cy="11" r="6.5"/><path d="M16 16l5 5"/>',
    undo: '<path d="M9 14L4 9l5-5"/><path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11"/>',
    redo: '<path d="M15 14l5-5-5-5"/><path d="M20 9H9.5a5.5 5.5 0 0 0 0 11H13"/>',
    refresh: '<path d="M20 11a8 8 0 0 0-14.6-4.5M4 4v4h4M4 13a8 8 0 0 0 14.6 4.5M20 20v-4h-4"/>',
    edit: '<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="M13.5 6.5l4 4"/>',
    chevron: '<path d="M9 6l6 6-6 6"/>',
    panel: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M9 4v16"/>',
    goto: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  };
  // Elemento del catálogo → icono (por id). Lo que no está aquí usa el icono de su categoría.
  const items = {
    land_title_1: 'title', land_title_2: 'title', land_title_3: 'title',
    settlement_title_1: 'scroll', settlement_title_2: 'scroll', settlement_title_3: 'scroll',
    trailer: 'trailer', small_house: 'house', mansion: 'mansion', workshop: 'factory',
    grow_room: 'greenhouse', grow_table: 'planter', fan: 'fan', water_pump: 'drop', uv_lamp: 'bulb',
    contraband_bench: 'crate', label_printer_u: 'printer', label_printer_l: 'printer', tool_box_e: 'toolbox', tool_box_l: 'toolbox',
    cargo_bench: 'truck', locksmith_tools: 'key', cargo_saw: 'saw', bench_vise: 'vise',
    chem_lab: 'flask', reactor_1: 'atom', reactor_2: 'atom', reactor_3: 'atom',
    freezer_1: 'snow', freezer_2: 'snow', freezer_3: 'snow', evaporator: 'steam', refrigerant: 'thermo',
    lab_table: 'bench', lab_scales: 'scales', collection_table: 'table', bank_account: 'bank',
    fuse_u: 'bolt', fuse_e: 'bolt', fuse_l: 'bolt',
  };
  // Categoría del catálogo → icono por defecto + clase de color (definida en el CSS de la página)
  const cats = {
    'Título': { icon: 'title', cls: 'k-title' }, Base: { icon: 'house', cls: 'k-base' }, Cultivo: { icon: 'plant', cls: 'k-grow' },
    Contrabando: { icon: 'crate', cls: 'k-smug' }, 'Química': { icon: 'flask', cls: 'k-chem' }, Defensa: { icon: 'shield', cls: 'k-def' }, Otro: { icon: 'task', cls: 'k-other' },
  };
  // Tipos de paso de la ruta (core.js TYPES) y tipos de estación (core.js KINDS)
  const types = { Dinero: 'coin', Comprar: 'cart', 'Conseguir item': 'crate', Craftear: 'hammer', 'Taller / mejora': 'upgrade', 'Título': 'title',
    Plantas: 'plant', Reempaquetado: 'crate', 'Taller químico': 'flask', Otro: 'task' };
  const kinds = { plant: 'planter', repack: 'crate', chem: 'flask' };
  const phases = { Early: 'sprout', Mid: 'tree', Late: 'crown' };
  // Rareza por id (sufijo _u/_e/_l o I/II/III): da color al borde del icono
  const rarity = id => /_l$|_3$/.test(id) ? 'r-l' : /_e$|_2$/.test(id) ? 'r-e' : /_u$/.test(id) ? 'r-u' : '';
  const sprite = () => `<svg xmlns="http://www.w3.org/2000/svg" style="position:absolute;width:0;height:0;overflow:hidden" aria-hidden="true">${
    Object.entries(P).map(([k, d]) => `<symbol id="i-${k}" viewBox="0 0 24 24">${d}</symbol>`).join('')}</svg>`;
  root.RR_ICONS = { paths: P, items, cats, types, kinds, phases, rarity, sprite };
})(typeof globalThis !== 'undefined' ? globalThis : this);
