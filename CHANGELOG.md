# Cambios

## 2.1.0 · 2026-11-24

- **Rutas incluidas nuevas:** «Contrabando: 4 bancos de reempaquetado» y «Taller químico: laboratorio al máximo». Se añaden solas a tu lista sin cambiar tu ruta activa.
- **Actualizaciones:** la app mira cada 6 h si hay una versión nueva en GitHub (y con «Buscar actualizaciones» en Copias). En la app de Windows, «Actualizar ahora» la descarga, la instala y la vuelve a abrir; en el navegador enlaza a la descarga. Tus datos no se tocan.
- Código publicado en https://github.com/daviddaco1/rob-run-planner.

## 2.0.0 · 2026-11-24

### Datos
- Catálogo central `catalogo.js`: 40 elementos (títulos, bases, cultivo, contrabando, carga, química, defensa), valores por defecto, notoriedad, límites y tipos de base, con 30 fuentes. Cada dato lleva fuente, fecha y nivel de confianza. Detalle en DATOS.md.
- Pestaña **Datos del juego** con el catálogo, las fuentes enlazadas y las discrepancias.

### Correcciones de cálculo
- El **banco de contrabando** reempaqueta 1 caja cada vez; antes multiplicaba la ganancia por los huecos. La Tool Box ahora da cola de cajas (autonomía), no más dinero por hora.
- **Notoriedad**: bonus del Fence en las bolsas y del Smuggler en cajas y cristales.
- **Laboratorio químico**: reactor por tier (60 / 53 / 45 min), congelador con evaporador y refrigerante, y cristales por lote × precio de calidad. Sin datos apuntados ya no muestra pérdidas inventadas.
- Modo de combinar las mejoras de velocidad elegible: suma (40 min), multiplicación (38 min) o resta (30 min).
- Cambiar mejoras con un temporizador en marcha ya no adelanta ni retrasa el ciclo actual.

### Rutas y validación
- Motor de reglas en `core.js`, que comparten editor, importador, granja y pruebas.
  - Niveles: error (imposible), advertencia (dudoso o sin confirmar) e información.
  - Detecta: dependencias circulares, depender de un paso posterior, requisitos del catálogo que faltan o van después, tier del laptop (parcela del nivel necesario), elementos retirados del catálogo, plantas por encima de la capacidad de la base y bancos por encima de los huecos de la base.
- **Arreglos con un clic**: mover antes, quitar la dependencia, añadir el paso que falta (con precio y subtareas) o «Ya lo tengo».
- **Dependencias entre pasos** («Depende de») y estado de cada paso: pendiente, en progreso, completada, provisional o bloqueada. «Siguiente» salta los pasos bloqueados.
- **Elemento del juego** por paso, con autocompletado del catálogo, «Meta = precio» y subtareas sugeridas.
- **Ya tengo** por ruta, para requisitos cumplidos antes.
- **Cambios atómicos**: una edición que mete un error en una ruta activa se rechaza sin tocar nada, y se ofrece guardarla en un **borrador** aparte. Los borradores no se activan hasta no tener errores, y exportarlos los marca como borrador.
- **Deshacer y rehacer** (Ctrl+Z / Ctrl+Y), con confirmación que explica las consecuencias al borrar pasos (dependientes), estaciones (pasos que dejan de estar completos), al cambiar el tipo de un paso de Plantas y al bajar una meta.
- Duplicar paso y duplicar ruta.
- Resumen de ruta: dinero pendiente, ritmo de la granja y tiempo estimado; estimación por paso.

### Granja y calculadoras
- Notoriedad, tier del laptop, tipo de base, inversión por estación y registro de ventas reales (real frente a teórico).
- Pestaña **Calculadoras**:
  - Resumen y tiempo para juntar una cantidad.
  - Cuellos de botella.
  - Qué mejora comprar primero (ganancia por hora y horas en recuperarla).
  - Comparador de estaciones.
  - Simulador.

### Datos del usuario
- Formato 2 con migración automática desde el 1, y copia de seguridad previa.
- Copias automáticas: diaria, antes de migrar, antes de restaurar y antes de borrar todo. Pestaña **Copias** para descargar, restaurar o empezar de cero (todo se puede deshacer).
- Datos dañados: se guardan aparte, se avisa y la app arranca igualmente.
- Aviso si no se puede guardar o si otra ventana cambia los datos.
- Importación robusta: tolera JSON roto, BOM, pasos inválidos, tipos o fases desconocidos y referencias rotas. Informa de lo descartado, y una ruta con errores entra como borrador. Se escapan los 5 caracteres HTML (XSS).
- Rutas incluidas por **id y versión** en vez de por nombre. Una versión nueva se ofrece como ruta aparte y nunca pisa tu progreso.

### App nativa
- Los enlaces de las fuentes se abren en el navegador del sistema.
- Para pruebas: `ROBRUN_DATA_DIR` usa otra carpeta de datos y `ROBRUN_TEST_LOG` registra cada aviso en un archivo.

### Pruebas
- `npm test`: tests unitarios y de integración, más tests de propiedades y fuzzing con semillas fijas (miles de estados, importaciones y secuencias de operaciones aleatorias).
- `npm run test:e2e`: Edge headless contra `file://` con un perfil temporal.
- `npm run test:webview2`: el .exe en una carpeta temporal, con avisos nativos.

## 1.x
- Planificador de rutas con subtareas, granja con temporizadores, app nativa WebView2 con avisos, sonido e icono.
