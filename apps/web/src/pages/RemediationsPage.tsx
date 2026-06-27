import { useState } from "react";
import { toast } from "sonner";
import {
  Plus,
  AlertCircle,
  Clock,
  Hourglass,
  AlertTriangle,
  Calendar,
} from "lucide-react";
import { cn, formatDate } from "@/lib/utils";
import { PageHeader } from "@/components/common/PageHeader";
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

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type RemediationStatus = "Open" | "In Progress" | "Awaiting Vendor" | "Overdue";
type Priority = "Critical" | "High" | "Medium" | "Low";
type FilterChip = "All" | RemediationStatus;

interface Remediation {
  id: string;
  title: string;
  vendor: string;
  priority: Priority;
  status: RemediationStatus;
  domain: string;
  dueDate: string;
  assignee: string;
}

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------

const REMEDIATIONS: Remediation[] = [
  {
    id: "rem-001",
    title: "Implement MFA on admin consoles",
    vendor: "CloudVault Technologies",
    priority: "Critical",
    status: "Overdue",
    domain: "Access Control",
    dueDate: "2026-06-10",
    assignee: "Sarah Chen",
  },
  {
    id: "rem-002",
    title: "Patch CVE-2026-31247 in API gateway",
    vendor: "DataFlow Analytics",
    priority: "High",
    status: "In Progress",
    domain: "Vulnerability Mgmt",
    dueDate: "2026-07-15",
    assignee: "James Morton",
  },
  {
    id: "rem-003",
    title: "Update data processing agreement",
    vendor: "PayStream Inc.",
    priority: "Medium",
    status: "Awaiting Vendor",
    domain: "Legal & Compliance",
    dueDate: "2026-07-30",
    assignee: "Emily Rodriguez",
  },
  {
    id: "rem-004",
    title: "Enable encryption at rest for PII stores",
    vendor: "GreenLeaf HR",
    priority: "High",
    status: "Open",
    domain: "Data Protection",
    dueDate: "2026-08-01",
    assignee: "Michael Park",
  },
  {
    id: "rem-005",
    title: "Renew SOC 2 Type II report",
    vendor: "NetGuard Security",
    priority: "Critical",
    status: "In Progress",
    domain: "Compliance",
    dueDate: "2026-07-20",
    assignee: "Lisa Wang",
  },
  {
    id: "rem-006",
    title: "Restrict subprocessor data sharing",
    vendor: "NexGen AI Labs",
    priority: "High",
    status: "In Progress",
    domain: "Third-Party Mgmt",
    dueDate: "2026-08-10",
    assignee: "David Kim",
  },
  {
    id: "rem-007",
    title: "Deploy WAF for customer-facing portal",
    vendor: "TransGlobal Logistics",
    priority: "Low",
    status: "Awaiting Vendor",
    domain: "Network Security",
    dueDate: "2026-09-01",
    assignee: "Anna Lopez",
  },
  {
    id: "rem-008",
    title: "Complete penetration test remediation items",
    vendor: "SecureID Solutions",
    priority: "Critical",
    status: "Overdue",
    domain: "Vulnerability Mgmt",
    dueDate: "2026-06-15",
    assignee: "Robert Taylor",
  },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const priorityVariant = (p: Priority) => {
  const map: Record<Priority, "critical" | "high" | "medium" | "low"> = {
    Critical: "critical",
    High: "high",
    Medium: "medium",
    Low: "low",
  };
  return map[p];
};

const statusVariant = (s: RemediationStatus) => {
  const map: Record<RemediationStatus, "warning" | "info" | "high" | "critical"> = {
    Open: "warning",
    "In Progress": "info",
    "Awaiting Vendor": "high",
    Overdue: "critical",
  };
  return map[s];
};

const isOverdue = (status: RemediationStatus) => status === "Overdue";

const FILTER_CHIPS: FilterChip[] = [
  "All",
  "Open",
  "In Progress",
  "Awaiting Vendor",
  "Overdue",
];

const STAT_CARDS: { label: RemediationStatus; icon: typeof AlertCircle }[] = [
  { label: "Open", icon: AlertCircle },
  { label: "In Progress", icon: Clock },
  { label: "Awaiting Vendor", icon: Hourglass },
  { label: "Overdue", icon: AlertTriangle },
];

const statusCounts: Record<RemediationStatus, number> = {
  Open: REMEDIATIONS.filter((r) => r.status === "Open").length,
  "In Progress": REMEDIATIONS.filter((r) => r.status === "In Progress").length,
  "Awaiting Vendor": REMEDIATIONS.filter((r) => r.status === "Awaiting Vendor").length,
  Overdue: REMEDIATIONS.filter((r) => r.status === "Overdue").length,
};

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export default function RemediationsPage() {
  const [activeFilter, setActiveFilter] = useState<FilterChip>("All");

  const filtered =
    activeFilter === "All"
      ? REMEDIATIONS
      : REMEDIATIONS.filter((r) => r.status === activeFilter);

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
                "Remediation creation form will be available with API integration.",
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
            key={chip}
            onClick={() => setActiveFilter(chip)}
            className={cn(
              "rounded-md px-4 py-1.5 text-sm font-medium transition-colors",
              activeFilter === chip
                ? "bg-primary text-primary-foreground"
                : "border border-border bg-card text-muted-foreground hover:text-foreground hover:border-primary/40"
            )}
          >
            {chip}
          </button>
        ))}
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {STAT_CARDS.map((card) => (
          <MetricCard
            key={card.label}
            label={card.label}
            value={statusCounts[card.label]}
            icon={card.icon}
          />
        ))}
      </div>

      {/* Remediations Table */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              {["Title", "Vendor", "Priority", "Status", "Domain", "Due Date", "Assignee"].map(
                (col) => (
                  <TableHead key={col}>{col}</TableHead>
                )
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((rem) => (
              <TableRow key={rem.id}>
                <TableCell className="font-medium text-foreground">
                  {rem.title}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {rem.vendor}
                </TableCell>
                <TableCell>
                  <StatusBadge variant={priorityVariant(rem.priority)}>
                    {rem.priority}
                  </StatusBadge>
                </TableCell>
                <TableCell>
                  <StatusBadge variant={statusVariant(rem.status)}>
                    {rem.status}
                  </StatusBadge>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {rem.domain}
                </TableCell>
                <TableCell>
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
                </TableCell>
                <TableCell className="text-foreground">
                  {rem.assignee}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {filtered.length === 0 && (
          <EmptyState
            icon={AlertCircle}
            title="No remediations found"
            description="Try adjusting your filters."
          />
        )}
      </Card>
    </div>
  );
}
