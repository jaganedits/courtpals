'use client'

import { useEffect, useState } from 'react'
import DaySetup from './DaySetup'
import TeamBuilder from './TeamBuilder'
import FixtureList from './FixtureList'
import Standings from './Standings'
import type { DaySession, SessionAction, SessionPlayer } from '@/types'

type LeagueView = 'checkin' | 'teams' | 'fixtures' | 'standings'

interface Props {
  session: DaySession
  allPlayers: SessionPlayer[]
  selectedIds: Set<string>
  onTogglePlayer: (id: string) => void
  dispatch: React.Dispatch<SessionAction>
  onStartFixture: (fixtureId: string) => void
  onSaveSession: () => void
}

export default function LeagueHub({
  session,
  allPlayers,
  selectedIds,
  onTogglePlayer,
  dispatch,
  onStartFixture,
  onSaveSession,
}: Props) {
  const [view, setView] = useState<LeagueView>(() =>
    session.phase === 'setup' ? 'checkin' : session.phase === 'done' ? 'standings' : 'fixtures',
  )

  // Keep view in sync with phase transitions
  useEffect(() => {
    if (session.phase === 'setup' && view !== 'checkin' && view !== 'teams') setView('checkin')
    if (session.phase === 'active' && view === 'checkin') setView('fixtures')
    if (session.phase === 'done' && view !== 'standings' && view !== 'fixtures') setView('standings')
  }, [session.phase, view])

  function handleAutoSplit() {
    // Clear any stale session players, then load today's selected players
    session.players.forEach(p => dispatch({ type: 'REMOVE_PLAYER', payload: p.id }))
    const todaysPlayers = allPlayers.filter(p => selectedIds.has(p.id))
    todaysPlayers.forEach(p => dispatch({ type: 'ADD_PLAYER', payload: p }))
    dispatch({ type: 'AUTO_SPLIT_TEAMS' })
    setView('teams')
  }

  function handleStartSession() {
    dispatch({ type: 'START_SESSION' })
    setView('fixtures')
  }

  function handleStartFixture(fid: string) {
    dispatch({ type: 'START_FIXTURE', payload: fid })
    onStartFixture(fid)
  }

  const subTabs: { id: LeagueView; label: string }[] =
    session.phase === 'setup'
      ? [
          { id: 'checkin', label: "Check-in" },
          { id: 'teams', label: 'Teams' },
        ]
      : [
          { id: 'fixtures', label: 'Fixtures' },
          { id: 'standings', label: 'Table' },
        ]

  const canReset =
    session.phase === 'done' ||
    (session.phase === 'active' && session.fixtures.every(f => f.status === 'pending')) ||
    (session.phase === 'setup' && session.teams.length > 0)

  return (
    <div className="flex flex-col">
      {/* Sub-tab bar */}
      <div className="sticky top-0 z-20 flex items-center gap-2 border-b border-[var(--color-line)]/60 bg-[var(--color-bg)]/90 px-4 py-2 backdrop-blur-md">
        <div className="flex gap-1.5">
          {subTabs.map(t => (
            <button
              key={t.id}
              onClick={() => setView(t.id)}
              className={`rounded-full px-3 py-1.5 font-display text-[11px] font-extrabold uppercase tracking-[0.16em] transition-colors ${
                view === t.id
                  ? 'bg-[var(--color-lime)] text-[var(--color-bg)]'
                  : 'bg-[var(--color-card)] text-[var(--color-ink-soft)] hover:text-[var(--color-chalk)]'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div className="flex-1" />
        {canReset && (
          <button
            onClick={() => {
              if (confirm('Reset this session? All teams and fixtures will be cleared.')) {
                dispatch({ type: 'RESET_SESSION' })
                setView('checkin')
              }
            }}
            className="font-display text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--color-loss)] transition-opacity hover:opacity-70"
          >
            Reset
          </button>
        )}
      </div>

      {/* View body */}
      {view === 'checkin' && (
        <DaySetup
          allPlayers={allPlayers}
          selectedIds={selectedIds}
          onToggle={onTogglePlayer}
          winTarget={session.winTarget}
          dispatch={dispatch}
          onAutoSplit={handleAutoSplit}
        />
      )}

      {view === 'teams' && session.teams.length > 0 && (
        <TeamBuilder
          teams={session.teams}
          dispatch={dispatch}
          onReRandomize={handleAutoSplit}
          onStartSession={handleStartSession}
        />
      )}

      {view === 'teams' && session.teams.length === 0 && (
        <div className="px-4 pt-10 pb-8 text-center">
          <p className="text-3xl mb-2">🎲</p>
          <p className="font-display text-sm font-bold text-[var(--color-ink-soft)]">
            No teams yet
          </p>
          <p className="mt-1 text-xs text-[var(--color-ink-dim)]">
            Check in players and tap "Split into teams" first.
          </p>
        </div>
      )}

      {view === 'fixtures' && (
        <FixtureList
          fixtures={session.fixtures}
          teams={session.teams}
          onStartFixture={handleStartFixture}
        />
      )}

      {view === 'standings' && (
        <>
          <Standings teams={session.teams} fixtures={session.fixtures} />
          {session.phase === 'done' && (
            <div className="sticky bottom-[calc(env(safe-area-inset-bottom)+72px)] z-30 px-4 pb-2">
              <button
                onClick={onSaveSession}
                className="flex w-full items-center justify-between rounded-2xl border-2 border-[var(--color-lime)] bg-[var(--color-lime)] px-5 py-4 text-[var(--color-bg)] shadow-brut transition-all active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
              >
                <span className="flex flex-col items-start">
                  <span className="font-display text-xs font-bold uppercase tracking-[0.18em] opacity-70">
                    that's a wrap
                  </span>
                  <span className="font-display text-lg font-extrabold leading-none">
                    Save day results
                  </span>
                </span>
                <span className="text-2xl">🏆</span>
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
