import { useLanguage } from './LanguageContext';
import type { Locale } from './index';

export const LanguageDropdown = () => {
  const { locale, setLocale, t } = useLanguage();
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-xs text-gray-500 hidden sm:inline">{t('language.label')}</span>
      <select
        value={locale}
        onChange={(e) => setLocale(e.target.value as Locale)}
        className="text-sm border border-gray-300 rounded-md px-2 py-1 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
        aria-label={t('language.label')}
      >
        <option value="pl">🇵🇱 Polski</option>
        <option value="en">🇬🇧 English</option>
      </select>
    </div>
  );
};
