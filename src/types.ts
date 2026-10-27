export type RoleId =
  | 'werewolf' | 'fierce_wolf' | 'infect_father' | 'albino_wolf'
  | 'villager' | 'pure_villager' | 'seer' | 'cupid' | 'witch' | 'hunter'
  | 'little_girl' | 'protector' | 'elder' | 'scapegoat' | 'village_fool'
  | 'two_sisters' | 'three_brothers' | 'fox' | 'bear_tamer' | 'stuttering_judge'
  | 'rusty_knight' | 'thief' | 'devoted_servant' | 'actor' | 'wild_child'
  | 'wolf_hound' | 'flutist' | 'sectarian' | 'angel' | 'pyromaniac' | 'raven'

export type RoleCategory = 'wolves' | 'village' | 'ambiguous' | 'solitary' | 'village-expansion'
export type Team = 'village' | 'wolves' | 'neutral' | 'variable'
export type CallKind =
  | 'confirm' | 'one-target' | 'optional-one-target' | 'two-targets'
  | 'three-neighbours' | 'wolves' | 'witch' | 'actor' | 'thief' | 'sectarian'

export interface RoleDefinition {
  id: RoleId
  name: string
  shortName: string
  description: string
  narratorPrompt: string
  spokenPrompt?: string
  team: Team
  category: RoleCategory
  icon: string
  color: string
  maxCards: number
  firstNightOrder?: number
  nightOrder?: number
  everyOtherNight?: boolean
  callKind?: CallKind
  passive?: boolean
}

export interface GameRules {
  /** El Alguacil solo desempata en caso de empate (regla de la casa) en vez de tener voto doble siempre */
  sheriffTiebreakOnly: boolean
  /** Las Dos Hermanas despiertan todas las noches antes de los lobos en vez de solo la primera noche */
  sistersEveryNight: boolean
  /** La Vidente y el Zorro despiertan los últimos la primera noche, después del Infecto Padre */
  seerFoxLastFirstNight: boolean
  /** El Cazador dispara siempre que muere, incluso por mal de amores o empate del Cabeza de Turco */
  hunterAlwaysShoots: boolean
}

export interface Player { id: string; name: string; roleId?: RoleId; alive: boolean }
export type SetupStep = 'players' | 'roles'
export type GamePhase =
  | 'night-intro' | 'role-call' | 'night-result' | 'day-discussion' | 'day-vote'
  | 'hunter-action' | 'sheriff-action' | 'servant-action' | 'scapegoat-action' | 'game-over'
export type Winner = 'village' | 'wolves' | 'angel' | 'flutist' | 'albino_wolf' | 'sectarian' | 'lovers' | 'nobody'
export type DeathCause = 'wolves' | 'fierce-wolf' | 'albino-wolf' | 'witch' | 'vote' | 'scapegoat' | 'hunter' | 'love' | 'rusty-sickness' | 'little-girl' | 'fire'
export type PostDeathAction = 'night-result' | 'next-night' | 'second-vote'

export interface NightActions {
  targets: Partial<Record<RoleId, string[]>>
  skippedRoles: RoleId[]
  wolfTargetId?: string
  fierceWolfTargetId?: string
  albinoWolfTargetId?: string
  infectVictim: boolean
  littleGirlCaught: boolean
  witchSaved: boolean
  witchPoisonTargetId?: string
  protectedTargetId?: string
  ravenTargetId?: string
  pyromaniacTargetId?: string
  actorRoleId?: RoleId
}

export interface GameState {
  players: Player[]
  deck: RoleId[]
  rules?: GameRules
  roleChoices: Partial<Record<RoleId, string>>
  round: number
  openingDay: boolean
  phase: GamePhase
  night: NightActions
  nightSequence: RoleId[]
  sequenceIndex: number
  healPotionAvailable: boolean
  poisonPotionAvailable: boolean
  infectionAvailable: boolean
  pyromaniacAvailable: boolean
  foxPowerAvailable: boolean
  judgePowerAvailable: boolean
  judgeSecondVoteRequested: boolean
  judgeSecondVoteActive: boolean
  elderWolfHits: number
  elderSurvivedAttack?: boolean
  villagePowersDisabled: boolean
  foolRevealed: boolean
  lastProtectedTargetId?: boolean | string
  lovers: string[]
  charmedIds: string[]
  infectedIds: string[]
  mentorId?: string
  wildChildTurned: boolean
  actorCards?: RoleId[]
  actorUsedRoles: RoleId[]
  thiefLeftovers?: RoleId[]
  servantRestartRole?: RoleId
  sectarianGroups: Record<string, 'A' | 'B'>
  ravenVoteTargetId?: string
  burnedPlayerId?: string
  rustyWolfDeathRound?: number
  wolfDeathsOccurred: boolean
  pendingHunters: string[]
  sheriffEnabled?: boolean
  sheriffId?: string
  sheriffLost?: boolean
  sheriffSuccessionPending?: boolean
  postDeathAction?: PostDeathAction
  pendingVoteTargetId?: string
  scapegoatVoters: string[]
  lastDeaths: string[]
  winner?: Winner
}
