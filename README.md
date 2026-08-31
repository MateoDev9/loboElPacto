# Lobo — asistente del narrador

MVP web responsive para dirigir partidas de **Los Hombres Lobo de Castronegro: El Pacto**. Permite mantener una biblioteca de personas, preparar un mazo recomendado pero editable, identificar el reparto conforme los personajes despiertan durante la primera noche y seguir las fases de noche y día.

## Puesta en marcha

```bash
npm install
npm run dev
```

Vite mostrará la dirección local en la terminal (normalmente `http://localhost:5173`).

Para comprobar la versión de producción:

```bash
npm run build
npm run preview
```

## Estructura

- `src/roles.ts`: catálogo de los personajes de El Pacto, combinaciones recomendadas y orden de llamada.
- `src/game.ts`: reglas, transiciones y condiciones de victoria.
- `src/storage.ts`: persistencia local de la partida activa.
- `src/App.tsx`: pantallas y flujo principal.
- `src/styles.css`: sistema visual responsive.

La partida activa se guarda automáticamente en `localStorage`, por lo que puede continuarse tras recargar o cerrar la pestaña.
