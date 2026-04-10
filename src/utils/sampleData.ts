import type { ProjectData } from '../types';

export const sampleProject: ProjectData = {
  id: 'sample-project-1',
  name: 'Demo ThreeDocsy – Poznaj możliwości',
  steps: [
    {
      id: 'step-1',
      title: '👋 Witaj w ThreeDocsy!',
      description:
        'Ten model demonstracyjny pokazuje wszystkie możliwości systemu ThreeDocsy. Kliknij kolejne węzły na diagramie (lub użyj przycisków nawigacji w trybie podglądu), aby poznać każdą funkcję. Każdy węzeł to jeden krok dokumentacji — z tytułem, opisem i własnym modelem 3D.',
      modelPath: 'box',
      cameraPosition: { x: 5, y: 5, z: 5, targetX: 0, targetY: 0, targetZ: 0 },
      highlightColor: '#4299e1',
      shapeType: 'cube',
    },
    {
      id: 'step-2a',
      title: '🔵 Wbudowane kształty 3D',
      description:
        'System oferuje 5 wbudowanych kształtów: sześcian, kula (jak ten!), walec, stożek i klocek z tekstem. Każdy węzeł może mieć inny kształt oraz dowolny kolor podświetlenia — dobierasz je w panelu właściwości po lewej stronie.',
      modelPath: 'box',
      cameraPosition: { x: 3, y: 4, z: 6, targetX: 0, targetY: 0, targetZ: 0 },
      highlightColor: '#48bb78',
      shapeType: 'sphere',
    },
    {
      id: 'step-2b',
      title: '🔲 Klocek z wyrytym tekstem',
      description:
        'Specjalny klocek z wyrytym napisem — idealny do oznaczania serwisów, API, baz danych i modułów systemu. Możesz wybrać tekst (do 24 znaków), czcionkę (Helvetiker, Optimer, Gentilis) oraz ścianę klocka (przód, tył, boki, góra, dół).',
      modelPath: 'box',
      cameraPosition: { x: -3, y: 4, z: 6, targetX: 0, targetY: 0, targetZ: 0 },
      highlightColor: '#f6ad55',
      shapeType: 'engravedBlock',
      engravedBlockParams: {
        text: 'API',
        font: 'helvetiker',
        depth: 0.08,
        padding: 0.1,
        face: 'front',
      },
    },
    {
      id: 'step-3',
      title: '🔗 Style połączeń',
      description:
        'Węzły łączysz liniami w 4 stylach wizualnych: standardowy, szklany (glass), świecący (glow) i neonowy (neon). Możesz używać rur lub strzałek, ustawiać kierunek przepływu i dodawać opis do każdego połączenia. Kliknij dowolną strzałkę na diagramie, aby ją edytować.',
      modelPath: 'box',
      cameraPosition: { x: -4, y: 3, z: 5, targetX: 0, targetY: 0, targetZ: 0 },
      highlightColor: '#9f7aea',
      shapeType: 'cylinder',
    },
    {
      id: 'step-4',
      title: '📦 Zewnętrzny model GLTF/GLB',
      description:
        'Możesz załadować własny model 3D w formacie GLTF lub GLB — z Blendera, CAD-a lub innego narzędzia. Tutaj widzisz przykładowy model z biblioteki KhronosGroup. Po rejestracji możesz wgrywać własne modele bezpośrednio z dysku i używać ich we wszystkich projektach.',
      modelPath: 'box',
      cameraPosition: { x: 2, y: 6, z: 4, targetX: 0, targetY: 0, targetZ: 0 },
      highlightColor: '#ed8936',
      shapeType: 'custom',
      customModelUrl:
        'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/Duck/glTF-Binary/Duck.glb',
    },
    {
      id: 'step-5',
      title: '🚀 Zarejestruj się — za darmo!',
      description:
        'Widziałeś już wszystkie podstawowe możliwości ThreeDocsy! Zarejestruj się bezpłatnie i odblokuj pełny potencjał: 💾 Zapisuj projekty na serwerze · 🔗 Udostępniaj modele jednym kliknięciem · 🧩 Twórz własne elementy 3D · 📤 Importuj modele GLTF/GLB · 📋 Buduj interaktywne przewodniki krok po kroku.',
      modelPath: 'box',
      cameraPosition: { x: 2, y: 6, z: 4, targetX: 0, targetY: 0, targetZ: 0 },
      highlightColor: '#e53e3e',
      shapeType: 'cone',
    },
  ],
  connections: [
    // Krok 1 rozgałęzia się na dwa równoległe kroki (2a i 2b)
    {
      id: 'e1-2a',
      source: 'step-1',
      target: 'step-2a',
      data: {
        style: 'glass',
        connectionType: 'tube',
        arrowDirection: 'forward',
        description: 'Poznaj wbudowane kształty 3D',
      },
    },
    {
      id: 'e1-2b',
      source: 'step-1',
      target: 'step-2b',
      data: {
        style: 'glow',
        connectionType: 'tube',
        arrowDirection: 'forward',
        description: 'Klocek z wyrytym tekstem',
      },
    },
    // Oba równoległe kroki zbiegają się w kroku 3
    {
      id: 'e2a-3',
      source: 'step-2a',
      target: 'step-3',
      data: {
        style: 'neon',
        connectionType: 'arrow',
        arrowDirection: 'bidirectional',
        description: 'Styl neonowy · strzałka dwukierunkowa',
      },
    },
    {
      id: 'e2b-3',
      source: 'step-2b',
      target: 'step-3',
      data: {
        style: 'standard',
        connectionType: 'arrow',
        arrowDirection: 'forward',
        description: 'Styl standardowy · strzałka naprzód',
      },
    },
    // Krok 3 do przykładowego modelu zewnętrznego
    {
      id: 'e3-4',
      source: 'step-3',
      target: 'step-4',
      data: {
        style: 'glass',
        connectionType: 'tube',
        arrowDirection: 'forward',
        description: 'Ładowanie zewnętrznego modelu 3D',
      },
    },
    // Zewnętrzny model do podsumowania
    {
      id: 'e4-5',
      source: 'step-4',
      target: 'step-5',
      data: {
        style: 'glow',
        connectionType: 'tube',
        arrowDirection: 'none',
        description: 'Podsumowanie możliwości systemu',
      },
    },
  ],
  guide: [
    { id: 'guide-1', stepId: 'step-1' },
    { id: 'guide-2', stepId: 'step-2a' },
    { id: 'guide-3', stepId: 'step-2b' },
    { id: 'guide-4', stepId: 'step-3' },
    { id: 'guide-5', stepId: 'step-4' },
    { id: 'guide-6', stepId: 'step-5' },
  ],
};

/**
 * Node positions for the sample project flow graph.
 * The graph has a diamond shape:
 *   step-1 → step-2a ─┐
 *          ↘ step-2b ─┴→ step-3 → step-4 → step-5
 *
 * ─────────────────────────────────────────────────────────────
 * 👉 Jeśli chcesz wkleić własny przykład, zastąp obiekt
 *    `sampleProject` powyżej swoim JSONem (ProjectData),
 *    a tutaj podaj pozycje węzłów dla swojego projektu.
 * ─────────────────────────────────────────────────────────────
 *
 * Demo scenario summary:
 *   step-1  — Witaj! (sześcian)
 *   step-2a — Wbudowane kształty (kula)
 *   step-2b — Klocek z tekstem (engravedBlock „API")
 *   step-3  — Style połączeń (walec)
 *   step-4  — Zewnętrzny model GLB (kaczuszka KhronosGroup)
 *   step-5  — Rejestracja CTA (stożek)
 */
export const sampleNodePositions: Record<string, { x: number; y: number }> = {
  'step-1':  { x: 250, y: 0   },
  'step-2a': { x: 50,  y: 175 },
  'step-2b': { x: 450, y: 175 },
  'step-3':  { x: 250, y: 350 },
  'step-4':  { x: 250, y: 525 },
  'step-5':  { x: 250, y: 700 },
};
