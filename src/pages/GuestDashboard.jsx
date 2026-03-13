import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MainLayout } from '../components/Layout/MainLayout';
import { NewProjectDialog } from '../components/ProjectList/NewProjectDialog';
import { useAppStore } from '../store';

const GuestDashboard = () => {
  const navigate = useNavigate();
  const { createNewGuestProject, clearGuestMode, guestShareToken, project } = useAppStore();

  const [showNewProjectDialog, setShowNewProjectDialog] = useState(false);
  const [showEditor, setShowEditor] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState('');
  const [showLinkCopied, setShowLinkCopied] = useState(false);

  // On mount, clear any previous guest/auth state so we start fresh
  useEffect(() => {
    clearGuestMode();
  }, [clearGuestMode]);

  const handleCreateProject = async (name, type, modelUrl) => {
    setIsCreating(true);
    setCreateError('');
    try {
      await createNewGuestProject(name, type, modelUrl);
      setShowNewProjectDialog(false);
      setShowEditor(true);
    } catch {
      setCreateError('Nie udało się utworzyć projektu. Spróbuj ponownie.');
    } finally {
      setIsCreating(false);
    }
  };

  const handleBackFromEditor = () => {
    setShowEditor(false);
  };

  const handleGoToLogin = () => {
    clearGuestMode();
    navigate('/');
  };

  const handleCopyLink = async () => {
    if (!guestShareToken) return;
    const url = `${window.location.origin}/view/${guestShareToken}`;
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      alert(`Skopiuj ten link: ${url}`);
      return;
    }
    setShowLinkCopied(true);
    setTimeout(() => setShowLinkCopied(false), 3000);
  };

  if (showEditor) {
    return (
      <MainLayout
        onBackToProjectList={handleBackFromEditor}
        useSampleProjectFallback={false}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Navigation Bar */}
      <nav className="bg-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center transform rotate-12">
                <svg
                  className="w-6 h-6 text-white transform -rotate-12"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                  />
                </svg>
              </div>
              <span className="ml-1 text-xl font-bold text-gray-900">3D Docs</span>
              <span className="px-2 py-0.5 text-xs font-medium text-yellow-700 bg-yellow-100 border border-yellow-200 rounded-full">
                Tryb gościa
              </span>
            </div>
            <button
              onClick={handleGoToLogin}
              className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 rounded-lg transition duration-150"
            >
              Zaloguj się
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Wypróbuj 3D Docs bez rejestracji
          </h1>
          <p className="text-xl text-gray-600 mb-2">
            Stwórz jeden model 3D i wygeneruj link do udostępnienia
          </p>
          <p className="text-sm text-gray-400 mb-8">
            Aby zapisać więcej modeli i korzystać ze wszystkich funkcji,{' '}
            <button onClick={handleGoToLogin} className="text-blue-500 hover:underline font-medium">
              zaloguj się
            </button>
            .
          </p>

          {project && guestShareToken ? (
            /* Model already created – show share link panel */
            <div className="max-w-lg mx-auto space-y-6">
              <div className="bg-white rounded-2xl shadow-lg border border-green-200 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div className="text-left">
                    <p className="font-bold text-gray-800">{project.name}</p>
                    <p className="text-xs text-gray-500">Model gotowy do udostępnienia</p>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-xl p-3 mb-4 flex items-center gap-2 border border-gray-200">
                  <span className="flex-1 text-xs text-gray-600 truncate font-mono">
                    {`${window.location.origin}/view/${guestShareToken}`}
                  </span>
                </div>

                {showLinkCopied && (
                  <div className="mb-3 flex items-center gap-2 text-green-600 text-sm font-medium justify-center">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Link skopiowany do schowka!
                  </div>
                )}

                <div className="flex gap-3">
                  <button
                    onClick={handleCopyLink}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-xl hover:from-purple-600 hover:to-pink-700 transition-all font-medium shadow-lg"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    Skopiuj link
                  </button>
                  <button
                    onClick={() => setShowEditor(true)}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl hover:from-blue-600 hover:to-indigo-700 transition-all font-medium shadow-lg"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Edytuj model
                  </button>
                </div>
              </div>

              <p className="text-xs text-gray-400">
                Pamiętaj, że link do modelu może zostać dezaktywowany, jeśli projekt gościa wygaśnie.{' '}
                <button onClick={handleGoToLogin} className="text-blue-500 hover:underline">
                  Zaloguj się
                </button>{' '}
                aby zachować model na stałe.
              </p>
            </div>
          ) : (
            /* No model yet – prompt to create */
            <div className="max-w-sm mx-auto">
              <div
                onClick={() => setShowNewProjectDialog(true)}
                className="bg-white p-8 rounded-2xl shadow-xl hover:shadow-2xl transition-all cursor-pointer border-2 border-dashed border-purple-300 hover:border-purple-500 group"
              >
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform shadow-lg">
                  <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-gray-800 mb-1">Stwórz model 3D</h3>
                <p className="text-sm text-gray-500">
                  Wgraj model GLTF/GLB lub zbuduj go z kształtów 3D i wygeneruj link do udostępnienia
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {showNewProjectDialog && (
        <NewProjectDialog
          onClose={() => { setShowNewProjectDialog(false); setCreateError(''); }}
          onCreateProject={handleCreateProject}
          isCreating={isCreating}
          createError={createError}
        />
      )}
    </div>
  );
};

export default GuestDashboard;
