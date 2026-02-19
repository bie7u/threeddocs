import { useRef, useState } from 'react';
import { useAppStore } from '../../store';
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
        No project loaded.
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

  const selectedStep = project.steps.find((s) => s.id === selectedStepId) ?? null;

  return (
    <div className="w-full h-full flex overflow-hidden gap-4">
      {/* Left panel – Available model steps */}
      <div className="w-72 bg-white rounded-xl shadow-xl border border-slate-200 flex flex-col overflow-hidden">
        <div className="px-5 py-4 bg-gradient-to-r from-slate-50 to-slate-100 border-b border-slate-200 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-amber-600 rounded-lg flex items-center justify-center shadow-lg">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <div>
              <h2 className="font-bold text-slate-800 text-base">Model Steps</h2>
              <p className="text-xs text-slate-500">Click + to add to guide</p>
            </div>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {project.steps.length === 0 && (
            <p className="text-sm text-slate-400 text-center py-6">No steps in model yet.<br />Switch to Model Builder to add steps.</p>
          )}
          {project.steps.map((step) => {
            const inGuide = stepInGuide(step.id);
            return (
              <div
                key={step.id}
                onClick={() => setSelectedStepId(step.id === selectedStepId ? null : step.id)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-all ${selectedStepId === step.id ? 'border-blue-400 bg-blue-50' : 'border-slate-200 bg-white hover:bg-slate-50'}`}
              >
                <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: step.highlightColor ?? '#4299e1' }} />
                <span className="flex-1 text-sm font-medium text-slate-700 truncate">{step.title}</span>
                <button
                  onClick={(e) => { e.stopPropagation(); if (!inGuide) { addGuideStep(step.id); } }}
                  disabled={inGuide}
                  title={inGuide ? 'Already in guide' : 'Add to guide'}
                  className={`w-7 h-7 flex items-center justify-center rounded-lg text-sm font-bold transition-all flex-shrink-0 ${inGuide ? 'bg-green-100 text-green-500 cursor-default' : 'bg-blue-500 text-white hover:bg-blue-600'}`}
                >
                  {inGuide ? '✓' : '+'}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Center panel – 3D Preview + Step Editor */}
      <div className="flex-1 flex flex-col gap-4 min-h-0 overflow-hidden">
        <div className="flex-1 bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden flex flex-col min-h-0">
          <div className="px-5 py-4 bg-gradient-to-r from-slate-50 to-slate-100 border-b border-slate-200 flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-lg flex items-center justify-center shadow-lg">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <div>
                <h2 className="font-bold text-slate-800 text-base">3D Preview</h2>
                <p className="text-xs text-slate-500">Select a step to focus</p>
              </div>
            </div>
          </div>
          <div className="flex-1 relative bg-gradient-to-br from-slate-900 to-slate-800">
            <Viewer3D project={project} currentStepId={selectedStepId} nodePositions={nodePositions} cameraMode={cameraMode} showStepOverlay={false} />
          </div>
        </div>

        {selectedStep && (
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 flex flex-col overflow-hidden flex-shrink-0">
            <div className="px-5 py-3 bg-gradient-to-r from-slate-50 to-slate-100 border-b border-slate-200 flex items-center gap-3">
              <div className="w-7 h-7 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center shadow-lg">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </div>
              <div>
                <h2 className="font-bold text-slate-800 text-sm">Edit Step</h2>
                <p className="text-xs text-slate-500">Changes are saved automatically</p>
              </div>
            </div>
            <div className="p-4 space-y-3 overflow-y-auto max-h-72">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Title</label>
                <input
                  type="text"
                  value={selectedStep.title}
                  onChange={(e) => updateStep(selectedStep.id, { title: e.target.value })}
                  className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Description</label>
                <RichTextEditor
                  value={selectedStep.description}
                  onChange={(value) => updateStep(selectedStep.id, { description: value })}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Right panel – Guide steps (ordered) */}
      <div className="w-80 bg-white rounded-xl shadow-xl border border-slate-200 flex flex-col overflow-hidden">
        <div className="px-5 py-4 bg-gradient-to-r from-slate-50 to-slate-100 border-b border-slate-200 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg flex items-center justify-center shadow-lg">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
            </div>
            <div>
              <h2 className="font-bold text-slate-800 text-base">Guide Steps</h2>
              <p className="text-xs text-slate-500">Drag to reorder</p>
            </div>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {guide.length === 0 && (
            <p className="text-sm text-slate-400 text-center py-6">No steps in guide yet.<br />Add steps from the model on the left.</p>
          )}
          {guide.map((gs, index) => {
            const step = project.steps.find((s) => s.id === gs.stepId);
            if (!step) return null;
            const isDragging = dragIndex === index;
            const isDragOver = dragOverIndex === index;
            return (
              <div
                key={gs.id}
                draggable
                onDragStart={() => handleDragStart(index)}
                onDragEnter={() => handleDragEnter(index)}
                onDragEnd={handleDragEnd}
                onDragOver={handleDragOver}
                onClick={() => setSelectedStepId(step.id === selectedStepId ? null : step.id)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-grab active:cursor-grabbing transition-all select-none ${isDragging ? 'opacity-40 border-slate-300 bg-slate-100' : isDragOver ? 'border-purple-400 bg-purple-50 shadow-md' : selectedStepId === step.id ? 'border-blue-400 bg-blue-50' : 'border-slate-200 bg-white hover:bg-slate-50'}`}
              >
                <span className="text-slate-400 flex-shrink-0 text-lg leading-none" aria-hidden="true">⠿</span>
                <div className="w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold text-white flex-shrink-0" style={{ backgroundColor: step.highlightColor ?? '#4299e1' }}>
                  {index + 1}
                </div>
                <span className="flex-1 text-sm font-medium text-slate-700 truncate">{step.title}</span>
                <button
                  onClick={(e) => { e.stopPropagation(); removeGuideStep(gs.id); }}
                  title="Remove from guide"
                  className="w-6 h-6 flex items-center justify-center rounded text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all flex-shrink-0"
                >✕</button>
              </div>
            );
          })}
        </div>
        {guide.length > 0 && (
          <div className="px-3 py-2 border-t border-slate-200 bg-slate-50 flex-shrink-0">
            <p className="text-xs text-slate-500 text-center">{guide.length} step{guide.length !== 1 ? 's' : ''} in guide</p>
          </div>
        )}
      </div>
    </div>
  );
};
