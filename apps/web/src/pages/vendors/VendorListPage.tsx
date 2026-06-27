import { useState, useMemo, useCallback, useEffect } from "react";
import { Link, useNavigate } from "react-router";
import {
  Search,
  Plus,
  LayoutGrid,
  List,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Calendar,
  AlertCircle,
} from "lucide-react";
import { cn, formatDate } from "@/lib/utils";
import { PageHeader } from "@/components/common/PageHeader";
import { PageLoadingSkeleton } from "@/components/common/LoadingSkeleton";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SelectNative } from "@/components/ui/select-native";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableHeader,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
} from "@/components/ui/data-table";
import { EmptyState } from "@/components/ui/empty-state";
import { useVendors, type Vendor } from "@/hooks/use-vendors";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Stage = "Evaluating" | "Screening" | "Onboarded";
type Criticality = "Critical" | "High" | "Medium" | "Low";
type SortKey =
  | "name"
  | "stage"
  | "criticality"
  | "nextReview"
  | "industry";
type SortDir = "asc" | "desc";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const stageVariant = (stage: Stage) => {
  const map: Record<Stage, "info" | "warning" | "success"> = {
    Evaluating: "info",
    Screening: "warning",
    Onboarded: "success",
  };
  return map[stage];
};

const criticalityVariant = (c: Criticality) => {
  const map: Record<Criticality, "critical" | "high" | "medium" | "low"> = {
    Critical: "critical",
    High: "high",
    Medium: "medium",
    Low: "low",
  };
  return map[c];
};

const initialBgColor = (name: string) => {
  const colors = [
    "bg-blue-600",
    "bg-emerald-600",
    "bg-violet-600",
    "bg-amber-600",
    "bg-rose-600",
    "bg-cyan-600",
    "bg-pink-600",
    "bg-indigo-600",
    "bg-teal-600",
    "bg-orange-600",
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
};

// ---------------------------------------------------------------------------
// Debounce hook
// ---------------------------------------------------------------------------

function useDebounce(value: string, delay: number): string {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function VendorListPage() {
  const navigate = useNavigate();

  // View state
  const [viewMode, setViewMode] = useState<"table" | "card">("table");

  // Search & filters
  const [searchText, setSearchText] = useState("");
  const debouncedSearch = useDebounce(searchText, 300);
  const [stageFilter, setStageFilter] = useState("");
  const [criticalityFilter, setCriticalityFilter] = useState("");

  // Sorting
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  const handleSort = useCallback(
    (key: SortKey) => {
      if (sortKey === key) {
        setSortDir((d) => (d === "asc" ? "desc" : "asc"));
      } else {
        setSortKey(key);
        setSortDir("asc");
      }
    },
    [sortKey]
  );

  // Fetch vendors from API
  const { data, isLoading, isError } = useVendors({
    search: debouncedSearch || undefined,
    stage: stageFilter || undefined,
    criticality: criticalityFilter || undefined,
  });

  const vendors: Vendor[] = data?.data ?? [];

  // Client-side sorting (API handles search & filtering)
  const filteredVendors = useMemo(() => {
    const result = [...vendors];

    const critOrder: Record<string, number> = {
      Critical: 4,
      High: 3,
      Medium: 2,
      Low: 1,
    };

    result.sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case "name":
          cmp = a.name.localeCompare(b.name);
          break;
        case "stage":
          cmp = a.stage.localeCompare(b.stage);
          break;
        case "criticality":
          cmp =
            (critOrder[a.criticality] ?? 0) -
            (critOrder[b.criticality] ?? 0);
          break;
        case "nextReview":
          cmp =
            new Date(a.nextReviewDate ?? "").getTime() -
            new Date(b.nextReviewDate ?? "").getTime();
          break;
        case "industry":
          cmp = (a.industry ?? "").localeCompare(b.industry ?? "");
          break;
      }
      return sortDir === "asc" ? cmp : -cmp;
    });

    return result;
  }, [vendors, sortKey, sortDir]);

  // Active filter count
  const activeFilterCount = [stageFilter, criticalityFilter].filter(
    Boolean
  ).length;

  // Sort icon component
  const SortIcon = ({ column }: { column: SortKey }) => {
    if (sortKey !== column) {
      return <ArrowUpDown className="ml-1 h-3.5 w-3.5 text-muted-foreground/50" />;
    }
    return sortDir === "asc" ? (
      <ArrowUp className="ml-1 h-3.5 w-3.5 text-primary" />
    ) : (
      <ArrowDown className="ml-1 h-3.5 w-3.5 text-primary" />
    );
  };

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <PageHeader
        title="Vendor Management"
        description="Manage your third-party vendor portfolio, risk assessments, and compliance."
      >
        <Button asChild>
          <Link to="/vendors/new">
            <Plus className="h-4 w-4" />
            Add Vendor
          </Link>
        </Button>
      </PageHeader>

      {/* Search & Filters Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-wrap items-center gap-2">
          {/* Search Input */}
          <div className="relative max-w-xs flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search vendors..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Filter Selects */}
          <SelectNative
            value={stageFilter}
            onChange={(e) => setStageFilter(e.target.value)}
            aria-label="Stage"
          >
            <option value="">Stage</option>
            <option value="Evaluating">Evaluating</option>
            <option value="Screening">Screening</option>
            <option value="Onboarded">Onboarded</option>
          </SelectNative>

          <SelectNative
            value={criticalityFilter}
            onChange={(e) => setCriticalityFilter(e.target.value)}
            aria-label="Criticality"
          >
            <option value="">Criticality</option>
            <option value="Critical">Critical</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </SelectNative>

          {/* Clear filters */}
          {activeFilterCount > 0 && (
            <Button
              variant="link"
              size="sm"
              onClick={() => {
                setStageFilter("");
                setCriticalityFilter("");
                setSearchText("");
              }}
            >
              Clear all ({activeFilterCount})
            </Button>
          )}
        </div>

        {/* View Toggle */}
        <div className="flex items-center gap-1 rounded-md border border-border bg-card p-0.5">
          <Button
            variant={viewMode === "table" ? "primary" : "ghost"}
            size="sm"
            onClick={() => setViewMode("table")}
          >
            <List className="h-4 w-4" />
            <span className="hidden sm:inline">Table</span>
          </Button>
          <Button
            variant={viewMode === "card" ? "primary" : "ghost"}
            size="sm"
            onClick={() => setViewMode("card")}
          >
            <LayoutGrid className="h-4 w-4" />
            <span className="hidden sm:inline">Cards</span>
          </Button>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && <PageLoadingSkeleton />}

      {/* Error State */}
      {isError && (
        <div className="flex flex-col items-center justify-center rounded-lg border border-destructive/30 bg-destructive/5 py-16">
          <AlertCircle className="mb-3 h-10 w-10 text-destructive opacity-60" />
          <p className="text-sm font-medium text-destructive">Failed to load vendors</p>
          <p className="text-xs text-muted-foreground">
            Please try again later or contact support.
          </p>
        </div>
      )}

      {/* Results count */}
      {!isLoading && !isError && (
        <p className="text-sm text-muted-foreground">
          {filteredVendors.length} vendor{filteredVendors.length !== 1 ? "s" : ""} found
        </p>
      )}

      {/* Content */}
      {!isLoading && !isError && (
        <>
          {viewMode === "table" ? (
            /* ===== TABLE VIEW ===== */
            <Card>
              <Table>
                <TableHeader>
                  <TableRow className="border-b border-border bg-muted/30 hover:bg-muted/30">
                    {(
                      [
                        { key: "name" as SortKey, label: "Vendor Name" },
                        { key: "stage" as SortKey, label: "Stage" },
                        { key: "criticality" as SortKey, label: "Criticality" },
                        { key: "industry" as SortKey, label: "Industry" },
                        { key: "nextReview" as SortKey, label: "Next Review" },
                      ] as const
                    ).map((col) => (
                      <TableHead
                        key={col.key}
                        onClick={() => handleSort(col.key)}
                        className="cursor-pointer select-none hover:text-foreground transition-colors"
                      >
                        <span className="inline-flex items-center">
                          {col.label}
                          <SortIcon column={col.key} />
                        </span>
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredVendors.map((vendor) => (
                    <TableRow
                      key={vendor.id}
                      onClick={() => navigate(`/vendors/${vendor.id}`)}
                      className="cursor-pointer"
                    >
                      {/* Name */}
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div
                            className={cn(
                              "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold text-white",
                              initialBgColor(vendor.name)
                            )}
                          >
                            {vendor.name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-medium text-foreground">
                              {vendor.name}
                            </p>
                            {vendor.website && (
                              <p className="text-xs text-muted-foreground">
                                {vendor.website}
                              </p>
                            )}
                          </div>
                        </div>
                      </TableCell>

                      {/* Stage */}
                      <TableCell>
                        <StatusBadge variant={stageVariant(vendor.stage as Stage)}>
                          {vendor.stage}
                        </StatusBadge>
                      </TableCell>

                      {/* Criticality */}
                      <TableCell>
                        <StatusBadge variant={criticalityVariant(vendor.criticality as Criticality)}>
                          {vendor.criticality}
                        </StatusBadge>
                      </TableCell>

                      {/* Industry */}
                      <TableCell>
                        <span className="text-foreground">
                          {vendor.industry ?? "-"}
                        </span>
                      </TableCell>

                      {/* Next Review */}
                      <TableCell>
                        {vendor.nextReviewDate ? (
                          <div className="flex items-center gap-1.5 text-muted-foreground">
                            <Calendar className="h-3.5 w-3.5" />
                            <span className="text-foreground">
                              {formatDate(vendor.nextReviewDate)}
                            </span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {filteredVendors.length === 0 && (
                <EmptyState
                  icon={Search}
                  title="No vendors found"
                  description="Try adjusting your search or filters."
                />
              )}
            </Card>
          ) : (
            /* ===== CARD VIEW ===== */
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredVendors.map((vendor) => (
                <Card
                  key={vendor.id}
                  onClick={() => navigate(`/vendors/${vendor.id}`)}
                  className="cursor-pointer transition-colors hover:border-primary/30"
                >
                  <CardContent className="p-5">
                    {/* Card Header */}
                    <div className="mb-4 flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className={cn(
                            "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-sm font-bold text-white",
                            initialBgColor(vendor.name)
                          )}
                        >
                          {vendor.name.charAt(0)}
                        </div>
                        <div>
                          <h3 className="font-semibold text-foreground">
                            {vendor.name}
                          </h3>
                          <p className="text-xs text-muted-foreground">
                            {vendor.industry ?? "-"}
                          </p>
                        </div>
                      </div>
                      <StatusBadge variant={stageVariant(vendor.stage as Stage)}>
                        {vendor.stage}
                      </StatusBadge>
                    </div>

                    {/* Details */}
                    <div className="mb-4 grid grid-cols-2 gap-3">
                      {/* Criticality */}
                      <div className="rounded-md bg-muted/30 p-3">
                        <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                          Criticality
                        </p>
                        <StatusBadge variant={criticalityVariant(vendor.criticality as Criticality)}>
                          {vendor.criticality}
                        </StatusBadge>
                      </div>

                      {/* Next Review */}
                      <div className="rounded-md bg-muted/30 p-3">
                        <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                          Next Review
                        </p>
                        {vendor.nextReviewDate ? (
                          <div className="flex items-center gap-1.5">
                            <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                            <span className="text-sm font-medium text-foreground">
                              {formatDate(vendor.nextReviewDate)}
                            </span>
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground">-</span>
                        )}
                      </div>
                    </div>

                    {/* Card Footer */}
                    <div className="flex items-center justify-between border-t border-border/50 pt-3">
                      {vendor.headquartersCountry ? (
                        <span className="text-xs text-muted-foreground">
                          {vendor.headquartersCountry}
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">-</span>
                      )}
                      {vendor.website ? (
                        <span className="text-xs text-muted-foreground truncate max-w-[160px]">
                          {vendor.website}
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">-</span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}

              {filteredVendors.length === 0 && (
                <div className="col-span-full">
                  <EmptyState
                    icon={Search}
                    title="No vendors found"
                    description="Try adjusting your search or filters."
                  />
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
