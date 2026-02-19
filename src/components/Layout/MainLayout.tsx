import { useEffect } from 'react';
import { useAppStore } from '../../store';
import { StepBuilder } from '../StepBuilder/StepBuilder';
import { Viewer3D } from '../Viewer3D/Viewer3D';
import { StepProperties } from '../StepProperties/StepProperties';
import { PreviewMode } from '../PreviewMode/PreviewMode';
import { sampleProject } from '../../utils/sampleData';

interface MainLayoutProps {
  onBackToProjectList?: () => void;
  onGoToEditorPanel?: () => void;
  useSampleProjectFallback?: boolean;
}

export const MainLayout = ({ onBackToProjectList, onGoToEditorPanel, useSampleProjectFallback = true }: MainLayoutProps) => {
  const { 
    project, 
    selectedStepId, 
    isPreviewMode, 
    setPreviewMode, 
    setProject,
    loadFromLocalStorage,
    nodePositions,
    cameraMode,
    setCameraMode
  } = useAppStore();

  // Load project on mount
  useEffect(() => {
    loadFromLocalStorage();
  }, [loadFromLocalStorage]);

  // Set sample project if none loaded and fallback is enabled
  useEffect(() => {
    if (!project && useSampleProjectFallback) {
      setProject(sampleProject);
    }
  }, [project, setProject, useSampleProjectFallback]);

  const handleTogglePreview = () => {
    setPreviewMode(!isPreviewMode);
  };

  const handleToggleCameraMode = () => {
    setCameraMode(cameraMode === 'auto' ? 'free' : 'auto');
  };

  const handleLoadSample = () => {
    if (window.confirm('Load sample project? This will replace your current project.')) {
      setProject(sampleProject);
    }
  };

  if (isPreviewMode) {
    return (
      <div className="w-screen h-screen">
        <PreviewMode onGoToEditorPanel={onGoToEditorPanel} />
      </div>
    );
  }

  // Editor mode - full editing interface
  return (
    <div className="w-screen h-screen flex flex-col bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Modern Top Bar with gradient */}
      <div className="h-16 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white flex items-center justify-between px-6 shadow-xl border-b border-slate-700">
        <div className="flex items-center gap-4">
          {onBackToProjectList && (
            <button
              onClick={onBackToProjectList}
              className="px-4 py-2 bg-slate-700/50 backdrop-blur-sm rounded-lg hover:bg-slate-600/50 transition-all duration-200 flex items-center gap-2 border border-slate-600/30 shadow-lg hover:shadow-slate-500/20"
              title="Powrót do listy projektów"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span className="text-sm font-medium">Projekty</span>
            </button>
          )}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center shadow-lg" aria-hidden="true">
              <span className="text-xl" role="img" aria-label="Document">📝</span>
            </div>
            <div>
              <h1 className="text-lg font-bold">3D Instruction Builder</h1>
              {project && (
                <span className="text-xs text-slate-300 font-medium">
                  {project.name}
                </span>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="px-4 py-2 bg-green-500/20 backdrop-blur-sm rounded-lg border border-green-500/30 shadow-lg flex items-center gap-2">
            <div className="w-2 h-2 bg-green-400 rounded-full shadow-lg shadow-green-400/50 motion-safe:animate-pulse" aria-hidden="true"></div>
            <span className="text-sm font-medium text-green-300">Editor Mode</span>
          </div>
          <button
            onClick={handleToggleCameraMode}
            className={`px-4 py-2 rounded-lg transition-all duration-200 text-sm font-medium shadow-lg ${
              cameraMode === 'free' 
                ? 'bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 shadow-emerald-500/30' 
                : 'bg-slate-700/50 backdrop-blur-sm hover:bg-slate-600/50 border border-slate-600/30'
            }`}
          >
            {cameraMode === 'free' ? '📷 Free Camera' : '📷 Auto Camera'}
          </button>
          <button
            onClick={handleLoadSample}
            className="px-4 py-2 bg-slate-700/50 backdrop-blur-sm rounded-lg hover:bg-slate-600/50 transition-all duration-200 text-sm font-medium border border-slate-600/30 shadow-lg"
          >
            Load Sample
          </button>
          <button
            onClick={handleTogglePreview}
            className="px-5 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg hover:from-blue-600 hover:to-indigo-700 transition-all duration-200 font-medium shadow-lg shadow-blue-500/30 flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Preview Mode
          </button>
        </div>
      </div>

      {/* Main Content - Modern 3-Panel Layout */}
      <div className="flex-1 flex overflow-hidden gap-1 p-1">
        {/* Left Panel - Step Management (Properties Editor) */}
        <div className="w-80 bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden">
          <div className="h-full flex flex-col">
            {/* Panel Header */}
            <div className="px-5 py-4 bg-gradient-to-r from-slate-50 to-slate-100 border-b border-slate-200">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-amber-600 rounded-lg flex items-center justify-center shadow-lg" aria-hidden="true">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                  </svg>
                </div>
                <div>
                  <h2 className="font-bold text-slate-800 text-base">Step Management</h2>
                  <p className="text-xs text-slate-500">Add and configure steps</p>
                </div>
              </div>
            </div>
            {/* Content */}
            <div className="flex-1 overflow-y-auto bg-slate-50">
              <StepProperties />
            </div>
          </div>
        </div>

        {/* Center Panel - 3D Preview */}
        <div className="w-96 bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden">
          <div className="h-full flex flex-col">
            {/* Panel Header */}
            <div className="px-5 py-4 bg-gradient-to-r from-slate-50 to-slate-100 border-b border-slate-200">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-lg flex items-center justify-center shadow-lg" aria-hidden="true">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                </div>
                <div>
                  <h2 className="font-bold text-slate-800 text-base">3D Preview</h2>
                  <p className="text-xs text-slate-500">Live model view</p>
                </div>
              </div>
            </div>
            {/* 3D Viewer Content */}
            <div className="flex-1 relative bg-gradient-to-br from-slate-900 to-slate-800">
              <Viewer3D project={project} currentStepId={selectedStepId} nodePositions={nodePositions} cameraMode={cameraMode} />
              {!selectedStepId && project && project.steps.length > 0 && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="bg-black/60 backdrop-blur-sm text-white px-6 py-4 rounded-xl shadow-2xl border border-white/10">
                    <p className="text-center text-sm font-medium">Select a step to preview it in 3D</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Panel - Edit Panel (Step Flow Editor) */}
        <div className="flex-1 min-w-[400px] bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden">
          <div className="h-full flex flex-col">
            {/* Panel Header */}
            <div className="px-5 py-4 bg-gradient-to-r from-slate-50 to-slate-100 border-b border-slate-200">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg flex items-center justify-center shadow-lg" aria-hidden="true">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z" />
                  </svg>
                </div>
                <div>
                  <h2 className="font-bold text-slate-800 text-base">Edit Panel</h2>
                  <p className="text-xs text-slate-500">Design your instruction flow</p>
                </div>
              </div>
            </div>
            {/* Content */}
            <div className="flex-1 bg-slate-50">
              <StepBuilder />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
