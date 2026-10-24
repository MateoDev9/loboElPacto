import { describe, expect, it } from 'vitest'
import {
  advanceRoleCall, applyActorChoice, applyThiefChoice, assignRoleOwners, createGame, determineWinner, eliminateByVote,
  prepareNextNight, resolveHunterShot, resolveNight, resolveServantChoice, revealCard, unrevealedCards,
} from './game'
import type { GameState, RoleId } from './types'

// Partida con las cartas ya ubicadas: el jugador i tiene roles[i]
const dealt = (roles: RoleId[]): GameState => {
  const game = createGame(roles.map((_, index) => `P${index}`), roles)
  return { ...game, players: game.players.map((player, index) => ({ ...player, roleId: roles[index] })), phase: 'role-call' }
}
const id = (game: GameState, index: number) => game.players[index].id
const alive = (game: GameState, index: number) => game.players[index].alive
const withNight = (game: GameState, night: Partial<GameState['night']>) => ({ ...game, night: { ...game.night, ...night } })
const kill = (game: GameState, indexes: number[]) => ({ ...game, players: game.players.map((player, index) => indexes.includes(index) ? { ...player, alive: false } : player) })

describe('ganadores', () => {
  it('ganan los lobos si solo quedan lobos', () => {
    expect(determineWinner(kill(dealt(['werewolf', 'werewolf', 'villager']), [2]))).toBe('wolves')
  })
  it('sigue la partida si el Albino convive solo con lobos', () => {
    expect(determineWinner(kill(dealt(['werewolf', 'albino_wolf', 'villager']), [2]))).toBeUndefined()
  })
  it('no gana nadie si no queda nadie vivo', () => {
    expect(determineWinner(kill(dealt(['werewolf', 'villager']), [0, 1]))).toBe('nobody')
  })
  it('un Flautista infectado no gana por hechizo', () => {
    const game = dealt(['werewolf', 'flutist', 'villager', 'villager'])
    expect(determineWinner({ ...game, infectedIds: [id(game, 1)], charmedIds: [id(game, 0), id(game, 2), id(game, 3)] })).not.toBe('flutist')
  })
  it('un Sectario infectado no gana solo', () => {
    const game = dealt(['werewolf', 'sectarian', 'villager', 'villager'])
    const groups = { [id(game, 0)]: 'A', [id(game, 1)]: 'A', [id(game, 2)]: 'B', [id(game, 3)]: 'B' } as const
    expect(determineWinner(kill({ ...game, infectedIds: [id(game, 1)], sectarianGroups: groups }, [2, 3]))).toBe('wolves')
  })
})

describe('noche', () => {
  it('el Anciano no se infecta en la primera mordedura', () => {
    const game = dealt(['werewolf', 'infect_father', 'elder', 'villager', 'villager', 'villager'])
    const result = resolveNight(withNight(game, { wolfTargetId: id(game, 2), infectVictim: true }))
    expect(alive(result, 2)).toBe(true)
    expect(result.infectedIds).not.toContain(id(game, 2))
    expect(result.elderSurvivedAttack).toBe(true)
  })
  it('el Anciano sí se infecta en la segunda mordedura', () => {
    const game = dealt(['werewolf', 'infect_father', 'elder', 'villager', 'villager', 'villager'])
    expect(resolveNight(withNight({ ...game, elderWolfHits: 1 }, { wolfTargetId: id(game, 2), infectVictim: true })).infectedIds).toContain(id(game, 2))
  })
  it('el Pirómano salva a la víctima, mata al lobo de su derecha y anula el resto de ataques', () => {
    const game = dealt(['villager', 'werewolf', 'villager', 'werewolf', 'fierce_wolf', 'pyromaniac'])
    const result = resolveNight(withNight(game, { wolfTargetId: id(game, 2), pyromaniacTargetId: id(game, 2), fierceWolfTargetId: id(game, 0) }))
    expect([0, 1, 2, 3].map((index) => alive(result, index))).toEqual([true, false, true, true])
  })
  it('la espada oxidada mata al lobo de la izquierda del Caballero la noche siguiente', () => {
    const game = kill({ ...dealt(['villager', 'werewolf', 'rusty_knight', 'werewolf', 'villager', 'villager']), rustyWolfDeathRound: 1 }, [2])
    const result = resolveNight(game)
    expect(alive(result, 3)).toBe(false)
    expect(alive(result, 1)).toBe(true)
  })
  it('el Cazador muerto de noche dispara antes de decidir el ganador', () => {
    const game = kill(dealt(['werewolf', 'hunter', 'villager', 'seer', 'witch']), [3, 4])
    const night = resolveNight(withNight(game, { wolfTargetId: id(game, 1) }))
    expect(night.phase).toBe('night-result')
    expect(night.winner).toBeUndefined()
    expect(resolveHunterShot({ ...night, phase: 'hunter-action' }, id(game, 0)).winner).toBe('village')
  })
  it('una Hermana sola ya no se llama de noche', () => {
    const game = kill(dealt(['werewolf', 'two_sisters', 'two_sisters', 'villager', 'villager']), [1])
    expect(prepareNextNight({ ...game, phase: 'day-vote' }).nightSequence).not.toContain('two_sisters')
  })
  it('un Flautista infectado no se llama de noche', () => {
    const game = dealt(['werewolf', 'flutist', 'villager', 'villager'])
    expect(prepareNextNight({ ...game, infectedIds: [id(game, 1)], phase: 'day-vote' }).nightSequence).not.toContain('flutist')
  })
})

describe('votaciones', () => {
  it('el Lobo Feroz pierde su ataque si muere el Perro Lobo aunque sea aldeano', () => {
    const game = dealt(['werewolf', 'fierce_wolf', 'wolf_hound', 'villager', 'villager', 'villager'])
    const result = eliminateByVote({ ...game, phase: 'day-vote', roleChoices: { wolf_hound: 'village' } }, id(game, 2))
    expect(result.nightSequence).not.toContain('fierce_wolf')
  })
  it('si el Tonto es indultado el Juez conserva su poder', () => {
    const game = dealt(['werewolf', 'village_fool', 'stuttering_judge', 'villager', 'villager', 'villager'])
    const result = eliminateByVote({ ...game, phase: 'day-vote', judgeSecondVoteRequested: true }, id(game, 1))
    expect(result.judgePowerAvailable).toBe(true)
    expect(result.foolRevealed).toBe(true)
  })
})

describe('Abnegada Sirvienta', () => {
  const adopt = (roles: RoleId[], patch: Partial<GameState> = {}) => {
    const game = dealt(roles)
    return resolveServantChoice(eliminateByVote({ ...game, ...patch, phase: 'day-vote' }, id(game, 1)), true)
  }
  it('intercambia las cartas: adoptar al Anciano no quita los poderes', () => {
    const result = adopt(['werewolf', 'elder', 'devoted_servant', 'villager', 'villager', 'villager'])
    expect(result.villagePowersDisabled).toBe(false)
    expect(result.players[2].roleId).toBe('elder')
    expect(result.players[1].roleId).toBe('devoted_servant')
  })
  it('el Cazador expulsado no dispara si la Sirvienta toma su carta', () => {
    expect(adopt(['werewolf', 'hunter', 'devoted_servant', 'villager', 'villager', 'villager']).phase).not.toBe('hunter-action')
  })
  it('la nueva Bruja recupera las pociones', () => {
    const result = adopt(['werewolf', 'witch', 'devoted_servant', 'villager', 'villager', 'villager'], { healPotionAvailable: false, poisonPotionAvailable: false })
    expect(result.healPotionAvailable && result.poisonPotionAvailable).toBe(true)
  })
  it('el nuevo Niño Salvaje elige modelo la noche siguiente', () => {
    const result = adopt(['werewolf', 'wild_child', 'devoted_servant', 'villager', 'villager', 'villager'])
    expect(result.nightSequence).toContain('wild_child')
    expect(result.mentorId).toBeUndefined()
  })
  it('una Sirvienta enamorada no puede intervenir', () => {
    const game = dealt(['werewolf', 'seer', 'devoted_servant', 'villager', 'villager', 'villager'])
    expect(eliminateByVote({ ...game, phase: 'day-vote', lovers: [id(game, 2), id(game, 3)] }, id(game, 1)).phase).not.toBe('servant-action')
  })
})

describe('Ladrón y Comediante', () => {
  const withThief = () => {
    let game = createGame(['A', 'B', 'C', 'D', 'E'], ['thief', 'werewolf', 'seer', 'villager', 'villager', 'villager', 'witch'])
    game = assignRoleOwners({ ...game, phase: 'role-call' }, 'thief', [game.players[0].id])
    return { ...game, sequenceIndex: game.nightSequence.indexOf('thief'), thiefLeftovers: ['seer', 'villager'] as RoleId[] }
  }
  it('si el Ladrón cambia, su carta sale del juego', () => {
    const result = applyThiefChoice(withThief(), 'seer')
    expect(result.deck).toHaveLength(5)
    expect(result.deck).not.toContain('thief')
    expect(result.players[0].roleId).toBe('seer')
  })
  it('si el Ladrón se queda, no se llama a las cartas sobrantes', () => {
    const result = applyThiefChoice(withThief(), 'thief')
    expect(result.deck).toHaveLength(5)
    expect(result.nightSequence).not.toContain('seer')
  })
  it('el Comediante actúa en el turno del personaje elegido', () => {
    const game = dealt(['actor', 'werewolf', 'villager', 'villager', 'villager'])
    const result = applyActorChoice({ ...game, round: 2, nightSequence: ['actor', 'werewolf'], sequenceIndex: 0, night: { ...game.night, actorRoleId: 'witch' } })
    expect(result.nightSequence).toEqual(['actor', 'werewolf', 'witch'])
    expect(result.actorUsedRoles).toContain('witch')
  })
})

describe('día previo del Ángel', () => {
  const openingDay = () => {
    const game = createGame(['A', 'B', 'C', 'D', 'E', 'F'], ['angel', 'werewolf', 'seer', 'hunter', 'villager', 'villager'])
    return advanceRoleCall(assignRoleOwners({ ...game, phase: 'role-call' }, 'angel', [game.players[0].id]))
  }
  it('ofrece las cartas que faltan por ubicar', () => {
    expect(unrevealedCards(openingDay())).toEqual(['werewolf', 'seer', 'hunter', 'villager'])
  })
  it('expulsar a alguien no termina la partida y la primera noche no llama a su personaje', () => {
    const game = openingDay()
    const result = eliminateByVote(revealCard(game, game.players[2].id, 'seer'), game.players[2].id)
    expect(result.phase).toBe('night-intro')
    expect(result.winner).toBeUndefined()
    expect(result.nightSequence).not.toContain('seer')
  })
  it('el Cazador expulsado ese día dispara', () => {
    const game = openingDay()
    expect(eliminateByVote(revealCard(game, game.players[3].id, 'hunter'), game.players[3].id).phase).toBe('hunter-action')
  })
  it('el Ángel expulsado ese día gana', () => {
    const game = openingDay()
    expect(eliminateByVote(game, game.players[0].id).winner).toBe('angel')
  })
})
