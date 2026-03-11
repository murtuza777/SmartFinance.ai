'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { SignUpCard } from '@/components/ui/sign-up-card'

export default function SignUpPage() {
  const router = useRouter()
  const { signUp, user, isGuest } = useAuth()

  useEffect(() => {
    if (user || isGuest) {
      router.replace('/dashboard')
    }
  }, [isGuest, router, user])

  const handleSignUp = async (email: string, password: string) => {
    await signUp(email, password)
    router.push('/onboarding')
  }

  return (
    <SignUpCard onSignUp={handleSignUp} />
  )
}
