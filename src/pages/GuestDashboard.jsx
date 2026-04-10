import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MainLayout } from '../components/Layout/MainLayout';
import { useAppStore } from '../store';
import { useLanguage } from '../i18n/LanguageContext';
import { sampleProject, sampleNodePositions } from '../utils/sampleData';

const GuestDashboard = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { createNewGuestProject, clearGuestMode, setProject } = useAppStore();

  const [showEditor, setShowEditor] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);

  // On mount, clear any previous guest/auth state and load the demo scenario
  useEffect(() => {
    clearGuestMode();
    createNewGuestProject(t('newProject.defaultNameBuilder'), 'builder')
      .then(() => {
        // Load the demo scenario so guests see the full feature walkthrough
        setProject(sampleProject, sampleNodePositions);
        setShowEditor(true);
      })
      .finally(() => {
        setIsInitializing(false);
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clearGuestMode, createNewGuestProject, setProject]);

  const handleBackFromEditor = () => {
    clearGuestMode();
    navigate('/');
  };

  const handleGoToLogin = () => {
    clearGuestMode();
    navigate('/login');
  };

  if (isInitializing) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600 font-medium">{t('guest.preparingEditor')}</p>
        </div>
      </div>
    );
  }

  if (!showEditor) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center px-4">
          <p className="text-red-600 font-medium mb-4">{t('guest.editorFailed')}</p>
          <button
            onClick={() => navigate('/')}
            className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg"
          >
            {t('guest.backToHome')}
          </button>
        </div>
      </div>
    );
  }
  return (
    <MainLayout
      onBackToProjectList={handleBackFromEditor}
      useSampleProjectFallback={false}
      onGoToLogin={handleGoToLogin}
    />
  );
};

export default GuestDashboard;
