'use client'

import { useState, useCallback } from 'react'
import type { SavedSession } from '@/types'

const KEY = 'courtpals_history'

function load(): SavedSession[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? (JSON.parse(raw) as SavedSession[]) : []
  } catch {
    return []
  }
}

export function useHistory() {
  const [history, setHistory] = useState<SavedSession[]>(() => load())

  const saveSession = useCallback((session: SavedSession) => {
    setHistory(prev => {
      const next = [session, ...prev].sort((a, b) => b.date - a.date)
      localStorage.setItem(KEY, JSON.stringify(next))
      return next
    })
  }, [])

  const clearHistory = useCallback(() => {
    setHistory([])
    localStorage.removeItem(KEY)
  }, [])

  return { history, saveSession, clearHistory }
}
