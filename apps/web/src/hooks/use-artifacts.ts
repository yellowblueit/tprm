import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { get, del } from "@/api/client";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface Artifact {
  id: string;
  vendorId: string;
  name: string;
  type: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  storageUrl: string;
  validFrom: string | null;
  validUntil: string | null;
  uploadedBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface UploadArtifactInput {
  vendorId: string;
  file: File;
  name: string;
  type: string;
  validFrom?: string;
  validUntil?: string;
}

// ---------------------------------------------------------------------------
// Query keys
// ---------------------------------------------------------------------------

export const artifactKeys = {
  all: ["artifacts"] as const,
  vendor: (vendorId: string) =>
    [...artifactKeys.all, "vendor", vendorId] as const,
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function uploadArtifactFile(
  vendorId: string,
  file: File,
  metadata: {
    name: string;
    type: string;
    validFrom?: string;
    validUntil?: string;
  }
): Promise<Artifact> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("name", metadata.name);
  formData.append("type", metadata.type);
  if (metadata.validFrom) formData.append("validFrom", metadata.validFrom);
  if (metadata.validUntil) formData.append("validUntil", metadata.validUntil);

  const res = await fetch(`/api/v1/vendors/${vendorId}/artifacts`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    throw new Error("Upload failed");
  }

  const json = await res.json();
  return json.data;
}

// ---------------------------------------------------------------------------
// Hooks
// ---------------------------------------------------------------------------

export function useArtifacts(vendorId: string) {
  return useQuery({
    queryKey: artifactKeys.vendor(vendorId),
    queryFn: async () => {
      const res = await get<Artifact[]>(`/vendors/${vendorId}/artifacts`);
      return res.data!;
    },
    enabled: !!vendorId,
  });
}

export function useUploadArtifact() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: UploadArtifactInput) => {
      return uploadArtifactFile(input.vendorId, input.file, {
        name: input.name,
        type: input.type,
        validFrom: input.validFrom,
        validUntil: input.validUntil,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: artifactKeys.all });
    },
  });
}

export function useDeleteArtifact() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await del<void>(`/artifacts/${id}`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: artifactKeys.all });
    },
  });
}
