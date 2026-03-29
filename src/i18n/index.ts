export type Locale = 'pl' | 'en';

const STORAGE_KEY = 'language';

import { pl } from './pl';
import { en } from './en';

const translations: Record<Locale, typeof pl> = { pl, en };

export function getStoredLocale(): Locale {
  const stored = localStorage.getItem(STORAGE_KEY);
  return (stored === 'en' || stored === 'pl') ? stored : 'pl';
}

export function setStoredLocale(locale: Locale): void {
  localStorage.setItem(STORAGE_KEY, locale);
}

export function translate(key: string, locale: Locale, params?: Record<string, string | number>): string {
  const dict = translations[locale] as Record<string, unknown>;
  const parts = key.split('.');
  let val: unknown = dict;
  for (const part of parts) {
    if (val && typeof val === 'object') {
      val = (val as Record<string, unknown>)[part];
    } else {
      val = undefined;
      break;
    }
  }
  if (val === undefined) {
    let fallback: unknown = translations['pl'] as Record<string, unknown>;
    for (const part of parts) {
      if (fallback && typeof fallback === 'object') {
        fallback = (fallback as Record<string, unknown>)[part];
      } else { fallback = undefined; break; }
    }
    val = fallback ?? key;
  }
  let result = String(val ?? key);
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      result = result.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v));
    }
  }
  return result;
}
