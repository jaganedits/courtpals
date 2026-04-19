'use client'

import { Trophy, Users, BadgeCheck, Calendar } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export type Tab = 'league' | 'players' | 'score' | 'history'

interface TabDef {
  id: Tab
  label: string
  Icon: typeof Trophy
}

const TABS: TabDef[] = [
  { id: 'league', label: 'League', Icon: Trophy },
  { id: 'players', label: 'Roster', Icon: Users },
  { id: 'score', label: 'Score', Icon: BadgeCheck },
  { id: 'history', label: 'History', Icon: Calendar },
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
      className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-background/95 backdrop-blur-md lg:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="relative mx-auto max-w-xl">
        <div
          aria-hidden
          className="pointer-events-none absolute top-1 bottom-1 w-1/4 rounded-xl bg-primary/10 transition-transform duration-300 ease-out"
          style={{ transform: `translateX(${activeIndex * 100}%)` }}
        />
        <ul className="relative grid grid-cols-4">
          {TABS.map(tab => {
            const disabled = tab.id === 'score' && !scoreEnabled
            const isActive = active === tab.id
            const { Icon } = tab
            return (
              <li key={tab.id} className="relative">
                <Button
                  variant="ghost"
                  size="lg"
                  onClick={() => !disabled && onChange(tab.id)}
                  disabled={disabled}
                  aria-current={isActive ? 'page' : undefined}
                  className={cn(
                    'h-auto w-full flex-col gap-0.5 rounded-none bg-transparent py-2.5 hover:bg-transparent',
                    isActive ? 'text-primary' : disabled ? 'text-muted-foreground/40' : 'text-muted-foreground',
                  )}
                >
                  <Icon className={cn('transition-transform', isActive ? 'scale-110' : '')} />
                  <span className="font-display text-[10px] font-extrabold uppercase tracking-[0.14em] leading-none">
                    {tab.label}
                  </span>
                </Button>
                {tab.id === 'score' && scoreEnabled && !isActive && (
                  <span
                    aria-hidden
                    className="pointer-events-none absolute right-4 top-1.5 size-1.5 animate-live rounded-full bg-primary"
                  />
                )}
              </li>
            )
          })}
        </ul>
      </div>
    </nav>
  )
}
