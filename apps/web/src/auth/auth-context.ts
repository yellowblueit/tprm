import { createContext } from "react";

export interface AuthUser {
  name: string;
  email: string;
  username: string;
  localAccountId: string;
  tenantId: string;
}

export interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  getAccessToken: () => Promise<string>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);
