'use client'

import { useState } from 'react'
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
      {/* Header */}
      <header className="flex items-baseline justify-between">
        <div>
          <p className="font-display text-[10px] font-bold uppercase tracking-[0.22em] text-[var(--color-ink-dim)]">
            the squad
          </p>
          <h1 className="font-display text-3xl font-extrabold leading-none text-[var(--color-chalk)]">
            Roster
          </h1>
        </div>
        <div className="font-score flex items-end gap-1 text-[var(--color-lime)]">
          <span className="text-3xl font-extrabold leading-none tabular">{players.length.toString().padStart(2, '0')}</span>
          <span className="pb-1 text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--color-ink-dim)]">players</span>
        </div>
      </header>

      {/* Add-player card */}
      <section className="relative rounded-2xl border-2 border-[var(--color-line)] bg-[var(--color-card)] p-4 shadow-brut">
        <div className="absolute -top-2.5 left-4 rounded-md bg-[var(--color-lime)] px-2 py-0.5">
          <span className="font-display text-[10px] font-extrabold uppercase tracking-[0.18em] text-[var(--color-bg)]">
            Add player
          </span>
        </div>

        <div className="mt-1 flex items-stretch gap-2">
          <div
            aria-hidden
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border-2 border-[var(--color-line)] bg-[var(--color-bg-raised)] text-2xl"
          >
            {emoji}
          </div>
          <input
            type="text"
            value={name}
            maxLength={20}
            onChange={e => setName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAdd()}
            placeholder="Player name"
            className="min-w-0 flex-1 rounded-xl border-2 border-[var(--color-line)] bg-[var(--color-bg-raised)] px-3 font-display text-base font-semibold text-[var(--color-chalk)] placeholder-[var(--color-ink-dim)]/70 focus:border-[var(--color-lime)] focus:outline-none"
          />
          <button
            onClick={handleAdd}
            disabled={!name.trim()}
            className="rounded-xl bg-[var(--color-lime)] px-4 font-display text-sm font-extrabold uppercase tracking-[0.12em] text-[var(--color-bg)] shadow-brut-sm transition-all disabled:cursor-not-allowed disabled:opacity-30 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
          >
            Add
          </button>
        </div>

        <div className="mt-3">
          <p className="font-display text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--color-ink-dim)] mb-2">
            pick an emoji
          </p>
          <div className="grid grid-cols-10 gap-1.5">
            {EMOJIS.map(e => (
              <button
                key={e}
                onClick={() => setEmoji(e)}
                className={`aspect-square rounded-lg border text-lg transition-all ${
                  emoji === e
                    ? 'border-[var(--color-lime)] bg-[var(--color-lime)]/15 ring-lime scale-110'
                    : 'border-[var(--color-line)] bg-[var(--color-bg-raised)] hover:border-[var(--color-lime)]/40 active:scale-95'
                }`}
              >
                {e}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Player list */}
      {players.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-[var(--color-line)] px-6 py-10 text-center">
          <p className="text-3xl mb-2">🏸</p>
          <p className="font-display text-sm font-bold text-[var(--color-ink-soft)]">
            No players on the roster yet
          </p>
          <p className="mt-1 text-xs text-[var(--color-ink-dim)]">
            Add your regulars above. They stick around for every Saturday.
          </p>
        </div>
      ) : (
        <section className="space-y-2">
          <p className="font-display text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--color-ink-dim)] px-1">
            regulars
          </p>
          {players.map((p, i) => {
            const isEditing = editingId === p.id
            return (
              <div
                key={p.id}
                style={{ animationDelay: `${i * 40}ms` }}
                className="animate-rise group flex items-center gap-3 rounded-2xl border-2 border-[var(--color-line)] bg-[var(--color-card)] px-3 py-2.5 transition-colors hover:border-[var(--color-lime)]/30"
              >
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[var(--color-bg-raised)] text-2xl">
                  {p.emoji}
                </span>

                {isEditing ? (
                  <input
                    autoFocus
                    value={editName}
                    maxLength={20}
                    onChange={e => setEditName(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && saveEdit(p)}
                    onBlur={() => saveEdit(p)}
                    className="min-w-0 flex-1 rounded-lg border border-[var(--color-lime)] bg-[var(--color-bg-raised)] px-2 py-1 font-display text-base font-semibold text-[var(--color-chalk)] focus:outline-none"
                  />
                ) : (
                  <div className="min-w-0 flex-1">
                    <p
                      onDoubleClick={() => startEdit(p)}
                      className="truncate font-display text-base font-bold text-[var(--color-chalk)]"
                    >
                      {p.name}
                    </p>
                    <p className="font-mono text-[10px] uppercase tracking-wider text-[var(--color-ink-dim)]">
                      #{(i + 1).toString().padStart(2, '0')}
                    </p>
                  </div>
                )}

                {!isEditing && (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => startEdit(p)}
                      aria-label={`Edit ${p.name}`}
                      className="rounded-lg px-2 py-1 font-display text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--color-ink-soft)] transition-colors hover:bg-[var(--color-bg-raised)] hover:text-[var(--color-lime)]"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => onRemove(p.id)}
                      aria-label={`Remove ${p.name}`}
                      className="rounded-lg px-2 py-1 font-display text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--color-ink-dim)] transition-colors hover:bg-[var(--color-loss)]/10 hover:text-[var(--color-loss)]"
                    >
                      Cut
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </section>
      )}
    </div>
  )
}
