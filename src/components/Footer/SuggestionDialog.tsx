import { useState } from 'react';
import { postSuggestion } from '../../services/suggestions';
import { useTranslation } from 'react-i18next';

interface SuggestionDialogProps {
  onClose: () => void;
}

export const SuggestionDialog = ({ onClose }: SuggestionDialogProps) => {
  const { t } = useTranslation();
  const [content, setContent] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    setIsSending(true);
    setError('');
    try {
      await postSuggestion(content.trim());
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('suggestionDialog.errorDefault'));
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 rounded-t-2xl px-6 py-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">{t('suggestionDialog.title')}</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors"
            aria-label={t('suggestionDialog.closeAriaLabel')}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          {sent ? (
            <div className="text-center py-6">
              <div className="text-green-500 mb-3">
                <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-gray-800 font-medium text-lg">{t('suggestionDialog.successTitle')}</p>
              <p className="text-gray-500 text-sm mt-1">{t('suggestionDialog.successDesc')}</p>
              <button
                onClick={onClose}
                className="mt-6 px-6 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 rounded-lg transition duration-150"
              >
                {t('suggestionDialog.closeBtn')}
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <p className="text-gray-600 text-sm mb-4">
                {t('suggestionDialog.description')}
              </p>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder={t('suggestionDialog.placeholder')}
                rows={5}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent resize-none"
                disabled={isSending}
              />
              {error && (
                <p className="mt-2 text-sm text-red-600">{error}</p>
              )}
              <div className="mt-4 flex justify-end gap-3 border-t border-gray-100 pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isSending}
                  className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 transition-colors"
                >
                  {t('suggestionDialog.cancelBtn')}
                </button>
                <button
                  type="submit"
                  disabled={isSending || !content.trim()}
                  className="px-5 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 rounded-lg transition duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSending ? t('suggestionDialog.submitLoading') : t('suggestionDialog.submitBtn')}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
