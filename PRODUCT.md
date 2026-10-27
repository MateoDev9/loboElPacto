# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Quien hace de narrador en una partida de Los Hombres Lobo de Castronegro: El Pacto. La app debe servir por igual a dos perfiles (confirmado):

- **Narradores con experiencia**, que ya conocen el juego y quieren llevar la partida sin papeles ni apuntes, sin que la app les frene.
- **Narradores novatos**, que nunca han dirigido una partida y necesitan que la app les guíe paso a paso: a quién despertar, qué decir y qué ocurre después.

El narrador es la única persona que mira la pantalla; el resto de la mesa no debe ver la información secreta.

## Product Purpose

Acompañar al narrador durante toda la partida: preparar el mazo según el número de jugadores, ubicar quién tiene cada carta mientras los personajes despiertan la primera noche, llamar a cada personaje en su orden, aplicar sus efectos y decir quién muere, quién gana y qué toca después. Tiene éxito cuando el narrador dirige una partida completa sin consultar el reglamento ni equivocarse en el orden o en los efectos.

## Positioning

No reparte cartas ni sustituye a las cartas físicas: los jugadores reciben sus cartas reales y la app las descubre conforme cada personaje abre los ojos la primera noche. A partir de ahí conoce el reparto y aplica las reglas de los 31 personajes de El Pacto, incluidas sus interacciones (Infecto Padre, Sirvienta, Ladrón, Comediante, enamorados…).

## Operating Context

- Se usa en la mesa, durante una partida real, normalmente en el móvil del narrador y con las manos ocupadas. *(Inferido del diseño responsive y del flujo; sin confirmar.)*
- Las noches transcurren con los jugadores con los ojos cerrados y el narrador hablando en voz alta mientras toca la pantalla. *(Inferido.)*
- La partida se guarda en el dispositivo y puede continuar tras recargar o cerrar la pestaña. Tras la primera visita funciona sin conexión.
- Los asientos se numeran en sentido horario empezando por el jugador 1 a las 12 en punto; el siguiente asiento es la izquierda de cada jugador.
- El grupo juega con reglas de la casa que difieren del reglamento a propósito: el Zorro y la Vidente se llaman los últimos la primera noche, las Dos Hermanas se despiertan todas las noches y el Cazador dispara muera como muera.

## Capabilities and Constraints

- Biblioteca de jugadores habituales, orden de asientos, historial de mesas anteriores y mazo recomendado editable.
- Ubicación de cartas durante la primera noche, orden de llamada, acciones nocturnas, votaciones, desempates y condiciones de victoria de los 31 personajes.
- Deshacer paso a paso durante la partida, en memoria (se pierde al recargar).
- Alguacil opcional en cada partida: se elige de día, la app recuerda que su voto cuenta doble y pide sucesor cuando muere.
- No implementados: los edificios de La Aldea y Luna Nueva (cartas de evento, variantes, Gitana y Guardia).
- Las reglas están cubiertas por pruebas automáticas (`npm test`) que la publicación exige pasar.
- Distribución sin decidir: gratuita o de pago depende de cómo se resuelvan los derechos (confirmado).

## Brand Commitments

- Nombre actual en la interfaz: «Lobo»; título de la página «Lobo: El Pacto». La referencia a la marca del juego está pendiente de la cuestión de derechos.
- Las ilustraciones oficiales de las cartas se sustituirán por arte propio nuevo (confirmado): el rediseño puede plantear su propio estilo de cartas.
- Todo el texto está en español, con el vocabulario del juego (aldea, manada, coro, linchamiento, víctima).

## Evidence on Hand

- `public/cards/`: ilustraciones oficiales actuales, solo como referencia provisional; no se publicarán.
- `reglas/`: reglamento de El Pacto en PDF para desarrollar, fuera de git y de la web.
- No hay usuarios externos, testimonios, métricas ni precios: no deben inventarse.

## Product Principles

1. **La partida manda.** Cada pantalla responde a «a quién despierto, qué digo y qué ha pasado»; nada debe distraer de eso en plena noche.
2. **Guía al novato sin frenar al experto.** Las explicaciones están ahí cuando hacen falta y se pueden saltar; el camino habitual debe llevar pocos toques.
3. **Las reglas son correctas antes que vistosas.** Un efecto mal aplicado arruina una partida real; cualquier cambio de interfaz conserva las reglas probadas.
4. **Lo secreto sigue siendo secreto.** La información del narrador no debe quedar a la vista de la mesa sin que él lo decida.
5. **Se puede corregir.** Un toque equivocado se deshace sin romper la partida.

## Accessibility & Inclusion

Objetivo WCAG 2.2 AA: foco visible con teclado, contraste suficiente, objetivos táctiles cómodos en el móvil y respeto a «reducir movimiento».
