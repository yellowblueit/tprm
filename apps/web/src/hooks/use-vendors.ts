import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { get, post } from "@/api/client";

// ---------------------------------------------------------------------------
// Types (matching backend Prisma models)
// ---------------------------------------------------------------------------

export interface Vendor {
  id: string;
  tenantId: string;
  name: string;
  website: string | null;
  description: string | null;
  industry: string | null;
  headquartersCountry: string | null;
  employeeCount: string | null;
  yearFounded: number | null;
  logoUrl: string | null;
  stage: string;
  criticality: string;
  aiEnrichmentData: unknown;
  catalogVendorId: string | null;
  nextReviewDate: string | null;
  reviewFrequencyMonths: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  businessCases?: { businessCase: string }[];
  dataClassifications?: { dataTypeId: string }[];
  owners?: { userId: string; isPrimary: boolean; user?: { displayName: string; email: string } }[];
  riskScores?: {
    id: string;
    inherentRiskScore: number;
    inherentRiskLevel: string;
    residualRiskScore: number;
    residualRiskLevel: string;
    calculatedAt: string;
  }[];
  _count?: { remediations?: number; artifacts?: number };
}

interface VendorListResponse {
  data: Vendor[];
  meta: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

interface CreateVendorInput {
  name: string;
  website?: string;
  description?: string;
  industry?: string;
  headquartersCountry?: string;
  employeeCount?: string;
  yearFounded?: number;
  criticality?: string;
  businessCases: string[];
  dataClassificationIds: string[];
  reviewFrequencyMonths?: number;
}

// ---------------------------------------------------------------------------
// Query keys
// ---------------------------------------------------------------------------

export const vendorKeys = {
  all: ["vendors"] as const,
  lists: () => [...vendorKeys.all, "list"] as const,
  list: (params: Record<string, unknown>) =>
    [...vendorKeys.lists(), params] as const,
  details: () => [...vendorKeys.all, "detail"] as const,
  detail: (id: string) => [...vendorKeys.details(), id] as const,
};

// ---------------------------------------------------------------------------
// Hooks
// ---------------------------------------------------------------------------

export function useVendors(params: {
  page?: number;
  pageSize?: number;
  search?: string;
  stage?: string;
  criticality?: string;
  riskLevel?: string;
} = {}) {
  const queryParams = new URLSearchParams();
  if (params.page) queryParams.set("page", String(params.page));
  if (params.pageSize) queryParams.set("pageSize", String(params.pageSize));
  if (params.search) queryParams.set("search", params.search);
  if (params.stage) queryParams.set("stage", params.stage);
  if (params.criticality) queryParams.set("criticality", params.criticality);
  if (params.riskLevel) queryParams.set("riskLevel", params.riskLevel);

  const qs = queryParams.toString();
  const url = `/vendors${qs ? `?${qs}` : ""}`;

  return useQuery({
    queryKey: vendorKeys.list(params),
    queryFn: async () => {
      const res = await get<Vendor[]>(url);
      return res as unknown as VendorListResponse;
    },
  });
}

export function useVendor(id: string | undefined) {
  return useQuery({
    queryKey: vendorKeys.detail(id!),
    queryFn: async () => {
      const res = await get<Vendor>(`/vendors/${id}`);
      return res.data!;
    },
    enabled: !!id,
  });
}

export function useCreateVendor() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateVendorInput) => {
      const res = await post<Vendor>("/vendors", input);
      return res.data!;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: vendorKeys.lists() });
    },
  });
}
