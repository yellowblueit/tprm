import { useState, useCallback, useEffect } from "react";
import { Link, useNavigate } from "react-router";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Loader2,
  Globe,
  Building2,
  Users,
  CalendarDays,
  FileText,
  Shield,
  Send,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/components/common/PageHeader";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SelectNative } from "@/components/ui/select-native";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { useCreateVendor } from "@/hooks/use-vendors";
import { BUSINESS_CASES } from "@tprm/shared";
import { DATA_CLASSIFICATIONS } from "@tprm/shared";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface BasicInfoData {
  name: string;
  website: string;
  description: string;
  industry: string;
  headquartersCountry: string;
  employeeCount: string;
  yearFounded: string;
}

interface WizardState {
  basicInfo: BasicInfoData;
  selectedBusinessCases: string[];
  selectedDataClassifications: string[];
  criticality: string;
  reviewFrequency: string;
}

type StepId = 1 | 2 | 3 | 4 | 5;

interface StepDefinition {
  id: StepId;
  label: string;
  icon: React.ElementType;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const STEPS: StepDefinition[] = [
  { id: 1, label: "Basic Info", icon: Building2 },
  { id: 2, label: "Business Cases", icon: FileText },
  { id: 3, label: "Data Classification", icon: Shield },
  { id: 4, label: "Criticality & Owners", icon: Users },
  { id: 5, label: "Review", icon: Check },
];

const INDUSTRIES = [
  "Technology",
  "Financial Services",
  "Healthcare",
  "Cloud Infrastructure",
  "Cybersecurity",
  "Data Analytics",
  "Artificial Intelligence",
  "Payment Processing",
  "Human Resources",
  "Logistics",
  "Consulting",
  "Legal",
  "Marketing",
  "Other",
];

const EMPLOYEE_COUNTS = [
  "1-50",
  "51-200",
  "201-1000",
  "1001-5000",
  "5000+",
];

const REVIEW_FREQUENCIES = [
  { value: "3", label: "Every 3 months" },
  { value: "6", label: "Every 6 months" },
  { value: "12", label: "Every 12 months" },
  { value: "18", label: "Every 18 months" },
  { value: "24", label: "Every 24 months" },
];

const CRITICALITY_OPTIONS = [
  { value: "Low", color: "bg-blue-500", textColor: "text-blue-400", bgColor: "bg-blue-950/50 border-blue-800" },
  { value: "Medium", color: "bg-yellow-500", textColor: "text-yellow-400", bgColor: "bg-yellow-950/50 border-yellow-800" },
  { value: "High", color: "bg-orange-500", textColor: "text-orange-400", bgColor: "bg-orange-950/50 border-orange-800" },
  { value: "Critical", color: "bg-red-500", textColor: "text-red-400", bgColor: "bg-red-950/50 border-red-800" },
];

const SENSITIVITY_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  EXTREME: { bg: "bg-red-950/50", text: "text-red-400", border: "border-red-800" },
  MEDIUM: { bg: "bg-yellow-950/50", text: "text-yellow-400", border: "border-yellow-800" },
  LOW: { bg: "bg-green-950/50", text: "text-green-400", border: "border-green-800" },
};

// ---------------------------------------------------------------------------
// Animation variants (wizard step slide only)
// ---------------------------------------------------------------------------

const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 300 : -300,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    x: direction > 0 ? -300 : 300,
    opacity: 0,
  }),
};

// ---------------------------------------------------------------------------
// Step Indicator
// ---------------------------------------------------------------------------

function StepIndicator({
  steps,
  currentStep,
  onStepClick,
}: {
  steps: StepDefinition[];
  currentStep: StepId;
  onStepClick: (step: StepId) => void;
}) {
  return (
    <div className="mb-8">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const isCompleted = step.id < currentStep;
          const isCurrent = step.id === currentStep;
          const isClickable = step.id <= currentStep;
          const Icon = step.icon;

          return (
            <div key={step.id} className="flex flex-1 items-center">
              {/* Step circle */}
              <button
                type="button"
                onClick={() => isClickable && onStepClick(step.id)}
                disabled={!isClickable}
                className={cn(
                  "relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold transition-colors duration-200",
                  isCompleted &&
                    "bg-primary text-primary-foreground cursor-pointer",
                  isCurrent &&
                    "bg-primary text-primary-foreground cursor-default",
                  !isCompleted &&
                    !isCurrent &&
                    "bg-muted text-muted-foreground cursor-not-allowed"
                )}
              >
                {isCompleted ? (
                  <Check className="h-5 w-5" />
                ) : (
                  <Icon className="h-4 w-4" />
                )}
              </button>

              {/* Connector line */}
              {index < steps.length - 1 && (
                <div className="mx-2 h-0.5 flex-1">
                  <div
                    className={cn(
                      "h-full rounded-full transition-colors duration-200",
                      step.id < currentStep
                        ? "bg-primary"
                        : "bg-muted"
                    )}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Step labels row */}
      <div className="mt-3 flex justify-between">
        {steps.map((step) => {
          const isCurrent = step.id === currentStep;
          const isCompleted = step.id < currentStep;
          return (
            <p
              key={step.id}
              className={cn(
                "flex-1 text-center text-xs font-medium transition-colors",
                isCurrent
                  ? "text-primary"
                  : isCompleted
                  ? "text-foreground"
                  : "text-muted-foreground"
              )}
            >
              <span className="hidden sm:inline">{step.label}</span>
              <span className="sm:hidden">{step.id}</span>
            </p>
          );
        })}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step 1: Basic Info
// ---------------------------------------------------------------------------

function StepBasicInfo({
  data,
  onChange,
}: {
  data: BasicInfoData;
  onChange: (data: BasicInfoData) => void;
}) {
  const handleChange = (
    field: keyof BasicInfoData,
    value: string
  ) => {
    onChange({ ...data, [field]: value });
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold text-foreground">
          Basic Information
        </h2>
        <p className="text-sm text-muted-foreground">
          Enter the vendor's basic details.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        {/* Name */}
        <div className="md:col-span-2">
          <label className="mb-1.5 block text-sm font-medium text-foreground">
            Vendor Name <span className="text-red-500">*</span>
          </label>
          <Input
            type="text"
            value={data.name}
            onChange={(e) => handleChange("name", e.target.value)}
            placeholder="Enter vendor name"
          />
        </div>

        {/* Website */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">
            Website URL
          </label>
          <div className="relative">
            <Globe className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="url"
              value={data.website}
              onChange={(e) => handleChange("website", e.target.value)}
              placeholder="https://example.com"
              className="pl-9"
            />
          </div>
        </div>

        {/* Industry */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">
            Industry
          </label>
          <SelectNative
            value={data.industry}
            onChange={(e) => handleChange("industry", e.target.value)}
            className="w-full"
          >
            <option value="">Select industry</option>
            {INDUSTRIES.map((ind) => (
              <option key={ind} value={ind}>
                {ind}
              </option>
            ))}
          </SelectNative>
        </div>

        {/* HQ Country */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">
            HQ Country
          </label>
          <Input
            type="text"
            value={data.headquartersCountry}
            onChange={(e) =>
              handleChange("headquartersCountry", e.target.value)
            }
            placeholder="e.g., United States"
          />
        </div>

        {/* Employee Count */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">
            Employee Count
          </label>
          <SelectNative
            value={data.employeeCount}
            onChange={(e) => handleChange("employeeCount", e.target.value)}
            className="w-full"
          >
            <option value="">Select range</option>
            {EMPLOYEE_COUNTS.map((ec) => (
              <option key={ec} value={ec}>
                {ec}
              </option>
            ))}
          </SelectNative>
        </div>

        {/* Year Founded */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">
            Year Founded
          </label>
          <div className="relative">
            <CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              value={data.yearFounded}
              onChange={(e) => handleChange("yearFounded", e.target.value)}
              placeholder="e.g., 2015"
              className="pl-9"
            />
          </div>
        </div>

        {/* Description */}
        <div className="md:col-span-2">
          <label className="mb-1.5 block text-sm font-medium text-foreground">
            Description
          </label>
          <Textarea
            value={data.description}
            onChange={(e) => handleChange("description", e.target.value)}
            placeholder="Brief description of the vendor's services..."
            rows={4}
          />
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step 2: Business Cases
// ---------------------------------------------------------------------------

function StepBusinessCases({
  selected,
  onToggle,
}: {
  selected: string[];
  onToggle: (type: string) => void;
}) {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold text-foreground">
          Business Cases
        </h2>
        <p className="text-sm text-muted-foreground">
          Select all business cases that apply to this vendor relationship.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {BUSINESS_CASES.map((bc) => {
          const isSelected = selected.includes(bc.type);
          return (
            <button
              key={bc.type}
              type="button"
              onClick={() => onToggle(bc.type)}
              className={cn(
                "flex flex-col items-start rounded-lg border-2 p-4 text-left transition-colors duration-200",
                isSelected
                  ? "border-primary bg-primary/5"
                  : "border-border bg-card hover:border-primary/30 hover:bg-muted/30"
              )}
            >
              <div className="mb-2 flex w-full items-center justify-between">
                <h3 className="text-sm font-semibold text-foreground">
                  {bc.label}
                </h3>
                <div
                  className={cn(
                    "flex h-5 w-5 items-center justify-center rounded-md border-2 transition-colors",
                    isSelected
                      ? "border-primary bg-primary"
                      : "border-border bg-card"
                  )}
                >
                  {isSelected && (
                    <Check className="h-3 w-3 text-primary-foreground" />
                  )}
                </div>
              </div>
              <p className="text-xs leading-relaxed text-muted-foreground">
                {bc.description}
              </p>
              <span className="mt-2 inline-block rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                Weight: {Math.round(bc.defaultWeight * 100)}%
              </span>
            </button>
          );
        })}
      </div>

      <p className="text-xs text-muted-foreground">
        {selected.length} of {BUSINESS_CASES.length} business cases selected
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step 3: Data Classification
// ---------------------------------------------------------------------------

function StepDataClassification({
  selected,
  onToggle,
}: {
  selected: string[];
  onToggle: (name: string) => void;
}) {
  // Group by category then by sensitivity
  const companyData = DATA_CLASSIFICATIONS.filter(
    (dc) => dc.category === "COMPANY"
  );
  const customerData = DATA_CLASSIFICATIONS.filter(
    (dc) => dc.category === "CUSTOMER"
  );

  const groupBySensitivity = (
    items: typeof DATA_CLASSIFICATIONS
  ) => {
    const groups: Record<string, typeof DATA_CLASSIFICATIONS> = {};
    for (const item of items) {
      if (!groups[item.sensitivityLevel]) {
        groups[item.sensitivityLevel] = [];
      }
      groups[item.sensitivityLevel].push(item);
    }
    return groups;
  };

  const renderGroup = (
    title: string,
    items: typeof DATA_CLASSIFICATIONS
  ) => {
    const grouped = groupBySensitivity(items);
    const order = ["EXTREME", "MEDIUM", "LOW"];

    return (
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        {order.map((level) => {
          const groupItems = grouped[level];
          if (!groupItems || groupItems.length === 0) return null;
          const colors = SENSITIVITY_COLORS[level];

          return (
            <div key={level} className="space-y-2">
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    "rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase",
                    colors.bg,
                    colors.text,
                    colors.border
                  )}
                >
                  {level}
                </span>
              </div>

              <div className="space-y-1.5">
                {groupItems.map((dc) => {
                  const isSelected = selected.includes(dc.name);
                  return (
                    <button
                      key={dc.name}
                      type="button"
                      onClick={() => onToggle(dc.name)}
                      className={cn(
                        "flex w-full items-start gap-3 rounded-md border p-3 text-left transition-colors duration-200",
                        isSelected
                          ? "border-primary bg-primary/5"
                          : "border-border bg-card hover:border-primary/20"
                      )}
                    >
                      <div
                        className={cn(
                          "mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border-2 transition-colors",
                          isSelected
                            ? "border-primary bg-primary"
                            : "border-border"
                        )}
                      >
                        {isSelected && (
                          <Check className="h-2.5 w-2.5 text-primary-foreground" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-foreground">
                            {dc.name}
                          </span>
                          <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground">
                            {dc.weightPercentage}%
                          </span>
                        </div>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {dc.description}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold text-foreground">
          Data Classification
        </h2>
        <p className="text-sm text-muted-foreground">
          Select the types of data this vendor will access, process, or store.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        {renderGroup("Company Data", companyData)}
        {renderGroup("Customer Data", customerData)}
      </div>

      <p className="text-xs text-muted-foreground">
        {selected.length} data classification{selected.length !== 1 ? "s" : ""}{" "}
        selected
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step 4: Criticality & Owners
// ---------------------------------------------------------------------------

function StepCriticalityOwners({
  criticality,
  reviewFrequency,
  onCriticalityChange,
  onReviewFrequencyChange,
}: {
  criticality: string;
  reviewFrequency: string;
  onCriticalityChange: (v: string) => void;
  onReviewFrequencyChange: (v: string) => void;
}) {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-lg font-semibold text-foreground">
          Criticality & Owners
        </h2>
        <p className="text-sm text-muted-foreground">
          Set the vendor criticality level, review frequency, and assign owners.
        </p>
      </div>

      {/* Criticality */}
      <div className="space-y-3">
        <label className="block text-sm font-medium text-foreground">
          Vendor Criticality
        </label>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {CRITICALITY_OPTIONS.map((opt) => {
            const isSelected = criticality === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => onCriticalityChange(opt.value)}
                className={cn(
                  "flex flex-col items-center gap-2 rounded-lg border-2 p-4 transition-colors duration-200",
                  isSelected
                    ? opt.bgColor
                    : "border-border bg-card hover:border-primary/20"
                )}
              >
                <div
                  className={cn(
                    "h-4 w-4 rounded-full",
                    opt.color
                  )}
                />
                <span
                  className={cn(
                    "text-sm font-semibold",
                    isSelected ? opt.textColor : "text-foreground"
                  )}
                >
                  {opt.value}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Review Frequency */}
      <div className="space-y-3">
        <label className="block text-sm font-medium text-foreground">
          Review Frequency
        </label>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
          {REVIEW_FREQUENCIES.map((rf) => {
            const isSelected = reviewFrequency === rf.value;
            return (
              <button
                key={rf.value}
                type="button"
                onClick={() => onReviewFrequencyChange(rf.value)}
                className={cn(
                  "rounded-lg border-2 px-3 py-3 text-center transition-colors duration-200",
                  isSelected
                    ? "border-primary bg-primary/5"
                    : "border-border bg-card hover:border-primary/20"
                )}
              >
                <p
                  className={cn(
                    "text-lg font-bold",
                    isSelected ? "text-primary" : "text-foreground"
                  )}
                >
                  {rf.value}
                </p>
                <p className="text-[10px] text-muted-foreground">months</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Owner Assignment Placeholder */}
      <div className="space-y-3">
        <label className="block text-sm font-medium text-foreground">
          Owner Assignment
        </label>
        <div className="flex items-center justify-center rounded-lg border-2 border-dashed border-border bg-muted/20 p-8">
          <div className="text-center">
            <Users className="mx-auto mb-2 h-8 w-8 text-muted-foreground/50" />
            <p className="text-sm font-medium text-muted-foreground">
              Select team members
            </p>
            <p className="mt-1 text-xs text-muted-foreground/70">
              Team member selection will be available after initial setup.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step 5: Review
// ---------------------------------------------------------------------------

function StepReview({ state }: { state: WizardState }) {
  const [animateGauge, setAnimateGauge] = useState(false);

  // Trigger gauge animation on mount
  useEffect(() => {
    const timer = setTimeout(() => setAnimateGauge(true), 300);
    return () => clearTimeout(timer);
  }, []);

  // Calculate a mock inherent risk score
  const mockRiskScore = Math.min(
    100,
    state.selectedBusinessCases.length * 8 +
      state.selectedDataClassifications.length * 5 +
      (state.criticality === "Critical"
        ? 20
        : state.criticality === "High"
        ? 15
        : state.criticality === "Medium"
        ? 10
        : 5)
  );

  const riskLevel =
    mockRiskScore >= 80
      ? "Critical"
      : mockRiskScore >= 60
      ? "High"
      : mockRiskScore >= 40
      ? "Medium"
      : mockRiskScore >= 20
      ? "Low"
      : "Minimal";

  const riskColor =
    mockRiskScore >= 80
      ? "#ef4444"
      : mockRiskScore >= 60
      ? "#f97316"
      : mockRiskScore >= 40
      ? "#eab308"
      : mockRiskScore >= 20
      ? "#3b82f6"
      : "#94a3b8";

  // SVG gauge
  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (mockRiskScore / 100) * circumference;

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-lg font-semibold text-foreground">
          Review & Submit
        </h2>
        <p className="text-sm text-muted-foreground">
          Review your selections before creating the vendor.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {/* Risk Gauge */}
        <Card className="flex flex-col items-center justify-center p-6">
          <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Estimated Inherent Risk
          </p>
          <div className="relative">
            <svg
              width="150"
              height="150"
              viewBox="0 0 150 150"
              className="-rotate-90"
            >
              {/* Background circle */}
              <circle
                cx="75"
                cy="75"
                r={radius}
                fill="none"
                stroke="currentColor"
                strokeWidth="10"
                className="text-muted/30"
              />
              {/* Progress circle */}
              <motion.circle
                cx="75"
                cy="75"
                r={radius}
                fill="none"
                stroke={riskColor}
                strokeWidth="10"
                strokeLinecap="round"
                strokeDasharray={circumference}
                initial={{ strokeDashoffset: circumference }}
                animate={{
                  strokeDashoffset: animateGauge
                    ? strokeDashoffset
                    : circumference,
                }}
                transition={{ duration: 1.5, ease: "easeOut" }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <motion.span
                className="text-3xl font-bold text-foreground"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                {mockRiskScore}
              </motion.span>
              <span className="text-xs text-muted-foreground">{riskLevel}</span>
            </div>
          </div>
        </Card>

        {/* Summary */}
        <div className="space-y-4 lg:col-span-2">
          {/* Basic Info */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                <div>
                  <span className="text-muted-foreground">Name:</span>{" "}
                  <span className="font-medium text-foreground">
                    {state.basicInfo.name || "Not provided"}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Website:</span>{" "}
                  <span className="font-medium text-foreground">
                    {state.basicInfo.website || "Not provided"}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Industry:</span>{" "}
                  <span className="font-medium text-foreground">
                    {state.basicInfo.industry || "Not provided"}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Country:</span>{" "}
                  <span className="font-medium text-foreground">
                    {state.basicInfo.headquartersCountry || "Not provided"}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Employees:</span>{" "}
                  <span className="font-medium text-foreground">
                    {state.basicInfo.employeeCount || "Not provided"}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Founded:</span>{" "}
                  <span className="font-medium text-foreground">
                    {state.basicInfo.yearFounded || "Not provided"}
                  </span>
                </div>
              </div>
              {state.basicInfo.description && (
                <p className="mt-2 text-xs text-muted-foreground">
                  {state.basicInfo.description}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Business Cases */}
          <Card>
            <CardHeader>
              <CardTitle>Business Cases ({state.selectedBusinessCases.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-1.5">
                {state.selectedBusinessCases.length > 0 ? (
                  state.selectedBusinessCases.map((type) => {
                    const bc = BUSINESS_CASES.find((b) => b.type === type);
                    return (
                      <StatusBadge key={type} variant="info">
                        {bc?.label ?? type}
                      </StatusBadge>
                    );
                  })
                ) : (
                  <span className="text-xs text-muted-foreground">
                    None selected
                  </span>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Data Classifications */}
          <Card>
            <CardHeader>
              <CardTitle>Data Classifications ({state.selectedDataClassifications.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-1.5">
                {state.selectedDataClassifications.length > 0 ? (
                  state.selectedDataClassifications.map((name) => (
                    <StatusBadge key={name} variant="warning">
                      {name}
                    </StatusBadge>
                  ))
                ) : (
                  <span className="text-xs text-muted-foreground">
                    None selected
                  </span>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Criticality & Review */}
          <Card>
            <CardHeader>
              <CardTitle>Criticality & Review</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Criticality: </span>
                  {state.criticality ? (
                    <StatusBadge
                      variant={
                        state.criticality === "Critical"
                          ? "critical"
                          : state.criticality === "High"
                          ? "high"
                          : state.criticality === "Medium"
                          ? "medium"
                          : "low"
                      }
                    >
                      {state.criticality}
                    </StatusBadge>
                  ) : (
                    <span className="text-muted-foreground">Not set</span>
                  )}
                </div>
                <div>
                  <span className="text-muted-foreground">Review: </span>
                  <span className="font-medium text-foreground">
                    {state.reviewFrequency
                      ? `Every ${state.reviewFrequency} months`
                      : "Not set"}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export default function VendorAddPage() {
  const navigate = useNavigate();
  const createVendor = useCreateVendor();
  const [currentStep, setCurrentStep] = useState<StepId>(1);
  const [direction, setDirection] = useState(0);

  const [wizardState, setWizardState] = useState<WizardState>({
    basicInfo: {
      name: "",
      website: "",
      description: "",
      industry: "",
      headquartersCountry: "",
      employeeCount: "",
      yearFounded: "",
    },
    selectedBusinessCases: [],
    selectedDataClassifications: [],
    criticality: "",
    reviewFrequency: "12",
  });

  const goToStep = useCallback(
    (step: StepId) => {
      setDirection(step > currentStep ? 1 : -1);
      setCurrentStep(step);
    },
    [currentStep]
  );

  const handleNext = useCallback(() => {
    if (currentStep < 5) {
      setDirection(1);
      setCurrentStep((s) => (s + 1) as StepId);
    }
  }, [currentStep]);

  const handlePrev = useCallback(() => {
    if (currentStep > 1) {
      setDirection(-1);
      setCurrentStep((s) => (s - 1) as StepId);
    }
  }, [currentStep]);

  const handleSubmit = useCallback(async () => {
    try {
      await createVendor.mutateAsync({
        name: wizardState.basicInfo.name,
        website: wizardState.basicInfo.website || undefined,
        description: wizardState.basicInfo.description || undefined,
        industry: wizardState.basicInfo.industry || undefined,
        headquartersCountry: wizardState.basicInfo.headquartersCountry || undefined,
        employeeCount: wizardState.basicInfo.employeeCount || undefined,
        yearFounded: wizardState.basicInfo.yearFounded ? parseInt(wizardState.basicInfo.yearFounded, 10) : undefined,
        criticality: wizardState.criticality || "MEDIUM",
        businessCases: wizardState.selectedBusinessCases,
        // TODO: dataClassificationIds currently sends classification NAMES (e.g. "Source Code"),
        // but the backend expects UUIDs. This will fail validation until the wizard is updated
        // to resolve names to their corresponding UUID via the data-classifications API.
        dataClassificationIds: wizardState.selectedDataClassifications,
        reviewFrequencyMonths: parseInt(wizardState.reviewFrequency, 10) || 12,
      });
      toast.success("Vendor created successfully", {
        description: `${wizardState.basicInfo.name} has been added.`,
      });
      navigate("/vendors");
    } catch (error) {
      toast.error("Failed to create vendor", {
        description: error instanceof Error ? error.message : "An unexpected error occurred.",
      });
    }
  }, [navigate, wizardState, createVendor]);

  const toggleBusinessCase = useCallback((type: string) => {
    setWizardState((prev) => ({
      ...prev,
      selectedBusinessCases: prev.selectedBusinessCases.includes(type)
        ? prev.selectedBusinessCases.filter((t) => t !== type)
        : [...prev.selectedBusinessCases, type],
    }));
  }, []);

  const toggleDataClassification = useCallback((name: string) => {
    setWizardState((prev) => ({
      ...prev,
      selectedDataClassifications:
        prev.selectedDataClassifications.includes(name)
          ? prev.selectedDataClassifications.filter((n) => n !== name)
          : [...prev.selectedDataClassifications, name],
    }));
  }, []);

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return wizardState.basicInfo.name.trim().length > 0;
      default:
        return true;
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      {/* Page Header */}
      <PageHeader
        title="Add New Vendor"
        description="Follow the wizard to onboard a new third-party vendor."
      >
        <Button variant="secondary" size="md" asChild>
          <Link to="/vendors">
            <ArrowLeft className="h-4 w-4" />
            Back to Vendors
          </Link>
        </Button>
      </PageHeader>

      {/* Step Indicator */}
      <StepIndicator
        steps={STEPS}
        currentStep={currentStep}
        onStepClick={goToStep}
      />

      {/* Step Content */}
      <Card className="overflow-hidden p-6">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={currentStep}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            {currentStep === 1 && (
              <StepBasicInfo
                data={wizardState.basicInfo}
                onChange={(data) =>
                  setWizardState((prev) => ({ ...prev, basicInfo: data }))
                }
              />
            )}

            {currentStep === 2 && (
              <StepBusinessCases
                selected={wizardState.selectedBusinessCases}
                onToggle={toggleBusinessCase}
              />
            )}

            {currentStep === 3 && (
              <StepDataClassification
                selected={wizardState.selectedDataClassifications}
                onToggle={toggleDataClassification}
              />
            )}

            {currentStep === 4 && (
              <StepCriticalityOwners
                criticality={wizardState.criticality}
                reviewFrequency={wizardState.reviewFrequency}
                onCriticalityChange={(v) =>
                  setWizardState((prev) => ({ ...prev, criticality: v }))
                }
                onReviewFrequencyChange={(v) =>
                  setWizardState((prev) => ({ ...prev, reviewFrequency: v }))
                }
              />
            )}

            {currentStep === 5 && <StepReview state={wizardState} />}
          </motion.div>
        </AnimatePresence>
      </Card>

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between">
        <Button
          type="button"
          variant="secondary"
          size="lg"
          onClick={handlePrev}
          disabled={currentStep === 1}
        >
          <ArrowLeft className="h-4 w-4" />
          Previous
        </Button>

        {currentStep < 5 ? (
          <Button
            type="button"
            variant="primary"
            size="lg"
            onClick={handleNext}
            disabled={!canProceed()}
          >
            Next
            <ArrowRight className="h-4 w-4" />
          </Button>
        ) : (
          <Button
            type="button"
            variant="primary"
            size="lg"
            onClick={handleSubmit}
            disabled={createVendor.isPending}
          >
            {createVendor.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                Create Vendor
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  );
}
