import React from 'react';
import {
  LayoutDashboard,
  Boxes,
  AlertTriangle,
  Sparkles,
  TrendingUp,
  BarChart3,
  History,
  Database,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Leaf,
} from 'lucide-react';

export type NavigationTab = 
  | 'dashboard'
  | 'inventory'
  | 'expiry-alerts'
  | 'ai-pricing'
  | 'forecasting'
  | 'reports'
  | 'activity'
  | 'tests';

interface SidebarProps {
  currentTab: NavigationTab;
  onSelectTab: (tab: NavigationTab) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  onOpenDatabaseModal: () => void;
  isDemoMode: boolean;
  criticalCount: number;
  pendingRecCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  isCollapsed,
  onToggleCollapse,
  onOpenDatabaseModal,
  isDemoMode,
  criticalCount,
  pendingRecCount,
}) => {
  const navItems: {
    id: NavigationTab;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: number;
    badgeColor?: string;
  }[] = [
    { id: 'dashboard', label: 'Operations Overview', icon: LayoutDashboard },
    { id: 'inventory', label: 'Inventory Catalog', icon: Boxes },
    {
      id: 'expiry-alerts',
      label: 'Expiry Management',
      icon: AlertTriangle,
      badge: criticalCount > 0 ? criticalCount : undefined,
      badgeColor: 'bg-rose-500 text-white',
    },
    {
      id: 'ai-pricing',
      label: 'AI Dynamic Pricing',
      icon: Sparkles,
      badge: pendingRecCount > 0 ? pendingRecCount : undefined,
      badgeColor: 'bg-emerald-600 text-white',
    },
    { id: 'forecasting', label: 'Demand Forecast', icon: TrendingUp },
    { id: 'reports', label: 'Waste & Recovery Audit', icon: BarChart3 },
    { id: 'activity', label: 'Operational Activity', icon: History },
    { id: 'tests', label: 'Engine Test Suite', icon: ShieldCheck },
  ];

  return (
    <aside
      className={`fixed top-0 bottom-0 left-0 z-30 flex flex-col bg-stone-900 text-stone-300 border-r border-stone-800 transition-all duration-200 select-none ${
        isCollapsed ? 'w-18' : 'w-64'
      }`}
    >
      {/* Brand Header */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-stone-800 shrink-0">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="w-9 h-9 rounded-lg bg-emerald-500 flex items-center justify-center text-stone-950 font-black text-lg shrink-0 shadow-sm">
            <Leaf className="w-5 h-5 text-stone-950" />
          </div>
          {!isCollapsed && (
            <div className="flex flex-col truncate">
              <span className="font-bold text-base tracking-tight text-white truncate">
                SmartSave AI
              </span>
              <span className="text-[11px] font-medium text-emerald-400 truncate">
                Grocery Waste Intelligence
              </span>
            </div>
          )}
        </div>

        <button
          onClick={onToggleCollapse}
          className="p-1.5 text-stone-400 hover:text-white hover:bg-stone-800 rounded-md transition-colors"
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto py-4 px-2 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              title={isCollapsed ? item.label : undefined}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-left ${
                isActive
                  ? 'bg-emerald-500/15 text-emerald-400 font-semibold'
                  : 'text-stone-300 hover:bg-stone-800/70 hover:text-white'
              }`}
            >
              <Icon
                className={`w-4 h-4 shrink-0 ${
                  isActive ? 'text-emerald-400' : 'text-stone-400'
                }`}
              />
              {!isCollapsed && (
                <span className="truncate flex-1">{item.label}</span>
              )}
              {!isCollapsed && item.badge !== undefined && (
                <span
                  className={`text-[11px] font-bold px-1.5 py-0.5 rounded tabular-nums ${item.badgeColor}`}
                >
                  {item.badge}
                </span>
              )}
              {isCollapsed && item.badge !== undefined && (
                <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-rose-500" />
              )}
            </button>
          );
        })}
      </div>

      {/* System / Supabase Mode Footer */}
      <div className="p-3 border-t border-stone-800 shrink-0">
        <button
          onClick={onOpenDatabaseModal}
          className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium border transition-colors ${
            isDemoMode
              ? 'bg-amber-950/30 border-amber-800/40 text-amber-300 hover:bg-amber-950/50'
              : 'bg-emerald-950/30 border-emerald-800/40 text-emerald-300 hover:bg-emerald-950/50'
          }`}
        >
          <Database className="w-3.5 h-3.5 shrink-0" />
          {!isCollapsed && (
            <div className="flex flex-col text-left truncate">
              <span className="font-semibold truncate">
                {isDemoMode ? 'Demo Mode (Simulated)' : 'Connected Mode'}
              </span>
              <span className="text-[10px] text-stone-400 truncate">
                Configure Supabase & Auth
              </span>
            </div>
          )}
        </button>

        {!isCollapsed && (
          <div className="mt-3 px-1 flex items-center justify-between text-[11px] text-stone-400">
            <span>Seattle Downtown #01</span>
            <span className="text-emerald-400 font-medium flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> Ready
            </span>
          </div>
        )}
      </div>
    </aside>
  );
};
