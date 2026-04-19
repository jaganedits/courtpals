'use client'

import { useState } from 'react'
import { Plus, Pencil, Trash2, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from '@/components/ui/input-group'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import type { SessionPlayer } from '@/types'

const EMOJIS = [
  '🏸','🔥','⚡','🌟','💪','🦁','🐯','🦊','🐺','🦅',
  '🐉','🌊','⛰️','🍀','💎','🎯','🚀','👑','🥷','🦸',
  '🌶️','🧨','🎸','🪩','🛸','🦄','🐙','🦖','🧩','🪐',
]

interface Props {
  players: SessionPlayer[]
  onAdd: (player: SessionPlayer) => void
  onRemove: (id: string) => void
  onUpdate: (player: SessionPlayer) => void
}

export default function PlayerRegistry({ players, onAdd, onRemove, onUpdate }: Props) {
  const [name, setName] = useState('')
  const [emoji, setEmoji] = useState('🏸')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')

  function handleAdd() {
    const trimmed = name.trim()
    if (!trimmed) return
    onAdd({
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      name: trimmed,
      emoji,
    })
    setName('')
    setEmoji('🏸')
  }

  function startEdit(p: SessionPlayer) {
    setEditingId(p.id)
    setEditName(p.name)
  }

  function saveEdit(p: SessionPlayer) {
    const trimmed = editName.trim()
    if (trimmed && trimmed !== p.name) onUpdate({ ...p, name: trimmed })
    setEditingId(null)
  }

  return (
    <div className="flex flex-col gap-5 px-4 pt-6 pb-8">
      <header className="flex items-baseline justify-between">
        <div>
          <p className="font-display text-[10px] font-bold uppercase tracking-[0.22em] text-muted-foreground">
            the squad
          </p>
          <h1 className="font-display text-3xl font-extrabold leading-none">Roster</h1>
        </div>
        <Badge variant="secondary" className="font-score gap-1 tabular">
          <span className="text-base font-extrabold">
            {players.length.toString().padStart(2, '0')}
          </span>
          <span className="font-display text-[9px] font-bold uppercase tracking-[0.18em]">
            players
          </span>
        </Badge>
      </header>

      <Card className="relative overflow-visible">
        <Badge className="absolute -top-2.5 left-4 font-display text-[10px] font-extrabold uppercase tracking-[0.18em]">
          Add player
        </Badge>
        <CardHeader className="sr-only">
          <CardTitle>Add a new player</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 pt-4">
          <InputGroup>
            <InputGroupAddon>
              <span className="text-xl leading-none">{emoji}</span>
            </InputGroupAddon>
            <InputGroupInput
              placeholder="Player name"
              value={name}
              maxLength={20}
              onChange={e => setName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAdd()}
              className="font-display font-semibold"
            />
            <InputGroupAddon align="inline-end">
              <InputGroupButton
                type="button"
                onClick={handleAdd}
                disabled={!name.trim()}
                variant="default"
                className="font-display font-extrabold uppercase tracking-[0.12em]"
              >
                <Plus data-icon="inline-start" />
                Add
              </InputGroupButton>
            </InputGroupAddon>
          </InputGroup>

          <div className="flex flex-col gap-2">
            <p className="font-display text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
              Pick an emoji
            </p>
            <ToggleGroup
              type="single"
              value={emoji}
              onValueChange={v => v && setEmoji(v)}
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
          </div>
        </CardContent>
      </Card>

      {players.length === 0 ? (
        <Empty className="border-2">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Users />
            </EmptyMedia>
            <EmptyTitle className="font-display font-bold">
              No players on the roster yet
            </EmptyTitle>
            <EmptyDescription>
              Add your regulars above. They stick around for every Saturday.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <section className="flex flex-col gap-2">
          <p className="font-display text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground px-1">
            regulars
          </p>
          <Separator />

          {/* Mobile: card list */}
          <div className="flex flex-col gap-2 lg:hidden">
            {players.map((p, i) => {
              const isEditing = editingId === p.id
              return (
                <Card
                  key={p.id}
                  style={{ animationDelay: `${i * 40}ms` }}
                  className="animate-rise gap-0 border-2 py-0"
                >
                  <CardContent className="flex items-center gap-3 p-3">
                    {isEditing ? (
                      <Input
                        autoFocus
                        value={editName}
                        maxLength={20}
                        onChange={e => setEditName(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && saveEdit(p)}
                        onBlur={() => saveEdit(p)}
                        className="h-9 flex-1 font-display font-semibold"
                      />
                    ) : (
                      <div className="min-w-0 flex-1">
                        <p
                          onDoubleClick={() => startEdit(p)}
                          className="truncate font-display text-base font-extrabold"
                        >
                          {p.name}
                        </p>
                        <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                          #{(i + 1).toString().padStart(2, '0')}
                        </p>
                      </div>
                    )}

                    {!isEditing && (
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          aria-label={`Edit ${p.name}`}
                          onClick={() => startEdit(p)}
                        >
                          <Pencil />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          aria-label={`Remove ${p.name}`}
                          onClick={() => onRemove(p.id)}
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 />
                        </Button>
                      </div>
                    )}
                  </CardContent>
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
                    <TableHead className="w-12 text-center font-display text-[9px] font-bold uppercase tracking-[0.18em]">
                      #
                    </TableHead>
                    <TableHead className="w-14 text-center font-display text-[9px] font-bold uppercase tracking-[0.18em]">
                      icon
                    </TableHead>
                    <TableHead className="font-display text-[9px] font-bold uppercase tracking-[0.18em]">
                      name
                    </TableHead>
                    <TableHead className="w-28 text-right font-display text-[9px] font-bold uppercase tracking-[0.18em]">
                      actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {players.map((p, i) => {
                    const isEditing = editingId === p.id
                    return (
                      <TableRow key={p.id}>
                        <TableCell className="text-center font-mono text-xs font-bold tabular text-muted-foreground">
                          {(i + 1).toString().padStart(2, '0')}
                        </TableCell>
                        <TableCell className="text-center text-xl leading-none">
                          {p.emoji}
                        </TableCell>
                        <TableCell>
                          {isEditing ? (
                            <Input
                              autoFocus
                              value={editName}
                              maxLength={20}
                              onChange={e => setEditName(e.target.value)}
                              onKeyDown={e => e.key === 'Enter' && saveEdit(p)}
                              onBlur={() => saveEdit(p)}
                              className="h-9 max-w-xs font-display font-semibold"
                            />
                          ) : (
                            <button
                              type="button"
                              onDoubleClick={() => startEdit(p)}
                              onClick={() => startEdit(p)}
                              className="truncate text-left font-display text-sm font-extrabold hover:text-primary"
                            >
                              {p.name}
                            </button>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {!isEditing && (
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                aria-label={`Edit ${p.name}`}
                                onClick={() => startEdit(p)}
                              >
                                <Pencil />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                aria-label={`Remove ${p.name}`}
                                onClick={() => onRemove(p.id)}
                                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                              >
                                <Trash2 />
                              </Button>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </section>
      )}
    </div>
  )
}
