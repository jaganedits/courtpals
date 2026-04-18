'use client'

import { useState } from 'react'
import type { SessionTeam, SessionAction } from '@/types'

const TEAM_PALETTE = [
  { border: 'border-[var(--color-team-a)]', glow: 'shadow-[0_0_0_2px_var(--color-team-a),0_0_24px_-4px_rgba(255,122,69,0.5)]', bar: 'bg-[var(--color-team-a)]', dot: 'var(--color-team-a)' },
  { border: 'border-[var(--color-team-b)]', glow: 'shadow-[0_0_0_2px_var(--color-team-b),0_0_24px_-4px_rgba(61,220,151,0.5)]', bar: 'bg-[var(--color-team-b)]', dot: 'var(--color-team-b)' },
  { border: 'border-[var(--color-team-c)]', glow: 'shadow-[0_0_0_2px_var(--color-team-c),0_0_24px_-4px_rgba(192,132,252,0.5)]', bar: 'bg-[var(--color-team-c)]', dot: 'var(--color-team-c)' },
  { border: 'border-[var(--color-team-d)]', glow: 'shadow-[0_0_0_2px_var(--color-team-d),0_0_24px_-4px_rgba(255,93,143,0.5)]', bar: 'bg-[var(--color-team-d)]', dot: 'var(--color-team-d)' },
  { border: 'border-[var(--color-team-e)]', glow: 'shadow-[0_0_0_2px_var(--color-team-e),0_0_24px_-4px_rgba(96,165,250,0.5)]', bar: 'bg-[var(--color-team-e)]', dot: 'var(--color-team-e)' },
  { border: 'border-[var(--color-team-f)]', glow: 'shadow-[0_0_0_2px_var(--color-team-f),0_0_24px_-4px_rgba(251,191,36,0.5)]', bar: 'bg-[var(--color-team-f)]', dot: 'var(--color-team-f)' },
]

interface Props {
  teams: SessionTeam[]
  dispatch: React.Dispatch<SessionAction>
  onReRandomize: () => void
  onStartSession: () => void
}

export default function TeamBuilder({ teams, dispatch, onReRandomize, onStartSession }: Props) {
  const [dragOverTeamId, setDragOverTeamId] = useState<string | null>(null)
  const matchCount = teams.length >= 2 ? (teams.length * (teams.length - 1)) / 2 : 0

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
      {/* Header */}
      <header className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-display text-[10px] font-bold uppercase tracking-[0.22em] text-[var(--color-ink-dim)]">
            the draft
          </p>
          <h1 className="font-display text-3xl font-extrabold leading-none text-[var(--color-chalk)]">
            Teams
          </h1>
          <p className="mt-1.5 text-sm text-[var(--color-ink-soft)]">
            Drag players to shuffle, or re-roll the whole thing.
          </p>
        </div>
        <button
          onClick={onReRandomize}
          className="shrink-0 rounded-xl border-2 border-[var(--color-line)] bg-[var(--color-card)] px-3 py-2 font-display text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--color-ink-soft)] transition-all hover:border-[var(--color-lime)]/40 hover:text-[var(--color-lime)] active:scale-95"
        >
          🎲 Re-roll
        </button>
      </header>

      {/* Team cards */}
      <div className="grid grid-cols-2 gap-3">
        {teams.map((team, ti) => {
          const palette = TEAM_PALETTE[ti % TEAM_PALETTE.length]
          const isOver = dragOverTeamId === team.id
          return (
            <div
              key={team.id}
              onDragOver={e => {
                e.preventDefault()
                if (dragOverTeamId !== team.id) setDragOverTeamId(team.id)
              }}
              onDragLeave={() => setDragOverTeamId(prev => (prev === team.id ? null : prev))}
              onDrop={e => handleDrop(e, team.id)}
              className={`relative min-h-[148px] overflow-hidden rounded-2xl border-2 bg-[var(--color-card)] p-3 transition-all ${palette.border} ${isOver ? palette.glow : ''}`}
            >
              {/* Color bar header */}
              <div className="mb-3 flex items-center gap-2">
                <span className={`h-2.5 w-2.5 rounded-full ${palette.bar}`} />
                <span className="font-display text-[11px] font-extrabold uppercase tracking-[0.18em] text-[var(--color-chalk)]">
                  {team.name}
                </span>
                <span className="ml-auto font-score text-[11px] font-bold text-[var(--color-ink-dim)] tabular">
                  {team.players.length}/2
                </span>
              </div>

              {/* Player chips */}
              <div className="flex flex-col gap-1.5">
                {team.players.map(p => (
                  <div
                    key={p.id}
                    draggable
                    onDragStart={e => handleDragStart(e, p.id)}
                    className="flex cursor-grab items-center gap-2 rounded-lg border border-[var(--color-line)] bg-[var(--color-bg-raised)] px-2 py-1.5 transition-transform hover:border-[var(--color-lime)]/40 active:cursor-grabbing active:scale-[0.98]"
                  >
                    <span className="text-base leading-none">{p.emoji}</span>
                    <span className="truncate font-display text-sm font-bold text-[var(--color-chalk)]">
                      {p.name}
                    </span>
                  </div>
                ))}
                {team.players.length === 0 && (
                  <div className="rounded-lg border border-dashed border-[var(--color-line)] py-3 text-center font-display text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--color-ink-dim)]">
                    drop here
                  </div>
                )}
              </div>

              {/* Decorative corner */}
              <span
                aria-hidden
                className="absolute -right-6 -bottom-6 h-14 w-14 rounded-full opacity-10"
                style={{ background: `radial-gradient(circle, ${palette.dot} 0%, transparent 70%)` }}
              />
            </div>
          )
        })}
      </div>

      {/* Start CTA */}
      <button
        onClick={onStartSession}
        disabled={teams.length < 2}
        className="sticky bottom-[calc(env(safe-area-inset-bottom)+72px)] z-30 flex items-center justify-between rounded-2xl border-2 border-[var(--color-lime)] bg-[var(--color-lime)] px-5 py-4 text-[var(--color-bg)] shadow-brut transition-all disabled:cursor-not-allowed disabled:border-[var(--color-line)] disabled:bg-[var(--color-card)] disabled:text-[var(--color-ink-dim)] disabled:shadow-none active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
      >
        <span className="flex flex-col items-start">
          <span className="font-display text-xs font-bold uppercase tracking-[0.18em] opacity-70">
            let's play
          </span>
          <span className="font-display text-lg font-extrabold leading-none">
            Start tournament
          </span>
        </span>
        <span className="font-score flex items-baseline gap-1">
          <span className="text-2xl font-extrabold leading-none tabular">{matchCount}</span>
          <span className="font-display text-[10px] font-bold uppercase tracking-[0.16em]">
            matches
          </span>
        </span>
      </button>
    </div>
  )
}
