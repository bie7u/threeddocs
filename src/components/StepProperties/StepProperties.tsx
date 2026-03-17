import { useEffect, useState, useRef } from 'react';
import { useAppStore } from '../../store';
import type { InstructionStep, ShapeType, EngravedBlockParams, UploadedModel3D } from '../../types';
import { RichTextEditor } from '../RichTextEditor';
import { loadCustom3DElements } from '../../utils/custom3DElements';
import { loadUploadedModels } from '../../utils/uploadedModels';
import type { Custom3DElement } from '../../types';

export const StepProperties = () => {
  const { project, selectedStepId, updateStep, deleteStep, addStep } = useAppStore();
  
  const selectedStep = project?.steps.find((step) => step.id === selectedStepId);
  
  const blobUrlRef = useRef<string | null>(null);
  const uploadedFileNameRef = useRef<string | null>(null);
  
  const [custom3DElements, setCustom3DElements] = useState<Custom3DElement[]>([]);
  const [uploadedModels, setUploadedModels] = useState<UploadedModel3D[]>([]);

  useEffect(() => {
    loadCustom3DElements().then(setCustom3DElements).catch(() => setCustom3DElements([]));
    loadUploadedModels().then(setUploadedModels).catch(() => setUploadedModels([]));
  }, []);
  
  const [formData, setFormData] = useState<Partial<InstructionStep>>({
    title: '',
    description: '',
    highlightColor: '#4299e1',
    shapeType: 'cube',
    customModelUrl: '',
    modelScale: 1,
    modelPositionY: 0,
    custom3dElementId: undefined,
    uploadedModelId: undefined,
    inlineCustom3DElement: undefined,
    inlineUploadedModel: undefined,
    engravedBlockParams: {
      text: 'DB',
      font: 'helvetiker',
      depth: 0.08,
      padding: 0.1,
      face: 'front',
    },
  });

  useEffect(() => {
    return () => {
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current);
        blobUrlRef.current = null;
        uploadedFileNameRef.current = null;
      }
    };
  }, [selectedStepId]);

  useEffect(() => {
    if (selectedStep) {
      setFormData({
        title: selectedStep.title,
        description: selectedStep.description,
        highlightColor: selectedStep.highlightColor || '#4299e1',
        shapeType: selectedStep.shapeType || 'cube',
        customModelUrl: selectedStep.customModelUrl || '',
        modelScale: selectedStep.modelScale || 1,
        modelPositionY: selectedStep.modelPositionY ?? 0,
        custom3dElementId: selectedStep.custom3dElementId,
        uploadedModelId: selectedStep.uploadedModelId,
        inlineCustom3DElement: selectedStep.inlineCustom3DElement,
        inlineUploadedModel: selectedStep.inlineUploadedModel,
        engravedBlockParams: selectedStep.engravedBlockParams || {
          text: 'DB',
          font: 'helvetiker',
          depth: 0.08,
          padding: 0.1,
          face: 'front',
        },
      });
    }
  }, [selectedStep]);

  const handleInputChange = (field: keyof InstructionStep, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleEngravedParamChange = (field: keyof EngravedBlockParams, value: string | number) => {
    setFormData((prev) => ({
      ...prev,
      engravedBlockParams: {
        ...(prev.engravedBlockParams ?? { text: 'DB', font: 'helvetiker', depth: 0.08, padding: 0.1, face: 'front' }),
        [field]: value,
      },
    }));
  };

  const handleSave = () => {
    if (selectedStepId && selectedStep) {
      updateStep(selectedStepId, formData);
    }
  };

  const handleDelete = () => {
    if (selectedStepId && window.confirm('Czy na pewno chcesz usunąć ten krok?')) {
      deleteStep(selectedStepId);
    }
  };

  const handleAddNewStep = () => {
    const newStep: InstructionStep = {
      id: `step-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      title: 'Nowy krok',
      description: 'Dodaj opis tutaj',
      modelPath: 'box',
      cameraPosition: { x: 5, y: 5, z: 5, targetX: 0, targetY: 0, targetZ: 0 },
      highlightColor: '#4299e1',
      shapeType: 'cube',
    };
    addStep(newStep);
  };

  return (
    <div className="w-full h-full bg-slate-50 overflow-y-auto">
      {/* Add step button always visible at top */}
      <div className="px-4 pt-4 pb-2">
        <button
          onClick={handleAddNewStep}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg hover:from-blue-600 hover:to-indigo-700 transition-all shadow-md shadow-blue-200 font-medium text-sm"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
          </svg>
          Dodaj nowy krok
        </button>
      </div>

      <div className="px-4 pb-4">
        {!selectedStep ? (
          <div className="text-center py-10">
            <div className="w-12 h-12 mx-auto mb-3 bg-orange-100 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5" />
              </svg>
            </div>
            <p className="text-slate-500 text-sm font-medium">Żaden krok nie jest zaznaczony</p>
            <p className="text-slate-400 text-xs mt-1">Kliknij węzeł na kanwie lub dodaj nowy krok</p>
          </div>
        ) : (
          <div className="space-y-3 mt-2">
            <div className="bg-white rounded-lg border border-slate-200 p-3 shadow-sm">
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">Tytuł kroku</label>
              <input
                type="text"
                value={formData.title || ''}
                onChange={(e) => handleInputChange('title', e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Np. Krok 1 – Montaż podstawy"
              />
            </div>
            <div className="bg-white rounded-lg border border-slate-200 p-3 shadow-sm">
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">Opis</label>
              <RichTextEditor
                value={formData.description || ''}
                onChange={(value) => handleInputChange('description', value)}
              />
            </div>
            <div className="bg-white rounded-lg border border-slate-200 p-3 shadow-sm">
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">Kolor podświetlenia</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={formData.highlightColor || '#4299e1'}
                  onChange={(e) => handleInputChange('highlightColor', e.target.value)}
                  className="w-10 h-9 border border-slate-200 rounded-lg cursor-pointer"
                />
                <input
                  type="text"
                  value={formData.highlightColor || '#4299e1'}
                  onChange={(e) => handleInputChange('highlightColor', e.target.value)}
                  className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="bg-white rounded-lg border border-slate-200 p-3 shadow-sm">
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">Typ kształtu</label>
              <select
                value={formData.shapeType || 'cube'}
                onChange={(e) => {
                  const newType = e.target.value as ShapeType;
                  setFormData((prev) => ({
                    ...prev,
                    shapeType: newType,
                    // Clear model-specific selections when switching away from those types
                    ...(newType !== 'custom3dElement' && { custom3dElementId: undefined, inlineCustom3DElement: undefined }),
                    ...(newType !== 'uploadedModel' && { uploadedModelId: undefined, inlineUploadedModel: undefined }),
                  }));
                }}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="cube">📦 Sześcian (Cube)</option>
                <option value="sphere">🔵 Kula (Sphere)</option>
                <option value="cylinder">🥫 Walec (Cylinder)</option>
                <option value="cone">🔺 Stożek (Cone)</option>
                <option value="engravedBlock">🔲 Grawerowany klocek</option>
                {custom3DElements.length > 0 && (
                  <option value="custom3dElement">🧩 Mój element 3D</option>
                )}
                {uploadedModels.length > 0 && (
                  <option value="uploadedModel">📤 Wgrany model 3D</option>
                )}
              </select>
            </div>

            {formData.shapeType === 'custom3dElement' && (
              <div className="bg-white rounded-lg border border-slate-200 p-3 shadow-sm">
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">Wybierz element 3D</label>
                <select
                  value={formData.custom3dElementId || ''}
                  onChange={(e) => {
                    const id = e.target.value;
                    const element = custom3DElements.find((el) => el.id === id);
                    setFormData((prev) => ({
                      ...prev,
                      custom3dElementId: id || undefined,
                      inlineCustom3DElement: element,
                    }));
                  }}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">-- wybierz element --</option>
                  {custom3DElements.map((el) => (
                    <option key={el.id} value={el.id}>{el.name}</option>
                  ))}
                </select>
                {custom3DElements.length === 0 && (
                  <p className="mt-1 text-xs text-amber-600">
                    Brak elementów 3D. Utwórz je w Ustawienia {'>'} Stwórz element 3D.
                  </p>
                )}
              </div>
            )}

            {formData.shapeType === 'uploadedModel' && (
              <div className="bg-white rounded-lg border border-slate-200 p-3 shadow-sm">
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">Wybierz wgrany model 3D</label>
                <select
                  value={formData.uploadedModelId || ''}
                  onChange={(e) => {
                    const id = e.target.value;
                    const model = uploadedModels.find((m) => m.id === id);
                    setFormData((prev) => ({
                      ...prev,
                      uploadedModelId: id || undefined,
                      inlineUploadedModel: model,
                    }));
                  }}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">-- wybierz model --</option>
                  {uploadedModels.map((m) => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
                {uploadedModels.length === 0 && (
                  <p className="mt-1 text-xs text-amber-600">
                    Brak wgranych modeli. Dodaj je w Ustawienia {'>'} Wgraj element 3D.
                  </p>
                )}
              </div>
            )}

            {formData.shapeType === 'engravedBlock' && (
              <div className="bg-white rounded-lg border border-slate-200 p-3 shadow-sm space-y-3">
                <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Ustawienia grawerowanego klocka</p>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tekst <span className="text-gray-400 font-normal">(maks. 3 słów, 24 znaki)</span>
                  </label>
                  <input
                    type="text"
                    value={formData.engravedBlockParams?.text ?? 'DB'}
                    onChange={(e) => handleEngravedParamChange('text', e.target.value)}
                    maxLength={24}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Czcionka</label>
                  <select
                    value={formData.engravedBlockParams?.font ?? 'helvetiker'}
                    onChange={(e) => handleEngravedParamChange('font', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="helvetiker">Sans (Helvetiker)</option>
                    <option value="optimer">Serif (Optimer)</option>
                    <option value="gentilis">Mono (Gentilis)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Głębokość grawerowania <span className="text-gray-400 font-normal">(0.05 – 0.3)</span>
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="range"
                      min="0.05"
                      max="0.3"
                      step="0.01"
                      value={formData.engravedBlockParams?.depth ?? 0.12}
                      onChange={(e) => handleEngravedParamChange('depth', parseFloat(e.target.value))}
                      className="flex-1"
                    />
                    <input
                      type="number"
                      min="0.05"
                      max="0.3"
                      step="0.01"
                      value={formData.engravedBlockParams?.depth ?? 0.12}
                      onChange={(e) => handleEngravedParamChange('depth', parseFloat(e.target.value))}
                      className="w-16 px-2 py-1 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Padding <span className="text-gray-400 font-normal">(0.05 – 0.2)</span>
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="range"
                      min="0.05"
                      max="0.2"
                      step="0.01"
                      value={formData.engravedBlockParams?.padding ?? 0.1}
                      onChange={(e) => handleEngravedParamChange('padding', parseFloat(e.target.value))}
                      className="flex-1"
                    />
                    <input
                      type="number"
                      min="0.05"
                      max="0.2"
                      step="0.01"
                      value={formData.engravedBlockParams?.padding ?? 0.1}
                      onChange={(e) => handleEngravedParamChange('padding', parseFloat(e.target.value))}
                      className="w-16 px-2 py-1 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="bg-white rounded-lg border border-slate-200 p-3 shadow-sm">
              <label htmlFor="model-scale" className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">
                Skala <span className="text-slate-400 font-normal normal-case">(0.1 – 5.0)</span>
              </label>
              <div className="flex items-center gap-3">
                <input
                  id="model-scale"
                  type="range"
                  min="0.1"
                  max="5"
                  step="0.1"
                  value={formData.modelScale ?? 1}
                  onChange={(e) => handleInputChange('modelScale', parseFloat(e.target.value))}
                  className="flex-1"
                />
                <input
                  type="number"
                  min="0.1"
                  max="5"
                  step="0.1"
                  value={formData.modelScale ?? 1}
                  onChange={(e) => handleInputChange('modelScale', parseFloat(e.target.value))}
                  className="w-16 px-2 py-1 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="bg-white rounded-lg border border-slate-200 p-3 shadow-sm">
              <label htmlFor="model-position-y" className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">
                Pozycja Y <span className="text-slate-400 font-normal normal-case">(-10 – 10, góra/dół)</span>
              </label>
              <div className="flex items-center gap-3">
                <input
                  id="model-position-y"
                  type="range"
                  min="-10"
                  max="10"
                  step="0.1"
                  value={formData.modelPositionY ?? 0}
                  onChange={(e) => handleInputChange('modelPositionY', parseFloat(e.target.value))}
                  className="flex-1"
                />
                <input
                  type="number"
                  min="-10"
                  max="10"
                  step="0.1"
                  value={formData.modelPositionY ?? 0}
                  onChange={(e) => handleInputChange('modelPositionY', parseFloat(e.target.value))}
                  className="w-16 px-2 py-1 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="pt-2 space-y-2">
              <button onClick={handleSave} className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg hover:from-blue-600 hover:to-indigo-700 transition-all shadow-md shadow-blue-200 font-medium text-sm">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Zapisz zmiany
              </button>
              <button onClick={handleDelete} className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-50 text-red-600 border border-red-200 rounded-lg hover:bg-red-100 transition-all font-medium text-sm">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Usuń krok
              </button>
            </div>

            <div className="pt-2 border-t border-slate-200">
              <p className="text-xs text-slate-400 font-mono truncate">ID: {selectedStep.id}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
