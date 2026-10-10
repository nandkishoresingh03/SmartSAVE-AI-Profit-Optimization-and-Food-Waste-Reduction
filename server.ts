import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import { z } from 'zod';
import {
  generateStoreAIInsights,
  explainPricingRecommendationWithAI,
} from './src/server/geminiService.ts';

dotenv.config();

const app = express();
app.use(express.json());

const PORT = Number(process.env.PORT) || 3000;

// Health endpoint
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    gemini_configured: Boolean(process.env.GEMINI_API_KEY),
    mode: 'SmartSave AI Engine v1.0',
  });
});

// Zod schemas for validation
const ProductSchema = z.object({
  name: z.string().min(2, 'Product name is required'),
  sku: z.string().min(2, 'SKU is required'),
  category: z.enum([
    'Produce',
    'Dairy & Eggs',
    'Bakery',
    'Meat & Seafood',
    'Deli & Prepared',
    'Pantry & Dry Goods',
  ]),
  quantity: z.number().nonnegative('Quantity cannot be negative'),
  unit: z.enum(['units', 'kg', 'packs', 'bunches', 'loaves', 'bottles']),
  cost_price: z.number().nonnegative('Cost price cannot be negative'),
  selling_price: z.number().positive('Selling price must be positive'),
  expiry_date: z.string().min(4, 'Expiry date is required'),
  shelf_life_days: z.number().int().positive().optional().default(7),
  sales_velocity: z.number().nonnegative().optional().default(1.0),
});

// AI Insights endpoint
const InsightsInputSchema = z.object({
  storeName: z.string().default('GreenOak Harvest Market'),
  totalProducts: z.number(),
  criticalItems: z.array(
    z.object({
      name: z.string(),
      category: z.string(),
      quantity: z.number(),
      hoursRemaining: z.number(),
      sellingPrice: z.number(),
      costPrice: z.number(),
    })
  ),
  totalWasteAvoidedKg: z.number(),
  co2AvoidedKg: z.number(),
  activeMarkdownsCount: z.number(),
});

app.post('/api/ai/insights', async (req: Request, res: Response) => {
  try {
    const parsed = InsightsInputSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Invalid input payload', details: parsed.error.format() });
    }

    const insights = await generateStoreAIInsights(parsed.data);
    return res.json(insights);
  } catch (err: unknown) {
    console.error('Error generating AI insights:', err);
    return res.status(500).json({ error: 'Failed to generate inventory insights' });
  }
});

// AI Pricing Explanation endpoint
const PricingExplainSchema = z.object({
  productName: z.string(),
  category: z.string(),
  daysRemaining: z.number(),
  quantity: z.number(),
  originalPrice: z.number(),
  costPrice: z.number(),
  recommendedPrice: z.number(),
  discountPct: z.number(),
});

app.post('/api/ai/pricing-explain', async (req: Request, res: Response) => {
  try {
    const parsed = PricingExplainSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Invalid payload', details: parsed.error.format() });
    }

    const result = await explainPricingRecommendationWithAI(
      parsed.data.productName,
      parsed.data.category,
      parsed.data.daysRemaining,
      parsed.data.quantity,
      parsed.data.originalPrice,
      parsed.data.costPrice,
      parsed.data.recommendedPrice,
      parsed.data.discountPct
    );
    return res.json(result);
  } catch (err) {
    console.error('Error in AI pricing explanation:', err);
    return res.status(500).json({ error: 'Failed to explain recommendation' });
  }
});

// Start server with Vite middleware in development
async function startServer() {
  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // In production, serve built dist files
    const path = await import('path');
    const staticDir = path.resolve(process.cwd(), 'dist');
    app.use(express.static(staticDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(staticDir, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`SmartSave AI full-stack server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
