import { useRef, useEffect, useMemo, Suspense, useState, Component, type ReactNode } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import type { InstructionStep, ConnectionStyle, ShapeType, ArrowDirection, ConnectionType, UploadedModel3D, Custom3DElement } from '../../types';
import type { ProjectData } from '../../types';
import { calculateCreatorBasedLayout } from '../../utils/layoutCalculator';
import { EngravedBlock } from './EngravedBlock';
import { Custom3DShape } from './Custom3DShape';
import { getCustom3DElementById } from '../../utils/custom3DElements';
import { getUploadedModelById } from '../../utils/uploadedModels';
import { useAppStore } from '../../store';
import DOMPurify from 'dompurify';
import { isHtmlContent } from '../../utils/html';

// Error Boundary for catching errors in 3D components
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

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Model loading error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

interface ConnectionWithIndices {
  sourceIndex: number;
  targetIndex: number;
  style: ConnectionStyle;
  title?: string;
  description?: string;
  shapeType?: ShapeType;
  custom3dElementId?: string;
  uploadedModelId?: string;
  shapeModelScale?: number;
  shapeModelPositionY?: number;
  shapeModelRotationY?: number;
  arrowDirection?: ArrowDirection;
  connectionType?: ConnectionType;
  engravedBlockParams?: InstructionStep['engravedBlockParams'];
}

interface CustomModelProps {
  url: string;
  color: string;
  emissive?: string;
  emissiveIntensity?: number;
  scale?: number;
  preserveMaterials?: boolean;
}

// Fallback component shown while model is loading
const ModelLoadingFallback = () => (
  <mesh castShadow>
    <boxGeometry args={[2, 2, 2]} />
    <meshStandardMaterial 
      color="#888888"
      emissive="#444444"
      emissiveIntensity={0.5}
      wireframe={true}
    />
  </mesh>
);

// Fallback component shown when model fails to load
const ModelErrorFallback = () => (
  <mesh castShadow>
    <boxGeometry args={[2, 2, 2]} />
    <meshStandardMaterial 
      color="#ff4444"
      emissive="#ff0000"
      emissiveIntensity={0.3}
      wireframe={false}
      opacity={0.7}
      transparent={true}
    />
  </mesh>
);

// Component for loading custom GLTF/GLB models
const CustomModel = ({ url, color, emissive = '#000000', emissiveIntensity = 0, scale = 1, preserveMaterials = false }: CustomModelProps) => {
  // Convert data URL to blob URL for useGLTF compatibility
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const blobUrlRef = useRef<string | null>(null);
  
  useEffect(() => {
    // If it's a data URL, convert it to a blob URL
    if (url.startsWith('data:')) {
      fetch(url)
        .then(res => res.blob())
        .then(blob => {
          const newBlobUrl = URL.createObjectURL(blob);
          blobUrlRef.current = newBlobUrl;
          setBlobUrl(newBlobUrl);
        })
        .catch(error => {
          console.error('Failed to convert data URL to blob:', error);
        });
      
      // Cleanup function to revoke blob URL
      return () => {
        if (blobUrlRef.current) {
          URL.revokeObjectURL(blobUrlRef.current);
          blobUrlRef.current = null;
        }
      };
    } else {
      // Regular URL, use as-is
      setBlobUrl(url);
    }
  }, [url]);
  
  // Wait for blob URL to be ready
  if (!blobUrl) {
    return <ModelLoadingFallback />;
  }
  
  return <CustomModelRenderer url={blobUrl} color={color} emissive={emissive} emissiveIntensity={emissiveIntensity} scale={scale} preserveMaterials={preserveMaterials} />;
};

// Actual renderer component that uses useGLTF
const CustomModelRenderer = ({ url, color, emissive = '#000000', emissiveIntensity = 0, scale = 1, preserveMaterials = false }: CustomModelProps) => {
  const { scene } = useGLTF(url);
  
  // Clone the scene to avoid modifying the cached version
  const clonedScene = useMemo(() => scene.clone(), [scene]);
  
  // Apply material properties to all meshes in the model
  useEffect(() => {
    clonedScene.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = true;
        if (!preserveMaterials && child.material) {
          const oldMaterial = child.material as THREE.Material;
          const metalness = (oldMaterial as THREE.MeshStandardMaterial).metalness ?? 0.5;
          const roughness = (oldMaterial as THREE.MeshStandardMaterial).roughness ?? 0.5;
          
          child.material = new THREE.MeshStandardMaterial({
            color: color,
            emissive: emissive,
            emissiveIntensity: emissiveIntensity,
            metalness: metalness,
            roughness: roughness,
          });
        }
      }
    });
  }, [clonedScene, color, emissive, emissiveIntensity, preserveMaterials]);
  
  useEffect(() => {
    clonedScene.scale.set(scale, scale, scale);
  }, [clonedScene, scale]);
  
  return <primitive object={clonedScene} />;
};

interface Shape3DProps {
  shapeType?: ShapeType;
  size?: number;
  color: string;
  emissive?: string;
  emissiveIntensity?: number;
  customModelUrl?: string;
  modelScale?: number;
  engravedBlockParams?: InstructionStep['engravedBlockParams'];
  custom3dElementId?: string;
  uploadedModelId?: string;
  modelPositionY?: number;
  modelRotationY?: number;
  /** Share token from the public share-link URL, forwarded as ?project_uuid= on API calls. */
  shareToken?: string;
}

const degToRad = (degrees: number) => degrees * Math.PI / 180;

// Reusable 3D shape component
const Shape3D = ({ shapeType = 'cube', size = 2, color, emissive = '#000000', emissiveIntensity = 0, customModelUrl, modelScale = 1, engravedBlockParams, custom3dElementId, uploadedModelId, modelPositionY = 0, modelRotationY = 0, shareToken }: Shape3DProps) => {
  const [uploadedModel, setUploadedModel] = useState<UploadedModel3D | null>(null);
  const [customElement, setCustomElement] = useState<Custom3DElement | null>(null);
  const isGuestMode = useAppStore((s) => s.isGuestMode);

  useEffect(() => {
    if (shapeType === 'uploadedModel' && uploadedModelId) {
      getUploadedModelById(uploadedModelId, shareToken, isGuestMode)
        .then((m) => setUploadedModel(m ?? null))
        .catch(() => setUploadedModel(null));
    } else {
      setUploadedModel(null);
    }
  }, [shapeType, uploadedModelId, shareToken, isGuestMode]);

  useEffect(() => {
    if (shapeType === 'custom3dElement' && custom3dElementId) {
      getCustom3DElementById(custom3dElementId, shareToken)
        .then((e) => setCustomElement(e ?? null))
        .catch(() => setCustomElement(null));
    } else {
      setCustomElement(null);
    }
  }, [shapeType, custom3dElementId, shareToken]);

  if (shapeType === 'custom' && customModelUrl) {
    return (
      <group position={[0, modelPositionY, 0]} rotation={[0, degToRad(modelRotationY), 0]}>
        <ModelErrorBoundary fallback={<ModelErrorFallback />}>
          <Suspense fallback={<ModelLoadingFallback />}>
            <CustomModel 
              url={customModelUrl}
              color={color}
              emissive={emissive}
              emissiveIntensity={emissiveIntensity}
              scale={modelScale}
            />
          </Suspense>
        </ModelErrorBoundary>
      </group>
    );
  }

  if (shapeType === 'uploadedModel' && uploadedModelId) {
    if (uploadedModel) {
      return (
        <group position={[0, modelPositionY, 0]} rotation={[0, degToRad(modelRotationY), 0]}>
          <ModelErrorBoundary fallback={<ModelErrorFallback />}>
            <Suspense fallback={<ModelLoadingFallback />}>
              <CustomModel
                url={uploadedModel.modelDataUrl}
                color={color}
                emissive={emissive}
                emissiveIntensity={emissiveIntensity}
                scale={modelScale * uploadedModel.modelScale}
                preserveMaterials={true}
              />
            </Suspense>
          </ModelErrorBoundary>
        </group>
      );
    }
    // Fallback while loading or if model not found
    return (
      <group position={[0, modelPositionY, 0]} rotation={[0, degToRad(modelRotationY), 0]} scale={[modelScale, modelScale, modelScale]}>
        <mesh castShadow>
          <boxGeometry args={[size, size, size]} />
          <meshStandardMaterial color={color} wireframe />
        </mesh>
      </group>
    );
  }

  if (shapeType === 'custom3dElement' && custom3dElementId) {
    if (customElement) {
      return (
        <group position={[0, modelPositionY, 0]} rotation={[0, degToRad(modelRotationY), 0]} scale={[modelScale, modelScale, modelScale]}>
          <Custom3DShape element={customElement} emissive={emissive} emissiveIntensity={emissiveIntensity} />
        </group>
      );
    }
    // Fallback while loading or if element not found
    return (
      <group position={[0, modelPositionY, 0]} rotation={[0, degToRad(modelRotationY), 0]} scale={[modelScale, modelScale, modelScale]}>
        <mesh castShadow>
          <boxGeometry args={[size, size, size]} />
          <meshStandardMaterial color={color} wireframe />
        </mesh>
      </group>
    );
  }

  if (shapeType === 'engravedBlock') {
    const ebParams = engravedBlockParams ?? { text: 'DB', font: 'helvetiker', depth: 0.08, padding: 0.1, face: 'front' };
    return (
      <group position={[0, modelPositionY, 0]} rotation={[0, degToRad(modelRotationY), 0]} scale={[modelScale, modelScale, modelScale]}>
        <EngravedBlock
          params={ebParams}
          color={color}
          emissive={emissive}
          emissiveIntensity={emissiveIntensity}
        />
      </group>
    );
  }
  
  const renderGeometry = () => {
    switch (shapeType) {
      case 'sphere':
        return <sphereGeometry args={[size / 2, 32, 32]} />;
      case 'cylinder':
        return <cylinderGeometry args={[size / 2, size / 2, size, 32]} />;
      case 'cone':
        return <coneGeometry args={[size / 2, size, 32]} />;
      case 'cube':
      default:
        return <boxGeometry args={[size, size, size]} />;
    }
  };

  return (
    <group position={[0, modelPositionY, 0]} rotation={[0, degToRad(modelRotationY), 0]} scale={[modelScale, modelScale, modelScale]}>
      <mesh castShadow>
        {renderGeometry()}
        <meshStandardMaterial 
          color={color}
          emissive={emissive}
          emissiveIntensity={emissiveIntensity}
        />
      </mesh>
    </group>
  );
};


interface StepCubeProps {
  step: InstructionStep;
  position: [number, number, number];
  isActive: boolean;
  hasActiveStep?: boolean;
  allowDimming?: boolean;
  onClick?: () => void;
  shareToken?: string;
}

const StepCube = ({ step, position, isActive, hasActiveStep, allowDimming = true, onClick, shareToken }: StepCubeProps) => {
  const meshRef = useRef<THREE.Group>(null);
  const ringRef = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.6) * (Math.PI / 10);
    }
    if (ringRef.current && isActive) {
      ringRef.current.rotation.z = state.clock.elapsedTime * 1.2;
      const ringScale = 1 + Math.sin(state.clock.elapsedTime * 1.5) * 0.08;
      ringRef.current.scale.set(ringScale, ringScale, 1);
    }
  });

  const handlePointerOver = (e: { stopPropagation: () => void }) => {
    e.stopPropagation();
    if (onClick) document.body.style.cursor = 'pointer';
  };

  const handlePointerOut = () => {
    document.body.style.cursor = 'default';
  };

  const color = step.highlightColor || '#4299e1';
  const shapeType = step.shapeType || 'cube';
  const modelScale = step.modelScale ?? 1;
  const modelPositionY = step.modelPositionY ?? 0;
  const modelRotationY = step.modelRotationY ?? 0;

  const dimmed = allowDimming && hasActiveStep && !isActive;

  const RING_VERTICAL_OFFSET = 1.2;
  const RING_INNER_RADIUS = 1.4;
  const RING_OUTER_RADIUS = 2.2;

  return (
    <group position={position} onClick={onClick} onPointerOver={handlePointerOver} onPointerOut={handlePointerOut}>
      <group ref={meshRef}>
        <Shape3D 
          shapeType={shapeType}
          size={2}
          color={dimmed ? '#888888' : color}
          emissive={isActive ? color : '#000000'}
          emissiveIntensity={isActive ? 0.8 : 0}
          customModelUrl={step.customModelUrl}
          modelScale={modelScale}
          modelPositionY={modelPositionY}
          modelRotationY={modelRotationY}
          engravedBlockParams={step.engravedBlockParams}
          custom3dElementId={step.custom3dElementId}
          uploadedModelId={step.uploadedModelId}
          shareToken={shareToken}
        />
      </group>
      {isActive && (
        <mesh ref={ringRef} position={[0, modelPositionY - RING_VERTICAL_OFFSET, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[RING_INNER_RADIUS, RING_OUTER_RADIUS, 48]} />
          <meshBasicMaterial color={color} transparent opacity={0.7} side={THREE.DoubleSide} />
        </mesh>
      )}
    </group>
  );
};

interface ConnectionTubeProps {
  startPos: [number, number, number];
  endPos: [number, number, number];
  isActive: boolean;
  style?: 'standard' | 'glass' | 'glow' | 'neon';
  description?: string;
  shapeType?: ShapeType;
  custom3dElementId?: string;
  uploadedModelId?: string;
  shapeModelScale?: number;
  shapeModelPositionY?: number;
  shapeModelRotationY?: number;
  arrowDirection?: ArrowDirection;
  connectionType?: ConnectionType;
  engravedBlockParams?: InstructionStep['engravedBlockParams'];
  shareToken?: string;
  onClick?: () => void;
}

const ConnectionTube = ({ startPos, endPos, isActive, style = 'standard', shapeType, custom3dElementId, uploadedModelId, shapeModelScale = 1, shapeModelPositionY = 0, shapeModelRotationY = 0, arrowDirection, connectionType = 'tube', engravedBlockParams, shareToken, onClick }: ConnectionTubeProps) => {
  const tubeRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  const shapeRef = useRef<THREE.Group>(null);
  
  const path = useMemo(() => {
    return new THREE.CatmullRomCurve3([
      new THREE.Vector3(...startPos),
      new THREE.Vector3(...endPos),
    ]);
  }, [startPos, endPos]);
  
  const midPoint = useMemo(() => {
    return new THREE.Vector3(
      (startPos[0] + endPos[0]) / 2,
      (startPos[1] + endPos[1]) / 2 + 2,
      (startPos[2] + endPos[2]) / 2
    );
  }, [startPos, endPos]);

  // Compute arrow head transforms: position at tube tip, oriented along travel direction
  const ARROW_RADIUS = 0.3;
  const ARROW_HEIGHT = 0.7;
  const ARROW_SEGMENTS = 8;

  const arrowTransforms = useMemo(() => {
    const start = new THREE.Vector3(...startPos);
    const end = new THREE.Vector3(...endPos);
    const dir = new THREE.Vector3().subVectors(end, start).normalize();
    const back = dir.clone().negate();

    const makeRotation = (direction: THREE.Vector3): [number, number, number] => {
      // Cone default axis is Y; rotate so Y aligns with direction
      const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction);
      const e = new THREE.Euler().setFromQuaternion(q);
      return [e.x, e.y, e.z];
    };

    // Place arrowhead with base at tube endpoint and tip protruding outward
    const halfHeight = ARROW_HEIGHT / 2;
    const forwardPos: [number, number, number] = [
      end.x + dir.x * halfHeight,
      end.y + dir.y * halfHeight,
      end.z + dir.z * halfHeight,
    ];
    const backwardPos: [number, number, number] = [
      start.x - dir.x * halfHeight,
      start.y - dir.y * halfHeight,
      start.z - dir.z * halfHeight,
    ];

    return {
      forward: { position: forwardPos, rotation: makeRotation(dir) },
      backward: { position: backwardPos, rotation: makeRotation(back) },
    };
  }, [startPos, endPos]);

  useFrame((state) => {
    if (glowRef.current && (style === 'glow' || style === 'neon')) {
      const pulse = Math.sin(state.clock.elapsedTime * 2) * 0.3 + 0.7;
      const material = glowRef.current.material as THREE.MeshBasicMaterial;
      if (material.opacity !== undefined) {
        material.opacity = pulse * (isActive ? 0.6 : 0.3);
      }
    }
    if (shapeRef.current) {
      shapeRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.6) * (Math.PI / 10);
    }
  });

  // Derive arrowhead color from current style
  const arrowColor = useMemo(() => {
    switch (style) {
      case 'glass': return isActive ? '#60a5fa' : '#93c5fd';
      case 'glow': return isActive ? '#fbbf24' : '#fcd34d';
      case 'neon': return isActive ? '#ec4899' : '#f472b6';
      default: return isActive ? '#60a5fa' : '#4b5563';
    }
  }, [style, isActive]);

  const renderArrowHead = (pos: [number, number, number], rotation: [number, number, number]) => (
    <mesh position={pos} rotation={rotation}>
      <coneGeometry args={[ARROW_RADIUS, ARROW_HEIGHT, ARROW_SEGMENTS]} />
      <meshStandardMaterial
        color={arrowColor}
        emissive={arrowColor}
        emissiveIntensity={isActive ? 0.8 : 0.3}
        metalness={0.4}
        roughness={0.3}
      />
    </mesh>
  );

  const renderByStyle = () => {
    switch (style) {
      case 'glass':
        return (
          <>
            <mesh ref={tubeRef}>
              <tubeGeometry args={[path, 20, 0.08, 8, false]} />
              <meshPhysicalMaterial 
                color={isActive ? '#60a5fa' : '#93c5fd'}
                transparent
                opacity={0.4}
                metalness={0.1}
                roughness={0.1}
                transmission={0.9}
                thickness={0.5}
              />
            </mesh>
            <mesh>
              <tubeGeometry args={[path, 20, 0.1, 8, false]} />
              <meshBasicMaterial 
                color="#60a5fa"
                transparent 
                opacity={isActive ? 0.2 : 0.1}
              />
            </mesh>
          </>
        );
      case 'glow':
        return (
          <>
            <mesh ref={tubeRef}>
              <tubeGeometry args={[path, 20, 0.06, 8, false]} />
              <meshStandardMaterial 
                color={isActive ? '#fbbf24' : '#fcd34d'}
                emissive="#fbbf24"
                emissiveIntensity={isActive ? 1.5 : 0.8}
              />
            </mesh>
            <mesh ref={glowRef}>
              <tubeGeometry args={[path, 20, 0.13, 8, false]} />
              <meshBasicMaterial 
                color="#fbbf24"
                transparent 
                opacity={isActive ? 0.4 : 0.2}
              />
            </mesh>
          </>
        );
      case 'neon':
        return (
          <>
            <mesh ref={tubeRef}>
              <tubeGeometry args={[path, 20, 0.05, 8, false]} />
              <meshStandardMaterial 
                color={isActive ? '#ec4899' : '#f472b6'}
                emissive={isActive ? '#ec4899' : '#f472b6'}
                emissiveIntensity={2}
              />
            </mesh>
            <mesh ref={glowRef}>
              <tubeGeometry args={[path, 20, 0.1, 8, false]} />
              <meshBasicMaterial 
                color="#ec4899"
                transparent 
                opacity={0.5}
              />
            </mesh>
            <mesh>
              <tubeGeometry args={[path, 20, 0.15, 8, false]} />
              <meshBasicMaterial 
                color="#ec4899"
                transparent 
                opacity={isActive ? 0.2 : 0.1}
              />
            </mesh>
          </>
        );
      case 'standard':
      default:
        return (
          <mesh ref={tubeRef}>
            <tubeGeometry args={[path, 20, 0.08, 8, false]} />
            <meshStandardMaterial 
              color={isActive ? '#60a5fa' : '#4b5563'}
              emissive={isActive ? '#3b82f6' : '#000000'}
              emissiveIntensity={isActive ? 0.5 : 0}
              metalness={0.5}
              roughness={0.3}
            />
          </mesh>
        );
    }
  };

  // In arrow mode, default to forward when direction is unset
  const effectiveArrowDirection: ArrowDirection =
    connectionType === 'arrow' && (!arrowDirection || arrowDirection === 'none')
      ? 'forward'
      : arrowDirection ?? 'none';

  // Classic "→" arrow sign: straight shaft + two V-shaped arms at the tip + soft glow.
  // The arrow sits at cube-center height (same Y as the tube) but is trimmed so it
  // does not touch the cube geometry on either end.
  const renderArrowSign = () => {
    // Cube half-size = 1.0; trim each end back by this amount to leave a clear gap.
    const TRIM_GAP = 1.35;
    const SHAFT_R = 0.07;   // main shaft cylinder radius (slightly smaller)
    const GLOW_R  = 0.18;   // glow halo radius (wider, transparent)
    const GLOW_OPACITY = isActive ? 0.38 : 0.20;
    const ARM_LEN    = 1.0;  // length of each arrowhead arm tube
    const ARM_SPREAD = 0.50; // perpendicular distance between arm endpoints

    const mainColor = arrowColor;
    const emissiveIntensity = isActive ? 1.3 : 0.55;

    // Use the same Y as the cubes/tube (startPos[1] == endPos[1] == 0 from layoutCalculator)
    const rawS = new THREE.Vector3(...startPos);
    const rawE = new THREE.Vector3(...endPos);
    const totalDist = rawS.distanceTo(rawE);
    if (totalDist < 0.01) return null;

    const dir = new THREE.Vector3().subVectors(rawE, rawS).normalize();

    // Trim both endpoints back so the shaft clears cube surfaces.
    // Cap at 40% of total distance (i.e. 20% per side) so the shaft never
    // collapses to zero length when cubes are placed very close together.
    const trimPerEndpoint = Math.min(TRIM_GAP, totalDist * 0.4);
    const s = rawS.clone().addScaledVector(dir,  trimPerEndpoint);
    const e = rawE.clone().addScaledVector(dir, -trimPerEndpoint);

    if (s.distanceTo(e) < 0.01) return null;

    // Perpendicular in XZ plane for the V-arms (check length before normalizing)
    const rawPerp = new THREE.Vector3().crossVectors(dir, new THREE.Vector3(0, 1, 0));
    const perp = rawPerp.length() > 0.001 ? rawPerp.normalize() : new THREE.Vector3(1, 0, 0);

    // Forward arrowhead: tip at e, arms angled back+spread
    const fwdArm1 = e.clone().addScaledVector(dir, -ARM_LEN).addScaledVector(perp,  ARM_SPREAD);
    const fwdArm2 = e.clone().addScaledVector(dir, -ARM_LEN).addScaledVector(perp, -ARM_SPREAD);
    // Backward arrowhead: tip at s, arms angled forward+spread
    const bwdArm1 = s.clone().addScaledVector(dir,  ARM_LEN).addScaledVector(perp,  ARM_SPREAD);
    const bwdArm2 = s.clone().addScaledVector(dir,  ARM_LEN).addScaledVector(perp, -ARM_SPREAD);

    const showFwd = effectiveArrowDirection === 'forward' || effectiveArrowDirection === 'bidirectional';
    const showBwd = effectiveArrowDirection === 'backward' || effectiveArrowDirection === 'bidirectional';

    // Helper: render a cylinder between two world-space points
    const cyl = (p1: THREE.Vector3, p2: THREE.Vector3, radius: number, glow: boolean) => {
      const delta = new THREE.Vector3().subVectors(p2, p1);
      const h = delta.length();
      if (h < 0.001) return null;
      const mid = p1.clone().lerp(p2, 0.5);
      const unitDir = delta.clone().normalize();
      const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), unitDir);
      const eu = new THREE.Euler().setFromQuaternion(q);
      return (
        <mesh position={[mid.x, mid.y, mid.z]} rotation={[eu.x, eu.y, eu.z]}>
          <cylinderGeometry args={[radius, radius, h, 8, 1]} />
          {glow
            ? <meshBasicMaterial color={mainColor} transparent opacity={GLOW_OPACITY} depthWrite={false} />
            : <meshStandardMaterial color={mainColor} emissive={mainColor} emissiveIntensity={emissiveIntensity} metalness={0.2} roughness={0.3} />
          }
        </mesh>
      );
    };

    return (
      <>
        {/* Glow halos (wider, transparent, drawn behind solid parts) */}
        {cyl(s, e, GLOW_R, true)}
        {showFwd && cyl(e, fwdArm1, GLOW_R, true)}
        {showFwd && cyl(e, fwdArm2, GLOW_R, true)}
        {showBwd && cyl(s, bwdArm1, GLOW_R, true)}
        {showBwd && cyl(s, bwdArm2, GLOW_R, true)}
        {/* Solid arrow: shaft + arms */}
        {cyl(s, e, SHAFT_R, false)}
        {showFwd && cyl(e, fwdArm1, SHAFT_R, false)}
        {showFwd && cyl(e, fwdArm2, SHAFT_R, false)}
        {showBwd && cyl(s, bwdArm1, SHAFT_R, false)}
        {showBwd && cyl(s, bwdArm2, SHAFT_R, false)}
      </>
    );
  };


  const handlePointerOver = (e: React.PointerEvent<THREE.Group>) => {
    e.stopPropagation();
    if (onClick) {
      document.body.style.cursor = 'pointer';
    }
  };

  const handlePointerOut = () => {
    document.body.style.cursor = 'default';
  };

  return (
    <group onClick={onClick} onPointerOver={handlePointerOver} onPointerOut={handlePointerOut}>
      {connectionType === 'arrow' ? (
        renderArrowSign()
      ) : (
        <>
          {renderByStyle()}
          {(effectiveArrowDirection === 'forward' || effectiveArrowDirection === 'bidirectional') &&
            renderArrowHead(arrowTransforms.forward.position, arrowTransforms.forward.rotation)}
          {(effectiveArrowDirection === 'backward' || effectiveArrowDirection === 'bidirectional') &&
            renderArrowHead(arrowTransforms.backward.position, arrowTransforms.backward.rotation)}
        </>
      )}
      {shapeType && (
        <group ref={shapeRef} position={[midPoint.x, midPoint.y, midPoint.z]}>
          <Shape3D 
            shapeType={shapeType}
            size={0.8}
            color="#fbbf24"
            emissive={shapeType === 'custom3dElement' || shapeType === 'uploadedModel' ? '#000000' : '#f59e0b'}
            emissiveIntensity={shapeType === 'custom3dElement' || shapeType === 'uploadedModel' ? 0 : 0.5}
            custom3dElementId={custom3dElementId}
            uploadedModelId={uploadedModelId}
            modelScale={shapeModelScale}
            modelPositionY={shapeModelPositionY}
            modelRotationY={shapeModelRotationY}
            engravedBlockParams={engravedBlockParams}
            shareToken={shareToken}
          />
        </group>
      )}
    </group>
  );
};

interface UnifiedModelProps {
  project: ProjectData;
  currentStepId: string | null;
  nodePositions: Record<string, { x: number; y: number }>;
  onConnectionClick?: (title: string | undefined, description: string) => void;
  onStepClick?: (stepId: string) => void;
  allowDimming?: boolean;
  shareToken?: string;
}

const UnifiedModel = ({ project, currentStepId, nodePositions, onConnectionClick, onStepClick, allowDimming = true, shareToken }: UnifiedModelProps) => {
  const steps = project.steps;
  
  const layout = useMemo(() => {
    return calculateCreatorBasedLayout(steps, nodePositions);
  }, [steps, nodePositions]);
  
  const positions: [number, number, number][] = useMemo(() => {
    return steps.map(step => {
      const pos = layout.get(step.id);
      return pos ? [pos.x, pos.y, pos.z] : [0, 0, 0];
    });
  }, [steps, layout]);

  const connections = useMemo(() => {
    const stepIdToIndex = new Map(steps.map((s, i) => [s.id, i]));
    
    return project.connections
      .map(conn => {
        const sourceIndex = stepIdToIndex.get(conn.source);
        const targetIndex = stepIdToIndex.get(conn.target);
        if (sourceIndex === undefined || targetIndex === undefined) {
          return null;
        }
        return { 
          sourceIndex, 
          targetIndex, 
          style: conn.data?.style || 'standard' as ConnectionStyle,
          title: conn.data?.title,
          description: conn.data?.description,
          shapeType: conn.data?.shapeType,
          custom3dElementId: conn.data?.custom3dElementId,
          uploadedModelId: conn.data?.uploadedModelId,
          shapeModelScale: conn.data?.shapeModelScale,
          shapeModelPositionY: conn.data?.shapeModelPositionY,
          shapeModelRotationY: conn.data?.shapeModelRotationY,
          arrowDirection: conn.data?.arrowDirection,
          connectionType: conn.data?.connectionType,
          engravedBlockParams: conn.data?.engravedBlockParams,
        } as ConnectionWithIndices;
      })
      .filter((c): c is ConnectionWithIndices => c !== null);
  }, [project.connections, steps]);

  const isConnectionActive = (sourceIndex: number, targetIndex: number) => {
    if (!currentStepId) return false;
    const currentIndex = steps.findIndex(s => s.id === currentStepId);
    return sourceIndex === currentIndex || targetIndex === currentIndex;
  };

  return (
    <group>
      {steps.map((step, index) => (
        <StepCube
          key={step.id}
          step={step}
          position={positions[index]}
          isActive={step.id === currentStepId}
          hasActiveStep={!!currentStepId}
          allowDimming={allowDimming}
          onClick={onStepClick ? () => onStepClick(step.id) : undefined}
          shareToken={shareToken}
        />
      ))}
      {connections.map((conn, index) => (
        <ConnectionTube
          key={index}
          startPos={positions[conn.sourceIndex]}
          endPos={positions[conn.targetIndex]}
          isActive={isConnectionActive(conn.sourceIndex, conn.targetIndex)}
          style={conn.style}
          description={conn.description}
          shapeType={conn.shapeType}
          custom3dElementId={conn.custom3dElementId}
          uploadedModelId={conn.uploadedModelId}
          shapeModelScale={conn.shapeModelScale}
          shapeModelPositionY={conn.shapeModelPositionY}
          shapeModelRotationY={conn.shapeModelRotationY}
          arrowDirection={conn.arrowDirection}
          connectionType={conn.connectionType}
          engravedBlockParams={conn.engravedBlockParams}
          shareToken={shareToken}
          onClick={(conn.title || conn.description) && onConnectionClick ? () => onConnectionClick(conn.title, conn.description || '') : undefined}
        />
      ))}
    </group>
  );
};

interface CameraControllerProps {
  project: ProjectData;
  currentStepId: string | null;
  nodePositions: Record<string, { x: number; y: number }>;
  cameraMode: 'auto' | 'free';
  orbitControlsRef: React.RefObject<OrbitControlsImpl | null>;
}

const CAMERA_DISTANCE = 30;
const CAMERA_HEIGHT = 14;
const LERP_FACTOR = 0.07;

const CameraController = ({ project, currentStepId, nodePositions, cameraMode, orbitControlsRef }: CameraControllerProps) => {
  const { camera } = useThree();
  // Initialise targets to match the <PerspectiveCamera> default so the first
  // frame never snaps away from the starting position.
  const targetPos    = useRef(new THREE.Vector3(0, 40, 70));
  const targetLookAt = useRef(new THREE.Vector3(0, 0, 0));
  const previousStepId = useRef<string | null>(null);
  const isFirstAutoMove = useRef(true);

  const layout = useMemo(() => {
    return calculateCreatorBasedLayout(project.steps, nodePositions);
  }, [project.steps, nodePositions]);

  useEffect(() => {
    if (cameraMode !== 'auto') return;
    if (currentStepId === previousStepId.current) return;
    previousStepId.current = currentStepId;

    if (!currentStepId) {
      targetPos.current.set(0, 20, 35);
      targetLookAt.current.set(0, 0, 0);
      isFirstAutoMove.current = true;
      return;
    }

    const stepPos = layout.get(currentStepId);
    if (!stepPos) {
      targetPos.current.set(0, 20, 35);
      targetLookAt.current.set(0, 0, 0);
      isFirstAutoMove.current = true;
      return;
    }

    targetPos.current.set(stepPos.x, stepPos.y + CAMERA_HEIGHT, stepPos.z + CAMERA_DISTANCE);
    targetLookAt.current.set(stepPos.x, stepPos.y, stepPos.z);

    // Snap camera immediately on the very first auto-move so users see the
    // correct element right away instead of a long crawl from (0,40,70).
    if (isFirstAutoMove.current) {
      isFirstAutoMove.current = false;
      camera.position.copy(targetPos.current);
      if (orbitControlsRef.current) {
        orbitControlsRef.current.target.copy(targetLookAt.current);
        orbitControlsRef.current.update();
      }
    }
  }, [currentStepId, project, layout, cameraMode, camera, orbitControlsRef]);

  // Also reset isFirstAutoMove when cameraMode switches to auto
  useEffect(() => {
    if (cameraMode === 'auto') {
      isFirstAutoMove.current = true;
      previousStepId.current = null;
    }
  }, [cameraMode]);

  useFrame(() => {
    if (cameraMode === 'free') return;

    // Lerp camera position
    camera.position.lerp(targetPos.current, LERP_FACTOR);

    // Lerp OrbitControls target (look-at point) and update the controls.
    // This keeps OrbitControls' internal state in sync so it doesn't fight
    // against our manual position changes.
    if (orbitControlsRef.current) {
      orbitControlsRef.current.target.lerp(targetLookAt.current, LERP_FACTOR);
      orbitControlsRef.current.update();
    } else {
      camera.lookAt(targetLookAt.current);
    }
  });

  return null;
};

interface Viewer3DProps {
  project: ProjectData | null;
  currentStepId: string | null;
  nodePositions?: Record<string, { x: number; y: number }>;
  cameraMode?: 'auto' | 'free';
  showStepOverlay?: boolean;
  onStepSelect?: (stepId: string) => void;
  /** Share token from the public share-link URL, forwarded as ?project_uuid= on /elements and /models API calls. */
  shareToken?: string;
}

export const Viewer3D = ({ project, currentStepId, nodePositions = {}, cameraMode = 'free', showStepOverlay = true, onStepSelect, shareToken }: Viewer3DProps) => {
  const currentStep = project?.steps.find(s => s.id === currentStepId);
  const [selectedConnection, setSelectedConnection] = useState<{ title?: string; description: string } | null>(null);
  const orbitControlsRef = useRef<OrbitControlsImpl | null>(null);
  
  const handleConnectionClick = (title: string | undefined, description: string) => {
    setSelectedConnection({ title, description });
  };
  
  return (
    <div className="w-full h-full bg-gray-900">
      <Canvas shadows>
        <PerspectiveCamera makeDefault position={[0, 40, 70]} />
        {project && (
          <CameraController 
            project={project}
            currentStepId={currentStepId}
            nodePositions={nodePositions}
            cameraMode={cameraMode}
            orbitControlsRef={orbitControlsRef}
          />
        )}
        
        {!showStepOverlay && (
          <>
            <color attach="background" args={['#0d1117']} />
            <fog attach="fog" color="#0d1117" near={60} far={160} />
          </>
        )}

        {!showStepOverlay ? (
          <>
            <hemisphereLight color="#1e3a5f" groundColor="#0a0a1a" intensity={0.6} />
            <directionalLight
              position={[15, 25, 10]}
              intensity={1.8}
              castShadow
              shadow-mapSize-width={2048}
              shadow-mapSize-height={2048}
              shadow-camera-near={0.5}
              shadow-camera-far={200}
              shadow-camera-left={-50}
              shadow-camera-right={50}
              shadow-camera-top={50}
              shadow-camera-bottom={-50}
            />
            <directionalLight position={[-10, 10, -8]} intensity={0.4} color="#3366cc" />
            <pointLight position={[0, 20, 0]} intensity={0.6} color="#6699ff" />
          </>
        ) : (
          <>
            <ambientLight intensity={0.5} />
            <directionalLight position={[10, 10, 5]} intensity={1} castShadow />
            <pointLight position={[-10, -10, -5]} intensity={0.5} />
          </>
        )}

        {!showStepOverlay && (
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -3, 0]} receiveShadow>
            <planeGeometry args={[300, 300]} />
            <meshStandardMaterial color="#0d1117" roughness={0.9} metalness={0.1} />
          </mesh>
        )}
        
        {project && (
          <UnifiedModel 
            project={project}
            currentStepId={currentStepId}
            nodePositions={nodePositions}
            onConnectionClick={handleConnectionClick}
            onStepClick={onStepSelect}
            allowDimming={false}
            shareToken={shareToken}
          />
        )}
        
        {showStepOverlay && <gridHelper args={[20, 20]} />}
        <OrbitControls ref={orbitControlsRef} enableDamping dampingFactor={0.05} />
      </Canvas>
      
      {showStepOverlay && currentStep && (
        <div className="absolute top-4 left-4 bg-black bg-opacity-70 text-white p-4 rounded-lg max-w-md">
          <h3 className="text-lg font-bold mb-2">{currentStep.title}</h3>
          {isHtmlContent(currentStep.description) ? (
            <div
              className="text-sm rich-text-preview"
              dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(currentStep.description) }}
            />
          ) : (
            <p className="text-sm">{currentStep.description}</p>
          )}
        </div>
      )}
      
      {selectedConnection && (
        <div className="absolute bottom-8 right-6 bg-blue-600 bg-opacity-90 text-white p-4 rounded-lg max-w-sm shadow-xl z-20">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h4 className="text-sm font-bold mb-1">{selectedConnection.title || 'Connection Info'}</h4>
              {selectedConnection.description && <p className="text-sm">{selectedConnection.description}</p>}
            </div>
            <button
              onClick={() => setSelectedConnection(null)}
              className="text-white hover:text-gray-200 text-xl leading-none"
            >
              ×
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
