import { useState } from "react";
import {
  AlertTriangle,
  ShieldAlert,
  CheckCircle2,
  Clock,
  Eye,
  XCircle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { PageLoadingSkeleton } from "@/components/common/LoadingSkeleton";
import { StatusBadge } from "@/components/common/StatusBadge";
import { cn } from "@/lib/utils";
import {
  Button,
  MetricCard,
  Card,
  CardContent,
  EmptyState,
} from "@/components/ui";
import { useAlerts, useUpdateAlert } from "@/hooks/use-monitoring";

// ---------------------------------------------------------------------------
// Filter types
// ---------------------------------------------------------------------------

type FilterChip = "all" | "CRITICAL" | "HIGH" | "MEDIUM" | "acknowledged" | "dismissed";

const FILTERS: { id: FilterChip; label: string }[] = [
  { id: "all", label: "All" },
  { id: "CRITICAL", label: "Critical" },
  { id: "HIGH", label: "High" },
  { id: "MEDIUM", label: "Medium" },
  { id: "acknowledged", label: "Acknowledged" },
  { id: "dismissed", label: "Dismissed" },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const severityVariant = (severity: string) => {
  const map: Record<string, "critical" | "high" | "medium" | "low" | "default"> = {
    CRITICAL: "critical",
    HIGH: "high",
    MEDIUM: "medium",
    LOW: "low",
    INFORMATIONAL: "default",
  };
  return map[severity?.toUpperCase()] ?? ("default" as const);
};

const formatSeverity = (severity: string) => {
  if (!severity) return severity;
  return severity.charAt(0).toUpperCase() + severity.slice(1).toLowerCase();
};

const formatTimeAgo = (dateStr: string) => {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffDays > 0) return `${diffDays}d ago`;
  if (diffHours > 0) return `${diffHours}h ago`;
  if (diffMins > 0) return `${diffMins}m ago`;
  return "Just now";
};

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export default function MonitoringPage() {
  const [activeFilter, setActiveFilter] = useState<FilterChip>("all");
  const [page, setPage] = useState(1);

  // Build query filters based on active filter
  const queryFilters: {
    page: number;
    pageSize: number;
    severity?: string;
    acknowledged?: boolean;
  } = {
    page,
    pageSize: 20,
  };

  if (activeFilter === "CRITICAL" || activeFilter === "HIGH" || activeFilter === "MEDIUM") {
    queryFilters.severity = activeFilter;
  } else if (activeFilter === "acknowledged") {
    queryFilters.acknowledged = true;
  }
  // "dismissed" and "all" are handled client-side since the API may not support a dismissed filter directly

  const alertsQuery = useAlerts(queryFilters);
  const updateAlertMutation = useUpdateAlert();

  const handleFilterChange = (chip: FilterChip) => {
    setActiveFilter(chip);
    setPage(1);
  };

  if (alertsQuery.isLoading) return <PageLoadingSkeleton />;

  const allAlerts = alertsQuery.data?.data ?? [];
  const meta = alertsQuery.data?.meta;

  // Client-side filter for "dismissed" since the API might not have a dismissed filter
  const filteredAlerts =
    activeFilter === "dismissed"
      ? allAlerts.filter((a) => a.dismissed)
      : allAlerts;

  // Compute summary stats from visible data
  const activeCount = allAlerts.filter((a) => !a.acknowledged && !a.dismissed).length;
  const criticalCount = allAlerts.filter(
    (a) => a.severity?.toUpperCase() === "CRITICAL" && !a.dismissed
  ).length;
  const acknowledgedCount = allAlerts.filter((a) => a.acknowledged && !a.dismissed).length;

  const summaryStats = [
    { label: "Active Alerts", value: activeCount, icon: AlertTriangle },
    { label: "Critical", value: criticalCount, icon: ShieldAlert },
    { label: "Acknowledged", value: acknowledgedCount, icon: CheckCircle2 },
    { label: "Total on Page", value: allAlerts.length, icon: Clock },
  ];

  function handleAcknowledge(id: string) {
    updateAlertMutation.mutate({ id, acknowledged: true });
  }

  function handleDismiss(id: string) {
    updateAlertMutation.mutate({ id, dismissed: true });
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <PageHeader
        title="Monitoring"
        description="Continuous monitoring of third-party risk signals."
      />

      {/* Summary Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {summaryStats.map((stat) => (
          <MetricCard
            key={stat.label}
            label={stat.label}
            value={stat.value}
            icon={stat.icon}
          />
        ))}
      </div>

      {/* Filter Chips */}
      <div className="flex flex-wrap gap-2">
        {FILTERS.map((filter) => (
          <button
            key={filter.id}
            onClick={() => handleFilterChange(filter.id)}
            className={cn(
              "rounded-md px-4 py-1.5 text-sm font-medium transition-colors",
              activeFilter === filter.id
                ? "bg-primary text-primary-foreground"
                : "border border-border text-muted-foreground hover:text-foreground hover:bg-muted"
            )}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {/* Alert Feed */}
      <div className="space-y-3">
        {filteredAlerts.map((alert) => {
          const isAcknowledged = alert.acknowledged;
          const isDismissed = alert.dismissed;

          return (
            <Card
              key={alert.id}
              className={cn(isDismissed && "opacity-50")}
            >
              <CardContent className="p-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    <StatusBadge variant={severityVariant(alert.severity)}>
                      {formatSeverity(alert.severity)}
                    </StatusBadge>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-foreground">
                        {alert.title}
                      </p>
                      <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                        <span>{alert.vendorId}</span>
                        <span>{formatTimeAgo(alert.createdAt)}</span>
                        {alert.type && <span>{alert.type}</span>}
                      </div>
                      <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                        {alert.description}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    {!isAcknowledged && !isDismissed && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleAcknowledge(alert.id)}
                        disabled={updateAlertMutation.isPending}
                      >
                        <Eye className="h-3.5 w-3.5" />
                        Acknowledge
                      </Button>
                    )}
                    {!isDismissed && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDismiss(alert.id)}
                        disabled={updateAlertMutation.isPending}
                      >
                        <XCircle className="h-3.5 w-3.5" />
                        Dismiss
                      </Button>
                    )}
                    {isAcknowledged && !isDismissed && (
                      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-green-500">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Acknowledged
                      </span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}

        {filteredAlerts.length === 0 && (
          <Card>
            <EmptyState
              icon={AlertTriangle}
              title="No alerts match the selected filter"
              description="Try selecting a different filter to view alerts."
            />
          </Card>
        )}
      </div>

      {/* Pagination */}
      {meta && meta.totalPages > 1 && (
        <div className="flex items-center justify-between">
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
    </div>
  );
}
