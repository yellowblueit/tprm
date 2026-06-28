import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { get, post } from "@/api/client";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CatalogVendor {
  id: string;
  name: string;
  website: string | null;
  description: string | null;
  industry: string | null;
  createdAt: string;
  updatedAt: string;
}

interface CatalogListResponse {
  data: CatalogVendor[];
  meta: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

interface AddToCatalogInput {
  name: string;
  website?: string;
  description?: string;
  industry?: string;
}

interface AssignCatalogVendorInput {
  catalogVendorId: string;
  criticality: string;
}

// ---------------------------------------------------------------------------
// Query keys
// ---------------------------------------------------------------------------

export const catalogKeys = {
  all: ["catalog"] as const,
  lists: () => [...catalogKeys.all, "list"] as const,
  list: (search?: string) =>
    [...catalogKeys.lists(), { search }] as const,
};

// ---------------------------------------------------------------------------
// Hooks
// ---------------------------------------------------------------------------

export function useCatalogVendors(search?: string) {
  const queryParams = new URLSearchParams();
  if (search) queryParams.set("search", search);

  const qs = queryParams.toString();
  const url = `/admin/catalog${qs ? `?${qs}` : ""}`;

  return useQuery({
    queryKey: catalogKeys.list(search),
    queryFn: async () => {
      const res = await get<CatalogVendor[]>(url);
      return res as unknown as CatalogListResponse;
    },
  });
}

export function useAddToCatalog() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: AddToCatalogInput) => {
      const res = await post<CatalogVendor>("/admin/catalog", input);
      return res.data!;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: catalogKeys.all });
    },
  });
}

export function useAssignCatalogVendor() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      catalogVendorId,
      ...body
    }: AssignCatalogVendorInput) => {
      const res = await post<unknown>(
        `/admin/catalog/${catalogVendorId}/assign`,
        body
      );
      return res.data!;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: catalogKeys.all });
      queryClient.invalidateQueries({ queryKey: ["vendors"] });
    },
  });
}
