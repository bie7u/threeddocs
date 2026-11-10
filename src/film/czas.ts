/** Czas sceny filmowej w sekundach - ustawiany przed każdą klatką (embed.tsx: __film3d.klatka). */
export const czas = { t: 0 };

/** Stan węzła w bieżącej klatce - liczy go FilmScena, czytają modele. */
export interface StanWezla {
  /** 0..1 - kamera jest na tym węźle (narasta po dolocie paczki). */
  aktywnosc: number;
  /** Błysk po dolocie paczki (1 w chwili dolotu, potem gaśnie). */
  blysk: number;
  /** Sekundy od ostatniego dolotu paczki do węzła; ujemne / -Infinity - jeszcze nie doleciała. */
  dolot: number;
}

export const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
export const ease = (x: number) => {
  const k = clamp01(x);
  return k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
};
export const easeOut = (x: number) => 1 - Math.pow(1 - clamp01(x), 3);
export const easeIn = (x: number) => Math.pow(clamp01(x), 3);
/** Deterministyczne „losowe” liczby (mulberry32) - klatka zawsze wygląda tak samo. */
export const ziarno = (s: number) => () => {
  s |= 0; s = (s + 0x6d2b79f5) | 0;
  let t = Math.imul(s ^ (s >>> 15), 1 | s);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
/** Pseudolosowa liczba 0..1 z dwóch liczb całkowitych (np. dioda i takt). */
export const szum = (a: number, b: number) => {
  const x = Math.sin(a * 12.9898 + b * 78.233) * 43758.5453;
  return x - Math.floor(x);
};
/** Czcionka napisów na teksturach (embed.tsx ładuje Inter jako FontFace). */
export const PISMO = '"FilmInter", "DejaVu Sans", sans-serif';
