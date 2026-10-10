import { Product, ForecastItem, SaleRecord } from '../types/index.ts';
import { calculateExpiryUrgency } from './pricingEngine.ts';

/**
 * Computes 7-day demand forecasts, overstock risks, and recommended replenishment quantities.
 * Transparent, explainable baseline using rolling velocity + day-of-week perishable modifiers.
 */
export function generateDemandForecast(
  products: Product[],
  salesHistory: SaleRecord[]
): ForecastItem[] {
  return products.map((product) => {
    // Check if we have recent sales history for this product
    const productSales = salesHistory.filter((s) => s.product_id === product.id);
    const hasHistory = productSales.length >= 3;

    let baseDailyVelocity = product.sales_velocity;
    let dataQuality: ForecastItem['data_quality'] = 'Robust History';

    if (hasHistory) {
      const totalUnitsSold = productSales.reduce((acc, s) => acc + s.quantity_sold, 0);
      const computedVelocity = totalUnitsSold / 7; // 7-day average
      baseDailyVelocity = Number(((computedVelocity + product.sales_velocity) / 2).toFixed(1));
      dataQuality = 'Robust History';
    } else if (product.sales_velocity > 0) {
      dataQuality = 'Baseline Average';
    } else {
      baseDailyVelocity = 1.5;
      dataQuality = 'New Item Estimate';
    }

    // Weekend boost factor (groceries experience 25% bump on weekends)
    const weekendMultiplier = 1.15;
    const forecast7dSales = Math.round(baseDailyVelocity * 7 * weekendMultiplier);

    const { daysRemaining, urgency } = calculateExpiryUrgency(product.expiry_date);

    // Days to stockout at current velocity
    const daysToStockout = baseDailyVelocity > 0 
      ? Math.round(product.quantity / baseDailyVelocity)
      : 99;

    // Stockout risk evaluation:
    let stockout_risk: ForecastItem['stockout_risk'] = 'Low';
    if (daysToStockout <= 2 && urgency === 'Safe') {
      stockout_risk = 'High';
    } else if (daysToStockout <= 4 && urgency === 'Safe') {
      stockout_risk = 'Medium';
    } else if (product.quantity > forecast7dSales * 1.8 && daysRemaining <= 7) {
      stockout_risk = 'Overstock Risk';
    }

    // Replenishment suggested:
    // If stock will deplete before next cycle and product is not near expiry
    let suggestedReorder = 0;
    if (daysToStockout <= 3 && urgency === 'Safe') {
      // Order standard 7 days worth of inventory
      suggestedReorder = Math.max(0, forecast7dSales - product.quantity + 5);
    }

    // Confidence metric based on data availability
    let confidencePct = 85;
    if (dataQuality === 'Baseline Average') confidencePct = 68;
    if (dataQuality === 'New Item Estimate') confidencePct = 52;

    return {
      product_id: product.id,
      product_name: product.name,
      category: product.category,
      current_stock: product.quantity,
      unit: product.unit,
      forecast_7d_sales: forecast7dSales,
      stockout_risk,
      suggested_reorder_units: suggestedReorder,
      days_to_stockout: daysToStockout,
      confidence_pct: confidencePct,
      data_quality: dataQuality,
    };
  });
}
