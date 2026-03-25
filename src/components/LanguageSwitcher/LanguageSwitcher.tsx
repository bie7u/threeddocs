import { useLanguage, type Language } from '../../i18n';

const FLAG_EMOJIS: Record<Language, string> = {
  pl: '🇵🇱',
  en: '🇬🇧',
};

interface LanguageSwitcherProps {
  /** Visual style: 'navbar' for light nav, 'dark' for dark backgrounds */
  variant?: 'navbar' | 'dark';
}

export const LanguageSwitcher = ({ variant = 'navbar' }: LanguageSwitcherProps) => {
  const { language, setLanguage, t } = useLanguage();

  const languages: Language[] = ['pl', 'en'];

  const baseBtn =
    'flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 border';

  const activeBtn =
    variant === 'dark'
      ? 'bg-white/20 border-white/30 text-white'
      : 'bg-blue-100 border-blue-300 text-blue-700';

  const inactiveBtn =
    variant === 'dark'
      ? 'bg-transparent border-transparent text-white/60 hover:text-white hover:bg-white/10 hover:border-white/20'
      : 'bg-transparent border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-100 hover:border-gray-200';

  return (
    <div className="flex items-center gap-1" role="group" aria-label="Language switcher">
      {languages.map((lang) => (
        <button
          key={lang}
          onClick={() => setLanguage(lang)}
          className={`${baseBtn} ${language === lang ? activeBtn : inactiveBtn}`}
          aria-pressed={language === lang}
          title={t.language[lang]}
        >
          <span aria-hidden="true">{FLAG_EMOJIS[lang]}</span>
          <span>{lang.toUpperCase()}</span>
        </button>
      ))}
    </div>
  );
};
