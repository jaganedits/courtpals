'use client'

import { useEffect, useMemo, useState } from 'react'
import { LogIn, LogOut, Pencil, Trophy, Calendar, Copy, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { isFirebaseConfigured } from '@/lib/firebase'
import { useAuth } from '@/hooks/useAuth'
import { useCourt } from '@/hooks/useCourt'
import { computePlayerStats, recentSessionsForPlayer } from '@/lib/player-stats'
import CourtBootstrapDialog from '@/components/CourtBootstrapDialog'
import type { SavedSession, SessionPlayer } from '@/types'

const EMOJIS = [
  '🏸', '🔥', '⚡', '🌟', '💪', '🦁', '🐯', '🦊', '🐺', '🦅',
  '🐉', '🌊', '⛰️', '🍀', '💎', '🎯', '🚀', '👑', '🥷', '🦸',
  '🌶️', '🧨', '🎸', '🪩', '🛸', '🦄', '🐙', '🦖', '🧩', '🪐',
]

interface Props {
  players: SessionPlayer[]
  currentPlayerId: string | null
  history: SavedSession[]
  onSignIn: (playerId: string) => void
  onSignOut: () => void
  onUpdatePlayer: (player: SessionPlayer) => void
}

export default function UserMenu(props: Props) {
  if (isFirebaseConfigured()) {
    return <FirebaseUserMenu {...props} />
  }
  return <LocalUserMenu {...props} />
}

function LocalUserMenu({
  players,
  currentPlayerId,
  history,
  onSignIn,
  onSignOut,
  onUpdatePlayer,
}: Props) {
  const [open, setOpen] = useState(false)

  const currentPlayer = useMemo(
    () => players.find(p => p.id === currentPlayerId) ?? null,
    [players, currentPlayerId],
  )

  if (!currentPlayer) {
    return (
      <SignInDialog
        open={open}
        onOpenChange={setOpen}
        players={players}
        onSignIn={(id) => {
          onSignIn(id)
          setOpen(false)
        }}
      />
    )
  }

  return (
    <ProfileDialog
      open={open}
      onOpenChange={setOpen}
      player={currentPlayer}
      history={history}
      onUpdatePlayer={onUpdatePlayer}
      onSignOut={() => {
        onSignOut()
        setOpen(false)
      }}
    />
  )
}

function SignInDialog({
  open,
  onOpenChange,
  players,
  onSignIn,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  players: SessionPlayer[]
  onSignIn: (id: string) => void
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <LogIn className="size-4" />
          <span className="font-display text-[11px] font-extrabold uppercase tracking-[0.14em]">
            Sign in
          </span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-xl font-extrabold">
            Who are you?
          </DialogTitle>
          <DialogDescription>
            Tap your name to pick yourself. This device will remember you.
          </DialogDescription>
        </DialogHeader>

        {players.length > 0 ? (
          <div className="flex max-h-72 flex-col gap-1.5 overflow-y-auto">
            {players.map(p => (
              <button
                key={p.id}
                type="button"
                onClick={() => onSignIn(p.id)}
                className="flex items-center gap-3 rounded-xl border-2 border-border bg-card px-3 py-2.5 text-left transition-all hover:border-primary/40 hover:bg-primary/5 active:scale-[0.98]"
              >
                <span className="text-xl leading-none">{p.emoji}</span>
                <span className="font-display text-sm font-extrabold">{p.name}</span>
              </button>
            ))}
          </div>
        ) : (
          <p className="rounded-xl border-2 border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground">
            No players on the roster yet. Ask your admin to add you.
          </p>
        )}
      </DialogContent>
    </Dialog>
  )
}

function ProfileDialog({
  open,
  onOpenChange,
  player,
  history,
  onUpdatePlayer,
  onSignOut,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  player: SessionPlayer
  history: SavedSession[]
  onUpdatePlayer: (player: SessionPlayer) => void
  onSignOut: () => void
}) {
  const [editing, setEditing] = useState(false)
  const [draftName, setDraftName] = useState(player.name)
  const [draftEmoji, setDraftEmoji] = useState(player.emoji)

  const stats = useMemo(() => computePlayerStats(history, player.id), [history, player.id])
  const recent = useMemo(
    () => recentSessionsForPlayer(history, player.id, 5),
    [history, player.id],
  )

  function beginEdit() {
    setDraftName(player.name)
    setDraftEmoji(player.emoji)
    setEditing(true)
  }

  function saveEdit() {
    const trimmed = draftName.trim()
    if (!trimmed) {
      setEditing(false)
      return
    }
    onUpdatePlayer({ ...player, name: trimmed, emoji: draftEmoji })
    setEditing(false)
  }

  const winPct = Math.round(stats.winRate * 100)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <button
          type="button"
          className="group flex items-center gap-2 rounded-full border border-border bg-card px-2 py-1 transition-colors hover:border-primary/40 hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
        >
          <span className="flex size-7 items-center justify-center rounded-full bg-primary/15 text-base">
            {player.emoji}
          </span>
          <span className="hidden pr-1.5 font-display text-[11px] font-extrabold uppercase tracking-[0.14em] sm:inline">
            {player.name}
          </span>
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="sr-only">Your profile</DialogTitle>
          <DialogDescription className="sr-only">
            View stats and edit your name or emoji.
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center gap-4">
          <span className="flex size-16 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-4xl">
            {editing ? draftEmoji : player.emoji}
          </span>
          <div className="min-w-0 flex-1">
            {editing ? (
              <Input
                autoFocus
                value={draftName}
                maxLength={20}
                onChange={e => setDraftName(e.target.value)}
                className="h-9 font-display text-lg font-extrabold"
                onKeyDown={e => {
                  if (e.key === 'Enter') saveEdit()
                  if (e.key === 'Escape') setEditing(false)
                }}
              />
            ) : (
              <h2 className="font-display text-2xl font-extrabold leading-tight">
                {player.name}
              </h2>
            )}
            <p className="font-display text-[10px] font-bold uppercase tracking-[0.22em] text-muted-foreground">
              your profile
            </p>
          </div>
          {!editing && (
            <Button
              variant="outline"
              size="icon-sm"
              onClick={beginEdit}
              aria-label="Edit profile"
            >
              <Pencil />
            </Button>
          )}
        </div>

        {editing && (
          <div className="flex flex-col gap-2">
            <p className="font-display text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
              Pick your emoji
            </p>
            <ToggleGroup
              type="single"
              value={draftEmoji}
              onValueChange={v => v && setDraftEmoji(v)}
              className="grid grid-cols-10 gap-1.5"
            >
              {EMOJIS.map(e => (
                <ToggleGroupItem
                  key={e}
                  value={e}
                  aria-label={`Emoji ${e}`}
                  className="aspect-square size-auto rounded-lg border border-border bg-secondary text-lg data-[state=on]:bg-primary/15 data-[state=on]:border-primary data-[state=on]:scale-110 transition-transform"
                >
                  {e}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="ghost" size="sm" onClick={() => setEditing(false)}>
                Cancel
              </Button>
              <Button size="sm" onClick={saveEdit} disabled={!draftName.trim()}>
                Save
              </Button>
            </div>
          </div>
        )}

        {!editing && (
          <>
            <Separator />

            <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Stat label="sessions" value={stats.sessionsPlayed} />
              <Stat label="matches" value={stats.matchesPlayed} />
              <Stat label="wins" value={stats.wins} accent />
              <Stat label="losses" value={stats.losses} />
            </section>

            <section className="flex items-center gap-3 rounded-xl border-2 border-border bg-card px-4 py-3">
              <Trophy className="size-5 text-primary" />
              <div className="flex-1">
                <p className="font-display text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                  championships
                </p>
                <p className="font-display text-xl font-extrabold leading-tight">
                  {stats.championships}
                </p>
              </div>
              <div className="text-right">
                <p className="font-display text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                  win rate
                </p>
                <p className="font-score text-xl font-extrabold tabular text-primary">
                  {winPct}%
                </p>
              </div>
            </section>

            {recent.length > 0 && (
              <section className="flex flex-col gap-2">
                <p className="font-display text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                  Recent sessions
                </p>
                <div className="flex flex-col gap-1.5">
                  {recent.map(r => (
                    <div
                      key={r.id}
                      className="flex items-center gap-3 rounded-xl border border-border bg-card px-3 py-2"
                    >
                      <Calendar className="size-4 shrink-0 text-muted-foreground" />
                      <div className="min-w-0 flex-1">
                        <p className="font-display text-xs font-bold">
                          {new Date(r.date).toLocaleDateString('default', {
                            month: 'short',
                            day: 'numeric',
                          })}
                          <span className="ml-2 text-muted-foreground">· {r.teamName}</span>
                        </p>
                        <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                          {r.wins}W · {r.losses}L
                        </p>
                      </div>
                      {r.wasChampion && (
                        <Badge className="gap-1 font-display text-[10px] uppercase tracking-[0.14em]">
                          <Trophy className="size-3" />
                          champion
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {stats.sessionsPlayed === 0 && (
              <p className="rounded-xl border-2 border-dashed border-border px-4 py-4 text-center text-sm text-muted-foreground">
                No saved sessions yet. Play a Saturday and save the day to build your stats.
              </p>
            )}
          </>
        )}

        <DialogFooter className="sm:justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={onSignOut}
            className={cn('gap-2 text-destructive hover:text-destructive')}
          >
            <LogOut className="size-4" />
            Sign out
          </Button>
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
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
    <div className="flex flex-col items-center rounded-xl border border-border bg-card py-2.5">
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

// ─── Firebase-backed user menu ──────────────────────────────────────────────

function FirebaseUserMenu({ players, history, onSignOut: onLocalSignOut }: Props) {
  const auth = useAuth()
  const court = useCourt(auth.user)
  const [profileOpen, setProfileOpen] = useState(false)
  const [bootstrapOpen, setBootstrapOpen] = useState(false)

  useEffect(() => {
    // When a user signs in with no court yet, prompt them to create/join one.
    if (auth.user && !court.loading && !court.profile?.courtId) {
      setBootstrapOpen(true)
    } else {
      setBootstrapOpen(false)
    }
  }, [auth.user, court.loading, court.profile?.courtId])

  if (auth.loading) {
    return (
      <div className="flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1">
        <span className="size-3 animate-pulse rounded-full bg-muted" />
        <span className="font-display text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
          loading
        </span>
      </div>
    )
  }

  if (!auth.user) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={() => auth.signInWithGoogle()}
        className="gap-2"
      >
        <LogIn className="size-4" />
        <span className="font-display text-[11px] font-extrabold uppercase tracking-[0.14em]">
          Sign in with Google
        </span>
      </Button>
    )
  }

  const displayName = auth.user.displayName ?? 'Player'
  const avatarLetter = displayName.trim().charAt(0).toUpperCase() || '?'

  return (
    <>
      <Dialog open={profileOpen} onOpenChange={setProfileOpen}>
        <DialogTrigger asChild>
          <button
            type="button"
            className="group flex items-center gap-2 rounded-full border border-border bg-card pl-1 pr-2 py-1 transition-colors hover:border-primary/40 hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
          >
            {auth.user.photoURL ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={auth.user.photoURL}
                alt=""
                className="size-7 rounded-full"
                referrerPolicy="no-referrer"
              />
            ) : (
              <span className="flex size-7 items-center justify-center rounded-full bg-primary/15 font-display text-xs font-extrabold text-primary">
                {avatarLetter}
              </span>
            )}
            <span className="hidden font-display text-[11px] font-extrabold uppercase tracking-[0.14em] sm:inline">
              {displayName.split(' ')[0]}
            </span>
            {court.isAdmin && (
              <Badge className="hidden font-display text-[9px] uppercase tracking-[0.14em] sm:inline-flex">
                admin
              </Badge>
            )}
          </button>
        </DialogTrigger>
        <FirebaseProfileDialogContent
          auth={auth}
          court={court}
          players={players}
          history={history}
          onClose={() => setProfileOpen(false)}
          onLocalSignOut={onLocalSignOut}
        />
      </Dialog>

      <CourtBootstrapDialog
        open={bootstrapOpen}
        onOpenChange={setBootstrapOpen}
        onCreateCourt={court.createCourt}
        onJoinCourt={court.joinCourt}
        title={`Welcome, ${displayName.split(' ')[0]}`}
        description="Pick a court to get started. Create a new one if you're the host, or paste an invite code to join your friends."
      />
    </>
  )
}

function FirebaseProfileDialogContent({
  auth,
  court,
  players,
  history,
  onClose,
  onLocalSignOut,
}: {
  auth: ReturnType<typeof useAuth>
  court: ReturnType<typeof useCourt>
  players: SessionPlayer[]
  history: SavedSession[]
  onClose: () => void
  onLocalSignOut: () => void
}) {
  const [copied, setCopied] = useState(false)

  const linkedPlayer = useMemo(() => {
    if (!court.profile?.playerId) return null
    return players.find(p => p.id === court.profile?.playerId) ?? null
  }, [court.profile?.playerId, players])

  const stats = useMemo(
    () => (linkedPlayer ? computePlayerStats(history, linkedPlayer.id) : null),
    [history, linkedPlayer],
  )
  const recent = useMemo(
    () => (linkedPlayer ? recentSessionsForPlayer(history, linkedPlayer.id, 5) : []),
    [history, linkedPlayer],
  )

  function copyInvite() {
    if (!court.court?.inviteCode) return
    navigator.clipboard.writeText(court.court.inviteCode).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    })
  }

  return (
    <DialogContent className="max-w-lg">
      <DialogHeader>
        <DialogTitle className="sr-only">Your profile</DialogTitle>
        <DialogDescription className="sr-only">
          Account, court, and stats.
        </DialogDescription>
      </DialogHeader>

      <div className="flex items-center gap-4">
        {auth.user?.photoURL ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={auth.user.photoURL}
            alt=""
            className="size-16 rounded-2xl"
            referrerPolicy="no-referrer"
          />
        ) : (
          <span className="flex size-16 items-center justify-center rounded-2xl bg-primary/10 font-display text-3xl font-extrabold text-primary">
            {(auth.user?.displayName ?? '?').charAt(0).toUpperCase()}
          </span>
        )}
        <div className="min-w-0 flex-1">
          <h2 className="truncate font-display text-2xl font-extrabold leading-tight">
            {auth.user?.displayName ?? 'Signed in'}
          </h2>
          <p className="truncate text-xs text-muted-foreground">{auth.user?.email}</p>
          <div className="mt-1 flex items-center gap-1.5">
            {court.isAdmin ? (
              <Badge className="font-display text-[9px] uppercase tracking-[0.14em]">admin</Badge>
            ) : court.court ? (
              <Badge variant="secondary" className="font-display text-[9px] uppercase tracking-[0.14em]">
                player
              </Badge>
            ) : (
              <Badge variant="outline" className="font-display text-[9px] uppercase tracking-[0.14em] text-muted-foreground">
                no court
              </Badge>
            )}
          </div>
        </div>
      </div>

      {court.court && (
        <section className="flex items-center gap-3 rounded-xl border-2 border-border bg-card px-4 py-3">
          <div className="min-w-0 flex-1">
            <p className="font-display text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
              court
            </p>
            <p className="truncate font-display text-base font-extrabold">{court.court.name}</p>
          </div>
          <button
            type="button"
            onClick={copyInvite}
            className="flex flex-col items-end gap-0.5 rounded-lg px-2 py-1 hover:bg-muted/60"
            aria-label="Copy invite code"
          >
            <span className="font-display text-[9px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
              invite code
            </span>
            <span className="flex items-center gap-1 font-score text-sm font-extrabold tabular tracking-[0.2em] text-primary">
              {court.court.inviteCode}
              {copied ? (
                <Check className="size-3 text-chart-2" />
              ) : (
                <Copy className="size-3 text-muted-foreground" />
              )}
            </span>
          </button>
        </section>
      )}

      {linkedPlayer && stats && (
        <>
          <Separator />
          <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat label="sessions" value={stats.sessionsPlayed} />
            <Stat label="matches" value={stats.matchesPlayed} />
            <Stat label="wins" value={stats.wins} accent />
            <Stat label="losses" value={stats.losses} />
          </section>

          {recent.length > 0 && (
            <section className="flex flex-col gap-2">
              <p className="font-display text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                Recent sessions
              </p>
              <div className="flex flex-col gap-1.5">
                {recent.map(r => (
                  <div
                    key={r.id}
                    className="flex items-center gap-3 rounded-xl border border-border bg-card px-3 py-2"
                  >
                    <Calendar className="size-4 shrink-0 text-muted-foreground" />
                    <div className="min-w-0 flex-1">
                      <p className="font-display text-xs font-bold">
                        {new Date(r.date).toLocaleDateString('default', {
                          month: 'short',
                          day: 'numeric',
                        })}
                        <span className="ml-2 text-muted-foreground">· {r.teamName}</span>
                      </p>
                      <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                        {r.wins}W · {r.losses}L
                      </p>
                    </div>
                    {r.wasChampion && (
                      <Badge className="gap-1 font-display text-[10px] uppercase tracking-[0.14em]">
                        <Trophy className="size-3" />
                        champion
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}
        </>
      )}

      {!linkedPlayer && court.court && (
        <p className={cn(
          'rounded-xl border-2 border-dashed border-border px-4 py-4 text-center text-sm text-muted-foreground',
        )}>
          You&apos;re signed in but not linked to a player record yet. The admin will add you to the
          roster, or data sync will claim the linkage on first save.
        </p>
      )}

      <DialogFooter className="sm:justify-between">
        <Button
          variant="ghost"
          size="sm"
          onClick={async () => {
            await auth.signOut()
            onLocalSignOut()
            onClose()
          }}
          className={cn('gap-2 text-destructive hover:text-destructive')}
        >
          <LogOut className="size-4" />
          Sign out
        </Button>
        <Button variant="outline" size="sm" onClick={onClose}>
          Close
        </Button>
      </DialogFooter>
    </DialogContent>
  )
}

