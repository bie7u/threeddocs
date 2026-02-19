import type { ProjectData } from '../types';

export const sampleProject: ProjectData = {
  id: 'sample-project-1',
  name: 'Sample Assembly Instructions',
  steps: [
    {
      id: 'step-1',
      title: 'Introduction',
      description: 'Welcome to this 3D assembly tutorial. We will guide you through each step.',
      modelPath: 'box', // Using procedural geometry
      cameraPosition: { x: 5, y: 5, z: 5, targetX: 0, targetY: 0, targetZ: 0 },
      highlightColor: '#4299e1',
      shapeType: 'cube',
    },
    {
      id: 'step-2a',
      title: 'Identify Parts A',
      description: 'Identify the main frame components.',
      modelPath: 'box',
      cameraPosition: { x: 3, y: 4, z: 6, targetX: 0, targetY: 0, targetZ: 0 },
      highlightColor: '#48bb78',
      shapeType: 'sphere',
    },
    {
      id: 'step-2b',
      title: 'Identify Parts B',
      description: 'Identify the fasteners and connectors.',
      modelPath: 'box',
      cameraPosition: { x: -3, y: 4, z: 6, targetX: 0, targetY: 0, targetZ: 0 },
      highlightColor: '#f6ad55',
      shapeType: 'cylinder',
    },
    {
      id: 'step-3',
      title: 'Assembly',
      description: 'Begin the assembly process by connecting the main components.',
      modelPath: 'box',
      cameraPosition: { x: -4, y: 3, z: 5, targetX: 0, targetY: 0, targetZ: 0 },
      highlightColor: '#ed8936',
      shapeType: 'cone',
    },
    {
      id: 'step-4',
      title: 'Custom Model Example',
      description: 'This step demonstrates custom 3D model loading. You can replace the URL with any GLTF or GLB model.',
      modelPath: 'box', // modelPath is kept for backward compatibility, actual model loaded via customModelUrl
      cameraPosition: { x: 2, y: 6, z: 4, targetX: 0, targetY: 0, targetZ: 0 },
      highlightColor: '#9f7aea',
      shapeType: 'custom',
      customModelUrl: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/Duck/glTF-Binary/Duck.glb',
    },
    {
      id: 'step-5',
      title: 'Final Check',
      description: 'Review the assembled product and ensure all parts are secure.',
      modelPath: 'box',
      cameraPosition: { x: 2, y: 6, z: 4, targetX: 0, targetY: 0, targetZ: 0 },
      highlightColor: '#e53e3e',
      shapeType: 'cube',
    },
  ],
  connections: [
    // Step 1 branches into two parallel steps (2a and 2b)
    { id: 'e1-2a', source: 'step-1', target: 'step-2a', data: { style: 'glass', description: 'Follow this path to identify main frame components' } },
    { id: 'e1-2b', source: 'step-1', target: 'step-2b', data: { style: 'glow', description: 'This path leads to fasteners and connectors identification', shapeType: 'sphere' } },
    // Both parallel steps converge into step 3
    { id: 'e2a-3', source: 'step-2a', target: 'step-3', data: { style: 'neon', description: 'Connect frame parts to the assembly', shapeType: 'cube' } },
    { id: 'e2b-3', source: 'step-2b', target: 'step-3', data: { style: 'standard', description: 'Add fasteners to secure the assembly' } },
    // Step 3 to custom model example
    { id: 'e3-4', source: 'step-3', target: 'step-4', data: { style: 'glass', description: 'View custom 3D model example', shapeType: 'cylinder' } },
    // Custom model to final step
    { id: 'e4-5', source: 'step-4', target: 'step-5', data: { style: 'glow', description: 'Proceed to final quality check' } },
  ],
};
