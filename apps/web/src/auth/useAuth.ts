import { useCallback } from "react";
import { useMsal, useIsAuthenticated } from "@azure/msal-react";
import { InteractionRequiredAuthError } from "@azure/msal-browser";
import { loginRequest } from "@/auth/msal-config";

export interface AuthUser {
  name: string;
  email: string;
  username: string;
  localAccountId: string;
  tenantId: string;
}

export function useAuth() {
  const { instance, accounts } = useMsal();
  const isAuthenticated = useIsAuthenticated();

  const account = accounts[0] ?? null;

  const user: AuthUser | null = account
    ? {
        name: account.name ?? "Unknown User",
        email:
          account.idTokenClaims?.email as string ??
          account.username ??
          "",
        username: account.username ?? "",
        localAccountId: account.localAccountId,
        tenantId: account.tenantId ?? "",
      }
    : null;

  const login = useCallback(async () => {
    try {
      await instance.loginRedirect(loginRequest);
    } catch (error) {
      console.error("Login failed:", error);
      throw error;
    }
  }, [instance]);

  const logout = useCallback(async () => {
    try {
      await instance.logoutRedirect({
        postLogoutRedirectUri: window.location.origin,
      });
    } catch (error) {
      console.error("Logout failed:", error);
      throw error;
    }
  }, [instance]);

  const getAccessToken = useCallback(async (): Promise<string> => {
    if (!account) {
      throw new Error("No active account. Please sign in.");
    }

    try {
      const response = await instance.acquireTokenSilent({
        ...loginRequest,
        account,
      });
      return response.accessToken;
    } catch (error) {
      if (error instanceof InteractionRequiredAuthError) {
        // Silent token acquisition failed, fall back to redirect
        try {
          await instance.acquireTokenRedirect({
            ...loginRequest,
            account,
          });
          // After redirect, this code won't execute.
          // The token will be available after the redirect completes.
          return "";
        } catch (redirectError) {
          console.error("Token acquisition via redirect failed:", redirectError);
          throw redirectError;
        }
      }
      console.error("Token acquisition failed:", error);
      throw error;
    }
  }, [instance, account]);

  return {
    user,
    isAuthenticated,
    login,
    logout,
    getAccessToken,
    account,
  };
}
