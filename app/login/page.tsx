'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { signInAsGuest } from '@/lib/guest-auth'
import { SignInCard } from '@/components/ui/sign-in-card-2'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function LoginPage() {
  const router = useRouter()
  const { signIn, refreshUser, user, isGuest } = useAuth()
  const [showGuestDialog, setShowGuestDialog] = useState(false)
  const [guestName, setGuestName] = useState('')
  const [guestLoading, setGuestLoading] = useState(false)
  const [guestError, setGuestError] = useState('')

  useEffect(() => {
    if (user || isGuest) {
      router.replace('/dashboard')
    }
  }, [isGuest, router, user])

  const handleSignIn = async (email: string, password: string) => {
    await signIn(email, password)
    router.push('/dashboard')
  }

  const handleGuestLogin = async () => {
    if (!guestName.trim()) return
    setGuestLoading(true)
    setGuestError('')
    try {
      await signInAsGuest(guestName.trim())
      await refreshUser()
      setShowGuestDialog(false)
      router.push('/dashboard')
    } catch {
      setGuestError('Guest login failed')
    } finally {
      setGuestLoading(false)
    }
  }

  return (
    <>
      <SignInCard
        onSignIn={handleSignIn}
        onGuestLogin={() => setShowGuestDialog(true)}
      />

      <Dialog open={showGuestDialog} onOpenChange={setShowGuestDialog}>
        <DialogContent className="sm:max-w-[420px] bg-slate-950 text-slate-100 border border-cyan-500/20">
          <DialogTitle>Continue as guest</DialogTitle>
          <DialogDescription className="text-slate-300">
            Enter a display name. Guest mode does not persist financial data to your account.
          </DialogDescription>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label htmlFor="guestName">Name</Label>
              <Input
                id="guestName"
                value={guestName}
                onChange={(event) => setGuestName(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    void handleGuestLogin()
                  }
                }}
                placeholder="Alex"
                className="bg-slate-900 border-cyan-500/30"
                autoFocus
              />
            </div>
            {guestError && <p className="text-sm text-rose-400">{guestError}</p>}
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                className="border-slate-700 bg-slate-900 hover:bg-slate-800"
                onClick={() => {
                  setShowGuestDialog(false)
                  setGuestName('')
                }}
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={() => void handleGuestLogin()}
                disabled={guestLoading || !guestName.trim()}
                className="bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-semibold"
              >
                Continue
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
