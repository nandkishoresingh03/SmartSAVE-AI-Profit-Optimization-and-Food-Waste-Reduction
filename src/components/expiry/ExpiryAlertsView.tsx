import React, { useState } from 'react';
import {
  AlertTriangle,
  Clock,
  CheckCircle2,
  Tag,
  ShoppingBag,
  Trash2,
  HeartHandshake,
  DollarSign,
  ChevronRight,
  Filter,
} from 'lucide-react';
import { Product, ProductUnit } from '../../types/index.ts';
import { calculateExpiryUrgency, computeDeterministicRecommendation } from '../../lib/pricingEngine.ts';

interface ExpiryAlertsViewProps {
  products: Product[];
  onApplyMarkdown: (productId: string, discountPct: number) => void;
  onMarkSold: (productId: string, quantity: number, price: number) => void;
  onRecordWaste: (productId: string, quantity: number, unit: ProductUnit, reason: 'Spoilage' | 'Passed Expiry') => void;
  onRecordDonation: (productId: string, quantity: number, unit: ProductUnit, charity: string) => void;
}

export const ExpiryAlertsView: React.FC<ExpiryAlertsViewProps> = ({
  products,
  onApplyMarkdown,
  onMarkSold,
  onRecordWaste,
  onRecordDonation,
}) => {
  const [activeGroup, setActiveGroup] = useState<'All' | 'Critical' | 'Urgent' | 'Upcoming'>('All');
  const [actionModal, setActionModal] = useState<{
    type: 'sold' | 'waste' | 'donate';
    product: Product;
  } | null>(null);

  const [modalQty, setModalQty] = useState<number>(0);
  const [donationCharity, setDonationCharity] = useState<string>('Northwest Harvest Food Bank');
  const [wasteReason, setWasteReason] = useState<'Passed Expiry' | 'Spoilage'>('Passed Expiry');

  // Categorize products
  const criticalItems: { product: Product; hoursRemaining: number }[] = [];
  const urgentItems: { product: Product; daysRemaining: number }[] = [];
  const upcomingItems: { product: Product; daysRemaining: number }[] = [];
  const safeItems: { product: Product; daysRemaining: number }[] = [];

  products.forEach((p) => {
    const { urgency, hoursRemaining, daysRemaining } = calculateExpiryUrgency(p.expiry_date);
    if (urgency === 'Critical') criticalItems.push({ product: p, hoursRemaining });
    else if (urgency === 'Urgent') urgentItems.push({ product: p, daysRemaining });
    else if (urgency === 'Upcoming') upcomingItems.push({ product: p, daysRemaining });
    else safeItems.push({ product: p, daysRemaining });
  });

  const openActionDialog = (product: Product, type: 'sold' | 'waste' | 'donate') => {
    setModalQty(product.quantity);
    setActionModal({ type, product });
  };

  const handleConfirmAction = () => {
    if (!actionModal) return;
    const { type, product } = actionModal;

    if (type === 'sold') {
      onMarkSold(product.id, modalQty, product.selling_price);
    } else if (type === 'waste') {
      onRecordWaste(product.id, modalQty, product.unit, wasteReason);
    } else if (type === 'donate') {
      onRecordDonation(product.id, modalQty, product.unit, donationCharity);
    }

    setActionModal(null);
  };

  return (
    <div className="space-y-6">
      {/* Header & Category Filters */}
      <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-stone-900 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-500" />
              Perishable Expiry Pipeline
            </h2>
            <p className="text-xs text-stone-500">
              Active waste prevention alerts categorized by operational urgency window.
            </p>
          </div>

          <div className="flex items-center gap-1.5 p-1 bg-stone-100 rounded-lg text-xs font-medium">
            <button
              onClick={() => setActiveGroup('All')}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                activeGroup === 'All'
                  ? 'bg-white text-stone-900 shadow-xs font-semibold'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              All Alerts ({criticalItems.length + urgentItems.length + upcomingItems.length})
            </button>
            <button
              onClick={() => setActiveGroup('Critical')}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                activeGroup === 'Critical'
                  ? 'bg-rose-600 text-white shadow-xs font-semibold'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Critical &lt;24h ({criticalItems.length})
            </button>
            <button
              onClick={() => setActiveGroup('Urgent')}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                activeGroup === 'Urgent'
                  ? 'bg-amber-600 text-white shadow-xs font-semibold'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Urgent 1-3d ({urgentItems.length})
            </button>
            <button
              onClick={() => setActiveGroup('Upcoming')}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                activeGroup === 'Upcoming'
                  ? 'bg-blue-600 text-white shadow-xs font-semibold'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Upcoming 4-7d ({upcomingItems.length})
            </button>
          </div>
        </div>
      </div>

      {/* Critical Section */}
      {(activeGroup === 'All' || activeGroup === 'Critical') && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
              <h3 className="text-sm font-bold text-stone-900">
                Critical Priority — Expiring in &lt; 24 Hours
              </h3>
              <span className="text-xs text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded font-medium">
                {criticalItems.length} Products at immediate risk
              </span>
            </div>
          </div>

          {criticalItems.length === 0 ? (
            <div className="p-6 bg-white border border-dashed border-stone-200 rounded-xl text-center text-xs text-stone-400">
              No products in critical &lt;24h window.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {criticalItems.map(({ product, hoursRemaining }) => {
                const rec = computeDeterministicRecommendation(product);
                const valueAtRisk = product.quantity * product.selling_price;
                return (
                  <div
                    key={product.id}
                    className="bg-white rounded-xl border border-rose-200 p-4 shadow-2xs space-y-3 relative overflow-hidden"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-[11px] font-mono text-stone-500">{product.sku}</span>
                        <h4 className="font-bold text-sm text-stone-900">{product.name}</h4>
                        <p className="text-xs text-stone-500">
                          {product.quantity} {product.unit} · {product.category}
                        </p>
                      </div>
                      <span className="bg-rose-100 text-rose-800 text-xs font-bold px-2 py-1 rounded font-mono shrink-0">
                        <Clock className="w-3 h-3 inline mr-1" />
                        {hoursRemaining}h left
                      </span>
                    </div>

                    <div className="p-2.5 bg-rose-50/60 rounded-lg space-y-1 text-xs">
                      <div className="flex justify-between text-stone-600">
                        <span>Value at Risk:</span>
                        <span className="font-bold text-stone-900 font-mono">${valueAtRisk.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-stone-600">
                        <span>Cost Floor:</span>
                        <span className="font-mono text-stone-700">${product.cost_price.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-stone-600">
                        <span>Recommended Markdown:</span>
                        <span className="font-bold text-rose-700 font-mono">
                          -${rec.discount_percentage}% (${rec.recommended_price.toFixed(2)})
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-stone-100">
                      <button
                        onClick={() => onApplyMarkdown(product.id, rec.discount_percentage)}
                        className="w-full py-1.5 px-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-semibold flex items-center justify-center gap-1 shadow-2xs"
                      >
                        <Tag className="w-3 h-3" />
                        Apply -{rec.discount_percentage}%
                      </button>

                      <button
                        onClick={() => openActionDialog(product, 'sold')}
                        className="w-full py-1.5 px-2 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded text-xs font-medium flex items-center justify-center gap-1"
                      >
                        <ShoppingBag className="w-3 h-3" />
                        Mark Sold
                      </button>

                      <button
                        onClick={() => openActionDialog(product, 'donate')}
                        className="w-full py-1.5 px-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded text-xs font-medium flex items-center justify-center gap-1"
                      >
                        <HeartHandshake className="w-3 h-3" />
                        Donate
                      </button>

                      <button
                        onClick={() => openActionDialog(product, 'waste')}
                        className="w-full py-1.5 px-2 bg-rose-50 hover:bg-rose-100 text-rose-800 rounded text-xs font-medium flex items-center justify-center gap-1"
                      >
                        <Trash2 className="w-3 h-3" />
                        Log Waste
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Urgent Section (1-3 days) */}
      {(activeGroup === 'All' || activeGroup === 'Urgent') && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              <h3 className="text-sm font-bold text-stone-900">
                Urgent Priority — Expiring in 1 to 3 Days
              </h3>
              <span className="text-xs text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded font-medium">
                {urgentItems.length} Products
              </span>
            </div>
          </div>

          {urgentItems.length === 0 ? (
            <div className="p-6 bg-white border border-dashed border-stone-200 rounded-xl text-center text-xs text-stone-400">
              No products in urgent 1-3 day window.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {urgentItems.map(({ product, daysRemaining }) => {
                const rec = computeDeterministicRecommendation(product);
                const valueAtRisk = product.quantity * product.selling_price;
                return (
                  <div
                    key={product.id}
                    className="bg-white rounded-xl border border-amber-200 p-4 shadow-2xs space-y-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-[11px] font-mono text-stone-500">{product.sku}</span>
                        <h4 className="font-bold text-sm text-stone-900">{product.name}</h4>
                        <p className="text-xs text-stone-500">
                          {product.quantity} {product.unit} · {product.category}
                        </p>
                      </div>
                      <span className="bg-amber-100 text-amber-800 text-xs font-bold px-2 py-1 rounded font-mono shrink-0">
                        {daysRemaining}d left
                      </span>
                    </div>

                    <div className="p-2.5 bg-stone-50 rounded-lg space-y-1 text-xs">
                      <div className="flex justify-between text-stone-600">
                        <span>Value at Risk:</span>
                        <span className="font-bold text-stone-900 font-mono">${valueAtRisk.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-stone-600">
                        <span>Recommended Markdown:</span>
                        <span className="font-bold text-amber-700 font-mono">
                          -${rec.discount_percentage}% (${rec.recommended_price.toFixed(2)})
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-stone-100">
                      <button
                        onClick={() => onApplyMarkdown(product.id, rec.discount_percentage)}
                        className="w-full py-1.5 px-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-semibold flex items-center justify-center gap-1"
                      >
                        <Tag className="w-3 h-3" />
                        Apply -{rec.discount_percentage}%
                      </button>

                      <button
                        onClick={() => openActionDialog(product, 'sold')}
                        className="w-full py-1.5 px-2 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded text-xs font-medium flex items-center justify-center gap-1"
                      >
                        <ShoppingBag className="w-3 h-3" />
                        Mark Sold
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Upcoming Section (4-7 days) */}
      {(activeGroup === 'All' || activeGroup === 'Upcoming') && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
              <h3 className="text-sm font-bold text-stone-900">
                Upcoming Window — Expiring in 4 to 7 Days
              </h3>
              <span className="text-xs text-blue-800 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded font-medium">
                {upcomingItems.length} Products
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {upcomingItems.map(({ product, daysRemaining }) => {
              const rec = computeDeterministicRecommendation(product);
              return (
                <div
                  key={product.id}
                  className="bg-white rounded-xl border border-stone-200 p-4 shadow-2xs space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-semibold text-stone-900 text-xs">{product.name}</h4>
                      <p className="text-[11px] text-stone-500">
                        {product.quantity} {product.unit} · Velocity: {product.sales_velocity}/day
                      </p>
                    </div>
                    <span className="text-xs font-mono text-stone-600 bg-stone-100 px-2 py-0.5 rounded">
                      {daysRemaining}d left
                    </span>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-stone-100 text-xs">
                    <span className="text-stone-500">Early Markdown: -{rec.discount_percentage}%</span>
                    <button
                      onClick={() => onApplyMarkdown(product.id, rec.discount_percentage)}
                      className="text-emerald-700 hover:underline font-semibold"
                    >
                      Apply Now
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Action Dialog (Sold, Waste, or Donation) */}
      {actionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-xl max-w-md w-full border border-stone-200 shadow-xl p-5 space-y-4 text-xs">
            <div className="border-b border-stone-100 pb-3">
              <h3 className="text-sm font-bold text-stone-900 capitalize">
                Record {actionModal.type === 'sold' ? 'Clearance Sale' : actionModal.type === 'waste' ? 'Food Waste Incident' : 'Charity Donation'}
              </h3>
              <p className="text-stone-500 mt-0.5">
                Item: <span className="font-semibold text-stone-800">{actionModal.product.name}</span> ({actionModal.product.sku})
              </p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block font-semibold text-stone-700 mb-1">
                  Quantity ({actionModal.product.unit})
                </label>
                <input
                  type="number"
                  min="1"
                  max={actionModal.product.quantity}
                  value={modalQty}
                  onChange={(e) => setModalQty(Math.min(actionModal.product.quantity, Math.max(1, parseFloat(e.target.value) || 1)))}
                  className="w-full px-3 py-2 border border-stone-200 rounded-lg font-mono"
                />
                <p className="text-[11px] text-stone-400 mt-1">
                  Max available: {actionModal.product.quantity} {actionModal.product.unit}
                </p>
              </div>

              {actionModal.type === 'waste' && (
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Primary Waste Reason</label>
                  <select
                    value={wasteReason}
                    onChange={(e) => setWasteReason(e.target.value as 'Passed Expiry' | 'Spoilage')}
                    className="w-full px-3 py-2 border border-stone-200 rounded-lg bg-white"
                  >
                    <option value="Passed Expiry">Passed Maximum Expiry Date</option>
                    <option value="Spoilage">Premature Spoilage / Visual Degradation</option>
                  </select>
                </div>
              )}

              {actionModal.type === 'donate' && (
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Charity Partner Destination</label>
                  <input
                    type="text"
                    value={donationCharity}
                    onChange={(e) => setDonationCharity(e.target.value)}
                    className="w-full px-3 py-2 border border-stone-200 rounded-lg"
                    placeholder="e.g. Northwest Harvest Food Bank"
                  />
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-stone-100 flex items-center justify-end gap-2">
              <button
                onClick={() => setActionModal(null)}
                className="px-3 py-1.5 border border-stone-200 text-stone-600 rounded-lg hover:bg-stone-50"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmAction}
                className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold shadow-xs"
              >
                Confirm & Log
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
