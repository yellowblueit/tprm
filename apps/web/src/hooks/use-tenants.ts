import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { get, post } from "@/api/client";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  type: "MSP" | "CLIENT";
  parentTenantId: string | null;
  isActive: boolean;
  settings: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
  _count?: { vendors?: number; users?: number };
}

interface TenantListResponse {
  data: Tenant[];
  meta: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

interface CreateTenantInput {
  name: string;
  slug: string;
}

// ---------------------------------------------------------------------------
// Query keys
// ---------------------------------------------------------------------------

export const tenantKeys = {
  all: ["tenants"] as const,
  lists: () => [...tenantKeys.all, "list"] as const,
  list: (params: Record<string, unknown>) =>
    [...tenantKeys.lists(), params] as const,
};

// ---------------------------------------------------------------------------
// Hooks
// ---------------------------------------------------------------------------

export function useTenants(params: {
  page?: number;
  pageSize?: number;
  search?: string;
} = {}) {
  const queryParams = new URLSearchParams();
  if (params.page) queryParams.set("page", String(params.page));
  if (params.pageSize) queryParams.set("pageSize", String(params.pageSize));
  if (params.search) queryParams.set("search", params.search);

  const qs = queryParams.toString();
  const url = `/tenants${qs ? `?${qs}` : ""}`;

  return useQuery({
    queryKey: tenantKeys.list(params),
    queryFn: async () => {
      const res = await get<Tenant[]>(url);
      return res as unknown as TenantListResponse;
    },
  });
}

export function useCreateTenant() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateTenantInput) => {
      const res = await post<Tenant>("/tenants", input);
      return res.data!;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tenantKeys.lists() });
    },
  });
}
