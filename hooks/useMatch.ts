'use client'

import { useEffect, useReducer } from 'react'
import type { MatchState, MatchAction } from '@/types'

const STORAGE_KEY = 'courtpals_match'

export const initialMatchState: MatchState = {
  fixtureId: null,
  teamNames: ['Team A', 'Team B'],
  teamEmojis: ['🏸', '🏸'],
  winTarget: 21,
  scores: [0, 0],
  events: [],
  startTime: null,
  endTime: null,
  winner: null,
  phase: 'idle',
}

export function matchReducer(state: MatchState, action: MatchAction): MatchState {
  switch (action.type) {
    case 'START_MATCH':
      return {
        ...initialMatchState,
        ...action.payload,
        startTime: Date.now(),
        phase: 'playing',
      }

    case 'ADD_POINT': {
      if (state.phase !== 'playing') return state
      const team = action.payload
      const newScores: [number, number] = [
        team === 0 ? state.scores[0] + 1 : state.scores[0],
        team === 1 ? state.scores[1] + 1 : state.scores[1],
      ]
      const won = newScores[team] >= state.winTarget
      return {
        ...state,
        scores: newScores,
        events: [
          ...state.events,
          { id: `${Date.now()}-${Math.random()}`, timestamp: Date.now(), team, scoreAfter: newScores },
        ],
        winner: won ? team : null,
        phase: won ? 'finished' : 'playing',
        endTime: won ? Date.now() : null,
      }
    }

    case 'UNDO': {
      if (state.events.length === 0) return state
      const events = state.events.slice(0, -1)
      const prevScore: [number, number] =
        events.length > 0 ? events[events.length - 1].scoreAfter : [0, 0]
      return { ...state, scores: prevScore, events, winner: null, phase: 'playing', endTime: null }
    }

    case 'RESET':
      return initialMatchState

    case 'HYDRATE':
      return action.payload

    default:
      return state
  }
}

function loadPersisted(): MatchState | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as MatchState) : null
  } catch {
    return null
  }
}

export function useMatch() {
  const [state, dispatch] = useReducer(matchReducer, initialMatchState)

  // Hydrate persisted match on mount so an in-progress scoreboard survives
  // refresh / tab close.
  useEffect(() => {
    const persisted = loadPersisted()
    if (persisted && persisted.phase !== 'idle' && persisted.fixtureId) {
      dispatch({ type: 'HYDRATE', payload: persisted })
    }
  }, [])

  // Mirror to localStorage on every change. Idle state clears the key.
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (state.phase === 'idle') {
      localStorage.removeItem(STORAGE_KEY)
      return
    }
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    } catch {
      // non-fatal
    }
  }, [state])

  return { state, dispatch }
}
