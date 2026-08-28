// Normalized user shape shared between server (Firebase Admin) and client
// (Firebase Web SDK) so UI components don't depend on a specific SDK's types.
export interface AppUser {
  id: string
  email?: string | null
  name?: string | null
  image?: string | null
}
