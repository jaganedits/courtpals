'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
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

const MEDALS = ['🥇', '🥈', '🥉']

interface Props {
  teams: SessionTeam[]
  fixtures: Fixture[]
  myTeamId?: string | null
}

export default function Standings({ teams, fixtures, myTeamId = null }: Props) {
  const rows = rankStandings(teams, fixtures)
  const anyDone = rows.some(r => r.played > 0)

  return (
    <div className="flex flex-col gap-3 px-4 pt-6 pb-8">
      <header>
        <p className="font-mono text-[9px] font-bold uppercase tracking-[0.32em] text-muted-foreground">
          live telemetry
        </p>
        <h1 className="font-display text-3xl font-extrabold leading-none tracking-tight">
          Standings
        </h1>
        {!anyDone && (
          <p className="mt-1.5 font-mono text-[9px] font-bold uppercase tracking-[0.22em] text-muted-foreground">
            awaiting first result
          </p>
        )}
      </header>

      <Card className="overflow-hidden rounded-md border-2 border-border/40 bg-card py-0">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-b-2 border-border/60 hover:bg-transparent">
                <TableHead className="h-8 w-10 text-center font-mono text-[9px] font-extrabold uppercase tracking-[0.26em] text-muted-foreground">
                  pos
                </TableHead>
                <TableHead className="h-8 font-mono text-[9px] font-extrabold uppercase tracking-[0.26em] text-muted-foreground">
                  team
                </TableHead>
                <TableHead className="h-8 w-8 text-center font-mono text-[9px] font-extrabold uppercase tracking-[0.26em] text-muted-foreground">
                  w
                </TableHead>
                <TableHead className="h-8 w-8 text-center font-mono text-[9px] font-extrabold uppercase tracking-[0.26em] text-muted-foreground">
                  l
                </TableHead>
                <TableHead className="h-8 w-10 text-center font-mono text-[9px] font-extrabold uppercase tracking-[0.26em] text-muted-foreground">
                  ±
                </TableHead>
                <TableHead className="h-8 w-12 pr-3 text-right font-mono text-[9px] font-extrabold uppercase tracking-[0.26em] text-primary">
                  pts
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row, i) => {
                const teamIdx = teams.findIndex(t => t.id === row.team.id)
                const color = TEAM_COLORS[teamIdx % TEAM_COLORS.length]
                const diff = row.pointsFor - row.pointsAgainst
                const rank = i + 1
                const medal = MEDALS[i]
                const isTop = i === 0 && row.played > 0
                const mine = myTeamId === row.team.id

                return (
                  <TableRow
                    key={row.team.id}
                    style={{ animationDelay: `${i * 50}ms` }}
                    className={cn(
                      'animate-rise relative border-b border-border/20 last:border-0 transition-colors hover:bg-background/40',
                      isTop && 'bg-primary/5',
                      mine && 'bg-primary/10 hover:bg-primary/15',
                    )}
                  >
                    <TableCell className="relative text-center">
                      {mine && (
                        <span
                          aria-hidden
                          className="pointer-events-none absolute inset-y-0 left-0 w-0.5 bg-primary"
                        />
                      )}
                      <span className="font-score tabular">
                        {medal ? (
                          <span className="text-sm">{medal}</span>
                        ) : (
                          <span className="text-xs font-bold text-muted-foreground">
                            {rank.toString().padStart(2, '0')}
                          </span>
                        )}
                      </span>
                    </TableCell>
                    <TableCell className="py-2.5">
                      <div className="flex min-w-0 items-center gap-2">
                        <span
                          aria-hidden
                          className="size-2 shrink-0 rounded-sm"
                          style={{ background: color }}
                        />
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <p className="truncate font-display text-sm font-extrabold leading-tight tracking-tight">
                              {row.team.name}
                            </p>
                            {mine && (
                              <span className="rounded-sm bg-primary/20 px-1 py-px font-mono text-[8px] font-extrabold uppercase tracking-[0.22em] text-primary">
                                you
                              </span>
                            )}
                          </div>
                          <p className="truncate font-mono text-[9px] uppercase tracking-[0.12em] text-muted-foreground leading-tight">
                            {row.team.players.map(p => p.name).join(' · ') || '—'}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-center font-score text-sm font-bold tabular text-chart-2">
                      {row.wins.toString().padStart(2, '0')}
                    </TableCell>
                    <TableCell className="text-center font-score text-sm font-bold tabular text-muted-foreground">
                      {row.losses.toString().padStart(2, '0')}
                    </TableCell>
                    <TableCell
                      className={cn(
                        'text-center font-score text-xs font-bold tabular',
                        diff > 0
                          ? 'text-chart-2'
                          : diff < 0
                          ? 'text-destructive'
                          : 'text-muted-foreground',
                      )}
                    >
                      {diff > 0 ? `+${diff}` : diff}
                    </TableCell>
                    <TableCell
                      className={cn(
                        'pr-3 text-right font-score text-base font-extrabold tabular',
                        isTop ? 'text-primary' : 'text-foreground',
                      )}
                    >
                      {row.pts.toString().padStart(2, '0')}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
