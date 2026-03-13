/**
 * LandingDemo3D
 *
 * Two-tab interactive 3D demo for the landing page:
 *  • "Zbuduj model" – geometric-shapes assembly (mirrors the Builder path)
 *  • "Wgraj model"  – mechanical robot-arm assembly (mirrors the Upload path)
 *
 * A single <Canvas> is kept alive for both tabs to avoid exhausting the
 * browser's WebGL context budget. `Environment` is intentionally omitted
 * (pure lights only) to prevent context loss on mid-range hardware.
 * Shadow maps are also disabled to avoid the PCFSoftShadowMap deprecation
 * warning in Three.js ≥ 0.168.
 */

import { useRef, useEffect, useState, useCallback } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';

// ─── Shared helpers ───────────────────────────────────────────────────────────

function AutoRotate({ children, paused }) {
  const ref = useRef();
  useFrame((_, delta) => {
    if (!paused && ref.current) ref.current.rotation.y += delta * 0.22;
  });
  return <group ref={ref}>{children}</group>;
}

function PulseRing({ position, color, radius = 1.6, tube = 0.055 }) {
  const ref = useRef();
  useFrame(({ clock }) => {
    if (!ref.current) return;
    const t = clock.getElapsedTime();
    ref.current.scale.setScalar(1 + 0.15 * Math.sin(t * 2.8));
    ref.current.material.opacity = 0.35 + 0.25 * Math.sin(t * 2.8);
  });
  return (
    <mesh ref={ref} position={position}>
      <torusGeometry args={[radius, tube, 12, 64]} />
      <meshBasicMaterial color={color} transparent opacity={0.45} side={THREE.DoubleSide} />
    </mesh>
  );
}

function mat(color, emissive, emissiveIntensity, metalness = 0.65, roughness = 0.35) {
  return { color, emissive, emissiveIntensity, metalness, roughness };
}

function inactive() {
  return mat('#475569', '#0f172a', 0.06);
}

// ═══════════════════════════════════════════════════════════════════════════════
// SCENE A – "Zbuduj model" (Builder path)
// Shows 4 geometric shapes laid out like the actual Viewer3D builder:
//   cube → sphere → cylinder → cone, each step highlighting one shape
// ═══════════════════════════════════════════════════════════════════════════════

const BUILDER_STEPS = [
  {
    id: 0,
    shape: 'cube',
    title: 'Krok 1 – Korpus (sześcian)',
    desc: 'Prostopadłościenny korpus urządzenia. W kroku tym dodajesz główny element i ustawiasz jego wymiary.',
    color: '#3b82f6',
    emissive: '#1e40af',
    badge: '■ Korpus',
  },
  {
    id: 1,
    shape: 'sphere',
    title: 'Krok 2 – Głowica (sfera)',
    desc: 'Sferyczna głowica czujnika. Obróć i ustaw dokładną pozycję na osi Y, by wyrównać z korpusem.',
    color: '#10b981',
    emissive: '#064e3b',
    badge: '● Głowica',
  },
  {
    id: 2,
    shape: 'cylinder',
    title: 'Krok 3 – Wał (cylinder)',
    desc: 'Walcowy wał napędowy łączy głowicę z podstawą. Ustaw wysokość i promień zgodnie z projektem.',
    color: '#a855f7',
    emissive: '#581c87',
    badge: '⬤ Wał',
  },
  {
    id: 3,
    shape: 'cone',
    title: 'Krok 4 – Dysza (stożek)',
    desc: 'Stożkowa dysza wylotowa. Zmień kolor, by wizualnie wyróżnić ten element w instrukcji.',
    color: '#f59e0b',
    emissive: '#78350f',
    badge: '▲ Dysza',
  },
];

// Each shape sits at a different position so all 4 are always visible,
// matching how Viewer3D places nodes across the canvas.
const BUILDER_POSITIONS = [
  [-4.5, 0, 0],
  [-1.5, 0, 0],
  [1.5,  0, 0],
  [4.5,  0, 0],
];

// Connection wire between adjacent shapes
function Wire({ from, to, active }) {
  const path = new THREE.CatmullRomCurve3([
    new THREE.Vector3(...from),
    new THREE.Vector3(...to),
  ]);
  const tubeRef = useRef();
  useFrame(({ clock }) => {
    if (!tubeRef.current) return;
    tubeRef.current.material.opacity = active
      ? 0.55 + 0.35 * Math.sin(clock.getElapsedTime() * 2.5)
      : 0.18;
  });
  return (
    <mesh ref={tubeRef}>
      <tubeGeometry args={[path, 8, 0.07, 8, false]} />
      <meshBasicMaterial color={active ? '#60a5fa' : '#334155'} transparent opacity={0.3} />
    </mesh>
  );
}

function BuilderShape({ shape, position, isActive, color, emissive }) {
  const groupRef = useRef();
  const ringRef  = useRef();

  useFrame(({ clock }) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = Math.sin(clock.getElapsedTime() * 0.5 + position[0]) * 0.35;
    }
    if (ringRef.current && isActive) {
      ringRef.current.rotation.z = clock.getElapsedTime() * 1.1;
      ringRef.current.scale.setScalar(1 + Math.sin(clock.getElapsedTime() * 1.5) * 0.07);
    }
  });

  const props = isActive
    ? mat(color, emissive, 0.75, 0.6, 0.3)
    : inactive();

  const geometry = () => {
    switch (shape) {
      case 'sphere':   return <sphereGeometry args={[1, 32, 32]} />;
      case 'cylinder': return <cylinderGeometry args={[0.7, 0.7, 2, 32]} />;
      case 'cone':     return <coneGeometry args={[0.85, 2, 32]} />;
      default:         return <boxGeometry args={[1.8, 1.8, 1.8]} />;
    }
  };

  return (
    <group position={position}>
      <group ref={groupRef}>
        <mesh>
          {geometry()}
          <meshStandardMaterial {...props} />
        </mesh>
      </group>
      {isActive && (
        <mesh ref={ringRef} position={[0, -1.35, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[1.3, 2.0, 48]} />
          <meshBasicMaterial color={color} transparent opacity={0.65} side={THREE.DoubleSide} />
        </mesh>
      )}
    </group>
  );
}

function BuilderScene({ stepIdx }) {
  return (
    <group>
      {BUILDER_STEPS.map((s, i) => (
        <BuilderShape
          key={s.id}
          shape={s.shape}
          position={BUILDER_POSITIONS[i]}
          isActive={i === stepIdx}
          color={s.color}
          emissive={s.emissive}
        />
      ))}
      {/* Wires between shapes */}
      {BUILDER_POSITIONS.slice(0, -1).map((pos, i) => (
        <Wire
          key={i}
          from={[pos[0] + 1.0, 0, 0]}
          to={[BUILDER_POSITIONS[i + 1][0] - 1.0, 0, 0]}
          active={i === stepIdx || i + 1 === stepIdx}
        />
      ))}
      {/* Subtle grid floor */}
      <gridHelper args={[20, 20, '#1e293b', '#1e293b']} position={[0, -2, 0]} />
    </group>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SCENE B – "Wgraj model" (Upload path)
// Mimics an uploaded GLTF model: multi-part robot arm assembly
// ═══════════════════════════════════════════════════════════════════════════════

const UPLOAD_STEPS = [
  {
    id: 0,
    part: 'base',
    title: 'Krok 1 – Podstawa',
    desc: 'Solidna podstawa montażowa. Kliknij ten element w modelu, by przypisać do niego ten krok instrukcji.',
    color: '#3b82f6',
    emissive: '#1d4ed8',
    badge: '🔩 Podstawa',
  },
  {
    id: 1,
    part: 'column',
    title: 'Krok 2 – Kolumna',
    desc: 'Pionowa kolumna nośna. Zintegrowany kanał kablowy biegnie wzdłuż całej jej wysokości.',
    color: '#10b981',
    emissive: '#065f46',
    badge: '📐 Kolumna',
  },
  {
    id: 2,
    part: 'arm',
    title: 'Krok 3 – Ramię',
    desc: 'Poziome ramię obrotowe — zakres ruchu 270°. Regulowany docisk ustawia kąt z dokładnością ±0,5°.',
    color: '#a855f7',
    emissive: '#6b21a8',
    badge: '🦾 Ramię',
  },
  {
    id: 3,
    part: 'head',
    title: 'Krok 4 – Głowica',
    desc: 'Wymienna głowica robocza (adapter ISO-50). Czas wymiany ~30 s. Kliknij głowicę, by zaznaczyć ten element.',
    color: '#f59e0b',
    emissive: '#92400e',
    badge: '⚙️ Głowica',
  },
];

function partMat(partName, activePart, step) {
  if (partName === activePart) return mat(step.color, step.emissive, 0.6, 0.7, 0.3);
  return mat('#64748b', '#0f172a', 0.06, 0.7, 0.35);
}

function UploadScene({ stepIdx }) {
  const step = UPLOAD_STEPS[stepIdx];
  const baseM   = partMat('base',   step.part, step);
  const colM    = partMat('column', step.part, step);
  const armM    = partMat('arm',    step.part, step);
  const headM   = partMat('head',   step.part, step);

  return (
    <group>
      {/* Base platform */}
      <mesh position={[0, -2.8, 0]}>
        <cylinderGeometry args={[2.4, 2.8, 0.65, 32]} />
        <meshStandardMaterial {...baseM} />
      </mesh>
      {/* Bolts */}
      {[0, 90, 180, 270].map((deg) => {
        const r = (deg * Math.PI) / 180;
        return (
          <mesh key={deg} position={[2.0 * Math.cos(r), -2.55, 2.0 * Math.sin(r)]}>
            <cylinderGeometry args={[0.12, 0.12, 0.32, 8]} />
            <meshStandardMaterial {...baseM} />
          </mesh>
        );
      })}
      {step.part === 'base' && <PulseRing position={[0, -2.8, 0]} color={step.color} radius={2.1} />}

      {/* Column */}
      <mesh position={[0, 0.15, 0]}>
        <cylinderGeometry args={[0.52, 0.62, 5.8, 24]} />
        <meshStandardMaterial {...colM} />
      </mesh>
      <mesh position={[0.53, 0.15, 0.08]}>
        <boxGeometry args={[0.07, 5.3, 0.26]} />
        <meshStandardMaterial {...colM} />
      </mesh>
      {step.part === 'column' && <PulseRing position={[0, 0.15, 0]} color={step.color} radius={1.6} />}

      {/* Arm collar + beam */}
      <mesh position={[0, 2.2, 0]}>
        <cylinderGeometry args={[0.82, 0.82, 0.52, 24]} />
        <meshStandardMaterial {...armM} />
      </mesh>
      <mesh position={[1.6, 2.38, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.28, 0.23, 3.2, 20]} />
        <meshStandardMaterial {...armM} />
      </mesh>
      {step.part === 'arm' && <PulseRing position={[0, 2.2, 0]} color={step.color} radius={1.5} />}

      {/* Head sphere + nozzle */}
      <mesh position={[3.2, 2.38, 0]}>
        <sphereGeometry args={[0.6, 32, 32]} />
        <meshStandardMaterial {...headM} />
      </mesh>
      <mesh position={[3.2, 1.58, 0]}>
        <cylinderGeometry args={[0.17, 0.27, 0.52, 16]} />
        <meshStandardMaterial {...headM} />
      </mesh>
      {step.part === 'head' && <PulseRing position={[3.2, 2.38, 0]} color={step.color} radius={1.1} />}

      <gridHelper args={[20, 20, '#1e293b', '#1e293b']} position={[0, -3.2, 0]} />
    </group>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

const TABS = [
  { id: 'builder', label: 'Zbuduj model 3D', icon: '■●▲', steps: BUILDER_STEPS, camera: [0, 3, 14] },
  { id: 'upload',  label: 'Wgraj model 3D',  icon: '⬆',   steps: UPLOAD_STEPS,  camera: [6, 5, 11] },
];

const STEP_INTERVAL_MS = 3800;

export default function LandingDemo3D() {
  const [tabIdx,   setTabIdx]   = useState(0);
  const [stepIdx,  setStepIdx]  = useState(0);
  const [paused,   setPaused]   = useState(false);
  const timerRef = useRef(null);

  const tab  = TABS[tabIdx];
  const step = tab.steps[stepIdx];

  const startTimer = useCallback((stepsLength) => {
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setStepIdx((i) => (i + 1) % stepsLength);
    }, STEP_INTERVAL_MS);
  }, []);

  useEffect(() => {
    startTimer(tab.steps.length);
    return () => clearInterval(timerRef.current);
  }, [tabIdx, startTimer, tab.steps.length]);

  const handleSelectStep = (idx) => {
    setStepIdx(idx);
    startTimer(tab.steps.length);
  };

  const handleSelectTab = (idx) => {
    setTabIdx(idx);
    setStepIdx(0);
    startTimer(TABS[idx].steps.length);
  };

  return (
    <div className="rounded-3xl overflow-hidden shadow-2xl border border-gray-800 bg-gray-950">
      {/* ── Tab switcher ── */}
      <div className="flex border-b border-gray-800">
        {TABS.map((t, i) => (
          <button
            key={t.id}
            onClick={() => handleSelectTab(i)}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3.5 text-sm font-semibold transition-all ${
              i === tabIdx
                ? 'text-white border-b-2 border-blue-500 bg-gray-900'
                : 'text-gray-500 hover:text-gray-300 hover:bg-gray-900/50'
            }`}
          >
            <span className="text-base leading-none">{t.icon}</span>
            {t.label}
          </button>
        ))}
      </div>

      <div className="flex flex-col lg:flex-row">
        {/* ── 3D Canvas (single context for both tabs) ── */}
        <div
          className="relative w-full lg:w-2/3 h-72 sm:h-96 lg:h-[460px]"
          onPointerEnter={() => setPaused(true)}
          onPointerLeave={() => setPaused(false)}
        >
          <Canvas
            gl={{ antialias: true, powerPreference: 'default' }}
            camera={{ position: tab.camera, fov: 45 }}
          >
            <color attach="background" args={['#0a0f1a']} />
            <fog attach="fog" color="#0a0f1a" near={20} far={45} />

            <ambientLight intensity={0.55} />
            <directionalLight position={[8, 12, 8]}  intensity={1.3} />
            <directionalLight position={[-6, 5, -6]} intensity={0.4} />
            <pointLight       position={[0, 8, 0]}   intensity={0.6} color="#6366f1" />

            <PerspectiveCamera makeDefault position={tab.camera} fov={45} />

            <AutoRotate paused={paused}>
              {tabIdx === 0
                ? <BuilderScene stepIdx={stepIdx} />
                : <UploadScene  stepIdx={stepIdx} />
              }
            </AutoRotate>

            <OrbitControls
              enablePan={false}
              minDistance={6}
              maxDistance={24}
              maxPolarAngle={Math.PI / 1.85}
            />
          </Canvas>

          {/* Hint overlay */}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 bg-black/55 backdrop-blur-sm text-white/65 text-xs px-3 py-1.5 rounded-full pointer-events-none select-none">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5" />
            </svg>
            Przeciągnij aby obrócić · Scroll aby powiększyć
          </div>
        </div>

        {/* ── Step panel ── */}
        <div className="w-full lg:w-1/3 bg-gray-900 flex flex-col p-5 gap-3">
          {/* Active step card */}
          <div
            className="flex-1 rounded-2xl p-5 flex flex-col justify-between transition-all duration-500"
            style={{
              background: `linear-gradient(135deg, ${step.color}1a, ${step.emissive}33)`,
              border: `1.5px solid ${step.color}44`,
            }}
          >
            <div>
              <span
                className="inline-block text-xs font-bold px-3 py-1 rounded-full mb-3"
                style={{ background: `${step.color}28`, color: step.color }}
              >
                {step.badge}
              </span>
              <h3 className="text-white font-bold text-lg leading-snug mb-2">{step.title}</h3>
              <p className="text-gray-300 text-sm leading-relaxed">{step.desc}</p>
            </div>

            {/* Progress dots */}
            <div className="flex items-center gap-2 mt-4">
              {tab.steps.map((s, i) => (
                <button
                  key={s.id}
                  onClick={() => handleSelectStep(i)}
                  className="rounded-full transition-all duration-300 focus:outline-none"
                  style={{
                    width: i === stepIdx ? 24 : 8,
                    height: 8,
                    background: i === stepIdx ? step.color : '#374151',
                  }}
                  aria-label={s.title}
                />
              ))}
            </div>
          </div>

          {/* Step list */}
          <div className="flex flex-col gap-2">
            {tab.steps.map((s, i) => (
              <button
                key={s.id}
                onClick={() => handleSelectStep(i)}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-left transition-all duration-200 ${
                  i === stepIdx ? 'bg-white/10' : 'hover:bg-white/5'
                }`}
              >
                <span
                  className="w-7 h-7 flex items-center justify-center rounded-lg text-xs font-bold flex-shrink-0"
                  style={{
                    background: i === stepIdx ? step.color : '#1f2937',
                    color:      i === stepIdx ? '#fff'      : '#9ca3af',
                  }}
                >
                  {i + 1}
                </span>
                <span className={`text-sm font-medium ${i === stepIdx ? 'text-white' : 'text-gray-400'}`}>
                  {s.title.replace(/^Krok \d+ – /, '')}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
