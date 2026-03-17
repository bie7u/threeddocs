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
 * Uploads a new 3D model file via multipart/form-data.
 * Returns the saved model with the server-assigned id and modelUrl.
 */
export async function uploadNewModel(
  file: File,
  name: string,
  modelScale: number,
): Promise<UploadedModel3D> {
  return uploadModelRequest(file, name, modelScale);
}

/**
 * Updates editable metadata (name, modelScale) of an existing model.
 * The binary file cannot be replaced; upload a new model instead.
 */
export async function saveUploadedModelMeta(
  id: string,
  name: string,
  modelScale: number,
): Promise<UploadedModel3D> {
  return updateModelRequest(id, name, modelScale);
}

/** Deletes an uploaded model by id. */
export async function deleteUploadedModel(id: string): Promise<void> {
  return deleteModelRequest(id);
}

/** Returns a single uploaded model, or undefined if not found. */
export async function getUploadedModelById(id: string): Promise<UploadedModel3D | undefined> {
  try {
    return await fetchModelById(id);
  } catch {
    return undefined;
  }
}

