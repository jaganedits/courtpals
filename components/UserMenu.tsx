'use client'

import { useMemo, useState } from 'react'
import { LogIn, LogOut, Pencil, Trophy, Calendar } from 'lucide-react'
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
import { computePlayerStats, recentSessionsForPlayer } from '@/lib/player-stats'
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
  onAddPlayer: (player: SessionPlayer) => void
}

export default function UserMenu({
  players,
  currentPlayerId,
  history,
  onSignIn,
  onSignOut,
  onUpdatePlayer,
  onAddPlayer,
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
        onAddPlayer={onAddPlayer}
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
  onAddPlayer,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  players: SessionPlayer[]
  onSignIn: (id: string) => void
  onAddPlayer: (player: SessionPlayer) => void
}) {
  const [newName, setNewName] = useState('')

  function handleCreate() {
    const trimmed = newName.trim()
    if (!trimmed) return
    const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`
    onAddPlayer({ id, name: trimmed, emoji: '🏸' })
    setNewName('')
    onSignIn(id)
  }

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
            No players yet. Add yourself below.
          </p>
        )}

        <Separator />

        <div className="flex flex-col gap-2">
          <p className="font-display text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
            or add yourself
          </p>
          <div className="flex gap-2">
            <Input
              placeholder="Your name"
              value={newName}
              maxLength={20}
              onChange={e => setNewName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleCreate()}
              className="font-display font-semibold"
            />
            <Button
              type="button"
              onClick={handleCreate}
              disabled={!newName.trim()}
              className="font-display font-extrabold"
            >
              Join
            </Button>
          </div>
        </div>
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

