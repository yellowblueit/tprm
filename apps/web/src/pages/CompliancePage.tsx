import { Shield, Lock, Eye, CreditCard, Globe, Server, UserCheck, ShieldCheck } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { StatusBadge } from "@/components/common/StatusBadge";
import { cn } from "@/lib/utils";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Table,
  TableHeader,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
} from "@/components/ui";

// ---------------------------------------------------------------------------
// Mock data -- Frameworks
// ---------------------------------------------------------------------------

type Category = "Security" | "Privacy" | "Industry";

interface Framework {
  name: string;
  icon: typeof Shield;
  category: Category;
  vendorsCovered: number;
  vendorsTotal: number;
  status: string;
  statusVariant: "success" | "warning" | "critical" | "info";
}

const frameworks: Framework[] = [
  {
    name: "SOC 2 Type II",
    icon: ShieldCheck,
    category: "Security",
    vendorsCovered: 8,
    vendorsTotal: 12,
    status: "On Track",
    statusVariant: "success",
  },
  {
    name: "ISO 27001",
    icon: Shield,
    category: "Security",
    vendorsCovered: 6,
    vendorsTotal: 12,
    status: "Needs Attention",
    statusVariant: "warning",
  },
  {
    name: "HIPAA",
    icon: Lock,
    category: "Industry",
    vendorsCovered: 5,
    vendorsTotal: 7,
    status: "On Track",
    statusVariant: "success",
  },
  {
    name: "PCI DSS",
    icon: CreditCard,
    category: "Industry",
    vendorsCovered: 3,
    vendorsTotal: 5,
    status: "At Risk",
    statusVariant: "critical",
  },
  {
    name: "GDPR",
    icon: Globe,
    category: "Privacy",
    vendorsCovered: 9,
    vendorsTotal: 10,
    status: "On Track",
    statusVariant: "success",
  },
  {
    name: "NIST CSF",
    icon: Server,
    category: "Security",
    vendorsCovered: 7,
    vendorsTotal: 12,
    status: "Needs Attention",
    statusVariant: "warning",
  },
  {
    name: "CCPA",
    icon: Eye,
    category: "Privacy",
    vendorsCovered: 8,
    vendorsTotal: 10,
    status: "On Track",
    statusVariant: "success",
  },
  {
    name: "HITRUST",
    icon: UserCheck,
    category: "Industry",
    vendorsCovered: 2,
    vendorsTotal: 4,
    status: "In Progress",
    statusVariant: "info",
  },
];

const categoryColors: Record<Category, string> = {
  Security: "border-blue-900 bg-blue-950 text-blue-300",
  Privacy: "border-purple-900 bg-purple-950 text-purple-300",
  Industry: "border-amber-900 bg-amber-950 text-amber-300",
};

// ---------------------------------------------------------------------------
// Mock data -- Vendor Compliance Matrix
// ---------------------------------------------------------------------------

type ComplianceStatus = "compliant" | "partial" | "non-compliant" | "unknown";

const matrixFrameworks = ["SOC 2", "ISO 27001", "HIPAA", "PCI DSS", "GDPR"] as const;

interface VendorCompliance {
  vendor: string;
  statuses: Record<(typeof matrixFrameworks)[number], ComplianceStatus>;
}

const vendorMatrix: VendorCompliance[] = [
  {
    vendor: "CloudSync Ltd.",
    statuses: { "SOC 2": "compliant", "ISO 27001": "compliant", HIPAA: "partial", "PCI DSS": "non-compliant", GDPR: "compliant" },
  },
  {
    vendor: "DataVault Inc.",
    statuses: { "SOC 2": "compliant", "ISO 27001": "partial", HIPAA: "compliant", "PCI DSS": "compliant", GDPR: "compliant" },
  },
  {
    vendor: "NetOps Pro",
    statuses: { "SOC 2": "partial", "ISO 27001": "non-compliant", HIPAA: "unknown", "PCI DSS": "partial", GDPR: "partial" },
  },
  {
    vendor: "SecureHost Co.",
    statuses: { "SOC 2": "compliant", "ISO 27001": "compliant", HIPAA: "compliant", "PCI DSS": "compliant", GDPR: "partial" },
  },
  {
    vendor: "PayStream Global",
    statuses: { "SOC 2": "non-compliant", "ISO 27001": "unknown", HIPAA: "unknown", "PCI DSS": "compliant", GDPR: "compliant" },
  },
];

const dotColors: Record<ComplianceStatus, string> = {
  compliant: "bg-green-500",
  partial: "bg-yellow-500",
  "non-compliant": "bg-red-500",
  unknown: "bg-zinc-500",
};

const dotLabels: Record<ComplianceStatus, string> = {
  compliant: "Compliant",
  partial: "Partially Compliant",
  "non-compliant": "Non-Compliant",
  unknown: "Unknown",
};

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export default function CompliancePage() {
  return (
    <div className="space-y-5">
      {/* Header */}
      <PageHeader
        title="Compliance"
        description="Monitor compliance status across frameworks and standards."
      />

      {/* Framework Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {frameworks.map((fw) => {
          const Icon = fw.icon;
          const pct = Math.round((fw.vendorsCovered / fw.vendorsTotal) * 100);

          return (
            <Card key={fw.name}>
              <CardContent className="p-5">
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                        <Icon className="h-4.5 w-4.5 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-foreground">{fw.name}</p>
                        <span
                          className={cn(
                            "mt-0.5 inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-semibold",
                            categoryColors[fw.category]
                          )}
                        >
                          {fw.category}
                        </span>
                      </div>
                    </div>
                    <StatusBadge variant={fw.statusVariant}>{fw.status}</StatusBadge>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">
                        {fw.vendorsCovered}/{fw.vendorsTotal} vendors
                      </span>
                      <span className="font-medium text-foreground">{pct}%</span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-md bg-muted">
                      <div
                        className={cn(
                          "h-full rounded-md",
                          pct >= 80 ? "bg-green-500" : pct >= 50 ? "bg-yellow-500" : "bg-red-500"
                        )}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Vendor Compliance Matrix */}
      <Card>
        <CardHeader>
          <CardTitle>Vendor Compliance Matrix</CardTitle>
          <div className="flex items-center gap-4 text-[11px] text-muted-foreground">
            {(["compliant", "partial", "non-compliant", "unknown"] as ComplianceStatus[]).map((s) => (
              <span key={s} className="flex items-center gap-1.5">
                <span className={cn("inline-block h-2 w-2 rounded-full", dotColors[s])} />
                {dotLabels[s]}
              </span>
            ))}
          </div>
        </CardHeader>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Vendor</TableHead>
              {matrixFrameworks.map((fw) => (
                <TableHead key={fw} className="text-center">
                  {fw}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {vendorMatrix.map((row) => (
              <TableRow key={row.vendor}>
                <TableCell className="font-medium text-foreground">
                  {row.vendor}
                </TableCell>
                {matrixFrameworks.map((fw) => (
                  <TableCell key={fw} className="text-center">
                    <span
                      className={cn(
                        "inline-block h-3 w-3 rounded-full",
                        dotColors[row.statuses[fw]]
                      )}
                      title={dotLabels[row.statuses[fw]]}
                    />
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
