import { useState } from 'react';
import DOMPurify from 'dompurify';
import { useAppStore } from '../../store';
import { Viewer3D } from '../Viewer3D/Viewer3D';
import { isHtmlContent } from '../../utils/html';
import { generateShareToken } from '../../services/projects';

export const PreviewMode = ({ onGoToEditorPanel, isPublic, shareToken }: { onGoToEditorPanel?: () => void; isPublic?: boolean; shareToken?: string }) => {
  const { 
    project, 
    currentPreviewStepIndex, 
    setCurrentPreviewStepIndex,
    setPreviewMode,
    nodePositions,
    cameraMode,
    setCameraMode,
    viewMode,
    isGuestMode,
  } = useAppStore();
  const [showCopyNotification, setShowCopyNotification] = useState(false);
  const [isGeneratingLink, setIsGeneratingLink] = useState(false);

  if (!project || project.steps.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <p className="text-gray-500 mb-4">Brak kroków do podglądu</p>
          <button onClick={() => setPreviewMode(false)} className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
            Wyjdź z podglądu
          </button>
        </div>
      </div>
    );
  }

  const guideSteps =
    project.guide && project.guide.length > 0
      ? project.guide
          .map((gs) => project.steps.find((s) => s.id === gs.stepId))
          .filter((s): s is NonNullable<typeof s> => s !== undefined)
      : project.steps;

  const currentStep = guideSteps[currentPreviewStepIndex];
  const canGoPrevious = currentPreviewStepIndex > 0;
  const canGoNext = currentPreviewStepIndex < guideSteps.length - 1;

  const handleShareLink = async () => {
    if (!project) return;
    setIsGeneratingLink(true);
    try {
      const token = await generateShareToken(project.id);
      const shareUrl = `${window.location.origin}/view/${token}`;
      try {
        await navigator.clipboard.writeText(shareUrl);
        setShowCopyNotification(true);
        setTimeout(() => setShowCopyNotification(false), 3000);
      } catch {
        alert(`Udostępnij ten link: ${shareUrl}`);
      }
    } catch {
      alert('Nie udało się wygenerować linku. Spróbuj ponownie.');
    } finally {
      setIsGeneratingLink(false);
    }
  };

  return (
    <div className="w-full h-full relative bg-gradient-to-br from-slate-900 to-slate-800">
      <Viewer3D
        project={project}
        currentStepId={currentStep.id}
        nodePositions={nodePositions}
        cameraMode={cameraMode}
        showStepOverlay={false}
        onStepSelect={(stepId) => {
          const idx = guideSteps.findIndex((s) => s.id === stepId);
          if (idx !== -1) setCurrentPreviewStepIndex(idx);
        }}
        shareToken={shareToken}
      />

      {showCopyNotification && (
        <div className="absolute top-20 right-6 bg-green-500 text-white px-6 py-3 rounded-xl shadow-2xl z-50 flex items-center gap-3">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <span className="font-medium">Link skopiowany do schowka!</span>
        </div>
      )}

      <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-slate-900/80 to-slate-800/80 backdrop-blur-md border-b border-white/10 z-10">
        <div className="px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 bg-black/30 backdrop-blur-sm px-4 py-2 rounded-xl border border-white/10 shadow-xl">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span className="text-sm font-semibold text-white">Kamera:</span>
              </div>
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
          </div>

          <div className="flex items-center gap-3 bg-gradient-to-r from-blue-500/20 to-indigo-600/20 backdrop-blur-sm px-6 py-2 rounded-xl border border-blue-400/30 shadow-xl">
            <div className="w-2 h-2 bg-blue-400 rounded-full shadow-lg shadow-blue-400/50 motion-safe:animate-pulse" aria-hidden="true"></div>
            <span className="text-sm font-bold text-white">Tryb podglądu</span>
          </div>

          <div className="flex items-center gap-3">
            {!isPublic && (
              isGuestMode ? (
                <div className="relative group">
                  <button
                    disabled
                    aria-label="Udostępnij link – Zarejestrowani użytkownicy mogą udostępniać model innym generując link"
                    className="flex items-center gap-2 px-5 py-2 bg-gray-600/50 text-gray-400 rounded-xl cursor-not-allowed font-medium opacity-70"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                    </svg>
                    Udostępnij link
                  </button>
                  <div className="absolute right-0 top-full mt-2 w-72 bg-slate-800 text-white text-xs rounded-lg px-3 py-2 shadow-xl z-50 hidden group-hover:block border border-white/10 pointer-events-none">
                    Zarejestrowani użytkownicy mogą udostępniać model innym generując link
                  </div>
                </div>
              ) : (
                <button
                  onClick={handleShareLink}
                  disabled={isGeneratingLink}
                  className={`flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-xl hover:from-purple-600 hover:to-pink-700 transition-all duration-200 shadow-xl shadow-purple-500/30 font-medium ${isGeneratingLink ? 'opacity-70 cursor-not-allowed' : ''}`}
                >
                  {isGeneratingLink ? (
                    <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                    </svg>
                  )}
                  {isGeneratingLink ? 'Generowanie...' : 'Udostępnij link'}
                </button>
              )
            )}
            {viewMode === 'view' && onGoToEditorPanel && (
              <button
                onClick={onGoToEditorPanel}
                className="flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all duration-200 shadow-xl shadow-green-500/30 font-medium"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Przejdź do panelu edytora
              </button>
            )}
            {!isPublic && (
              <button
                onClick={() => setPreviewMode(false)}
                className="flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-red-500 to-rose-600 text-white rounded-xl hover:from-red-600 hover:to-rose-700 transition-all duration-200 shadow-xl shadow-red-500/30 font-medium"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Wyjdź z podglądu
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="absolute top-24 left-6 bg-black/40 backdrop-blur-md text-white px-6 py-4 rounded-xl shadow-2xl border border-white/10 max-w-md z-10 flex flex-col max-h-[calc(100vh-14rem)]">
        <div className="flex items-start gap-3 flex-shrink-0">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center flex-shrink-0 shadow-lg">
            <span className="text-lg font-bold">{currentPreviewStepIndex + 1}</span>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-bold mb-1">{currentStep.title}</h3>
          </div>
        </div>
        {currentStep.description && (
          <div className="flex-1 overflow-y-auto dark-scrollbar mt-2 min-h-0">
            {isHtmlContent(currentStep.description) ? (
              <div
                className="text-sm text-slate-300 leading-relaxed rich-text-preview"
                dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(currentStep.description) }}
              />
            ) : (
              <p className="text-sm text-slate-300 leading-relaxed">{currentStep.description}</p>
            )}
          </div>
        )}
      </div>

      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-10">
        <div className="bg-black/40 backdrop-blur-md text-white px-8 py-5 rounded-2xl shadow-2xl border border-white/10">
          <div className="flex items-center gap-6">
            <button
              onClick={() => canGoPrevious && setCurrentPreviewStepIndex(currentPreviewStepIndex - 1)}
              disabled={!canGoPrevious}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium transition-all duration-200 ${canGoPrevious ? 'bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 shadow-lg shadow-blue-500/30' : 'bg-white/10 cursor-not-allowed opacity-50'}`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Poprzedni
            </button>

            <div className="text-center min-w-[140px] px-4">
              <div className="text-xs text-slate-400 uppercase tracking-wider mb-1">Krok</div>
              <div className="text-2xl font-bold text-blue-300" aria-label={`Step ${currentPreviewStepIndex + 1} of ${guideSteps.length}`}>
                {currentPreviewStepIndex + 1} / {guideSteps.length}
              </div>
            </div>

            <button
              onClick={() => canGoNext && setCurrentPreviewStepIndex(currentPreviewStepIndex + 1)}
              disabled={!canGoNext}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium transition-all duration-200 ${canGoNext ? 'bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 shadow-lg shadow-blue-500/30' : 'bg-white/10 cursor-not-allowed opacity-50'}`}
            >
              Następny
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          <div className="mt-5 flex gap-2 justify-center pt-4 border-t border-white/10">
            {guideSteps.map((step, index) => (
              <button
                key={step.id}
                onClick={() => setCurrentPreviewStepIndex(index)}
                className={`rounded-full transition-all duration-200 ${index === currentPreviewStepIndex ? 'w-8 h-3 bg-gradient-to-r from-blue-400 to-indigo-500 shadow-lg shadow-blue-400/50' : 'w-3 h-3 bg-white/30 hover:bg-white/50 hover:scale-110'}`}
                title={step.title}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
