import React, { useState } from 'react';
import {
  Sparkles,
  Check,
  X,
  Edit3,
  Sliders,
  ShieldCheck,
  TrendingUp,
  AlertTriangle,
  Clock,
  ArrowRight,
  Info,
  DollarSign,
  RefreshCw,
} from 'lucide-react';
import { Product, PricingRecommendation } from '../../types/index.ts';
import { calculateExpiryUrgency } from '../../lib/pricingEngine.ts';

interface AIPricingViewProps {
  recommendations: PricingRecommendation[];
  products: Product[];
  onAcceptRecommendation: (recId: string) => void;
  onRejectRecommendation: (recId: string) => void;
  onModifyAndApply: (recId: string, customPrice: number, customDiscount: number) => void;
  onRegenerateAll: () => void;
  pricingOptions: {
    allowBelowCost: boolean;
    minMarginFloorPct: number;
    maxDiscountPct: number;
  };
  onUpdatePricingOptions: (options: {
    allowBelowCost: boolean;
    minMarginFloorPct: number;
    maxDiscountPct: number;
  }) => void;
  onRunAIEvaluation: (rec: PricingRecommendation) => Promise<void>;
  isGeneratingAI: boolean;
}

export const AIPricingView: React.FC<AIPricingViewProps> = ({
  recommendations,
  products,
  onAcceptRecommendation,
  onRejectRecommendation,
  onModifyAndApply,
  onRegenerateAll,
  pricingOptions,
  onUpdatePricingOptions,
  onRunAIEvaluation,
  isGeneratingAI,
}) => {
  const [selectedRec, setSelectedRec] = useState<PricingRecommendation | null>(
    recommendations[0] || null
  );
  const [editingPrice, setEditingPrice] = useState<string>('');
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [showConfig, setShowConfig] = useState<boolean>(false);

  // Active pending recommendations
  const pendingRecs = recommendations.filter((r) => r.status === 'pending');
  const resolvedRecs = recommendations.filter((r) => r.status !== 'pending');

  const activeProduct = selectedRec
    ? products.find((p) => p.id === selectedRec.product_id)
    : null;

  return (
    <div className="space-y-6">
      {/* Top Banner & Control Strip */}
      <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-2xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-600" />
              <h2 className="text-base font-bold text-stone-900">
                AI Dynamic Markdown Engine
              </h2>
              <span className="text-xs bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded font-medium">
                Deterministic Math + Gemini Explanations
              </span>
            </div>
            <p className="text-xs text-stone-500">
              Pricing discounts are computed deterministically with strict cost floors, then explained by Google Gemini.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowConfig(!showConfig)}
              className="px-3 py-1.5 border border-stone-200 hover:bg-stone-50 text-stone-700 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors"
            >
              <Sliders className="w-3.5 h-3.5 text-stone-500" />
              <span>Configure Safeguards</span>
            </button>

            <button
              onClick={onRegenerateAll}
              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 shadow-xs transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Recompute Engine</span>
            </button>
          </div>
        </div>

        {/* Safeguard Configuration Drawer */}
        {showConfig && (
          <div className="p-4 bg-stone-50 border border-stone-200 rounded-lg text-xs space-y-3 animate-in fade-in">
            <h3 className="font-bold text-stone-900 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-700" />
              Pricing Safeguards & Margin Guardrails
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-stone-600 font-medium mb-1">
                  Minimum Gross Margin Floor (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="50"
                  value={pricingOptions.minMarginFloorPct}
                  onChange={(e) =>
                    onUpdatePricingOptions({
                      ...pricingOptions,
                      minMarginFloorPct: Math.max(0, parseFloat(e.target.value) || 0),
                    })
                  }
                  className="w-full px-3 py-1.5 bg-white border border-stone-200 rounded font-mono"
                />
                <span className="text-[10px] text-stone-400">
                  Prevents recommendations pricing below cost + this markup
                </span>
              </div>

              <div>
                <label className="block text-stone-600 font-medium mb-1">
                  Maximum Allowable Markdown (%)
                </label>
                <input
                  type="number"
                  min="10"
                  max="90"
                  value={pricingOptions.maxDiscountPct}
                  onChange={(e) =>
                    onUpdatePricingOptions({
                      ...pricingOptions,
                      maxDiscountPct: Math.min(90, Math.max(10, parseFloat(e.target.value) || 10)),
                    })
                  }
                  className="w-full px-3 py-1.5 bg-white border border-stone-200 rounded font-mono"
                />
                <span className="text-[10px] text-stone-400">
                  Upper ceiling for extreme clearance discounts
                </span>
              </div>

              <div className="flex flex-col justify-end">
                <label className="flex items-center gap-2 cursor-pointer pt-2">
                  <input
                    type="checkbox"
                    checked={pricingOptions.allowBelowCost}
                    onChange={(e) =>
                      onUpdatePricingOptions({
                        ...pricingOptions,
                        allowBelowCost: e.target.checked,
                      })
                    }
                    className="rounded text-emerald-600 focus:ring-emerald-500 h-4 w-4"
                  />
                  <span className="font-medium text-stone-700">
                    Authorize Loss-Leader Markdown (Below Cost)
                  </span>
                </label>
                <span className="text-[10px] text-rose-500 mt-0.5">
                  Requires authorized manager override. Protects gross margins by default.
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Main Split Layout: Recommendations Queue + Detailed Scenario Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Pending Recommendations Queue (5 cols) */}
        <div className="lg:col-span-5 space-y-3">
          <div className="flex items-center justify-between text-xs px-1">
            <span className="font-bold text-stone-800">
              Pending Recommendations ({pendingRecs.length})
            </span>
            <span className="text-stone-400">Sorted by Urgency</span>
          </div>

          {pendingRecs.length === 0 ? (
            <div className="bg-white p-8 rounded-xl border border-stone-200 text-center text-xs text-stone-400">
              <Check className="w-6 h-6 text-emerald-600 mx-auto mb-2" />
              <p className="font-semibold text-stone-800">Queue is Clear</p>
              <p className="mt-1">All perishable pricing recommendations have been resolved.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {pendingRecs.map((rec) => {
                const prod = products.find((p) => p.id === rec.product_id);
                const isSelected = selectedRec?.id === rec.id;
                const { hoursRemaining, urgency } = prod
                  ? calculateExpiryUrgency(prod.expiry_date)
                  : { hoursRemaining: 24, urgency: 'Urgent' };

                return (
                  <div
                    key={rec.id}
                    onClick={() => {
                      setSelectedRec(rec);
                      setIsEditing(false);
                    }}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer text-xs ${
                      isSelected
                        ? 'bg-emerald-50/70 border-emerald-300 ring-1 ring-emerald-400'
                        : 'bg-white border-stone-200 hover:border-stone-300'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-stone-900">{rec.product_name}</span>
                        </div>
                        <p className="text-[11px] text-stone-500 mt-0.5">
                          {prod ? `${prod.quantity} ${prod.unit} in stock` : ''} · {rec.category}
                        </p>
                      </div>

                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded font-mono ${
                          urgency === 'Critical'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {urgency === 'Critical' ? `${hoursRemaining}h left` : urgency}
                      </span>
                    </div>

                    <div className="mt-2.5 pt-2 border-t border-stone-100 flex items-center justify-between font-mono">
                      <div className="text-stone-500">
                        ${rec.current_price.toFixed(2)} →{' '}
                        <span className="font-bold text-emerald-700">
                          ${rec.recommended_price.toFixed(2)}
                        </span>{' '}
                        <span className="text-[11px] text-emerald-600 font-semibold">
                          (-{rec.discount_percentage}%)
                        </span>
                      </div>
                      <span className="text-[11px] text-stone-600 font-sans">
                        Est. {rec.estimated_sell_through}% sell-through
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right: Detailed Recommendation Inspector & Scenario Comparator (7 cols) */}
        <div className="lg:col-span-7">
          {selectedRec && activeProduct ? (
            <div className="bg-white rounded-xl border border-stone-200 p-6 shadow-2xs space-y-6 text-xs">
              {/* Product Header */}
              <div className="flex items-start justify-between border-b border-stone-100 pb-4">
                <div>
                  <span className="text-[11px] font-mono text-stone-500">
                    SKU: {activeProduct.sku} · Category: {activeProduct.category}
                  </span>
                  <h3 className="text-lg font-bold text-stone-900 mt-0.5">
                    {selectedRec.product_name}
                  </h3>
                  <p className="text-stone-500 mt-1">
                    Current stock: <span className="font-semibold text-stone-800">{activeProduct.quantity} {activeProduct.unit}</span> · 
                    Sales velocity: <span className="font-semibold text-stone-800">{activeProduct.sales_velocity} units/day</span>
                  </p>
                </div>

                <div className="text-right">
                  <span className="text-[11px] text-stone-500 block">Confidence Level</span>
                  <span className="inline-block text-xs font-semibold px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded mt-0.5">
                    {selectedRec.confidence} Confidence
                  </span>
                </div>
              </div>

              {/* Price Breakdown Matrix */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-stone-50 p-3.5 rounded-lg border border-stone-200/80">
                <div>
                  <span className="text-[11px] text-stone-500">Original Price</span>
                  <p className="text-base font-bold text-stone-800 font-mono mt-0.5">
                    ${activeProduct.original_price.toFixed(2)}
                  </p>
                </div>

                <div>
                  <span className="text-[11px] text-stone-500">Cost Floor</span>
                  <p className="text-base font-bold text-stone-800 font-mono mt-0.5">
                    ${selectedRec.cost_price.toFixed(2)}
                  </p>
                </div>

                <div>
                  <span className="text-[11px] text-stone-500">Proposed Price</span>
                  <p className="text-base font-bold text-emerald-700 font-mono mt-0.5">
                    ${selectedRec.recommended_price.toFixed(2)}
                  </p>
                  <span className="text-[10px] text-emerald-700 font-semibold">
                    -{selectedRec.discount_percentage}% Markdown
                  </span>
                </div>

                <div>
                  <span className="text-[11px] text-stone-500">Est. Revenue Salvaged</span>
                  <p className="text-base font-bold text-emerald-800 font-mono mt-0.5">
                    ${selectedRec.estimated_revenue_recovered.toFixed(2)}
                  </p>
                  <span className="text-[10px] text-stone-500">
                    ~{selectedRec.estimated_sell_through}% sell-through
                  </span>
                </div>
              </div>

              {/* Strategic Explanation Rationale */}
              <div className="p-4 bg-emerald-50/60 border border-emerald-200 rounded-lg space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-emerald-900 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-700" />
                    AI Reasoning & Retail Context
                  </span>
                  <button
                    onClick={() => onRunAIEvaluation(selectedRec)}
                    disabled={isGeneratingAI}
                    className="text-[11px] text-emerald-700 font-semibold hover:underline flex items-center gap-1"
                  >
                    <RefreshCw className={`w-3 h-3 ${isGeneratingAI ? 'animate-spin' : ''}`} />
                    {isGeneratingAI ? 'Analyzing...' : 'Ask Gemini for Fresh Rationale'}
                  </button>
                </div>
                <p className="text-stone-700 leading-relaxed italic">
                  "{selectedRec.explanation}"
                </p>
              </div>

              {/* Alternative Scenarios Comparator */}
              <div className="space-y-3">
                <h4 className="font-bold text-stone-900 flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4 text-stone-600" />
                  Compare Discount Scenarios
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {selectedRec.alternative_scenarios?.map((sc, i) => (
                    <div
                      key={i}
                      className="p-3 bg-stone-50 rounded-lg border border-stone-200 space-y-1.5"
                    >
                      <span className="font-semibold text-stone-800 text-[11px] block">
                        {sc.label}
                      </span>
                      <div className="font-mono text-stone-900 text-sm font-bold">
                        ${sc.price.toFixed(2)}{' '}
                        <span className="text-xs text-stone-500 font-normal">
                          (-{sc.discount_pct}%)
                        </span>
                      </div>
                      <div className="text-[11px] text-stone-600 flex justify-between pt-1 border-t border-stone-200">
                        <span>Sell-through:</span>
                        <span className="font-semibold text-emerald-700">{sc.projected_sell_through}%</span>
                      </div>
                      <div className="text-[11px] text-stone-600 flex justify-between">
                        <span>Revenue:</span>
                        <span className="font-semibold text-stone-800 font-mono">${sc.projected_revenue.toFixed(2)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-stone-200 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onRejectRecommendation(selectedRec.id)}
                    className="px-3.5 py-2 border border-stone-200 hover:bg-stone-50 text-stone-700 font-medium rounded-lg flex items-center gap-1.5 transition-colors"
                  >
                    <X className="w-3.5 h-3.5 text-stone-400" />
                    <span>Reject Rationale</span>
                  </button>

                  <button
                    onClick={() => {
                      setIsEditing(!isEditing);
                      setEditingPrice(String(selectedRec.recommended_price));
                    }}
                    className="px-3.5 py-2 border border-stone-200 hover:bg-stone-50 text-stone-700 font-medium rounded-lg flex items-center gap-1.5 transition-colors"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-stone-400" />
                    <span>Edit Custom Price</span>
                  </button>
                </div>

                <button
                  onClick={() => onAcceptRecommendation(selectedRec.id)}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg flex items-center gap-2 shadow-xs transition-colors"
                >
                  <Check className="w-4 h-4" />
                  <span>Accept & Apply ${selectedRec.recommended_price.toFixed(2)}</span>
                </button>
              </div>

              {/* Custom Price Input bar if editing */}
              {isEditing && (
                <div className="p-3 bg-stone-100 rounded-lg flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-stone-700">Set Custom Price ($):</span>
                    <input
                      type="number"
                      step="0.01"
                      value={editingPrice}
                      onChange={(e) => setEditingPrice(e.target.value)}
                      className="w-24 px-2 py-1 bg-white border border-stone-300 rounded font-mono text-stone-900"
                    />
                  </div>
                  <button
                    onClick={() => {
                      const p = parseFloat(editingPrice) || selectedRec.recommended_price;
                      const disc = Math.round(
                        ((activeProduct.original_price - p) / activeProduct.original_price) * 100
                      );
                      onModifyAndApply(selectedRec.id, p, disc);
                      setIsEditing(false);
                    }}
                    className="px-3 py-1 bg-emerald-700 text-white rounded font-semibold text-xs"
                  >
                    Save & Apply Custom
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-stone-200 p-12 text-center text-xs text-stone-400">
              Select a recommendation from the left queue to inspect details.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
