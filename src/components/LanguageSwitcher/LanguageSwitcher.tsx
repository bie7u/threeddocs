import { useState, useRef, useEffect } from 'react';
import { useLanguage, type Language } from '../../i18n';

const FLAG_EMOJIS: Record<Language, string> = {
  pl: '🇵🇱',
  en: '🇬🇧',
};

const LANG_LABELS: Record<Language, string> = {
  pl: 'Polski',
  en: 'English',
};

interface LanguageSwitcherProps {
  /** Visual style: 'navbar' for light nav, 'dark' for dark backgrounds */
  variant?: 'navbar' | 'dark';
}

export const LanguageSwitcher = ({ variant = 'navbar' }: LanguageSwitcherProps) => {
  const { language, setLanguage } = useLanguage();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const isDark = variant === 'dark';

  const triggerClass = isDark
    ? 'flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-white/80 hover:text-white hover:bg-white/10 border border-white/20 hover:border-white/30 transition-all duration-150'
    : 'flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-gray-600 hover:text-gray-900 hover:bg-gray-100 border border-gray-200 hover:border-gray-300 transition-all duration-150';

  const dropdownClass = isDark
    ? 'absolute right-0 mt-1.5 w-36 rounded-xl border border-white/20 bg-slate-800 shadow-xl z-50 overflow-hidden'
    : 'absolute right-0 mt-1.5 w-36 rounded-xl border border-gray-200 bg-white shadow-lg z-50 overflow-hidden';

  const optionBase = 'flex items-center gap-2.5 w-full px-3 py-2 text-xs font-medium transition-colors duration-100 text-left';
  const optionActive = isDark ? 'bg-white/15 text-white' : 'bg-blue-50 text-blue-700';
  const optionInactive = isDark ? 'text-white/70 hover:bg-white/10 hover:text-white' : 'text-gray-700 hover:bg-gray-50';

  const languages: Language[] = ['pl', 'en'];

  return (
    <div ref={containerRef} className="relative" aria-label="Language switcher">
      <button
        onClick={() => setOpen((o) => !o)}
        className={triggerClass}
        aria-haspopup="listbox"
        aria-expanded={open}
        title={LANG_LABELS[language]}
      >
        <span aria-hidden="true" className="text-sm">{FLAG_EMOJIS[language]}</span>
        <span>{language.toUpperCase()}</span>
        <svg
          className={`w-3 h-3 transition-transform duration-150 ${open ? 'rotate-180' : ''} ${isDark ? 'text-white/60' : 'text-gray-400'}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2.5}
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className={dropdownClass} role="listbox" aria-label="Select language">
          {languages.map((lang) => (
            <button
              key={lang}
              role="option"
              aria-selected={language === lang}
              onClick={() => { setLanguage(lang); setOpen(false); }}
              className={`${optionBase} ${language === lang ? optionActive : optionInactive}`}
            >
              <span aria-hidden="true" className="text-base">{FLAG_EMOJIS[lang]}</span>
              <span>{LANG_LABELS[lang]}</span>
              {language === lang && (
                <svg className="ml-auto w-3.5 h-3.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
