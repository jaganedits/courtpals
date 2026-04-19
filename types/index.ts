export type WinTarget = 11 | 15 | 21 | 25
export type TeamSize = 1 | 2

export interface SessionPlayer {
  id: string
  name: string
  emoji: string
}

export interface SessionTeam {
  id: string
  name: string
  players: SessionPlayer[]
}

export type FixtureStatus = 'pending' | 'active' | 'done'

export type Round = 'rr' | 'semi' | 'final' | '3rd'

export interface Fixture {
  id: string
  teamAId: string
  teamBId: string
  status: FixtureStatus
  scoreA: number
  scoreB: number
  winnerId: string | null
  round: Round
}

export type SessionPhase = 'setup' | 'scheduled' | 'active' | 'playoffs' | 'done'

export interface DaySession {
  id: string
  date: number
  winTarget: WinTarget
  teamSize: TeamSize
  players: SessionPlayer[]
  teams: SessionTeam[]
  fixtures: Fixture[]
  phase: SessionPhase
  activeFixtureId: string | null
  /** uid of the member who started this tournament. Empty string for local-only sessions. */
  createdBy: string
  /** ms since epoch when the tournament was started. 0 for local-only sessions. */
  createdAt: number
}

export type SessionAction =
  | { type: 'ADD_PLAYER'; payload: SessionPlayer }
  | { type: 'REMOVE_PLAYER'; payload: string }
  | { type: 'UPDATE_PLAYER'; payload: SessionPlayer }
  | { type: 'SET_WIN_TARGET'; payload: WinTarget }
  | { type: 'SET_TEAM_SIZE'; payload: TeamSize }
  | { type: 'AUTO_SPLIT_TEAMS' }
  | { type: 'ASSIGN_PLAYER_TO_TEAM'; payload: { playerId: string; teamId: string } }
  | { type: 'START_SESSION'; payload?: { createdBy?: string } }
  | { type: 'START_FIXTURE'; payload: string }
  | { type: 'ABANDON_FIXTURE'; payload: string }
  | { type: 'RESET_FIXTURE'; payload: string }
  | { type: 'FINISH_FIXTURE'; payload: { fixtureId: string; scoreA: number; scoreB: number; winnerId: string } }
  | { type: 'RESET_SESSION' }
  | { type: 'UPDATE_TEAM_NAME'; payload: { id: string; name: string } }
  | { type: 'SET_SESSION_DATE'; payload: number }
  | { type: 'BEGIN_PLAY' }
  | { type: 'HYDRATE_SESSION'; payload: DaySession }

export type TeamIndex = 0 | 1

export interface PointEvent {
  id: string
  timestamp: number
  team: TeamIndex
  scoreAfter: [number, number]
}

export interface MatchState {
  fixtureId: string | null
  teamNames: [string, string]
  teamEmojis: [string, string]
  winTarget: WinTarget
  scores: [number, number]
  events: PointEvent[]
  startTime: number | null
  endTime: number | null
  winner: TeamIndex | null
  phase: 'idle' | 'playing' | 'finished'
}

export type MatchAction =
  | { type: 'START_MATCH'; payload: { fixtureId: string; teamNames: [string, string]; teamEmojis: [string, string]; winTarget: WinTarget } }
  | { type: 'ADD_POINT'; payload: TeamIndex }
  | { type: 'UNDO' }
  | { type: 'RESET' }
  | { type: 'HYDRATE'; payload: MatchState }

export interface SavedSession {
  id: string
  date: number
  winTarget: WinTarget
  teamSize: TeamSize
  teams: SessionTeam[]
  fixtures: Fixture[]
}
