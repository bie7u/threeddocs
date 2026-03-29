import { useAppStore } from '../store';
import { getTranslations } from '../i18n';

export function useTranslation() {
  const language = useAppStore(s => s.language);
  const t = getTranslations(language);
  return { t, language };
}
