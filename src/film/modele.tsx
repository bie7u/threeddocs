import { useMemo, useRef } from 'react';
import type { MutableRefObject, ReactNode } from 'react';
import { useFrame } from '@react-three/fiber';
import { RoundedBox } from '@react-three/drei';
import * as THREE from 'three';
import { PISMO, clamp01, easeIn, easeOut, szum } from './czas';
import { czas } from './czas';
import type { StanWezla } from './czas';

/**
 * Modele węzłów sceny filmowej - proceduralne (bez plików), z animacją zależną tylko od czasu sceny i stanu węzła.
 * Każdy model stoi na y = 0 (wierzch postumentu), przodem do +z (do kamery). `wysokosc` - gdzie postawić napis.
 */
export interface ModelProps {
  kolor: THREE.Color;
  stan: MutableRefObject<StanWezla>;
}

// --- materiały i pomocnicy ---

const mat = {
  chrom: () => new THREE.MeshStandardMaterial({ color: '#d5dde6', metalness: 1, roughness: 0.22 }),
  ciemnyMetal: () => new THREE.MeshStandardMaterial({ color: '#262b36', metalness: 0.85, roughness: 0.38 }),
  guma: () => new THREE.MeshStandardMaterial({ color: '#121417', metalness: 0, roughness: 0.85 }),
  marmur: () => new THREE.MeshStandardMaterial({ color: '#ebe6dc', metalness: 0, roughness: 0.42 }),
  marmurCien: () => new THREE.MeshStandardMaterial({ color: '#cfc8ba', metalness: 0, roughness: 0.5 }),
  zloto: () => new THREE.MeshStandardMaterial({ color: '#e3b24f', metalness: 1, roughness: 0.28 }),
  papier: () => new THREE.MeshStandardMaterial({ color: '#e4e2dc', metalness: 0, roughness: 0.85 }),
};

function useMat<K extends keyof typeof mat>(k: K) {
  return useMemo(() => mat[k](), [k]);
}

/** Tekstura z płótna 2D; `rysuj` dostaje czas, gdy `zywa` - rysowana w każdej klatce. */
function useTekstura(w: number, h: number, rysuj: (c: CanvasRenderingContext2D, t: number) => void, zywa = false) {
  const { plotno, tex } = useMemo(() => {
    const plotno = document.createElement('canvas');
    plotno.width = w;
    plotno.height = h;
    const tex = new THREE.CanvasTexture(plotno);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 8;
    rysuj(plotno.getContext('2d')!, 0);
    return { plotno, tex };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [w, h]);
  useFrame(() => {
    if (!zywa) return;
    rysuj(plotno.getContext('2d')!, czas.t);
    tex.needsUpdate = true;
  });
  return tex;
}

/** Walec (pręt) od punktu a do b. */
const Pret = ({ a, b, r, m }: { a: [number, number, number]; b: [number, number, number]; r: number; m: THREE.Material }) => {
  const { poz, q, dl } = useMemo(() => {
    const va = new THREE.Vector3(...a);
    const vb = new THREE.Vector3(...b);
    const kier = vb.clone().sub(va);
    return {
      poz: va.clone().lerp(vb, 0.5),
      q: new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), kier.clone().normalize()),
      dl: kier.length(),
    };
  }, [a, b]);
  return (
    <mesh position={poz} quaternion={q} material={m}>
      <cylinderGeometry args={[r, r, dl, 12]} />
    </mesh>
  );
};

const zaokraglony = (c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) => {
  c.beginPath();
  c.roundRect(x, y, w, h, r);
};

const hex = (k: THREE.Color) => `#${k.getHexString()}`;

// --- KOSZYK: wózek sklepowy z siatki, w środku koperty przelewów ---

export const Koszyk = ({ kolor, stan }: ModelProps) => {
  const chrom = useMat('chrom');
  const guma = useMat('guma');
  const papier = useMat('papier');
  const siatkaTex = useTekstura(256, 256, (c) => {
    c.fillStyle = '#000'; c.fillRect(0, 0, 256, 256);
    c.strokeStyle = '#fff'; c.lineWidth = 7;
    for (let i = 0; i <= 8; i++) {
      c.beginPath(); c.moveTo(i * 32, 0); c.lineTo(i * 32, 256); c.stroke();
      c.beginPath(); c.moveTo(0, i * 32); c.lineTo(256, i * 32); c.stroke();
    }
  });
  const siatka = useMemo(() => {
    const zrob = (rx: number, ry: number) => {
      const t = siatkaTex.clone();
      t.wrapS = t.wrapT = THREE.RepeatWrapping;
      t.repeat.set(rx, ry);
      t.needsUpdate = true;
      return new THREE.MeshStandardMaterial({ color: kolor, metalness: 0.7, roughness: 0.3, alphaMap: t, alphaTest: 0.5,
        side: THREE.DoubleSide });
    };
    return { dlugi: zrob(2.4, 1), krotki: zrob(1.45, 1), dno: zrob(2.4, 1.45) };
  }, [siatkaTex, kolor]);
  const kopertaTex = useTekstura(256, 170, (c) => {
    c.fillStyle = '#fbfaf6'; c.fillRect(0, 0, 256, 170);
    c.strokeStyle = '#cfcab9'; c.lineWidth = 4;
    c.beginPath(); c.moveTo(0, 0); c.lineTo(128, 92); c.lineTo(256, 0); c.stroke();
    c.fillStyle = hex(kolor); c.fillRect(0, 150, 256, 20);
    c.fillStyle = '#28303f'; c.font = `700 30px ${PISMO}`; c.fillText('PRZELEW', 18, 138);
    c.fillStyle = hex(kolor); c.beginPath(); c.arc(224, 120, 18, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#fff'; c.font = `700 18px ${PISMO}`; c.fillText('zł', 214, 127);
  });
  const koperty = useRef<THREE.Group>(null);
  useFrame(() => {
    const t = czas.t;
    koperty.current?.children.forEach((k, i) => {
      k.position.y = 1.22 + Math.sin(t * 2 + i * 1.7) * 0.04 + stan.current.aktywnosc * 0.12;
    });
  });
  const Y0 = 0.45; const Y1 = 1.35; const X = 1.1; const Z = 0.65;
  return (
    <group>
      {/* kosz z siatki: dno i cztery ściany */}
      <mesh position={[0, Y0, 0]} rotation={[-Math.PI / 2, 0, 0]} material={siatka.dno}><planeGeometry args={[2 * X, 2 * Z]} /></mesh>
      <mesh position={[0, (Y0 + Y1) / 2, Z]} material={siatka.dlugi}><planeGeometry args={[2 * X, Y1 - Y0]} /></mesh>
      <mesh position={[0, (Y0 + Y1) / 2, -Z]} material={siatka.dlugi}><planeGeometry args={[2 * X, Y1 - Y0]} /></mesh>
      <mesh position={[X, (Y0 + Y1) / 2, 0]} rotation={[0, Math.PI / 2, 0]} material={siatka.krotki}><planeGeometry args={[2 * Z, Y1 - Y0]} /></mesh>
      <mesh position={[-X, (Y0 + Y1) / 2, 0]} rotation={[0, Math.PI / 2, 0]} material={siatka.krotki}><planeGeometry args={[2 * Z, Y1 - Y0]} /></mesh>
      {/* rama: obręcze góra i dół, narożniki */}
      {[Y0, Y1].map(y => (
        <group key={y}>
          <Pret a={[-X, y, Z]} b={[X, y, Z]} r={0.035} m={chrom} />
          <Pret a={[-X, y, -Z]} b={[X, y, -Z]} r={0.035} m={chrom} />
          <Pret a={[X, y, -Z]} b={[X, y, Z]} r={0.035} m={chrom} />
          <Pret a={[-X, y, -Z]} b={[-X, y, Z]} r={0.035} m={chrom} />
        </group>
      ))}
      {[[-X, -Z], [-X, Z], [X, -Z], [X, Z]].map(([x, z]) => <Pret key={`${x}${z}`} a={[x, Y0, z]} b={[x, Y1, z]} r={0.035} m={chrom} />)}
      {/* rączka z kolorowym uchwytem */}
      <Pret a={[-X, Y1, -0.55]} b={[-1.5, 1.85, -0.55]} r={0.04} m={chrom} />
      <Pret a={[-X, Y1, 0.55]} b={[-1.5, 1.85, 0.55]} r={0.04} m={chrom} />
      <Pret a={[-1.5, 1.85, -0.7]} b={[-1.5, 1.85, 0.7]} r={0.045} m={chrom} />
      <mesh position={[-1.5, 1.85, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.075, 0.075, 1.05, 16]} />
        <meshStandardMaterial color={kolor.clone().multiplyScalar(0.6)} roughness={0.5} />
      </mesh>
      {/* podwozie i kółka */}
      {[-0.55, 0.55].map(z => (
        <group key={z}>
          <Pret a={[-0.95, 0.22, z]} b={[0.95, 0.22, z]} r={0.04} m={chrom} />
          <Pret a={[-0.9, Y0, z]} b={[-0.85, 0.22, z]} r={0.035} m={chrom} />
          <Pret a={[0.9, Y0, z]} b={[0.85, 0.22, z]} r={0.035} m={chrom} />
          {[-0.85, 0.85].map(x => (
            <group key={x} position={[x, 0.13, z]} rotation={[Math.PI / 2, 0, 0]}>
              <mesh material={guma}><cylinderGeometry args={[0.13, 0.13, 0.09, 24]} /></mesh>
              <mesh material={chrom}><cylinderGeometry args={[0.06, 0.06, 0.11, 16]} /></mesh>
            </group>
          ))}
        </group>
      ))}
      {/* koperty przelewów w koszu */}
      <group ref={koperty}>
        {[[-0.45, 0.1, 0.18], [0.15, -0.15, -0.12], [0.6, 0.2, 0.25]].map(([x, z, r], i) => (
          <group key={i} position={[x, 1.22, z]} rotation={[0, (i - 1) * 0.25, r]}>
            <RoundedBox args={[0.9, 0.6, 0.03]} radius={0.01} material={papier} />
            <mesh position={[0, 0, 0.017]}>
              <planeGeometry args={[0.9, 0.6]} />
              <meshStandardMaterial map={kopertaTex} roughness={0.8} />
            </mesh>
          </group>
        ))}
      </group>
    </group>
  );
};
Koszyk.wysokosc = 2.05;

// --- BANK: gmach z kolumnami, złota moneta nad wejściem, światło w drzwiach ---

export const Bank = ({ kolor, stan }: ModelProps) => {
  const marmur = useMat('marmur');
  const cien = useMat('marmurCien');
  const zloto = useMat('zloto');
  const napisTex = useTekstura(512, 64, (c) => {
    c.clearRect(0, 0, 512, 64);
    c.fillStyle = '#b8862b'; c.font = `800 46px ${PISMO}`; c.textAlign = 'center';
    c.fillText('B A N K', 256, 48);
  });
  const fronton = useMemo(() => {
    const s = new THREE.Shape();
    s.moveTo(-1.38, 0); s.lineTo(1.38, 0); s.lineTo(0, 0.62); s.closePath();
    const g = new THREE.ExtrudeGeometry(s, { depth: 1.7, bevelEnabled: false });
    g.translate(0, 0, -0.85);
    return g;
  }, []);
  const drzwi = useRef<THREE.MeshStandardMaterial>(null);
  const okna = useRef<THREE.MeshStandardMaterial>(null);
  const moneta = useRef<THREE.Group>(null);
  useFrame(() => {
    const { aktywnosc, blysk, dolot } = stan.current;
    if (drzwi.current) drzwi.current.emissiveIntensity = 0.5 + aktywnosc * 1.2 + blysk * 3;
    if (okna.current) okna.current.emissiveIntensity = 0.35 + aktywnosc * 0.7 + blysk * 1.5;
    // Moneta obraca się spokojnie, a po wpływie paczki zakręca się szybko i zwalnia
    const zakret = dolot >= 0 ? 14 * (1 - Math.exp(-dolot * 1.6)) : 0;
    if (moneta.current) moneta.current.rotation.y = czas.t * 0.9 + zakret;
  });
  const KOL = [-1.0, -0.34, 0.34, 1.0];
  return (
    <group>
      {/* schody */}
      <mesh position={[0, 0.075, 0.05]} material={cien}><boxGeometry args={[3.0, 0.15, 2.25]} /></mesh>
      <mesh position={[0, 0.225, 0.02]} material={marmur}><boxGeometry args={[2.8, 0.15, 2.05]} /></mesh>
      <mesh position={[0, 0.375, 0]} material={cien}><boxGeometry args={[2.6, 0.15, 1.85]} /></mesh>
      {/* gmach za kolumnami */}
      <mesh position={[0, 1.07, -0.25]} material={marmur}><boxGeometry args={[2.25, 1.25, 1.2]} /></mesh>
      <mesh position={[0, 0.88, 0.36]}>
        <boxGeometry args={[0.5, 0.86, 0.04]} />
        <meshStandardMaterial ref={drzwi} color="#1a1208" emissive={kolor} emissiveIntensity={0.5} roughness={0.6} />
      </mesh>
      {[-0.68, 0.68].map(x => (
        <mesh key={x} position={[x, 1.2, 0.36]}>
          <boxGeometry args={[0.28, 0.36, 0.03]} />
          <meshStandardMaterial ref={x < 0 ? okna : undefined} color="#151109" emissive={kolor} emissiveIntensity={0.35} />
        </mesh>
      ))}
      {/* kolumny */}
      {KOL.map(x => (
        <group key={x} position={[x, 0.45, 0.6]}>
          <mesh position={[0, 0.04, 0]} material={cien}><boxGeometry args={[0.32, 0.08, 0.32]} /></mesh>
          <mesh position={[0, 0.64, 0]} material={marmur}><cylinderGeometry args={[0.11, 0.13, 1.12, 20]} /></mesh>
          <mesh position={[0, 1.25, 0]} material={cien}><boxGeometry args={[0.34, 0.1, 0.34]} /></mesh>
        </group>
      ))}
      {/* belkowanie z napisem i fronton */}
      <mesh position={[0, 1.94, 0]} material={marmur}><boxGeometry args={[2.7, 0.28, 1.75]} /></mesh>
      <mesh position={[0, 1.94, 0.877]}>
        <planeGeometry args={[2.0, 0.25]} />
        <meshStandardMaterial map={napisTex} transparent metalness={0.6} roughness={0.35} />
      </mesh>
      <mesh position={[0, 2.08, 0]} geometry={fronton} material={cien} />
      <mesh position={[0, 2.075, 0]} material={zloto}><boxGeometry args={[2.78, 0.03, 1.78]} /></mesh>
      <group ref={moneta} position={[0, 2.32, 0.87]}>
        <mesh rotation={[Math.PI / 2, 0, 0]} material={zloto}><cylinderGeometry args={[0.2, 0.2, 0.05, 40]} /></mesh>
      </group>
    </group>
  );
};
Bank.wysokosc = 2.85;

// --- EZN: monitor z ekranem księgowości i serwer z diodami ---

const FAKTURY = [
  ['FV/2026/10/301', '1 845,00 zł'], ['FV/2026/10/287', '18 450,00 zł'], ['FV/2026/10/266', '315,00 zł'],
  ['FV/2026/10/251', '4 305,00 zł'], ['FV/2026/10/240', '2 160,00 zł'], ['FV/2026/10/233', '799,99 zł'],
];

export const Ezn = ({ kolor, stan }: ModelProps) => {
  const metal = useMat('ciemnyMetal');
  const akcent = hex(kolor);
  const ekranTex = useTekstura(768, 432, (c, t) => {
    const { dolot } = stan.current;
    c.fillStyle = '#0b1220'; c.fillRect(0, 0, 768, 432);
    c.fillStyle = akcent; c.fillRect(0, 0, 768, 56);
    c.fillStyle = '#10151f'; c.font = `800 28px ${PISMO}`; c.textAlign = 'left';
    c.fillText('EZN  ·  Księgowość', 22, 38);
    c.textAlign = 'right'; c.font = `700 20px ${PISMO}`; c.fillText('● online', 746, 36);
    c.textAlign = 'left'; c.fillStyle = '#7f8aa3'; c.font = `600 18px ${PISMO}`;
    c.fillText('Dokument', 24, 90); c.textAlign = 'right'; c.fillText('Kwota', 744, 90);
    const zaznaczony = Math.floor(t * 1.3) % FAKTURY.length;
    FAKTURY.forEach(([nr, kwota], i) => {
      const y = 104 + i * 46;
      const ksiegowany = i === 0 && dolot >= 0;
      if (ksiegowany) {
        const k = Math.exp(-dolot * 1.5);
        c.fillStyle = `rgba(34,197,94,${0.22 + 0.5 * k})`; c.fillRect(12, y, 744, 40);
      } else if (i === zaznaczony && dolot < 0) {
        c.fillStyle = 'rgba(255,255,255,0.07)'; c.fillRect(12, y, 744, 40);
      }
      c.textAlign = 'left'; c.fillStyle = '#dbe3f3'; c.font = `600 22px ${PISMO}`; c.fillText(nr, 24, y + 28);
      c.textAlign = 'right';
      if (ksiegowany) {
        c.fillStyle = '#4ade80'; c.font = `800 22px ${PISMO}`; c.fillText('✓ Zaksięgowano', 744, y + 28);
      } else {
        c.fillStyle = '#aab6cc'; c.fillText(kwota, 744, y + 28);
      }
    });
    // Po zaksięgowaniu: komunikat, że saldo idzie do EM
    if (dolot > 0.6) {
      const k = easeOut((dolot - 0.6) / 0.5);
      const x = 768 - k * 430;
      zaokraglony(c, x, 380, 410, 40, 10); c.fillStyle = akcent; c.fill();
      c.textAlign = 'left'; c.fillStyle = '#10151f'; c.font = `800 20px ${PISMO}`;
      c.fillText('Saldo faktury wysłane do EM  →', x + 18, 407);
    } else {
      // pasek „pracy” systemu
      for (let k = 0; k < 24; k++) {
        c.fillStyle = `rgba(127,138,163,${0.25 + 0.6 * ((Math.sin(t * 5 - k * 0.5) + 1) / 2)})`;
        c.fillRect(24 + k * 30, 396, 18, 6);
      }
    }
  }, true);
  const klawTex = useTekstura(256, 80, (c) => {
    c.fillStyle = '#1b1f28'; c.fillRect(0, 0, 256, 80);
    c.fillStyle = '#3a4152';
    for (let r = 0; r < 4; r++) for (let k = 0; k < 14; k++) c.fillRect(6 + k * 17.8, 6 + r * 18.5, 14, 14);
  });
  const diody = useRef<THREE.Mesh[]>([]);
  useFrame(() => {
    const t = czas.t;
    const { aktywnosc } = stan.current;
    diody.current.forEach((d, i) => {
      const takt = Math.floor(t * (4 + aktywnosc * 8) + i * 0.37);
      const wl = szum(i, takt) > 0.45;
      (d.material as THREE.MeshBasicMaterial).color.set(wl ? (i % 3 === 0 ? akcent : '#4ade80') : '#13301c')
        .multiplyScalar(wl ? 2.2 : 1);
    });
  });
  return (
    <group>
      {/* monitor */}
      <mesh position={[-0.25, 0.03, 0.1]} material={metal}><boxGeometry args={[0.8, 0.06, 0.5]} /></mesh>
      <mesh position={[-0.25, 0.42, 0.02]} material={metal}><boxGeometry args={[0.14, 0.75, 0.08]} /></mesh>
      <group position={[-0.25, 1.36, 0.08]} rotation={[-0.08, 0.12, 0]}>
        <RoundedBox args={[2.3, 1.38, 0.1]} radius={0.04} material={metal} />
        <mesh position={[0, 0, 0.052]}>
          <planeGeometry args={[2.16, 1.215]} />
          <meshBasicMaterial map={ekranTex} toneMapped={false} />
        </mesh>
      </group>
      {/* klawiatura */}
      <group position={[-0.3, 0.03, 0.75]} rotation={[0, 0.12, 0]}>
        <mesh material={metal}><boxGeometry args={[1.45, 0.05, 0.45]} /></mesh>
        <mesh position={[0, 0.027, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[1.4, 0.42]} />
          <meshStandardMaterial map={klawTex} roughness={0.7} />
        </mesh>
      </group>
      {/* serwer z diodami */}
      <group position={[1.45, 0, -0.15]}>
        <RoundedBox args={[0.62, 1.6, 1.0]} radius={0.04} position={[0, 0.8, 0]} material={metal} />
        {Array.from({ length: 6 }, (_, r) => (
          <group key={r}>
            <mesh position={[0, 1.42 - r * 0.22, 0.502]}>
              <boxGeometry args={[0.5, 0.15, 0.01]} />
              <meshStandardMaterial color="#1a1e27" metalness={0.6} roughness={0.5} />
            </mesh>
            {[0, 1].map(k => (
              <mesh key={k} ref={el => { if (el) diody.current[r * 2 + k] = el; }} position={[0.14 + k * 0.08, 1.42 - r * 0.22, 0.51]}>
                <boxGeometry args={[0.04, 0.03, 0.01]} />
                <meshBasicMaterial toneMapped={false} />
              </mesh>
            ))}
          </group>
        ))}
      </group>
    </group>
  );
};
Ezn.wysokosc = 2.35;

// --- FAKTURA: kartka faktury; po dolocie informacji kwota spada do zera i spada pieczątka ZAPŁACONO ---

export const Faktura = ({ kolor, stan }: ModelProps) => {
  const papier = useMat('papier');
  const akcent = hex(kolor);
  const kartkaTex = useTekstura(512, 704, (c) => {
    const { dolot } = stan.current;
    c.fillStyle = '#ecebe6'; c.fillRect(0, 0, 512, 704);
    c.fillStyle = akcent; c.fillRect(0, 0, 512, 14);
    c.textAlign = 'left'; c.fillStyle = akcent; c.font = `800 46px ${PISMO}`; c.fillText('FAKTURA', 36, 86);
    c.fillStyle = '#6b7280'; c.font = `600 22px ${PISMO}`; c.fillText('Nr FV/2026/10/301', 36, 122);
    c.textAlign = 'right'; c.fillText('13.11.2026', 476, 122);
    c.textAlign = 'left'; c.fillStyle = '#9ca3af'; c.font = `700 16px ${PISMO}`;
    c.fillText('SPRZEDAWCA', 36, 176); c.fillText('NABYWCA', 272, 176);
    c.fillStyle = '#d1d5db';
    [196, 216, 236].forEach((y, i) => { c.fillRect(36, y, 190 - i * 30, 10); c.fillRect(272, y, 200 - i * 40, 10); });
    c.fillStyle = '#eef0f4'; c.fillRect(36, 282, 440, 34);
    c.fillStyle = '#6b7280'; c.font = `700 16px ${PISMO}`; c.fillText('Nazwa', 48, 305);
    c.textAlign = 'right'; c.fillText('Brutto', 464, 305);
    [['Usługa serwisowa', '1 200,00'], ['Materiały', '645,00']].forEach(([n, k], i) => {
      const y = 350 + i * 40;
      c.textAlign = 'left'; c.fillStyle = '#374151'; c.font = `600 20px ${PISMO}`; c.fillText(n, 48, y);
      c.textAlign = 'right'; c.fillText(k, 464, y);
      c.fillStyle = '#e5e7eb'; c.fillRect(36, y + 14, 440, 2);
    });
    c.textAlign = 'right'; c.fillStyle = '#111827'; c.font = `800 22px ${PISMO}`; c.fillText('Razem: 1 845,00 zł', 476, 462);
    // „Pozostało do zapłaty” - po dolocie informacji z EZN kwota przelicza się do zera
    const k = dolot >= 0 ? easeOut((dolot - 0.15) / 0.7) : 0;
    zaokraglony(c, 36, 520, 440, 110, 14);
    c.fillStyle = k > 0 ? `rgba(22,163,74,${0.1 + 0.12 * k})` : '#f3f4f6'; c.fill();
    c.textAlign = 'left'; c.fillStyle = '#4b5563'; c.font = `700 20px ${PISMO}`; c.fillText('Pozostało do zapłaty', 56, 562);
    const kwota = Math.round(1845 * (1 - k) * 100) / 100;
    // Grupy tysięcy spacją także dla czterech cyfr (jak „Razem: 1 845,00 zł”)
    const tekst = `${String(Math.floor(kwota)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ')},${String(Math.round((kwota % 1) * 100)).padStart(2, '0')} zł`;
    c.textAlign = 'right'; c.fillStyle = k >= 1 ? '#15803d' : '#111827'; c.font = `800 38px ${PISMO}`; c.fillText(tekst, 456, 610);
  }, true);
  const pieczatkaTex = useTekstura(480, 180, (c) => {
    c.clearRect(0, 0, 480, 180);
    c.strokeStyle = '#16a34a'; c.lineWidth = 12;
    zaokraglony(c, 12, 12, 456, 156, 22); c.stroke();
    c.fillStyle = '#16a34a'; c.font = `900 66px ${PISMO}`; c.textAlign = 'center'; c.fillText('ZAPŁACONO', 240, 114);
    // ślad tuszu: wytarcia w kilku miejscach
    c.globalCompositeOperation = 'destination-out';
    for (let i = 0; i < 260; i++) {
      c.fillStyle = `rgba(0,0,0,${0.35 + szum(i, 1) * 0.5})`;
      c.beginPath(); c.arc(szum(i, 2) * 480, szum(i, 3) * 180, 1 + szum(i, 4) * 4, 0, Math.PI * 2); c.fill();
    }
    c.globalCompositeOperation = 'source-over';
  });
  const kartka = useRef<THREE.Group>(null);
  const pieczatka = useRef<THREE.Mesh>(null);
  const UDERZENIE = 1.0; // pieczątka spada po przeliczeniu kwoty
  useFrame(() => {
    const t = czas.t;
    const { dolot, aktywnosc } = stan.current;
    const d = dolot - UDERZENIE;
    if (pieczatka.current) {
      const k = clamp01(d / 0.22);
      const m = pieczatka.current.material as THREE.MeshBasicMaterial;
      m.opacity = d >= 0 ? k : 0;
      pieczatka.current.scale.setScalar(d >= 0 ? 2.8 - 1.8 * easeIn(k) : 0.0001);
    }
    if (kartka.current) {
      const drganie = d > 0.22 ? Math.sin((d - 0.22) * 55) * 0.035 * Math.exp(-(d - 0.22) * 7) : 0;
      kartka.current.rotation.set(-0.16 + drganie, Math.sin(t * 0.7) * 0.05, drganie * 0.6);
      kartka.current.position.y = 1.32 + Math.sin(t * 1.4) * 0.04 + aktywnosc * 0.08;
    }
  });
  return (
    <group>
      {/* druga kartka pod spodem */}
      <group position={[0.16, 1.28, -0.12]} rotation={[-0.16, -0.05, -0.06]}>
        <mesh material={papier}><boxGeometry args={[1.7, 2.32, 0.015]} /></mesh>
      </group>
      <group ref={kartka} position={[0, 1.32, 0]}>
        <mesh material={papier}><boxGeometry args={[1.7, 2.32, 0.02]} /></mesh>
        <mesh position={[0, 0, 0.011]}>
          <planeGeometry args={[1.7, 2.32]} />
          <meshStandardMaterial map={kartkaTex} roughness={0.8} />
        </mesh>
        <mesh ref={pieczatka} position={[0.05, 0.25, 0.02]} rotation={[0, 0, 0.2]}>
          <planeGeometry args={[1.2, 0.45]} />
          <meshBasicMaterial map={pieczatkaTex} transparent opacity={0} depthWrite={false} />
        </mesh>
      </group>
    </group>
  );
};
Faktura.wysokosc = 2.75;

// --- zwykła bryła dla węzła bez modelu ---

export const Bryla = ({ kolor }: ModelProps) => (
  <RoundedBox args={[2.2, 1.4, 1.4]} radius={0.22} position={[0, 0.7, 0]}>
    <meshStandardMaterial color={kolor} metalness={0.3} roughness={0.35} />
  </RoundedBox>
);
Bryla.wysokosc = 1.6;

type Model = ((p: ModelProps) => ReactNode) & { wysokosc: number };
export const MODELE: Record<string, Model> = { koszyk: Koszyk, bank: Bank, ezn: Ezn, system: Ezn, faktura: Faktura };
export const modelWezla = (nazwa?: string): Model => (nazwa && MODELE[nazwa]) || Bryla;

// --- przesyłki lecące po strzałkach ---

export const Koperta = ({ kolor }: { kolor: THREE.Color }) => {
  const tex = useTekstura(256, 170, (c) => {
    c.fillStyle = '#fbfaf6'; c.fillRect(0, 0, 256, 170);
    c.strokeStyle = '#cfcab9'; c.lineWidth = 5;
    c.beginPath(); c.moveTo(0, 0); c.lineTo(128, 96); c.lineTo(256, 0); c.stroke();
    c.fillStyle = hex(kolor); c.beginPath(); c.arc(128, 96, 22, 0, Math.PI * 2); c.fill();
  });
  return (
    <group>
      <mesh><boxGeometry args={[0.7, 0.46, 0.03]} /><meshStandardMaterial color="#f7f6f1" roughness={0.8} /></mesh>
      <mesh position={[0, 0, 0.016]}><planeGeometry args={[0.7, 0.46]} /><meshStandardMaterial map={tex} roughness={0.8} /></mesh>
    </group>
  );
};

export const Moneta = () => {
  const tex = useTekstura(128, 128, (c) => {
    const g = c.createRadialGradient(64, 64, 10, 64, 64, 64);
    g.addColorStop(0, '#ffe39a'); g.addColorStop(1, '#c98f22');
    c.fillStyle = g; c.fillRect(0, 0, 128, 128);
    c.strokeStyle = '#a8741a'; c.lineWidth = 6; c.beginPath(); c.arc(64, 64, 54, 0, Math.PI * 2); c.stroke();
    c.fillStyle = '#8a5d12'; c.font = `900 54px ${PISMO}`; c.textAlign = 'center'; c.fillText('zł', 64, 82);
  });
  const boki = useMemo(() => {
    const krawedz = mat.zloto();
    const lico = new THREE.MeshStandardMaterial({ map: tex, metalness: 0.9, roughness: 0.3 });
    return [krawedz, lico, lico];
  }, [tex]);
  return (
    <mesh rotation={[Math.PI / 2, 0, 0]} material={boki}>
      <cylinderGeometry args={[0.3, 0.3, 0.07, 40]} />
    </mesh>
  );
};
