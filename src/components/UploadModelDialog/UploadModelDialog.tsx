import { useState, useRef, useCallback, useMemo, useEffect, Suspense, Component, type ReactNode } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import type { UploadedModel3D } from '../../types';
import { uploadNewModel, saveUploadedModelMeta } from '../../utils/uploadedModels';

// --- Error Boundary ---
class ModelErrorBoundary extends Component<
  { children: ReactNode; fallback: ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: ReactNode; fallback: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  render() {
    if (this.state.hasError) return this.props.fallback;
    return this.props.children;
  }
}

// --- Preview model renderer ---
// Converts a data URL to a blob URL before passing to useGLTF for compatibility.
const PreviewModelRenderer = ({ dataUrl, scale }: { dataUrl: string; scale: number }) => {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const blobUrlRef = useRef<string | null>(null);

  useEffect(() => {
    if (!dataUrl) return;
    let cancelled = false;
    fetch(dataUrl)
      .then((r) => r.blob())
      .then((blob) => {
        if (cancelled) return;
        const url = URL.createObjectURL(blob);
        blobUrlRef.current = url;
        setBlobUrl(url);
      })
      .catch(() => {/* ignore */});
    return () => {
      cancelled = true;
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current);
        blobUrlRef.current = null;
      }
    };
  }, [dataUrl]);

  const { scene } = useGLTF(blobUrl ?? '');
  const cloned = useMemo(() => {
    const c = scene.clone(true);
    c.traverse((child) => {
      if (child instanceof THREE.Mesh) child.castShadow = true;
    });
    return c;
  }, [scene]);

  useEffect(() => {
    cloned.scale.set(scale, scale, scale);
  }, [cloned, scale]);

  if (!blobUrl) return null;
  return <primitive object={cloned} />;
};

const LoadingPlaceholder = () => (
  <mesh>
    <boxGeometry args={[1, 1, 1]} />
    <meshStandardMaterial color="#888888" wireframe />
  </mesh>
);

const ErrorPlaceholder = () => (
  <mesh>
    <boxGeometry args={[1, 1, 1]} />
    <meshStandardMaterial color="#ff4444" opacity={0.7} transparent />
  </mesh>
);

// --- Main dialog ---
interface Props {
  existing?: UploadedModel3D;
  onClose: () => void;
  onSaved: (model: UploadedModel3D) => void;
}

export const UploadModelDialog = ({ existing, onClose, onSaved }: Props) => {
  const [name, setName] = useState(existing?.name ?? '');
  const [modelDataUrl, setModelDataUrl] = useState<string | null>(existing?.modelDataUrl ?? null);
  const [modelFileName, setModelFileName] = useState(existing?.modelFileName ?? '');
  const [modelScale, setModelScale] = useState(existing?.modelScale ?? 1);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const maxSize = 50 * 1024 * 1024; // 50 MB
    if (file.size > maxSize) {
      alert('Plik jest za duży (maks. 50 MB).');
      e.target.value = '';
      return;
    }
    if (!file.name.match(/\.(gltf|glb)$/i)) {
      alert('Proszę wybrać plik GLTF (.gltf) lub GLB (.glb).');
      e.target.value = '';
      return;
    }

    setIsLoading(true);
    setModelFileName(file.name);
    if (!name) setName(file.name.replace(/\.(gltf|glb)$/i, ''));

    const reader = new FileReader();
    reader.onload = (ev) => {
      setModelDataUrl(ev.target?.result as string);
      setIsLoading(false);
    };
    reader.onerror = () => {
      alert('Nie udało się wczytać pliku.');
      setIsLoading(false);
    };
    reader.readAsDataURL(file);
  }, [name]);

  const handleSave = async () => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      alert('Proszę podać nazwę modelu.');
      return;
    }
    if (!existing && !modelDataUrl) {
      alert('Proszę wybrać plik modelu 3D.');
      return;
    }
    setIsSaving(true);
    try {
      let saved: UploadedModel3D;
      if (existing) {
        saved = await saveUploadedModelMeta(existing.id, trimmedName, modelScale);
      } else {
        saved = await uploadNewModel(modelDataUrl!, modelFileName, trimmedName, modelScale);
      }
      onSaved(saved);
    } catch (err) {
      alert((err as Error).message ?? 'Nie udało się zapisać modelu.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-indigo-600 to-blue-500">
          <h2 className="text-xl font-bold text-white">
            {existing ? 'Edytuj model 3D' : 'Wgraj element 3D'}
          </h2>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white transition"
            aria-label="Zamknij"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
          {/* Form */}
          <div className="flex-1 p-6 space-y-5 overflow-y-auto">
            {/* Name */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Nazwa modelu
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="np. Silnik turbinowy"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* File picker */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Plik modelu 3D <span className="text-gray-400 font-normal">(.gltf / .glb, maks. 50 MB)</span>
              </label>
              <div
                onClick={() => fileInputRef.current?.click()}
                className={`w-full p-4 border-2 border-dashed rounded-xl cursor-pointer transition-all ${
                  (modelDataUrl || isLoading)
                    ? 'border-green-400 bg-green-50'
                    : 'border-gray-300 hover:border-indigo-400 hover:bg-indigo-50'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".gltf,.glb"
                  onChange={handleFileChange}
                  className="hidden"
                />
                {(modelDataUrl || isLoading) ? (
                  <div className="flex items-center gap-3">
                    <svg className="w-6 h-6 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div>
                      <p className="text-sm font-medium text-green-700">{modelFileName}</p>
                      <p className="text-xs text-gray-500">{isLoading ? 'Wczytywanie…' : 'Kliknij, aby zmienić plik'}</p>
                    </div>
                  </div>
                ) : (
                  <div className="text-center">
                    <svg className="w-8 h-8 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    <p className="text-sm text-gray-500">Kliknij, aby wybrać plik .gltf lub .glb</p>
                  </div>
                )}
              </div>
            </div>

            {/* Scale */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Skala <span className="text-gray-400 font-normal">(0.1 – 5.0)</span>
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min="0.1"
                  max="5"
                  step="0.1"
                  value={modelScale}
                  onChange={(e) => setModelScale(parseFloat(e.target.value))}
                  className="flex-1"
                />
                <input
                  type="number"
                  min="0.1"
                  max="5"
                  step="0.1"
                  value={modelScale}
                  onChange={(e) => setModelScale(parseFloat(e.target.value))}
                  className="w-20 px-2 py-1 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <p className="mt-1 text-xs text-gray-400">Domyślna skala użyta przy dodaniu do kroku</p>
            </div>
          </div>

          {/* 3D Preview */}
          <div className="w-full md:w-72 h-64 md:h-auto bg-slate-900 flex-shrink-0 flex flex-col">
            <div className="px-3 py-2 bg-slate-800 text-xs text-slate-400 text-center">
              Podgląd 3D · przeciągnij aby obracać
            </div>
            <div className="flex-1">
              <Canvas>
                <PerspectiveCamera makeDefault position={[3, 3, 3]} fov={50} />
                <ambientLight intensity={0.7} />
                <directionalLight position={[5, 5, 5]} intensity={1} castShadow />
                <directionalLight position={[-3, -3, -3]} intensity={0.3} />
                {modelDataUrl ? (
                  <ModelErrorBoundary fallback={<ErrorPlaceholder />}>
                    <Suspense fallback={<LoadingPlaceholder />}>
                      <PreviewModelRenderer dataUrl={modelDataUrl} scale={modelScale} />
                    </Suspense>
                  </ModelErrorBoundary>
                ) : (
                  <LoadingPlaceholder />
                )}
                <OrbitControls enablePan={false} />
              </Canvas>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            disabled={isSaving}
            className="px-5 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 transition disabled:opacity-60 disabled:cursor-not-allowed"
          >
            Anuluj
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-5 py-2 text-sm font-medium text-white bg-gradient-to-r from-indigo-500 to-blue-600 rounded-lg hover:from-indigo-600 hover:to-blue-700 transition disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isSaving ? 'Zapisywanie…' : 'Zapisz model'}
          </button>
        </div>
      </div>
    </div>
  );
};
