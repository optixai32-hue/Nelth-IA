import { NextRequest, NextResponse } from 'next/server'

import { getAuth } from '@/lib/firebase/admin'
import { SESSION_COOKIE } from '@/lib/firebase/config'

const SESSION_DURATION_MS = 60 * 60 * 24 * 5 * 1000 // 5 days

export async function POST(request: NextRequest) {
  try {
    const { idToken } = await request.json()
    if (!idToken || typeof idToken !== 'string') {
      return NextResponse.json({ error: 'Missing idToken' }, { status: 400 })
    }

    const decoded = await getAuth().verifyIdToken(idToken)
    // Only accept freshly issued tokens to avoid session fixation.
    if (Date.now() / 1000 - (decoded.auth_time ?? 0) > 5 * 60) {
      return NextResponse.json({ error: 'Token too old' }, { status: 401 })
    }

    const cookie = await getAuth().createSessionCookie(idToken, {
      expiresIn: SESSION_DURATION_MS
    })

    const response = NextResponse.json({ success: true })
    response.cookies.set(SESSION_COOKIE, cookie, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: SESSION_DURATION_MS / 1000
    })
    return response
  } catch (error) {
    console.error('Session creation failed:', error)
    return NextResponse.json(
      { error: 'Failed to create session' },
      { status: 401 }
    )
  }
}

export async function DELETE() {
  const response = NextResponse.json({ success: true })
  response.cookies.set(SESSION_COOKIE, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0
  })
  return response
}
