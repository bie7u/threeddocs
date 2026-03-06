import { useState } from 'react';
import { Create3DElementDialog } from '../components/Create3DElement/Create3DElementDialog';
import { loadCustom3DElements, deleteCustom3DElement } from '../utils/custom3DElements';

const Settings = ({ onClose }) => {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingElement, setEditingElement] = useState(null);
  const [elements, setElements] = useState(() => loadCustom3DElements());

  const refreshElements = () => {
    setElements(loadCustom3DElements());
  };

  const handleDelete = (id) => {
    if (!window.confirm('Czy na pewno chcesz usunąć ten element?')) return;
    deleteCustom3DElement(id);
    refreshElements();
  };

  const handleEdit = (element) => {
    setEditingElement(element);
    setShowCreateDialog(true);
  };

  const handleCreate = () => {
    setEditingElement(null);
    setShowCreateDialog(true);
  };

  const handleSaved = () => {
    setShowCreateDialog(false);
    setEditingElement(null);
    refreshElements();
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
            onClick={handleCreate}
            className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-all cursor-pointer border border-gray-200 hover:border-blue-400 group"
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
          </div>
        </div>

        {/* Existing custom elements */}
        {elements.length > 0 && (
          <div className="mt-12">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Moje elementy 3D</h3>
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
                      {el.wireframe ? 'Z obrysem · ' : ''}{el.textureDataUrl ? 'Tekstura · ' : ''}
                      {new Date(el.createdAt).toLocaleDateString('pl-PL')}
                    </p>
                  </div>
                  <div className="flex flex-col gap-1">
                    <button
                      onClick={(e) => { e.stopPropagation(); handleEdit(el); }}
                      className="px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 transition"
                    >
                      Edytuj
                    </button>
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
      </div>

      {/* Create / Edit dialog */}
      {showCreateDialog && (
        <Create3DElementDialog
          existing={editingElement}
          onClose={() => { setShowCreateDialog(false); setEditingElement(null); }}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
};

export default Settings;
