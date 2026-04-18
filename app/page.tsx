'use client'

import { useCallback, useEffect, useState } from 'react'
import TabNav, { type Tab } from '@/components/TabNav'
import LeagueHub from '@/components/LeagueHub'
import PlayerRegistry from '@/components/PlayerRegistry'
import ScoreBoard from '@/components/ScoreBoard'
import WinCelebration from '@/components/WinCelebration'
import HistoryCalendar from '@/components/HistoryCalendar'
import { useRegistry } from '@/hooks/useRegistry'
import { useSession } from '@/hooks/useSession'
import { useMatch } from '@/hooks/useMatch'
import { useHistory } from '@/hooks/useHistory'
import type { SavedSession } from '@/types'

export default function Page() {
  const [tab, setTab] = useState<Tab>('league')
  const [todayLabel, setTodayLabel] = useState('')
  const { players: registry, addPlayer, removePlayer, updatePlayer } = useRegistry()
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const { state: session, dispatch: sessionDispatch } = useSession()
  const { state: match, dispatch: matchDispatch } = useMatch()
  const { history, saveSession, clearHistory } = useHistory()

  const activeFixture = session.fixtures.find(f => f.id === session.activeFixtureId) ?? null
  const scoreTabEnabled = match.phase !== 'idle'

  function handleTogglePlayer(id: string) {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function handleStartFixture(fixtureId: string) {
    const fixture = session.fixtures.find(f => f.id === fixtureId)
    if (!fixture) return
    const tA = session.teams.find(t => t.id === fixture.teamAId)
    const tB = session.teams.find(t => t.id === fixture.teamBId)
    if (!tA || !tB) return
    matchDispatch({
      type: 'START_MATCH',
      payload: {
        fixtureId,
        teamNames: [tA.name, tB.name],
        teamEmojis: [tA.players[0]?.emoji ?? '🏸', tB.players[0]?.emoji ?? '🏸'],
        winTarget: session.winTarget,
      },
    })
    setTab('score')
  }

  const handleMatchWin = useCallback(() => {
    if (!activeFixture || match.winner === null || !match.fixtureId) return
    const winnerId = match.winner === 0 ? activeFixture.teamAId : activeFixture.teamBId
    sessionDispatch({
      type: 'FINISH_FIXTURE',
      payload: {
        fixtureId: match.fixtureId,
        scoreA: match.scores[0],
        scoreB: match.scores[1],
        winnerId,
      },
    })
    matchDispatch({ type: 'RESET' })
    setTab('league')
  }, [activeFixture, match, sessionDispatch, matchDispatch])

  useEffect(() => {
    setTodayLabel(
      new Date().toLocaleDateString('default', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      }),
    )
  }, [])

  useEffect(() => {
    if (tab === 'score' && match.phase === 'idle') {
      setTab('league')
    }
  }, [tab, match.phase])

  function handleSaveSession() {
    const saved: SavedSession = {
      id: session.id,
      date: session.date,
      winTarget: session.winTarget,
      teams: session.teams,
      fixtures: session.fixtures,
    }
    saveSession(saved)
    sessionDispatch({ type: 'RESET_SESSION' })
    setSelectedIds(new Set())
    setTab('history')
  }

  return (
    <main className="relative flex min-h-screen flex-col pb-[calc(env(safe-area-inset-bottom)+72px)]">
      {/* Top app bar */}
      <header className="sticky top-0 z-30 border-b border-[var(--color-line)]/60 bg-[var(--color-bg)]/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <span
              aria-hidden
              className="flex h-8 w-8 items-center justify-center rounded-xl bg-[var(--color-lime)] text-lg text-[var(--color-bg)]"
            >
              🏸
            </span>
            <div className="flex flex-col">
              <span className="font-display text-[9px] font-bold uppercase tracking-[0.22em] text-[var(--color-ink-dim)] leading-none">
                saturday league
              </span>
              <span className="font-display text-base font-extrabold leading-tight text-[var(--color-chalk)]">
                CourtPals
              </span>
            </div>
          </div>
          <span
            suppressHydrationWarning
            className="font-score text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--color-ink-dim)]"
          >
            {todayLabel}
          </span>
        </div>
      </header>

      {/* Celebration overlay */}
      {match.phase === 'finished' && match.winner !== null && (
        <WinCelebration
          winnerName={match.teamNames[match.winner]}
          winnerEmoji={match.teamEmojis[match.winner]}
          scores={match.scores}
          onDismiss={handleMatchWin}
        />
      )}

      {/* Tab body */}
      <div className="mx-auto w-full max-w-xl flex-1">
        {tab === 'league' && (
          <LeagueHub
            session={session}
            allPlayers={registry}
            selectedIds={selectedIds}
            onTogglePlayer={handleTogglePlayer}
            dispatch={sessionDispatch}
            onStartFixture={handleStartFixture}
            onSaveSession={handleSaveSession}
          />
        )}
        {tab === 'players' && (
          <PlayerRegistry
            players={registry}
            onAdd={addPlayer}
            onRemove={removePlayer}
            onUpdate={updatePlayer}
          />
        )}
        {tab === 'score' && <ScoreBoard state={match} dispatch={matchDispatch} />}
        {tab === 'history' && (
          <HistoryCalendar history={history} onClearHistory={clearHistory} />
        )}
      </div>

      <TabNav active={tab} scoreEnabled={scoreTabEnabled} onChange={setTab} />
    </main>
  )
}
