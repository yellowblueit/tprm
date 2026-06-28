import { useQuery } from "@tanstack/react-query";
import { get } from "@/api/client";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ActivityEntry {
  id: string;
  tenantId: string;
  vendorId: string | null;
  userId: string | null;
  action: string;
  entityType: string;
  entityId: string | null;
  details: Record<string, unknown> | null;
  createdAt: string;
}

// ---------------------------------------------------------------------------
// Query keys
// ---------------------------------------------------------------------------

export const activityKeys = {
  all: ["activity"] as const,
  tenant: () => [...activityKeys.all, "tenant"] as const,
  vendor: (vendorId: string) =>
    [...activityKeys.all, "vendor", vendorId] as const,
};

// ---------------------------------------------------------------------------
// Hooks
// ---------------------------------------------------------------------------

export function useVendorActivity(vendorId: string, limit?: number) {
  const queryParams = new URLSearchParams();
  if (limit) queryParams.set("limit", String(limit));

  const qs = queryParams.toString();
  const url = `/vendors/${vendorId}/activity${qs ? `?${qs}` : ""}`;

  return useQuery({
    queryKey: activityKeys.vendor(vendorId),
    queryFn: async () => {
      const res = await get<ActivityEntry[]>(url);
      return res.data!;
    },
    enabled: !!vendorId,
  });
}
