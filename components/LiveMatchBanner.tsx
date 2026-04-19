'use client'

import { useEffect, useRef, useState } from 'react'
import { Radio, Trophy, ChevronRight } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { MatchState } from '@/types'

interface Props {
  match: MatchState
  onOpen: () => void
}

/**
 * Broadcast-style scoreboard card. Goes above the fixtures list while any
 * match is live or freshly finished. Tap to jump to the Score tab.
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
        'group relative block w-full overflow-hidden rounded-2xl border-2 text-left transition-all',
        isPlaying
          ? 'border-destructive bg-destructive/5 shadow-[0_0_0_2px_rgba(239,68,68,0.12),0_0_48px_-4px_rgba(239,68,68,0.35)] hover:shadow-[0_0_0_2px_rgba(239,68,68,0.2),0_0_64px_-4px_rgba(239,68,68,0.5)]'
          : 'border-chart-2/50 bg-chart-2/5 hover:bg-chart-2/10',
      )}
    >
      {/* Scanline overlay */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            'repeating-linear-gradient(0deg, transparent 0px, transparent 3px, rgba(255,255,255,0.025) 3px, rgba(255,255,255,0.025) 4px)',
        }}
      />

      {/* Corner chevron */}
      <div
        aria-hidden
        className={cn(
          'pointer-events-none absolute -top-px right-0 flex h-6 w-24 items-center justify-center',
          isPlaying ? 'bg-destructive' : 'bg-chart-2',
        )}
        style={{ clipPath: 'polygon(10% 0, 100% 0, 100% 100%, 0 100%)' }}
      >
        <span className="flex items-center gap-1 font-mono text-[9px] font-extrabold uppercase tracking-[0.28em] text-background">
          {isPlaying ? (
            <>
              <Radio className="size-2.5" />
              on air
            </>
          ) : (
            <>
              <Trophy className="size-2.5" />
              final
            </>
          )}
        </span>
      </div>

      {/* Animated running strip on the top edge while playing */}
      {isPlaying && (
        <span
          aria-hidden
          className="pointer-events-none absolute left-0 right-24 top-0 h-[2px] overflow-hidden"
        >
          <span className="block h-full w-1/3 animate-[live-strip_2.2s_linear_infinite] bg-gradient-to-r from-transparent via-destructive to-transparent" />
        </span>
      )}

      <div className="relative p-4">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span
              className={cn(
                'font-mono text-[9px] font-extrabold uppercase tracking-[0.3em]',
                isPlaying ? 'text-destructive' : 'text-chart-2',
              )}
            >
              {isPlaying ? 'LIVE BROADCAST' : 'MATCH COMPLETE'}
            </span>
            <span className="h-3 w-px bg-border" />
            <span className="font-mono text-[9px] font-bold uppercase tracking-[0.22em] text-muted-foreground">
              first to {match.winTarget}
            </span>
          </div>
          <MatchTimer
            startTime={match.startTime}
            endTime={match.endTime}
            running={isPlaying}
          />
        </div>

        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
          <TeamSide
            name={match.teamNames[0]}
            emoji={match.teamEmojis[0]}
            score={match.scores[0]}
            leading={leading === 0}
            align="left"
            accent={isPlaying ? 'rgb(239,68,68)' : 'rgb(61,220,151)'}
          />

          <div className="flex flex-col items-center gap-1 self-stretch justify-center">
            <span className="h-6 w-px bg-border" />
            <span className="font-mono text-[9px] font-extrabold uppercase tracking-[0.26em] text-muted-foreground/70">
              vs
            </span>
            <span className="h-6 w-px bg-border" />
          </div>

          <TeamSide
            name={match.teamNames[1]}
            emoji={match.teamEmojis[1]}
            score={match.scores[1]}
            leading={leading === 1}
            align="right"
            accent={isPlaying ? 'rgb(239,68,68)' : 'rgb(61,220,151)'}
          />
        </div>

        <div className="mt-3 flex items-center justify-end gap-1 text-[10px]">
          <span className="font-mono font-bold uppercase tracking-[0.22em] text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100">
            open scoreboard
          </span>
          <ChevronRight className="size-3.5 text-primary transition-transform group-hover:translate-x-0.5" />
        </div>
      </div>

      <Badge className="sr-only">
        {isPlaying ? 'Live' : 'Finished'}
      </Badge>

      <style jsx>{`
        @keyframes live-strip {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(400%);
          }
        }
      `}</style>
    </button>
  )
}

function TeamSide({
  name,
  emoji,
  score,
  leading,
  align,
  accent,
}: {
  name: string
  emoji: string
  score: number
  leading: boolean
  align: 'left' | 'right'
  accent: string
}) {
  return (
    <div
      className={cn(
        'flex min-w-0 items-center gap-3',
        align === 'right' && 'flex-row-reverse text-right',
      )}
    >
      <span
        className="flex size-10 shrink-0 items-center justify-center rounded-lg border-2 text-xl"
        style={{
          borderColor: leading ? accent : 'var(--border)',
          background: leading ? `color-mix(in srgb, ${accent} 14%, transparent)` : undefined,
          boxShadow: leading ? `0 0 24px -4px ${accent}` : undefined,
        }}
      >
        {emoji}
      </span>
      <div className={cn('min-w-0 flex-1', align === 'right' ? 'text-right' : 'text-left')}>
        <p
          className={cn(
            'font-mono truncate text-[9px] font-bold uppercase tracking-[0.22em]',
            leading ? 'text-foreground' : 'text-muted-foreground',
          )}
        >
          {name}
        </p>
        <p
          className={cn(
            'font-score text-4xl font-extrabold leading-none tabular',
            leading ? 'text-foreground' : 'text-muted-foreground/70',
          )}
          style={leading ? { textShadow: `0 0 32px ${accent}, 0 0 4px ${accent}` } : undefined}
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
    <span className="flex items-baseline gap-1 font-score text-sm font-extrabold tabular">
      <span className="text-muted-foreground/70">T</span>
      <span>{mins.toString().padStart(2, '0')}</span>
      <span className="text-muted-foreground/50">:</span>
      <span>{secs.toString().padStart(2, '0')}</span>
    </span>
  )
}
