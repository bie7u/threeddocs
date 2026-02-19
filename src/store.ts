import { create } from 'zustand';
import type { Edge } from 'reactflow';
import type { InstructionStep, ProjectData, ConnectionData } from '../types';

export interface SavedProject {
  project: ProjectData;
  nodePositions: Record<string, { x: number; y: number }>;
  lastModified: number;
}

interface AppStore {
  // Project data
  project: ProjectData | null;
  
  // Selected step
  selectedStepId: string | null;
  
  // Preview mode
  isPreviewMode: boolean;
  currentPreviewStepIndex: number;
  
  // View/Edit mode
  viewMode: 'view' | 'edit';
  
  // Camera mode
  cameraMode: 'auto' | 'free';
  
  // Node positions for React Flow
  nodePositions: Record<string, { x: number; y: number }>;
  
  // Actions
  setProject: (project: ProjectData, nodePositions?: Record<string, { x: number; y: number }>) => void;
  addStep: (step: InstructionStep, position?: { x: number; y: number }) => void;
  updateStep: (id: string, updates: Partial<InstructionStep>) => void;
  deleteStep: (id: string) => void;
  setSelectedStepId: (id: string | null) => void;
  updateConnections: (edges: Edge<ConnectionData>[]) => void;
  updateNodePosition: (id: string, position: { x: number; y: number }) => void;
  setPreviewMode: (isPreview: boolean) => void;
  setCurrentPreviewStepIndex: (index: number) => void;
  setViewMode: (mode: 'view' | 'edit') => void;
  setCameraMode: (mode: 'auto' | 'free') => void;
  saveToLocalStorage: () => void;
  loadFromLocalStorage: () => void;
  getAllProjects: () => SavedProject[];
  deleteProject: (projectId: string) => void;
  createNewProject: (projectName: string) => ProjectData;
}

const STORAGE_KEY = '3ddoc-project';
const PROJECTS_KEY = '3ddoc-projects';

export const useAppStore = create<AppStore>((set, get) => ({
  project: null,
  selectedStepId: null,
  isPreviewMode: false,
  currentPreviewStepIndex: 0,
  viewMode: 'view',
  cameraMode: 'auto',
  nodePositions: {},

  setProject: (project, nodePositions) => {
    set({ 
      project,
      nodePositions: nodePositions ?? get().nodePositions
    });
    get().saveToLocalStorage();
  },

  addStep: (step, position) => {
    const { project, nodePositions } = get();
    if (!project) return;
    
    const updatedProject = {
      ...project,
      steps: [...project.steps, step],
    };
    
    // Store the position if provided
    const updatedPositions = position 
      ? { ...nodePositions, [step.id]: position }
      : nodePositions;
    
    set({ project: updatedProject, nodePositions: updatedPositions });
    get().saveToLocalStorage();
  },

  updateStep: (id, updates) => {
    const { project } = get();
    if (!project) return;
    
    const updatedProject = {
      ...project,
      steps: project.steps.map((step) =>
        step.id === id ? { ...step, ...updates } : step
      ),
    };
    
    set({ project: updatedProject });
    get().saveToLocalStorage();
  },

  deleteStep: (id) => {
    const { project, nodePositions } = get();
    if (!project) return;
    
    const updatedProject = {
      ...project,
      steps: project.steps.filter((step) => step.id !== id),
      connections: project.connections.filter(
        (edge) => edge.source !== id && edge.target !== id
      ),
    };
    
    // Remove position data for deleted node
    const updatedPositions = { ...nodePositions };
    delete updatedPositions[id];
    
    set({ 
      project: updatedProject,
      nodePositions: updatedPositions,
      selectedStepId: get().selectedStepId === id ? null : get().selectedStepId
    });
    get().saveToLocalStorage();
  },

  setSelectedStepId: (id) => set({ selectedStepId: id }),

  updateConnections: (edges) => {
    const { project } = get();
    if (!project) return;
    
    const updatedProject = {
      ...project,
      connections: edges,
    };
    
    set({ project: updatedProject });
    get().saveToLocalStorage();
  },

  updateNodePosition: (id, position) => {
    const { nodePositions } = get();
    set({ 
      nodePositions: { ...nodePositions, [id]: position }
    });
    get().saveToLocalStorage();
  },

  setPreviewMode: (isPreview) => {
    set({ isPreviewMode: isPreview });
    if (isPreview) {
      set({ currentPreviewStepIndex: 0 });
    }
  },

  setCurrentPreviewStepIndex: (index) => set({ currentPreviewStepIndex: index }),

  setViewMode: (mode) => set({ viewMode: mode }),

  setCameraMode: (mode) => set({ cameraMode: mode }),

  saveToLocalStorage: () => {
    const { project, nodePositions } = get();
    if (project) {
      const dataToSave = { project, nodePositions };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
      
      // Also save to the projects list
      const projects = get().getAllProjects();
      const existingIndex = projects.findIndex(p => p.project.id === project.id);
      const savedProject: SavedProject = {
        project,
        nodePositions,
        lastModified: Date.now(),
      };
      
      if (existingIndex >= 0) {
        projects[existingIndex] = savedProject;
      } else {
        projects.push(savedProject);
      }
      
      localStorage.setItem(PROJECTS_KEY, JSON.stringify(projects));
    }
  },

  loadFromLocalStorage: () => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const data = JSON.parse(stored);
        // Handle both old and new format
        if (data.project) {
          // Clean up invalid blob URLs from steps (but keep data URLs which persist)
          const cleanedProject = {
            ...data.project,
            steps: data.project.steps.map((step: any) => {
              // If step has a blob URL that's no longer valid, clear it
              // Data URLs (starting with "data:") are valid and should be kept
              if (step.customModelUrl && step.customModelUrl.startsWith('blob:')) {
                console.warn('Removed invalid blob URL from step:', step.id);
                return {
                  ...step,
                  customModelUrl: undefined,
                  shapeType: 'cube' // Reset to cube if model URL was invalid
                };
              }
              return step;
            })
          };
          set({ project: cleanedProject, nodePositions: data.nodePositions || {} });
        } else {
          // Old format - just the project
          set({ project: data, nodePositions: {} });
        }
      } catch (error) {
        console.error('Failed to load project from localStorage', error);
      }
    }
  },

  getAllProjects: () => {
    const stored = localStorage.getItem(PROJECTS_KEY);
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (error) {
        console.error('Failed to load projects list', error);
        return [];
      }
    }
    return [];
  },

  deleteProject: (projectId: string) => {
    const projects = get().getAllProjects();
    const filtered = projects.filter(p => p.project.id !== projectId);
    localStorage.setItem(PROJECTS_KEY, JSON.stringify(filtered));
    
    // If the current project was deleted, clear it
    const currentProject = get().project;
    if (currentProject && currentProject.id === projectId) {
      set({ project: null, nodePositions: {}, selectedStepId: null });
      localStorage.removeItem(STORAGE_KEY);
    }
  },

  createNewProject: (projectName: string) => {
    const newProject: ProjectData = {
      id: `project-${crypto.randomUUID()}`,
      name: projectName,
      steps: [],
      connections: [],
    };
    set({ project: newProject, nodePositions: {}, selectedStepId: null });
    get().saveToLocalStorage();
    return newProject;
  },
}));
