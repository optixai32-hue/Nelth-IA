'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState
} from 'react'

import { defaultLocale, isLocale, type Locale } from '@/lib/i18n/config'
import { greetingPhrases, translations } from '@/lib/i18n/translations'

interface I18nContextValue {
  locale: Locale
  setLocale: (locale: Locale) => void
  t: (key: string) => string
  greetingPhrases: string[]
}

const I18nContext = createContext<I18nContextValue | null>(null)

const STORAGE_KEY = 'nelth-locale'

function lookup(locale: Locale, key: string): string {
  return translations[locale][key] ?? translations[defaultLocale][key] ?? key
}

export function I18nProvider({
  initialLocale,
  children
}: {
  initialLocale: Locale
  children: React.ReactNode
}) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale)

  // Reflect the active locale on <html lang>.
  useEffect(() => {
    document.documentElement.lang = locale
  }, [locale])

  // Honor a previously chosen locale (stored client-side) after hydration.
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (isLocale(stored) && stored !== initialLocale) {
        setLocale(stored)
      }
    } catch {
      /* ignore */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next)
    try {
      localStorage.setItem(STORAGE_KEY, next)
    } catch {
      /* ignore */
    }
    document.cookie = `${STORAGE_KEY}=${next}; path=/; max-age=31536000; samesite=lax`
  }, [])

  const t = useCallback((key: string) => lookup(locale, key), [locale])

  const value = useMemo<I18nContextValue>(
    () => ({
      locale,
      setLocale,
      t,
      greetingPhrases: greetingPhrases[locale]
    }),
    [locale, setLocale, t]
  )

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext)
  if (!ctx) {
    return {
      locale: defaultLocale,
      setLocale: () => {},
      t: (key: string) => lookup(defaultLocale, key),
      greetingPhrases: greetingPhrases[defaultLocale]
    }
  }
  return ctx
}
