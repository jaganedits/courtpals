'use client'

import { useCallback, useEffect, useState } from 'react'
import type { PlayerRating, SessionPlayer } from '@/types'

const KEY = 'courtpals_registry'

function normalizeRating(value: unknown): PlayerRating {
  const n = typeof value === 'number' ? Math.round(value) : 3
  if (n < 1) return 1
  if (n > 5) return 5
  return n as PlayerRating
}

function load(): SessionPlayer[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as Array<Partial<SessionPlayer>>
    return parsed.map(p => ({
      id: String(p.id ?? ''),
      name: String(p.name ?? ''),
      emoji: String(p.emoji ?? '🏸'),
      rating: normalizeRating(p.rating),
    }))
  } catch {
    return []
  }
}

function persist(players: SessionPlayer[]) {
  if (typeof window === 'undefined') return
  localStorage.setItem(KEY, JSON.stringify(players))
}

export function useRegistry() {
  const [players, setPlayers] = useState<SessionPlayer[]>([])

  useEffect(() => {
    setPlayers(load())
  }, [])

  const addPlayer = useCallback((player: SessionPlayer) => {
    setPlayers(prev => {
      const next = [...prev, player]
      persist(next)
      return next
    })
  }, [])

  const removePlayer = useCallback((id: string) => {
    setPlayers(prev => {
      const next = prev.filter(p => p.id !== id)
      persist(next)
      return next
    })
  }, [])

  const updatePlayer = useCallback((updated: SessionPlayer) => {
    setPlayers(prev => {
      const next = prev.map(p => p.id === updated.id ? updated : p)
      persist(next)
      return next
    })
  }, [])

  return { players, addPlayer, removePlayer, updatePlayer }
}
