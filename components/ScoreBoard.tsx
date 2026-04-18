'use client'

import { useEffect, useRef } from 'react'
import type { MatchState, MatchAction, TeamIndex } from '@/types'

const SIDES: {
  idx: TeamIndex
  bg: string
  accent: string
  ring: string
  gradient: string
}[] = [
  {
    idx: 0,
    bg: 'bg-[var(--color-card)]',
    accent: 'var(--color-team-a)',
    ring: 'shadow-[0_0_0_2px_var(--color-team-a),inset_0_0_0_1px_rgba(255,122,69,0.25)]',
    gradient: 'linear-gradient(135deg, rgba(255,122,69,0.18), rgba(255,122,69,0.04))',
  },
  {
    idx: 1,
    bg: 'bg-[var(--color-card)]',
    accent: 'var(--color-team-b)',
    ring: 'shadow-[0_0_0_2px_var(--color-team-b),inset_0_0_0_1px_rgba(61,220,151,0.25)]',
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
        // force reflow
        void el.offsetWidth
        el.classList.add('animate-score-bump')
      }
    }
  }, [state.scores])

  if (isIdle) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center px-4 py-12 text-center">
        <p className="text-5xl mb-4">🏸</p>
        <p className="font-display text-lg font-extrabold text-[var(--color-chalk)]">
          No match in play
        </p>
        <p className="mt-2 text-sm text-[var(--color-ink-soft)] max-w-xs">
          Head to the League tab and tap a fixture to start scoring.
        </p>
      </div>
    )
  }

  const leading =
    state.scores[0] === state.scores[1] ? -1 : state.scores[0] > state.scores[1] ? 0 : 1

  return (
    <div className="flex flex-col gap-4 px-4 pt-6 pb-8">
      {/* Match ribbon */}
      <div className="flex items-center justify-between rounded-xl border-2 border-[var(--color-line)] bg-[var(--color-card)] px-3 py-2">
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-[var(--color-lime)]/15 px-2 py-0.5 font-display text-[9px] font-extrabold uppercase tracking-[0.2em] text-[var(--color-lime)]">
            {isPlaying ? 'live' : 'final'}
          </span>
          <span className="font-display text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--color-ink-soft)]">
            first to {state.winTarget}
          </span>
        </div>
        <MatchTimer startTime={state.startTime} endTime={state.endTime} running={isPlaying} />
      </div>

      {/* Score tap cards */}
      <div className="grid grid-cols-2 gap-2.5">
        {([0, 1] as TeamIndex[]).map(ti => {
          const side = SIDES[ti]
          const isLeader = leading === ti
          return (
            <button
              key={ti}
              disabled={!isPlaying}
              onClick={() => dispatch({ type: 'ADD_POINT', payload: ti })}
              className={`group relative flex aspect-[3/4] flex-col items-center justify-between overflow-hidden rounded-2xl border-2 p-4 text-center transition-all ${side.bg} ${
                isLeader ? side.ring : 'border-[var(--color-line)]'
              } ${!isPlaying ? 'opacity-70' : 'active:scale-[0.97]'}`}
              style={{ borderColor: isLeader ? side.accent : undefined, backgroundImage: side.gradient }}
            >
              {/* Header */}
              <div className="flex w-full flex-col items-center">
                <span className="text-4xl leading-none">{state.teamEmojis[ti]}</span>
                <span className="mt-2 max-w-full truncate font-display text-xs font-extrabold uppercase tracking-[0.14em]" style={{ color: side.accent }}>
                  {state.teamNames[ti]}
                </span>
              </div>

              {/* Score */}
              <span
                ref={bumpRefs[ti]}
                className="font-score text-[96px] font-extrabold leading-none tabular text-[var(--color-chalk)]"
                style={{ textShadow: `0 0 40px color-mix(in srgb, ${side.accent} 30%, transparent)` }}
              >
                {state.scores[ti]}
              </span>

              {/* Footer hint */}
              {isPlaying ? (
                <span className="font-display text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--color-ink-dim)] group-active:text-[var(--color-chalk)]">
                  tap to score
                </span>
              ) : (
                <span className="font-display text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--color-ink-dim)]">
                  final
                </span>
              )}

              {/* Decorative court-line corner */}
              <span
                aria-hidden
                className="pointer-events-none absolute -top-6 -right-6 h-16 w-16 rounded-full opacity-40"
                style={{ background: `radial-gradient(circle, ${side.accent}, transparent 70%)` }}
              />
            </button>
          )
        })}
      </div>

      {/* Action row */}
      <div className="grid grid-cols-2 gap-2.5">
        <button
          onClick={() => dispatch({ type: 'UNDO' })}
          disabled={state.events.length === 0 || !isPlaying}
          className="flex items-center justify-center gap-2 rounded-xl border-2 border-[var(--color-line)] bg-[var(--color-card)] py-3 font-display text-xs font-bold uppercase tracking-[0.16em] text-[var(--color-ink-soft)] transition-all disabled:cursor-not-allowed disabled:opacity-30 hover:border-[var(--color-lime)]/40 hover:text-[var(--color-chalk)] active:scale-[0.98]"
        >
          <span className="text-base">↩</span>
          Undo
        </button>
        <button
          onClick={() => {
            if (confirm('Abandon this match? Scores will be lost.')) {
              dispatch({ type: 'RESET' })
            }
          }}
          className="flex items-center justify-center gap-2 rounded-xl border-2 border-[var(--color-line)] bg-[var(--color-card)] py-3 font-display text-xs font-bold uppercase tracking-[0.16em] text-[var(--color-ink-soft)] transition-all hover:border-[var(--color-loss)]/40 hover:text-[var(--color-loss)] active:scale-[0.98]"
        >
          <span className="text-base">✕</span>
          Abandon
        </button>
      </div>

      {/* Recent points trail */}
      {state.events.length > 0 && (
        <section>
          <p className="font-display text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--color-ink-dim)] mb-2 px-1">
            rally log
          </p>
          <div className="flex flex-wrap gap-1">
            {state.events.slice(-16).map(ev => (
              <span
                key={ev.id}
                className="rounded-md border border-[var(--color-line)] bg-[var(--color-card)] px-1.5 py-0.5 font-score text-[10px] font-bold tabular"
                style={{
                  color: ev.team === 0 ? 'var(--color-team-a)' : 'var(--color-team-b)',
                }}
              >
                {ev.scoreAfter[0]}–{ev.scoreAfter[1]}
              </span>
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
    <span
      ref={ref}
      className="font-score text-xs font-bold tabular text-[var(--color-ink-soft)]"
    >
      00:00
    </span>
  )
}
