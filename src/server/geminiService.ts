import { GoogleGenAI } from '@google/genai';

// Initialize Gemini client strictly on server-side
const apiKey = process.env.GEMINI_API_KEY;

let ai: GoogleGenAI | null = null;
if (apiKey) {
  ai = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

export interface InventoryOverviewPayload {
  storeName: string;
  totalProducts: number;
  criticalItems: Array<{
    name: string;
    category: string;
    quantity: number;
    hoursRemaining: number;
    sellingPrice: number;
    costPrice: number;
  }>;
  totalWasteAvoidedKg: number;
  co2AvoidedKg: number;
  activeMarkdownsCount: number;
}

export async function generateStoreAIInsights(payload: InventoryOverviewPayload) {
  if (!ai || !apiKey) {
    // Graceful, transparent rule-based deterministic fallback
    return {
      ai_powered: false,
      model: 'Rule-Based Deterministic Engine (No Gemini API Key Configured)',
      executive_summary: `Store operations report for ${payload.storeName}. Currently tracking ${payload.criticalItems.length} products in critical expiry windows (<24h). Proactive markdowns have successfully diverted ${payload.totalWasteAvoidedKg} kg from landfills, mitigating ${payload.co2AvoidedKg} kg of CO2e emissions.`,
      urgent_recommendations: payload.criticalItems.slice(0, 3).map((item) => ({
        product_name: item.name,
        category: item.category,
        action: item.hoursRemaining < 12 ? 'Immediate 40-50% Markdown' : 'Flash 25-35% Clearance',
        rationale: `Only ${item.hoursRemaining}h remaining before write-off. Accelerating sell-through prevents $${(item.quantity * item.costPrice).toFixed(2)} write-down.`,
        priority: 'High' as const,
      })),
      sustainability_score: Math.min(95, Math.max(70, Math.round(payload.totalWasteAvoidedKg * 2.2))),
      strategic_tip: 'Coordinate end-of-day bakery and fresh prepared redistribution batches with local food relief partners by 4:00 PM.',
    };
  }

  try {
    const prompt = `You are the lead grocery waste intelligence specialist for SmartSave AI. Analyze the following store inventory data and provide concise, high-value strategic recommendations to minimize food waste and optimize salvage revenue.

Store Data:
- Store: ${payload.storeName}
- Total Inventory Items: ${payload.totalProducts}
- Critical Products (<24h to expiry): ${JSON.stringify(payload.criticalItems)}
- Total Waste Avoided to date: ${payload.totalWasteAvoidedKg} kg
- Estimated CO2 Avoided: ${payload.co2AvoidedKg} kg
- Active Markdowns: ${payload.activeMarkdownsCount}

Return a valid JSON object matching this schema:
{
  "executive_summary": "1-2 sentence executive summary of waste posture and opportunity",
  "urgent_recommendations": [
    {
      "product_name": "name",
      "category": "category",
      "action": "action advice (e.g. Apply 45% clearance discount immediately)",
      "rationale": "one clear sentence why",
      "priority": "High" | "Medium"
    }
  ],
  "sustainability_score": 85,
  "strategic_tip": "One actionable operational tip for store staff today"
}
Output only valid JSON without code fences.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const text = response.text || '{}';
    const parsed = JSON.parse(text);
    return {
      ai_powered: true,
      model: 'gemini-3.8-flash',
      ...parsed,
    };
  } catch (error) {
    console.error('Gemini API call failed, falling back to rule engine:', error);
    return {
      ai_powered: false,
      model: 'Rule-Based Engine (Fallback)',
      executive_summary: `GreenOak inventory scan completed. ${payload.criticalItems.length} items require rapid markdown to preserve gross margins and prevent landfill waste.`,
      urgent_recommendations: payload.criticalItems.slice(0, 3).map((item) => ({
        product_name: item.name,
        category: item.category,
        action: 'Dynamic Markdown',
        rationale: `${item.hoursRemaining}h left before expiry threshold.`,
        priority: 'High' as const,
      })),
      sustainability_score: 82,
      strategic_tip: 'Audit prepared foods counter twice daily at 11:30 AM and 5:00 PM for maximum markdown uptake.',
    };
  }
}

export async function explainPricingRecommendationWithAI(
  productName: string,
  category: string,
  daysRemaining: number,
  quantity: number,
  originalPrice: number,
  costPrice: number,
  recommendedPrice: number,
  discountPct: number
) {
  if (!ai || !apiKey) {
    return {
      ai_powered: false,
      explanation: `Deterministic rule: ${discountPct}% markdown to $${recommendedPrice.toFixed(2)} based on ${daysRemaining} days remaining for ${category} stock. Protects cost floor of $${costPrice.toFixed(2)}.`,
    };
  }

  try {
    const prompt = `Explain why a ${discountPct}% discount (from $${originalPrice.toFixed(2)} to $${recommendedPrice.toFixed(2)}) is recommended for "${productName}" (${category}, ${quantity} units left, ${daysRemaining} days to expiry, cost floor $${costPrice.toFixed(2)}). 
Provide a clear, 2-sentence rationale focused on retail velocity, consumer psychology, and margin preservation. Keep it concise.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
    });

    return {
      ai_powered: true,
      explanation: response.text?.trim() || `${discountPct}% markdown balances clearance velocity with cost preservation.`,
    };
  } catch {
    return {
      ai_powered: false,
      explanation: `Calculated ${discountPct}% clearance discount to accelerate unit sell-through before expiry while preserving margin floor.`,
    };
  }
}
