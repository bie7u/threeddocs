import { useAppStore } from '../../store';
import { useLanguage } from '../../i18n/LanguageContext';

interface DarkModeToggleProps {
  className?: string;
}

export const DarkModeToggle = ({ className = '' }: DarkModeToggleProps) => {
  const { isDarkMode, setDarkMode } = useAppStore();
  const { t } = useLanguage();

  return (
    <button
      onClick={() => setDarkMode(!isDarkMode)}
      className={`w-9 h-9 flex items-center justify-center rounded-lg transition-all duration-200 ${className}`}
      title={isDarkMode ? t('mainLayout.lightMode') : t('mainLayout.darkMode')}
    >
      {isDarkMode ? (
        <svg className="w-5 h-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707M17.657 17.657l-.707-.707M6.343 6.343l-.707-.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ) : (
        <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
        </svg>
      )}
    </button>
  );
};
