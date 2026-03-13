// ─── Mock implementation — no real API, data lives in localStorage ───────────
//
// Storage layout (`3ddocs_projects` key):
//   Array of StoredEntry objects, where each entry holds the full project data
//   plus metadata (userId, optional shareToken).
//
// Auth user id is read from `3ddocs_auth` (set by the auth mock).

import type { SavedProject } from '../store';

// ─── Types ────────────────────────────────────────────────────────────────────

interface StoredEntry extends SavedProject {
  /** Matches project.id */
  id: string;
  /** Owner id. 'guest' for anonymous guest projects. */
  userId: string;
  /** Set when the project has been shared. */
  shareToken?: string;
}

// ─── Storage helpers ──────────────────────────────────────────────────────────

const STORE_KEY = '3ddocs_projects';
const AUTH_KEY  = '3ddocs_auth';

const loadAll = (): StoredEntry[] => {
  try {
    return JSON.parse(localStorage.getItem(STORE_KEY) ?? '[]') as StoredEntry[];
  } catch {
    return [];
  }
};

const saveAll = (entries: StoredEntry[]): void => {
  localStorage.setItem(STORE_KEY, JSON.stringify(entries));
};

const currentUserId = (): string => {
  try {
    const raw = localStorage.getItem(AUTH_KEY);
    if (!raw) return '';
    return (JSON.parse(raw) as { id: string }).id;
  } catch {
    return '';
  }
};

/** Generate a short unique id / share token. */
const generateId = (): string =>
  `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 11)}`;

/** Strip internal fields before returning to the store. */
const toSavedProject = (e: StoredEntry): SavedProject => ({
  project: e.project,
  nodePositions: e.nodePositions,
  lastModified: e.lastModified,
});

// ─── API-like functions ────────────────────────────────────────────────────────

/** Returns all projects owned by the currently logged-in user. */
export const fetchProjects = async (): Promise<SavedProject[]> => {
  const userId = currentUserId();
  return loadAll()
    .filter((e) => e.userId === userId)
    .map(toSavedProject);
};

/** Returns a single project by id (auth required). */
export const fetchProject = async (id: string): Promise<SavedProject> => {
  const entry = loadAll().find((e) => e.id === id);
  if (!entry) throw new Error('Project not found');
  return toSavedProject(entry);
};

/**
 * Generates (or reuses) a share token for the project and returns it.
 * The project stays accessible via fetchPublicProject(token).
 */
export const generateShareToken = async (id: string): Promise<string> => {
  const entries = loadAll();
  const idx = entries.findIndex((e) => e.id === id);
  if (idx < 0) throw new Error('Project not found');
  if (!entries[idx].shareToken) {
    entries[idx].shareToken = generateId();
    saveAll(entries);
  }
  return entries[idx].shareToken as string;
};

/**
 * Returns a project by its share token without authentication.
 * Used by the /view/:shareToken public page.
 */
export const fetchPublicProject = async (shareToken: string): Promise<SavedProject> => {
  const entry = loadAll().find((e) => e.shareToken === shareToken);
  if (!entry) throw new Error('Project not found');
  return toSavedProject(entry);
};

/**
 * Creates a guest project (no auth) and immediately assigns a share token.
 * The project is stored under userId 'guest'.
 */
export const createGuestProject = async (
  data: SavedProject,
): Promise<{ savedProject: SavedProject; shareToken: string }> => {
  const id = generateId();
  const shareToken = generateId();
  const entry: StoredEntry = {
    id,
    userId: 'guest',
    shareToken,
    project: { ...data.project, id },
    nodePositions: data.nodePositions,
    lastModified: Date.now(),
  };
  saveAll([...loadAll(), entry]);
  return { savedProject: toSavedProject(entry), shareToken };
};

/**
 * Updates a guest project identified by its share token.
 * The token acts as the sole credential.
 */
export const updateGuestProject = async (
  shareToken: string,
  data: SavedProject,
): Promise<SavedProject> => {
  const entries = loadAll();
  const idx = entries.findIndex((e) => e.shareToken === shareToken);
  if (idx < 0) throw new Error('Project not found');
  entries[idx] = {
    ...entries[idx],
    project: { ...data.project, id: entries[idx].id },
    nodePositions: data.nodePositions,
    lastModified: Date.now(),
  };
  saveAll(entries);
  return toSavedProject(entries[idx]);
};

/** Creates a new project for the logged-in user. */
export const createProject = async (data: SavedProject): Promise<SavedProject> => {
  const id = generateId();
  const userId = currentUserId();
  const entry: StoredEntry = {
    id,
    userId,
    project: { ...data.project, id },
    nodePositions: data.nodePositions,
    lastModified: Date.now(),
  };
  saveAll([...loadAll(), entry]);
  return toSavedProject(entry);
};

/** Fully replaces an existing project and returns it. */
export const updateProject = async (id: string, data: SavedProject): Promise<SavedProject> => {
  const entries = loadAll();
  const idx = entries.findIndex((e) => e.id === id);
  if (idx < 0) throw new Error('Project not found');
  entries[idx] = {
    ...entries[idx],
    project: { ...data.project, id },
    nodePositions: data.nodePositions,
    lastModified: Date.now(),
  };
  saveAll(entries);
  return toSavedProject(entries[idx]);
};

/** Deletes a project by id. */
export const deleteProjectRequest = async (id: string): Promise<void> => {
  saveAll(loadAll().filter((e) => e.id !== id));
};
