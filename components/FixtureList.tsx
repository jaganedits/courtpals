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
import type { Fixture, Round, SessionPlayer, SessionTeam } from '@/types'

const TEAM_COLORS = [
  'var(--color-team-a)',
  'var(--color-team-b)',
  'var(--color-team-c)',
  'var(--color-team-d)',
  'var(--color-team-e)',
  'var(--color-team-f)',
]

const ROUND_ORDER: Round[] = ['rr', 'semi', '3rd', 'final']

const ROUND_LABELS: Record<Round, { eyebrow: string; title: string; mono: string }> = {
  rr: { eyebrow: 'group stage', title: 'Round robin', mono: 'RR' },
  semi: { eyebrow: 'knockout', title: 'Semi-finals', mono: 'SF' },
  final: { eyebrow: 'the decider', title: 'Final', mono: 'F' },
  '3rd': { eyebrow: 'bronze match', title: '3rd-place', mono: '3RD' },
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
        <Progress value={progressPct} className="h-[2px]" />
      </header>

      {grouped.map((group, gi) => {
        const groupDone = group.list.filter(f => f.status === 'done').length
        const label = ROUND_LABELS[group.round]
        const isPlayoff = group.round !== 'rr'

        return (
          <section key={group.round} className="flex flex-col gap-2">
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

            <Card className="overflow-hidden rounded-md border border-border/40 bg-card py-0">
              <CardContent className="p-0">
                {group.list.map((f, i) => (
                  <MatchRow
                    key={f.id}
                    fixture={f}
                    teams={teams}
                    code={roundNumber(group.round, i)}
                    isPlayoff={isPlayoff}
                    canEdit={canEdit}
                    myTeamId={myTeamId}
                    onStart={onStartFixture}
                    onReset={onResetFixture}
                    isFirst={i === 0}
                    isLast={i === group.list.length - 1}
                    animationDelay={(gi * 4 + i) * 40}
                  />
                ))}
              </CardContent>
            </Card>
          </section>
        )
      })}
    </div>
  )
}

// ─── Match row ───────────────────────────────────────────────────────────────

function MatchRow({
  fixture: f,
  teams,
  code,
  isPlayoff,
  canEdit,
  myTeamId,
  onStart,
  onReset,
  isFirst,
  isLast,
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
  isFirst: boolean
  isLast: boolean
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
  const mine = Boolean(myTeamId && (f.teamAId === myTeamId || f.teamBId === myTeamId))

  return (
    <div
      onClick={() => canStart && onStart(f.id)}
      role={canStart ? 'button' : undefined}
      aria-disabled={!canStart}
      style={{ animationDelay: `${animationDelay}ms` }}
      className={cn(
        'animate-rise relative grid grid-cols-[auto_1fr_auto_1fr_auto] items-center gap-4 px-4 py-3',
        !isFirst && 'border-t border-border/25',
        canStart && 'cursor-pointer transition-colors hover:bg-background/50',
        isActive && 'bg-destructive/5',
        mine && !isActive && 'bg-primary/5',
      )}
    >
      {/* Match code (left) */}
      <div className="flex flex-col items-start">
        <span className="font-mono text-[9px] font-bold uppercase tracking-[0.22em] text-muted-foreground/60">
          match
        </span>
        <span
          className={cn(
            'font-score text-lg font-extrabold leading-none tabular',
            isPlayoff ? 'text-primary' : 'text-foreground',
          )}
        >
          {code}
        </span>
      </div>

      {/* Team A */}
      <TeamCell
        team={tA}
        players={tA.players}
        color={colorA}
        align="left"
        winner={isWinnerA}
        loser={isDone && !isWinnerA}
        isMine={mine && f.teamAId === myTeamId}
      />

      {/* Centre scoreline */}
      <Scoreline
        scoreA={isDone ? f.scoreA : null}
        scoreB={isDone ? f.scoreB : null}
        winnerSide={isWinnerA ? 'A' : isWinnerB ? 'B' : null}
        isActive={isActive}
        isDone={isDone}
        canEdit={canEdit}
        onReset={onReset ? () => onReset(f.id) : undefined}
        round={f.round}
      />

      {/* Team B */}
      <TeamCell
        team={tB}
        players={tB.players}
        color={colorB}
        align="right"
        winner={isWinnerB}
        loser={isDone && !isWinnerB}
        isMine={mine && f.teamBId === myTeamId}
      />

      {/* Status pill (right) */}
      <StatusPill isActive={isActive} isDone={isDone} mine={mine} canStart={canStart} />
    </div>
  )
}

// ─── Team cell ───────────────────────────────────────────────────────────────

function TeamCell({
  team,
  players,
  color,
  align,
  winner,
  loser,
  isMine,
}: {
  team: SessionTeam
  players: SessionPlayer[]
  color: string
  align: 'left' | 'right'
  winner: boolean
  loser: boolean
  isMine: boolean
}) {
  return (
    <div
      className={cn(
        'flex min-w-0 flex-col gap-1',
        align === 'right' && 'items-end text-right',
        loser && 'opacity-50',
      )}
    >
      <div
        className={cn(
          'flex items-baseline gap-1.5',
          align === 'right' && 'flex-row-reverse',
        )}
      >
        <h3
          className={cn(
            'font-display truncate text-base font-extrabold leading-none tracking-tight',
          )}
        >
          {team.name}
        </h3>
        {winner && <Trophy className="size-3 shrink-0 text-primary" />}
        {isMine && (
          <span className="rounded-sm bg-primary/20 px-1 py-px font-mono text-[8px] font-extrabold uppercase tracking-[0.22em] text-primary">
            you
          </span>
        )}
      </div>
      <div
        className={cn(
          'flex flex-wrap items-center gap-1',
          align === 'right' && 'justify-end',
        )}
      >
        {players.map(p => (
          <PlayerPill key={p.id} player={p} color={color} />
        ))}
      </div>
    </div>
  )
}

// ─── Centre scoreline ────────────────────────────────────────────────────────

function Scoreline({
  scoreA,
  scoreB,
  winnerSide,
  isActive,
  isDone,
  canEdit,
  onReset,
  round,
}: {
  scoreA: number | null
  scoreB: number | null
  winnerSide: 'A' | 'B' | null
  isActive: boolean
  isDone: boolean
  canEdit: boolean
  onReset?: () => void
  round: Round
}) {
  if (isActive) {
    return (
      <div className="flex items-center gap-2">
        <span className="relative flex size-1.5">
          <span className="absolute inline-flex size-1.5 animate-ping rounded-full bg-destructive opacity-75" />
          <span className="relative inline-flex size-1.5 rounded-full bg-destructive" />
        </span>
        <span className="font-mono text-[10px] font-extrabold uppercase tracking-[0.3em] text-destructive">
          LIVE
        </span>
      </div>
    )
  }

  if (isDone && scoreA !== null && scoreB !== null) {
    return (
      <div className="flex items-center gap-2">
        <span
          className={cn(
            'font-score text-2xl font-extrabold leading-none tabular',
            winnerSide === 'A' ? 'text-foreground' : 'text-muted-foreground/50',
          )}
        >
          {scoreA}
        </span>
        <span className="font-score text-base font-bold text-muted-foreground/40">–</span>
        <span
          className={cn(
            'font-score text-2xl font-extrabold leading-none tabular',
            winnerSide === 'B' ? 'text-foreground' : 'text-muted-foreground/50',
          )}
        >
          {scoreB}
        </span>
        {onReset && canEdit && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="Reset this match"
                onClick={e => e.stopPropagation()}
                className="ml-1 size-5 text-muted-foreground/60 hover:text-destructive"
              >
                <RotateCcw className="size-3" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle className="font-display">Reset this match?</AlertDialogTitle>
                <AlertDialogDescription>
                  {round === 'rr'
                    ? 'The score and winner will be cleared. Any playoff fixtures that depend on the RR standings will be discarded so you can re-seed.'
                    : round === 'semi'
                    ? 'The semi\u2019s result will be cleared. The Final and 3rd-place match (if generated) will be removed.'
                    : 'The match will be cleared and the session returns to playoffs so you can replay it.'}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={onReset}>Reset match</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>
    )
  }

  return (
    <span className="font-mono text-[10px] font-extrabold uppercase tracking-[0.32em] text-muted-foreground/40">
      vs
    </span>
  )
}

// ─── Status pill (right) ─────────────────────────────────────────────────────

function StatusPill({
  isActive,
  isDone,
  mine,
  canStart,
}: {
  isActive: boolean
  isDone: boolean
  mine: boolean
  canStart: boolean
}) {
  if (isActive) {
    return (
      <Badge className="h-5 rounded-sm bg-destructive px-1.5 font-mono text-[9px] font-extrabold uppercase tracking-[0.22em] text-destructive-foreground hover:bg-destructive">
        ON AIR
      </Badge>
    )
  }
  if (isDone) {
    return (
      <Badge
        variant="outline"
        className="h-5 rounded-sm border-chart-2/40 bg-chart-2/10 px-1.5 font-mono text-[9px] font-extrabold uppercase tracking-[0.22em] text-chart-2"
      >
        FINAL
      </Badge>
    )
  }
  if (canStart) {
    return (
      <Badge
        variant="outline"
        className="h-5 rounded-sm border-primary/40 bg-primary/[0.06] px-1.5 font-mono text-[9px] font-extrabold uppercase tracking-[0.22em] text-primary"
      >
        TAP
      </Badge>
    )
  }
  if (mine) {
    return (
      <Badge
        variant="outline"
        className="h-5 rounded-sm border-primary/30 px-1.5 font-mono text-[9px] font-extrabold uppercase tracking-[0.22em] text-primary"
      >
        YOU
      </Badge>
    )
  }
  return (
    <Badge
      variant="outline"
      className="h-5 rounded-sm border-border/40 px-1.5 font-mono text-[9px] font-extrabold uppercase tracking-[0.22em] text-muted-foreground/50"
    >
      QUEUED
    </Badge>
  )
}

// ─── Player pill ─────────────────────────────────────────────────────────────

function PlayerPill({ player, color }: { player: SessionPlayer; color: string }) {
  return (
    <span
      className="inline-flex items-center gap-1 rounded-sm border border-border/40 bg-background/60 pl-0.5 pr-1.5 py-0.5"
      style={{ boxShadow: `inset 2px 0 0 0 ${color}` }}
    >
      {player.photoURL ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={player.photoURL}
          alt=""
          className="size-3.5 rounded-full"
          referrerPolicy="no-referrer"
        />
      ) : (
        <span
          aria-hidden
          className="flex size-3.5 items-center justify-center rounded-full text-[9px] leading-none"
          style={{ background: `color-mix(in srgb, ${color} 20%, transparent)` }}
        >
          {player.emoji}
        </span>
      )}
      <span className="font-mono max-w-20 truncate text-[9px] font-extrabold uppercase tracking-[0.08em]">
        {player.name}
      </span>
    </span>
  )
}
