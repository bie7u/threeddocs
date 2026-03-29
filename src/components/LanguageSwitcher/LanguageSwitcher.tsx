import { useAppStore } from '../../store';
import type { Language } from '../../i18n';

interface Props {
  className?: string;
}

const LanguageSwitcher = ({ className = '' }: Props) => {
  const language = useAppStore(s => s.language);
  const setLanguage = useAppStore(s => s.setLanguage);

  return (
    <select
      value={language}
      onChange={e => setLanguage(e.target.value as Language)}
      className={`text-sm border border-gray-300 rounded-lg px-2 py-1.5 bg-white text-gray-700 hover:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer ${className}`}
      aria-label="Language"
    >
      <option value="pl">🇵🇱 Polski</option>
      <option value="en">🇬🇧 English</option>
    </select>
  );
};

export default LanguageSwitcher;
