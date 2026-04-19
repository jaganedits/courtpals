'use client'

import { useEffect, useReducer } from 'react'
import type { DaySession, SessionAction, SessionPlayer, SessionTeam, Fixture, Round, TeamSize } from '@/types'

const STORAGE_KEY = 'courtpals_session'

function uid(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`
}

function startOfDay(ts: number): number {
  const d = new Date(ts)
  d.setHours(0, 0, 0, 0)
  return d.getTime()
}

function isFutureDay(ts: number): boolean {
  return startOfDay(ts) > startOfDay(Date.now())
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

/**
 * Circle-method round-robin: every team plays exactly once per round, so when
 * matches are flattened onto a single court they alternate teams instead of
 * running one team back-to-back through every opponent.
 *
 * For N teams (N even): fix team 0, rotate the rest around it over N-1 rounds.
 * For N odd: add a phantom "bye" slot that skips one match per round.
 */
function generateRoundRobin(teams: SessionTeam[]): Fixture[] {
  const fixtures: Fixture[] = []
  if (teams.length < 2) return fixtures

  const slots: (string | null)[] = teams.map(t => t.id)
  if (slots.length % 2 === 1) slots.push(null)
  const n = slots.length
  const rounds = n - 1

  for (let r = 0; r < rounds; r++) {
    for (let i = 0; i < n / 2; i++) {
      const a = slots[i]
      const b = slots[n - 1 - i]
      if (a && b) fixtures.push(makeFixture(a, b, 'rr'))
    }
    // rotate: pin slot 0, move last to front of the rotating tail
    const fixed = slots[0]
    const rotated = [slots[n - 1], ...slots.slice(1, n - 1)]
    slots.splice(0, n, fixed, ...rotated)
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
    // 3rd-place is emitted first so it's played before the Final.
    return [
      makeFixture(rankedIds[2], rankedIds[3], '3rd'),
      makeFixture(rankedIds[0], rankedIds[1], 'final'),
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
  // 3rd-place first, then Final — bronze match is the warm-up for the decider.
  return [
    makeFixture(loser(s1), loser(s2), '3rd'),
    makeFixture(s1.winnerId!, s2.winnerId!, 'final'),
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
      // Re-shuffling a scheduled session invalidates its fixtures; drop back to setup so the user confirms again.
      return {
        ...state,
        teams: buildTeamsFromPlayers(state.players, state.teamSize),
        fixtures: state.phase === 'scheduled' ? [] : state.fixtures,
        phase: state.phase === 'scheduled' ? 'setup' : state.phase,
      }

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

    case 'UPDATE_TEAM_NAME': {
      const { id, name } = action.payload
      const trimmed = name.trim().slice(0, 24)
      if (!trimmed) return state
      return {
        ...state,
        teams: state.teams.map(t => (t.id === id ? { ...t, name: trimmed } : t)),
      }
    }

    case 'START_SESSION':
      return {
        ...state,
        id: uid(),
        // Keep the user-picked session date; default to today if still unset.
        date: state.date || startOfDay(Date.now()),
        fixtures: generateRoundRobin(state.teams),
        phase: isFutureDay(state.date || Date.now()) ? 'scheduled' : 'active',
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
      const updated = state.fixtures.map(f =>
        f.id === fixtureId ? { ...f, status: 'done' as const, scoreA, scoreB, winnerId } : f,
      )

      const rrFixtures = updated.filter(f => f.round === 'rr')
      const rrDone = rrFixtures.length > 0 && rrFixtures.every(f => f.status === 'done')
      const hasPlayoffs = updated.some(f => f.round !== 'rr')

      if (rrDone && !hasPlayoffs) {
        const ranked = rankStandings(state.teams, updated).map(r => r.team.id)
        const seed = generatePlayoffSeed(state.teams, ranked)
        if (seed.length === 0) {
          return { ...state, fixtures: updated, activeFixtureId: null, phase: 'done' }
        }
        return {
          ...state,
          fixtures: [...updated, ...seed],
          activeFixtureId: null,
          phase: 'playoffs',
        }
      }

      if (state.phase === 'playoffs') {
        const semis = updated.filter(f => f.round === 'semi')
        const hasFinal = updated.some(f => f.round === 'final')
        if (semis.length === 2 && semis.every(s => s.status === 'done') && !hasFinal) {
          const finals = generateFinals(semis)
          return {
            ...state,
            fixtures: [...updated, ...finals],
            activeFixtureId: null,
            phase: 'playoffs',
          }
        }
        const nonRR = updated.filter(f => f.round !== 'rr')
        const allPlayoffsDone = nonRR.length > 0 && nonRR.every(f => f.status === 'done')
        if (allPlayoffsDone) {
          return { ...state, fixtures: updated, activeFixtureId: null, phase: 'done' }
        }
      }

      return { ...state, fixtures: updated, activeFixtureId: null, phase: state.phase }
    }

    case 'RESET_SESSION':
      return { ...initialSession, id: uid(), date: startOfDay(Date.now()) }

    case 'SET_SESSION_DATE':
      return { ...state, date: startOfDay(action.payload) }

    case 'BEGIN_PLAY':
      if (state.phase !== 'scheduled') return state
      return { ...state, phase: 'active' }

    case 'HYDRATE_SESSION':
      return action.payload

    default:
      return state
  }
}

function loadPersisted(): DaySession | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw) as DaySession
  } catch {
    return null
  }
}

export function useSession() {
  const [state, dispatch] = useReducer(sessionReducer, initialSession)

  // Hydrate persisted session on mount.
  useEffect(() => {
    const persisted = loadPersisted()
    if (persisted) dispatch({ type: 'HYDRATE_SESSION', payload: persisted })
  }, [])

  // Persist every state change (skip the pristine sentinel).
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (state.id === initialSession.id) {
      localStorage.removeItem(STORAGE_KEY)
      return
    }
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    } catch {
      // quota / serialization — silent fail is fine for this non-critical cache.
    }
  }, [state])

  return { state, dispatch }
}
