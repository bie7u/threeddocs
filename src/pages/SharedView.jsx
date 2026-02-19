import { useEffect, useMemo, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppStore } from '../store';
import { PreviewMode } from '../components/PreviewMode/PreviewMode';
import { UploadPreviewMode } from '../components/UploadModelEditor';

const PROJECTS_KEY = '3ddoc-projects';

const SharedView = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { project, setProject, setPreviewMode, isPreviewMode } = useAppStore();
  const previewStarted = useRef(false);

  // Load the saved project synchronously (no state needed – projectId from URL is stable)
  const savedProject = useMemo(() => {
    const stored = localStorage.getItem(PROJECTS_KEY);
    if (!stored) return null;
    try {
      const projects = JSON.parse(stored);
      return projects.find((p) => p.project.id === projectId) ?? null;
    } catch {
      return null;
    }
  }, [projectId]);

  useEffect(() => {
    if (savedProject) {
      setProject(savedProject.project, savedProject.nodePositions);
      setPreviewMode(true);
      previewStarted.current = true;
    }
  }, [savedProject, setProject, setPreviewMode]);

  // When user exits preview, navigate to home
  useEffect(() => {
    if (previewStarted.current && !isPreviewMode) {
      navigate('/');
    }
  }, [isPreviewMode, navigate]);

  if (!savedProject) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800">
        <div className="text-white text-center px-6">
          <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold mb-2">Model nie znaleziony</h1>
          <p className="text-slate-400 mb-6 max-w-sm">
            Ten link może być nieważny lub model został usunięty.
          </p>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 rounded-xl font-medium transition-all shadow-lg shadow-blue-500/30"
          >
            Wróć do strony głównej
          </button>
        </div>
      </div>
    );
  }

  // Show loading while the store is being initialized (brief, between mount and first effect)
  if (!isPreviewMode) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800">
        <div className="text-white text-center">
          <div className="w-12 h-12 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p>Ładowanie modelu...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-screen h-screen">
      {project.projectType === 'upload' ? (
        <UploadPreviewMode />
      ) : (
        <PreviewMode />
      )}
    </div>
  );
};

export default SharedView;


