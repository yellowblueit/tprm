import { create } from "zustand";
import { persist } from "zustand/middleware";

interface TenantState {
  activeTenantId: string | null;
  activeTenantName: string | null;
  setActiveTenant: (id: string, name: string) => void;
  clearTenant: () => void;
}

export const useTenantStore = create<TenantState>()(
  persist(
    (set) => ({
      activeTenantId: null,
      activeTenantName: null,

      setActiveTenant: (id: string, name: string) =>
        set({ activeTenantId: id, activeTenantName: name }),

      clearTenant: () =>
        set({ activeTenantId: null, activeTenantName: null }),
    }),
    {
      name: "tprm-tenant",
    }
  )
);
