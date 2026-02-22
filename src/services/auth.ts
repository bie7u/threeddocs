import { apiRequest } from './api';

export interface AuthUser {
  id: string;
  email: string;
  name?: string;
}

/** POST /api/auth/login — returns user info; server sets httpOnly cookies. */
export const login = async (email: string, password: string): Promise<AuthUser> => {
  const res = await apiRequest('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: 'Login failed' }));
    throw new Error((err as { message?: string }).message ?? 'Login failed');
  }
  return res.json() as Promise<AuthUser>;
};

/** POST /api/auth/logout — clears httpOnly cookies on the server. */
export const logout = async (): Promise<void> => {
  await apiRequest('/auth/logout', { method: 'POST' });
};

/** GET /api/auth/me — returns the currently authenticated user or throws on 401. */
export const getMe = async (): Promise<AuthUser> => {
  const res = await apiRequest('/auth/me');
  if (!res.ok) throw new Error('Not authenticated');
  return res.json() as Promise<AuthUser>;
};
