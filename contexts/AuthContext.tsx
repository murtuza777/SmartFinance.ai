'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { 
  Auth,
  User,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from 'firebase/auth'
import { auth } from '@/lib/firebase'
import { EmailAuthProvider, linkWithCredential } from 'firebase/auth';
import { getGuestInfo, logoutGuest } from '@/lib/firebase';

interface GuestUser {
  name: string;
  isGuest: true;
}

interface AuthContextType {
  user: User | null;
  guestUser: GuestUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  isGuest: boolean;
  upgradeToEmail: (email: string, password: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType)

export const useAuth = () => useContext(AuthContext)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [guestUser, setGuestUser] = useState<GuestUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check for guest user in localStorage first
    const guest = getGuestInfo();
    if (guest) {
      setGuestUser(guest);
      setUser(null); // Clear Firebase user if guest
      setLoading(false);
    } else {
      // Check Firebase auth if no guest
      const unsubscribe = onAuthStateChanged(auth, (user) => {
        setUser(user)
        setGuestUser(null); // Clear guest if Firebase user exists
        setLoading(false)
      })
      return unsubscribe
    }
  }, [])

  const signIn = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password)
    setGuestUser(null) // Clear guest user if signing in with email
  }

  const signUp = async (email: string, password: string) => {
    await createUserWithEmailAndPassword(auth, email, password)
    setGuestUser(null) // Clear guest user if signing up with email
  }

  const logout = async () => {
    if (guestUser) {
      logoutGuest()
      setGuestUser(null)
    } else if (user) {
      await signOut(auth)
      setUser(null)
    }
  }

  const upgradeToEmail = async (email: string, password: string) => {
    if (guestUser) {
      // For guest users, just create a new account
      await signUp(email, password);
      logoutGuest();
    } else if (user) {
      const credential = EmailAuthProvider.credential(email, password);
      await linkWithCredential(user, credential);
    } else {
      throw new Error('No user to upgrade');
    }
  };
  
  const value = {
    user,
    guestUser,
    loading,
    signIn,
    signUp,
    logout,
    isGuest: !!guestUser || (user?.isAnonymous || false),
    upgradeToEmail
  }

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  )
}