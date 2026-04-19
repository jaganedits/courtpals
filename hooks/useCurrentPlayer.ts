'use client'

import { useCallback, useEffect, useState } from 'react'
import { doc, setDoc } from 'firebase/firestore'
import type { User } from 'firebase/auth'
import { firestore } from '@/lib/firebase'

const KEY = 'courtpals_current_player'

interface Options {
  /** The signed-in Firebase user, or null if not authenticated. */
  user?: User | null
  /** playerId already resolved from /users/{uid}, when available. */
  remotePlayerId?: string | null
}

/**
 * Pick-yourself identity for a player. When a Firebase user is supplied, the
 * playerId is read from the remote /users/{uid} doc and writes are mirrored
 * there so sign-ins on another device stay in sync. Without Firebase the
 * hook keeps the legacy localStorage behaviour.
 */
export function useCurrentPlayer(opts: Options = {}) {
  const { user, remotePlayerId } = opts
  const [localId, setLocalId] = useState<string | null>(null)

  useEffect(() => {
    if (user || typeof window === 'undefined') return
    const v = localStorage.getItem(KEY)
    if (v) setLocalId(v)
  }, [user])

  const currentPlayerId = user ? remotePlayerId ?? null : localId

  const setCurrentPlayer = useCallback(
    (id: string) => {
      if (user) {
        const db = firestore()
        if (!db) return
        void setDoc(
          doc(db, 'users', user.uid),
          {
            playerId: id,
            displayName: user.displayName ?? 'Player',
            photoURL: user.photoURL ?? null,
          },
          { merge: true },
        )
      } else {
        if (typeof window !== 'undefined') localStorage.setItem(KEY, id)
        setLocalId(id)
      }
    },
    [user],
  )

  const clearCurrentPlayer = useCallback(() => {
    if (user) {
      const db = firestore()
      if (!db) return
      void setDoc(doc(db, 'users', user.uid), { playerId: null }, { merge: true })
    } else {
      if (typeof window !== 'undefined') localStorage.removeItem(KEY)
      setLocalId(null)
    }
  }, [user])

  return { currentPlayerId, setCurrentPlayer, clearCurrentPlayer }
}
