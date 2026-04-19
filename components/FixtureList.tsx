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

const ROUND_LABELS: Record<Round, { title: string; mono: string }> = {
  rr: { title: 'Round robin', mono: 'RR' },
  semi: { title: 'Semi-finals', mono: 'SF' },
  final: { title: 'Final', mono: 'F' },
  '3rd': { title: '3rd-place', mono: '3RD' },
}

function roundNumber(round: Round, indexInRound: number): string {
  switch (round) {
    case 'rr':
      return (indexInRound + 1).toString().padStart(2, '0')
    case 'semi':
      return `SF${indexInRound + 1}`
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
  canEdit?: boolean
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

  const grouped = ROUND_ORDER
    .map(round => ({ round, list: fixtures.filter(f => f.round === round) }))
    .filter(g => g.list.length > 0)

  const hasPlayoffs = grouped.some(g => g.round !== 'rr')

  return (
    <div className="flex flex-col gap-6 px-4 pt-6 pb-8">
      <header className="flex flex-col gap-2">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="font-mono text-[9px] font-bold uppercase tracking-[0.32em] text-muted-foreground">
              {hasPlayoffs ? 'today / schedule' : 'group stage'}
            </p>
            <h1 className="font-display text-3xl font-extrabold leading-none tracking-tight">
              Fixtures
            </h1>
          </div>
          <div className="flex items-baseline gap-1 font-score tabular">
            <span className="text-2xl font-extrabold">{done.toString().padStart(2, '0')}</span>
            <span className="text-base font-bold text-muted-foreground/50">/</span>
            <span className="text-base font-bold text-muted-foreground">{total.toString().padStart(2, '0')}</span>
          </div>
        </div>
        <Progress value={progressPct} className="h-0.5" />
      </header>

      {grouped.map((group, gi) => {
        const groupDone = group.list.filter(f => f.status === 'done').length
        const label = ROUND_LABELS[group.round]
        const isPlayoff = group.round !== 'rr'

        return (
          <section key={group.round} className="flex flex-col gap-2.5">
            <div className="flex items-baseline justify-between border-b border-border/30 pb-1.5">
              <div className="flex items-baseline gap-2.5">
                <span
                  className={cn(
                    'font-mono text-[9px] font-bold uppercase tracking-[0.32em]',
                    isPlayoff ? 'text-primary' : 'text-muted-foreground',
                  )}
                >
                  [{label.mono}]
                </span>
                <h2
                  className={cn(
                    'font-display text-base font-extrabold uppercase leading-none tracking-[0.08em]',
                    isPlayoff && 'text-primary',
                  )}
                >
                  {label.title}
                </h2>
              </div>
              <span className="font-mono text-[10px] font-bold tabular text-muted-foreground">
                {groupDone.toString().padStart(2, '0')}
                <span className="text-muted-foreground/40">/{group.list.length.toString().padStart(2, '0')}</span>
              </span>
            </div>

            <div className="flex flex-col gap-2">
              {group.list.map((f, i) => (
                <MatchCard
                  key={f.id}
                  fixture={f}
                  teams={teams}
                  code={roundNumber(group.round, i)}
                  isPlayoff={isPlayoff}
                  canEdit={canEdit}
                  myTeamId={myTeamId}
                  onStart={onStartFixture}
                  onReset={onResetFixture}
                  animationDelay={(gi * 4 + i) * 40}
                />
              ))}
            </div>
          </section>
        )
      })}
    </div>
  )
}

// ─── Match card (per fixture) ────────────────────────────────────────────────

function MatchCard({
  fixture: f,
  teams,
  code,
  isPlayoff,
  canEdit,
  myTeamId,
  onStart,
  onReset,
  animationDelay,
}: {
  fixture: Fixture
  teams: SessionTeam[]
  code: string
  isPlayoff: boolean
  canEdit: boolean
  myTeamId: string | null
  onStart: (id: string) => void
  onReset?: (id: string) => void
  animationDelay: number
}) {
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

  return (
    <Card
      onClick={() => canStart && onStart(f.id)}
      role={canStart ? 'button' : undefined}
      aria-disabled={!canStart}
      style={{ animationDelay: `${animationDelay}ms` }}
      className={cn(
        'animate-rise overflow-hidden rounded-md border border-border/40 bg-card py-0 transition-colors',
        canStart && 'cursor-pointer hover:border-primary/50 hover:bg-background',
        isActive && 'border-destructive/70',
        isPlayoff && !isActive && 'border-primary/30',
      )}
    >
      {/* Header rail */}
      <div
        className={cn(
          'flex items-center justify-between border-b border-border/30 px-3 py-1.5',
          isActive && 'border-destructive/30 bg-destructive/10',
          isPlayoff && !isActive && 'bg-primary/5',
        )}
      >
        <div className="flex items-center gap-2">
          <span
            className={cn(
              'font-mono text-[9px] font-bold uppercase tracking-[0.3em]',
              isPlayoff ? 'text-primary' : 'text-muted-foreground',
            )}
          >
            match
          </span>
          <span
            className={cn(
              'font-score text-sm font-extrabold leading-none tabular',
              isPlayoff ? 'text-primary' : 'text-foreground',
            )}
          >
            {code}
          </span>
        </div>
        {isActive ? (
          <div className="flex items-center gap-1.5">
            <span className="relative flex size-1.5">
              <span className="absolute inline-flex size-1.5 animate-ping rounded-full bg-destructive opacity-75" />
              <span className="relative inline-flex size-1.5 rounded-full bg-destructive" />
            </span>
            <span className="font-mono text-[9px] font-extrabold uppercase tracking-[0.3em] text-destructive">
              LIVE
            </span>
          </div>
        ) : isDone ? (
          <div className="flex items-center gap-1">
            <Badge
              variant="outline"
              className="h-5 rounded-sm border-chart-2/40 bg-chart-2/10 px-1.5 font-mono text-[9px] font-extrabold uppercase tracking-[0.22em] text-chart-2"
            >
              FINAL
            </Badge>
            {onReset && canEdit && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Reset this match"
                    onClick={e => e.stopPropagation()}
                    className="size-5 text-muted-foreground/60 hover:text-destructive"
                  >
                    <RotateCcw className="size-3" />
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
                        ? 'The semi\u2019s result will be cleared. The Final and 3rd-place match (if generated) will be removed.'
                        : 'The match will be cleared and the session returns to playoffs so you can replay it.'}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={() => onReset(f.id)}>
                      Reset match
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        ) : null}
      </div>

      {/* Body — stacked team rows */}
      <div className="flex flex-col divide-y divide-border/20">
        <TeamRow
          team={tA}
          color={colorA}
          score={isDone ? f.scoreA : null}
          winner={isWinnerA}
          loser={isDone && !isWinnerA}
          isMine={Boolean(myTeamId && f.teamAId === myTeamId)}
        />
        <TeamRow
          team={tB}
          color={colorB}
          score={isDone ? f.scoreB : null}
          winner={isWinnerB}
          loser={isDone && !isWinnerB}
          isMine={Boolean(myTeamId && f.teamBId === myTeamId)}
        />
      </div>
    </Card>
  )
}

// ─── Team row (inside a match card) ──────────────────────────────────────────

function TeamRow({
  team,
  color,
  score,
  winner,
  loser,
  isMine,
}: {
  team: SessionTeam
  color: string
  score: number | null
  winner: boolean
  loser: boolean
  isMine: boolean
}) {
  return (
    <div
      className={cn(
        'flex items-center gap-3 px-3 py-2.5',
        loser && 'opacity-55',
      )}
    >
      <span
        aria-hidden
        className="size-2.5 shrink-0 rounded-sm"
        style={{ background: color }}
      />
      <div className="flex min-w-0 flex-1 items-center gap-1.5">
        <h3 className="font-display truncate text-base font-extrabold leading-none tracking-tight">
          {team.name}
        </h3>
        {winner && <Trophy className="size-3.5 shrink-0 text-primary" />}
        {isMine && (
          <span className="rounded-sm bg-primary/20 px-1 py-px font-mono text-[9px] font-extrabold uppercase tracking-[0.22em] text-primary">
            you
          </span>
        )}
      </div>
      {score !== null && (
        <span
          className={cn(
            'font-score text-2xl font-extrabold leading-none tabular',
            winner ? 'text-foreground' : 'text-muted-foreground/50',
          )}
        >
          {score}
        </span>
      )}
    </div>
  )
}
