'use client'

import type { CSSProperties } from 'react'
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

  const cardStyle: CSSProperties = {
    backgroundImage: [
      'radial-gradient(120% 100% at 0% 0%, color-mix(in srgb, var(--primary) 10%, transparent) 0%, transparent 55%)',
      'repeating-linear-gradient(0deg, transparent 0px, transparent 3px, rgba(255,255,255,0.012) 3px, rgba(255,255,255,0.012) 4px)',
      'linear-gradient(180deg, rgba(5,13,28,0.85) 0%, rgba(5,13,28,0.95) 100%)',
    ].join(', '),
  }

  return (
    <div className="flex flex-col gap-4 px-4 pt-6 pb-8">
      <header>
        <p className="font-mono text-[10px] font-bold uppercase tracking-[0.32em] text-primary/80">
          // live telemetry
        </p>
        <h1 className="font-display text-4xl font-extrabold leading-[0.9] tracking-tight">
          Standings
        </h1>
        {!anyDone && (
          <p className="mt-1.5 font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-muted-foreground">
            awaiting first result · table populates after any match finishes
          </p>
        )}
      </header>

      <Card className="relative overflow-hidden border-2 border-border/40 py-0" style={cardStyle}>
        {/* diagonal stripe behind the leader row */}
        {anyDone && (
          <span
            aria-hidden
            className="pointer-events-none absolute left-0 right-0 top-[44px] h-10 opacity-40"
            style={{
              backgroundImage:
                'repeating-linear-gradient(135deg, transparent 0px, transparent 6px, color-mix(in srgb, var(--primary) 8%, transparent) 6px, color-mix(in srgb, var(--primary) 8%, transparent) 7px)',
            }}
          />
        )}

        <CardContent className="relative p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-b-2 border-border/60 hover:bg-transparent">
                <TableHead className="w-12 text-center font-mono text-[9px] font-extrabold uppercase tracking-[0.26em] text-muted-foreground">
                  pos
                </TableHead>
                <TableHead className="font-mono text-[9px] font-extrabold uppercase tracking-[0.26em] text-muted-foreground">
                  team
                </TableHead>
                <TableHead className="w-9 text-center font-mono text-[9px] font-extrabold uppercase tracking-[0.26em] text-muted-foreground">
                  w
                </TableHead>
                <TableHead className="w-9 text-center font-mono text-[9px] font-extrabold uppercase tracking-[0.26em] text-muted-foreground">
                  l
                </TableHead>
                <TableHead className="w-12 text-center font-mono text-[9px] font-extrabold uppercase tracking-[0.26em] text-muted-foreground">
                  ±
                </TableHead>
                <TableHead className="w-14 text-right pr-4 font-mono text-[9px] font-extrabold uppercase tracking-[0.26em] text-primary">
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
                      'animate-rise border-b border-border/25 transition-colors',
                      isTop && 'bg-primary/[0.04]',
                      mine && 'bg-primary/15 shadow-[inset_3px_0_0_0_var(--primary)]',
                    )}
                  >
                    <TableCell className="relative text-center">
                      {mine && (
                        <span
                          aria-hidden
                          className="pointer-events-none absolute inset-y-0 left-0 w-1"
                          style={{ background: color, boxShadow: `0 0 12px ${color}` }}
                        />
                      )}
                      <span className="font-score text-sm font-extrabold tabular">
                        {medal ? (
                          <span className="text-base">{medal}</span>
                        ) : (
                          <span className="text-muted-foreground/70">
                            {rank.toString().padStart(2, '0')}
                          </span>
                        )}
                      </span>
                    </TableCell>
                    <TableCell className="py-3">
                      <div className="flex min-w-0 items-center gap-2">
                        <span
                          aria-hidden
                          className="size-2.5 shrink-0 rounded-sm"
                          style={{ background: color, boxShadow: `0 0 8px ${color}` }}
                        />
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <p
                              className="truncate font-display text-sm font-extrabold leading-tight tracking-tight"
                              style={
                                isTop
                                  ? { textShadow: `0 0 20px color-mix(in srgb, ${color} 60%, transparent)` }
                                  : undefined
                              }
                            >
                              {row.team.name}
                            </p>
                            {mine && (
                              <span className="rounded-sm border border-primary/60 bg-primary/20 px-1 py-px font-mono text-[8px] font-extrabold uppercase tracking-[0.22em] text-primary">
                                you
                              </span>
                            )}
                          </div>
                          <p className="truncate font-mono text-[9px] uppercase tracking-[0.14em] text-muted-foreground leading-tight">
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
                        'text-right pr-4 font-score text-lg font-extrabold tabular',
                        isTop ? 'text-primary' : 'text-foreground',
                      )}
                      style={
                        isTop
                          ? { textShadow: `0 0 20px color-mix(in srgb, var(--primary) 70%, transparent)` }
                          : undefined
                      }
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
