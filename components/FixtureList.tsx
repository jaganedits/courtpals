'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { RotateCcw, Trophy } from 'lucide-react'
import { cn } from '@/lib/utils'
import { rankStandings } from '@/hooks/useSession'
import type { Fixture, Round, SessionTeam } from '@/types'

const TEAM_COLORS = [
  'var(--color-team-a)',
  'var(--color-team-b)',
  'var(--color-team-c)',
  'var(--color-team-d)',
  'var(--color-team-e)',
  'var(--color-team-f)',
]

const ROUND_ORDER: Round[] = ['rr', 'semi', '3rd', 'final']

const ROUND_LABELS: Record<Round, { eyebrow: string; title: string }> = {
  rr: { eyebrow: 'group stage', title: 'Round robin' },
  semi: { eyebrow: 'knockout', title: 'Semi-finals' },
  final: { eyebrow: 'the decider', title: 'Final' },
  '3rd': { eyebrow: 'bronze match', title: '3rd-place' },
}

function roundChip(round: Round, indexInRound: number): string {
  switch (round) {
    case 'rr':
      return (indexInRound + 1).toString().padStart(2, '0')
    case 'semi':
      return `S${indexInRound + 1}`
    case 'final':
      return 'F'
    case '3rd':
      return '3RD'
  }
}

interface Props {
  fixtures: Fixture[]
  teams: SessionTeam[]
  onStartFixture: (fixtureId: string) => void
  onResetFixture?: (fixtureId: string) => void
  /** Non-creators see the fixtures but cannot tap to start or reset them. */
  canEdit?: boolean
  /** When set, fixtures involving this team get a personal "you" highlight. */
  myTeamId?: string | null
}

function teamIndex(teams: SessionTeam[], id: string): number {
  return teams.findIndex(t => t.id === id)
}

function teamById(teams: SessionTeam[], id: string): SessionTeam {
  return teams.find(t => t.id === id) ?? { id, name: '—', players: [] }
}

export default function FixtureList({
  fixtures,
  teams,
  onStartFixture,
  onResetFixture,
  canEdit = true,
  myTeamId = null,
}: Props) {
  const done = fixtures.filter(f => f.status === 'done').length
  const total = fixtures.length
  const progressPct = total === 0 ? 0 : (done / total) * 100

  const standings = rankStandings(teams, fixtures)
  const anyRRDone = standings.some(r => r.played > 0)
  const rankMap = new Map<string, number>()
  standings.forEach((row, i) => rankMap.set(row.team.id, i + 1))

  const grouped = ROUND_ORDER
    .map(round => ({ round, list: fixtures.filter(f => f.round === round) }))
    .filter(g => g.list.length > 0)

  const hasPlayoffs = grouped.some(g => g.round !== 'rr')

  return (
    <div className="flex flex-col gap-6 px-4 pt-6 pb-8">
      <header className="flex flex-col gap-3">
        <div className="flex items-baseline justify-between">
          <div>
            <p className="font-display text-[10px] font-bold uppercase tracking-[0.22em] text-muted-foreground">
              {hasPlayoffs ? 'today\u2019s schedule' : 'group stage'}
            </p>
            <h1 className="font-display text-3xl font-extrabold leading-none">Fixtures</h1>
          </div>
          <div className="font-score flex items-baseline gap-1 text-primary">
            <span className="text-2xl font-extrabold leading-none tabular">{done}</span>
            <span className="font-display text-[11px] font-bold text-muted-foreground">
              / {total}
            </span>
          </div>
        </div>
        <Progress value={progressPct} className="h-1.5" />
      </header>

      {grouped.map((group, gi) => {
        const groupDone = group.list.filter(f => f.status === 'done').length
        const label = ROUND_LABELS[group.round]

        return (
          <section key={group.round} className="flex flex-col gap-2.5">
            <div className="flex items-baseline justify-between">
              <div className="flex items-baseline gap-2">
                <p className="font-display text-[10px] font-bold uppercase tracking-[0.22em] text-muted-foreground">
                  {label.eyebrow}
                </p>
                <h2 className="font-display text-lg font-extrabold leading-none">
                  {label.title}
                </h2>
              </div>
              <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-muted-foreground tabular">
                {groupDone}/{group.list.length}
              </span>
            </div>

            {group.list.map((f, i) => {
              const tA = teamById(teams, f.teamAId)
              const tB = teamById(teams, f.teamBId)
              const iA = teamIndex(teams, f.teamAId)
              const iB = teamIndex(teams, f.teamBId)
              const colorA = TEAM_COLORS[iA % TEAM_COLORS.length]
              const colorB = TEAM_COLORS[iB % TEAM_COLORS.length]
              const canStart = canEdit && f.status === 'pending'
              const isActive = f.status === 'active'
              const isDone = f.status === 'done'
              const isWinnerA = isDone && f.winnerId === f.teamAId
              const isWinnerB = isDone && f.winnerId === f.teamBId
              const chip = roundChip(group.round, i)
              const mine = Boolean(
                myTeamId && (f.teamAId === myTeamId || f.teamBId === myTeamId),
              )

              return (
                <Card
                  key={f.id}
                  onClick={() => canStart && onStartFixture(f.id)}
                  role={canStart ? 'button' : undefined}
                  aria-disabled={!canStart}
                  style={{ animationDelay: `${(gi * 4 + i) * 40}ms` }}
                  className={cn(
                    'animate-rise gap-0 overflow-hidden border-2 py-0 transition-all',
                    isActive && 'border-destructive ring-2 ring-destructive/50',
                    canStart && 'cursor-pointer hover:border-primary/40 active:scale-[0.99]',
                    !canStart && !isActive && 'opacity-80',
                    group.round !== 'rr' && !isActive && 'border-primary/40',
                    mine && !isActive && 'border-primary/70 bg-primary/5 ring-1 ring-primary/30',
                  )}
                >
                  <CardContent className="flex items-stretch p-0">
                    <div
                      className={cn(
                        'flex w-10 flex-col items-center justify-center border-r border-border',
                        group.round === 'rr' ? 'bg-muted' : 'bg-primary/10',
                      )}
                    >
                      <span className="font-mono text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
                        {group.round === 'rr' ? 'M' : ''}
                      </span>
                      <span
                        className={cn(
                          'font-score text-sm font-extrabold tabular',
                          group.round === 'rr' ? 'text-muted-foreground' : 'text-primary',
                        )}
                      >
                        {chip}
                      </span>
                    </div>

                    <div className="flex flex-1 items-center gap-2 p-2.5">
                      <TeamSide
                        team={tA}
                        color={colorA}
                        align="left"
                        score={isDone ? f.scoreA : null}
                        winner={isWinnerA}
                        dim={isDone && !isWinnerA}
                        rank={anyRRDone ? rankMap.get(f.teamAId) ?? null : null}
                      />

                      <div className="flex shrink-0 flex-col items-center gap-1 px-1">
                        {mine && (
                          <Badge
                            variant="secondary"
                            className="font-display text-[9px] uppercase tracking-[0.16em] text-primary border-primary/40 bg-primary/15"
                          >
                            you
                          </Badge>
                        )}
                        {isActive ? (
                          <Badge className="animate-live font-display text-[9px] uppercase tracking-[0.16em] bg-destructive text-destructive-foreground hover:bg-destructive">
                            live
                          </Badge>
                        ) : isDone ? (
                          <div className="flex items-center gap-1">
                            <Badge
                              variant="secondary"
                              className="font-display text-[9px] uppercase tracking-[0.18em] text-chart-2 border-chart-2/30 bg-chart-2/10"
                            >
                              final
                            </Badge>
                            {onResetFixture && (
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon-sm"
                                    aria-label="Reset this match"
                                    onClick={e => e.stopPropagation()}
                                    className="size-6 text-muted-foreground hover:text-destructive"
                                  >
                                    <RotateCcw className="size-3.5" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle className="font-display">
                                      Reset this match?
                                    </AlertDialogTitle>
                                    <AlertDialogDescription>
                                      {f.round === 'rr'
                                        ? 'The score and winner will be cleared. Any playoff fixtures that depend on the RR standings will be discarded so you can re-seed.'
                                        : f.round === 'semi'
                                        ? 'The semi\u2019s result will be cleared. The Final and 3rd-place match (if generated) will be removed, and you can replay this semi.'
                                        : 'The match will be cleared and the session returns to playoffs so you can replay it.'}
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => onResetFixture(f.id)}>
                                      Reset match
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            )}
                          </div>
                        ) : (
                          <Badge variant="outline" className="font-display text-[10px] uppercase tracking-[0.18em]">
                            vs
                          </Badge>
                        )}
                      </div>

                      <TeamSide
                        team={tB}
                        color={colorB}
                        align="right"
                        score={isDone ? f.scoreB : null}
                        winner={isWinnerB}
                        dim={isDone && !isWinnerB}
                        rank={anyRRDone ? rankMap.get(f.teamBId) ?? null : null}
                      />
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </section>
        )
      })}
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
  rank,
}: {
  team: SessionTeam
  color: string
  align: 'left' | 'right'
  score: number | null
  winner: boolean
  dim: boolean
  rank: number | null
}) {
  return (
    <div
      className={cn(
        'flex min-w-0 flex-1 items-center gap-2',
        align === 'right' && 'flex-row-reverse text-right',
        dim && 'opacity-45',
      )}
    >
      <span
        aria-hidden
        className="h-6 w-1 shrink-0 rounded-full"
        style={{ background: color }}
      />
      <div className="min-w-0 flex-1">
        <div className={cn('flex items-baseline gap-1.5', align === 'right' && 'flex-row-reverse')}>
          {rank !== null && (
            <span
              className={cn(
                'font-score shrink-0 text-[10px] font-extrabold tabular',
                rank === 1 ? 'text-primary' : 'text-muted-foreground',
              )}
            >
              #{rank}
            </span>
          )}
          <span className="font-display text-sm font-extrabold truncate">{team.name}</span>
          {winner && <Trophy className="size-3.5 text-primary" />}
        </div>
        <p className={cn('truncate text-[10px] text-muted-foreground', align === 'right' && 'text-right')}>
          {team.players.map(p => p.name).join(' · ')}
        </p>
      </div>
      {score !== null && (
        <span
          className={cn(
            'font-score shrink-0 text-2xl font-extrabold leading-none tabular',
            winner ? 'text-primary' : 'text-muted-foreground',
          )}
        >
          {score}
        </span>
      )}
    </div>
  )
}
