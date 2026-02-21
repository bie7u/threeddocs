import type { SavedProject } from '../store';
import { apiRequest } from './api';

const API_BASE = (import.meta.env.VITE_API_URL as string | undefined) ?? '/api';

/** GET /api/projects — returns all projects owned by the authenticated user. */
export const fetchProjects = async (): Promise<SavedProject[]> => {
  const res = await apiRequest('/projects');
  if (!res.ok) throw new Error('Failed to fetch projects');
  return res.json() as Promise<SavedProject[]>;
};

/** GET /api/projects/:id — returns a single project (auth required). */
export const fetchProject = async (id: string): Promise<SavedProject> => {
  const res = await apiRequest(`/projects/${id}`);
  if (!res.ok) throw new Error('Project not found');
  return res.json() as Promise<SavedProject>;
};

/**
 * GET /api/projects/:id/public — returns a project without authentication.
 * Used by the SharedView page for publicly shared links.
 */
export const fetchPublicProject = async (id: string): Promise<SavedProject> => {
  const res = await fetch(`${API_BASE}/projects/${id}/public`, {
    credentials: 'omit',
  });
  if (!res.ok) throw new Error('Project not found');
  return res.json() as Promise<SavedProject>;
};

/** POST /api/projects — creates a new project and returns the saved document. */
export const createProject = async (data: SavedProject): Promise<SavedProject> => {
  const res = await apiRequest('/projects', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to create project');
  return res.json() as Promise<SavedProject>;
};

/** PUT /api/projects/:id — replaces the project document and returns it. */
export const updateProject = async (id: string, data: SavedProject): Promise<SavedProject> => {
  const res = await apiRequest(`/projects/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to update project');
  return res.json() as Promise<SavedProject>;
};

/** DELETE /api/projects/:id — deletes the project. */
export const deleteProjectRequest = async (id: string): Promise<void> => {
  const res = await apiRequest(`/projects/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete project');
};
