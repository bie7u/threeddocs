import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MainLayout } from '../components/Layout/MainLayout';
import { useAppStore } from '../store';

const GuestDashboard = () => {
  const navigate = useNavigate();
  const { createNewGuestProject, clearGuestMode } = useAppStore();

  const [showEditor, setShowEditor] = useState(false);
  const [initError, setInitError] = useState(false);

  // On mount, clear any previous guest state, then immediately create a default
  // builder project and open the editor — skipping the welcome screen entirely.
  useEffect(() => {
    clearGuestMode();
    let cancelled = false;
    createNewGuestProject('Mój model 3D', 'builder')
      .then(() => { if (!cancelled) setShowEditor(true); })
      .catch(() => { if (!cancelled) setInitError(true); });
    return () => { cancelled = true; };
  }, [clearGuestMode, createNewGuestProject]);

  const handleBackFromEditor = () => {
    setShowEditor(false);
    clearGuestMode();
    navigate('/');
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

  // Loading/error state while the guest project is being created
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
      <div className="text-center">
        {initError ? (
          <>
            <p className="text-slate-600 font-medium mb-2">Nie udało się uruchomić edytora.</p>
            <button
              onClick={() => { setInitError(false); createNewGuestProject('Mój model 3D', 'builder').then(() => setShowEditor(true)).catch(() => setInitError(true)); }}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-500 rounded-lg hover:bg-blue-600 transition-colors mr-2"
            >
              Spróbuj ponownie
            </button>
            <button onClick={handleGoToLogin} className="px-4 py-2 text-sm font-medium text-blue-500 hover:underline">
              Zaloguj się
            </button>
          </>
        ) : (
          <>
            <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-slate-600 font-medium">Przygotowywanie edytora…</p>
            <p className="text-sm text-slate-400 mt-1">
              Możesz też{' '}
              <button onClick={handleGoToLogin} className="text-blue-500 hover:underline font-medium">
                zalogować się
              </button>
            </p>
          </>
        )}
      </div>
    </div>
  );
};

export default GuestDashboard;
