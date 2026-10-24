# Lobo — asistente del narrador

MVP web responsive para dirigir partidas de **Los Hombres Lobo de Castronegro: El Pacto**. Permite mantener una biblioteca de personas, preparar un mazo recomendado pero editable, identificar el reparto conforme los personajes despiertan durante la primera noche y seguir las fases de noche y día.

## Puesta en marcha

```bash
npm install
npm run dev
```

Vite mostrará la dirección local en la terminal (normalmente `http://localhost:5173`).

Para pasar las pruebas de las reglas:

```bash
npm test
```

Para comprobar la versión de producción (la compilación también pasa las pruebas y se detiene si alguna falla):

```bash
npm run build
npm run preview
```

## Estructura

- `src/roles.ts`: catálogo de los personajes de El Pacto, combinaciones recomendadas y orden de llamada.
- `src/game.ts`: reglas, transiciones y condiciones de victoria.
- `src/game.test.ts`: pruebas de las reglas de cada personaje.
- `src/storage.ts`: persistencia local de la partida activa.
- `src/App.tsx`: pantallas y flujo principal.
- `src/styles.css`: sistema visual responsive.
- `public/sw.js` y `public/manifest.webmanifest`: permiten instalar la app y usarla sin conexión.
- `docs/cartas.md`: notas sobre las imágenes de las cartas.
- `reglas/`: reglamentos en PDF para consultar al desarrollar. No se suben a git ni se publican.

La partida activa se guarda automáticamente en `localStorage`, por lo que puede continuarse tras recargar o cerrar la pestaña. La versión publicada registra un service worker que guarda la app en el dispositivo: tras la primera visita funciona sin conexión.
