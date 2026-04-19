'use client'

import { ReactNode, useMemo } from 'react'
import { LogIn, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { isFirebaseConfigured } from '@/lib/firebase'
import { useAuth } from '@/hooks/useAuth'
import { useCourt } from '@/hooks/useCourt'
import { readSessionCache } from '@/lib/local-cache'
import CourtBootstrapDialog from '@/components/CourtBootstrapDialog'

interface Props {
  children: ReactNode
}

/**
 * Blocks the app on a login page until the user is signed in with Google
 * AND is attached to a court. Passes children through when Firebase is
 * not configured so the local-first dev experience still works.
 */
export default function AuthGate({ children }: Props) {
  if (!isFirebaseConfigured()) return <>{children}</>
  return <FirebaseGate>{children}</FirebaseGate>
}

function FirebaseGate({ children }: { children: ReactNode }) {
  const auth = useAuth()
  const court = useCourt(auth.user)
  // Only read the cache once on mount — it's the optimistic snapshot that
  // lets us skip the loading spinner if the last session had a court.
  const initialCache = useMemo(() => readSessionCache(), [])

  // Optimistic path: we have a cached signed-in user with a court from a
  // previous session. Render the app immediately and let Firebase revalidate
  // in the background.
  const canRenderOptimistically = Boolean(
    initialCache?.uid && initialCache.courtId && auth.loading,
  )
  if (canRenderOptimistically) return <>{children}</>

  if (auth.loading) return <LoadingShell />

  if (!auth.user) {
    return <LoginPage onSignIn={auth.signInWithGoogle} error={auth.error} />
  }

  // Mid-reload: auth confirmed + we have a cached courtId, but Firestore
  // hasn't finished its first snapshot yet. Keep showing the app.
  if (court.loading && initialCache?.courtId) return <>{children}</>

  if (court.loading) return <LoadingShell />

  if (!court.profile?.courtId) {
    return (
      <CourtShell user={auth.user}>
        <CourtBootstrapDialog
          open
          onOpenChange={() => {}}
          onCreateCourt={court.createCourt}
          onJoinCourt={court.joinCourt}
          title={`Welcome, ${(auth.user.displayName ?? 'player').split(' ')[0]}`}
          description="Pick a court to unlock CourtPals. Create one if you're the host, or join your friends with an invite code."
        />
      </CourtShell>
    )
  }

  return <>{children}</>
}

function LoadingShell() {
  return (
    <main className="flex min-h-screen items-center justify-center">
      <Loader2 className="size-8 animate-spin text-primary" />
    </main>
  )
}

function LoginPage({
  onSignIn,
  error,
}: {
  onSignIn: () => void
  error: string | null
}) {
  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="flex w-full max-w-md flex-col items-center gap-8 text-center">
        <div className="flex flex-col items-center gap-4">
          <span
            aria-hidden
            className="flex size-20 items-center justify-center rounded-3xl bg-primary text-4xl shadow-brut"
          >
            🏸
          </span>
          <div>
            <p className="font-display text-[11px] font-bold uppercase tracking-[0.28em] text-muted-foreground">
              saturday league
            </p>
            <h1 className="font-display text-5xl font-extrabold leading-none">CourtPals</h1>
          </div>
          <p className="max-w-xs text-sm text-muted-foreground">
            Casual badminton for weekend friends, with a real table and real stats.
          </p>
        </div>

        <Button
          size="lg"
          onClick={onSignIn}
          className="h-auto w-full gap-3 rounded-2xl border-2 border-primary px-6 py-4 shadow-brut active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
        >
          <GoogleGlyph />
          <span className="flex flex-col items-start leading-none">
            <span className="font-display text-[10px] font-bold uppercase tracking-[0.18em] opacity-70">
              continue with
            </span>
            <span className="font-display text-lg font-extrabold">Google</span>
          </span>
          <LogIn data-icon="inline-end" className="ml-auto size-5" />
        </Button>

        {error && (
          <p className="rounded-lg bg-destructive/10 px-3 py-2 text-xs text-destructive">
            {error}
          </p>
        )}

        <p className="text-[11px] text-muted-foreground">
          Admins create a court and share an invite code.
          <br />
          Players sign in and join with that code.
        </p>
      </div>
    </main>
  )
}

function CourtShell({
  user,
  children,
}: {
  user: { displayName: string | null; photoURL: string | null }
  children: ReactNode
}) {
  const name = user.displayName ?? 'Player'
  return (
    <main className="relative flex min-h-screen items-center justify-center px-4 py-12">
      <div className="flex flex-col items-center gap-4 text-center opacity-70">
        {user.photoURL ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={user.photoURL}
            alt=""
            className="size-16 rounded-2xl"
            referrerPolicy="no-referrer"
          />
        ) : (
          <span
            aria-hidden
            className="flex size-16 items-center justify-center rounded-2xl bg-primary/15 font-display text-2xl font-extrabold text-primary"
          >
            {name.charAt(0).toUpperCase()}
          </span>
        )}
        <p className="font-display text-[11px] font-bold uppercase tracking-[0.22em] text-muted-foreground">
          signed in as
        </p>
        <p className="font-display text-xl font-extrabold">{name}</p>
      </div>
      {children}
    </main>
  )
}

function GoogleGlyph() {
  return (
    <span
      aria-hidden
      className="flex size-8 items-center justify-center rounded-xl bg-white"
    >
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="size-5">
        <path
          fill="#EA4335"
          d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
        />
        <path
          fill="#4285F4"
          d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
        />
        <path
          fill="#FBBC05"
          d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
        />
        <path
          fill="#34A853"
          d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
        />
        <path fill="none" d="M0 0h48v48H0z" />
      </svg>
    </span>
  )
}
