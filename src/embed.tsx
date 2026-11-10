import { StrictMode, useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Canvas, advance } from '@react-three/fiber';
import type { WebGLRenderer } from 'three';
import './index.css';
import { FilmScena, czas } from './film/FilmScena';
import type { Ujecie } from './film/FilmScena';

/**
 * Embed: scena filmowa (src/film/FilmScena.tsx) renderowana klatka po klatce - do filmów instruktażowych, które
 * renderują scenę po nagraniu (bez GPU render na żywo nie nadąża za wideo). Sterowanie przez `window.__film3d`:
 * `przygotuj(ujecie)` - scena + oś czasu, czeka na czcionki; `klatka(t)` - klatka w sekundzie t jako JPEG (data URL).
 * Ręczny podgląd w przeglądarce: `embed.html?scena=<url JSON sceny>` - odtwarza całość na żywo (węzeł co 3,5 s).
 */
declare global {
  interface Window {
    __film3d?: {
      przygotuj: (ujecie: Ujecie) => Promise<void>;
      klatka: (t: number, jakosc?: number) => string;
    };
  }
}

const Embed = () => {
  const [ujecie, setUjecie] = useState<Ujecie | null>(null);
  const gotowa = useRef<() => void>(() => {});
  const gl = useRef<WebGLRenderer | null>(null);

  useEffect(() => {
    window.__film3d = {
      przygotuj: async (u) => {
        // Czcionka dla napisów rysowanych na teksturach modeli (ekran EZN, faktura) - przed pierwszym rysowaniem
        if (u.czcionka) {
          const pismo = new FontFace('FilmInter', `url(${u.czcionka})`);
          await pismo.load();
          document.fonts.add(pismo);
        }
        await new Promise<void>((resolve) => {
          gotowa.current = resolve;
          setUjecie(u);
        });
      },
      klatka: (t, jakosc = 0.92) => {
        czas.t = t;
        advance(performance.now());
        return gl.current!.domElement.toDataURL('image/jpeg', jakosc);
      },
    };
    const adres = new URLSearchParams(window.location.search).get('scena');
    if (adres) {
      fetch(adres).then((r) => r.json()).then((scena) => {
        const odcinki = [{ id: null, od: 0 },
          ...scena.project.steps.map((s: { id: string }, i: number) => ({ id: s.id, od: 4 + i * 3.5 }))];
        setUjecie({ scena, odcinki });
        const start = performance.now();
        const petla = () => {
          czas.t = (performance.now() - start) / 1000;
          advance(performance.now());
          requestAnimationFrame(petla);
        };
        requestAnimationFrame(petla);
      });
    }
  }, []);

  if (!ujecie) {
    return null;
  }
  return (
    <div className="w-screen h-screen">
      <Canvas frameloop="never" dpr={1} shadows camera={{ fov: 40, near: 0.1, far: 500 }}
        gl={{ preserveDrawingBuffer: true, antialias: true }} onCreated={(s) => { gl.current = s.gl; }}>
        <FilmScena ujecie={ujecie} onGotowa={() => gotowa.current()} />
      </Canvas>
    </div>
  );
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Embed />
  </StrictMode>,
);
