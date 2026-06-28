import { useState, useRef } from "react";
import { useParams, Link } from "react-router";
import { toast } from "sonner";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  ExternalLink,
  Globe,
  MapPin,
  Users,
  Building2,
  Calendar,
  Sparkles,
  RotateCcw,
  Pencil,
  Upload,
  FileText,
  FileSpreadsheet,
  Image,
  ChevronRight,
  Plus,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Shield,
  Activity,
  Eye,
  TrendingDown,
  Bell,
  RefreshCw,
  Loader2,
} from "lucide-react";
import { cn, formatDate, riskColor, riskLabel, titleCase } from "@/lib/utils";
import { PageHeader } from "@/components/common/PageHeader";
import { PageLoadingSkeleton } from "@/components/common/LoadingSkeleton";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  Table,
  TableHeader,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
} from "@/components/ui/data-table";
import { SECURITY_DOMAINS } from "@tprm/shared";
import { useVendor, type Vendor } from "@/hooks/use-vendors";
import { useArtifacts } from "@/hooks/use-artifacts";
import { useLatestRiskScore } from "@/hooks/use-risk-scores";
import { useAssessments } from "@/hooks/use-assessments";
import { useVendorRemediations } from "@/hooks/use-remediations";
import { useVendorCompliance } from "@/hooks/use-compliance";
import { useVendorSubprocessors } from "@/hooks/use-subprocessors";
import { useVendorAlerts } from "@/hooks/use-monitoring";
import { useReviewCycles } from "@/hooks/use-reviews";
import { useVendorActivity } from "@/hooks/use-activity";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type TabId =
  | "overview"
  | "artifacts"
  | "risk"
  | "assessment"
  | "remediations"
  | "compliance"
  | "subprocessors"
  | "monitoring"
  | "reviews";

interface TabDef {
  id: TabId;
  label: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const TABS: TabDef[] = [
  { id: "overview", label: "Overview" },
  { id: "artifacts", label: "Artifacts" },
  { id: "risk", label: "Risk" },
  { id: "assessment", label: "Assessment" },
  { id: "remediations", label: "Remediations" },
  { id: "compliance", label: "Compliance" },
  { id: "subprocessors", label: "Subprocessors" },
  { id: "monitoring", label: "Monitoring" },
  { id: "reviews", label: "Reviews" },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const maturityColor = (level: string) => {
  const map: Record<string, string> = {
    Initial: "text-red-400 bg-red-950 border-red-900/50",
    Developing: "text-orange-400 bg-orange-950 border-orange-900/50",
    Defined: "text-yellow-400 bg-yellow-950 border-yellow-900/50",
    Managed: "text-blue-400 bg-blue-950 border-blue-900/50",
    Optimizing: "text-green-400 bg-green-950 border-green-900/50",
  };
  return map[level] ?? "text-muted-foreground bg-muted border-border";
};

const getInitials = (name: string) =>
  name
    .split(" ")
    .map((part) => part.charAt(0))
    .join("")
    .toUpperCase()
    .slice(0, 2);

// ---------------------------------------------------------------------------
// RiskGauge SVG Component (static -- no motion)
// ---------------------------------------------------------------------------

function RiskGauge({
  score,
  label,
  size = 130,
}: {
  score: number;
  label: string;
  size?: number;
}) {
  const radius = (size - 20) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;
  const color = riskColor(score);
  const level = riskLabel(score);

  return (
    <div className="flex flex-col items-center">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <div className="relative">
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth="8"
            className="text-muted/20"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold text-foreground">
            {score}
          </span>
          <span className="text-[10px] text-muted-foreground">{level}</span>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tab: Overview
// ---------------------------------------------------------------------------

function OverviewTab({ vendor, vendorId }: { vendor: Vendor; vendorId: string }) {
  const activityQuery = useVendorActivity(vendorId, 10);
  const inherentRisk = vendor.riskScores?.[0]?.inherentRiskScore ?? 0;
  const residualRisk = vendor.riskScores?.[0]?.residualRiskScore ?? 0;

  const activityItems = activityQuery.data ?? [];

  return (
    <div className="space-y-5">
      {/* Risk Gauges */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <Card className="flex items-center justify-center p-6">
          <RiskGauge score={inherentRisk} label="Inherent Risk" size={160} />
        </Card>
        <Card className="flex items-center justify-center p-6">
          <RiskGauge score={residualRisk} label="Residual Risk" size={160} />
        </Card>
      </div>

      {/* Vendor Info */}
      <Card>
        <CardHeader>
          <CardTitle>Vendor Information</CardTitle>
        </CardHeader>
        <CardContent>
          {vendor.description && (
            <p className="mb-4 text-sm text-muted-foreground">{vendor.description}</p>
          )}
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <div>
              <p className="text-xs text-muted-foreground">Industry</p>
              <p className="text-sm font-medium text-foreground">{vendor.industry ?? "---"}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">HQ Country</p>
              <p className="text-sm font-medium text-foreground">{vendor.headquartersCountry ?? "---"}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Employees</p>
              <p className="text-sm font-medium text-foreground">{vendor.employeeCount ?? "---"}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Year Founded</p>
              <p className="text-sm font-medium text-foreground">{vendor.yearFounded ?? "---"}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {activityQuery.isLoading ? (
            <div className="flex items-center justify-center py-8 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin mr-2" />
              Loading activity...
            </div>
          ) : activityItems.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No recent activity.</p>
          ) : (
            activityItems.map((item) => (
              <div
                key={item.id}
                className="flex items-start gap-3"
              >
                <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-muted">
                  <Activity className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">{item.action}</p>
                  <p className="text-xs text-muted-foreground">
                    {item.entityType}{item.entityId ? ` (${item.entityId})` : ""}
                  </p>
                </div>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {formatDate(item.createdAt)}
                </span>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tab: Artifacts
// ---------------------------------------------------------------------------

function ArtifactsTab({ vendorId }: { vendorId: string }) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const artifactsQuery = useArtifacts(vendorId);

  const artifacts = artifactsQuery.data ?? [];

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (files && files.length > 0) {
      toast.info(`${files.length} file(s) selected`, {
        description: `${files[0].name}${files.length > 1 ? ` and ${files.length - 1} more` : ""}. Upload will be available with API integration.`,
      });
    }
    // Reset so the same file can be re-selected
    e.target.value = "";
  }

  const artifactIcon = (type: string) => {
    switch (type) {
      case "Report":
        return FileSpreadsheet;
      case "Policy":
        return FileText;
      case "Assessment":
        return Shield;
      default:
        return FileText;
    }
  };

  if (artifactsQuery.isLoading) {
    return (
      <div className="flex items-center justify-center py-12 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin mr-2" />
        Loading artifacts...
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Upload Zone */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept=".pdf,.docx,.xlsx,.png,.jpg,.jpeg"
        className="hidden"
        onChange={handleFileUpload}
      />
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        className="flex w-full items-center justify-center rounded-lg border-2 border-dashed border-border bg-muted/10 p-10 transition-colors hover:border-primary/30 hover:bg-muted/20 cursor-pointer"
      >
        <div className="text-center">
          <Upload className="mx-auto mb-3 h-10 w-10 text-muted-foreground/40" />
          <p className="text-sm font-medium text-foreground">
            Drop files here or click to upload
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            PDF, DOCX, XLSX, or image files up to 25MB
          </p>
        </div>
      </button>

      {/* Artifact List */}
      <div className="space-y-2">
        {artifacts.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">No artifacts uploaded yet.</p>
        ) : (
          artifacts.map((artifact) => {
            const Icon = artifactIcon(artifact.type);
            return (
              <div
                key={artifact.id}
                className="group flex items-center gap-4 rounded-lg border border-border bg-card p-4 transition-colors hover:bg-muted/30"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-muted">
                  <Icon className="h-5 w-5 text-muted-foreground" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">{artifact.name}</p>
                  <div className="mt-0.5 flex items-center gap-2">
                    <StatusBadge variant="default">{artifact.type}</StatusBadge>
                    <span className="text-xs text-muted-foreground">
                      Uploaded {formatDate(artifact.createdAt)}
                    </span>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tab: Risk
// ---------------------------------------------------------------------------

function RiskTab({ vendor, vendorId }: { vendor: Vendor; vendorId: string }) {
  const riskScoreQuery = useLatestRiskScore(vendorId);

  const inherentRisk = riskScoreQuery.data?.inherentRiskScore ?? vendor.riskScores?.[0]?.inherentRiskScore ?? 0;
  const residualRisk = riskScoreQuery.data?.residualRiskScore ?? vendor.riskScores?.[0]?.residualRiskScore ?? 0;
  const categoryScores = riskScoreQuery.data?.categoryScores ?? {};

  // Build breakdown rows from categoryScores
  const breakdownRows = Object.entries(categoryScores).map(([domain, score]) => ({
    domain,
    score: typeof score === "number" ? score : 0,
  }));

  return (
    <div className="space-y-5">
      {/* Large comparison */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <Card className="flex flex-col items-center justify-center p-8">
          <RiskGauge score={inherentRisk} label="Inherent Risk" size={180} />
        </Card>
        <Card className="flex flex-col items-center justify-center p-8">
          <RiskGauge score={residualRisk} label="Residual Risk" size={180} />
        </Card>
      </div>

      {/* Score Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Score Breakdown by Domain</CardTitle>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => toast.info("Recalculate", { description: "Risk score recalculation will be available with API integration." })}
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Recalculate
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          {riskScoreQuery.isLoading ? (
            <div className="flex items-center justify-center py-12 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin mr-2" />
              Loading risk data...
            </div>
          ) : breakdownRows.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No category score breakdown available. Run an assessment to generate risk scores.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Domain</TableHead>
                  <TableHead className="text-center">Score</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {breakdownRows.map((row) => (
                  <TableRow key={row.domain}>
                    <TableCell className="font-medium text-foreground">{row.domain}</TableCell>
                    <TableCell className="text-center">
                      <span
                        className="inline-flex items-center gap-1.5 font-medium"
                        style={{ color: riskColor(row.score) }}
                      >
                        {row.score}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tab: Assessment
// ---------------------------------------------------------------------------

function AssessmentTab({ vendorId }: { vendorId: string }) {
  const assessmentsQuery = useAssessments(vendorId);

  const assessments = assessmentsQuery.data ?? [];

  if (assessmentsQuery.isLoading) {
    return (
      <div className="flex items-center justify-center py-12 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin mr-2" />
        Loading assessments...
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Security Domain Assessment</h3>
          <p className="text-xs text-muted-foreground">
            {assessments.length} assessment{assessments.length !== 1 ? "s" : ""} on record
          </p>
        </div>
        <Button
          variant="primary"
          size="md"
          onClick={() => toast.info("AI Assessment", { description: "AI assessment will be available with API integration." })}
        >
          <Sparkles className="h-4 w-4" />
          Run AI Assessment
        </Button>
      </div>

      {assessments.length === 0 ? (
        <Card className="p-8">
          <p className="text-sm text-muted-foreground text-center">
            No assessments yet. Run an AI assessment or create one manually to get started.
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
          {assessments.map((assessment) => (
            <Card
              key={assessment.id}
              className="p-4 transition-colors hover:bg-muted/20"
            >
              <div className="mb-3 flex items-start justify-between">
                <div>
                  <p className="text-xs font-bold text-muted-foreground">{assessment.templateId}</p>
                  <p className="text-sm font-semibold text-foreground">
                    {titleCase(assessment.status)}
                  </p>
                </div>
                <StatusBadge
                  variant={
                    assessment.status === "completed"
                      ? "success"
                      : assessment.status === "in_progress"
                      ? "warning"
                      : "default"
                  }
                >
                  {titleCase(assessment.status)}
                </StatusBadge>
              </div>

              <div className="text-xs text-muted-foreground">
                {assessment.completedAt
                  ? `Completed ${formatDate(assessment.completedAt)}`
                  : `Created ${formatDate(assessment.createdAt)}`}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tab: Remediations
// ---------------------------------------------------------------------------

function RemediationsTab({ vendorId }: { vendorId: string }) {
  const remediationsQuery = useVendorRemediations(vendorId);

  const remediations = remediationsQuery.data?.data ?? [];

  const priorityVariant = (p: string) => {
    const map: Record<string, "critical" | "high" | "medium" | "low"> = {
      Critical: "critical",
      critical: "critical",
      High: "high",
      high: "high",
      Medium: "medium",
      medium: "medium",
      Low: "low",
      low: "low",
    };
    return map[p] ?? "default";
  };

  const statusVariant = (s: string) => {
    const map: Record<string, "success" | "warning" | "info"> = {
      Completed: "success",
      completed: "success",
      resolved: "success",
      "In Progress": "warning",
      in_progress: "warning",
      Open: "info",
      open: "info",
    };
    return map[s] ?? ("default" as "info");
  };

  if (remediationsQuery.isLoading) {
    return (
      <div className="flex items-center justify-center py-12 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin mr-2" />
        Loading remediations...
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Remediation Items</h3>
          <p className="text-xs text-muted-foreground">
            {remediations.filter((r) => r.status !== "completed" && r.status !== "resolved").length} open items
          </p>
        </div>
        <Button
          variant="primary"
          size="md"
          onClick={() => toast.info("Create remediation", { description: "Remediation creation form will be available with API integration." })}
        >
          <Plus className="h-4 w-4" />
          Create Remediation
        </Button>
      </div>

      {remediations.length === 0 ? (
        <Card className="p-8">
          <p className="text-sm text-muted-foreground text-center">
            No remediation items found for this vendor.
          </p>
        </Card>
      ) : (
        <div className="space-y-2">
          {remediations.map((item) => (
            <div
              key={item.id}
              className="flex items-center gap-4 rounded-lg border border-border bg-card p-4 transition-colors hover:bg-muted/20"
            >
              <div
                className={cn(
                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                  item.status === "completed" || item.status === "resolved"
                    ? "bg-green-950"
                    : item.status === "in_progress" || item.status === "In Progress"
                    ? "bg-yellow-950"
                    : "bg-blue-950"
                )}
              >
                {item.status === "completed" || item.status === "resolved" ? (
                  <CheckCircle2 className="h-4 w-4 text-green-400" />
                ) : item.status === "in_progress" || item.status === "In Progress" ? (
                  <Clock className="h-4 w-4 text-yellow-400" />
                ) : (
                  <AlertTriangle className="h-4 w-4 text-blue-400" />
                )}
              </div>

              <div className="flex-1">
                <p
                  className={cn(
                    "text-sm font-medium",
                    item.status === "completed" || item.status === "resolved"
                      ? "text-muted-foreground line-through"
                      : "text-foreground"
                  )}
                >
                  {item.title}
                </p>
                <div className="mt-1 flex items-center gap-2">
                  {item.dueDate && (
                    <span className="text-xs text-muted-foreground">
                      Due {formatDate(item.dueDate)}
                    </span>
                  )}
                </div>
              </div>

              <StatusBadge variant={priorityVariant(item.priority)}>
                {titleCase(item.priority)}
              </StatusBadge>
              <StatusBadge variant={statusVariant(item.status)}>
                {titleCase(item.status)}
              </StatusBadge>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tab: Compliance
// ---------------------------------------------------------------------------

function ComplianceTab({ vendorId }: { vendorId: string }) {
  const complianceQuery = useVendorCompliance(vendorId);

  const complianceItems = complianceQuery.data ?? [];

  const statusVariant = (s: string) => {
    const map: Record<string, "success" | "warning" | "info" | "default"> = {
      Compliant: "success",
      compliant: "success",
      Partial: "warning",
      partial: "warning",
      "In Review": "info",
      in_review: "info",
      "Not Assessed": "default",
      not_assessed: "default",
    };
    return map[s] ?? "default";
  };

  if (complianceQuery.isLoading) {
    return (
      <div className="flex items-center justify-center py-12 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin mr-2" />
        Loading compliance data...
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <h3 className="text-sm font-semibold text-foreground">Compliance Frameworks</h3>
      {complianceItems.length === 0 ? (
        <Card className="p-8">
          <p className="text-sm text-muted-foreground text-center">
            No compliance frameworks mapped for this vendor yet.
          </p>
        </Card>
      ) : (
        <Card className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Framework</TableHead>
                <TableHead>Coverage</TableHead>
                <TableHead className="text-right">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {complianceItems.map((vc) => (
                <TableRow key={vc.frameworkId}>
                  <TableCell className="font-semibold text-foreground">
                    {vc.framework?.name ?? vc.frameworkId}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {vc.coveragePercentage != null ? `${vc.coveragePercentage}%` : "---"}
                  </TableCell>
                  <TableCell className="text-right">
                    <StatusBadge variant={statusVariant(vc.status)}>
                      {titleCase(vc.status)}
                    </StatusBadge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tab: Subprocessors
// ---------------------------------------------------------------------------

function SubprocessorsTab({ vendorId }: { vendorId: string }) {
  const subprocessorsQuery = useVendorSubprocessors(vendorId);

  const subprocessors = subprocessorsQuery.data ?? [];

  const riskVariant = (level: string | null) => {
    const map: Record<string, "high" | "medium" | "low"> = {
      High: "high",
      high: "high",
      Medium: "medium",
      medium: "medium",
      Low: "low",
      low: "low",
    };
    return map[level ?? ""] ?? ("default" as "low");
  };

  if (subprocessorsQuery.isLoading) {
    return (
      <div className="flex items-center justify-center py-12 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin mr-2" />
        Loading subprocessors...
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <h3 className="text-sm font-semibold text-foreground">
        Subprocessors ({subprocessors.length})
      </h3>
      {subprocessors.length === 0 ? (
        <Card className="p-8">
          <p className="text-sm text-muted-foreground text-center">
            No subprocessors linked to this vendor yet.
          </p>
        </Card>
      ) : (
        <Card className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Subprocessor</TableHead>
                <TableHead>Service</TableHead>
                <TableHead>Country</TableHead>
                <TableHead className="text-right">Risk Level</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {subprocessors.map((sp) => (
                <TableRow key={sp.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-md bg-muted text-xs font-bold text-muted-foreground">
                        {sp.name.charAt(0)}
                      </div>
                      <span className="font-semibold text-foreground">{sp.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{sp.serviceProvided ?? "---"}</TableCell>
                  <TableCell className="text-muted-foreground">{sp.headquartersCountry ?? "---"}</TableCell>
                  <TableCell className="text-right">
                    {sp.riskLevel ? (
                      <StatusBadge variant={riskVariant(sp.riskLevel)}>
                        {titleCase(sp.riskLevel)} Risk
                      </StatusBadge>
                    ) : (
                      <span className="text-xs text-muted-foreground">---</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tab: Monitoring
// ---------------------------------------------------------------------------

function MonitoringTab({ vendorId }: { vendorId: string }) {
  const alertsQuery = useVendorAlerts(vendorId);

  const alerts = alertsQuery.data ?? [];

  const severityVariant = (s: string) => {
    const map: Record<string, "critical" | "high" | "medium" | "low"> = {
      Critical: "critical",
      critical: "critical",
      High: "high",
      high: "high",
      Medium: "medium",
      medium: "medium",
      Low: "low",
      low: "low",
    };
    return map[s] ?? ("default" as "low");
  };

  if (alertsQuery.isLoading) {
    return (
      <div className="flex items-center justify-center py-12 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin mr-2" />
        Loading monitoring alerts...
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">Monitoring Alerts</h3>
        <StatusBadge variant="info">
          {alerts.length} alert{alerts.length !== 1 ? "s" : ""}
        </StatusBadge>
      </div>
      {alerts.length === 0 ? (
        <Card className="p-8">
          <p className="text-sm text-muted-foreground text-center">
            No monitoring alerts for this vendor.
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {alerts.map((alert) => (
            <Card key={alert.id} className="p-4">
              <div className="mb-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bell className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-semibold text-foreground">{alert.title || alert.type}</span>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge variant={severityVariant(alert.severity)}>
                    {titleCase(alert.severity)}
                  </StatusBadge>
                  <span className="text-xs text-muted-foreground">
                    {formatDate(alert.createdAt)}
                  </span>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">{alert.description}</p>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tab: Reviews
// ---------------------------------------------------------------------------

function ReviewsTab({ vendorId }: { vendorId: string }) {
  const reviewsQuery = useReviewCycles(vendorId);

  const reviews = reviewsQuery.data ?? [];

  const statusVariant = (s: string) => {
    if (s === "Completed" || s === "completed") return "success" as const;
    if (s === "In Progress" || s === "in_progress") return "warning" as const;
    return "default" as const;
  };

  if (reviewsQuery.isLoading) {
    return (
      <div className="flex items-center justify-center py-12 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin mr-2" />
        Loading review cycles...
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">Review Cycles</h3>
        <Button
          variant="primary"
          size="md"
          onClick={() => toast.info("Start review cycle", { description: "Review cycle management will be available with API integration." })}
        >
          <RotateCcw className="h-4 w-4" />
          Start Review Cycle
        </Button>
      </div>

      {reviews.length === 0 ? (
        <Card className="p-8">
          <p className="text-sm text-muted-foreground text-center">
            No review cycles found for this vendor.
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <Card key={review.id} className="p-5">
              <div className="mb-3 flex items-center justify-between">
                <h4 className="text-sm font-semibold text-foreground">
                  Review Cycle
                </h4>
                <StatusBadge variant={statusVariant(review.status)}>
                  {titleCase(review.status)}
                </StatusBadge>
              </div>

              {/* Timeline */}
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  <span>Started {formatDate(review.startDate)}</span>
                </div>
                <span className="text-border">|</span>
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  <span>Due {formatDate(review.dueDate)}</span>
                </div>
                {review.completedDate && (
                  <>
                    <span className="text-border">|</span>
                    <div className="flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3 text-green-500" />
                      <span>Completed {formatDate(review.completedDate)}</span>
                    </div>
                  </>
                )}
              </div>

              {/* Progress bar for In Progress reviews */}
              {(review.status === "In Progress" || review.status === "in_progress") && (
                <div className="mt-3">
                  <div className="h-2 overflow-hidden rounded-md bg-muted/30">
                    <div
                      className="h-full rounded-md bg-primary"
                      style={{ width: "35%" }}
                    />
                  </div>
                  <p className="mt-1 text-[10px] text-muted-foreground">In progress</p>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export default function VendorDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [activeTab, setActiveTab] = useState<TabId>("overview");

  const { data: vendor, isLoading, error } = useVendor(id);

  if (isLoading) {
    return <PageLoadingSkeleton />;
  }

  if (error || !vendor) {
    return (
      <div className="space-y-4">
        <Link
          to="/vendors"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Vendors
        </Link>
        <div className="flex h-48 flex-col items-center justify-center rounded-lg border border-destructive/30 bg-destructive/5 p-6">
          <AlertTriangle className="h-8 w-8 text-destructive mb-2" />
          <p className="text-sm font-medium text-foreground">Failed to load vendor</p>
          <p className="text-xs text-muted-foreground mt-1">
            {error instanceof Error ? error.message : "Vendor not found or an error occurred."}
          </p>
        </div>
      </div>
    );
  }

  const vendorId = id!;

  const renderTabContent = () => {
    switch (activeTab) {
      case "overview":
        return <OverviewTab vendor={vendor} vendorId={vendorId} />;
      case "artifacts":
        return <ArtifactsTab vendorId={vendorId} />;
      case "risk":
        return <RiskTab vendor={vendor} vendorId={vendorId} />;
      case "assessment":
        return <AssessmentTab vendorId={vendorId} />;
      case "remediations":
        return <RemediationsTab vendorId={vendorId} />;
      case "compliance":
        return <ComplianceTab vendorId={vendorId} />;
      case "subprocessors":
        return <SubprocessorsTab vendorId={vendorId} />;
      case "monitoring":
        return <MonitoringTab vendorId={vendorId} />;
      case "reviews":
        return <ReviewsTab vendorId={vendorId} />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-5">
      {/* Back link */}
      <Link
        to="/vendors"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Vendors
      </Link>

      {/* Vendor Header */}
      <Card className="p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="flex items-start gap-4">
            {/* Logo avatar */}
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-xl font-bold text-white">
              {vendor.name.charAt(0)}
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-bold text-foreground">{vendor.name}</h1>
                <StatusBadge variant="success">{titleCase(vendor.stage)}</StatusBadge>
                <StatusBadge variant="critical">{titleCase(vendor.criticality)}</StatusBadge>
              </div>

              <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                {vendor.website && (
                  <a
                    href={vendor.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 hover:text-primary transition-colors"
                  >
                    <Globe className="h-3.5 w-3.5" />
                    {vendor.website.replace("https://", "")}
                    <ExternalLink className="h-3 w-3" />
                  </a>
                )}
                {vendor.industry && (
                  <span className="inline-flex items-center gap-1">
                    <Building2 className="h-3.5 w-3.5" />
                    {vendor.industry}
                  </span>
                )}
                {vendor.headquartersCountry && (
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5" />
                    {vendor.headquartersCountry}
                  </span>
                )}
              </div>

              {/* Owners */}
              {vendor.owners && vendor.owners.length > 0 && (
                <div className="mt-3 flex items-center gap-2">
                  <div className="flex -space-x-2">
                    {vendor.owners.map((owner) => {
                      const displayName = owner.user?.displayName ?? "Unknown";
                      const initials = getInitials(displayName);
                      return (
                        <div
                          key={owner.userId}
                          className={cn(
                            "flex h-7 w-7 items-center justify-center rounded-full border-2 border-card text-[10px] font-bold",
                            owner.isPrimary
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted text-muted-foreground"
                          )}
                          title={`${displayName}${owner.isPrimary ? " (Primary)" : ""}`}
                        >
                          {initials}
                        </div>
                      );
                    })}
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {vendor.owners.find((o) => o.isPrimary)?.user?.displayName ?? vendor.owners[0]?.user?.displayName} (Primary)
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <Button
              variant="primary"
              size="md"
              onClick={() => {
                toast.info("AI Assessment", {
                  description: "AI assessment will be available with API integration.",
                });
                setActiveTab("assessment");
              }}
            >
              <Sparkles className="h-4 w-4" />
              <span className="hidden sm:inline">Run AI Assessment</span>
            </Button>
            <Button
              variant="secondary"
              size="md"
              onClick={() => {
                toast.info("Start review", {
                  description: "Review cycle management will be available with API integration.",
                });
                setActiveTab("reviews");
              }}
            >
              <RotateCcw className="h-4 w-4" />
              <span className="hidden sm:inline">Start Review</span>
            </Button>
            <Button
              variant="secondary"
              size="md"
              onClick={() => toast.info("Edit mode not yet available", { description: "Vendor editing will be available with API integration." })}
            >
              <Pencil className="h-4 w-4" />
              <span className="hidden sm:inline">Edit</span>
            </Button>
          </div>
        </div>
      </Card>

      {/* Tab Navigation */}
      <div className="relative border-b border-border">
        <nav className="-mb-px flex gap-1 overflow-x-auto" aria-label="Vendor tabs">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "relative whitespace-nowrap px-4 py-2.5 text-sm font-medium transition-colors",
                activeTab === tab.id
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {tab.label}
              {activeTab === tab.id && (
                <motion.div
                  layoutId="active-tab-underline"
                  className="absolute inset-x-0 bottom-0 h-0.5 bg-primary"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div>
        {renderTabContent()}
      </div>
    </div>
  );
}
