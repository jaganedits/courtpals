/** Stub for firebase/firestore. Unit tests never hit these code paths. */

export const collection = () => null as unknown
export const doc = () => null as unknown
export const getDoc = async () => ({ exists: () => false, data: () => ({}) })
export const getDocs = async () => ({ empty: true, docs: [] as unknown[] })
export const onSnapshot = () => () => {}
export const setDoc = async () => {}
export const deleteDoc = async () => {}
export const updateDoc = async () => {}
export const orderBy = () => null as unknown
export const query = () => null as unknown
export const writeBatch = () => ({ delete: () => {}, commit: async () => {} })
export const arrayUnion = (..._vals: unknown[]) => _vals
export const serverTimestamp = () => null
export type Firestore = unknown
export type Timestamp = unknown
