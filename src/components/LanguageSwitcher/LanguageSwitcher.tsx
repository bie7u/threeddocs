import { useAppStore } from '../../store';

export const LanguageSwitcher = () => {
  const { language, setLanguage } = useAppStore();
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-slate-400 hidden sm:block">
        {language === 'pl' ? 'Język' : 'Language'}
      </span>
      <select
        value={language}
        onChange={(e) => setLanguage(e.target.value as 'pl' | 'en')}
        className="px-2 py-1.5 bg-slate-700/50 backdrop-blur-sm rounded-lg border border-slate-600/30 text-sm text-white hover:bg-slate-600/50 transition-all cursor-pointer focus:outline-none focus:ring-1 focus:ring-blue-400"
        aria-label={language === 'pl' ? 'Wybierz język' : 'Select language'}
      >
        <option value="pl">🇵🇱 PL</option>
        <option value="en">🇬🇧 EN</option>
      </select>
    </div>
  );
};
