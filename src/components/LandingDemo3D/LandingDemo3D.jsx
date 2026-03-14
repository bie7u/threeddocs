/**
 * LandingDemo3D
 *
 * Two-tab interactive 3D demo for the landing page:
 *  • "Diagram Architektury" – IT system architecture (API, LB, Auth, Cache, DB)
 *  • "Szafa Serwerowa"      – 19" server rack (network switch, app servers, storage)
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
// SCENE A – "Diagram Architektury" (IT system architecture)
//
// Demonstrates ALL key builder features:
//  • 5 distinct shape types: sphere, cylinder, cube, cone, DB-stack (engravedBlock)
//  • 4 connection styles:   standard · glow · glass · neon
//  • Arrow directions:      forward (→) and bidirectional (↔)
//  • Animated pulse rings on the active node
//  • Per-step highlight + active-connection pulse
//
// Layout (top view):
//
//  [🌐 User]──standard──►[⚖ LB]──glow──►[⚡ API]──glass──►[⚡ Cache]
//                                          ↕ bidirectional         │neon
//                                        [🔐 Auth]              [🗄 DB]
// ═══════════════════════════════════════════════════════════════════════════════

const BUILDER_STEPS = [
  {
    id: 0, nodeId: 'user',
    title: 'Krok 1 – Klient (Przeglądarka)',
    desc: 'Dzień 1 onboardingu: tu zaczyna się każde żądanie. Nowy developer widzi dokładnie skąd pochodzi ruch — jeden węzeł, jedna informacja.',
    color: '#3b82f6', emissive: '#1e40af',
    badge: '🌐 Klient',
  },
  {
    id: 1, nodeId: 'lb',
    title: 'Krok 2 – Load Balancer',
    desc: 'Ruch HTTP jest równoważony między instancjami serwera. Zamiast tłumaczyć słowami — nowy dev widzi przepływ danych na własne oczy.',
    color: '#10b981', emissive: '#064e3b',
    badge: '⚖️ Load Balancer',
  },
  {
    id: 2, nodeId: 'api',
    title: 'Krok 3 – API Server (Node.js)',
    desc: 'Centralny węzeł architektury. Interaktywna mapa zamiast 30-stronicowego wiki — developer zapamiętuje strukturę 2× szybciej.',
    color: '#a855f7', emissive: '#581c87',
    badge: '⚡ API Server',
  },
  {
    id: 3, nodeId: 'auth',
    title: 'Krok 4 – Auth Service (JWT)',
    desc: 'Usługa weryfikacji tokenów JWT. Strzałka ↔ pokazuje dwukierunkową komunikację. Mała porcja wiedzy = zero przeciążenia nowego pracownika.',
    color: '#ef4444', emissive: '#991b1b',
    badge: '🔐 Auth Service',
  },
  {
    id: 4, nodeId: 'cache',
    title: 'Krok 5 – Cache (Redis)',
    desc: 'Warstwa cache przyspiesza odczyt danych. Każdy krok zawiera tylko to co ważne — nowy developer poznaje system w logicznej kolejności.',
    color: '#f59e0b', emissive: '#78350f',
    badge: '⚡ Cache (Redis)',
  },
  {
    id: 5, nodeId: 'db',
    title: 'Krok 6 – Baza Danych (PostgreSQL)',
    desc: 'Ostatni węzeł architektury. Po 6 krokach nowy developer rozumie cały stos technologiczny — bez pytania seniorów o podstawy.',
    color: '#06b6d4', emissive: '#0e7490',
    badge: '🗄️ PostgreSQL',
  },
];

// IT system nodes – each maps to a BUILDER_STEPS entry (same index order)
const IT_NODES = [
  { id: 'user',  shape: 'sphere',   pos: [-5,   1.5,  0], color: '#3b82f6', emissive: '#1e40af' },
  { id: 'lb',    shape: 'cylinder', pos: [-1.5, 1.5,  0], color: '#10b981', emissive: '#064e3b' },
  { id: 'api',   shape: 'cube',     pos: [2,    1.5,  0], color: '#a855f7', emissive: '#581c87' },
  { id: 'auth',  shape: 'cone',     pos: [2,    -2.2, 0], color: '#ef4444', emissive: '#991b1b' },
  { id: 'cache', shape: 'sphere',   pos: [5.5,  1.5,  0], color: '#f59e0b', emissive: '#78350f' },
  { id: 'db',    shape: 'dbstack',  pos: [5.5,  -2.2, 0], color: '#06b6d4', emissive: '#0e7490' },
];

// Connections between nodes — each carries style + arrow direction
const IT_CONNECTIONS = [
  {
    // User → Load Balancer (standard tube + forward arrow)
    from: [-3.9, 1.5, 0], to: [-2.5, 1.5, 0],
    nodes: ['user', 'lb'], style: 'standard', dir: 'forward',
  },
  {
    // Load Balancer → API (glow tube + forward arrow)
    from: [-0.6, 1.5, 0], to: [1.0, 1.5, 0],
    nodes: ['lb', 'api'], style: 'glow', dir: 'forward',
  },
  {
    // API ↔ Auth (standard tube + bidirectional arrows)
    from: [2, 0.55, 0], to: [2, -1.2, 0],
    nodes: ['api', 'auth'], style: 'standard', dir: 'bidirectional',
  },
  {
    // API → Cache (glass tube + forward arrow)
    from: [3.0, 1.5, 0], to: [4.4, 1.5, 0],
    nodes: ['api', 'cache'], style: 'glass', dir: 'forward',
  },
  {
    // Cache → DB (neon tube + forward arrow)
    from: [5.5, 0.4, 0], to: [5.5, -1.2, 0],
    nodes: ['cache', 'db'], style: 'neon', dir: 'forward',
  },
];

const CONN_COLORS = {
  standard: { active: '#60a5fa', inactive: '#1e3a5f' },
  glow:     { active: '#fbbf24', inactive: '#3b2b00' },
  glass:    { active: '#c4b5fd', inactive: '#2d1b69' },
  neon:     { active: '#f472b6', inactive: '#4a0d2a' },
};

// ── Arrow connection (tube + cone arrowhead(s)) ───────────────────────────────

function ArrowConnection({ from, to, active, style = 'standard', dir = 'forward' }) {
  const tubeRef = useRef();

  const path = new THREE.CatmullRomCurve3([
    new THREE.Vector3(...from),
    new THREE.Vector3(...to),
  ]);

  const cols  = CONN_COLORS[style] || CONN_COLORS.standard;
  const color = active ? cols.active : cols.inactive;

  useFrame(({ clock }) => {
    if (!tubeRef.current) return;
    const t = clock.getElapsedTime();
    if (active && (style === 'glow' || style === 'neon')) {
      tubeRef.current.material.opacity = 0.5 + 0.4 * Math.sin(t * 3.5);
    } else {
      tubeRef.current.material.opacity = active ? 0.8 : 0.14;
    }
  });

  // Cone geometry: default axis is +Y. Rotate so +Y aligns with travel direction.
  const start = new THREE.Vector3(...from);
  const end   = new THREE.Vector3(...to);
  const fwdDir = new THREE.Vector3().subVectors(end, start).normalize();
  const bwdDir = fwdDir.clone().negate();

  const rotFor = new THREE.Euler().setFromQuaternion(
    new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), fwdDir)
  );
  const rotBwd = new THREE.Euler().setFromQuaternion(
    new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), bwdDir)
  );

  // Place arrowhead with tip at 90 % of the tube, half-cone poking out
  const fwdTip = new THREE.Vector3().lerpVectors(start, end, 0.90);
  const bwdTip = new THREE.Vector3().lerpVectors(start, end, 0.10);

  const ao = active ? 0.95 : 0.14;

  return (
    <group>
      {/* Tube */}
      <mesh ref={tubeRef}>
        <tubeGeometry args={[path, 12, 0.055, 8, false]} />
        <meshBasicMaterial color={color} transparent opacity={active ? 0.8 : 0.14} />
      </mesh>

      {/* Forward arrowhead */}
      {(dir === 'forward' || dir === 'bidirectional') && (
        <mesh position={fwdTip.toArray()} rotation={[rotFor.x, rotFor.y, rotFor.z]}>
          <coneGeometry args={[0.18, 0.44, 8]} />
          <meshBasicMaterial color={color} transparent opacity={ao} />
        </mesh>
      )}

      {/* Backward arrowhead */}
      {dir === 'bidirectional' && (
        <mesh position={bwdTip.toArray()} rotation={[rotBwd.x, rotBwd.y, rotBwd.z]}>
          <coneGeometry args={[0.18, 0.44, 8]} />
          <meshBasicMaterial color={color} transparent opacity={ao} />
        </mesh>
      )}
    </group>
  );
}

// ── IT node (different 3D shape per type) ─────────────────────────────────────

function ITNode({ node, isActive }) {
  const groupRef = useRef();
  const ringRef  = useRef();

  useFrame(({ clock }) => {
    if (groupRef.current) {
      // gentle sway — each node offset by its X position for variety
      groupRef.current.rotation.y =
        Math.sin(clock.getElapsedTime() * 0.45 + node.pos[0] * 0.4) * 0.28;
    }
    if (ringRef.current && isActive) {
      ringRef.current.rotation.z = clock.getElapsedTime() * 1.0;
      ringRef.current.scale.setScalar(1 + Math.sin(clock.getElapsedTime() * 1.5) * 0.07);
    }
  });

  const p = isActive
    ? mat(node.color, node.emissive, 0.72, 0.6, 0.3)
    : inactive();

  const renderMesh = () => {
    switch (node.shape) {
      case 'sphere':
        return (
          <mesh>
            <sphereGeometry args={[1, 32, 32]} />
            <meshStandardMaterial {...p} />
          </mesh>
        );
      case 'cylinder':
        return (
          <mesh>
            <cylinderGeometry args={[0.75, 0.75, 2, 32]} />
            <meshStandardMaterial {...p} />
          </mesh>
        );
      case 'cone':
        return (
          <mesh>
            <coneGeometry args={[0.92, 2.3, 32]} />
            <meshStandardMaterial {...p} />
          </mesh>
        );
      case 'dbstack':
        // Three stacked flat discs — classic database icon.
        // Represents the "Grawerowany Klocek (engravedBlock)" feature where
        // you type text (e.g. "DB") and 3D Docs renders it as a 3D solid.
        return (
          <group>
            {[-0.6, 0, 0.6].map((yOff, i) => (
              <mesh key={i} position={[0, yOff, 0]}>
                <cylinderGeometry args={[1.0, 1.0, 0.38, 32]} />
                <meshStandardMaterial {...p} />
              </mesh>
            ))}
          </group>
        );
      default: // cube / API server
        return (
          <mesh>
            <boxGeometry args={[1.8, 1.8, 1.8]} />
            <meshStandardMaterial {...p} />
          </mesh>
        );
    }
  };

  return (
    <group position={node.pos}>
      <group ref={groupRef}>
        {renderMesh()}
      </group>
      {isActive && (
        <mesh ref={ringRef} position={[0, -1.5, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[1.4, 2.1, 48]} />
          <meshBasicMaterial color={node.color} transparent opacity={0.65} side={THREE.DoubleSide} />
        </mesh>
      )}
    </group>
  );
}

// ── IT system scene ───────────────────────────────────────────────────────────

function BuilderScene({ stepIdx }) {
  const activeNodeId = BUILDER_STEPS[stepIdx]?.nodeId;
  return (
    <group>
      {IT_NODES.map((node, i) => (
        <ITNode key={node.id} node={node} isActive={i === stepIdx} />
      ))}

      {IT_CONNECTIONS.map((conn, i) => (
        <ArrowConnection
          key={i}
          from={conn.from}
          to={conn.to}
          active={conn.nodes.includes(activeNodeId)}
          style={conn.style}
          dir={conn.dir}
        />
      ))}

      <gridHelper args={[22, 22, '#1e293b', '#1e293b']} position={[0, -3.0, 0]} />
    </group>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SCENE B – "Wgraj model" (Upload path)
// Mimics an uploaded GLTF model: multi-part robot arm assembly
// ═══════════════════════════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════════════════════════
// SCENE B – "Szafa Serwerowa" (Upload path)
// Mimics an uploaded GLTF model: a 19" server rack assembly
//
// Parts (4 steps):
//   rack      – outer enclosure (frame pillars + rails)
//   switch    – top-of-rack network switch with port indicators
//   appserver – three 1U application servers with LED / drive indicators
//   storage   – bottom NAS storage array with disc drives
// ═══════════════════════════════════════════════════════════════════════════════

const UPLOAD_STEPS = [
  {
    id: 0,
    part: 'rack',
    title: 'Krok 1 – Szafa Serwerowa 19"',
    desc: 'Obudowa rack 19"/42U — fundament każdej serwerowni. Na onboardingu: zacznij od ogólnego obrazu infrastruktury zanim przejdziesz do szczegółów.',
    color: '#3b82f6',
    emissive: '#1d4ed8',
    badge: '🗄️ Rack 19"',
  },
  {
    id: 1,
    part: 'switch',
    title: 'Krok 2 – Switch Sieciowy (ToR)',
    desc: 'Top-of-Rack switch, 48× 10GbE. Nowy sysadmin widzi od razu jak urządzenia są połączone — zamiast studiować diagram Visio.',
    color: '#10b981',
    emissive: '#065f46',
    badge: '🌐 Network Switch',
  },
  {
    id: 2,
    part: 'appserver',
    title: 'Krok 3 – Serwery Aplikacyjne',
    desc: 'Trzy węzły obliczeniowe w klastrze Kubernetes. Interaktywna mapa zamiast suchej dokumentacji — developer od razu wie co gdzie działa.',
    color: '#a855f7',
    emissive: '#6b21a8',
    badge: '⚙️ App Cluster',
  },
  {
    id: 3,
    part: 'storage',
    title: 'Krok 4 – Macierz Dyskowa (NAS)',
    desc: '12× NVMe 4 TB w RAID 10 — współdzielone zasoby dla całego klastra. Jeden krok = jedna rzecz do zapamiętania. Tak działa skuteczny onboarding.',
    color: '#f59e0b',
    emissive: '#92400e',
    badge: '💾 Storage Array',
  },
];

function partMat(partName, activePart, step) {
  if (partName === activePart) return mat(step.color, step.emissive, 0.6, 0.7, 0.3);
  return mat('#334155', '#0f172a', 0.04, 0.72, 0.38);
}

function UploadScene({ stepIdx }) {
  const step = UPLOAD_STEPS[stepIdx];

  const rackM    = partMat('rack',      step.part, step);
  const switchM  = partMat('switch',    step.part, step);
  const serverM  = partMat('appserver', step.part, step);
  const storageM = partMat('storage',   step.part, step);

  const isSwitch = step.part === 'switch';
  const isServer = step.part === 'appserver';
  const isStorage = step.part === 'storage';

  return (
    <group>
      {/* ── Rack frame (2 pillars + top/bottom rails) ─── */}
      <mesh position={[-1.65, 0, 0]}>
        <boxGeometry args={[0.24, 7.4, 1.1]} />
        <meshStandardMaterial {...rackM} />
      </mesh>
      <mesh position={[1.65, 0, 0]}>
        <boxGeometry args={[0.24, 7.4, 1.1]} />
        <meshStandardMaterial {...rackM} />
      </mesh>
      <mesh position={[0, 3.7, 0]}>
        <boxGeometry args={[3.54, 0.26, 1.1]} />
        <meshStandardMaterial {...rackM} />
      </mesh>
      <mesh position={[0, -3.7, 0]}>
        <boxGeometry args={[3.54, 0.26, 1.1]} />
        <meshStandardMaterial {...rackM} />
      </mesh>
      {/* Rear backplane */}
      <mesh position={[0, 0, -0.55]}>
        <boxGeometry args={[3.3, 7.1, 0.06]} />
        <meshStandardMaterial {...rackM} />
      </mesh>
      {step.part === 'rack' && <PulseRing position={[0, 0, 0]} color={step.color} radius={2.8} />}

      {/* ── Network switch (top slot) ─── */}
      <mesh position={[0, 2.85, 0]}>
        <boxGeometry args={[3.0, 0.46, 0.9]} />
        <meshStandardMaterial {...switchM} />
      </mesh>
      {/* Port indicators (8 tiny squares) */}
      {Array.from({ length: 8 }, (_, i) => (
        <mesh key={i} position={[-1.05 + i * 0.30, 2.85, 0.48]}>
          <boxGeometry args={[0.19, 0.14, 0.06]} />
          <meshStandardMaterial
            color={isSwitch ? '#00ffaa' : '#0d1f0d'}
            emissive={isSwitch ? '#00cc88' : '#000000'}
            emissiveIntensity={isSwitch ? 0.9 : 0}
          />
        </mesh>
      ))}
      {isSwitch && <PulseRing position={[0, 2.85, 0]} color={step.color} radius={1.8} />}

      {/* ── Application servers (3 × 1U) ─── */}
      {[1.7, 0.8, -0.1].map((y, i) => (
        <group key={i}>
          <mesh position={[0, y, 0]}>
            <boxGeometry args={[3.0, 0.62, 0.9]} />
            <meshStandardMaterial {...serverM} />
          </mesh>
          {/* Status LED (green when active) */}
          <mesh position={[1.15, y, 0.47]}>
            <sphereGeometry args={[0.07, 8, 8]} />
            <meshStandardMaterial
              color={isServer ? '#00ff88' : '#0a1a0a'}
              emissive={isServer ? '#00ff44' : '#000000'}
              emissiveIntensity={isServer ? 1.1 : 0}
            />
          </mesh>
          {/* Drive activity bar */}
          <mesh position={[-0.1, y, 0.47]}>
            <boxGeometry args={[1.6, 0.2, 0.05]} />
            <meshStandardMaterial
              color={isServer ? '#a78bfa' : '#1e293b'}
              emissive={isServer ? '#7c3aed' : '#000000'}
              emissiveIntensity={isServer ? 0.4 : 0}
            />
          </mesh>
        </group>
      ))}
      {isServer && <PulseRing position={[0, 0.8, 0]} color={step.color} radius={1.9} />}

      {/* ── Storage array (bottom 2 slots) ─── */}
      {/* Drive discs (4 horizontal NVMe cylinders) */}
      {Array.from({ length: 4 }, (_, i) => (
        <mesh key={i} position={[-1.1 + i * 0.72, -1.65, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.27, 0.27, 0.82, 20]} />
          <meshStandardMaterial {...storageM} />
        </mesh>
      ))}
      {/* Storage controller unit */}
      <mesh position={[0, -2.45, 0]}>
        <boxGeometry args={[3.0, 0.68, 0.9]} />
        <meshStandardMaterial {...storageM} />
      </mesh>
      {/* Capacity bar indicator */}
      <mesh position={[-0.1, -2.45, 0.47]}>
        <boxGeometry args={[2.0, 0.2, 0.05]} />
        <meshStandardMaterial
          color={isStorage ? '#fbbf24' : '#1e293b'}
          emissive={isStorage ? '#f59e0b' : '#000000'}
          emissiveIntensity={isStorage ? 0.55 : 0}
        />
      </mesh>
      {isStorage && <PulseRing position={[0, -2.0, 0]} color={step.color} radius={1.8} />}

      <gridHelper args={[20, 20, '#1e293b', '#1e293b']} position={[0, -4.0, 0]} />
    </group>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

const TABS = [
  // Builder: IT-system architecture spans X: -5..5.5, Y: -2.2..1.5
  { id: 'builder', label: 'Diagram Architektury', icon: '🏗️', steps: BUILDER_STEPS, camera: [0, 2, 18] },
  // Upload: server rack is centred at [0,0,0], height ~8 units → camera at z≈12
  { id: 'upload',  label: 'Szafa Serwerowa',      icon: '🖥️', steps: UPLOAD_STEPS,  camera: [2, 0, 12] },
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
