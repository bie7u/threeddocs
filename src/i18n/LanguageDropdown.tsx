import { useLanguage } from './LanguageContext';
import type { Locale } from './index';

const LANGS: { value: Locale; flag: string; label: string }[] = [
  { value: 'pl', flag: '🇵🇱', label: 'PL' },
  { value: 'en', flag: '🇺🇸', label: 'ENG' },
];

export const LanguageDropdown = () => {
  const { locale, setLocale, t } = useLanguage();
  return (
    <div
      className="flex items-center rounded-full border border-gray-200 bg-gray-100 p-0.5 gap-0.5"
      role="group"
      aria-label={t('language.label')}
    >
      {LANGS.map(({ value, flag, label }) => {
        const active = locale === value;
        return (
          <button
            key={value}
            onClick={() => setLocale(value)}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold transition-all duration-150 select-none ${
              active
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
            aria-pressed={active}
          >
            <span>{flag}</span>
            <span>{label}</span>
          </button>
        );
      })}
    </div>
  );
};
