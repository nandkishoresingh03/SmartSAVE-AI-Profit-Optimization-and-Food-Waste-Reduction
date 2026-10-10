import React, { useState } from 'react';
import { X, Check, AlertCircle } from 'lucide-react';
import { z } from 'zod';
import { Product, ProductCategory, ProductUnit } from '../../types/index.ts';

const productSchema = z.object({
  name: z.string().min(2, 'Product name must be at least 2 characters'),
  sku: z.string().min(3, 'SKU must be at least 3 characters'),
  category: z.enum([
    'Produce',
    'Dairy & Eggs',
    'Bakery',
    'Meat & Seafood',
    'Deli & Prepared',
    'Pantry & Dry Goods',
  ] as const),
  quantity: z.number().min(0.1, 'Quantity must be greater than zero'),
  unit: z.enum(['units', 'kg', 'packs', 'bunches', 'loaves', 'bottles'] as const),
  cost_price: z.number().min(0.01, 'Cost price must be greater than zero'),
  selling_price: z.number().min(0.01, 'Selling price must be greater than zero'),
  expiry_date: z.string().min(10, 'Valid expiry date is required'),
  sales_velocity: z.number().min(0.1, 'Sales velocity must be at least 0.1 units/day'),
});

interface ProductFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (productData: Partial<Product>) => void;
  productToEdit?: Product | null;
}

export const ProductFormModal: React.FC<ProductFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  productToEdit,
}) => {
  if (!isOpen) return null;

  // Initial values
  const defaultDate = new Date();
  defaultDate.setDate(defaultDate.getDate() + 3);
  const formattedDefaultDate = defaultDate.toISOString().split('T')[0];

  const [formData, setFormData] = useState({
    name: productToEdit?.name || '',
    sku: productToEdit?.sku || '',
    category: (productToEdit?.category || 'Produce') as ProductCategory,
    quantity: productToEdit ? String(productToEdit.quantity) : '20',
    unit: (productToEdit?.unit || 'units') as ProductUnit,
    cost_price: productToEdit ? String(productToEdit.cost_price) : '2.50',
    selling_price: productToEdit ? String(productToEdit.selling_price) : '4.99',
    expiry_date: productToEdit
      ? productToEdit.expiry_date.split('T')[0]
      : formattedDefaultDate,
    sales_velocity: productToEdit ? String(productToEdit.sales_velocity) : '5',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const numericValues = {
      name: formData.name.trim(),
      sku: formData.sku.trim(),
      category: formData.category,
      quantity: parseFloat(formData.quantity) || 0,
      unit: formData.unit,
      cost_price: parseFloat(formData.cost_price) || 0,
      selling_price: parseFloat(formData.selling_price) || 0,
      expiry_date: formData.expiry_date,
      sales_velocity: parseFloat(formData.sales_velocity) || 1,
    };

    const validation = productSchema.safeParse(numericValues);

    if (!validation.success) {
      const fieldErrors: Record<string, string> = {};
      validation.error.issues.forEach((issue) => {
        if (issue.path[0]) {
          fieldErrors[issue.path[0].toString()] = issue.message;
        }
      });
      setErrors(fieldErrors);
      return;
    }

    // Additional domain check: selling price warning if below cost
    if (numericValues.selling_price < numericValues.cost_price) {
      setErrors({
        selling_price: `Warning: Selling price ($${numericValues.selling_price.toFixed(2)}) is below cost price ($${numericValues.cost_price.toFixed(2)}).`,
      });
      return;
    }

    onSubmit({
      ...numericValues,
      original_price: productToEdit ? productToEdit.original_price : numericValues.selling_price,
      discount_percentage: productToEdit ? productToEdit.discount_percentage : 0,
      shelf_life_days: 7,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/50 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-lg w-full border border-stone-200 shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-stone-200 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-stone-900">
              {productToEdit ? 'Edit Inventory Item' : 'Catalog New Product'}
            </h2>
            <p className="text-xs text-stone-500">
              Provide product details, cost floor, and expiration date.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-stone-400 hover:text-stone-700 rounded-lg hover:bg-stone-100"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="p-6 overflow-y-auto space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-stone-700 mb-1">Product Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Organic Sourdough Boule"
              className="w-full px-3 py-2 border border-stone-200 rounded-lg focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
            />
            {errors.name && <p className="text-rose-600 mt-1">{errors.name}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-stone-700 mb-1">SKU Code</label>
              <input
                type="text"
                value={formData.sku}
                onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                placeholder="BAK-SOU-001"
                className="w-full px-3 py-2 border border-stone-200 rounded-lg focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 outline-none font-mono"
              />
              {errors.sku && <p className="text-rose-600 mt-1">{errors.sku}</p>}
            </div>

            <div>
              <label className="block font-semibold text-stone-700 mb-1">Category</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value as ProductCategory })}
                className="w-full px-3 py-2 border border-stone-200 rounded-lg focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 outline-none bg-white"
              >
                <option value="Produce">Produce</option>
                <option value="Dairy & Eggs">Dairy & Eggs</option>
                <option value="Bakery">Bakery</option>
                <option value="Meat & Seafood">Meat & Seafood</option>
                <option value="Deli & Prepared">Deli & Prepared</option>
                <option value="Pantry & Dry Goods">Pantry & Dry Goods</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-stone-700 mb-1">Quantity</label>
              <input
                type="number"
                step="any"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                className="w-full px-3 py-2 border border-stone-200 rounded-lg focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 outline-none font-mono"
              />
              {errors.quantity && <p className="text-rose-600 mt-1">{errors.quantity}</p>}
            </div>

            <div>
              <label className="block font-semibold text-stone-700 mb-1">Unit of Measure</label>
              <select
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value as ProductUnit })}
                className="w-full px-3 py-2 border border-stone-200 rounded-lg focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 outline-none bg-white"
              >
                <option value="units">units</option>
                <option value="kg">kg</option>
                <option value="packs">packs</option>
                <option value="bunches">bunches</option>
                <option value="loaves">loaves</option>
                <option value="bottles">bottles</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-stone-700 mb-1">Cost Price ($)</label>
              <input
                type="number"
                step="0.01"
                value={formData.cost_price}
                onChange={(e) => setFormData({ ...formData, cost_price: e.target.value })}
                className="w-full px-3 py-2 border border-stone-200 rounded-lg focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 outline-none font-mono"
              />
              {errors.cost_price && <p className="text-rose-600 mt-1">{errors.cost_price}</p>}
            </div>

            <div>
              <label className="block font-semibold text-stone-700 mb-1">Regular Selling Price ($)</label>
              <input
                type="number"
                step="0.01"
                value={formData.selling_price}
                onChange={(e) => setFormData({ ...formData, selling_price: e.target.value })}
                className="w-full px-3 py-2 border border-stone-200 rounded-lg focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 outline-none font-mono"
              />
              {errors.selling_price && <p className="text-rose-600 mt-1">{errors.selling_price}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-stone-700 mb-1">Expiry Date</label>
              <input
                type="date"
                value={formData.expiry_date}
                onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })}
                className="w-full px-3 py-2 border border-stone-200 rounded-lg focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
              />
              {errors.expiry_date && <p className="text-rose-600 mt-1">{errors.expiry_date}</p>}
            </div>

            <div>
              <label className="block font-semibold text-stone-700 mb-1">Sales Velocity (units/day)</label>
              <input
                type="number"
                step="0.1"
                value={formData.sales_velocity}
                onChange={(e) => setFormData({ ...formData, sales_velocity: e.target.value })}
                className="w-full px-3 py-2 border border-stone-200 rounded-lg focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 outline-none font-mono"
              />
              {errors.sales_velocity && <p className="text-rose-600 mt-1">{errors.sales_velocity}</p>}
            </div>
          </div>

          <div className="pt-4 border-t border-stone-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-stone-200 hover:bg-stone-50 rounded-lg text-stone-700 font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold flex items-center gap-1.5 shadow-xs"
            >
              <Check className="w-3.5 h-3.5" />
              <span>{productToEdit ? 'Save Changes' : 'Catalog Item'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
