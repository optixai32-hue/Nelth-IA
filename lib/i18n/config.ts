export const locales = ['en', 'fr'] as const

export type Locale = (typeof locales)[number]

export const defaultLocale: Locale = 'en'

export function isLocale(value: string | null | undefined): value is Locale {
  return !!value && (locales as readonly string[]).includes(value)
}

/** Pick a supported locale from an Accept-Language HTTP header. */
export function detectLocaleFromHeader(
  acceptLanguage: string | null | undefined
): Locale {
  if (!acceptLanguage) return defaultLocale

  const ranked = acceptLanguage
    .split(',')
    .map(part => {
      const [tag, q] = part.trim().split(';q=')
      return { tag: (tag ?? '').toLowerCase(), q: q ? parseFloat(q) : 1 }
    })
    .sort((a, b) => b.q - a.q)
    .map(item => item.tag)

  for (const tag of ranked) {
    if (tag.startsWith('fr')) return 'fr'
    if (tag.startsWith('en')) return 'en'
  }

  return defaultLocale
}

/** Pick a supported locale from the browser (client only). */
export function detectLocaleFromNavigator(): Locale {
  if (typeof navigator === 'undefined') return defaultLocale
  const langs = navigator.languages ?? [navigator.language]
  for (const lang of langs) {
    const lower = lang.toLowerCase()
    if (lower.startsWith('fr')) return 'fr'
    if (lower.startsWith('en')) return 'en'
  }
  return defaultLocale
}
