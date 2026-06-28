import { Link, useNavigate } from "react-router";
import {
  Building2,
  BarChart3,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  Calendar,
} from "lucide-react";
import { formatDate } from "@/lib/utils";
import { PageHeader } from "@/components/common/PageHeader";
import { PageLoadingSkeleton } from "@/components/common/LoadingSkeleton";
import { StatusBadge } from "@/components/common/StatusBadge";
import {
  Button,
  MetricCard,
  Card,
  CardHeader,
  CardTitle,
  Table,
  TableHeader,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
} from "@/components/ui";
import { useAssessmentSummary } from "@/hooks/use-assessments";
import { useVendors } from "@/hooks/use-vendors";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const stageVariant = (stage: string) => {
  const map: Record<string, "info" | "warning" | "success"> = {
    Evaluating: "info",
    Screening: "warning",
    Onboarded: "success",
  };
  return map[stage] ?? ("default" as const);
};

const criticalityVariant = (c: string) => {
  const map: Record<string, "critical" | "high" | "medium" | "low"> = {
    Critical: "critical",
    High: "high",
    Medium: "medium",
    Low: "low",
  };
  return map[c] ?? ("default" as const);
};

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export default function AssessmentsPage() {
  const navigate = useNavigate();

  const summaryQuery = useAssessmentSummary();
  const vendorsQuery = useVendors({ pageSize: 50 });

  if (summaryQuery.isLoading || vendorsQuery.isLoading) {
    return <PageLoadingSkeleton />;
  }

  const summary = summaryQuery.data;
  const vendors = vendorsQuery.data?.data ?? [];

  const summaryMetrics = [
    {
      label: "Total Assessments",
      value: summary?.total ?? 0,
      icon: Building2,
    },
    {
      label: "Completed",
      value: summary?.completed ?? 0,
      icon: CheckCircle2,
    },
    {
      label: "In Progress",
      value: summary?.inProgress ?? 0,
      icon: Clock,
    },
    {
      label: "Pending",
      value: summary?.pending ?? 0,
      icon: BarChart3,
    },
  ];

  return (
    <div className="space-y-5">
      {/* Header */}
      <PageHeader
        title="Assessments"
        description="Security domain assessments across your vendor portfolio."
      />

      {/* Summary Metrics */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {summaryMetrics.map((metric) => (
          <MetricCard
            key={metric.label}
            label={metric.label}
            value={metric.value}
            icon={metric.icon}
          />
        ))}
      </div>

      {/* Vendor Table */}
      <Card>
        <CardHeader>
          <CardTitle>Vendor Assessment Progress</CardTitle>
          <Link
            to="/vendors"
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            View all <ArrowUpRight className="h-3 w-3" />
          </Link>
        </CardHeader>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Vendor Name</TableHead>
              <TableHead>Stage</TableHead>
              <TableHead>Criticality</TableHead>
              <TableHead>Next Review Date</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {vendors.map((vendor) => (
              <TableRow key={vendor.id}>
                <TableCell>
                  <span className="font-medium text-foreground">
                    {vendor.name}
                  </span>
                </TableCell>
                <TableCell>
                  <StatusBadge variant={stageVariant(vendor.stage)}>
                    {vendor.stage}
                  </StatusBadge>
                </TableCell>
                <TableCell>
                  <StatusBadge variant={criticalityVariant(vendor.criticality)}>
                    {vendor.criticality}
                  </StatusBadge>
                </TableCell>
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
                <TableCell>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => navigate(`/vendors/${vendor.id}`)}
                  >
                    View
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
