// ─── Mock implementation — no real API, data lives in localStorage ───────────

export interface AuthUser {
  id: string;
  email: string;
  name?: string;
}

const AUTH_KEY = '3ddocs_auth';

/** Mock register — accepts any non-empty email + password, stores the user. */
export const register = async (email: string, password: string, name?: string): Promise<AuthUser> => {
  await new Promise<void>((r) => setTimeout(r, 400));
  if (!email.trim() || !password.trim()) {
    throw new Error('Email i hasło są wymagane');
  }
  if (password.length < 6) {
    throw new Error('Hasło musi mieć co najmniej 6 znaków');
  }
  const id = `user-${email.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 12)}-${email.length}`;
  const user: AuthUser = {
    id,
    email,
    name: name?.trim() || email.split('@')[0],
  };
  localStorage.setItem(AUTH_KEY, JSON.stringify(user));
  return user;
};

/** Mock login — accepts any non-empty email + password combination. */
export const login = async (email: string, password: string): Promise<AuthUser> => {
  // Simulate a short network delay so the UI spinner is visible.
  await new Promise<void>((r) => setTimeout(r, 400));
  if (!email.trim() || !password.trim()) {
    throw new Error('Email i hasło są wymagane');
  }
  // Derive a stable id from the email without using btoa (avoid non-Latin1 issues).
  const id = `user-${email.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 12)}-${email.length}`;
  const user: AuthUser = {
    id,
    email,
    name: email.split('@')[0],
  };
  localStorage.setItem(AUTH_KEY, JSON.stringify(user));
  return user;
};

/** Mock logout — removes the stored user. */
export const logout = async (): Promise<void> => {
  localStorage.removeItem(AUTH_KEY);
};

/** Mock getMe — reads the stored user or throws if not logged in. */
export const getMe = async (): Promise<AuthUser> => {
  const raw = localStorage.getItem(AUTH_KEY);
  if (!raw) throw new Error('Not authenticated');
  return JSON.parse(raw) as AuthUser;
};
