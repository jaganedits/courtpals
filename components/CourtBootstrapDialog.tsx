'use client'

import { useState } from 'react'
import { Trophy, KeyRound } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreateCourt: (name: string) => Promise<string>
  onJoinCourt: (code: string) => Promise<string>
  /** Shown from another flow (e.g. just signed in for the first time). */
  title?: string
  description?: string
}

export default function CourtBootstrapDialog({
  open,
  onOpenChange,
  onCreateCourt,
  onJoinCourt,
  title = 'Set up your court',
  description = 'Create a new court for your Saturday group or join an existing one with an invite code.',
}: Props) {
  const [mode, setMode] = useState<'create' | 'join'>('create')
  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleCreate() {
    if (!name.trim()) return
    setSubmitting(true)
    setError(null)
    try {
      await onCreateCourt(name.trim())
      setName('')
      onOpenChange(false)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setSubmitting(false)
    }
  }

  async function handleJoin() {
    if (!code.trim()) return
    setSubmitting(true)
    setError(null)
    try {
      await onJoinCourt(code.trim())
      setCode('')
      onOpenChange(false)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-xl font-extrabold">{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <Tabs value={mode} onValueChange={v => setMode(v as 'create' | 'join')}>
          <TabsList className="grid grid-cols-2">
            <TabsTrigger value="create" className="gap-1.5 font-display text-[11px] uppercase tracking-[0.14em]">
              <Trophy className="size-3.5" />
              Create court
            </TabsTrigger>
            <TabsTrigger value="join" className="gap-1.5 font-display text-[11px] uppercase tracking-[0.14em]">
              <KeyRound className="size-3.5" />
              Join with code
            </TabsTrigger>
          </TabsList>

          <TabsContent value="create" className="flex flex-col gap-3 pt-3">
            <label className="flex flex-col gap-1.5">
              <span className="font-display text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                Court name
              </span>
              <Input
                autoFocus
                placeholder="Saturday Badminton"
                maxLength={40}
                value={name}
                onChange={e => setName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleCreate()}
                className="font-display font-semibold"
              />
            </label>
            <Button
              size="lg"
              onClick={handleCreate}
              disabled={!name.trim() || submitting}
              className="font-display font-extrabold"
            >
              {submitting ? 'Creating…' : 'Create court'}
            </Button>
            <p className="text-xs text-muted-foreground">
              You&apos;ll be the admin. An invite code will be generated you can share with your friends.
            </p>
          </TabsContent>

          <TabsContent value="join" className="flex flex-col gap-3 pt-3">
            <label className="flex flex-col gap-1.5">
              <span className="font-display text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                Invite code
              </span>
              <Input
                placeholder="e.g. AB4DK9"
                value={code}
                maxLength={8}
                onChange={e => setCode(e.target.value.toUpperCase())}
                onKeyDown={e => e.key === 'Enter' && handleJoin()}
                className="font-score text-center text-lg font-extrabold tabular tracking-[0.3em]"
              />
            </label>
            <Button
              size="lg"
              onClick={handleJoin}
              disabled={!code.trim() || submitting}
              className="font-display font-extrabold"
            >
              {submitting ? 'Joining…' : 'Join court'}
            </Button>
            <p className="text-xs text-muted-foreground">
              Ask your admin for the 6-character code shown in their court settings.
            </p>
          </TabsContent>
        </Tabs>

        {error && (
          <p className={cn('rounded-lg bg-destructive/10 px-3 py-2 text-xs text-destructive')}>
            {error}
          </p>
        )}
      </DialogContent>
    </Dialog>
  )
}
