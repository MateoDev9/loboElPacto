import { buildFirstNightSequence, buildNightSequence, isWolfRole, ROLES } from './roles'
import type { GameState, Player, RoleId } from './types'

export const createGame = (names: string[], deck: RoleId[]): GameState => {
  const readyPlayers: Player[] = names.map((name) => ({ id: crypto.randomUUID(), name, alive: true }))
  return {
    players: readyPlayers,
    deck,
    roleChoices: {},
    round: 1,
    phase: 'night-intro',
    night: { targets: {}, witchSaved: false },
    nightSequence: buildFirstNightSequence(deck),
    sequenceIndex: 0,
    healPotionAvailable: true,
    poisonPotionAvailable: true,
    lastDeaths: [],
  }
}

export const alivePlayers = (game: GameState) => game.players.filter((player) => player.alive)
export const aliveWithRole = (game: GameState, roleId: RoleId) => game.players.filter((player) => player.alive && player.roleId === roleId)
export const aliveWolves = (game: GameState) => game.players.filter((player) => player.alive && (isWolfRole(player.roleId) || (player.roleId === 'wolf_hound' && game.roleChoices?.wolf_hound === 'wolves')))

export function determineWinner(players: Player[], roleChoices: GameState['roleChoices'] = {}): GameState['winner'] {
  const wolves = players.filter((player) => player.alive && player.roleId && (ROLES[player.roleId].team === 'wolves' || (player.roleId === 'wolf_hound' && roleChoices.wolf_hound === 'wolves'))).length
  const village = players.filter((player) => player.alive && player.roleId && ROLES[player.roleId].team === 'village').length
  if (wolves === 0) return 'village'
  if (wolves >= village && village > 0) return 'wolves'
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

export function resolveNight(game: GameState): GameState {
  const deaths = new Set<string>()
  const protectedFromWolves = game.night.protectedTargetId === game.night.wolfTargetId
  if (game.night.wolfTargetId && !game.night.witchSaved && !protectedFromWolves) deaths.add(game.night.wolfTargetId)
  if (game.night.witchPoisonTargetId) deaths.add(game.night.witchPoisonTargetId)
  const players = game.players.map((player) => deaths.has(player.id) ? { ...player, alive: false } : player)
  const winner = determineWinner(players, game.roleChoices)
  return { ...game, players, lastDeaths: [...deaths], winner, phase: winner ? 'game-over' : 'night-result' }
}

export function advanceRoleCall(game: GameState): GameState {
  const nextIndex = game.sequenceIndex + 1
  if (nextIndex >= game.nightSequence.length) return resolveNight(game)
  return { ...game, sequenceIndex: nextIndex }
}

export function eliminateByVote(game: GameState, playerId?: string): GameState {
  const players = playerId
    ? game.players.map((player) => player.id === playerId ? { ...player, alive: false } : player)
    : game.players
  const winner = determineWinner(players, game.roleChoices)
  const round = game.round + 1
  return {
    ...game,
    players,
    lastDeaths: playerId ? [playerId] : [],
    winner,
    phase: winner ? 'game-over' : 'night-intro',
    round,
    night: { targets: {}, witchSaved: false },
    nightSequence: buildNightSequence(players, round),
    sequenceIndex: 0,
  }
}
