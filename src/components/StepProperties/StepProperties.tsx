import { useEffect, useState, useRef } from 'react';
import { useAppStore } from '../../store';
import type { InstructionStep, ShapeType, EngravedBlockParams, UploadedModel3D } from '../../types';
import { RichTextEditor } from '../RichTextEditor';
import { loadCustom3DElements } from '../../utils/custom3DElements';
import { loadUploadedModels } from '../../utils/uploadedModels';
import type { Custom3DElement } from '../../types';
import { ShapeTypePicker } from '../ShapeTypePicker/ShapeTypePicker';
import { useTranslation } from 'react-i18next';

export const StepProperties = () => {
  const { t } = useTranslation();
  const { project, selectedStepId, updateStep, deleteStep, addStep, isGuestMode } = useAppStore();
  
  const selectedStep = project?.steps.find((step) => step.id === selectedStepId);
  
  const blobUrlRef = useRef<string | null>(null);
  const uploadedFileNameRef = useRef<string | null>(null);
  
  const [custom3DElements, setCustom3DElements] = useState<Custom3DElement[]>([]);
  const [uploadedModels, setUploadedModels] = useState<UploadedModel3D[]>([]);
  const [pickerOpen, setPickerOpen] = useState(false);

  useEffect(() => {
    // Guest users have no server-side elements or models — skip API calls to
    // prevent a 401 that would otherwise redirect them to the login page.
    if (isGuestMode) return;
    loadCustom3DElements().then(setCustom3DElements).catch(() => setCustom3DElements([]));
    loadUploadedModels().then(setUploadedModels).catch(() => setUploadedModels([]));
  }, [isGuestMode]);
  
  const [formData, setFormData] = useState<Partial<InstructionStep>>({
    title: '',
    description: '',
    highlightColor: '#4299e1',
    shapeType: 'cube',
    customModelUrl: '',
    modelScale: 1,
    modelPositionY: 0,
    modelRotationY: 0,
    custom3dElementId: undefined,
    uploadedModelId: undefined,
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
        modelRotationY: selectedStep.modelRotationY ?? 0,
        custom3dElementId: selectedStep.custom3dElementId,
        uploadedModelId: selectedStep.uploadedModelId,
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
    const updated = { ...formData, [field]: value };
    setFormData(updated);
    if (selectedStepId && selectedStep) {
      updateStep(selectedStepId, updated);
    }
  };

  const handleEngravedParamChange = (field: keyof EngravedBlockParams, value: string | number) => {
    const updatedParams = {
      ...(formData.engravedBlockParams ?? { text: 'DB', font: 'helvetiker', depth: 0.08, padding: 0.1, face: 'front' }),
      [field]: value,
    };
    const updated = { ...formData, engravedBlockParams: updatedParams };
    setFormData(updated);
    if (selectedStepId && selectedStep) {
      updateStep(selectedStepId, updated);
    }
  };

  const handleSave = () => {
    if (selectedStepId && selectedStep) {
      updateStep(selectedStepId, { ...formData });
    }
  };

  const handleDelete = () => {
    if (selectedStepId && window.confirm(t('stepProperties.deleteConfirm'))) {
      deleteStep(selectedStepId);
    }
  };

  const handleAddNewStep = () => {
    const newStep: InstructionStep = {
      id: `step-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      title: t('stepProperties.newStepTitle'),
      description: t('stepProperties.newStepDesc'),
      modelPath: 'box',
      cameraPosition: { x: 5, y: 5, z: 5, targetX: 0, targetY: 0, targetZ: 0 },
      highlightColor: '#4299e1',
      shapeType: 'cube',
    };
    addStep(newStep);
  };

  const handleShapeSelect = (type: ShapeType, elementId?: string, modelId?: string) => {
    const updated = {
      ...formData,
      shapeType: type,
      custom3dElementId: elementId,
      uploadedModelId: modelId,
    };
    setFormData(updated);
    if (selectedStepId && selectedStep) {
      updateStep(selectedStepId, updated);
    }
  };

  const getShapeButtonLabel = (): string => {
    const labels: Partial<Record<ShapeType, string>> = {
      cube: t('stepProperties.shapeCube'),
      sphere: t('stepProperties.shapeSphere'),
      cylinder: t('stepProperties.shapeCylinder'),
      cone: t('stepProperties.shapeCone'),
      engravedBlock: t('stepProperties.shapeEngraved'),
    };
    if (formData.shapeType === 'custom3dElement') {
      const el = custom3DElements.find((e) => e.id === formData.custom3dElementId);
      return `🧩 ${el?.name ?? 'Element 3D'}`;
    }
    if (formData.shapeType === 'uploadedModel') {
      const m = uploadedModels.find((u) => u.id === formData.uploadedModelId);
      return `📤 ${m?.name ?? t('stepProperties.shapeUploadedDefault')}`;
    }
    return labels[formData.shapeType ?? 'cube'] ?? t('stepProperties.shapeCube');
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
          {t('stepProperties.addStepBtn')}
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
            <p className="text-slate-500 text-sm font-medium">{t('stepProperties.noStepSelected')}</p>
            <p className="text-slate-400 text-xs mt-1">{t('stepProperties.noStepSelectedHint')}</p>
          </div>
        ) : (
          <div className="space-y-3 mt-2">
            <div className="bg-white rounded-lg border border-slate-200 p-3 shadow-sm">
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide">{t('stepProperties.titleLabel')}</label>
                <span className="text-xs text-slate-400">{(formData.title || '').length}/200</span>
              </div>
              <input
                type="text"
                value={formData.title || ''}
                onChange={(e) => handleInputChange('title', e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder={t('stepProperties.titlePlaceholder')}
                maxLength={200}
              />
            </div>
            <div className="bg-white rounded-lg border border-slate-200 p-3 shadow-sm">
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">{t('stepProperties.descLabel')}</label>
              <RichTextEditor
                value={formData.description || ''}
                onChange={(value) => handleInputChange('description', value)}
                maxLength={2000}
              />
            </div>
            <div className="bg-white rounded-lg border border-slate-200 p-3 shadow-sm">
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">{t('stepProperties.colorLabel')}</label>
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
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">{t('stepProperties.shapeTypeLabel')}</label>
              <button
                type="button"
                onClick={() => setPickerOpen(true)}
                className="w-full flex items-center justify-between px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-700 hover:border-blue-400 hover:bg-slate-50 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <span>{getShapeButtonLabel()}</span>
                <svg className="w-4 h-4 text-slate-400 flex-shrink-0 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
                </svg>
              </button>
            </div>

            {pickerOpen && (
              <ShapeTypePicker
                currentShapeType={formData.shapeType ?? 'cube'}
                currentElementId={formData.custom3dElementId}
                currentModelId={formData.uploadedModelId}
                isGuestMode={isGuestMode}
                onSelect={handleShapeSelect}
                onClose={() => setPickerOpen(false)}
              />
            )}

            {formData.shapeType === 'engravedBlock' && (
              <div className="bg-white rounded-lg border border-slate-200 p-3 shadow-sm space-y-3">
                <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide">{t('stepProperties.engravedSettings')}</p>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('stepProperties.engravedTextLabel')} <span className="text-gray-400 font-normal">{t('stepProperties.engravedTextHint')}</span>
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('stepProperties.engravedFontLabel')}</label>
                  <select
                    value={formData.engravedBlockParams?.font ?? 'helvetiker'}
                    onChange={(e) => handleEngravedParamChange('font', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="helvetiker">{t('stepProperties.engravedFontSans')}</option>
                    <option value="optimer">{t('stepProperties.engravedFontSerif')}</option>
                    <option value="gentilis">{t('stepProperties.engravedFontMono')}</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('stepProperties.engravedDepthLabel')} <span className="text-gray-400 font-normal">{t('stepProperties.engravedDepthHint')}</span>
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
                    {t('stepProperties.engravedPaddingLabel')} <span className="text-gray-400 font-normal">{t('stepProperties.engravedPaddingHint')}</span>
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
                {t('stepProperties.scaleLabel')} <span className="text-slate-400 font-normal normal-case">{t('stepProperties.scaleHint')}</span>
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
                {t('stepProperties.positionYLabel')} <span className="text-slate-400 font-normal normal-case">{t('stepProperties.positionYHint')}</span>
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

            <div className="bg-white rounded-lg border border-slate-200 p-3 shadow-sm">
              <label htmlFor="model-rotation-y" className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">
                {t('stepProperties.rotationYLabel')} <span className="text-slate-400 font-normal normal-case">{t('stepProperties.rotationYHint')}</span>
              </label>
              <div className="flex items-center gap-3">
                <input
                  id="model-rotation-y"
                  type="range"
                  min="0"
                  max="360"
                  step="1"
                  value={formData.modelRotationY ?? 0}
                  onChange={(e) => handleInputChange('modelRotationY', parseFloat(e.target.value))}
                  className="flex-1"
                />
                <input
                  type="number"
                  min="0"
                  max="360"
                  step="1"
                  value={formData.modelRotationY ?? 0}
                  onChange={(e) => handleInputChange('modelRotationY', parseFloat(e.target.value))}
                  className="w-16 px-2 py-1 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="pt-2 space-y-2">
              <button onClick={handleSave} className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg hover:from-blue-600 hover:to-indigo-700 transition-all shadow-md shadow-blue-200 font-medium text-sm">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                {t('stepProperties.saveBtn')}
              </button>
              <button onClick={handleDelete} className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-50 text-red-600 border border-red-200 rounded-lg hover:bg-red-100 transition-all font-medium text-sm">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                {t('stepProperties.deleteBtn')}
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
