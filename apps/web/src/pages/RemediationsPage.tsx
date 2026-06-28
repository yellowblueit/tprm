import { useState } from "react";
import { toast } from "sonner";
import {
  Plus,
  AlertCircle,
  Clock,
  Hourglass,
  AlertTriangle,
  Calendar,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { cn, formatDate } from "@/lib/utils";
import { PageHeader } from "@/components/common/PageHeader";
import { PageLoadingSkeleton } from "@/components/common/LoadingSkeleton";
import { StatusBadge } from "@/components/common/StatusBadge";
import {
  Button,
  MetricCard,
  Card,
  Table,
  TableHeader,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  EmptyState,
} from "@/components/ui";
import { useRemediations } from "@/hooks/use-remediations";

// ---------------------------------------------------------------------------
// Types & Constants
// ---------------------------------------------------------------------------

type FilterChip = "All" | "OPEN" | "IN_PROGRESS" | "AWAITING_VENDOR" | "OVERDUE";

const FILTER_CHIPS: { id: FilterChip; label: string }[] = [
  { id: "All", label: "All" },
  { id: "OPEN", label: "Open" },
  { id: "IN_PROGRESS", label: "In Progress" },
  { id: "AWAITING_VENDOR", label: "Awaiting Vendor" },
  { id: "OVERDUE", label: "Overdue" },
];

const STAT_CARDS: { status: string; label: string; icon: typeof AlertCircle }[] = [
  { status: "OPEN", label: "Open", icon: AlertCircle },
  { status: "IN_PROGRESS", label: "In Progress", icon: Clock },
  { status: "AWAITING_VENDOR", label: "Awaiting Vendor", icon: Hourglass },
  { status: "OVERDUE", label: "Overdue", icon: AlertTriangle },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const priorityVariant = (p: string) => {
  const map: Record<string, "critical" | "high" | "medium" | "low"> = {
    CRITICAL: "critical",
    HIGH: "high",
    MEDIUM: "medium",
    LOW: "low",
  };
  return map[p?.toUpperCase()] ?? ("default" as const);
};

const statusVariant = (s: string) => {
  const map: Record<string, "warning" | "info" | "high" | "critical"> = {
    OPEN: "warning",
    IN_PROGRESS: "info",
    AWAITING_VENDOR: "high",
    OVERDUE: "critical",
    RESOLVED: "info",
    CLOSED: "info",
  };
  return map[s?.toUpperCase()] ?? ("default" as const);
};

const formatStatus = (s: string) => {
  const map: Record<string, string> = {
    OPEN: "Open",
    IN_PROGRESS: "In Progress",
    AWAITING_VENDOR: "Awaiting Vendor",
    OVERDUE: "Overdue",
    RESOLVED: "Resolved",
    CLOSED: "Closed",
  };
  return map[s?.toUpperCase()] ?? s;
};

const formatPriority = (p: string) => {
  const map: Record<string, string> = {
    CRITICAL: "Critical",
    HIGH: "High",
    MEDIUM: "Medium",
    LOW: "Low",
  };
  return map[p?.toUpperCase()] ?? p;
};

const isOverdue = (status: string) => status?.toUpperCase() === "OVERDUE";

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export default function RemediationsPage() {
  const [activeFilter, setActiveFilter] = useState<FilterChip>("All");
  const [page, setPage] = useState(1);

  const statusFilter = activeFilter === "All" ? undefined : activeFilter;
  const remediationsQuery = useRemediations({
    page,
    pageSize: 20,
    status: statusFilter,
  });

  // Reset page when filter changes
  const handleFilterChange = (chip: FilterChip) => {
    setActiveFilter(chip);
    setPage(1);
  };

  if (remediationsQuery.isLoading) return <PageLoadingSkeleton />;

  const remediations = remediationsQuery.data?.data ?? [];
  const meta = remediationsQuery.data?.meta;

  // Compute status counts from current data (approximate from current page)
  const statusCounts: Record<string, number> = {};
  for (const rem of remediations) {
    const key = rem.status?.toUpperCase() ?? "UNKNOWN";
    statusCounts[key] = (statusCounts[key] ?? 0) + 1;
  }

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <PageHeader
        title="Remediations"
        description="Track and manage remediation plans across vendors."
      >
        <Button
          onClick={() =>
            toast.info("Add remediation", {
              description:
                "Remediation creation form will be available soon.",
            })
          }
        >
          <Plus className="h-4 w-4" />
          Add Remediation
        </Button>
      </PageHeader>

      {/* Filter Chips */}
      <div className="flex flex-wrap gap-2">
        {FILTER_CHIPS.map((chip) => (
          <button
            key={chip.id}
            onClick={() => handleFilterChange(chip.id)}
            className={cn(
              "rounded-md px-4 py-1.5 text-sm font-medium transition-colors",
              activeFilter === chip.id
                ? "bg-primary text-primary-foreground"
                : "border border-border bg-card text-muted-foreground hover:text-foreground hover:border-primary/40"
            )}
          >
            {chip.label}
          </button>
        ))}
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {STAT_CARDS.map((card) => (
          <MetricCard
            key={card.status}
            label={card.label}
            value={statusCounts[card.status] ?? 0}
            icon={card.icon}
          />
        ))}
      </div>

      {/* Remediations Table */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              {["Title", "Vendor", "Priority", "Status", "Due Date"].map(
                (col) => (
                  <TableHead key={col}>{col}</TableHead>
                )
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {remediations.map((rem) => (
              <TableRow key={rem.id}>
                <TableCell className="font-medium text-foreground">
                  {rem.title}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {rem.vendorId}
                </TableCell>
                <TableCell>
                  <StatusBadge variant={priorityVariant(rem.priority)}>
                    {formatPriority(rem.priority)}
                  </StatusBadge>
                </TableCell>
                <TableCell>
                  <StatusBadge variant={statusVariant(rem.status)}>
                    {formatStatus(rem.status)}
                  </StatusBadge>
                </TableCell>
                <TableCell>
                  {rem.dueDate ? (
                    <div className="flex items-center gap-1.5">
                      <Calendar
                        className={cn(
                          "h-3.5 w-3.5",
                          isOverdue(rem.status) ? "text-red-500" : "text-muted-foreground"
                        )}
                      />
                      <span
                        className={cn(
                          isOverdue(rem.status) ? "text-red-500 font-medium" : "text-foreground"
                        )}
                      >
                        {formatDate(rem.dueDate)}
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

        {remediations.length === 0 && (
          <EmptyState
            icon={AlertCircle}
            title="No remediations found"
            description="Try adjusting your filters."
          />
        )}

        {/* Pagination */}
        {meta && meta.totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-border px-4 py-3">
            <p className="text-sm text-muted-foreground">
              Page {meta.page} of {meta.totalPages} ({meta.total} total)
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
              <Button
                variant="secondary"
                size="sm"
                disabled={page >= meta.totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
