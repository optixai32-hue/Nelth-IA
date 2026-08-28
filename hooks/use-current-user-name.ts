'use client'

import { useEffect, useState } from 'react'

import { getFirebaseAuth } from '@/lib/firebase/client'

export const useCurrentUserName = () => {
  const [name, setName] = useState<string | null>(null)

  useEffect(() => {
    const auth = getFirebaseAuth()
    const unsubscribe = auth.onAuthStateChanged(user => {
      setName(user?.displayName ?? user?.email?.split('@')[0] ?? 'Anonymous')
    })
    return () => unsubscribe()
  }, [])

  return name || '?'
}
