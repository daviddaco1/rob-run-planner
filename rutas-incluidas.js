// Generado por tools/gen-rutas.js (no editar a mano). La app añade cada ruta una vez por id y avisa si sube la versión.
window.RUTAS = [
  {
    "id": "dos-granjas",
    "version": 2,
    "aliases": [
      "Full farmeo: 2 granjas completas"
    ],
    "name": "Full farmeo: 2 granjas completas",
    "goal": "2 Grow Rooms en la misma base · 12 mesas · Fan + Water Pump + UV Lamp en todas · 72 plantas doradas",
    "steps": [
      {
        "phase": "Early",
        "type": "Dinero",
        "text": "Capital inicial: 150k",
        "target": 150000,
        "notes": "Empieza en un servidor recién abierto: el wipe llega a los 7 días. Desde aquí, todo el dinero va al título de parcela.",
        "subs": [
          "Ponte la máscara (modo Criminal) y roba tiendas pequeñas: gasolinera, farmacia, joyería",
          "Vende el botín al Fence (furgonetas marcadas en el mapa) y coge el dinero del mostrador al momento",
          "Abre cuenta en el banco como Civil y deposita cada vez que pases de ~50k",
          "Alternativa con menos riesgo: hacer turnos de policía (equipo gratis)"
        ]
      },
      {
        "phase": "Early",
        "type": "Comprar",
        "text": "Land Plot Title Nv1 ($150k)",
        "target": 150000,
        "notes": "Si el título no aparece en el inventario, contacta con soporte y dales tu UID (menú Esc, bajo tu nombre).",
        "subs": [
          "Laptop > árbol de Lenny > Documentos: investigar el título Nv1 ($50k)",
          "Comprar el título Nv1 ($100k)",
          "Comprobar que el título está en el inventario"
        ],
        "id": "titulo-1",
        "item": "land_title_1"
      },
      {
        "phase": "Early",
        "type": "Otro",
        "text": "Alquilar parcela en distrito nivel 1",
        "target": 0,
        "notes": "Solo se puede alquilar en asentamientos que ya tienen dueño.",
        "subs": [
          "Buscar un asentamiento nivel 1 con dueño y parcelas libres, mejor si está cerca de tiendas, hoteles y algún Fence",
          "Firmar el contrato en el cartel de la parcela",
          "Colocar la base (tráiler)"
        ],
        "id": "parcela-1",
        "requires": [
          "titulo-1"
        ]
      },
      {
        "phase": "Early",
        "type": "Dinero",
        "text": "Ahorrar 320k para la Granja A",
        "target": 320000,
        "notes": "Grow Room: $150k investigación + $100k compra. Grow Table: $30k + $40k.",
        "subs": [
          "Seguir con robos o policía y depositar en el banco",
          "Al robar tiendas, fíjate detrás y dentro por si hay plantas: apunta dónde aparecen"
        ]
      },
      {
        "id": "growroom-a",
        "phase": "Early",
        "type": "Taller / mejora",
        "text": "Montar Grow Room A",
        "item": "grow_room",
        "target": 250000,
        "notes": "Va en la parcela. Investigación en Shipments (H); compra en Mercado negro > Construcción.",
        "subs": [
          "Investigar el Grow Room en Shipments, tecla H ($150k)",
          "Comprar el Grow Room en Mercado negro > Construcción ($100k)",
          "Colocar el Grow Room desde la bolsa"
        ]
      },
      {
        "id": "mesa-a1",
        "phase": "Early",
        "type": "Taller / mejora",
        "text": "Mesa A-1",
        "item": "grow_table",
        "target": 70000,
        "requires": [
          "growroom-a"
        ],
        "subs": [
          "Investigar ($30k) y comprar ($40k) la Grow Table",
          "Colocar la mesa desde el tablero Structure Plan de la pared",
          "Crear la mesa «A-1» en la pestaña Granja"
        ]
      },
      {
        "phase": "Early",
        "type": "Plantas",
        "q": "p",
        "down": true,
        "text": "Farmear plantas: llenar A-1 (6)",
        "target": 6,
        "notes": "Las moradas son mejores, pero las verdes valen de momento.",
        "subs": [
          "Ir en coche: cada planta ocupa 1 hueco de carga en el maletero",
          "Ruta de tiendas: gasolinera, armería de Downtown, joyerías, farmacias (también la trastienda)",
          "Si no hay suerte: hoteles Blueberry Hall y East Ocean, y casas o garajes",
          "Máscara puesta para cogerla; no saques el arma, porque se te cae",
          "Colocar las plantas en A-1 y pulsar «Plantado / cosechado ahora» en la pestaña Granja",
          "Apuntar en la pestaña Granja cuántas hay de cada color"
        ],
        "requires": [
          "mesa-a1"
        ]
      },
      {
        "phase": "Early",
        "type": "Otro",
        "text": "Rutina de cosecha (repetir siempre)",
        "target": 0,
        "notes": "Marca esta tarea cuando la tengas automatizada. Cada planta da 2-4 bolsas: verde $4k, morada $6k, dorada $8k.",
        "subs": [
          "Cuando suene el aviso: cosechar la mesa (la planta vuelve a crecer sola)",
          "Pulsar «Plantado / cosechado ahora» en esa mesa",
          "Vender las bolsas al Fence o en el Sales Center del distrito",
          "Coger el dinero del mostrador al momento y depositarlo o lavarlo"
        ]
      },
      {
        "phase": "Early",
        "type": "Taller / mejora",
        "text": "Fan en A-1 ($125k)",
        "target": 125000,
        "notes": "Según las guías, es la única mejora que compensa al principio.",
        "subs": [
          "Investigar el Fan ($100k)",
          "Comprar el Fan ($25k)",
          "Instalarlo en la mesa A-1 > Modificación",
          "Marcar Fan en A-1 en la pestaña Granja"
        ],
        "item": "fan",
        "requires": [
          "mesa-a1"
        ]
      },
      {
        "phase": "Early",
        "type": "Taller / mejora",
        "text": "Mesas A-2 a A-6 ($200k)",
        "target": 200000,
        "notes": "$40k por mesa (la investigación ya está pagada). Compra una cada vez que tengas el dinero: así producen antes.",
        "subs": [
          "Mesa A-2",
          "Mesa A-3",
          "Mesa A-4",
          "Mesa A-5",
          "Mesa A-6",
          "Crear A-2 a A-6 en la pestaña Granja"
        ],
        "id": "mesas-a",
        "item": "grow_table"
      },
      {
        "phase": "Early",
        "type": "Plantas",
        "q": "p",
        "down": true,
        "text": "Farmear plantas: llenar Granja A (36)",
        "target": 36,
        "notes": "Llena cada mesa en cuanto la coloques. Valen verdes.",
        "subs": [
          "A-2 (6 plantas)",
          "A-3 (6 plantas)",
          "A-4 (6 plantas)",
          "A-5 (6 plantas)",
          "A-6 (6 plantas)"
        ]
      },
      {
        "phase": "Early",
        "type": "Taller / mejora",
        "text": "Fan en A-2 a A-6 ($125k)",
        "target": 125000,
        "notes": "$25k por mesa. Después marca Fan en cada mesa de la pestaña Granja.",
        "subs": [
          "Fan A-2",
          "Fan A-3",
          "Fan A-4",
          "Fan A-5",
          "Fan A-6"
        ],
        "item": "fan",
        "requires": [
          "mesas-a"
        ]
      },
      {
        "phase": "Early",
        "type": "Otro",
        "text": "Proteger la base",
        "target": 0,
        "notes": "Una granja llena atrae asaltos. Los fusibles obligan a usar más decodificadores para hackear.",
        "subs": [
          "Poner fusibles electrónicos en el Grow Room y en la casa",
          "Instalar una alarma (la que avisa al dueño y al clan, si tienes clan)",
          "Poner un botiquín en la base para curarte y reaparecer allí"
        ],
        "item": "fuse_u"
      },
      {
        "phase": "Mid",
        "type": "Comprar",
        "text": "Land Plot Title Nv2 ($1M)",
        "target": 1000000,
        "notes": "Requiere laptop tier I y el título Nv1 investigado. Lleva aquí el dinero total ahorrado.",
        "subs": [
          "Investigar el título Nv2 ($200k)",
          "Ahorrar $800k (cosechas de la Granja A)",
          "Comprar el título Nv2"
        ],
        "id": "titulo-2",
        "item": "land_title_2"
      },
      {
        "phase": "Mid",
        "type": "Otro",
        "text": "Mudarse a distrito nivel 2",
        "target": 0,
        "notes": "La base se muda entera. No se puede con el bloqueo por asalto activo.",
        "subs": [
          "Cosechar y vender todo antes de mudarte",
          "Buscar un asentamiento nivel 2 con dueño y parcela libre",
          "Firmar el contrato y comprobar que llegan las mesas y las plantas",
          "Comprobar que el laptop ya es tier II",
          "Volver a pulsar «Plantado ahora» en las mesas si el ciclo se reinició"
        ],
        "id": "distrito-2",
        "requires": [
          "titulo-2"
        ]
      },
      {
        "phase": "Mid",
        "type": "Taller / mejora",
        "text": "Water Pump en la Granja A ($620k)",
        "target": 620000,
        "notes": "Tier II. Investigación $200k + $70k por mesa.",
        "subs": [
          "Investigar la Water Pump ($200k)",
          "Pump A-1",
          "Pump A-2",
          "Pump A-3",
          "Pump A-4",
          "Pump A-5",
          "Pump A-6",
          "Marcar Pump en las mesas A de la pestaña Granja"
        ],
        "item": "water_pump",
        "requires": [
          "distrito-2"
        ]
      },
      {
        "phase": "Mid",
        "type": "Taller / mejora",
        "text": "Montar Granja B: Grow Room + 6 mesas ($340k)",
        "target": 340000,
        "notes": "Va en la misma base que la Granja A (comprobado en el juego). Grow Room $100k + $40k por mesa.",
        "subs": [
          "Comprar y colocar el 2º Grow Room ($100k)",
          "Mesa B-1",
          "Mesa B-2",
          "Mesa B-3",
          "Mesa B-4",
          "Mesa B-5",
          "Mesa B-6",
          "Crear B-1 a B-6 en la pestaña Granja"
        ],
        "id": "granja-b",
        "item": "grow_room"
      },
      {
        "phase": "Mid",
        "type": "Plantas",
        "q": "p",
        "down": true,
        "text": "Farmear plantas: llenar Granja B (72 en total)",
        "target": 72,
        "notes": "Valen verdes. A partir de aquí, las moradas que encuentres ponlas en las mesas con más mejoras.",
        "subs": [
          "B-1 (6 plantas)",
          "B-2 (6 plantas)",
          "B-3 (6 plantas)",
          "B-4 (6 plantas)",
          "B-5 (6 plantas)",
          "B-6 (6 plantas)"
        ]
      },
      {
        "phase": "Mid",
        "type": "Taller / mejora",
        "text": "Fan + Water Pump en la Granja B ($570k)",
        "target": 570000,
        "notes": "$95k por mesa ($25k Fan + $70k Pump).",
        "subs": [
          "B-1",
          "B-2",
          "B-3",
          "B-4",
          "B-5",
          "B-6",
          "Marcar las mejoras en la pestaña Granja"
        ],
        "item": "water_pump",
        "requires": [
          "granja-b"
        ]
      },
      {
        "phase": "Mid",
        "type": "Plantas",
        "q": "p",
        "down": false,
        "text": "Reemplazar verdes: 36 moradas o mejores",
        "target": 36,
        "notes": "Solo se completa con moradas o doradas de verdad.",
        "subs": [
          "Cada vez que farmees plantas, coge solo moradas o doradas",
          "Cambiarlas por verdes, empezando por las mesas con más mejoras",
          "Vender las verdes retiradas al contrabandista (~$20k cada una)",
          "Actualizar los colores de cada mesa en la pestaña Granja"
        ]
      },
      {
        "phase": "Late",
        "type": "Comprar",
        "text": "Land Plot Title Nv3 ($3M)",
        "target": 3000000,
        "notes": "Requiere laptop tier II.",
        "subs": [
          "Investigar el título Nv3 ($1M)",
          "Ahorrar $2M",
          "Comprar el título Nv3"
        ],
        "id": "titulo-3",
        "item": "land_title_3"
      },
      {
        "phase": "Late",
        "type": "Otro",
        "text": "Mudarse a distrito nivel 3",
        "target": 0,
        "notes": "Hay más asaltos: refuerza la defensa antes de llenar la base de doradas.",
        "subs": [
          "Cosechar y vender todo antes de mudarte",
          "Buscar un asentamiento nivel 3 con dueño y parcela libre",
          "Firmar el contrato y comprobar que el laptop es tier III",
          "Poner fusibles en todas las estructuras (más que antes)",
          "Reiniciar los temporizadores de la pestaña Granja"
        ],
        "id": "distrito-3",
        "requires": [
          "titulo-3"
        ]
      },
      {
        "phase": "Late",
        "type": "Taller / mejora",
        "text": "UV Lamp en las 12 mesas ($3,5M)",
        "target": 3500000,
        "notes": "Tier III. Investigación $500k + $250k por mesa. Empieza por las mesas que tengan doradas.",
        "subs": [
          "Investigar la UV Lamp ($500k)",
          "UV A-1",
          "UV A-2",
          "UV A-3",
          "UV A-4",
          "UV A-5",
          "UV A-6",
          "UV B-1",
          "UV B-2",
          "UV B-3",
          "UV B-4",
          "UV B-5",
          "UV B-6",
          "Marcar UV en todas las mesas de la pestaña Granja"
        ],
        "item": "uv_lamp",
        "requires": [
          "distrito-3"
        ]
      },
      {
        "phase": "Late",
        "type": "Plantas",
        "q": "p",
        "down": false,
        "text": "Reemplazar verdes: 72 moradas o mejores",
        "target": 72,
        "notes": "Ya no debe quedar ninguna verde.",
        "subs": [
          "Granja A sin verdes",
          "Granja B sin verdes",
          "Vender las verdes retiradas al contrabandista"
        ]
      },
      {
        "phase": "Late",
        "type": "Plantas",
        "q": "o",
        "down": false,
        "text": "Reemplazar moradas: 36 doradas",
        "target": 36,
        "notes": "Una dorada da el doble que una verde en cada cosecha y vuelve a crecer dorada.",
        "subs": [
          "Farmear solo doradas",
          "Llenar primero la Granja A de doradas",
          "Vender las moradas retiradas al contrabandista (~$30k cada una)"
        ]
      },
      {
        "phase": "Late",
        "type": "Plantas",
        "q": "o",
        "down": false,
        "text": "META: 72 doradas",
        "target": 72,
        "notes": "72 × 3 bolsas × $8k = ~$1,7M por cosecha (~40 min con las 3 mejoras).",
        "subs": [
          "Granja B llena de doradas",
          "Mantener la rutina de cosecha y la defensa hasta el wipe"
        ]
      }
    ]
  },
  {
    "id": "reempaquetado",
    "version": 1,
    "name": "Contrabando: 4 bancos de reempaquetado",
    "goal": "Workshop con 4 Contraband Workbench · Label Printer y Tool Box en todos · vender cajas al Smuggler",
    "steps": [
      {
        "phase": "Early",
        "type": "Dinero",
        "text": "Capital inicial: 150k",
        "target": 150000,
        "notes": "El wipe llega a los 7 días: empieza en un servidor recién abierto. Todo el dinero va al título de parcela.",
        "subs": [
          "Ponte la máscara (modo Criminal) y roba tiendas pequeñas: gasolinera, farmacia, joyería",
          "Vende el botín al Fence y coge el dinero del mostrador al momento",
          "Abre cuenta en el banco como Civil y deposita cada vez que pases de ~50k",
          "Alternativa con menos riesgo: hacer turnos de policía (equipo gratis)"
        ]
      },
      {
        "id": "titulo-1",
        "phase": "Early",
        "type": "Comprar",
        "text": "Land Plot Title Nv1 ($150k)",
        "item": "land_title_1",
        "target": 150000,
        "notes": "Si el título no aparece en el inventario, contacta con soporte y dales tu UID (menú Esc, bajo tu nombre).",
        "subs": [
          "Laptop > árbol de Lenny > Documentos: investigar el título Nv1 ($50k)",
          "Comprar el título Nv1 ($100k)",
          "Comprobar que el título está en el inventario"
        ]
      },
      {
        "id": "parcela-1",
        "phase": "Early",
        "type": "Otro",
        "text": "Alquilar parcela en distrito nivel 1",
        "target": 0,
        "requires": [
          "titulo-1"
        ],
        "notes": "Solo se puede alquilar en asentamientos que ya tienen dueño. El tráiler tiene 1 hueco de banco de trabajo.",
        "subs": [
          "Buscar un asentamiento nivel 1 con dueño y parcela libre, mejor cerca de un Smuggler y del Sales Center",
          "Firmar el contrato en el cartel de la parcela",
          "Colocar la base (tráiler)",
          "En la pestaña Granja: tipo de base «Tráiler»"
        ]
      },
      {
        "id": "banco-1",
        "phase": "Early",
        "type": "Reempaquetado",
        "text": "Contraband Workbench 1 ($40k)",
        "item": "contraband_bench",
        "target": 40000,
        "requires": [
          "parcela-1"
        ],
        "notes": "Reempaqueta 1 caja cada vez (unos 30 min según pruebas de la comunidad). Ocupa el único hueco de banco del tráiler.",
        "subs": [
          "Investigar el banco en Shipments > árbol de Larry > Muebles ($20k)",
          "Comprar el banco ($20k)",
          "Colocarlo en la base",
          "Crear la estación «Banco 1» (Reempaquetado) en la pestaña Granja"
        ]
      },
      {
        "id": "primeras-cajas",
        "phase": "Early",
        "type": "Reempaquetado",
        "text": "Reempaquetar las primeras 5 cajas",
        "target": 5,
        "requires": [
          "banco-1"
        ],
        "notes": "Contraband Cargo: ~$10k en Lenny o en el vendedor de carga (~$5k en el Sales Center con descuento de asentamiento). Premium Cargo se vende a ~$35k y Rarity a ~$40k al Smuggler. Cuántas salen de cada tipo no está publicado: apúntalo.",
        "subs": [
          "Comprar Contraband Cargo",
          "Meter la caja en el banco y pulsar «Empezar» en la estación de la pestaña Granja",
          "Al terminar, vender la caja reempaquetada al Smuggler",
          "Apuntar cada venta real en la pestaña Granja",
          "Sumar 1 al progreso de este paso por cada caja"
        ]
      },
      {
        "phase": "Early",
        "type": "Otro",
        "text": "Rutina de reempaquetado (repetir siempre)",
        "target": 0,
        "notes": "Marca esta tarea cuando la tengas automatizada. El banco no trabaja en paralelo: cuanto antes metas la siguiente caja, más ganas por hora.",
        "subs": [
          "Cuando suene el aviso: sacar la caja y meter la siguiente",
          "Pulsar «Empezar» otra vez en esa estación",
          "Vender las cajas al Smuggler y coger el dinero al momento",
          "Depositar o lavar el dinero"
        ]
      },
      {
        "id": "printer-1",
        "phase": "Early",
        "type": "Reempaquetado",
        "text": "Label Printer (Uncommon) en el Banco 1 ($45k)",
        "item": "label_printer_u",
        "target": 45000,
        "requires": [
          "banco-1"
        ],
        "notes": "+15% de velocidad de reempaquetado.",
        "subs": [
          "Investigar la Label Printer Uncommon ($15k)",
          "Comprarla ($30k) e instalarla en el Banco 1",
          "Marcar la mejora en la estación de la pestaña Granja"
        ]
      },
      {
        "id": "workshop",
        "phase": "Early",
        "type": "Comprar",
        "text": "Cambiar la base a Workshop ($200k)",
        "item": "workshop",
        "target": 200000,
        "requires": [
          "parcela-1"
        ],
        "notes": "4 huecos de banco de trabajo en vez de 1. Los bancos de carga (Cargo Workbench) comparten esos huecos.",
        "subs": [
          "Investigar el Workshop ($125k)",
          "Comprarlo ($75k) y colocarlo como base",
          "Recolocar el Banco 1",
          "En la pestaña Granja: tipo de base «Workshop»"
        ]
      },
      {
        "id": "bancos",
        "phase": "Early",
        "type": "Reempaquetado",
        "text": "Bancos 2 a 4 ($60k)",
        "item": "contraband_bench",
        "target": 60000,
        "requires": [
          "workshop"
        ],
        "notes": "$20k por banco (la investigación ya está pagada). Compra uno cada vez que tengas el dinero: así producen antes.",
        "subs": [
          "Banco 2",
          "Banco 3",
          "Banco 4",
          "Crear las estaciones 2 a 4 en la pestaña Granja"
        ]
      },
      {
        "phase": "Early",
        "type": "Reempaquetado",
        "text": "Label Printer (Uncommon) en los bancos 2 a 4 ($90k)",
        "item": "label_printer_u",
        "target": 90000,
        "requires": [
          "bancos",
          "printer-1"
        ],
        "notes": "$30k por banco.",
        "subs": [
          "Banco 2",
          "Banco 3",
          "Banco 4",
          "Marcar la mejora en cada estación de la pestaña Granja"
        ]
      },
      {
        "phase": "Early",
        "type": "Otro",
        "text": "Proteger la base",
        "item": "fuse_u",
        "target": 0,
        "notes": "Las cajas guardadas atraen asaltos. Vende a menudo en vez de acumular.",
        "subs": [
          "Poner fusibles en el Workshop",
          "Instalar una alarma (la que avisa al dueño y al clan, si tienes clan)",
          "Poner un botiquín en la base"
        ]
      },
      {
        "id": "titulo-2",
        "phase": "Mid",
        "type": "Comprar",
        "text": "Land Plot Title Nv2 ($1M)",
        "item": "land_title_2",
        "target": 1000000,
        "notes": "Requiere laptop tier I y el título Nv1 investigado.",
        "subs": [
          "Investigar el título Nv2 ($200k)",
          "Ahorrar $800k con los 4 bancos",
          "Comprar el título Nv2"
        ]
      },
      {
        "id": "distrito-2",
        "phase": "Mid",
        "type": "Otro",
        "text": "Mudarse a distrito nivel 2",
        "target": 0,
        "requires": [
          "titulo-2"
        ],
        "notes": "La base se muda entera. No se puede con el bloqueo por asalto activo.",
        "subs": [
          "Terminar y vender todas las cajas antes de mudarte",
          "Buscar un asentamiento nivel 2 con dueño y parcela libre",
          "Firmar el contrato y comprobar que llegan los 4 bancos",
          "Comprobar que el laptop ya es tier II"
        ]
      },
      {
        "id": "toolbox-e",
        "phase": "Mid",
        "type": "Reempaquetado",
        "text": "Tool Box (Epic) en los 4 bancos ($950k)",
        "item": "tool_box_e",
        "target": 950000,
        "requires": [
          "distrito-2"
        ],
        "notes": "No da velocidad: añade un hueco de caja en cola, así el banco sigue trabajando mientras no estás. Si sueles estar pendiente del aviso, puedes dejarla para después.",
        "subs": [
          "Investigar la Tool Box Epic ($150k)",
          "Banco 1 ($200k)",
          "Banco 2 ($200k)",
          "Banco 3 ($200k)",
          "Banco 4 ($200k)",
          "Marcar la mejora en cada estación de la pestaña Granja"
        ]
      },
      {
        "phase": "Mid",
        "type": "Otro",
        "text": "Subir notoriedad con el Smuggler",
        "target": 0,
        "notes": "El bonus de venta del Smuggler va de +0% a +25% según el nivel (los niveles intermedios no están confirmados).",
        "subs": [
          "Vender siempre al mismo Smuggler",
          "Apuntar tu nivel de notoriedad en la pestaña Granja cuando suba"
        ]
      },
      {
        "id": "titulo-3",
        "phase": "Late",
        "type": "Comprar",
        "text": "Land Plot Title Nv3 ($3M)",
        "item": "land_title_3",
        "target": 3000000,
        "notes": "Requiere laptop tier II.",
        "subs": [
          "Investigar el título Nv3 ($1M)",
          "Ahorrar $2M",
          "Comprar el título Nv3"
        ]
      },
      {
        "id": "distrito-3",
        "phase": "Late",
        "type": "Otro",
        "text": "Mudarse a distrito nivel 3",
        "target": 0,
        "requires": [
          "titulo-3"
        ],
        "notes": "Hay más asaltos: refuerza la defensa antes.",
        "subs": [
          "Terminar y vender todas las cajas antes de mudarte",
          "Buscar un asentamiento nivel 3 con dueño y parcela libre",
          "Firmar el contrato y comprobar que el laptop es tier III",
          "Poner más fusibles"
        ]
      },
      {
        "phase": "Late",
        "type": "Reempaquetado",
        "text": "Label Printer (Legendary) en los 4 bancos ($675k)",
        "item": "label_printer_l",
        "target": 675000,
        "requires": [
          "distrito-3"
        ],
        "notes": "+25% de velocidad según una sola fuente. Comprueba en tu banco si de verdad acorta el tiempo antes de comprar las 4.",
        "subs": [
          "Investigar la Label Printer Legendary ($75k)",
          "Banco 1 ($150k)",
          "Banco 2 ($150k)",
          "Banco 3 ($150k)",
          "Banco 4 ($150k)",
          "Marcar la mejora en cada estación de la pestaña Granja"
        ]
      },
      {
        "phase": "Late",
        "type": "Reempaquetado",
        "text": "Tool Box (Legendary) en los 4 bancos ($1,9M)",
        "item": "tool_box_l",
        "target": 1900000,
        "requires": [
          "distrito-3",
          "toolbox-e"
        ],
        "notes": "Opcional: +2 huecos en cola (una fuente). Solo compensa si pasas mucho tiempo lejos de la base.",
        "subs": [
          "Investigar la Tool Box Legendary ($300k)",
          "Banco 1 ($400k)",
          "Banco 2 ($400k)",
          "Banco 3 ($400k)",
          "Banco 4 ($400k)"
        ]
      },
      {
        "phase": "Late",
        "type": "Otro",
        "text": "META: 4 bancos al máximo",
        "target": 0,
        "notes": "Mira en Calculadoras cuánto ganas por hora y qué te frena.",
        "subs": [
          "Mantener los 4 bancos siempre trabajando",
          "Mantener la defensa hasta el wipe"
        ]
      }
    ]
  },
  {
    "id": "taller-quimico",
    "version": 1,
    "name": "Taller químico: laboratorio al máximo",
    "goal": "Chemical Laboratory con Reactor III, Congelador III, evaporador y refrigerante · vender Hard Crystals al Smuggler",
    "steps": [
      {
        "phase": "Early",
        "type": "Dinero",
        "text": "Capital inicial: 150k",
        "target": 150000,
        "notes": "El wipe llega a los 7 días: empieza en un servidor recién abierto. Todo el dinero va al título de parcela.",
        "subs": [
          "Ponte la máscara (modo Criminal) y roba tiendas pequeñas: gasolinera, farmacia, joyería",
          "Vende el botín al Fence y coge el dinero del mostrador al momento",
          "Abre cuenta en el banco como Civil y deposita cada vez que pases de ~50k",
          "Alternativa con menos riesgo: hacer turnos de policía (equipo gratis)"
        ]
      },
      {
        "id": "titulo-1",
        "phase": "Early",
        "type": "Comprar",
        "text": "Land Plot Title Nv1 ($150k)",
        "item": "land_title_1",
        "target": 150000,
        "notes": "Si el título no aparece en el inventario, contacta con soporte y dales tu UID (menú Esc, bajo tu nombre).",
        "subs": [
          "Laptop > árbol de Lenny > Documentos: investigar el título Nv1 ($50k)",
          "Comprar el título Nv1 ($100k)",
          "Comprobar que el título está en el inventario"
        ]
      },
      {
        "id": "parcela-1",
        "phase": "Early",
        "type": "Otro",
        "text": "Alquilar parcela en distrito nivel 1",
        "target": 0,
        "requires": [
          "titulo-1"
        ],
        "notes": "Solo se puede alquilar en asentamientos que ya tienen dueño.",
        "subs": [
          "Buscar un asentamiento nivel 1 con dueño y parcela libre, mejor apartado: el humo del laboratorio delata la base",
          "Firmar el contrato en el cartel de la parcela",
          "Colocar la base"
        ]
      },
      {
        "phase": "Early",
        "type": "Dinero",
        "text": "Ahorrar 365k para el laboratorio",
        "target": 365000,
        "notes": "Mínimo para producir: laboratorio $270k + Reactor I $60k + Congelador I $35k.",
        "subs": [
          "Seguir con robos o policía y depositar en el banco"
        ]
      },
      {
        "id": "lab",
        "phase": "Early",
        "type": "Taller químico",
        "text": "Chemical Laboratory ($270k)",
        "item": "chem_lab",
        "target": 270000,
        "requires": [
          "parcela-1"
        ],
        "notes": "Edificio con solo 3 de defensa.",
        "subs": [
          "Investigar el laboratorio en Shipments > Producción ($160k)",
          "Comprarlo ($110k)",
          "Colocarlo con el plano de la parcela",
          "Crear la estación «Laboratorio» (Taller químico) en la pestaña Granja"
        ]
      },
      {
        "id": "reactor-1",
        "phase": "Early",
        "type": "Taller químico",
        "text": "Chemical Reactor I ($60k)",
        "item": "reactor_1",
        "target": 60000,
        "requires": [
          "lab"
        ],
        "notes": "Unos 60 min por tanda (tiempos de una fuente).",
        "subs": [
          "Investigar el Reactor I ($20k)",
          "Comprarlo ($40k) y colocarlo en el laboratorio",
          "Poner reactor tier I en la estación de la pestaña Granja"
        ]
      },
      {
        "id": "congelador-1",
        "phase": "Early",
        "type": "Taller químico",
        "text": "Industrial Freezer I ($35k)",
        "item": "freezer_1",
        "target": 35000,
        "requires": [
          "lab"
        ],
        "notes": "4 bandejas. El tiempo de congelado no está claro (6 o ~30 min según la fuente): apunta el tuyo en la estación.",
        "subs": [
          "Investigar el congelador I ($15k)",
          "Comprarlo ($20k) y colocarlo en el laboratorio"
        ]
      },
      {
        "id": "primer-lote",
        "phase": "Early",
        "type": "Taller químico",
        "text": "Primer lote de Hard Crystals",
        "target": 0,
        "requires": [
          "reactor-1",
          "congelador-1"
        ],
        "notes": "Cuántos cristales salen por lote no está publicado: apúntalo en la estación para que la app calcule tu ganancia. Precio al Smuggler: Uncommon ~$30k, Epic ~$45k, Legendary ~$75k. Cada Reagent Canister vale ~$20k vendido al Smuggler: eso es lo que te cuesta gastarlo.",
        "subs": [
          "Conseguir Reagent Canisters",
          "Cargar el reactor y pulsar «Empezar» en la estación de la pestaña Granja",
          "Pasar el resultado al congelador",
          "Recoger los cristales",
          "Apuntar en la estación cuántos cristales salieron y de qué calidad",
          "Vender al Smuggler y apuntar la venta real"
        ]
      },
      {
        "phase": "Early",
        "type": "Otro",
        "text": "Rutina del laboratorio (repetir siempre)",
        "target": 0,
        "notes": "Marca esta tarea cuando la tengas automatizada.",
        "subs": [
          "Cuando suene el aviso: pasar al congelador o recoger cristales",
          "Volver a cargar el reactor y pulsar «Empezar»",
          "Vender los cristales al Smuggler y coger el dinero al momento",
          "Depositar o lavar el dinero"
        ]
      },
      {
        "phase": "Early",
        "type": "Taller químico",
        "text": "Lab Table ($25k, opcional)",
        "item": "lab_table",
        "target": 25000,
        "requires": [
          "lab"
        ],
        "notes": "Rompe Hard Crystals en polvo (~10 s). El polvo se vende al Fence: compara precios antes de decidir.",
        "subs": [
          "Investigar la Lab Table ($10k)",
          "Comprarla ($15k) y colocarla"
        ]
      },
      {
        "phase": "Early",
        "type": "Otro",
        "text": "Proteger el laboratorio",
        "item": "fuse_u",
        "target": 0,
        "notes": "El laboratorio solo tiene 3 de defensa y el humo se ve de lejos. No acumules cristales: vende a menudo.",
        "subs": [
          "Poner fusibles en el laboratorio y en la base",
          "Instalar una alarma (la que avisa al dueño y al clan, si tienes clan)",
          "Poner un botiquín en la base"
        ]
      },
      {
        "id": "titulo-2",
        "phase": "Mid",
        "type": "Comprar",
        "text": "Land Plot Title Nv2 ($1M)",
        "item": "land_title_2",
        "target": 1000000,
        "notes": "Requiere laptop tier I y el título Nv1 investigado.",
        "subs": [
          "Investigar el título Nv2 ($200k)",
          "Ahorrar $800k con el laboratorio",
          "Comprar el título Nv2"
        ]
      },
      {
        "id": "distrito-2",
        "phase": "Mid",
        "type": "Otro",
        "text": "Mudarse a distrito nivel 2",
        "target": 0,
        "requires": [
          "titulo-2"
        ],
        "notes": "La base se muda entera. No se puede con el bloqueo por asalto activo.",
        "subs": [
          "Terminar el lote y vender los cristales antes de mudarte",
          "Buscar un asentamiento nivel 2 con dueño y parcela libre",
          "Firmar el contrato y comprobar que llega el laboratorio",
          "Comprobar que el laptop ya es tier II"
        ]
      },
      {
        "id": "reactor-2",
        "phase": "Mid",
        "type": "Taller químico",
        "text": "Chemical Reactor II ($450k)",
        "item": "reactor_2",
        "target": 450000,
        "requires": [
          "distrito-2",
          "reactor-1"
        ],
        "notes": "Unos 53 min por tanda (una fuente).",
        "subs": [
          "Investigar el Reactor II ($150k)",
          "Comprarlo ($300k) y cambiarlo por el I",
          "Poner reactor tier II en la estación de la pestaña Granja"
        ]
      },
      {
        "id": "congelador-2",
        "phase": "Mid",
        "type": "Taller químico",
        "text": "Industrial Freezer II ($120k)",
        "item": "freezer_2",
        "target": 120000,
        "requires": [
          "distrito-2",
          "congelador-1"
        ],
        "notes": "6 bandejas.",
        "subs": [
          "Investigar el congelador II ($30k)",
          "Comprarlo ($90k) y cambiarlo por el I"
        ]
      },
      {
        "phase": "Mid",
        "type": "Taller químico",
        "text": "Improved Evaporator ($140k)",
        "item": "evaporator",
        "target": 140000,
        "requires": [
          "distrito-2",
          "congelador-1"
        ],
        "notes": "Congela un 11,7% más rápido.",
        "subs": [
          "Investigar el evaporador ($40k)",
          "Comprarlo ($100k) e instalarlo",
          "Marcar la mejora en la estación de la pestaña Granja"
        ]
      },
      {
        "phase": "Mid",
        "type": "Otro",
        "text": "Subir notoriedad con el Smuggler",
        "target": 0,
        "notes": "El bonus de venta del Smuggler va de +0% a +25% según el nivel (los niveles intermedios no están confirmados).",
        "subs": [
          "Vender siempre al mismo Smuggler",
          "Apuntar tu nivel de notoriedad en la pestaña Granja cuando suba"
        ]
      },
      {
        "id": "titulo-3",
        "phase": "Late",
        "type": "Comprar",
        "text": "Land Plot Title Nv3 ($3M)",
        "item": "land_title_3",
        "target": 3000000,
        "notes": "Requiere laptop tier II.",
        "subs": [
          "Investigar el título Nv3 ($1M)",
          "Ahorrar $2M",
          "Comprar el título Nv3"
        ]
      },
      {
        "id": "distrito-3",
        "phase": "Late",
        "type": "Otro",
        "text": "Mudarse a distrito nivel 3",
        "target": 0,
        "requires": [
          "titulo-3"
        ],
        "notes": "Hay más asaltos y el laboratorio es frágil: refuerza la defensa antes.",
        "subs": [
          "Terminar el lote y vender los cristales antes de mudarte",
          "Buscar un asentamiento nivel 3 con dueño y parcela libre",
          "Firmar el contrato y comprobar que el laptop es tier III",
          "Poner más fusibles en el laboratorio"
        ]
      },
      {
        "phase": "Late",
        "type": "Taller químico",
        "text": "Chemical Reactor III ($1,05M)",
        "item": "reactor_3",
        "target": 1050000,
        "requires": [
          "distrito-3",
          "reactor-2"
        ],
        "notes": "Unos 45 min por tanda (una fuente).",
        "subs": [
          "Investigar el Reactor III ($350k)",
          "Comprarlo ($700k) y cambiarlo por el II",
          "Poner reactor tier III en la estación de la pestaña Granja"
        ]
      },
      {
        "phase": "Late",
        "type": "Taller químico",
        "text": "Industrial Freezer III ($350k)",
        "item": "freezer_3",
        "target": 350000,
        "requires": [
          "distrito-3",
          "congelador-2"
        ],
        "notes": "8 bandejas.",
        "subs": [
          "Investigar el congelador III ($100k)",
          "Comprarlo ($250k) y cambiarlo por el II"
        ]
      },
      {
        "phase": "Late",
        "type": "Taller químico",
        "text": "Quality Refrigerant ($350k)",
        "item": "refrigerant",
        "target": 350000,
        "requires": [
          "distrito-3",
          "congelador-1"
        ],
        "notes": "Congela un 13% más rápido y se suma al evaporador.",
        "subs": [
          "Investigar el refrigerante ($100k)",
          "Comprarlo ($250k) e instalarlo",
          "Marcar la mejora en la estación de la pestaña Granja"
        ]
      },
      {
        "phase": "Late",
        "type": "Otro",
        "text": "META: laboratorio al máximo",
        "target": 0,
        "notes": "Mira en Calculadoras cuánto ganas por hora y qué te frena.",
        "subs": [
          "Mantener el reactor siempre trabajando",
          "Mantener la defensa hasta el wipe"
        ]
      }
    ]
  }
];
