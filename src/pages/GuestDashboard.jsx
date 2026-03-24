import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MainLayout } from '../components/Layout/MainLayout';
import { NewProjectDialog } from '../components/ProjectList/NewProjectDialog';
import { useAppStore } from '../store';

const GuestDashboard = () => {
  const navigate = useNavigate();
  const { createNewGuestProject, clearGuestMode, project } = useAppStore();

  const [showNewProjectDialog, setShowNewProjectDialog] = useState(true);
  const [showEditor, setShowEditor] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState('');

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
    navigate('/login');
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
            <div className="flex items-center gap-2">
              <img src="/logo.svg" alt="ThreeDocsy logo" className="h-9 w-auto" />
              <span className="text-xl font-bold text-gray-900">ThreeDocsy</span>
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
            Wypróbuj ThreeDocsy bez rejestracji
          </h1>
          <p className="text-xl text-gray-600 mb-2">
            Stwórz model 3D bez rejestracji
          </p>
          <p className="text-sm text-gray-400 mb-8">
            Model będzie przechowywany lokalnie w tej przeglądarce. Aby zapisywać modele i udostępniać je innym,{' '}
            <button onClick={handleGoToLogin} className="text-blue-500 hover:underline font-medium">
              zaloguj się
            </button>
            .
          </p>

          {project ? (
            /* Model already created – show panel */
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
                    <p className="text-xs text-gray-500">Model gotowy do edycji</p>
                  </div>
                </div>

                <button
                  onClick={() => setShowEditor(true)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl hover:from-blue-600 hover:to-indigo-700 transition-all font-medium shadow-lg"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Edytuj model
                </button>
              </div>

              <p className="text-xs text-gray-400">
                Twój model jest zapisany lokalnie w tej przeglądarce.{' '}
                <button onClick={handleGoToLogin} className="text-blue-500 hover:underline">
                  Zaloguj się
                </button>{' '}
                aby móc zarządzać swoimi modelami z dowolnego urządzenia i udostępniać je innym.
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
                  Wgraj model GLTF/GLB lub zbuduj go z kształtów 3D
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
