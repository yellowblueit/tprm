import { LogOut, User } from "lucide-react";
import { useAuth } from "@/auth/useAuth";
import { useTenantStore } from "@/stores/tenant.store";
import { Button } from "@/components/ui";
import { StatusBadge } from "@/components/common/StatusBadge";

export function TopBar() {
  const { user, logout } = useAuth();
  const activeTenantName = useTenantStore((s) => s.activeTenantName);

  return (
    <header className="flex h-12 items-center justify-between border-b border-border bg-background px-5">
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">
          Third Party Risk Management
        </span>
      </div>

      <div className="flex items-center gap-3">
        {activeTenantName && (
          <StatusBadge variant="info">{activeTenantName}</StatusBadge>
        )}

        <div className="flex items-center gap-2 text-sm">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-muted">
            <User className="h-3.5 w-3.5 text-muted-foreground" />
          </div>
          <span className="hidden text-sm font-medium text-foreground sm:inline">
            {user?.name ?? "User"}
          </span>
        </div>

        <Button variant="ghost" size="sm" onClick={() => logout()} title="Sign out">
          <LogOut className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Sign out</span>
        </Button>
      </div>
    </header>
  );
}
