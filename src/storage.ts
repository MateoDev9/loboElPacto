import type { GameState } from './types'

const STORAGE_KEY = 'lobo-narrador-active-game-v5'
const PEOPLE_KEY = 'lobo-narrador-people-library-v4'
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

export function clearGame() {
  try {
    localStorage.removeItem(STORAGE_KEY)
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

const LAST_GROUP_KEY = 'lobo-narrador-last-group-v2'

export function loadLastGroups(): string[][] {
  try {
    const value = localStorage.getItem(LAST_GROUP_KEY)
    if (!value) return []
    const parsed = JSON.parse(value)
    if (Array.isArray(parsed) && Array.isArray(parsed[0])) {
      return parsed as string[][]
    }
    // Migrate v1 to v2 if it's just one group
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
