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

export type ShapeType = 'cube' | 'sphere' | 'cylinder' | 'cone' | 'custom';

export interface ConnectionData {
  style?: ConnectionStyle;
  description?: string;
  shapeType?: ShapeType;
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
}

export interface ProjectData {
  id: string;
  name: string;
  steps: InstructionStep[];
  connections: Edge<ConnectionData>[];
}

export type StepNode = Node<InstructionStep>;
