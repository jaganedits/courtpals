'use client'

import { useReducer } from 'react'
import type { DaySession, SessionAction, SessionPlayer, SessionTeam, Fixture, Round, TeamSize } from '@/types'

function uid(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`
}

function makeFixture(teamAId: string, teamBId: string, round: Round): Fixture {
  return {
    id: uid(),
    teamAId,
    teamBId,
    status: 'pending',
    scoreA: 0,
    scoreB: 0,
    winnerId: null,
    round,
  }
}

function generateRoundRobin(teams: SessionTeam[]): Fixture[] {
  const fixtures: Fixture[] = []
  for (let i = 0; i < teams.length; i++) {
    for (let j = i + 1; j < teams.length; j++) {
      fixtures.push(makeFixture(teams[i].id, teams[j].id, 'rr'))
    }
  }
  return fixtures
}

export interface TeamStat {
  team: SessionTeam
  played: number
  wins: number
  losses: number
  pointsFor: number
  pointsAgainst: number
  pts: number
}

export function rankStandings(teams: SessionTeam[], fixtures: Fixture[]): TeamStat[] {
  const rrDone = fixtures.filter(f => f.round === 'rr' && f.status === 'done')

  const base = new Map<string, TeamStat>(
    teams.map(t => [
      t.id,
      { team: t, played: 0, wins: 0, losses: 0, pointsFor: 0, pointsAgainst: 0, pts: 0 },
    ]),
  )
  for (const f of rrDone) {
    const a = base.get(f.teamAId)
    const b = base.get(f.teamBId)
    if (!a || !b) continue
    a.played++
    b.played++
    a.pointsFor += f.scoreA
    a.pointsAgainst += f.scoreB
    b.pointsFor += f.scoreB
    b.pointsAgainst += f.scoreA
    if (f.winnerId === f.teamAId) {
      a.wins++
      a.pts += 2
      b.losses++
    } else if (f.winnerId === f.teamBId) {
      b.wins++
      b.pts += 2
      a.losses++
    }
  }

  const rows = [...base.values()]

  const h2h = new Map<string, string>()
  for (const f of rrDone) {
    if (!f.winnerId) continue
    const key = [f.teamAId, f.teamBId].sort().join('|')
    h2h.set(key, f.winnerId)
  }

  rows.sort((a, b) => {
    if (b.pts !== a.pts) return b.pts - a.pts
    const sameGroup = rows.filter(r => r.pts === a.pts)
    if (sameGroup.length === 2) {
      const key = [a.team.id, b.team.id].sort().join('|')
      const winner = h2h.get(key)
      if (winner === a.team.id) return -1
      if (winner === b.team.id) return 1
    }
    const diffA = a.pointsFor - a.pointsAgainst
    const diffB = b.pointsFor - b.pointsAgainst
    if (diffB !== diffA) return diffB - diffA
    return b.pointsFor - a.pointsFor
  })

  return rows
}

export function generatePlayoffSeed(teams: SessionTeam[], rankedIds: string[]): Fixture[] {
  const n = teams.length
  if (n < 4) return []
  if (n <= 5) {
    return [
      makeFixture(rankedIds[0], rankedIds[1], 'final'),
      makeFixture(rankedIds[2], rankedIds[3], '3rd'),
    ]
  }
  return [
    makeFixture(rankedIds[0], rankedIds[3], 'semi'),
    makeFixture(rankedIds[1], rankedIds[2], 'semi'),
  ]
}

export function generateFinals(semis: Fixture[]): Fixture[] {
  if (semis.length !== 2 || semis.some(s => s.status !== 'done' || !s.winnerId)) return []
  const [s1, s2] = semis
  const loser = (f: Fixture) => (f.winnerId === f.teamAId ? f.teamBId : f.teamAId)
  return [
    makeFixture(s1.winnerId!, s2.winnerId!, 'final'),
    makeFixture(loser(s1), loser(s2), '3rd'),
  ]
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function buildTeamsFromPlayers(players: SessionPlayer[], teamSize: TeamSize): SessionTeam[] {
  const shuffled = shuffle(players)
  const teamCount = Math.ceil(shuffled.length / teamSize)
  return Array.from({ length: teamCount }, (_, i) => ({
    id: uid(),
    name: `Team ${i + 1}`,
    players: shuffled.slice(i * teamSize, i * teamSize + teamSize),
  }))
}

export const initialSession: DaySession = {
  id: 'session-initial',
  date: 0,
  winTarget: 21,
  teamSize: 2,
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

    case 'SET_TEAM_SIZE':
      return { ...state, teamSize: action.payload }

    case 'AUTO_SPLIT_TEAMS':
      return { ...state, teams: buildTeamsFromPlayers(state.players, state.teamSize) }

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
