'use client'

import type { CSSProperties } from 'react'
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
import { RotateCcw, Trophy, Radio } from 'lucide-react'
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
      {/* ── BROADCAST HEADER ──────────────────────────────────────── */}
      <header className="relative flex flex-col gap-3">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="font-mono text-[10px] font-bold uppercase tracking-[0.32em] text-primary/80">
              {hasPlayoffs ? '// today\u2019s broadcast' : '// group stage'}
            </p>
            <h1 className="font-display text-4xl font-extrabold leading-[0.9] tracking-tight">
              Fixtures
            </h1>
          </div>
          <div className="flex flex-col items-end">
            <span className="font-mono text-[9px] font-bold uppercase tracking-[0.28em] text-muted-foreground">
              played
            </span>
            <span className="font-score text-3xl font-extrabold leading-none tabular text-primary">
              {done.toString().padStart(2, '0')}
              <span className="text-xl text-muted-foreground">/{total.toString().padStart(2, '0')}</span>
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Progress value={progressPct} className="h-0.5 flex-1" />
          <span className="font-mono text-[9px] font-bold uppercase tracking-[0.3em] text-muted-foreground tabular">
            {Math.round(progressPct).toString().padStart(2, '0')}%
          </span>
        </div>
      </header>

      {grouped.map((group, gi) => {
        const groupDone = group.list.filter(f => f.status === 'done').length
        const label = ROUND_LABELS[group.round]
        const isPlayoff = group.round !== 'rr'

        return (
          <section key={group.round} className="flex flex-col gap-3">
            <div className="flex items-end justify-between border-b border-border/40 pb-1.5">
              <div className="flex items-baseline gap-3">
                <span
                  className={cn(
                    'font-mono text-[9px] font-bold uppercase tracking-[0.3em]',
                    isPlayoff ? 'text-primary' : 'text-muted-foreground',
                  )}
                >
                  {label.eyebrow}
                </span>
                <h2
                  className={cn(
                    'font-display text-xl font-extrabold leading-none tracking-tight',
                    isPlayoff && 'text-primary',
                  )}
                >
                  {label.title}
                </h2>
              </div>
              <span className="font-mono text-[10px] font-bold tabular text-muted-foreground">
                {groupDone.toString().padStart(2, '0')}
                <span className="text-muted-foreground/50">/{group.list.length.toString().padStart(2, '0')}</span>
              </span>
            </div>

            <div className="flex flex-col gap-2.5">
              {group.list.map((f, i) => (
                <MatchCard
                  key={f.id}
                  fixture={f}
                  index={i}
                  teams={teams}
                  rankMap={rankMap}
                  anyRRDone={anyRRDone}
                  code={roundChip(group.round, i)}
                  round={group.round}
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

// ─── Match card ──────────────────────────────────────────────────────────────

function MatchCard({
  fixture: f,
  index,
  teams,
  rankMap,
  anyRRDone,
  code,
  round,
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
  round: Round
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

  const cardStyle: CSSProperties = {
    animationDelay: `${animationDelay}ms`,
    backgroundImage: [
      `radial-gradient(120% 140% at 0% 50%, color-mix(in srgb, ${colorA} 28%, transparent) 0%, transparent 55%)`,
      `radial-gradient(120% 140% at 100% 50%, color-mix(in srgb, ${colorB} 28%, transparent) 0%, transparent 55%)`,
      'repeating-linear-gradient(0deg, transparent 0px, transparent 3px, rgba(255,255,255,0.012) 3px, rgba(255,255,255,0.012) 4px)',
      'linear-gradient(180deg, rgba(5,13,28,0.85) 0%, rgba(5,13,28,0.95) 100%)',
    ].join(', '),
  }

  return (
    <Card
      onClick={() => canStart && onStart(f.id)}
      role={canStart ? 'button' : undefined}
      aria-disabled={!canStart}
      style={cardStyle}
      className={cn(
        'group animate-rise relative gap-0 overflow-hidden border border-border/30 py-0 transition-all',
        canStart && 'cursor-pointer hover:border-primary/40 hover:-translate-y-0.5 hover:shadow-[0_8px_32px_-8px_rgba(199,242,56,0.2)]',
        isActive && 'border-destructive/80 shadow-[0_0_0_1px_rgba(239,68,68,0.4),0_0_40px_-4px_rgba(239,68,68,0.5)]',
        !canStart && !isActive && 'opacity-95',
        isPlayoff && !isActive && 'border-primary/30',
      )}
    >
      {/* Left team light pillar */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-y-0 left-0 w-[3px]"
        style={{
          background: colorA,
          boxShadow: `0 0 18px ${colorA}, 0 0 6px ${colorA}`,
        }}
      />
      {/* Right team light pillar */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-y-0 right-0 w-[3px]"
        style={{
          background: colorB,
          boxShadow: `0 0 18px ${colorB}, 0 0 6px ${colorB}`,
        }}
      />

      {/* Status crest — top-right chevron */}
      <StatusCrest isActive={isActive} isDone={isDone} mine={mine} />

      <CardContent className="relative flex items-stretch gap-0 p-0">
        {/* Match code block — chevron clipped */}
        <div
          className={cn(
            'flex w-14 shrink-0 flex-col items-center justify-center border-r border-border/30 bg-background/40 px-2 py-3',
            isPlayoff && 'border-primary/30 bg-primary/5',
          )}
          style={{
            clipPath: 'polygon(0 0, 100% 0, 100% 82%, 85% 100%, 0 100%)',
          }}
        >
          <span
            className={cn(
              'font-mono text-[8px] font-bold uppercase tracking-[0.28em]',
              isPlayoff ? 'text-primary/80' : 'text-muted-foreground',
            )}
          >
            {round === 'rr' ? 'MATCH' : round === 'semi' ? 'SEMI' : round === 'final' ? 'FINAL' : '3RD'}
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

        {/* Teams + scoreline */}
        <div className="grid flex-1 grid-cols-[1fr_auto_1fr] items-center gap-3 px-4 py-3">
          <TeamColumn
            team={tA}
            players={tA.players}
            color={colorA}
            align="left"
            rank={anyRRDone ? rankMap.get(f.teamAId) ?? null : null}
            winner={isWinnerA}
            loser={isDone && !isWinnerA}
            score={isDone ? f.scoreA : null}
            isActive={isActive}
            mine={mine && f.teamAId === myTeamId}
          />

          <MatchBadge
            isActive={isActive}
            isDone={isDone}
            canEdit={canEdit}
            onReset={onReset && isDone ? () => onReset(f.id) : undefined}
            round={round}
          />

          <TeamColumn
            team={tB}
            players={tB.players}
            color={colorB}
            align="right"
            rank={anyRRDone ? rankMap.get(f.teamBId) ?? null : null}
            winner={isWinnerB}
            loser={isDone && !isWinnerB}
            score={isDone ? f.scoreB : null}
            isActive={isActive}
            mine={mine && f.teamBId === myTeamId}
          />
        </div>
      </CardContent>
    </Card>
  )
}

// ─── Team column ─────────────────────────────────────────────────────────────

function TeamColumn({
  team,
  players,
  color,
  align,
  rank,
  winner,
  loser,
  score,
  isActive,
  mine,
}: {
  team: SessionTeam
  players: SessionPlayer[]
  color: string
  align: 'left' | 'right'
  rank: number | null
  winner: boolean
  loser: boolean
  score: number | null
  isActive: boolean
  mine: boolean
}) {
  return (
    <div
      className={cn(
        'flex min-w-0 flex-col gap-1.5',
        align === 'right' && 'items-end text-right',
        loser && 'opacity-55',
      )}
    >
      <div
        className={cn(
          'flex items-baseline gap-2',
          align === 'right' && 'flex-row-reverse',
        )}
      >
        {rank !== null && (
          <span
            className={cn(
              'font-mono inline-flex size-5 items-center justify-center rounded-sm border text-[10px] font-extrabold tabular',
              rank === 1
                ? 'border-primary/60 bg-primary/15 text-primary'
                : 'border-border/60 bg-background/60 text-muted-foreground',
            )}
          >
            {rank}
          </span>
        )}
        <h3
          className={cn(
            'font-display truncate text-base font-extrabold leading-none tracking-tight',
            winner && 'text-primary',
          )}
          style={winner ? { textShadow: `0 0 24px color-mix(in srgb, ${color} 60%, transparent)` } : undefined}
        >
          {team.name}
        </h3>
        {winner && <Trophy className="size-3.5 shrink-0 text-primary" />}
        {mine && (
          <span
            className="rounded-sm border border-primary/50 bg-primary/20 px-1 py-px font-mono text-[8px] font-extrabold uppercase tracking-[0.22em] text-primary"
          >
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
          <PlayerAvatarChip key={p.id} player={p} color={color} />
        ))}
      </div>

      {score !== null && (
        <div
          className={cn(
            'flex items-baseline gap-1.5',
            align === 'right' && 'flex-row-reverse',
          )}
        >
          <span
            className={cn(
              'font-score text-3xl font-extrabold leading-none tabular',
              winner ? 'text-primary' : 'text-muted-foreground',
            )}
            style={
              winner
                ? { textShadow: `0 0 32px color-mix(in srgb, ${color} 70%, transparent), 0 0 4px ${color}` }
                : undefined
            }
          >
            {score}
          </span>
          <span className="font-mono text-[9px] font-bold uppercase tracking-[0.2em] text-muted-foreground/60">
            pts
          </span>
        </div>
      )}

      {isActive && score === null && (
        <span className="font-mono text-[9px] font-bold uppercase tracking-[0.24em] text-destructive">
          ◉ scoring in progress
        </span>
      )}
    </div>
  )
}

// ─── Center divider ──────────────────────────────────────────────────────────

function MatchBadge({
  isActive,
  isDone,
  canEdit,
  onReset,
  round,
}: {
  isActive: boolean
  isDone: boolean
  canEdit: boolean
  onReset?: () => void
  round: Round
}) {
  return (
    <div className="flex shrink-0 flex-col items-center gap-1 px-1">
      {isActive ? (
        <div className="flex flex-col items-center gap-0.5">
          <span className="relative flex size-2">
            <span className="absolute inline-flex size-2 animate-ping rounded-full bg-destructive opacity-75" />
            <span className="relative inline-flex size-2 rounded-full bg-destructive" />
          </span>
          <span className="font-mono text-[10px] font-extrabold uppercase tracking-[0.28em] text-destructive">
            LIVE
          </span>
        </div>
      ) : isDone ? (
        <div className="flex items-center gap-1">
          <Badge
            variant="outline"
            className="gap-1 border-chart-2/40 bg-chart-2/10 font-mono text-[9px] font-bold uppercase tracking-[0.24em] text-chart-2"
          >
            final
          </Badge>
          {onReset && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Reset this match"
                  onClick={e => e.stopPropagation()}
                  className="size-5 text-muted-foreground hover:text-destructive"
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
      ) : (
        <span className="font-mono text-[10px] font-extrabold uppercase tracking-[0.26em] text-muted-foreground/60">
          VS
        </span>
      )}
    </div>
  )
}

// ─── Status crest (top-right chevron) ───────────────────────────────────────

function StatusCrest({
  isActive,
  isDone,
  mine,
}: {
  isActive: boolean
  isDone: boolean
  mine: boolean
}) {
  if (isActive) {
    return (
      <div
        aria-hidden
        className="pointer-events-none absolute right-0 top-0 flex h-5 w-16 items-center justify-center bg-destructive"
        style={{ clipPath: 'polygon(12% 0, 100% 0, 100% 100%, 0 100%)' }}
      >
        <span className="flex items-center gap-1 font-mono text-[8px] font-extrabold uppercase tracking-[0.28em] text-destructive-foreground">
          <Radio className="size-2.5" />
          on air
        </span>
      </div>
    )
  }
  if (isDone) {
    return (
      <div
        aria-hidden
        className="pointer-events-none absolute right-0 top-0 flex h-5 w-14 items-center justify-center bg-chart-2/80"
        style={{ clipPath: 'polygon(12% 0, 100% 0, 100% 100%, 0 100%)' }}
      >
        <span className="font-mono text-[8px] font-extrabold uppercase tracking-[0.28em] text-background">
          result
        </span>
      </div>
    )
  }
  if (mine) {
    return (
      <div
        aria-hidden
        className="pointer-events-none absolute right-0 top-0 flex h-5 w-14 items-center justify-center bg-primary"
        style={{ clipPath: 'polygon(12% 0, 100% 0, 100% 100%, 0 100%)' }}
      >
        <span className="font-mono text-[8px] font-extrabold uppercase tracking-[0.28em] text-primary-foreground">
          you
        </span>
      </div>
    )
  }
  return null
}

// ─── Player avatar chip ──────────────────────────────────────────────────────

function PlayerAvatarChip({ player, color }: { player: SessionPlayer; color: string }) {
  return (
    <span
      className="group/chip inline-flex items-center gap-1.5 rounded-sm border bg-background/80 pl-0.5 pr-1.5 py-0.5 backdrop-blur-sm transition-colors hover:bg-background"
      style={{
        borderColor: `color-mix(in srgb, ${color} 55%, transparent)`,
        boxShadow: `inset 2px 0 0 0 ${color}`,
      }}
    >
      {player.photoURL ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={player.photoURL}
          alt=""
          className="size-4 rounded-full ring-1 ring-border/40"
          referrerPolicy="no-referrer"
        />
      ) : (
        <span
          aria-hidden
          className="flex size-4 items-center justify-center rounded-full text-[10px] leading-none"
          style={{
            background: `color-mix(in srgb, ${color} 35%, transparent)`,
            boxShadow: `inset 0 0 0 1px ${color}`,
          }}
        >
          {player.emoji}
        </span>
      )}
      <span className="font-mono max-w-20 truncate text-[10px] font-bold uppercase tracking-[0.06em]">
        {player.name}
      </span>
    </span>
  )
}
