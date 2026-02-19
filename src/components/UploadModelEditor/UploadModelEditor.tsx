import { useState, useRef } from 'react';
import { useAppStore } from '../../store';
import { UploadedModelCanvas } from './UploadedModelCanvas';
import { RichTextEditor } from '../RichTextEditor';
import { stripHtmlTags } from '../../utils/html';
import type { MeshPickResult, CameraSnapshot } from './UploadedModelCanvas';
import type { InstructionStep, CameraPosition } from '../../types';

interface EditingState {
  title: string;
  description: string;
  highlightColor: string;
  focusMeshName: string;
  focusPoint: [number, number, number] | null;
  cameraPosition: CameraPosition;
  cameraCaptured: boolean;
}

const DEFAULT_CAM: CameraPosition = { x: 5, y: 5, z: 5, targetX: 0, targetY: 0, targetZ: 0 };

export const UploadModelEditor = () => {
  const { project, setPreviewMode, addStep, updateStep, deleteStep } = useAppStore();
  const [selectedStepId, setSelectedStepId] = useState<string | null>(null);
  const [editingStep, setEditingStep] = useState<EditingState | null>(null);
  const [isAddingStep, setIsAddingStep] = useState(false);
  const [isPickMode, setIsPickMode] = useState(false);
  const cameraStateRef = useRef<CameraSnapshot | null>(null);

  if (!project || !project.projectModelUrl) return null;

  const selectedStep = project.steps.find((s) => s.id === selectedStepId) ?? null;

  const openAddForm = () => {
    setSelectedStepId(null);
    setEditingStep({ title: '', description: '', highlightColor: '#4299e1', focusMeshName: '', focusPoint: null, cameraPosition: DEFAULT_CAM, cameraCaptured: false });
    setIsAddingStep(true);
    setIsPickMode(true);
  };

  const openEditForm = (step: InstructionStep) => {
    setSelectedStepId(step.id);
    setEditingStep({ title: step.title, description: step.description, highlightColor: step.highlightColor ?? '#4299e1', focusMeshName: step.focusMeshName ?? '', focusPoint: step.focusPoint ?? null, cameraPosition: step.cameraPosition ?? DEFAULT_CAM, cameraCaptured: false });
    setIsAddingStep(false);
    setIsPickMode(false);
  };

  const handleMeshPicked = (result: MeshPickResult) => {
    setIsPickMode(false);
    setEditingStep((prev) => prev ? { ...prev, focusMeshName: result.meshName, focusPoint: result.focusPoint, cameraPosition: result.cameraPosition, cameraCaptured: true } : prev);
  };

  const handleCaptureCamera = () => {
    if (!cameraStateRef.current) return;
    const { position, target } = cameraStateRef.current;
    setEditingStep((prev) => prev ? { ...prev, cameraPosition: { x: position.x, y: position.y, z: position.z, targetX: target.x, targetY: target.y, targetZ: target.z }, cameraCaptured: true } : prev);
  };

  const handleEnterPickMode = () => { setIsPickMode(true); };

  const handleSaveStep = () => {
    if (!editingStep || !editingStep.title.trim()) return;
    setIsPickMode(false);
    const cam = editingStep.cameraPosition;
    if (isAddingStep) {
      const newStep: InstructionStep = {
        id: `step-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
        title: editingStep.title,
        description: editingStep.description,
        modelPath: '',
        cameraPosition: cam,
        highlightColor: editingStep.highlightColor,
        shapeType: 'custom',
        customModelUrl: project.projectModelUrl,
        focusMeshName: editingStep.focusMeshName || undefined,
        focusPoint: editingStep.focusPoint ?? undefined,
      };
      addStep(newStep);
      setSelectedStepId(newStep.id);
      setIsAddingStep(false);
      setEditingStep(null);
    } else if (selectedStepId) {
      updateStep(selectedStepId, { title: editingStep.title, description: editingStep.description, highlightColor: editingStep.highlightColor, cameraPosition: cam, focusMeshName: editingStep.focusMeshName || undefined, focusPoint: editingStep.focusPoint ?? undefined });
      setEditingStep(null);
    }
  };

  const handleCancelEdit = () => { setEditingStep(null); setIsAddingStep(false); setIsPickMode(false); };

  const handleDeleteStep = (stepId: string) => {
    if (window.confirm('Czy na pewno chcesz usunąć ten krok?')) {
      deleteStep(stepId);
      if (selectedStepId === stepId) { setSelectedStepId(null); setEditingStep(null); }
    }
  };

  const displayStep = isPickMode ? null : (selectedStep ?? project.steps[0] ?? null);
  const focusedMeshName = editingStep?.focusMeshName || selectedStep?.focusMeshName || undefined;

  return (
    <div className="w-full h-full flex overflow-hidden gap-1">
      <div className="flex-1 bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden flex flex-col">
        <div className="px-5 py-4 bg-gradient-to-r from-slate-50 to-slate-100 border-b border-slate-200 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center shadow-lg">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <div>
                <h2 className="font-bold text-slate-800 text-base">Model 3D</h2>
                <p className="text-xs text-slate-500">{isPickMode ? 'Tryb wyboru — kliknij element modelu' : 'Obracaj kamerą swobodnie'}</p>
              </div>
            </div>
            {editingStep && !isPickMode && (
              <button
                onClick={handleCaptureCamera}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${editingStep.cameraCaptured ? 'bg-green-100 text-green-700 border border-green-300' : 'bg-slate-700 text-white hover:bg-slate-600'}`}
                title="Zapisz obecną pozycję kamery dla tego kroku"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                {editingStep.cameraCaptured ? '✓ Kamera zapisana' : 'Zapisz kamerę'}
              </button>
            )}
          </div>
        </div>
        <div className="flex-1 relative">
          <UploadedModelCanvas
            modelUrl={project.projectModelUrl}
            isPickMode={isPickMode}
            focusedMeshName={focusedMeshName}
            onMeshPicked={handleMeshPicked}
            cameraStateRef={cameraStateRef}
            stepTitle={displayStep?.title}
            stepDescription={displayStep?.description}
            stepIndex={displayStep ? project.steps.indexOf(displayStep) : undefined}
          />
        </div>
      </div>

      <div className="w-96 bg-white rounded-xl shadow-xl border border-slate-200 flex flex-col overflow-hidden">
        <div className="px-5 py-4 bg-gradient-to-r from-slate-50 to-slate-100 border-b border-slate-200 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-amber-600 rounded-lg flex items-center justify-center shadow-lg">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <div>
                <h2 className="font-bold text-slate-800 text-base">Kroki dokumentacji</h2>
                <p className="text-xs text-slate-500">{project.steps.length} kroków</p>
              </div>
            </div>
            <button
              onClick={() => setPreviewMode(true)}
              disabled={project.steps.length === 0}
              className="px-3 py-1.5 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg text-sm font-medium hover:from-blue-600 hover:to-indigo-700 transition-all shadow-lg flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Preview
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {!editingStep && (
            <button onClick={openAddForm} className="w-full p-3 border-2 border-dashed border-blue-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition flex items-center gap-2 text-blue-500 hover:text-blue-700">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span className="text-sm font-medium">Dodaj nowy krok</span>
            </button>
          )}

          {editingStep && (
            <div className="border border-blue-300 rounded-lg p-4 bg-blue-50 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-slate-800 text-sm">{isAddingStep ? 'Nowy krok' : 'Edytuj krok'}</h3>
                {isPickMode ? (
                  <span className="text-xs text-blue-600 font-medium animate-pulse">← Kliknij element…</span>
                ) : (
                  <button onClick={handleEnterPickMode} className="text-xs text-blue-600 hover:text-blue-800 font-medium underline" title="Kliknij ponownie element modelu 3D">
                    {editingStep.focusMeshName ? '🔄 Zmień element' : '🎯 Wybierz element'}
                  </button>
                )}
              </div>

              {editingStep.focusMeshName && (
                <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-3 py-2">
                  <svg className="w-4 h-4 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-xs text-slate-700 truncate font-medium">{editingStep.focusMeshName || '(element bez nazwy)'}</span>
                </div>
              )}
              {!editingStep.focusMeshName && !isPickMode && (
                <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                  <svg className="w-4 h-4 text-amber-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-xs text-amber-700">Brak wybranego elementu — krok będzie ogólny</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Tytuł</label>
                <input
                  type="text"
                  value={editingStep.title}
                  onChange={(e) => setEditingStep((prev) => prev ? { ...prev, title: e.target.value } : prev)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Tytuł kroku…"
                  autoFocus={!isPickMode}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Opis</label>
                <RichTextEditor
                  value={editingStep.description}
                  onChange={(value) => setEditingStep((prev) => prev ? { ...prev, description: value } : prev)}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Kolor wyróżnienia</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={editingStep.highlightColor}
                    onChange={(e) => setEditingStep((prev) => prev ? { ...prev, highlightColor: e.target.value } : prev)}
                    className="w-10 h-8 border border-gray-300 rounded cursor-pointer"
                  />
                  <span className="text-xs text-slate-500">{editingStep.highlightColor}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs text-slate-500 bg-white border border-slate-200 rounded-lg px-3 py-2">
                <svg className="w-4 h-4 text-slate-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                {editingStep.cameraCaptured
                  ? <span className="text-green-600 font-medium">✓ Pozycja kamery zapisana</span>
                  : <span>Ustaw kamerę i kliknij „Zapisz kamerę" powyżej</span>
                }
              </div>

              <div className="flex gap-2">
                <button onClick={handleSaveStep} disabled={!editingStep.title.trim()} className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition disabled:bg-gray-300 disabled:cursor-not-allowed">Zapisz krok</button>
                <button onClick={handleCancelEdit} className="flex-1 px-3 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-300 transition">Anuluj</button>
              </div>
            </div>
          )}

          {project.steps.length === 0 && !editingStep && (
            <div className="text-center py-8 text-slate-400">
              <svg className="w-12 h-12 mx-auto mb-3 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <p className="text-sm">Brak kroków</p>
              <p className="text-xs mt-1">Kliknij „Dodaj nowy krok" powyżej</p>
            </div>
          )}

          {project.steps.map((step, index) => (
            <div
              key={step.id}
              className={`group relative border rounded-lg p-3 cursor-pointer transition-all ${selectedStepId === step.id && !editingStep ? 'border-blue-400 bg-blue-50' : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'}`}
              onClick={() => { if (!editingStep) { setSelectedStepId(step.id === selectedStepId ? null : step.id); } }}
            >
              <div className="flex items-start gap-3 pr-16">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold text-white flex-shrink-0 shadow-sm" style={{ backgroundColor: step.highlightColor ?? '#4299e1' }}>
                  {index + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-800 truncate">{step.title}</p>
                  {step.focusMeshName && (
                    <p className="text-xs text-blue-500 mt-0.5 flex items-center gap-1">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5" />
                      </svg>
                      {step.focusMeshName}
                    </p>
                  )}
                  {step.description && (
                    <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{stripHtmlTags(step.description)}</p>
                  )}
                </div>
              </div>
              <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={(e) => { e.stopPropagation(); openEditForm(step); }} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition" title="Edytuj krok">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
                <button onClick={(e) => { e.stopPropagation(); handleDeleteStep(step.id); }} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition" title="Usuń krok">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
