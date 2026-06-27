import { useState } from "react";
import { toast } from "sonner";
import {
  Search,
  Plus,
  Building2,
  MoreHorizontal,
  Check,
  Power,
  PowerOff,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/components/common/PageHeader";
import { PageLoadingSkeleton } from "@/components/common/LoadingSkeleton";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableHeader,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
} from "@/components/ui/data-table";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { useTenants, useCreateTenant } from "@/hooks/use-tenants";

// ---------------------------------------------------------------------------
// Create Tenant Dialog Content
// ---------------------------------------------------------------------------

function CreateTenantForm({ onClose }: { onClose: () => void }) {
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [autoSlug, setAutoSlug] = useState(true);
  const createTenant = useCreateTenant();

  function handleNameChange(val: string) {
    setName(val);
    if (autoSlug) {
      setSlug(
        val
          .toLowerCase()
          .replace(/[^a-z0-9\s-]/g, "")
          .replace(/\s+/g, "-")
          .replace(/-+/g, "-")
      );
    }
  }

  function handleSlugChange(val: string) {
    setAutoSlug(false);
    setSlug(val.toLowerCase().replace(/[^a-z0-9-]/g, ""));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      await createTenant.mutateAsync({ name, slug });
      toast.success("Tenant created", { description: `"${name}" has been added successfully.` });
      onClose();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Something went wrong.";
      toast.error("Failed to create tenant", { description: message });
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Name */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-1.5">
          Organization Name
        </label>
        <Input
          type="text"
          required
          value={name}
          onChange={(e) => handleNameChange(e.target.value)}
          placeholder="e.g. Acme Corporation"
        />
      </div>

      {/* Slug */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-1.5">
          Slug
        </label>
        <Input
          type="text"
          required
          value={slug}
          onChange={(e) => handleSlugChange(e.target.value)}
          placeholder="acme-corporation"
          pattern="^[a-z0-9-]+$"
          className="font-mono"
        />
        <p className="mt-1 text-xs text-muted-foreground">
          Lowercase letters, numbers, and hyphens only.
        </p>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="ghost" onClick={onClose}>
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={!name.trim() || !slug.trim() || createTenant.isPending}
        >
          {createTenant.isPending ? (
            <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
          ) : (
            <Check className="mr-1.5 h-4 w-4" />
          )}
          {createTenant.isPending ? "Creating\u2026" : "Create"}
        </Button>
      </div>
    </form>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function TenantListPage() {
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);

  const { data: tenantsData, isLoading, isError } = useTenants({
    search: search || undefined,
  });

  const filtered = tenantsData?.data ?? [];

  return (
    <>
      <PageHeader
        title="Tenants"
        description="Manage client organizations and their configurations."
      >
        <Button onClick={() => setShowCreate(true)}>
          <Plus className="h-4 w-4" />
          Add Tenant
        </Button>
      </PageHeader>

      {/* Search */}
      <div className="mb-4">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tenants..."
            className="pl-9"
          />
        </div>
      </div>

      {/* Loading state */}
      {isLoading && <PageLoadingSkeleton />}

      {/* Error state */}
      {isError && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-12 text-center text-sm text-destructive">
          Failed to load tenants. Please try again later.
        </div>
      )}

      {/* Table */}
      {!isLoading && !isError && (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Organization</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-center">Vendors</TableHead>
                <TableHead className="text-center">Users</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((tenant) => (
                <TableRow key={tenant.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          "flex h-8 w-8 items-center justify-center rounded-lg",
                          tenant.type === "MSP"
                            ? "bg-primary/10 text-primary"
                            : "bg-accent text-accent-foreground"
                        )}
                      >
                        <Building2 className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          {tenant.name}
                        </p>
                        <p className="text-xs text-muted-foreground font-mono">
                          {tenant.slug}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <StatusBadge
                      variant={tenant.type === "MSP" ? "info" : "default"}
                    >
                      {tenant.type}
                    </StatusBadge>
                  </TableCell>
                  <TableCell className="text-center text-sm text-foreground">
                    {tenant._count?.vendors ?? "-"}
                  </TableCell>
                  <TableCell className="text-center text-sm text-foreground">
                    {tenant._count?.users ?? "-"}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      {tenant.isActive ? (
                        <>
                          <Power className="h-3.5 w-3.5 text-green-500" />
                          <span className="text-xs text-green-500 font-medium">
                            Active
                          </span>
                        </>
                      ) : (
                        <>
                          <PowerOff className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground font-medium">
                            Inactive
                          </span>
                        </>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(tenant.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => toast.info(`Manage ${tenant.name}`, { description: "Tenant management options will be available with API integration." })}
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {filtered.length === 0 && (
            <EmptyState
              icon={Building2}
              title="No tenants found"
              description="Try adjusting your search or add a new tenant."
            />
          )}
        </Card>
      )}

      {/* Create dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogTitle>Create Tenant</DialogTitle>
          <DialogDescription>
            Add a new client organization to the platform.
          </DialogDescription>
          <CreateTenantForm onClose={() => setShowCreate(false)} />
        </DialogContent>
      </Dialog>
    </>
  );
}
