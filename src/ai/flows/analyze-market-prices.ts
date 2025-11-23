'use server';
//understood
/**
 * analyzeMarketPrices.ts
 * Server flow to fetch market data, call AI prompt, and fallback to local analysis.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const AnalyzeMarketPricesInputSchema = z.object({
  query: z.string().describe('User query about market prices: include crop and optional location.'),
  language: z.string().describe('Language code: "en"|"hi"|"kn"|"bn"|"bho"'),
});
export type AnalyzeMarketPricesInput = z.infer<typeof AnalyzeMarketPricesInputSchema>;

const AnalyzeMarketPricesOutputSchema = z.object({
  recommendation: z.string(),
  analysis: z.string(),
});
export type AnalyzeMarketPricesOutput = z.infer<typeof AnalyzeMarketPricesOutputSchema>;

// Fallback market snapshot
const fallbackMarketData = {
  wheat: { price: 2400, trend: 'stable', recommendation: 'moderate' },
  rice: { price: 3200, trend: 'rising', recommendation: 'good' },
  maize: { price: 1850, trend: 'stable', recommendation: 'moderate' },
  pulses: { price: 4100, trend: 'rising', recommendation: 'good' },
  cotton: { price: 6750, trend: 'falling', recommendation: 'wait' },
  guar: { price: 8500, trend: 'stable', recommendation: 'moderate' },
  soybean: { price: 4200, trend: 'rising', recommendation: 'good' },
  mustard: { price: 5200, trend: 'stable', recommendation: 'moderate' }
};

/* ---------- helpers ---------- */

async function fetchWithTimeout(url: string, opts: RequestInit = {}, timeoutMs = 5000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...opts, signal: controller.signal });
    clearTimeout(id);
    return res;
  } catch (err) {
    clearTimeout(id);
    throw err;
  }
}

async function fetchLiveMarketData() {
  try {
    // read api url from env with fallback
    const marketApi = process.env.NEXT_PUBLIC_MARKET_API ?? 'http://localhost:9002/api/market-prices';
    const res = await fetchWithTimeout(marketApi, { method: 'GET' }, 5000);
    if (!res.ok) throw new Error(`market API status ${res.status}`);
    const json = await res.json();
    // expect shape { data: [...] } or [...]. Normalize below.
    return json?.data ?? json ?? [];
  } catch (err) {
    console.error('fetchLiveMarketData failed:', err);
    return null;
  }
}

function normalizeMarketData(marketData: any): { commodity: string; price: number; trend: string; recommendation: string; unit: string; change: string }[] {
  if (!Array.isArray(marketData)) return [];
  return marketData.map((item: any) => {
    const commodity = String(item?.commodity ?? item?.name ?? '').trim();
    const rawPrice = item?.price ?? item?.lastPrice ?? item?.value ?? NaN;
    const price = Number(rawPrice) || NaN;
    const changeRaw = item?.change ?? item?.percentChange ?? '0';
    const changeValue = parseFloat(String(changeRaw).replace(/[^\d.-]/g, '')) || 0;
    const trend = (item?.trend ?? (changeValue > 0 ? 'rising' : changeValue < 0 ? 'falling' : 'stable'));
    const recommendation = (item?.recommendation ?? (trend === 'rising' ? 'good' : trend === 'falling' ? 'wait' : 'moderate'));
    return {
      commodity,
      price,
      trend,
      recommendation,
      unit: item?.unit ?? 'per quintal',
      change: String(changeRaw ?? '0')
    };
  });
}

function formatINR(n: number) {
  if (!Number.isFinite(n)) return 'N/A';
  return new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(n);
}

/* ---------- AI prompt definition ---------- */
const analysisPrompt = ai.definePrompt({
  name: 'marketAnalysisPrompt',
  input: {
    schema: z.object({
      query: z.string(),
      language: z.string(),
      // pass a compact JSON string (we will pass only relevant items)
      marketData: z.string(),
    }),
  },
  output: { schema: AnalyzeMarketPricesOutputSchema },
  prompt: `You are a market analyst providing advice to farmers in India.

The farmer's preferred language is {{language}}. All of your text output (recommendation, analysis) MUST be in this language.

A farmer has the following query: "{{query}}".

Here is the current market data (only relevant commodities) in JSON:
{{marketData}}

Based on this data and the user's query, provide:
1) A recommendation (sell / wait / hold / buy) and short reasoning.
2) A concise analysis that MUST include the CURRENT LIVE PRICES from the data (e.g., "Current wheat price is ₹X per quintal").

Be brief, actionable, and mention exact prices.`
});

/* ---------- main exported flow ---------- */

export async function analyzeMarketPrices(input: AnalyzeMarketPricesInput): Promise<AnalyzeMarketPricesOutput> {
  return analyzeMarketPricesFlow(input);
}

const AnalyzeMarketPricesFlowDef = {
  name: 'analyzeMarketPricesFlow',
  inputSchema: AnalyzeMarketPricesInputSchema,
  outputSchema: AnalyzeMarketPricesOutputSchema,
};

const analyzeMarketPricesFlow = ai.defineFlow(
  AnalyzeMarketPricesFlowDef,
  async ({ query, language }) => {
    try {
      // 1) fetch live data
      let rawData = await fetchLiveMarketData();
      let isLiveData = true;

      if (!rawData || (Array.isArray(rawData) && rawData.length === 0)) {
        isLiveData = false;
        rawData = Object.entries(fallbackMarketData).map(([k, v]) => ({
          commodity: k.charAt(0).toUpperCase() + k.slice(1),
          price: v.price,
          trend: v.trend,
          recommendation: v.recommendation,
          unit: 'per quintal',
          change: '0.00'
        }));
      }

      const normalized = normalizeMarketData(rawData);

      // limit marketData passed to LLM to commodities mentioned in query + top 5 if none
      const cropKeywords = ['wheat', 'rice', 'maize', 'pulses', 'cotton', 'guar', 'soybean', 'mustard'];
      const mentioned = cropKeywords.filter(c => query.toLowerCase().includes(c));
      let toSend = normalized;
      if (mentioned.length > 0) {
        toSend = normalized.filter(item => mentioned.some(m => item.commodity.toLowerCase().includes(m)));
      } else {
        toSend = normalized.slice(0, 6);
      }

      // 2) Try AI call (fallback if no model or failure)
      let useAI = true;
      if (useAI) {
        try {
          const { output } = await analysisPrompt({
            query,
            language,
            marketData: JSON.stringify(toSend, null, 2)
          });

          if (output && output.recommendation && output.analysis) {
            return output;
          } else {
            // if AI returned empty or malformed, fallback
            console.warn('AI returned empty/malformed output, falling back to local analysis.');
            useAI = false;
          }
        } catch (err) {
          console.error('AI prompt error: ', err);
          useAI = false;
        }
      }

      // 3) fallback local analysis
      return getEnhancedFallbackAnalysis(query, language, toSend, isLiveData);
    } catch (err) {
      console.error('analyzeMarketPricesFlow error:', err);
      // as last resort return fallback using fallbackMarketData
      const fallbackArray = Object.entries(fallbackMarketData).map(([k, v]) => ({
        commodity: k.charAt(0).toUpperCase() + k.slice(1),
        price: v.price,
        trend: v.trend,
        recommendation: v.recommendation,
        unit: 'per quintal',
        change: '0.00'
      }));
      return getEnhancedFallbackAnalysis(query, language, fallbackArray, false);
    }
  }
);

/* ---------- corrected fallback analysis ---------- */

function getEnhancedFallbackAnalysis(query: string, language: string, marketData: any[], isLiveData: boolean): AnalyzeMarketPricesOutput {
  const normalized = normalizeMarketData(marketData || []);
  const cropKeywords = ['wheat', 'rice', 'maize', 'pulses', 'cotton', 'guar', 'soybean', 'mustard'];
  const mentionedCrop = cropKeywords.find(crop => query.toLowerCase().includes(crop)) ?? 'wheat';

  const currentCropData = normalized.find(item => item.commodity.toLowerCase().includes(mentionedCrop));
  const currentPrice = currentCropData?.price ?? fallbackMarketData[mentionedCrop as keyof typeof fallbackMarketData]?.price ?? 2400;
  const currentTrend = currentCropData?.trend ?? fallbackMarketData[mentionedCrop as keyof typeof fallbackMarketData]?.trend ?? 'stable';
  const currentRecommendation = currentCropData?.recommendation ?? fallbackMarketData[mentionedCrop as keyof typeof fallbackMarketData]?.recommendation ?? 'moderate';
  const dataSource = isLiveData ? 'LIVE NCDEX' : 'market data';

  const fallbackResponses: Record<string, { recommendation: string; analysis: string }> = {
    en: {
      recommendation: `Based on current ${dataSource}, ${currentRecommendation === 'good' ? 'consider selling your produce now' : currentRecommendation === 'wait' ? 'consider holding your produce for now' : 'evaluate market conditions carefully'}.`,
      analysis: `Current ${mentionedCrop} price is ₹${formatINR(currentPrice)} per quintal with a ${currentTrend} trend. This price is based on ${dataSource} and shows ${currentTrend === 'rising' ? 'upward momentum' : currentTrend === 'falling' ? 'downward pressure' : 'stability'}. Monitor local mandi prices for the best selling opportunities.`
    },
    hi: {
      recommendation: `वर्तमान ${dataSource} के आधार पर, ${currentRecommendation === 'good' ? 'अभी अपनी उपज बेचने पर विचार करें' : currentRecommendation === 'wait' ? 'अभी अपनी उपज को रखने पर विचार करें' : 'बाजार की स्थिति का सावधानीपूर्वक मूल्यांकन करें'}.`,
      analysis: `वर्तमान ${mentionedCrop} का दाम ₹${formatINR(currentPrice)} प्रति क्विंटल है जिसमें ${currentTrend === 'rising' ? 'ऊपर की ओर गति' : currentTrend === 'falling' ? 'नीचे की ओर दबाव' : 'स्थिरता'} दिख रही है। यह दाम ${dataSource} पर आधारित है। सर्वोत्तम बिक्री के अवसरों के लिए स्थानीय मंडी के दामों की निगरानी करें।`
    },
    kn: {
      recommendation: `ಪ್ರಸ್ತುತ ${dataSource} ಆಧಾರವಾಗಿ, ${currentRecommendation === 'good' ? 'ಈಗ ನಿಮ್ಮ ಉತ್ಪನ್ನವನ್ನು ಮಾರಾಟ ಮಾಡಲು ಪರಿಗಣಿಸಿ' : currentRecommendation === 'wait' ? 'ಈಗ ನಿಮ್ಮ ಉತ್ಪನ್ನವನ್ನು ಹಿಡಿದಿಡಲು ಪರಿಗಣಿಸಿ' : 'ಮಾರುಕಟ್ಟೆ ಪರಿಸ್ಥಿತಿಗಳನ್ನು ಎಚ್ಚರಿಕೆಯಿಂದ ಮೌಲ್ಯಮಾಪನ ಮಾಡಿ'}.`,
      analysis: `ಪ್ರಸ್ತುತ ${mentionedCrop} ಬೆಲೆ ₹${formatINR(currentPrice)} ಪ್ರತಿ ಕ್ವಿಂಟಲ್ ಆಗಿದ್ದು ${currentTrend === 'rising' ? 'ಮೇಲ್ಮುಖ ಚಲನೆ' : currentTrend === 'falling' ? 'ಕೆಳಮುಖ ಒತ್ತಡ' : 'ಸ್ಥಿರತೆ'} ತೋರಿಸುತ್ತಿದೆ. ಈ ಬೆಲೆ ${dataSource} ಆಧಾರಿತವಾಗಿದೆ. ಉತ್ತಮ ಮಾರಾಟ ಅವಕಾಶಗಳಿಗಾಗಿ ಸ್ಥಳೀಯ ಮಾರುಕಟ್ಟೆ ಬೆಲೆಗಳನ್ನು ಗಮನಿಸಿ.`
    },
    bn: {
      recommendation: `বর্তমান ${dataSource} ভিত্তিতে, ${currentRecommendation === 'good' ? 'এখন বিক্রয় বিবেচনা করুন' : currentRecommendation === 'wait' ? 'এখন ধরে রাখার কথা ভাবুন' : 'বাজার পরিস্থিতি সতর্কভাবে মূল্যায়ন করুন'}.`,
      analysis: `বর্তমান ${mentionedCrop} এর দাম ₹${formatINR(currentPrice)} প্রতি কুইন্টাল এবং এটি ${currentTrend === 'rising' ? 'উর্ধ্বমুখী' : currentTrend === 'falling' ? 'নিম্নমুখী' : 'স্থিতিশীল'} প্রবণতা দেখাচ্ছে। এটি ${dataSource} থেকে সংগৃহীত। স্থানীয় ম্যান্ডি দাম পর্যবেক্ষণ করুন।`
    },
    bho: {
      recommendation: `मौजूदा ${dataSource} के आधार पर, ${currentRecommendation === 'good' ? 'अभी अपना माल बेचने पर विचार करें' : currentRecommendation === 'wait' ? 'अभी रखें' : 'बाजार का ध्यान से मूल्यांकन करें'}.`,
      analysis: `मौजूदा ${mentionedCrop} के दाम ₹${formatINR(currentPrice)} प्रति क्विंटल बा, आ ई ${currentTrend === 'rising' ? 'ऊपर की ओर' : currentTrend === 'falling' ? 'नीचे की ओर' : 'स्थिर'} प्रवृत्ति देखा रहल बा। अधिक जानकारी खातिर स्थानीय मंडी के दाम देखs।`
    }
  };

  const resp = (fallbackResponses as any)[language] ?? fallbackResponses.en;
  return { recommendation: resp.recommendation, analysis: resp.analysis };
}
