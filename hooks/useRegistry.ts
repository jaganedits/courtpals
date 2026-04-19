'use client'

import { useCallback, useEffect, useState } from 'react'
import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  setDoc,
} from 'firebase/firestore'
import { firestore } from '@/lib/firebase'
import type { SessionPlayer } from '@/types'

const LS_KEY = 'courtpals_registry'

function loadLocal(): SessionPlayer[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(LS_KEY)
    return raw ? (JSON.parse(raw) as SessionPlayer[]) : []
  } catch {
    return []
  }
}

function persistLocal(players: SessionPlayer[]) {
  if (typeof window === 'undefined') return
  localStorage.setItem(LS_KEY, JSON.stringify(players))
}

/**
 * Registry of all players. When a courtId is provided, the roster lives in
 * /courts/{courtId}/players and stays in sync across devices. Without a
 * courtId the hook falls back to localStorage so the app keeps working
 * offline or in environments without Firebase configured.
 */
export function useRegistry(courtId?: string | null) {
  const [players, setPlayers] = useState<SessionPlayer[]>([])

  // Local-only hydration (runs when courtId is absent).
  useEffect(() => {
    if (courtId) return
    setPlayers(loadLocal())
  }, [courtId])

  // Firestore subscription (runs when courtId is set).
  useEffect(() => {
    if (!courtId) return
    const db = firestore()
    if (!db) return
    const q = query(collection(db, 'courts', courtId, 'players'), orderBy('name'))
    const unsub = onSnapshot(q, snap => {
      setPlayers(
        snap.docs.map(d => {
          const data = d.data() as Omit<SessionPlayer, 'id'>
          return { id: d.id, ...data }
        }),
      )
    })
    return unsub
  }, [courtId])

  const addPlayer = useCallback(
    (player: SessionPlayer) => {
      if (courtId) {
        const db = firestore()
        if (!db) return
        void setDoc(doc(db, 'courts', courtId, 'players', player.id), {
          name: player.name,
          emoji: player.emoji,
        })
      } else {
        setPlayers(prev => {
          const next = [...prev, player]
          persistLocal(next)
          return next
        })
      }
    },
    [courtId],
  )

  const removePlayer = useCallback(
    (id: string) => {
      if (courtId) {
        const db = firestore()
        if (!db) return
        void deleteDoc(doc(db, 'courts', courtId, 'players', id))
      } else {
        setPlayers(prev => {
          const next = prev.filter(p => p.id !== id)
          persistLocal(next)
          return next
        })
      }
    },
    [courtId],
  )

  const updatePlayer = useCallback(
    (updated: SessionPlayer) => {
      if (courtId) {
        const db = firestore()
        if (!db) return
        void setDoc(
          doc(db, 'courts', courtId, 'players', updated.id),
          { name: updated.name, emoji: updated.emoji },
          { merge: true },
        )
      } else {
        setPlayers(prev => {
          const next = prev.map(p => (p.id === updated.id ? updated : p))
          persistLocal(next)
          return next
        })
      }
    },
    [courtId],
  )

  return { players, addPlayer, removePlayer, updatePlayer }
}
