/**
 * LandingDemo3D
 *
 * Self-contained interactive 3D demo for the landing page.
 * Shows a simple industrial-robot-arm assembly built entirely from Three.js
 * primitives — no external GLTF files required.
 *
 * The demo cycles through 4 "instruction steps", each highlighting a different
 * part of the model and showing a description card — exactly like the real
 * 3D Docs guide experience.
 */

import { useRef, useEffect, useState, useCallback } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Environment } from '@react-three/drei';
import * as THREE from 'three';

// ─── Demo step definitions ────────────────────────────────────────────────────

const DEMO_STEPS = [
  {
    id: 0,
    part: 'base',
    title: 'Krok 1 – Podstawa',
    desc: 'Solidna, stalowa podstawa utrzymuje cały mechanizm w miejscu. Śruby montażowe rozmieszczone są co 90°.',
    color: '#3b82f6',
    emissive: '#1d4ed8',
    badge: '🔩 Podstawa',
  },
  {
    id: 1,
    part: 'column',
    title: 'Krok 2 – Kolumna',
    desc: 'Pionowa kolumna przenosi obciążenie na podstawę. Zintegrowany kanał kablowy biegnie wzdłuż całej jej wysokości.',
    color: '#10b981',
    emissive: '#065f46',
    badge: '📐 Kolumna',
  },
  {
    id: 2,
    part: 'arm',
    title: 'Krok 3 – Ramię',
    desc: 'Poziome ramię może obracać się o 270°. Regulowany docisk pozwala ustawić kąt roboczy z dokładnością ±0,5°.',
    color: '#a855f7',
    emissive: '#6b21a8',
    badge: '🦾 Ramię',
  },
  {
    id: 3,
    part: 'head',
    title: 'Krok 4 – Głowica',
    desc: 'Wymieniana głowica robocza. Obsługuje adaptery narzędziowe standardu ISO-50. Czas wymiany: ~30 sekund.',
    color: '#f59e0b',
    emissive: '#92400e',
    badge: '⚙️ Głowica',
  },
];

// ─── Per-part colour helpers ──────────────────────────────────────────────────

function partColor(partName, activePart, step) {
  if (partName === activePart) {
    return { color: step.color, emissive: step.emissive, emissiveIntensity: 0.55 };
  }
  return { color: '#64748b', emissive: '#0f172a', emissiveIntensity: 0.08 };
}

// ─── Auto-rotating root group ─────────────────────────────────────────────────

function AutoRotate({ children, paused }) {
  const ref = useRef();
  useFrame((_, delta) => {
    if (!paused && ref.current) {
      ref.current.rotation.y += delta * 0.25;
    }
  });
  return <group ref={ref}>{children}</group>;
}

// ─── Floating pulse ring around the active part ───────────────────────────────

function PulseRing({ position, color }) {
  const ref = useRef();
  useFrame(({ clock }) => {
    if (!ref.current) return;
    const t = clock.getElapsedTime();
    const s = 1 + 0.18 * Math.sin(t * 2.8);
    ref.current.scale.setScalar(s);
    ref.current.material.opacity = 0.3 + 0.25 * Math.sin(t * 2.8);
  });
  return (
    <mesh ref={ref} position={position}>
      <torusGeometry args={[1.6, 0.06, 12, 64]} />
      <meshBasicMaterial color={color} transparent opacity={0.45} side={THREE.DoubleSide} />
    </mesh>
  );
}

// ─── 3D assembly ─────────────────────────────────────────────────────────────

function RobotAssembly({ activePart, step }) {
  const baseProps   = partColor('base',   activePart, step);
  const columnProps = partColor('column', activePart, step);
  const armProps    = partColor('arm',    activePart, step);
  const headProps   = partColor('head',   activePart, step);

  return (
    <group>
      {/* ── Base platform ── */}
      <mesh castShadow receiveShadow position={[0, -3, 0]}>
        <cylinderGeometry args={[2.4, 2.8, 0.7, 32]} />
        <meshStandardMaterial
          color={baseProps.color}
          emissive={baseProps.emissive}
          emissiveIntensity={baseProps.emissiveIntensity}
          metalness={0.7}
          roughness={0.3}
        />
      </mesh>

      {/* Small mounting bolts on base */}
      {[0, 90, 180, 270].map((deg) => {
        const rad = (deg * Math.PI) / 180;
        return (
          <mesh key={deg} position={[2.0 * Math.cos(rad), -2.7, 2.0 * Math.sin(rad)]}>
            <cylinderGeometry args={[0.12, 0.12, 0.35, 8]} />
            <meshStandardMaterial
              color={baseProps.color}
              emissive={baseProps.emissive}
              emissiveIntensity={baseProps.emissiveIntensity}
              metalness={0.9}
              roughness={0.2}
            />
          </mesh>
        );
      })}

      {/* Pulse ring when base is active */}
      {activePart === 'base' && <PulseRing position={[0, -3, 0]} color={step.color} />}

      {/* ── Column ── */}
      <mesh castShadow position={[0, 0, 0]}>
        <cylinderGeometry args={[0.55, 0.65, 6, 24]} />
        <meshStandardMaterial
          color={columnProps.color}
          emissive={columnProps.emissive}
          emissiveIntensity={columnProps.emissiveIntensity}
          metalness={0.75}
          roughness={0.25}
        />
      </mesh>

      {/* Cable channel strip */}
      <mesh position={[0.55, 0, 0.08]}>
        <boxGeometry args={[0.08, 5.5, 0.28]} />
        <meshStandardMaterial
          color={columnProps.color}
          emissive={columnProps.emissive}
          emissiveIntensity={columnProps.emissiveIntensity}
          metalness={0.6}
          roughness={0.4}
        />
      </mesh>

      {activePart === 'column' && <PulseRing position={[0, 0, 0]} color={step.color} />}

      {/* ── Arm pivot collar ── */}
      <mesh castShadow position={[0, 2.2, 0]}>
        <cylinderGeometry args={[0.85, 0.85, 0.55, 24]} />
        <meshStandardMaterial
          color={armProps.color}
          emissive={armProps.emissive}
          emissiveIntensity={armProps.emissiveIntensity}
          metalness={0.8}
          roughness={0.2}
        />
      </mesh>

      {/* Arm horizontal beam */}
      <mesh castShadow position={[1.6, 2.4, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.3, 0.25, 3.2, 20]} />
        <meshStandardMaterial
          color={armProps.color}
          emissive={armProps.emissive}
          emissiveIntensity={armProps.emissiveIntensity}
          metalness={0.75}
          roughness={0.25}
        />
      </mesh>

      {activePart === 'arm' && <PulseRing position={[0, 2.3, 0]} color={step.color} />}

      {/* ── Head sphere ── */}
      <mesh castShadow position={[3.2, 2.4, 0]}>
        <sphereGeometry args={[0.62, 32, 32]} />
        <meshStandardMaterial
          color={headProps.color}
          emissive={headProps.emissive}
          emissiveIntensity={headProps.emissiveIntensity}
          metalness={0.6}
          roughness={0.3}
        />
      </mesh>

      {/* Head nozzle */}
      <mesh castShadow position={[3.2, 1.6, 0]}>
        <cylinderGeometry args={[0.18, 0.28, 0.55, 16]} />
        <meshStandardMaterial
          color={headProps.color}
          emissive={headProps.emissive}
          emissiveIntensity={headProps.emissiveIntensity}
          metalness={0.85}
          roughness={0.15}
        />
      </mesh>

      {activePart === 'head' && <PulseRing position={[3.2, 2.4, 0]} color={step.color} />}

      {/* ── Floor grid shadow catcher ── */}
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, -3.4, 0]}>
        <planeGeometry args={[16, 16]} />
        <shadowMaterial transparent opacity={0.25} />
      </mesh>
    </group>
  );
}

// ─── Main exported component ──────────────────────────────────────────────────

export default function LandingDemo3D() {
  const [stepIdx, setStepIdx] = useState(0);
  const [paused, setPaused] = useState(false);
  const timerRef = useRef(null);

  const step = DEMO_STEPS[stepIdx];

  const startTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setStepIdx((i) => (i + 1) % DEMO_STEPS.length);
    }, 3500);
  }, []);

  useEffect(() => {
    startTimer();
    return () => clearInterval(timerRef.current);
  }, [startTimer]);

  const handleSelectStep = (idx) => {
    setStepIdx(idx);
    startTimer(); // restart auto-advance timer
  };

  return (
    <div className="flex flex-col lg:flex-row gap-0 rounded-3xl overflow-hidden shadow-2xl border border-gray-200 bg-gray-950">
      {/* ── 3D Canvas ── */}
      <div
        className="relative w-full lg:w-2/3 h-72 sm:h-96 lg:h-[480px]"
        onPointerEnter={() => setPaused(true)}
        onPointerLeave={() => setPaused(false)}
      >
        <Canvas shadows>
          <PerspectiveCamera makeDefault position={[6, 5, 10]} fov={45} />

          <ambientLight intensity={0.45} />
          <directionalLight
            position={[8, 12, 8]}
            intensity={1.2}
            castShadow
            shadow-mapSize={[1024, 1024]}
          />
          <directionalLight position={[-6, 4, -6]} intensity={0.35} />

          <color attach="background" args={['#0a0f1a']} />
          <fog attach="fog" color="#0a0f1a" near={18} far={40} />

          <Environment preset="city" />

          <AutoRotate paused={paused}>
            <RobotAssembly activePart={step.part} step={step} />
          </AutoRotate>

          <OrbitControls
            enablePan={false}
            minDistance={7}
            maxDistance={22}
            maxPolarAngle={Math.PI / 1.9}
          />
        </Canvas>

        {/* Overlay hint */}
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 bg-black/50 backdrop-blur-sm text-white/70 text-xs px-3 py-1.5 rounded-full pointer-events-none select-none">
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
          style={{ background: `linear-gradient(135deg, ${step.color}22, ${step.emissive}44)`, border: `1.5px solid ${step.color}55` }}
        >
          <div>
            <span
              className="inline-block text-xs font-bold px-3 py-1 rounded-full mb-3"
              style={{ background: `${step.color}33`, color: step.color }}
            >
              {step.badge}
            </span>
            <h3 className="text-white font-bold text-lg leading-snug mb-2">{step.title}</h3>
            <p className="text-gray-300 text-sm leading-relaxed">{step.desc}</p>
          </div>

          {/* Step dots */}
          <div className="flex items-center gap-2 mt-4">
            {DEMO_STEPS.map((s, i) => (
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
          {DEMO_STEPS.map((s, i) => (
            <button
              key={s.id}
              onClick={() => handleSelectStep(i)}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-left transition-all duration-200 ${
                i === stepIdx
                  ? 'bg-white/10 ring-1'
                  : 'hover:bg-white/5'
              }`}
              style={i === stepIdx ? { ringColor: step.color } : {}}
            >
              <span
                className="w-7 h-7 flex items-center justify-center rounded-lg text-xs font-bold flex-shrink-0"
                style={{
                  background: i === stepIdx ? step.color : '#1f2937',
                  color: i === stepIdx ? '#fff' : '#9ca3af',
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
  );
}
