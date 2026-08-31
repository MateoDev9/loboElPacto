export type RoleId =
  | 'werewolf' | 'fierce_wolf' | 'infect_father' | 'albino_wolf'
  | 'villager' | 'pure_villager' | 'seer' | 'cupid' | 'witch' | 'hunter'
  | 'little_girl' | 'protector' | 'elder' | 'scapegoat' | 'village_fool'
  | 'two_sisters' | 'three_brothers' | 'fox' | 'bear_tamer' | 'stuttering_judge'
  | 'rusty_knight' | 'thief' | 'devoted_servant' | 'actor' | 'wild_child'
  | 'wolf_hound' | 'flutist' | 'sectarian' | 'angel' | 'pyromaniac' | 'raven'

export type RoleCategory = 'wolves' | 'village' | 'ambiguous' | 'solitary' | 'village-expansion'
export type Team = 'village' | 'wolves' | 'neutral' | 'variable'
export type CallKind = 'confirm' | 'one-target' | 'two-targets' | 'three-neighbours' | 'wolves' | 'witch' | 'narrator-note'

export interface RoleDefinition {
  id: RoleId
  name: string
  shortName: string
  description: string
  narratorPrompt: string
  team: Team
  category: RoleCategory
  icon: string
  color: string
  maxCards: number
  firstNightOrder?: number
  nightOrder?: number
  everyOtherNight?: boolean
  callKind?: CallKind
  narratorOnly?: boolean
}

export interface Player { id: string; name: string; roleId?: RoleId; alive: boolean }
export type SetupStep = 'players' | 'roles'
export type GamePhase = 'night-intro' | 'role-call' | 'night-result' | 'day-discussion' | 'day-vote' | 'game-over'

export interface NightActions {
  targets: Partial<Record<RoleId, string[]>>
  wolfTargetId?: string
  witchSaved: boolean
  witchPoisonTargetId?: string
  protectedTargetId?: string
}

export interface GameState {
  players: Player[]
  deck: RoleId[]
  roleChoices: Partial<Record<RoleId, string>>
  round: number
  phase: GamePhase
  night: NightActions
  nightSequence: RoleId[]
  sequenceIndex: number
  healPotionAvailable: boolean
  poisonPotionAvailable: boolean
  lastDeaths: string[]
  winner?: 'village' | 'wolves'
}
