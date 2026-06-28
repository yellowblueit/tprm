import { toast } from "sonner";
import {
  Plus,
  FileText,
  BarChart3,
  Briefcase,
  Download,
  Loader2,
} from "lucide-react";
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
import { useReports, useGenerateReport } from "@/hooks/use-reports";

// ---------------------------------------------------------------------------
// Static config — report types that can be generated
// ---------------------------------------------------------------------------

const reportTypes = [
  {
    title: "Vendor Risk Report",
    description: "Single vendor detailed risk assessment with scoring breakdown.",
    icon: FileText,
    type: "vendor_risk",
  },
  {
    title: "Program Summary",
    description: "Overall program status, metrics, and trend analysis.",
    icon: BarChart3,
    type: "program_summary",
  },
  {
    title: "Executive Summary",
    description: "High-level overview of risk posture for leadership.",
    icon: Briefcase,
    type: "executive_summary",
  },
];

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export default function ReportsPage() {
  const reportsQuery = useReports();
  const generateReport = useGenerateReport();

  if (reportsQuery.isLoading) return <PageLoadingSkeleton />;

  const reports = reportsQuery.data ?? [];

  function handleGenerate(reportType: string, reportTitle: string) {
    generateReport.mutate(
      { type: reportType },
      {
        onSuccess: (report) => {
          toast.success(`${reportTitle} generated`, {
            description: report.downloadUrl
              ? "Your report is ready for download."
              : "Report has been generated.",
          });
        },
        onError: (error) => {
          toast.error(`Failed to generate ${reportTitle}`, {
            description: error instanceof Error ? error.message : "An unexpected error occurred.",
          });
        },
      }
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <PageHeader
        title="Reports"
        description="Generate and view risk reports and executive summaries."
      >
        <Button
          onClick={() => toast.info("Report generation", { description: "Select a report type below to generate." })}
        >
          <Plus className="h-4 w-4" />
          Generate Report
        </Button>
      </PageHeader>

      {/* Generate Report */}
      <div>
        <h2 className="text-sm font-semibold text-foreground mb-4">
          Generate Report
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {reportTypes.map((rt) => {
            const Icon = rt.icon;
            return (
              <Card key={rt.title} className="p-5">
                <div className="space-y-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="text-sm font-semibold text-foreground">
                    {rt.title}
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {rt.description}
                  </p>
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={generateReport.isPending}
                    onClick={() => handleGenerate(rt.type, rt.title)}
                  >
                    {generateReport.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : null}
                    Generate
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Recent Reports */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Reports</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Report</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Generated</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reports.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                    No reports generated yet. Select a report type above to get started.
                  </TableCell>
                </TableRow>
              ) : (
                reports.map((report) => (
                  <TableRow key={report.key}>
                    <TableCell className="font-medium text-foreground">
                      {report.key}
                    </TableCell>
                    <TableCell>
                      <StatusBadge variant="info">
                        {report.type}
                      </StatusBadge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {report.generatedAt
                        ? new Date(report.generatedAt).toLocaleDateString()
                        : "—"}
                    </TableCell>
                    <TableCell>
                      {report.downloadUrl ? (
                        <Button
                          variant="ghost"
                          size="icon"
                          asChild
                        >
                          <a href={report.downloadUrl} target="_blank" rel="noopener noreferrer">
                            <Download className="h-4 w-4" />
                          </a>
                        </Button>
                      ) : (
                        <Button
                          variant="ghost"
                          size="icon"
                          disabled
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
