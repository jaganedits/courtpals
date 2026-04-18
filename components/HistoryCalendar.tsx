'use client'

import { useState } from 'react'
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
      {/* Header */}
      <header className="flex items-baseline justify-between">
        <div>
          <p className="font-display text-[10px] font-bold uppercase tracking-[0.22em] text-[var(--color-ink-dim)]">
            the archive
          </p>
          <h1 className="font-display text-3xl font-extrabold leading-none text-[var(--color-chalk)]">
            History
          </h1>
        </div>
        {history.length > 0 && (
          <button
            onClick={() => {
              if (confirm('Clear all saved sessions? This cannot be undone.')) onClearHistory()
            }}
            className="font-display text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--color-loss)] transition-opacity hover:opacity-70"
          >
            Clear all
          </button>
        )}
      </header>

      {/* Month nav */}
      <div className="flex items-center justify-between rounded-2xl border-2 border-[var(--color-line)] bg-[var(--color-card)] px-2 py-2">
        <button
          onClick={prevMonth}
          aria-label="Previous month"
          className="flex h-9 w-9 items-center justify-center rounded-xl text-xl text-[var(--color-ink-soft)] transition-colors hover:bg-[var(--color-bg-raised)] hover:text-[var(--color-chalk)]"
        >
          ‹
        </button>
        <div className="flex flex-col items-center">
          <span className="font-display text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--color-ink-dim)]">
            {year}
          </span>
          <span className="font-display text-lg font-extrabold leading-tight text-[var(--color-chalk)]">
            {monthName}
          </span>
        </div>
        <button
          onClick={nextMonth}
          aria-label="Next month"
          className="flex h-9 w-9 items-center justify-center rounded-xl text-xl text-[var(--color-ink-soft)] transition-colors hover:bg-[var(--color-bg-raised)] hover:text-[var(--color-chalk)]"
        >
          ›
        </button>
      </div>

      {/* Calendar grid */}
      <div className="rounded-2xl border-2 border-[var(--color-line)] bg-[var(--color-card)] p-3">
        <div className="mb-2 grid grid-cols-7 gap-1 text-center">
          {DAY_HEADERS.map((d, i) => (
            <span
              key={i}
              className="font-display text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--color-ink-dim)]"
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
                className={`relative flex aspect-square flex-col items-center justify-center rounded-xl border transition-all ${
                  isSelected
                    ? 'border-[var(--color-lime)] bg-[var(--color-lime)]/15'
                    : hasSessions
                    ? 'border-[var(--color-line)] bg-[var(--color-bg-raised)]'
                    : 'border-transparent hover:bg-[var(--color-bg-raised)]/50'
                }`}
              >
                <span
                  className={`font-score text-sm tabular ${
                    isToday && !isSelected
                      ? 'font-extrabold text-[var(--color-lime)]'
                      : isSelected
                      ? 'font-extrabold text-[var(--color-lime)]'
                      : hasSessions
                      ? 'font-bold text-[var(--color-chalk)]'
                      : 'font-medium text-[var(--color-ink-soft)]'
                  }`}
                >
                  {day}
                </span>
                {hasSessions && (
                  <span
                    className={`mt-0.5 flex items-center gap-0.5`}
                    aria-label={`${sessionCount} ${sessionCount === 1 ? 'session' : 'sessions'}`}
                  >
                    {Array.from({ length: Math.min(sessionCount, 3) }).map((_, di) => (
                      <span
                        key={di}
                        className="h-1.5 w-1.5 rounded-full"
                        style={{
                          background: isSelected ? 'var(--color-lime)' : 'var(--color-team-a)',
                        }}
                      />
                    ))}
                  </span>
                )}
                {isToday && !isSelected && (
                  <span
                    aria-hidden
                    className="absolute inset-1 rounded-lg ring-1 ring-[var(--color-lime)]/40"
                  />
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Selected day details */}
      {selectedSessions.length > 0 && (
        <section className="space-y-3">
          <p className="font-display text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--color-ink-dim)] px-1">
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
              <article
                key={sess.id}
                style={{ animationDelay: `${si * 60}ms` }}
                className="animate-rise rounded-2xl border-2 border-[var(--color-line)] bg-[var(--color-card)] p-4"
              >
                {/* Champion banner */}
                {champion && (
                  <div className="mb-3 flex items-center gap-3 rounded-xl bg-[var(--color-lime)]/10 px-3 py-2">
                    <span className="text-2xl">🏆</span>
                    <div className="min-w-0 flex-1">
                      <p className="font-display text-[9px] font-bold uppercase tracking-[0.2em] text-[var(--color-ink-dim)]">
                        champion
                      </p>
                      <p className="truncate font-display text-base font-extrabold text-[var(--color-chalk)]">
                        {champion.players[0]?.emoji} {champion.name}
                      </p>
                    </div>
                    <span className="font-score text-xl font-extrabold text-[var(--color-lime)] tabular">
                      1st
                    </span>
                  </div>
                )}

                {/* Metadata */}
                <div className="mb-3 flex flex-wrap gap-2 text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--color-ink-dim)]">
                  <Meta label="matches" value={`${done}/${sess.fixtures.length}`} />
                  <Meta label="first to" value={sess.winTarget} />
                  <Meta label="teams" value={sess.teams.length} />
                </div>

                {/* Team chips */}
                <div className="flex flex-wrap gap-1.5">
                  {sess.teams.map((t, ti) => (
                    <span
                      key={t.id}
                      className="flex items-center gap-1 rounded-full border border-[var(--color-line)] bg-[var(--color-bg-raised)] px-2 py-1"
                      style={{
                        boxShadow: `inset 2px 0 0 ${TEAM_COLORS[ti % TEAM_COLORS.length]}`,
                      }}
                    >
                      <span className="text-xs">{t.players[0]?.emoji ?? '🏸'}</span>
                      <span className="font-display text-[10px] font-bold text-[var(--color-ink-soft)]">
                        {t.name}
                      </span>
                    </span>
                  ))}
                </div>
              </article>
            )
          })}
        </section>
      )}

      {selectedKey && selectedSessions.length === 0 && (
        <div className="rounded-2xl border-2 border-dashed border-[var(--color-line)] px-6 py-6 text-center">
          <p className="font-display text-xs font-bold uppercase tracking-[0.16em] text-[var(--color-ink-dim)]">
            no sessions on this day
          </p>
        </div>
      )}

      {history.length === 0 && (
        <div className="rounded-2xl border-2 border-dashed border-[var(--color-line)] px-6 py-10 text-center">
          <p className="text-3xl mb-2">🗓️</p>
          <p className="font-display text-sm font-bold text-[var(--color-ink-soft)]">
            No sessions archived yet
          </p>
          <p className="mt-1 text-xs text-[var(--color-ink-dim)]">
            Play a full Saturday and save the day — it'll show up here.
          </p>
        </div>
      )}
    </div>
  )
}

function Meta({ label, value }: { label: string; value: string | number }) {
  return (
    <span className="inline-flex items-baseline gap-1 rounded-md bg-[var(--color-bg-raised)] px-2 py-1">
      <span className="font-score text-[11px] font-extrabold text-[var(--color-chalk)] tabular">
        {value}
      </span>
      <span>{label}</span>
    </span>
  )
}
