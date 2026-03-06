import type { Custom3DElement } from '../types';

const STORAGE_KEY = 'custom3dElements';

export function loadCustom3DElements(): Custom3DElement[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as Custom3DElement[];
  } catch {
    return [];
  }
}

export function saveCustom3DElement(element: Custom3DElement): void {
  const elements = loadCustom3DElements();
  const existing = elements.findIndex((e) => e.id === element.id);
  if (existing >= 0) {
    elements[existing] = element;
  } else {
    elements.push(element);
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(elements));
}

export function deleteCustom3DElement(id: string): void {
  const elements = loadCustom3DElements().filter((e) => e.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(elements));
}

export function getCustom3DElementById(id: string): Custom3DElement | undefined {
  return loadCustom3DElements().find((e) => e.id === id);
}
