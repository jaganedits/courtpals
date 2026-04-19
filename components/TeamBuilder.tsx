'use client'

import { useState } from 'react'
import { Dices } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { cn } from '@/lib/utils'
import type { SessionTeam, SessionAction, TeamSize } from '@/types'

const TEAM_PALETTE = [
  { color: 'var(--color-team-a)' },
  { color: 'var(--color-team-b)' },
  { color: 'var(--color-team-c)' },
  { color: 'var(--color-team-d)' },
  { color: 'var(--color-team-e)' },
  { color: 'var(--color-team-f)' },
]

interface Props {
  teams: SessionTeam[]
  teamSize: TeamSize
  dispatch: React.Dispatch<SessionAction>
  onReRandomize: () => void
  onStartSession: () => void
}

export default function TeamBuilder({ teams, teamSize, dispatch, onReRandomize, onStartSession }: Props) {
  const [dragOverTeamId, setDragOverTeamId] = useState<string | null>(null)
  const [editingTeamId, setEditingTeamId] = useState<string | null>(null)
  const [draftName, setDraftName] = useState('')
  const matchCount = teams.length >= 2 ? (teams.length * (teams.length - 1)) / 2 : 0

  function beginEdit(team: SessionTeam) {
    setEditingTeamId(team.id)
    setDraftName(team.name)
  }

  function commitEdit(id: string) {
    const name = draftName.trim()
    if (name) dispatch({ type: 'UPDATE_TEAM_NAME', payload: { id, name } })
    setEditingTeamId(null)
  }

  function cancelEdit() {
    setEditingTeamId(null)
  }

  function handleDrop(e: React.DragEvent, targetTeamId: string) {
    e.preventDefault()
    const playerId = e.dataTransfer.getData('playerId')
    setDragOverTeamId(null)
    if (playerId) {
      dispatch({ type: 'ASSIGN_PLAYER_TO_TEAM', payload: { playerId, teamId: targetTeamId } })
    }
  }

  function handleDragStart(e: React.DragEvent, playerId: string) {
    e.dataTransfer.setData('playerId', playerId)
    e.dataTransfer.effectAllowed = 'move'
  }

  return (
    <div className="flex flex-col gap-5 px-4 pt-6 pb-8">
      <header className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-display text-[10px] font-bold uppercase tracking-[0.22em] text-muted-foreground">
            the draft
          </p>
          <h1 className="font-display text-3xl font-extrabold leading-none">Teams</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Drag players to shuffle, or re-roll the whole thing.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={onReRandomize} className="shrink-0">
          <Dices data-icon="inline-start" />
          Re-roll
        </Button>
      </header>

      {/* Mobile: grid of cards */}
      <div className="grid grid-cols-2 gap-3 lg:hidden">
        {teams.map((team, ti) => {
          const palette = TEAM_PALETTE[ti % TEAM_PALETTE.length]
          const isOver = dragOverTeamId === team.id
          return (
            <Card
              key={team.id}
              onDragOver={e => {
                e.preventDefault()
                if (dragOverTeamId !== team.id) setDragOverTeamId(team.id)
              }}
              onDragLeave={() => setDragOverTeamId(prev => (prev === team.id ? null : prev))}
              onDrop={e => handleDrop(e, team.id)}
              className={cn(
                'relative min-h-37 overflow-hidden border-2 py-0 transition-all',
                isOver && 'scale-[1.02]',
              )}
              style={{
                borderColor: palette.color,
                boxShadow: isOver ? `0 0 0 2px ${palette.color}, 0 0 24px -4px ${palette.color}80` : undefined,
              }}
            >
              <CardContent className="flex flex-col gap-3 p-3">
                <div className="flex items-center gap-2">
                  <span
                    aria-hidden
                    className="size-2.5 rounded-full"
                    style={{ background: palette.color }}
                  />
                  {editingTeamId === team.id ? (
                    <Input
                      autoFocus
                      value={draftName}
                      onChange={e => setDraftName(e.target.value)}
                      onBlur={() => commitEdit(team.id)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') commitEdit(team.id)
                        if (e.key === 'Escape') cancelEdit()
                      }}
                      maxLength={24}
                      className="h-7 min-w-0 flex-1 border-primary/60 px-2 font-display text-[11px] font-extrabold uppercase tracking-[0.18em]"
                    />
                  ) : (
                    <button
                      type="button"
                      onClick={() => beginEdit(team)}
                      className="min-w-0 truncate rounded-sm font-display text-[11px] font-extrabold uppercase tracking-[0.18em] hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
                    >
                      {team.name}
                    </button>
                  )}
                  <Badge variant="secondary" className="ml-auto font-score tabular">
                    {team.players.length}/{teamSize}
                  </Badge>
                </div>

                <div className="flex flex-col gap-1.5">
                  {team.players.map(p => (
                    <div
                      key={p.id}
                      draggable
                      onDragStart={e => handleDragStart(e, p.id)}
                      className="flex cursor-grab items-center rounded-lg border border-border bg-secondary px-2 py-1.5 transition-transform hover:border-primary/40 active:cursor-grabbing active:scale-[0.98]"
                    >
                      <span className="truncate font-display text-sm font-bold">{p.name}</span>
                    </div>
                  ))}
                  {Array.from({ length: Math.max(0, teamSize - team.players.length) }).map((_, i) => (
                    <div
                      key={`slot-${i}`}
                      className="rounded-lg border border-dashed border-border py-3 text-center font-display text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground"
                    >
                      drop here
                    </div>
                  ))}
                </div>
              </CardContent>

              <span
                aria-hidden
                className="pointer-events-none absolute -right-6 -bottom-6 size-14 rounded-full opacity-10"
                style={{ background: `radial-gradient(circle, ${palette.color} 0%, transparent 70%)` }}
              />
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
                <TableHead className="w-10" />
                <TableHead className="font-display text-[9px] font-bold uppercase tracking-[0.18em]">
                  team
                </TableHead>
                <TableHead className="font-display text-[9px] font-bold uppercase tracking-[0.18em]">
                  roster
                </TableHead>
                <TableHead className="w-20 text-right font-display text-[9px] font-bold uppercase tracking-[0.18em]">
                  slots
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {teams.map((team, ti) => {
                const palette = TEAM_PALETTE[ti % TEAM_PALETTE.length]
                const isOver = dragOverTeamId === team.id
                const missing = Math.max(0, teamSize - team.players.length)
                return (
                  <TableRow
                    key={team.id}
                    onDragOver={e => {
                      e.preventDefault()
                      if (dragOverTeamId !== team.id) setDragOverTeamId(team.id)
                    }}
                    onDragLeave={() =>
                      setDragOverTeamId(prev => (prev === team.id ? null : prev))
                    }
                    onDrop={e => handleDrop(e, team.id)}
                    className={cn(
                      'transition-colors',
                      isOver && 'bg-primary/5',
                    )}
                  >
                    <TableCell className="py-3">
                      <span
                        aria-hidden
                        className="block h-6 w-1 rounded-full"
                        style={{ background: palette.color }}
                      />
                    </TableCell>
                    <TableCell className="py-3">
                      {editingTeamId === team.id ? (
                        <Input
                          autoFocus
                          value={draftName}
                          onChange={e => setDraftName(e.target.value)}
                          onBlur={() => commitEdit(team.id)}
                          onKeyDown={e => {
                            if (e.key === 'Enter') commitEdit(team.id)
                            if (e.key === 'Escape') cancelEdit()
                          }}
                          maxLength={24}
                          className="h-8 max-w-40 border-primary/60 px-2 font-display text-xs font-extrabold uppercase tracking-[0.18em]"
                        />
                      ) : (
                        <button
                          type="button"
                          onClick={() => beginEdit(team)}
                          className="truncate text-left font-display text-xs font-extrabold uppercase tracking-[0.18em] hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
                        >
                          {team.name}
                        </button>
                      )}
                    </TableCell>
                    <TableCell className="py-3">
                      <div className="flex flex-wrap items-center gap-1.5">
                        {team.players.map(p => (
                          <span
                            key={p.id}
                            draggable
                            onDragStart={e => handleDragStart(e, p.id)}
                            className="inline-flex cursor-grab items-center rounded-md border border-border bg-secondary px-2 py-1 font-display text-xs font-bold transition-transform hover:border-primary/40 active:cursor-grabbing active:scale-[0.97]"
                          >
                            {p.name}
                          </span>
                        ))}
                        {missing > 0 && (
                          <span className="inline-flex items-center rounded-md border border-dashed border-border px-2 py-1 font-display text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
                            {missing} open
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="py-3 text-right">
                      <Badge variant="secondary" className="font-score tabular">
                        {team.players.length}/{teamSize}
                      </Badge>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Button
        size="lg"
        onClick={onStartSession}
        disabled={teams.length < 2}
        className="sticky bottom-[calc(env(safe-area-inset-bottom)+72px)] z-30 h-auto justify-between rounded-2xl border-2 border-primary px-5 py-4 shadow-brut active:translate-x-0.5 active:translate-y-0.5 active:shadow-none disabled:shadow-none disabled:border-border lg:static lg:ml-auto lg:max-w-sm lg:py-3"
      >
        <span className="flex flex-col items-start leading-none">
          <span className="font-display text-xs font-bold uppercase tracking-[0.18em] opacity-70">
            let&apos;s play
          </span>
          <span className="font-display text-lg font-extrabold">Start tournament</span>
        </span>
        <span className="font-score flex items-baseline gap-1">
          <span className="text-2xl font-extrabold leading-none tabular">{matchCount}</span>
          <span className="font-display text-[10px] font-bold uppercase tracking-[0.16em]">
            matches
          </span>
        </span>
      </Button>
    </div>
  )
}
