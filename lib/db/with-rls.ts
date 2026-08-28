// With Firebase Admin (server-side), all reads/writes bypass Firestore
// Security Rules. Row-level access is therefore enforced in application code
// (each data-access function checks `userId` ownership). These helpers remain
// as thin pass-through wrappers so existing call sites keep working.

export type DbInstance = any
export type TxInstance = any

export class RLSViolationError extends Error {
  constructor(message = 'Row level security policy violation') {
    super(message)
    this.name = 'RLSViolationError'
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, RLSViolationError)
    }
  }
}

export async function withRLS<T>(
  _userId: string,
  callback: (tx: TxInstance) => Promise<T>
): Promise<T> {
  return callback(undefined as unknown as TxInstance)
}

export async function withOptionalRLS<T>(
  _userId: string | null,
  callback: (tx: TxInstance | DbInstance) => Promise<T>
): Promise<T> {
  return callback(undefined as unknown as TxInstance)
}
