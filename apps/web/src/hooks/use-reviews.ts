import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { get, post, patch } from "@/api/client";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ReviewCycle {
  id: string;
  vendorId: string;
  startDate: string;
  dueDate: string;
  completedDate: string | null;
  status: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

interface CreateReviewInput {
  vendorId: string;
  startDate: string;
  dueDate: string;
}

interface UpdateReviewInput {
  id: string;
  status?: string;
  notes?: string;
  completedDate?: string;
}

// ---------------------------------------------------------------------------
// Query keys
// ---------------------------------------------------------------------------

export const reviewKeys = {
  all: ["reviews"] as const,
  vendor: (vendorId: string) =>
    [...reviewKeys.all, "vendor", vendorId] as const,
};

// ---------------------------------------------------------------------------
// Hooks
// ---------------------------------------------------------------------------

export function useReviewCycles(vendorId: string) {
  return useQuery({
    queryKey: reviewKeys.vendor(vendorId),
    queryFn: async () => {
      const res = await get<ReviewCycle[]>(`/vendors/${vendorId}/reviews`);
      return res.data!;
    },
    enabled: !!vendorId,
  });
}

export function useCreateReview() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ vendorId, ...body }: CreateReviewInput) => {
      const res = await post<ReviewCycle>(
        `/vendors/${vendorId}/reviews`,
        body
      );
      return res.data!;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: reviewKeys.all });
    },
  });
}

export function useUpdateReview() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...body }: UpdateReviewInput) => {
      const res = await patch<ReviewCycle>(`/review-cycles/${id}`, body);
      return res.data!;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: reviewKeys.all });
    },
  });
}
