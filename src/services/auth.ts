import { apiRequest, API_BASE } from './api';

export interface AuthUser {
  id: string;
  email: string;
  name?: string;
}

/**
 * Lightweight session check for use on public pages (login, register).
 * Uses a plain fetch so it never touches the token-refresh interceptor,
 * never sets window.location, and never modifies the module-level
 * isRefreshing state in api.ts.  Returns the user if a valid session
 * exists, or null on any failure.
 */
export const probeSession = async (): Promise<AuthUser | null> => {
  try {
    const res = await fetch(`${API_BASE}/auth/me`, { credentials: 'include' });
    if (!res.ok) return null;
    return (await res.json()) as AuthUser;
  } catch {
    return null;
  }
};

/** POST /api/auth/register — creates a new account; server sets httpOnly cookies. */
export const register = async (email: string, password: string, name?: string): Promise<AuthUser> => {
  const res = await apiRequest('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ email, password, ...(name?.trim() ? { name: name.trim() } : {}) }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: 'Registration failed' }));
    throw new Error((err as { message?: string }).message ?? 'Registration failed');
  }
  return res.json() as Promise<AuthUser>;
};

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

/** POST /api/auth/google/ — exchange a Google ID token for a session; server sets httpOnly cookies. */
export const loginWithGoogle = async (credential: string): Promise<AuthUser> => {
  const res = await apiRequest('/auth/google/', {
    method: 'POST',
    body: JSON.stringify({ credential }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: 'Google login failed' }));
    throw new Error((err as { message?: string }).message ?? 'Google login failed');
  }
  return res.json() as Promise<AuthUser>;
};

/** POST /api/auth/reset-password/ — sends a password reset email to the given address. */
export const requestPasswordReset = async (email: string): Promise<void> => {
  const res = await fetch(`${API_BASE}/auth/reset-password/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: 'Reset failed' }));
    throw new Error((err as { message?: string }).message ?? 'Reset failed');
  }
};

/** POST /api/auth/reset-password-conf/ — sets a new password using the token from the reset e-mail link. */
export const confirmPasswordReset = async (token: string, password: string): Promise<void> => {
  const res = await fetch(`${API_BASE}/auth/reset-password-conf/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token, password }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: 'Reset failed' }));
    throw new Error((err as { message?: string }).message ?? 'Reset failed');
  }
};

/** POST /api/auth/change-password — changes the password for the current user. */
export const changePassword = async (currentPassword: string, newPassword: string): Promise<void> => {
  const res = await apiRequest('/auth/change-password', {
    method: 'POST',
    body: JSON.stringify({ currentPassword, newPassword }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: 'Failed to change password' }));
    throw new Error((err as { message?: string }).message ?? 'Failed to change password');
  }
};
