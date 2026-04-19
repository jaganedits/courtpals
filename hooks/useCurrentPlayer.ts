'use client'

import { useCallback, useEffect, useState } from 'react'

const KEY = 'courtpals_current_player'

/**
 * Pick-yourself identity for a player. Stored as the roster player id in
 * localStorage. Swap this out for a Firebase-auth implementation later by
 * keeping the same return shape.
 */
export function useCurrentPlayer() {
  const [currentPlayerId, setCurrentPlayerIdState] = useState<string | null>(null)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const v = localStorage.getItem(KEY)
    if (v) setCurrentPlayerIdState(v)
  }, [])

  const setCurrentPlayer = useCallback((id: string) => {
    if (typeof window !== 'undefined') localStorage.setItem(KEY, id)
    setCurrentPlayerIdState(id)
  }, [])

  const clearCurrentPlayer = useCallback(() => {
    if (typeof window !== 'undefined') localStorage.removeItem(KEY)
    setCurrentPlayerIdState(null)
  }, [])

  return { currentPlayerId, setCurrentPlayer, clearCurrentPlayer }
}
