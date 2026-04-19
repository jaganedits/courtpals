/** Stub for firebase/auth. Unit tests never sign in. */

export const onAuthStateChanged = () => () => {}
export const signInWithPopup = async () => ({ user: null })
export const signOut = async () => {}
export class GoogleAuthProvider {}
export type User = { uid: string; displayName: string | null; photoURL: string | null; email: string | null }
export const getAuth = () => null
