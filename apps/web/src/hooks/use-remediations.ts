import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { get, post, patch } from "@/api/client";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface Remediation {
  id: string;
  vendorId: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  dueDate: string | null;
  assignedTo: string | null;
  resolvedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface RemediationComment {
  id: string;
  remediationId: string;
  content: string;
  authorId: string;
  author?: { displayName: string; email: string };
  createdAt: string;
}

interface RemediationListResponse {
  data: Remediation[];
  meta: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

export interface CreateRemediationInput {
  vendorId: string;
  title: string;
  description: string;
  priority?: string;
  dueDate?: string;
  assignedTo?: string;
}

export interface UpdateRemediationInput {
  id: string;
  title?: string;
  description?: string;
  status?: string;
  priority?: string;
  dueDate?: string;
  assignedTo?: string;
}

export interface AddRemediationCommentInput {
  remediationId: string;
  content: string;
}

// ---------------------------------------------------------------------------
// Query keys
// ---------------------------------------------------------------------------

export const remediationKeys = {
  all: ["remediations"] as const,
  lists: () => [...remediationKeys.all, "list"] as const,
  list: (filters: Record<string, unknown>) =>
    [...remediationKeys.lists(), filters] as const,
  vendor: (vendorId: string) =>
    [...remediationKeys.all, "vendor", vendorId] as const,
  comments: (id: string) =>
    [...remediationKeys.all, "comments", id] as const,
};

// ---------------------------------------------------------------------------
// Hooks
// ---------------------------------------------------------------------------

export function useRemediations(
  filters: {
    page?: number;
    pageSize?: number;
    status?: string;
    priority?: string;
    vendorId?: string;
  } = {}
) {
  const queryParams = new URLSearchParams();
  if (filters.page) queryParams.set("page", String(filters.page));
  if (filters.pageSize) queryParams.set("pageSize", String(filters.pageSize));
  if (filters.status) queryParams.set("status", filters.status);
  if (filters.priority) queryParams.set("priority", filters.priority);
  if (filters.vendorId) queryParams.set("vendorId", filters.vendorId);

  const qs = queryParams.toString();
  const url = `/remediations${qs ? `?${qs}` : ""}`;

  return useQuery({
    queryKey: remediationKeys.list(filters),
    queryFn: async () => {
      const res = await get<Remediation[]>(url);
      return res as unknown as RemediationListResponse;
    },
  });
}

export function useVendorRemediations(
  vendorId: string,
  params: { page?: number; pageSize?: number } = {}
) {
  const queryParams = new URLSearchParams();
  if (params.page) queryParams.set("page", String(params.page));
  if (params.pageSize) queryParams.set("pageSize", String(params.pageSize));

  const qs = queryParams.toString();
  const url = `/vendors/${vendorId}/remediations${qs ? `?${qs}` : ""}`;

  return useQuery({
    queryKey: [...remediationKeys.vendor(vendorId), params] as const,
    queryFn: async () => {
      const res = await get<Remediation[]>(url);
      return res as unknown as RemediationListResponse;
    },
    enabled: !!vendorId,
  });
}

export function useRemediationComments(id: string) {
  return useQuery({
    queryKey: remediationKeys.comments(id),
    queryFn: async () => {
      const res = await get<RemediationComment[]>(
        `/remediations/${id}/comments`
      );
      return res.data!;
    },
    enabled: !!id,
  });
}

export function useCreateRemediation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ vendorId, ...data }: CreateRemediationInput) => {
      const res = await post<Remediation>(
        `/vendors/${vendorId}/remediations`,
        data
      );
      return res.data!;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: remediationKeys.all });
    },
  });
}

export function useUpdateRemediation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...data }: UpdateRemediationInput) => {
      const res = await patch<Remediation>(`/remediations/${id}`, data);
      return res.data!;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: remediationKeys.all });
    },
  });
}

export function useAddRemediationComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ remediationId, content }: AddRemediationCommentInput) => {
      const res = await post<RemediationComment>(
        `/remediations/${remediationId}/comments`,
        { content }
      );
      return res.data!;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: remediationKeys.comments(variables.remediationId),
      });
    },
  });
}
