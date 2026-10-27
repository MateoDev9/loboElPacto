import { recommendedBuildings } from './buildings'
import { buildFirstNightSequence, buildNightSequence, firstNightOrder, HOUSE_RULES, isVillagePower, isWolfRole, ROLES } from './roles'
import type { BuildingId, DeathCause, GamePhase, GameRules, GameState, Player, PostDeathAction, RoleId } from './types'

const emptyNight = (): GameState['night'] => ({
  targets: {}, skippedRoles: [], infectVictim: false, littleGirlCaught: false, witchSaved: false,
})

export const createGame = (
  names: string[],
  deck: RoleId[],
  actorCards: RoleId[] = [],
  options: { sheriff?: boolean; rules?: Partial<GameRules>; buildings?: boolean } = {},
): GameState => {
  const defaultBuildings = options.buildings ? recommendedBuildings(names.length) : []
  const players: Player[] = names.map((name, index) => ({
    id: crypto.randomUUID(),
    name,
    alive: true,
    ...(options.buildings ? { buildingId: defaultBuildings[index], buildingUsed: false } : {}),
  }))
  const openingDay = deck.includes('angel')
  const rules: GameRules = { ...HOUSE_RULES, ...options.rules }
  const buildingsEnabled = Boolean(options.buildings)
  return {
    players, deck, rules, buildingsEnabled, vacantBuildings: [], headmistressMutedIds: [],
    roleChoices: {}, round: 1, openingDay,
    phase: buildingsEnabled ? 'buildings-setup' : 'night-intro',
    night: emptyNight(), nightSequence: openingDay ? ['angel'] : buildFirstNightSequence(deck, rules), sequenceIndex: 0,
    healPotionAvailable: true, poisonPotionAvailable: true, infectionAvailable: true,
    pyromaniacAvailable: true, foxPowerAvailable: true, judgePowerAvailable: true,
    judgeSecondVoteRequested: false, judgeSecondVoteActive: false, elderWolfHits: 0, villagePowersDisabled: false,
    foolRevealed: false, lovers: [], charmedIds: [], infectedIds: [], wildChildTurned: false,
    actorCards, actorUsedRoles: [], sectarianGroups: {}, wolfDeathsOccurred: false, pendingHunters: [],
    scapegoatVoters: [], lastDeaths: [], sheriffEnabled: Boolean(options.sheriff || options.buildings),
  }
}

export const alivePlayers = (game: GameState) => game.players.filter((player) => player.alive)
export const aliveWithRole = (game: GameState, roleId: RoleId) => game.players.filter((player) => player.alive && player.roleId === roleId)

export const isVagrant = (game: GameState, player: Player) => Boolean(
  game.buildingsEnabled && (!player.buildingId || player.buildingId === 'vagrant')
)

export const hasActiveBuilding = (game: GameState, player: Player, buildingId: BuildingId) => Boolean(
  game.buildingsEnabled
  && player.alive
  && player.buildingId === buildingId
  && !player.buildingUsed
  && !(buildingId === 'innkeeper' && game.innkeeperLostImmunity)
)

export const eligibleSheriffCandidates = (game: GameState): Player[] => {
  const alive = alivePlayers(game)
  if (!game.buildingsEnabled) return alive
  return alive.filter((player) => player.buildingId === 'farmer')
}

export const isWolfAlignedPlayer = (game: GameState, player: Player) => Boolean(
  isWolfRole(player.roleId)
  || game.infectedIds.includes(player.id)
  || (player.roleId === 'wolf_hound' && game.roleChoices.wolf_hound === 'wolves')
  || (player.roleId === 'wild_child' && game.wildChildTurned)
)

export const aliveWolves = (game: GameState) => alivePlayers(game).filter((player) => isWolfAlignedPlayer(game, player))

export function determineWinner(game: GameState): GameState['winner'] {
  if (game.winner) return game.winner
  const alive = alivePlayers(game)
  if (!alive.length) return 'nobody'
  // Un Flautista o un Sectario infectado se convierte en Hombre Lobo y abandona su objetivo
  const flutist = alive.find((player) => player.roleId === 'flutist' && !game.infectedIds.includes(player.id))
  if (flutist && alive.every((player) => player.id === flutist.id || game.charmedIds.includes(player.id))) return 'flutist'
  const albino = alive.find((player) => player.roleId === 'albino_wolf')
  if (albino && alive.length === 1) return 'albino_wolf'
  const sectarian = alive.find((player) => player.roleId === 'sectarian' && !game.infectedIds.includes(player.id))
  if (sectarian && Object.keys(game.sectarianGroups).length === game.players.length) {
    const ownGroup = game.sectarianGroups[sectarian.id]
    if (ownGroup && alive.every((player) => game.sectarianGroups[player.id] === ownGroup)) return 'sectarian'
  }
  if (game.lovers.length === 2 && alive.length === 2 && game.lovers.every((id) => alive.some((player) => player.id === id))) return 'lovers'
  const wolves = aliveWolves(game)
  const others = alive.length - wolves.length
  if (wolves.length === 0) return 'village'
  if (wolves.length >= others) {
    // Si solo quedan lobos y entre ellos está el Albino, la partida sigue: él solo gana siendo el único superviviente
    if (others === 0 && wolves.length > 1 && wolves.some((player) => player.roleId === 'albino_wolf')) return undefined
    return 'wolves'
  }
  return undefined
}

export function assignRoleOwners(game: GameState, roleId: RoleId, ownerIds: string[]): GameState {
  let players = game.players.map((player) => {
    if (ownerIds.includes(player.id)) return { ...player, roleId }
    if (player.roleId === roleId) return { ...player, roleId: undefined }
    return player
  })
  const assignedCounts = players.reduce<Partial<Record<RoleId, number>>>((counts, player) => {
    if (player.roleId) counts[player.roleId] = (counts[player.roleId] ?? 0) + 1
    return counts
  }, {})
  const remainingCards = game.deck.filter((card) => {
    if ((assignedCounts[card] ?? 0) > 0) {
      assignedCounts[card] = (assignedCounts[card] ?? 0) - 1
      return false
    }
    return true
  })
  const unassigned = players.filter((player) => !player.roleId)
  if (remainingCards.length === unassigned.length && remainingCards.every((card) => card === 'villager')) {
    players = players.map((player) => player.roleId ? player : { ...player, roleId: 'villager' })
  }
  return { ...game, players }
}

const removeCards = (deck: RoleId[], cards: RoleId[]) => cards.reduce((remaining, card) => {
  const index = remaining.indexOf(card)
  return index < 0 ? remaining : remaining.filter((_, itemIndex) => itemIndex !== index)
}, deck)

export function applyThiefChoice(game: GameState, adoptedRole: RoleId): GameState {
  // Las 2 cartas sobrantes salen del juego; si el Ladrón cambia, su carta queda en el centro en lugar de la adoptada
  const leftovers = (game.thiefLeftovers ?? []).filter(Boolean)
  let deck = removeCards(game.deck, leftovers)
  if (adoptedRole !== 'thief') deck = [...removeCards(deck, ['thief']), adoptedRole]
  const players = adoptedRole === 'thief' ? game.players : game.players.map((player) => player.roleId === 'thief' ? { ...player, roleId: adoptedRole } : player)
  const completed = game.nightSequence.slice(0, game.sequenceIndex + 1)
  const desired = buildFirstNightSequence(deck, game.rules).filter((roleId) => roleId !== 'angel')
  const remaining = desired.filter((roleId) => !completed.includes(roleId))
  return { ...game, deck, players, nightSequence: [...completed, ...remaining] }
}

export function applyActorChoice(game: GameState): GameState {
  const roleId = game.night.actorRoleId
  if (!roleId) return game
  // El Comediante actúa en el turno del personaje elegido, como si tuviera su carta
  const order = (id: RoleId) => game.round === 1 ? firstNightOrder(id, game.rules) : ROLES[id].nightOrder ?? 999
  const completed = game.nightSequence.slice(0, game.sequenceIndex + 1)
  const remaining = game.nightSequence.slice(game.sequenceIndex + 1)
  const position = remaining.findIndex((id) => order(id) > order(roleId))
  remaining.splice(position < 0 ? remaining.length : position, 0, roleId)
  return { ...game, actorUsedRoles: [...game.actorUsedRoles, roleId], nightSequence: [...completed, ...remaining] }
}

const SERVANT_RESTART_CALLS: RoleId[] = ['wild_child', 'stuttering_judge', 'three_brothers']

const filteredNightSequence = (game: GameState, round: number) => {
  let sequence = buildNightSequence(game.players, round, game.rules)
  if (aliveWolves(game).length && !sequence.includes('werewolf')) sequence.push('werewolf')
  if (!game.foxPowerAvailable) sequence = sequence.filter((id) => id !== 'fox')
  if (!game.infectionAvailable) sequence = sequence.filter((id) => id !== 'infect_father')
  if (!game.pyromaniacAvailable) sequence = sequence.filter((id) => id !== 'pyromaniac')
  if (game.wolfDeathsOccurred) sequence = sequence.filter((id) => id !== 'fierce_wolf')
  // Una Hermana que queda sola ya no tiene con quién reconocerse
  if (aliveWithRole(game, 'two_sisters').length < 2) sequence = sequence.filter((id) => id !== 'two_sisters')
  if (alivePlayers(game).filter((player) => player.roleId === 'flutist').every((player) => game.infectedIds.includes(player.id))) sequence = sequence.filter((id) => id !== 'flutist')
  if (game.servantRestartRole && SERVANT_RESTART_CALLS.includes(game.servantRestartRole) && !sequence.includes(game.servantRestartRole) && aliveWithRole(game, game.servantRestartRole).length) sequence.push(game.servantRestartRole)
  if (game.villagePowersDisabled) sequence = sequence.filter((id) => !isVillagePower(id))
  return sequence.sort((a, b) => (ROLES[a].nightOrder ?? 999) - (ROLES[b].nightOrder ?? 999))
}

// Tras el día del Ángel ya se conoce la carta de quien salió: no se llama a personajes que solo tenían los eliminados
const stillInPlay = (game: GameState, roleId: RoleId) => {
  const cardsLeft = (id: RoleId) => game.deck.filter((card) => card === id).length - game.players.filter((player) => !player.alive && player.roleId === id).length
  return roleId === 'werewolf' ? [...new Set(game.deck)].some((id) => isWolfRole(id) && cardsLeft(id) > 0) : cardsLeft(roleId) > 0
}

export function prepareNextNight(game: GameState): GameState {
  const round = game.openingDay ? game.round : game.round + 1
  const firstNightAfterOpeningDay = game.openingDay
  return {
    ...game,
    openingDay: false,
    round,
    phase: 'night-intro',
    night: emptyNight(),
    nightSequence: firstNightAfterOpeningDay ? game.nightSequence.filter((id) => stillInPlay(game, id)) : filteredNightSequence(game, round),
    sequenceIndex: 0,
    judgeSecondVoteRequested: false,
    judgeSecondVoteActive: false,
    noblePardonRequested: false,
    headmistressMutedIds: [],
    pendingVoteTargetId: undefined,
    pendingHunters: [],
    postDeathAction: undefined,
    lastDeaths: [],
    ravenVoteTargetId: undefined,
    burnedPlayerId: undefined,
    elderSurvivedAttack: false,
  }
}

function nearestAliveWolf(game: GameState, fromId: string, direction: -1 | 1) {
  const start = game.players.findIndex((player) => player.id === fromId)
  if (start < 0) return undefined
  for (let step = 1; step < game.players.length; step += 1) {
    const index = (start + direction * step + game.players.length) % game.players.length
    const candidate = game.players[index]
    if (candidate.alive && isWolfAlignedPlayer(game, candidate)) return candidate.id
  }
  return undefined
}

function finishDeaths(game: GameState): GameState {
  // El Cazador dispara antes de comprobar quién gana: su disparo puede cambiar el resultado
  if (game.pendingHunters.length && !game.winner) {
    return game.postDeathAction === 'night-result' ? { ...game, phase: 'night-result', postDeathAction: undefined } : { ...game, phase: 'hunter-action' }
  }
  // En el día del Ángel aún no se conocen las cartas, así que solo puede terminar si gana el propio Ángel
  const winner = game.openingDay ? game.winner : determineWinner(game)
  if (winner) return { ...game, winner, phase: 'game-over', postDeathAction: undefined }
  // Con edificios, si mueren todos los Granjeros ya no hay Alguacil
  let current = game
  if (current.sheriffSuccessionPending && current.buildingsEnabled && eligibleSheriffCandidates(current).length === 0) {
    current = { ...current, sheriffSuccessionPending: false, sheriffLost: true }
  }
  // El Alguacil que muere nombra sucesor antes de seguir; de noche se hace desde el amanecer
  if (current.sheriffSuccessionPending) {
    return current.postDeathAction === 'night-result' ? { ...current, phase: 'night-result', postDeathAction: undefined } : { ...current, phase: 'sheriff-action' }
  }
  if (current.postDeathAction === 'night-result') return { ...current, phase: 'night-result', postDeathAction: undefined }
  if (current.postDeathAction === 'stay-day') return { ...current, postDeathAction: undefined }
  if (current.postDeathAction === 'second-vote') return { ...current, phase: 'day-vote', postDeathAction: undefined, pendingVoteTargetId: undefined, judgeSecondVoteRequested: false, judgeSecondVoteActive: true }
  return prepareNextNight({ ...current, postDeathAction: undefined })
}

function applyDeaths(game: GameState, deaths: Array<{ playerId?: string; cause: DeathCause }>, postDeathAction: PostDeathAction): GameState {
  let next: GameState = { ...game, postDeathAction, pendingHunters: [...game.pendingHunters], lastDeaths: [...game.lastDeaths] }
  const queue = [...deaths]
  while (queue.length) {
    const death = queue.shift()!
    if (!death.playerId) continue
    const player = next.players.find((candidate) => candidate.id === death.playerId)
    if (!player?.alive) continue

    const wolfAttack = death.cause === 'wolves' || death.cause === 'fierce-wolf'
    // El Tabernero con inmunidad activa no puede ser devorado por los Hombres Lobo
    if (wolfAttack && hasActiveBuilding(next, player, 'innkeeper')) {
      continue
    }
    if (player.roleId === 'elder' && wolfAttack && next.elderWolfHits === 0) {
      next = { ...next, elderWolfHits: 1 }
      continue
    }

    const wasWolf = isWolfAlignedPlayer(next, player)
    const freedBuilding = next.buildingsEnabled && player.buildingId && player.buildingId !== 'vagrant'
      ? player.buildingId
      : undefined
    next = {
      ...next,
      players: next.players.map((candidate) => candidate.id === player.id ? { ...candidate, alive: false } : candidate),
      lastDeaths: next.lastDeaths.includes(player.id) ? next.lastDeaths : [...next.lastDeaths, player.id],
      wolfDeathsOccurred: next.wolfDeathsOccurred || wasWolf || player.roleId === 'wild_child' || player.roleId === 'wolf_hound',
      villagePowersDisabled: next.villagePowersDisabled || (player.roleId === 'elder' && !wolfAttack),
      ...(freedBuilding ? { vacantBuildings: [...(next.vacantBuildings ?? []), freedBuilding] } : {}),
    }

    if (player.id === next.sheriffId) next = { ...next, sheriffId: undefined, sheriffSuccessionPending: true }
    const hunterAlwaysShoots = next.rules?.hunterAlwaysShoots ?? true
    const canHunterShoot = hunterAlwaysShoots || (death.cause !== 'love' && death.cause !== 'scapegoat')
    if (player.roleId === 'hunter' && !next.villagePowersDisabled && canHunterShoot && !next.pendingHunters.includes(player.id)) {
      next.pendingHunters = [...next.pendingHunters, player.id]
    }
    if (player.id === next.mentorId) next = { ...next, wildChildTurned: true }
    if (player.roleId === 'rusty_knight' && wolfAttack && !next.villagePowersDisabled) next = { ...next, rustyWolfDeathRound: next.round + 1 }
    if (next.lovers.includes(player.id)) {
      const partnerId = next.lovers.find((id) => id !== player.id)
      if (partnerId) queue.push({ playerId: partnerId, cause: 'love' })
    }
    if (player.roleId === 'angel' && ((next.openingDay && (death.cause === 'vote' || death.cause === 'scapegoat')) || (next.round === 1 && wolfAttack))) {
      next = { ...next, winner: 'angel' }
    }
  }
  return finishDeaths(next)
}

export function resolveNight(game: GameState): GameState {
  const burnedTargetId = game.night.pyromaniacTargetId
  let next: GameState = {
    ...game,
    lastDeaths: [],
    pendingHunters: [],
    ravenVoteTargetId: game.night.ravenTargetId,
    burnedPlayerId: burnedTargetId ?? game.burnedPlayerId,
    lastProtectedTargetId: game.night.protectedTargetId ?? game.lastProtectedTargetId,
    servantRestartRole: undefined,
    // Si el Pirómano quema un edificio, ese edificio se retira del juego y su dueño pasa a ser Vagabundo
    players: burnedTargetId && game.buildingsEnabled
      ? game.players.map((player) => player.id === burnedTargetId ? { ...player, buildingId: 'vagrant', buildingUsed: false } : player)
      : game.players,
  }
  const deaths: Array<{ playerId?: string; cause: DeathCause }> = []
  const victim = next.night.wolfTargetId
  const victimPlayer = next.players.find((player) => player.id === victim)
  const pyromaniacSavesVictim = Boolean(victim && burnedTargetId === victim)
  // La primera mordedura no infecta al Anciano: cuenta como un ataque normal que resiste
  const elderResistsInfection = victimPlayer?.roleId === 'elder' && next.elderWolfHits === 0

  if (pyromaniacSavesVictim && victim) {
    // El lobo más cercano a la derecha de la víctima muere carbonizado y el resto huye sin atacar
    deaths.push({ playerId: nearestAliveWolf(next, victim, -1), cause: 'fire' })
  } else if (next.night.littleGirlCaught) {
    deaths.push({ playerId: aliveWithRole(next, 'little_girl')[0]?.id, cause: 'little-girl' })
  } else if (victim && next.night.infectVictim && !elderResistsInfection) {
    if (!next.infectedIds.includes(victim)) next = { ...next, infectedIds: [...next.infectedIds, victim] }
  } else if (victim && !next.night.witchSaved) {
    const protectedByProtector = next.night.protectedTargetId === victim && victimPlayer?.roleId !== 'little_girl'
    if (!protectedByProtector) deaths.push({ playerId: victim, cause: 'wolves' })
  }

  if (!pyromaniacSavesVictim) {
    deaths.push({ playerId: next.night.fierceWolfTargetId, cause: 'fierce-wolf' })
    deaths.push({ playerId: next.night.albinoWolfTargetId, cause: 'albino-wolf' })
  }
  deaths.push({ playerId: next.night.witchPoisonTargetId, cause: 'witch' })
  if (next.rustyWolfDeathRound === next.round) {
    const knight = next.players.find((player) => player.roleId === 'rusty_knight')
    deaths.push({ playerId: knight ? nearestAliveWolf(next, knight.id, 1) : undefined, cause: 'rusty-sickness' })
    next = { ...next, rustyWolfDeathRound: undefined }
  }
  const resolved = applyDeaths(next, deaths, 'night-result')
  return { ...resolved, elderSurvivedAttack: resolved.elderWolfHits > game.elderWolfHits }
}

export function advanceRoleCall(game: GameState): GameState {
  if (game.openingDay && game.nightSequence[game.sequenceIndex] === 'angel') {
    return { ...game, phase: 'day-discussion', nightSequence: buildFirstNightSequence(game.deck, game.rules).filter((id) => id !== 'angel'), sequenceIndex: 0 }
  }
  const nextIndex = game.sequenceIndex + 1
  if (nextIndex >= game.nightSequence.length) return resolveNight(game)
  return { ...game, sequenceIndex: nextIndex }
}

function finishVote(game: GameState, playerId: string): GameState {
  const target = game.players.find((player) => player.id === playerId)
  const noblePlayer = game.buildingsEnabled ? game.players.find((player) => hasActiveBuilding(game, player, 'noble')) : undefined
  const noblePardons = Boolean(noblePlayer && game.noblePardonRequested && target && !isVagrant(game, target))
  const foolSurvives = !noblePardons && target?.roleId === 'village_fool' && !game.foolRevealed && !game.villagePowersDisabled
  const survivesVote = noblePardons || Boolean(foolSurvives)
  const post: PostDeathAction = game.judgeSecondVoteRequested && !survivesVote ? 'second-vote' : 'next-night'
  const next: GameState = {
    ...game,
    players: noblePardons && noblePlayer
      ? game.players.map((player) => player.id === noblePlayer.id ? { ...player, buildingUsed: true } : player)
      : game.players,
    pendingVoteTargetId: undefined,
    lastDeaths: [],
    pendingHunters: [],
    foolRevealed: game.foolRevealed || Boolean(foolSurvives),
    judgePowerAvailable: game.judgeSecondVoteRequested && !survivesVote ? false : game.judgePowerAvailable,
    judgeSecondVoteRequested: false,
    judgeSecondVoteActive: false,
    noblePardonRequested: false,
    scapegoatVoters: [],
    // El Tonto indultado que era Alguacil pierde el cargo para el resto de la partida
    ...(foolSurvives && playerId === game.sheriffId ? { sheriffId: undefined, sheriffLost: true } : {}),
  }
  if (survivesVote) return finishDeaths({ ...next, postDeathAction: post })
  return applyDeaths(next, [{ playerId, cause: 'vote' }], post)
}

export function revealCard(game: GameState, playerId: string, roleId?: RoleId): GameState {
  if (!roleId) return game
  return { ...game, players: game.players.map((player) => player.id === playerId && !player.roleId ? { ...player, roleId } : player) }
}

export function unrevealedCards(game: GameState): RoleId[] {
  const assigned = game.players.reduce<Partial<Record<RoleId, number>>>((counts, player) => {
    if (player.roleId) counts[player.roleId] = (counts[player.roleId] ?? 0) + 1
    return counts
  }, {})
  return [...new Set(game.deck)].filter((id) => game.deck.filter((card) => card === id).length > (assigned[id] ?? 0))
}

export function eliminateByVote(game: GameState, playerId?: string): GameState {
  if (!playerId) return prepareNextNight({ ...game, pendingVoteTargetId: undefined, lastDeaths: [] })
  // Si el Noble indulta al condenado, no es eliminado ni interviene la Sirvienta
  const target = game.players.find((player) => player.id === playerId)
  const noblePlayer = game.buildingsEnabled ? game.players.find((player) => hasActiveBuilding(game, player, 'noble')) : undefined
  if (noblePlayer && game.noblePardonRequested && target && !isVagrant(game, target)) {
    return finishVote(game, playerId)
  }
  const servant = aliveWithRole(game, 'devoted_servant')[0]
  // Una Sirvienta enamorada no puede usar su poder
  if (servant && servant.id !== playerId && !game.lovers.includes(servant.id)) return { ...game, phase: 'servant-action', pendingVoteTargetId: playerId }
  return finishVote(game, playerId)
}

export function resolveServantChoice(game: GameState, adoptsRole: boolean): GameState {
  const targetId = game.pendingVoteTargetId
  if (!targetId) return { ...game, phase: 'day-vote' }
  let next = game
  const servant = aliveWithRole(game, 'devoted_servant')[0]
  const targetRole = game.players.find((player) => player.id === targetId)?.roleId
  if (adoptsRole && servant && targetRole) {
    // Intercambian las cartas: el expulsado sale con la carta de Sirvienta y su personaje vuelve a empezar con los poderes restaurados
    next = {
      ...game,
      ...restoredPowers(targetRole),
      players: game.players.map((player) => player.id === servant.id ? { ...player, roleId: targetRole } : player.id === targetId ? { ...player, roleId: 'devoted_servant' } : player),
      charmedIds: game.charmedIds.filter((id) => id !== servant.id),
      servantRestartRole: targetRole,
      // La Sirvienta que era Alguacil pierde el cargo al cambiar de carta
      sheriffId: game.sheriffId === servant.id ? undefined : game.sheriffId,
    }
  }
  return finishVote(next, targetId)
}

function restoredPowers(roleId: RoleId): Partial<GameState> {
  if (roleId === 'witch') return { healPotionAvailable: true, poisonPotionAvailable: true }
  if (roleId === 'infect_father') return { infectionAvailable: true }
  if (roleId === 'pyromaniac') return { pyromaniacAvailable: true }
  if (roleId === 'fox') return { foxPowerAvailable: true }
  if (roleId === 'stuttering_judge') return { judgePowerAvailable: true }
  if (roleId === 'elder') return { elderWolfHits: 0 }
  if (roleId === 'village_fool') return { foolRevealed: false }
  if (roleId === 'wild_child') return { mentorId: undefined, wildChildTurned: false }
  if (roleId === 'protector') return { lastProtectedTargetId: undefined }
  return {}
}

export const canElectSheriff = (game: GameState) => Boolean(
  game.sheriffEnabled
  && !game.sheriffId
  && !game.sheriffLost
  && !game.sheriffSuccessionPending
  && (!game.buildingsEnabled || (game.round >= 2 && eligibleSheriffCandidates(game).length > 0))
)

export const electSheriff = (game: GameState, playerId: string): GameState => ({ ...game, sheriffId: playerId })

export function resolveSheriffSuccession(game: GameState, playerId: string): GameState {
  const next = { ...game, sheriffId: playerId, sheriffSuccessionPending: false }
  return next.postDeathAction ? finishDeaths(next) : { ...next, phase: 'night-result' }
}

export function resolveHunterShot(game: GameState, targetId: string): GameState {
  const [, ...remainingHunters] = game.pendingHunters
  return applyDeaths({ ...game, pendingHunters: remainingHunters }, [{ playerId: targetId, cause: 'hunter' }], game.postDeathAction ?? 'night-result')
}

export function beginScapegoatTie(game: GameState): GameState {
  if (game.villagePowersDisabled) return prepareNextNight(game)
  const scapegoat = aliveWithRole(game, 'scapegoat')[0]
  if (!scapegoat) return prepareNextNight(game)
  return { ...game, phase: 'scapegoat-action', pendingVoteTargetId: scapegoat.id }
}

export function resolveScapegoat(game: GameState, voterIds: string[]): GameState {
  return applyDeaths({ ...game, scapegoatVoters: voterIds, lastDeaths: [], pendingHunters: [] }, [{ playerId: game.pendingVoteTargetId, cause: 'scapegoat' }], 'next-night')
}

export function applyBarberCut(game: GameState, targetId: string): GameState {
  const barber = game.players.find((player) => hasActiveBuilding(game, player, 'barber'))
  const target = game.players.find((player) => player.id === targetId && player.alive)
  if (!barber || !target || isVagrant(game, target)) return game
  const targetIsWolf = isWolfAlignedPlayer(game, target)
  const updatedPlayers = game.players.map((player) => player.id === barber.id ? { ...player, buildingUsed: true } : player)
  const deaths: Array<{ playerId?: string; cause: DeathCause }> = targetIsWolf
    ? [{ playerId: target.id, cause: 'barber' }]
    : [{ playerId: target.id, cause: 'barber' }, { playerId: barber.id, cause: 'barber' }]
  return applyDeaths({ ...game, players: updatedPlayers, lastDeaths: [] }, deaths, 'stay-day')
}

export function applyConfessorPower(game: GameState): GameState {
  const confessor = game.players.find((player) => hasActiveBuilding(game, player, 'confessor'))
  if (!confessor) return game
  return {
    ...game,
    players: game.players.map((player) => player.id === confessor.id ? { ...player, buildingUsed: true } : player),
  }
}

export function applyApothecaryRestore(game: GameState, targetId: string): GameState {
  const apothecary = game.players.find((player) => hasActiveBuilding(game, player, 'apothecary'))
  if (!apothecary || apothecary.id === targetId) return game
  return {
    ...game,
    players: game.players.map((player) => {
      if (player.id === apothecary.id) return { ...player, buildingUsed: true }
      if (player.id === targetId) return { ...player, buildingUsed: false }
      return player
    }),
  }
}

export function applyMayorAssign(game: GameState, vagrantPlayerId: string, buildingId: BuildingId): GameState {
  const mayor = game.players.find((player) => hasActiveBuilding(game, player, 'mayor'))
  const vagrant = game.players.find((player) => player.id === vagrantPlayerId && player.alive && isVagrant(game, player))
  const vacant = game.vacantBuildings ?? []
  const index = vacant.indexOf(buildingId)
  if (!mayor || !vagrant || index < 0) return game
  const nextVacant = vacant.filter((_, i) => i !== index)
  return {
    ...game,
    vacantBuildings: nextVacant,
    players: game.players.map((player) => player.id === vagrantPlayerId ? { ...player, buildingId, buildingUsed: false } : player),
  }
}

export function bearGrowls(game: GameState) {
  const bear = aliveWithRole(game, 'bear_tamer')[0]
  if (!bear) return false
  if (game.infectedIds.includes(bear.id)) return true
  const alive = game.players.filter((player) => player.alive)
  const index = alive.findIndex((player) => player.id === bear.id)
  if (index < 0 || alive.length < 2) return false
  const neighbours = [alive[(index - 1 + alive.length) % alive.length], alive[(index + 1) % alive.length]]
  return neighbours.some((player) => isWolfAlignedPlayer(game, player))
}

export function foxTrio(game: GameState, centerId: string) {
  const alive = alivePlayers(game)
  const center = alive.findIndex((player) => player.id === centerId)
  if (center < 0) return []
  return [alive[(center - 1 + alive.length) % alive.length], alive[center], alive[(center + 1) % alive.length]]
}

export const phaseAfterNoVote = (game: GameState): GameState => prepareNextNight({ ...game, pendingVoteTargetId: undefined, lastDeaths: [] })
export const setPhase = (game: GameState, phase: GamePhase): GameState => ({ ...game, phase })
