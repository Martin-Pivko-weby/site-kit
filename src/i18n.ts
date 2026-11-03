export type Localized<T = string> = Partial<Record<string, T>>

/** Value for the locale, else the default locale, else nothing. */
export function t<T = string>(value: Localized<T> | undefined, locale: string, fallback: string): T | undefined {
  if (!value) return undefined
  return value[locale] ?? value[fallback]
}
