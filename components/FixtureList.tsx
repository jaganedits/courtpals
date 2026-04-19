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
      {/* ── HEADER ────────────────────────────────────────────── */}
      <header className="flex flex-col gap-2.5">
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
            <span className="text-2xl font-extrabold text-foreground">
              {done.toString().padStart(2, '0')}
            </span>
            <span className="text-lg font-bold text-muted-foreground/60">/</span>
            <span className="text-lg font-bold text-muted-foreground">
              {total.toString().padStart(2, '0')}
            </span>
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

            <div className="flex flex-col">
              {group.list.map((f, i) => (
                <MatchRow
                  key={f.id}
                  fixture={f}
                  index={i}
                  teams={teams}
                  rankMap={rankMap}
                  anyRRDone={anyRRDone}
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

// ─── Match row (scoreboard panel) ────────────────────────────────────────────

function MatchRow({
  fixture: f,
  index,
  teams,
  rankMap,
  anyRRDone,
  code,
  isPlayoff,
  canEdit,
  myTeamId,
  onStart,
  onReset,
  animationDelay,
}: {
  fixture: Fixture
  index: number
  teams: SessionTeam[]
  rankMap: Map<string, number>
  anyRRDone: boolean
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
  const mine = Boolean(myTeamId && (f.teamAId === myTeamId || f.teamBId === myTeamId))

  return (
    <Card
      onClick={() => canStart && onStart(f.id)}
      role={canStart ? 'button' : undefined}
      aria-disabled={!canStart}
      style={{ animationDelay: `${animationDelay}ms` }}
      className={cn(
        'animate-rise relative -mb-px overflow-hidden rounded-none border border-border/30 bg-card py-0 transition-colors',
        'first:rounded-t-md last:rounded-b-md last:mb-0',
        canStart && 'cursor-pointer hover:bg-background hover:z-10 hover:border-primary/50',
        isActive && 'z-10 border-destructive/80 bg-destructive/[0.04]',
        mine && !isActive && 'bg-primary/[0.04]',
      )}
    >
      {/* Team colour flags at the extreme edges (not full pillars) */}
      <span aria-hidden className="pointer-events-none absolute inset-y-0 left-0 w-1" style={{ background: colorA }} />
      <span aria-hidden className="pointer-events-none absolute inset-y-0 right-0 w-1" style={{ background: colorB }} />

      <CardContent className="relative grid grid-cols-[56px_1fr_auto_1fr_auto] items-center gap-3 p-3 pl-4 pr-4">
        {/* Match code */}
        <div className="flex flex-col items-start gap-0.5 border-r border-border/30 pr-3">
          <span className="font-mono text-[9px] font-bold uppercase tracking-[0.22em] text-muted-foreground/70">
            match
          </span>
          <span
            className={cn(
              'font-score text-xl font-extrabold leading-none tabular',
              isPlayoff ? 'text-primary' : 'text-foreground',
            )}
          >
            {code}
          </span>
        </div>

        <TeamCell
          team={tA}
          players={tA.players}
          color={colorA}
          align="left"
          rank={anyRRDone ? rankMap.get(f.teamAId) ?? null : null}
          winner={isWinnerA}
          loser={isDone && !isWinnerA}
          isMine={mine && f.teamAId === myTeamId}
        />

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

        <TeamCell
          team={tB}
          players={tB.players}
          color={colorB}
          align="right"
          rank={anyRRDone ? rankMap.get(f.teamBId) ?? null : null}
          winner={isWinnerB}
          loser={isDone && !isWinnerB}
          isMine={mine && f.teamBId === myTeamId}
        />

        <StatusPill isActive={isActive} isDone={isDone} mine={mine} canStart={canStart} />
      </CardContent>
    </Card>
  )
}

// ─── Team cell ───────────────────────────────────────────────────────────────

function TeamCell({
  team,
  players,
  color,
  align,
  rank,
  winner,
  loser,
  isMine,
}: {
  team: SessionTeam
  players: SessionPlayer[]
  color: string
  align: 'left' | 'right'
  rank: number | null
  winner: boolean
  loser: boolean
  isMine: boolean
}) {
  return (
    <div
      className={cn(
        'flex min-w-0 flex-col gap-1',
        align === 'right' && 'items-end text-right',
        loser && 'opacity-55',
      )}
    >
      <div
        className={cn(
          'flex items-baseline gap-1.5',
          align === 'right' && 'flex-row-reverse',
        )}
      >
        {rank !== null && (
          <span
            className={cn(
              'font-mono inline-flex h-[14px] min-w-[14px] items-center justify-center border px-0.5 text-[9px] font-extrabold tabular leading-none',
              rank === 1
                ? 'border-primary/50 bg-primary/10 text-primary'
                : 'border-border/50 text-muted-foreground',
            )}
          >
            {rank}
          </span>
        )}
        <h3
          className={cn(
            'font-display truncate text-base font-extrabold leading-none tracking-tight',
            winner && 'text-foreground',
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

// ─── Center scoreline ────────────────────────────────────────────────────────

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
      <div className="flex min-w-[80px] flex-col items-center gap-0.5 rounded-sm border border-destructive/40 bg-destructive/10 px-2 py-1">
        <span className="relative flex size-1.5">
          <span className="absolute inline-flex size-1.5 animate-ping rounded-full bg-destructive opacity-75" />
          <span className="relative inline-flex size-1.5 rounded-full bg-destructive" />
        </span>
        <span className="font-mono text-[9px] font-extrabold uppercase tracking-[0.28em] text-destructive">
          LIVE
        </span>
      </div>
    )
  }

  if (isDone && scoreA !== null && scoreB !== null) {
    return (
      <div className="flex items-center gap-1 rounded-sm border border-border/50 bg-background/60 px-3 py-1">
        <span
          className={cn(
            'font-score text-2xl font-extrabold leading-none tabular',
            winnerSide === 'A' ? 'text-foreground' : 'text-muted-foreground/60',
          )}
        >
          {scoreA}
        </span>
        <span className="font-score text-sm font-bold text-muted-foreground/40">:</span>
        <span
          className={cn(
            'font-score text-2xl font-extrabold leading-none tabular',
            winnerSide === 'B' ? 'text-foreground' : 'text-muted-foreground/60',
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
                className="ml-1 size-5 text-muted-foreground hover:text-destructive"
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
    <span className="font-mono text-[10px] font-extrabold uppercase tracking-[0.3em] text-muted-foreground/50">
      vs
    </span>
  )
}

// ─── Right-edge status pill ──────────────────────────────────────────────────

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
      <Badge className="justify-self-end h-5 gap-1 rounded-sm bg-destructive text-destructive-foreground hover:bg-destructive px-1.5 font-mono text-[9px] font-extrabold uppercase tracking-[0.22em]">
        ON AIR
      </Badge>
    )
  }
  if (isDone) {
    return (
      <Badge
        variant="outline"
        className="justify-self-end h-5 gap-1 rounded-sm border-chart-2/40 bg-chart-2/10 px-1.5 font-mono text-[9px] font-extrabold uppercase tracking-[0.22em] text-chart-2"
      >
        FINAL
      </Badge>
    )
  }
  if (canStart) {
    return (
      <Badge
        variant="outline"
        className="justify-self-end h-5 gap-1 rounded-sm border-primary/40 bg-primary/5 px-1.5 font-mono text-[9px] font-extrabold uppercase tracking-[0.22em] text-primary"
      >
        TAP
      </Badge>
    )
  }
  if (mine) {
    return (
      <Badge
        variant="outline"
        className="justify-self-end h-5 gap-1 rounded-sm border-primary/30 bg-primary/5 px-1.5 font-mono text-[9px] font-extrabold uppercase tracking-[0.22em] text-primary"
      >
        YOU
      </Badge>
    )
  }
  return (
    <Badge
      variant="outline"
      className="justify-self-end h-5 gap-1 rounded-sm border-border/40 px-1.5 font-mono text-[9px] font-extrabold uppercase tracking-[0.22em] text-muted-foreground/60"
    >
      QUEUED
    </Badge>
  )
}

// ─── Player pill ─────────────────────────────────────────────────────────────

function PlayerPill({ player, color }: { player: SessionPlayer; color: string }) {
  return (
    <span
      className="inline-flex items-center gap-1 rounded-sm border border-border/40 bg-background/70 pl-0.5 pr-1.5 py-0.5"
      style={{ boxShadow: `inset 2px 0 0 0 ${color}` }}
    >
      {player.photoURL ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={player.photoURL}
          alt=""
          className="size-4 rounded-full"
          referrerPolicy="no-referrer"
        />
      ) : (
        <span
          aria-hidden
          className="flex size-4 items-center justify-center rounded-full text-[10px] leading-none"
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
