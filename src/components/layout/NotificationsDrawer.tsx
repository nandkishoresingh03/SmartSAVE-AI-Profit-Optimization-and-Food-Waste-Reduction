import React from 'react';
import {
  X,
  AlertTriangle,
  Sparkles,
  ArrowRight,
  Clock,
  Check,
} from 'lucide-react';
import { Product, PricingRecommendation } from '../../types/index.ts';
import { calculateExpiryUrgency } from '../../lib/pricingEngine.ts';

interface NotificationsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  recommendations: PricingRecommendation[];
  onAcceptRecommendation: (recId: string) => void;
  onNavigateToTab: (tab: 'expiry-alerts' | 'ai-pricing') => void;
}

export const NotificationsDrawer: React.FC<NotificationsDrawerProps> = ({
  isOpen,
  onClose,
  products,
  recommendations,
  onAcceptRecommendation,
  onNavigateToTab,
}) => {
  if (!isOpen) return null;

  // Filter urgent expiring products
  const criticalProducts = products.filter((p) => {
    const { urgency } = calculateExpiryUrgency(p.expiry_date);
    return urgency === 'Critical' || urgency === 'Urgent';
  });

  const pendingRecs = recommendations.filter((r) => r.status === 'pending');

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div
        className="absolute inset-0 bg-stone-900/40 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white border-l border-stone-200 shadow-2xl flex flex-col">
          {/* Header */}
          <div className="p-4 border-b border-stone-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-stone-900">
                Action Required
              </span>
              <span className="text-xs bg-stone-100 text-stone-600 px-2 py-0.5 rounded font-mono tabular-nums">
                {criticalProducts.length + pendingRecs.length} Active
              </span>
            </div>
            <button
              onClick={onClose}
              className="p-1 text-stone-400 hover:text-stone-700 rounded-lg hover:bg-stone-100"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-4 space-y-6">
            {/* Critical Expiry Alerts */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-stone-900 flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
                  Imminent Expiry Windows
                </span>
                <button
                  onClick={() => {
                    onClose();
                    onNavigateToTab('expiry-alerts');
                  }}
                  className="text-[11px] font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
                >
                  Manage all <ArrowRight className="w-3 h-3" />
                </button>
              </div>

              {criticalProducts.length === 0 ? (
                <p className="text-xs text-stone-400 py-3 text-center border border-dashed border-stone-200 rounded-lg">
                  No critical expiries detected.
                </p>
              ) : (
                <div className="space-y-2">
                  {criticalProducts.slice(0, 4).map((p) => {
                    const { hoursRemaining, urgency } = calculateExpiryUrgency(p.expiry_date);
                    return (
                      <div
                        key={p.id}
                        className={`p-3 rounded-lg border text-xs transition-colors ${
                          urgency === 'Critical'
                            ? 'bg-rose-50/60 border-rose-200'
                            : 'bg-amber-50/60 border-amber-200'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="font-semibold text-stone-900">{p.name}</p>
                            <p className="text-[11px] text-stone-500">
                              {p.quantity} {p.unit} · {p.category}
                            </p>
                          </div>
                          <span
                            className={`font-mono text-[11px] font-bold px-1.5 py-0.5 rounded ${
                              urgency === 'Critical'
                                ? 'bg-rose-100 text-rose-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            <Clock className="w-3 h-3 inline mr-1" />
                            {hoursRemaining}h left
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Pending Pricing Recommendations */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-stone-900 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                  Pending Markdown Recommendations
                </span>
                <button
                  onClick={() => {
                    onClose();
                    onNavigateToTab('ai-pricing');
                  }}
                  className="text-[11px] font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
                >
                  View engine <ArrowRight className="w-3 h-3" />
                </button>
              </div>

              {pendingRecs.length === 0 ? (
                <p className="text-xs text-stone-400 py-3 text-center border border-dashed border-stone-200 rounded-lg">
                  All pricing recommendations have been resolved.
                </p>
              ) : (
                <div className="space-y-2.5">
                  {pendingRecs.slice(0, 3).map((rec) => (
                    <div
                      key={rec.id}
                      className="p-3 bg-stone-50 border border-stone-200 rounded-lg text-xs space-y-2"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-semibold text-stone-900">{rec.product_name}</p>
                          <p className="text-[11px] text-stone-500">
                            Current: ${rec.current_price.toFixed(2)} → Recommended: <span className="font-bold text-emerald-700">${rec.recommended_price.toFixed(2)}</span> (-{rec.discount_percentage}%)
                          </p>
                        </div>
                        <span className="text-[10px] font-medium text-stone-500 bg-stone-200 px-1.5 py-0.5 rounded">
                          {rec.confidence}
                        </span>
                      </div>
                      <p className="text-[11px] text-stone-600 line-clamp-2 italic">
                        "{rec.explanation}"
                      </p>
                      <div className="flex items-center justify-end gap-2 pt-1 border-t border-stone-200/60">
                        <button
                          onClick={() => onAcceptRecommendation(rec.id)}
                          className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-medium text-[11px] flex items-center gap-1 shadow-xs"
                        >
                          <Check className="w-3 h-3" /> Apply Markdown
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
