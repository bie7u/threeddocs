import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MainLayout } from '../components/Layout/MainLayout';
import { useAppStore } from '../store';

const GuestDashboard = () => {
  const navigate = useNavigate();
  const { createNewGuestProject, clearGuestMode } = useAppStore();

  const [isReady, setIsReady] = useState(false);

  // On mount, clear any previous guest state, create a fresh builder project,
  // and go straight to the editor.
  useEffect(() => {
    let cancelled = false;
    const init = async () => {
      clearGuestMode();
      await createNewGuestProject('Mój model 3D', 'builder');
      if (!cancelled) setIsReady(true);
    };
    init();
    return () => { cancelled = true; };
  }, [clearGuestMode, createNewGuestProject]);

  const handleGoToLogin = () => {
    clearGuestMode();
    navigate('/login');
  };

  if (!isReady) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600 text-sm">Przygotowywanie edytora…</p>
        </div>
      </div>
    );
  }

  return (
    <MainLayout
      onBackToProjectList={handleGoToLogin}
      useSampleProjectFallback={false}
    />
  );
};

export default GuestDashboard;
