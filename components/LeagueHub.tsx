'use client'

import { useEffect, useState } from 'react'
import { Trophy, Dices } from 'lucide-react'
import DaySetup from './DaySetup'
import TeamBuilder from './TeamBuilder'
import FixtureList from './FixtureList'
import Standings from './Standings'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
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

  useEffect(() => {
    if (session.phase === 'setup' && view !== 'checkin' && view !== 'teams') setView('checkin')
    if ((session.phase === 'active' || session.phase === 'playoffs') && view === 'checkin')
      setView('fixtures')
    if (session.phase === 'done' && view !== 'standings' && view !== 'fixtures') setView('standings')
  }, [session.phase, view])

  function handleAutoSplit() {
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

  function handleReset() {
    dispatch({ type: 'RESET_SESSION' })
    setView('checkin')
  }

  const isSetupPhase = session.phase === 'setup'
  const subTabs: { id: LeagueView; label: string }[] = isSetupPhase
    ? [
        { id: 'checkin', label: 'Check-in' },
        { id: 'teams', label: 'Teams' },
      ]
    : [
        { id: 'fixtures', label: 'Fixtures' },
        { id: 'standings', label: 'Table' },
      ]

  const canReset =
    session.phase === 'done' ||
    ((session.phase === 'active' || session.phase === 'playoffs') &&
      session.fixtures.every(f => f.status === 'pending')) ||
    (session.phase === 'setup' && session.teams.length > 0)

  return (
    <div className="flex flex-col">
      <div className="flex items-center gap-2 border-b border-border/60 bg-background/90 px-4 py-2 backdrop-blur-md">
        <Tabs value={view} onValueChange={v => setView(v as LeagueView)}>
          <TabsList>
            {subTabs.map(t => (
              <TabsTrigger
                key={t.id}
                value={t.id}
                className="font-display text-[11px] font-extrabold uppercase tracking-[0.16em]"
              >
                {t.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        <div className="flex-1" />
        {canReset && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                Reset
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle className="font-display">Reset this session?</AlertDialogTitle>
                <AlertDialogDescription>
                  All teams and fixtures will be cleared. The player roster is unaffected.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleReset}>Reset session</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>

      {view === 'checkin' && (
        <DaySetup
          allPlayers={allPlayers}
          selectedIds={selectedIds}
          onToggle={onTogglePlayer}
          winTarget={session.winTarget}
          teamSize={session.teamSize}
          dispatch={dispatch}
          onAutoSplit={handleAutoSplit}
        />
      )}

      {view === 'teams' && session.teams.length > 0 && (
        <TeamBuilder
          teams={session.teams}
          teamSize={session.teamSize}
          dispatch={dispatch}
          onReRandomize={handleAutoSplit}
          onStartSession={handleStartSession}
        />
      )}

      {view === 'teams' && session.teams.length === 0 && (
        <div className="px-4 py-10">
          <Empty className="border-2">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <Dices />
              </EmptyMedia>
              <EmptyTitle className="font-display font-bold">No teams yet</EmptyTitle>
              <EmptyDescription>
                Check in players and tap &quot;Split into teams&quot; first.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
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
              <Button
                size="lg"
                onClick={onSaveSession}
                className="h-auto w-full justify-between rounded-2xl border-2 border-primary px-5 py-4 shadow-brut active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
              >
                <span className="flex flex-col items-start leading-none">
                  <span className="font-display text-xs font-bold uppercase tracking-[0.18em] opacity-70">
                    that&apos;s a wrap
                  </span>
                  <span className="font-display text-lg font-extrabold">Save day results</span>
                </span>
                <Trophy className="size-6" />
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
