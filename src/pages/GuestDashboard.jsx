import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MainLayout } from '../components/Layout/MainLayout';
import { useAppStore } from '../store';

const GuestDashboard = () => {
  const navigate = useNavigate();
  const { createNewGuestProject, clearGuestMode } = useAppStore();

  const [ready, setReady] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    clearGuestMode();
    createNewGuestProject('Mój model 3D', 'builder')
      .then(() => setReady(true))
      .catch(() => setError(true));
  }, [clearGuestMode, createNewGuestProject]);

  const handleBackFromEditor = () => {
    clearGuestMode();
    navigate('/');
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Nie udało się uruchomić edytora. Spróbuj ponownie.</p>
          <button
            onClick={() => navigate('/')}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-500 hover:bg-blue-600 rounded-lg transition"
          >
            Wróć do strony głównej
          </button>
        </div>
      </div>
    );
  }

  if (!ready) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <MainLayout
      onBackToProjectList={handleBackFromEditor}
      useSampleProjectFallback={false}
    />
  );
};

export default GuestDashboard;
