import React, { Suspense } from "react";
import { BrowserRouter, Routes, Route } from "react-router";
import { AuthProvider } from "@/auth/AuthProvider";
import { ProtectedRoute } from "@/auth/ProtectedRoute";
import { AppShell } from "@/components/layout/AppShell";
import { PageLoadingSkeleton } from "@/components/common/LoadingSkeleton";

// ---------------------------------------------------------------------------
// Lazy-loaded page components
// ---------------------------------------------------------------------------

const DashboardPage = React.lazy(() => import("@/pages/DashboardPage"));
const AssessmentsPage = React.lazy(() => import("@/pages/AssessmentsPage"));
const RemediationsPage = React.lazy(() => import("@/pages/RemediationsPage"));
const CompliancePage = React.lazy(() => import("@/pages/CompliancePage"));
const MonitoringPage = React.lazy(() => import("@/pages/MonitoringPage"));
const AnalyticsPage = React.lazy(() => import("@/pages/AnalyticsPage"));
const ReportsPage = React.lazy(() => import("@/pages/ReportsPage"));
const SettingsPage = React.lazy(() => import("@/pages/SettingsPage"));

const VendorListPage = React.lazy(
  () => import("@/pages/vendors/VendorListPage")
);
const VendorAddPage = React.lazy(
  () => import("@/pages/vendors/VendorAddPage")
);
const VendorDetailPage = React.lazy(
  () => import("@/pages/vendors/VendorDetailPage")
);

const TenantListPage = React.lazy(
  () => import("@/pages/admin/TenantListPage")
);
const VendorCatalogPage = React.lazy(
  () => import("@/pages/admin/VendorCatalogPage")
);

// ---------------------------------------------------------------------------
// Suspense wrapper
// ---------------------------------------------------------------------------

function Lazy({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<PageLoadingSkeleton />}>{children}</Suspense>;
}

// ---------------------------------------------------------------------------
// Router
// ---------------------------------------------------------------------------

export function AppRouter() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route element={<ProtectedRoute />}>
            <Route element={<AppShell />}>
              {/* Dashboard */}
              <Route
                index
                element={
                  <Lazy>
                    <DashboardPage />
                  </Lazy>
                }
              />

              {/* Vendors */}
              <Route path="vendors">
                <Route
                  index
                  element={
                    <Lazy>
                      <VendorListPage />
                    </Lazy>
                  }
                />
                <Route
                  path="new"
                  element={
                    <Lazy>
                      <VendorAddPage />
                    </Lazy>
                  }
                />
                <Route
                  path=":id"
                  element={
                    <Lazy>
                      <VendorDetailPage />
                    </Lazy>
                  }
                />
              </Route>

              {/* Core pages */}
              <Route
                path="assessments"
                element={
                  <Lazy>
                    <AssessmentsPage />
                  </Lazy>
                }
              />
              <Route
                path="remediations"
                element={
                  <Lazy>
                    <RemediationsPage />
                  </Lazy>
                }
              />
              <Route
                path="compliance"
                element={
                  <Lazy>
                    <CompliancePage />
                  </Lazy>
                }
              />
              <Route
                path="monitoring"
                element={
                  <Lazy>
                    <MonitoringPage />
                  </Lazy>
                }
              />
              <Route
                path="analytics"
                element={
                  <Lazy>
                    <AnalyticsPage />
                  </Lazy>
                }
              />
              <Route
                path="reports"
                element={
                  <Lazy>
                    <ReportsPage />
                  </Lazy>
                }
              />
              <Route
                path="settings"
                element={
                  <Lazy>
                    <SettingsPage />
                  </Lazy>
                }
              />

              {/* Admin */}
              <Route path="admin">
                <Route
                  path="tenants"
                  element={
                    <Lazy>
                      <TenantListPage />
                    </Lazy>
                  }
                />
                <Route
                  path="catalog"
                  element={
                    <Lazy>
                      <VendorCatalogPage />
                    </Lazy>
                  }
                />
              </Route>
            </Route>
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
