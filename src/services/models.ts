import type { UploadedModel3D } from '../types';
import { API_BASE, apiRequest } from './api';

// ─── Server shape ─────────────────────────────────────────────────────────────

interface ApiModel {
  id: string;
  name: string;
  model_file_name: string;
  model_scale: number;
  model_data_url: string;
  description: string | null;
  createdAt: number;
  system_model?: boolean;
}

// ─── Converters ───────────────────────────────────────────────────────────────

const fromApiModel = (m: ApiModel): UploadedModel3D => ({
  id: m.id,
  name: m.name,
  modelDataUrl: m.model_data_url,
  modelFileName: m.model_file_name,
  modelScale: m.model_scale,
  description: m.description ?? undefined,
  createdAt: m.createdAt,
  systemModel: m.system_model ?? false,
});

// ─── API functions ────────────────────────────────────────────────────────────

/** GET /api/models — returns all uploaded 3D models owned by the user.
 *  Pass `search` to filter results server-side via ?search=. */
export const fetchModels = async (search?: string): Promise<UploadedModel3D[]> => {
  const path = search ? `/models?search=${encodeURIComponent(search)}` : '/models';
  const res = await apiRequest(path);
  if (!res.ok) throw new Error('Failed to fetch uploaded models');
  return (await res.json() as ApiModel[]).map(fromApiModel);
};

/** GET /api/models/:id — returns a single model.
 *  Pass `projectUuid` when calling from a public share-link view; the request
 *  is then routed to the public endpoint /models/:id/public_model?project_uuid=. */
export const fetchModelById = async (id: string, projectUuid?: string): Promise<UploadedModel3D> => {
  const path = projectUuid
    ? `/models/${id}/public_model?project_uuid=${encodeURIComponent(projectUuid)}`
    : `/models/${id}`;
  const res = await apiRequest(path);
  if (!res.ok) throw new Error('Uploaded model not found');
  return fromApiModel(await res.json() as ApiModel);
};

/**
 * POST /api/models — saves a new model as a base64 data URL in JSON.
 */
export const uploadModelRequest = async (
  modelDataUrl: string,
  modelFileName: string,
  name: string,
  modelScale: number,
  description?: string,
): Promise<UploadedModel3D> => {
  const res = await apiRequest('/models', {
    method: 'POST',
    body: JSON.stringify({ name, model_file_name: modelFileName, model_scale: modelScale, model_data_url: modelDataUrl, description: description ?? null }),
  });
  if (!res.ok) throw new Error('Failed to upload model');
  return fromApiModel(await res.json() as ApiModel);
};

/**
 * PUT /api/models/:id — updates editable metadata (name, modelScale).
 * The binary file cannot be replaced; upload a new model to replace it.
 */
export const updateModelRequest = async (
  id: string,
  name: string,
  modelScale: number,
  description?: string,
): Promise<UploadedModel3D> => {
  const res = await apiRequest(`/models/${id}`, {
    method: 'PUT',
    body: JSON.stringify({ name, model_scale: modelScale, description: description ?? null }),
  });
  if (!res.ok) throw new Error('Failed to update model');
  return fromApiModel(await res.json() as ApiModel);
};

/** DELETE /api/models/:id — deletes the model record and its stored file. */
export const deleteModelRequest = async (id: string): Promise<void> => {
  const res = await apiRequest(`/models/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete model');
};

// ─── Public (guest) endpoints ─────────────────────────────────────────────────

/** GET /api/public-models/ — returns all system models (no auth required). */
export const fetchPublicModels = async (): Promise<UploadedModel3D[]> => {
  const res = await fetch(`${API_BASE}/public-models/`, { credentials: 'omit' });
  if (!res.ok) throw new Error('Failed to fetch public models');
  return (await res.json() as ApiModel[]).map(fromApiModel);
};

/** GET /api/public-models/:id/ — returns a single system model (no auth required). */
export const fetchPublicModelById = async (id: string): Promise<UploadedModel3D> => {
  const res = await fetch(`${API_BASE}/public-models/${id}/`, { credentials: 'omit' });
  if (!res.ok) throw new Error('Public model not found');
  return fromApiModel(await res.json() as ApiModel);
};
