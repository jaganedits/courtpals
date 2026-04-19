'use client'

import { useCallback, useEffect, useState } from 'react'
import { onAuthStateChanged, signInWithPopup, signOut, type User } from 'firebase/auth'
import { firebaseAuth, googleProvider, isFirebaseConfigured } from '@/lib/firebase'
import { cacheFirebaseUser, clearCourtPalsStorage } from '@/lib/local-cache'

export interface AuthState {
  /** The Firebase user object, or null if signed out. */
  user: User | null
  /** True until the first onAuthStateChanged callback fires. */
  loading: boolean
  /** True when NEXT_PUBLIC_FIREBASE_* env vars are present. */
  configured: boolean
  /** Any error from the last sign-in / sign-out attempt. */
  error: string | null
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    loading: true,
    configured: isFirebaseConfigured(),
    error: null,
  })

  useEffect(() => {
    const auth = firebaseAuth()
    if (!auth) {
      setState(s => ({ ...s, loading: false }))
      return
    }
    const unsub = onAuthStateChanged(auth, u => {
      cacheFirebaseUser(u)
      setState(s => ({ ...s, user: u, loading: false }))
    })
    return unsub
  }, [])

  const signInWithGoogle = useCallback(async () => {
    const auth = firebaseAuth()
    if (!auth) {
      setState(s => ({ ...s, error: 'Firebase is not configured.' }))
      return
    }
    try {
      setState(s => ({ ...s, error: null }))
      await signInWithPopup(auth, googleProvider)
    } catch (e) {
      setState(s => ({ ...s, error: (e as Error).message }))
    }
  }, [])

  const handleSignOut = useCallback(async () => {
    const auth = firebaseAuth()
    if (!auth) return
    try {
      await signOut(auth)
    } catch (e) {
      setState(s => ({ ...s, error: (e as Error).message }))
    } finally {
      // Drop every courtpals_* entry from localStorage and sessionStorage so
      // the device doesn't leak state to the next signee (or to the same
      // user if they re-auth into a different court).
      clearCourtPalsStorage()
    }
  }, [])

  return { ...state, signInWithGoogle, signOut: handleSignOut }
}
