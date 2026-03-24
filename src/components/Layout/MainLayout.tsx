import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../../store';
import { StepBuilder } from '../StepBuilder/StepBuilder';
import { Viewer3D } from '../Viewer3D/Viewer3D';
import { StepProperties } from '../StepProperties/StepProperties';
import { PreviewMode } from '../PreviewMode/PreviewMode';
import { GuideBuilder } from '../GuideBuilder/GuideBuilder';
import { UploadModelEditor, UploadPreviewMode } from '../UploadModelEditor';
import { sampleProject, sampleNodePositions } from '../../utils/sampleData';

const GuestModeBanner = ({ onLogin }: { onLogin: () => void }) => (
  <div className="flex items-center justify-between gap-3 px-6 py-2 bg-yellow-50 border-b border-yellow-200 text-sm">
    <div className="flex items-center gap-2 text-yellow-800">
      <svg className="w-4 h-4 flex-shrink-0 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
      </svg>
      <span>
        <strong>Tryb gościa</strong> — wszystkie opcje, w tym udostępnianie modelu, są dostępne po zalogowaniu.
      </span>
    </div>
    <button
      onClick={onLogin}
      className="flex-shrink-0 px-3 py-1 text-xs font-semibold text-white bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg hover:from-blue-600 hover:to-indigo-700 transition-colors shadow-sm"
    >
      Zaloguj się
    </button>
  </div>
);

interface MainLayoutProps {
  onBackToProjectList?: () => void;
  onGoToEditorPanel?: () => void;
  useSampleProjectFallback?: boolean;
}

export const MainLayout = ({ onBackToProjectList, onGoToEditorPanel, useSampleProjectFallback = true }: MainLayoutProps) => {
  const navigate = useNavigate();
  const { 
    project, 
    selectedStepId, 
    isPreviewMode, 
    setPreviewMode, 
    setProject,
    nodePositions,
    cameraMode,
    setCameraMode,
    editorMode,
    setEditorMode,
    setSelectedStepId,
    isGuestMode,
    clearGuestMode,
  } = useAppStore();

  useEffect(() => {
    if (!project && useSampleProjectFallback) {
      setProject(sampleProject, sampleNodePositions);
    }
  }, [project, setProject, useSampleProjectFallback]);

  const [panelWidth, setPanelWidth] = useState(320);
  const [isResizing, setIsResizing] = useState(false);
  const isResizingRef = useRef(false);
  const startXRef = useRef(0);
  const startWidthRef = useRef(320);

  const handleResizeStart = (e: React.MouseEvent) => {
    e.preventDefault();
    isResizingRef.current = true;
    setIsResizing(true);
    startXRef.current = e.clientX;
    startWidthRef.current = panelWidth;
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizingRef.current) return;
      const delta = e.clientX - startXRef.current;
      const newWidth = Math.max(240, Math.min(600, startWidthRef.current + delta));
      setPanelWidth(newWidth);
    };
    const handleMouseUp = () => {
      if (isResizingRef.current) {
        isResizingRef.current = false;
        setIsResizing(false);
      }
    };
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  const handleTogglePreview = () => { setPreviewMode(!isPreviewMode); };
  const handleToggleCameraMode = () => { setCameraMode(cameraMode === 'auto' ? 'free' : 'auto'); };
  const handleLoadSample = () => {
    if (window.confirm('Załadować przykładowy projekt? To zastąpi bieżący projekt.')) {
      setProject(sampleProject, sampleNodePositions);
    }
  };

  if (isPreviewMode) {
    if (project?.projectType === 'upload') {
      return <div className="w-screen h-screen"><UploadPreviewMode onGoToEditorPanel={onGoToEditorPanel} /></div>;
    }
    return <div className="w-screen h-screen"><PreviewMode onGoToEditorPanel={onGoToEditorPanel} /></div>;
  }

  if (project?.projectType === 'upload') {
    return (
      <div className="w-screen h-screen flex flex-col bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="h-16 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white flex items-center justify-between px-6 shadow-xl border-b border-slate-700">
          <div className="flex items-center gap-4">
            {onBackToProjectList && (
              <button onClick={onBackToProjectList} className="px-4 py-2 bg-slate-700/50 backdrop-blur-sm rounded-lg hover:bg-slate-600/50 transition-all duration-200 flex items-center gap-2 border border-slate-600/30 shadow-lg" title="Powrót do listy projektów">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                <span className="text-sm font-medium">{isGuestMode ? 'Wróć' : 'Projekty'}</span>
              </button>
            )}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center shadow-lg" aria-hidden="true">
                <span className="text-xl" role="img" aria-label="Upload">📤</span>
              </div>
              <div>
                <h1 className="text-lg font-bold">Dokumentacja modelu 3D{isGuestMode && <span className="ml-2 text-xs font-normal text-yellow-300 bg-yellow-500/20 px-2 py-0.5 rounded-full">Tryb gościa</span>}</h1>
                {project && <span className="text-xs text-slate-300 font-medium">{project.name}</span>}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="px-4 py-2 bg-green-500/20 backdrop-blur-sm rounded-lg border border-green-500/30 shadow-lg flex items-center gap-2">
              <div className="w-2 h-2 bg-green-400 rounded-full shadow-lg shadow-green-400/50 motion-safe:animate-pulse" aria-hidden="true"></div>
              <span className="text-sm font-medium text-green-300">Tryb edytora</span>
            </div>
          </div>
        </div>
        {isGuestMode && (
          <GuestModeBanner onLogin={() => { clearGuestMode(); navigate('/login'); }} />
        )}
        <div className="flex-1 flex overflow-hidden gap-1 p-1">
          <UploadModelEditor />
        </div>
      </div>
    );
  }

  return (
    <div className="w-screen h-screen flex flex-col bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="h-16 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white flex items-center justify-between px-6 shadow-xl border-b border-slate-700">
        <div className="flex items-center gap-4">
          {onBackToProjectList && (
            <button onClick={onBackToProjectList} className="px-4 py-2 bg-slate-700/50 backdrop-blur-sm rounded-lg hover:bg-slate-600/50 transition-all duration-200 flex items-center gap-2 border border-slate-600/30 shadow-lg hover:shadow-slate-500/20" title="Powrót do listy projektów">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span className="text-sm font-medium">{isGuestMode ? 'Wróć' : 'Projekty'}</span>
            </button>
          )}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center shadow-lg" aria-hidden="true">
              <span className="text-xl" role="img" aria-label="Document">📝</span>
            </div>
            <div>
              <h1 className="text-lg font-bold">Kreator instrukcji 3D{isGuestMode && <span className="ml-2 text-xs font-normal text-yellow-300 bg-yellow-500/20 px-2 py-0.5 rounded-full">Tryb gościa</span>}</h1>
              {project && <span className="text-xs text-slate-300 font-medium">{project.name}</span>}
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="px-4 py-2 bg-green-500/20 backdrop-blur-sm rounded-lg border border-green-500/30 shadow-lg flex items-center gap-2">
            <div className="w-2 h-2 bg-green-400 rounded-full shadow-lg shadow-green-400/50 motion-safe:animate-pulse" aria-hidden="true"></div>
            <span className="text-sm font-medium text-green-300">Tryb edytora</span>
          </div>

          <div className="flex items-center bg-slate-700/50 rounded-lg p-1 border border-slate-600/30">
            <button
              onClick={() => setEditorMode('model')}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all duration-200 ${editorMode === 'model' ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg' : 'text-slate-300 hover:text-white'}`}
            >🧱 Kreator modelu</button>
            <button
              onClick={() => setEditorMode('guide')}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all duration-200 ${editorMode === 'guide' ? 'bg-gradient-to-r from-purple-500 to-indigo-600 text-white shadow-lg' : 'text-slate-300 hover:text-white'}`}
            >📋 Kreator przewodnika</button>
          </div>

          <button
            onClick={handleToggleCameraMode}
            className={`px-4 py-2 rounded-lg transition-all duration-200 text-sm font-medium shadow-lg ${cameraMode === 'free' ? 'bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 shadow-emerald-500/30' : 'bg-slate-700/50 backdrop-blur-sm hover:bg-slate-600/50 border border-slate-600/30'}`}
          >
            {cameraMode === 'free' ? '📷 Wolna kamera' : '📷 Auto kamera'}
          </button>
          <button onClick={handleLoadSample} className="px-4 py-2 bg-slate-700/50 backdrop-blur-sm rounded-lg hover:bg-slate-600/50 transition-all duration-200 text-sm font-medium border border-slate-600/30 shadow-lg">
            Załaduj przykład
          </button>
          <button
            onClick={handleTogglePreview}
            className="px-5 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg hover:from-blue-600 hover:to-indigo-700 transition-all duration-200 font-medium shadow-lg shadow-blue-500/30 flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Podgląd
          </button>
        </div>
      </div>

      {/* Guest mode info banner */}
      {isGuestMode && (
        <GuestModeBanner onLogin={() => { clearGuestMode(); navigate('/login'); }} />
      )}

      <div className={`flex-1 flex overflow-hidden gap-0 p-1.5${isResizing ? ' cursor-col-resize select-none' : ''}`}>
        {editorMode === 'guide' ? (
          <GuideBuilder />
        ) : (
          <>
            {/* Left panel – Step properties */}
            <div className="flex-shrink-0 bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden flex flex-col" style={{ width: panelWidth }}>
              <div className="px-5 py-3.5 bg-gradient-to-r from-slate-50 to-slate-100 border-b border-slate-200 flex-shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-amber-600 rounded-lg flex items-center justify-center shadow-md" aria-hidden="true">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="font-bold text-slate-800 text-sm">Właściwości kroku</h2>
                    <p className="text-xs text-slate-500">Dodaj i skonfiguruj kroki</p>
                  </div>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto bg-slate-50"><StepProperties /></div>
            </div>

            {/* Resize handle */}
            <div
              className="flex-shrink-0 w-1.5 cursor-col-resize relative group"
              onMouseDown={handleResizeStart}
              title="Przeciągnij, aby zmienić szerokość panelu"
            >
              <div className={`absolute inset-y-0 left-1/2 w-0.5 -translate-x-1/2 rounded-full transition-colors ${isResizing ? 'bg-blue-400' : 'bg-transparent group-hover:bg-blue-400'}`} />
            </div>

            {/* Center panel – Model flow builder */}
            <div className="flex-1 min-w-0 bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden flex flex-col ml-1.5">
              <div className="px-5 py-3.5 bg-gradient-to-r from-slate-50 to-slate-100 border-b border-slate-200 flex-shrink-0">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg flex items-center justify-center shadow-md" aria-hidden="true">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z" />
                      </svg>
                    </div>
                    <div>
                      <h2 className="font-bold text-slate-800 text-sm">Kreator modelu</h2>
                      <p className="text-xs text-slate-500">
                        Projektuj przepływ modelu 3D
                        {project && project.steps.length > 0 && (
                          <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-700">
                            {project.steps.length} {
                              project.steps.length === 1 ? 'krok' :
                              [2,3,4].includes(project.steps.length % 10) && ![12,13,14].includes(project.steps.length % 100) ? 'kroki' :
                              'kroków'
                            }
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="text-xs text-slate-400 hidden lg:block">Przeciągnij węzły · Połącz strzałkami</div>
                </div>
              </div>
              <div className="flex-1 min-h-0"><StepBuilder /></div>
            </div>

            {/* Right panel – 3D Preview */}
            <div className="w-96 flex-shrink-0 bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden flex flex-col ml-1.5">
              <div className="px-5 py-3.5 bg-gradient-to-r from-slate-900 to-slate-800 border-b border-slate-700 flex-shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center shadow-md" aria-hidden="true">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="font-bold text-white text-sm">Podgląd 3D</h2>
                    <p className="text-xs text-slate-400">Widok modelu na żywo</p>
                  </div>
                </div>
              </div>
              <div className="flex-1 relative bg-gradient-to-br from-slate-900 to-slate-800 min-h-0">
                <Viewer3D project={project} currentStepId={selectedStepId} nodePositions={nodePositions} cameraMode={cameraMode} onStepSelect={setSelectedStepId} />
                {!selectedStepId && project && project.steps.length > 0 && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="bg-black/60 backdrop-blur-sm text-white px-5 py-3 rounded-xl shadow-2xl border border-white/10 mx-4 text-center">
                      <svg className="w-8 h-8 mx-auto mb-2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5" />
                      </svg>
                      <p className="text-sm font-medium">Wybierz krok, aby zobaczyć podgląd 3D</p>
                    </div>
                  </div>
                )}
                {!project || project.steps.length === 0 ? (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="text-center px-4">
                      <svg className="w-12 h-12 mx-auto mb-3 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                      </svg>
                      <p className="text-sm text-slate-500 font-medium">Brak kroków</p>
                      <p className="text-xs text-slate-600 mt-1">Dodaj krok, aby zobaczyć podgląd</p>
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
