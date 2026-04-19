'use client'

import { useState } from 'react'
import { ChevronLeft, ChevronRight, Calendar, Trophy } from 'lucide-react'
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
import type { SavedSession, SessionTeam, Fixture } from '@/types'

interface Props {
  history: SavedSession[]
  onClearHistory: () => void
}

const DAY_HEADERS = ['S', 'M', 'T', 'W', 'T', 'F', 'S']

const TEAM_COLORS = [
  'var(--color-team-a)',
  'var(--color-team-b)',
  'var(--color-team-c)',
  'var(--color-team-d)',
  'var(--color-team-e)',
  'var(--color-team-f)',
]

function toDateKey(ts: number): string {
  const d = new Date(ts)
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
}

function computeWinner(teams: SessionTeam[], fixtures: Fixture[]): SessionTeam | null {
  if (teams.length === 0) return null
  const pts = new Map<string, number>()
  teams.forEach(t => pts.set(t.id, 0))
  fixtures
    .filter(f => f.status === 'done' && f.winnerId)
    .forEach(f => {
      pts.set(f.winnerId!, (pts.get(f.winnerId!) ?? 0) + 2)
    })
  let best: SessionTeam | null = null
  let bestPts = -1
  for (const [id, p] of pts) {
    if (p > bestPts) {
      bestPts = p
      best = teams.find(t => t.id === id) ?? null
    }
  }
  return best
}

export default function HistoryCalendar({ history, onClearHistory }: Props) {
  const today = new Date()
  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth())
  const [selectedKey, setSelectedKey] = useState<string | null>(toDateKey(today.getTime()))

  const sessionsByDay = history.reduce<Record<string, SavedSession[]>>((acc, s) => {
    const key = toDateKey(s.date)
    acc[key] = [...(acc[key] ?? []), s]
    return acc
  }, {})

  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]
  while (cells.length % 7 !== 0) cells.push(null)

  const monthName = new Date(year, month).toLocaleString('default', { month: 'long' })

  function prevMonth() {
    if (month === 0) {
      setMonth(11)
      setYear(y => y - 1)
    } else {
      setMonth(m => m - 1)
    }
    setSelectedKey(null)
  }

  function nextMonth() {
    if (month === 11) {
      setMonth(0)
      setYear(y => y + 1)
    } else {
      setMonth(m => m + 1)
    }
    setSelectedKey(null)
  }

  const selectedSessions = selectedKey ? (sessionsByDay[selectedKey] ?? []) : []

  return (
    <div className="flex flex-col gap-5 px-4 pt-6 pb-8">
      <header className="flex items-baseline justify-between">
        <div>
          <p className="font-display text-[10px] font-bold uppercase tracking-[0.22em] text-muted-foreground">
            the archive
          </p>
          <h1 className="font-display text-3xl font-extrabold leading-none">History</h1>
        </div>
        {history.length > 0 && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                Clear all
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle className="font-display">Clear all sessions?</AlertDialogTitle>
                <AlertDialogDescription>
                  Every archived Saturday will be deleted. This cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={onClearHistory}>Clear history</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </header>

      <Card className="py-2">
        <CardContent className="flex items-center justify-between px-2 py-0">
          <Button variant="ghost" size="icon" onClick={prevMonth} aria-label="Previous month">
            <ChevronLeft />
          </Button>
          <div className="flex flex-col items-center">
            <span className="font-display text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
              {year}
            </span>
            <span className="font-display text-lg font-extrabold leading-tight">{monthName}</span>
          </div>
          <Button variant="ghost" size="icon" onClick={nextMonth} aria-label="Next month">
            <ChevronRight />
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-3">
          <div className="mb-2 grid grid-cols-7 gap-1 text-center">
            {DAY_HEADERS.map((d, i) => (
              <span
                key={i}
                className="font-display text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground"
              >
                {d}
              </span>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {cells.map((day, i) => {
              if (!day) return <div key={`empty-${i}`} aria-hidden />
              const key = `${year}-${month}-${day}`
              const hasSessions = Boolean(sessionsByDay[key])
              const sessionCount = sessionsByDay[key]?.length ?? 0
              const isToday =
                day === today.getDate() &&
                month === today.getMonth() &&
                year === today.getFullYear()
              const isSelected = selectedKey === key

              return (
                <button
                  key={key}
                  onClick={() => setSelectedKey(isSelected ? null : key)}
                  className={cn(
                    'relative flex aspect-square flex-col items-center justify-center rounded-xl border transition-all',
                    isSelected
                      ? 'border-primary bg-primary/15'
                      : hasSessions
                      ? 'border-border bg-muted'
                      : 'border-transparent hover:bg-muted/50',
                  )}
                >
                  <span
                    className={cn(
                      'font-score text-sm tabular',
                      isToday && !isSelected && 'font-extrabold text-primary',
                      isSelected && 'font-extrabold text-primary',
                      !isSelected && !isToday && hasSessions && 'font-bold text-foreground',
                      !isSelected && !isToday && !hasSessions && 'font-medium text-muted-foreground',
                    )}
                  >
                    {day}
                  </span>
                  {hasSessions && (
                    <span className="mt-0.5 flex items-center gap-0.5" aria-label={`${sessionCount} sessions`}>
                      {Array.from({ length: Math.min(sessionCount, 3) }).map((_, di) => (
                        <span
                          key={di}
                          className="size-1.5 rounded-full"
                          style={{ background: isSelected ? 'var(--primary)' : 'var(--color-team-a)' }}
                        />
                      ))}
                    </span>
                  )}
                  {isToday && !isSelected && (
                    <span aria-hidden className="absolute inset-1 rounded-lg ring-1 ring-primary/40" />
                  )}
                </button>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {selectedSessions.length > 0 && (
        <section className="flex flex-col gap-3">
          <p className="font-display text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground px-1">
            {new Date(selectedSessions[0].date).toLocaleDateString('default', {
              weekday: 'long',
              month: 'short',
              day: 'numeric',
            })}
          </p>
          {selectedSessions.map((sess, si) => {
            const champion = computeWinner(sess.teams, sess.fixtures)
            const done = sess.fixtures.filter(f => f.status === 'done').length
            return (
              <Card
                key={sess.id}
                style={{ animationDelay: `${si * 60}ms` }}
                className="animate-rise gap-3"
              >
                <CardContent className="flex flex-col gap-3">
                  {champion && (
                    <div className="flex items-center gap-3 rounded-xl bg-primary/10 px-3 py-2">
                      <Trophy className="size-6 text-primary" />
                      <div className="min-w-0 flex-1">
                        <p className="font-display text-[9px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
                          champion
                        </p>
                        <p className="truncate font-display text-base font-extrabold">
                          {champion.name}
                        </p>
                      </div>
                      <Badge className="font-score tabular">1st</Badge>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary" className="gap-1">
                      <span className="font-score font-extrabold tabular">{done}/{sess.fixtures.length}</span>
                      <span className="font-display text-[10px] uppercase tracking-[0.14em] text-muted-foreground">matches</span>
                    </Badge>
                    <Badge variant="secondary" className="gap-1">
                      <span className="font-score font-extrabold tabular">{sess.winTarget}</span>
                      <span className="font-display text-[10px] uppercase tracking-[0.14em] text-muted-foreground">first to</span>
                    </Badge>
                    <Badge variant="secondary" className="gap-1">
                      <span className="font-score font-extrabold tabular">{sess.teams.length}</span>
                      <span className="font-display text-[10px] uppercase tracking-[0.14em] text-muted-foreground">teams</span>
                    </Badge>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {sess.teams.map((t, ti) => (
                      <Badge
                        key={t.id}
                        variant="outline"
                        className="gap-1"
                        style={{ boxShadow: `inset 2px 0 0 ${TEAM_COLORS[ti % TEAM_COLORS.length]}` }}
                      >
                        <span className="font-display text-[10px] font-bold">{t.name}</span>
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </section>
      )}

      {selectedKey && selectedSessions.length === 0 && (
        <div className="rounded-2xl border-2 border-dashed border-border px-6 py-6 text-center">
          <p className="font-display text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">
            no sessions on this day
          </p>
        </div>
      )}

      {history.length === 0 && (
        <Empty className="border-2">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Calendar />
            </EmptyMedia>
            <EmptyTitle className="font-display font-bold">No sessions archived yet</EmptyTitle>
            <EmptyDescription>
              Play a full Saturday and save the day — it&apos;ll show up here.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      )}
    </div>
  )
}
