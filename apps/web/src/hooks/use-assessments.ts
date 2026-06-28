import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { get, put } from "@/api/client";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface Assessment {
  id: string;
  vendorId: string;
  templateId: string;
  status: string;
  responses: Record<string, unknown>;
  completedAt: string | null;
  completedBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AssessmentSummary {
  total: number;
  completed: number;
  inProgress: number;
  pending: number;
}

export interface UpsertAssessmentInput {
  vendorId: string;
  templateId: string;
  status?: string;
  responses?: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// Query keys
// ---------------------------------------------------------------------------

export const assessmentKeys = {
  all: ["assessments"] as const,
  vendor: (vendorId: string) =>
    [...assessmentKeys.all, "vendor", vendorId] as const,
  summary: () => [...assessmentKeys.all, "summary"] as const,
};

// ---------------------------------------------------------------------------
// Hooks
// ---------------------------------------------------------------------------

export function useAssessments(vendorId: string) {
  return useQuery({
    queryKey: assessmentKeys.vendor(vendorId),
    queryFn: async () => {
      const res = await get<Assessment[]>(
        `/vendors/${vendorId}/assessments`
      );
      return res.data!;
    },
    enabled: !!vendorId,
  });
}

export function useAssessmentSummary() {
  return useQuery({
    queryKey: assessmentKeys.summary(),
    queryFn: async () => {
      const res = await get<AssessmentSummary>("/assessments/summary");
      return res.data!;
    },
  });
}

export function useUpsertAssessment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ vendorId, ...data }: UpsertAssessmentInput) => {
      const res = await put<Assessment>(
        `/vendors/${vendorId}/assessments`,
        data
      );
      return res.data!;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: assessmentKeys.all });
    },
  });
}
