export const SESSION_COOKIE = '__session'

export interface FirebaseClientConfig {
  apiKey?: string
  authDomain?: string
  databaseURL?: string
  projectId?: string
  storageBucket?: string
  messagingSenderId?: string
  appId?: string
  measurementId?: string
}

export function getFirebaseClientConfig(): FirebaseClientConfig {
  return {
    apiKey: 'AIzaSyAI2AiKqOo7qhqo4FS5TJhObjKoEYQJq2w',
    authDomain: 'optix-ai-2cef1.firebaseapp.com',
    databaseURL: 'https://optix-ai-2cef1-default-rtdb.firebaseio.com',
    projectId: 'optix-ai-2cef1',
    storageBucket: 'optix-ai-2cef1.firebasestorage.app',
    messagingSenderId: '172919095312',
    appId: '1:172919095312:web:c071478198f26bf905ca95',
    measurementId: 'G-LJ9648RTHZ'
  }
}

/**
 * True when the public (client-side) Firebase config is available.
 * Used to gate auth UI and session middleware, mirroring the previous
 * `hasSupabasePublicConfig()` behaviour.
 */
export function hasFirebaseConfig(): boolean {
  const c = getFirebaseClientConfig()
  return Boolean(c.apiKey && c.projectId && c.appId)
}

/**
 * True when the server-side Firebase Admin credentials are available.
 */
export function hasFirebaseAdminConfig(): boolean {
  if (process.env.FIREBASE_SERVICE_ACCOUNT) return true
  return Boolean(
    process.env.FIREBASE_PROJECT_ID &&
      process.env.FIREBASE_CLIENT_EMAIL &&
      process.env.FIREBASE_PRIVATE_KEY
  )
}
