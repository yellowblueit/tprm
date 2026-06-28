import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";
import {
  Building2,
  AlertTriangle,
  Shield,
  ClipboardCheck,
  Activity,
  Calendar,
  ArrowUpRight,
} from "lucide-react";
import { Link } from "react-router";
import { PageHeader } from "@/components/common/PageHeader";
import { PageLoadingSkeleton } from "@/components/common/LoadingSkeleton";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Card, CardHeader, CardContent } from "@/components/ui";
import { CHART_TOOLTIP_STYLE, CHART_AXIS_STYLE } from "@/lib/chart-config";
import { cn } from "@/lib/utils";
import { useDashboardMetrics } from "@/hooks/use-dashboard";
import {
  useRiskDistribution,
  useRiskTrend,
  useVendorPipeline,
  useRemediationStats,
} from "@/hooks/use-analytics";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const RISK_COLOR_MAP: Record<string, string> = {
  CRITICAL: "#dc2626",
  HIGH: "#ea580c",
  MEDIUM: "#eab308",
  LOW: "#22c55e",
  MINIMAL: "#06b6d4",
};

const REMEDIATION_STATUS_MAP: Record<string, { label: string; color: string }> = {
  open: { label: "Open", color: "#dc2626" },
  inProgress: { label: "In Progress", color: "#eab308" },
  completed: { label: "Completed", color: "#22c55e" },
  overdue: { label: "Overdue", color: "#dc2626" },
};

const PIPELINE_COLOR_MAP: Record<string, string> = {
  EVALUATING: "#3b82f6",
  SCREENING: "#8b5cf6",
  ONBOARDED: "#22c55e",
  OFFBOARDING: "#ea580c",
};

function mapSeverityToVariant(severity: string): "critical" | "high" | "medium" | "low" {
  const s = severity.toLowerCase();
  if (s === "critical") return "critical";
  if (s === "high") return "high";
  if (s === "medium") return "medium";
  // INFORMATIONAL and LOW both map to "low"
  return "low";
}

function formatTimeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins} min ago`;
  const diffHrs = Math.floor(diffMins / 60);
  if (diffHrs < 24) return `${diffHrs} hr${diffHrs > 1 ? "s" : ""} ago`;
  const diffDays = Math.floor(diffHrs / 24);
  return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
}

function capitalizeFirst(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function ChartLink({ to }: { to: string }) {
  return (
    <Link
      to={to}
      className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
    >
      View all <ArrowUpRight className="h-3 w-3" />
    </Link>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function DashboardPage() {
  const dashboardQuery = useDashboardMetrics();
  const riskDistQuery = useRiskDistribution();
  const riskTrendQuery = useRiskTrend();
  const pipelineQuery = useVendorPipeline();
  const remediationQuery = useRemediationStats();

  // Loading state
  if (
    dashboardQuery.isLoading ||
    riskDistQuery.isLoading ||
    riskTrendQuery.isLoading ||
    pipelineQuery.isLoading ||
    remediationQuery.isLoading
  ) {
    return <PageLoadingSkeleton />;
  }

  // Error state
  if (
    dashboardQuery.isError ||
    riskDistQuery.isError ||
    riskTrendQuery.isError ||
    pipelineQuery.isError ||
    remediationQuery.isError
  ) {
    return (
      <div className="space-y-5">
        <PageHeader
          title="Dashboard"
          description="Overview of your third-party risk posture."
        />
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-6 text-center text-sm text-destructive">
          Failed to load dashboard data. Please try again later.
        </div>
      </div>
    );
  }

  const metrics = dashboardQuery.data!;
  const riskDistRaw = riskDistQuery.data ?? [];
  const riskTrendData = riskTrendQuery.data ?? [];
  const pipelineRaw = pipelineQuery.data ?? [];
  const remediationStats = remediationQuery.data;

  // Transform risk distribution: [{level, count, percentage}] -> [{name, value, color}]
  const riskDistribution = riskDistRaw.map((d) => ({
    name: capitalizeFirst(d.level),
    value: d.count,
    color: RISK_COLOR_MAP[d.level.toUpperCase()] ?? "#6b7280",
  }));

  const riskTotal = riskDistribution.reduce((sum, d) => sum + d.value, 0);

  // Compute high/critical from risk distribution
  const highCriticalCount = riskDistRaw
    .filter((d) => {
      const level = d.level.toUpperCase();
      return level === "CRITICAL" || level === "HIGH";
    })
    .reduce((sum, d) => sum + d.count, 0);

  // Transform pipeline: [{stage, count}] -> [{stage (capitalized), count, color}]
  const pipelineData = pipelineRaw.map((d) => ({
    stage: capitalizeFirst(d.stage),
    count: d.count,
    color: PIPELINE_COLOR_MAP[d.stage.toUpperCase()] ?? "#3b82f6",
  }));
  const pipelineMax = pipelineData.length > 0 ? Math.max(...pipelineData.map((d) => d.count)) : 1;

  // Transform remediation stats object -> array for bar chart
  const remediationData = remediationStats
    ? (["open", "inProgress", "completed", "overdue"] as const)
        .filter((key) => remediationStats[key] > 0 || key === "open" || key === "inProgress" || key === "completed")
        .map((key) => ({
          status: REMEDIATION_STATUS_MAP[key].label,
          count: remediationStats[key],
          fill: REMEDIATION_STATUS_MAP[key].color,
        }))
    : [];

  // Transform risk trend: [{month, averageScore, highRiskCount}] -> use averageScore as inherent proxy
  // The area chart expects two series. We map averageScore as the main score line.
  const riskTrendChartData = riskTrendData.map((d) => ({
    month: d.month,
    inherent: d.averageScore,
    residual: d.highRiskCount,
  }));

  // KPI cards built from real data
  const kpiData = [
    { label: "Total Vendors", value: metrics.totalVendors, icon: Building2 },
    { label: "High / Critical Risk", value: highCriticalCount, icon: AlertTriangle },
    { label: "Open Remediations", value: metrics.openRemediations, icon: ClipboardCheck },
    { label: "Reviews (30 days)", value: metrics.upcomingReviews, icon: Calendar },
    { label: "Compliance Coverage", value: `${metrics.complianceCoverage}%`, icon: Shield },
  ];

  // Recent alerts from dashboard metrics
  const recentAlerts = metrics.recentAlerts ?? [];

  return (
    <div className="space-y-5">
      <PageHeader
        title="Dashboard"
        description="Overview of your third-party risk posture."
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {kpiData.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <div key={kpi.label} className="rounded-lg border border-border bg-card p-4">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground">{kpi.label}</p>
                  <p className="text-2xl font-semibold text-foreground">{kpi.value}</p>
                </div>
                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10">
                  <Icon className="h-4 w-4 text-primary" />
                </div>
              </div>
              <div className="mt-2 flex items-center gap-1 text-xs font-medium text-muted-foreground">
                <Activity className="h-3 w-3" />
                <span>Live</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Risk Distribution */}
        <Card>
          <CardHeader>
            <h2 className="text-sm font-semibold text-foreground">Risk Distribution</h2>
            <ChartLink to="/analytics" />
          </CardHeader>
          <CardContent>
            {riskDistribution.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">No risk data available.</p>
            ) : (
              <div className="flex flex-col items-center gap-4 sm:flex-row">
                <div className="relative h-52 w-52 flex-shrink-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={riskDistribution}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={80}
                        paddingAngle={3}
                        dataKey="value"
                        stroke="none"
                      >
                        {riskDistribution.map((entry) => (
                          <Cell key={entry.name} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-2xl font-semibold text-foreground">{riskTotal}</span>
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Vendors</span>
                  </div>
                </div>
                <div className="flex flex-col gap-2 w-full">
                  {riskDistribution.map((entry) => (
                    <div key={entry.name} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
                        <span className="text-muted-foreground">{entry.name}</span>
                      </div>
                      <span className="font-medium text-foreground">{entry.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Vendor Pipeline */}
        <Card>
          <CardHeader>
            <h2 className="text-sm font-semibold text-foreground">Vendor Stage Pipeline</h2>
            <ChartLink to="/vendors" />
          </CardHeader>
          <CardContent>
            {pipelineData.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">No pipeline data available.</p>
            ) : (
              <div className="space-y-4">
                {pipelineData.map((stage) => {
                  const widthPercent = (stage.count / pipelineMax) * 100;
                  return (
                    <div key={stage.stage} className="space-y-1.5">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">{stage.stage}</span>
                        <span className="font-medium text-foreground">{stage.count}</span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-md bg-muted/50">
                        <div
                          className="h-full rounded-md"
                          style={{ backgroundColor: stage.color, width: `${widthPercent}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Remediation Progress */}
        <Card>
          <CardHeader>
            <h2 className="text-sm font-semibold text-foreground">Remediation Progress</h2>
            <ChartLink to="/remediations" />
          </CardHeader>
          <CardContent>
            {remediationData.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">No remediation data available.</p>
            ) : (
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={remediationData} layout="vertical" margin={{ top: 0, right: 16, bottom: 0, left: 0 }} barCategoryGap="24%">
                    <XAxis type="number" tick={CHART_AXIS_STYLE} axisLine={false} tickLine={false} />
                    <YAxis type="category" dataKey="status" tick={CHART_AXIS_STYLE} axisLine={false} tickLine={false} width={110} />
                    <Tooltip contentStyle={CHART_TOOLTIP_STYLE} cursor={{ fill: "rgba(255,255,255,0.03)" }} />
                    <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                      {remediationData.map((entry) => (
                        <Cell key={entry.status} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Risk Trend */}
        <Card>
          <CardHeader>
            <div>
              <h2 className="text-sm font-semibold text-foreground">Risk Trend (6 Months)</h2>
              <p className="mt-0.5 text-xs text-muted-foreground">Avg. score vs high-risk vendor count</p>
            </div>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <span className="inline-block h-2 w-2 rounded-full bg-red-500" />
                Avg Score
              </span>
              <span className="flex items-center gap-1.5">
                <span className="inline-block h-2 w-2 rounded-full bg-primary" />
                High Risk
              </span>
            </div>
          </CardHeader>
          <CardContent>
            {riskTrendChartData.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">No trend data available.</p>
            ) : (
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={riskTrendChartData} margin={{ top: 4, right: 8, bottom: 0, left: -20 }}>
                    <defs>
                      <linearGradient id="gradInherent" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#dc2626" stopOpacity={0.25} />
                        <stop offset="100%" stopColor="#dc2626" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="gradResidual" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.25} />
                        <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="month" tick={CHART_AXIS_STYLE} axisLine={false} tickLine={false} />
                    <YAxis tick={CHART_AXIS_STYLE} axisLine={false} tickLine={false} domain={[0, 100]} />
                    <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
                    <Area type="monotone" dataKey="inherent" stroke="#dc2626" strokeWidth={2} fill="url(#gradInherent)" />
                    <Area type="monotone" dataKey="residual" stroke="#3b82f6" strokeWidth={2} fill="url(#gradResidual)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Alerts */}
      <Card>
        <CardHeader>
          <h2 className="text-sm font-semibold text-foreground">Recent Monitoring Alerts</h2>
          <ChartLink to="/monitoring" />
        </CardHeader>
        <CardContent className="p-0">
          {recentAlerts.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">No recent alerts.</p>
          ) : (
            <div className="divide-y divide-border">
              {recentAlerts.map((alert) => {
                const severity = mapSeverityToVariant(alert.severity);
                return (
                  <div key={alert.id} className="flex items-center gap-3 px-4 py-3">
                    <div
                      className={cn(
                        "flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-md",
                        severity === "critical" && "bg-red-950",
                        severity === "high" && "bg-orange-950",
                        severity === "medium" && "bg-yellow-950",
                        severity === "low" && "bg-muted"
                      )}
                    >
                      <AlertTriangle
                        className={cn(
                          "h-4 w-4",
                          severity === "critical" && "text-red-400",
                          severity === "high" && "text-orange-400",
                          severity === "medium" && "text-yellow-400",
                          severity === "low" && "text-muted-foreground"
                        )}
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-foreground">{alert.message}</p>
                      <p className="text-xs text-muted-foreground">{alert.type}</p>
                    </div>
                    <div className="flex flex-shrink-0 items-center gap-3">
                      <StatusBadge variant={severity}>
                        {severity.charAt(0).toUpperCase() + severity.slice(1)}
                      </StatusBadge>
                      <span className="hidden text-xs text-muted-foreground sm:inline">
                        {formatTimeAgo(alert.createdAt)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
