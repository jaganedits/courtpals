'use client'

import type { Fixture, SessionTeam } from '@/types'

const TEAM_COLORS = [
  'var(--color-team-a)',
  'var(--color-team-b)',
  'var(--color-team-c)',
  'var(--color-team-d)',
  'var(--color-team-e)',
  'var(--color-team-f)',
]

interface Props {
  fixtures: Fixture[]
  teams: SessionTeam[]
  onStartFixture: (fixtureId: string) => void
}

function teamIndex(teams: SessionTeam[], id: string): number {
  return teams.findIndex(t => t.id === id)
}

function teamById(teams: SessionTeam[], id: string): SessionTeam {
  return teams.find(t => t.id === id) ?? { id, name: '—', players: [] }
}

export default function FixtureList({ fixtures, teams, onStartFixture }: Props) {
  const done = fixtures.filter(f => f.status === 'done').length
  const total = fixtures.length
  const progressPct = total === 0 ? 0 : (done / total) * 100

  return (
    <div className="flex flex-col gap-4 px-4 pt-6 pb-8">
      {/* Header */}
      <header>
        <div className="flex items-baseline justify-between">
          <div>
            <p className="font-display text-[10px] font-bold uppercase tracking-[0.22em] text-[var(--color-ink-dim)]">
              round robin
            </p>
            <h1 className="font-display text-3xl font-extrabold leading-none text-[var(--color-chalk)]">
              Fixtures
            </h1>
          </div>
          <div className="font-score flex items-baseline gap-1 text-[var(--color-lime)]">
            <span className="text-2xl font-extrabold leading-none tabular">{done}</span>
            <span className="font-display text-[11px] font-bold text-[var(--color-ink-dim)]">
              / {total}
            </span>
          </div>
        </div>
        {/* Progress bar */}
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[var(--color-card)]">
          <div
            className="h-full rounded-full bg-[var(--color-lime)] transition-all duration-500 ease-out"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </header>

      {/* Fixtures */}
      <div className="space-y-2.5">
        {fixtures.map((f, i) => {
          const tA = teamById(teams, f.teamAId)
          const tB = teamById(teams, f.teamBId)
          const iA = teamIndex(teams, f.teamAId)
          const iB = teamIndex(teams, f.teamBId)
          const colorA = TEAM_COLORS[iA % TEAM_COLORS.length]
          const colorB = TEAM_COLORS[iB % TEAM_COLORS.length]
          const canStart = f.status === 'pending'
          const isActive = f.status === 'active'
          const isDone = f.status === 'done'
          const isWinnerA = isDone && f.winnerId === f.teamAId
          const isWinnerB = isDone && f.winnerId === f.teamBId

          return (
            <button
              key={f.id}
              onClick={() => canStart && onStartFixture(f.id)}
              disabled={!canStart}
              style={{ animationDelay: `${i * 40}ms` }}
              className={`animate-rise group relative flex w-full items-stretch overflow-hidden rounded-2xl border-2 text-left transition-all ${
                isActive
                  ? 'border-[var(--color-lime)] ring-lime'
                  : canStart
                  ? 'border-[var(--color-line)] bg-[var(--color-card)] hover:border-[var(--color-lime)]/40 active:scale-[0.99]'
                  : 'border-[var(--color-line)] bg-[var(--color-card)]/60'
              }`}
            >
              {/* Match number column */}
              <div className="flex w-10 flex-col items-center justify-center border-r border-[var(--color-line)] bg-[var(--color-bg-raised)]">
                <span className="font-mono text-[9px] font-bold uppercase tracking-wider text-[var(--color-ink-dim)]">
                  M
                </span>
                <span className="font-score text-sm font-extrabold text-[var(--color-ink-soft)] tabular">
                  {(i + 1).toString().padStart(2, '0')}
                </span>
              </div>

              {/* Match body */}
              <div className="flex flex-1 items-center gap-2 p-2.5">
                <TeamSide
                  team={tA}
                  color={colorA}
                  align="left"
                  score={isDone ? f.scoreA : null}
                  winner={isWinnerA}
                  dim={isDone && !isWinnerA}
                />

                <div className="flex shrink-0 flex-col items-center gap-1 px-1">
                  {isActive ? (
                    <span className="rounded-full bg-[var(--color-lime)] px-2 py-0.5 font-display text-[9px] font-extrabold uppercase tracking-[0.16em] text-[var(--color-bg)] animate-live">
                      live
                    </span>
                  ) : isDone ? (
                    <span className="font-display text-[9px] font-bold uppercase tracking-[0.18em] text-[var(--color-win)]">
                      final
                    </span>
                  ) : (
                    <span className="font-display text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--color-ink-dim)]">
                      vs
                    </span>
                  )}
                </div>

                <TeamSide
                  team={tB}
                  color={colorB}
                  align="right"
                  score={isDone ? f.scoreB : null}
                  winner={isWinnerB}
                  dim={isDone && !isWinnerB}
                />
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

function TeamSide({
  team,
  color,
  align,
  score,
  winner,
  dim,
}: {
  team: SessionTeam
  color: string
  align: 'left' | 'right'
  score: number | null
  winner: boolean
  dim: boolean
}) {
  const dimClass = dim ? 'opacity-45' : ''
  return (
    <div className={`flex min-w-0 flex-1 items-center gap-2 ${align === 'right' ? 'flex-row-reverse text-right' : ''} ${dimClass}`}>
      <div
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg`}
        style={{ background: `color-mix(in srgb, ${color} 18%, transparent)` }}
      >
        <span className="text-xl">{team.players[0]?.emoji ?? '🏸'}</span>
      </div>
      <div className="min-w-0 flex-1">
        <div className={`flex items-baseline gap-1.5 ${align === 'right' ? 'flex-row-reverse' : ''}`}>
          <span className="font-display text-sm font-extrabold text-[var(--color-chalk)] truncate">
            {team.name}
          </span>
          {winner && <span className="text-xs leading-none">🏆</span>}
        </div>
        <p className={`truncate text-[10px] text-[var(--color-ink-dim)] ${align === 'right' ? 'text-right' : ''}`}>
          {team.players.map(p => p.name).join(' · ')}
        </p>
      </div>
      {score !== null && (
        <span
          className={`font-score shrink-0 text-2xl font-extrabold leading-none tabular ${
            winner ? 'text-[var(--color-lime)]' : 'text-[var(--color-ink-soft)]'
          }`}
        >
          {score}
        </span>
      )}
    </div>
  )
}
