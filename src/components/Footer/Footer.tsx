import { useState } from 'react';
import { SuggestionDialog } from './SuggestionDialog';

export const Footer = () => {
  const [showSuggestionDialog, setShowSuggestionDialog] = useState(false);

  return (
    <>
      <footer className="bg-white border-t border-gray-200 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <p className="text-sm text-gray-400">
            &copy; {new Date().getFullYear()} ThreeDocsy
          </p>
          <button
            onClick={() => setShowSuggestionDialog(true)}
            className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 rounded-lg transition duration-150"
          >
            Zgłoś sugestię
          </button>
        </div>
      </footer>

      {showSuggestionDialog && (
        <SuggestionDialog onClose={() => setShowSuggestionDialog(false)} />
      )}
    </>
  );
};
