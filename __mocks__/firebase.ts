/**
 * Jest stub for `@/lib/firebase`.
 *
 * Real firebase/auth pulls in a Node polyfill path that requires a global
 * `fetch`, which jsdom does not provide. Tests never hit the Firestore code
 * path (courtId is always null in unit tests), so returning null from every
 * factory is enough — the hooks' `if (!db)` early-returns keep them on the
 * localStorage codepath.
 */

export function isFirebaseConfigured(): boolean {
  return false
}

export function firebaseApp(): null {
  return null
}

export function firebaseAuth(): null {
  return null
}

export function firestore(): null {
  return null
}

export const googleProvider = {}
