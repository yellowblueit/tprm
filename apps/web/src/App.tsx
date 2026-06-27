import { useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { AppRouter } from "@/router";
import { setupApiClient } from "@/api/client";
import { useTenantStore } from "@/stores/tenant.store";

// ---------------------------------------------------------------------------
// TanStack Query client
// ---------------------------------------------------------------------------

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

// ---------------------------------------------------------------------------
// API client setup component – wires the token/tenant accessors once on mount
// ---------------------------------------------------------------------------

function ApiClientSetup({ children }: { children: React.ReactNode }) {
  const activeTenantId = useTenantStore((s) => s.activeTenantId);

  useEffect(() => {
    const msalConfigured = !!import.meta.env.VITE_ENTRA_CLIENT_ID;

    const getToken = async (): Promise<string> => {
      if (!msalConfigured) {
        // Dev mode: send the dev token that the API auth plugin accepts
        return "dev:dev-user-id:dev@tprm.local:Dev User:MSP_ADMIN";
      }
      // When MSAL is configured, token acquisition will be handled by
      // AuthenticatedApiSetup inside the MsalProvider context.
      return "";
    };

    const getTenantId = (): string | null => {
      return useTenantStore.getState().activeTenantId;
    };

    setupApiClient(getToken, getTenantId);
  }, [activeTenantId]);

  return <>{children}</>;
}

// ---------------------------------------------------------------------------
// Root App component
// ---------------------------------------------------------------------------

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ApiClientSetup>
        <AppRouter />
        <Toaster
          position="top-right"
          richColors
          toastOptions={{
            className: "text-sm",
          }}
        />
      </ApiClientSetup>
    </QueryClientProvider>
  );
}
