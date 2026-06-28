import { Outlet } from "react-router";
import { useAuth } from "@/auth/useAuth";

// Separate component that uses MSAL hooks — only rendered when MsalProvider exists
function MsalProtectedRoute() {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
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

export function ProtectedRoute() {
  const msalConfigured = !!import.meta.env.VITE_ENTRA_CLIENT_ID;

  // Dev mode: no MsalProvider in tree, skip auth entirely
  if (!msalConfigured) {
    return <Outlet />;
  }

  return <MsalProtectedRoute />;
}
