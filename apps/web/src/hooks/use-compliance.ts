import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { get, put } from "@/api/client";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface Framework {
  id: string;
  name: string;
  version: string;
  description: string | null;
  controlCount: number;
  isActive: boolean;
  createdAt: string;
}

export interface VendorCompliance {
  vendorId: string;
  frameworkId: string;
  framework: Framework;
  status: string;
  coveragePercentage: number;
  controls: {
    controlId: string;
    controlName: string;
    status: string;
    evidence: string | null;
  }[];
  lastAssessedAt: string | null;
}

export interface ComplianceMatrixEntry {
  vendorId: string;
  vendorName: string;
  frameworks: {
    frameworkId: string;
    frameworkName: string;
    status: string;
    coveragePercentage: number;
  }[];
}

export interface UpsertComplianceInput {
  vendorId: string;
  frameworkId: string;
  status?: string;
  controls?: {
    controlId: string;
    status: string;
    evidence?: string;
  }[];
}

// ---------------------------------------------------------------------------
// Query keys
// ---------------------------------------------------------------------------

export const complianceKeys = {
  all: ["compliance"] as const,
  frameworks: () => [...complianceKeys.all, "frameworks"] as const,
  vendor: (vendorId: string) =>
    [...complianceKeys.all, "vendor", vendorId] as const,
  matrix: () => [...complianceKeys.all, "matrix"] as const,
};

// ---------------------------------------------------------------------------
// Hooks
// ---------------------------------------------------------------------------

export function useFrameworks() {
  return useQuery({
    queryKey: complianceKeys.frameworks(),
    queryFn: async () => {
      const res = await get<Framework[]>("/compliance/frameworks");
      return res.data!;
    },
  });
}

export function useVendorCompliance(vendorId: string) {
  return useQuery({
    queryKey: complianceKeys.vendor(vendorId),
    queryFn: async () => {
      const res = await get<VendorCompliance[]>(
        `/vendors/${vendorId}/compliance`
      );
      return res.data!;
    },
    enabled: !!vendorId,
  });
}

export function useComplianceMatrix() {
  return useQuery({
    queryKey: complianceKeys.matrix(),
    queryFn: async () => {
      const res = await get<ComplianceMatrixEntry[]>("/compliance/matrix");
      return res.data!;
    },
  });
}

export function useUpsertCompliance() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ vendorId, ...data }: UpsertComplianceInput) => {
      const res = await put<VendorCompliance>(
        `/vendors/${vendorId}/compliance`,
        data
      );
      return res.data!;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: complianceKeys.all });
    },
  });
}
