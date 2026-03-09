'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { motion } from 'framer-motion'
import { signInAsGuest } from '@/lib/firebase';

export default function LoginPage() {
  const router = useRouter()
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showGuestDialog, setShowGuestDialog] = useState(false)
  const [guestName, setGuestName] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      // For development, just check if fields are not empty
      if (email && password) {
        // Log the navigation attempt
        console.log('Attempting to navigate to dashboard...')
        // Force a hard navigation to the dashboard
        window.location.href = '/dashboard'
        // Alternative approach using router
        // await router.push('/dashboard')
      }
    } catch (error) {
      console.error('Navigation error:', error)
    }
  }

  const handleGuestLoginClick = () => {
    setShowGuestDialog(true)
  }

  const handleGuestLogin = async () => {
    if (!guestName.trim()) {
      return
    }
    
    setIsLoading(true)
    try {
      await signInAsGuest(guestName.trim());
      setShowGuestDialog(false)
      // Reload to update auth context
      window.location.href = '/dashboard';
    } catch (error) {
      console.error('Guest login failed:', error);
      alert('Failed to login as guest. Please try again.');
    } finally {
      setIsLoading(false)
    }
  };
  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      {/* Background effects */}
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-cyan-900/20 via-black to-black" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="w-[400px] bg-black/80 backdrop-blur-lg border-cyan-500/30">
          <CardHeader>
            <CardTitle className="text-xl text-cyan-500">
              {isLogin ? 'Welcome to SmartFinance.AI' : 'Join SmartFinance.AI'}
            </CardTitle>
            <CardDescription className="text-gray-300">
              {isLogin 
                ? 'Access your AI-powered financial insights' 
                : 'Start your journey to better loan management'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-gray-200">Email</Label>
                <Input 
                  id="email" 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="user@university.edu"
                  className="bg-gray-900 text-white placeholder:text-gray-500"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-gray-200">Password</Label>
                <Input 
                  id="password" 
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-gray-900 text-white"
                  required
                />
              </div>
              <Button 
                type="submit" 
                className="w-full bg-cyan-500 hover:bg-cyan-600"
                onClick={(e) => {
                  e.preventDefault()
                  if (email && password) {
                    window.location.href = '/dashboard'
                  }
                }}
              >
                {isLogin ? 'Sign In' : 'Create Account'}
              </Button>
              <Button 
                className="w-full bg-gray-700 hover:bg-gray-600 mt-4"
                onClick={handleGuestLoginClick}
              >
                Continue as Guest
              </Button>
              <div className="text-center">
                <button
                  type="button"
                  onClick={() => setIsLogin(!isLogin)}
                  className="text-cyan-500 hover:text-cyan-400 text-sm"
                >
                  {isLogin 
                    ? "Don't have an account? Sign up" 
                    : "Already have an account? Sign in"}
                </button>
              </div>
            </form>
          </CardContent>
        </Card>
      </motion.div>
      
      <Dialog open={showGuestDialog} onOpenChange={setShowGuestDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogTitle>Enter Your Name</DialogTitle>
          <DialogDescription>
            Please enter your name to continue as a guest.
          </DialogDescription>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="guest-name" className="text-gray-200">Name</Label>
              <Input
                id="guest-name"
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                placeholder="Enter your name"
                className="bg-gray-900 text-white placeholder:text-gray-500"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && guestName.trim()) {
                    handleGuestLogin()
                  }
                }}
                autoFocus
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowGuestDialog(false)
                  setGuestName('')
                }}
                className="bg-gray-800 text-gray-200 border-gray-700 hover:bg-gray-700"
              >
                Cancel
              </Button>
              <Button
                onClick={handleGuestLogin}
                disabled={!guestName.trim() || isLoading}
                className="bg-cyan-500 hover:bg-cyan-600"
              >
                {isLoading ? 'Logging in...' : 'Continue'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}