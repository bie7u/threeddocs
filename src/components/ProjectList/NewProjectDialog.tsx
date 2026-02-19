import { useState } from 'react';

interface NewProjectDialogProps {
  onConfirm: (projectName: string) => void;
  onCancel: () => void;
}

export const NewProjectDialog = ({ onConfirm, onCancel }: NewProjectDialogProps) => {
  const [projectName, setProjectName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (projectName.trim()) {
      onConfirm(projectName.trim());
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md mx-4">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Nowy projekt</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <label htmlFor="project-name" className="block text-sm font-medium text-gray-700 mb-2">
              Nazwa projektu
            </label>
            <input
              id="project-name"
              type="text"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              placeholder="np. Instrukcja montażu..."
              autoFocus
            />
          </div>
          <div className="flex gap-3 justify-end">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition font-medium"
            >
              Anuluj
            </button>
            <button
              type="submit"
              disabled={!projectName.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              Utwórz
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
