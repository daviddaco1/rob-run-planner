# Rob Run Planner

Herramienta externa y **manual** para planificar tu progreso en ROB RUN (Kefir): rutas por wipe con tareas, subtareas y dependencias, temporizadores de cultivo, reempaquetado y laboratorio químico con aviso sonoro, y un centro de herramientas con calculadoras de producción, simulador y comparador de escenarios de farmeo, optimizador de combinaciones y calculadora de decodificadores para raideos.

> **No toca el juego.** No lee memoria, archivos ni red del juego, no mira la pantalla y no automatiza nada. Todo lo apuntas tú. Proyecto de fans, sin relación con Kefir.

## Descargar

1. Ve a [Releases](https://github.com/daviddaco1/rob-run-planner/releases/latest) y descarga **RobRunPlanner.zip**.
2. Descomprímelo en una carpeta tuya (por ejemplo, el Escritorio) y abre **RobRunPlanner.exe**. Necesita Windows 10/11 con WebView2 (ya viene con Edge) y el runtime de .NET 10 de escritorio.
3. Puedes minimizarla o cerrarla con la X: se queda en la bandeja y sigue avisando cuando la producción está lista. Para salir del todo, clic derecho en su icono de la bandeja › **Salir**.
4. La app avisa sola cuando hay una versión nueva y se actualiza con un clic. Tus rutas y tu granja se guardan en `%LOCALAPPDATA%\RobRunPlanner` y no se borran al actualizar.

También funciona sin instalar nada: abre `ruta-escalado.html` en cualquier navegador.

La interfaz se adapta a cualquier tamaño de ventana, desde una ventana pequeña junto al juego hasta 4K. Los iconos están dibujados para este proyecto; no son los del juego.

## Rutas incluidas

- **Full farmeo: 2 granjas completas** (`ruta-2-granjas.json`)
- **Contrabando: 4 bancos de reempaquetado** (`ruta-reempaquetado.json`)
- **Taller químico: laboratorio al máximo** (`ruta-taller-quimico.json`)
- **Ruta base de wipe** (`ruta-base-wipe.json`, para importar)

Para crear y compartir tus propias rutas, lee [COMO-CREAR-RUTAS.md](COMO-CREAR-RUTAS.md). Los datos del juego, sus fuentes y lo que falta por confirmar están en [DATOS.md](DATOS.md).

## Desarrollo

Sin dependencias ni compilación para la parte web. Pruebas con Node ≥ 22:

```
npm test
npm run test:e2e
```

La app nativa (`app/`) es .NET 10 WinForms + WebView2. Más detalles en [CLAUDE.md](CLAUDE.md).
