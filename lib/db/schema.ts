import { createId } from '@paralleldrive/cuid2'

// Constants
const ID_LENGTH = 191

// ID generation function (kept for compatibility with existing callers)
export const generateId = () => createId()

export type ChatVisibility = 'public' | 'private'

export interface Chat {
  id: string
  createdAt: Date
  title: string
  userId: string
  visibility: ChatVisibility
}

export interface Message {
  id: string
  chatId: string
  role: string
  createdAt: Date | string
  updatedAt: Date | string | null
  // Server-controlled, monotonic per-conversation ordering key. Missing on
  // legacy messages (pre-sequence migration); those fall back to createdAt.
  sequence?: number | null
  metadata?: Record<string, any> | null
}

export interface Note {
  id: string
  userId: string
  chatId: string | null
  sourceMessageId: string | null
  title: string
  content: string
  createdAt: Date
  updatedAt: Date
}

export interface NewNote {
  userId: string
  chatId: string | null
  sourceMessageId: string | null
  title: string
  content: string
}

export interface LibraryFile {
  id: string
  userId: string
  chatId: string | null
  filename: string
  objectKey: string
  mediaType: string
  size: number | null
  createdAt: Date
  updatedAt: Date
}

export interface NewLibraryFile {
  userId: string
  chatId: string | null
  filename: string
  objectKey: string
  mediaType: string
  size: number | null
}

export type FeedbackSentiment = 'positive' | 'neutral' | 'negative'

export interface Feedback {
  id: string
  userId: string | null
  sentiment: FeedbackSentiment
  message: string
  pageUrl: string
  userAgent: string | null
  createdAt: Date
}
