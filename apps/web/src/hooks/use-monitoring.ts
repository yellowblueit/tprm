import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { get, post, patch } from "@/api/client";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface Alert {
  id: string;
  vendorId: string;
  type: string;
  severity: string;
  title: string;
  description: string;
  sourceUrl: string | null;
  riskImpact: string | null;
  acknowledged: boolean;
  dismissed: boolean;
  createdAt: string;
  updatedAt: string;
}

interface PaginatedResponse {
  data: Alert[];
  meta: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

interface CreateAlertInput {
  vendorId: string;
  type: string;
  severity: string;
  title: string;
  description: string;
  sourceUrl?: string;
  riskImpact?: string;
}

interface UpdateAlertInput {
  id: string;
  acknowledged?: boolean;
  dismissed?: boolean;
}

// ---------------------------------------------------------------------------
// Query keys
// ---------------------------------------------------------------------------

export const monitoringKeys = {
  all: ["monitoring"] as const,
  lists: () => [...monitoringKeys.all, "list"] as const,
  list: (filters: Record<string, unknown>) =>
    [...monitoringKeys.lists(), filters] as const,
  vendor: (vendorId: string) =>
    [...monitoringKeys.all, "vendor", vendorId] as const,
};

// ---------------------------------------------------------------------------
// Hooks
// ---------------------------------------------------------------------------

export function useAlerts(
  filters: {
    page?: number;
    pageSize?: number;
    severity?: string;
    type?: string;
    vendorId?: string;
    acknowledged?: boolean;
  } = {}
) {
  const queryParams = new URLSearchParams();
  if (filters.page) queryParams.set("page", String(filters.page));
  if (filters.pageSize) queryParams.set("pageSize", String(filters.pageSize));
  if (filters.severity) queryParams.set("severity", filters.severity);
  if (filters.type) queryParams.set("type", filters.type);
  if (filters.vendorId) queryParams.set("vendorId", filters.vendorId);
  if (filters.acknowledged !== undefined)
    queryParams.set("acknowledged", String(filters.acknowledged));

  const qs = queryParams.toString();
  const url = `/monitoring/alerts${qs ? `?${qs}` : ""}`;

  return useQuery({
    queryKey: monitoringKeys.list(filters),
    queryFn: async () => {
      const res = await get<Alert[]>(url);
      return res as unknown as PaginatedResponse;
    },
  });
}

export function useVendorAlerts(vendorId: string) {
  return useQuery({
    queryKey: monitoringKeys.vendor(vendorId),
    queryFn: async () => {
      const res = await get<Alert[]>(`/vendors/${vendorId}/alerts`);
      return res.data!;
    },
    enabled: !!vendorId,
  });
}

export function useCreateAlert() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateAlertInput) => {
      const res = await post<Alert>("/monitoring/alerts", input);
      return res.data!;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: monitoringKeys.all });
    },
  });
}

export function useUpdateAlert() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...body }: UpdateAlertInput) => {
      const res = await patch<Alert>(`/monitoring/alerts/${id}`, body);
      return res.data!;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: monitoringKeys.all });
    },
  });
}
