import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from '../../hooks/useTranslation';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { Custom3DShape } from '../Viewer3D/Custom3DShape';
import type { Custom3DElement, UploadedModel3D } from '../../types';

// ── Uploaded-model renderer (mirrors CustomModel/CustomModelRenderer in Viewer3D) ──

interface UploadedRendererProps {
  url: string;
  scale?: number;
}

const UploadedModelRenderer = ({ url, scale = 1 }: UploadedRendererProps) => {
  const { scene } = useGLTF(url);
  const cloned = useMemo(() => scene.clone(), [scene]);
  useEffect(() => {
    cloned.scale.set(scale, scale, scale);
    cloned.traverse((child) => {
      if (child instanceof THREE.Mesh) child.castShadow = true;
    });
  }, [cloned, scale]);
  return <primitive object={cloned} />;
};

const UploadedModelLoader = ({ model }: { model: UploadedModel3D }) => {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const blobRef = useRef<string | null>(null);

  useEffect(() => {
    if (model.modelDataUrl.startsWith('data:')) {
      fetch(model.modelDataUrl)
        .then((r) => r.blob())
        .then((blob) => {
          const url = URL.createObjectURL(blob);
          blobRef.current = url;
          setBlobUrl(url);
        })
        .catch(console.error);
      return () => {
        if (blobRef.current) {
          URL.revokeObjectURL(blobRef.current);
          blobRef.current = null;
        }
      };
    } else {
      setBlobUrl(model.modelDataUrl);
    }
  }, [model.modelDataUrl]);

  if (!blobUrl) {
    return (
      <mesh>
        <boxGeometry args={[2, 2, 2]} />
        <meshStandardMaterial color="#888" wireframe />
      </mesh>
    );
  }

  return (
    <Suspense
      fallback={
        <mesh>
          <boxGeometry args={[2, 2, 2]} />
          <meshStandardMaterial color="#888" wireframe />
        </mesh>
      }
    >
      <UploadedModelRenderer url={blobUrl} scale={model.modelScale} />
    </Suspense>
  );
};

// ── Preview modal ─────────────────────────────────────────────────────────────

interface ModelPreviewModalProps {
  element?: Custom3DElement | null;
  model?: UploadedModel3D | null;
  onClose: () => void;
}

export const ModelPreviewModal = ({ element, model, onClose }: ModelPreviewModalProps) => {
  const { t } = useTranslation();
  // Close on backdrop click
  const handleBackdrop = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose();
  };

  // Close on Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const title = element?.name ?? model?.name ?? t.modelPreview.title;
  const description = element?.description ?? model?.description;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
      onClick={handleBackdrop}
    >
      <div className="bg-gray-900 rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-700">
          <span className="text-white font-semibold truncate">{title}</span>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors ml-4 flex-shrink-0"
            aria-label={t.modelPreview.close}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* 3D Canvas */}
        <div className="w-full" style={{ height: 360 }}>
          <Canvas shadows>
            <PerspectiveCamera makeDefault position={[0, 2, 6]} />
            <OrbitControls enablePan={false} />
            <ambientLight intensity={0.6} />
            <directionalLight position={[5, 10, 5]} intensity={1} castShadow />
            <directionalLight position={[-5, -5, -5]} intensity={0.3} />

            {element && (
              <Custom3DShape element={element} />
            )}

            {model && (
              <UploadedModelLoader model={model} />
            )}
          </Canvas>
        </div>

        {/* Footer hint */}
        <p className="text-center text-xs text-gray-500 py-2">
          Przeciągnij aby obrócić · Scroll aby przybliżyć
        </p>

        {/* Description */}
        {description && (
          <div className="px-5 pb-4">
            <p className="text-xs text-gray-400 mb-1">{t.modelPreview.description}</p>
            <p className="text-sm text-gray-300 bg-gray-800 rounded-lg px-4 py-3 leading-relaxed">
              {description}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
