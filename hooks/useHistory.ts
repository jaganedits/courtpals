'use client'

import { useCallback, useEffect, useState } from 'react'
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  setDoc,
  writeBatch,
} from 'firebase/firestore'
import { firestore } from '@/lib/firebase'
import type { SavedSession } from '@/types'

const LS_KEY = 'courtpals_history'

function loadLocal(): SavedSession[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(LS_KEY)
    return raw ? (JSON.parse(raw) as SavedSession[]) : []
  } catch {
    return []
  }
}

function persistLocal(sessions: SavedSession[]) {
  if (typeof window === 'undefined') return
  localStorage.setItem(LS_KEY, JSON.stringify(sessions))
}

/**
 * Saved-session history. Syncs to /courts/{courtId}/sessions when a courtId
 * is provided; otherwise keeps data in localStorage.
 */
export function useHistory(courtId?: string | null) {
  const [history, setHistory] = useState<SavedSession[]>([])

  useEffect(() => {
    if (courtId) return
    setHistory(loadLocal())
  }, [courtId])

  useEffect(() => {
    if (!courtId) return
    const db = firestore()
    if (!db) return
    const q = query(
      collection(db, 'courts', courtId, 'sessions'),
      orderBy('date', 'desc'),
    )
    const unsub = onSnapshot(q, snap => {
      setHistory(
        snap.docs.map(d => {
          const data = d.data() as Omit<SavedSession, 'id'>
          return { id: d.id, ...data }
        }),
      )
    })
    return unsub
  }, [courtId])

  const saveSession = useCallback(
    (session: SavedSession) => {
      if (courtId) {
        const db = firestore()
        if (!db) return
        void setDoc(doc(db, 'courts', courtId, 'sessions', session.id), {
          date: session.date,
          winTarget: session.winTarget,
          teamSize: session.teamSize,
          teams: session.teams,
          fixtures: session.fixtures,
        })
      } else {
        setHistory(prev => {
          const next = [session, ...prev].sort((a, b) => b.date - a.date)
          persistLocal(next)
          return next
        })
      }
    },
    [courtId],
  )

  const clearHistory = useCallback(async () => {
    if (courtId) {
      const db = firestore()
      if (!db) return
      const col = collection(db, 'courts', courtId, 'sessions')
      const snap = await getDocs(col)
      if (snap.empty) return
      const batch = writeBatch(db)
      snap.docs.forEach(d => batch.delete(d.ref))
      await batch.commit()
    } else {
      setHistory([])
      if (typeof window !== 'undefined') localStorage.removeItem(LS_KEY)
    }
  }, [courtId])

  // Fire-and-forget shim: old callers expect clearHistory to be sync.
  const clearHistorySync = useCallback(() => {
    void clearHistory()
  }, [clearHistory])

  // Also expose delete-one for later use by a UI affordance.
  const deleteSession = useCallback(
    (id: string) => {
      if (courtId) {
        const db = firestore()
        if (!db) return
        void deleteDoc(doc(db, 'courts', courtId, 'sessions', id))
      } else {
        setHistory(prev => {
          const next = prev.filter(s => s.id !== id)
          persistLocal(next)
          return next
        })
      }
    },
    [courtId],
  )

  return { history, saveSession, clearHistory: clearHistorySync, deleteSession }
}
