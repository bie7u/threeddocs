import type { Custom3DElement } from '../types';
import {
  fetchElements,
  fetchElementById,
  createElementRequest,
  updateElementRequest,
  deleteElementRequest,
} from '../services/elements';

/** Returns all custom 3D elements owned by the current user. */
export async function loadCustom3DElements(): Promise<Custom3DElement[]> {
  return fetchElements();
}

/**
 * Creates or updates a custom 3D element via the API.
 * Pass `isNew = true` when creating for the first time (omits the server-side
 * id that hasn't been assigned yet). Returns the saved element with the
 * server-assigned id and createdAt.
 */
export async function saveCustom3DElement(
  element: Custom3DElement,
  isNew: boolean,
): Promise<Custom3DElement> {
  const { id, createdAt, ...body } = element;
  if (isNew) {
    return createElementRequest(body);
  }
  return updateElementRequest(id, body);
}

/** Deletes a custom 3D element by id. */
export async function deleteCustom3DElement(id: string): Promise<void> {
  return deleteElementRequest(id);
}

/** Returns a single custom 3D element, or undefined if not found.
 *  Pass `projectUuid` when calling from a public share-link view. */
export async function getCustom3DElementById(id: string, projectUuid?: string): Promise<Custom3DElement | undefined> {
  try {
    return await fetchElementById(id, projectUuid);
  } catch {
    return undefined;
  }
}

