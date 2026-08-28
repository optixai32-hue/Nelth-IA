import { Timestamp } from 'firebase-admin/firestore'

import { getDb } from '@/lib/firebase/admin'

export interface FirestoreRateLimitResult {
  allowed: boolean
  remaining: number
  resetAt: number
  limit: number
  used: number
  enforced: boolean
}

function nextMidnightMillis(): number {
  const now = new Date()
  const midnight = new Date(now)
  midnight.setUTCHours(24, 0, 0, 0)
  return midnight.getTime()
}

function toMillis(value: any): number {
  if (!value) return 0
  if (typeof value === 'number') return value
  if (value instanceof Date) return value.getTime()
  if (typeof value.toMillis === 'function') return value.toMillis()
  if (typeof value.toDate === 'function') return value.toDate().getTime()
  return new Date(value).getTime()
}

/**
 * Increment a daily rate-limit counter stored in Firestore. The counter resets
 * at midnight UTC. Fail-open: on any error we allow the request.
 */
export async function incrementFirestoreRateLimit(
  key: string,
  limit: number
): Promise<FirestoreRateLimitResult> {
  try {
    const db = getDb()
    const ref = db.collection('rate_limits').doc(key)
    const midnight = nextMidnightMillis()

    const count = await db.runTransaction(async t => {
      const snap = await t.get(ref)
      const data = snap.data()
      const now = Date.now()
      let current = 1
      if (data && data.expiresAt && toMillis(data.expiresAt) > now) {
        current = (data.count || 0) + 1
      }
      t.set(
        ref,
        {
          count: current,
          expiresAt: Timestamp.fromMillis(midnight),
          updatedAt: new Date()
        },
        { merge: true }
      )
      return current
    })

    return {
      allowed: count <= limit,
      remaining: Math.max(0, limit - count),
      resetAt: midnight,
      limit,
      used: count,
      enforced: true
    }
  } catch (error) {
    console.error('Firestore rate limit check failed:', error)
    return {
      allowed: true,
      remaining: Infinity,
      resetAt: 0,
      limit,
      used: 0,
      enforced: false
    }
  }
}

export function isEnforced(): boolean {
  return (
    process.env.MORPHIC_CLOUD_DEPLOYMENT === 'true' &&
    Boolean(
      process.env.FIREBASE_SERVICE_ACCOUNT ||
        (process.env.FIREBASE_PROJECT_ID &&
          process.env.FIREBASE_CLIENT_EMAIL &&
          process.env.FIREBASE_PRIVATE_KEY)
    )
  )
}
