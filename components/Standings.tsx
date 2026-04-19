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
}

export default function Standings({ teams, fixtures }: Props) {
  const rows = rankStandings(teams, fixtures)
  const anyDone = rows.some(r => r.played > 0)

  return (
    <div className="flex flex-col gap-4 px-4 pt-6 pb-8">
      <header>
        <p className="font-display text-[10px] font-bold uppercase tracking-[0.22em] text-muted-foreground">
          today&apos;s table
        </p>
        <h1 className="font-display text-3xl font-extrabold leading-none">Standings</h1>
        {!anyDone && (
          <p className="mt-1.5 text-sm text-muted-foreground">
            No matches played yet. Finish a match to populate the table.
          </p>
        )}
      </header>

      <Card className="overflow-hidden py-0">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-b-2 border-border">
                <TableHead className="w-10 font-display text-[9px] font-bold uppercase tracking-[0.18em]"></TableHead>
                <TableHead className="font-display text-[9px] font-bold uppercase tracking-[0.18em]">team</TableHead>
                <TableHead className="w-8 text-center font-display text-[9px] font-bold uppercase tracking-[0.18em]">W</TableHead>
                <TableHead className="w-8 text-center font-display text-[9px] font-bold uppercase tracking-[0.18em]">L</TableHead>
                <TableHead className="w-10 text-center font-display text-[9px] font-bold uppercase tracking-[0.18em]">±</TableHead>
                <TableHead className="w-12 text-right font-display text-[9px] font-bold uppercase tracking-[0.18em]">pts</TableHead>
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

                return (
                  <TableRow
                    key={row.team.id}
                    style={{ animationDelay: `${i * 50}ms` }}
                    className={cn('animate-rise', isTop && 'bg-primary/5')}
                  >
                    <TableCell className="text-center">
                      <span className="font-score text-sm font-extrabold tabular">
                        {medal ? (
                          <span className="text-base">{medal}</span>
                        ) : (
                          <span className="text-muted-foreground">{rank}</span>
                        )}
                      </span>
                    </TableCell>
                    <TableCell className="py-3">
                      <div className="flex min-w-0 items-center gap-2">
                        <span
                          aria-hidden
                          className="h-6 w-1 shrink-0 rounded-full"
                          style={{ background: color }}
                        />
                        <div className="min-w-0">
                          <p className="truncate font-display text-sm font-extrabold leading-tight">
                            {row.team.name}
                          </p>
                          <p className="truncate text-[10px] text-muted-foreground leading-tight">
                            {row.team.players.map(p => p.name).join(' · ') || '—'}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-center font-score text-sm font-bold text-chart-2 tabular">
                      {row.wins}
                    </TableCell>
                    <TableCell className="text-center font-score text-sm font-bold text-muted-foreground tabular">
                      {row.losses}
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
                        'text-right font-score text-lg font-extrabold tabular',
                        isTop ? 'text-primary' : 'text-foreground',
                      )}
                    >
                      {row.pts}
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
