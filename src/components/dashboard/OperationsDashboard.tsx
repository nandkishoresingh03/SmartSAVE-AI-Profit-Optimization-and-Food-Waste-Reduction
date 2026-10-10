import React from 'react';
import {
  Boxes,
  Clock,
  Sparkles,
  TrendingUp,
  Leaf,
  DollarSign,
  HeartHandshake,
  AlertCircle,
  ArrowUpRight,
  ShieldCheck,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { OperationsKPIs, Product, SaleRecord } from '../../types/index.ts';
import { calculateExpiryUrgency } from '../../lib/pricingEngine.ts';

interface OperationsDashboardProps {
  kpis: OperationsKPIs;
  products: Product[];
  sales: SaleRecord[];
  onNavigateToTab: (tab: 'inventory' | 'expiry-alerts' | 'ai-pricing' | 'reports') => void;
  isDemoMode: boolean;
  storeName: string;
}

export const OperationsDashboard: React.FC<OperationsDashboardProps> = ({
  kpis,
  products,
  sales,
  onNavigateToTab,
  isDemoMode,
  storeName,
}) => {
  // Aggregate expiry breakdown
  const expiryBreakdown = [
    { name: 'Critical (<24h)', count: 0, color: '#f43f5e' },
    { name: 'Urgent (1-3d)', count: 0, color: '#f59e0b' },
    { name: 'Upcoming (4-7d)', count: 0, color: '#3b82f6' },
    { name: 'Safe (>7d)', count: 0, color: '#10b981' },
  ];

  products.forEach((p) => {
    const { urgency } = calculateExpiryUrgency(p.expiry_date);
    if (urgency === 'Critical') expiryBreakdown[0].count++;
    else if (urgency === 'Urgent') expiryBreakdown[1].count++;
    else if (urgency === 'Upcoming') expiryBreakdown[2].count++;
    else expiryBreakdown[3].count++;
  });

  // Category breakdown
  const categoryMap: Record<string, { category: string; value: number; stock: number }> = {};
  products.forEach((p) => {
    if (!categoryMap[p.category]) {
      categoryMap[p.category] = { category: p.category, value: 0, stock: 0 };
    }
    categoryMap[p.category].value += p.quantity * p.selling_price;
    categoryMap[p.category].stock += p.quantity;
  });
  const categoryData = Object.values(categoryMap);

  // Time series mock/historical trend
  const trendData = [
    { day: 'Mon', revenueRecovered: 142, wasteAvoidedKg: 38, salesNormal: 320 },
    { day: 'Tue', revenueRecovered: 198, wasteAvoidedKg: 46, salesNormal: 380 },
    { day: 'Wed', revenueRecovered: 165, wasteAvoidedKg: 41, salesNormal: 340 },
    { day: 'Thu', revenueRecovered: 245, wasteAvoidedKg: 62, salesNormal: 420 },
    { day: 'Fri', revenueRecovered: 310, wasteAvoidedKg: 78, salesNormal: 540 },
    { day: 'Sat', revenueRecovered: 420, wasteAvoidedKg: 95, salesNormal: 690 },
    { day: 'Today', revenueRecovered: kpis.estimated_revenue_recovered, wasteAvoidedKg: kpis.estimated_waste_avoided_kg, salesNormal: 510 },
  ];

  // Actual vs Forecast comparison
  const forecastComparisonData = [
    { name: 'Produce', actualSales: 168, forecastDemand: 180 },
    { name: 'Dairy & Eggs', actualSales: 135, forecastDemand: 142 },
    { name: 'Bakery', actualSales: 94, forecastDemand: 98 },
    { name: 'Meat & Seafood', actualSales: 82, forecastDemand: 90 },
    { name: 'Deli', actualSales: 58, forecastDemand: 65 },
    { name: 'Pantry', actualSales: 120, forecastDemand: 115 },
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner / Store Context */}
      <div className="relative rounded-2xl overflow-hidden bg-stone-900 border border-stone-800 text-white shadow-sm">
        <img
          src="/src/assets/images/grocery_store_aisle_1791612166845.jpg"
          alt="Grocery Aisle"
          className="absolute inset-0 w-full h-full object-cover opacity-25 mix-blend-overlay"
          referrerPolicy="no-referrer"
        />
        <div className="relative p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 z-10">
          <div className="space-y-1.5 max-w-2xl">
            <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold uppercase tracking-wider">
              <Leaf className="w-3.5 h-3.5" />
              <span>Waste Prevention Operations Console</span>
              {isDemoMode && (
                <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded ml-2">
                  Demo Mode
                </span>
              )}
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              {storeName}
            </h1>
            <p className="text-xs sm:text-sm text-stone-300">
              Real-time perishable tracking, automated margin-floor discount recommendations, and verified sustainability ledger.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => onNavigateToTab('expiry-alerts')}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold flex items-center gap-2 shadow-sm transition-colors"
            >
              <Clock className="w-3.5 h-3.5" />
              <span>{kpis.critical_products_count} Critical Expiring</span>
            </button>
            <button
              onClick={() => onNavigateToTab('ai-pricing')}
              className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-stone-950 rounded-lg text-xs font-semibold flex items-center gap-2 shadow-sm transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5 text-stone-950" />
              <span>{kpis.pending_recommendations_count} Pricing Reviews</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Products */}
        <div className="bg-white p-5 rounded-xl border border-stone-200/90 shadow-2xs space-y-3">
          <div className="flex items-center justify-between text-stone-500">
            <span className="text-xs font-medium text-stone-600">Tracked Inventory</span>
            <div className="p-2 bg-stone-100 rounded-lg text-stone-700">
              <Boxes className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-stone-900 font-mono tabular-nums">
              {kpis.total_products} <span className="text-sm font-sans font-normal text-stone-500">SKUs</span>
            </div>
            <p className="text-xs text-stone-500 mt-1">
              Valued at ${kpis.total_inventory_value.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </p>
          </div>
          <div className="pt-2 border-t border-stone-100 flex items-center justify-between text-[11px] text-stone-500">
            <span>Active markdowns</span>
            <span className="font-semibold text-emerald-700 tabular-nums">{kpis.active_markdowns_count} items</span>
          </div>
        </div>

        {/* Card 2: Near Expiry */}
        <div className="bg-white p-5 rounded-xl border border-stone-200/90 shadow-2xs space-y-3">
          <div className="flex items-center justify-between text-stone-500">
            <span className="text-xs font-medium text-stone-600">At-Risk Batches</span>
            <div className="p-2 bg-amber-100 rounded-lg text-amber-700">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-stone-900 font-mono tabular-nums">
              {kpis.products_near_expiry} <span className="text-sm font-sans font-normal text-stone-500">Batches</span>
            </div>
            <p className="text-xs text-rose-600 font-medium mt-1">
              {kpis.critical_products_count} expiring within 24h
            </p>
          </div>
          <div className="pt-2 border-t border-stone-100 flex items-center justify-between text-[11px] text-stone-500">
            <span>Action urgency</span>
            <button
              onClick={() => onNavigateToTab('expiry-alerts')}
              className="font-semibold text-rose-600 hover:underline flex items-center gap-0.5"
            >
              Resolve alerts <ArrowUpRight className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Card 3: Waste Avoided */}
        <div className="bg-white p-5 rounded-xl border border-stone-200/90 shadow-2xs space-y-3">
          <div className="flex items-center justify-between text-stone-500">
            <span className="text-xs font-medium text-stone-600">Waste Diverted</span>
            <div className="p-2 bg-emerald-100 rounded-lg text-emerald-700">
              <Leaf className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-emerald-700 font-mono tabular-nums">
              {kpis.estimated_waste_avoided_kg} <span className="text-sm font-sans font-normal text-stone-500">kg</span>
            </div>
            <p className="text-xs text-stone-500 mt-1">
              {kpis.waste_reduction_rate}% diverted from landfill
            </p>
          </div>
          <div className="pt-2 border-t border-stone-100 flex items-center justify-between text-[11px] text-stone-500">
            <span>CO₂e mitigated</span>
            <span className="font-semibold text-emerald-700 tabular-nums">{kpis.co2_emissions_avoided_kg} kg CO₂</span>
          </div>
        </div>

        {/* Card 4: Revenue Recovered */}
        <div className="bg-white p-5 rounded-xl border border-stone-200/90 shadow-2xs space-y-3">
          <div className="flex items-center justify-between text-stone-500">
            <span className="text-xs font-medium text-stone-600">Salvage Revenue</span>
            <div className="p-2 bg-emerald-100 rounded-lg text-emerald-800">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-stone-900 font-mono tabular-nums">
              ${kpis.estimated_revenue_recovered.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-stone-500 mt-1">
              Recovered through dynamic pricing
            </p>
          </div>
          <div className="pt-2 border-t border-stone-100 flex items-center justify-between text-[11px] text-stone-500">
            <span>Net write-off loss</span>
            <span className="font-semibold text-rose-600 tabular-nums">-${kpis.total_waste_cost.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Sustainability Impact Panel (Deep forest green section) */}
      <div className="bg-emerald-950 text-emerald-100 rounded-2xl p-6 sm:p-7 border border-emerald-900 shadow-md">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-6 pb-6 border-b border-emerald-800/80">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-wider">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              Verified Sustainability Impact
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Food Waste Diversion & Carbon Offset
            </h2>
            <p className="text-xs sm:text-sm text-emerald-200/80 max-w-2xl">
              Calculated using EPA WARM emission factors. Every kilogram of food diverted from organic landfills saves approximately 2.5 kg of lifecycle carbon dioxide equivalent emissions.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="px-3.5 py-1.5 bg-emerald-900/90 border border-emerald-700/60 rounded-lg text-xs font-medium text-emerald-200">
              Audit Standard: GHG Protocol
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="space-y-1">
            <span className="text-xs text-emerald-300 font-medium">Food Diverted</span>
            <p className="text-2xl sm:text-3xl font-extrabold text-white font-mono tabular-nums">
              {kpis.estimated_waste_avoided_kg} <span className="text-sm font-sans font-normal text-emerald-300">kg</span>
            </p>
            <p className="text-[11px] text-emerald-400">Sold via markdown</p>
          </div>

          <div className="space-y-1">
            <span className="text-xs text-emerald-300 font-medium">CO₂e Avoided</span>
            <p className="text-2xl sm:text-3xl font-extrabold text-white font-mono tabular-nums">
              {kpis.co2_emissions_avoided_kg} <span className="text-sm font-sans font-normal text-emerald-300">kg</span>
            </p>
            <p className="text-[11px] text-emerald-400">GHG equivalent</p>
          </div>

          <div className="space-y-1">
            <span className="text-xs text-emerald-300 font-medium">Charity Donations</span>
            <p className="text-2xl sm:text-3xl font-extrabold text-white font-mono tabular-nums">
              {kpis.total_donations_kg} <span className="text-sm font-sans font-normal text-emerald-300">kg</span>
            </p>
            <p className="text-[11px] text-emerald-400">Food relief partners</p>
          </div>

          <div className="space-y-1">
            <span className="text-xs text-emerald-300 font-medium">Diversion Rate</span>
            <p className="text-2xl sm:text-3xl font-extrabold text-emerald-400 font-mono tabular-nums">
              {kpis.waste_reduction_rate}%
            </p>
            <p className="text-[11px] text-emerald-400">Target: 90% zero-waste</p>
          </div>
        </div>
      </div>

      {/* Operations Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Revenue Recovered & Waste Avoided Trend */}
        <div className="bg-white p-5 rounded-xl border border-stone-200/90 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-stone-900">
                Revenue Recovered vs Waste Avoided
              </h3>
              <p className="text-xs text-stone-500">7-Day operational run-rate</p>
            </div>
            <span className="text-[11px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded">
              Weekly Run-Rate
            </span>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#059669" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#059669" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="colorWaste" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
                <Tooltip
                  formatter={(val: any, name: any) => [
                    name === 'revenueRecovered' ? `$${Number(val || 0).toFixed(2)}` : `${val || 0} kg`,
                    name === 'revenueRecovered' ? 'Revenue Recovered' : 'Waste Avoided',
                  ]}
                  contentStyle={{ backgroundColor: '#ffffff', borderRadius: 8, fontSize: 12, border: '1px solid #e2e8f0' }}
                />
                <Area type="monotone" dataKey="revenueRecovered" stroke="#059669" strokeWidth={2} fillOpacity={1} fill="url(#colorRev)" />
                <Area type="monotone" dataKey="wasteAvoidedKg" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorWaste)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Expiry Window Distribution */}
        <div className="bg-white p-5 rounded-xl border border-stone-200/90 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-stone-900">
                Inventory Expiry Distribution
              </h3>
              <p className="text-xs text-stone-500">Current stock categorized by hours to expiry</p>
            </div>
            <button
              onClick={() => onNavigateToTab('expiry-alerts')}
              className="text-xs text-emerald-700 font-semibold hover:underline"
            >
              View List
            </button>
          </div>

          <div className="h-64 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={expiryBreakdown} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
                <Tooltip
                  formatter={(val: any) => [`${val || 0} Products`, 'Batch Count']}
                  contentStyle={{ backgroundColor: '#ffffff', borderRadius: 8, fontSize: 12, border: '1px solid #e2e8f0' }}
                />
                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                  {expiryBreakdown.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 3: Actual Sales vs Forecast Demand */}
        <div className="bg-white p-5 rounded-xl border border-stone-200/90 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-stone-900">
                Actual Sales vs Forecast Demand
              </h3>
              <p className="text-xs text-stone-500">Unit volume comparison across grocery departments</p>
            </div>
            <span className="text-[11px] text-stone-500 font-medium">Units</span>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={forecastComparisonData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
                <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderRadius: 8, fontSize: 12, border: '1px solid #e2e8f0' }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="actualSales" name="Actual Sales" fill="#059669" radius={[4, 4, 0, 0]} />
                <Bar dataKey="forecastDemand" name="Forecast Demand" fill="#94a3b8" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 4: Department Inventory Value */}
        <div className="bg-white p-5 rounded-xl border border-stone-200/90 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-stone-900">
                Inventory Valuation by Category
              </h3>
              <p className="text-xs text-stone-500">Total dollar value currently on shelves</p>
            </div>
            <span className="text-[11px] text-stone-500 font-mono tabular-nums">
              ${kpis.total_inventory_value.toFixed(2)} Total
            </span>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={categoryData}
                layout="vertical"
                margin={{ top: 5, right: 20, left: 35, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis type="number" tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis type="category" dataKey="category" tick={{ fontSize: 11, fill: '#64748b' }} />
                <Tooltip
                  formatter={(val: any) => [`$${Number(val || 0).toFixed(2)}`, 'Inventory Value']}
                  contentStyle={{ backgroundColor: '#ffffff', borderRadius: 8, fontSize: 12, border: '1px solid #e2e8f0' }}
                />
                <Bar dataKey="value" fill="#059669" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
