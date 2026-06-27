import { useState, useMemo } from "react";
import { toast } from "sonner";
import {
  Search,
  Plus,
  Globe,
  FileText,
  Users,
  ArrowRightLeft,
} from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface CatalogVendor {
  id: string;
  name: string;
  industry: string;
  website: string;
  tenantCount: number;
  sharedArtifacts: number;
}

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------

const MOCK_CATALOG_VENDORS: CatalogVendor[] = [
  {
    id: "1",
    name: "Microsoft",
    industry: "Cloud & Productivity",
    website: "microsoft.com",
    tenantCount: 12,
    sharedArtifacts: 8,
  },
  {
    id: "2",
    name: "AWS",
    industry: "Cloud Infrastructure",
    website: "aws.amazon.com",
    tenantCount: 9,
    sharedArtifacts: 6,
  },
  {
    id: "3",
    name: "Salesforce",
    industry: "CRM & Sales",
    website: "salesforce.com",
    tenantCount: 7,
    sharedArtifacts: 5,
  },
  {
    id: "4",
    name: "Slack",
    industry: "Communication",
    website: "slack.com",
    tenantCount: 11,
    sharedArtifacts: 3,
  },
  {
    id: "5",
    name: "Okta",
    industry: "Identity & Access",
    website: "okta.com",
    tenantCount: 6,
    sharedArtifacts: 4,
  },
  {
    id: "6",
    name: "Datadog",
    industry: "Observability",
    website: "datadoghq.com",
    tenantCount: 4,
    sharedArtifacts: 2,
  },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function VendorCatalogPage() {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    if (!search) return MOCK_CATALOG_VENDORS;
    const q = search.toLowerCase();
    return MOCK_CATALOG_VENDORS.filter(
      (v) =>
        v.name.toLowerCase().includes(q) ||
        v.industry.toLowerCase().includes(q)
    );
  }, [search]);

  return (
    <>
      <PageHeader
        title="Vendor Catalog"
        description="Manage the global vendor catalog and shared assessments."
      >
        <Button
          onClick={() => toast.info("Add to catalog", { description: "Vendor catalog management will be available with API integration." })}
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
        {filtered.map((vendor) => (
          <Card key={vendor.id} className="p-5">
            <div className="mb-3 flex items-start justify-between">
              <div>
                <h3 className="text-sm font-semibold text-foreground">
                  {vendor.name}
                </h3>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {vendor.industry}
                </p>
              </div>
              <StatusBadge variant="info">
                <Users className="mr-1 h-3 w-3" />
                {vendor.tenantCount} tenants
              </StatusBadge>
            </div>

            <div className="mb-4 flex items-center gap-4 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                <Globe className="h-3.5 w-3.5" />
                {vendor.website}
              </span>
              <span className="inline-flex items-center gap-1">
                <FileText className="h-3.5 w-3.5" />
                {vendor.sharedArtifacts} artifacts
              </span>
            </div>

            <Button
              variant="secondary"
              className="w-full"
              onClick={() => toast.info(`${vendor.name} assignment`, { description: "Tenant assignment will be available with API integration." })}
            >
              <ArrowRightLeft className="h-4 w-4" />
              Assign to Tenant
            </Button>
          </Card>
        ))}
      </div>

      {filtered.length === 0 && (
        <EmptyState
          icon={Search}
          title="No vendors found"
          description="No vendors in the catalog match your search."
        />
      )}
    </>
  );
}
