import { cva, type VariantProps } from "class-variance-authority";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium",
  {
    variants: {
      variant: {
        critical: "border-red-900/50 bg-red-950 text-red-400",
        high: "border-orange-900/50 bg-orange-950 text-orange-400",
        medium: "border-yellow-900/50 bg-yellow-950 text-yellow-400",
        low: "border-green-900/50 bg-green-950 text-green-400",
        minimal: "border-border bg-muted text-muted-foreground",
        info: "border-blue-900/50 bg-blue-950 text-blue-400",
        success: "border-green-900/50 bg-green-950 text-green-400",
        warning: "border-amber-900/50 bg-amber-950 text-amber-400",
        default: "border-border bg-muted text-muted-foreground",
      },
    },
    defaultVariants: { variant: "default" },
  }
);

type BadgeVariant = NonNullable<VariantProps<typeof badgeVariants>["variant"]>;

interface StatusBadgeProps {
  variant: BadgeVariant;
  children: ReactNode;
  className?: string;
}

export function StatusBadge({
  variant,
  children,
  className,
}: StatusBadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant }), className)}>
      {children}
    </span>
  );
}
