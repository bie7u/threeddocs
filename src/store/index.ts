import { create } from 'zustand';
import type { Edge } from 'reactflow';
import type { InstructionStep, ProjectData, ConnectionData, GuideStep } from '../types';
import {
  fetchProjects,
  createProject,
  updateProject,
  deleteProjectRequest,
} from '../services/projects';

export interface SavedProject {
  project: ProjectData;
  nodePositions: Record<string, { x: number; y: number }>;
  lastModified: number;
}

interface AppStore {
  // Project data
  project: ProjectData | null;

  // Cached list of all user projects (loaded from API)
  projects: SavedProject[];

  // Selected step
  selectedStepId: string | null;
  
  // Preview mode
  isPreviewMode: boolean;
  currentPreviewStepIndex: number;
  
  // View/Edit mode
  viewMode: 'view' | 'edit';
  
  // Editor stage: model builder vs guide builder
  editorMode: 'model' | 'guide';
  
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
  setEditorMode: (mode: 'model' | 'guide') => void;
  setCameraMode: (mode: 'auto' | 'free') => void;
  addGuideStep: (stepId: string) => void;
  removeGuideStep: (guideStepId: string) => void;
  reorderGuideSteps: (steps: GuideStep[]) => void;
  /** Fire-and-forget: persists the current project to the server. */
  saveToApi: () => void;
  /** Fetches all user projects from the server and updates the local cache. */
  loadProjects: () => Promise<void>;
  getAllProjects: () => SavedProject[];
  deleteProject: (projectId: string) => Promise<void>;
  createNewProject: (projectName: string, projectType?: 'builder' | 'upload', projectModelUrl?: string) => Promise<ProjectData>;
}

export const useAppStore = create<AppStore>((set, get) => ({
  project: null,
  projects: [],
  selectedStepId: null,
  isPreviewMode: false,
  currentPreviewStepIndex: 0,
  viewMode: 'view',
  editorMode: 'model',
  cameraMode: 'free',
  nodePositions: {},

  setProject: (project, nodePositions) => {
    set({ 
      project,
      nodePositions: nodePositions ?? get().nodePositions
    });
    get().saveToApi();
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
    get().saveToApi();
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
    get().saveToApi();
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
      guide: (project.guide ?? []).filter((gs) => gs.stepId !== id),
    };
    
    // Remove position data for deleted node
    const updatedPositions = { ...nodePositions };
    delete updatedPositions[id];
    
    set({ 
      project: updatedProject,
      nodePositions: updatedPositions,
      selectedStepId: get().selectedStepId === id ? null : get().selectedStepId
    });
    get().saveToApi();
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
    get().saveToApi();
  },

  updateNodePosition: (id, position) => {
    const { nodePositions } = get();
    set({ 
      nodePositions: { ...nodePositions, [id]: position }
    });
    get().saveToApi();
  },

  setPreviewMode: (isPreview) => {
    set({ isPreviewMode: isPreview });
    if (isPreview) {
      set({ currentPreviewStepIndex: 0 });
    }
  },

  setCurrentPreviewStepIndex: (index) => set({ currentPreviewStepIndex: index }),

  setViewMode: (mode) => set({ viewMode: mode }),

  setEditorMode: (mode) => set({ editorMode: mode }),

  setCameraMode: (mode) => set({ cameraMode: mode }),

  addGuideStep: (stepId) => {
    const { project } = get();
    if (!project) return;
    const newGuideStep: GuideStep = {
      id: `guide-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      stepId,
    };
    const updatedProject = {
      ...project,
      guide: [...(project.guide ?? []), newGuideStep],
    };
    set({ project: updatedProject });
    get().saveToApi();
  },

  removeGuideStep: (guideStepId) => {
    const { project } = get();
    if (!project) return;
    const updatedProject = {
      ...project,
      guide: (project.guide ?? []).filter((gs) => gs.id !== guideStepId),
    };
    set({ project: updatedProject });
    get().saveToApi();
  },

  reorderGuideSteps: (steps) => {
    const { project } = get();
    if (!project) return;
    const updatedProject = { ...project, guide: steps };
    set({ project: updatedProject });
    get().saveToApi();
  },

  saveToApi: () => {
    const { project, nodePositions } = get();
    if (!project) return;

    const savedProject: SavedProject = {
      project,
      nodePositions,
      lastModified: Date.now(),
    };

    const persist = async () => {
      try {
        const existsInCache = get().projects.some(p => p.project.id === project.id);
        let updated: SavedProject;
        if (existsInCache) {
          updated = await updateProject(project.id, savedProject);
        } else {
          updated = await createProject(savedProject);
        }
        set(state => ({
          projects: existsInCache
            ? state.projects.map(p => p.project.id === project.id ? updated : p)
            : [...state.projects, updated],
        }));
      } catch (error) {
        console.error('Failed to save project to server', error);
      }
    };

    persist();
  },

  loadProjects: async () => {
    try {
      const projects = await fetchProjects();
      set({ projects });
    } catch (error) {
      console.error('Failed to load projects from server', error);
    }
  },

  getAllProjects: () => get().projects,

  deleteProject: async (projectId: string) => {
    try {
      await deleteProjectRequest(projectId);
      set(state => ({
        projects: state.projects.filter(p => p.project.id !== projectId),
        project: state.project?.id === projectId ? null : state.project,
        nodePositions: state.project?.id === projectId ? {} : state.nodePositions,
        selectedStepId: state.project?.id === projectId ? null : state.selectedStepId,
      }));
    } catch (error) {
      console.error('Failed to delete project', error);
    }
  },

  createNewProject: async (projectName: string, projectType?: 'builder' | 'upload', projectModelUrl?: string) => {
    // Build a provisional project object (no id — server assigns it)
    const provisional: SavedProject = {
      project: {
        id: '',
        name: projectName,
        projectType: projectType ?? 'builder',
        projectModelUrl: projectModelUrl,
        steps: [],
        connections: [],
        guide: [],
      },
      nodePositions: {},
      lastModified: Date.now(),
    };
    // POST to server — get back the server-assigned integer id
    const created = await createProject(provisional);
    set({ project: created.project, nodePositions: created.nodePositions, selectedStepId: null });
    set(state => ({ projects: [...state.projects, created] }));
    return created.project;
  },
}));
