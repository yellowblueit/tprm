import { useState } from "react";
import {
  AlertTriangle,
  ShieldAlert,
  CheckCircle2,
  Clock,
  Eye,
  XCircle,
} from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { StatusBadge } from "@/components/common/StatusBadge";
import { cn } from "@/lib/utils";
import {
  Button,
  MetricCard,
  Card,
  CardContent,
  EmptyState,
} from "@/components/ui";

// ---------------------------------------------------------------------------
// Filter types
// ---------------------------------------------------------------------------

type FilterChip = "all" | "critical" | "high" | "medium" | "acknowledged" | "dismissed";

const FILTERS: { id: FilterChip; label: string }[] = [
  { id: "all", label: "All" },
  { id: "critical", label: "Critical" },
  { id: "high", label: "High" },
  { id: "medium", label: "Medium" },
  { id: "acknowledged", label: "Acknowledged" },
  { id: "dismissed", label: "Dismissed" },
];

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------

const summaryStats = [
  { label: "Active Alerts", value: 12, icon: AlertTriangle },
  { label: "Critical", value: 2, icon: ShieldAlert },
  { label: "Acknowledged", value: 5, icon: CheckCircle2 },
  { label: "Last Scan", value: "Today 06:00 UTC", icon: Clock },
];

type AlertSeverity = "critical" | "high" | "medium" | "low";
type AlertStatus = "active" | "acknowledged" | "dismissed";

interface MonitoringAlert {
  id: number;
  severity: AlertSeverity;
  title: string;
  vendor: string;
  detected: string;
  description: string;
  status: AlertStatus;
}

const alerts: MonitoringAlert[] = [
  {
    id: 1,
    severity: "critical",
    title: "Data Breach Reported",
    vendor: "DataVault Inc.",
    detected: "2026-06-27",
    description: "Major data breach disclosed affecting customer PII across multiple regions.",
    status: "active",
  },
  {
    id: 2,
    severity: "critical",
    title: "Security Incident Disclosed",
    vendor: "CloudSync Ltd.",
    detected: "2026-06-26",
    description: "Unauthorized access to production systems confirmed by vendor security team.",
    status: "active",
  },
  {
    id: 3,
    severity: "high",
    title: "SSL Certificate Expiring",
    vendor: "NetOps Pro",
    detected: "2026-06-25",
    description: "Primary SSL certificate expires in 7 days with no renewal detected.",
    status: "acknowledged",
  },
  {
    id: 4,
    severity: "high",
    title: "SOC 2 Report Expired",
    vendor: "SecureHost Co.",
    detected: "2026-06-24",
    description: "Annual SOC 2 Type II report has expired without a renewal submission.",
    status: "active",
  },
  {
    id: 5,
    severity: "medium",
    title: "Negative News Mention",
    vendor: "PayStream Global",
    detected: "2026-06-23",
    description: "Vendor mentioned in regulatory enforcement action news coverage.",
    status: "acknowledged",
  },
  {
    id: 6,
    severity: "medium",
    title: "SLA Violation Detected",
    vendor: "InfraScale Corp.",
    detected: "2026-06-22",
    description: "Uptime dropped below 99.9% SLA threshold for the third consecutive day.",
    status: "active",
  },
  {
    id: 7,
    severity: "low",
    title: "Subprocessor Change",
    vendor: "AnalyticsBridge",
    detected: "2026-06-21",
    description: "Vendor added a new subprocessor in a jurisdiction requiring review.",
    status: "acknowledged",
  },
  {
    id: 8,
    severity: "medium",
    title: "Insurance Policy Lapsing",
    vendor: "LogiVault Systems",
    detected: "2026-06-20",
    description: "Cyber liability insurance policy set to expire within 30 days.",
    status: "dismissed",
  },
];

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export default function MonitoringPage() {
  const [activeFilter, setActiveFilter] = useState<FilterChip>("all");
  const [alertStates, setAlertStates] = useState<Record<number, AlertStatus>>(
    () => Object.fromEntries(alerts.map((a) => [a.id, a.status]))
  );

  const filteredAlerts = alerts.filter((alert) => {
    const status = alertStates[alert.id];
    if (activeFilter === "all") return true;
    if (activeFilter === "acknowledged") return status === "acknowledged";
    if (activeFilter === "dismissed") return status === "dismissed";
    return alert.severity === activeFilter && status !== "dismissed";
  });

  function handleAcknowledge(id: number) {
    setAlertStates((prev) => ({ ...prev, [id]: "acknowledged" }));
  }

  function handleDismiss(id: number) {
    setAlertStates((prev) => ({ ...prev, [id]: "dismissed" }));
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
            onClick={() => setActiveFilter(filter.id)}
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
          const status = alertStates[alert.id];
          return (
            <Card
              key={alert.id}
              className={cn(status === "dismissed" && "opacity-50")}
            >
              <CardContent className="p-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    <StatusBadge variant={alert.severity}>
                      {alert.severity.charAt(0).toUpperCase() + alert.severity.slice(1)}
                    </StatusBadge>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-foreground">
                        {alert.title}
                      </p>
                      <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                        <span>{alert.vendor}</span>
                        <span>Detected {alert.detected}</span>
                      </div>
                      <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                        {alert.description}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    {status !== "acknowledged" && status !== "dismissed" && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleAcknowledge(alert.id)}
                      >
                        <Eye className="h-3.5 w-3.5" />
                        Acknowledge
                      </Button>
                    )}
                    {status !== "dismissed" && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDismiss(alert.id)}
                      >
                        <XCircle className="h-3.5 w-3.5" />
                        Dismiss
                      </Button>
                    )}
                    {status === "acknowledged" && (
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
    </div>
  );
}
