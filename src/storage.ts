import { HOUSE_RULES } from './roles'
import type { GameRules, GameState } from './types'

const STORAGE_KEY = 'lobo-narrador-active-game-v5'
const HISTORY_KEY = 'lobo-narrador-game-history-v1'
const PEOPLE_KEY = 'lobo-narrador-people-library-v4'
const LAST_GROUP_KEY = 'lobo-narrador-last-group-v2'
const RULES_KEY = 'lobo-narrador-rules-v1'

// Si el navegador no deja guardar (modo privado, sin espacio), la app sigue funcionando sin guardar
function store(key: string, value: string) {
  try {
    localStorage.setItem(key, value)
  } catch {
    // Sin almacenamiento disponible
  }
}

export function saveGame(game: GameState) {
  store(STORAGE_KEY, JSON.stringify(game))
}

export function loadGame(): GameState | null {
  try {
    const value = localStorage.getItem(STORAGE_KEY)
    return value ? JSON.parse(value) as GameState : null
  } catch {
    return null
  }
}

export function saveHistory(history: GameState[]) {
  store(HISTORY_KEY, JSON.stringify(history.slice(-15)))
}

export function loadHistory(): GameState[] {
  try {
    const value = localStorage.getItem(HISTORY_KEY)
    const parsed: unknown = value ? JSON.parse(value) : null
    return Array.isArray(parsed) ? (parsed as GameState[]).slice(-15) : []
  } catch {
    return []
  }
}

export function clearGame() {
  try {
    localStorage.removeItem(STORAGE_KEY)
    localStorage.removeItem(HISTORY_KEY)
  } catch {
    // Sin almacenamiento disponible
  }
}

export function loadPeople(): string[] {
  try {
    const value = localStorage.getItem(PEOPLE_KEY)
    const saved: unknown = value ? JSON.parse(value) : null
    const names = Array.isArray(saved) ? [...new Set(saved.filter((name): name is string => typeof name === 'string'))] : []
    return names.sort((a, b) => a.localeCompare(b, 'es'))
  } catch {
    return []
  }
}

export function savePeople(people: string[]) {
  store(PEOPLE_KEY, JSON.stringify(people))
}

export function loadLastGroups(): string[][] {
  try {
    const value = localStorage.getItem(LAST_GROUP_KEY)
    if (!value) return []
    const parsed = JSON.parse(value)
    if (Array.isArray(parsed) && Array.isArray(parsed[0])) {
      return parsed as string[][]
    }
    if (Array.isArray(parsed) && typeof parsed[0] === 'string') {
      return [parsed as string[]]
    }
    return []
  } catch {
    return []
  }
}

export function saveLastGroups(groups: string[][]) {
  store(LAST_GROUP_KEY, JSON.stringify(groups))
}

export function loadRules(): GameRules {
  try {
    const value = localStorage.getItem(RULES_KEY)
    if (!value) return { ...HOUSE_RULES }
    const parsed = JSON.parse(value) as Partial<GameRules>
    return {
      sheriffTiebreakOnly: parsed.sheriffTiebreakOnly ?? HOUSE_RULES.sheriffTiebreakOnly,
      sistersEveryNight: parsed.sistersEveryNight ?? HOUSE_RULES.sistersEveryNight,
      seerFoxLastFirstNight: parsed.seerFoxLastFirstNight ?? HOUSE_RULES.seerFoxLastFirstNight,
      hunterAlwaysShoots: parsed.hunterAlwaysShoots ?? HOUSE_RULES.hunterAlwaysShoots,
    }
  } catch {
    return { ...HOUSE_RULES }
  }
}

export function saveRules(rules: GameRules) {
  store(RULES_KEY, JSON.stringify(rules))
}
