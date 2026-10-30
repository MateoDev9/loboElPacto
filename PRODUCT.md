# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Quien hace de narrador en una partida de mesa de roles ocultos (**Wolves: El pueblo duerme**). La app sirve por igual a dos perfiles:

- **Narradores con experiencia**, que ya conocen el juego y quieren llevar la partida sin papeles ni apuntes, sin que la app les frene.
- **Narradores novatos**, que nunca han dirigido una partida y necesitan que la app les guíe paso a paso: a quién despertar, qué decir en voz alta y qué ocurre después.

El narrador es la única persona que mira la pantalla; el resto de la mesa no debe ver la información secreta.

## Product Purpose

Acompañar al narrador durante toda la partida: preparar el mazo según el número de jugadores, ubicar quién tiene cada carta mientras los personajes despiertan la primera noche, llamar a cada personaje en su orden, aplicar sus efectos y decir quién muere, quién gana y qué toca después. Tiene éxito cuando el narrador dirige una partida completa sin consultar el reglamento ni equivocarse en el orden o en los efectos.

## Positioning

No reparte cartas ni sustituye a las cartas físicas: los jugadores reciben sus cartas reales y la app las descubre conforme cada personaje abre los ojos la primera noche. A partir de ahí conoce el reparto y aplica las reglas de los 31 personajes, incluidas sus interacciones (Lobo Portador de Maldiciones, Ama de Llaves, Ladrón, Comediante, enamorados…).

## Operating Context

- Se usa en la mesa, durante una partida real, normalmente en el móvil del narrador y con las manos ocupadas.
- Las noches transcurren con los jugadores con los ojos cerrados y el narrador hablando en voz alta mientras toca la pantalla (la pantalla permanece encendida mediante Wake Lock).
- La partida y su historial de deshacer se guardan en el dispositivo y pueden continuar tras recargar o cerrar la pestaña. Tras la primera visita funciona sin conexión.
- Los asientos se numeran en sentido horario empezando por el jugador 1 a las 12 en punto; el siguiente asiento es la izquierda de cada jugador.
- Permite alternar entre **Reglas de la casa** (el Alguacil solo desempata en caso de empate, el Zorro y la Vidente se llaman los últimos la primera noche, las Dos Hermanas despiertan todas las noches y el Cazador dispara muera como muera) y **Reglamento estándar**, o personalizar cada regla por separado.

## Capabilities and Constraints

- Biblioteca de jugadores habituales (vacía por defecto para nuevos usuarios), orden de asientos, historial de mesas anteriores y mazo recomendado editable.
- Ubicación de cartas durante la primera noche, orden de llamada, guion sugerido en voz alta, acciones nocturnas, temporizador de debate diurno, votaciones, desempates y condiciones de victoria de los 31 personajes.
- Deshacer paso a paso durante la partida, persistido en almacenamiento local para no perderse al recargar.
- Alguacil opcional en cada partida: se elige de día, desempata (o cuenta doble según la regla activa) y pide sucesor cuando muere.
- Las reglas están cubiertas por pruebas automáticas (`npm test`) que la publicación exige pasar.

## Brand Commitments

- Nombre de la aplicación: **«Wolves: El pueblo duerme»** (nombre corto: **«Wolves»**). Libre de marcas registradas de terceros.
- Ilustraciones propias de estilo grabado tarot en línea dorada sobre obsidiana (`public/cards/*.webp`).
- Todo el texto está en español, con el vocabulario clásico de la mesa (aldea, manada, coro, linchamiento, víctima).

## Product Principles

1. **La partida manda.** Cada pantalla responde a «a quién despierto, qué digo y qué ha pasado»; nada debe distraer de eso en plena noche.
2. **Guía al novato sin frenar al experto.** Las explicaciones y frases en voz alta están ahí cuando hacen falta y se pueden saltar; el camino habitual debe llevar pocos toques.
3. **Las reglas son correctas antes que vistosas.** Un efecto mal aplicado arruina una partida real; cualquier cambio de interfaz conserva las reglas probadas.
4. **Lo secreto sigue siendo secreto.** La información del narrador no debe quedar a la vista de la mesa sin que él lo decida.
5. **Se puede corregir.** Un toque equivocado se deshace sin romper la partida, incluso tras recargar la página.

## Accessibility & Inclusion

Objetivo WCAG 2.2 AA: foco visible con teclado, contraste suficiente, objetivos táctiles cómodos en el móvil y respeto a «reducir movimiento».
