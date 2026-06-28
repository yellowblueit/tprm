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
import { msalConfig, msalConfigured, loginRequest } from "@/auth/msal-config";

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
    return new PublicClientApplication(msalConfig);
  }, []);

  useEffect(() => {
    const initializeMsal = async () => {
      try {
        await msalInstance.initialize();

        const response = await msalInstance.handleRedirectPromise();
        if (response) {
          msalInstance.setActiveAccount(response.account);
        }

        if (
          !msalInstance.getActiveAccount() &&
          msalInstance.getAllAccounts().length > 0
        ) {
          msalInstance.setActiveAccount(msalInstance.getAllAccounts()[0]);
        }

        msalInstance.addEventCallback((event: EventMessage) => {
          if (
            event.eventType === EventType.LOGIN_SUCCESS &&
            event.payload
          ) {
            const payload = event.payload as AuthenticationResult;
            msalInstance.setActiveAccount(payload.account);
          }
        });
      } catch (error) {
        console.warn("MSAL initialization warning:", error);
      } finally {
        setIsReady(true);
      }
    };

    initializeMsal();
  }, [msalInstance]);

  if (!isReady) {
    return <AuthLoading />;
  }

  // Always render MsalProvider so useMsal() works in any child component.
  // In dev mode (no real clientId), skip MsalAuthenticationTemplate so no
  // redirect to Azure login happens.
  return (
    <MsalProvider instance={msalInstance}>
      {msalConfigured ? (
        <>
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
        </>
      ) : (
        children
      )}
    </MsalProvider>
  );
}
