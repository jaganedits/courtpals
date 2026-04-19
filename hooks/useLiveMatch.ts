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
        const data = snap.data() as Partial<MatchState> & {
          teamAPlayers?: MatchState['teamPlayers'][0]
          teamBPlayers?: MatchState['teamPlayers'][1]
        }
        // teamPlayers is written as two flat top-level arrays on the wire
        // (Firestore forbids nested arrays); rebuild the tuple here.
        setLiveMatch({
          ...(data as MatchState),
          teamPlayers: [data.teamAPlayers ?? [], data.teamBPlayers ?? []],
          events: data.events ?? [],
        })
      },
      () => setLiveMatch(null),
    )
    return unsub
  }, [courtId])

  return { liveMatch }
}
