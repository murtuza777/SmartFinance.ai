'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import {
  login as loginRequest,
  logout as logoutRequest,
  me as meRequest,
  signup as signupRequest,
  type AppUser
} from '@/lib/auth-client'
import { getGuestInfo, logoutGuest, type GuestUser } from '@/lib/guest-auth'

interface AuthContextType {
  user: AppUser | null
  guestUser: GuestUser | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  isGuest: boolean
  upgradeToEmail: (email: string, password: string) => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType)

export const useAuth = () => useContext(AuthContext)

import FinanceLoader from '@/components/ui/FinanceLoader'

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null)
  const [guestUser, setGuestUser] = useState<GuestUser | null>(null)
  const [loading, setLoading] = useState(true)

  const syncUserFromBackend = async (): Promise<AppUser | null> => {
    const currentUser = await meRequest()
    setUser(currentUser)
    if (currentUser) {
      setGuestUser(null)
      logoutGuest()
    } else {
      setGuestUser(getGuestInfo())
    }
    return currentUser
  }

  const refreshUser = async (): Promise<void> => {
    await syncUserFromBackend()
  }

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        await syncUserFromBackend()
      } catch {
        // If backend auth check fails, use guest session fallback.
        setGuestUser(getGuestInfo())
      } finally {
        setLoading(false)
      }
    }

    void initializeAuth()
  }, [])

  const signIn = async (email: string, password: string) => {
    await loginRequest(email, password)
    const signedInUser = await syncUserFromBackend()
    if (!signedInUser) {
      throw new Error('Sign in succeeded but session was not established. Please try again.')
    }
  }

  const signUp = async (email: string, password: string) => {
    await signupRequest(email, password)
    const signedUpUser = await syncUserFromBackend()
    if (!signedUpUser) {
      throw new Error('Account created but session was not established. Please try signing in.')
    }
  }

  const logout = async () => {
    if (guestUser) {
      logoutGuest()
      setGuestUser(null)
      return
    }

    await logoutRequest()
    setUser(null)
  }

  const upgradeToEmail = async (email: string, password: string) => {
    if (!guestUser) {
      throw new Error('No guest session to upgrade')
    }

    await signUp(email, password)
  }

  const value = {
    user,
    guestUser,
    loading,
    signIn,
    signUp,
    logout,
    isGuest: !!guestUser,
    upgradeToEmail,
    refreshUser
  }

  return (
    <AuthContext.Provider value={value}>
      {loading ? <FinanceLoader /> : children}
    </AuthContext.Provider>
  )
}
