'use client'

import { useCallback, useEffect, useState } from 'react'
import {
  arrayUnion,
  doc,
  getDoc,
  onSnapshot,
  serverTimestamp,
  setDoc,
  updateDoc,
  type Timestamp,
} from 'firebase/firestore'
import type { User } from 'firebase/auth'
import { firestore } from '@/lib/firebase'
import { readSessionCache, writeSessionCache } from '@/lib/local-cache'

export interface Court {
  id: string
  name: string
  createdBy: string
  inviteCode: string
  members: string[]
  createdAt?: Timestamp
}

export interface UserProfile {
  courtId: string | null
  playerId: string | null
  displayName: string
  photoURL: string | null
}

export interface CourtState {
  loading: boolean
  court: Court | null
  profile: UserProfile | null
  isAdmin: boolean
  error: string | null
}

function generateInviteCode(): string {
  // 6 uppercase alphanumerics — readable, hard to guess, short to type.
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < 6; i++) {
    code += alphabet[Math.floor(Math.random() * alphabet.length)]
  }
  return code
}

function generatePlayerId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}

export function useCourt(user: User | null) {
  const [state, setState] = useState<CourtState>({
    loading: true,
    court: null,
    profile: null,
    isAdmin: false,
    error: null,
  })

  // Watch /users/{uid} for the courtId pointer.
  useEffect(() => {
    const db = firestore()
    if (!db || !user) {
      setState({
        loading: false,
        court: null,
        profile: null,
        isAdmin: false,
        error: null,
      })
      return
    }
    // A new user means a fresh profile fetch — reset to loading so the gate
    // doesn't briefly see the previous user-less (profile:null) state and
    // flash the court-bootstrap dialog while the snapshot is in flight.
    setState(s => ({ ...s, loading: true, profile: null, court: null, isAdmin: false }))
    const userRef = doc(db, 'users', user.uid)
    const unsub = onSnapshot(
      userRef,
      snap => {
        if (!snap.exists()) {
          setState(s => ({
            ...s,
            loading: false,
            profile: {
              courtId: null,
              playerId: null,
              displayName: user.displayName ?? 'Player',
              photoURL: user.photoURL,
            },
          }))
          return
        }
        const data = snap.data() as UserProfile
        const profile: UserProfile = {
          courtId: data.courtId ?? null,
          playerId: data.playerId ?? null,
          displayName: data.displayName ?? user.displayName ?? 'Player',
          photoURL: data.photoURL ?? user.photoURL,
        }
        setState(s => ({ ...s, profile, loading: false }))
        // Keep the session cache in sync for fast reloads.
        const cache = readSessionCache()
        writeSessionCache({
          uid: user.uid,
          email: user.email,
          displayName: profile.displayName,
          photoURL: profile.photoURL,
          courtId: profile.courtId,
          courtName: cache?.courtName ?? null,
          playerId: profile.playerId,
          isAdmin: cache?.isAdmin ?? false,
        })
      },
      err => setState(s => ({ ...s, loading: false, error: err.message })),
    )
    return unsub
  }, [user])

  // When the profile points at a courtId, subscribe to the court doc.
  useEffect(() => {
    const db = firestore()
    const courtId = state.profile?.courtId
    if (!db || !user || !courtId) {
      setState(s => ({ ...s, court: null, isAdmin: false }))
      return
    }
    const courtRef = doc(db, 'courts', courtId)
    const unsub = onSnapshot(
      courtRef,
      snap => {
        if (!snap.exists()) {
          setState(s => ({ ...s, court: null, isAdmin: false }))
          return
        }
        const data = snap.data() as Omit<Court, 'id'>
        const isAdmin = data.createdBy === user.uid
        setState(s => ({
          ...s,
          court: { id: snap.id, ...data },
          isAdmin,
        }))
        const cache = readSessionCache()
        if (cache) {
          writeSessionCache({
            ...cache,
            courtName: data.name,
            isAdmin,
          })
        }
      },
      err => setState(s => ({ ...s, error: err.message })),
    )
    return unsub
  }, [user, state.profile?.courtId])

  const createCourt = useCallback(
    async (name: string) => {
      const db = firestore()
      if (!db || !user) throw new Error('Not signed in.')
      const inviteCode = generateInviteCode()
      const courtId = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`
      const courtRef = doc(db, 'courts', courtId)
      const inviteRef = doc(db, 'invites', inviteCode)
      const userRef = doc(db, 'users', user.uid)

      await setDoc(courtRef, {
        name: name.trim(),
        createdBy: user.uid,
        inviteCode,
        members: [user.uid],
        createdAt: serverTimestamp(),
      })
      await setDoc(inviteRef, { courtId })

      // Auto-create a player record for the admin so they're on the roster
      // the moment the court exists.
      const playerId = generatePlayerId()
      await setDoc(doc(db, 'courts', courtId, 'players', playerId), {
        name: user.displayName ?? name.trim(),
        emoji: '🏸',
        uid: user.uid,
      })

      await setDoc(
        userRef,
        {
          courtId,
          playerId,
          displayName: user.displayName ?? name.trim(),
          photoURL: user.photoURL ?? null,
        },
        { merge: true },
      )
      return courtId
    },
    [user],
  )

  const joinCourt = useCallback(
    async (rawCode: string) => {
      const db = firestore()
      if (!db || !user) throw new Error('Not signed in.')
      const code = rawCode.trim().toUpperCase()
      if (!code) throw new Error('Enter an invite code.')
      const inviteSnap = await getDoc(doc(db, 'invites', code))
      if (!inviteSnap.exists()) throw new Error('Invite code not found.')
      const { courtId } = inviteSnap.data() as { courtId: string }
      const courtRef = doc(db, 'courts', courtId)
      const courtSnap = await getDoc(courtRef)
      if (!courtSnap.exists()) throw new Error('That court no longer exists.')
      const court = courtSnap.data() as Omit<Court, 'id'>
      if (!court.members.includes(user.uid)) {
        await updateDoc(courtRef, { members: arrayUnion(user.uid) })
      }

      // Auto-create a player record for the new member the first time they
      // join so the admin doesn't have to. A playerId only gets reused when
      // it belongs to THIS court (i.e. the user is re-joining after a leave);
      // a stale pointer to a different court is ignored so every court has
      // its own independent roster entry for the user.
      const userRef = doc(db, 'users', user.uid)
      const existingUser = await getDoc(userRef)
      const existingUserData = existingUser.exists()
        ? (existingUser.data() as UserProfile)
        : null
      const reusablePlayerId =
        existingUserData?.courtId === courtId && existingUserData?.playerId
          ? existingUserData.playerId
          : null

      let playerId = reusablePlayerId
      if (playerId) {
        // Confirm the roster entry still exists — admin may have deleted it.
        const existingPlayer = await getDoc(doc(db, 'courts', courtId, 'players', playerId))
        if (!existingPlayer.exists()) playerId = null
      }
      if (!playerId) {
        playerId = generatePlayerId()
        await setDoc(doc(db, 'courts', courtId, 'players', playerId), {
          name: user.displayName ?? 'Player',
          emoji: '🏸',
          uid: user.uid,
        })
      }

      await setDoc(
        userRef,
        {
          courtId,
          playerId,
          displayName: user.displayName ?? 'Player',
          photoURL: user.photoURL ?? null,
        },
        { merge: true },
      )
      return courtId
    },
    [user],
  )

  const leaveCourt = useCallback(async () => {
    const db = firestore()
    if (!db || !user) return
    const userRef = doc(db, 'users', user.uid)
    await updateDoc(userRef, { courtId: null, playerId: null })
  }, [user])

  return { ...state, createCourt, joinCourt, leaveCourt }
}
