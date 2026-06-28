import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { get, post } from "@/api/client";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface Report {
  key: string;
  type: string;
  generatedAt: string;
  downloadUrl: string;
}

interface GenerateReportInput {
  type: string;
}

// ---------------------------------------------------------------------------
// Query keys
// ---------------------------------------------------------------------------

export const reportKeys = {
  all: ["reports"] as const,
};

// ---------------------------------------------------------------------------
// Hooks
// ---------------------------------------------------------------------------

export function useReports() {
  return useQuery({
    queryKey: reportKeys.all,
    queryFn: async () => {
      const res = await get<Report[]>("/reports");
      return res.data!;
    },
  });
}

export function useGenerateReport() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: GenerateReportInput) => {
      const res = await post<Report>("/reports/generate", input);
      return res.data!;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: reportKeys.all });
    },
  });
}
