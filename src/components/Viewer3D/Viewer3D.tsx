import { useRef, useEffect, useMemo, Suspense, useState, Component, type ReactNode } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import type { InstructionStep, ConnectionStyle, ShapeType } from '../../types';
import type { ProjectData } from '../../types';
import { calculateCreatorBasedLayout } from '../../utils/layoutCalculator';

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
  description?: string;
  shapeType?: ShapeType;
}

interface CustomModelProps {
  url: string;
  color: string;
  emissive?: string;
  emissiveIntensity?: number;
  scale?: number;
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
const CustomModel = ({ url, color, emissive = '#000000', emissiveIntensity = 0, scale = 1 }: CustomModelProps) => {
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
  
  return <CustomModelRenderer url={blobUrl} color={color} emissive={emissive} emissiveIntensity={emissiveIntensity} scale={scale} />;
};

// Actual renderer component that uses useGLTF
const CustomModelRenderer = ({ url, color, emissive = '#000000', emissiveIntensity = 0, scale = 1 }: CustomModelProps) => {
  // useGLTF handles loading and caching of GLTF models
  // It throws a promise during loading (Suspense) and an error on failure
  const { scene } = useGLTF(url);
  
  // Clone the scene to avoid modifying the cached version
  const clonedScene = useMemo(() => scene.clone(), [scene]);
  
  // Apply material properties to all meshes in the model
  useEffect(() => {
    clonedScene.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = true;
        if (child.material) {
          // Create a new material - handle different material types
          const oldMaterial = child.material as THREE.Material;
          const metalness = (oldMaterial as any).metalness ?? 0.5;
          const roughness = (oldMaterial as any).roughness ?? 0.5;
          
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
  }, [clonedScene, color, emissive, emissiveIntensity]);
  
  // Apply scale to the model (centering disabled to preserve user positioning)
  useEffect(() => {
    clonedScene.scale.set(scale, scale, scale);
    
    // Note: Centering is disabled because it can cause position shifts when models are reloaded
    // Users can position models manually in the scene
    // If centering is needed, it should be done once and the offset stored in the step data
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
}

// Reusable 3D shape component
const Shape3D = ({ shapeType = 'cube', size = 2, color, emissive = '#000000', emissiveIntensity = 0, customModelUrl, modelScale = 1 }: Shape3DProps) => {
  // If custom model URL is provided and shapeType is 'custom', render the custom model
  if (shapeType === 'custom' && customModelUrl) {
    return (
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
    <mesh castShadow>
      {renderGeometry()}
      <meshStandardMaterial 
        color={color}
        emissive={emissive}
        emissiveIntensity={emissiveIntensity}
      />
    </mesh>
  );
};

interface StepCubeProps {
  step: InstructionStep;
  position: [number, number, number];
  isActive: boolean;
}

// Individual step shape component
const StepCube = ({ step, position, isActive }: StepCubeProps) => {
  const meshRef = useRef<THREE.Group>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  
  // Gentle rotation animation
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.003;
    }
    
    // Pulsing glow effect for active step
    if (glowRef.current && isActive) {
      const scale = 1 + Math.sin(state.clock.elapsedTime * 2) * 0.1;
      glowRef.current.scale.set(scale, scale, scale);
    }
  });

  const color = step.highlightColor || '#4299e1';
  const shapeType = step.shapeType || 'cube';

  // Get appropriate glow geometry based on shape type
  const renderGlowGeometry = () => {
    const glowSize = 2.3;
    switch (shapeType) {
      case 'sphere':
        return <sphereGeometry args={[glowSize / 2, 32, 32]} />;
      case 'cylinder':
        return <cylinderGeometry args={[glowSize / 2, glowSize / 2, glowSize, 32]} />;
      case 'cone':
        return <coneGeometry args={[glowSize / 2, glowSize, 32]} />;
      case 'cube':
      default:
        return <boxGeometry args={[glowSize, glowSize, glowSize]} />;
    }
  };

  return (
    <group position={position}>
      {/* Main shape */}
      <group ref={meshRef}>
        <Shape3D 
          shapeType={shapeType}
          size={2}
          color={color}
          emissive={isActive ? color : '#000000'}
          emissiveIntensity={isActive ? 0.3 : 0}
          customModelUrl={step.customModelUrl}
          modelScale={step.modelScale}
        />
      </group>
      
      {/* Glowing outline for active step - only for primitive shapes, not custom models */}
      {isActive && shapeType !== 'custom' && (
        <mesh ref={glowRef}>
          {renderGlowGeometry()}
          <meshBasicMaterial 
            color={color}
            transparent 
            opacity={0.2}
            side={THREE.BackSide}
          />
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
  onClick?: () => void;
}

// Connection tube between steps
const ConnectionTube = ({ startPos, endPos, isActive, style = 'standard', shapeType, onClick }: ConnectionTubeProps) => {
  const tubeRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  const shapeRef = useRef<THREE.Group>(null);
  
  // Memoize the path to avoid recreating on every render
  const path = useMemo(() => {
    return new THREE.CatmullRomCurve3([
      new THREE.Vector3(...startPos),
      new THREE.Vector3(...endPos),
    ]);
  }, [startPos, endPos]);
  
  // Calculate midpoint for shape placement
  const midPoint = useMemo(() => {
    const mid = new THREE.Vector3(
      (startPos[0] + endPos[0]) / 2,
      (startPos[1] + endPos[1]) / 2 + 2, // Elevated above the connection
      (startPos[2] + endPos[2]) / 2
    );
    return mid;
  }, [startPos, endPos]);

  // Animate glow effect for glow and neon styles
  useFrame((state) => {
    if (glowRef.current && (style === 'glow' || style === 'neon')) {
      const pulse = Math.sin(state.clock.elapsedTime * 2) * 0.3 + 0.7;
      const material = glowRef.current.material as THREE.MeshBasicMaterial;
      if (material.opacity !== undefined) {
        material.opacity = pulse * (isActive ? 0.6 : 0.3);
      }
    }
    
    // Rotate shape if shown
    if (shapeRef.current) {
      shapeRef.current.rotation.y += 0.01;
      shapeRef.current.rotation.x += 0.005;
    }
  });

  // Style-specific rendering
  const renderByStyle = () => {
    switch (style) {
      case 'glass':
        return (
          <>
            <mesh ref={tubeRef}>
              <tubeGeometry args={[path, 20, 0.15, 8, false]} />
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
            {/* Outer glow for glass */}
            <mesh>
              <tubeGeometry args={[path, 20, 0.18, 8, false]} />
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
              <tubeGeometry args={[path, 20, 0.12, 8, false]} />
              <meshStandardMaterial 
                color={isActive ? '#fbbf24' : '#fcd34d'}
                emissive="#fbbf24"
                emissiveIntensity={isActive ? 1.5 : 0.8}
              />
            </mesh>
            {/* Outer glow effect */}
            <mesh ref={glowRef}>
              <tubeGeometry args={[path, 20, 0.25, 8, false]} />
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
              <tubeGeometry args={[path, 20, 0.1, 8, false]} />
              <meshStandardMaterial 
                color={isActive ? '#ec4899' : '#f472b6'}
                emissive={isActive ? '#ec4899' : '#f472b6'}
                emissiveIntensity={2}
              />
            </mesh>
            {/* Neon glow layers */}
            <mesh ref={glowRef}>
              <tubeGeometry args={[path, 20, 0.2, 8, false]} />
              <meshBasicMaterial 
                color="#ec4899"
                transparent 
                opacity={0.5}
              />
            </mesh>
            <mesh>
              <tubeGeometry args={[path, 20, 0.3, 8, false]} />
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
            <tubeGeometry args={[path, 20, 0.15, 8, false]} />
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
      {renderByStyle()}
      
      {/* Optional shape above connection */}
      {shapeType && (
        <group ref={shapeRef} position={[midPoint.x, midPoint.y, midPoint.z]}>
          <Shape3D 
            shapeType={shapeType}
            size={0.8}
            color="#fbbf24"
            emissive="#f59e0b"
            emissiveIntensity={0.5}
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
  onConnectionClick?: (description: string) => void;
}

// Unified model containing all steps
const UnifiedModel = ({ project, currentStepId, nodePositions, onConnectionClick }: UnifiedModelProps) => {
  const steps = project.steps;
  
  // Calculate layout based on creator positions
  const layout = useMemo(() => {
    return calculateCreatorBasedLayout(steps, nodePositions);
  }, [steps, nodePositions]);
  
  // Convert layout to position array, preserving step order
  const positions: [number, number, number][] = useMemo(() => {
    return steps.map(step => {
      const pos = layout.get(step.id);
      return pos ? [pos.x, pos.y, pos.z] : [0, 0, 0];
    });
  }, [steps, layout]);

  // Memoize connections calculation with optimized lookups
  const connections = useMemo(() => {
    // Create a map for fast step ID to index lookup
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
          description: conn.data?.description,
          shapeType: conn.data?.shapeType
        } as ConnectionWithIndices;
      })
      .filter((c): c is ConnectionWithIndices => c !== null);
  }, [project.connections, steps]);

  // Check if connection is active (involves current step)
  const isConnectionActive = (sourceIndex: number, targetIndex: number) => {
    if (!currentStepId) return false;
    const currentIndex = steps.findIndex(s => s.id === currentStepId);
    return sourceIndex === currentIndex || targetIndex === currentIndex;
  };

  return (
    <group>
      {/* Render all step cubes */}
      {steps.map((step, index) => (
        <StepCube
          key={step.id}
          step={step}
          position={positions[index]}
          isActive={step.id === currentStepId}
        />
      ))}
      
      {/* Render connection tubes */}
      {connections.map((conn, index) => (
        <ConnectionTube
          key={index}
          startPos={positions[conn.sourceIndex]}
          endPos={positions[conn.targetIndex]}
          isActive={isConnectionActive(conn.sourceIndex, conn.targetIndex)}
          style={conn.style}
          description={conn.description}
          shapeType={conn.shapeType}
          onClick={conn.description && onConnectionClick ? () => onConnectionClick(conn.description as string) : undefined}
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
}

// Component to smoothly transition camera to focus on current step
const CameraController = ({ project, currentStepId, nodePositions, cameraMode }: CameraControllerProps) => {
  const { camera } = useThree();
  const targetPos = useRef(new THREE.Vector3());
  const targetLookAt = useRef(new THREE.Vector3());
  const previousStepId = useRef<string | null>(null);

  // Memoize layout calculation
  const layout = useMemo(() => {
    return calculateCreatorBasedLayout(project.steps, nodePositions);
  }, [project.steps, nodePositions]);

  useEffect(() => {
    // When switching to auto mode from free mode, or when step changes in auto mode
    if (cameraMode === 'auto' && currentStepId !== previousStepId.current) {
      previousStepId.current = currentStepId;
      
      if (!currentStepId || !project) {
        // Default camera position to see all cubes
        targetPos.current.set(0, 20, 35);
        targetLookAt.current.set(0, 0, 0);
        return;
      }

      const currentStep = project.steps.find(s => s.id === currentStepId);
      if (!currentStep) {
        targetPos.current.set(0, 20, 35);
        targetLookAt.current.set(0, 0, 0);
        return;
      }

      // Get position of current step from memoized layout
      const stepPos = layout.get(currentStepId);
      
      if (!stepPos) {
        targetPos.current.set(0, 20, 35);
        targetLookAt.current.set(0, 0, 0);
        return;
      }
      
      // Position camera to focus on current cube but keep context visible
      const cameraDistance = 35;
      const cameraHeight = 15;
      
      targetPos.current.set(stepPos.x, cameraHeight, stepPos.z + cameraDistance);
      targetLookAt.current.set(stepPos.x, stepPos.y, stepPos.z);
    }
  }, [currentStepId, project, layout, cameraMode]);

  useFrame(() => {
    // Skip camera animation in free mode
    if (cameraMode === 'free') return;
    
    // Smooth camera movement
    camera.position.lerp(targetPos.current, 0.05);
    
    const currentLookAt = new THREE.Vector3();
    camera.getWorldDirection(currentLookAt);
    currentLookAt.multiplyScalar(10);
    currentLookAt.add(camera.position);
    
    currentLookAt.lerp(targetLookAt.current, 0.05);
    camera.lookAt(currentLookAt);
  });

  return null;
};

interface Viewer3DProps {
  project: ProjectData | null;
  currentStepId: string | null;
  nodePositions?: Record<string, { x: number; y: number }>;
  cameraMode?: 'auto' | 'free';
}

export const Viewer3D = ({ project, currentStepId, nodePositions = {}, cameraMode = 'auto' }: Viewer3DProps) => {
  const currentStep = project?.steps.find(s => s.id === currentStepId);
  const [selectedConnectionDesc, setSelectedConnectionDesc] = useState<string | null>(null);
  
  const handleConnectionClick = (description: string) => {
    setSelectedConnectionDesc(description);
  };
  
  return (
    <div className="w-full h-full bg-gray-900">
      <Canvas shadows>
        <PerspectiveCamera makeDefault position={[0, 20, 35]} />
        {project && (
          <CameraController 
            project={project}
            currentStepId={currentStepId}
            nodePositions={nodePositions}
            cameraMode={cameraMode}
          />
        )}
        
        {/* Lighting */}
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 5]} intensity={1} castShadow />
        <pointLight position={[-10, -10, -5]} intensity={0.5} />
        
        {/* Unified 3D Model with all steps */}
        {project && (
          <UnifiedModel 
            project={project}
            currentStepId={currentStepId}
            nodePositions={nodePositions}
            onConnectionClick={handleConnectionClick}
          />
        )}
        
        {/* Grid helper */}
        <gridHelper args={[20, 20]} />
        
        {/* Controls - always enabled for free camera movement */}
        <OrbitControls enableDamping dampingFactor={0.05} />
      </Canvas>
      
      {/* Overlay info */}
      {currentStep && (
        <div className="absolute top-4 left-4 bg-black bg-opacity-70 text-white p-4 rounded-lg max-w-md">
          <h3 className="text-lg font-bold mb-2">{currentStep.title}</h3>
          <p className="text-sm">{currentStep.description}</p>
        </div>
      )}
      
      {/* Connection description overlay */}
      {selectedConnectionDesc && (
        <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 bg-blue-600 bg-opacity-90 text-white p-4 rounded-lg max-w-md shadow-xl">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h4 className="text-sm font-bold mb-1">Connection Info</h4>
              <p className="text-sm">{selectedConnectionDesc}</p>
            </div>
            <button
              onClick={() => setSelectedConnectionDesc(null)}
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
