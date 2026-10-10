import {
  calculateExpiryUrgency,
  computeDeterministicRecommendation,
} from './pricingEngine.ts';
import { Product } from '../types/index.ts';

export interface TestResult {
  name: string;
  passed: boolean;
  actual: unknown;
  expected: unknown;
  message?: string;
}

export function runPricingEngineTests(): TestResult[] {
  const results: TestResult[] = [];
  const baseNow = new Date('2026-10-10T12:00:00Z');

  // Test 1: Expiry classification for critical (<24h)
  {
    const criticalExpiry = new Date('2026-10-10T22:00:00Z').toISOString();
    const res = calculateExpiryUrgency(criticalExpiry, baseNow);
    results.push({
      name: 'Classifies < 24 hours as Critical',
      passed: res.urgency === 'Critical',
      actual: res.urgency,
      expected: 'Critical',
    });
  }

  // Test 2: Expiry classification for urgent (2 days)
  {
    const urgentExpiry = new Date('2026-10-12T12:00:00Z').toISOString();
    const res = calculateExpiryUrgency(urgentExpiry, baseNow);
    results.push({
      name: 'Classifies 2 days remaining as Urgent',
      passed: res.urgency === 'Urgent',
      actual: res.urgency,
      expected: 'Urgent',
    });
  }

  // Test 3: Expiry classification for upcoming (5 days)
  {
    const upcomingExpiry = new Date('2026-10-15T12:00:00Z').toISOString();
    const res = calculateExpiryUrgency(upcomingExpiry, baseNow);
    results.push({
      name: 'Classifies 5 days remaining as Upcoming',
      passed: res.urgency === 'Upcoming',
      actual: res.urgency,
      expected: 'Upcoming',
    });
  }

  // Test 4: Cost Floor Protection - Price cannot drop below cost + margin floor
  {
    const highCostProduct: Product = {
      id: 'test-1',
      store_id: 'store-1',
      name: 'Artisan Brie Cheese',
      sku: 'BRIE-001',
      category: 'Dairy & Eggs',
      quantity: 15,
      unit: 'units',
      cost_price: 8.0, // High cost
      selling_price: 10.0,
      original_price: 10.0,
      discount_percentage: 0,
      expiry_date: new Date(Date.now() + 12 * 3600 * 1000).toISOString(), // Critical < 24h
      shelf_life_days: 14,
      sales_velocity: 2,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // With 5% margin floor: floor is 8.0 * 1.05 = 8.40
    // Standard critical discount would be 50% ($5.00), which breaches $8.40 floor
    const rec = computeDeterministicRecommendation(highCostProduct, {
      allowBelowCost: false,
      minMarginFloorPct: 5,
    });

    results.push({
      name: 'Strictly preserves cost floor (Price >= Cost * 1.05)',
      passed: rec.recommended_price >= 8.40,
      actual: rec.recommended_price,
      expected: '>= 8.40',
      message: `Recommended price is $${rec.recommended_price}, safely above $8.40 floor`,
    });
  }

  // Test 5: Allow below cost override
  {
    const perishableProduct: Product = {
      id: 'test-2',
      store_id: 'store-1',
      name: 'Fresh Atlantic Salmon',
      sku: 'SALM-002',
      category: 'Meat & Seafood',
      quantity: 10,
      unit: 'kg',
      cost_price: 14.0,
      selling_price: 22.0,
      original_price: 22.0,
      discount_percentage: 0,
      expiry_date: new Date(Date.now() + 8 * 3600 * 1000).toISOString(), // 8 hours left
      shelf_life_days: 5,
      sales_velocity: 3,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const rec = computeDeterministicRecommendation(perishableProduct, {
      allowBelowCost: true,
      maxDiscountPct: 60,
    });

    results.push({
      name: 'Permits clearance markdown when allowBelowCost is true',
      passed: rec.discount_percentage >= 50,
      actual: `${rec.discount_percentage}% discount`,
      expected: '>= 50% discount',
    });
  }

  // Test 6: Safe products do not get unneeded markdowns
  {
    const safeProduct: Product = {
      id: 'test-3',
      store_id: 'store-1',
      name: 'Organic Basmati Rice',
      sku: 'RICE-003',
      category: 'Pantry & Dry Goods',
      quantity: 50,
      unit: 'packs',
      cost_price: 3.5,
      selling_price: 6.99,
      original_price: 6.99,
      discount_percentage: 0,
      expiry_date: new Date(Date.now() + 60 * 24 * 3600 * 1000).toISOString(), // 60 days
      shelf_life_days: 365,
      sales_velocity: 4,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const rec = computeDeterministicRecommendation(safeProduct);

    results.push({
      name: 'Leaves safe inventory at 0% discount',
      passed: rec.discount_percentage === 0 && rec.recommended_price === 6.99,
      actual: rec.discount_percentage,
      expected: 0,
    });
  }

  return results;
}
