'use client'

import { useEffect, useState } from 'react'

import { getFirebaseAuth } from '@/lib/firebase/client'

export const useCurrentUserImage = () => {
  const [image, setImage] = useState<string | null>(null)

  useEffect(() => {
    const auth = getFirebaseAuth()
    const unsubscribe = auth.onAuthStateChanged(user => {
      setImage(user?.photoURL ?? null)
    })
    return () => unsubscribe()
  }, [])

  return image
}
