'use client'

import { Trophy, ArrowRight, CheckCircle2, Circle } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { rankStandings } from '@/hooks/useSession'
import type { Fixture, SessionTeam } from '@/types'

interface Props {
  teams: SessionTeam[]
  fixtures: Fixture[]
  myTeamId: string
}

/**
 * Compact personal analysis card for the signed-in player: current rank in
 * the table, W/L record, upcoming fixture count, and the opponent of their
 * next pending match. Only renders when we can resolve the user to a team.
 */
export default function PersonalSummary({ teams, fixtures, myTeamId }: Props) {
  const myTeam = teams.find(t => t.id === myTeamId)
  if (!myTeam) return null

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
    <Card className="border-2 border-primary/40 bg-primary/5 py-0">
      <CardContent className="flex flex-col gap-3 p-3">
        <div className="flex items-baseline justify-between gap-2">
          <div className="min-w-0">
            <p className="font-display text-[9px] font-bold uppercase tracking-[0.2em] text-primary">
              your match card
            </p>
            <p className="truncate font-display text-sm font-extrabold">{myTeam.name}</p>
          </div>
          {myRank > 0 && (
            <Badge className="font-display text-[10px] font-extrabold uppercase tracking-[0.14em]">
              {myRank === 1 && <Trophy data-icon="inline-start" className="size-3" />}
              Rank #{myRank}
            </Badge>
          )}
        </div>

        <div className="grid grid-cols-4 gap-2 rounded-xl border border-border bg-background/60 px-2 py-2 text-center">
          <Stat label="W" value={myRow?.wins ?? 0} accent />
          <Stat label="L" value={myRow?.losses ?? 0} />
          <Stat label="±" value={diff} sign />
          <Stat label="pts" value={myRow?.pts ?? 0} />
        </div>

        {next ? (
          <div className="flex items-center gap-2 rounded-xl border border-primary/30 bg-background/40 px-3 py-2">
            <div className="min-w-0 flex-1">
              <p className="font-display text-[9px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
                next up · {next.round === 'rr' ? 'round robin' : next.round}
              </p>
              <p className="truncate font-display text-sm font-extrabold">
                vs {nextOpponent?.name ?? '—'}
              </p>
            </div>
            <div className="font-score flex flex-col items-end text-primary">
              <span className="text-lg font-extrabold leading-none tabular">
                {upcoming.length}
              </span>
              <span className="font-display text-[9px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                left
              </span>
            </div>
            <ArrowRight className="size-4 text-primary" />
          </div>
        ) : (
          <div className="flex items-center gap-2 rounded-xl border border-border bg-background/40 px-3 py-2 text-muted-foreground">
            <CheckCircle2 className="size-4 text-chart-2" />
            <span className="font-display text-xs font-bold uppercase tracking-[0.14em]">
              you&apos;ve played every match today
            </span>
          </div>
        )}

        <div className="flex flex-wrap gap-1.5">
          {myFixtures.map(f => {
            const isDone = f.status === 'done'
            const winner = isDone && f.winnerId === myTeamId
            const loser = isDone && f.winnerId && f.winnerId !== myTeamId
            return (
              <span
                key={f.id}
                className={cn(
                  'inline-flex size-4 items-center justify-center rounded-full border',
                  winner && 'bg-chart-2/30 border-chart-2/60',
                  loser && 'bg-destructive/20 border-destructive/40',
                  !isDone && 'border-border text-muted-foreground',
                )}
                aria-label={isDone ? (winner ? 'win' : 'loss') : 'upcoming'}
              >
                {isDone ? (
                  <span
                    className={cn(
                      'font-score text-[8px] font-extrabold tabular',
                      winner ? 'text-chart-2' : 'text-destructive',
                    )}
                  >
                    {winner ? 'W' : 'L'}
                  </span>
                ) : (
                  <Circle className="size-2" />
                )}
              </span>
            )
          })}
        </div>
        <p className="text-[10px] text-muted-foreground">
          {done.length} of {myFixtures.length} matches played
        </p>
      </CardContent>
    </Card>
  )
}

function Stat({
  label,
  value,
  accent = false,
  sign = false,
}: {
  label: string
  value: number
  accent?: boolean
  sign?: boolean
}) {
  const display = sign ? (value > 0 ? `+${value}` : `${value}`) : value.toString()
  return (
    <div className="flex flex-col items-center justify-center">
      <span
        className={cn(
          'font-score text-lg font-extrabold leading-none tabular',
          accent ? 'text-chart-2' : sign && value > 0 ? 'text-chart-2' : sign && value < 0 ? 'text-destructive' : 'text-foreground',
        )}
      >
        {display}
      </span>
      <span className="font-display text-[9px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
        {label}
      </span>
    </div>
  )
}
