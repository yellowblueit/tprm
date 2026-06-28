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
import { Building2, AlertTriangle, ShieldCheck, CheckCircle2 } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { PageLoadingSkeleton } from "@/components/common/LoadingSkeleton";
import { MetricCard } from "@/components/ui/metric-card";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { CHART_TOOLTIP_STYLE, CHART_AXIS_STYLE } from "@/lib/chart-config";
import {
  useRiskDistribution,
  useRiskTrend,
  useVendorPipeline,
  useRemediationStats,
} from "@/hooks/use-analytics";
import { useDashboardMetrics } from "@/hooks/use-dashboard";

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

function capitalizeFirst(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export default function AnalyticsPage() {
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
          title="Analytics"
          description="Risk analytics and trends across your vendor portfolio."
        />
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-6 text-center text-sm text-destructive">
          Failed to load analytics data. Please try again later.
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

  // Transform pipeline: [{stage, count}] -> [{stage (capitalized), count}]
  const vendorStages = pipelineRaw.map((d) => ({
    stage: capitalizeFirst(d.stage),
    count: d.count,
  }));

  // Transform risk trend: [{month, averageScore, highRiskCount}] -> keep month + averageScore for area chart
  const riskTrendChartData = riskTrendData.map((d) => ({
    month: d.month,
    inherent: d.averageScore,
    residual: d.highRiskCount,
  }));

  // Compute average inherent / residual from trend data
  const avgInherent =
    riskTrendData.length > 0
      ? Math.round(riskTrendData.reduce((sum, d) => sum + d.averageScore, 0) / riskTrendData.length)
      : 0;
  const avgResidual =
    riskTrendData.length > 0
      ? Math.round(riskTrendData.reduce((sum, d) => sum + d.highRiskCount, 0) / riskTrendData.length)
      : 0;

  // Transform remediation stats -> array for bar chart
  const remediationsByPriority = remediationStats
    ? (["open", "inProgress", "completed", "overdue"] as const)
        .filter((key) => remediationStats[key] > 0 || key === "open" || key === "inProgress" || key === "completed")
        .map((key) => ({
          priority: REMEDIATION_STATUS_MAP[key].label,
          count: remediationStats[key],
          fill: REMEDIATION_STATUS_MAP[key].color,
        }))
    : [];

  // KPI cards from real data
  const kpiData = [
    { label: "Total Vendors", value: String(metrics.totalVendors), icon: Building2 },
    { label: "Average Inherent Risk", value: String(avgInherent), icon: AlertTriangle },
    { label: "Average Residual Risk", value: String(avgResidual), icon: ShieldCheck },
    { label: "Compliance Rate", value: `${metrics.complianceCoverage}%`, icon: CheckCircle2 },
  ];

  return (
    <div className="space-y-5">
      {/* Header */}
      <PageHeader
        title="Analytics"
        description="Risk analytics and trends across your vendor portfolio."
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpiData.map((kpi) => (
          <MetricCard
            key={kpi.label}
            label={kpi.label}
            value={kpi.value}
            icon={kpi.icon}
          />
        ))}
      </div>

      {/* Charts 2x2 */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* Risk Distribution -- PieChart */}
        <Card>
          <CardHeader>
            <CardTitle>Risk Distribution</CardTitle>
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
                    <span className="text-2xl font-bold text-foreground">{riskTotal}</span>
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                      Vendors
                    </span>
                  </div>
                </div>
                <div className="flex flex-col gap-2 w-full">
                  {riskDistribution.map((entry) => (
                    <div key={entry.name} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <span
                          className="h-2.5 w-2.5 rounded-full"
                          style={{ backgroundColor: entry.color }}
                        />
                        <span className="text-muted-foreground">{entry.name}</span>
                      </div>
                      <span className="font-semibold text-foreground">{entry.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Vendor Stages -- BarChart */}
        <Card>
          <CardHeader>
            <CardTitle>Vendor Stages</CardTitle>
          </CardHeader>
          <CardContent>
            {vendorStages.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">No vendor stage data available.</p>
            ) : (
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={vendorStages}
                    margin={{ top: 4, right: 8, bottom: 0, left: -20 }}
                  >
                    <XAxis
                      dataKey="stage"
                      tick={CHART_AXIS_STYLE}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={CHART_AXIS_STYLE}
                      axisLine={false}
                      tickLine={false}
                      allowDecimals={false}
                    />
                    <Tooltip
                      contentStyle={CHART_TOOLTIP_STYLE}
                      cursor={{ fill: "rgba(255,255,255,0.03)" }}
                    />
                    <Bar
                      dataKey="count"
                      fill="#3b82f6"
                      radius={[6, 6, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Risk Trend -- AreaChart */}
        <Card>
          <CardHeader>
            <CardTitle>Risk Trend (6 Months)</CardTitle>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: "#ea580c" }} />
                Inherent
              </span>
              <span className="flex items-center gap-1.5">
                <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: "#22c55e" }} />
                Residual
              </span>
            </div>
          </CardHeader>
          <CardContent>
            {riskTrendChartData.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">No trend data available.</p>
            ) : (
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={riskTrendChartData}
                    margin={{ top: 4, right: 8, bottom: 0, left: -20 }}
                  >
                    <defs>
                      <linearGradient id="gradInherentAnalytics" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#ea580c" stopOpacity={0.25} />
                        <stop offset="100%" stopColor="#ea580c" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="gradResidualAnalytics" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#22c55e" stopOpacity={0.25} />
                        <stop offset="100%" stopColor="#22c55e" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis
                      dataKey="month"
                      tick={CHART_AXIS_STYLE}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={CHART_AXIS_STYLE}
                      axisLine={false}
                      tickLine={false}
                      domain={[0, 100]}
                    />
                    <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
                    <Area
                      type="monotone"
                      dataKey="inherent"
                      stroke="#ea580c"
                      strokeWidth={2}
                      fill="url(#gradInherentAnalytics)"
                    />
                    <Area
                      type="monotone"
                      dataKey="residual"
                      stroke="#22c55e"
                      strokeWidth={2}
                      fill="url(#gradResidualAnalytics)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Remediations by Priority -- Horizontal BarChart */}
        <Card>
          <CardHeader>
            <CardTitle>Remediations by Priority</CardTitle>
          </CardHeader>
          <CardContent>
            {remediationsByPriority.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">No remediation data available.</p>
            ) : (
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={remediationsByPriority}
                    layout="vertical"
                    margin={{ top: 0, right: 16, bottom: 0, left: 0 }}
                    barCategoryGap="24%"
                  >
                    <XAxis
                      type="number"
                      tick={CHART_AXIS_STYLE}
                      axisLine={false}
                      tickLine={false}
                      allowDecimals={false}
                    />
                    <YAxis
                      type="category"
                      dataKey="priority"
                      tick={CHART_AXIS_STYLE}
                      axisLine={false}
                      tickLine={false}
                      width={70}
                    />
                    <Tooltip
                      contentStyle={CHART_TOOLTIP_STYLE}
                      cursor={{ fill: "rgba(255,255,255,0.03)" }}
                    />
                    <Bar
                      dataKey="count"
                      radius={[0, 6, 6, 0]}
                    >
                      {remediationsByPriority.map((entry) => (
                        <Cell key={entry.priority} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
