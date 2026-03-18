import { useState, useEffect } from 'react';
import { Create3DElementDialog } from '../components/Create3DElement/Create3DElementDialog';
import { UploadModelDialog } from '../components/UploadModelDialog/UploadModelDialog';
import { loadCustom3DElements, deleteCustom3DElement } from '../utils/custom3DElements';
import { loadUploadedModels, deleteUploadedModel } from '../utils/uploadedModels';
import { getMe, changePassword } from '../services/auth';

// ─── Account Modal ────────────────────────────────────────────────────────────

const AccountModal = ({ onClose }) => {
  const [user, setUser] = useState(null);
  const [userError, setUserError] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    getMe()
      .then(setUser)
      .catch(() => setUserError('Nie udało się załadować danych konta.'));
  }, []);

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setSaveError('');
    setSaveSuccess(false);
    if (newPassword !== confirmPassword) {
      setSaveError('Nowe hasła nie są zgodne.');
      return;
    }
    if (newPassword.length < 8) {
      setSaveError('Nowe hasło musi mieć co najmniej 8 znaków.');
      return;
    }
    setSaving(true);
    try {
      await changePassword(currentPassword, newPassword);
      setSaveSuccess(true);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setSaveError(err.message ?? 'Zmiana hasła nie powiodła się.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <h2 className="text-lg font-bold text-gray-900">Moje konto</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="px-6 py-5 space-y-6">
          {/* Account info */}
          <div>
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Informacje o koncie</h3>
            {userError ? (
              <p className="text-sm text-red-500">{userError}</p>
            ) : !user ? (
              <p className="text-sm text-gray-400">Ładowanie…</p>
            ) : (
              <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                {user.name && (
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-medium text-gray-400 w-14 flex-shrink-0">Imię</span>
                    <span className="text-sm font-medium text-gray-800">{user.name}</span>
                  </div>
                )}
                <div className="flex items-center gap-3">
                  <span className="text-xs font-medium text-gray-400 w-14 flex-shrink-0">Email</span>
                  <span className="text-sm font-medium text-gray-800 break-all">{user.email}</span>
                </div>
              </div>
            )}
          </div>

          {/* Change password */}
          <div>
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Zmiana hasła</h3>
            <form onSubmit={handleChangePassword} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Aktualne hasło</label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent"
                  placeholder="••••••••"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Nowe hasło</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent"
                  placeholder="min. 8 znaków"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Powtórz nowe hasło</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent"
                  placeholder="••••••••"
                />
              </div>

              {saveError && (
                <p className="text-xs text-red-500 bg-red-50 px-3 py-2 rounded-lg">{saveError}</p>
              )}
              {saveSuccess && (
                <p className="text-xs text-green-600 bg-green-50 px-3 py-2 rounded-lg">Hasło zostało zmienione.</p>
              )}

              <button
                type="submit"
                disabled={saving}
                className="w-full py-2.5 px-4 bg-gradient-to-r from-purple-500 to-indigo-600 text-white text-sm font-medium rounded-lg hover:from-purple-600 hover:to-indigo-700 transition-all disabled:opacity-60 disabled:cursor-not-allowed shadow-md shadow-purple-500/25"
              >
                {saving ? 'Zapisywanie…' : 'Zmień hasło'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

const Settings = ({ onClose }) => {
  const MAX_ELEMENTS = 20;
  const MAX_MODELS = 10;

  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [elements, setElements] = useState([]);

  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [uploadedModels, setUploadedModels] = useState([]);

  const [showAccountModal, setShowAccountModal] = useState(false);

  const refreshElements = () => {
    loadCustom3DElements().then(setElements).catch(() => setElements([]));
  };

  const refreshModels = () => {
    loadUploadedModels().then(setUploadedModels).catch(() => setUploadedModels([]));
  };

  useEffect(() => {
    refreshElements();
    refreshModels();
  }, []);

  const handleDelete = (id) => {
    if (!window.confirm('Czy na pewno chcesz usunąć ten element?')) return;
    deleteCustom3DElement(id)
      .then(refreshElements)
      .catch((err) => alert(err.message ?? 'Nie udało się usunąć elementu.'));
  };

  const handleCreate = () => {
    setShowCreateDialog(true);
  };

  const handleSaved = () => {
    setShowCreateDialog(false);
    refreshElements();
  };

  const handleUploadModel = () => {
    setShowUploadDialog(true);
  };

  const handleDeleteModel = (id) => {
    if (!window.confirm('Czy na pewno chcesz usunąć ten model?')) return;
    deleteUploadedModel(id)
      .then(refreshModels)
      .catch((err) => alert(err.message ?? 'Nie udało się usunąć modelu.'));
  };

  const handleModelSaved = () => {
    setShowUploadDialog(false);
    refreshModels();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Navigation Bar */}
      <nav className="bg-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <button
                onClick={onClose}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
                title="Powrót do pulpitu"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                <span className="text-sm font-medium">Pulpit</span>
              </button>
              <span className="text-gray-300">|</span>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <h1 className="text-xl font-bold text-gray-900">Ustawienia</h1>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Ustawienia</h2>
          <p className="text-gray-600">Konfiguruj swoje preferencje i zasoby 3D</p>
        </div>

        {/* Settings tiles */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Create 3D Element */}
          <div
            onClick={elements.length < MAX_ELEMENTS ? handleCreate : undefined}
            className={`bg-white p-6 rounded-xl shadow-lg transition-all border border-gray-200 group ${elements.length < MAX_ELEMENTS ? 'hover:shadow-xl cursor-pointer hover:border-blue-400' : 'opacity-60 cursor-not-allowed'}`}
          >
            <div className="text-blue-500 mb-4 group-hover:scale-110 transition-transform">
              <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-1">Stwórz element 3D</h3>
            <p className="text-sm text-gray-600">
              Utwórz własny kształt 3D z tekstu (maks. 5 znaków)
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Limit: {elements.length}/{MAX_ELEMENTS} elementów
              {elements.length >= MAX_ELEMENTS && <span className="text-red-500 ml-1">— osiągnięto limit</span>}
            </p>
          </div>

          {/* Upload 3D Model */}
          <div
            onClick={uploadedModels.length < MAX_MODELS ? handleUploadModel : undefined}
            className={`bg-white p-6 rounded-xl shadow-lg transition-all border border-gray-200 group ${uploadedModels.length < MAX_MODELS ? 'hover:shadow-xl cursor-pointer hover:border-indigo-400' : 'opacity-60 cursor-not-allowed'}`}
          >
            <div className="text-indigo-500 mb-4 group-hover:scale-110 transition-transform">
              <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-1">Wgraj element 3D</h3>
            <p className="text-sm text-gray-600">
              Wgraj model 3D (.gltf / .glb) i nadaj mu nazwę oraz skalę
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Limit: {uploadedModels.length}/{MAX_MODELS} modeli
              {uploadedModels.length >= MAX_MODELS && <span className="text-red-500 ml-1">— osiągnięto limit</span>}
            </p>
          </div>

          {/* My Account */}
          <div
            onClick={() => setShowAccountModal(true)}
            className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-all cursor-pointer border border-gray-200 hover:border-purple-400 group"
          >
            <div className="text-purple-500 mb-4 group-hover:scale-110 transition-transform">
              <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-1">Moje konto</h3>
            <p className="text-sm text-gray-600">
              Informacje o koncie i zmiana hasła
            </p>
          </div>
        </div>

        {/* Existing custom 3D text elements */}
        {elements.length > 0 && (
          <div className="mt-12">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Moje elementy 3D ({elements.length}/{MAX_ELEMENTS})</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {elements.map((el) => (
                <div
                  key={el.id}
                  className="bg-white rounded-xl shadow border border-gray-200 p-4 flex items-center gap-4"
                >
                  {/* Color preview */}
                  <div
                    className="w-12 h-12 rounded-lg flex-shrink-0 flex items-center justify-center font-bold text-white text-sm shadow"
                    style={{ backgroundColor: el.color }}
                  >
                    {el.text}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-800 truncate">{el.name}</p>
                    <p className="text-xs text-gray-500">
                      {el.textureDataUrl ? 'Tekstura · ' : ''}
                      {new Date(el.createdAt).toLocaleDateString('pl-PL')}
                    </p>
                  </div>
                  <div className="flex flex-col gap-1">
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDelete(el.id); }}
                      className="px-3 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600 transition"
                    >
                      Usuń
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Uploaded 3D models */}
        {uploadedModels.length > 0 && (
          <div className="mt-12">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Wgrane modele 3D ({uploadedModels.length}/{MAX_MODELS})</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {uploadedModels.map((model) => (
                <div
                  key={model.id}
                  className="bg-white rounded-xl shadow border border-gray-200 p-4 flex items-center gap-4"
                >
                  {/* Icon */}
                  <div className="w-12 h-12 rounded-lg flex-shrink-0 flex items-center justify-center bg-indigo-100 text-indigo-600">
                    <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-800 truncate">{model.name}</p>
                    <p className="text-xs text-gray-500">
                      Skala: {model.modelScale} · {model.modelFileName} · {new Date(model.createdAt).toLocaleDateString('pl-PL')}
                    </p>
                  </div>
                  <div className="flex flex-col gap-1">
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDeleteModel(model.id); }}
                      className="px-3 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600 transition"
                    >
                      Usuń
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Create 3D text element dialog */}
      {showCreateDialog && (
        <Create3DElementDialog
          onClose={() => { setShowCreateDialog(false); }}
          onSaved={handleSaved}
        />
      )}

      {/* Upload 3D model dialog */}
      {showUploadDialog && (
        <UploadModelDialog
          onClose={() => { setShowUploadDialog(false); }}
          onSaved={handleModelSaved}
        />
      )}

      {/* My Account modal */}
      {showAccountModal && (
        <AccountModal onClose={() => setShowAccountModal(false)} />
      )}
    </div>
  );
};

export default Settings;
