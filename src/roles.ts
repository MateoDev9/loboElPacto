import type { GameRules, RoleCategory, RoleDefinition, RoleId } from './types'

const role = (definition: RoleDefinition) => definition

export const HOUSE_RULES: GameRules = {
  sheriffTiebreakOnly: true,
  sistersEveryNight: true,
  seerFoxLastFirstNight: true,
  hunterAlwaysShoots: true,
}

export const OFFICIAL_RULES: GameRules = {
  sheriffTiebreakOnly: false,
  sistersEveryNight: false,
  seerFoxLastFirstNight: false,
  hunterAlwaysShoots: false,
}

export const ROLES: Record<RoleId, RoleDefinition> = {
  werewolf: role({
    id: 'werewolf', name: 'Hombre Lobo Común', shortName: 'Lobos', color: '#bd5545', team: 'wolves', category: 'wolves', maxCards: 4, nightOrder: 60, callKind: 'wolves',
    description: 'La manada elige una víctima cada noche.',
    narratorPrompt: 'Despierta a toda la manada y pide que elijan una víctima que no sea Hombre Lobo.',
    spokenPrompt: '«Que despierten los Hombres Lobo, se reconozcan en silencio y señalen a su víctima de esta noche…»',
    details: [
      'Cada noche, todos los Hombres Lobo se despiertan juntos y eligen en silencio y por mutuo acuerdo a una víctima viva.',
      'Durante el día, disimulan su identidad lupina y participan en los debates para evitar el linchamiento popular.',
      'Ganan la partida cuando consiguen eliminar a todos los aldeanos o igualar su número.',
    ],
  }),
  fierce_wolf: role({
    id: 'fierce_wolf', name: 'Lobo Feroz', shortName: 'Lobo Feroz', color: '#9e3d34', team: 'wolves', category: 'wolves', maxCards: 1, nightOrder: 70, callKind: 'one-target',
    description: 'Realiza un segundo ataque mientras no haya muerto ningún lobo.',
    narratorPrompt: 'Si ningún lobo ha muerto, despiértalo solo para que elija una segunda víctima que no sea lobo.',
    spokenPrompt: '«Que despierte en soledad el Lobo Feroz y señale a su segunda presa…»',
    details: [
      'Despierta y ataca junto al resto de la manada.',
      'Mientras ningún Hombre Lobo, Niño Criado por Lobos convertido o Perro Mestizo alineado con los lobos haya sido eliminado, despierta una segunda vez a solas para devorar a otra víctima.',
      'En cuanto muere el primer lobo de la partida, pierde definitivamente su segundo ataque.',
    ],
  }),
  infect_father: role({
    id: 'infect_father', name: 'Lobo Infectador', shortName: 'Lobo Infectador', color: '#8f5149', team: 'wolves', category: 'wolves', maxCards: 1, nightOrder: 65, callKind: 'confirm',
    description: 'Una vez por partida puede convertir a la víctima en lobo.',
    narratorPrompt: 'Tras dormir la manada, observa si levanta la mano. Si lo hace, la víctima no muere: queda infectada y conserva su poder.',
    spokenPrompt: '«Los Lobos duermen… Si el Lobo Infectador desea convertir a la víctima en parte de la manada, que alce la mano ahora.»',
    details: [
      'Despierta y actúa cada noche junto a los demás Hombres Lobo.',
      'Una vez por partida, justo después de que los lobos se duerman, puede levantar la mano para infectar a la víctima elegida en vez de devorarla.',
      'La víctima infectada no muere: se transforma en Hombre Lobo, despierta en los festines nocturnos y conserva su poder original si tenía uno.',
      'Si infecta al Anciano en su primera herida, éste resiste el mordisco y el poder del Lobo Infectador se agota sin surtir efecto.',
    ],
  }),
  albino_wolf: role({
    id: 'albino_wolf', name: 'Hombre Lobo Albino', shortName: 'Lobo Albino', color: '#b7aca7', team: 'neutral', category: 'solitary', maxCards: 1, nightOrder: 62, everyOtherNight: true, callKind: 'one-target',
    description: 'Desde la segunda noche, una de cada dos, elimina a un lobo.',
    narratorPrompt: 'Despiértalo a solas para que elimine a un Hombre Lobo. Su objetivo es ser el único superviviente.',
    spokenPrompt: '«Que despierte en secreto el Lobo Albino…»',
    details: [
      'Despierta cada noche con la manada para atacar a los aldeanos.',
      'A partir de la segunda noche, una noche de cada dos (noches 2, 4, 6…), despierta a solas para eliminar a un compañero Hombre Lobo.',
      'Su único objetivo es eliminar a todos los aldeanos y a todos los demás lobos para ser el único superviviente de la aldea.',
    ],
  }),

  villager: role({
    id: 'villager', name: 'Aldeano Común', shortName: 'Aldeano', color: '#cda65d', team: 'village', category: 'village', maxCards: 9, passive: true,
    description: 'No tiene poder especial.',
    narratorPrompt: 'No realiza ninguna acción nocturna.',
    details: [
      'No tiene ninguna habilidad nocturna ni poder secreto.',
      'Sus únicas armas son la observación, el análisis del comportamiento de sus vecinos y su voto en la votación popular.',
      'Gana la partida cuando todos los Hombres Lobo han sido desenmascarados y eliminados.',
    ],
  }),
  pure_villager: role({
    id: 'pure_villager', name: 'Aldeano Puro', shortName: 'Aldeano Puro', color: '#d1b66f', team: 'village', category: 'village', maxCards: 1, callKind: 'confirm', passive: true,
    description: 'Su inocencia es pública desde el reparto.',
    narratorPrompt: 'Ubícalo para el narrador y recuerda anunciar públicamente su inocencia.',
    spokenPrompt: '«Que abra los ojos el Aldeano Puro para que yo conozca su rostro inocente…»',
    details: [
      'Su carta tiene la ilustración del Aldeano Común en ambas caras.',
      'Tras el reparto, toda la aldea conoce con absoluta certeza que es un simple e inocente aldeano.',
      'Suele ser elegido como Alguacil de confianza por la asamblea popular.',
    ],
  }),
  seer: role({
    id: 'seer', name: 'Vidente', shortName: 'Vidente', color: '#8872c1', team: 'village', category: 'village', maxCards: 1, nightOrder: 20, callKind: 'one-target',
    description: 'Conoce la carta de una persona cada noche.',
    narratorPrompt: 'Pide que señale a una persona y muéstrale discretamente su carta.',
    spokenPrompt: '«Que despierte la Vidente y señale en silencio a quién desea observar esta noche…»',
    details: [
      'Cada noche, el narrador la despierta y ella señala en silencio a un jugador de la mesa.',
      'El narrador le muestra discretamente la carta de personaje de ese jugador.',
      'Debe guiar a los aldeanos con sutileza para desenmascarar a los lobos sin revelar su identidad.',
    ],
  }),
  cupid: role({
    id: 'cupid', name: 'Cupido', shortName: 'Cupido', color: '#c76984', team: 'village', category: 'village', maxCards: 1, firstNightOrder: 10, callKind: 'two-targets',
    description: 'Enamora a dos personas la primera noche.',
    narratorPrompt: 'Elige dos amantes, toca sus cabezas y deja que se reconozcan. Si uno muere, el otro muere de pena.',
    spokenPrompt: '«Que despierte Cupido y señale a las dos almas que quedarán unidas por el destino…»',
    details: [
      'Durante la primera noche (fase preliminar), Cupido designa a dos personas (puede incluirse a sí mismo).',
      'El narrador toca la cabeza de ambos para que abran los ojos y se reconozcan.',
      'Si uno de los amantes muere por cualquier causa, el otro muere inmediatamente de pena.',
      'Si los amantes pertenecen a bandos opuestos (un aldeano y un lobo), forman un tercer bando independiente y ganan si quedan ellos dos solos con vida.',
    ],
  }),
  witch: role({
    id: 'witch', name: 'Bruja', shortName: 'Bruja', color: '#62a27d', team: 'village', category: 'village', maxCards: 1, nightOrder: 80, callKind: 'witch',
    description: 'Tiene una curación y un veneno, de un solo uso.',
    narratorPrompt: 'Indícale la víctima real de los lobos y pregunta si usa la curación, el veneno, ambas o ninguna.',
    spokenPrompt: '«Que despierte la Bruja. Esta es la víctima de esta noche… ¿usarás tu poción de vida o tu poción de muerte?»',
    details: [
      'Dispone de dos pociones mágicas utilizables una sola vez en toda la partida:',
      'Poción curativa: salva a la víctima atacada por los lobos esa misma noche (puede usarla en sí misma).',
      'Poción venenosa: elimina a un jugador de su elección durante la noche.',
      'Puede usar ambas pociones en la misma noche si lo desea, o guardarlas.',
    ],
  }),
  hunter: role({
    id: 'hunter', name: 'Cazador', shortName: 'Cazador', color: '#7b805b', team: 'village', category: 'village', maxCards: 1, callKind: 'confirm', passive: true,
    description: 'Al morir, elimina inmediatamente a otra persona.',
    narratorPrompt: 'Anota quién tiene el Cazador. Cuando muera, detente para que pueda hacer su disparo.',
    spokenPrompt: '«Que abra los ojos el Cazador un instante para que lo reconozca…»',
    details: [
      'Si es devorado por los lobos o linchado en la votación de la aldea, antes de morir dispara y elimina inmediatamente a otro jugador de su elección.',
      'El disparo es instantáneo y no puede ser impedido.',
    ],
  }),
  little_girl: role({
    id: 'little_girl', name: 'Niña Pequeña', shortName: 'Niña', color: '#776f9c', team: 'village', category: 'village', maxCards: 1, callKind: 'confirm', passive: true,
    description: 'Puede espiar a los lobos; si la descubren, muere en vez de la víctima.',
    narratorPrompt: 'Ubícala. Durante el turno de los lobos podrás marcar si ha sido sorprendida espiando.',
    spokenPrompt: '«Que abra los ojos la Niña Pequeña para que sepa dónde se esconde…»',
    details: [
      'Durante la noche, mientras los Hombres Lobo eligen a su víctima, la Niña Pequeña puede entreabrir los ojos para espiar.',
      'Si alguno de los lobos la descubre espiando, muere esa noche en silencio en lugar de la víctima designada por la manada.',
    ],
  }),
  protector: role({
    id: 'protector', name: 'Protector', shortName: 'Protector', color: '#527c9a', team: 'village', category: 'village', maxCards: 1, nightOrder: 40, callKind: 'one-target',
    description: 'Protege del ataque de los lobos, sin repetir persona dos noches seguidas.',
    narratorPrompt: 'Pide que proteja a una persona. Puede elegirse a sí mismo, pero no repetir la protección de la noche anterior.',
    spokenPrompt: '«Que despierte el Protector y señale a quién resguardará esta noche de las garras de la manada…»',
    details: [
      'Cada noche antes del turno de los lobos, señala a un jugador al que protegerá de su ataque.',
      'Puede protegerse a sí mismo, pero nunca puede proteger a la misma persona dos noches consecutivas.',
      'Su escudo no protege contra la poción venenosa de la Bruja ni contra la muerte por amor de Cupido.',
    ],
  }),
  elder: role({
    id: 'elder', name: 'Anciano', shortName: 'Anciano', color: '#6b8254', team: 'village', category: 'village', maxCards: 1, callKind: 'confirm', passive: true,
    description: 'Sobrevive al primer ataque de los lobos.',
    narratorPrompt: 'Ubícalo. Resiste el primer ataque de los lobos; otras causas lo eliminan de inmediato.',
    spokenPrompt: '«Que abra los ojos el Anciano de la aldea para que lo reconozca…»',
    details: [
      'Los Hombres Lobo deben atacarle 2 veces por la noche para devorarle. El primer ataque lo resiste con vida.',
      'Si muere linchado por la aldea, por el veneno de la Bruja, por el tiro del Cazador o por la navaja del Barbero, todos los aldeanos pierden sus poderes especiales hasta el final de la partida.',
    ],
  }),
  scapegoat: role({
    id: 'scapegoat', name: 'Cabeza de Turco', shortName: 'Cabeza de Turco', color: '#b45d5d', team: 'village', category: 'village', maxCards: 1, callKind: 'confirm', passive: true,
    description: 'Muere si la votación termina en empate y decide quién votará después.',
    narratorPrompt: 'Anota quién tiene el Cabeza de Turco. Si hay empate, podrá elegir quién vota en la próxima ronda.',
    spokenPrompt: '«Que abra los ojos el Cabeza de Turco para que lo reconozca…»',
    details: [
      'Si la votación popular de la aldea termina en empate, el Cabeza de Turco es linchado inmediatamente en lugar de desempatar.',
      'Antes de salir de la partida, tiene la prerrogativa de designar qué aldeanos tendrán derecho a voto en el próximo linchamiento.',
    ],
  }),
  village_fool: role({
    id: 'village_fool', name: 'Tonto del Pueblo', shortName: 'Tonto', color: '#d47a69', team: 'village', category: 'village', maxCards: 1, callKind: 'confirm', passive: true,
    description: 'Sobrevive al linchamiento, revela su carta y pierde el voto.',
    narratorPrompt: 'Ubícalo. Si la aldea lo expulsa, seguirá vivo pero perderá su derecho a voto.',
    spokenPrompt: '«Que abra los ojos el Tonto del Pueblo para que lo reconozca…»',
    details: [
      'Si la aldea vota en su contra para expulsarle, revela su carta: los aldeanos, avergonzados, le indultan en el acto.',
      'Sigue con vida pero pierde su derecho a voto para el resto de la partida.',
      'Si ostentaba el cargo de Alguacil, el cargo se pierde para el resto de la partida.',
    ],
  }),
  two_sisters: role({
    id: 'two_sisters', name: 'Dos Hermanas', shortName: 'Hermanas', color: '#9074a7', team: 'village', category: 'village', maxCards: 2, firstNightOrder: 25, nightOrder: 50, callKind: 'confirm',
    description: 'Se reconocen en secreto durante la noche.',
    narratorPrompt: 'Despierta a las dos Hermanas. Deja que se comuniquen un momento con gestos y haz que vuelvan a dormir.',
    spokenPrompt: '«Que despierten las Dos Hermanas y se reconozcan en silencio…»',
    details: [
      'Son dos cartas gemelas que se reconocen durante la primera noche y saben con certeza que la otra es inocente.',
      'Con reglas de la casa pueden despertar cada noche para comunicarse mediante gestos silenciosos antes del ataque de los lobos.',
    ],
  }),
  three_brothers: role({
    id: 'three_brothers', name: 'Tres Hermanos', shortName: 'Hermanos', color: '#607ea0', team: 'village', category: 'village', maxCards: 3, firstNightOrder: 26, callKind: 'confirm',
    description: 'Se reconocen la primera noche.',
    narratorPrompt: 'Despierta a los tres Hermanos para que se reconozcan.',
    spokenPrompt: '«Que despierten los Tres Hermanos y se reconozcan en silencio…»',
    details: [
      'Son tres cartas idénticas que despiertan juntas la primera noche para reconocerse.',
      'Forman un grupo de tres votos fiables que saben con certeza la inocencia de sus hermanos.',
    ],
  }),
  fox: role({
    id: 'fox', name: 'Zorro', shortName: 'Zorro', color: '#c17645', team: 'village', category: 'village', maxCards: 1, nightOrder: 25, callKind: 'three-neighbours',
    description: 'Comprueba tres vecinos; pierde el poder si no encuentra ningún lobo.',
    narratorPrompt: 'Puede señalar al centro de un grupo de tres vecinos. Indica si contiene al menos un lobo; si no, pierde su poder.',
    spokenPrompt: '«Que despierte el Zorro y señale a una persona para olfatear a ese jugador y a sus dos vecinos…»',
    details: [
      'Por la noche puede señalar a un jugador central: el narrador le indica con un gesto si en ese trío (el jugador y sus dos vecinos contiguos) hay al menos un Hombre Lobo.',
      'Si hay al menos un lobo, conserva su poder para usarlo la noche siguiente.',
      'Si en el trío no hay ningún lobo, el Zorro pierde su poder definitivamente.',
    ],
  }),
  bear_tamer: role({
    id: 'bear_tamer', name: 'Cuidador del Oso', shortName: 'Domador', color: '#7c5f48', team: 'village', category: 'village', maxCards: 1, callKind: 'confirm', passive: true,
    description: 'Cada mañana el oso gruñe si hay un lobo vivo adyacente.',
    narratorPrompt: 'Anota quién tiene el Domador y conserva el orden del coro para comprobar sus vecinos cada mañana.',
    spokenPrompt: '«Que abra los ojos el Cuidador del Oso para que conozca su asiento en la mesa…»',
    details: [
      'Cada mañana, si hay al menos un Hombre Lobo vivo sentado a la izquierda o a la derecha inmediata del Domador, el narrador gruñe imitando al oso.',
      'Si no hay lobos vivos junto a él, el oso permanece en calma.',
      'Si el Domador es infectado por el Lobo Infectador, el oso gruñe todas las mañanas.',
    ],
  }),
  stuttering_judge: role({
    id: 'stuttering_judge', name: 'Juez Indeciso', shortName: 'Juez', color: '#647687', team: 'village', category: 'village', maxCards: 1, firstNightOrder: 30, callKind: 'confirm',
    description: 'Una vez por partida puede ordenar una segunda votación inmediata.',
    narratorPrompt: 'Acordad en silencio una señal. Durante una votación podrás activar una segunda votación sin debate.',
    spokenPrompt: '«Que despierte el Juez Indeciso y me muestre en silencio su gesto secreto…»',
    details: [
      'En la primera noche pacta una señal secreta con el narrador.',
      'Una vez por partida, durante una votación eliminatoria diurna, puede hacer esa señal.',
      'Tras resolver el primer linchamiento, el narrador iniciará de inmediato una segunda votación sin debate previo.',
    ],
  }),
  rusty_knight: role({
    id: 'rusty_knight', name: 'Caballero Oxidado', shortName: 'Caballero', color: '#7d7061', team: 'village', category: 'village', maxCards: 1, callKind: 'confirm', passive: true,
    description: 'Si es devorado, enferma al lobo vivo más cercano a su izquierda.',
    narratorPrompt: 'Anota quién tiene el Caballero. Si los lobos lo matan, marca al lobo vivo más cercano a su izquierda.',
    spokenPrompt: '«Que abra los ojos el Caballero Oxidado para que lo reconozca…»',
    details: [
      'Si es devorado por los Hombres Lobo, el Hombre Lobo vivo situado más cerca de su izquierda enferma por el óxido.',
      'Ese lobo sobrevive un día entero y muere a la mañana siguiente del fallecimiento del Caballero.',
    ],
  }),

  thief: role({
    id: 'thief', name: 'Ladrón', shortName: 'Ladrón', color: '#558592', team: 'variable', category: 'ambiguous', maxCards: 1, firstNightOrder: 5, callKind: 'thief',
    description: 'Se añaden 2 Aldeanos al mazo; puede cambiar su carta por una de las 2 sobrantes.',
    narratorPrompt: 'Muéstrale las dos cartas sobrantes del centro. Puede quedarse el Ladrón o cambiarlo por una de ellas; si las dos son lobos, está obligado a cambiar.',
    spokenPrompt: '«Que despierte el Ladrón, observe las dos cartas sobrantes y decida si cambia su destino…»',
    details: [
      'Se añaden 2 cartas de Aldeano Común extra y quedan 2 cartas boca abajo en el centro.',
      'Durante la primera noche, mira las 2 cartas sobrantes y puede cambiar su carta de Ladrón por una de ellas.',
      'Si las dos cartas sobrantes son de Hombre Lobo, está obligado a cambiar y unirse a los lobos.',
    ],
  }),
  devoted_servant: role({
    id: 'devoted_servant', name: 'Sirvienta Devota', shortName: 'Sirvienta', color: '#aa728d', team: 'variable', category: 'ambiguous', maxCards: 1, callKind: 'confirm', passive: true,
    description: 'Antes de revelar a un linchado puede adoptar su carta.',
    narratorPrompt: 'Anota quién tiene la Sirvienta. Antes de revelar a una persona expulsada, pregúntale si quiere quedarse con su carta.',
    spokenPrompt: '«Que abra los ojos la Sirvienta Devota para que la reconozca…»',
    details: [
      'Antes de revelarse la carta de un jugador linchado por la aldea, la Sirvienta puede mostrar su carta y adoptar el personaje del difunto.',
      'El expulsado sale con la carta de Sirvienta y ella adquiere el nuevo personaje con todos sus poderes restaurados.',
      'Si está enamorada, no puede usar su poder de adopción.',
    ],
  }),
  actor: role({
    id: 'actor', name: 'Comediante', shortName: 'Comediante', color: '#a0655c', team: 'variable', category: 'ambiguous', maxCards: 1, nightOrder: 10, callKind: 'actor',
    description: 'Cada noche usa una de las 3 cartas preparadas antes de la partida; la carta se retira.',
    narratorPrompt: 'Pide que señale una de las cartas preparadas del centro. La llamaré en su turno como si fuera ese personaje y después la retiras.',
    spokenPrompt: '«Que despierte el Comediante y elija qué máscara interpretará esta noche…»',
    details: [
      'Antes de empezar la partida se colocan 3 cartas de personaje boca arriba en el centro (ninguna puede ser de lobo).',
      'Cada noche, el Comediante elige una de las cartas disponibles: actuará con ese poder esa noche y la carta se retira.',
      'Cuando gasta las 3 cartas, actúa como un aldeano común.',
    ],
  }),
  wild_child: role({
    id: 'wild_child', name: 'Niño Criado por Lobos', shortName: 'Niño Criado por Lobos', color: '#527957', team: 'variable', category: 'ambiguous', maxCards: 1, firstNightOrder: 20, callKind: 'one-target',
    description: 'Elige un mentor; cuando muere, se convierte en lobo.',
    narratorPrompt: 'Pide que señale a su modelo. Si el modelo muere, se incorporará a la manada desde la noche siguiente.',
    spokenPrompt: '«Que despierte el Niño Criado por Lobos y señale en silencio a quién tomará como modelo…»',
    details: [
      'La primera noche señala a otro jugador como su modelo a seguir.',
      'Mientras su modelo permanezca vivo, juega como un aldeano ordinario.',
      'Si su modelo muere, el Niño Criado por Lobos se transforma en Hombre Lobo y despierta con la manada a partir de la noche siguiente.',
    ],
  }),
  wolf_hound: role({
    id: 'wolf_hound', name: 'Perro Mestizo', shortName: 'Perro Mestizo', color: '#86765c', team: 'variable', category: 'ambiguous', maxCards: 1, callKind: 'confirm', passive: true,
    description: 'Elige en secreto ser aldeano o lobo para toda la partida.',
    narratorPrompt: 'Ubícalo, pero no le preguntes su elección. Durante la llamada de la manada anotarás si abre los ojos con los lobos.',
    spokenPrompt: '«Que abra los ojos el Perro Mestizo para que lo reconozca. Decidirá su bando cuando llame a la manada…»',
    details: [
      'La primera noche, cuando el narrador llama a los Hombres Lobo, el Perro Mestizo decide si abre los ojos con ellos o no.',
      'Si abre los ojos, será Hombre Lobo toda la partida; si no los abre, permanece como Aldeano Común.',
    ],
  }),

  flutist: role({
    id: 'flutist', name: 'Flautista', shortName: 'Flautista', color: '#9b5d96', team: 'neutral', category: 'solitary', maxCards: 1, nightOrder: 90, callKind: 'two-targets',
    description: 'Hechiza a dos personas cada noche y gana cuando todos los demás están hechizados.',
    narratorPrompt: 'Pide que hechice a dos personas nuevas. Después despierta a todos los hechizados para que se reconozcan.',
    spokenPrompt: '«Que despierte el Flautista y señale a las dos personas que encantará con su melodía esta noche…»',
    details: [
      'Cada noche hechiza a dos jugadores tocando su flauta.',
      'El narrador despierta a todos los hechizados para que se reconozcan entre sí.',
      'Gana la partida en solitario en el instante en que todos los demás jugadores vivos están hechizados.',
    ],
  }),
  sectarian: role({
    id: 'sectarian', name: 'Sectario Fanático', shortName: 'Sectario', color: '#5f535e', team: 'neutral', category: 'solitary', maxCards: 1, firstNightOrder: 2, callKind: 'sectarian',
    description: 'Gana cuando elimina al grupo público al que no pertenece.',
    narratorPrompt: 'La aldea debe estar dividida públicamente en dos grupos. Registra a qué grupo pertenece cada persona.',
    spokenPrompt: '«Que abra los ojos el Sectario Fanático para que conozca su bando…»',
    details: [
      'Antes de empezar, la aldea se divide en dos grupos públicos reconocibles (Grupo A y Grupo B).',
      'El Sectario pertenece en secreto a uno de ellos y su meta exclusiva es erradicar a todos los miembros del grupo contrario.',
    ],
  }),
  angel: role({
    id: 'angel', name: 'Ángel', shortName: 'Ángel', color: '#9eafbf', team: 'neutral', category: 'solitary', maxCards: 1, callKind: 'confirm', passive: true,
    description: 'Gana si es eliminado en la primera votación o durante la primera noche.',
    narratorPrompt: 'Ubícalo. Con Ángel, la partida empieza con un debate y una votación antes de la primera noche.',
    spokenPrompt: '«Que abra los ojos el Ángel antes de que comience el primer juicio de la aldea…»',
    details: [
      'Si el Ángel está en juego, la partida empieza siempre con un debate y una votación diurna previa a la primera noche.',
      'Si consigue ser linchado en esa primera votación o devorado por los lobos en la primera noche, gana la partida de inmediato.',
      'Si sobrevive a la primera ronda, se convierte en un aldeano ordinario.',
    ],
  }),

  pyromaniac: role({
    id: 'pyromaniac', name: 'Pirómano', shortName: 'Pirómano', color: '#c6653d', team: 'village', category: 'village-expansion', maxCards: 1, nightOrder: 35, callKind: 'optional-one-target',
    description: 'Una vez por partida quema un edificio; puede frustrar el ataque de los lobos.',
    narratorPrompt: 'Puede quemar un edificio una vez por partida. Coloca el marcador de Fuego sobre el edificio elegido. Si coincide con la víctima de los lobos, esta se salva y muere el lobo más cercano a su derecha.',
    spokenPrompt: '«Que despierte el Pirómano y señale si desea reducir a cenizas un hogar esta noche…»',
    requiresBuildings: true,
    marker: 'fire',
    details: [
      'Cuando el narrador le llama puede, una sola vez por partida, señalar uno de los edificios. El narrador coloca sobre él el marcador de Fuego.',
      'A la mañana siguiente, después de que todos constaten los daños, el edificio se retira del juego. Su ocupante no queda eliminado: se convierte en Vagabundo.',
      'Si el edificio quemado pertenece a la víctima de los Hombres Lobo, el Hombre Lobo más cercano a la derecha de la víctima muere carbonizado. Los demás lobos huyen sin culminar su ataque y esa noche no hay víctimas.',
      'No puede quemar la casa de un Vagabundo (no tiene edificio).',
      'Solo se puede utilizar si se juega con los Edificios.',
    ],
  }),
  raven: role({
    id: 'raven', name: 'Cuervo', shortName: 'Cuervo', color: '#48515a', team: 'village', category: 'village-expansion', maxCards: 1, nightOrder: 95, callKind: 'optional-one-target',
    description: 'Al final de la noche señala a alguien que recibirá dos votos en contra al día siguiente.',
    narratorPrompt: 'Al final de la noche, cuando los lobos ya duermen, puede señalar a un sospechoso. Coloca el marcador de Cuervo (nota anónima) sobre su edificio: tendrá 2 votos en contra en la próxima votación.',
    spokenPrompt: '«Que despierte el Cuervo y señale la puerta donde clavará su pluma acusadora…»',
    requiresBuildings: true,
    marker: 'raven',
    details: [
      'Al final de cada noche, cuando los Hombres Lobo se han ido, el narrador le llama y el Cuervo puede señalar a un jugador del que sospeche.',
      'El narrador coloca el marcador de Cuervo (nota anónima) sobre el edificio del jugador escogido.',
      'Ese jugador tendrá automáticamente 2 votos más en contra en la siguiente votación. Retira el marcador después de votar.',
      'Puede poner el panfleto sobre la Taberna, aunque el Tabernero todavía conserve su inmunidad.',
      'Nunca puede señalar a un Vagabundo. Solo se juega con los Edificios.',
    ],
  }),
}

export const ROLE_LIST = Object.values(ROLES)
export const CATEGORY_LABELS: Record<RoleCategory, string> = {
  wolves: 'Hombres Lobo',
  village: 'Aldeanos',
  ambiguous: 'Ambiguos',
  solitary: 'Solitarios',
  'village-expansion': 'Oficios de la Aldea',
}
export const isWolfRole = (id?: RoleId): id is RoleId => Boolean(id && ['werewolf', 'fierce_wolf', 'infect_father', 'albino_wolf'].includes(id))
export const isVillagePower = (id?: RoleId) => Boolean(id && ROLES[id].team === 'village' && !['villager', 'pure_villager'].includes(id))

const FIRST_NIGHT_DISCOVERY_ORDER: Partial<Record<RoleId, number>> = {
  thief: 5, sectarian: 6, actor: 7, cupid: 10, wolf_hound: 15, wild_child: 20,
  two_sisters: 25, three_brothers: 26, stuttering_judge: 30, elder: 34, hunter: 35,
  rusty_knight: 36, bear_tamer: 37, pure_villager: 38, little_girl: 39, scapegoat: 40,
  village_fool: 41, devoted_servant: 42, angel: 43, pyromaniac: 46,
  protector: 55, werewolf: 60, infect_father: 65, fierce_wolf: 70,
  albino_wolf: 62, witch: 80, flutist: 90, raven: 95, fox: 998, seer: 999,
}

export const ACTOR_CARD_KINDS = ['one-target', 'optional-one-target', 'two-targets', 'three-neighbours', 'witch']
export const isActorCandidate = (id: RoleId) => ROLES[id].team !== 'wolves' && ROLES[id].category !== 'solitary' && id !== 'actor' && id !== 'wild_child' && ACTOR_CARD_KINDS.includes(ROLES[id].callKind ?? '')

export function firstNightOrder(id: RoleId, rules: Partial<GameRules> = HOUSE_RULES): number {
  const seerFoxLast = rules.seerFoxLastFirstNight ?? true
  if (!seerFoxLast) {
    if (id === 'seer') return 22
    if (id === 'fox') return 24
  }
  return FIRST_NIGHT_DISCOVERY_ORDER[id] ?? 500
}

export function recommendedRoles(playerCount: number): RoleId[] {
  const wolves = playerCount >= 13 ? 3 : playerCount >= 8 ? 2 : 1
  const specials: RoleId[] = playerCount >= 10 ? ['seer', 'witch', 'protector', 'hunter', 'cupid'] : playerCount >= 7 ? ['seer', 'witch', 'hunter'] : ['seer', 'protector']
  const chosen: RoleId[] = [...Array<RoleId>(wolves).fill('werewolf'), ...specials]
  return [...chosen.slice(0, playerCount), ...Array<RoleId>(Math.max(0, playerCount - chosen.length)).fill('villager')]
}

export function buildFirstNightSequence(deck: RoleId[], rules: Partial<GameRules> = HOUSE_RULES): RoleId[] {
  const present = new Set(deck.filter((id) => id !== 'villager'))
  if (deck.some(isWolfRole)) present.add('werewolf')
  return [...present].sort((a, b) => firstNightOrder(a, rules) - firstNightOrder(b, rules))
}

export function buildNightSequence(players: { roleId?: RoleId; alive: boolean }[], round: number, rules: Partial<GameRules> = HOUSE_RULES): RoleId[] {
  const present = new Set(players.filter((player) => player.alive && player.roleId).map((player) => player.roleId!))
  if ([...present].some(isWolfRole)) present.add('werewolf')
  const sistersEveryNight = rules.sistersEveryNight ?? true
  return [...present]
    .filter((id) => {
      if (id === 'two_sisters' && !sistersEveryNight && round >= 2) return false
      return ROLES[id].nightOrder !== undefined && !(ROLES[id].everyOtherNight && (round < 2 || round % 2 !== 0))
    })
    .sort((a, b) => (ROLES[a].nightOrder ?? 999) - (ROLES[b].nightOrder ?? 999))
}
