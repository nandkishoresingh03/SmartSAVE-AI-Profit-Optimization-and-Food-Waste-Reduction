import React, { useState } from 'react';
import {
  BarChart3,
  Download,
  Calendar,
  DollarSign,
  Leaf,
  Trash2,
  TrendingUp,
  FileSpreadsheet,
  CheckCircle2,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';
import { Product, SaleRecord, WasteRecord, DonationRecord, OperationsKPIs } from '../../types/index.ts';

interface ReportsViewProps {
  products: Product[];
  sales: SaleRecord[];
  wasteRecords: WasteRecord[];
  donations: DonationRecord[];
  kpis: OperationsKPIs;
}

export const ReportsView: React.FC<ReportsViewProps> = ({
  products,
  sales,
  wasteRecords,
  donations,
  kpis,
}) => {
  const [dateRange, setDateRange] = useState<'7d' | '30d' | 'quarter'>('7d');

  // Departmental waste vs recovered comparison
  const departmentStats: Record<string, { category: string; salvagedRev: number; wastedCost: number }> = {
    Produce: { category: 'Produce', salvagedRev: 132.57, wastedCost: 9.60 },
    'Dairy & Eggs': { category: 'Dairy & Eggs', salvagedRev: 78.20, wastedCost: 0 },
    Bakery: { category: 'Bakery', salvagedRev: 54.60, wastedCost: 8.40 },
    'Meat & Seafood': { category: 'Meat & Seafood', salvagedRev: 149.92, wastedCost: 0 },
    'Deli & Prepared': { category: 'Deli & Prepared', salvagedRev: 0, wastedCost: 0 },
    'Pantry & Dry Goods': { category: 'Pantry & Dry Goods', salvagedRev: 0, wastedCost: 0 },
  };

  // Add recorded sales to category stats
  sales.forEach((s) => {
    if (departmentStats[s.category]) {
      departmentStats[s.category].salvagedRev += s.revenue;
    }
  });

  wasteRecords.forEach((w) => {
    if (departmentStats[w.category]) {
      departmentStats[w.category].wastedCost += w.estimated_cost;
    }
  });

  const chartData = Object.values(departmentStats);

  // CSV Report Generator
  const downloadReport = (reportType: 'waste-audit' | 'salvage-ledger') => {
    let headers: string[] = [];
    let rows: (string | number)[][] = [];
    let filename = '';

    if (reportType === 'waste-audit') {
      filename = `smartsave_waste_audit_${dateRange}.csv`;
      headers = ['Record ID', 'Product', 'Category', 'Quantity Wasted', 'Unit', 'Estimated Cost ($)', 'Reason', 'Date Recorded'];
      rows = wasteRecords.map((w) => [
        w.id,
        `"${w.product_name}"`,
        w.category,
        w.quantity_wasted,
        w.unit,
        w.estimated_cost.toFixed(2),
        w.reason,
        w.recorded_at,
      ]);
    } else {
      filename = `smartsave_salvage_ledger_${dateRange}.csv`;
      headers = ['Sale ID', 'Product', 'Category', 'Units Sold', 'Discount %', 'Unit Price ($)', 'Revenue Recovered ($)', 'Timestamp'];
      rows = sales.map((s) => [
        s.id,
        `"${s.product_name}"`,
        s.category,
        s.quantity_sold,
        s.discount_percentage,
        s.unit_price.toFixed(2),
        s.revenue.toFixed(2),
        s.sold_at,
      ]);
    }

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encoded = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encoded);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-2xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-emerald-600" />
              <h2 className="text-base font-bold text-stone-900">
                Waste & Revenue Recovery Reports
              </h2>
            </div>
            <p className="text-xs text-stone-500 mt-1">
              Verifiable operational audit comparing proactive markdown recovery against recorded landfill write-offs.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center p-1 bg-stone-100 rounded-lg text-xs font-medium">
              <button
                onClick={() => setDateRange('7d')}
                className={`px-3 py-1 rounded-md transition-colors ${
                  dateRange === '7d' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-600'
                }`}
              >
                Last 7 Days
              </button>
              <button
                onClick={() => setDateRange('30d')}
                className={`px-3 py-1 rounded-md transition-colors ${
                  dateRange === '30d' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-600'
                }`}
              >
                Last 30 Days
              </button>
              <button
                onClick={() => setDateRange('quarter')}
                className={`px-3 py-1 rounded-md transition-colors ${
                  dateRange === 'quarter' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-600'
                }`}
              >
                Fiscal Quarter
              </button>
            </div>

            <button
              onClick={() => downloadReport('salvage-ledger')}
              className="px-3 py-1.5 border border-stone-200 hover:bg-stone-50 text-stone-700 text-xs font-medium rounded-lg flex items-center gap-1.5 transition-colors"
            >
              <Download className="w-3.5 h-3.5 text-stone-500" />
              <span>Download Ledger</span>
            </button>
          </div>
        </div>
      </div>

      {/* Summary KPI Strip */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
        <div className="p-4 bg-white rounded-xl border border-stone-200 shadow-2xs space-y-1">
          <span className="text-stone-500 font-medium">Gross Salvage Revenue</span>
          <p className="text-2xl font-bold text-emerald-700 font-mono tabular-nums">
            ${kpis.estimated_revenue_recovered.toFixed(2)}
          </p>
          <p className="text-stone-500 text-[11px]">Via timely price markdowns</p>
        </div>

        <div className="p-4 bg-white rounded-xl border border-stone-200 shadow-2xs space-y-1">
          <span className="text-stone-500 font-medium">Actual Recorded Waste Loss</span>
          <p className="text-2xl font-bold text-rose-600 font-mono tabular-nums">
            ${kpis.total_waste_cost.toFixed(2)}
          </p>
          <p className="text-stone-500 text-[11px]">{kpis.total_waste_recorded_kg} kg written off</p>
        </div>

        <div className="p-4 bg-white rounded-xl border border-stone-200 shadow-2xs space-y-1">
          <span className="text-stone-500 font-medium">Food Waste Diverted</span>
          <p className="text-2xl font-bold text-stone-900 font-mono tabular-nums">
            {kpis.estimated_waste_avoided_kg} kg
          </p>
          <p className="text-stone-500 text-[11px]">Diverted from municipal landfills</p>
        </div>

        <div className="p-4 bg-white rounded-xl border border-stone-200 shadow-2xs space-y-1">
          <span className="text-stone-500 font-medium">Carbon Emissions Offset</span>
          <p className="text-2xl font-bold text-emerald-800 font-mono tabular-nums">
            {kpis.co2_emissions_avoided_kg} kg CO₂
          </p>
          <p className="text-stone-500 text-[11px]">Lifecycle GHG impact</p>
        </div>
      </div>

      {/* Departmental Comparison Chart */}
      <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-2xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-stone-900">
              Departmental Performance: Revenue Recovered vs Waste Loss
            </h3>
            <p className="text-xs text-stone-500">
              Dollar comparison by food department
            </p>
          </div>
        </div>

        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="category" tick={{ fontSize: 11, fill: '#64748b' }} />
              <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
              <Tooltip
                formatter={(val: any) => [`$${Number(val || 0).toFixed(2)}`]}
                contentStyle={{ backgroundColor: '#ffffff', borderRadius: 8, fontSize: 12, border: '1px solid #e2e8f0' }}
              />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="salvagedRev" name="Revenue Salvaged ($)" fill="#059669" radius={[4, 4, 0, 0]} />
              <Bar dataKey="wastedCost" name="Waste Loss ($)" fill="#f43f5e" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Waste Audit Log Table */}
      <div className="bg-white rounded-xl border border-stone-200 shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-stone-200 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-stone-900">Recorded Waste Log</h3>
            <p className="text-xs text-stone-500">Documented items discarded after reaching shelf-life end</p>
          </div>
          <button
            onClick={() => downloadReport('waste-audit')}
            className="px-3 py-1.5 border border-stone-200 hover:bg-stone-50 text-stone-700 text-xs font-medium rounded-lg flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Waste CSV</span>
          </button>
        </div>

        <div className="overflow-x-auto text-xs">
          <table className="w-full text-left">
            <thead className="bg-stone-50 border-b border-stone-200 text-stone-500 font-semibold">
              <tr>
                <th className="py-2.5 px-3">Date</th>
                <th className="py-2.5 px-3">Product Name</th>
                <th className="py-2.5 px-3">Category</th>
                <th className="py-2.5 px-3 text-right">Quantity</th>
                <th className="py-2.5 px-3 text-right">Estimated Cost</th>
                <th className="py-2.5 px-3">Documented Reason</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 font-mono">
              {wasteRecords.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-stone-400 font-sans">
                    No waste incidents logged.
                  </td>
                </tr>
              ) : (
                wasteRecords.map((w) => (
                  <tr key={w.id} className="hover:bg-stone-50/60">
                    <td className="py-2.5 px-3 text-stone-500">
                      {new Date(w.recorded_at).toLocaleDateString()}
                    </td>
                    <td className="py-2.5 px-3 font-sans font-semibold text-stone-900">
                      {w.product_name}
                    </td>
                    <td className="py-2.5 px-3 font-sans text-stone-600">{w.category}</td>
                    <td className="py-2.5 px-3 text-right tabular-nums">
                      {w.quantity_wasted} <span className="font-sans text-stone-500">{w.unit}</span>
                    </td>
                    <td className="py-2.5 px-3 text-right tabular-nums text-rose-600 font-semibold">
                      -${w.estimated_cost.toFixed(2)}
                    </td>
                    <td className="py-2.5 px-3 font-sans text-stone-700">{w.reason}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
