'use client'

import type { User } from 'firebase/auth'

const CACHE_KEY = 'courtpals_session_cache'

/** Fields we mirror to sessionStorage so UI chrome renders instantly on reload. */
export interface SessionCache {
  uid: string
  email: string | null
  displayName: string | null
  photoURL: string | null
  courtId: string | null
  courtName: string | null
  playerId: string | null
  isAdmin: boolean
}

export function readSessionCache(): SessionCache | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = sessionStorage.getItem(CACHE_KEY)
    return raw ? (JSON.parse(raw) as SessionCache) : null
  } catch {
    return null
  }
}

export function writeSessionCache(cache: SessionCache | null) {
  if (typeof window === 'undefined') return
  if (!cache) sessionStorage.removeItem(CACHE_KEY)
  else sessionStorage.setItem(CACHE_KEY, JSON.stringify(cache))
}

export function cacheFirebaseUser(user: User | null) {
  if (typeof window === 'undefined') return
  if (!user) {
    sessionStorage.removeItem(CACHE_KEY)
    return
  }
  const prev = readSessionCache()
  writeSessionCache({
    uid: user.uid,
    email: user.email,
    displayName: user.displayName,
    photoURL: user.photoURL,
    courtId: prev?.courtId ?? null,
    courtName: prev?.courtName ?? null,
    playerId: prev?.playerId ?? null,
    isAdmin: prev?.isAdmin ?? false,
  })
}

/**
 * Clears every CourtPals-owned localStorage and sessionStorage key. Called
 * at sign-out so a device doesn't leak prior user data to the next signee.
 */
export function clearCourtPalsStorage() {
  if (typeof window === 'undefined') return
  const drop = (storage: Storage) => {
    const keys: string[] = []
    for (let i = 0; i < storage.length; i++) {
      const key = storage.key(i)
      if (key && key.startsWith('courtpals_')) keys.push(key)
    }
    keys.forEach(k => storage.removeItem(k))
  }
  drop(localStorage)
  drop(sessionStorage)
}
