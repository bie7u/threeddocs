import type { UploadedModel3D } from '../types';
import { apiRequest } from './api';

// ─── Server shape ─────────────────────────────────────────────────────────────

interface ApiModel {
  id: string;
  name: string;
  model_file_name: string;
  model_scale: number;
  model_data_url: string;
  createdAt: number;
}

// ─── Converters ───────────────────────────────────────────────────────────────

const fromApiModel = (m: ApiModel): UploadedModel3D => ({
  id: m.id,
  name: m.name,
  modelDataUrl: m.model_data_url,
  modelFileName: m.model_file_name,
  modelScale: m.model_scale,
  createdAt: m.createdAt,
});

// ─── API functions ────────────────────────────────────────────────────────────

/** GET /api/models — returns all uploaded 3D models owned by the user. */
export const fetchModels = async (): Promise<UploadedModel3D[]> => {
  const res = await apiRequest('/models');
  if (!res.ok) throw new Error('Failed to fetch uploaded models');
  return (await res.json() as ApiModel[]).map(fromApiModel);
};

/** GET /api/models/:id — returns a single model.
 *  Pass `projectUuid` when calling from a public share-link view so the server
 *  can authorise the request without requiring a user session. */
export const fetchModelById = async (id: string, projectUuid?: string): Promise<UploadedModel3D> => {
  const qs = projectUuid ? `?project_uuid=${encodeURIComponent(projectUuid)}` : '';
  const res = await apiRequest(`/models/${id}${qs}`);
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
): Promise<UploadedModel3D> => {
  const res = await apiRequest('/models', {
    method: 'POST',
    body: JSON.stringify({ name, model_file_name: modelFileName, model_scale: modelScale, model_data_url: modelDataUrl }),
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
): Promise<UploadedModel3D> => {
  const res = await apiRequest(`/models/${id}`, {
    method: 'PUT',
    body: JSON.stringify({ name, model_scale: modelScale }),
  });
  if (!res.ok) throw new Error('Failed to update model');
  return fromApiModel(await res.json() as ApiModel);
};

/** DELETE /api/models/:id — deletes the model record and its stored file. */
export const deleteModelRequest = async (id: string): Promise<void> => {
  const res = await apiRequest(`/models/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete model');
};
