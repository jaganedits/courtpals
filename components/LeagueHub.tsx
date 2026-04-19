'use client'

import { useEffect, useState } from 'react'
import { Trophy, Dices, CalendarCheck, Play } from 'lucide-react'
import DaySetup from './DaySetup'
import TeamBuilder from './TeamBuilder'
import FixtureList from './FixtureList'
import Standings from './Standings'
import LiveMatchBanner from './LiveMatchBanner'
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
import { cn } from '@/lib/utils'
import type { DaySession, MatchState, SessionAction, SessionPlayer } from '@/types'

type LeagueView = 'checkin' | 'teams' | 'fixtures' | 'standings'

interface Props {
  session: DaySession
  allPlayers: SessionPlayer[]
  selectedIds: Set<string>
  onTogglePlayer: (id: string) => void
  dispatch: React.Dispatch<SessionAction>
  onStartFixture: (fixtureId: string) => void
  onSaveSession: () => void
  match?: MatchState
  onOpenScoreboard?: () => void
  /** False when a tournament is in progress and the current user is not its creator. */
  canEdit?: boolean
  /** uid stamped as createdBy when the current user starts a tournament. */
  currentUid?: string
}

export default function LeagueHub({
  session,
  allPlayers,
  selectedIds,
  onTogglePlayer,
  dispatch,
  onStartFixture,
  onSaveSession,
  match,
  onOpenScoreboard,
  canEdit = true,
  currentUid = '',
}: Props) {
  const [view, setView] = useState<LeagueView>(() =>
    session.phase === 'setup'
      ? 'checkin'
      : session.phase === 'done'
      ? 'standings'
      : 'fixtures',
  )

  useEffect(() => {
    if (session.phase === 'setup' && view !== 'checkin' && view !== 'teams') setView('checkin')
    if (session.phase === 'scheduled' && view !== 'teams' && view !== 'fixtures')
      setView('fixtures')
    if ((session.phase === 'active' || session.phase === 'playoffs') && view === 'checkin')
      setView('fixtures')
    if (session.phase === 'done' && view !== 'standings' && view !== 'fixtures') setView('standings')
  }, [session.phase, view])

  function handleAutoSplit() {
    if (!canEdit) return
    session.players.forEach(p => dispatch({ type: 'REMOVE_PLAYER', payload: p.id }))
    const todaysPlayers = allPlayers.filter(p => selectedIds.has(p.id))
    todaysPlayers.forEach(p => dispatch({ type: 'ADD_PLAYER', payload: p }))
    dispatch({ type: 'AUTO_SPLIT_TEAMS' })
    setView('teams')
  }

  function handleStartSession() {
    dispatch({ type: 'START_SESSION', payload: { createdBy: currentUid } })
    setView('fixtures')
  }

  function handleStartFixture(fid: string) {
    if (session.phase === 'scheduled') dispatch({ type: 'BEGIN_PLAY' })
    dispatch({ type: 'START_FIXTURE', payload: fid })
    onStartFixture(fid)
  }

  function handleReset() {
    if (!canEdit) return
    dispatch({ type: 'RESET_SESSION' })
    setView('checkin')
  }

  const isSetupPhase = session.phase === 'setup'
  const isScheduled = session.phase === 'scheduled'
  const subTabs: { id: LeagueView; label: string }[] = isSetupPhase
    ? [
        { id: 'checkin', label: 'Check-in' },
        { id: 'teams', label: 'Teams' },
      ]
    : isScheduled
    ? [
        { id: 'teams', label: 'Teams' },
        { id: 'fixtures', label: 'Fixtures' },
      ]
    : [
        { id: 'fixtures', label: 'Fixtures' },
        { id: 'standings', label: 'Table' },
      ]

  const playedCount = session.fixtures.filter(f => f.status !== 'pending').length
  const canReset =
    canEdit && (session.phase !== 'setup' || session.teams.length > 0)

  const showSplit = !isSetupPhase && !isScheduled // only active / playoffs / done use the split view
  const saveButton =
    canEdit && session.phase === 'done' ? (
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
    ) : null

  const hasProgress = playedCount > 0
  const resetDialog = canReset ? (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          variant={hasProgress ? 'outline' : 'ghost'}
          size="sm"
          className={cn(
            'text-destructive hover:text-destructive',
            hasProgress && 'border-destructive/40 hover:bg-destructive/10',
          )}
        >
          {hasProgress ? 'Delete tournament' : 'Reset'}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="font-display">
            {hasProgress ? 'Delete this tournament?' : 'Reset this session?'}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {hasProgress ? (
              <>
                <strong>{playedCount}</strong> of <strong>{session.fixtures.length}</strong> matches
                have been played. All scores, teams, and fixtures will be permanently discarded.
                The player roster is unaffected.
              </>
            ) : (
              'All teams and fixtures will be cleared. The player roster is unaffected.'
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleReset}
            className={cn(hasProgress && 'bg-destructive text-destructive-foreground hover:bg-destructive/90')}
          >
            {hasProgress ? 'Delete tournament' : 'Reset session'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  ) : null

  const scheduledDateLabel = isScheduled
    ? new Date(session.date).toLocaleDateString('default', {
        weekday: 'long',
        month: 'short',
        day: 'numeric',
      })
    : ''

  return (
    <div className="flex flex-col">
      {match && onOpenScoreboard && (match.phase === 'playing' || match.phase === 'finished') && (
        <div className="px-4 pt-4 lg:px-6">
          <LiveMatchBanner match={match} onOpen={onOpenScoreboard} />
        </div>
      )}

      {isScheduled && (
        <div className="mx-4 mt-4 flex flex-col gap-3 rounded-2xl border-2 border-primary/40 bg-primary/10 p-4 lg:mx-6 lg:flex-row lg:items-center">
          <div className="flex items-start gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/20">
              <CalendarCheck className="size-5 text-primary" />
            </span>
            <div className="min-w-0">
              <p className="font-display text-[10px] font-bold uppercase tracking-[0.22em] text-primary">
                ready to play
              </p>
              <p className="font-display text-lg font-extrabold leading-tight">
                Match day · {scheduledDateLabel}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {session.teams.length} teams &middot; {session.fixtures.length} fixtures queued
              </p>
            </div>
          </div>
          {canEdit ? (
            <Button
              size="lg"
              onClick={() => dispatch({ type: 'BEGIN_PLAY' })}
              className="h-auto justify-between gap-2 rounded-xl border-2 border-primary px-4 py-3 shadow-brut active:translate-x-0.5 active:translate-y-0.5 active:shadow-none lg:ml-auto"
            >
              <Play className="size-4" />
              <span className="font-display text-sm font-extrabold uppercase tracking-[0.14em]">
                Start playing
              </span>
            </Button>
          ) : (
            <span className="lg:ml-auto rounded-xl border border-border bg-background/60 px-3 py-2 font-display text-[11px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
              waiting for host to start
            </span>
          )}
        </div>
      )}

      {/* Sub-tab bar: always visible during setup/scheduled; mobile-only when in active/playoffs/done (desktop shows both) */}
      <div
        className={cn(
          'flex items-center gap-2 border-b border-border/60 bg-background/90 px-4 py-2 backdrop-blur-md',
          showSplit && 'lg:hidden',
        )}
      >
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
        {resetDialog}
      </div>

      {view === 'checkin' && !canEdit && (
        <div className="px-4 py-10 lg:px-6">
          <Empty className="border-2 border-dashed">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <Trophy />
              </EmptyMedia>
              <EmptyTitle className="font-display font-bold">
                Waiting for the host
              </EmptyTitle>
              <EmptyDescription>
                Someone else is setting up today&apos;s tournament for this court. The
                fixtures and standings will appear here as soon as they hit Start tournament.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        </div>
      )}

      {view === 'checkin' && canEdit && (
        <DaySetup
          allPlayers={allPlayers}
          selectedIds={selectedIds}
          onToggle={onTogglePlayer}
          winTarget={session.winTarget}
          teamSize={session.teamSize}
          sessionDate={session.date}
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

      {/* Scheduled: render the preview view picked by the sub-tab */}
      {isScheduled && view === 'fixtures' && (
        <FixtureList
          fixtures={session.fixtures}
          teams={session.teams}
          onStartFixture={canEdit ? handleStartFixture : () => {}}
          onResetFixture={canEdit ? fid => dispatch({ type: 'RESET_FIXTURE', payload: fid }) : undefined}
          canEdit={canEdit}
        />
      )}

      {/* Mobile (single view based on sub-tab) */}
      {showSplit && (
        <div className="lg:hidden">
          {view === 'fixtures' && (
            <FixtureList
              fixtures={session.fixtures}
              teams={session.teams}
              onStartFixture={canEdit ? handleStartFixture : () => {}}
              onResetFixture={canEdit ? fid => dispatch({ type: 'RESET_FIXTURE', payload: fid }) : undefined}
              canEdit={canEdit}
            />
          )}
          {view === 'standings' && (
            <>
              <Standings teams={session.teams} fixtures={session.fixtures} />
              {saveButton && (
                <div className="sticky bottom-[calc(env(safe-area-inset-bottom)+72px)] z-30 px-4 pb-2">
                  {saveButton}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Desktop split view */}
      {showSplit && (
        <div className="hidden lg:block">
          {canReset && (
            <div className="flex justify-end pt-4 pr-4">{resetDialog}</div>
          )}
          <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
            <FixtureList
              fixtures={session.fixtures}
              teams={session.teams}
              onStartFixture={canEdit ? handleStartFixture : () => {}}
              onResetFixture={canEdit ? fid => dispatch({ type: 'RESET_FIXTURE', payload: fid }) : undefined}
              canEdit={canEdit}
            />
            <aside className="flex flex-col gap-4">
              <Standings teams={session.teams} fixtures={session.fixtures} />
              {saveButton && <div className="px-4 pb-6">{saveButton}</div>}
            </aside>
          </div>
        </div>
      )}
    </div>
  )
}
