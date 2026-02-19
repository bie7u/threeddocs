import { useState } from 'react';
import { useAppStore, type SavedProject } from '../../store';

interface ProjectListProps {
  onSelectProject: (project: SavedProject) => void;
  onCreateNew: () => void;
  onGoToEditorPanel?: () => void; // For main list to go to editor panel
  onBackToMainList?: () => void; // For editor panel to go back to main list
  isEditorPanel: boolean; // Indicates if this is the editor panel or main viewer list
}

export const ProjectList = ({ 
  onSelectProject, 
  onCreateNew, 
  onGoToEditorPanel,
  onBackToMainList,
  isEditorPanel 
}: ProjectListProps) => {
  const { getAllProjects, deleteProject } = useAppStore();
  const [projects, setProjects] = useState<SavedProject[]>(getAllProjects());
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  const handleDelete = (projectId: string) => {
    deleteProject(projectId);
    setProjects(getAllProjects());
    setShowDeleteConfirm(null);
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('pl-PL', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getPluralForm = (count: number) => {
    if (count === 1) return 'krok';
    const lastDigit = count % 10;
    const lastTwoDigits = count % 100;
    if (lastTwoDigits >= 10 && lastTwoDigits <= 21) return 'kroków';
    if (lastDigit >= 2 && lastDigit <= 4) return 'kroki';
    return 'kroków';
  };

  // Sort projects by last modified (newest first)
  const sortedProjects = [...projects].sort((a, b) => b.lastModified - a.lastModified);

  return (
    <div className="w-screen h-screen flex items-center justify-center bg-gradient-to-br from-gray-800 via-gray-900 to-black">
      <div className="w-full max-w-4xl mx-auto p-8">
        <div className="bg-white rounded-lg shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-800 p-6">
            {isEditorPanel && onBackToMainList && (
              <button
                onClick={onBackToMainList}
                className="mb-4 flex items-center gap-2 text-white hover:text-blue-100 transition"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                <span className="text-sm font-medium">Powrót do listy projektów</span>
              </button>
            )}
            <h1 className="text-3xl font-bold text-white mb-2">
              {isEditorPanel ? 'Panel Edytora' : '3D Instruction Builder'}
            </h1>
            <p className="text-blue-100">
              {isEditorPanel 
                ? 'Wybierz projekt do edycji' 
                : 'Wybierz model lub utwórz nowy projekt'}
            </p>
          </div>

          {/* Content */}
          <div className="p-6">
            {/* Create New Button */}
            <button
              onClick={onCreateNew}
              className="w-full mb-6 p-6 border-2 border-dashed border-blue-400 rounded-lg hover:border-blue-600 hover:bg-blue-50 transition group"
            >
              <div className="flex items-center justify-center gap-3 text-blue-600 group-hover:text-blue-800">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span className="text-lg font-semibold">Utwórz nowy projekt</span>
              </div>
            </button>

            {/* Projects List */}
            {sortedProjects.length > 0 ? (
              <div className="space-y-3">
                <h2 className="text-lg font-semibold text-gray-700 mb-3">Twoje projekty</h2>
                {sortedProjects.map((savedProject) => (
                  <div
                    key={savedProject.project.id}
                    className="group relative border border-gray-200 rounded-lg hover:border-blue-400 hover:shadow-md transition"
                  >
                    {showDeleteConfirm === savedProject.project.id ? (
                      <div className="p-4 bg-red-50 border-red-300 rounded-lg">
                        <p className="text-sm text-red-800 mb-3">
                          Czy na pewno chcesz usunąć projekt "{savedProject.project.name}"?
                        </p>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleDelete(savedProject.project.id)}
                            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm font-medium"
                          >
                            Usuń
                          </button>
                          <button
                            onClick={() => setShowDeleteConfirm(null)}
                            className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 text-sm font-medium"
                          >
                            Anuluj
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <button
                          onClick={() => onSelectProject(savedProject)}
                          className="w-full p-4 text-left"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h3 className="text-lg font-semibold text-gray-800 group-hover:text-blue-600 transition">
                                {savedProject.project.name}
                              </h3>
                              <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                                <span className="flex items-center gap-1">
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                  </svg>
                                  {savedProject.project.steps.length} {getPluralForm(savedProject.project.steps.length)}
                                </span>
                                <span className="flex items-center gap-1">
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                  {formatDate(savedProject.lastModified)}
                                </span>
                              </div>
                            </div>
                            <svg
                              className="w-6 h-6 text-gray-400 group-hover:text-blue-600 transition opacity-0 group-hover:opacity-100"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </div>
                        </button>
                        <button
                          onClick={() => setShowDeleteConfirm(savedProject.project.id)}
                          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition opacity-0 group-hover:opacity-100"
                          title="Usuń projekt"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className="text-lg">Nie masz jeszcze żadnych projektów</p>
                <p className="text-sm mt-2">Kliknij przycisk powyżej, aby utworzyć pierwszy projekt</p>
              </div>
            )}

            {/* Go to Editor Panel button - only show on main list, not in editor panel */}
            {!isEditorPanel && onGoToEditorPanel && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <button
                  onClick={onGoToEditorPanel}
                  className="w-full p-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg hover:from-green-600 hover:to-emerald-700 transition-all duration-200 shadow-lg flex items-center justify-center gap-3 font-semibold"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Przejdź do panelu edytora
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
