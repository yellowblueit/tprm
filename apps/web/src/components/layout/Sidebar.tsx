import { NavLink } from "react-router";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  Building2,
  ClipboardCheck,
  AlertTriangle,
  Shield,
  Activity,
  BarChart3,
  FileText,
  Settings,
  Users,
  Library,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useUiStore } from "@/stores/ui.store";

interface NavItem {
  label: string;
  to: string;
  icon: React.ComponentType<{ className?: string }>;
}

const mainNavItems: NavItem[] = [
  { label: "Dashboard", to: "/", icon: LayoutDashboard },
  { label: "Vendors", to: "/vendors", icon: Building2 },
  { label: "Assessments", to: "/assessments", icon: ClipboardCheck },
  { label: "Remediations", to: "/remediations", icon: AlertTriangle },
  { label: "Compliance", to: "/compliance", icon: Shield },
  { label: "Monitoring", to: "/monitoring", icon: Activity },
  { label: "Analytics", to: "/analytics", icon: BarChart3 },
  { label: "Reports", to: "/reports", icon: FileText },
];

const settingsNavItems: NavItem[] = [
  { label: "Settings", to: "/settings", icon: Settings },
];

const adminNavItems: NavItem[] = [
  { label: "Tenants", to: "/admin/tenants", icon: Users },
  { label: "Vendor Catalog", to: "/admin/catalog", icon: Library },
];

interface SidebarNavItemProps {
  item: NavItem;
  collapsed: boolean;
}

function SidebarNavItem({ item, collapsed }: SidebarNavItemProps) {
  const Icon = item.icon;

  return (
    <NavLink
      to={item.to}
      end={item.to === "/"}
      className={({ isActive }) =>
        cn(
          "group relative flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
          collapsed && "justify-center px-2",
          isActive
            ? "bg-primary/10 text-primary"
            : "text-muted-foreground hover:bg-muted hover:text-foreground"
        )
      }
    >
      {({ isActive }) => (
        <>
          {isActive && (
            <motion.div
              layoutId="sidebar-active-indicator"
              className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-r-full bg-primary"
              transition={{ type: "spring", stiffness: 350, damping: 30 }}
            />
          )}

          <Icon className="h-4 w-4 flex-shrink-0" />

          {!collapsed && <span className="truncate">{item.label}</span>}

          {collapsed && (
            <div className="absolute left-full z-50 ml-2 hidden rounded-md bg-muted px-2.5 py-1.5 text-xs font-medium text-foreground group-hover:block">
              {item.label}
            </div>
          )}
        </>
      )}
    </NavLink>
  );
}

export function Sidebar() {
  const { sidebarCollapsed, toggleSidebar } = useUiStore();

  return (
    <div className="flex h-full flex-col border-r border-border bg-sidebar">
      {/* Logo */}
      <div
        className={cn(
          "flex h-12 items-center border-b border-border px-4",
          sidebarCollapsed && "justify-center px-2"
        )}
      >
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary">
            <Shield className="h-4 w-4 text-white" />
          </div>
          {!sidebarCollapsed && (
            <span className="text-sm font-semibold tracking-tight text-foreground">
              TPRM
            </span>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 overflow-y-auto px-2 py-3">
        <div className="space-y-0.5">
          {mainNavItems.map((item) => (
            <SidebarNavItem
              key={item.to}
              item={item}
              collapsed={sidebarCollapsed}
            />
          ))}
        </div>

        <div className="my-3 border-t border-border" />

        <div className="space-y-0.5">
          {!sidebarCollapsed && (
            <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">
              Settings
            </p>
          )}
          {settingsNavItems.map((item) => (
            <SidebarNavItem
              key={item.to}
              item={item}
              collapsed={sidebarCollapsed}
            />
          ))}
        </div>

        <div className="my-3 border-t border-border" />

        <div className="space-y-0.5">
          {!sidebarCollapsed && (
            <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">
              Admin
            </p>
          )}
          {adminNavItems.map((item) => (
            <SidebarNavItem
              key={item.to}
              item={item}
              collapsed={sidebarCollapsed}
            />
          ))}
        </div>
      </nav>

      {/* Collapse toggle */}
      <div className="border-t border-border p-2">
        <button
          onClick={toggleSidebar}
          className={cn(
            "flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
            sidebarCollapsed && "justify-center px-2"
          )}
          title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {sidebarCollapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <>
              <ChevronLeft className="h-4 w-4" />
              <span>Collapse</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
