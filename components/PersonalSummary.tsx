'use client'

import type { CSSProperties } from 'react'
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
 * Personal HUD for the signed-in player — compact data-telemetry style:
 * rank chevron, stat modules, next-opponent pill, and a race-dots strip
 * showing win/loss/upcoming across the day.
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

  const cardStyle: CSSProperties = {
    backgroundImage: [
      `radial-gradient(130% 120% at 0% 0%, color-mix(in srgb, ${color} 22%, transparent) 0%, transparent 55%)`,
      `radial-gradient(120% 120% at 100% 100%, color-mix(in srgb, var(--primary) 10%, transparent) 0%, transparent 50%)`,
      'repeating-linear-gradient(0deg, transparent 0px, transparent 3px, rgba(255,255,255,0.015) 3px, rgba(255,255,255,0.015) 4px)',
      'linear-gradient(180deg, rgba(5,13,28,0.85) 0%, rgba(5,13,28,0.95) 100%)',
    ].join(', '),
  }

  return (
    <Card
      className="relative overflow-hidden border-2 border-primary/30 py-0"
      style={cardStyle}
    >
      {/* Left team colour pillar */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-y-0 left-0 w-0.75"
        style={{ background: color, boxShadow: `0 0 18px ${color}` }}
      />
      {/* Corner chevron */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-px right-0 flex h-6 w-28 items-center justify-center bg-primary"
        style={{ clipPath: 'polygon(12% 0, 100% 0, 100% 100%, 0 100%)' }}
      >
        <span className="font-mono text-[9px] font-extrabold uppercase tracking-[0.28em] text-primary-foreground">
          your match card
        </span>
      </div>

      <CardContent className="flex flex-col gap-3 p-4 pt-5">
        {/* Team identity + rank */}
        <div className="flex items-end justify-between gap-3">
          <div className="min-w-0">
            <p className="font-mono text-[9px] font-bold uppercase tracking-[0.28em] text-muted-foreground">
              you are
            </p>
            <h3
              className="font-display truncate text-2xl font-extrabold leading-none tracking-tight"
              style={{ textShadow: `0 0 24px color-mix(in srgb, ${color} 60%, transparent)` }}
            >
              {myTeam.name}
            </h3>
          </div>
          {myRank > 0 && (
            <div
              className="flex items-center gap-1.5 rounded-sm border border-primary/50 bg-primary/10 pl-1.5 pr-2 py-1"
              style={{ clipPath: 'polygon(8% 0, 100% 0, 100% 100%, 0 100%)' }}
            >
              {myRank === 1 && <Trophy className="size-3 text-primary" />}
              <span className="font-mono text-[9px] font-bold uppercase tracking-[0.22em] text-primary">
                rank
              </span>
              <span className="font-score text-lg font-extrabold leading-none tabular text-primary">
                {myRank.toString().padStart(2, '0')}
              </span>
            </div>
          )}
        </div>

        {/* Stat modules */}
        <div className="grid grid-cols-4 divide-x divide-border/40 rounded-lg border border-border/40 bg-background/50 py-2">
          <StatModule label="wins" value={myRow?.wins ?? 0} tone="chart-2" />
          <StatModule label="losses" value={myRow?.losses ?? 0} tone="destructive" />
          <StatModule
            label="diff"
            value={diff}
            tone={diff > 0 ? 'chart-2' : diff < 0 ? 'destructive' : 'muted'}
            sign
          />
          <StatModule label="pts" value={myRow?.pts ?? 0} tone="primary" />
        </div>

        {/* Next match module */}
        {next ? (
          <div className="flex items-center gap-3 rounded-lg border border-primary/30 bg-primary/5 p-2.5">
            <div className="flex flex-col items-center gap-0.5 rounded-sm border border-primary/40 bg-primary/10 px-1.5 py-1">
              <span className="font-mono text-[8px] font-bold uppercase tracking-[0.2em] text-primary/80">
                up next
              </span>
              <span className="font-score text-sm font-extrabold leading-none tabular text-primary">
                {upcoming.length.toString().padStart(2, '0')}
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-mono text-[9px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
                {next.round === 'rr' ? 'round robin' : next.round === 'semi' ? 'semi-final' : next.round === 'final' ? 'final' : '3rd-place'}
              </p>
              <p className="truncate font-display text-sm font-extrabold">
                vs {nextOpponent?.name ?? '—'}
              </p>
            </div>
            <ArrowRight className="size-4 text-primary" />
          </div>
        ) : (
          <div className="flex items-center gap-2 rounded-lg border border-chart-2/40 bg-chart-2/10 p-2.5">
            <Trophy className="size-4 text-chart-2" />
            <span className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-chart-2">
              all matches played
            </span>
          </div>
        )}

        {/* Race dots strip */}
        <div className="flex flex-col gap-1">
          <p className="font-mono text-[8px] font-bold uppercase tracking-[0.22em] text-muted-foreground">
            today&rsquo;s run · {done.length}/{myFixtures.length}
          </p>
          <div className="flex flex-wrap items-center gap-1">
            {myFixtures.map(f => {
              const isDone = f.status === 'done'
              const winner = isDone && f.winnerId === myTeamId
              const loser = isDone && f.winnerId && f.winnerId !== myTeamId
              const isLive = f.status === 'active'
              return (
                <span
                  key={f.id}
                  className={cn(
                    'flex size-5 items-center justify-center rounded-sm border font-mono text-[8px] font-extrabold tabular',
                    winner && 'border-chart-2/60 bg-chart-2/25 text-chart-2',
                    loser && 'border-destructive/50 bg-destructive/15 text-destructive',
                    !isDone && !isLive && 'border-border/50 text-muted-foreground/70',
                    isLive && 'animate-pulse border-destructive/60 bg-destructive/20 text-destructive',
                  )}
                  aria-label={isDone ? (winner ? 'win' : 'loss') : isLive ? 'live' : 'upcoming'}
                >
                  {isDone ? (winner ? 'W' : 'L') : isLive ? '●' : '○'}
                </span>
              )
            })}
          </div>
        </div>
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
      : 'text-muted-foreground'
  return (
    <div className="flex flex-col items-center justify-center gap-0.5 px-2">
      <span className="font-mono text-[8px] font-bold uppercase tracking-[0.28em] text-muted-foreground/70">
        {label}
      </span>
      <span className={cn('font-score text-xl font-extrabold leading-none tabular', color)}>
        {display}
      </span>
    </div>
  )
}
