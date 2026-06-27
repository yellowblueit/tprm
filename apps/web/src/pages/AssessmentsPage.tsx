import { Link, useNavigate } from "react-router";
import {
  Building2,
  BarChart3,
  Layers,
  BrainCircuit,
  ArrowUpRight,
  Calendar,
} from "lucide-react";
import { cn, formatDate } from "@/lib/utils";
import { PageHeader } from "@/components/common/PageHeader";
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

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type MaturityLevel =
  | "Not Assessed"
  | "Initial"
  | "Developing"
  | "Defined"
  | "Managed"
  | "Optimizing";

type AIStatus = "Complete" | "In Progress" | "Not Started";

interface VendorAssessment {
  id: string;
  name: string;
  domainsAssessed: number;
  totalDomains: number;
  maturity: MaturityLevel;
  lastAssessment: string;
  aiStatus: AIStatus;
}

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------

const summaryMetrics = [
  { label: "Vendors Assessed", value: "8/12", icon: Building2 },
  { label: "Average Maturity", value: "Developing", icon: BarChart3 },
  { label: "Domains Covered", value: "14/18", icon: Layers },
  { label: "AI Assessments Run", value: "6", icon: BrainCircuit },
];

const vendorAssessments: VendorAssessment[] = [
  {
    id: "v-001",
    name: "CloudVault Technologies",
    domainsAssessed: 18,
    totalDomains: 18,
    maturity: "Managed",
    lastAssessment: "2026-06-15",
    aiStatus: "Complete",
  },
  {
    id: "v-002",
    name: "DataFlow Analytics",
    domainsAssessed: 14,
    totalDomains: 18,
    maturity: "Developing",
    lastAssessment: "2026-06-02",
    aiStatus: "Complete",
  },
  {
    id: "v-004",
    name: "PayStream Inc.",
    domainsAssessed: 16,
    totalDomains: 18,
    maturity: "Defined",
    lastAssessment: "2026-05-28",
    aiStatus: "Complete",
  },
  {
    id: "v-005",
    name: "GreenLeaf HR",
    domainsAssessed: 10,
    totalDomains: 18,
    maturity: "Initial",
    lastAssessment: "2026-05-10",
    aiStatus: "In Progress",
  },
  {
    id: "v-007",
    name: "OfficePro Supplies",
    domainsAssessed: 6,
    totalDomains: 18,
    maturity: "Not Assessed",
    lastAssessment: "2026-04-22",
    aiStatus: "Not Started",
  },
  {
    id: "v-009",
    name: "TransGlobal Logistics",
    domainsAssessed: 12,
    totalDomains: 18,
    maturity: "Developing",
    lastAssessment: "2026-06-18",
    aiStatus: "Complete",
  },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const maturityVariant = (level: MaturityLevel) => {
  const map: Record<
    MaturityLevel,
    "default" | "critical" | "warning" | "medium" | "info" | "success"
  > = {
    "Not Assessed": "default",
    Initial: "critical",
    Developing: "warning",
    Defined: "medium",
    Managed: "info",
    Optimizing: "success",
  };
  return map[level];
};

const aiStatusVariant = (status: AIStatus) => {
  const map: Record<AIStatus, "success" | "warning" | "default"> = {
    Complete: "success",
    "In Progress": "warning",
    "Not Started": "default",
  };
  return map[status];
};

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export default function AssessmentsPage() {
  const navigate = useNavigate();

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

      {/* Vendor Assessments Table */}
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
              <TableHead>Domains Assessed</TableHead>
              <TableHead>Overall Maturity</TableHead>
              <TableHead>Last Assessment</TableHead>
              <TableHead>AI Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {vendorAssessments.map((vendor) => {
              const progress =
                (vendor.domainsAssessed / vendor.totalDomains) * 100;
              return (
                <TableRow key={vendor.id}>
                  <TableCell>
                    <span className="font-medium text-foreground">
                      {vendor.name}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <span className="text-foreground">
                        {vendor.domainsAssessed}/{vendor.totalDomains}
                      </span>
                      <div className="h-1.5 w-20 overflow-hidden rounded-md bg-muted">
                        <div
                          className={cn(
                            "h-full rounded-md",
                            progress === 100
                              ? "bg-green-500"
                              : progress >= 50
                                ? "bg-amber-500"
                                : "bg-red-500"
                          )}
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <StatusBadge variant={maturityVariant(vendor.maturity)}>
                      {vendor.maturity}
                    </StatusBadge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <Calendar className="h-3.5 w-3.5" />
                      <span className="text-foreground">
                        {formatDate(vendor.lastAssessment)}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <StatusBadge variant={aiStatusVariant(vendor.aiStatus)}>
                      {vendor.aiStatus}
                    </StatusBadge>
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
              );
            })}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
