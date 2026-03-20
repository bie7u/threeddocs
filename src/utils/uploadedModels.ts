import type { UploadedModel3D } from '../types';
import {
  fetchModels,
  fetchModelById,
  uploadModelRequest,
  updateModelRequest,
  deleteModelRequest,
} from '../services/models';

/** Returns all uploaded 3D models owned by the current user. */
export async function loadUploadedModels(): Promise<UploadedModel3D[]> {
  return fetchModels();
}

/**
 * Saves a new 3D model as a base64 data URL via JSON.
 * Returns the saved model with the server-assigned id.
 */
export async function uploadNewModel(
  modelDataUrl: string,
  modelFileName: string,
  name: string,
  modelScale: number,
  description?: string,
): Promise<UploadedModel3D> {
  return uploadModelRequest(modelDataUrl, modelFileName, name, modelScale, description);
}

/**
 * Updates editable metadata (name, modelScale) of an existing model.
 * The binary file cannot be replaced; upload a new model instead.
 */
export async function saveUploadedModelMeta(
  id: string,
  name: string,
  modelScale: number,
  description?: string,
): Promise<UploadedModel3D> {
  return updateModelRequest(id, name, modelScale, description);
}

/** Deletes an uploaded model by id. */
export async function deleteUploadedModel(id: string): Promise<void> {
  return deleteModelRequest(id);
}

/** Returns a single uploaded model, or undefined if not found.
 *  Pass `projectUuid` when calling from a public share-link view. */
export async function getUploadedModelById(id: string, projectUuid?: string): Promise<UploadedModel3D | undefined> {
  try {
    return await fetchModelById(id, projectUuid);
  } catch {
    return undefined;
  }
}

