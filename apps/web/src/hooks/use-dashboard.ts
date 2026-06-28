import { useQuery } from "@tanstack/react-query";
import { get } from "@/api/client";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface DashboardMetrics {
  totalVendors: number;
  vendorsByStage: Record<string, number>;
  riskDistribution: Record<string, number>;
  openRemediations: number;
  upcomingReviews: number;
  complianceCoverage: number;
  recentAlerts: {
    id: string;
    type: string;
    message: string;
    severity: string;
    createdAt: string;
  }[];
}

// ---------------------------------------------------------------------------
// Query keys
// ---------------------------------------------------------------------------

export const dashboardKeys = {
  all: ["dashboard"] as const,
  metrics: () => [...dashboardKeys.all, "metrics"] as const,
};

// ---------------------------------------------------------------------------
// Hooks
// ---------------------------------------------------------------------------

export function useDashboardMetrics() {
  return useQuery({
    queryKey: dashboardKeys.metrics(),
    queryFn: async () => {
      const res = await get<DashboardMetrics>("/dashboard/metrics");
      return res.data!;
    },
  });
}
