import {
  Suspense,
  useEffect,
  useState,
  useRef,
  useMemo,
  Component,
  type ReactNode,
} from 'react';
import DOMPurify from 'dompurify';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import type { ThreeEvent } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, useGLTF } from '@react-three/drei';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import * as THREE from 'three';
import type { CameraPosition } from '../../types';
import { isHtmlContent } from '../../utils/html';

export interface MeshPickResult {
  meshName: string;
  focusPoint: [number, number, number];
  cameraPosition: CameraPosition;
}

export interface CameraSnapshot {
  position: THREE.Vector3;
  target: THREE.Vector3;
}

export interface MeshHighlight {
  name: string;
  color: string;
}

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

const LoadingFallback = () => (
  <mesh>
    <boxGeometry args={[2, 2, 2]} />
    <meshStandardMaterial color="#888888" wireframe />
  </mesh>
);

const ErrorFallback = () => (
  <mesh>
    <boxGeometry args={[2, 2, 2]} />
    <meshStandardMaterial color="#ff4444" opacity={0.7} transparent />
  </mesh>
);

function setEmissive(mat: THREE.Material, hex: number, intensity: number) {
  if ('emissive' in mat) {
    (mat as THREE.MeshStandardMaterial).emissive.setHex(hex);
    (mat as THREE.MeshStandardMaterial).emissiveIntensity = intensity;
    mat.needsUpdate = true;
  }
}

interface ModelRendererProps {
  blobUrl: string;
  isPickMode: boolean;
  stepHighlights: MeshHighlight[];
  focusedMeshName: string | null;
  onMeshPicked?: (result: MeshPickResult) => void;
  cameraStateRef?: React.MutableRefObject<CameraSnapshot | null>;
}

const ModelRenderer = ({
  blobUrl,
  isPickMode,
  stepHighlights,
  focusedMeshName,
  onMeshPicked,
  cameraStateRef,
}: ModelRendererProps) => {
  const [hoveredMeshName, setHoveredMeshName] = useState<string | null>(null);
  const { scene: rawScene } = useGLTF(blobUrl);

  const { clonedScene, origEmissive } = useMemo(() => {
    const clone = rawScene.clone(true);
    const map = new Map<THREE.Mesh, { color: THREE.Color; intensity: number }>();

    clone.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        if (Array.isArray(child.material)) {
          child.material = (child.material as THREE.Material[]).map((m) => m.clone());
        } else if (child.material) {
          child.material = (child.material as THREE.Material).clone();
        }
        const mat = Array.isArray(child.material)
          ? (child.material[0] as THREE.MeshStandardMaterial)
          : (child.material as THREE.MeshStandardMaterial);
        if (mat && 'emissive' in mat) {
          map.set(child, { color: mat.emissive.clone(), intensity: mat.emissiveIntensity ?? 0 });
        }
      }
    });

    const box = new THREE.Box3().setFromObject(clone);
    const centre = box.getCenter(new THREE.Vector3());
    clone.position.sub(centre);
    return { clonedScene: clone, origEmissive: map };
  }, [rawScene]);

  useEffect(() => {
    clonedScene.traverse((child) => {
      if (!(child instanceof THREE.Mesh)) return;
      const mat = Array.isArray(child.material) ? child.material[0] : child.material;
      if (!mat) return;
      const orig = origEmissive.get(child);
      const isHover = isPickMode && child.name === hoveredMeshName;
      const isFocused = focusedMeshName && focusedMeshName !== '' && child.name === focusedMeshName;
      const stepHl = stepHighlights.find((h) => h.name !== '' && h.name === child.name);

      if (isHover) {
        setEmissive(mat, 0x88ccff, 0.9);
      } else if (isFocused) {
        setEmissive(mat, 0x4488ff, 0.6);
      } else if (stepHl) {
        const c = new THREE.Color(stepHl.color);
        setEmissive(mat, c.getHex(), 0.4);
      } else if (orig) {
        setEmissive(mat, orig.color.getHex(), orig.intensity);
      }
    });
  }, [clonedScene, origEmissive, hoveredMeshName, focusedMeshName, stepHighlights, isPickMode]);

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    if (!isPickMode || !onMeshPicked) return;
    e.stopPropagation();
    const mesh = e.object as THREE.Mesh;
    const box = new THREE.Box3().setFromObject(mesh);
    const centre = box.getCenter(new THREE.Vector3());
    const snap = cameraStateRef?.current;
    const camPos: CameraPosition = snap
      ? { x: snap.position.x, y: snap.position.y, z: snap.position.z, targetX: snap.target.x, targetY: snap.target.y, targetZ: snap.target.z }
      : { x: 5, y: 5, z: 5, targetX: 0, targetY: 0, targetZ: 0 };
    onMeshPicked({ meshName: mesh.name, focusPoint: [centre.x, centre.y, centre.z], cameraPosition: camPos });
  };

  const handlePointerMove = (e: ThreeEvent<PointerEvent>) => {
    if (!isPickMode) return;
    e.stopPropagation();
    setHoveredMeshName((e.object as THREE.Mesh).name);
    document.body.style.cursor = 'crosshair';
  };

  const handlePointerLeave = () => {
    setHoveredMeshName(null);
    document.body.style.cursor = 'default';
  };

  return (
    <ModelErrorBoundary fallback={<ErrorFallback />}>
      <Suspense fallback={<LoadingFallback />}>
        <primitive
          object={clonedScene}
          onClick={handleClick}
          onPointerMove={handlePointerMove}
          onPointerLeave={handlePointerLeave}
        />
      </Suspense>
    </ModelErrorBoundary>
  );
};

interface CameraControllerProps {
  orbitRef: React.RefObject<OrbitControlsImpl | null>;
  cameraStateRef?: React.MutableRefObject<CameraSnapshot | null>;
  targetCamera?: CameraPosition;
  cameraMode: 'auto' | 'free';
}

const CameraController = ({ orbitRef, cameraStateRef, targetCamera, cameraMode }: CameraControllerProps) => {
  const { camera } = useThree();
  const targetCamPos = useRef(new THREE.Vector3(5, 5, 5));
  const targetCamLookAt = useRef(new THREE.Vector3(0, 0, 0));

  useEffect(() => {
    if (cameraMode === 'auto' && targetCamera) {
      targetCamPos.current.set(targetCamera.x, targetCamera.y, targetCamera.z);
      targetCamLookAt.current.set(targetCamera.targetX ?? 0, targetCamera.targetY ?? 0, targetCamera.targetZ ?? 0);
    }
  }, [targetCamera, cameraMode]);

  useFrame(() => {
    if (cameraStateRef) {
      cameraStateRef.current = {
        position: camera.position.clone(),
        target: orbitRef.current ? orbitRef.current.target.clone() : new THREE.Vector3(0, 0, 0),
      };
    }
    if (cameraMode === 'auto') {
      camera.position.lerp(targetCamPos.current, 0.05);
      if (orbitRef.current) {
        orbitRef.current.target.lerp(targetCamLookAt.current, 0.05);
        orbitRef.current.update();
      }
    }
  });

  return null;
};

function useBlobUrl(url: string): string | null {
  const isDataUrl = url.startsWith('data:');
  const [convertedBlobUrl, setConvertedBlobUrl] = useState<string | null>(null);
  const blobUrlRef = useRef<string | null>(null);

  useEffect(() => {
    if (!isDataUrl) return;
    let cancelled = false;
    fetch(url)
      .then((res) => res.blob())
      .then((blob) => {
        if (cancelled) return;
        const newUrl = URL.createObjectURL(blob);
        blobUrlRef.current = newUrl;
        setConvertedBlobUrl(newUrl);
      })
      .catch((err) => console.error('Failed to convert data URL to blob:', err));
    return () => {
      cancelled = true;
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current);
        blobUrlRef.current = null;
        setConvertedBlobUrl(null);
      }
    };
  }, [url, isDataUrl]);

  if (!isDataUrl) return url;
  return convertedBlobUrl;
}

export interface UploadedModelCanvasProps {
  modelUrl: string;
  isPickMode?: boolean;
  stepHighlights?: MeshHighlight[];
  focusedMeshName?: string;
  onMeshPicked?: (result: MeshPickResult) => void;
  cameraStateRef?: React.MutableRefObject<CameraSnapshot | null>;
  targetCamera?: CameraPosition;
  cameraMode?: 'auto' | 'free';
  stepTitle?: string;
  stepDescription?: string;
  stepIndex?: number;
  showGrid?: boolean;
}

export const UploadedModelCanvas = ({
  modelUrl,
  isPickMode = false,
  stepHighlights = [],
  focusedMeshName,
  onMeshPicked,
  cameraStateRef,
  targetCamera,
  cameraMode = 'free',
  stepTitle,
  stepDescription,
  stepIndex,
  showGrid = true,
}: UploadedModelCanvasProps) => {
  const blobUrl = useBlobUrl(modelUrl);
  const orbitRef = useRef<OrbitControlsImpl | null>(null);

  return (
    <div className="w-full h-full relative bg-gradient-to-br from-slate-900 to-slate-800">
      {isPickMode && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 bg-blue-600/90 backdrop-blur-sm text-white text-sm font-medium px-4 py-2 rounded-full shadow-lg pointer-events-none select-none flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5" />
          </svg>
          Kliknij na element modelu 3D, aby dodać krok
        </div>
      )}

      <Canvas shadows>
        <PerspectiveCamera makeDefault position={[5, 5, 5]} />

        {!showGrid && (
          <>
            <color attach="background" args={['#0d1117']} />
            <fog attach="fog" color="#0d1117" near={30} far={100} />
          </>
        )}

        {!showGrid ? (
          <>
            <hemisphereLight color="#1e3a5f" groundColor="#0a0a1a" intensity={0.6} />
            <directionalLight position={[15, 25, 10]} intensity={1.8} castShadow shadow-mapSize-width={2048} shadow-mapSize-height={2048} shadow-camera-near={0.5} shadow-camera-far={200} shadow-camera-left={-50} shadow-camera-right={50} shadow-camera-top={50} shadow-camera-bottom={-50} />
            <directionalLight position={[-10, 10, -8]} intensity={0.4} color="#3366cc" />
            <pointLight position={[0, 20, 0]} intensity={0.6} color="#6699ff" />
          </>
        ) : (
          <>
            <ambientLight intensity={0.6} />
            <directionalLight position={[5, 10, 7.5]} intensity={0.8} castShadow />
            <directionalLight position={[-5, 5, -5]} intensity={0.3} />
          </>
        )}

        <CameraController
          orbitRef={orbitRef}
          cameraStateRef={cameraStateRef}
          targetCamera={targetCamera}
          cameraMode={cameraMode}
        />

        {blobUrl && (
          <ModelRenderer
            blobUrl={blobUrl}
            isPickMode={isPickMode}
            stepHighlights={stepHighlights}
            focusedMeshName={focusedMeshName ?? null}
            onMeshPicked={onMeshPicked}
            cameraStateRef={cameraStateRef}
          />
        )}
        {!blobUrl && <LoadingFallback />}

        <OrbitControls
          ref={orbitRef}
          enableDamping
          dampingFactor={0.05}
          enabled={cameraMode === 'free' || !targetCamera}
        />
        {showGrid && <gridHelper args={[20, 20]} />}
      </Canvas>

      {stepTitle && (
        <div className="absolute top-20 left-4 bg-black/50 backdrop-blur-md text-white px-5 py-4 rounded-xl shadow-2xl border border-white/10 max-w-sm z-10">
          <div className="flex items-start gap-3">
            {stepIndex !== undefined && (
              <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center flex-shrink-0 shadow-lg">
                <span className="text-sm font-bold">{stepIndex + 1}</span>
              </div>
            )}
            <div>
              <h3 className="font-bold text-base mb-1">{stepTitle}</h3>
              {stepDescription && (
                isHtmlContent(stepDescription) ? (
                  <div
                    className="text-sm text-slate-300 leading-relaxed rich-text-preview"
                    dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(stepDescription) }}
                  />
                ) : (
                  <p className="text-sm text-slate-300 leading-relaxed">{stepDescription}</p>
                )
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
