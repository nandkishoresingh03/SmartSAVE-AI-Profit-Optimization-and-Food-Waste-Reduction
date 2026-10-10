export type ProductCategory = 
  | 'Produce'
  | 'Dairy & Eggs'
  | 'Bakery'
  | 'Meat & Seafood'
  | 'Deli & Prepared'
  | 'Pantry & Dry Goods';

export type ProductUnit = 'units' | 'kg' | 'packs' | 'bunches' | 'loaves' | 'bottles';

export type StockStatus = 'In Stock' | 'Low Stock' | 'Critical Expiry' | 'Expired';

export type ExpiryUrgency = 'Critical' | 'Urgent' | 'Upcoming' | 'Safe';

export interface Store {
  id: string;
  name: string;
  location: string;
  currency: string;
  currencySymbol: string;
  created_at: string;
}

export interface UserProfile {
  id: string;
  full_name: string;
  role: 'Store Manager' | 'Operations Lead' | 'Shift Supervisor' | 'Sustainability Officer';
  email: string;
  avatar_url?: string;
  created_at: string;
}

export interface Product {
  id: string;
  store_id: string;
  name: string;
  sku: string;
  category: ProductCategory;
  quantity: number;
  unit: ProductUnit;
  cost_price: number;
  selling_price: number;
  original_price: number;
  discount_percentage: number;
  expiry_date: string; // ISO date string (YYYY-MM-DD or YYYY-MM-DDTHH:mm:ss)
  shelf_life_days: number;
  sales_velocity: number; // units sold per day on average
  created_at: string;
  updated_at: string;
}

export interface PricingRecommendation {
  id: string;
  store_id: string;
  product_id: string;
  product_name: string;
  category: ProductCategory;
  current_price: number;
  cost_price: number;
  recommended_price: number;
  discount_percentage: number;
  estimated_sell_through: number; // 0 to 100 percentage
  estimated_revenue_recovered: number;
  expected_unsold_units: number;
  explanation: string;
  confidence: 'High' | 'Moderate' | 'Exploratory';
  ai_generated: boolean;
  status: 'pending' | 'accepted' | 'rejected' | 'modified';
  alternative_scenarios: {
    label: string;
    discount_pct: number;
    price: number;
    projected_sell_through: number;
    projected_revenue: number;
  }[];
  created_at: string;
  resolved_at?: string;
}

export interface SaleRecord {
  id: string;
  store_id: string;
  product_id: string;
  product_name: string;
  category: ProductCategory;
  quantity_sold: number;
  unit_price: number;
  discount_percentage: number;
  revenue: number;
  sold_at: string;
}

export interface WasteRecord {
  id: string;
  store_id: string;
  product_id: string;
  product_name: string;
  category: ProductCategory;
  quantity_wasted: number;
  unit: ProductUnit;
  estimated_cost: number;
  reason: 'Spoilage' | 'Passed Expiry' | 'Damaged Packaging' | 'Quality Standard Unmet';
  recorded_at: string;
}

export interface DonationRecord {
  id: string;
  store_id: string;
  product_id: string;
  product_name: string;
  quantity_donated: number;
  unit: ProductUnit;
  estimated_value: number;
  charity_partner: string;
  recorded_at: string;
}

export interface ActivityLog {
  id: string;
  store_id: string;
  user_name: string;
  user_role: string;
  action: 
    | 'PRODUCT_CREATED'
    | 'PRODUCT_UPDATED'
    | 'PRODUCT_DELETED'
    | 'PRICE_MARKDOWN_APPLIED'
    | 'STOCK_SOLD'
    | 'WASTE_RECORDED'
    | 'DONATION_RECORDED'
    | 'AI_RECOMMENDATION_ACCEPTED'
    | 'AI_RECOMMENDATION_REJECTED';
  entity_type: 'product' | 'recommendation' | 'waste' | 'donation';
  entity_id: string;
  description: string;
  created_at: string;
}

export interface ForecastItem {
  product_id: string;
  product_name: string;
  category: ProductCategory;
  current_stock: number;
  unit: ProductUnit;
  forecast_7d_sales: number;
  stockout_risk: 'High' | 'Medium' | 'Low' | 'Overstock Risk';
  suggested_reorder_units: number;
  days_to_stockout: number;
  confidence_pct: number;
  data_quality: 'Robust History' | 'Baseline Average' | 'New Item Estimate';
}

export interface OperationsKPIs {
  total_products: number;
  products_near_expiry: number;
  critical_products_count: number;
  total_inventory_value: number;
  estimated_waste_avoided_kg: number;
  estimated_waste_avoided_value: number;
  estimated_revenue_recovered: number;
  total_waste_recorded_kg: number;
  total_waste_cost: number;
  total_donations_kg: number;
  co2_emissions_avoided_kg: number;
  active_markdowns_count: number;
  pending_recommendations_count: number;
  waste_reduction_rate: number; // percentage
}
