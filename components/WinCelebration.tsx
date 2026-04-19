'use client'

import { useMemo } from 'react'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

interface Props {
  open: boolean
  winnerName: string
  winnerEmoji: string
  scores: [number, number]
  onDismiss: () => void
}

const SHUTTLE_ICONS = ['🏸', '🎉', '✨', '🏆', '🔥', '⭐']

export default function WinCelebration({ open, winnerName, winnerEmoji, scores, onDismiss }: Props) {
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
  }, [open])

  return (
    <Dialog open={open} onOpenChange={o => !o && onDismiss()}>
      <DialogContent
        showCloseButton={false}
        className="h-screen w-screen max-w-full gap-0 border-0 bg-background/92 p-0 backdrop-blur-md sm:max-w-full sm:rounded-none"
      >
        <DialogTitle className="sr-only">
          {winnerName} wins {scores[0]} to {scores[1]}
        </DialogTitle>

        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(circle at 50% 38%, rgba(199, 242, 56, 0.24) 0%, transparent 60%)',
          }}
        />

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

        <div className="relative z-10 flex h-full flex-col items-center justify-center text-center px-6">
          <p
            className="font-display text-[11px] font-extrabold uppercase tracking-[0.3em] text-primary"
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
            className="font-display mt-6 text-5xl font-extrabold leading-[0.95]"
            style={{ animation: 'stagger-rise 0.5s ease-out 0.2s both' }}
          >
            {winnerName}
          </h1>
          <p
            className="font-display mt-2 text-base font-bold uppercase tracking-[0.2em] text-muted-foreground"
            style={{ animation: 'stagger-rise 0.5s ease-out 0.35s both' }}
          >
            wins
          </p>

          <div
            className="font-score mt-8 flex items-baseline gap-3 text-[72px] font-extrabold leading-none tabular"
            style={{ animation: 'stagger-rise 0.5s ease-out 0.5s both' }}
          >
            <span>{scores[0]}</span>
            <span className="text-muted-foreground text-4xl">–</span>
            <span>{scores[1]}</span>
          </div>

          <Button
            size="lg"
            onClick={onDismiss}
            className="mt-10 h-auto rounded-2xl border-2 border-primary px-10 py-4 font-display text-base font-extrabold uppercase tracking-[0.2em] shadow-brut active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
            style={{ animation: 'stagger-rise 0.5s ease-out 0.65s both' }}
          >
            Save result
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
