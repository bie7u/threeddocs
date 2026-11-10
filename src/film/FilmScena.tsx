import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { VignetteShader } from 'three/examples/jsm/shaders/VignetteShader.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { calculateCreatorBasedLayout } from '../utils/layoutCalculator';
import type { ProjectData } from '../types';
import { czas, clamp01, ease, easeOut, ziarno } from './czas';
import type { StanWezla } from './czas';
import { Koperta, Moneta, modelWezla } from './modele';

export { czas } from './czas';

/**
 * Scena filmowa: projekt threeddocs (kroki = węzły, połączenia = strzałki) odtwarzany według osi czasu odcinków
 * („kamera na węźle X od sekundy s”). Węzeł z polem `model` (koszyk, bank, ezn, faktura - src/film/modele.tsx)
 * dostaje model przedmiotu, inny - bryłę. Wszystko jest funkcją czasu `czas.t` - bez zegara i losowości - więc
 * klatkę można renderować dowolnie długo (programowy WebGL, render klatka po klatce do wideo).
 */
export interface Scena {
  project: ProjectData;
  nodePositions?: Record<string, { x: number; y: number }>;
}

/** Kamera na węźle `id` (null - cała scena) od sekundy `od` (względem początku sceny). */
export interface Odcinek {
  id: string | null;
  od: number;
}

export interface Ujecie {
  scena: Scena;
  odcinki: Odcinek[];
  /** Adres czcionki napisów (TTF z polskimi znakami) - napisy nad węzłami i na teksturach modeli. */
  czcionka?: string;
}

const LOT = 2.0;          // przelot kamery między odcinkami
const PACZKA_START = 0.6; // przesyłka rusza po wejściu odcinka
const PACZKA_LOT = 1.5;
const ISKRY_ZYCIE = 1.5;
const MAX_ISKIER = 700;
const PODLOGA = -1.25;
const POSTUMENT = 0.24;   // wysokość postumentu; model stoi na jego wierzchu

/** Kolor jaśniejszy od bieli (HDR) - tylko takie elementy przekraczają próg poświaty. */
const neon = (k: THREE.Color | string, moc = 3) => new THREE.Color(k).multiplyScalar(moc);
const BIALY = new THREE.Color('#ffffff');
const ZLOTY = new THREE.Color('#ffd166');

type Przesylka = 'koperta' | 'moneta';
// Co leci do węzła danego rodzaju: do banku paczka przelewów, do EZN pieniądze, do faktury informacja o saldzie
const PRZESYLKA: Record<string, Przesylka> = { bank: 'koperta', ezn: 'moneta', system: 'moneta', faktura: 'koperta' };

interface Wezel { id: string; tytul: string; kolor: THREE.Color; poz: THREE.Vector3; nr: number; model?: string }
interface Krawedz { a: THREE.Vector3; b: THREE.Vector3; nr: number }
interface Paczka { a: THREE.Vector3; b: THREE.Vector3; t0: number; kolor: THREE.Color; typ: Przesylka }
interface Wybuch { t0: number; poz: THREE.Vector3; kolory: THREE.Color[]; ile: number; predkosc: number; wGore: number; seed: number }

function przygotujScene(ujecie: Ujecie) {
  const { project, nodePositions = {} } = ujecie.scena;
  const uklad = calculateCreatorBasedLayout(project.steps, nodePositions);
  const wezly: Wezel[] = project.steps.map((s, nr) => {
    const p = uklad.get(s.id) ?? { x: nr * 8, y: 0, z: 0 };
    return { id: s.id, tytul: s.title, kolor: new THREE.Color(s.highlightColor || '#4299e1'),
      poz: new THREE.Vector3(p.x, 0, p.z), nr, model: (s as { model?: string }).model };
  });
  const poId = new Map(wezly.map(w => [w.id, w]));
  const krawedzie: Krawedz[] = project.connections
    .filter(c => poId.has(c.source) && poId.has(c.target))
    .map((c, nr) => ({ a: poId.get(c.source)!.poz, b: poId.get(c.target)!.poz, nr }));

  const paczki: Paczka[] = [];
  const wybuchy: Wybuch[] = [];
  const doloty: { id: string; t0: number }[] = [];
  const odcinki = ujecie.odcinki;
  odcinki.forEach((o, i) => {
    if (!o.id) return;
    const cel = poId.get(o.id);
    if (!cel) return;
    const poprzedni = odcinki.slice(0, i).reverse().find(x => x.id)?.id;
    const wejscie = project.connections.find(k => k.target === o.id && k.source === poprzedni)
      ?? project.connections.find(k => k.target === o.id);
    let dolot = o.od + 0.9;
    if (wejscie && poId.has(wejscie.source)) {
      const t0 = o.od + PACZKA_START;
      paczki.push({ a: poId.get(wejscie.source)!.poz, b: cel.poz, t0, kolor: cel.kolor,
        typ: PRZESYLKA[cel.model ?? ''] ?? 'moneta' });
      dolot = t0 + PACZKA_LOT;
    }
    doloty.push({ id: o.id, t0: dolot });
    wybuchy.push({ t0: dolot, poz: cel.poz.clone().add(new THREE.Vector3(0, 1.0, 0.4)), kolory: [cel.kolor, BIALY, ZLOTY],
      ile: 55, predkosc: 4.2, wGore: 2.2, seed: i * 17 + 3 });
    if (i === odcinki.length - 1) {
      // Finał: złote konfetti nad ostatnim węzłem
      [1.4, 1.9, 2.5].forEach((d, j) => {
        const r = ziarno(100 + j);
        wybuchy.push({ t0: dolot + d, poz: cel.poz.clone().add(new THREE.Vector3((r() - 0.5) * 6, 3.6 + r() * 0.8, (r() - 0.5) * 2)),
          kolory: [ZLOTY, BIALY, cel.kolor], ile: 120, predkosc: 5.5, wGore: 0.8, seed: 500 + j });
      });
    }
  });
  return { wezly, krawedzie, paczki, wybuchy, doloty, poId };
}

type Dane = ReturnType<typeof przygotujScene>;

/** Poza kamery: cała scena albo zbliżenie na węzeł (z widokiem na strzałkę, którą przyleci przesyłka). */
function poza(dane: Dane, id: string | null, aspekt: number): { poz: THREE.Vector3; cel: THREE.Vector3 } {
  const w = id ? dane.poId.get(id) : undefined;
  if (w) {
    return { poz: w.poz.clone().add(new THREE.Vector3(-2.2, 3.4, 9.6)), cel: w.poz.clone().add(new THREE.Vector3(-1.4, 1.0, 0)) };
  }
  const xs = dane.wezly.map(n => n.poz.x);
  const zs = dane.wezly.map(n => n.poz.z);
  const cx = (Math.min(...xs) + Math.max(...xs)) / 2;
  const cz = (Math.min(...zs) + Math.max(...zs)) / 2;
  const span = Math.max(Math.max(...xs) - Math.min(...xs) + 6, 12);
  const halfW = Math.tan(THREE.MathUtils.degToRad(40 / 2)) * aspekt;
  const d = span / 2 / 0.88 / halfW;
  return { poz: new THREE.Vector3(cx, d * 0.36, cz + d), cel: new THREE.Vector3(cx, 0.8, cz) };
}

function odcinekW(odcinki: Odcinek[], t: number): number {
  let i = 0;
  odcinki.forEach((o, j) => { if (o.od <= t) i = j; });
  return i;
}

const Kamera = ({ dane, odcinki }: { dane: Dane; odcinki: Odcinek[] }) => {
  const { camera, size } = useThree();
  useFrame(() => {
    const t = czas.t;
    const aspekt = size.width / size.height;
    const i = odcinekW(odcinki, t);
    const teraz = poza(dane, odcinki[i]?.id ?? null, aspekt);
    const start = i === 0
      // Wejście: najazd z góry i z daleka
      ? { poz: teraz.poz.clone().add(new THREE.Vector3(-6, 12, 18)), cel: teraz.cel.clone() }
      : poza(dane, odcinki[i - 1].id, aspekt);
    const k = ease((t - (odcinki[i]?.od ?? 0)) / LOT);
    const poz = start.poz.clone().lerp(teraz.poz, k);
    const cel = start.cel.clone().lerp(teraz.cel, k);
    // W przelocie kamera śledzi przesyłkę lecącą do celu odcinka - widz patrzy, jak „wędruje” przelew
    const paczka = dane.paczki.find(p => t >= p.t0 && t <= p.t0 + PACZKA_LOT);
    if (paczka && i > 0) {
      cel.lerp(pozycjaPaczki(paczka, t), Math.sin(Math.PI * clamp01((t - paczka.t0) / PACZKA_LOT)) * 0.55);
    }
    // W połowie przelotu kamera lekko się wznosi - łuk zamiast prostej
    poz.y += Math.sin(Math.PI * k) * (i === 0 ? 0 : 1.6);
    // Ciągły, spokojny ruch - scena żyje także, gdy kamera stoi
    poz.x += Math.sin(t * 0.31) * 0.45;
    poz.y += Math.sin(t * 0.47) * 0.2;
    camera.position.copy(poz);
    camera.lookAt(cel);
  });
  return null;
};

const Tlo = () => {
  const { gl, scene } = useThree();
  useEffect(() => {
    // Odbicia otoczenia (studio z three.js, bez plików HDR) - metal, szkło i marmur wyglądają jak materiały
    const pmrem = new THREE.PMREMGenerator(gl);
    const otoczenie = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = otoczenie;
    scene.environmentIntensity = 0.3;
    return () => { otoczenie.dispose(); pmrem.dispose(); };
  }, [gl, scene]);
  const gwiazdy = useMemo(() => {
    const r = ziarno(7);
    const p = new Float32Array(1600 * 3);
    for (let i = 0; i < 1600; i++) {
      const u = r() * Math.PI * 2;
      const v = Math.acos(2 * r() - 1);
      const d = 110 + r() * 60;
      p[i * 3] = d * Math.sin(v) * Math.cos(u);
      p[i * 3 + 1] = Math.abs(d * Math.cos(v)) * 0.8 + 8;
      p[i * 3 + 2] = d * Math.sin(v) * Math.sin(u);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(p, 3));
    return g;
  }, []);
  return (
    <>
      <color attach="background" args={['#070b16']} />
      <fog attach="fog" args={['#070b16', 30, 120]} />
      <points geometry={gwiazdy}>
        <pointsMaterial color="#8fb0e8" size={0.35} sizeAttenuation transparent opacity={0.55} fog={false} />
      </points>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, PODLOGA, 0]} receiveShadow>
        <planeGeometry args={[400, 400]} />
        {/* Podłoga prawie bez odbić otoczenia - pod kątem odbijałaby jasne studio i szarzała */}
        <meshStandardMaterial color="#080c16" metalness={0.4} roughness={0.55} envMapIntensity={0.08} />
      </mesh>
      <gridHelper args={[260, 104, '#1b2c55', '#121d38']} position={[0, PODLOGA + 0.005, 0]}
        material-transparent material-opacity={0.35} />
      <ambientLight intensity={0.25} />
      <hemisphereLight args={['#9db8ff', '#0a0d16', 0.45]} />
      <directionalLight position={[-8, 16, 12]} intensity={1.5} castShadow shadow-mapSize-width={2048}
        shadow-mapSize-height={2048} shadow-camera-left={-30} shadow-camera-right={30} shadow-camera-top={20}
        shadow-camera-bottom={-20} shadow-camera-near={1} shadow-camera-far={60} shadow-bias={-0.0004} />
      <directionalLight position={[10, 6, -10]} intensity={0.8} color="#7aa2ff" />
    </>
  );
};

const JedenWezel = ({ w, dane, odcinki, czcionka, onSync }: { w: Wezel; dane: Dane; odcinki: Odcinek[]; czcionka?: string; onSync: () => void }) => {
  const stan = useRef<StanWezla>({ aktywnosc: 0, blysk: 0, dolot: -Infinity });
  const grupa = useRef<THREE.Group>(null);
  const model = useRef<THREE.Group>(null);
  const obwod = useRef<THREE.MeshBasicMaterial>(null);
  const reflektor = useRef<THREE.SpotLight>(null);
  const napis = useRef<THREE.Group>(null);
  const Model = modelWezla(w.model);
  const wejscie = 0.35 + w.nr * 0.3;
  const doloty = useMemo(() => dane.doloty.filter(b => b.id === w.id).map(b => b.t0), [dane, w.id]);

  useEffect(() => {
    model.current?.traverse(o => { if ((o as THREE.Mesh).isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  });

  // Priorytet -1: stan węzła przed animacjami modelu w tej samej klatce
  useFrame(() => {
    const t = czas.t;
    const i = odcinekW(odcinki, t);
    const aktywny = odcinki[i]?.id === w.id;
    const ostatni = doloty.filter(b => b <= t + 1e-6).at(-1);
    const dolotOdc = aktywny ? doloty.find(b => b >= odcinki[i].od - 1e-6) : undefined;
    stan.current.dolot = ostatni !== undefined ? t - ostatni : -Infinity;
    stan.current.aktywnosc = aktywny && dolotOdc !== undefined ? easeOut((t - dolotOdc + 0.6) / 0.8) : 0;
    stan.current.blysk = doloty.reduce((s, b) => s + (t >= b ? Math.exp(-(t - b) * 3) : 0), 0);
    const { aktywnosc, blysk } = stan.current;
    const pop = Math.max(easeOut((t - wejscie) / 0.7) * (1 + Math.sin(clamp01((t - wejscie) / 0.7) * Math.PI) * 0.08), 0.0001);
    grupa.current?.scale.setScalar(pop);
    if (model.current) {
      model.current.position.y = POSTUMENT + aktywnosc * 0.1;
      model.current.rotation.y = Math.sin(t * 0.5 + w.nr) * 0.12 + 0.18 * (1 - aktywnosc);
      model.current.scale.setScalar(1 + blysk * 0.05);
    }
    if (obwod.current) obwod.current.color.copy(neon(w.kolor, 0.8 + aktywnosc * 2.2 + blysk * 3));
    if (reflektor.current) reflektor.current.intensity = aktywnosc * 7 + blysk * 6;
    if (napis.current) napis.current.scale.setScalar(Math.max(easeOut((t - wejscie - 0.3) / 0.6), 0.0001));
  }, -1);

  return (
    <group position={w.poz}>
      <group ref={grupa}>
        <group position={[0, PODLOGA, 0]}>
          {/* postument z świecącą krawędzią */}
          <mesh position={[0, POSTUMENT / 2, 0]} receiveShadow castShadow>
            <cylinderGeometry args={[1.95, 2.05, POSTUMENT, 64]} />
            <meshStandardMaterial color="#1a2030" metalness={0.75} roughness={0.32} />
          </mesh>
          <mesh position={[0, POSTUMENT + 0.002, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[1.86, 1.95, 96]} />
            <meshBasicMaterial ref={obwod} toneMapped={false} />
          </mesh>
          <group ref={model}>
            <Model kolor={w.kolor} stan={stan} />
          </group>
        </group>
      </group>
      <spotLight ref={reflektor} position={[1.5, 9, 5]} angle={0.42} penumbra={0.7} distance={30} decay={1.4}
        color={w.kolor.clone().lerp(BIALY, 0.65)} target-position={[w.poz.x, 0, w.poz.z]} />
      <group ref={napis} position={[0, PODLOGA + POSTUMENT + Model.wysokosc + 0.45, 0]}>
        <Text font={czcionka} fontSize={0.5} anchorX="center" anchorY="bottom" color="#e7ecf6" outlineWidth={0.035}
          outlineColor="#03050b" letterSpacing={0.03} onSync={onSync}>
          {w.tytul}
        </Text>
      </group>
    </group>
  );
};

const Wezly = ({ dane, odcinki, czcionka, onGotowy }: { dane: Dane; odcinki: Odcinek[]; czcionka?: string; onGotowy: () => void }) => {
  const zsync = useRef(0);
  return (
    <>
      {dane.wezly.map(w => (
        <JedenWezel key={w.id} w={w} dane={dane} odcinki={odcinki} czcionka={czcionka}
          onSync={() => { zsync.current += 1; if (zsync.current === dane.wezly.length) onGotowy(); }} />
      ))}
    </>
  );
};

/** Strzałka - świecący przewód nisko nad podłogą, od postumentu do postumentu; po nim płyną drobne impulsy. */
const JednaKrawedz = ({ k }: { k: Krawedz }) => {
  const rdzen = useRef<THREE.Group>(null);
  const impulsy = useRef<THREE.InstancedMesh>(null);
  const { a, b, dlugosc, obrot } = useMemo(() => {
    const kier = k.b.clone().sub(k.a).setY(0).normalize();
    const y = PODLOGA + 0.12;
    const a = k.a.clone().setY(y).add(kier.clone().multiplyScalar(2.15));
    const b = k.b.clone().setY(y).sub(kier.clone().multiplyScalar(2.35));
    return { a, b, dlugosc: a.distanceTo(b), obrot: new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), kier) };
  }, [k]);
  const pomoc = useMemo(() => new THREE.Object3D(), []);
  const wzrost = 1.0 + k.nr * 0.3;
  useFrame(() => {
    const t = czas.t;
    const g = ease((t - wzrost) / 0.7);
    if (rdzen.current) {
      rdzen.current.scale.set(1, Math.max(g, 0.0001), 1);
      rdzen.current.position.copy(a.clone().lerp(b, g / 2));
    }
    if (impulsy.current) {
      for (let j = 0; j < 5; j++) {
        const f = (t * 0.32 + j / 5) % 1;
        pomoc.position.copy(a.clone().lerp(b, f));
        pomoc.scale.set(1, 1, 1).multiplyScalar(g >= 1 ? Math.sin(f * Math.PI) : 0.0001);
        pomoc.quaternion.copy(obrot);
        pomoc.updateMatrix();
        impulsy.current.setMatrixAt(j, pomoc.matrix);
      }
      impulsy.current.instanceMatrix.needsUpdate = true;
    }
  });
  return (
    <group>
      <group ref={rdzen} position={a} quaternion={obrot}>
        <mesh>
          <cylinderGeometry args={[0.035, 0.035, dlugosc, 10]} />
          <meshBasicMaterial color={neon('#7cc4ff', 1.6)} toneMapped={false} />
        </mesh>
        <mesh position={[0, dlugosc / 2 + 0.14, 0]}>
          <coneGeometry args={[0.16, 0.32, 20]} />
          <meshBasicMaterial color={neon('#b9e2ff', 1.8)} toneMapped={false} />
        </mesh>
      </group>
      <instancedMesh frustumCulled={false} ref={impulsy} args={[undefined, undefined, 5]}>
        <capsuleGeometry args={[0.05, 0.35, 4, 8]} />
        <meshBasicMaterial color={neon('#e2f3ff', 2.4)} toneMapped={false} />
      </instancedMesh>
    </group>
  );
};

const SMUGA = 18;

/** Gdzie jest przesyłka w chwili t: łuk nad strzałką od węzła do węzła. */
function pozycjaPaczki(p: Paczka, t: number) {
  const k = ease((t - p.t0) / PACZKA_LOT);
  const v = p.a.clone().lerp(p.b, k);
  v.y = 0.9 + Math.sin(Math.PI * k) * 2.4;
  return v;
}

/** Przesyłka (koperta albo moneta) leci łukiem nad strzałką i zostawia złotą smugę. */
const JednaPaczka = ({ p }: { p: Paczka }) => {
  const grupa = useRef<THREE.Group>(null);
  const smuga = useRef<THREE.InstancedMesh>(null);
  const swiatlo = useRef<THREE.PointLight>(null);
  const pomoc = useMemo(() => new THREE.Object3D(), []);
  const gdzie = (t: number) => pozycjaPaczki(p, t);
  useFrame(() => {
    const t = czas.t;
    const widac = t >= p.t0 && t <= p.t0 + PACZKA_LOT;
    const k = clamp01((t - p.t0) / PACZKA_LOT);
    if (grupa.current) {
      grupa.current.visible = widac;
      grupa.current.position.copy(gdzie(t));
      // Wylot i dolot - przesyłka rośnie i maleje; w locie wiruje i przechyla się zgodnie z łukiem
      grupa.current.scale.setScalar(Math.sin(Math.PI * Math.min(k * 1.6, 1) / 2) * (1 - easeOut((k - 0.85) / 0.15) * 0.6));
      if (p.typ === 'moneta') {
        grupa.current.rotation.set(0, t * 9, 0);
      } else {
        grupa.current.rotation.set(0.15, Math.sin(t * 3) * 0.25, Math.cos(Math.PI * k) * -0.5);
      }
    }
    if (smuga.current) {
      for (let j = 0; j < SMUGA; j++) {
        const tj = t - (j + 1) * 0.03;
        const jest = tj >= p.t0 && tj <= p.t0 + PACZKA_LOT;
        pomoc.position.copy(gdzie(tj));
        pomoc.scale.setScalar(jest ? (1 - j / SMUGA) * 0.9 : 0.0001);
        pomoc.updateMatrix();
        smuga.current.setMatrixAt(j, pomoc.matrix);
      }
      smuga.current.instanceMatrix.needsUpdate = true;
    }
    if (swiatlo.current) {
      swiatlo.current.position.copy(gdzie(t));
      swiatlo.current.intensity = widac ? 2.5 : 0;
    }
  });
  return (
    <>
      <group ref={grupa}>{p.typ === 'moneta' ? <Moneta /> : <Koperta kolor={p.kolor} />}</group>
      <instancedMesh frustumCulled={false} ref={smuga} args={[undefined, undefined, SMUGA]}>
        <sphereGeometry args={[0.07, 10, 10]} />
        <meshBasicMaterial color={neon(ZLOTY, 2.2)} toneMapped={false} />
      </instancedMesh>
      <pointLight ref={swiatlo} color="#ffd98a" distance={8} decay={1.6} />
    </>
  );
};

const Iskry = ({ dane }: { dane: Dane }) => {
  const ref = useRef<THREE.InstancedMesh>(null);
  const pomoc = useMemo(() => new THREE.Object3D(), []);
  const czastki = useMemo(() => dane.wybuchy.flatMap(w => {
    const r = ziarno(w.seed);
    return Array.from({ length: w.ile }, (_, n) => {
      const u = r() * Math.PI * 2;
      const v = Math.acos(2 * r() - 1);
      const s = w.predkosc * (0.4 + r() * 0.8);
      return {
        t0: w.t0, poz: w.poz,
        v: new THREE.Vector3(Math.sin(v) * Math.cos(u) * s, Math.abs(Math.cos(v)) * s * 0.8 + w.wGore, Math.sin(v) * Math.sin(u) * s),
        neon: neon(w.kolory[n % w.kolory.length], 2.6), zycie: ISKRY_ZYCIE * (0.6 + r() * 0.7), rozmiar: 0.5 + r() * 0.8,
        obrot: r() * 10,
      };
    });
  }).slice(0, MAX_ISKIER), [dane]);
  useFrame(() => {
    const t = czas.t;
    czastki.forEach((c, i) => {
      const tau = t - c.t0;
      if (tau >= 0 && tau <= c.zycie) {
        const opor = (1 - Math.exp(-tau * 2.4)) / 2.4;
        pomoc.position.set(c.poz.x + c.v.x * opor, c.poz.y + c.v.y * opor - 2.6 * tau * tau, c.poz.z + c.v.z * opor);
        pomoc.rotation.set(c.obrot + tau * 6, c.obrot * 2 + tau * 4, 0);
        pomoc.scale.setScalar(c.rozmiar * (1 - tau / c.zycie));
      } else {
        pomoc.scale.setScalar(0.0001);
      }
      pomoc.updateMatrix();
      ref.current?.setMatrixAt(i, pomoc.matrix);
      ref.current?.setColorAt(i, c.neon);
    });
    if (ref.current) {
      ref.current.instanceMatrix.needsUpdate = true;
      if (ref.current.instanceColor) ref.current.instanceColor.needsUpdate = true;
    }
  });
  return (
    <instancedMesh frustumCulled={false} ref={ref} args={[undefined, undefined, Math.max(czastki.length, 1)]}>
      {/* płaskie „konfetti” - obracając się mieni się jak papier */}
      <planeGeometry args={[0.12, 0.07]} />
      <meshBasicMaterial toneMapped={false} side={THREE.DoubleSide} />
    </instancedMesh>
  );
};

/** Fala po postumencie przy dolocie przesyłki. */
const Fala = ({ t0, poz, kolor }: { t0: number; poz: THREE.Vector3; kolor: THREE.Color }) => {
  const ref = useRef<THREE.Mesh>(null);
  useFrame(() => {
    const tau = czas.t - t0;
    const k = clamp01(tau / 1.1);
    const widac = tau >= 0 && tau <= 1.1;
    if (ref.current) {
      ref.current.scale.setScalar(widac ? 1 + easeOut(k) * 1.6 : 0.0001);
      (ref.current.material as THREE.MeshBasicMaterial).opacity = widac ? (1 - k) * 0.7 : 0;
    }
  });
  return (
    <mesh ref={ref} position={[poz.x, PODLOGA + 0.01, poz.z]} rotation={[-Math.PI / 2, 0, 0]}>
      <ringGeometry args={[1.95, 2.05, 128]} />
      <meshBasicMaterial color={neon(kolor, 2.4)} toneMapped={false} transparent depthWrite={false} blending={THREE.AdditiveBlending} />
    </mesh>
  );
};

/** Bloom + winieta; przejmuje renderowanie klatki (useFrame z priorytetem 1). */
const Efekty = () => {
  const { gl, scene, camera, size } = useThree();
  const kompozytor = useMemo(() => {
    const c = new EffectComposer(gl);
    c.addPass(new RenderPass(scene, camera));
    // Próg 1,0 (jasność liniowa): świecą tylko elementy w kolorach HDR (neon), modele zostają ostre
    c.addPass(new UnrealBloomPass(new THREE.Vector2(size.width, size.height), 0.7, 0.4, 1.0));
    const winieta = new ShaderPass(VignetteShader);
    winieta.uniforms.offset.value = 1.0;
    winieta.uniforms.darkness.value = 0.9;
    c.addPass(winieta);
    c.addPass(new OutputPass());
    return c;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gl, scene, camera]);
  useEffect(() => { kompozytor.setSize(size.width, size.height); }, [kompozytor, size]);
  useFrame(() => kompozytor.render(), 1);
  return null;
};

export const FilmScena = ({ ujecie, onGotowa }: { ujecie: Ujecie; onGotowa: () => void }) => {
  const dane = useMemo(() => przygotujScene(ujecie), [ujecie]);
  const { gl } = useThree();
  useEffect(() => {
    gl.toneMapping = THREE.ACESFilmicToneMapping;
    gl.toneMappingExposure = 0.9;
    gl.shadowMap.type = THREE.PCFSoftShadowMap;
  }, [gl]);
  return (
    <>
      <Tlo />
      <Kamera dane={dane} odcinki={ujecie.odcinki} />
      <Wezly dane={dane} odcinki={ujecie.odcinki} czcionka={ujecie.czcionka} onGotowy={onGotowa} />
      {dane.krawedzie.map(k => <JednaKrawedz key={k.nr} k={k} />)}
      {dane.paczki.map((p, i) => <JednaPaczka key={i} p={p} />)}
      {dane.doloty.map((d, i) => <Fala key={i} t0={d.t0} poz={dane.poId.get(d.id)!.poz} kolor={dane.poId.get(d.id)!.kolor} />)}
      <Iskry dane={dane} />
      <Efekty />
    </>
  );
};
