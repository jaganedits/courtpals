'use client'

import { useEffect, useRef } from 'react'
import { Undo2, X, Timer } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty'
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
import { cn } from '@/lib/utils'
import type { MatchState, MatchAction, TeamIndex } from '@/types'

const SIDES: {
  idx: TeamIndex
  accent: string
  gradient: string
}[] = [
  {
    idx: 0,
    accent: 'var(--color-team-a)',
    gradient: 'linear-gradient(135deg, rgba(255,122,69,0.18), rgba(255,122,69,0.04))',
  },
  {
    idx: 1,
    accent: 'var(--color-team-b)',
    gradient: 'linear-gradient(225deg, rgba(61,220,151,0.18), rgba(61,220,151,0.04))',
  },
]

interface Props {
  state: MatchState
  dispatch: React.Dispatch<MatchAction>
}

export default function ScoreBoard({ state, dispatch }: Props) {
  const isPlaying = state.phase === 'playing'
  const isIdle = state.phase === 'idle'
  const lastScoredRef = useRef<[number | null, number | null]>([null, null])
  const bumpRefs = [useRef<HTMLSpanElement>(null), useRef<HTMLSpanElement>(null)]

  useEffect(() => {
    for (const i of [0, 1] as const) {
      if (lastScoredRef.current[i] !== state.scores[i]) {
        lastScoredRef.current[i] = state.scores[i]
        const el = bumpRefs[i].current
        if (!el) continue
        el.classList.remove('animate-score-bump')
        void el.offsetWidth
        el.classList.add('animate-score-bump')
      }
    }
  }, [state.scores])

  if (isIdle) {
    return (
      <div className="flex min-h-[70vh] items-center px-4 py-12">
        <Empty className="mx-auto max-w-sm border-2">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Timer />
            </EmptyMedia>
            <EmptyTitle className="font-display text-lg font-extrabold">No match in play</EmptyTitle>
            <EmptyDescription>
              Head to the League tab and tap a fixture to start scoring.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      </div>
    )
  }

  const leading =
    state.scores[0] === state.scores[1] ? -1 : state.scores[0] > state.scores[1] ? 0 : 1

  return (
    <div className="flex flex-col gap-4 px-4 pt-6 pb-8">
      <Card className="py-2">
        <CardContent className="flex items-center justify-between px-3 py-1">
          <div className="flex items-center gap-2">
            <Badge className={cn('font-display text-[9px] uppercase tracking-[0.2em]', isPlaying && 'animate-live')}>
              {isPlaying ? 'live' : 'final'}
            </Badge>
            <span className="font-display text-[11px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
              first to {state.winTarget}
            </span>
          </div>
          <MatchTimer startTime={state.startTime} endTime={state.endTime} running={isPlaying} />
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-2.5">
        {([0, 1] as TeamIndex[]).map(ti => {
          const side = SIDES[ti]
          const isLeader = leading === ti
          return (
            <Card
              key={ti}
              role="button"
              aria-disabled={!isPlaying}
              onClick={() => isPlaying && dispatch({ type: 'ADD_POINT', payload: ti })}
              className={cn(
                'relative aspect-[3/4] cursor-pointer overflow-hidden border-2 py-0 text-center transition-all',
                isPlaying ? 'active:scale-[0.97]' : 'cursor-default opacity-70',
              )}
              style={{
                borderColor: isLeader ? side.accent : undefined,
                backgroundImage: side.gradient,
                boxShadow: isLeader ? `0 0 0 2px ${side.accent}, 0 0 24px -4px ${side.accent}80` : undefined,
              }}
            >
              <CardContent className="flex h-full flex-col items-center justify-between p-4">
                <div className="flex w-full flex-col items-center gap-2">
                  <span className="text-4xl leading-none">{state.teamEmojis[ti]}</span>
                  <span
                    className="font-display max-w-full truncate text-xs font-extrabold uppercase tracking-[0.14em]"
                    style={{ color: side.accent }}
                  >
                    {state.teamNames[ti]}
                  </span>
                </div>

                <span
                  ref={bumpRefs[ti]}
                  className="font-score text-[96px] font-extrabold leading-none tabular"
                  style={{ textShadow: `0 0 40px color-mix(in srgb, ${side.accent} 30%, transparent)` }}
                >
                  {state.scores[ti]}
                </span>

                <Badge variant="outline" className="font-display text-[10px] uppercase tracking-[0.2em]">
                  {isPlaying ? 'tap to score' : 'final'}
                </Badge>
              </CardContent>

              <span
                aria-hidden
                className="pointer-events-none absolute -top-6 -right-6 size-16 rounded-full opacity-40"
                style={{ background: `radial-gradient(circle, ${side.accent}, transparent 70%)` }}
              />
            </Card>
          )
        })}
      </div>

      <div className="grid grid-cols-2 gap-2.5">
        <Button
          variant="outline"
          size="lg"
          onClick={() => dispatch({ type: 'UNDO' })}
          disabled={state.events.length === 0 || !isPlaying}
          className="h-auto py-3 font-display text-xs font-bold uppercase tracking-[0.16em]"
        >
          <Undo2 data-icon="inline-start" />
          Undo
        </Button>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="outline"
              size="lg"
              className="h-auto py-3 font-display text-xs font-bold uppercase tracking-[0.16em] hover:text-destructive hover:border-destructive/40"
            >
              <X data-icon="inline-start" />
              Abandon
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="font-display">Abandon this match?</AlertDialogTitle>
              <AlertDialogDescription>
                Scores will be lost and the fixture will remain pending.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Keep playing</AlertDialogCancel>
              <AlertDialogAction onClick={() => dispatch({ type: 'RESET' })}>
                Abandon match
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      {state.events.length > 0 && (
        <section className="flex flex-col gap-2">
          <p className="font-display text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground px-1">
            rally log
          </p>
          <div className="flex flex-wrap gap-1">
            {state.events.slice(-16).map(ev => (
              <Badge
                key={ev.id}
                variant="outline"
                className="font-score text-[10px] font-bold tabular"
                style={{
                  color: ev.team === 0 ? 'var(--color-team-a)' : 'var(--color-team-b)',
                  borderColor: 'var(--border)',
                }}
              >
                {ev.scoreAfter[0]}–{ev.scoreAfter[1]}
              </Badge>
            ))}
          </div>
        </section>
      )}
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
  const ref = useRef<HTMLSpanElement>(null)
  useEffect(() => {
    if (!startTime) return
    const update = () => {
      if (!ref.current) return
      const end = endTime ?? Date.now()
      const elapsed = Math.max(0, end - startTime)
      const mins = Math.floor(elapsed / 60000)
      const secs = Math.floor((elapsed % 60000) / 1000)
      ref.current.textContent = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }
    update()
    if (!running) return
    const id = setInterval(update, 1000)
    return () => clearInterval(id)
  }, [startTime, endTime, running])

  return (
    <span ref={ref} className="font-score text-xs font-bold tabular text-muted-foreground">
      00:00
    </span>
  )
}
