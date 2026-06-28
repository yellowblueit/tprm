import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { get, post, del } from "@/api/client";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface Subprocessor {
  id: string;
  name: string;
  website: string | null;
  description: string | null;
  industry: string | null;
  headquartersCountry: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface VendorSubprocessor extends Subprocessor {
  serviceProvided: string | null;
  dataShared: string | null;
  riskLevel: string | null;
}

interface LinkSubprocessorInput {
  vendorId: string;
  subprocessorId: string;
  serviceProvided?: string;
  dataShared?: string;
  riskLevel?: string;
}

interface UnlinkSubprocessorInput {
  vendorId: string;
  subprocessorId: string;
}

// ---------------------------------------------------------------------------
// Query keys
// ---------------------------------------------------------------------------

export const subprocessorKeys = {
  all: ["subprocessors"] as const,
  global: () => [...subprocessorKeys.all, "global"] as const,
  vendor: (vendorId: string) =>
    [...subprocessorKeys.all, "vendor", vendorId] as const,
};

// ---------------------------------------------------------------------------
// Hooks
// ---------------------------------------------------------------------------

export function useSubprocessors() {
  return useQuery({
    queryKey: subprocessorKeys.global(),
    queryFn: async () => {
      const res = await get<Subprocessor[]>("/subprocessors");
      return res.data!;
    },
  });
}

export function useVendorSubprocessors(vendorId: string) {
  return useQuery({
    queryKey: subprocessorKeys.vendor(vendorId),
    queryFn: async () => {
      const res = await get<VendorSubprocessor[]>(
        `/vendors/${vendorId}/subprocessors`
      );
      return res.data!;
    },
    enabled: !!vendorId,
  });
}

export function useLinkSubprocessor() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ vendorId, ...body }: LinkSubprocessorInput) => {
      const res = await post<VendorSubprocessor>(
        `/vendors/${vendorId}/subprocessors`,
        body
      );
      return res.data!;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: subprocessorKeys.all });
    },
  });
}

export function useUnlinkSubprocessor() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ vendorId, subprocessorId }: UnlinkSubprocessorInput) => {
      await del(`/vendors/${vendorId}/subprocessors/${subprocessorId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: subprocessorKeys.all });
    },
  });
}
