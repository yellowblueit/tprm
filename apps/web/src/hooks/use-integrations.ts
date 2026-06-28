import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { get, put, del, post } from "@/api/client";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface Integration {
  id: string;
  type: string;
  displayName: string;
  config: Record<string, unknown> | null;
  credentials: Record<string, string | null> | null;
  isActive: boolean;
  lastTestedAt: string | null;
  lastTestStatus: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TestResult {
  success: boolean;
  message: string;
}

// ---------------------------------------------------------------------------
// Query keys
// ---------------------------------------------------------------------------

export const integrationKeys = {
  all: ["integrations"] as const,
  list: () => [...integrationKeys.all, "list"] as const,
  detail: (type: string) => [...integrationKeys.all, "detail", type] as const,
};

// ---------------------------------------------------------------------------
// Hooks
// ---------------------------------------------------------------------------

export function useIntegrations() {
  return useQuery({
    queryKey: integrationKeys.list(),
    queryFn: async () => {
      const res = await get<Integration[]>("/settings/integrations");
      return res.data ?? [];
    },
  });
}

export function useIntegration(type: string) {
  return useQuery({
    queryKey: integrationKeys.detail(type),
    queryFn: async () => {
      const res = await get<Integration | null>(
        `/settings/integrations/${type}`
      );
      return res.data ?? null;
    },
    enabled: !!type,
  });
}

export function useUpsertIntegration() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      type,
      data,
    }: {
      type: string;
      data: {
        displayName?: string;
        config?: Record<string, unknown>;
        credentials?: Record<string, string>;
      };
    }) => {
      const res = await put<Integration>(
        `/settings/integrations/${type}`,
        data
      );
      return res.data!;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: integrationKeys.all });
    },
  });
}

export function useDeleteIntegration() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (type: string) => {
      await del(`/settings/integrations/${type}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: integrationKeys.all });
    },
  });
}

export function useTestIntegration() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (type: string) => {
      const res = await post<TestResult>(
        `/settings/integrations/${type}/test`
      );
      return res.data!;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: integrationKeys.all });
    },
  });
}
