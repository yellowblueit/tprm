import { useContext } from "react";
import { AuthContext, type AuthContextValue, type AuthUser } from "@/auth/auth-context";

export type { AuthUser };

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
