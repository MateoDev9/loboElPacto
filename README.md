# Wolves: El pueblo duerme — Asistente del narrador

Aplicación web responsive para dirigir partidas de roles ocultos en mesa (**Wolves: El pueblo duerme**). Permite mantener una biblioteca de jugadores habituales, preparar un mazo recomendado pero editable, elegir entre reglas de la casa o reglamento estándar, identificar el reparto conforme los personajes despiertan durante la primera noche y seguir las fases de noche y día con guion hablado y temporizador integrado.

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

- `src/roles.ts`: catálogo de los 31 personajes, combinaciones recomendadas, variantes de reglas y orden de llamada.
- `src/game.ts`: reglas, transiciones y condiciones de victoria.
- `src/game.test.ts`: pruebas automáticas de las reglas de cada personaje y variantes.
- `src/storage.ts`: persistencia local de la partida activa, pila de deshacer, biblioteca y preferencias.
- `src/App.tsx`: pantallas, temporizador de debate, bloqueo de pantalla y flujo principal.
- `src/styles.css`: sistema visual responsive («Grimorio y Mesa de Juego»).
- `public/sw.js` y `public/manifest.webmanifest`: permiten instalar la app y usarla sin conexión.
- `docs/cartas.md`: notas sobre las ilustraciones propias en estilo grabado tarot.

La partida activa y su historial de deshacer se guardan automáticamente en `localStorage`, por lo que puede continuarse tras recargar o cerrar la pestaña. La versión publicada registra un service worker que guarda la app en el dispositivo: tras la primera visita funciona sin conexión.
