export const API_BASE: string = (process.env.NEXT_PUBLIC_API_BASE || '').replace(/\/$/, '');

function normalizePath(path: string): string {
  if (!path) return '';
  return path.startsWith('/') ? path : `/${path}`;
}

export async function apiFetch(
  inputPath: string,
  init: RequestInit = {}
): Promise<Response> {
  const url = `${API_BASE}${normalizePath(inputPath)}`;

  // Set default headers for API requests
  const defaultHeaders = {
    'Accept': 'application/json',
    'Content-Type': 'application/json'
  } as Record<string, string>;

  if (init.headers) {
    // Merge with any headers the caller already provided
    init.headers = {
      ...defaultHeaders,
      ...(init.headers as Record<string, string>)
    };
  } else {
    init.headers = defaultHeaders;
  }

  return fetch(url, init);
}

export function buildApiUrl(path: string, params?: Record<string, string | number | boolean | undefined>): string {
  const url = new URL(`${API_BASE}${normalizePath(path)}`);
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null) url.searchParams.set(k, String(v));
    });
  }
  return url.toString();
}
