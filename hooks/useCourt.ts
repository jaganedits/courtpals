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
        setState(s => ({
          ...s,
          profile: {
            courtId: data.courtId ?? null,
            playerId: data.playerId ?? null,
            displayName: data.displayName ?? user.displayName ?? 'Player',
            photoURL: data.photoURL ?? user.photoURL,
          },
          loading: false,
        }))
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
        setState(s => ({
          ...s,
          court: { id: snap.id, ...data },
          isAdmin: data.createdBy === user.uid,
        }))
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
      await setDoc(
        userRef,
        {
          courtId,
          playerId: null,
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
      await setDoc(
        doc(db, 'users', user.uid),
        {
          courtId,
          playerId: null,
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
