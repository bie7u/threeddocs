import { useRef, useState } from 'react';
import { useAppStore } from '../../store';
import { useLanguage } from '../../i18n';
import { Viewer3D } from '../Viewer3D/Viewer3D';
import { RichTextEditor } from '../RichTextEditor';
import type { GuideStep } from '../../types';

export const GuideBuilder = () => {
  const {
    project,
    nodePositions,
    cameraMode,
    selectedStepId,
    setSelectedStepId,
    addGuideStep,
    removeGuideStep,
    reorderGuideSteps,
    updateStep,
  } = useAppStore();

  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const dragItemRef = useRef<number | null>(null);

  if (!project) {
    return (
      <div className="w-full h-full flex items-center justify-center text-slate-500">
        {language === 'pl' ? 'Brak projektu.' : 'No project.'}
      </div>
    );
  }

  const guide: GuideStep[] = project.guide ?? [];
  const stepInGuide = (stepId: string) => guide.some((gs) => gs.stepId === stepId);

  const handleDragStart = (index: number) => { dragItemRef.current = index; setDragIndex(index); };
  const handleDragEnter = (index: number) => { setDragOverIndex(index); };
  const handleDragEnd = () => {
    if (dragItemRef.current !== null && dragOverIndex !== null && dragItemRef.current !== dragOverIndex) {
      const newGuide = [...guide];
      const [moved] = newGuide.splice(dragItemRef.current, 1);
      newGuide.splice(dragOverIndex, 0, moved);
      reorderGuideSteps(newGuide);
    }
    dragItemRef.current = null;
    setDragIndex(null);
    setDragOverIndex(null);
  };
  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); };

  const handleAddAll = () => {
    project.steps.forEach((step) => {
      if (!stepInGuide(step.id)) addGuideStep(step.id);
    });
  };

  const handleClearGuide = () => {
    guide.forEach((gs) => removeGuideStep(gs.id));
  };

  const selectedStep = project.steps.find((s) => s.id === selectedStepId) ?? null;

  return (
    <div className="w-full h-full flex overflow-hidden gap-2 p-1">

      {/* ─── Left panel: Available steps ─── */}
      <div className="w-72 bg-white rounded-xl shadow-xl border border-slate-200 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-4 py-3 bg-gradient-to-r from-orange-50 to-amber-50 border-b border-orange-100 flex-shrink-0">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-amber-600 rounded-lg flex items-center justify-center shadow-lg flex-shrink-0">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <div>
              <h2 className="font-bold text-slate-800 text-sm">Kroki modelu</h2>
              <p className="text-xs text-slate-500">Kliknij + aby dodać do przewodnika</p>
            </div>
          </div>
          {project.steps.length > 0 && (
            <button
              onClick={handleAddAll}
              className="w-full py-1.5 text-xs font-semibold text-orange-700 bg-orange-100 hover:bg-orange-200 rounded-lg transition-all border border-orange-200"
            >
              {language === 'pl' ? '＋ Dodaj wszystkie' : '＋ Add all'}
            </button>
          )}
        </div>

        {/* Step list */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
          {project.steps.length === 0 && (
            <div className="flex flex-col items-center justify-center py-10 text-center px-4">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mb-3">
                <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <p className="text-sm font-medium text-slate-500">{language === 'pl' ? 'Brak kroków w modelu' : 'No steps in model'}</p>
              <p className="text-xs text-slate-400 mt-1">{language === 'pl' ? 'Przełącz się na Model Builder, aby dodać kroki.' : 'Switch to Model Builder to add steps.'}</p>
            </div>
          )}
          {project.steps.map((step) => {
            const inGuide = stepInGuide(step.id);
            const isSelected = selectedStepId === step.id;
            return (
              <div
                key={step.id}
                onClick={() => setSelectedStepId(step.id === selectedStepId ? null : step.id)}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-xl border cursor-pointer transition-all ${
                  isSelected
                    ? 'border-blue-400 bg-blue-50 shadow-sm'
                    : inGuide
                    ? 'border-green-200 bg-green-50 hover:bg-green-100'
                    : 'border-slate-200 bg-white hover:bg-slate-50'
                }`}
              >
                <div
                  className="w-3 h-3 rounded-full flex-shrink-0 ring-2 ring-white shadow"
                  style={{ backgroundColor: step.highlightColor ?? '#4299e1' }}
                />
                <span className={`flex-1 text-sm font-medium truncate ${inGuide ? 'text-green-800' : 'text-slate-700'}`}>
                  {step.title}
                </span>
                <button
                  onClick={(e) => { e.stopPropagation(); if (!inGuide) addGuideStep(step.id); }}
                  disabled={inGuide}
                  title={inGuide ? (language === 'pl' ? 'Już w przewodniku' : 'Already in guide') : (language === 'pl' ? 'Dodaj do przewodnika' : 'Add to guide')}
                  className={`w-7 h-7 flex items-center justify-center rounded-lg text-sm font-bold transition-all flex-shrink-0 ${
                    inGuide
                      ? 'bg-green-100 text-green-600 cursor-default ring-1 ring-green-300'
                      : 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white hover:from-blue-600 hover:to-indigo-700 shadow'
                  }`}
                >
                  {inGuide ? '✓' : '+'}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* ─── Center panel: 3D Preview + Step Editor ─── */}
      <div className="flex-1 flex flex-col gap-2 min-h-0 overflow-hidden">
        {/* 3D Viewer */}
        <div className="flex-1 bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden flex flex-col min-h-0">
          <div className="px-4 py-2.5 bg-gradient-to-r from-slate-50 to-slate-100 border-b border-slate-200 flex-shrink-0 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-lg flex items-center justify-center shadow flex-shrink-0">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <div>
                <h2 className="font-bold text-slate-800 text-sm">Podgląd 3D</h2>
                <p className="text-xs text-slate-400">{language === 'pl' ? 'Wybierz krok, aby skupić kamerę' : 'Select a step to focus camera'}</p>
              </div>
            </div>
            {selectedStep && (
              <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200 truncate max-w-[180px]">
                {selectedStep.title}
              </span>
            )}
          </div>
          <div className="flex-1 relative bg-gradient-to-br from-slate-900 to-slate-800">
            <Viewer3D
              project={project}
              currentStepId={selectedStepId}
              nodePositions={nodePositions}
              cameraMode={cameraMode}
              showStepOverlay={false}
              onStepSelect={setSelectedStepId}
            />
            {!selectedStepId && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="bg-black/50 backdrop-blur-sm text-white px-5 py-3 rounded-xl shadow-2xl border border-white/10 text-center">
                  <p className="text-sm font-medium">{language === 'pl' ? 'Wybierz krok, aby zobaczyć podgląd' : 'Select a step to see preview'}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Step editor (only when step selected) */}
        {selectedStep && (
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 flex flex-col overflow-hidden flex-shrink-0">
            <div className="px-4 py-2.5 bg-gradient-to-r from-slate-50 to-slate-100 border-b border-slate-200 flex items-center gap-3">
              <div className="w-7 h-7 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center shadow flex-shrink-0">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </div>
              <div>
                <h2 className="font-bold text-slate-800 text-sm">{language === 'pl' ? 'Edytuj krok' : 'Edit step'}</h2>
                <p className="text-xs text-slate-400">Zmiany zapisują się automatycznie</p>
              </div>
            </div>
            <div className="p-3 space-y-3 overflow-y-auto max-h-64">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide">Tytuł</label>
                  <span className="text-xs text-slate-400">{selectedStep.title.length}/200</span>
                </div>
                <input
                  type="text"
                  value={selectedStep.title}
                  onChange={(e) => updateStep(selectedStep.id, { title: e.target.value })}
                  className="w-full px-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  maxLength={200}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1">Opis</label>
                <RichTextEditor
                  value={selectedStep.description}
                  onChange={(value) => updateStep(selectedStep.id, { description: value })}
                  maxLength={2000}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ─── Right panel: Ordered guide steps ─── */}
      <div className="w-72 bg-white rounded-xl shadow-xl border border-slate-200 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-4 py-3 bg-gradient-to-r from-purple-50 to-indigo-50 border-b border-purple-100 flex-shrink-0">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg flex items-center justify-center shadow-lg flex-shrink-0">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="font-bold text-slate-800 text-sm">Kroki przewodnika</h2>
              <p className="text-xs text-slate-500">Przeciągnij, aby zmienić kolejność</p>
            </div>
            {guide.length > 0 && (
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 text-white text-xs font-bold flex items-center justify-center shadow">
                {guide.length}
              </span>
            )}
          </div>
          {guide.length > 0 && (
            <button
              onClick={handleClearGuide}
              className="w-full py-1.5 text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-all border border-red-200"
            >
              {language === 'pl' ? '✕ Usuń wszystkie' : '✕ Remove all'}
            </button>
          )}
        </div>

        {/* Guide step list */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
          {guide.length === 0 && (
            <div className="flex flex-col items-center justify-center py-10 text-center px-4">
              <div className="w-12 h-12 rounded-2xl bg-purple-50 flex items-center justify-center mb-3">
                <svg className="w-6 h-6 text-purple-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                </svg>
              </div>
              <p className="text-sm font-medium text-slate-500">{language === 'pl' ? 'Przewodnik jest pusty' : 'Guide is empty'}</p>
              <p className="text-xs text-slate-400 mt-1">{language === 'pl' ? 'Dodaj kroki z listy po lewej stronie.' : 'Add steps from the list on the left.'}</p>
            </div>
          )}
          {guide.map((gs, index) => {
            const step = project.steps.find((s) => s.id === gs.stepId);
            if (!step) return null;
            const isDragging = dragIndex === index;
            const isDragOver = dragOverIndex === index;
            const isSelected = selectedStepId === step.id;
            return (
              <div
                key={gs.id}
                draggable
                onDragStart={() => handleDragStart(index)}
                onDragEnter={() => handleDragEnter(index)}
                onDragEnd={handleDragEnd}
                onDragOver={handleDragOver}
                onClick={() => setSelectedStepId(step.id === selectedStepId ? null : step.id)}
                className={`flex items-center gap-2.5 px-2.5 py-2 rounded-xl border cursor-grab active:cursor-grabbing transition-all select-none ${
                  isDragging
                    ? 'opacity-30 border-slate-300 bg-slate-100 scale-95'
                    : isDragOver
                    ? 'border-purple-400 bg-purple-50 shadow-md scale-100'
                    : isSelected
                    ? 'border-blue-400 bg-blue-50 shadow-sm'
                    : 'border-slate-200 bg-white hover:bg-slate-50 hover:shadow-sm'
                }`}
              >
                {/* Drag handle */}
                <div className="flex-shrink-0 text-slate-300 hover:text-slate-500 transition-colors">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 6a2 2 0 110-4 2 2 0 010 4zm8 0a2 2 0 110-4 2 2 0 010 4zM8 14a2 2 0 110-4 2 2 0 010 4zm8 0a2 2 0 110-4 2 2 0 010 4zM8 22a2 2 0 110-4 2 2 0 010 4zm8 0a2 2 0 110-4 2 2 0 010 4z" />
                  </svg>
                </div>
                {/* Step number badge */}
                <div
                  className="w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold text-white flex-shrink-0 shadow"
                  style={{ backgroundColor: step.highlightColor ?? '#4299e1' }}
                >
                  {index + 1}
                </div>
                <span className="flex-1 text-sm font-medium text-slate-700 truncate">{step.title}</span>
                <button
                  onClick={(e) => { e.stopPropagation(); removeGuideStep(gs.id); }}
                  title={language === 'pl' ? 'Usuń z przewodnika' : 'Remove from guide'}
                  className="w-6 h-6 flex items-center justify-center rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 transition-all flex-shrink-0"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            );
          })}
        </div>

        {guide.length > 0 && (
          <div className="px-3 py-2 border-t border-slate-100 bg-slate-50 flex-shrink-0 flex items-center justify-center gap-2">
            <div className="w-2 h-2 rounded-full bg-purple-400" />
            <p className="text-xs text-slate-500 font-medium">
              {guide.length} {guide.length === 1 ? (language === 'pl' ? 'krok' : 'step') : (language === 'pl' ? (guide.length < 5 ? 'kroki' : 'kroków') : 'steps')} {language === 'pl' ? 'w przewodniku' : 'in guide'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
