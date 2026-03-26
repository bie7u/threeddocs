import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

const languages = [
  { code: 'pl', label: 'Polski', flag: '🇵🇱' },
  { code: 'en', label: 'English', flag: '🇬🇧' },
];

interface LanguageSwitcherProps {
  variant?: 'dark' | 'light';
}

export default function LanguageSwitcher({ variant = 'dark' }: LanguageSwitcherProps) {
  const { i18n } = useTranslation();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const current = languages.find(l => l.code === i18n.language) ?? languages[0];

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const isDark = variant === 'dark';

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(o => !o)}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors border ${
          isDark
            ? 'bg-white/10 hover:bg-white/20 text-white border-white/20'
            : 'bg-gray-100 hover:bg-gray-200 text-gray-700 border-gray-200'
        }`}
        aria-label="Select language"
      >
        <span>{current.flag}</span>
        <span>{current.label}</span>
        <svg className={`w-3 h-3 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <div className={`absolute right-0 mt-1 w-36 border rounded-lg shadow-xl z-50 overflow-hidden ${
          isDark
            ? 'bg-gray-900 border-white/20'
            : 'bg-white border-gray-200'
        }`}>
          {languages.map(lang => (
            <button
              key={lang.code}
              onClick={() => { i18n.changeLanguage(lang.code); setOpen(false); }}
              className={`w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-white/10 transition-colors ${
                i18n.language === lang.code
                  ? 'text-blue-400 font-semibold'
                  : isDark ? 'text-white' : 'text-gray-800'
              }`}
            >
              <span>{lang.flag}</span>
              <span>{lang.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
