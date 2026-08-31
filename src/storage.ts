import type { GameState } from './types'

const STORAGE_KEY = 'lobo-narrador-active-game-v4'
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
