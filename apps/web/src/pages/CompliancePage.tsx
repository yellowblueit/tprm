import { Shield } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { StatusBadge } from "@/components/common/StatusBadge";
import { PageLoadingSkeleton } from "@/components/common/LoadingSkeleton";
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
import {
  useFrameworks,
  useComplianceMatrix,
  type ComplianceMatrixEntry,
} from "@/hooks/use-compliance";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const categoryColors: Record<string, string> = {
  Security: "border-blue-900 bg-blue-950 text-blue-300",
  Privacy: "border-purple-900 bg-purple-950 text-purple-300",
  Industry: "border-amber-900 bg-amber-950 text-amber-300",
};

type ComplianceStatus =
  | "COMPLIANT"
  | "PARTIALLY_COMPLIANT"
  | "NON_COMPLIANT"
  | "IN_PROGRESS"
  | "EXPIRED"
  | "UNKNOWN";

const complianceStatusDotColor: Record<string, string> = {
  COMPLIANT: "bg-green-500",
  PARTIALLY_COMPLIANT: "bg-yellow-500",
  NON_COMPLIANT: "bg-red-500",
  IN_PROGRESS: "bg-blue-500",
  EXPIRED: "bg-red-500",
  UNKNOWN: "bg-zinc-500",
};

const complianceStatusLabel: Record<string, string> = {
  COMPLIANT: "Compliant",
  PARTIALLY_COMPLIANT: "Partially Compliant",
  NON_COMPLIANT: "Non-Compliant",
  IN_PROGRESS: "In Progress",
  EXPIRED: "Expired",
  UNKNOWN: "Unknown",
};

// Legend entries for the matrix
const LEGEND_STATUSES: ComplianceStatus[] = [
  "COMPLIANT",
  "PARTIALLY_COMPLIANT",
  "NON_COMPLIANT",
  "IN_PROGRESS",
  "UNKNOWN",
];

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export default function CompliancePage() {
  const frameworksQuery = useFrameworks();
  const matrixQuery = useComplianceMatrix();

  if (frameworksQuery.isLoading || matrixQuery.isLoading) {
    return <PageLoadingSkeleton />;
  }

  const frameworks = frameworksQuery.data ?? [];
  const matrixEntries: ComplianceMatrixEntry[] = matrixQuery.data ?? [];

  // Collect unique framework names from the matrix for column headers
  const matrixFrameworkNames: string[] = [];
  const matrixFrameworkIds: string[] = [];
  if (matrixEntries.length > 0) {
    for (const fw of matrixEntries[0].frameworks) {
      if (!matrixFrameworkIds.includes(fw.frameworkId)) {
        matrixFrameworkIds.push(fw.frameworkId);
        matrixFrameworkNames.push(fw.frameworkName);
      }
    }
  }

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
          const categoryKey = (fw as unknown as { category?: string }).category ?? "Security";

          return (
            <Card key={fw.id}>
              <CardContent className="p-5">
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                        <Shield className="h-4.5 w-4.5 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-foreground">{fw.name}</p>
                        {categoryKey && categoryColors[categoryKey] && (
                          <span
                            className={cn(
                              "mt-0.5 inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-semibold",
                              categoryColors[categoryKey]
                            )}
                          >
                            {categoryKey}
                          </span>
                        )}
                      </div>
                    </div>
                    {fw.version && (
                      <StatusBadge variant="info">
                        v{fw.version}
                      </StatusBadge>
                    )}
                  </div>

                  {fw.description && (
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {fw.description}
                    </p>
                  )}

                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">
                      {fw.controlCount} controls
                    </span>
                    <StatusBadge variant={fw.isActive ? "success" : "default"}>
                      {fw.isActive ? "Active" : "Inactive"}
                    </StatusBadge>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Vendor Compliance Matrix */}
      {matrixEntries.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Vendor Compliance Matrix</CardTitle>
            <div className="flex items-center gap-4 text-[11px] text-muted-foreground">
              {LEGEND_STATUSES.map((s) => (
                <span key={s} className="flex items-center gap-1.5">
                  <span
                    className={cn(
                      "inline-block h-2 w-2 rounded-full",
                      complianceStatusDotColor[s] ?? "bg-zinc-500"
                    )}
                  />
                  {complianceStatusLabel[s] ?? s}
                </span>
              ))}
            </div>
          </CardHeader>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Vendor</TableHead>
                {matrixFrameworkNames.map((name) => (
                  <TableHead key={name} className="text-center">
                    {name}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {matrixEntries.map((row) => (
                <TableRow key={row.vendorId}>
                  <TableCell className="font-medium text-foreground">
                    {row.vendorName}
                  </TableCell>
                  {matrixFrameworkIds.map((fwId) => {
                    const match = row.frameworks.find(
                      (f) => f.frameworkId === fwId
                    );
                    const status = match?.status?.toUpperCase() ?? "UNKNOWN";
                    return (
                      <TableCell key={fwId} className="text-center">
                        <span
                          className={cn(
                            "inline-block h-3 w-3 rounded-full",
                            complianceStatusDotColor[status] ?? "bg-zinc-500"
                          )}
                          title={complianceStatusLabel[status] ?? status}
                        />
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}
