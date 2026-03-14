/**
 * LandingDemo3D
 *
 * Two-tab interactive 3D demo for the landing page, styled to match the real
 * PreviewMode UI (top bar with Camera Auto/Free, "Preview Mode" badge, step
 * info card top-left, Previous/Next navigation bottom-center).
 *
 *  • "Diagram Architektury" – IT system architecture (API, LB, Auth, Cache, DB)
 *  • "Szafa Serwerowa"      – 19" server rack (network switch, app servers, storage)
 *
 * Camera auto-focuses on each active node when in Auto mode (matches the
 * CameraController behaviour from Viewer3D.tsx).
 */

import { useRef, useEffect, useState, useCallback } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';

// ─── Shared helpers ───────────────────────────────────────────────────────────

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
        // you type text (e.g. "DB") and ThreeDocsy renders it as a 3D solid.
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
// AutoCamera – lerps camera to the active step's target position
// (mirrors CameraController from Viewer3D.tsx)
// ═══════════════════════════════════════════════════════════════════════════════

// [cameraPos, lookAtPos] for each step in each tab
const CAM = {
  builder: [
    { pos: [-5,   5, 14], la: [-5,   1.5,  0] },
    { pos: [-1.5, 5, 14], la: [-1.5, 1.5,  0] },
    { pos: [2,    5, 14], la: [2,    1.5,  0] },
    { pos: [2,    2, 14], la: [2,   -2.2,  0] },
    { pos: [5.5,  5, 14], la: [5.5,  1.5,  0] },
    { pos: [5.5,  2, 14], la: [5.5, -2.2,  0] },
  ],
  upload: [
    { pos: [0,  0,   14], la: [0,  0,    0] },
    { pos: [0,  3.5,  9], la: [0,  2.85, 0] },
    { pos: [0,  1.5,  9], la: [0,  0.8,  0] },
    { pos: [0, -1,    9], la: [0, -2,    0] },
  ],
};

function AutoCamera({ stepIdx, tabId, cameraMode, orbitRef, snapOnChange }) {
  const { camera } = useThree();
  const targetPos    = useRef(new THREE.Vector3(...CAM.builder[0].pos));
  const targetLookAt = useRef(new THREE.Vector3(...CAM.builder[0].la));

  useEffect(() => {
    const targets = CAM[tabId] ?? CAM.builder;
    const t = targets[stepIdx] ?? targets[0];
    targetPos.current.set(...t.pos);
    targetLookAt.current.set(...t.la);

    // Tab switches → snap instantly instead of lerping from old position
    if (snapOnChange.current) {
      snapOnChange.current = false;
      camera.position.copy(targetPos.current);
      if (orbitRef.current) {
        orbitRef.current.target.copy(targetLookAt.current);
        orbitRef.current.update();
      }
    }
  }, [stepIdx, tabId, cameraMode, camera, orbitRef, snapOnChange]);

  useFrame(() => {
    if (cameraMode === 'free') return;
    camera.position.lerp(targetPos.current, 0.06);
    if (orbitRef.current) {
      orbitRef.current.target.lerp(targetLookAt.current, 0.06);
      orbitRef.current.update();
    }
  });

  return null;
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

const TABS = [
  { id: 'builder', label: 'Diagram Architektury', icon: '🏗️', steps: BUILDER_STEPS },
  { id: 'upload',  label: 'Szafa Serwerowa',      icon: '🖥️', steps: UPLOAD_STEPS  },
];

const STEP_INTERVAL_MS = 4000;

export default function LandingDemo3D() {
  const [tabIdx,     setTabIdx]     = useState(0);
  const [stepIdx,    setStepIdx]    = useState(0);
  const [cameraMode, setCameraMode] = useState('auto');
  const timerRef     = useRef(null);
  const orbitRef     = useRef(null);
  const snapOnChange = useRef(false); // true → snap camera on next tab switch

  const tab  = TABS[tabIdx];
  const step = tab.steps[stepIdx];

  const canGoPrev = stepIdx > 0;
  const canGoNext = stepIdx < tab.steps.length - 1;

  const startTimer = useCallback((len) => {
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setStepIdx(i => (i + 1) % len);
    }, STEP_INTERVAL_MS);
  }, []);

  useEffect(() => {
    startTimer(tab.steps.length);
    return () => clearInterval(timerRef.current);
  }, [tabIdx, startTimer, tab.steps.length]);

  const goTo = (idx) => {
    setStepIdx(idx);
    startTimer(tab.steps.length);
  };

  const handleTabChange = (idx) => {
    snapOnChange.current = true; // snap camera to new tab's first position
    setTabIdx(idx);
    setStepIdx(0);
    startTimer(TABS[idx].steps.length);
  };

  return (
    <div className="rounded-3xl overflow-hidden shadow-2xl border border-white/10 bg-[#0d1117]">
      {/* ── Tab bar ── */}
      <div className="flex border-b border-white/10">
        {TABS.map((t, i) => (
          <button
            key={t.id}
            onClick={() => handleTabChange(i)}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3.5 text-sm font-semibold transition-all ${
              i === tabIdx
                ? 'text-white border-b-2 border-blue-500 bg-white/5'
                : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'
            }`}
          >
            <span className="text-base leading-none">{t.icon}</span>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Canvas with overlaid PreviewMode UI ── */}
      <div className="relative h-[480px] sm:h-[540px]">
        {/* 3D Canvas */}
        <Canvas gl={{ antialias: true, powerPreference: 'default' }}>
          <color attach="background" args={['#0d1117']} />
          <fog attach="fog" color="#0d1117" near={40} far={120} />
          <PerspectiveCamera makeDefault position={[-5, 5, 14]} fov={45} />

          <hemisphereLight color="#1e3a5f" groundColor="#0a0a1a" intensity={0.6} />
          <directionalLight position={[15, 25, 10]} intensity={1.8} />
          <directionalLight position={[-10, 10, -8]} intensity={0.4} color="#3366cc" />
          <pointLight position={[0, 20, 0]} intensity={0.6} color="#6699ff" />

          {tabIdx === 0
            ? <BuilderScene stepIdx={stepIdx} />
            : <UploadScene  stepIdx={stepIdx} />
          }

          <AutoCamera
            stepIdx={stepIdx}
            tabId={tab.id}
            cameraMode={cameraMode}
            orbitRef={orbitRef}
            snapOnChange={snapOnChange}
          />

          <OrbitControls
            ref={orbitRef}
            enablePan={false}
            minDistance={4}
            maxDistance={40}
            maxPolarAngle={Math.PI / 1.6}
          />
        </Canvas>

        {/* ── Top bar: Camera toggle + Preview Mode badge ── */}
        <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-slate-900/80 to-slate-800/80 backdrop-blur-md border-b border-white/10 z-10">
          <div className="px-4 py-3 flex items-center justify-between">
            {/* Camera toggle */}
            <div className="flex items-center gap-2 bg-black/30 backdrop-blur-sm px-3 py-1.5 rounded-xl border border-white/10 shadow-xl">
              <svg className="w-4 h-4 text-blue-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span className="text-xs font-semibold text-white hidden sm:inline">Camera:</span>
              <button
                onClick={() => setCameraMode('auto')}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all duration-200 ${
                  cameraMode === 'auto'
                    ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/30'
                    : 'bg-white/10 text-slate-300 hover:bg-white/20'
                }`}
              >Auto</button>
              <button
                onClick={() => setCameraMode('free')}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all duration-200 ${
                  cameraMode === 'free'
                    ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/30'
                    : 'bg-white/10 text-slate-300 hover:bg-white/20'
                }`}
              >Free</button>
            </div>

            {/* Preview Mode badge */}
            <div className="flex items-center gap-2 bg-gradient-to-r from-blue-500/20 to-indigo-600/20 backdrop-blur-sm px-4 sm:px-6 py-2 rounded-xl border border-blue-400/30 shadow-xl">
              <div className="w-2 h-2 bg-blue-400 rounded-full shadow-lg shadow-blue-400/50 motion-safe:animate-pulse" aria-hidden="true" />
              <span className="text-xs sm:text-sm font-bold text-white">Preview Mode</span>
            </div>

            {/* Balance spacer */}
            <div className="w-[108px] sm:w-[148px]" />
          </div>
        </div>

        {/* ── Step info card (top-left, below top bar) ── */}
        <div className="absolute top-[60px] left-3 sm:left-6 bg-black/40 backdrop-blur-md text-white px-4 sm:px-5 py-3 sm:py-4 rounded-xl shadow-2xl border border-white/10 max-w-[200px] sm:max-w-xs z-10 pointer-events-none select-none">
          <div className="flex items-start gap-2 sm:gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center flex-shrink-0 shadow-lg">
              <span className="text-sm sm:text-lg font-bold">{stepIdx + 1}</span>
            </div>
            <div className="min-w-0">
              <h3 className="text-xs sm:text-base font-bold mb-1 leading-snug">{step.title}</h3>
              <p className="text-[10px] sm:text-xs text-slate-300 leading-relaxed line-clamp-4">{step.desc}</p>
            </div>
          </div>
        </div>

        {/* ── Bottom navigation ── */}
        <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-10">
          <div className="bg-black/50 backdrop-blur-md text-white px-4 sm:px-8 py-3 sm:py-5 rounded-2xl shadow-2xl border border-white/10">
            <div className="flex items-center gap-3 sm:gap-6">
              <button
                onClick={() => canGoPrev && goTo(stepIdx - 1)}
                disabled={!canGoPrev}
                className={`flex items-center gap-1.5 px-3 sm:px-5 py-2 sm:py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                  canGoPrev
                    ? 'bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 shadow-lg shadow-blue-500/30'
                    : 'bg-white/10 cursor-not-allowed opacity-50'
                }`}
              >
                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                <span className="hidden sm:inline">Previous</span>
              </button>

              <div className="text-center min-w-[80px] sm:min-w-[120px] px-2">
                <div className="text-[10px] sm:text-xs text-slate-400 uppercase tracking-wider mb-0.5">Step</div>
                <div className="text-xl sm:text-2xl font-bold text-blue-300" aria-label={`Step ${stepIdx + 1} of ${tab.steps.length}`}>
                  {stepIdx + 1} / {tab.steps.length}
                </div>
              </div>

              <button
                onClick={() => canGoNext && goTo(stepIdx + 1)}
                disabled={!canGoNext}
                className={`flex items-center gap-1.5 px-3 sm:px-5 py-2 sm:py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                  canGoNext
                    ? 'bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 shadow-lg shadow-blue-500/30'
                    : 'bg-white/10 cursor-not-allowed opacity-50'
                }`}
              >
                <span className="hidden sm:inline">Next</span>
                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>

            {/* Progress dots */}
            <div className="mt-3 sm:mt-5 flex gap-1.5 sm:gap-2 justify-center pt-3 sm:pt-4 border-t border-white/10">
              {tab.steps.map((s, i) => (
                <button
                  key={s.id}
                  onClick={() => goTo(i)}
                  className={`rounded-full transition-all duration-200 ${
                    i === stepIdx
                      ? 'h-2 sm:h-3 bg-gradient-to-r from-blue-400 to-indigo-500 shadow-lg shadow-blue-400/50'
                      : 'w-2 sm:w-3 h-2 sm:h-3 bg-white/30 hover:bg-white/50 hover:scale-110'
                  }`}
                  style={i === stepIdx ? { width: '24px' } : {}}
                  title={s.title}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
