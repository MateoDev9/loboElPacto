import type { RoleCategory, RoleDefinition, RoleId } from './types'

const role = (definition: RoleDefinition) => definition

export const ROLES: Record<RoleId, RoleDefinition> = {
  werewolf: role({ id: 'werewolf', name: 'Hombre Lobo Común', shortName: 'Lobos', icon: '🐺', color: '#bd5545', team: 'wolves', category: 'wolves', maxCards: 4, nightOrder: 60, callKind: 'wolves', description: 'La manada elige una víctima cada noche.', narratorPrompt: 'Despierta a toda la manada y pide que elijan una víctima que no sea Hombre Lobo.' }),
  fierce_wolf: role({ id: 'fierce_wolf', name: 'Lobo Feroz', shortName: 'Lobo Feroz', icon: '🩸', color: '#9e3d34', team: 'wolves', category: 'wolves', maxCards: 1, nightOrder: 70, callKind: 'one-target', description: 'Realiza un segundo ataque mientras no haya muerto ningún lobo.', narratorPrompt: 'Si ningún lobo ha muerto, despiértalo solo para que elija una segunda víctima que no sea lobo.' }),
  infect_father: role({ id: 'infect_father', name: 'Infecto Padre de todos los Lobos', shortName: 'Infecto Padre', icon: '🦠', color: '#8f5149', team: 'wolves', category: 'wolves', maxCards: 1, nightOrder: 65, callKind: 'confirm', description: 'Una vez por partida puede convertir a la víctima en lobo.', narratorPrompt: 'Tras dormir la manada, observa si levanta la mano. Si lo hace, la víctima no muere: queda infectada y conserva su poder.' }),
  albino_wolf: role({ id: 'albino_wolf', name: 'Hombre Lobo Albino', shortName: 'Lobo Albino', icon: '🐺', color: '#b7aca7', team: 'neutral', category: 'solitary', maxCards: 1, nightOrder: 75, everyOtherNight: true, callKind: 'one-target', description: 'Desde la segunda noche, una de cada dos, elimina a un lobo.', narratorPrompt: 'Despiértalo a solas para que elimine a un Hombre Lobo. Su objetivo es ser el único superviviente.' }),

  villager: role({ id: 'villager', name: 'Aldeano Común', shortName: 'Aldeano', icon: '🌾', color: '#cda65d', team: 'village', category: 'village', maxCards: 9, passive: true, description: 'No tiene poder especial.', narratorPrompt: 'No realiza ninguna acción nocturna.' }),
  pure_villager: role({ id: 'pure_villager', name: 'Aldeano-Aldeano', shortName: 'Aldeano-Aldeano', icon: '☀️', color: '#d1b66f', team: 'village', category: 'village', maxCards: 1, callKind: 'confirm', passive: true, description: 'Su inocencia es pública desde el reparto.', narratorPrompt: 'Ubícalo para el narrador y recuerda anunciar públicamente su inocencia.' }),
  seer: role({ id: 'seer', name: 'Vidente', shortName: 'Vidente', icon: '🔮', color: '#8872c1', team: 'village', category: 'village', maxCards: 1, nightOrder: 20, callKind: 'one-target', description: 'Conoce la carta de una persona cada noche.', narratorPrompt: 'Pide que señale a una persona y muéstrale discretamente su carta.' }),
  cupid: role({ id: 'cupid', name: 'Cupido', shortName: 'Cupido', icon: '💘', color: '#c76984', team: 'village', category: 'village', maxCards: 1, firstNightOrder: 10, callKind: 'two-targets', description: 'Enamora a dos personas la primera noche.', narratorPrompt: 'Elige dos amantes, toca sus cabezas y deja que se reconozcan. Si uno muere, el otro muere de pena.' }),
  witch: role({ id: 'witch', name: 'Bruja', shortName: 'Bruja', icon: '🧪', color: '#62a27d', team: 'village', category: 'village', maxCards: 1, nightOrder: 80, callKind: 'witch', description: 'Tiene una curación y un veneno, de un solo uso.', narratorPrompt: 'Indícale la víctima real de los lobos y pregunta si usa la curación, el veneno, ambas o ninguna.' }),
  hunter: role({ id: 'hunter', name: 'Cazador', shortName: 'Cazador', icon: '🎯', color: '#7b805b', team: 'village', category: 'village', maxCards: 1, callKind: 'confirm', passive: true, description: 'Al morir, elimina inmediatamente a otra persona.', narratorPrompt: 'Anota quién tiene el Cazador. Cuando muera, detente para que pueda hacer su disparo.' }),
  little_girl: role({ id: 'little_girl', name: 'Niña Pequeña', shortName: 'Niña', icon: '👁️', color: '#776f9c', team: 'village', category: 'village', maxCards: 1, callKind: 'confirm', passive: true, description: 'Puede espiar a los lobos; si la descubren, muere en vez de la víctima.', narratorPrompt: 'Ubícala. Durante el turno de los lobos podrás marcar si ha sido sorprendida espiando.' }),
  protector: role({ id: 'protector', name: 'Protector', shortName: 'Protector', icon: '🛡️', color: '#527c9a', team: 'village', category: 'village', maxCards: 1, nightOrder: 40, callKind: 'one-target', description: 'Protege del ataque de los lobos, sin repetir persona dos noches seguidas.', narratorPrompt: 'Pide que proteja a una persona. Puede elegirse a sí mismo, pero no repetir la protección de la noche anterior.' }),
  elder: role({ id: 'elder', name: 'Anciano', shortName: 'Anciano', icon: '🌳', color: '#6b8254', team: 'village', category: 'village', maxCards: 1, callKind: 'confirm', passive: true, description: 'Sobrevive al primer ataque de los lobos.', narratorPrompt: 'Ubícalo. Resiste el primer ataque de los lobos; otras causas lo eliminan de inmediato.' }),
  scapegoat: role({ id: 'scapegoat', name: 'Cabeza de Turco', shortName: 'Cabeza de Turco', icon: '👉', color: '#b45d5d', team: 'village', category: 'village', maxCards: 1, callKind: 'confirm', passive: true, description: 'Muere si la votación termina en empate y decide quién votará después.', narratorPrompt: 'Anota quién tiene el Cabeza de Turco. Si hay empate, podrá elegir quién vota en la próxima ronda.' }),
  village_fool: role({ id: 'village_fool', name: 'Tonto de la Aldea', shortName: 'Tonto', icon: '🎭', color: '#d47a69', team: 'village', category: 'village', maxCards: 1, callKind: 'confirm', passive: true, description: 'Sobrevive al linchamiento, revela su carta y pierde el voto.', narratorPrompt: 'Ubícalo. Si la aldea lo expulsa, seguirá vivo pero perderá su derecho a voto.' }),
  two_sisters: role({ id: 'two_sisters', name: 'Dos Hermanas', shortName: 'Hermanas', icon: '👭', color: '#9074a7', team: 'village', category: 'village', maxCards: 2, firstNightOrder: 25, nightOrder: 50, callKind: 'confirm', description: 'Se reconocen cada noche antes de los Lobos.', narratorPrompt: 'Despierta a las dos Hermanas antes que a los Lobos. Deja que se comuniquen un momento con gestos y haz que vuelvan a dormir.' }),
  three_brothers: role({ id: 'three_brothers', name: 'Tres Hermanos', shortName: 'Hermanos', icon: '👨‍👨‍👦', color: '#607ea0', team: 'village', category: 'village', maxCards: 3, firstNightOrder: 26, callKind: 'confirm', description: 'Se reconocen la primera noche.', narratorPrompt: 'Despierta a los tres Hermanos para que se reconozcan.' }),
  fox: role({ id: 'fox', name: 'Zorro', shortName: 'Zorro', icon: '🦊', color: '#c17645', team: 'village', category: 'village', maxCards: 1, nightOrder: 25, callKind: 'three-neighbours', description: 'Comprueba tres vecinos; pierde el poder si no encuentra ningún lobo.', narratorPrompt: 'Puede señalar al centro de un grupo de tres vecinos. Indica si contiene al menos un lobo; si no, pierde su poder.' }),
  bear_tamer: role({ id: 'bear_tamer', name: 'Domador de Osos', shortName: 'Domador', icon: '🐻', color: '#7c5f48', team: 'village', category: 'village', maxCards: 1, callKind: 'confirm', passive: true, description: 'Cada mañana el oso gruñe si hay un lobo vivo adyacente.', narratorPrompt: 'Anota quién tiene el Domador y conserva el orden del coro para comprobar sus vecinos cada mañana.' }),
  stuttering_judge: role({ id: 'stuttering_judge', name: 'Juez Tartamudo', shortName: 'Juez', icon: '⚖️', color: '#647687', team: 'village', category: 'village', maxCards: 1, firstNightOrder: 30, callKind: 'confirm', description: 'Una vez por partida puede ordenar una segunda votación inmediata.', narratorPrompt: 'Acordad en silencio una señal. Durante una votación podrás activar una segunda votación sin debate.' }),
  rusty_knight: role({ id: 'rusty_knight', name: 'Caballero de la Espada Oxidada', shortName: 'Caballero', icon: '🗡️', color: '#7d7061', team: 'village', category: 'village', maxCards: 1, callKind: 'confirm', passive: true, description: 'Si es devorado, enferma al lobo vivo más cercano a su izquierda.', narratorPrompt: 'Anota quién tiene el Caballero. Si los lobos lo matan, marca al lobo vivo más cercano a su izquierda.' }),

  thief: role({ id: 'thief', name: 'Ladrón', shortName: 'Ladrón', icon: '🃏', color: '#558592', team: 'variable', category: 'ambiguous', maxCards: 1, firstNightOrder: 5, callKind: 'thief', description: 'Puede adoptar una de las dos cartas sobrantes.', narratorPrompt: 'Muéstrale las dos cartas sobrantes y registra el personaje que conserva o adopta.' }),
  devoted_servant: role({ id: 'devoted_servant', name: 'Abnegada Sirvienta', shortName: 'Sirvienta', icon: '🫶', color: '#aa728d', team: 'variable', category: 'ambiguous', maxCards: 1, callKind: 'confirm', passive: true, description: 'Antes de revelar a un linchado puede adoptar su carta.', narratorPrompt: 'Anota quién tiene la Sirvienta. Antes de revelar a una persona expulsada, pregúntale si quiere quedarse con su carta.' }),
  actor: role({ id: 'actor', name: 'Comediante', shortName: 'Comediante', icon: '🎭', color: '#a0655c', team: 'variable', category: 'ambiguous', maxCards: 1, nightOrder: 10, callKind: 'actor', description: 'Cada noche usa uno de tres poderes preparados; la carta se retira.', narratorPrompt: 'Registra cuál de las cartas preparadas elige esta noche y realiza su poder antes de retirarla.' }),
  wild_child: role({ id: 'wild_child', name: 'Niño Salvaje', shortName: 'Niño Salvaje', icon: '🌲', color: '#527957', team: 'variable', category: 'ambiguous', maxCards: 1, firstNightOrder: 20, callKind: 'one-target', description: 'Elige un mentor; cuando muere, se convierte en lobo.', narratorPrompt: 'Pide que señale a su modelo. Si el modelo muere, se incorporará a la manada desde la noche siguiente.' }),
  wolf_hound: role({ id: 'wolf_hound', name: 'Perro Lobo', shortName: 'Perro Lobo', icon: '🐕', color: '#86765c', team: 'variable', category: 'ambiguous', maxCards: 1, callKind: 'confirm', passive: true, description: 'Elige en secreto ser aldeano o lobo para toda la partida.', narratorPrompt: 'Ubícalo, pero no le preguntes su elección. Durante la llamada de la manada anotarás si abre los ojos con los lobos.' }),

  flutist: role({ id: 'flutist', name: 'Flautista', shortName: 'Flautista', icon: '🎶', color: '#9b5d96', team: 'neutral', category: 'solitary', maxCards: 1, nightOrder: 90, callKind: 'two-targets', description: 'Hechiza a dos personas cada noche y gana cuando todos los demás están hechizados.', narratorPrompt: 'Pide que hechice a dos personas nuevas. Después despierta a todos los hechizados para que se reconozcan.' }),
  sectarian: role({ id: 'sectarian', name: 'Abominable Sectario', shortName: 'Sectario', icon: '🕯️', color: '#5f535e', team: 'neutral', category: 'solitary', maxCards: 1, firstNightOrder: 2, callKind: 'sectarian', description: 'Gana cuando elimina al grupo público al que no pertenece.', narratorPrompt: 'La aldea debe estar dividida públicamente en dos grupos. Registra a qué grupo pertenece cada persona.' }),
  angel: role({ id: 'angel', name: 'Ángel', shortName: 'Ángel', icon: '🪽', color: '#9eafbf', team: 'neutral', category: 'solitary', maxCards: 1, callKind: 'confirm', passive: true, description: 'Gana si es eliminado en la primera votación o durante la primera noche.', narratorPrompt: 'Ubícalo. Con Ángel, la partida empieza con un debate y una votación antes de la primera noche.' }),

  pyromaniac: role({ id: 'pyromaniac', name: 'Pirómano', shortName: 'Pirómano', icon: '🔥', color: '#c6653d', team: 'village', category: 'village-expansion', maxCards: 1, nightOrder: 35, callKind: 'optional-one-target', description: 'Una vez por partida quema un edificio; puede frustrar el ataque de los lobos.', narratorPrompt: 'Puede quemar un edificio una vez por partida. Si coincide con la víctima, esta se salva y muere el lobo más cercano a su derecha.' }),
  raven: role({ id: 'raven', name: 'Cuervo', shortName: 'Cuervo', icon: '🐦‍⬛', color: '#48515a', team: 'village', category: 'village-expansion', maxCards: 1, nightOrder: 30, callKind: 'optional-one-target', description: 'Señala a alguien que recibirá dos votos en contra al día siguiente.', narratorPrompt: 'Puede señalar a una persona sospechosa. Recuérdale al narrador añadir dos votos contra ella en la próxima votación.' }),
}

export const ROLE_LIST = Object.values(ROLES)
export const CATEGORY_LABELS: Record<RoleCategory, string> = { wolves: 'Hombres Lobo', village: 'Aldeanos', ambiguous: 'Ambiguos', solitary: 'Solitarios', 'village-expansion': 'La Aldea' }
export const isWolfRole = (id?: RoleId): id is RoleId => Boolean(id && ['werewolf', 'fierce_wolf', 'infect_father', 'albino_wolf'].includes(id))
export const isVillagePower = (id?: RoleId) => Boolean(id && ROLES[id].team === 'village' && !['villager', 'pure_villager'].includes(id))

const FIRST_NIGHT_DISCOVERY_ORDER: Partial<Record<RoleId, number>> = {
  sectarian: 1, thief: 5, actor: 7, cupid: 10, wolf_hound: 15, wild_child: 20,
  two_sisters: 25, three_brothers: 26, stuttering_judge: 30, elder: 34, hunter: 35,
  rusty_knight: 36, bear_tamer: 37, pure_villager: 38, little_girl: 39, scapegoat: 40,
  village_fool: 41, devoted_servant: 42, angel: 43, raven: 45, pyromaniac: 46,
  protector: 55, werewolf: 60, infect_father: 65, fierce_wolf: 70,
  albino_wolf: 75, witch: 80, flutist: 90, fox: 998, seer: 999,
}

export function recommendedRoles(playerCount: number): RoleId[] {
  const wolves = playerCount >= 13 ? 3 : playerCount >= 8 ? 2 : 1
  const specials: RoleId[] = playerCount >= 10 ? ['seer', 'witch', 'protector', 'hunter', 'cupid'] : playerCount >= 7 ? ['seer', 'witch', 'hunter'] : ['seer', 'protector']
  const chosen: RoleId[] = [...Array<RoleId>(wolves).fill('werewolf'), ...specials]
  return [...chosen.slice(0, playerCount), ...Array<RoleId>(Math.max(0, playerCount - chosen.length)).fill('villager')]
}

export function buildFirstNightSequence(deck: RoleId[]): RoleId[] {
  const present = new Set(deck.filter((id) => id !== 'villager'))
  if (deck.some(isWolfRole)) present.add('werewolf')
  return [...present].sort((a, b) => (FIRST_NIGHT_DISCOVERY_ORDER[a] ?? 500) - (FIRST_NIGHT_DISCOVERY_ORDER[b] ?? 500))
}

export function buildNightSequence(players: { roleId?: RoleId; alive: boolean }[], round: number): RoleId[] {
  const present = new Set(players.filter((player) => player.alive && player.roleId).map((player) => player.roleId!))
  if ([...present].some(isWolfRole)) present.add('werewolf')
  return [...present]
    .filter((id) => ROLES[id].nightOrder !== undefined && !(ROLES[id].everyOtherNight && (round < 2 || round % 2 !== 0)))
    .sort((a, b) => (ROLES[a].nightOrder ?? 999) - (ROLES[b].nightOrder ?? 999))
}
