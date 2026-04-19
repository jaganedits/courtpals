'use client'

import { useEffect, useRef, useState } from 'react'
import { BadgeCheck, Trophy } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { MatchState } from '@/types'

interface Props {
  match: MatchState
  onOpen: () => void
}

/**
 * Compact scoreboard preview rendered at the top of the League tab
 * whenever a match is active. Tapping it jumps to the full Score tab.
 */
export default function LiveMatchBanner({ match, onOpen }: Props) {
  const isPlaying = match.phase === 'playing'
  const isFinished = match.phase === 'finished'
  if (!isPlaying && !isFinished) return null

  const leading =
    match.scores[0] === match.scores[1] ? -1 : match.scores[0] > match.scores[1] ? 0 : 1

  return (
    <button
      type="button"
      onClick={onOpen}
      className={cn(
        'group w-full rounded-2xl border-2 p-3 text-left transition-all hover:scale-[1.01] active:scale-[0.99]',
        isPlaying
          ? 'border-primary bg-primary/10 shadow-brut'
          : 'border-chart-2/40 bg-chart-2/10',
      )}
      aria-label="Open scoreboard"
    >
      <div className="flex items-center gap-2">
        {isPlaying ? (
          <Badge className="animate-live font-display text-[9px] uppercase tracking-[0.2em]">
            live
          </Badge>
        ) : (
          <Badge
            variant="secondary"
            className="gap-1 font-display text-[9px] uppercase tracking-[0.2em] text-chart-2 border-chart-2/30 bg-chart-2/10"
          >
            <Trophy className="size-3" />
            finished
          </Badge>
        )}
        <span className="font-display text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
          first to {match.winTarget}
        </span>
        <MatchTimer
          startTime={match.startTime}
          endTime={match.endTime}
          running={isPlaying}
          className="ml-auto"
        />
      </div>

      <div className="mt-2.5 grid grid-cols-[1fr_auto_1fr] items-center gap-2">
        <TeamSide
          name={match.teamNames[0]}
          emoji={match.teamEmojis[0]}
          score={match.scores[0]}
          leading={leading === 0}
          align="left"
        />
        <span className="font-display text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
          vs
        </span>
        <TeamSide
          name={match.teamNames[1]}
          emoji={match.teamEmojis[1]}
          score={match.scores[1]}
          leading={leading === 1}
          align="right"
        />
      </div>

      <div className="mt-2 flex items-center justify-end gap-1">
        <span className="font-display text-[10px] font-bold uppercase tracking-[0.16em] text-primary opacity-0 transition-opacity group-hover:opacity-100">
          open scoreboard
        </span>
        <BadgeCheck className="size-3.5 text-primary" />
      </div>
    </button>
  )
}

function TeamSide({
  name,
  emoji,
  score,
  leading,
  align,
}: {
  name: string
  emoji: string
  score: number
  leading: boolean
  align: 'left' | 'right'
}) {
  return (
    <div
      className={cn(
        'flex min-w-0 items-center gap-2',
        align === 'right' && 'flex-row-reverse text-right',
      )}
    >
      <span className="text-xl leading-none">{emoji}</span>
      <div className="min-w-0 flex-1">
        <p
          className={cn(
            'truncate font-display text-xs font-extrabold uppercase tracking-[0.12em]',
            leading ? 'text-foreground' : 'text-muted-foreground',
          )}
        >
          {name}
        </p>
        <p
          className={cn(
            'font-score text-3xl font-extrabold leading-none tabular',
            leading ? 'text-primary' : 'text-foreground/70',
          )}
        >
          {score}
        </p>
      </div>
    </div>
  )
}

function MatchTimer({
  startTime,
  endTime,
  running,
  className,
}: {
  startTime: number | null
  endTime: number | null
  running: boolean
  className?: string
}) {
  const [, force] = useState(0)
  const ref = useRef(0)
  useEffect(() => {
    if (!running) return
    const id = window.setInterval(() => {
      ref.current += 1
      force(ref.current)
    }, 1000)
    return () => window.clearInterval(id)
  }, [running])
  if (!startTime) return null
  const end = endTime ?? Date.now()
  const elapsed = Math.max(0, end - startTime)
  const mins = Math.floor(elapsed / 60000)
  const secs = Math.floor((elapsed % 60000) / 1000)
  return (
    <span className={cn('font-score text-xs font-bold tabular text-muted-foreground', className)}>
      {mins.toString().padStart(2, '0')}:{secs.toString().padStart(2, '0')}
    </span>
  )
}
