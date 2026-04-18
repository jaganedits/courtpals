'use client'

import { useReducer } from 'react'
import type { DaySession, SessionAction, SessionPlayer, SessionTeam, Fixture } from '@/types'

function uid(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`
}

function generateRoundRobin(teams: SessionTeam[]): Fixture[] {
  const fixtures: Fixture[] = []
  for (let i = 0; i < teams.length; i++) {
    for (let j = i + 1; j < teams.length; j++) {
      fixtures.push({
        id: uid(),
        teamAId: teams[i].id,
        teamBId: teams[j].id,
        status: 'pending',
        scoreA: 0,
        scoreB: 0,
        winnerId: null,
      })
    }
  }
  return fixtures
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function buildTeamsFromPlayers(players: SessionPlayer[]): SessionTeam[] {
  const shuffled = shuffle(players)
  const teamCount = Math.ceil(shuffled.length / 2)
  return Array.from({ length: teamCount }, (_, i) => ({
    id: uid(),
    name: `Team ${i + 1}`,
    players: shuffled.slice(i * 2, i * 2 + 2),
  }))
}

export const initialSession: DaySession = {
  id: 'session-initial',
  date: 0,
  winTarget: 21,
  players: [],
  teams: [],
  fixtures: [],
  phase: 'setup',
  activeFixtureId: null,
}

export function sessionReducer(state: DaySession, action: SessionAction): DaySession {
  switch (action.type) {
    case 'ADD_PLAYER':
      return { ...state, players: [...state.players, action.payload] }

    case 'REMOVE_PLAYER':
      return { ...state, players: state.players.filter(p => p.id !== action.payload) }

    case 'UPDATE_PLAYER':
      return {
        ...state,
        players: state.players.map(p => p.id === action.payload.id ? action.payload : p),
      }

    case 'SET_WIN_TARGET':
      return { ...state, winTarget: action.payload }

    case 'AUTO_SPLIT_TEAMS':
      return { ...state, teams: buildTeamsFromPlayers(state.players) }

    case 'ASSIGN_PLAYER_TO_TEAM': {
      const { playerId, teamId } = action.payload
      const player = state.players.find(p => p.id === playerId)
      if (!player) return state
      const teams = state.teams.map(t => ({
        ...t,
        players: t.players.filter(p => p.id !== playerId),
      })).map(t =>
        t.id === teamId ? { ...t, players: [...t.players, player] } : t
      )
      return { ...state, teams }
    }

    case 'START_SESSION':
      return {
        ...state,
        id: uid(),
        date: Date.now(),
        fixtures: generateRoundRobin(state.teams),
        phase: 'active',
      }

    case 'START_FIXTURE':
      return {
        ...state,
        activeFixtureId: action.payload,
        fixtures: state.fixtures.map(f =>
          f.id === action.payload ? { ...f, status: 'active' } : f
        ),
      }

    case 'FINISH_FIXTURE': {
      const { fixtureId, scoreA, scoreB, winnerId } = action.payload
      const fixtures = state.fixtures.map(f =>
        f.id === fixtureId
          ? { ...f, status: 'done' as const, scoreA, scoreB, winnerId }
          : f
      )
      const allDone = fixtures.every(f => f.status === 'done')
      return {
        ...state,
        fixtures,
        activeFixtureId: null,
        phase: allDone ? 'done' : 'active',
      }
    }

    case 'RESET_SESSION':
      return { ...initialSession, id: uid(), date: Date.now() }

    default:
      return state
  }
}

export function useSession() {
  const [state, dispatch] = useReducer(sessionReducer, initialSession)
  return { state, dispatch }
}
