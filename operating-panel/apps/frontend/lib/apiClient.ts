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

  // Ensure the ngrok browser warning is bypassed so we always get JSON
  const skipHeader = { 'ngrok-skip-browser-warning': 'true' } as Record<string, string>;

  if (init.headers) {
    // Merge with any headers the caller already provided
    init.headers = {
      ...skipHeader,
      ...(init.headers as Record<string, string>)
    };
  } else {
    init.headers = skipHeader;
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
