import { type Configuration, LogLevel } from "@azure/msal-browser";

const clientId = import.meta.env.VITE_ENTRA_CLIENT_ID ?? "";
const tenantId = import.meta.env.VITE_ENTRA_TENANT_ID ?? "";
const apiClientId = import.meta.env.VITE_API_CLIENT_ID ?? "";

export const msalConfig: Configuration = {
  auth: {
    // Use a placeholder GUID in dev mode so PublicClientApplication can be
    // constructed and initialized without throwing (OIDC discovery only
    // happens at login time, not at initialization).
    clientId: clientId || "00000000-0000-0000-0000-000000000000",
    authority: `https://login.microsoftonline.com/${tenantId || "common"}`,
    redirectUri: window.location.origin,
    postLogoutRedirectUri: window.location.origin,
  },
  cache: {
    cacheLocation: "sessionStorage",
  },
  system: {
    loggerOptions: {
      loggerCallback: (level, message, containsPii) => {
        if (containsPii) return;
        switch (level) {
          case LogLevel.Error:
            console.error(message);
            break;
          case LogLevel.Warning:
            console.warn(message);
            break;
          case LogLevel.Info:
            // console.info(message);
            break;
          case LogLevel.Verbose:
            // console.debug(message);
            break;
        }
      },
      logLevel: LogLevel.Warning,
    },
  },
};

export const msalConfigured = !!import.meta.env.VITE_ENTRA_CLIENT_ID;

export const loginRequest = {
  scopes: [
    ...(apiClientId ? [`api://${apiClientId}/tprm.access`] : []),
    "openid",
    "profile",
    "email",
  ],
};
