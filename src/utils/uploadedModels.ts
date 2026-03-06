import type { UploadedModel3D } from '../types';

const STORAGE_KEY = 'uploadedModels3D';

export function loadUploadedModels(): UploadedModel3D[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as UploadedModel3D[];
  } catch {
    return [];
  }
}

export function saveUploadedModel(model: UploadedModel3D): void {
  const models = loadUploadedModels();
  const existing = models.findIndex((m) => m.id === model.id);
  if (existing >= 0) {
    models[existing] = model;
  } else {
    models.push(model);
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(models));
}

export function deleteUploadedModel(id: string): void {
  const models = loadUploadedModels().filter((m) => m.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(models));
}

export function getUploadedModelById(id: string): UploadedModel3D | undefined {
  return loadUploadedModels().find((m) => m.id === id);
}
