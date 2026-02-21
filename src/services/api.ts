const API_BASE = (import.meta.env.VITE_API_URL as string | undefined) ?? '/api';

let isRefreshing = false;
let failedQueue: Array<{ resolve: () => void; reject: (reason: unknown) => void }> = [];

const processQueue = (error: unknown) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
    } else {
      resolve();
    }
  });
  failedQueue = [];
};

/**
 * Wrapper around fetch that:
 * - Sets the base URL from VITE_API_URL or defaults to /api
 * - Sends credentials (httpOnly cookies) with every request
 * - On a 401 response, attempts a single token refresh, then retries the
 *   original request. Concurrent requests that also get 401 are queued and
 *   replayed after the refresh completes. If the refresh itself fails, the
 *   user is redirected to the login page.
 */
export const apiRequest = async (
  path: string,
  options: RequestInit = {},
  _retrying = false,
): Promise<Response> => {
  const url = `${API_BASE}${path}`;
  const response = await fetch(url, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (response.status === 401 && !_retrying) {
    if (isRefreshing) {
      // Queue this request; it will be retried once the ongoing refresh finishes.
      return new Promise<Response>((outerResolve, outerReject) => {
        failedQueue.push({
          resolve: () => {
            apiRequest(path, options, true).then(outerResolve).catch(outerReject);
          },
          reject: outerReject,
        });
      });
    }

    isRefreshing = true;

    try {
      const refreshRes = await fetch(`${API_BASE}/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
      });

      if (!refreshRes.ok) {
        processQueue(new Error('Session expired'));
        isRefreshing = false;
        window.location.href = '/';
        throw new Error('Session expired');
      }

      processQueue(null);
      isRefreshing = false;
      return apiRequest(path, options, true);
    } catch (err) {
      processQueue(err);
      isRefreshing = false;
      throw err;
    }
  }

  return response;
};
