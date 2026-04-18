'use client'

import { useMemo } from 'react'

interface Props {
  winnerName: string
  winnerEmoji: string
  scores: [number, number]
  onDismiss: () => void
}

const SHUTTLE_ICONS = ['🏸', '🎉', '✨', '🏆', '🔥', '⭐']

export default function WinCelebration({ winnerName, winnerEmoji, scores, onDismiss }: Props) {
  // Generate stable shuttle positions for confetti
  const shuttles = useMemo(() => {
    return Array.from({ length: 22 }, (_, i) => {
      const leftPct = Math.random() * 100
      const drift = (Math.random() - 0.5) * 120
      const dur = 2.2 + Math.random() * 2.4
      const delay = Math.random() * 0.8
      const spin = (Math.random() > 0.5 ? 1 : -1) * (480 + Math.random() * 720)
      const icon = SHUTTLE_ICONS[Math.floor(Math.random() * SHUTTLE_ICONS.length)]
      const size = 20 + Math.random() * 22
      return { key: i, leftPct, drift, dur, delay, spin, icon, size }
    })
  }, [])

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex flex-col items-center justify-center overflow-hidden bg-[var(--color-bg)]/92 backdrop-blur-md px-6"
    >
      {/* Radial halo */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(circle at 50% 38%, rgba(199, 242, 56, 0.24) 0%, transparent 60%)',
        }}
      />

      {/* Shuttlecock rain */}
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        {shuttles.map(s => (
          <span
            key={s.key}
            className="animate-shuttle-fall absolute top-0 select-none"
            style={
              {
                left: `${s.leftPct}%`,
                fontSize: `${s.size}px`,
                animationDelay: `${s.delay}s`,
                '--dur': `${s.dur}s`,
                '--drift': `${s.drift}px`,
                '--spin': `${s.spin}deg`,
              } as React.CSSProperties
            }
          >
            {s.icon}
          </span>
        ))}
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center text-center">
        <p
          className="font-display text-[11px] font-extrabold uppercase tracking-[0.3em] text-[var(--color-lime)]"
          style={{ animation: 'stagger-rise 0.5s ease-out 0.05s both' }}
        >
          Game · Set · Match
        </p>
        <div
          className="animate-trophy mt-4 text-[120px] leading-none"
          style={{ filter: 'drop-shadow(0 10px 24px rgba(199, 242, 56, 0.35))' }}
        >
          {winnerEmoji}
        </div>
        <h1
          className="font-display mt-6 text-5xl font-extrabold leading-[0.95] text-[var(--color-chalk)]"
          style={{ animation: 'stagger-rise 0.5s ease-out 0.2s both' }}
        >
          {winnerName}
        </h1>
        <p
          className="font-display mt-2 text-base font-bold uppercase tracking-[0.2em] text-[var(--color-ink-soft)]"
          style={{ animation: 'stagger-rise 0.5s ease-out 0.35s both' }}
        >
          wins
        </p>

        <div
          className="font-score mt-8 flex items-baseline gap-3 text-[72px] font-extrabold leading-none tabular text-[var(--color-chalk)]"
          style={{ animation: 'stagger-rise 0.5s ease-out 0.5s both' }}
        >
          <span>{scores[0]}</span>
          <span className="text-[var(--color-ink-dim)] text-4xl">–</span>
          <span>{scores[1]}</span>
        </div>

        <button
          onClick={onDismiss}
          className="mt-10 rounded-2xl border-2 border-[var(--color-lime)] bg-[var(--color-lime)] px-10 py-4 font-display text-base font-extrabold uppercase tracking-[0.2em] text-[var(--color-bg)] shadow-brut transition-all active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
          style={{ animation: 'stagger-rise 0.5s ease-out 0.65s both' }}
        >
          Save result
        </button>
      </div>
    </div>
  )
}
