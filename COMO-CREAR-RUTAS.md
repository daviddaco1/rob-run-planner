# Cómo crear rutas para Rob Run Planner

Una ruta es un archivo `.json` con una lista de tareas (y subtareas) para llegar a una meta en un wipe.
Cualquiera puede crear una, compartirla y que otros la carguen con el botón **Importar**.

> Rob Run Planner es una herramienta 100% externa y manual: no lee, no modifica ni automatiza nada del juego.
> Hace lo mismo que una libreta con papel y lápiz, así que no infringe las normas del juego.

---

## Forma más fácil: hacerla dentro de la app

1. Abre la app y pulsa **Nueva ruta**.
2. Añade pasos con **+ Añadir paso** en cada fase (Early, Mid y Late) y subtareas con **+ Subtarea**.
3. En cada paso, elige el **Elemento del juego** del catálogo (por ejemplo «Water Pump»). La app:
   - te avisa si falta algún requisito (la Water Pump necesita una Grow Table y una parcela en un distrito de nivel 2);
   - puede añadir el paso que falta con un clic;
   - puede poner la meta al precio del catálogo y sugerir subtareas.
4. Si un paso solo puede hacerse después de otro, usa **Depende de**. El paso queda **bloqueado** hasta que el otro esté completado.
5. Revisa el cuadro **Revisión de la ruta**. Cada problema explica por qué ocurre y casi todos tienen un botón para arreglarlo.
6. Pulsa **Exportar ruta**. Se guarda un `.json` con esa ruta, listo para compartir. Quien lo reciba pulsa **Importar**.

### Errores, advertencias y borradores

- **Error**: la ruta es imposible tal como está. Por ejemplo, una dependencia circular, o un paso que necesita algo que está *después* en la ruta. Una ruta activa nunca se queda con errores: si una edición los crea, la app no la aplica y te ofrece **guardarla como borrador** aparte.
- **Advertencia**: la ruta es posible, pero hay algo dudoso o que depende de un dato sin confirmar. Por ejemplo, falta un requisito que quizá ya tengas. En ese caso pulsa **Ya lo tengo**.
- **Información**: sugerencias.
- **Borrador** (✎ en el desplegable): puede tener errores mientras lo terminas, pero no se puede **Activar** hasta corregirlos. Si exportas un borrador, el archivo se marca como borrador. Las rutas importadas con errores entran como borrador.

---

## Estructura del archivo

```json
{
  "name": "Nombre de la ruta",
  "goal": "Meta final en una línea",
  "have": ["land_title_1"],
  "steps": [
    { "id": "ahorro", "phase": "Early", "type": "Dinero", "text": "Ahorrar 150k", "target": 150000,
      "notes": "Consejos, requisitos, precios...",
      "subs": [ "Primera subtarea", "Segunda subtarea" ] },
    { "phase": "Early", "type": "Taller / mejora", "text": "Grow Room", "item": "grow_room", "target": 250000,
      "requires": ["ahorro"] }
  ]
}
```

El archivo puede tener **una ruta**, como el ejemplo de arriba, o **varias**: `{ "routes": [ {ruta 1}, {ruta 2} ] }`. Este segundo formato es el que genera la copia completa de la pestaña **Copias**.

El esquema formal está en [`schema/ruta.schema.json`](schema/ruta.schema.json). La app es tolerante: si algo no encaja, lo corrige y te dice qué cambió.

### Campos de la ruta

| Campo   | Obligatorio | Qué es |
|---------|-------------|--------|
| `name`  | sí | Nombre que sale en el desplegable. |
| `goal`  | no | Meta final (texto). |
| `have`  | no | Elementos del catálogo que se dan por conseguidos de antes (requisitos cumplidos). |
| `draft` | no | `true` para marcarla como borrador. |
| `steps` | sí | Lista de pasos, en orden. |

### Campos de cada paso

| Campo      | Valores | Qué hace |
|------------|---------|----------|
| `phase`    | `"Early"`, `"Mid"`, `"Late"` | Fase donde aparece. Si escribes otra cosa, va a `"Early"`. |
| `type`     | `"Dinero"`, `"Comprar"`, `"Conseguir item"`, `"Craftear"`, `"Taller / mejora"`, `"Título"`, `"Plantas"`, `"Reempaquetado"`, `"Taller químico"`, `"Otro"` | Tipo de paso. Si escribes otra cosa, se convierte en `"Otro"`. |
| `text`     | texto | Qué hay que hacer (título del paso). |
| `target`   | número ≥ 0 | Meta numérica (por ejemplo, `150000` para 150k). `0` = sin meta. |
| `notes`    | texto | Notas: dónde farmear, requisitos, precios. |
| `subs`     | lista de textos | Subtareas en orden. Al marcarlas todas, el paso se completa solo. |
| `item`     | id del catálogo | Elemento del juego que consigue el paso (ver la tabla de abajo). Activa la comprobación de requisitos. |
| `id`       | texto corto | Solo hace falta si otro paso depende de este. |
| `requires` | lista de `id` | Pasos que deben completarse antes. Un paso que dependa de otro que va después es un error. |

Campos solo para pasos de tipo **`"Plantas"`** (se completan solos con el conteo de la pestaña **Granja**):

| Campo    | Valores | Qué hace |
|----------|---------|----------|
| `target` | número | Cuántas plantas hacen falta en total. |
| `q`      | `"g"` verde, `"p"` morada, `"o"` dorada | Calidad mínima. Cuentan esa calidad y las mejores. |
| `down`   | `true` / `false` | `true` = acepta calidad inferior de forma provisional (el paso sale con borde naranja). Úsalo en early y pide la calidad de verdad más adelante con otro paso en `false`. |

Para compartir una ruta en limpio, no pongas `progress` ni `done`: si los incluyes, quien la importe la verá con el progreso ya marcado. Los `id` se renuevan al importar, pero las dependencias (`requires`) se mantienen.

### Estado de cada paso

| Estado | Cuándo |
|---|---|
| **Completada** | Marcada a mano, o «Llevo» llega a la meta, o todas las subtareas hechas. En Plantas: hay suficientes plantas de la calidad pedida. |
| **Provisional** | Solo Plantas con `down: true`: la cantidad se cubre con plantas de peor calidad. |
| **Bloqueada** | Algún paso de `requires` no está completado. «Siguiente» la salta. |
| **En progreso** | «Llevo» > 0, alguna subtarea hecha o alguna planta que cuenta. |
| **Pendiente** | Todo lo demás. |

---

## Elementos del catálogo (`item`)

Los más usados (la lista completa, con precios y fuentes, está en la pestaña **Datos del juego**):

| id | Elemento | Requiere |
|---|---|---|
| `land_title_1` / `_2` / `_3` | Land Plot Title Nv1 / Nv2 / Nv3 | el nivel anterior |
| `settlement_title_1` / `_2` / `_3` | Settlement Title Nv1 / Nv2 / Nv3 | el nivel anterior |
| `grow_room` | Grow Room | `land_title_1` |
| `grow_table` | Grow Table | `grow_room` |
| `fan` / `water_pump` / `uv_lamp` | Mejoras de mesa | `grow_table` (+ parcela nivel 2 / 3 para Pump / UV) |
| `contraband_bench` | Contraband Workbench | `land_title_1` |
| `label_printer_u` / `label_printer_l` | Label Printer Uncommon / Legendary | banco / Uncommon (+ nivel 3) |
| `tool_box_e` / `tool_box_l` | Tool Box Epic / Legendary | banco (+ nivel 2 / 3) |
| `cargo_bench` | Cargo Workbench | `land_title_1` |
| `chem_lab` | Chemical Laboratory | `land_title_1` |
| `reactor_1` / `_2` / `_3`, `freezer_1` / `_2` / `_3` | Reactor y congelador por tier | `chem_lab` / el tier anterior |
| `lab_table`, `lab_scales`, `evaporator`, `refrigerant` | Mesa de laboratorio y mejoras | ver catálogo |
| `trailer`, `small_house`, `mansion`, `workshop` | Tipos de base | `land_title_1` |
| `bank_account`, `fuse_u` / `fuse_e` / `fuse_l`, `collection_table` | Otros | — |

Los elementos de **tier 2 o 3** necesitan además una parcela en un distrito de ese nivel. La app lo comprueba con el título de parcela de ese nivel.

---

## Ejemplo completo

```json
{
  "name": "Mi ruta: primera granja",
  "goal": "Grow Room con 6 mesas y Fan en todas",
  "steps": [
    { "id": "ahorro", "phase": "Early", "type": "Dinero", "text": "Ahorrar 150k", "target": 150000,
      "subs": [ "Robar tiendas pequeñas", "Vender al Fence", "Depositar en el banco" ] },
    { "id": "titulo", "phase": "Early", "type": "Título", "text": "Land Plot Title Nv1", "item": "land_title_1", "target": 150000,
      "subs": [ "Investigar el título ($50k)", "Comprar el título ($100k)" ] },
    { "id": "sala", "phase": "Early", "type": "Taller / mejora", "text": "Grow Room", "item": "grow_room", "target": 250000 },
    { "id": "mesa", "phase": "Early", "type": "Taller / mejora", "text": "Primera mesa", "item": "grow_table", "target": 70000 },
    { "phase": "Early", "type": "Plantas", "text": "Llenar la primera mesa", "target": 6, "q": "p", "down": true,
      "requires": ["mesa"], "notes": "Valen verdes de momento." },
    { "phase": "Early", "type": "Taller / mejora", "text": "Fan en la mesa", "item": "fan", "target": 125000 },
    { "phase": "Mid", "type": "Plantas", "text": "Cambiar verdes por moradas", "target": 6, "q": "p", "down": false }
  ]
}
```

---

## Rutas de contrabando y de taller químico

Usa los tipos `"Reempaquetado"` y `"Taller químico"` con su `item`. En la pestaña **Granja**, quien siga la ruta puede añadir **+ Banco de contrabando** y **+ Taller químico**, con temporizador, mejoras, inversión y ganancia por hora.

```json
{ "phase": "Early", "type": "Reempaquetado", "text": "Primer banco de contrabando", "item": "contraband_bench", "target": 40000,
  "notes": "Reempaqueta 1 caja cada ~30 min. Ocupa un hueco de banco de trabajo (el tráiler solo tiene 1).",
  "subs": [ "Investigar el Contraband Workbench ($20k)", "Comprarlo y colocarlo ($20k)",
            "Comprar Contraband Cargo ($10k; $5k en el Sales Center)", "Reempaquetar y vender al Smuggler ($35k-$40k)" ] },
{ "phase": "Mid", "type": "Taller químico", "text": "Montar el laboratorio", "item": "chem_lab", "target": 365000,
  "notes": "Laboratorio $160k + $110k, Reactor I $20k + $40k, Congelador I $15k + $20k.",
  "subs": [ "Investigar y comprar el Chemical Laboratory", "Instalar Chemical Reactor e Industrial Freezer",
            "Conseguir reactivos (botín)", "Reactor > Congelador > Hard Crystals", "Vender al Smuggler" ] }
```

Los precios son de wikis de fans (nov 2026) y pueden cambiar con los parches. En [DATOS.md](DATOS.md) tienes el nivel de confianza de cada dato.

---

## Consejos para una buena ruta

- **Un paso, un objetivo claro** (comprar X, ahorrar Y). Lo que lleva varias acciones va en `subs`.
- **Subtareas en el orden en que se hacen**: la app resalta siempre la siguiente.
- **Usa `item` siempre que puedas**: así la app comprueba requisitos y precios por ti.
- **Usa `requires` solo cuando el orden importe de verdad.** Por ejemplo, mudarse de distrito después de comprar el título.
- **Dinero con `target`**: así se ve la barra de progreso y la estimación de tiempo.
- **Plantas**: empieza con `"down": true` y añade pasos posteriores en `false` para ir mejorando la calidad.

## Comprobar el archivo antes de compartirlo

- Impórtalo en la app: el informe dice qué se corrigió o se descartó, y si la ruta entra como borrador por tener errores.
- Usa comillas dobles `"` y comas entre elementos, sin coma tras el último.
- Guarda el archivo en **UTF-8** para que las tildes y la ñ se vean bien.

## Rutas que vienen incluidas en la app

`rutas-incluidas.js` contiene las rutas que la app añade sola al abrirse. Cada una lleva un `id` estable y una `version`:

- Se añade **una vez por `id`**.
- Si subes la `version`, quien ya la tenía ve un aviso para **añadir la versión nueva como ruta aparte**. Su progreso nunca se pisa.

Ese archivo se genera desde `ruta-2-granjas.json` (ver CLAUDE.md).
