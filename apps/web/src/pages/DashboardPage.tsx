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
  TrendingUp,
  TrendingDown,
  Calendar,
  ArrowUpRight,
} from "lucide-react";
import { Link } from "react-router";
import { PageHeader } from "@/components/common/PageHeader";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Card, CardHeader, CardContent } from "@/components/ui";
import { CHART_TOOLTIP_STYLE, CHART_AXIS_STYLE } from "@/lib/chart-config";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------

const kpiData = [
  { label: "Total Vendors", value: 247, trend: 12.5, trendUp: true, icon: Building2 },
  { label: "High / Critical Risk", value: 18, trend: -3.2, trendUp: false, icon: AlertTriangle, invertTrend: true },
  { label: "Open Remediations", value: 34, trend: 8.1, trendUp: true, icon: ClipboardCheck },
  { label: "Reviews (30 days)", value: 12, trend: 0, trendUp: true, icon: Calendar },
  { label: "Compliance Coverage", value: "87%", trend: 4.3, trendUp: true, icon: Shield },
];

const riskDistribution = [
  { name: "Critical", value: 6, color: "#dc2626" },
  { name: "High", value: 12, color: "#ea580c" },
  { name: "Medium", value: 58, color: "#eab308" },
  { name: "Low", value: 124, color: "#22c55e" },
  { name: "Minimal", value: 47, color: "#06b6d4" },
];

const pipelineData = [
  { stage: "Evaluating", count: 31, color: "#3b82f6" },
  { stage: "Screening", count: 18, color: "#8b5cf6" },
  { stage: "Onboarded", count: 198, color: "#22c55e" },
];

const recentAlerts = [
  { id: 1, title: "SOC 2 report expired", vendor: "CloudSync Ltd.", severity: "critical" as const, timeAgo: "12 min ago" },
  { id: 2, title: "New data breach disclosed", vendor: "DataVault Inc.", severity: "high" as const, timeAgo: "1 hr ago" },
  { id: 3, title: "SLA violation detected", vendor: "NetOps Pro", severity: "medium" as const, timeAgo: "3 hrs ago" },
  { id: 4, title: "Insurance policy lapsing", vendor: "SecureHost Co.", severity: "high" as const, timeAgo: "5 hrs ago" },
  { id: 5, title: "Subprocessor change notification", vendor: "PayStream Global", severity: "low" as const, timeAgo: "1 day ago" },
];

const remediationData = [
  { status: "Open", count: 14, fill: "#dc2626" },
  { status: "In Progress", count: 9, fill: "#eab308" },
  { status: "Awaiting Vendor", count: 6, fill: "#ea580c" },
  { status: "Completed", count: 42, fill: "#22c55e" },
];

const riskTrendData = [
  { month: "Jan", inherent: 72, residual: 41 },
  { month: "Feb", inherent: 68, residual: 38 },
  { month: "Mar", inherent: 74, residual: 36 },
  { month: "Apr", inherent: 71, residual: 33 },
  { month: "May", inherent: 69, residual: 30 },
  { month: "Jun", inherent: 66, residual: 28 },
];

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
  const riskTotal = riskDistribution.reduce((sum, d) => sum + d.value, 0);
  const pipelineMax = Math.max(...pipelineData.map((d) => d.count));

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
          const positive = kpi.invertTrend ? !kpi.trendUp : kpi.trendUp;
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
              {kpi.trend !== 0 ? (
                <div className={cn("mt-2 flex items-center gap-1 text-xs font-medium", positive ? "text-green-500" : "text-red-500")}>
                  {kpi.trendUp ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                  <span>{Math.abs(kpi.trend)}% vs last month</span>
                </div>
              ) : (
                <div className="mt-2 flex items-center gap-1 text-xs font-medium text-muted-foreground">
                  <Activity className="h-3 w-3" />
                  <span>Scheduled</span>
                </div>
              )}
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
          </CardContent>
        </Card>

        {/* Vendor Pipeline */}
        <Card>
          <CardHeader>
            <h2 className="text-sm font-semibold text-foreground">Vendor Stage Pipeline</h2>
            <ChartLink to="/vendors" />
          </CardHeader>
          <CardContent>
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
          </CardContent>
        </Card>

        {/* Risk Trend */}
        <Card>
          <CardHeader>
            <div>
              <h2 className="text-sm font-semibold text-foreground">Risk Trend (6 Months)</h2>
              <p className="mt-0.5 text-xs text-muted-foreground">Avg. inherent vs residual risk score</p>
            </div>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <span className="inline-block h-2 w-2 rounded-full bg-red-500" />
                Inherent
              </span>
              <span className="flex items-center gap-1.5">
                <span className="inline-block h-2 w-2 rounded-full bg-primary" />
                Residual
              </span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={riskTrendData} margin={{ top: 4, right: 8, bottom: 0, left: -20 }}>
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
          <div className="divide-y divide-border">
            {recentAlerts.map((alert) => (
              <div key={alert.id} className="flex items-center gap-3 px-4 py-3">
                <div
                  className={cn(
                    "flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-md",
                    alert.severity === "critical" && "bg-red-950",
                    alert.severity === "high" && "bg-orange-950",
                    alert.severity === "medium" && "bg-yellow-950",
                    alert.severity === "low" && "bg-muted"
                  )}
                >
                  <AlertTriangle
                    className={cn(
                      "h-4 w-4",
                      alert.severity === "critical" && "text-red-400",
                      alert.severity === "high" && "text-orange-400",
                      alert.severity === "medium" && "text-yellow-400",
                      alert.severity === "low" && "text-muted-foreground"
                    )}
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">{alert.title}</p>
                  <p className="text-xs text-muted-foreground">{alert.vendor}</p>
                </div>
                <div className="flex flex-shrink-0 items-center gap-3">
                  <StatusBadge variant={alert.severity}>
                    {alert.severity.charAt(0).toUpperCase() + alert.severity.slice(1)}
                  </StatusBadge>
                  <span className="hidden text-xs text-muted-foreground sm:inline">{alert.timeAgo}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
