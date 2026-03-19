import { create } from 'zustand';
import type { Edge } from 'reactflow';
import type { InstructionStep, ProjectData, ConnectionData, GuideStep } from '../types';
import {
  fetchProjectsPage,
  createProject,
  updateProject,
  deleteProjectRequest,
} from '../services/projects';

const GUEST_PROJECT_KEY = '3ddocs_guest_project';

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

  // Total number of projects on the server (may exceed the locally cached page)
  projectsCount: number;

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

  // Guest mode (unauthenticated user)
  isGuestMode: boolean;
  guestShareToken: string | null;
  
  // Actions
  setProject: (project: ProjectData, nodePositions?: Record<string, { x: number; y: number }>, persist?: boolean) => void;
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
  /** Creates a guest project (no auth required) and stores the share token. */
  createNewGuestProject: (projectName: string, projectType?: 'builder' | 'upload', projectModelUrl?: string) => Promise<ProjectData>;
  /** Clears guest mode state (e.g., on logout or navigation to login). */
  clearGuestMode: () => void;
}

export const useAppStore = create<AppStore>((set, get) => ({
  project: null,
  projects: [],
  projectsCount: 0,
  selectedStepId: null,
  isPreviewMode: false,
  currentPreviewStepIndex: 0,
  viewMode: 'view',
  editorMode: 'model',
  cameraMode: 'free',
  nodePositions: {},
  isGuestMode: false,
  guestShareToken: null,

  setProject: (project, nodePositions, persist = true) => {
    set({ 
      project,
      nodePositions: nodePositions ?? get().nodePositions
    });
    if (persist) get().saveToApi();
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
    const { project, nodePositions, isGuestMode } = get();
    if (!project) return;

    const savedProject: SavedProject = {
      project,
      nodePositions,
      lastModified: Date.now(),
    };

    const persist = async () => {
      try {
        if (isGuestMode) {
          // Guest mode: persist to localStorage only, no API calls.
          localStorage.setItem(GUEST_PROJECT_KEY, JSON.stringify(savedProject));
          return;
        }

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
      const page = await fetchProjectsPage(1);
      set({ projects: page.results, projectsCount: page.count });
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
        projectsCount: Math.max(0, state.projectsCount - 1),
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
    set(state => ({ projects: [...state.projects, created], projectsCount: state.projectsCount + 1 }));
    return created.project;
  },

  createNewGuestProject: async (projectName: string, projectType?: 'builder' | 'upload', projectModelUrl?: string) => {
    const projectId = `guest-${crypto.randomUUID()}`;
    const newSavedProject: SavedProject = {
      project: {
        id: projectId,
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
    localStorage.setItem(GUEST_PROJECT_KEY, JSON.stringify(newSavedProject));
    set({
      project: newSavedProject.project,
      nodePositions: newSavedProject.nodePositions,
      selectedStepId: null,
      isGuestMode: true,
      guestShareToken: null,
      isPreviewMode: false,
    });
    return newSavedProject.project;
  },

  clearGuestMode: () => {
    localStorage.removeItem(GUEST_PROJECT_KEY);
    set({
      isGuestMode: false,
      guestShareToken: null,
      project: null,
      nodePositions: {},
      selectedStepId: null,
      isPreviewMode: false,
    });
  },
}));
