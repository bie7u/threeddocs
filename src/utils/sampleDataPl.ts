import type { ProjectData } from '../types';
import { sampleNodePositions } from './sampleData';

export const sampleProjectPl: ProjectData = {
  id: 'sample-project-1',
  name: 'Przykładowe instrukcje montażu',
  steps: [
    {
      id: 'step-1',
      title: 'Wprowadzenie',
      description: 'Witamy w tym samouczku montażu 3D. Przeprowadzimy Cię przez każdy krok.',
      modelPath: 'box',
      cameraPosition: { x: 5, y: 5, z: 5, targetX: 0, targetY: 0, targetZ: 0 },
      highlightColor: '#4299e1',
      shapeType: 'cube',
    },
    {
      id: 'step-2a',
      title: 'Identyfikacja elementów A',
      description: 'Zidentyfikuj główne elementy ramy.',
      modelPath: 'box',
      cameraPosition: { x: 3, y: 4, z: 6, targetX: 0, targetY: 0, targetZ: 0 },
      highlightColor: '#48bb78',
      shapeType: 'sphere',
    },
    {
      id: 'step-2b',
      title: 'Identyfikacja elementów B',
      description: 'Zidentyfikuj złączki i łączniki.',
      modelPath: 'box',
      cameraPosition: { x: -3, y: 4, z: 6, targetX: 0, targetY: 0, targetZ: 0 },
      highlightColor: '#f6ad55',
      shapeType: 'cylinder',
    },
    {
      id: 'step-3',
      title: 'Montaż',
      description: 'Rozpocznij proces montażu, łącząc główne elementy.',
      modelPath: 'box',
      cameraPosition: { x: -4, y: 3, z: 5, targetX: 0, targetY: 0, targetZ: 0 },
      highlightColor: '#ed8936',
      shapeType: 'cone',
    },
    {
      id: 'step-4',
      title: 'Przykładowy model niestandardowy',
      description: 'W tym kroku pokazano ładowanie niestandardowego modelu 3D. Możesz zastąpić URL dowolnym modelem GLTF lub GLB.',
      modelPath: 'box',
      cameraPosition: { x: 2, y: 6, z: 4, targetX: 0, targetY: 0, targetZ: 0 },
      highlightColor: '#9f7aea',
      shapeType: 'custom',
      customModelUrl: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/Duck/glTF-Binary/Duck.glb',
    },
    {
      id: 'step-5',
      title: 'Kontrola końcowa',
      description: 'Sprawdź zmontowany produkt i upewnij się, że wszystkie elementy są zamocowane.',
      modelPath: 'box',
      cameraPosition: { x: 2, y: 6, z: 4, targetX: 0, targetY: 0, targetZ: 0 },
      highlightColor: '#e53e3e',
      shapeType: 'cube',
    },
  ],
  connections: [
    { id: 'e1-2a', source: 'step-1', target: 'step-2a', data: { style: 'glass', description: 'Podążaj tą ścieżką, aby zidentyfikować elementy ramy' } },
    { id: 'e1-2b', source: 'step-1', target: 'step-2b', data: { style: 'glow', description: 'Ta ścieżka prowadzi do identyfikacji złączek i łączników', shapeType: 'sphere' } },
    { id: 'e2a-3', source: 'step-2a', target: 'step-3', data: { style: 'neon', description: 'Połącz elementy ramy z montażem', shapeType: 'cube' } },
    { id: 'e2b-3', source: 'step-2b', target: 'step-3', data: { style: 'standard', description: 'Dodaj złączki, aby zabezpieczyć montaż' } },
    { id: 'e3-4', source: 'step-3', target: 'step-4', data: { style: 'glass', description: 'Wyświetl przykładowy model 3D', shapeType: 'cylinder' } },
    { id: 'e4-5', source: 'step-4', target: 'step-5', data: { style: 'glow', description: 'Przejdź do końcowej kontroli jakości' } },
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

// Node positions are identical for both languages
export { sampleNodePositions as sampleNodePositionsPl };
