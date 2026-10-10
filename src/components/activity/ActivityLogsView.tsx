import React, { useState } from 'react';
import {
  History,
  Tag,
  ShoppingBag,
  Trash2,
  HeartHandshake,
  Plus,
  Edit2,
  Check,
  User,
  Filter,
} from 'lucide-react';
import { ActivityLog } from '../../types/index.ts';

interface ActivityLogsViewProps {
  logs: ActivityLog[];
}

export const ActivityLogsView: React.FC<ActivityLogsViewProps> = ({ logs }) => {
  const [filterAction, setFilterAction] = useState<string>('All');

  const filteredLogs = logs.filter((log) => {
    if (filterAction === 'All') return true;
    return log.action.includes(filterAction);
  });

  const getActionBadge = (action: string) => {
    switch (action) {
      case 'AI_RECOMMENDATION_ACCEPTED':
      case 'PRICE_MARKDOWN_APPLIED':
        return {
          icon: Tag,
          color: 'bg-emerald-50 text-emerald-800 border-emerald-200',
          label: 'Markdown Applied',
        };
      case 'STOCK_SOLD':
        return {
          icon: ShoppingBag,
          color: 'bg-blue-50 text-blue-800 border-blue-200',
          label: 'Clearance Sold',
        };
      case 'WASTE_RECORDED':
        return {
          icon: Trash2,
          color: 'bg-rose-50 text-rose-800 border-rose-200',
          label: 'Waste Incident',
        };
      case 'DONATION_RECORDED':
        return {
          icon: HeartHandshake,
          color: 'bg-emerald-50 text-emerald-800 border-emerald-200',
          label: 'Food Donation',
        };
      case 'PRODUCT_CREATED':
        return {
          icon: Plus,
          color: 'bg-stone-100 text-stone-800 border-stone-200',
          label: 'Product Cataloged',
        };
      default:
        return {
          icon: Check,
          color: 'bg-stone-100 text-stone-700 border-stone-200',
          label: 'Action',
        };
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <History className="w-4 h-4 text-emerald-600" />
              <h2 className="text-base font-bold text-stone-900">
                Operational Audit Trail & Activity Log
              </h2>
            </div>
            <p className="text-xs text-stone-500 mt-1">
              Immutable chronological record of inventory edits, dynamic price adjustments, clearance sales, and donations.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-stone-500">Filter Event:</span>
            <select
              value={filterAction}
              onChange={(e) => setFilterAction(e.target.value)}
              className="px-3 py-1.5 bg-stone-50 border border-stone-200 rounded-lg text-stone-700 outline-none"
            >
              <option value="All">All Operations</option>
              <option value="MARKDOWN">Price Markdowns</option>
              <option value="SOLD">Clearance Sales</option>
              <option value="WASTE">Waste Records</option>
              <option value="DONATION">Charity Donations</option>
              <option value="PRODUCT">Inventory Edits</option>
            </select>
          </div>
        </div>
      </div>

      {/* Timeline Stream */}
      <div className="bg-white rounded-xl border border-stone-200 shadow-2xs divide-y divide-stone-100 overflow-hidden text-xs">
        {filteredLogs.length === 0 ? (
          <div className="p-8 text-center text-stone-400">
            No activities matching current filter.
          </div>
        ) : (
          filteredLogs.map((log) => {
            const badge = getActionBadge(log.action);
            const Icon = badge.icon;
            return (
              <div key={log.id} className="p-4 hover:bg-stone-50/70 transition-colors flex items-start gap-4">
                <div className="p-2 rounded-lg bg-stone-100 text-stone-700 shrink-0 mt-0.5">
                  <Icon className="w-4 h-4" />
                </div>

                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-semibold text-stone-900">{log.description}</p>
                    <span className="text-stone-400 font-mono tabular-nums text-[11px] shrink-0">
                      {new Date(log.created_at).toLocaleString()}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-[11px] text-stone-500">
                    <span className="flex items-center gap-1 font-medium text-stone-700">
                      <User className="w-3 h-3 text-stone-400" />
                      {log.user_name}
                    </span>
                    <span>·</span>
                    <span>{log.user_role}</span>
                    <span>·</span>
                    <span className={`px-2 py-0.5 rounded border text-[10px] font-semibold ${badge.color}`}>
                      {badge.label}
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
