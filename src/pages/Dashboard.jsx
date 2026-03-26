import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { MainLayout } from '../components/Layout/MainLayout';
import { NewProjectDialog } from '../components/ProjectList/NewProjectDialog';
import { MyModels } from '../components/MyModels/MyModels';
import Settings from './Settings';
import { useAppStore } from '../store';
import { getMe } from '../services/auth';
import { logout } from '../services/auth';
import { Footer } from '../components/Footer/Footer';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from '../components/LanguageSwitcher/LanguageSwitcher';

const Dashboard = () => {
  const { t } = useTranslation();
  const MAX_PROJECTS = 30;

  const navigate = useNavigate();
  const { createNewProject, loadProjects, projectsCount } = useAppStore();

  const [showNewProjectDialog, setShowNewProjectDialog] = useState(false);
  const [showEditor, setShowEditor] = useState(false);
  const [showMyModels, setShowMyModels] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState('');

  useEffect(() => {
    getMe()
      .then(() => {
        setAuthChecked(true);
        return loadProjects();
      })
      .catch(() => {
        navigate('/login');
      });
  }, [navigate, loadProjects]);

  const handleLogout = async () => {
    await logout().catch(() => {});
    navigate('/login');
  };

  const handleCreateProject = async (name, type, modelUrl) => {
    setIsCreating(true);
    setCreateError('');
    try {
      await createNewProject(name, type, modelUrl);
      setShowNewProjectDialog(false);
      setShowEditor(true);
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : t('dashboard.errorCreate'));
    } finally {
      setIsCreating(false);
    }
  };

  const handleBackToDashboard = () => {
    setShowEditor(false);
  };

  // When editor is open, render the full-screen editor
  if (!authChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="w-10 h-10 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (showEditor) {
    return (
      <MainLayout
        onBackToProjectList={handleBackToDashboard}
        useSampleProjectFallback={false}
      />
    );
  }

  // When My Models view is open
  if (showMyModels) {
    return (
      <MyModels
        onOpenEditor={() => {
          setShowMyModels(false);
          setShowEditor(true);
        }}
        onClose={() => setShowMyModels(false)}
      />
    );
  }

  // When Settings view is open
  if (showSettings) {
    return (
      <Settings onClose={() => setShowSettings(false)} />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex flex-col">
      {/* Navigation Bar */}
      <nav className="bg-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <img src="/logo.svg" alt="ThreeDocsy logo" className="h-9 w-auto" />
              <span className="text-xl font-bold text-gray-900">ThreeDocsy</span>
            </div>
            <div className="flex items-center gap-3">
              <LanguageSwitcher variant="light" />
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 rounded-lg transition duration-150"
              >
                {t('dashboard.logout')}
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="w-full flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            {t('dashboard.welcome')}
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            {t('dashboard.ready')}
          </p>
          
          {/* Dashboard Tiles */}
          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Moje modele (My models) */}
            <div
              onClick={() => setShowMyModels(true)}
              className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow cursor-pointer border border-gray-200 hover:border-blue-400 group"
            >
              <div className="text-blue-500 mb-4 group-hover:scale-110 transition-transform">
                <svg
                  className="w-12 h-12 mx-auto"
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
              <h3 className="text-lg font-semibold text-gray-800 mb-2">{t('dashboard.myModels')}</h3>
              <p className="text-sm text-gray-600">{t('dashboard.myModelsDesc')}</p>
            </div>

            {/* Dodaj nowy model (Add new model) */}
            <div
              onClick={projectsCount < MAX_PROJECTS ? () => setShowNewProjectDialog(true) : undefined}
              className={`bg-white p-6 rounded-xl shadow-lg transition-all border border-gray-200 group ${projectsCount < MAX_PROJECTS ? 'hover:shadow-xl cursor-pointer hover:border-purple-400' : 'opacity-60 cursor-not-allowed'}`}
            >
              <div className="text-purple-500 mb-4 group-hover:scale-110 transition-transform">
                <svg
                  className="w-12 h-12 mx-auto"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">{t('dashboard.addModel')}</h3>
              <p className="text-sm text-gray-600">{t('dashboard.addModelDesc')}</p>
              <p className="text-xs text-gray-400 mt-1">
                {t('dashboard.projects', { count: projectsCount, max: MAX_PROJECTS })}
                {projectsCount >= MAX_PROJECTS && <span className="text-red-500 ml-1">{t('common.limitReached')}</span>}
              </p>
            </div>

            {/* Ustawienia (Settings) */}
            <div
              onClick={() => setShowSettings(true)}
              className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow cursor-pointer border border-gray-200 hover:border-green-400 group"
            >
              <div className="text-green-500 mb-4">
                <svg
                  className="w-12 h-12 mx-auto"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">{t('dashboard.settings')}</h3>
              <p className="text-sm text-gray-600">{t('dashboard.settingsDesc')}</p>
            </div>
          </div>
        </div>
      </div>

      {/* New Project Dialog */}
      {showNewProjectDialog && (
        <NewProjectDialog
          onClose={() => { setShowNewProjectDialog(false); setCreateError(''); }}
          onCreateProject={handleCreateProject}
          isCreating={isCreating}
          createError={createError}
        />
      )}

      <Footer />
    </div>
  );
};

export default Dashboard;
