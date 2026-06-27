import { Outlet } from "react-router";
import { useAuth } from "@/auth/useAuth";

export function ProtectedRoute() {
  const { isAuthenticated } = useAuth();

  // When MSAL is not configured (dev mode), allow access
  const msalConfigured = !!import.meta.env.VITE_ENTRA_CLIENT_ID;

  if (msalConfigured && !isAuthenticated) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">
            Verifying authentication...
          </p>
        </div>
      </div>
    );
  }

  return <Outlet />;
}
