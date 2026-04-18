'use client'

import type { Fixture, SessionTeam } from '@/types'

interface TeamStat {
  team: SessionTeam
  played: number
  wins: number
  losses: number
  pointsFor: number
  pointsAgainst: number
  pts: number
}

const TEAM_COLORS = [
  'var(--color-team-a)',
  'var(--color-team-b)',
  'var(--color-team-c)',
  'var(--color-team-d)',
  'var(--color-team-e)',
  'var(--color-team-f)',
]

function computeStandings(teams: SessionTeam[], fixtures: Fixture[]): TeamStat[] {
  const map = new Map<string, TeamStat>(
    teams.map(t => [
      t.id,
      { team: t, played: 0, wins: 0, losses: 0, pointsFor: 0, pointsAgainst: 0, pts: 0 },
    ]),
  )
  for (const f of fixtures.filter(x => x.status === 'done')) {
    const a = map.get(f.teamAId)
    const b = map.get(f.teamBId)
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
    } else {
      b.wins++
      b.pts += 2
      a.losses++
    }
  }
  return [...map.values()].sort(
    (a, b) => b.pts - a.pts || (b.pointsFor - b.pointsAgainst) - (a.pointsFor - a.pointsAgainst),
  )
}

const MEDALS = ['🥇', '🥈', '🥉']

interface Props {
  teams: SessionTeam[]
  fixtures: Fixture[]
}

export default function Standings({ teams, fixtures }: Props) {
  const rows = computeStandings(teams, fixtures)
  const anyDone = rows.some(r => r.played > 0)

  return (
    <div className="flex flex-col gap-4 px-4 pt-6 pb-8">
      <header>
        <p className="font-display text-[10px] font-bold uppercase tracking-[0.22em] text-[var(--color-ink-dim)]">
          today's table
        </p>
        <h1 className="font-display text-3xl font-extrabold leading-none text-[var(--color-chalk)]">
          Standings
        </h1>
        {!anyDone && (
          <p className="mt-1.5 text-sm text-[var(--color-ink-soft)]">
            No matches played yet. Finish a match to populate the table.
          </p>
        )}
      </header>

      <div className="overflow-hidden rounded-2xl border-2 border-[var(--color-line)] bg-[var(--color-card)]">
        {/* Column headers */}
        <div className="grid grid-cols-[28px_1fr_28px_28px_40px_36px] items-center gap-2 border-b-2 border-[var(--color-line)] px-3 py-2 font-display text-[9px] font-bold uppercase tracking-[0.18em] text-[var(--color-ink-dim)]">
          <span></span>
          <span>team</span>
          <span className="text-center">W</span>
          <span className="text-center">L</span>
          <span className="text-center">±</span>
          <span className="text-right">pts</span>
        </div>

        {/* Rows */}
        {rows.map((row, i) => {
          const teamIdx = teams.findIndex(t => t.id === row.team.id)
          const color = TEAM_COLORS[teamIdx % TEAM_COLORS.length]
          const diff = row.pointsFor - row.pointsAgainst
          const rank = i + 1
          const medal = MEDALS[i]
          const isTop = i === 0 && row.played > 0

          return (
            <div
              key={row.team.id}
              style={{ animationDelay: `${i * 50}ms` }}
              className={`animate-rise grid grid-cols-[28px_1fr_28px_28px_40px_36px] items-center gap-2 border-b border-[var(--color-line)]/60 px-3 py-3 last:border-0 ${
                isTop ? 'bg-[var(--color-lime)]/5' : ''
              }`}
            >
              <span className="font-score text-center text-sm font-extrabold tabular">
                {medal ? (
                  <span className="text-base">{medal}</span>
                ) : (
                  <span className="text-[var(--color-ink-dim)]">{rank}</span>
                )}
              </span>

              <div className="flex min-w-0 items-center gap-2">
                <span
                  aria-hidden
                  className="h-6 w-1 shrink-0 rounded-full"
                  style={{ background: color }}
                />
                <span className="text-base">{row.team.players[0]?.emoji ?? '🏸'}</span>
                <div className="min-w-0">
                  <p className="truncate font-display text-sm font-extrabold text-[var(--color-chalk)] leading-tight">
                    {row.team.name}
                  </p>
                  <p className="truncate text-[10px] text-[var(--color-ink-dim)] leading-tight">
                    {row.team.players.map(p => p.name).join(' · ') || '—'}
                  </p>
                </div>
              </div>

              <span className="font-score text-center text-sm font-bold text-[var(--color-win)] tabular">
                {row.wins}
              </span>
              <span className="font-score text-center text-sm font-bold text-[var(--color-ink-dim)] tabular">
                {row.losses}
              </span>
              <span
                className={`font-score text-center text-xs font-bold tabular ${
                  diff > 0
                    ? 'text-[var(--color-win)]'
                    : diff < 0
                    ? 'text-[var(--color-loss)]'
                    : 'text-[var(--color-ink-dim)]'
                }`}
              >
                {diff > 0 ? `+${diff}` : diff}
              </span>
              <span
                className={`font-score text-right text-lg font-extrabold tabular ${
                  isTop ? 'text-[var(--color-lime)]' : 'text-[var(--color-chalk)]'
                }`}
              >
                {row.pts}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
