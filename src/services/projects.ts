import type { SavedProject } from '../store';
import type { InstructionStep, ConnectionData } from '../types';
import type { Edge } from 'reactflow';
import { apiRequest } from './api';

const API_BASE = (import.meta.env.VITE_API_URL as string | undefined) ?? '/api';

// ─── Server-side flat project shape ──────────────────────────────────────────

interface ApiProject {
  id: number;
  name: string;
  projectType: 'builder' | 'upload';
  projectModelUrl: string | null;
  steps: InstructionStep[];
  connections: Edge<ConnectionData>[];
  /** Server guide format — no client-only `id` field */
  guide: Array<{ stepId: string; label?: string }>;
  nodePositions: Record<string, { x: number; y: number }>;
  /** Server-assigned Unix timestamp in ms (read-only) */
  lastModified: number;
}

/** Fields sent on POST/PUT — server assigns `id` and `lastModified` */
type ApiProjectBody = Omit<ApiProject, 'id' | 'lastModified'>;

// ─── Converters ───────────────────────────────────────────────────────────────

/** Convert server flat format → internal SavedProject wrapper */
const fromApiProject = (ap: ApiProject): SavedProject => ({
  project: {
    id: String(ap.id),
    name: ap.name,
    projectType: ap.projectType,
    projectModelUrl: ap.projectModelUrl ?? undefined,
    steps: ap.steps,
    connections: ap.connections,
    // Add client-side `id` derived from stepId (used as React key and for removal)
    guide: ap.guide.map((gs) => ({ id: gs.stepId, stepId: gs.stepId, label: gs.label })),
  },
  nodePositions: ap.nodePositions,
  lastModified: ap.lastModified,
});

/** Convert internal SavedProject → server body (omit client-only fields) */
const toApiProjectBody = (sp: SavedProject): ApiProjectBody => ({
  name: sp.project.name,
  projectType: sp.project.projectType ?? 'builder',
  projectModelUrl: sp.project.projectModelUrl ?? null,
  steps: sp.project.steps,
  connections: sp.project.connections,
  // Strip client-only `id` field from each guide step before sending to server
  guide: (sp.project.guide ?? []).map(({ stepId, label }) => ({ stepId, ...(label !== undefined && { label }) })),
  nodePositions: sp.nodePositions,
});

// ─── API functions ────────────────────────────────────────────────────────────

/** GET /api/projects — returns all projects owned by the authenticated user. */
export const fetchProjects = async (): Promise<SavedProject[]> => {
  const res = await apiRequest('/projects');
  if (!res.ok) throw new Error('Failed to fetch projects');
  const data = await res.json() as ApiProject[];
  return data.map(fromApiProject);
};

/** GET /api/projects/:id — returns a single project (auth required). */
export const fetchProject = async (id: string): Promise<SavedProject> => {
  const res = await apiRequest(`/projects/${id}`);
  if (!res.ok) throw new Error('Project not found');
  return fromApiProject(await res.json() as ApiProject);
};

/**
 * POST /api/projects/:id/share — generates a unique share token for the project.
 * Returns the token string.
 */
export const generateShareToken = async (id: string): Promise<string> => {
  const res = await apiRequest(`/projects/${id}/share`, { method: 'POST' });
  if (!res.ok) throw new Error('Failed to generate share link');
  const data = await res.json() as { shareToken: string };
  return data.shareToken;
};

/**
 * GET /api/projects/shared/:shareToken — returns a project without authentication.
 * Used by the SharedView page for publicly shared links.
 */
export const fetchPublicProject = async (shareToken: string): Promise<SavedProject> => {
  const res = await fetch(`${API_BASE}/projects/shared/${shareToken}`, {
    credentials: 'omit',
  });
  if (!res.ok) throw new Error('Project not found');
  return fromApiProject(await res.json() as ApiProject);
};

/**
 * POST /api/projects — creates a new project.
 * The server assigns `id` and `lastModified`; the client must NOT send them.
 */
export const createProject = async (data: SavedProject): Promise<SavedProject> => {
  const res = await apiRequest('/projects', {
    method: 'POST',
    body: JSON.stringify(toApiProjectBody(data)),
  });
  if (!res.ok) throw new Error('Failed to create project');
  return fromApiProject(await res.json() as ApiProject);
};

/** PUT /api/projects/:id — fully replaces the project and returns it. */
export const updateProject = async (id: string, data: SavedProject): Promise<SavedProject> => {
  const res = await apiRequest(`/projects/${id}`, {
    method: 'PUT',
    body: JSON.stringify(toApiProjectBody(data)),
  });
  if (!res.ok) throw new Error('Failed to update project');
  return fromApiProject(await res.json() as ApiProject);
};

/** DELETE /api/projects/:id — deletes the project. */
export const deleteProjectRequest = async (id: string): Promise<void> => {
  const res = await apiRequest(`/projects/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete project');
};
