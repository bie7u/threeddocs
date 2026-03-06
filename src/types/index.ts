import type { Node, Edge } from 'reactflow';

export interface CameraPosition {
  x: number;
  y: number;
  z: number;
  targetX?: number;
  targetY?: number;
  targetZ?: number;
}

export interface Annotation {
  id: string;
  position: [number, number, number];
  text: string;
}

export type ConnectionStyle = 'standard' | 'glass' | 'glow' | 'neon';

export type ArrowDirection = 'none' | 'forward' | 'backward' | 'bidirectional';

export type ShapeType = 'cube' | 'sphere' | 'cylinder' | 'cone' | 'custom' | 'engravedBlock' | 'custom3dElement';

export interface Custom3DElement {
  id: string;
  name: string;
  text: string; // max 5 characters – source for the 3D text shape
  color: string;
  wireframe: boolean;
  wireframeColor: string;
  textureDataUrl?: string; // base64-encoded image
  createdAt: number;
}

export type EngravedBlockFace = 'front' | 'back' | 'left' | 'right' | 'top' | 'bottom';

export interface EngravedBlockParams {
  text: string;
  font: 'helvetiker' | 'optimer' | 'gentilis';
  depth: number;
  padding: number;
  face: EngravedBlockFace;
}

export type ConnectionType = 'tube' | 'arrow';

export interface ConnectionData {
  style?: ConnectionStyle;
  description?: string;
  shapeType?: ShapeType;
  arrowDirection?: ArrowDirection;
  connectionType?: ConnectionType;
}

export interface InstructionStep {
  id: string;
  title: string;
  description: string;
  modelPath: string;
  cameraPosition: CameraPosition;
  annotations?: Annotation[];
  highlightColor?: string;
  shapeType?: ShapeType;
  customModelUrl?: string;
  modelScale?: number;
  // Engraved block specific parameters
  engravedBlockParams?: EngravedBlockParams;
  // Custom 3D element reference
  custom3dElementId?: string;
  // Upload-model specific: which mesh element this step focuses on
  focusMeshName?: string;
  focusPoint?: [number, number, number];
}

export interface GuideStep {
  id: string;
  stepId: string;
  label?: string;
}

export interface ProjectData {
  id: string;
  name: string;
  projectType?: 'builder' | 'upload';
  projectModelUrl?: string;
  steps: InstructionStep[];
  connections: Edge<ConnectionData>[];
  guide?: GuideStep[];
}

export type StepNode = Node<InstructionStep>;
