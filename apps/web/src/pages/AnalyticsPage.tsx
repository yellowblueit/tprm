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
import { MetricCard } from "@/components/ui/metric-card";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { CHART_TOOLTIP_STYLE, CHART_AXIS_STYLE, RISK_COLORS } from "@/lib/chart-config";

// ---------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------

const kpiData = [
  { label: "Total Vendors", value: "12", icon: Building2 },
  { label: "Average Inherent Risk", value: "62", icon: AlertTriangle },
  { label: "Average Residual Risk", value: "34", icon: ShieldCheck },
  { label: "Compliance Rate", value: "78%", icon: CheckCircle2 },
];

const riskDistribution = [
  { name: "Critical", value: 2, color: RISK_COLORS.critical },
  { name: "High", value: 3, color: RISK_COLORS.high },
  { name: "Medium", value: 4, color: RISK_COLORS.medium },
  { name: "Low", value: 2, color: RISK_COLORS.low },
  { name: "Minimal", value: 1, color: RISK_COLORS.minimal },
];

const vendorStages = [
  { stage: "Evaluating", count: 2 },
  { stage: "Screening", count: 3 },
  { stage: "Onboarded", count: 6 },
  { stage: "Offboarding", count: 1 },
];

const riskTrendData = [
  { month: "Jan", inherent: 70, residual: 42 },
  { month: "Feb", inherent: 68, residual: 40 },
  { month: "Mar", inherent: 65, residual: 38 },
  { month: "Apr", inherent: 63, residual: 35 },
  { month: "May", inherent: 61, residual: 33 },
  { month: "Jun", inherent: 62, residual: 34 },
];

const remediationsByPriority = [
  { priority: "Critical", count: 3, fill: RISK_COLORS.critical },
  { priority: "High", count: 5, fill: RISK_COLORS.high },
  { priority: "Medium", count: 8, fill: RISK_COLORS.medium },
  { priority: "Low", count: 2, fill: RISK_COLORS.low },
];

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export default function AnalyticsPage() {
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
                  <span className="text-2xl font-bold text-foreground">12</span>
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
          </CardContent>
        </Card>

        {/* Vendor Stages -- BarChart */}
        <Card>
          <CardHeader>
            <CardTitle>Vendor Stages</CardTitle>
          </CardHeader>
          <CardContent>
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
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={riskTrendData}
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
          </CardContent>
        </Card>

        {/* Remediations by Priority -- Horizontal BarChart */}
        <Card>
          <CardHeader>
            <CardTitle>Remediations by Priority</CardTitle>
          </CardHeader>
          <CardContent>
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
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
