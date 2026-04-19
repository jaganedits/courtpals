'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { deleteDoc, doc, serverTimestamp, setDoc } from 'firebase/firestore'
import { firestore } from '@/lib/firebase'
import { Trophy, Users, BadgeCheck, Calendar } from 'lucide-react'
import AuthGate from '@/components/AuthGate'
import TabNav, { type Tab } from '@/components/TabNav'
import LeagueHub from '@/components/LeagueHub'
import PlayerRegistry from '@/components/PlayerRegistry'
import ScoreBoard from '@/components/ScoreBoard'
import WinCelebration from '@/components/WinCelebration'
import HistoryCalendar from '@/components/HistoryCalendar'
import UserMenu from '@/components/UserMenu'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useRegistry } from '@/hooks/useRegistry'
import { useSession } from '@/hooks/useSession'
import { useMatch } from '@/hooks/useMatch'
import { useHistory } from '@/hooks/useHistory'
import { useCurrentPlayer } from '@/hooks/useCurrentPlayer'
import { useAuth } from '@/hooks/useAuth'
import { useCourt } from '@/hooks/useCourt'
import { useLiveMatch } from '@/hooks/useLiveMatch'
import type { MatchState, SavedSession } from '@/types'

const DESKTOP_TABS: { id: Tab; label: string; Icon: typeof Trophy }[] = [
  { id: 'league', label: 'League', Icon: Trophy },
  { id: 'players', label: 'Roster', Icon: Users },
  { id: 'score', label: 'Score', Icon: BadgeCheck },
  { id: 'history', label: 'History', Icon: Calendar },
]

export default function Page() {
  const [tab, setTab] = useState<Tab>('league')
  const [todayLabel, setTodayLabel] = useState('')
  const auth = useAuth()
  const court = useCourt(auth.user)
  const courtId = court.court?.id ?? null
  const { players: registry, addPlayer, removePlayer, updatePlayer } = useRegistry(courtId)
  const { currentPlayerId, setCurrentPlayer, clearCurrentPlayer } = useCurrentPlayer({
    user: auth.user,
    remotePlayerId: court.profile?.playerId ?? null,
  })
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const { state: session, dispatch: sessionDispatch, ready: sessionReady, error: sessionError } =
    useSession({
      courtId,
      uid: auth.user?.uid ?? null,
      isAdmin: court.isAdmin,
    })
  const canEdit =
    !session.createdBy ||
    !auth.user ||
    session.createdBy === auth.user.uid ||
    court.isAdmin
  const { state: match, dispatch: matchDispatch } = useMatch()
  const { history, saveSession, clearHistory } = useHistory(courtId)
  const { liveMatch } = useLiveMatch(courtId)

  // Effective match state: if THIS tab is scoring, use the local reducer
  // (highest-fidelity). Otherwise fall back to the shared /liveMatch doc so
  // spectators watching on another device see the same score.
  const effectiveMatch: MatchState = match.phase !== 'idle' ? match : liveMatch ?? match

  // If the remote tournament disappears (admin or host deleted it), any
  // in-flight local match is orphaned. Reset the match reducer so the banner,
  // scoreboard, and /liveMatch/current sync drop to idle on every device.
  const prevHasTournamentRef = useRef(Boolean(session.createdBy))
  useEffect(() => {
    const has = Boolean(session.createdBy)
    if (prevHasTournamentRef.current && !has && match.phase !== 'idle') {
      matchDispatch({ type: 'RESET' })
    }
    prevHasTournamentRef.current = has
  }, [session.createdBy, match.phase, matchDispatch])

  // Scorer → Firestore sync. Whenever the local match state changes and we
  // have a court, push a compact snapshot to /courts/{courtId}/liveMatch/current
  // so every other member subscribed via useLiveMatch gets the live update.
  const lastPhaseRef = useRef<MatchState['phase']>('idle')
  useEffect(() => {
    if (!courtId || !auth.user) return
    const db = firestore()
    if (!db) return
    const ref = doc(db, 'courts', courtId, 'liveMatch', 'current')
    if (match.phase !== 'idle') {
      // Firestore rejects nested arrays, so split the teamPlayers tuple into
      // two top-level arrays before writing. useLiveMatch rebuilds the tuple
      // on read.
      const { events: _events, teamPlayers, ...rest } = match
      setDoc(ref, {
        ...rest,
        teamAPlayers: teamPlayers?.[0] ?? [],
        teamBPlayers: teamPlayers?.[1] ?? [],
        scorerUid: auth.user.uid,
        updatedAt: serverTimestamp(),
      }).catch(err => console.error('[courtpals] liveMatch write failed:', err?.message ?? err))
    } else if (lastPhaseRef.current !== 'idle') {
      // Local match just went from playing/finished to idle (reset / saved);
      // clear the shared doc so spectators stop seeing a stale scoreboard.
      deleteDoc(ref).catch(err =>
        console.error('[courtpals] liveMatch delete failed:', err?.message ?? err),
      )
    }
    lastPhaseRef.current = match.phase
  }, [match, courtId, auth.user])

  const activeFixture = session.fixtures.find(f => f.id === session.activeFixtureId) ?? null

  // Which team does the signed-in player belong to for this session?
  // Used to highlight their matches + standings row.
  const myTeamId = useMemo(() => {
    if (!currentPlayerId) return null
    return (
      session.teams.find(t => t.players.some(p => p.id === currentPlayerId))?.id ?? null
    )
  }, [session.teams, currentPlayerId])
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
    if (!canEdit) return
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
        teamPlayers: [tA.players, tB.players],
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
      teamSize: session.teamSize,
      teams: session.teams,
      fixtures: session.fixtures,
    }
    saveSession(saved)
    sessionDispatch({ type: 'RESET_SESSION' })
    setSelectedIds(new Set())
    setTab('history')
  }

  return (
    <AuthGate>
    <main className="relative flex min-h-screen flex-col pb-[calc(env(safe-area-inset-bottom)+72px)] lg:pb-0">
      {/* Top app bar */}
      <header className="sticky top-0 z-30 border-b border-[var(--color-line)]/60 bg-[var(--color-bg)]/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-xl items-center justify-between gap-6 px-4 py-3 lg:max-w-350 lg:px-10 lg:py-4">
          <div className="flex items-center gap-2">
            <span
              aria-hidden
              className="flex h-8 w-8 items-center justify-center rounded-xl bg-[var(--color-lime)] text-lg text-[var(--color-bg)] lg:h-10 lg:w-10 lg:text-xl"
            >
              🏸
            </span>
            <div className="flex flex-col">
              <span className="font-display text-[9px] font-bold uppercase tracking-[0.22em] text-[var(--color-ink-dim)] leading-none">
                {court.court?.name ? 'CourtPals' : 'saturday league'}
              </span>
              <span className="font-display text-base font-extrabold leading-tight text-[var(--color-chalk)] lg:text-xl">
                {court.court?.name ?? 'CourtPals'}
              </span>
            </div>
          </div>

          {/* Desktop inline tabs */}
          <nav className="hidden lg:block" aria-label="Primary">
            <ul className="flex items-center gap-1 rounded-2xl border border-border bg-muted/40 p-1">
              {DESKTOP_TABS.map(t => {
                const disabled = t.id === 'score' && !scoreTabEnabled
                const isActive = tab === t.id
                const { Icon } = t
                return (
                  <li key={t.id}>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => !disabled && setTab(t.id)}
                      disabled={disabled}
                      aria-current={isActive ? 'page' : undefined}
                      className={cn(
                        'h-9 gap-2 rounded-xl px-3 font-display text-[11px] font-bold uppercase tracking-[0.14em]',
                        isActive
                          ? 'bg-primary/15 text-primary hover:bg-primary/20'
                          : disabled
                          ? 'text-muted-foreground/40'
                          : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground',
                      )}
                    >
                      <Icon className="size-4" />
                      {t.label}
                      {t.id === 'score' && scoreTabEnabled && !isActive && (
                        <span aria-hidden className="ml-0.5 size-1.5 animate-live rounded-full bg-primary" />
                      )}
                    </Button>
                  </li>
                )
              })}
            </ul>
          </nav>

          <div className="flex items-center gap-3">
            <span
              suppressHydrationWarning
              className="hidden font-score text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--color-ink-dim)] sm:inline lg:text-xs"
            >
              {todayLabel}
            </span>
            <UserMenu
              players={registry}
              currentPlayerId={currentPlayerId}
              history={history}
              onSignIn={setCurrentPlayer}
              onSignOut={clearCurrentPlayer}
              onUpdatePlayer={updatePlayer}
            />
          </div>
        </div>
      </header>

      <WinCelebration
        open={match.phase === 'finished' && match.winner !== null}
        winnerName={match.winner !== null ? match.teamNames[match.winner] : ''}
        winnerEmoji={match.winner !== null ? match.teamEmojis[match.winner] : '🏆'}
        scores={match.scores}
        onDismiss={handleMatchWin}
      />

      {/* Tab body */}
      <div className="mx-auto w-full max-w-xl flex-1 lg:max-w-350 lg:px-6">
        {tab === 'league' && (
          <LeagueHub
            session={session}
            allPlayers={registry}
            selectedIds={selectedIds}
            onTogglePlayer={handleTogglePlayer}
            dispatch={sessionDispatch}
            onStartFixture={handleStartFixture}
            onSaveSession={handleSaveSession}
            match={effectiveMatch}
            onOpenScoreboard={() => setTab('score')}
            canEdit={canEdit}
            currentUid={auth.user?.uid ?? ''}
            sessionReady={sessionReady}
            sessionError={sessionError}
            myTeamId={myTeamId}
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
        {tab === 'score' && (
          <ScoreBoard
            state={match}
            dispatch={matchDispatch}
            onAbandon={() => {
              if (match.fixtureId) {
                sessionDispatch({ type: 'ABANDON_FIXTURE', payload: match.fixtureId })
              }
              matchDispatch({ type: 'RESET' })
              setTab('league')
            }}
          />
        )}
        {tab === 'history' && (
          <HistoryCalendar history={history} onClearHistory={clearHistory} />
        )}
      </div>

      <TabNav active={tab} scoreEnabled={scoreTabEnabled} onChange={setTab} />
    </main>
    </AuthGate>
  )
}
