import type { RoleCategory, RoleDefinition, RoleId } from './types'

const role = (definition: RoleDefinition) => definition

export const ROLES: Record<RoleId, RoleDefinition> = {
  werewolf: role({ id: 'werewolf', name: 'Hombre Lobo Común', shortName: 'Lobo', icon: '🐺', color: '#bd5545', team: 'wolves', category: 'wolves', maxCards: 4, nightOrder: 60, callKind: 'wolves', description: 'La manada elige una víctima cada noche.', narratorPrompt: 'Despierta a todos los Hombres Lobo y pide que elijan una víctima.' }),
  fierce_wolf: role({ id: 'fierce_wolf', name: 'Lobo Feroz', shortName: 'Lobo Feroz', icon: '🩸', color: '#9e3d34', team: 'wolves', category: 'wolves', maxCards: 1, nightOrder: 70, callKind: 'confirm', description: 'Puede atacar de nuevo mientras no haya muerto ningún lobo.', narratorPrompt: 'Después de la manada, despiértalo de nuevo si conserva su segundo ataque.' }),
  infect_father: role({ id: 'infect_father', name: 'Infecto Padre de todos los Lobos', shortName: 'Infecto Padre', icon: '🦠', color: '#8f5149', team: 'wolves', category: 'wolves', maxCards: 1, nightOrder: 65, callKind: 'confirm', narratorOnly: true, description: 'Una vez por partida puede infectar a la víctima.', narratorPrompt: 'Tras el ataque, observa si levanta la mano para infectar a la víctima.' }),
  albino_wolf: role({ id: 'albino_wolf', name: 'Hombre Lobo Albino', shortName: 'Lobo Albino', icon: '🐺', color: '#b7aca7', team: 'neutral', category: 'solitary', maxCards: 1, nightOrder: 75, everyOtherNight: true, callKind: 'one-target', description: 'Desde la segunda noche, una de cada dos, elimina a un lobo.', narratorPrompt: 'Despierta al Lobo Albino a solas para que elija a un Hombre Lobo.' }),
  villager: role({ id: 'villager', name: 'Aldeano Común', shortName: 'Aldeano', icon: '🌾', color: '#cda65d', team: 'village', category: 'village', maxCards: 9, description: 'No tiene poder especial.', narratorPrompt: 'No requiere llamada.' }),
  pure_villager: role({ id: 'pure_villager', name: 'Aldeano-Aldeano', shortName: 'Aldeano-Aldeano', icon: '☀️', color: '#d1b66f', team: 'village', category: 'village', maxCards: 1, description: 'Su inocencia es pública.', narratorPrompt: 'Recuerda que toda la aldea conoce su inocencia.' }),
  seer: role({ id: 'seer', name: 'Vidente', shortName: 'Vidente', icon: '🔮', color: '#8872c1', team: 'village', category: 'village', maxCards: 1, nightOrder: 50, callKind: 'one-target', description: 'Conoce la carta de una persona cada noche.', narratorPrompt: 'Pide que señale a una persona y muéstrale discretamente su carta.' }),
  cupid: role({ id: 'cupid', name: 'Cupido', shortName: 'Cupido', icon: '💘', color: '#c76984', team: 'village', category: 'village', maxCards: 1, firstNightOrder: 10, callKind: 'two-targets', description: 'Enamora a dos personas la primera noche.', narratorPrompt: 'Cupido elige a dos amantes. Después toca sus cabezas para que se reconozcan.' }),
  witch: role({ id: 'witch', name: 'Bruja', shortName: 'Bruja', icon: '🧪', color: '#62a27d', team: 'village', category: 'village', maxCards: 1, nightOrder: 80, callKind: 'witch', description: 'Tiene una curación y un veneno, de un solo uso.', narratorPrompt: 'Indícale la víctima de los lobos y pregunta si usa alguna poción.' }),
  hunter: role({ id: 'hunter', name: 'Cazador', shortName: 'Cazador', icon: '🎯', color: '#7b805b', team: 'village', category: 'village', maxCards: 1, firstNightOrder: 35, callKind: 'narrator-note', narratorOnly: true, description: 'Al morir, elimina a otra persona.', narratorPrompt: 'Ubica al Cazador en la mesa. No debe abrir los ojos; necesitarás recordarlo si muere.' }),
  little_girl: role({ id: 'little_girl', name: 'Niña Pequeña', shortName: 'Niña', icon: '👁️', color: '#776f9c', team: 'village', category: 'village', maxCards: 1, description: 'Puede espiar a los lobos.', narratorPrompt: 'No se la llama: puede espiar durante el turno de los lobos.' }),
  protector: role({ id: 'protector', name: 'Protector', shortName: 'Protector', icon: '🛡️', color: '#527c9a', team: 'village', category: 'village', maxCards: 1, nightOrder: 40, callKind: 'one-target', description: 'Protege a una persona distinta de la noche anterior.', narratorPrompt: 'Pide que elija a quién proteger esta noche; puede elegirse a sí mismo.' }),
  elder: role({ id: 'elder', name: 'Anciano', shortName: 'Anciano', icon: '🌳', color: '#6b8254', team: 'village', category: 'village', maxCards: 1, firstNightOrder: 34, callKind: 'narrator-note', narratorOnly: true, description: 'Resiste el primer ataque de los lobos.', narratorPrompt: 'Ubica al Anciano y recuerda que sobrevive al primer ataque de los lobos.' }),
  scapegoat: role({ id: 'scapegoat', name: 'Cabeza de Turco', shortName: 'Cabeza de Turco', icon: '👉', color: '#b45d5d', team: 'village', category: 'village', maxCards: 1, description: 'Muere si la votación termina en empate.', narratorPrompt: 'Tenlo presente al resolver empates.' }),
  village_fool: role({ id: 'village_fool', name: 'Tonto de la Aldea', shortName: 'Tonto', icon: '🎭', color: '#d47a69', team: 'village', category: 'village', maxCards: 1, description: 'Sobrevive al linchamiento, pero pierde el voto.', narratorPrompt: 'Si es expulsado, revela su carta y mantenlo vivo sin derecho a voto.' }),
  two_sisters: role({ id: 'two_sisters', name: 'Dos Hermanas', shortName: 'Hermanas', icon: '👭', color: '#9074a7', team: 'village', category: 'village', maxCards: 2, firstNightOrder: 25, callKind: 'confirm', description: 'Se reconocen la primera noche.', narratorPrompt: 'Despierta a las dos Hermanas para que se reconozcan.' }),
  three_brothers: role({ id: 'three_brothers', name: 'Tres Hermanos', shortName: 'Hermanos', icon: '👨‍👨‍👦', color: '#607ea0', team: 'village', category: 'village', maxCards: 3, firstNightOrder: 26, callKind: 'confirm', description: 'Se reconocen la primera noche.', narratorPrompt: 'Despierta a los tres Hermanos para que se reconozcan.' }),
  fox: role({ id: 'fox', name: 'Zorro', shortName: 'Zorro', icon: '🦊', color: '#c17645', team: 'village', category: 'village', maxCards: 1, nightOrder: 55, callKind: 'three-neighbours', description: 'Comprueba un grupo de tres vecinos.', narratorPrompt: 'Pide que señale a la persona central de tres vecinos e indica si hay al menos un lobo.' }),
  bear_tamer: role({ id: 'bear_tamer', name: 'Domador de Osos', shortName: 'Domador', icon: '🐻', color: '#7c5f48', team: 'village', category: 'village', maxCards: 1, firstNightOrder: 37, callKind: 'narrator-note', narratorOnly: true, description: 'El oso gruñe si hay un lobo vivo adyacente.', narratorPrompt: 'Ubica al Domador y a sus dos vecinos. Comprobarás el gruñido cada mañana.' }),
  stuttering_judge: role({ id: 'stuttering_judge', name: 'Juez Tartamudo', shortName: 'Juez', icon: '⚖️', color: '#647687', team: 'village', category: 'village', maxCards: 1, firstNightOrder: 30, callKind: 'confirm', description: 'Pacta una señal para ordenar una segunda votación.', narratorPrompt: 'Despiértalo y acordad en silencio la señal para activar una segunda votación.' }),
  rusty_knight: role({ id: 'rusty_knight', name: 'Caballero de la Espada Oxidada', shortName: 'Caballero', icon: '🗡️', color: '#7d7061', team: 'village', category: 'village', maxCards: 1, firstNightOrder: 36, callKind: 'narrator-note', narratorOnly: true, description: 'Si lo devoran, contagia al lobo más cercano a su izquierda.', narratorPrompt: 'Ubica al Caballero y el orden de la mesa para determinar qué lobo enfermaría.' }),
  thief: role({ id: 'thief', name: 'Ladrón', shortName: 'Ladrón', icon: '🃏', color: '#558592', team: 'variable', category: 'ambiguous', maxCards: 1, firstNightOrder: 5, callKind: 'confirm', description: 'Puede cambiar su carta por una de las dos sobrantes.', narratorPrompt: 'Muéstrale las dos cartas sobrantes y anota el personaje que adopta.' }),
  devoted_servant: role({ id: 'devoted_servant', name: 'Abnegada Sirvienta', shortName: 'Sirvienta', icon: '🫶', color: '#aa728d', team: 'variable', category: 'ambiguous', maxCards: 1, description: 'Puede asumir el rol de una persona linchada.', narratorPrompt: 'Antes de revelar a una persona linchada, dale la oportunidad de sacrificarse.' }),
  actor: role({ id: 'actor', name: 'Comediante', shortName: 'Comediante', icon: '🎭', color: '#a0655c', team: 'variable', category: 'ambiguous', maxCards: 1, nightOrder: 48, callKind: 'confirm', description: 'Elige temporalmente uno de tres poderes preparados.', narratorPrompt: 'Permite que elija uno de los personajes disponibles para usar su poder esta noche.' }),
  wild_child: role({ id: 'wild_child', name: 'Niño Salvaje', shortName: 'Niño Salvaje', icon: '🌲', color: '#527957', team: 'variable', category: 'ambiguous', maxCards: 1, firstNightOrder: 20, callKind: 'one-target', description: 'Elige un mentor; si muere, se convierte en lobo.', narratorPrompt: 'Pide que señale a su modelo a seguir y anótalo.' }),
  wolf_hound: role({ id: 'wolf_hound', name: 'Perro Lobo', shortName: 'Perro Lobo', icon: '🐕', color: '#86765c', team: 'variable', category: 'ambiguous', maxCards: 1, firstNightOrder: 15, callKind: 'confirm', description: 'Elige si será aldeano o lobo.', narratorPrompt: 'Pide que indique si elige ser Aldeano o Hombre Lobo y anótalo.' }),
  flutist: role({ id: 'flutist', name: 'Flautista', shortName: 'Flautista', icon: '🎶', color: '#9b5d96', team: 'neutral', category: 'solitary', maxCards: 1, nightOrder: 90, callKind: 'two-targets', description: 'Hechiza a dos personas cada noche.', narratorPrompt: 'Pide que señale a dos personas; después despierta a todos los hechizados.' }),
  sectarian: role({ id: 'sectarian', name: 'Abominable Sectario', shortName: 'Sectario', icon: '🕯️', color: '#5f535e', team: 'neutral', category: 'solitary', maxCards: 1, firstNightOrder: 2, callKind: 'narrator-note', narratorOnly: true, description: 'Gana si elimina al grupo opuesto.', narratorPrompt: 'Antes de empezar, divide públicamente la aldea en dos grupos y anota a cuál pertenece.' }),
  angel: role({ id: 'angel', name: 'Ángel', shortName: 'Ángel', icon: '🪽', color: '#9eafbf', team: 'neutral', category: 'solitary', maxCards: 1, description: 'Gana si es eliminado en la primera votación o primera noche.', narratorPrompt: 'La partida debe comenzar de día con debate y votación.' }),
  pyromaniac: role({ id: 'pyromaniac', name: 'Pirómano', shortName: 'Pirómano', icon: '🔥', color: '#c6653d', team: 'village', category: 'village-expansion', maxCards: 1, description: 'Personalidad asociada a La Aldea.', narratorPrompt: 'Aplica su poder de edificio según la variante La Aldea.' }),
  raven: role({ id: 'raven', name: 'Cuervo', shortName: 'Cuervo', icon: '🐦‍⬛', color: '#48515a', team: 'village', category: 'village-expansion', maxCards: 1, description: 'Personalidad asociada a La Aldea.', narratorPrompt: 'Aplica su poder de edificio según la variante La Aldea.' }),
}

export const ROLE_LIST = Object.values(ROLES)
export const CATEGORY_LABELS: Record<RoleCategory, string> = { wolves: 'Hombres Lobo', village: 'Aldeanos', ambiguous: 'Ambiguos', solitary: 'Solitarios', 'village-expansion': 'La Aldea' }
export const isWolfRole = (id?: RoleId): id is RoleId => Boolean(id && ['werewolf', 'fierce_wolf', 'infect_father', 'albino_wolf'].includes(id))

const FIRST_NIGHT_DISCOVERY_ORDER: Partial<Record<RoleId, number>> = {
  sectarian: 2,
  thief: 5,
  cupid: 10,
  wolf_hound: 15,
  wild_child: 20,
  two_sisters: 25,
  three_brothers: 26,
  stuttering_judge: 30,
  elder: 34,
  hunter: 35,
  rusty_knight: 36,
  bear_tamer: 37,
  pure_villager: 38,
  little_girl: 39,
  scapegoat: 40,
  village_fool: 41,
  devoted_servant: 42,
  angel: 43,
  pyromaniac: 44,
  raven: 45,
  actor: 46,
  protector: 50,
  witch: 90,
  flutist: 60,
  fox: 70,
  fierce_wolf: 75,
  infect_father: 76,
  albino_wolf: 77,
  werewolf: 80,
  seer: 999,
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
  const present = new Set(players.filter((player): player is { roleId: RoleId; alive: boolean } => player.alive && Boolean(player.roleId)).map((player) => player.roleId))
  if ([...present].some(isWolfRole)) present.add('werewolf')
  return [...present].filter((id) => {
    const current = ROLES[id]
    if (round === 1 && current.firstNightOrder !== undefined) return true
    if (current.nightOrder === undefined) return false
    return !(current.everyOtherNight && (round < 2 || round % 2 !== 0))
  }).sort((a, b) => {
    const order = (id: RoleId) => round === 1 ? Math.min(ROLES[id].firstNightOrder ?? 999, ROLES[id].nightOrder ?? 999) : ROLES[id].nightOrder ?? 999
    return order(a) - order(b)
  })
}
