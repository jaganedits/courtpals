'use client'

import { Trophy, ArrowRight } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { rankStandings } from '@/hooks/useSession'
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
  teams: SessionTeam[]
  fixtures: Fixture[]
  myTeamId: string
}

/**
 * Personal HUD for the signed-in player — telemetry-style flat panel.
 */
export default function PersonalSummary({ teams, fixtures, myTeamId }: Props) {
  const myTeam = teams.find(t => t.id === myTeamId)
  if (!myTeam) return null

  const myIdx = teams.findIndex(t => t.id === myTeamId)
  const color = TEAM_COLORS[myIdx % TEAM_COLORS.length]

  const standings = rankStandings(teams, fixtures)
  const myRow = standings.find(r => r.team.id === myTeamId)
  const myRank = standings.findIndex(r => r.team.id === myTeamId) + 1

  const myFixtures = fixtures.filter(
    f => f.teamAId === myTeamId || f.teamBId === myTeamId,
  )
  const upcoming = myFixtures.filter(f => f.status !== 'done')
  const done = myFixtures.filter(f => f.status === 'done')
  const next = upcoming.find(f => f.status !== 'done')
  const nextOpponent = next
    ? teams.find(t => t.id === (next.teamAId === myTeamId ? next.teamBId : next.teamAId))
    : null

  const totalFor = myRow?.pointsFor ?? 0
  const totalAgainst = myRow?.pointsAgainst ?? 0
  const diff = totalFor - totalAgainst

  return (
    <Card className="relative overflow-hidden rounded-md border-2 border-border/40 bg-card py-0">
      {/* Team colour flag */}
      <span aria-hidden className="pointer-events-none absolute inset-y-0 left-0 w-1" style={{ background: color }} />

      {/* Header rail */}
      <div className="flex items-center justify-between border-b border-border/30 bg-background/40 px-3 py-1.5 pl-4">
        <span className="font-mono text-[9px] font-extrabold uppercase tracking-[0.3em] text-primary">
          player card
        </span>
        <span className="font-mono text-[9px] font-bold uppercase tracking-[0.22em] text-muted-foreground">
          {done.length.toString().padStart(2, '0')}/{myFixtures.length.toString().padStart(2, '0')} played
        </span>
      </div>

      <CardContent className="flex flex-col gap-3 p-4 pl-5">
        {/* Team identity + rank */}
        <div className="flex items-end justify-between gap-3">
          <div className="min-w-0">
            <p className="font-mono text-[9px] font-bold uppercase tracking-[0.22em] text-muted-foreground">
              you are
            </p>
            <h3 className="font-display truncate text-2xl font-extrabold leading-none tracking-tight">
              {myTeam.name}
            </h3>
          </div>
          {myRank > 0 && (
            <div className="flex items-center gap-1.5 rounded-sm border border-border/40 bg-background/60 px-2 py-1">
              {myRank === 1 && <Trophy className="size-3 text-primary" />}
              <span className="font-mono text-[9px] font-bold uppercase tracking-[0.22em] text-muted-foreground">
                rank
              </span>
              <span
                className={cn(
                  'font-score text-lg font-extrabold leading-none tabular',
                  myRank === 1 ? 'text-primary' : 'text-foreground',
                )}
              >
                {myRank.toString().padStart(2, '0')}
              </span>
            </div>
          )}
        </div>

        {/* Stat modules */}
        <div className="grid grid-cols-4 divide-x divide-border/30 rounded-sm border border-border/40 bg-background/50">
          <StatModule label="w" value={myRow?.wins ?? 0} tone="chart-2" />
          <StatModule label="l" value={myRow?.losses ?? 0} tone="destructive" />
          <StatModule
            label="diff"
            value={diff}
            tone={diff > 0 ? 'chart-2' : diff < 0 ? 'destructive' : 'muted'}
            sign
          />
          <StatModule label="pts" value={myRow?.pts ?? 0} tone="primary" />
        </div>

        {/* Next match row */}
        {next ? (
          <div className="flex items-center gap-3 rounded-sm border border-border/40 bg-background/50 px-3 py-2">
            <div className="flex flex-col items-start gap-0.5 border-r border-border/30 pr-3">
              <span className="font-mono text-[8px] font-bold uppercase tracking-[0.22em] text-muted-foreground/70">
                up next
              </span>
              <span className="font-score text-base font-extrabold leading-none tabular text-primary">
                {upcoming.length.toString().padStart(2, '0')}
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <span className="font-mono text-[9px] font-bold uppercase tracking-[0.22em] text-muted-foreground">
                {next.round === 'rr' ? 'round robin' : next.round === 'semi' ? 'semi-final' : next.round === 'final' ? 'final' : '3rd-place'}
              </span>
              <p className="truncate font-display text-sm font-extrabold">
                vs {nextOpponent?.name ?? '—'}
              </p>
            </div>
            <ArrowRight className="size-4 text-primary" />
          </div>
        ) : (
          <div className="flex items-center gap-2 rounded-sm border border-chart-2/40 bg-chart-2/6 px-3 py-2">
            <Trophy className="size-4 text-chart-2" />
            <span className="font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-chart-2">
              all matches played
            </span>
          </div>
        )}

        {/* Results strip */}
        {myFixtures.length > 0 && (
          <div className="flex flex-col gap-1">
            <p className="font-mono text-[8px] font-bold uppercase tracking-[0.22em] text-muted-foreground">
              today&rsquo;s run
            </p>
            <div className="flex flex-wrap items-center gap-0.5">
              {myFixtures.map(f => {
                const isDone = f.status === 'done'
                const winner = isDone && f.winnerId === myTeamId
                const loser = isDone && f.winnerId && f.winnerId !== myTeamId
                const isLive = f.status === 'active'
                return (
                  <span
                    key={f.id}
                    className={cn(
                      'flex h-4 min-w-3.5 items-center justify-center border px-0.5 font-mono text-[9px] font-extrabold tabular leading-none',
                      winner && 'border-chart-2/50 bg-chart-2/15 text-chart-2',
                      loser && 'border-destructive/40 bg-destructive/10 text-destructive',
                      !isDone && !isLive && 'border-border/40 text-muted-foreground/60',
                      isLive && 'border-destructive/60 bg-destructive/15 text-destructive',
                    )}
                    aria-label={isDone ? (winner ? 'win' : 'loss') : isLive ? 'live' : 'upcoming'}
                  >
                    {isDone ? (winner ? 'W' : 'L') : isLive ? '●' : '·'}
                  </span>
                )
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function StatModule({
  label,
  value,
  tone,
  sign = false,
}: {
  label: string
  value: number
  tone: 'chart-2' | 'destructive' | 'primary' | 'muted'
  sign?: boolean
}) {
  const display = sign ? (value > 0 ? `+${value}` : `${value}`) : value.toString().padStart(2, '0')
  const color =
    tone === 'chart-2'
      ? 'text-chart-2'
      : tone === 'destructive'
      ? 'text-destructive'
      : tone === 'primary'
      ? 'text-primary'
      : 'text-foreground'
  return (
    <div className="flex flex-col items-center justify-center gap-0.5 py-2">
      <span className="font-mono text-[8px] font-bold uppercase tracking-[0.28em] text-muted-foreground/70">
        {label}
      </span>
      <span className={cn('font-score text-lg font-extrabold leading-none tabular', color)}>
        {display}
      </span>
    </div>
  )
}
