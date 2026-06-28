import { useState } from "react";
import { toast } from "sonner";
import {
  Search,
  Plus,
  Globe,
  FileText,
  Users,
  ArrowRightLeft,
  Loader2,
} from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { PageLoadingSkeleton } from "@/components/common/LoadingSkeleton";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { useCatalogVendors, useAssignCatalogVendor } from "@/hooks/use-vendor-catalog";

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function VendorCatalogPage() {
  const [search, setSearch] = useState("");

  const catalogQuery = useCatalogVendors(search || undefined);
  const assignMutation = useAssignCatalogVendor();

  if (catalogQuery.isLoading) return <PageLoadingSkeleton />;

  const vendors = catalogQuery.data?.data ?? [];

  function handleAssign(vendorId: string, vendorName: string) {
    assignMutation.mutate(
      { catalogVendorId: vendorId, criticality: "medium" },
      {
        onSuccess: () => {
          toast.success(`${vendorName} assigned`, {
            description: "Vendor has been added to your tenant.",
          });
        },
        onError: (error) => {
          toast.error(`Failed to assign ${vendorName}`, {
            description: error instanceof Error ? error.message : "An unexpected error occurred.",
          });
        },
      }
    );
  }

  return (
    <>
      <PageHeader
        title="Vendor Catalog"
        description="Manage the global vendor catalog and shared assessments."
      >
        <Button
          onClick={() => toast.info("Add to catalog", { description: "Use the search below to find and assign vendors." })}
        >
          <Plus className="h-4 w-4" />
          Add to Catalog
        </Button>
      </PageHeader>

      {/* Search */}
      <div className="mb-5">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search catalog..."
            className="pl-9"
          />
        </div>
      </div>

      {/* Vendor Grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {vendors.map((vendor) => (
          <Card key={vendor.id} className="p-5">
            <div className="mb-3 flex items-start justify-between">
              <div>
                <h3 className="text-sm font-semibold text-foreground">
                  {vendor.name}
                </h3>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {vendor.industry ?? "—"}
                </p>
              </div>
            </div>

            <div className="mb-4 flex items-center gap-4 text-xs text-muted-foreground">
              {vendor.website && (
                <span className="inline-flex items-center gap-1">
                  <Globe className="h-3.5 w-3.5" />
                  {vendor.website}
                </span>
              )}
              {vendor.description && (
                <span className="inline-flex items-center gap-1">
                  <FileText className="h-3.5 w-3.5" />
                  {vendor.description}
                </span>
              )}
            </div>

            <Button
              variant="secondary"
              className="w-full"
              disabled={assignMutation.isPending}
              onClick={() => handleAssign(vendor.id, vendor.name)}
            >
              {assignMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ArrowRightLeft className="h-4 w-4" />
              )}
              Assign to Tenant
            </Button>
          </Card>
        ))}
      </div>

      {vendors.length === 0 && (
        <EmptyState
          icon={Search}
          title="No vendors found"
          description="No vendors in the catalog match your search."
        />
      )}
    </>
  );
}
