import { useState, useEffect, useRef } from 'react';
import { fetchElements } from '../../services/elements';
import { fetchModels, fetchPublicModels } from '../../services/models';
import type { Custom3DElement, ShapeType, UploadedModel3D } from '../../types';
import { ModelPreviewModal } from '../ModelPreviewModal/ModelPreviewModal';

type Tab = 'standard' | 'elements' | 'models';

interface StandardShape {
  type: ShapeType;
  label: string;
  emoji: string;
  description: string;
}

const STANDARD_SHAPES: StandardShape[] = [
  { type: 'cube', label: 'Sześcian', emoji: '📦', description: 'Prosty sześcian 3D' },
  { type: 'sphere', label: 'Kula', emoji: '🔵', description: 'Gładka sfera' },
  { type: 'cylinder', label: 'Walec', emoji: '🥫', description: 'Cylinder/walec' },
  { type: 'cone', label: 'Stożek', emoji: '🔺', description: 'Stożek 3D' },
  { type: 'engravedBlock', label: 'Klocek z tekstem', emoji: '🔲', description: 'Podpisany klocek' },
];

interface Props {
  currentShapeType: ShapeType;
  currentElementId?: string;
  currentModelId?: string;
  isGuestMode?: boolean;
  onSelect: (type: ShapeType, elementId?: string, modelId?: string) => void;
  onClose: () => void;
}

export const ShapeTypePicker = ({
  currentShapeType,
  currentElementId,
  currentModelId,
  isGuestMode,
  onSelect,
  onClose,
}: Props) => {
  const initialTab: Tab =
    currentShapeType === 'custom3dElement' ? 'elements' :
    currentShapeType === 'uploadedModel' ? 'models' : 'standard';

  const [activeTab, setActiveTab] = useState<Tab>(initialTab);
  const [elements, setElements] = useState<Custom3DElement[]>([]);
  const [models, setModels] = useState<UploadedModel3D[]>([]);
  const [elementSearch, setElementSearch] = useState('');
  const [modelSearch, setModelSearch] = useState('');
  const [elementsLoading, setElementsLoading] = useState(false);
  const [modelsLoading, setModelsLoading] = useState(false);
  const [previewElement, setPreviewElement] = useState<Custom3DElement | null>(null);
  const [previewModel, setPreviewModel] = useState<UploadedModel3D | null>(null);

  const elementSearchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const modelSearchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const elementsLoadedRef = useRef(false);
  const modelsLoadedRef = useRef(false);

  // Load elements when switching to the elements tab
  useEffect(() => {
    if (activeTab !== 'elements' || isGuestMode || elementsLoadedRef.current) return;
    elementsLoadedRef.current = true;
    setElementsLoading(true);
    fetchElements()
      .then(setElements)
      .catch(() => setElements([]))
      .finally(() => setElementsLoading(false));
  }, [activeTab, isGuestMode]);

  // Load models when switching to the models tab
  useEffect(() => {
    if (activeTab !== 'models' || modelsLoadedRef.current) return;
    modelsLoadedRef.current = true;
    setModelsLoading(true);
    (isGuestMode ? fetchPublicModels() : fetchModels())
      .then(setModels)
      .catch(() => setModels([]))
      .finally(() => setModelsLoading(false));
  }, [activeTab, isGuestMode]);

  const handleElementSearch = (value: string) => {
    setElementSearch(value);
    if (elementSearchTimer.current) clearTimeout(elementSearchTimer.current);
    elementSearchTimer.current = setTimeout(() => {
      setElementsLoading(true);
      fetchElements(value || undefined)
        .then(setElements)
        .catch(() => setElements([]))
        .finally(() => setElementsLoading(false));
    }, 300);
  };

  const handleModelSearch = (value: string) => {
    setModelSearch(value);
    if (modelSearchTimer.current) clearTimeout(modelSearchTimer.current);
    modelSearchTimer.current = setTimeout(() => {
      setModelsLoading(true);
      fetchModels(value || undefined)
        .then(setModels)
        .catch(() => setModels([]))
        .finally(() => setModelsLoading(false));
    }, 300);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  useEffect(() => {
    return () => {
      if (elementSearchTimer.current) clearTimeout(elementSearchTimer.current);
      if (modelSearchTimer.current) clearTimeout(modelSearchTimer.current);
    };
  }, []);

  const handleBackdrop = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose();
  };

  const handleSelect = (type: ShapeType, elementId?: string, modelId?: string) => {
    onSelect(type, elementId, modelId);
    onClose();
  };

  const tabLabels: Record<Tab, string> = {
    standard: 'Standardowe modele',
    elements: 'Elementy 3D',
    models: 'Wgrane modele 3D',
  };

  return (
    <>
      <div
        className="fixed inset-0 z-40 flex items-center justify-center bg-black/50"
        onClick={handleBackdrop}
      >
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4 overflow-hidden flex flex-col max-h-[80vh]">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 bg-gradient-to-r from-blue-500 to-indigo-600 flex-shrink-0">
            <h2 className="text-white font-semibold text-lg">Wybierz typ kształtu</h2>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white transition-colors"
              aria-label="Zamknij"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-slate-200 bg-slate-50 flex-shrink-0">
            {(['standard', 'elements', 'models'] as Tab[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 px-3 py-3 text-xs sm:text-sm font-medium transition-colors ${
                  activeTab === tab
                    ? 'text-blue-600 border-b-2 border-blue-600 bg-white'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {tabLabels[tab]}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4">
            {/* ── Standard shapes ─────────────────────────────────── */}
            {activeTab === 'standard' && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {STANDARD_SHAPES.map((shape) => (
                  <button
                    key={shape.type}
                    onClick={() => handleSelect(shape.type)}
                    className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all hover:shadow-md ${
                      currentShapeType === shape.type
                        ? 'border-blue-500 bg-blue-50 shadow-sm'
                        : 'border-slate-200 bg-white hover:border-blue-300'
                    }`}
                  >
                    <span className="text-3xl">{shape.emoji}</span>
                    <span className="text-sm font-medium text-slate-700">{shape.label}</span>
                    <span className="text-xs text-slate-400 text-center">{shape.description}</span>
                  </button>
                ))}
              </div>
            )}

            {/* ── Custom 3D Elements ───────────────────────────────── */}
            {activeTab === 'elements' && (
              <div className="space-y-3">
                <div className="relative">
                  <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input
                    type="text"
                    value={elementSearch}
                    onChange={(e) => handleElementSearch(e.target.value)}
                    placeholder="Szukaj elementów 3D..."
                    className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {isGuestMode ? (
                  <div className="text-center py-8 text-slate-400 text-sm">
                    Elementy 3D niedostępne w trybie gościa
                  </div>
                ) : elementsLoading ? (
                  <div className="text-center py-8 text-slate-400 text-sm">Ładowanie...</div>
                ) : elements.length === 0 ? (
                  <div className="text-center py-8 text-slate-400 text-sm">
                    {elementSearch ? 'Brak wyników wyszukiwania' : 'Brak elementów 3D. Utwórz je w Ustawienia › Stwórz element 3D.'}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {elements.map((el) => (
                      <div
                        key={el.id}
                        className={`flex items-center justify-between p-3 rounded-lg border-2 transition-all ${
                          currentElementId === el.id
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-slate-200 bg-white hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                            style={{ backgroundColor: el.color }}
                          >
                            {el.text.slice(0, 2)}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-slate-700 truncate">{el.name}</p>
                            {el.description && (
                              <p className="text-xs text-slate-400 truncate">{el.description}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                          <button
                            onClick={() => setPreviewElement(el)}
                            className="px-2.5 py-1.5 text-xs text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                            title="Podgląd"
                          >
                            👁 Podgląd
                          </button>
                          <button
                            onClick={() => handleSelect('custom3dElement', el.id)}
                            className="px-2.5 py-1.5 text-xs text-white bg-blue-500 rounded-lg hover:bg-blue-600 transition-colors"
                          >
                            Wybierz
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ── Uploaded 3D Models ───────────────────────────────── */}
            {activeTab === 'models' && (
              <div className="space-y-3">
                {!isGuestMode && (
                  <div className="relative">
                    <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <input
                      type="text"
                      value={modelSearch}
                      onChange={(e) => handleModelSearch(e.target.value)}
                      placeholder="Szukaj wgranych modeli..."
                      className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                )}

                {modelsLoading ? (
                  <div className="text-center py-8 text-slate-400 text-sm">Ładowanie...</div>
                ) : models.length === 0 ? (
                  <div className="text-center py-8 text-slate-400 text-sm">
                    {isGuestMode ? 'Brak dostępnych modeli systemowych.' : modelSearch ? 'Brak wyników wyszukiwania' : 'Brak wgranych modeli 3D. Dodaj je w Ustawienia › Wgraj element 3D.'}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {models.map((m) => (
                      <div
                        key={m.id}
                        className={`flex items-center justify-between p-3 rounded-lg border-2 transition-all ${
                          currentModelId === m.id
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-slate-200 bg-white hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
                            <span className="text-lg">📤</span>
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <p className="text-sm font-medium text-slate-700 truncate">{m.name}</p>
                              {m.systemModel && (
                                <span className="flex-shrink-0 inline-flex items-center gap-0.5 px-1.5 py-0.5 text-xs font-medium bg-blue-100 text-blue-700 rounded" aria-label="Model systemowy">
                                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                                    <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                                  </svg>
                                  Systemowy
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-slate-400 truncate">{m.modelFileName}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                          <button
                            onClick={() => setPreviewModel(m)}
                            className="px-2.5 py-1.5 text-xs text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                            title="Podgląd"
                          >
                            👁 Podgląd
                          </button>
                          <button
                            onClick={() => handleSelect('uploadedModel', undefined, m.id)}
                            className="px-2.5 py-1.5 text-xs text-white bg-blue-500 rounded-lg hover:bg-blue-600 transition-colors"
                          >
                            Wybierz
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Preview modals – rendered outside the picker overlay */}
      {previewElement && (
        <ModelPreviewModal element={previewElement} onClose={() => setPreviewElement(null)} />
      )}
      {previewModel && (
        <ModelPreviewModal model={previewModel} onClose={() => setPreviewModel(null)} />
      )}
    </>
  );
};
