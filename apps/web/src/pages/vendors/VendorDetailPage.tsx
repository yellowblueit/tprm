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
// Mock data (tabs without backend endpoints yet)
// ---------------------------------------------------------------------------

const MOCK_ARTIFACTS = [
  {
    id: "a-1",
    name: "SOC 2 Type II Report 2025",
    type: "Report",
    uploadDate: "2026-01-15",
    aiStatus: "Analyzed",
  },
  {
    id: "a-2",
    name: "Information Security Policy",
    type: "Policy",
    uploadDate: "2026-02-20",
    aiStatus: "Analyzed",
  },
  {
    id: "a-3",
    name: "Penetration Test Results Q1 2026",
    type: "Assessment",
    uploadDate: "2026-04-05",
    aiStatus: "Pending",
  },
  {
    id: "a-4",
    name: "Business Continuity Plan",
    type: "Plan",
    uploadDate: "2025-11-10",
    aiStatus: "Analyzed",
  },
];

const MOCK_RISK_BREAKDOWN = [
  { domain: "Data Protection & Privacy", weight: 8, inherent: 92, residual: 45 },
  { domain: "Access Control", weight: 7, inherent: 85, residual: 38 },
  { domain: "Encryption", weight: 6, inherent: 78, residual: 32 },
  { domain: "Network Security", weight: 6, inherent: 88, residual: 50 },
  { domain: "Incident Response", weight: 6, inherent: 75, residual: 35 },
  { domain: "Vulnerability Management", weight: 6, inherent: 82, residual: 40 },
  { domain: "Cloud Security", weight: 6, inherent: 90, residual: 48 },
  { domain: "Application Security", weight: 6, inherent: 80, residual: 42 },
];

const MOCK_ASSESSMENT_DOMAINS = SECURITY_DOMAINS.map((sd, i) => ({
  code: sd.code,
  name: sd.name,
  description: sd.description,
  maturity: (["Initial", "Developing", "Defined", "Managed", "Optimizing"] as const)[
    Math.min(4, Math.floor(Math.random() * 5))
  ],
  controlEffectiveness: Math.floor(Math.random() * 60 + 40),
  gaps: Math.floor(Math.random() * 5),
}));

const MOCK_REMEDIATIONS = [
  {
    id: "r-1",
    title: "Implement MFA for all admin accounts",
    priority: "Critical" as const,
    status: "In Progress" as const,
    dueDate: "2026-07-15",
    domain: "Access Control",
  },
  {
    id: "r-2",
    title: "Encrypt data at rest using AES-256",
    priority: "High" as const,
    status: "Open" as const,
    dueDate: "2026-08-01",
    domain: "Encryption",
  },
  {
    id: "r-3",
    title: "Update incident response playbook",
    priority: "Medium" as const,
    status: "Completed" as const,
    dueDate: "2026-06-01",
    domain: "Incident Response",
  },
  {
    id: "r-4",
    title: "Conduct quarterly penetration testing",
    priority: "High" as const,
    status: "Open" as const,
    dueDate: "2026-09-15",
    domain: "Vulnerability Management",
  },
  {
    id: "r-5",
    title: "Review and update network segmentation",
    priority: "Medium" as const,
    status: "In Progress" as const,
    dueDate: "2026-08-20",
    domain: "Network Security",
  },
];

const MOCK_COMPLIANCE = [
  { code: "SOC2_TYPE2", name: "SOC 2 Type II", status: "Compliant", expiry: "2027-01-15" },
  { code: "ISO27001", name: "ISO 27001", status: "Compliant", expiry: "2027-06-20" },
  { code: "GDPR", name: "GDPR", status: "Compliant", expiry: null },
  { code: "HIPAA", name: "HIPAA", status: "Partial", expiry: null },
  { code: "PCI_DSS", name: "PCI DSS", status: "Compliant", expiry: "2027-03-10" },
  { code: "NIST_CSF", name: "NIST CSF", status: "In Review", expiry: null },
  { code: "CSA_STAR", name: "CSA STAR", status: "Compliant", expiry: "2027-09-01" },
  { code: "CCPA", name: "CCPA/CPRA", status: "Not Assessed", expiry: null },
];

const MOCK_SUBPROCESSORS = [
  { name: "AWS", service: "Cloud Hosting", riskLevel: "Medium" as const, country: "United States" },
  { name: "Datadog", service: "Monitoring", riskLevel: "Low" as const, country: "United States" },
  { name: "Stripe", service: "Payment Processing", riskLevel: "High" as const, country: "United States" },
  { name: "Twilio", service: "Communications", riskLevel: "Low" as const, country: "United States" },
  { name: "Cloudflare", service: "CDN & Security", riskLevel: "Medium" as const, country: "United States" },
];

const MOCK_MONITORING_ALERTS = [
  { id: "m-1", type: "Data Breach Report", severity: "High", date: "2026-06-20", message: "Vendor disclosed minor data exposure affecting 200 records. Investigation ongoing." },
  { id: "m-2", type: "Compliance Change", severity: "Medium", date: "2026-06-15", message: "SOC 2 report audit period ending. New report expected within 30 days." },
  { id: "m-3", type: "News Alert", severity: "Low", date: "2026-06-10", message: "CloudVault announced expansion into APAC region with new Singapore data center." },
  { id: "m-4", type: "Security Advisory", severity: "Medium", date: "2026-05-28", message: "CVE-2026-1234 identified in CloudVault SDK v3.x. Patch available in v3.2.1." },
];

const MOCK_REVIEWS = [
  { cycle: "Annual Review 2026", status: "In Progress" as const, startDate: "2026-06-01", dueDate: "2026-08-15", completedDate: null },
  { cycle: "Annual Review 2025", status: "Completed" as const, startDate: "2025-06-01", dueDate: "2025-08-15", completedDate: "2025-08-10" },
  { cycle: "Initial Assessment", status: "Completed" as const, startDate: "2024-03-01", dueDate: "2024-04-15", completedDate: "2024-04-12" },
];

const MOCK_ACTIVITY = [
  { date: "2026-06-20", action: "Security alert triggered", description: "Data breach report monitoring alert", icon: AlertTriangle },
  { date: "2026-06-15", action: "Artifact uploaded", description: "Penetration Test Results Q1 2026", icon: FileText },
  { date: "2026-06-01", action: "Review cycle started", description: "Annual Review 2026 initiated by Sarah Chen", icon: RefreshCw },
  { date: "2026-05-20", action: "Risk score updated", description: "Residual risk decreased from 48 to 42", icon: TrendingDown },
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
// RiskGauge SVG Component (static — no motion)
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

function OverviewTab({ vendor }: { vendor: Vendor }) {
  const inherentRisk = vendor.riskScores?.[0]?.inherentRiskScore ?? 0;
  const residualRisk = vendor.riskScores?.[0]?.residualRiskScore ?? 0;

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
              <p className="text-sm font-medium text-foreground">{vendor.industry ?? "—"}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">HQ Country</p>
              <p className="text-sm font-medium text-foreground">{vendor.headquartersCountry ?? "—"}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Employees</p>
              <p className="text-sm font-medium text-foreground">{vendor.employeeCount ?? "—"}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Year Founded</p>
              <p className="text-sm font-medium text-foreground">{vendor.yearFounded ?? "—"}</p>
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
          {MOCK_ACTIVITY.map((item, i) => {
            const Icon = item.icon;
            return (
              <div
                key={i}
                className="flex items-start gap-3"
              >
                <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-muted">
                  <Icon className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">{item.action}</p>
                  <p className="text-xs text-muted-foreground">{item.description}</p>
                </div>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {formatDate(item.date)}
                </span>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tab: Artifacts
// ---------------------------------------------------------------------------

function ArtifactsTab() {
  const fileInputRef = useRef<HTMLInputElement>(null);

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
        {MOCK_ARTIFACTS.map((artifact) => {
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
                    Uploaded {formatDate(artifact.uploadDate)}
                  </span>
                </div>
              </div>
              <StatusBadge
                variant={artifact.aiStatus === "Analyzed" ? "success" : "warning"}
              >
                {artifact.aiStatus === "Analyzed" ? "AI Analyzed" : "Pending AI"}
              </StatusBadge>
              <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tab: Risk
// ---------------------------------------------------------------------------

function RiskTab({ vendor }: { vendor: Vendor }) {
  const inherentRisk = vendor.riskScores?.[0]?.inherentRiskScore ?? 0;
  const residualRisk = vendor.riskScores?.[0]?.residualRiskScore ?? 0;

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
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Domain</TableHead>
                <TableHead className="text-center">Weight</TableHead>
                <TableHead className="text-center">Inherent</TableHead>
                <TableHead className="text-center">Residual</TableHead>
                <TableHead className="text-center">Reduction</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {MOCK_RISK_BREAKDOWN.map((row, i) => {
                const reduction = row.inherent - row.residual;
                const reductionPct = Math.round((reduction / row.inherent) * 100);
                return (
                  <TableRow key={i}>
                    <TableCell className="font-medium text-foreground">{row.domain}</TableCell>
                    <TableCell className="text-center text-muted-foreground">{row.weight}%</TableCell>
                    <TableCell className="text-center">
                      <span
                        className="inline-flex items-center gap-1.5 font-medium"
                        style={{ color: riskColor(row.inherent) }}
                      >
                        {row.inherent}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      <span
                        className="inline-flex items-center gap-1.5 font-medium"
                        style={{ color: riskColor(row.residual) }}
                      >
                        {row.residual}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      <StatusBadge variant="success">-{reductionPct}%</StatusBadge>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tab: Assessment
// ---------------------------------------------------------------------------

function AssessmentTab() {
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Security Domain Assessment</h3>
          <p className="text-xs text-muted-foreground">
            {SECURITY_DOMAINS.length} domains evaluated across your security framework
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

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
        {MOCK_ASSESSMENT_DOMAINS.map((domain) => (
          <Card
            key={domain.code}
            className="p-4 transition-colors hover:bg-muted/20"
          >
            <div className="mb-3 flex items-start justify-between">
              <div>
                <p className="text-xs font-bold text-muted-foreground">{domain.code}</p>
                <p className="text-sm font-semibold text-foreground">{domain.name}</p>
              </div>
              {domain.gaps > 0 && (
                <span className="flex items-center gap-1 rounded-md bg-red-950 px-2 py-0.5 text-[10px] font-semibold text-red-400 border border-red-900/50">
                  <AlertTriangle className="h-3 w-3" />
                  {domain.gaps} gap{domain.gaps !== 1 ? "s" : ""}
                </span>
              )}
            </div>

            {/* Maturity */}
            <div className="mb-3">
              <span
                className={cn(
                  "inline-flex rounded-md border px-2 py-0.5 text-[10px] font-semibold",
                  maturityColor(domain.maturity)
                )}
              >
                {domain.maturity}
              </span>
            </div>

            {/* Control Effectiveness Bar */}
            <div>
              <div className="mb-1 flex items-center justify-between">
                <span className="text-[10px] text-muted-foreground">Control Effectiveness</span>
                <span className="text-xs font-semibold text-foreground">
                  {domain.controlEffectiveness}%
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-md bg-muted/30">
                <div
                  className="h-full rounded-md"
                  style={{
                    backgroundColor: riskColor(100 - domain.controlEffectiveness),
                    width: `${domain.controlEffectiveness}%`,
                  }}
                />
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tab: Remediations
// ---------------------------------------------------------------------------

function RemediationsTab() {
  const priorityVariant = (p: string) => {
    const map: Record<string, "critical" | "high" | "medium" | "low"> = {
      Critical: "critical",
      High: "high",
      Medium: "medium",
      Low: "low",
    };
    return map[p] ?? "default";
  };

  const statusVariant = (s: string) => {
    const map: Record<string, "success" | "warning" | "info"> = {
      Completed: "success",
      "In Progress": "warning",
      Open: "info",
    };
    return map[s] ?? ("default" as "info");
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Remediation Items</h3>
          <p className="text-xs text-muted-foreground">
            {MOCK_REMEDIATIONS.filter((r) => r.status !== "Completed").length} open items
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

      <div className="space-y-2">
        {MOCK_REMEDIATIONS.map((item) => (
          <div
            key={item.id}
            className="flex items-center gap-4 rounded-lg border border-border bg-card p-4 transition-colors hover:bg-muted/20"
          >
            <div
              className={cn(
                "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                item.status === "Completed"
                  ? "bg-green-950"
                  : item.status === "In Progress"
                  ? "bg-yellow-950"
                  : "bg-blue-950"
              )}
            >
              {item.status === "Completed" ? (
                <CheckCircle2 className="h-4 w-4 text-green-400" />
              ) : item.status === "In Progress" ? (
                <Clock className="h-4 w-4 text-yellow-400" />
              ) : (
                <AlertTriangle className="h-4 w-4 text-blue-400" />
              )}
            </div>

            <div className="flex-1">
              <p
                className={cn(
                  "text-sm font-medium",
                  item.status === "Completed"
                    ? "text-muted-foreground line-through"
                    : "text-foreground"
                )}
              >
                {item.title}
              </p>
              <div className="mt-1 flex items-center gap-2">
                <span className="text-xs text-muted-foreground">{item.domain}</span>
                <span className="text-xs text-muted-foreground">
                  Due {formatDate(item.dueDate)}
                </span>
              </div>
            </div>

            <StatusBadge variant={priorityVariant(item.priority)}>
              {item.priority}
            </StatusBadge>
            <StatusBadge variant={statusVariant(item.status)}>
              {item.status}
            </StatusBadge>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tab: Compliance
// ---------------------------------------------------------------------------

function ComplianceTab() {
  const statusVariant = (s: string) => {
    const map: Record<string, "success" | "warning" | "info" | "default"> = {
      Compliant: "success",
      Partial: "warning",
      "In Review": "info",
      "Not Assessed": "default",
    };
    return map[s] ?? "default";
  };

  return (
    <div className="space-y-5">
      <h3 className="text-sm font-semibold text-foreground">Compliance Frameworks</h3>
      <Card className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Framework</TableHead>
              <TableHead>Expiry</TableHead>
              <TableHead className="text-right">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {MOCK_COMPLIANCE.map((fw) => (
              <TableRow key={fw.code}>
                <TableCell className="font-semibold text-foreground">{fw.name}</TableCell>
                <TableCell className="text-muted-foreground">
                  {fw.expiry ? formatDate(fw.expiry) : "—"}
                </TableCell>
                <TableCell className="text-right">
                  <StatusBadge variant={statusVariant(fw.status)}>
                    {fw.status}
                  </StatusBadge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tab: Subprocessors
// ---------------------------------------------------------------------------

function SubprocessorsTab() {
  const riskVariant = (level: string) => {
    const map: Record<string, "high" | "medium" | "low"> = {
      High: "high",
      Medium: "medium",
      Low: "low",
    };
    return map[level] ?? ("default" as "low");
  };

  return (
    <div className="space-y-5">
      <h3 className="text-sm font-semibold text-foreground">
        Subprocessors ({MOCK_SUBPROCESSORS.length})
      </h3>
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
            {MOCK_SUBPROCESSORS.map((sp) => (
              <TableRow key={sp.name}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-md bg-muted text-xs font-bold text-muted-foreground">
                      {sp.name.charAt(0)}
                    </div>
                    <span className="font-semibold text-foreground">{sp.name}</span>
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground">{sp.service}</TableCell>
                <TableCell className="text-muted-foreground">{sp.country}</TableCell>
                <TableCell className="text-right">
                  <StatusBadge variant={riskVariant(sp.riskLevel)}>
                    {sp.riskLevel} Risk
                  </StatusBadge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tab: Monitoring
// ---------------------------------------------------------------------------

function MonitoringTab() {
  const severityVariant = (s: string) => {
    const map: Record<string, "critical" | "high" | "medium" | "low"> = {
      Critical: "critical",
      High: "high",
      Medium: "medium",
      Low: "low",
    };
    return map[s] ?? ("default" as "low");
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">Monitoring Alerts</h3>
        <StatusBadge variant="info">
          {MOCK_MONITORING_ALERTS.length} alerts
        </StatusBadge>
      </div>
      <div className="space-y-3">
        {MOCK_MONITORING_ALERTS.map((alert) => (
          <Card key={alert.id} className="p-4">
            <div className="mb-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-semibold text-foreground">{alert.type}</span>
              </div>
              <div className="flex items-center gap-2">
                <StatusBadge variant={severityVariant(alert.severity)}>
                  {alert.severity}
                </StatusBadge>
                <span className="text-xs text-muted-foreground">
                  {formatDate(alert.date)}
                </span>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">{alert.message}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tab: Reviews
// ---------------------------------------------------------------------------

function ReviewsTab() {
  const statusVariant = (s: string) => {
    if (s === "Completed") return "success" as const;
    if (s === "In Progress") return "warning" as const;
    return "default" as const;
  };

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

      <div className="space-y-4">
        {MOCK_REVIEWS.map((review) => (
          <Card key={review.cycle} className="p-5">
            <div className="mb-3 flex items-center justify-between">
              <h4 className="text-sm font-semibold text-foreground">{review.cycle}</h4>
              <StatusBadge variant={statusVariant(review.status)}>
                {review.status}
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
            {review.status === "In Progress" && (
              <div className="mt-3">
                <div className="h-2 overflow-hidden rounded-md bg-muted/30">
                  <div
                    className="h-full rounded-md bg-primary"
                    style={{ width: "35%" }}
                  />
                </div>
                <p className="mt-1 text-[10px] text-muted-foreground">35% complete</p>
              </div>
            )}
          </Card>
        ))}
      </div>
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

  const renderTabContent = () => {
    switch (activeTab) {
      case "overview":
        return <OverviewTab vendor={vendor} />;
      case "artifacts":
        return <ArtifactsTab />;
      case "risk":
        return <RiskTab vendor={vendor} />;
      case "assessment":
        return <AssessmentTab />;
      case "remediations":
        return <RemediationsTab />;
      case "compliance":
        return <ComplianceTab />;
      case "subprocessors":
        return <SubprocessorsTab />;
      case "monitoring":
        return <MonitoringTab />;
      case "reviews":
        return <ReviewsTab />;
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
