'use client'

import { useEffect, useState } from 'react'
import { doc, onSnapshot } from 'firebase/firestore'
import { firestore } from '@/lib/firebase'
import type { MatchState } from '@/types'

/**
 * Subscribes to /courts/{courtId}/liveMatch/current so every court member
 * sees the scoreboard the admin is driving in real time. Returns `null` when
 * no match is live on the court (or when Firebase isn't configured).
 */
export function useLiveMatch(courtId: string | null) {
  const [liveMatch, setLiveMatch] = useState<MatchState | null>(null)

  useEffect(() => {
    if (!courtId) {
      setLiveMatch(null)
      return
    }
    const db = firestore()
    if (!db) return
    const ref = doc(db, 'courts', courtId, 'liveMatch', 'current')
    const unsub = onSnapshot(
      ref,
      snap => {
        if (!snap.exists()) {
          setLiveMatch(null)
          return
        }
        const data = snap.data() as Omit<MatchState, 'events'> & { events?: MatchState['events'] }
        setLiveMatch({
          ...data,
          // Events list isn't persisted to keep writes tiny; spectators
          // don't need per-point history.
          events: data.events ?? [],
        } as MatchState)
      },
      () => setLiveMatch(null),
    )
    return unsub
  }, [courtId])

  return { liveMatch }
}
