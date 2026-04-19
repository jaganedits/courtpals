'use client'

import { useEffect, useRef, useState } from 'react'
import { ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { MatchState } from '@/types'

interface Props {
  match: MatchState
  onOpen: () => void
}

/**
 * Flat scoreboard panel. Sits above the fixture list while any match is live
 * or freshly finished. Tap to jump to the Score tab.
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
      aria-label="Open scoreboard"
      className={cn(
        'group relative block w-full overflow-hidden rounded-md border bg-card text-left transition-colors',
        isPlaying
          ? 'border-destructive/70'
          : 'border-chart-2/50',
      )}
    >
      {/* Top status rail */}
      <div
        className={cn(
          'flex items-center justify-between border-b px-3 py-1.5',
          isPlaying ? 'border-destructive/40 bg-destructive/10' : 'border-chart-2/30 bg-chart-2/10',
        )}
      >
        <div className="flex items-center gap-2">
          {isPlaying ? (
            <span className="relative flex size-1.5">
              <span className="absolute inline-flex size-1.5 animate-ping rounded-full bg-destructive opacity-75" />
              <span className="relative inline-flex size-1.5 rounded-full bg-destructive" />
            </span>
          ) : (
            <span className="inline-flex size-1.5 rounded-full bg-chart-2" />
          )}
          <span
            className={cn(
              'font-mono text-[9px] font-extrabold uppercase tracking-[0.3em]',
              isPlaying ? 'text-destructive' : 'text-chart-2',
            )}
          >
            {isPlaying ? 'LIVE BROADCAST' : 'FINAL'}
          </span>
          <span className="h-3 w-px bg-border/60" />
          <span className="font-mono text-[9px] font-bold uppercase tracking-[0.22em] text-muted-foreground">
            first to {match.winTarget}
          </span>
        </div>
        <MatchTimer startTime={match.startTime} endTime={match.endTime} running={isPlaying} />
      </div>

      {/* Scoreboard body */}
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 px-4 py-3">
        <TeamSide
          name={match.teamNames[0]}
          emoji={match.teamEmojis[0]}
          score={match.scores[0]}
          leading={leading === 0}
          align="left"
        />

        <span className="font-mono text-[10px] font-extrabold uppercase tracking-[0.3em] text-muted-foreground/50">
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

      {/* Footer hint */}
      <div className="flex items-center justify-end gap-1 border-t border-border/30 bg-background/40 px-3 py-1">
        <span className="font-mono text-[9px] font-bold uppercase tracking-[0.22em] text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100">
          open scoreboard
        </span>
        <ChevronRight className="size-3 text-primary transition-transform group-hover:translate-x-0.5" />
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
        'flex min-w-0 items-center gap-3',
        align === 'right' && 'flex-row-reverse text-right',
      )}
    >
      <span className="flex size-8 shrink-0 items-center justify-center rounded-sm border border-border/50 bg-background/60 text-lg">
        {emoji}
      </span>
      <div className={cn('min-w-0 flex-1', align === 'right' ? 'text-right' : 'text-left')}>
        <p className="font-mono truncate text-[9px] font-bold uppercase tracking-[0.22em] text-muted-foreground">
          {name}
        </p>
        <p
          className={cn(
            'font-score text-3xl font-extrabold leading-none tabular',
            leading ? 'text-foreground' : 'text-muted-foreground/60',
          )}
        >
          {score.toString().padStart(2, '0')}
        </p>
      </div>
    </div>
  )
}

function MatchTimer({
  startTime,
  endTime,
  running,
}: {
  startTime: number | null
  endTime: number | null
  running: boolean
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
    <span className="font-score text-xs font-extrabold tabular text-muted-foreground">
      {mins.toString().padStart(2, '0')}
      <span className="text-muted-foreground/40">:</span>
      {secs.toString().padStart(2, '0')}
    </span>
  )
}
