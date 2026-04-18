'use client'

export type Tab = 'league' | 'players' | 'score' | 'history'

interface TabDef {
  id: Tab
  label: string
  icon: string
}

const TABS: TabDef[] = [
  { id: 'league', label: 'League', icon: '🏆' },
  { id: 'players', label: 'Roster', icon: '👥' },
  { id: 'score', label: 'Score', icon: '🏸' },
  { id: 'history', label: 'History', icon: '🗓️' },
]

interface Props {
  active: Tab
  scoreEnabled: boolean
  onChange: (tab: Tab) => void
}

export default function TabNav({ active, scoreEnabled, onChange }: Props) {
  const activeIndex = TABS.findIndex(t => t.id === active)

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 border-t-2 border-[var(--color-line)] bg-[var(--color-bg-raised)]/95 backdrop-blur-md"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="relative mx-auto max-w-xl">
        {/* Sliding pill indicator */}
        <div
          aria-hidden
          className="pointer-events-none absolute top-1 bottom-1 w-1/4 rounded-xl bg-[var(--color-lime)]/10 transition-transform duration-[320ms] ease-[cubic-bezier(0.22,1,0.36,1)]"
          style={{ transform: `translateX(${activeIndex * 100}%)` }}
        />
        <ul className="relative grid grid-cols-4">
          {TABS.map(tab => {
            const disabled = tab.id === 'score' && !scoreEnabled
            const isActive = active === tab.id
            return (
              <li key={tab.id}>
                <button
                  onClick={() => !disabled && onChange(tab.id)}
                  disabled={disabled}
                  aria-current={isActive ? 'page' : undefined}
                  className={`group flex w-full flex-col items-center gap-0.5 px-2 py-2.5 transition-all ${
                    disabled ? 'cursor-not-allowed' : 'cursor-pointer active:scale-95'
                  }`}
                >
                  <span
                    className={`text-[22px] leading-none transition-transform ${
                      isActive ? 'scale-110' : disabled ? 'opacity-20 grayscale' : 'opacity-70 group-active:scale-105'
                    }`}
                  >
                    {tab.icon}
                  </span>
                  <span
                    className={`font-display text-[10px] font-bold uppercase tracking-[0.14em] leading-none ${
                      isActive
                        ? 'text-[var(--color-lime)]'
                        : disabled
                        ? 'text-[var(--color-ink-dim)]/50'
                        : 'text-[var(--color-ink-soft)]'
                    }`}
                  >
                    {tab.label}
                  </span>
                  {tab.id === 'score' && scoreEnabled && !isActive && (
                    <span className="absolute top-1.5 right-[calc(25%-4px)] h-1.5 w-1.5 rounded-full bg-[var(--color-lime)] animate-live" />
                  )}
                </button>
              </li>
            )
          })}
        </ul>
      </div>
    </nav>
  )
}
