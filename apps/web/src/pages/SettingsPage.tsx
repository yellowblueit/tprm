import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  Settings,
  Bell,
  Palette,
  Shield,
  Link2,
  Save,
  RotateCcw,
  Loader2,
  CheckCircle2,
  XCircle,
  HardDrive,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/components/common/PageHeader";
import { PageLoadingSkeleton } from "@/components/common/LoadingSkeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SelectNative } from "@/components/ui/select-native";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  useSettings,
  useUpdateSettings,
  useScoringMatrix,
  useUpdateScoringMatrix,
  useNotificationPrefs,
  useUpdateNotificationPrefs,
} from "@/hooks/use-settings";
import {
  useIntegrations,
  useUpsertIntegration,
  useTestIntegration,
  useDeleteIntegration,
  type Integration,
} from "@/hooks/use-integrations";

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
  const settingsQuery = useSettings();
  const updateSettings = useUpdateSettings();

  const [orgName, setOrgName] = useState("");
  const [reviewFrequency, setReviewFrequency] = useState("12");
  const [timezone, setTimezone] = useState("America/New_York");
  const [auditRetention, setAuditRetention] = useState("365");

  // Initialize from API data
  useEffect(() => {
    if (settingsQuery.data) {
      const d = settingsQuery.data;
      if (d.orgName) setOrgName(d.orgName as string);
      if (d.reviewFrequency) setReviewFrequency(String(d.reviewFrequency));
      if (d.timezone) setTimezone(d.timezone as string);
      if (d.auditRetention) setAuditRetention(String(d.auditRetention));
    }
  }, [settingsQuery.data]);

  if (settingsQuery.isLoading) return <PageLoadingSkeleton />;

  function handleSave() {
    updateSettings.mutate(
      {
        orgName,
        reviewFrequency: Number(reviewFrequency),
        timezone,
        auditRetention: Number(auditRetention),
      },
      {
        onSuccess: () => {
          toast.success("Settings saved", {
            description: "Your organization settings have been updated.",
          });
        },
        onError: (error) => {
          toast.error("Failed to save settings", {
            description: error instanceof Error ? error.message : "An unexpected error occurred.",
          });
        },
      }
    );
  }

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
            <SelectNative
              value={auditRetention}
              onChange={(e) => setAuditRetention(e.target.value)}
              className="max-w-md"
            >
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
          onClick={handleSave}
          disabled={updateSettings.isPending}
        >
          {updateSettings.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
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
  const prefsQuery = useNotificationPrefs();
  const updatePrefs = useUpdateNotificationPrefs();

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

  // Initialize from API data
  useEffect(() => {
    if (prefsQuery.data) {
      const d = prefsQuery.data;
      setPrefs((prev) => ({
        vendorOnboarded: typeof d.vendorOnboarded === "boolean" ? d.vendorOnboarded : prev.vendorOnboarded,
        riskScoreChange: typeof d.riskScoreChange === "boolean" ? d.riskScoreChange : prev.riskScoreChange,
        remediationDue: typeof d.remediationDue === "boolean" ? d.remediationDue : prev.remediationDue,
        remediationOverdue: typeof d.remediationOverdue === "boolean" ? d.remediationOverdue : prev.remediationOverdue,
        reviewCycleReminder: typeof d.reviewCycleReminder === "boolean" ? d.reviewCycleReminder : prev.reviewCycleReminder,
        monitoringAlert: typeof d.monitoringAlert === "boolean" ? d.monitoringAlert : prev.monitoringAlert,
        artifactExpiring: typeof d.artifactExpiring === "boolean" ? d.artifactExpiring : prev.artifactExpiring,
        weeklyDigest: typeof d.weeklyDigest === "boolean" ? d.weeklyDigest : prev.weeklyDigest,
      }));
    }
  }, [prefsQuery.data]);

  if (prefsQuery.isLoading) return <PageLoadingSkeleton />;

  function toggle(key: keyof typeof prefs) {
    setPrefs((p) => ({ ...p, [key]: !p[key] }));
  }

  function handleSave() {
    updatePrefs.mutate(prefs, {
      onSuccess: () => {
        toast.success("Notification preferences saved", {
          description: "Your notification settings have been updated.",
        });
      },
      onError: (error) => {
        toast.error("Failed to save preferences", {
          description: error instanceof Error ? error.message : "An unexpected error occurred.",
        });
      },
    });
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
          onClick={handleSave}
          disabled={updatePrefs.isPending}
        >
          {updatePrefs.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
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
  const matrixQuery = useScoringMatrix();
  const updateMatrix = useUpdateScoringMatrix();

  const [thresholds, setThresholds] = useState([
    { level: "Critical", min: 85, color: "text-red-500" },
    { level: "High", min: 65, color: "text-orange-500" },
    { level: "Medium", min: 40, color: "text-yellow-500" },
    { level: "Low", min: 20, color: "text-blue-500" },
    { level: "Minimal", min: 0, color: "text-cyan-500" },
  ]);

  const [weights, setWeights] = useState([
    { label: "Impact Weight", value: "0.60" },
    { label: "Likelihood Weight", value: "0.40" },
  ]);

  const [critWeights, setCritWeights] = useState([
    { label: "Critical", value: "1.00" },
    { label: "High", value: "0.75" },
    { label: "Medium", value: "0.50" },
    { label: "Low", value: "0.25" },
  ]);

  // Initialize from API data
  useEffect(() => {
    if (matrixQuery.data) {
      const d = matrixQuery.data;
      if (Array.isArray(d.thresholds)) {
        setThresholds(d.thresholds as typeof thresholds);
      }
      if (Array.isArray(d.weights)) {
        setWeights(d.weights as typeof weights);
      }
      if (Array.isArray(d.criticalityWeights)) {
        setCritWeights(d.criticalityWeights as typeof critWeights);
      }
    }
  }, [matrixQuery.data]);

  if (matrixQuery.isLoading) return <PageLoadingSkeleton />;

  function handleSave() {
    updateMatrix.mutate(
      {
        config: {
          thresholds,
          weights,
          criticalityWeights: critWeights,
        },
      },
      {
        onSuccess: () => {
          toast.success("Scoring matrix saved", {
            description: "Your scoring configuration has been updated.",
          });
        },
        onError: (error) => {
          toast.error("Failed to save scoring matrix", {
            description: error instanceof Error ? error.message : "An unexpected error occurred.",
          });
        },
      }
    );
  }

  function handleThresholdChange(index: number, value: number) {
    setThresholds((prev) =>
      prev.map((t, i) => (i === index ? { ...t, min: value } : t))
    );
  }

  function handleWeightChange(index: number, value: string) {
    setWeights((prev) =>
      prev.map((w, i) => (i === index ? { ...w, value } : w))
    );
  }

  function handleCritWeightChange(index: number, value: string) {
    setCritWeights((prev) =>
      prev.map((c, i) => (i === index ? { ...c, value } : c))
    );
  }

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader>
          <CardTitle>Risk Level Thresholds</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 max-w-md">
            {thresholds.map((t, i) => (
              <div key={t.level} className="flex items-center gap-3">
                <span className={cn("text-sm font-medium w-20", t.color)}>
                  {t.level}
                </span>
                <span className="text-xs text-muted-foreground w-6">
                  {"\u2265"}
                </span>
                <Input
                  type="number"
                  value={t.min}
                  onChange={(e) => handleThresholdChange(i, Number(e.target.value))}
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
            {weights.map((w, i) => (
              <div key={w.label} className="flex items-center gap-3">
                <span className="text-sm text-foreground w-40">{w.label}</span>
                <Input
                  type="text"
                  value={w.value}
                  onChange={(e) => handleWeightChange(i, e.target.value)}
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
            {critWeights.map((c, i) => (
              <div key={c.label} className="flex items-center gap-3">
                <span className="text-sm text-foreground w-40">{c.label}</span>
                <Input
                  type="text"
                  value={c.value}
                  onChange={(e) => handleCritWeightChange(i, e.target.value)}
                  className="w-20 text-center"
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-3 pt-2">
        <Button
          onClick={handleSave}
          disabled={updateMatrix.isPending}
        >
          {updateMatrix.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          Save Matrix
        </Button>
        <Button
          variant="secondary"
          onClick={() => {
            setThresholds([
              { level: "Critical", min: 85, color: "text-red-500" },
              { level: "High", min: 65, color: "text-orange-500" },
              { level: "Medium", min: 40, color: "text-yellow-500" },
              { level: "Low", min: 20, color: "text-blue-500" },
              { level: "Minimal", min: 0, color: "text-cyan-500" },
            ]);
            setWeights([
              { label: "Impact Weight", value: "0.60" },
              { label: "Likelihood Weight", value: "0.40" },
            ]);
            setCritWeights([
              { label: "Critical", value: "1.00" },
              { label: "High", value: "0.75" },
              { label: "Medium", value: "0.50" },
              { label: "Low", value: "0.25" },
            ]);
            toast.info("Defaults restored", {
              description: "Click Save Matrix to persist the default values.",
            });
          }}
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

interface IntegrationDef {
  type: string;
  name: string;
  desc: string;
  icon: typeof Shield;
  configurable: boolean;
  configFields?: { key: string; label: string; type: "text" | "select"; options?: string[] }[];
  credentialFields?: { key: string; label: string }[];
}

const INTEGRATION_DEFS: IntegrationDef[] = [
  {
    type: "ENTRA",
    name: "Microsoft Entra ID",
    desc: "Single sign-on and user provisioning (configured via environment).",
    icon: Shield,
    configurable: false,
  },
  {
    type: "S3",
    name: "S3 Storage (Wasabi / MinIO)",
    desc: "Artifact and report file storage.",
    icon: HardDrive,
    configurable: true,
    configFields: [
      { key: "endpoint", label: "Endpoint URL", type: "text" },
      { key: "region", label: "Region", type: "text" },
      { key: "bucketArtifacts", label: "Artifacts Bucket", type: "text" },
      { key: "bucketReports", label: "Reports Bucket", type: "text" },
      { key: "forcePathStyle", label: "Force Path Style", type: "select", options: ["true", "false"] },
    ],
    credentialFields: [
      { key: "accessKey", label: "Access Key" },
      { key: "secretKey", label: "Secret Key" },
    ],
  },
  {
    type: "ANTHROPIC",
    name: "Claude AI (Anthropic)",
    desc: "AI-powered vendor enrichment and artifact analysis.",
    icon: Palette,
    configurable: true,
    credentialFields: [{ key: "apiKey", label: "API Key" }],
  },
  {
    type: "SENDGRID",
    name: "SendGrid",
    desc: "Transactional email notifications.",
    icon: Bell,
    configurable: true,
    configFields: [
      { key: "fromEmail", label: "From Email", type: "text" },
      { key: "fromName", label: "From Name", type: "text" },
    ],
    credentialFields: [{ key: "apiKey", label: "API Key" }],
  },
];

function IntegrationsTab() {
  const integrationsQuery = useIntegrations();
  const [configuring, setConfiguring] = useState<IntegrationDef | null>(null);

  if (integrationsQuery.isLoading) return <PageLoadingSkeleton />;

  const savedMap = new Map<string, Integration>();
  for (const i of integrationsQuery.data ?? []) {
    savedMap.set(i.type, i);
  }

  return (
    <>
      <div className="space-y-4">
        <p className="text-xs text-muted-foreground">
          All credentials are encrypted at rest using AES-256-GCM. Secrets are
          never returned in plaintext after saving.
        </p>
        {INTEGRATION_DEFS.map((def) => {
          const saved = savedMap.get(def.type);
          const Icon = def.icon;
          const isConnected = saved?.isActive === true;
          const isFailed = saved?.lastTestStatus === "failure";

          return (
            <Card key={def.type} className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                    <Icon className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {def.name}
                    </p>
                    <p className="text-xs text-muted-foreground">{def.desc}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {isConnected ? (
                    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-green-500">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Connected
                    </span>
                  ) : isFailed ? (
                    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-red-500">
                      <XCircle className="h-3.5 w-3.5" />
                      Failed
                    </span>
                  ) : saved ? (
                    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-yellow-500">
                      <span className="h-1.5 w-1.5 rounded-full bg-yellow-500" />
                      Saved
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                      <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground" />
                      Not Configured
                    </span>
                  )}
                  {def.configurable ? (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setConfiguring(def)}
                    >
                      Configure
                    </Button>
                  ) : (
                    <Button variant="secondary" size="sm" disabled>
                      Environment
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {configuring && (
        <IntegrationDialog
          def={configuring}
          existing={savedMap.get(configuring.type) ?? null}
          onClose={() => setConfiguring(null)}
        />
      )}
    </>
  );
}

// ---------------------------------------------------------------------------
// Integration Configuration Dialog
// ---------------------------------------------------------------------------

function IntegrationDialog({
  def,
  existing,
  onClose,
}: {
  def: IntegrationDef;
  existing: Integration | null;
  onClose: () => void;
}) {
  const upsert = useUpsertIntegration();
  const test = useTestIntegration();
  const remove = useDeleteIntegration();

  // Config fields state
  const [config, setConfig] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    for (const f of def.configFields ?? []) {
      const existingVal = (existing?.config as Record<string, unknown>)?.[f.key];
      initial[f.key] = existingVal != null ? String(existingVal) : "";
    }
    return initial;
  });

  // Credential fields state (shows masked values from API)
  const [creds, setCreds] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    for (const f of def.credentialFields ?? []) {
      initial[f.key] = existing?.credentials?.[f.key] ?? "";
    }
    return initial;
  });

  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  function handleSave() {
    const payload: {
      displayName: string;
      config?: Record<string, unknown>;
      credentials?: Record<string, string>;
    } = {
      displayName: def.name,
    };

    if (def.configFields?.length) {
      payload.config = { ...config };
    }
    if (def.credentialFields?.length) {
      payload.credentials = { ...creds };
    }

    upsert.mutate(
      { type: def.type, data: payload },
      {
        onSuccess: () => {
          toast.success("Integration saved", {
            description: `${def.name} configuration has been saved. Credentials are encrypted at rest.`,
          });
          setTestResult(null);
        },
        onError: (err) => {
          toast.error("Failed to save integration", {
            description: err instanceof Error ? err.message : "An unexpected error occurred.",
          });
        },
      }
    );
  }

  function handleTest() {
    setTestResult(null);
    test.mutate(def.type, {
      onSuccess: (result) => {
        setTestResult(result);
        if (result.success) {
          toast.success("Connection successful", { description: result.message });
        } else {
          toast.error("Connection failed", { description: result.message });
        }
      },
      onError: (err) => {
        const msg = err instanceof Error ? err.message : "Unknown error";
        setTestResult({ success: false, message: msg });
        toast.error("Connection test failed", { description: msg });
      },
    });
  }

  function handleDelete() {
    remove.mutate(def.type, {
      onSuccess: () => {
        toast.success("Integration removed", {
          description: `${def.name} has been disconnected and credentials deleted.`,
        });
        onClose();
      },
      onError: (err) => {
        toast.error("Failed to remove integration", {
          description: err instanceof Error ? err.message : "An unexpected error occurred.",
        });
      },
    });
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogTitle>Configure {def.name}</DialogTitle>
        <DialogDescription>
          Enter your credentials below. All secrets are encrypted with
          AES-256-GCM before storage.
        </DialogDescription>

        <div className="mt-4 space-y-4">
          {/* Config fields */}
          {def.configFields?.map((f) => (
            <Field key={f.key} label={f.label}>
              {f.type === "select" ? (
                <SelectNative
                  value={config[f.key] ?? ""}
                  onChange={(e) =>
                    setConfig((p) => ({ ...p, [f.key]: e.target.value }))
                  }
                  className="max-w-full"
                >
                  {f.options?.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </SelectNative>
              ) : (
                <Input
                  type="text"
                  value={config[f.key] ?? ""}
                  onChange={(e) =>
                    setConfig((p) => ({ ...p, [f.key]: e.target.value }))
                  }
                  placeholder={f.label}
                />
              )}
            </Field>
          ))}

          {/* Credential fields */}
          {def.credentialFields?.map((f) => (
            <Field
              key={f.key}
              label={f.label}
              hint="Encrypted at rest. Shown masked after saving."
            >
              <Input
                type="password"
                value={creds[f.key] ?? ""}
                onChange={(e) =>
                  setCreds((p) => ({ ...p, [f.key]: e.target.value }))
                }
                placeholder={f.label}
              />
            </Field>
          ))}

          {/* Test result */}
          {testResult && (
            <div
              className={cn(
                "rounded-md border p-3 text-sm",
                testResult.success
                  ? "border-green-500/30 bg-green-500/10 text-green-500"
                  : "border-red-500/30 bg-red-500/10 text-red-500"
              )}
            >
              <div className="flex items-center gap-2">
                {testResult.success ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : (
                  <XCircle className="h-4 w-4" />
                )}
                {testResult.message}
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="mt-6 flex items-center justify-between">
          <div>
            {existing && (
              <Button
                variant="secondary"
                size="sm"
                onClick={handleDelete}
                disabled={remove.isPending}
              >
                {remove.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
                Remove
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              onClick={handleTest}
              disabled={test.isPending || upsert.isPending}
            >
              {test.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle2 className="h-4 w-4" />
              )}
              Test Connection
            </Button>
            <Button
              onClick={handleSave}
              disabled={upsert.isPending}
            >
              {upsert.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Save
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
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
