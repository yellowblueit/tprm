import { useState } from "react";
import { toast } from "sonner";
import {
  Settings,
  Bell,
  Palette,
  Shield,
  Link2,
  Save,
  RotateCcw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/components/common/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SelectNative } from "@/components/ui/select-native";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

// ---------------------------------------------------------------------------
// Tab types
// ---------------------------------------------------------------------------

type SettingsTab = "general" | "notifications" | "scoring" | "integrations";

const TABS: { id: SettingsTab; label: string; icon: typeof Settings }[] = [
  { id: "general", label: "General", icon: Settings },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "scoring", label: "Scoring Matrix", icon: Shield },
  { id: "integrations", label: "Integrations", icon: Link2 },
];

// ---------------------------------------------------------------------------
// General Tab
// ---------------------------------------------------------------------------

function GeneralTab() {
  const [orgName, setOrgName] = useState("Acme MSP");
  const [reviewFrequency, setReviewFrequency] = useState("12");
  const [timezone, setTimezone] = useState("America/New_York");

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader>
          <CardTitle>Organization</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Field label="Organization Name">
            <Input
              type="text"
              value={orgName}
              onChange={(e) => setOrgName(e.target.value)}
              className="max-w-md"
            />
          </Field>
          <Field label="Default Timezone">
            <SelectNative
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              className="max-w-md"
            >
              <option value="America/New_York">Eastern (ET)</option>
              <option value="America/Chicago">Central (CT)</option>
              <option value="America/Denver">Mountain (MT)</option>
              <option value="America/Los_Angeles">Pacific (PT)</option>
              <option value="UTC">UTC</option>
            </SelectNative>
          </Field>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Vendor Defaults</CardTitle>
        </CardHeader>
        <CardContent>
          <Field
            label="Default Review Frequency (months)"
            hint="How often vendors should be reviewed after onboarding."
          >
            <Input
              type="number"
              min={1}
              max={60}
              value={reviewFrequency}
              onChange={(e) => setReviewFrequency(e.target.value)}
              className="w-24"
            />
          </Field>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Data Retention</CardTitle>
        </CardHeader>
        <CardContent>
          <Field
            label="Audit Log Retention"
            hint="Duration to keep audit log entries."
          >
            <SelectNative defaultValue="365" className="max-w-md">
              <option value="90">90 days</option>
              <option value="180">180 days</option>
              <option value="365">1 year</option>
              <option value="730">2 years</option>
            </SelectNative>
          </Field>
        </CardContent>
      </Card>

      <div className="flex gap-3 pt-2">
        <Button
          onClick={() => toast.info("Settings not saved", { description: "Settings persistence will be available with API integration." })}
        >
          <Save className="h-4 w-4" />
          Save Changes
        </Button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Notifications Tab
// ---------------------------------------------------------------------------

function NotificationsTab() {
  const [prefs, setPrefs] = useState({
    vendorOnboarded: true,
    riskScoreChange: true,
    remediationDue: true,
    remediationOverdue: true,
    reviewCycleReminder: true,
    monitoringAlert: true,
    artifactExpiring: false,
    weeklyDigest: true,
  });

  function toggle(key: keyof typeof prefs) {
    setPrefs((p) => ({ ...p, [key]: !p[key] }));
  }

  const items: { key: keyof typeof prefs; label: string; desc: string }[] = [
    {
      key: "vendorOnboarded",
      label: "Vendor Onboarded",
      desc: "When a new vendor completes onboarding.",
    },
    {
      key: "riskScoreChange",
      label: "Risk Score Change",
      desc: "When a vendor's risk level changes.",
    },
    {
      key: "remediationDue",
      label: "Remediation Due",
      desc: "Reminder before a remediation is due.",
    },
    {
      key: "remediationOverdue",
      label: "Remediation Overdue",
      desc: "When a remediation passes its due date.",
    },
    {
      key: "reviewCycleReminder",
      label: "Review Cycle Reminder",
      desc: "Upcoming vendor review cycle notifications.",
    },
    {
      key: "monitoringAlert",
      label: "Monitoring Alert",
      desc: "New security or breach alerts detected.",
    },
    {
      key: "artifactExpiring",
      label: "Artifact Expiring",
      desc: "When a security certificate is nearing expiration.",
    },
    {
      key: "weeklyDigest",
      label: "Weekly Digest",
      desc: "Summary of risk changes and actions needed.",
    },
  ];

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader>
          <CardTitle>Email Notifications</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-1">
            {items.map((item) => (
              <label
                key={item.key}
                className="flex items-center justify-between rounded-md px-3 py-3 hover:bg-muted/50 transition-colors cursor-pointer"
              >
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {item.label}
                  </p>
                  <p className="text-xs text-muted-foreground">{item.desc}</p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={prefs[item.key]}
                  onClick={() => toggle(item.key)}
                  className={cn(
                    "relative inline-flex h-5 w-9 shrink-0 rounded-full transition-colors",
                    prefs[item.key] ? "bg-primary" : "bg-muted"
                  )}
                >
                  <span
                    className={cn(
                      "pointer-events-none inline-block h-4 w-4 rounded-full bg-white transition-transform mt-0.5",
                      prefs[item.key] ? "translate-x-4 ml-0.5" : "translate-x-0.5"
                    )}
                  />
                </button>
              </label>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-3 pt-2">
        <Button
          onClick={() => toast.info("Preferences not saved", { description: "Notification preference persistence will be available with API integration." })}
        >
          <Save className="h-4 w-4" />
          Save Preferences
        </Button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Scoring Matrix Tab
// ---------------------------------------------------------------------------

function ScoringMatrixTab() {
  const thresholds = [
    { level: "Critical", min: 85, color: "text-red-500" },
    { level: "High", min: 65, color: "text-orange-500" },
    { level: "Medium", min: 40, color: "text-yellow-500" },
    { level: "Low", min: 20, color: "text-blue-500" },
    { level: "Minimal", min: 0, color: "text-cyan-500" },
  ];

  const weights = [
    { label: "Impact Weight", value: "0.60" },
    { label: "Likelihood Weight", value: "0.40" },
  ];

  const critWeights = [
    { label: "Critical", value: "1.00" },
    { label: "High", value: "0.75" },
    { label: "Medium", value: "0.50" },
    { label: "Low", value: "0.25" },
  ];

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader>
          <CardTitle>Risk Level Thresholds</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 max-w-md">
            {thresholds.map((t) => (
              <div key={t.level} className="flex items-center gap-3">
                <span className={cn("text-sm font-medium w-20", t.color)}>
                  {t.level}
                </span>
                <span className="text-xs text-muted-foreground w-6">
                  {"\u2265"}
                </span>
                <Input
                  type="number"
                  defaultValue={t.min}
                  min={0}
                  max={100}
                  className="w-20 text-center"
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Formula Weights</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground mb-3">
            InherentRisk = (Impact x Weight) + (Likelihood x Weight). Must sum to
            1.0.
          </p>
          <div className="grid gap-3 max-w-md">
            {weights.map((w) => (
              <div key={w.label} className="flex items-center gap-3">
                <span className="text-sm text-foreground w-40">{w.label}</span>
                <Input
                  type="text"
                  defaultValue={w.value}
                  className="w-20 text-center"
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Criticality Multipliers</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 max-w-md">
            {critWeights.map((c) => (
              <div key={c.label} className="flex items-center gap-3">
                <span className="text-sm text-foreground w-40">{c.label}</span>
                <Input
                  type="text"
                  defaultValue={c.value}
                  className="w-20 text-center"
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-3 pt-2">
        <Button
          onClick={() => toast.info("Scoring matrix not saved", { description: "Scoring matrix persistence will be available with API integration." })}
        >
          <Save className="h-4 w-4" />
          Save Matrix
        </Button>
        <Button
          variant="secondary"
          onClick={() => toast.info("Reset not available", { description: "Scoring matrix reset will be available with API integration." })}
        >
          <RotateCcw className="h-4 w-4" />
          Reset Defaults
        </Button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Integrations Tab
// ---------------------------------------------------------------------------

function IntegrationsTab() {
  const integrations = [
    {
      name: "Microsoft Entra ID",
      desc: "Single sign-on and user provisioning.",
      status: "connected" as const,
      icon: Shield,
    },
    {
      name: "Claude AI (Anthropic)",
      desc: "AI-powered vendor enrichment and artifact analysis.",
      status: "not_configured" as const,
      icon: Palette,
    },
    {
      name: "SendGrid",
      desc: "Transactional email notifications.",
      status: "not_configured" as const,
      icon: Bell,
    },
    {
      name: "MinIO (S3 Storage)",
      desc: "Artifact and report file storage.",
      status: "connected" as const,
      icon: Link2,
    },
  ];

  return (
    <div className="space-y-4">
      {integrations.map((integ) => {
        const Icon = integ.icon;
        return (
          <Card key={integ.name} className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                  <Icon className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {integ.name}
                  </p>
                  <p className="text-xs text-muted-foreground">{integ.desc}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {integ.status === "connected" ? (
                  <span className="inline-flex items-center gap-1.5 text-xs font-medium text-green-500">
                    <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                    Connected
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                    <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground" />
                    Not Configured
                  </span>
                )}
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => toast.info(`Configure ${integ.name}`, { description: "Integration configuration will be available in a future update." })}
                >
                  Configure
                </Button>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-sm text-foreground mb-1.5">{label}</label>
      {children}
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<SettingsTab>("general");

  return (
    <>
      <PageHeader
        title="Settings"
        description="Configure platform settings, notifications, and integrations."
      />

      <div className="flex flex-col gap-5 lg:flex-row">
        {/* Tab nav */}
        <nav className="flex flex-row gap-1 lg:flex-col lg:w-48 shrink-0">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors text-left",
                  activeTab === tab.id
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </nav>

        {/* Tab content */}
        <div className="flex-1 min-w-0">
          {activeTab === "general" && <GeneralTab />}
          {activeTab === "notifications" && <NotificationsTab />}
          {activeTab === "scoring" && <ScoringMatrixTab />}
          {activeTab === "integrations" && <IntegrationsTab />}
        </div>
      </div>
    </>
  );
}
