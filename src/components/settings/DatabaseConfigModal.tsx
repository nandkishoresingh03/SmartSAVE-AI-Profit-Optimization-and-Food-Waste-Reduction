import React, { useState } from 'react';
import {
  X,
  Database,
  Check,
  Copy,
  ExternalLink,
  ShieldAlert,
  Info,
  Server,
  Key,
} from 'lucide-react';

interface DatabaseConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDemoMode: boolean;
  onToggleDemoMode: (enabled: boolean) => void;
}

export const DatabaseConfigModal: React.FC<DatabaseConfigModalProps> = ({
  isOpen,
  onClose,
  isDemoMode,
  onToggleDemoMode,
}) => {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'schema' | 'env'>('overview');

  if (!isOpen) return null;

  const envSample = `# SmartSave AI — Environment Configuration
# Add these to your .env or deployment environment:

# Google Gemini API (Required for AI explanations & insights)
GEMINI_API_KEY="AIzaSy..."

# Supabase Database & Auth (Optional - for Connected Mode)
SUPABASE_URL="https://your-project.supabase.co"
SUPABASE_ANON_KEY="eyJhbGciOi..."
SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOi..."

# Application URL
APP_URL="http://localhost:3000"`;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-2xl w-full border border-stone-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-stone-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-100 text-emerald-800 rounded-lg">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-stone-900">
                Database & Integration Architecture
              </h2>
              <p className="text-xs text-stone-500">
                Supabase PostgreSQL, Authentication, and Google Gemini integration status.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-stone-400 hover:text-stone-700 rounded-lg hover:bg-stone-100"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab navigation */}
        <div className="flex border-b border-stone-200 px-6 text-xs font-semibold bg-stone-50/50">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-3 px-3 border-b-2 transition-colors ${
              activeTab === 'overview'
                ? 'border-emerald-600 text-emerald-800'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            Operating Mode & Status
          </button>
          <button
            onClick={() => setActiveTab('schema')}
            className={`py-3 px-3 border-b-2 transition-colors ${
              activeTab === 'schema'
                ? 'border-emerald-600 text-emerald-800'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            PostgreSQL SQL Schema
          </button>
          <button
            onClick={() => setActiveTab('env')}
            className={`py-3 px-3 border-b-2 transition-colors ${
              activeTab === 'env'
                ? 'border-emerald-600 text-emerald-800'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            Environment Variables
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs flex-1">
          {activeTab === 'overview' && (
            <div className="space-y-4">
              <div
                className={`p-4 rounded-xl border flex items-start gap-3 ${
                  isDemoMode
                    ? 'bg-amber-50/80 border-amber-200 text-amber-900'
                    : 'bg-emerald-50/80 border-emerald-200 text-emerald-900'
                }`}
              >
                <Info className="w-5 h-5 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-bold">
                    Currently Operating in: {isDemoMode ? 'Local Demo Mode' : 'Connected Mode'}
                  </p>
                  <p className="text-[11px] leading-relaxed opacity-90">
                    {isDemoMode
                      ? 'In Demo Mode, all inventory data, sales history, and pricing marks are fully persistent in local storage. Deterministic pricing formulas and explainable demand forecasting run locally.'
                      : 'Connected Mode bridges to live Supabase PostgreSQL tables with Row-Level Security policies and active credentials.'}
                  </p>
                </div>
              </div>

              <div className="p-4 bg-stone-50 border border-stone-200 rounded-xl space-y-3">
                <h4 className="font-bold text-stone-900">Switch Operating Mode</h4>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-stone-800">Demo Data Simulation</p>
                    <p className="text-[11px] text-stone-500">
                      Ideal for hackathon presentation without external database credentials.
                    </p>
                  </div>
                  <button
                    onClick={() => onToggleDemoMode(!isDemoMode)}
                    className={`px-3 py-1.5 rounded-lg font-semibold text-xs transition-colors ${
                      isDemoMode
                        ? 'bg-amber-600 text-white'
                        : 'bg-stone-200 text-stone-700'
                    }`}
                  >
                    {isDemoMode ? 'Demo Active' : 'Switch to Demo'}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold text-stone-900">Supported Integrations</h4>
                <div className="grid grid-cols-2 gap-3 text-stone-700">
                  <div className="p-3 border border-stone-200 rounded-lg bg-stone-50/50">
                    <span className="font-semibold block text-stone-900">Google Gemini API</span>
                    <span className="text-[11px] text-emerald-700 font-medium">gemini-3.8-flash</span>
                    <p className="text-[10px] text-stone-500 mt-1">Generates strategic markdown rationales & waste insights.</p>
                  </div>
                  <div className="p-3 border border-stone-200 rounded-lg bg-stone-50/50">
                    <span className="font-semibold block text-stone-900">Supabase PostgreSQL</span>
                    <span className="text-[11px] text-stone-600 font-medium">Normalized Relational Schema</span>
                    <p className="text-[10px] text-stone-500 mt-1">9 normalized tables with RLS and foreign constraints.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'schema' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-stone-600 font-semibold">
                  Location: <code className="font-mono text-emerald-800">/supabase/migrations/20261009000000_smartsave_schema.sql</code>
                </span>
                <button
                  onClick={() => copyToClipboard('See full schema in /supabase/migrations/20261009000000_smartsave_schema.sql')}
                  className="px-2.5 py-1 border border-stone-200 rounded hover:bg-stone-50 flex items-center gap-1 text-[11px]"
                >
                  {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                  <span>{copied ? 'Copied' : 'Copy Path'}</span>
                </button>
              </div>

              <div className="p-3 bg-stone-900 text-stone-200 rounded-lg font-mono text-[11px] overflow-x-auto max-h-72">
                <pre>{`-- Normalized tables created:
-- 1. stores (id, name, location, currency)
-- 2. profiles (id, full_name, role, email)
-- 3. store_members (store_id, user_id, role)
-- 4. products (id, store_id, name, sku, category, quantity, unit, cost_price, selling_price, expiry_date, sales_velocity)
-- 5. sales (id, store_id, product_id, quantity_sold, unit_price, discount_percentage, revenue, sold_at)
-- 6. pricing_recommendations (id, product_id, recommended_price, discount_percentage, explanation, status)
-- 7. waste_records (id, product_id, quantity_wasted, estimated_cost, reason, recorded_at)
-- 8. inventory_events (id, product_id, event_type, quantity, notes)
-- 9. activity_logs (id, store_id, user_name, user_role, action, description, created_at)`}</pre>
              </div>
            </div>
          )}

          {activeTab === 'env' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-stone-600 font-semibold">Environment Variables Format</span>
                <button
                  onClick={() => copyToClipboard(envSample)}
                  className="px-2.5 py-1 border border-stone-200 rounded hover:bg-stone-50 flex items-center gap-1 text-[11px]"
                >
                  {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                  <span>{copied ? 'Copied' : 'Copy Configuration'}</span>
                </button>
              </div>

              <div className="p-3 bg-stone-900 text-stone-200 rounded-lg font-mono text-[11px] overflow-x-auto">
                <pre>{envSample}</pre>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-stone-200 bg-stone-50/50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-stone-900 hover:bg-stone-800 text-white rounded-lg font-semibold text-xs"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
