import { useState } from 'react';
import { useAppStore } from '../../store';
import { UploadedModelCanvas } from '../UploadModelEditor/UploadedModelCanvas';
import type { MeshHighlight } from '../UploadModelEditor/UploadedModelCanvas';
import { generateShareToken } from '../../services/projects';

export const UploadPreviewMode = ({ onGoToEditorPanel }: { onGoToEditorPanel?: () => void }) => {
  const {
    project,
    currentPreviewStepIndex,
    setCurrentPreviewStepIndex,
    setPreviewMode,
    viewMode,
  } = useAppStore();
  const [showCopyNotification, setShowCopyNotification] = useState(false);
  const [isGeneratingLink, setIsGeneratingLink] = useState(false);
  const [cameraMode, setCameraMode] = useState<'auto' | 'free'>('auto');

  if (!project || !project.projectModelUrl) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <p className="text-gray-500 mb-4">Brak modelu do podglądu</p>
          <button onClick={() => setPreviewMode(false)} className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
            Wyjdź z podglądu
          </button>
        </div>
      </div>
    );
  }

  const steps = project.steps;

  if (steps.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800">
        <div className="text-center text-white">
          <p className="text-lg mb-4">Brak kroków do wyświetlenia</p>
          <button onClick={() => setPreviewMode(false)} className="px-4 py-2 bg-blue-500 hover:bg-blue-600 rounded-lg transition">
            Wyjdź z podglądu
          </button>
        </div>
      </div>
    );
  }

  const currentStep = steps[currentPreviewStepIndex];
  const canGoPrevious = currentPreviewStepIndex > 0;
  const canGoNext = currentPreviewStepIndex < steps.length - 1;

  const targetCamera = (() => {
    const cam = currentStep.cameraPosition;
    if (cam && cam.targetX !== undefined && cam.targetY !== undefined && cam.targetZ !== undefined) {
      return cam;
    }
    if (currentStep.focusPoint) {
      const [fx, fy, fz] = currentStep.focusPoint;
      return { x: fx + 5, y: fy + 5, z: fz + 5, targetX: fx, targetY: fy, targetZ: fz };
    }
    return { x: 5, y: 5, z: 5, targetX: 0, targetY: 0, targetZ: 0 };
  })();

  const stepHighlights: MeshHighlight[] = currentStep.focusMeshName
    ? [{ name: currentStep.focusMeshName, color: currentStep.highlightColor ?? '#4299e1' }]
    : [];

  const focusedMeshName = currentStep.focusMeshName;

  const handleShareLink = async () => {
    if (project) {
      setIsGeneratingLink(true);
      try {
        const token = await generateShareToken(project.id);
        const shareUrl = `${window.location.origin}/view/${token}`;
        try {
          await navigator.clipboard.writeText(shareUrl);
          setShowCopyNotification(true);
          setTimeout(() => setShowCopyNotification(false), 3000);
        } catch {
          alert(`Skopiuj ten link: ${shareUrl}`);
        }
      } catch {
        alert('Nie udało się wygenerować linku. Spróbuj ponownie.');
      } finally {
        setIsGeneratingLink(false);
      }
    }
  };

  return (
    <div className="w-full h-full relative bg-gradient-to-br from-slate-900 to-slate-800">
      <UploadedModelCanvas
        modelUrl={project.projectModelUrl}
        cameraMode={cameraMode}
        targetCamera={targetCamera}
        stepHighlights={stepHighlights}
        focusedMeshName={focusedMeshName}
        stepTitle={currentStep.title}
        stepDescription={currentStep.description}
        stepIndex={currentPreviewStepIndex}
        showGrid={false}
      />

      {showCopyNotification && (
        <div className="absolute top-20 right-6 bg-green-500 text-white px-6 py-3 rounded-xl shadow-2xl z-50 flex items-center gap-3">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <span className="font-medium">Link skopiowany!</span>
        </div>
      )}

      <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-slate-900/80 to-slate-800/80 backdrop-blur-md border-b border-white/10 z-10">
        <div className="px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3 bg-black/30 backdrop-blur-sm px-4 py-2 rounded-xl border border-white/10 shadow-xl">
            <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="text-sm font-semibold text-white">Kamera:</span>
            <div className="flex gap-2">
              <button
                onClick={() => setCameraMode('auto')}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${cameraMode === 'auto' ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/30' : 'bg-white/10 text-slate-300 hover:bg-white/20'}`}
              >Auto</button>
              <button
                onClick={() => setCameraMode('free')}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${cameraMode === 'free' ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/30' : 'bg-white/10 text-slate-300 hover:bg-white/20'}`}
              >Swobodna</button>
            </div>
          </div>

          <div className="flex items-center gap-3 bg-gradient-to-r from-green-500/20 to-emerald-600/20 backdrop-blur-sm px-6 py-2 rounded-xl border border-green-400/30 shadow-xl">
            <div className="w-2 h-2 bg-green-400 rounded-full motion-safe:animate-pulse" aria-hidden="true"></div>
            <span className="text-sm font-bold text-white">Podgląd modelu</span>
          </div>

          <div className="flex items-center gap-3">
            <button onClick={handleShareLink} disabled={isGeneratingLink} className={`flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-xl hover:from-purple-600 hover:to-pink-700 transition-all duration-200 shadow-xl font-medium ${isGeneratingLink ? 'opacity-70 cursor-not-allowed' : ''}`}>
              {isGeneratingLink ? (
                <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
              )}
              {isGeneratingLink ? 'Generowanie...' : 'Share Link'}
            </button>
            {viewMode === 'view' && onGoToEditorPanel && (
              <button onClick={onGoToEditorPanel} className="flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all duration-200 shadow-xl font-medium">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Przejdź do panelu edytora
              </button>
            )}
            <button onClick={() => setPreviewMode(false)} className="flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-red-500 to-rose-600 text-white rounded-xl hover:from-red-600 hover:to-rose-700 transition-all duration-200 shadow-xl font-medium">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Wyjdź
            </button>
          </div>
        </div>
      </div>

      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-10">
        <div className="bg-black/40 backdrop-blur-md text-white px-8 py-5 rounded-2xl shadow-2xl border border-white/10">
          <div className="flex items-center gap-6">
            <button
              onClick={() => canGoPrevious && setCurrentPreviewStepIndex(currentPreviewStepIndex - 1)}
              disabled={!canGoPrevious}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium transition-all duration-200 ${canGoPrevious ? 'bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 shadow-lg' : 'bg-white/10 cursor-not-allowed opacity-50'}`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Poprzedni
            </button>

            <div className="text-center min-w-[140px] px-4">
              <div className="text-xs text-slate-400 uppercase tracking-wider mb-1">Krok</div>
              <div className="text-2xl font-bold text-blue-300">{currentPreviewStepIndex + 1} / {steps.length}</div>
            </div>

            <button
              onClick={() => canGoNext && setCurrentPreviewStepIndex(currentPreviewStepIndex + 1)}
              disabled={!canGoNext}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium transition-all duration-200 ${canGoNext ? 'bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 shadow-lg' : 'bg-white/10 cursor-not-allowed opacity-50'}`}
            >
              Następny
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          <div className="mt-5 flex gap-2 justify-center pt-4 border-t border-white/10">
            {steps.map((step, index) => (
              <button
                key={step.id}
                onClick={() => setCurrentPreviewStepIndex(index)}
                className={`rounded-full transition-all duration-200 ${index === currentPreviewStepIndex ? 'w-8 h-3 bg-gradient-to-r from-blue-400 to-indigo-500 shadow-lg' : 'w-3 h-3 bg-white/30 hover:bg-white/50 hover:scale-110'}`}
                title={step.title}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
