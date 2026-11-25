# Datos del juego: fuentes, confianza y cómo actualizarlos

Todos los números que usa Rob Run Planner están en **`catalogo.js`**: precios, requisitos, efectos de mejoras, límites, bonus de notoriedad y valores por defecto de producción. Cada dato lleva:

- `conf`: el nivel de confianza.
- `src`: las fuentes (claves de `SOURCES`, con URL y fecha).
- `alt`: la alternativa, cuando las fuentes no coinciden.
- `notes`: aclaraciones.

La pestaña **Datos del juego** de la app muestra el catálogo completo con sus fuentes.

Kefir **no publica tablas de precios**. Sus notas de parche (por ejemplo, el 4 de noviembre: «los negocios de la base pagan mucho más») no dan cifras. Por eso todo viene de wikis de fans, muchas de las cuales copian los datos de robrun.info. Que dos fuentes coincidan reduce el riesgo de error, pero no lo elimina.

| `conf` | Significado | Efecto en la app |
|---|---|---|
| `confirmado` | 2 o más fuentes coinciden | Un requisito incumplido es **error** |
| `una-fuente` | Solo lo dice una fuente | Un requisito incumplido es **advertencia** |
| `discrepancia` | Las fuentes no coinciden; se usa el valor mayoritario y la otra opción va en `alt` | Advertencia |
| `jugador` | Lo comprobó el jugador en su partida | Cuenta como dato fiable, pero un límite no confirmado por fuentes es advertencia |
| `estimado` | Cálculo de la comunidad | Advertencia |
| `pendiente` | No se encontró el dato | Advertencia; el valor es un marcador editable |

## Estado a 2026-11-24 (build 0.7.0.4005–0.7.0.4040)

**Confirmado por varias fuentes:**
- Títulos de parcela y de asentamiento (niveles 1 a 3).
- Grow Room, Grow Table, Fan, Water Pump y UV Lamp, con su tier.
- Límites: 6 mesas por sala y 6 plantas por mesa.
- Bolsas: 2 a 4 por cosecha, a $4k / $6k / $8k.
- Banco de contrabando: coste, tiempo de reempaquetado (unos 30 minutos) y precios de las cajas (Premium $35k, Rarity $40k).
- Banco de contrabando: procesa una sola caja a la vez.
- Huecos de banco de trabajo por tipo de base: tráiler 1, Small House 2, Mansion 3, Workshop 4.
- Costes del laboratorio químico y sus máquinas, y precios de los Hard Crystals ($30k / $45k / $75k).
- Bonus de notoriedad en el Fence: +0 / 10 / 20 / 35 / 50 %.
- El wipe llega a los 7 días.

**Discrepancias conocidas** (la app deja elegir o editar el valor):
1. **Cómo se combinan las mejoras de velocidad.** Hay tres lecturas: se suman y dividen el tiempo (60 → 40 minutos, robrun.pro), se restan del tiempo (60 → 30 minutos, wikily y tposegaming), o se multiplican. Lo eliges en la pestaña Granja.
2. **Requisito del Grow Room.** Unas guías piden el título Nv1 y Sportskeeda el Nv2.
3. **Label Printer Legendary.** robrunmap dice +25 %; robrun.run dice que no está confirmado.
4. **Tool Box.** robrunmap dice +1 / +2 huecos de cola; otras guías solo dicen «más capacidad».
5. **Precio del Contraband Cargo.** $10k con Lenny; $5k en el Sales Center (descuento de asentamiento).
6. **Tiempo del congelador.** 360 s por paso (timesaver) o unos 30 minutos (jugadores).
7. **Bonus del Smuggler en los niveles intermedios.** +5 / 10 / 15 %, según robrun.info sin probar.
8. **Valores alternativos de robrun.pro.** Su cuadro de objetos relacionados da precios de alrededor del 40 % de los que dan las demás fuentes. Se descartan.

**Sin encontrar** (la app no los inventa):
- Máximo de Grow Rooms por base. El jugador comprobó que caben al menos 2.
- Probabilidad de que salga Premium o Rarity al reempaquetar.
- Cristales por lote y reactivos por ciclo. Por eso el laboratorio pide que apuntes tus cristales por lote.
- Coste y velocidad del Laundering Desk.
- Alquiler de parcelas: desde el 4 de noviembre se paga con documentos.

## Fuentes consultadas

- **Fuentes del catálogo:** las de `SOURCES` en `catalogo.js`. Entre ellas: timesaver.gg, wipeplanner.online, showgamer.com, robrunwiki.net, robrunwiki.com, robrun.pro, robrun.run, robrunwipe.com, robrunmap.com, robrundb.wiki, robrungg.wiki, wikily.gg, igamemag.com, robrun-game.com y robrun.fyi.
- **Parches:** robrun.info/en/updates, robrun-wiki.com/en/patches y robrungg.wiki/updates.
- **No se usa:** el `data.js` del planificador de robrun.info, porque es propietario. Solo se leen sus páginas de texto.
- **No se pudieron leer:** metaforge.app (403), sportskeeda (405) y SteamDB (403). Las noticias de Steam se cargan con JavaScript; hay que revisarlas a mano.
- **Cuidado:** el repositorio `GeneralAlternator/robrun-raid-calculator-2026` pide ejecutar un .exe como administrador y tiene etiquetas de «esp» y «trainer». Probablemente es malware: no lo enlaces ni lo uses.

## Iconos

- **Origen:** todos los iconos de la app están dibujados para este proyecto (`iconos.js`, SVG de 24×24 con trazo). Se publican con el resto del repositorio y no se descarga nada al usarlos.
- **Por qué no se usan los del juego:** Kefir no publica un press kit ni unos términos que permitan redistribuir sus iconos. Las wikis de fans los muestran bajo «fair use», que no cubre meterlos en un programa público. Tampoco se pueden sacar de los archivos del juego (EULA y Easy Anti-Cheat). Revisado el 2026-11-24.
- **Si Kefir publica sus recursos con licencia:** se pueden cambiar en `iconos.js` sin tocar nada más. Apunta la fuente y la licencia aquí.
- **Cómo se enlazan:** `RR_ICONS.items` asigna un icono a cada id de `catalogo.js`; lo que no esté ahí usa el icono de su categoría (`RR_ICONS.cats`). La rareza del id (`_u`/`_e`/`_l`, `_2`/`_3`) colorea el borde (verde, morado, dorado). Un test comprueba que todos los elementos, tipos de paso, estaciones y fases tienen icono.
- **Para un elemento nuevo:** añade su id a `items` en `iconos.js`, y si no hay un dibujo que encaje, añade uno nuevo a `P` con el mismo estilo (trazo `currentColor`, sin relleno, 24×24).

## Cómo actualizar los datos tras un parche

1. **Busca los cambios.** Lee el parche en Steam (`store.steampowered.com/news/app/4262460`, en un navegador) y en los índices de parches de arriba. Apunta qué cifras cambian.
2. **Contrasta.** Busca cada cifra en al menos dos wikis con fecha posterior al parche. Si solo una la recoge, márcala `una-fuente`; si no coinciden, `discrepancia` con `alt`. No copies datos de herramientas propietarias.
3. **Edita `catalogo.js`:**
   - Cambia el valor, `conf`, `src` (añade la fuente a `SOURCES` con su fecha), `version` y `verified`, y la build en `game`.
   - Si un elemento desaparece del juego, **no borres su id** sin más: las rutas que lo usan mostrarán la advertencia «ya no está en el catálogo». Es mejor dejarlo con una nota de «retirado en el parche X».
   - Para un elemento nuevo, usa un id en minúsculas sin espacios, con `requires` y `tier` si los tiene.
4. **Revisa las reglas.** Si cambia una mecánica (cómo se combinan las mejoras, el paralelismo, los límites), ajusta `calc()` o `validateRoute()` en `core.js` y sus tests en `tests/core.test.js`.
5. **Revisa las rutas incluidas.** Ejecuta `npm test`. Si cambias `ruta-2-granjas.json`, sube su `version` y regenera `rutas-incluidas.js` (ver CLAUDE.md). Los usuarios verán un aviso para añadir la versión nueva sin perder su progreso.
6. **Documenta.** Anota los cambios en `CHANGELOG.md`.
