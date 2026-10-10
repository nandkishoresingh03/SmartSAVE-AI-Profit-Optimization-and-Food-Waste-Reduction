import React, { useState } from 'react';
import {
  TrendingUp,
  AlertTriangle,
  Package,
  Calendar,
  Info,
  CheckCircle2,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { Product, SaleRecord, ForecastItem } from '../../types/index.ts';
import { generateDemandForecast } from '../../lib/forecastEngine.ts';
import { calculateExpiryUrgency } from '../../lib/pricingEngine.ts';

interface DemandForecastViewProps {
  products: Product[];
  sales: SaleRecord[];
}

export const DemandForecastView: React.FC<DemandForecastViewProps> = ({
  products,
  sales,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  const forecasts: ForecastItem[] = generateDemandForecast(products, sales);

  const filteredForecasts = forecasts.filter((f) =>
    selectedCategory === 'All' ? true : f.category === selectedCategory
  );

  const highStockoutItems = forecasts.filter((f) => f.stockout_risk === 'High');
  const overstockItems = forecasts.filter((f) => f.stockout_risk === 'Overstock Risk');

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-2xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
              <h2 className="text-base font-bold text-stone-900">
                7-Day Perishable Demand Forecasting
              </h2>
            </div>
            <p className="text-xs text-stone-500 mt-1">
              Explainable run-rate forecasting synthesizing historical POS transaction velocity, day-of-week seasonality, and remaining shelf life.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-stone-500">Filter Department:</span>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-stone-50 border border-stone-200 rounded-lg px-2.5 py-1.5 text-stone-700 outline-none"
            >
              <option value="All">All Categories</option>
              <option value="Produce">Produce</option>
              <option value="Dairy & Eggs">Dairy & Eggs</option>
              <option value="Bakery">Bakery</option>
              <option value="Meat & Seafood">Meat & Seafood</option>
              <option value="Deli & Prepared">Deli & Prepared</option>
              <option value="Pantry & Dry Goods">Pantry & Dry Goods</option>
            </select>
          </div>
        </div>

        {/* Informational Methodology Notice */}
        <div className="p-3 bg-stone-50 rounded-lg border border-stone-200/80 flex items-start gap-2.5 text-xs text-stone-600">
          <Info className="w-4 h-4 text-stone-400 shrink-0 mt-0.5" />
          <p>
            Forecasts clearly identify data quality inputs: <span className="font-semibold text-stone-800">Robust History</span> (actual POS transactions), <span className="font-semibold text-stone-800">Baseline Average</span> (department run-rate), or <span className="font-semibold text-stone-800">New Item Estimate</span>. Projections are estimates, not guarantees.
          </p>
        </div>
      </div>

      {/* Highlights Strip */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
        <div className="p-4 bg-white rounded-xl border border-stone-200 shadow-2xs space-y-1">
          <span className="text-stone-500 font-medium">Imminent Stockout Risk</span>
          <p className="text-2xl font-bold text-stone-900 font-mono tabular-nums">
            {highStockoutItems.length} SKUs
          </p>
          <p className="text-stone-500 text-[11px]">
            Depletion expected within 48 hours
          </p>
        </div>

        <div className="p-4 bg-white rounded-xl border border-stone-200 shadow-2xs space-y-1">
          <span className="text-stone-500 font-medium">Perishable Overstock Alert</span>
          <p className="text-2xl font-bold text-amber-700 font-mono tabular-nums">
            {overstockItems.length} SKUs
          </p>
          <p className="text-stone-500 text-[11px]">
            Stock exceeds 7-day expected demand before expiry
          </p>
        </div>

        <div className="p-4 bg-white rounded-xl border border-stone-200 shadow-2xs space-y-1">
          <span className="text-stone-500 font-medium">Recommended Replenishment</span>
          <p className="text-2xl font-bold text-emerald-700 font-mono tabular-nums">
            {forecasts.reduce((acc, f) => acc + f.suggested_reorder_units, 0)} Units
          </p>
          <p className="text-stone-500 text-[11px]">
            Across safe non-expiring staples
          </p>
        </div>
      </div>

      {/* Forecast Data Table */}
      <div className="bg-white rounded-xl border border-stone-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-stone-50/80 border-b border-stone-200 text-stone-500 font-semibold">
              <tr>
                <th className="py-3 px-3">Product Name</th>
                <th className="py-3 px-3">Department</th>
                <th className="py-3 px-3 text-right">Current Stock</th>
                <th className="py-3 px-3 text-right">7-Day Projected Sales</th>
                <th className="py-3 px-3 text-right">Days to Depletion</th>
                <th className="py-3 px-3">Risk Assessment</th>
                <th className="py-3 px-3 text-right">Suggested Reorder</th>
                <th className="py-3 px-3">Data Quality</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filteredForecasts.map((item) => (
                <tr key={item.product_id} className="hover:bg-stone-50/60 transition-colors">
                  <td className="py-3 px-3 font-semibold text-stone-900">
                    {item.product_name}
                  </td>
                  <td className="py-3 px-3 text-stone-600">{item.category}</td>
                  <td className="py-3 px-3 text-right font-mono tabular-nums">
                    <span className="font-semibold text-stone-800">{item.current_stock}</span>{' '}
                    <span className="text-stone-500 font-sans">{item.unit}</span>
                  </td>
                  <td className="py-3 px-3 text-right font-mono tabular-nums font-semibold text-emerald-800">
                    ~{item.forecast_7d_sales} {item.unit}
                  </td>
                  <td className="py-3 px-3 text-right font-mono tabular-nums text-stone-700">
                    {item.days_to_stockout} days
                  </td>
                  <td className="py-3 px-3">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold ${
                        item.stockout_risk === 'High'
                          ? 'bg-rose-100 text-rose-800'
                          : item.stockout_risk === 'Overstock Risk'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-emerald-50 text-emerald-800'
                      }`}
                    >
                      {item.stockout_risk}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-right font-mono tabular-nums">
                    {item.suggested_reorder_units > 0 ? (
                      <span className="font-bold text-emerald-700">
                        +{item.suggested_reorder_units} {item.unit}
                      </span>
                    ) : (
                      <span className="text-stone-400">None</span>
                    )}
                  </td>
                  <td className="py-3 px-3">
                    <div className="flex flex-col">
                      <span className="text-stone-700 font-medium text-[11px]">
                        {item.data_quality}
                      </span>
                      <span className="text-[10px] text-stone-400 font-mono">
                        {item.confidence_pct}% model weight
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
