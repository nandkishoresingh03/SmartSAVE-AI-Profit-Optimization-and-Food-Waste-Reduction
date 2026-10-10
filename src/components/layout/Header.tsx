import React, { useState } from 'react';
import {
  Search,
  Bell,
  Plus,
  Store,
  ChevronDown,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { UserProfile, Store as StoreType } from '../../types/index.ts';

interface HeaderProps {
  store: StoreType;
  profile: UserProfile;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onOpenAddProduct: () => void;
  onToggleNotifications: () => void;
  unreadNotificationsCount: number;
  onResetDemoData: () => void;
  onRunAIBatch: () => void;
  isGeneratingAI: boolean;
  breadcrumbs: string[];
}

export const Header: React.FC<HeaderProps> = ({
  store,
  profile,
  searchQuery,
  onSearchChange,
  onOpenAddProduct,
  onToggleNotifications,
  unreadNotificationsCount,
  onResetDemoData,
  onRunAIBatch,
  isGeneratingAI,
  breadcrumbs,
}) => {
  const [profileOpen, setProfileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-20 h-16 bg-white/95 backdrop-blur-sm border-b border-stone-200 px-6 flex items-center justify-between gap-6">
      {/* Zone 1: Context Breadcrumbs & Store Switcher */}
      <div className="flex items-center gap-3 shrink-0">
        <div className="flex items-center gap-2 text-xs font-medium text-stone-500">
          <Store className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          <span className="font-semibold text-stone-900">{store.name}</span>
          {breadcrumbs.map((crumb, idx) => (
            <React.Fragment key={idx}>
              <span className="text-stone-300">/</span>
              <span className={idx === breadcrumbs.length - 1 ? 'text-stone-800 font-semibold' : 'text-stone-500'}>
                {crumb}
              </span>
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Zone 2: Global Search & Actions */}
      <div className="flex-1 max-w-md mx-auto hidden md:block">
        <div className="relative">
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search inventory by name, category, or SKU..."
            className="w-full pl-9 pr-4 py-1.5 text-xs bg-stone-50 border border-stone-200 rounded-lg text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
          />
        </div>
      </div>

      {/* Zone 3: Primary Actions & User Profile */}
      <div className="flex items-center gap-3 shrink-0">
        <button
          onClick={onRunAIBatch}
          disabled={isGeneratingAI}
          title="Run instant AI waste scan & pricing updates"
          className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors whitespace-nowrap shrink-0 disabled:opacity-60"
        >
          <Sparkles className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          <span>{isGeneratingAI ? 'Scanning...' : 'AI Waste Scan'}</span>
        </button>

        <button
          onClick={onOpenAddProduct}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 rounded-lg shadow-sm transition-colors whitespace-nowrap shrink-0"
        >
          <Plus className="w-3.5 h-3.5 shrink-0" />
          <span>Add Product</span>
        </button>

        <button
          onClick={onToggleNotifications}
          className="relative p-2 text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded-lg transition-colors"
          title="Expiry alerts and recommendations"
          aria-label="View notifications"
        >
          <Bell className="w-4 h-4 shrink-0" />
          {unreadNotificationsCount > 0 && (
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white" />
          )}
        </button>

        {/* User Profile dropdown */}
        <div className="relative">
          <button
            onClick={() => setProfileOpen(!profileOpen)}
            className="flex items-center gap-2 p-1 pl-1.5 pr-2 rounded-lg hover:bg-stone-100 transition-colors border border-stone-200"
          >
            <img
              src={profile.avatar_url || '/src/assets/images/manager_avatar_1791612179185.jpg'}
              alt={profile.full_name}
              className="w-7 h-7 rounded-md object-cover bg-stone-200"
              referrerPolicy="no-referrer"
            />
            <div className="hidden lg:flex flex-col text-left">
              <span className="text-xs font-semibold text-stone-900 leading-tight">
                {profile.full_name}
              </span>
              <span className="text-[10px] text-stone-500 leading-tight">
                {profile.role}
              </span>
            </div>
            <ChevronDown className="w-3 h-3 text-stone-400" />
          </button>

          {profileOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-stone-200 py-1.5 z-50 text-xs">
              <div className="px-3 py-2 border-b border-stone-100">
                <p className="font-semibold text-stone-900">{profile.full_name}</p>
                <p className="text-[11px] text-stone-500">{profile.email}</p>
                <p className="text-[10px] text-emerald-700 font-medium mt-0.5">{profile.role}</p>
              </div>

              <button
                onClick={() => {
                  onResetDemoData();
                  setProfileOpen(false);
                }}
                className="w-full text-left px-3 py-2 text-stone-700 hover:bg-stone-50 flex items-center gap-2"
              >
                <RotateCcw className="w-3.5 h-3.5 text-stone-400" />
                Reset Demo Data
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
