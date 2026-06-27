import { type ReactNode, useEffect, useMemo, useState } from "react";
import {
  MsalProvider,
  MsalAuthenticationTemplate,
  UnauthenticatedTemplate,
} from "@azure/msal-react";
import {
  PublicClientApplication,
  EventType,
  InteractionType,
  type EventMessage,
  type AuthenticationResult,
} from "@azure/msal-browser";
import { msalConfig, loginRequest } from "@/auth/msal-config";

interface AuthProviderProps {
  children: ReactNode;
}

function AuthLoading() {
  return (
    <div className="flex h-screen w-screen items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        <p className="text-sm text-muted-foreground">Authenticating...</p>
      </div>
    </div>
  );
}

function AuthError({ error }: { error: Error | null }) {
  return (
    <div className="flex h-screen w-screen items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4 text-center">
        <p className="text-lg font-semibold text-destructive">
          Authentication Error
        </p>
        <p className="text-sm text-muted-foreground">
          {error?.message || "An unknown authentication error occurred."}
        </p>
        <button
          onClick={() => window.location.reload()}
          className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground hover:bg-primary/90"
        >
          Retry
        </button>
      </div>
    </div>
  );
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [isReady, setIsReady] = useState(false);

  const msalInstance = useMemo(() => {
    const instance = new PublicClientApplication(msalConfig);
    return instance;
  }, []);

  useEffect(() => {
    const initializeMsal = async () => {
      try {
        await msalInstance.initialize();

        // Handle redirect response
        const response = await msalInstance.handleRedirectPromise();
        if (response) {
          msalInstance.setActiveAccount(response.account);
        }

        // Set active account if not already set
        if (
          !msalInstance.getActiveAccount() &&
          msalInstance.getAllAccounts().length > 0
        ) {
          msalInstance.setActiveAccount(msalInstance.getAllAccounts()[0]);
        }

        // Listen for login success events
        msalInstance.addEventCallback((event: EventMessage) => {
          if (
            event.eventType === EventType.LOGIN_SUCCESS &&
            event.payload
          ) {
            const payload = event.payload as AuthenticationResult;
            msalInstance.setActiveAccount(payload.account);
          }
        });

        setIsReady(true);
      } catch (error) {
        console.error("MSAL initialization failed:", error);
        // In dev mode without MSAL config, still allow the app to render
        if (!msalConfig.auth.clientId) {
          console.warn(
            "MSAL not configured. Running in unauthenticated dev mode."
          );
          setIsReady(true);
        }
      }
    };

    initializeMsal();
  }, [msalInstance]);

  if (!isReady) {
    return <AuthLoading />;
  }

  // If MSAL is not configured (no client ID), render children directly for dev mode
  if (!msalConfig.auth.clientId) {
    return <>{children}</>;
  }

  return (
    <MsalProvider instance={msalInstance}>
      <MsalAuthenticationTemplate
        interactionType={InteractionType.Redirect}
        authenticationRequest={loginRequest}
        loadingComponent={AuthLoading}
        errorComponent={({ error }) => <AuthError error={error} />}
      >
        {children}
      </MsalAuthenticationTemplate>
      <UnauthenticatedTemplate>
        <AuthLoading />
      </UnauthenticatedTemplate>
    </MsalProvider>
  );
}
