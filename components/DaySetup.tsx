'use client'

import type { SessionPlayer, SessionAction, WinTarget } from '@/types'

const WIN_TARGETS: WinTarget[] = [11, 15, 21, 25]

interface Props {
  allPlayers: SessionPlayer[]
  selectedIds: Set<string>
  onToggle: (id: string) => void
  winTarget: WinTarget
  dispatch: React.Dispatch<SessionAction>
  onAutoSplit: () => void
}

export default function DaySetup({
  allPlayers,
  selectedIds,
  onToggle,
  winTarget,
  dispatch,
  onAutoSplit,
}: Props) {
  const selectedCount = selectedIds.size
  const teamCount = Math.ceil(selectedCount / 2)
  const oddPlayer = selectedCount > 0 && selectedCount % 2 === 1

  return (
    <div className="flex flex-col gap-5 px-4 pt-6 pb-8">
      {/* Header */}
      <header>
        <p className="font-display text-[10px] font-bold uppercase tracking-[0.22em] text-[var(--color-ink-dim)]">
          Saturday check-in
        </p>
        <h1 className="font-display text-3xl font-extrabold leading-none text-[var(--color-chalk)]">
          Who's playing?
        </h1>
        <p className="mt-1.5 text-sm text-[var(--color-ink-soft)]">
          Tap your regulars who showed up today.
        </p>
      </header>

      {/* Counter strip */}
      <div className="flex items-stretch gap-2 rounded-2xl border-2 border-[var(--color-line)] bg-[var(--color-card)] p-3">
        <Stat label="in" value={selectedCount} accent />
        <Divider />
        <Stat label="teams" value={teamCount} />
        <Divider />
        <Stat label="matches" value={teamCount >= 2 ? (teamCount * (teamCount - 1)) / 2 : 0} />
      </div>

      {/* Win target selector */}
      <section>
        <p className="font-display text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--color-ink-dim)] mb-2 px-1">
          First to
        </p>
        <div className="grid grid-cols-4 gap-2">
          {WIN_TARGETS.map(t => {
            const active = winTarget === t
            return (
              <button
                key={t}
                onClick={() => dispatch({ type: 'SET_WIN_TARGET', payload: t })}
                className={`relative rounded-xl border-2 py-2.5 transition-all active:scale-95 ${
                  active
                    ? 'border-[var(--color-lime)] bg-[var(--color-lime)]/10 ring-lime'
                    : 'border-[var(--color-line)] bg-[var(--color-card)] hover:border-[var(--color-lime)]/30'
                }`}
              >
                <span
                  className={`font-score block text-2xl font-extrabold leading-none tabular ${
                    active ? 'text-[var(--color-lime)]' : 'text-[var(--color-chalk)]'
                  }`}
                >
                  {t}
                </span>
                <span className="mt-1 block font-display text-[9px] font-bold uppercase tracking-[0.16em] text-[var(--color-ink-dim)]">
                  points
                </span>
              </button>
            )
          })}
        </div>
      </section>

      {/* Player check-in */}
      {allPlayers.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-[var(--color-line)] px-6 py-10 text-center">
          <p className="text-3xl mb-2">👥</p>
          <p className="font-display text-sm font-bold text-[var(--color-ink-soft)]">
            Your roster is empty
          </p>
          <p className="mt-1 text-xs text-[var(--color-ink-dim)]">
            Head to the Roster tab and add your regulars first.
          </p>
        </div>
      ) : (
        <section className="space-y-2">
          <p className="font-display text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--color-ink-dim)] px-1">
            tap to check in
          </p>
          {allPlayers.map((p, i) => {
            const isIn = selectedIds.has(p.id)
            return (
              <button
                key={p.id}
                onClick={() => onToggle(p.id)}
                style={{ animationDelay: `${i * 30}ms` }}
                className={`animate-rise group flex w-full items-center gap-3 rounded-2xl border-2 px-3 py-2.5 text-left transition-all active:scale-[0.98] ${
                  isIn
                    ? 'border-[var(--color-lime)] bg-[var(--color-lime)]/10 ring-lime'
                    : 'border-[var(--color-line)] bg-[var(--color-card)] hover:border-[var(--color-lime)]/30'
                }`}
              >
                <span
                  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-2xl transition-all ${
                    isIn ? 'bg-[var(--color-lime)]/20 scale-105' : 'bg-[var(--color-bg-raised)]'
                  }`}
                >
                  {p.emoji}
                </span>
                <span
                  className={`flex-1 truncate font-display text-base font-bold ${
                    isIn ? 'text-[var(--color-chalk)]' : 'text-[var(--color-ink-soft)]'
                  }`}
                >
                  {p.name}
                </span>
                <span
                  aria-hidden
                  className={`flex h-7 w-7 items-center justify-center rounded-full border-2 font-display text-sm font-extrabold transition-all ${
                    isIn
                      ? 'border-[var(--color-lime)] bg-[var(--color-lime)] text-[var(--color-bg)]'
                      : 'border-[var(--color-line)] bg-transparent text-transparent'
                  }`}
                >
                  ✓
                </span>
              </button>
            )
          })}
        </section>
      )}

      {/* Auto-split CTA — sticky floating */}
      {allPlayers.length > 0 && (
        <div className="sticky bottom-[calc(env(safe-area-inset-bottom)+72px)] z-30 pt-2">
          {selectedCount >= 2 ? (
            <button
              onClick={onAutoSplit}
              className="flex w-full items-center justify-between rounded-2xl border-2 border-[var(--color-lime)] bg-[var(--color-lime)] px-5 py-4 text-[var(--color-bg)] shadow-brut transition-all active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
            >
              <span className="flex flex-col items-start">
                <span className="font-display text-xs font-bold uppercase tracking-[0.18em] opacity-70">
                  shuffle
                </span>
                <span className="font-display text-lg font-extrabold leading-none">
                  Split into {teamCount} {teamCount === 1 ? 'team' : 'teams'}
                </span>
              </span>
              <span className="text-2xl">🎲</span>
            </button>
          ) : (
            <div className="rounded-2xl border-2 border-dashed border-[var(--color-line)] px-5 py-3.5 text-center">
              <p className="font-display text-xs font-bold uppercase tracking-[0.18em] text-[var(--color-ink-dim)]">
                need {2 - selectedCount} more {2 - selectedCount === 1 ? 'player' : 'players'}
              </p>
            </div>
          )}
          {oddPlayer && selectedCount >= 2 && (
            <p className="mt-2 text-center font-display text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--color-team-f)]">
              ⚠ odd count — someone plays solo
            </p>
          )}
        </div>
      )}
    </div>
  )
}

function Stat({
  label,
  value,
  accent = false,
}: {
  label: string
  value: number
  accent?: boolean
}) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center">
      <span
        className={`font-score text-2xl font-extrabold leading-none tabular ${
          accent ? 'text-[var(--color-lime)]' : 'text-[var(--color-chalk)]'
        }`}
      >
        {value.toString().padStart(2, '0')}
      </span>
      <span className="mt-1 font-display text-[9px] font-bold uppercase tracking-[0.18em] text-[var(--color-ink-dim)]">
        {label}
      </span>
    </div>
  )
}

function Divider() {
  return <span aria-hidden className="w-px bg-[var(--color-line)]" />
}
