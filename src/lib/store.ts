import {
  Product,
  Store,
  UserProfile,
  PricingRecommendation,
  SaleRecord,
  WasteRecord,
  DonationRecord,
  ActivityLog,
  OperationsKPIs,
} from '../types/index.ts';
import {
  calculateExpiryUrgency,
  computeDeterministicRecommendation,
} from './pricingEngine.ts';

const DEMO_STORE: Store = {
  id: 'store-001',
  name: 'GreenOak Harvest Market',
  location: 'Downtown Flagship, Seattle WA',
  currency: 'USD',
  currencySymbol: '$',
  created_at: new Date(Date.now() - 90 * 86400000).toISOString(),
};

const DEMO_PROFILE: UserProfile = {
  id: 'user-001',
  full_name: 'Elena Vance',
  role: 'Operations Lead',
  email: 'elena.vance@greenoakmarket.com',
  avatar_url: '/src/assets/images/manager_avatar_1791612179185.jpg',
  created_at: new Date(Date.now() - 90 * 86400000).toISOString(),
};

// Generate realistic dynamic dates relative to current execution time
function getRelativeISODate(daysOffset: number, hoursOffset: number = 0): string {
  const d = new Date();
  d.setDate(d.getDate() + daysOffset);
  d.setHours(d.getHours() + hoursOffset);
  return d.toISOString();
}

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'prod-001',
    store_id: 'store-001',
    name: 'Artisan Sourdough Boule',
    sku: 'BAK-SOU-001',
    category: 'Bakery',
    quantity: 18,
    unit: 'loaves',
    cost_price: 2.10,
    selling_price: 6.50,
    original_price: 6.50,
    discount_percentage: 0,
    expiry_date: getRelativeISODate(0, 14), // ~14 hours (Critical)
    shelf_life_days: 2,
    sales_velocity: 8,
    created_at: getRelativeISODate(-2),
    updated_at: getRelativeISODate(0),
  },
  {
    id: 'prod-002',
    store_id: 'store-001',
    name: 'Organic Whole Milk (Half Gallon)',
    sku: 'DAI-MLK-002',
    category: 'Dairy & Eggs',
    quantity: 24,
    unit: 'bottles',
    cost_price: 2.40,
    selling_price: 4.89,
    original_price: 4.89,
    discount_percentage: 0,
    expiry_date: getRelativeISODate(1, 4), // ~28 hours (Urgent)
    shelf_life_days: 10,
    sales_velocity: 12,
    created_at: getRelativeISODate(-8),
    updated_at: getRelativeISODate(0),
  },
  {
    id: 'prod-003',
    store_id: 'store-001',
    name: 'Heirloom Vine Tomatoes',
    sku: 'PRD-TOM-003',
    category: 'Produce',
    quantity: 32,
    unit: 'kg',
    cost_price: 1.80,
    selling_price: 4.99,
    original_price: 4.99,
    discount_percentage: 0,
    expiry_date: getRelativeISODate(0, 20), // ~20 hours (Critical)
    shelf_life_days: 5,
    sales_velocity: 10,
    created_at: getRelativeISODate(-4),
    updated_at: getRelativeISODate(0),
  },
  {
    id: 'prod-004',
    store_id: 'store-001',
    name: 'Fresh Wild Atlantic Salmon Fillet',
    sku: 'SEA-SAL-004',
    category: 'Meat & Seafood',
    quantity: 14,
    unit: 'kg',
    cost_price: 13.50,
    selling_price: 24.99,
    original_price: 24.99,
    discount_percentage: 0,
    expiry_date: getRelativeISODate(1, 12), // ~36 hours (Urgent)
    shelf_life_days: 4,
    sales_velocity: 6,
    created_at: getRelativeISODate(-2),
    updated_at: getRelativeISODate(0),
  },
  {
    id: 'prod-005',
    store_id: 'store-001',
    name: 'Organic Baby Spinach (16oz)',
    sku: 'PRD-SPN-005',
    category: 'Produce',
    quantity: 40,
    unit: 'packs',
    cost_price: 1.60,
    selling_price: 3.99,
    original_price: 3.99,
    discount_percentage: 0,
    expiry_date: getRelativeISODate(2, 6), // ~54 hours (Urgent)
    shelf_life_days: 7,
    sales_velocity: 14,
    created_at: getRelativeISODate(-5),
    updated_at: getRelativeISODate(0),
  },
  {
    id: 'prod-006',
    store_id: 'store-001',
    name: 'Aged Farmhouse Cheddar (8oz)',
    sku: 'DAI-CHD-006',
    category: 'Dairy & Eggs',
    quantity: 26,
    unit: 'units',
    cost_price: 3.80,
    selling_price: 7.49,
    original_price: 7.49,
    discount_percentage: 0,
    expiry_date: getRelativeISODate(5, 0), // 5 days (Upcoming)
    shelf_life_days: 30,
    sales_velocity: 5,
    created_at: getRelativeISODate(-20),
    updated_at: getRelativeISODate(0),
  },
  {
    id: 'prod-007',
    store_id: 'store-001',
    name: 'Greek Strained Yogurt Plain (32oz)',
    sku: 'DAI-YOG-007',
    category: 'Dairy & Eggs',
    quantity: 22,
    unit: 'units',
    cost_price: 2.90,
    selling_price: 5.99,
    original_price: 5.99,
    discount_percentage: 0,
    expiry_date: getRelativeISODate(3, 10), // ~3.4 days (Upcoming)
    shelf_life_days: 18,
    sales_velocity: 7,
    created_at: getRelativeISODate(-14),
    updated_at: getRelativeISODate(0),
  },
  {
    id: 'prod-008',
    store_id: 'store-001',
    name: 'Organic Hass Avocados (4-Pack)',
    sku: 'PRD-AVO-008',
    category: 'Produce',
    quantity: 35,
    unit: 'packs',
    cost_price: 2.70,
    selling_price: 5.49,
    original_price: 5.49,
    discount_percentage: 0,
    expiry_date: getRelativeISODate(6, 0), // 6 days (Upcoming)
    shelf_life_days: 8,
    sales_velocity: 8,
    created_at: getRelativeISODate(-2),
    updated_at: getRelativeISODate(0),
  },
  {
    id: 'prod-009',
    store_id: 'store-001',
    name: 'Roasted Turkey Breast Deli Cut',
    sku: 'DEL-TUR-009',
    category: 'Deli & Prepared',
    quantity: 16,
    unit: 'kg',
    cost_price: 6.20,
    selling_price: 13.99,
    original_price: 13.99,
    discount_percentage: 0,
    expiry_date: getRelativeISODate(2, 2), // ~2 days (Urgent)
    shelf_life_days: 5,
    sales_velocity: 4,
    created_at: getRelativeISODate(-3),
    updated_at: getRelativeISODate(0),
  },
  {
    id: 'prod-010',
    store_id: 'store-001',
    name: 'Cold-Pressed Valencia Orange Juice',
    sku: 'PRD-OJ-010',
    category: 'Produce',
    quantity: 28,
    unit: 'bottles',
    cost_price: 3.10,
    selling_price: 6.29,
    original_price: 6.29,
    discount_percentage: 0,
    expiry_date: getRelativeISODate(4, 8), // 4 days (Upcoming)
    shelf_life_days: 12,
    sales_velocity: 6,
    created_at: getRelativeISODate(-7),
    updated_at: getRelativeISODate(0),
  },
  {
    id: 'prod-011',
    store_id: 'store-001',
    name: 'Organic Rolled Oats (32oz)',
    sku: 'PAN-OAT-011',
    category: 'Pantry & Dry Goods',
    quantity: 65,
    unit: 'packs',
    cost_price: 2.20,
    selling_price: 4.99,
    original_price: 4.99,
    discount_percentage: 0,
    expiry_date: getRelativeISODate(180), // 180 days (Safe)
    shelf_life_days: 365,
    sales_velocity: 5,
    created_at: getRelativeISODate(-40),
    updated_at: getRelativeISODate(0),
  },
  {
    id: 'prod-012',
    store_id: 'store-001',
    name: 'Extra Virgin Olive Oil (750ml)',
    sku: 'PAN-OIL-012',
    category: 'Pantry & Dry Goods',
    quantity: 42,
    unit: 'bottles',
    cost_price: 9.50,
    selling_price: 17.99,
    original_price: 17.99,
    discount_percentage: 0,
    expiry_date: getRelativeISODate(240), // Safe
    shelf_life_days: 500,
    sales_velocity: 3,
    created_at: getRelativeISODate(-30),
    updated_at: getRelativeISODate(0),
  },
];

export const INITIAL_SALES: SaleRecord[] = [
  {
    id: 'sale-001',
    store_id: 'store-001',
    product_id: 'prod-001',
    product_name: 'Artisan Sourdough Boule',
    category: 'Bakery',
    quantity_sold: 12,
    unit_price: 4.55,
    discount_percentage: 30,
    revenue: 54.60,
    sold_at: getRelativeISODate(-1, -4),
  },
  {
    id: 'sale-002',
    store_id: 'store-001',
    product_id: 'prod-003',
    product_name: 'Heirloom Vine Tomatoes',
    category: 'Produce',
    quantity_sold: 18,
    unit_price: 3.49,
    discount_percentage: 30,
    revenue: 62.82,
    sold_at: getRelativeISODate(-1, -8),
  },
  {
    id: 'sale-003',
    store_id: 'store-001',
    product_id: 'prod-004',
    product_name: 'Fresh Wild Atlantic Salmon Fillet',
    category: 'Meat & Seafood',
    quantity_sold: 8,
    unit_price: 18.74,
    discount_percentage: 25,
    revenue: 149.92,
    sold_at: getRelativeISODate(-2, -2),
  },
  {
    id: 'sale-004',
    store_id: 'store-001',
    product_id: 'prod-002',
    product_name: 'Organic Whole Milk',
    category: 'Dairy & Eggs',
    quantity_sold: 20,
    unit_price: 3.91,
    discount_percentage: 20,
    revenue: 78.20,
    sold_at: getRelativeISODate(-3, -5),
  },
  {
    id: 'sale-005',
    store_id: 'store-001',
    product_id: 'prod-005',
    product_name: 'Organic Baby Spinach',
    category: 'Produce',
    quantity_sold: 25,
    unit_price: 2.79,
    discount_percentage: 30,
    revenue: 69.75,
    sold_at: getRelativeISODate(-4, -1),
  },
];

export const INITIAL_WASTE: WasteRecord[] = [
  {
    id: 'wst-001',
    store_id: 'store-001',
    product_id: 'prod-001',
    product_name: 'Artisan Sourdough Boule',
    category: 'Bakery',
    quantity_wasted: 4,
    unit: 'loaves',
    estimated_cost: 8.40,
    reason: 'Passed Expiry',
    recorded_at: getRelativeISODate(-3, -2),
  },
  {
    id: 'wst-002',
    store_id: 'store-001',
    product_id: 'prod-005',
    product_name: 'Organic Baby Spinach',
    category: 'Produce',
    quantity_wasted: 6,
    unit: 'packs',
    estimated_cost: 9.60,
    reason: 'Spoilage',
    recorded_at: getRelativeISODate(-5, -6),
  },
];

export const INITIAL_DONATIONS: DonationRecord[] = [
  {
    id: 'don-001',
    store_id: 'store-001',
    product_id: 'prod-001',
    product_name: 'Artisan Sourdough Boule',
    quantity_donated: 10,
    unit: 'loaves',
    estimated_value: 65.00,
    charity_partner: 'Northwest Harvest Food Bank',
    recorded_at: getRelativeISODate(-2, -3),
  },
  {
    id: 'don-002',
    store_id: 'store-001',
    product_id: 'prod-007',
    product_name: 'Greek Strained Yogurt',
    quantity_donated: 8,
    unit: 'units',
    estimated_value: 47.92,
    charity_partner: 'Downtown Community Meals Program',
    recorded_at: getRelativeISODate(-4, -1),
  },
];

export const INITIAL_ACTIVITY_LOGS: ActivityLog[] = [
  {
    id: 'act-001',
    store_id: 'store-001',
    user_name: 'Elena Vance',
    user_role: 'Operations Lead',
    action: 'AI_RECOMMENDATION_ACCEPTED',
    entity_type: 'recommendation',
    entity_id: 'prod-001',
    description: 'Accepted recommended 30% markdown on Artisan Sourdough Boule ($6.50 -> $4.55)',
    created_at: getRelativeISODate(-1, -5),
  },
  {
    id: 'act-002',
    store_id: 'store-001',
    user_name: 'Elena Vance',
    user_role: 'Operations Lead',
    action: 'DONATION_RECORDED',
    entity_type: 'donation',
    entity_id: 'don-001',
    description: 'Transferred 10 loaves Sourdough to Northwest Harvest Food Bank before expiry',
    created_at: getRelativeISODate(-2, -3),
  },
  {
    id: 'act-003',
    store_id: 'store-001',
    user_name: 'Marcus Chen',
    user_role: 'Shift Supervisor',
    action: 'PRICE_MARKDOWN_APPLIED',
    entity_type: 'product',
    entity_id: 'prod-004',
    description: 'Applied 25% proactive markdown on Wild Salmon Fillet ($24.99 -> $18.74)',
    created_at: getRelativeISODate(-2, -8),
  },
  {
    id: 'act-004',
    store_id: 'store-001',
    user_name: 'Elena Vance',
    user_role: 'Operations Lead',
    action: 'PRODUCT_CREATED',
    entity_type: 'product',
    entity_id: 'prod-008',
    description: 'Cataloged new batch: 35 packs Organic Hass Avocados (SKU: PRD-AVO-008)',
    created_at: getRelativeISODate(-2, -12),
  },
];

const STORAGE_KEY = 'smartsave_ai_state_v1';

export interface AppState {
  store: Store;
  profile: UserProfile;
  products: Product[];
  sales: SaleRecord[];
  wasteRecords: WasteRecord[];
  donations: DonationRecord[];
  activityLogs: ActivityLog[];
  recommendations: PricingRecommendation[];
  isDemoMode: boolean;
  supabaseConfigured: boolean;
  pricingOptions: {
    allowBelowCost: boolean;
    minMarginFloorPct: number;
    maxDiscountPct: number;
  };
}

/**
 * Load persisted state or hydrate with realistic demo defaults
 */
export function loadInitialState(): AppState {
  if (typeof window === 'undefined') {
    return createDefaultState();
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.products) && parsed.products.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn('Error reading stored state, using default demo state:', err);
  }

  const defaultState = createDefaultState();
  saveStateToStorage(defaultState);
  return defaultState;
}

function createDefaultState(): AppState {
  const products = [...INITIAL_PRODUCTS];
  const recs = products
    .filter((p) => {
      const { urgency } = calculateExpiryUrgency(p.expiry_date);
      return urgency === 'Critical' || urgency === 'Urgent' || urgency === 'Upcoming';
    })
    .map((p) => computeDeterministicRecommendation(p));

  return {
    store: DEMO_STORE,
    profile: DEMO_PROFILE,
    products,
    sales: [...INITIAL_SALES],
    wasteRecords: [...INITIAL_WASTE],
    donations: [...INITIAL_DONATIONS],
    activityLogs: [...INITIAL_ACTIVITY_LOGS],
    recommendations: recs,
    isDemoMode: true,
    supabaseConfigured: false,
    pricingOptions: {
      allowBelowCost: false,
      minMarginFloorPct: 5,
      maxDiscountPct: 70,
    },
  };
}

export function saveStateToStorage(state: AppState): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (err) {
    console.error('Failed to save state to localStorage:', err);
  }
}

/**
 * Recalculate operational KPIs and sustainability impact metrics
 */
export function calculateOperationsKPIs(state: AppState): OperationsKPIs {
  const { products, sales, wasteRecords, donations } = state;

  let productsNearExpiry = 0;
  let criticalCount = 0;
  let totalInventoryVal = 0;
  let activeMarkdowns = 0;

  for (const p of products) {
    totalInventoryVal += p.quantity * p.selling_price;
    if (p.discount_percentage > 0) activeMarkdowns++;
    const { urgency } = calculateExpiryUrgency(p.expiry_date);
    if (urgency === 'Critical') {
      criticalCount++;
      productsNearExpiry++;
    } else if (urgency === 'Urgent') {
      productsNearExpiry++;
    }
  }

  // Calculated revenue recovered from discount sales vs full loss
  const totalRevenueRecovered = sales.reduce((acc, s) => acc + s.revenue, 0);

  // Waste avoided kg (estimated from sales before expiry + donations)
  const salesUnitsSaved = sales.reduce((acc, s) => acc + s.quantity_sold, 0);
  const donationUnits = donations.reduce((acc, d) => acc + d.quantity_donated, 0);
  // Average unit to kg conversion factor (~0.85 kg per grocery item)
  const estimatedWasteAvoidedKg = Number(((salesUnitsSaved + donationUnits) * 0.85).toFixed(1));
  const estimatedWasteAvoidedValue = Number(totalRevenueRecovered.toFixed(2));

  // Actual waste recorded
  const totalWasteKg = Number(
    wasteRecords.reduce((acc, w) => acc + w.quantity_wasted, 0).toFixed(1)
  );
  const totalWasteCost = Number(
    wasteRecords.reduce((acc, w) => acc + w.estimated_cost, 0).toFixed(2)
  );

  // Donations kg
  const totalDonationsKg = Number((donationUnits * 0.9).toFixed(1));

  // CO2 emissions avoided: EPA standard is approx 2.5 kg CO2e per 1 kg food waste diverted
  const co2AvoidedKg = Number((estimatedWasteAvoidedKg * 2.5).toFixed(1));

  // Waste reduction rate
  const totalPotentialWaste = estimatedWasteAvoidedKg + totalWasteKg;
  const wasteReductionRate = totalPotentialWaste > 0
    ? Math.round((estimatedWasteAvoidedKg / totalPotentialWaste) * 100)
    : 88;

  const pendingRecs = state.recommendations.filter((r) => r.status === 'pending').length;

  return {
    total_products: products.length,
    products_near_expiry: productsNearExpiry,
    critical_products_count: criticalCount,
    total_inventory_value: Number(totalInventoryVal.toFixed(2)),
    estimated_waste_avoided_kg: estimatedWasteAvoidedKg,
    estimated_waste_avoided_value: estimatedWasteAvoidedValue,
    estimated_revenue_recovered: Number(totalRevenueRecovered.toFixed(2)),
    total_waste_recorded_kg: totalWasteKg,
    total_waste_cost: totalWasteCost,
    total_donations_kg: totalDonationsKg,
    co2_emissions_avoided_kg: co2AvoidedKg,
    active_markdowns_count: activeMarkdowns,
    pending_recommendations_count: pendingRecs,
    waste_reduction_rate: wasteReductionRate,
  };
}
