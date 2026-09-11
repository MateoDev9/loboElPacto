import type { GameState } from './types'

const STORAGE_KEY = 'lobo-narrador-active-game-v5'
const PEOPLE_KEY = 'lobo-narrador-people-library-v4'

export function saveGame(game: GameState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(game))
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
  localStorage.removeItem(STORAGE_KEY)
}

export function loadPeople(): string[] {
  try {
    const value = localStorage.getItem(PEOPLE_KEY)
    return value ? JSON.parse(value) as string[] : []
  } catch {
    return []
  }
}

export function savePeople(people: string[]) {
  localStorage.setItem(PEOPLE_KEY, JSON.stringify(people))
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
  localStorage.setItem(LAST_GROUP_KEY, JSON.stringify(groups))
}
