import { Upload, Search, LayoutDashboard, Brain, AlertTriangle, Bell, FileSearch, FileText, Settings } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { t } from "@/lib/i18n";

const navItems = [
  { icon: Upload, label: "nav.upload", path: "/upload" },
  { icon: Search, label: "nav.explorer", path: "/explorer" },
  { icon: LayoutDashboard, label: "nav.dashboard", path: "/dashboard" },
  { icon: Brain, label: "nav.aiAnalysis", path: "/ai-analysis" },
  { icon: AlertTriangle, label: "nav.incidents", path: "/incidents" },
  { icon: Bell, label: "nav.alerts", path: "/alerts" },
  { icon: FileSearch, label: "nav.queries", path: "/queries" },
  { icon: FileText, label: "nav.reports", path: "/reports" },
  { icon: Settings, label: "nav.settings", path: "/settings" },
];

export function LeftNav() {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <div className="w-64 border-r border-border bg-card/50 h-full overflow-y-auto">
      <nav className="p-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
              aria-current={isActive ? "page" : undefined}
            >
              <Icon className="h-4 w-4" />
              <span>{t(item.label)}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}

