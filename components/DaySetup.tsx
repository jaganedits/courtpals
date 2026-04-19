'use client'

import { Dices, Users, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useState } from 'react'
import { CalendarDays } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import type { SessionPlayer, SessionAction, WinTarget, TeamSize } from '@/types'

const WIN_TARGETS: WinTarget[] = [11, 15, 21, 25]

interface Props {
  allPlayers: SessionPlayer[]
  selectedIds: Set<string>
  onToggle: (id: string) => void
  winTarget: WinTarget
  teamSize: TeamSize
  sessionDate: number
  dispatch: React.Dispatch<SessionAction>
  onAutoSplit: () => void
}

function isFutureDay(ts: number): boolean {
  const day = new Date(ts)
  day.setHours(0, 0, 0, 0)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return day.getTime() > today.getTime()
}

function formatMatchDate(ts: number): string {
  return new Date(ts || Date.now()).toLocaleDateString('default', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export default function DaySetup({
  allPlayers,
  selectedIds,
  onToggle,
  winTarget,
  teamSize,
  sessionDate,
  dispatch,
  onAutoSplit,
}: Props) {
  const selectedCount = selectedIds.size
  const teamCount = Math.ceil(selectedCount / teamSize)
  const matchCount = teamCount >= 2 ? (teamCount * (teamCount - 1)) / 2 : 0
  const oddPlayer = teamSize === 2 && selectedCount > 0 && selectedCount % 2 === 1
  const allChecked = allPlayers.length > 0 && selectedCount === allPlayers.length
  const someChecked = selectedCount > 0 && !allChecked
  const [dateOpen, setDateOpen] = useState(false)

  function handleToggleAll() {
    // If everyone is already checked in, clear them; otherwise fill the missing.
    if (allChecked) {
      allPlayers.forEach(p => onToggle(p.id))
    } else {
      allPlayers.forEach(p => {
        if (!selectedIds.has(p.id)) onToggle(p.id)
      })
    }
  }

  return (
    <div className="flex flex-col gap-5 px-4 pt-6 pb-8">
      <header>
        <p className="font-display text-[10px] font-bold uppercase tracking-[0.22em] text-muted-foreground">
          saturday check-in
        </p>
        <h1 className="font-display text-3xl font-extrabold leading-none">
          Who&apos;s playing?
        </h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Tap your regulars who showed up today.
        </p>
      </header>

      <Card>
        <CardContent className="grid grid-cols-3 divide-x divide-border p-0">
          <Stat label="in" value={selectedCount} accent />
          <Stat label="teams" value={teamCount} />
          <Stat label="matches" value={matchCount} />
        </CardContent>
      </Card>

      {teamCount >= 2 && (
        <p className="-mt-2 px-1 text-center text-[11px] font-medium text-muted-foreground">
          {teamCount <= 3
            ? `Round-robin \u00b7 ${matchCount} ${matchCount === 1 ? 'match' : 'matches'}`
            : teamCount <= 5
            ? `Round-robin \u00b7 ${matchCount} matches \u2192 Final + 3rd-place`
            : `Round-robin \u00b7 ${matchCount} matches \u2192 Semis \u2192 Final + 3rd-place`}
        </p>
      )}

      <section className="flex flex-col gap-2">
        <p className="font-display text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground px-1">
          Match day
        </p>
        <Popover open={dateOpen} onOpenChange={setDateOpen}>
          <PopoverTrigger asChild>
            <button
              type="button"
              className="flex items-center gap-3 rounded-xl border-2 border-border bg-card px-3 py-2.5 text-left transition-colors hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 aria-expanded:border-primary"
              aria-expanded={dateOpen}
              aria-haspopup="dialog"
            >
              <CalendarDays className="size-4 shrink-0 text-muted-foreground" aria-hidden />
              <span className="font-display text-sm font-bold">
                {formatMatchDate(sessionDate)}
              </span>
              {isFutureDay(sessionDate) && (
                <span className="ml-auto rounded-full bg-primary/15 px-2 py-0.5 font-display text-[9px] font-bold uppercase tracking-[0.16em] text-primary">
                  scheduled
                </span>
              )}
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={sessionDate ? new Date(sessionDate) : undefined}
              onSelect={day => {
                if (!day) return
                const ts = new Date(day)
                ts.setHours(0, 0, 0, 0)
                dispatch({ type: 'SET_SESSION_DATE', payload: ts.getTime() })
                setDateOpen(false)
              }}
              captionLayout="dropdown"
            />
          </PopoverContent>
        </Popover>
      </section>

      <section className="flex flex-col gap-2">
        <p className="font-display text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground px-1">
          Format
        </p>
        <ToggleGroup
          type="single"
          value={teamSize.toString()}
          onValueChange={v => v && dispatch({ type: 'SET_TEAM_SIZE', payload: Number(v) as TeamSize })}
          className="grid grid-cols-2 gap-2"
        >
          <ToggleGroupItem
            value="1"
            aria-label="Solo singles 1 versus 1"
            className="h-auto flex-col gap-0.5 rounded-xl border-2 border-border bg-card py-3 data-[state=on]:bg-primary/10 data-[state=on]:border-primary"
          >
            <span className="font-score text-2xl font-extrabold leading-none tabular data-[state=on]:text-primary">
              1v1
            </span>
            <span className="font-display text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
              solo
            </span>
          </ToggleGroupItem>
          <ToggleGroupItem
            value="2"
            aria-label="Squad doubles 2 versus 2"
            className="h-auto flex-col gap-0.5 rounded-xl border-2 border-border bg-card py-3 data-[state=on]:bg-primary/10 data-[state=on]:border-primary"
          >
            <span className="font-score text-2xl font-extrabold leading-none tabular data-[state=on]:text-primary">
              2v2
            </span>
            <span className="font-display text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
              squad
            </span>
          </ToggleGroupItem>
        </ToggleGroup>
      </section>

      <section className="flex flex-col gap-2">
        <p className="font-display text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground px-1">
          First to
        </p>
        <ToggleGroup
          type="single"
          value={winTarget.toString()}
          onValueChange={v => v && dispatch({ type: 'SET_WIN_TARGET', payload: Number(v) as WinTarget })}
          className="grid grid-cols-4 gap-2"
        >
          {WIN_TARGETS.map(t => (
            <ToggleGroupItem
              key={t}
              value={t.toString()}
              aria-label={`First to ${t}`}
              className="h-auto flex-col gap-1 rounded-xl border-2 border-border bg-card py-2.5 data-[state=on]:bg-primary/10 data-[state=on]:border-primary"
            >
              <span className="font-score text-2xl font-extrabold leading-none tabular data-[state=on]:text-primary">
                {t}
              </span>
              <span className="font-display text-[9px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
                points
              </span>
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </section>

      {allPlayers.length === 0 ? (
        <Empty className="border-2">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Users />
            </EmptyMedia>
            <EmptyTitle className="font-display font-bold">
              Your roster is empty
            </EmptyTitle>
            <EmptyDescription>
              Head to the Roster tab and add your regulars first.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <section className="flex flex-col gap-2">
          <p className="font-display text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground px-1">
            tap to check in
          </p>
          <Separator />

          {/* Mobile: card list */}
          <div className="flex flex-col gap-2 lg:hidden">
            {allPlayers.map((p, i) => {
              const isIn = selectedIds.has(p.id)
              return (
                <Card
                  key={p.id}
                  style={{ animationDelay: `${i * 30}ms` }}
                  onClick={() => onToggle(p.id)}
                  className={cn(
                    'animate-rise cursor-pointer gap-0 border-2 py-0 transition-all active:scale-[0.98]',
                    isIn ? 'border-primary bg-primary/10' : 'hover:border-primary/30',
                  )}
                  aria-pressed={isIn}
                  role="button"
                >
                  <CardContent className="flex items-center gap-3 p-3">
                    <span
                      className={cn(
                        'flex-1 truncate font-display text-base font-extrabold',
                        isIn ? 'text-foreground' : 'text-muted-foreground',
                      )}
                    >
                      {p.name}
                    </span>
                    <div
                      aria-hidden
                      className={cn(
                        'flex size-7 items-center justify-center rounded-full border-2 transition-all',
                        isIn
                          ? 'border-primary bg-primary text-primary-foreground'
                          : 'border-border bg-transparent text-transparent',
                      )}
                    >
                      <Check className="size-4" />
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {/* Desktop: table */}
          <Card className="hidden overflow-hidden py-0 lg:block">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="border-b-2 border-border">
                    <TableHead className="w-12 text-center">
                      <button
                        type="button"
                        aria-label={allChecked ? 'Deselect all players' : 'Select all players'}
                        aria-pressed={allChecked}
                        onClick={handleToggleAll}
                        className={cn(
                          'mx-auto flex size-6 items-center justify-center rounded-full border-2 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50',
                          allChecked
                            ? 'border-primary bg-primary text-primary-foreground'
                            : someChecked
                            ? 'border-primary bg-primary/25 text-primary'
                            : 'border-border bg-transparent text-muted-foreground hover:border-primary/50',
                        )}
                      >
                        {allChecked ? (
                          <Check className="size-3.5" />
                        ) : someChecked ? (
                          <span aria-hidden className="h-0.5 w-3 rounded-full bg-primary" />
                        ) : null}
                      </button>
                    </TableHead>
                    <TableHead className="w-14 text-center font-display text-[9px] font-bold uppercase tracking-[0.18em]">
                      icon
                    </TableHead>
                    <TableHead className="font-display text-[9px] font-bold uppercase tracking-[0.18em]">
                      name
                    </TableHead>
                    <TableHead className="w-24 text-right font-display text-[9px] font-bold uppercase tracking-[0.18em]">
                      status
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {allPlayers.map(p => {
                    const isIn = selectedIds.has(p.id)
                    return (
                      <TableRow
                        key={p.id}
                        onClick={() => onToggle(p.id)}
                        aria-pressed={isIn}
                        role="button"
                        className={cn(
                          'cursor-pointer transition-colors',
                          isIn ? 'bg-primary/10 hover:bg-primary/15' : 'hover:bg-muted/40',
                        )}
                      >
                        <TableCell className="text-center">
                          <div
                            aria-hidden
                            className={cn(
                              'mx-auto flex size-6 items-center justify-center rounded-full border-2 transition-all',
                              isIn
                                ? 'border-primary bg-primary text-primary-foreground'
                                : 'border-border bg-transparent text-transparent',
                            )}
                          >
                            <Check className="size-3.5" />
                          </div>
                        </TableCell>
                        <TableCell className="text-center text-xl leading-none">
                          {p.emoji}
                        </TableCell>
                        <TableCell
                          className={cn(
                            'font-display text-sm font-extrabold',
                            !isIn && 'text-muted-foreground',
                          )}
                        >
                          {p.name}
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge
                            variant={isIn ? 'default' : 'outline'}
                            className={cn(
                              'font-display text-[10px] font-bold uppercase tracking-[0.14em]',
                              !isIn && 'text-muted-foreground',
                            )}
                          >
                            {isIn ? 'checked in' : 'out'}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </section>
      )}

      {allPlayers.length > 0 && (
        <div className="sticky bottom-[calc(env(safe-area-inset-bottom)+72px)] z-30 flex flex-col gap-2 bg-background/80 pt-4 pb-1 -mx-4 px-4 backdrop-blur lg:static lg:mx-0 lg:bg-transparent lg:px-0 lg:pt-4 lg:pb-0 lg:backdrop-blur-0">
          {selectedCount >= 2 ? (
            <Button
              size="lg"
              onClick={onAutoSplit}
              className="h-auto justify-between rounded-2xl border-2 border-primary px-5 py-4 shadow-brut hover:bg-primary active:translate-x-0.5 active:translate-y-0.5 active:shadow-none lg:ml-auto lg:max-w-sm lg:py-3"
            >
              <span className="flex flex-col items-start leading-none">
                <span className="font-display text-xs font-bold uppercase tracking-[0.18em] opacity-70">
                  shuffle
                </span>
                <span className="font-display text-lg font-extrabold">
                  Split into {teamCount} {teamCount === 1 ? 'team' : 'teams'}
                </span>
              </span>
              <Dices className="size-6" />
            </Button>
          ) : (
            <Empty className="border-2 border-dashed py-3.5">
              <EmptyTitle className="font-display text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">
                need {2 - selectedCount} more {2 - selectedCount === 1 ? 'player' : 'players'}
              </EmptyTitle>
            </Empty>
          )}
          {oddPlayer && selectedCount >= 2 && (
            <Badge variant="outline" className="mx-auto border-chart-5 text-chart-5 font-display text-[10px] font-bold uppercase tracking-[0.16em]">
              ⚠ odd count — someone plays solo
            </Badge>
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
    <div className="flex flex-col items-center justify-center py-3">
      <span
        className={cn(
          'font-score text-2xl font-extrabold leading-none tabular',
          accent ? 'text-primary' : 'text-foreground',
        )}
      >
        {value.toString().padStart(2, '0')}
      </span>
      <span className="mt-1 font-display text-[9px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
        {label}
      </span>
    </div>
  )
}
