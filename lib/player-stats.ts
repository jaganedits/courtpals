import type { SavedSession, SessionTeam, Fixture } from '@/types'

export interface PlayerStats {
  sessionsPlayed: number
  matchesPlayed: number
  wins: number
  losses: number
  winRate: number // 0..1
  championships: number
}

export interface RecentSessionEntry {
  id: string
  date: number
  teamName: string
  championTeamName: string | null
  wasChampion: boolean
  matchesPlayed: number
  wins: number
  losses: number
}

function championOf(session: SavedSession): SessionTeam | null {
  const final = session.fixtures.find(
    f => f.round === 'final' && f.status === 'done' && f.winnerId,
  )
  if (final) return session.teams.find(t => t.id === final.winnerId) ?? null

  const pts = new Map<string, number>()
  session.teams.forEach(t => pts.set(t.id, 0))
  for (const f of session.fixtures) {
    if (f.status === 'done' && f.winnerId) {
      pts.set(f.winnerId, (pts.get(f.winnerId) ?? 0) + 2)
    }
  }
  let best: SessionTeam | null = null
  let bestPts = -1
  for (const [id, p] of pts) {
    if (p > bestPts) {
      bestPts = p
      best = session.teams.find(t => t.id === id) ?? null
    }
  }
  return best
}

function teamForPlayer(session: SavedSession, playerId: string): SessionTeam | null {
  return session.teams.find(t => t.players.some(p => p.id === playerId)) ?? null
}

function playerMatchTally(team: SessionTeam, fixtures: Fixture[]) {
  let matches = 0
  let wins = 0
  let losses = 0
  for (const f of fixtures) {
    if (f.status !== 'done' || !f.winnerId) continue
    if (f.teamAId !== team.id && f.teamBId !== team.id) continue
    matches++
    if (f.winnerId === team.id) wins++
    else losses++
  }
  return { matches, wins, losses }
}

export function computePlayerStats(
  history: SavedSession[],
  playerId: string,
): PlayerStats {
  let sessionsPlayed = 0
  let matchesPlayed = 0
  let wins = 0
  let losses = 0
  let championships = 0

  for (const session of history) {
    const team = teamForPlayer(session, playerId)
    if (!team) continue
    sessionsPlayed++
    const tally = playerMatchTally(team, session.fixtures)
    matchesPlayed += tally.matches
    wins += tally.wins
    losses += tally.losses
    const champ = championOf(session)
    if (champ?.id === team.id) championships++
  }

  const winRate = matchesPlayed === 0 ? 0 : wins / matchesPlayed
  return { sessionsPlayed, matchesPlayed, wins, losses, winRate, championships }
}

export function recentSessionsForPlayer(
  history: SavedSession[],
  playerId: string,
  limit = 5,
): RecentSessionEntry[] {
  const result: RecentSessionEntry[] = []
  for (const session of history) {
    const team = teamForPlayer(session, playerId)
    if (!team) continue
    const champ = championOf(session)
    const tally = playerMatchTally(team, session.fixtures)
    result.push({
      id: session.id,
      date: session.date,
      teamName: team.name,
      championTeamName: champ?.name ?? null,
      wasChampion: champ?.id === team.id,
      matchesPlayed: tally.matches,
      wins: tally.wins,
      losses: tally.losses,
    })
    if (result.length >= limit) break
  }
  return result
}
