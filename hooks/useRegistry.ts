'use client'

import { useCallback, useEffect, useState } from 'react'
import type { SessionPlayer } from '@/types'

const KEY = 'courtpals_registry'

function load(): SessionPlayer[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? (JSON.parse(raw) as SessionPlayer[]) : []
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
