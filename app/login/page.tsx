'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowRight, Eye, EyeOff, Loader2, UserCircle2 } from 'lucide-react'
import { motion } from 'framer-motion'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/contexts/AuthContext'
import { signInAsGuest } from '@/lib/guest-auth'
import { BrandIdentity } from '@/components/BrandIdentity'

export default function LoginPage() {
  const router = useRouter()
  const { signIn, signUp, refreshUser, user, isGuest } = useAuth()
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showGuestDialog, setShowGuestDialog] = useState(false)
  const [guestName, setGuestName] = useState('')

  useEffect(() => {
    if (user || isGuest) {
      router.replace('/dashboard')
    }
  }, [isGuest, router, user])

  const handleAuthSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError('')
    setLoading(true)
    try {
      if (mode === 'login') {
        await signIn(email.trim(), password)
        router.push('/dashboard')
      } else {
        await signUp(email.trim(), password)
        router.push('/onboarding')
      }
    } catch (authError) {
      setError(authError instanceof Error ? authError.message : 'Authentication failed')
    } finally {
      setLoading(false)
    }
  }

  const handleGuestLogin = async () => {
    if (!guestName.trim()) return
    setLoading(true)
    setError('')
    try {
      await signInAsGuest(guestName.trim())
      await refreshUser()
      setShowGuestDialog(false)
      router.push('/dashboard')
    } catch {
      setError('Guest login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_5%_10%,#0891b22f,transparent_42%),radial-gradient(circle_at_100%_0%,#f59e0b1f,transparent_32%),linear-gradient(#020617,#020617)] text-slate-100">
      <div className="mx-auto grid min-h-screen max-w-6xl lg:grid-cols-2">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4 }}
          className="hidden lg:flex flex-col justify-between p-10 border-r border-cyan-500/20 bg-slate-950/30"
        >
          <BrandIdentity size={38} textClassName="text-3xl font-semibold text-cyan-300" />
          <div>
            <h1 className="text-4xl leading-tight font-semibold">
              Student finance, tracked with data.
            </h1>
            <p className="mt-4 text-slate-300 max-w-md">
              Sign in to access real financial analytics from your Cloudflare backend and get personalized guidance.
            </p>
          </div>
          <div className="rounded-xl border border-cyan-500/20 bg-slate-900/50 p-5 text-sm text-slate-300">
            <p className="font-medium text-cyan-200">What you get after login</p>
            <ul className="mt-3 space-y-2">
              <li>Live financial summary from D1</li>
              <li>Onboarding with profile and loan setup</li>
              <li>AI advisor and budgeting insights</li>
            </ul>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="flex items-center justify-center p-6"
        >
          <div className="w-full max-w-md rounded-3xl border border-cyan-500/25 bg-gradient-to-b from-slate-900/80 via-slate-950/90 to-slate-950 backdrop-blur-xl p-8 shadow-[0_24px_80px_rgba(8,145,178,0.45)] ring-1 ring-cyan-400/30">
            <div className="mb-7 space-y-3">
              <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-slate-900/70 px-3 py-1 text-xs font-medium text-cyan-200">
                <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" />
                Secure BurryAI access
              </div>
              <BrandIdentity size={30} textClassName="text-2xl font-semibold text-cyan-200 lg:hidden" />
              <h2 className="text-2xl font-semibold mt-1">
                {mode === 'login' ? 'Sign in to BurryAI' : 'Create your account'}
              </h2>
              <p className="text-slate-300/90 text-sm leading-relaxed">
                {mode === 'login'
                  ? 'Continue with your account to open the dashboard.'
                  : 'Create your account and start onboarding.'}
              </p>
            </div>

            <form className="space-y-5" onSubmit={handleAuthSubmit}>
              <div className="space-y-2">
                <Label htmlFor="email" className="text-xs font-medium uppercase tracking-[0.16em] text-slate-400">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="student@university.edu"
                  className="bg-slate-950/80 border-cyan-500/30 focus-visible:ring-cyan-400/60 focus-visible:ring-2"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label
                  htmlFor="password"
                  className="text-xs font-medium uppercase tracking-[0.16em] text-slate-400"
                >
                  Password
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    minLength={8}
                    className="bg-slate-950/80 border-cyan-500/30 pr-10 focus-visible:ring-cyan-400/60 focus-visible:ring-2"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                    aria-label="Toggle password visibility"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {error ? <p className="text-sm text-rose-400">{error}</p> : null}

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-11 rounded-full bg-gradient-to-r from-cyan-300 via-cyan-400 to-teal-300 text-slate-950 font-semibold tracking-wide shadow-[0_18px_55px_rgba(34,211,238,0.55)] hover:shadow-[0_22px_70px_rgba(34,211,238,0.6)] hover:brightness-105 active:brightness-95 focus-visible:ring-2 focus-visible:ring-cyan-300/70 focus-visible:ring-offset-0"
              >
                {loading ? (
                  <span className="inline-flex items-center">
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Working...
                  </span>
                ) : (
                  <span className="inline-flex items-center">
                    {mode === 'login' ? 'Sign In' : 'Create Account'}
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </span>
                )}
              </Button>

              <div className="relative py-1">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-cyan-500/15" />
                </div>
                <div className="relative flex justify-center">
                  <span className="bg-slate-950/60 px-3 text-[11px] uppercase tracking-[0.22em] text-slate-400">
                    Or
                  </span>
                </div>
              </div>

              <Button
                type="button"
                variant="outline"
                onClick={() => setShowGuestDialog(true)}
                className="w-full h-11 rounded-full border border-cyan-500/25 bg-slate-950/45 hover:bg-slate-900/60 text-slate-100 shadow-[0_12px_40px_rgba(2,6,23,0.65)] hover:border-cyan-400/35 focus-visible:ring-2 focus-visible:ring-cyan-300/50 focus-visible:ring-offset-0"
              >
                <UserCircle2 className="h-4 w-4 mr-2 text-cyan-200" />
                Continue as Guest
              </Button>

              <p className="text-xs text-center text-slate-400 pt-1">
                {mode === 'login' ? "Don't have an account?" : 'Already have an account?'}{' '}
                <button
                  type="button"
                  onClick={() => setMode((prev) => (prev === 'login' ? 'signup' : 'login'))}
                  className="text-cyan-300 hover:text-cyan-200 font-medium"
                >
                  {mode === 'login' ? 'Create one' : 'Sign in'}
                </button>
              </p>
            </form>
          </div>
        </motion.div>
      </div>

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
                disabled={loading || !guestName.trim()}
                className="bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-semibold"
              >
                Continue
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
