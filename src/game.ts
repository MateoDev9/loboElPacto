import { buildFirstNightSequence, buildNightSequence, isVillagePower, isWolfRole, ROLES } from './roles'
import type { DeathCause, GamePhase, GameState, Player, PostDeathAction, RoleId } from './types'

const emptyNight = (): GameState['night'] => ({
  targets: {}, skippedRoles: [], infectVictim: false, littleGirlCaught: false, witchSaved: false,
})

export const createGame = (names: string[], deck: RoleId[]): GameState => {
  const players: Player[] = names.map((name) => ({ id: crypto.randomUUID(), name, alive: true }))
  const openingDay = deck.includes('angel')
  return {
    players, deck, roleChoices: {}, round: 1, openingDay,
    phase: 'night-intro',
    night: emptyNight(), nightSequence: openingDay ? ['angel'] : buildFirstNightSequence(deck), sequenceIndex: 0,
    healPotionAvailable: true, poisonPotionAvailable: true, infectionAvailable: true,
    pyromaniacAvailable: true, foxPowerAvailable: true, judgePowerAvailable: true,
    judgeSecondVoteRequested: false, elderWolfHits: 0, villagePowersDisabled: false,
    foolRevealed: false, lovers: [], charmedIds: [], infectedIds: [], wildChildTurned: false,
    actorUsedRoles: [], sectarianGroups: {}, wolfDeathsOccurred: false, pendingHunters: [],
    scapegoatVoters: [], lastDeaths: [],
  }
}

export const alivePlayers = (game: GameState) => game.players.filter((player) => player.alive)
export const aliveWithRole = (game: GameState, roleId: RoleId) => game.players.filter((player) => player.alive && player.roleId === roleId)

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
  const flutist = alive.find((player) => player.roleId === 'flutist')
  if (flutist && alive.every((player) => player.id === flutist.id || game.charmedIds.includes(player.id))) return 'flutist'
  const albino = alive.find((player) => player.roleId === 'albino_wolf')
  if (albino && alive.length === 1) return 'albino_wolf'
  const sectarian = alive.find((player) => player.roleId === 'sectarian')
  if (sectarian && Object.keys(game.sectarianGroups).length === game.players.length) {
    const ownGroup = game.sectarianGroups[sectarian.id]
    if (ownGroup && alive.every((player) => game.sectarianGroups[player.id] === ownGroup)) return 'sectarian'
  }
  if (game.lovers.length === 2 && alive.length === 2 && game.lovers.every((id) => alive.some((player) => player.id === id))) return 'lovers'
  const wolves = aliveWolves(game).length
  const others = alive.length - wolves
  if (wolves === 0) return 'village'
  if (wolves >= others && others > 0) return 'wolves'
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

export function applyThiefChoice(game: GameState, adoptedRole: RoleId): GameState {
  const players = game.players.map((player) => player.roleId === 'thief' ? { ...player, roleId: adoptedRole } : player)
  if (adoptedRole === 'thief' || adoptedRole === 'villager') return { ...game, players }
  const completed = game.nightSequence.slice(0, game.sequenceIndex + 1)
  const desired = buildFirstNightSequence([...game.deck, adoptedRole])
  const remaining = desired.filter((roleId) => !completed.includes(roleId))
  return { ...game, players, nightSequence: [...completed, ...remaining] }
}

const filteredNightSequence = (game: GameState, round: number) => {
  let sequence = buildNightSequence(game.players, round)
  if (aliveWolves(game).length && !sequence.includes('werewolf')) sequence.push('werewolf')
  if (!game.foxPowerAvailable) sequence = sequence.filter((id) => id !== 'fox')
  if (!game.infectionAvailable) sequence = sequence.filter((id) => id !== 'infect_father')
  if (!game.pyromaniacAvailable) sequence = sequence.filter((id) => id !== 'pyromaniac')
  if (game.wolfDeathsOccurred) sequence = sequence.filter((id) => id !== 'fierce_wolf')
  if (game.villagePowersDisabled) sequence = sequence.filter((id) => !isVillagePower(id))
  return sequence.sort((a, b) => (ROLES[a].nightOrder ?? 999) - (ROLES[b].nightOrder ?? 999))
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
    nightSequence: firstNightAfterOpeningDay ? game.nightSequence : filteredNightSequence(game, round),
    sequenceIndex: 0,
    judgeSecondVoteRequested: false,
    pendingVoteTargetId: undefined,
    pendingHunters: [],
    postDeathAction: undefined,
    lastDeaths: [],
    ravenVoteTargetId: undefined,
    burnedPlayerId: undefined,
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
  if (game.pendingHunters.length) return { ...game, phase: 'hunter-action' }
  const winner = determineWinner(game)
  if (winner) return { ...game, winner, phase: 'game-over', postDeathAction: undefined }
  if (game.postDeathAction === 'night-result') return { ...game, phase: 'night-result', postDeathAction: undefined }
  if (game.postDeathAction === 'second-vote') return { ...game, phase: 'day-vote', postDeathAction: undefined, pendingVoteTargetId: undefined, judgeSecondVoteRequested: false }
  return prepareNextNight({ ...game, postDeathAction: undefined })
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
    if (player.roleId === 'elder' && wolfAttack && next.elderWolfHits === 0) {
      next = { ...next, elderWolfHits: 1 }
      continue
    }

    const wasWolf = isWolfAlignedPlayer(next, player)
    next = {
      ...next,
      players: next.players.map((candidate) => candidate.id === player.id ? { ...candidate, alive: false } : candidate),
      lastDeaths: next.lastDeaths.includes(player.id) ? next.lastDeaths : [...next.lastDeaths, player.id],
      wolfDeathsOccurred: next.wolfDeathsOccurred || wasWolf,
      villagePowersDisabled: next.villagePowersDisabled || (player.roleId === 'elder' && !wolfAttack),
    }

    if (player.roleId === 'hunter' && !next.villagePowersDisabled && !next.pendingHunters.includes(player.id)) next.pendingHunters = [...next.pendingHunters, player.id]
    if (player.id === next.mentorId) next = { ...next, wildChildTurned: true }
    if (player.roleId === 'rusty_knight' && wolfAttack) next = { ...next, rustyWolfDeathRound: next.round + 1 }
    if (next.lovers.includes(player.id)) {
      const partnerId = next.lovers.find((id) => id !== player.id)
      if (partnerId) queue.push({ playerId: partnerId, cause: 'love' })
    }
    if (player.roleId === 'angel' && ((next.openingDay && death.cause === 'vote') || (next.round === 1 && wolfAttack))) {
      next = { ...next, winner: 'angel' }
    }
  }
  return finishDeaths(next)
}

export function resolveNight(game: GameState): GameState {
  let next: GameState = {
    ...game,
    lastDeaths: [],
    pendingHunters: [],
    ravenVoteTargetId: game.night.ravenTargetId,
    burnedPlayerId: game.night.pyromaniacTargetId ?? game.burnedPlayerId,
    lastProtectedTargetId: game.night.protectedTargetId ?? game.lastProtectedTargetId,
  }
  const deaths: Array<{ playerId?: string; cause: DeathCause }> = []
  const victim = next.night.wolfTargetId
  const pyromaniacSavesVictim = Boolean(victim && next.night.pyromaniacTargetId === victim)

  if (pyromaniacSavesVictim && victim) {
    deaths.push({ playerId: nearestAliveWolf(next, victim, 1), cause: 'wolves' })
  } else if (next.night.littleGirlCaught) {
    deaths.push({ playerId: aliveWithRole(next, 'little_girl')[0]?.id, cause: 'little-girl' })
  } else if (victim && next.night.infectVictim) {
    if (!next.infectedIds.includes(victim)) next = { ...next, infectedIds: [...next.infectedIds, victim] }
  } else if (victim && !next.night.witchSaved) {
    const target = next.players.find((player) => player.id === victim)
    const protectedByProtector = next.night.protectedTargetId === victim && target?.roleId !== 'little_girl'
    if (!protectedByProtector) deaths.push({ playerId: victim, cause: 'wolves' })
  }

  deaths.push({ playerId: next.night.fierceWolfTargetId, cause: 'fierce-wolf' })
  deaths.push({ playerId: next.night.albinoWolfTargetId, cause: 'albino-wolf' })
  deaths.push({ playerId: next.night.witchPoisonTargetId, cause: 'witch' })
  if (next.rustyWolfDeathRound === next.round) {
    const knight = next.players.find((player) => player.roleId === 'rusty_knight')
    deaths.push({ playerId: knight ? nearestAliveWolf(next, knight.id, -1) : undefined, cause: 'rusty-sickness' })
    next = { ...next, rustyWolfDeathRound: undefined }
  }
  return applyDeaths(next, deaths, 'night-result')
}

export function advanceRoleCall(game: GameState): GameState {
  if (game.openingDay && game.nightSequence[game.sequenceIndex] === 'angel') {
    return { ...game, phase: 'day-discussion', nightSequence: buildFirstNightSequence(game.deck).filter((id) => id !== 'angel'), sequenceIndex: 0 }
  }
  const nextIndex = game.sequenceIndex + 1
  if (nextIndex >= game.nightSequence.length) return resolveNight(game)
  return { ...game, sequenceIndex: nextIndex }
}

function finishVote(game: GameState, playerId: string): GameState {
  const target = game.players.find((player) => player.id === playerId)
  const foolSurvives = target?.roleId === 'village_fool' && !game.foolRevealed
  const post: PostDeathAction = game.judgeSecondVoteRequested && !foolSurvives ? 'second-vote' : 'next-night'
  const next = {
    ...game,
    pendingVoteTargetId: undefined,
    lastDeaths: [],
    pendingHunters: [],
    foolRevealed: game.foolRevealed || Boolean(foolSurvives),
    judgePowerAvailable: game.judgeSecondVoteRequested ? false : game.judgePowerAvailable,
    judgeSecondVoteRequested: false,
    scapegoatVoters: [],
  }
  if (foolSurvives) return finishDeaths({ ...next, postDeathAction: 'next-night' })
  return applyDeaths(next, [{ playerId, cause: 'vote' }], post)
}

export function eliminateByVote(game: GameState, playerId?: string): GameState {
  if (!playerId) return prepareNextNight({ ...game, pendingVoteTargetId: undefined, lastDeaths: [] })
  const servant = aliveWithRole(game, 'devoted_servant')[0]
  if (servant && servant.id !== playerId) return { ...game, phase: 'servant-action', pendingVoteTargetId: playerId }
  return finishVote(game, playerId)
}

export function resolveServantChoice(game: GameState, adoptsRole: boolean): GameState {
  const targetId = game.pendingVoteTargetId
  if (!targetId) return { ...game, phase: 'day-vote' }
  let next = game
  if (adoptsRole) {
    const targetRole = game.players.find((player) => player.id === targetId)?.roleId
    if (targetRole) next = { ...game, players: game.players.map((player) => player.roleId === 'devoted_servant' ? { ...player, roleId: targetRole } : player) }
  }
  return finishVote(next, targetId)
}

export function resolveHunterShot(game: GameState, targetId: string): GameState {
  const [, ...remainingHunters] = game.pendingHunters
  return applyDeaths({ ...game, pendingHunters: remainingHunters }, [{ playerId: targetId, cause: 'hunter' }], game.postDeathAction ?? 'night-result')
}

export function beginScapegoatTie(game: GameState): GameState {
  const scapegoat = aliveWithRole(game, 'scapegoat')[0]
  if (!scapegoat) return prepareNextNight(game)
  return { ...game, phase: 'scapegoat-action', pendingVoteTargetId: scapegoat.id }
}

export function resolveScapegoat(game: GameState, voterIds: string[]): GameState {
  return applyDeaths({ ...game, scapegoatVoters: voterIds, lastDeaths: [], pendingHunters: [] }, [{ playerId: game.pendingVoteTargetId, cause: 'vote' }], 'next-night')
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
