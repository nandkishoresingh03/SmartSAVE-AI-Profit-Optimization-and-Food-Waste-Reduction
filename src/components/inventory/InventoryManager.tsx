import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  ArrowUpDown,
  Plus,
  Download,
  Upload,
  Edit2,
  Trash2,
  AlertTriangle,
  Clock,
  Sparkles,
  CheckSquare,
  Square,
  Check,
  ChevronDown,
  ShoppingBag,
  Leaf,
} from 'lucide-react';
import { Product, ProductCategory } from '../../types/index.ts';
import { calculateExpiryUrgency } from '../../lib/pricingEngine.ts';
import { ProductFormModal } from './ProductFormModal.tsx';

interface InventoryManagerProps {
  products: Product[];
  onAddProduct: (prod: Partial<Product>) => void;
  onUpdateProduct: (id: string, prod: Partial<Product>) => void;
  onDeleteProduct: (id: string) => void;
  onBulkDiscount: (ids: string[], discountPct: number) => void;
  onImportCSV: (imported: Product[]) => void;
  isAddModalOpen: boolean;
  onCloseAddModal: () => void;
  onOpenAddModal: () => void;
}

export const InventoryManager: React.FC<InventoryManagerProps> = ({
  products,
  onAddProduct,
  onUpdateProduct,
  onDeleteProduct,
  onBulkDiscount,
  onImportCSV,
  isAddModalOpen,
  onCloseAddModal,
  onOpenAddModal,
}) => {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedUrgency, setSelectedUrgency] = useState<string>('All');
  const [sortField, setSortField] = useState<'expiry' | 'name' | 'quantity' | 'price'>('expiry');
  const [sortAsc, setSortAsc] = useState<boolean>(true);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [bulkDiscountVal, setBulkDiscountVal] = useState<number>(20);
  const [showBulkMenu, setShowBulkMenu] = useState(false);

  // Category counts
  const categories: string[] = [
    'All',
    'Produce',
    'Dairy & Eggs',
    'Bakery',
    'Meat & Seafood',
    'Deli & Prepared',
    'Pantry & Dry Goods',
  ];

  // Filtered & Sorted items
  const filteredProducts = useMemo(() => {
    return products
      .filter((p) => {
        const matchesSearch =
          p.name.toLowerCase().includes(search.toLowerCase()) ||
          p.sku.toLowerCase().includes(search.toLowerCase());
        const matchesCategory =
          selectedCategory === 'All' || p.category === selectedCategory;
        const { urgency } = calculateExpiryUrgency(p.expiry_date);
        const matchesUrgency =
          selectedUrgency === 'All' || urgency === selectedUrgency;
        return matchesSearch && matchesCategory && matchesUrgency;
      })
      .sort((a, b) => {
        if (sortField === 'expiry') {
          const diff = new Date(a.expiry_date).getTime() - new Date(b.expiry_date).getTime();
          return sortAsc ? diff : -diff;
        }
        if (sortField === 'name') {
          return sortAsc ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name);
        }
        if (sortField === 'quantity') {
          return sortAsc ? a.quantity - b.quantity : b.quantity - a.quantity;
        }
        if (sortField === 'price') {
          return sortAsc ? a.selling_price - b.selling_price : b.selling_price - a.selling_price;
        }
        return 0;
      });
  }, [products, search, selectedCategory, selectedUrgency, sortField, sortAsc]);

  // Bulk Selection Handlers
  const handleSelectAll = () => {
    if (selectedIds.length === filteredProducts.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredProducts.map((p) => p.id));
    }
  };

  const toggleSelectOne = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // CSV Export
  const handleExportCSV = () => {
    const headers = [
      'ID',
      'Name',
      'SKU',
      'Category',
      'Quantity',
      'Unit',
      'Cost Price',
      'Selling Price',
      'Original Price',
      'Discount %',
      'Expiry Date',
      'Velocity (units/day)',
    ];

    const rows = filteredProducts.map((p) => [
      p.id,
      `"${p.name.replace(/"/g, '""')}"`,
      p.sku,
      p.category,
      p.quantity,
      p.unit,
      p.cost_price.toFixed(2),
      p.selling_price.toFixed(2),
      p.original_price.toFixed(2),
      p.discount_percentage,
      p.expiry_date,
      p.sales_velocity,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `smartsave_inventory_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // CSV Import simulation / parsing
  const handleImportCSVFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (!text) return;
      const lines = text.split('\n');
      const imported: Product[] = [];

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        const parts = line.split(',');
        if (parts.length >= 6) {
          const name = parts[1]?.replace(/^"|"$/g, '').trim() || 'Imported Grocery';
          const sku = parts[2]?.trim() || `SKU-${Date.now()}-${i}`;
          const category = (parts[3]?.trim() || 'Produce') as ProductCategory;
          const qty = parseFloat(parts[4]) || 10;
          const cost = parseFloat(parts[6]) || 2.0;
          const price = parseFloat(parts[7]) || 4.0;
          const expiry = parts[10]?.trim() || new Date(Date.now() + 4 * 86400000).toISOString();

          imported.push({
            id: `prod-imp-${Date.now()}-${i}`,
            store_id: 'store-001',
            name,
            sku,
            category,
            quantity: qty,
            unit: 'units',
            cost_price: cost,
            selling_price: price,
            original_price: price,
            discount_percentage: 0,
            expiry_date: expiry,
            shelf_life_days: 7,
            sales_velocity: 3,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });
        }
      }

      if (imported.length > 0) {
        onImportCSV(imported);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="space-y-4">
      {/* Action Bar */}
      <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-2xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Search & Filters */}
        <div className="flex flex-wrap items-center gap-2.5 flex-1">
          <div className="relative min-w-[220px]">
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search product or SKU..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-stone-50 border border-stone-200 rounded-lg text-stone-900 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          {/* Category Dropdown */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="text-xs px-3 py-1.5 bg-stone-50 border border-stone-200 rounded-lg text-stone-700 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          >
            {categories.map((c) => (
              <option key={c} value={c}>
                Category: {c}
              </option>
            ))}
          </select>

          {/* Expiry Urgency Filter */}
          <select
            value={selectedUrgency}
            onChange={(e) => setSelectedUrgency(e.target.value)}
            className="text-xs px-3 py-1.5 bg-stone-50 border border-stone-200 rounded-lg text-stone-700 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          >
            <option value="All">All Expiry Windows</option>
            <option value="Critical">Critical (&lt;24h)</option>
            <option value="Urgent">Urgent (1-3d)</option>
            <option value="Upcoming">Upcoming (4-7d)</option>
            <option value="Safe">Safe (&gt;7d)</option>
          </select>
        </div>

        {/* Buttons */}
        <div className="flex items-center gap-2 shrink-0">
          {/* CSV Import */}
          <label className="cursor-pointer px-3 py-1.5 border border-stone-200 hover:bg-stone-50 text-stone-700 text-xs font-medium rounded-lg flex items-center gap-1.5 transition-colors">
            <Upload className="w-3.5 h-3.5 text-stone-500" />
            <span>Import CSV</span>
            <input
              type="file"
              accept=".csv"
              onChange={handleImportCSVFile}
              className="hidden"
            />
          </label>

          {/* CSV Export */}
          <button
            onClick={handleExportCSV}
            className="px-3 py-1.5 border border-stone-200 hover:bg-stone-50 text-stone-700 text-xs font-medium rounded-lg flex items-center gap-1.5 transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-stone-500" />
            <span>Export CSV</span>
          </button>

          {/* Add Product */}
          <button
            onClick={onOpenAddModal}
            className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 shadow-xs transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Product</span>
          </button>
        </div>
      </div>

      {/* Bulk Selection Bar (Shown when items are selected) */}
      {selectedIds.length > 0 && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-center justify-between text-xs animate-in fade-in">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-700" />
            <span className="font-semibold text-emerald-900">
              {selectedIds.length} item{selectedIds.length > 1 ? 's' : ''} selected
            </span>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <span className="text-stone-600 font-medium">Apply Bulk Markdown:</span>
              <select
                value={bulkDiscountVal}
                onChange={(e) => setBulkDiscountVal(Number(e.target.value))}
                className="bg-white border border-stone-300 rounded px-2 py-1 text-xs font-mono"
              >
                <option value={15}>15% Off</option>
                <option value={20}>20% Off</option>
                <option value={30}>30% Off</option>
                <option value={40}>40% Off</option>
                <option value={50}>50% Off</option>
              </select>
            </div>

            <button
              onClick={() => {
                onBulkDiscount(selectedIds, bulkDiscountVal);
                setSelectedIds([]);
              }}
              className="px-3 py-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded font-medium"
            >
              Apply Discount
            </button>
            <button
              onClick={() => setSelectedIds([])}
              className="px-2 py-1 text-stone-500 hover:text-stone-800"
            >
              Clear Selection
            </button>
          </div>
        </div>
      )}

      {/* Products Table */}
      <div className="bg-white rounded-xl border border-stone-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-stone-50/80 border-b border-stone-200 text-stone-500 font-semibold select-none">
              <tr>
                <th className="py-3 px-3 w-8">
                  <button
                    onClick={handleSelectAll}
                    className="text-stone-400 hover:text-stone-700"
                  >
                    {selectedIds.length === filteredProducts.length && filteredProducts.length > 0 ? (
                      <CheckSquare className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <Square className="w-4 h-4" />
                    )}
                  </button>
                </th>
                <th
                  onClick={() => {
                    setSortField('name');
                    setSortAsc(!sortAsc);
                  }}
                  className="py-3 px-3 cursor-pointer hover:text-stone-900"
                >
                  <div className="flex items-center gap-1">
                    <span>Product / SKU</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="py-3 px-3">Category</th>
                <th
                  onClick={() => {
                    setSortField('quantity');
                    setSortAsc(!sortAsc);
                  }}
                  className="py-3 px-3 cursor-pointer hover:text-stone-900 text-right"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>Stock</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th
                  onClick={() => {
                    setSortField('price');
                    setSortAsc(!sortAsc);
                  }}
                  className="py-3 px-3 cursor-pointer hover:text-stone-900 text-right"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>Selling Price</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="py-3 px-3 text-right">Cost Floor</th>
                <th
                  onClick={() => {
                    setSortField('expiry');
                    setSortAsc(!sortAsc);
                  }}
                  className="py-3 px-3 cursor-pointer hover:text-stone-900"
                >
                  <div className="flex items-center gap-1">
                    <span>Expiry Window</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="py-3 px-3 text-right">Stock Valuation</th>
                <th className="py-3 px-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-stone-400">
                    <ShoppingBag className="w-8 h-8 mx-auto mb-2 text-stone-300" />
                    <p className="font-medium text-stone-700">No inventory products found</p>
                    <p className="text-[11px] text-stone-400 mt-0.5">
                      Try adjusting filters or add a new grocery item.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredProducts.map((p) => {
                  const { daysRemaining, hoursRemaining, urgency } = calculateExpiryUrgency(p.expiry_date);
                  const isSelected = selectedIds.includes(p.id);
                  const stockValue = p.quantity * p.selling_price;

                  return (
                    <tr
                      key={p.id}
                      className={`hover:bg-stone-50/70 transition-colors ${
                        isSelected ? 'bg-emerald-50/40' : ''
                      }`}
                    >
                      <td className="py-2.5 px-3">
                        <button
                          onClick={() => toggleSelectOne(p.id)}
                          className="text-stone-400 hover:text-stone-700"
                        >
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-emerald-600" />
                          ) : (
                            <Square className="w-4 h-4" />
                          )}
                        </button>
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="font-semibold text-stone-900">{p.name}</div>
                        <div className="text-[11px] font-mono text-stone-500">{p.sku}</div>
                      </td>
                      <td className="py-2.5 px-3 text-stone-600">
                        {p.category}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono tabular-nums">
                        <span className="font-semibold text-stone-900">{p.quantity}</span>{' '}
                        <span className="text-stone-500 font-sans">{p.unit}</span>
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono tabular-nums">
                        <div className="font-semibold text-stone-900">
                          ${p.selling_price.toFixed(2)}
                        </div>
                        {p.discount_percentage > 0 && (
                          <div className="text-[10px] text-emerald-700 font-semibold">
                            -${p.discount_percentage}% off (orig ${p.original_price.toFixed(2)})
                          </div>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono tabular-nums text-stone-500">
                        ${p.cost_price.toFixed(2)}
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`inline-flex items-center gap-1 font-medium text-[11px] px-2 py-0.5 rounded ${
                              urgency === 'Critical'
                                ? 'bg-rose-100 text-rose-800 font-semibold'
                                : urgency === 'Urgent'
                                ? 'bg-amber-100 text-amber-800'
                                : urgency === 'Upcoming'
                                ? 'bg-blue-50 text-blue-800'
                                : 'bg-emerald-50 text-emerald-800'
                            }`}
                          >
                            <Clock className="w-3 h-3" />
                            {urgency === 'Critical'
                              ? `${hoursRemaining}h left`
                              : `${daysRemaining}d left`}
                          </span>
                        </div>
                        <div className="text-[10px] text-stone-400 mt-0.5">
                          {new Date(p.expiry_date).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono tabular-nums font-semibold text-stone-800">
                        ${stockValue.toFixed(2)}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => setEditingProduct(p)}
                            className="p-1 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded"
                            title="Edit product"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`Delete SKU ${p.sku} (${p.name})?`)) {
                                onDeleteProduct(p.id);
                              }
                            }}
                            className="p-1 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded"
                            title="Delete product"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="px-4 py-2.5 border-t border-stone-200 bg-stone-50/50 flex items-center justify-between text-[11px] text-stone-500">
          <span>Showing {filteredProducts.length} of {products.length} products</span>
          <span className="font-mono tabular-nums">
            Total Valuation: ${products.reduce((acc, p) => acc + p.quantity * p.selling_price, 0).toFixed(2)}
          </span>
        </div>
      </div>

      {/* Add Product Modal */}
      <ProductFormModal
        isOpen={isAddModalOpen}
        onClose={onCloseAddModal}
        onSubmit={onAddProduct}
      />

      {/* Edit Product Modal */}
      {editingProduct && (
        <ProductFormModal
          isOpen={Boolean(editingProduct)}
          onClose={() => setEditingProduct(null)}
          productToEdit={editingProduct}
          onSubmit={(data) => {
            onUpdateProduct(editingProduct.id, data);
            setEditingProduct(null);
          }}
        />
      )}
    </div>
  );
};
