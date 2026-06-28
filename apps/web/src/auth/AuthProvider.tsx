import { type ReactNode, useCallback, useEffect, useState } from "react";
import {
  MsalProvider,
  MsalAuthenticationTemplate,
  UnauthenticatedTemplate,
  useMsal,
  useIsAuthenticated,
} from "@azure/msal-react";
import {
  PublicClientApplication,
  InteractionType,
  EventType,
  InteractionRequiredAuthError,
  type EventMessage,
  type AuthenticationResult,
} from "@azure/msal-browser";
import { AuthContext, type AuthContextValue, type AuthUser } from "@/auth/auth-context";
import { msalConfig, msalConfigured, loginRequest } from "@/auth/msal-config";

// ---------------------------------------------------------------------------
// Shared loading / error UI
// ---------------------------------------------------------------------------

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
        <p className="text-lg font-semibold text-destructive">Authentication Error</p>
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

// ---------------------------------------------------------------------------
// Dev mode — no MSAL instantiation at all (avoids crypto_nonexistent on HTTP)
// ---------------------------------------------------------------------------

const DEV_USER: AuthUser = {
  name: "Dev User",
  email: "dev@tprm.local",
  username: "dev@tprm.local",
  localAccountId: "dev",
  tenantId: "dev",
};

const devAuthValue: AuthContextValue = {
  user: DEV_USER,
  isAuthenticated: true,
  login: async () => {},
  logout: async () => {},
  getAccessToken: async () =>
    "dev:dev-user-id:dev@tprm.local:Dev User:MSP_ADMIN",
};

function DevAuthProvider({ children }: { children: ReactNode }) {
  return (
    <AuthContext.Provider value={devAuthValue}>{children}</AuthContext.Provider>
  );
}

// ---------------------------------------------------------------------------
// MSAL mode — bridge between MsalProvider and AuthContext
// ---------------------------------------------------------------------------

function MsalAuthBridge({ children }: { children: ReactNode }) {
  const { instance, accounts } = useMsal();
  const isAuthenticated = useIsAuthenticated();

  const account = accounts[0] ?? null;

  const user: AuthUser | null = account
    ? {
        name: account.name ?? "Unknown User",
        email:
          (account.idTokenClaims?.email as string) ??
          account.username ??
          "",
        username: account.username ?? "",
        localAccountId: account.localAccountId,
        tenantId: account.tenantId ?? "",
      }
    : null;

  const login = useCallback(async () => {
    await instance.loginRedirect(loginRequest);
  }, [instance]);

  const logout = useCallback(async () => {
    await instance.logoutRedirect({
      postLogoutRedirectUri: window.location.origin,
    });
  }, [instance]);

  const getAccessToken = useCallback(async (): Promise<string> => {
    if (!account) throw new Error("No active account. Please sign in.");
    try {
      const response = await instance.acquireTokenSilent({
        ...loginRequest,
        account,
      });
      return response.accessToken;
    } catch (error) {
      if (error instanceof InteractionRequiredAuthError) {
        await instance.acquireTokenRedirect({ ...loginRequest, account });
        return "";
      }
      throw error;
    }
  }, [instance, account]);

  const value: AuthContextValue = {
    user,
    isAuthenticated,
    login,
    logout,
    getAccessToken,
  };

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
}

function MsalAuthProvider({ children }: { children: ReactNode }) {
  const [msalInstance, setMsalInstance] = useState<PublicClientApplication | null>(null);
  const [initError, setInitError] = useState<Error | null>(null);

  useEffect(() => {
    const init = async () => {
      const instance = new PublicClientApplication(msalConfig);
      await instance.initialize();

      const response = await instance.handleRedirectPromise();
      if (response) instance.setActiveAccount(response.account);

      if (
        !instance.getActiveAccount() &&
        instance.getAllAccounts().length > 0
      ) {
        instance.setActiveAccount(instance.getAllAccounts()[0]);
      }

      instance.addEventCallback((event: EventMessage) => {
        if (event.eventType === EventType.LOGIN_SUCCESS && event.payload) {
          const payload = event.payload as AuthenticationResult;
          instance.setActiveAccount(payload.account);
        }
      });

      setMsalInstance(instance);
    };

    init().catch((err) => {
      console.error("MSAL initialization failed:", err);
      setInitError(err instanceof Error ? err : new Error(String(err)));
    });
  }, []);

  if (initError) return <AuthError error={initError} />;
  if (!msalInstance) return <AuthLoading />;

  return (
    <MsalProvider instance={msalInstance}>
      <MsalAuthenticationTemplate
        interactionType={InteractionType.Redirect}
        authenticationRequest={loginRequest}
        loadingComponent={AuthLoading}
        errorComponent={({ error }) => <AuthError error={error} />}
      >
        <MsalAuthBridge>{children}</MsalAuthBridge>
      </MsalAuthenticationTemplate>
      <UnauthenticatedTemplate>
        <AuthLoading />
      </UnauthenticatedTemplate>
    </MsalProvider>
  );
}

// ---------------------------------------------------------------------------
// Public export
// ---------------------------------------------------------------------------

export function AuthProvider({ children }: { children: ReactNode }) {
  if (!msalConfigured) {
    return <DevAuthProvider>{children}</DevAuthProvider>;
  }
  return <MsalAuthProvider>{children}</MsalAuthProvider>;
}
