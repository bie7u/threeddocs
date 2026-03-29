import { useAppStore } from '../store';
import pl from './pl';
import en from './en';

type Translations = typeof pl;

const resources: Record<string, Translations> = { pl, en };

function getNestedValue(obj: Record<string, unknown>, path: string): string {
  const parts = path.split('.');
  let current: unknown = obj;
  for (const part of parts) {
    if (current == null || typeof current !== 'object') return path;
    current = (current as Record<string, unknown>)[part];
  }
  return typeof current === 'string' ? current : path;
}

export function t(key: string, params?: Record<string, string | number>): string {
  const lang = useAppStore.getState().language;
  const translations = resources[lang] ?? resources.pl;
  let str = getNestedValue(translations as unknown as Record<string, unknown>, key);
  if (str === key) {
    str = getNestedValue(resources.pl as unknown as Record<string, unknown>, key);
  }
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      str = str.replace(`{${k}}`, String(v));
    });
  }
  return str;
}

export function useTranslation() {
  // Subscribe to language changes so components re-render on switch
  const language = useAppStore((state) => state.language);
  // language is used to trigger re-renders when it changes
  void language;
  return { t, language };
}
