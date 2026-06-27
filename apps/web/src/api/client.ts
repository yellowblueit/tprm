// ---------------------------------------------------------------------------
// API Client
// ---------------------------------------------------------------------------
// A lightweight fetch wrapper that automatically attaches the MSAL bearer
// token and the active tenant header to every outgoing request.
// ---------------------------------------------------------------------------

export class ApiError extends Error {
  public readonly status: number;
  public readonly code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }
}

// ---------------------------------------------------------------------------
// Setup helpers – called once at app startup so the client can obtain tokens
// and tenant info without importing React hooks directly.
// ---------------------------------------------------------------------------

let getTokenFn: (() => Promise<string>) | null = null;
let getTenantIdFn: (() => string | null) | null = null;

export function setupApiClient(
  getToken: () => Promise<string>,
  getTenantId: () => string | null
) {
  getTokenFn = getToken;
  getTenantIdFn = getTenantId;
}

// ---------------------------------------------------------------------------
// Internal request helper
// ---------------------------------------------------------------------------

const API_BASE = "/api/v1";

interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
  meta?: {
    page?: number;
    pageSize?: number;
    total?: number;
    totalPages?: number;
  };
}

async function request<T = unknown>(
  method: string,
  url: string,
  body?: unknown
): Promise<ApiResponse<T>> {
  const token = getTokenFn ? await getTokenFn() : "";
  const tenantId = getTenantIdFn?.() ?? null;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(tenantId ? { "X-Tenant-Id": tenantId } : {}),
  };

  const res = await fetch(`${API_BASE}${url}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  // Handle 204 No Content
  if (res.status === 204) {
    return { success: true } as ApiResponse<T>;
  }

  let json: ApiResponse<T>;

  try {
    json = await res.json();
  } catch {
    throw new ApiError(
      res.status,
      "PARSE_ERROR",
      "Failed to parse server response"
    );
  }

  if (!json.success) {
    throw new ApiError(
      res.status,
      json.error?.code ?? "UNKNOWN",
      json.error?.message ?? "Request failed"
    );
  }

  return json;
}

// ---------------------------------------------------------------------------
// Public convenience methods
// ---------------------------------------------------------------------------

export function get<T = unknown>(url: string) {
  return request<T>("GET", url);
}

export function post<T = unknown>(url: string, body?: unknown) {
  return request<T>("POST", url, body);
}

export function patch<T = unknown>(url: string, body?: unknown) {
  return request<T>("PATCH", url, body);
}

export function put<T = unknown>(url: string, body?: unknown) {
  return request<T>("PUT", url, body);
}

export function del<T = unknown>(url: string) {
  return request<T>("DELETE", url);
}

export const apiClient = { get, post, patch, put, del } as const;
