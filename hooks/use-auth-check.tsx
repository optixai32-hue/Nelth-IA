'use client'

import { useEffect, useState } from 'react'

import { getFirebaseAuth } from '@/lib/firebase/client'
import type { AppUser } from '@/lib/firebase/user'

function toAppUser(user: import('firebase/auth').User): AppUser {
  return {
    id: user.uid,
    email: user.email,
    name: user.displayName,
    image: user.photoURL
  }
}

export function useAuthCheck() {
  const [user, setUser] = useState<AppUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let unsubscribe: (() => void) | null = null

    try {
      const auth = getFirebaseAuth()
      setUser(auth.currentUser ? toAppUser(auth.currentUser) : null)

      unsubscribe = auth.onAuthStateChanged(firebaseUser => {
        setUser(firebaseUser ? toAppUser(firebaseUser) : null)
      })
    } catch {
      setUser(null)
    } finally {
      setLoading(false)
    }

    return () => {
      unsubscribe?.()
    }
  }, [])

  return { user, loading, isAuthenticated: !!user }
}
