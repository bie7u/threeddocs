import { useEffect, useRef } from 'react';
import { useAppStore } from '../store';
import { PreviewMode } from '../components/PreviewMode/PreviewMode';
import { useLanguage } from '../i18n/LanguageContext';
import { getStoredLocale } from '../i18n';
import { sampleProject, sampleNodePositions } from '../utils/sampleData';
import { sampleProjectPl, sampleNodePositionsPl } from '../utils/sampleDataPl';

/**
 * Standalone preview page used as the demo iframe on the recruiter landing page.
 * Loads the locale-appropriate sample project and immediately enters preview mode
 * — no editor panels are shown.
 */
const DemoPreview = () => {
  const { t } = useLanguage();
  const { createNewGuestProject, setPreviewMode, isPreviewMode, clearGuestMode } = useAppStore();
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    clearGuestMode();
    const locale = getStoredLocale();
    const sample = locale === 'pl' ? sampleProjectPl : sampleProject;
    const positions = locale === 'pl' ? sampleNodePositionsPl : sampleNodePositions;

    createNewGuestProject(t('newProject.defaultNameBuilder'), 'builder', undefined, {
      steps: sample.steps,
      connections: sample.connections,
      guide: sample.guide,
      nodePositions: positions,
    }).then(() => {
      setPreviewMode(true);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!isPreviewMode) {
    return (
      <div className="w-screen h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800">
        <div className="text-white text-center">
          <div className="w-12 h-12 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-400">{t('guest.preparingEditor')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-screen h-screen">
      <PreviewMode isPublic={true} />
    </div>
  );
};

export default DemoPreview;
