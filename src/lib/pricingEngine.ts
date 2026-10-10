import { Product, PricingRecommendation } from '../types/index.ts';

export interface PricingEngineOptions {
  allowBelowCost?: boolean;
  minMarginFloorPct?: number; // e.g., 5% minimum margin above cost
  maxDiscountPct?: number; // e.g. 75% max markdown
  targetSellThroughPct?: number; // target 80%
}

export interface ExpiryCalculation {
  daysRemaining: number;
  hoursRemaining: number;
  urgency: 'Critical' | 'Urgent' | 'Upcoming' | 'Safe';
}

/**
 * Calculates days and hours remaining until expiry date.
 */
export function calculateExpiryUrgency(
  expiryDateStr: string,
  now: Date = new Date()
): ExpiryCalculation {
  const expiry = new Date(expiryDateStr);
  const diffMs = expiry.getTime() - now.getTime();
  const diffHours = diffMs / (1000 * 60 * 60);
  const diffDays = Math.floor(diffHours / 24);

  let urgency: 'Critical' | 'Urgent' | 'Upcoming' | 'Safe';
  if (diffHours <= 24) {
    urgency = 'Critical';
  } else if (diffDays <= 3) {
    urgency = 'Urgent';
  } else if (diffDays <= 7) {
    urgency = 'Upcoming';
  } else {
    urgency = 'Safe';
  }

  return {
    daysRemaining: diffDays,
    hoursRemaining: Math.max(0, Math.round(diffHours)),
    urgency,
  };
}

/**
 * Category-based elasticity and perishability multiplier.
 * Produce and Bakery decay quickly and respond strongly to 30-50% discounts.
 * Pantry goods have low urgency.
 */
const CATEGORY_PROFILE: Record<
  string,
  { decayRate: number; priceElasticity: number; baseExpectedSellThrough: number }
> = {
  Produce: { decayRate: 1.4, priceElasticity: 1.8, baseExpectedSellThrough: 70 },
  'Dairy & Eggs': { decayRate: 1.2, priceElasticity: 1.5, baseExpectedSellThrough: 75 },
  Bakery: { decayRate: 1.5, priceElasticity: 2.0, baseExpectedSellThrough: 65 },
  'Meat & Seafood': { decayRate: 1.3, priceElasticity: 1.6, baseExpectedSellThrough: 80 },
  'Deli & Prepared': { decayRate: 1.4, priceElasticity: 1.7, baseExpectedSellThrough: 72 },
  'Pantry & Dry Goods': { decayRate: 0.6, priceElasticity: 1.1, baseExpectedSellThrough: 85 },
};

/**
 * Deterministic pricing computation for grocery markdown.
 * Enforces safety margin floors and deterministic arithmetic.
 */
export function computeDeterministicRecommendation(
  product: Product,
  options: PricingEngineOptions = {}
): PricingRecommendation {
  const {
    allowBelowCost = false,
    minMarginFloorPct = 5,
    maxDiscountPct = 75,
  } = options;

  const { daysRemaining, urgency } = calculateExpiryUrgency(product.expiry_date);
  const profile = CATEGORY_PROFILE[product.category] || {
    decayRate: 1.0,
    priceElasticity: 1.5,
    baseExpectedSellThrough: 75,
  };

  // Base raw discount tier based purely on time until expiry
  let baseDiscountPct = 0;
  if (urgency === 'Critical') {
    // Under 24h
    baseDiscountPct = 50;
  } else if (urgency === 'Urgent') {
    // 1-3 days
    baseDiscountPct = 30;
  } else if (urgency === 'Upcoming') {
    // 4-7 days
    baseDiscountPct = 15;
  } else {
    baseDiscountPct = 0;
  }

  // Stock pressure adjustment:
  // If current stock exceeds projected sales during remaining days, increase discount
  const projectedNormalSales = Math.max(1, (product.sales_velocity || 1) * Math.max(1, daysRemaining));
  const stockSurplusRatio = product.quantity / projectedNormalSales;

  if (stockSurplusRatio > 2.0 && baseDiscountPct > 0) {
    baseDiscountPct += 15; // Heavy surplus
  } else if (stockSurplusRatio > 1.2 && baseDiscountPct > 0) {
    baseDiscountPct += 5; // Moderate surplus
  }

  // Cap at configured max markdown
  baseDiscountPct = Math.min(baseDiscountPct, maxDiscountPct);

  // Safety floor enforcement:
  // Calculate the lowest permissible price honoring cost price & min margin floor
  const costFloorPrice = product.cost_price > 0 
    ? product.cost_price * (1 + minMarginFloorPct / 100)
    : product.original_price * 0.3; // Fallback if cost not specified

  let recommendedPrice = Number((product.original_price * (1 - baseDiscountPct / 100)).toFixed(2));

  // If price would breach cost floor and below-cost is not authorized
  let marginConstrained = false;
  if (!allowBelowCost && recommendedPrice < costFloorPrice) {
    recommendedPrice = Number(costFloorPrice.toFixed(2));
    marginConstrained = true;
    baseDiscountPct = Math.max(
      0,
      Math.round(((product.original_price - recommendedPrice) / product.original_price) * 100)
    );
  }

  // Ensure recommended price does not exceed current selling price
  if (recommendedPrice > product.selling_price) {
    recommendedPrice = product.selling_price;
    baseDiscountPct = Math.round(((product.original_price - recommendedPrice) / product.original_price) * 100);
  }

  // Expected sell-through estimation:
  // Baseline + (discount % * elasticity) capped between 20% and 98%
  let estimatedSellThrough = Math.round(
    profile.baseExpectedSellThrough + (baseDiscountPct * (profile.priceElasticity - 1.0))
  );
  if (urgency === 'Critical') {
    // Urgency discount increases quick clearance
    estimatedSellThrough = Math.min(95, Math.max(50, estimatedSellThrough));
  } else {
    estimatedSellThrough = Math.min(98, Math.max(30, estimatedSellThrough));
  }

  const expectedSoldUnits = Math.round(product.quantity * (estimatedSellThrough / 100));
  const expectedUnsoldUnits = Math.max(0, product.quantity - expectedSoldUnits);
  const estimatedRevenueRecovered = Number((expectedSoldUnits * recommendedPrice).toFixed(2));

  // Deterministic reason generation
  let explanation = '';
  if (baseDiscountPct === 0) {
    explanation = `Product has ${daysRemaining} days remaining with healthy stock velocity (${product.sales_velocity} units/day). Standard pricing maintained.`;
  } else if (marginConstrained) {
    explanation = `Applied conservative ${baseDiscountPct}% markdown to reach $${recommendedPrice.toFixed(2)}. Price is bounded by the ${minMarginFloorPct}% cost-margin floor ($${product.cost_price.toFixed(2)} cost) to prevent negative gross margin.`;
  } else if (urgency === 'Critical') {
    explanation = `Critical expiry window (<24h). Deep ${baseDiscountPct}% clearance markdown recommended to salvage $${estimatedRevenueRecovered.toFixed(2)} across ${product.quantity} ${product.unit} before total loss.`;
  } else {
    explanation = `${urgency} window (${daysRemaining}d left). ${baseDiscountPct}% markdown balances accelerated sell-through (est. ${estimatedSellThrough}%) against margin preservation.`;
  }

  // Alternative discount scenarios (conservative, balanced, aggressive)
  const scenarios = [
    {
      label: 'Conservative (-10%)',
      discount_pct: Math.max(5, baseDiscountPct - 15),
    },
    {
      label: 'Balanced (Recommended)',
      discount_pct: baseDiscountPct,
    },
    {
      label: 'Rapid Clearance (+15%)',
      discount_pct: Math.min(maxDiscountPct, baseDiscountPct + 15),
    },
  ].map((sc) => {
    let price = Number((product.original_price * (1 - sc.discount_pct / 100)).toFixed(2));
    if (!allowBelowCost && price < costFloorPrice) {
      price = Number(costFloorPrice.toFixed(2));
    }
    const sellThrough = Math.min(
      98,
      Math.max(30, Math.round(profile.baseExpectedSellThrough + sc.discount_pct * (profile.priceElasticity - 1.0)))
    );
    const rev = Number((product.quantity * (sellThrough / 100) * price).toFixed(2));
    return {
      label: sc.label,
      discount_pct: sc.discount_pct,
      price,
      projected_sell_through: sellThrough,
      projected_revenue: rev,
    };
  });

  return {
    id: `rec-${product.id}-${Date.now()}`,
    store_id: product.store_id,
    product_id: product.id,
    product_name: product.name,
    category: product.category,
    current_price: product.selling_price,
    cost_price: product.cost_price,
    recommended_price: recommendedPrice,
    discount_percentage: baseDiscountPct,
    estimated_sell_through: estimatedSellThrough,
    estimated_revenue_recovered: estimatedRevenueRecovered,
    expected_unsold_units: expectedUnsoldUnits,
    explanation,
    confidence: product.sales_velocity > 0 ? 'High' : 'Moderate',
    ai_generated: false,
    status: 'pending',
    alternative_scenarios: scenarios,
    created_at: new Date().toISOString(),
  };
}
