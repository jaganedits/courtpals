'use client'

import { useReducer } from 'react'
import type { MatchState, MatchAction } from '@/types'

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

    default:
      return state
  }
}

export function useMatch() {
  const [state, dispatch] = useReducer(matchReducer, initialMatchState)
  return { state, dispatch }
}
