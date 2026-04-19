'use client'

import { type FirebaseApp, type FirebaseOptions, getApps, initializeApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider, type Auth } from 'firebase/auth'
import {
  getFirestore,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  type Firestore,
} from 'firebase/firestore'

const firebaseConfig: FirebaseOptions = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
}

export function isFirebaseConfigured(): boolean {
  return Boolean(firebaseConfig.apiKey && firebaseConfig.projectId)
}

let _app: FirebaseApp | null = null
let _auth: Auth | null = null
let _db: Firestore | null = null

function getOrInit(): FirebaseApp | null {
  if (!isFirebaseConfigured()) return null
  if (_app) return _app
  _app = getApps()[0] ?? initializeApp(firebaseConfig)
  return _app
}

export function firebaseApp(): FirebaseApp | null {
  return getOrInit()
}

export function firebaseAuth(): Auth | null {
  const app = getOrInit()
  if (!app) return null
  if (!_auth) _auth = getAuth(app)
  return _auth
}

export function firestore(): Firestore | null {
  const app = getOrInit()
  if (!app) return null
  if (!_db) {
    const dbId = process.env.NEXT_PUBLIC_FIREBASE_FIRESTORE_DATABASE_ID
    // Persistent IndexedDB cache makes subsequent loads serve from local data
    // instantly; snapshots are revalidated over the network in the background.
    // initializeFirestore can only be called once per app — fall back to
    // getFirestore on any retry (HMR, etc.).
    try {
      _db = initializeFirestore(
        app,
        {
          localCache: persistentLocalCache({
            tabManager: persistentMultipleTabManager(),
          }),
        },
        dbId && dbId !== '(default)' ? dbId : undefined,
      )
    } catch {
      _db = dbId && dbId !== '(default)' ? getFirestore(app, dbId) : getFirestore(app)
    }
  }
  return _db
}

export const googleProvider = new GoogleAuthProvider()
