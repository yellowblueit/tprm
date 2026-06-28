import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { get, patch, put } from "@/api/client";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type Settings = Record<string, unknown>;
export type ScoringMatrix = Record<string, unknown>;
export type NotificationPrefs = Record<string, unknown>;

// ---------------------------------------------------------------------------
// Query keys
// ---------------------------------------------------------------------------

export const settingsKeys = {
  all: ["settings"] as const,
  settings: () => [...settingsKeys.all, "settings"] as const,
  scoringMatrix: () => [...settingsKeys.all, "scoring-matrix"] as const,
  notifications: () => [...settingsKeys.all, "notifications"] as const,
};

// ---------------------------------------------------------------------------
// Hooks
// ---------------------------------------------------------------------------

export function useSettings() {
  return useQuery({
    queryKey: settingsKeys.settings(),
    queryFn: async () => {
      const res = await get<Settings>("/settings");
      return res.data!;
    },
  });
}

export function useScoringMatrix() {
  return useQuery({
    queryKey: settingsKeys.scoringMatrix(),
    queryFn: async () => {
      const res = await get<ScoringMatrix>("/settings/scoring-matrix");
      return res.data!;
    },
  });
}

export function useNotificationPrefs() {
  return useQuery({
    queryKey: settingsKeys.notifications(),
    queryFn: async () => {
      const res = await get<NotificationPrefs>("/settings/notifications");
      return res.data!;
    },
  });
}

export function useUpdateSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: Record<string, unknown>) => {
      const res = await patch<Settings>("/settings", input);
      return res.data!;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: settingsKeys.all });
    },
  });
}

export function useUpdateScoringMatrix() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: { config: Record<string, unknown> }) => {
      const res = await put<ScoringMatrix>("/settings/scoring-matrix", input);
      return res.data!;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: settingsKeys.all });
    },
  });
}

export function useUpdateNotificationPrefs() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: Record<string, unknown>) => {
      const res = await put<NotificationPrefs>(
        "/settings/notifications",
        input
      );
      return res.data!;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: settingsKeys.all });
    },
  });
}
