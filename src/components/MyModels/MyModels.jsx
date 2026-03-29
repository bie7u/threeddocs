import { useState, useEffect, useCallback } from 'react';
import { useAppStore } from '../../store';
import { generateShareToken, fetchProjectsPage } from '../../services/projects';
import { Footer } from '../Footer/Footer';
import { useTranslation } from '../../hooks/useTranslation';

const PAGE_SIZE = 10;

export const MyModels = ({ onOpenEditor, onClose }) => {
  const { t } = useTranslation();
  const { deleteProject, setProject, setPreviewMode } = useAppStore();
  const [copiedId, setCopiedId] = useState(null);
  const [shareError, setShareError] = useState(null);
  const [sharingId, setSharingId] = useState(null);

  // Pagination state
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [hasNext, setHasNext] = useState(false);
  const [hasPrevious, setHasPrevious] = useState(false);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  // Search state
  const [search, setSearch] = useState('');

  const loadPage = useCallback(async (p, q) => {
    setLoading(true);
    setLoadError(null);
    try {
      const result = await fetchProjectsPage(p, q || undefined);
      setProjects(result.results);
      setTotalCount(result.count);
      setHasNext(result.hasNext);
      setHasPrevious(result.hasPrevious);
    } catch {
      setLoadError('Nie udało się załadować modeli. Spróbuj ponownie.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadPage(page, search);
    }, search ? 300 : 0);
    return () => clearTimeout(timer);
  }, [page, search, loadPage]);

  const handleSearch = (value) => {
    setSearch(value);
    setPage(1);
  };

  const handleOpenEditor = (savedProject) => {
    setProject(savedProject.project, savedProject.nodePositions);
    onOpenEditor();
  };

  const handlePreview = (savedProject) => {
    setProject(savedProject.project, savedProject.nodePositions);
    setPreviewMode(true);
    onOpenEditor();
  };

  const handleShare = async (projectId) => {
    setSharingId(projectId);
    setShareError(null);
    try {
      const token = await generateShareToken(projectId);
      const shareUrl = `${window.location.origin}/view/${token}`;
      try {
        await navigator.clipboard.writeText(shareUrl);
        setCopiedId(projectId);
        setTimeout(() => setCopiedId(null), 3000);
      } catch {
        setShareError(shareUrl);
      }
    } catch {
      setShareError('Nie udało się wygenerować linku. Spróbuj ponownie.');
    } finally {
      setSharingId(null);
    }
  };

  const handleDelete = async (projectId) => {
    if (window.confirm(`${t.myModels.deleteConfirm} "${projects.find(p => p.project.id === projectId)?.project.name}"?`)) {
      try {
        await deleteProject(projectId);
        // If we just removed the only item on a non-first page, go back
        if (projects.length === 1 && page > 1) {
          setPage((p) => p - 1);
        } else {
          loadPage(page, search);
        }
      } catch {
        // deletion failed — reload page to restore the list
        loadPage(page, search);
      }
    }
  };

  const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleDateString('pl-PL', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex flex-col">
      {/* Navigation Bar */}
      <nav className="bg-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <button
                onClick={onClose}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
                title={t.nav.dashboard}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                <span className="text-sm font-medium">{t.nav.dashboard}</span>
              </button>
              <div className="flex items-center">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center transform rotate-12">
                  <svg
                    className="w-6 h-6 text-white transform -rotate-12"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                    />
                  </svg>
                </div>
                <span className="ml-3 text-xl font-bold text-gray-900">{t.myModels.title}</span>
              </div>
            </div>
            <div className="text-sm text-gray-500">
              {loading
                ? t.common.loading
                : totalCount === 0
                  ? t.myModels.noModels
                  : `${totalCount} ${totalCount === 1 ? 'model' : totalCount < 5 ? 'modele' : 'modeli'}`}
            </div>
          </div>
        </div>
      </nav>

      {/* Search bar */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="relative max-w-md">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder={t.myModels.search}
              className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="w-full flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Clipboard fallback: show inline error when clipboard API is unavailable */}
        {shareError && (
          <div className="mb-6 flex items-center justify-between gap-4 px-5 py-3 bg-yellow-50 border border-yellow-300 rounded-xl text-sm text-yellow-800">
            <span>
              Nie można skopiować automatycznie. Skopiuj ręcznie:{' '}
              <span className="font-mono break-all">{shareError}</span>
            </span>
            <button
              onClick={() => setShareError(null)}
              className="flex-shrink-0 text-yellow-600 hover:text-yellow-800 transition-colors"
              aria-label="Zamknij"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}

        {/* Load error */}
        {loadError && (
          <div className="mb-6 px-5 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
            {loadError}
          </div>
        )}

        {/* Loading skeleton */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl shadow border border-gray-100 overflow-hidden animate-pulse">
                <div className="h-3 bg-gray-200" />
                <div className="p-5 space-y-3">
                  <div className="h-4 bg-gray-200 rounded w-3/4" />
                  <div className="h-3 bg-gray-100 rounded w-1/2" />
                  <div className="h-8 bg-gray-100 rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : projects.length === 0 ? (
          <div className="text-center py-24">
            <div className="w-20 h-20 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-700 mb-2">
              {search ? t.common.noResults : t.myModels.noModels}
            </h2>
            <p className="text-gray-500 mb-6">
              {search
                ? `${t.myModels.noResults} „${search}".`
                : t.myModels.noModels}
            </p>
            {!search && (
              <button
                onClick={onClose}
                className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-medium rounded-xl hover:from-blue-600 hover:to-purple-700 transition-all shadow-lg"
              >
                {t.myModels.createFirst}
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...projects]
                .sort((a, b) => b.lastModified - a.lastModified)
                .map((saved) => (
                <div
                  key={saved.project.id}
                  className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden hover:shadow-xl transition-shadow group"
                >
                  {/* Card header */}
                  <div
                    className={`h-3 ${saved.project.projectType === 'upload' ? 'bg-gradient-to-r from-green-400 to-emerald-500' : 'bg-gradient-to-r from-blue-400 to-indigo-500'}`}
                  />

                  <div className="p-5">
                    {/* Title row */}
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-center gap-2 min-w-0">
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md ${saved.project.projectType === 'upload' ? 'bg-gradient-to-br from-green-500 to-emerald-600' : 'bg-gradient-to-br from-blue-500 to-indigo-600'}`}
                        >
                          <span className="text-lg">{saved.project.projectType === 'upload' ? '📤' : '🧱'}</span>
                        </div>
                        <h3 className="font-bold text-gray-800 text-base truncate">{saved.project.name}</h3>
                      </div>
                      <span
                        className={`flex-shrink-0 px-2 py-0.5 text-xs font-medium rounded-full ${saved.project.projectType === 'upload' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}
                      >
                        {saved.project.projectType === 'upload' ? 'Upload' : 'Builder'}
                      </span>
                    </div>

                    {/* Meta */}
                    <div className="flex items-center gap-4 text-xs text-gray-500 mb-4">
                      <span className="flex items-center gap-1">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                          />
                        </svg>
                        {saved.project.steps.length} {t.myModels.steps}
                      </span>
                      <span className="flex items-center gap-1">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        {formatDate(saved.lastModified)}
                      </span>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-2">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handlePreview(saved)}
                          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white text-sm font-medium rounded-xl hover:from-blue-600 hover:to-indigo-700 transition-all shadow-md shadow-blue-500/20"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                            />
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                          {t.myModels.preview}
                        </button>
                        <button
                          onClick={() => handleOpenEditor(saved)}
                          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-gradient-to-r from-purple-500 to-indigo-600 text-white text-sm font-medium rounded-xl hover:from-purple-600 hover:to-indigo-700 transition-all shadow-md shadow-purple-500/20"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                            />
                          </svg>
                          {t.myModels.edit}
                        </button>
                      </div>

                      <button
                        onClick={() => handleShare(saved.project.id)}
                        disabled={sharingId === saved.project.id}
                        className={`w-full flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-medium rounded-xl transition-all border ${copiedId === saved.project.id ? 'bg-green-50 border-green-400 text-green-700' : sharingId === saved.project.id ? 'bg-white border-gray-200 text-gray-400 cursor-not-allowed' : 'bg-white border-gray-200 text-gray-700 hover:border-purple-400 hover:text-purple-700 hover:bg-purple-50'}`}
                      >
                        {copiedId === saved.project.id ? (
                          <>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            {t.myModels.shareSuccess}
                          </>
                        ) : sharingId === saved.project.id ? (
                          <>
                            <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                            {t.common.loading}
                          </>
                        ) : (
                          <>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
                              />
                            </svg>
                            {t.myModels.share}
                          </>
                        )}
                      </button>

                      <button
                        onClick={() => handleDelete(saved.project.id)}
                        className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-xl border border-transparent text-gray-400 hover:border-red-200 hover:text-red-500 hover:bg-red-50 transition-all"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                        {t.myModels.delete}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination controls */}
            {(hasPrevious || hasNext) && (
              <div className="mt-10 flex items-center justify-center gap-3">
                <button
                  onClick={() => setPage((p) => p - 1)}
                  disabled={!hasPrevious}
                  className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-xl border border-gray-200 text-gray-700 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50 transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:border-gray-200 disabled:hover:text-gray-700 disabled:hover:bg-transparent"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  {t.common.prev}
                </button>

                <span className="px-4 py-2 text-sm text-gray-500">
                  {t.myModels.page} <span className="font-semibold text-gray-800">{page}</span>{' '}
                  {t.myModels.of} <span className="font-semibold text-gray-800">{Math.ceil(totalCount / PAGE_SIZE)}</span>
                </span>

                <button
                  onClick={() => setPage((p) => p + 1)}
                  disabled={!hasNext}
                  className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-xl border border-gray-200 text-gray-700 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50 transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:border-gray-200 disabled:hover:text-gray-700 disabled:hover:bg-transparent"
                >
                  {t.common.next}
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            )}
          </>
        )}
      </div>

      <Footer />
    </div>
  );
};
