import { useQuery } from "@tanstack/react-query";
import { get } from "@/api/client";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface RiskDistribution {
  level: string;
  count: number;
  percentage: number;
}

export interface RiskTrendPoint {
  month: string;
  averageScore: number;
  highRiskCount: number;
}

export interface VendorPipelineStage {
  stage: string;
  count: number;
}

export interface RemediationStats {
  total: number;
  open: number;
  inProgress: number;
  completed: number;
  overdue: number;
  averageResolutionDays: number;
}

// ---------------------------------------------------------------------------
// Query keys
// ---------------------------------------------------------------------------

export const analyticsKeys = {
  all: ["analytics"] as const,
  riskDistribution: () => [...analyticsKeys.all, "riskDistribution"] as const,
  riskTrend: (months?: number) =>
    [...analyticsKeys.all, "riskTrend", months] as const,
  vendorPipeline: () => [...analyticsKeys.all, "vendorPipeline"] as const,
  remediationStats: () => [...analyticsKeys.all, "remediationStats"] as const,
};

// ---------------------------------------------------------------------------
// Hooks
// ---------------------------------------------------------------------------

export function useRiskDistribution() {
  return useQuery({
    queryKey: analyticsKeys.riskDistribution(),
    queryFn: async () => {
      const res = await get<RiskDistribution[]>(
        "/analytics/risk-distribution"
      );
      return res.data!;
    },
  });
}

export function useRiskTrend(months?: number) {
  const qs = months ? `?months=${months}` : "";

  return useQuery({
    queryKey: analyticsKeys.riskTrend(months),
    queryFn: async () => {
      const res = await get<RiskTrendPoint[]>(`/analytics/risk-trend${qs}`);
      return res.data!;
    },
  });
}

export function useVendorPipeline() {
  return useQuery({
    queryKey: analyticsKeys.vendorPipeline(),
    queryFn: async () => {
      const res = await get<VendorPipelineStage[]>(
        "/analytics/vendor-pipeline"
      );
      return res.data!;
    },
  });
}

export function useRemediationStats() {
  return useQuery({
    queryKey: analyticsKeys.remediationStats(),
    queryFn: async () => {
      const res = await get<RemediationStats>("/analytics/remediation-stats");
      return res.data!;
    },
  });
}
