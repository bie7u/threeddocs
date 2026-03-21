import type { Custom3DElement } from '../types';
import { apiRequest } from './api';

// ─── Server shape ─────────────────────────────────────────────────────────────

interface ApiElement {
  id: string;
  name: string;
  text: string;
  color: string;
  texture_data_url: string | null;
  description: string | null;
  createdAt: number;
}

type ApiElementBody = {
  name: string;
  text: string;
  color: string;
  texture_data_url: string | null;
  description: string | null;
};

// ─── Converters ───────────────────────────────────────────────────────────────

const fromApi = (e: ApiElement): Custom3DElement => ({
  id: e.id,
  name: e.name,
  text: e.text,
  color: e.color,
  // wireframe and wireframeColor are frontend-only display properties not stored on the server
  wireframe: false,
  wireframeColor: '#000000',
  textureDataUrl: e.texture_data_url ?? undefined,
  description: e.description ?? undefined,
  createdAt: e.createdAt,
});

const toApiElementBody = (e: Omit<Custom3DElement, 'id' | 'createdAt'>): ApiElementBody => ({
  name: e.name,
  text: e.text,
  color: e.color,
  texture_data_url: e.textureDataUrl ?? null,
  description: e.description ?? null,
});

// ─── API functions ────────────────────────────────────────────────────────────

/** GET /api/elements — returns all custom 3D elements owned by the user.
 *  Pass `search` to filter results server-side via ?search=. */
export const fetchElements = async (search?: string): Promise<Custom3DElement[]> => {
  const path = search ? `/elements/?search=${encodeURIComponent(search)}` : '/elements/';
  const res = await apiRequest(path);
  if (!res.ok) throw new Error('Failed to fetch custom 3D elements');
  return (await res.json() as ApiElement[]).map(fromApi);
};

/** GET /api/elements/:id — returns a single element.
 *  Pass `projectUuid` when calling from a public share-link view; the request
 *  is then routed to the public endpoint /elements/:id/public_element?project_uuid=. */
export const fetchElementById = async (id: string, projectUuid?: string): Promise<Custom3DElement> => {
  const path = projectUuid
    ? `/elements/${id}/public_element?project_uuid=${encodeURIComponent(projectUuid)}`
    : `/elements/${id}`;
  const res = await apiRequest(path);
  if (!res.ok) throw new Error('Custom 3D element not found');
  return fromApi(await res.json() as ApiElement);
};

/** POST /api/elements — creates a new element; server assigns id and createdAt. */
export const createElementRequest = async (
  element: Omit<Custom3DElement, 'id' | 'createdAt'>,
): Promise<Custom3DElement> => {
  const res = await apiRequest('/elements/', {
    method: 'POST',
    body: JSON.stringify(toApiElementBody(element)),
  });
  if (!res.ok) throw new Error('Failed to create custom 3D element');
  return fromApi(await res.json() as ApiElement);
};

/** PUT /api/elements/:id — fully replaces the element document. */
export const updateElementRequest = async (
  id: string,
  element: Omit<Custom3DElement, 'id' | 'createdAt'>,
): Promise<Custom3DElement> => {
  const res = await apiRequest(`/elements/${id}`, {
    method: 'PUT',
    body: JSON.stringify(toApiElementBody(element)),
  });
  if (!res.ok) throw new Error('Failed to update custom 3D element');
  return fromApi(await res.json() as ApiElement);
};

/** DELETE /api/elements/:id — deletes the element. */
export const deleteElementRequest = async (id: string): Promise<void> => {
  const res = await apiRequest(`/elements/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete custom 3D element');
};
