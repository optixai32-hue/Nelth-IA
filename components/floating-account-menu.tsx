'use client'

import type { AppUser } from '@/lib/firebase/user'

import { useSidebar } from '@/components/ui/sidebar'

import GuestMenu from './guest-menu'
import UserMenu from './user-menu'

export default function FloatingAccountMenu({
  user
}: {
  user: AppUser | null
}) {
  const { state, isMobile } = useSidebar()

  // On mobile the account menu lives in the sidebar drawer footer, so the
  // floating bottom-left avatar is hidden entirely to avoid a duplicate.
  if (isMobile) {
    return null
  }

  if (state === 'expanded') {
    return null
  }

  return (
    <div className="fixed bottom-3 left-3 z-50">
      {user ? <UserMenu user={user} /> : <GuestMenu />}
    </div>
  )
}
