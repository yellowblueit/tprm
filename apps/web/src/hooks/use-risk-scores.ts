import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { get, post } from "@/api/client";
import { vendorKeys } from "./use-vendors";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface RiskScore {
  id: string;
  vendorId: string;
  inherentRiskScore: number;
  inherentRiskLevel: string;
  residualRiskScore: number;
  residualRiskLevel: string;
  categoryScores: Record<string, number>;
  calculatedAt: string;
  calculatedBy: string | null;
  createdAt: string;
}

export interface CalculateRiskScoreInput {
  vendorId: string;
}

// ---------------------------------------------------------------------------
// Query keys
// ---------------------------------------------------------------------------

export const riskScoreKeys = {
  all: ["riskScores"] as const,
  vendor: (vendorId: string) =>
    [...riskScoreKeys.all, "vendor", vendorId] as const,
};

// ---------------------------------------------------------------------------
// Hooks
// ---------------------------------------------------------------------------

export function useRiskScores(vendorId: string) {
  return useQuery({
    queryKey: riskScoreKeys.vendor(vendorId),
    queryFn: async () => {
      const res = await get<RiskScore[]>(
        `/vendors/${vendorId}/risk-scores`
      );
      return res.data!;
    },
    enabled: !!vendorId,
  });
}

export function useLatestRiskScore(vendorId: string) {
  return useQuery({
    queryKey: [...riskScoreKeys.vendor(vendorId), "latest"] as const,
    queryFn: async () => {
      const res = await get<RiskScore>(
        `/vendors/${vendorId}/risk-scores/latest`
      );
      return res.data!;
    },
    enabled: !!vendorId,
  });
}

export function useCalculateRiskScore() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CalculateRiskScoreInput) => {
      const res = await post<RiskScore>(
        `/vendors/${input.vendorId}/risk-scores`
      );
      return res.data!;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: riskScoreKeys.all });
      queryClient.invalidateQueries({ queryKey: vendorKeys.all });
    },
  });
}
