import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { analyzeMarketPrices } from '@/ai/flows/analyze-market-prices';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    // basic validation
    if (!body?.query) {
      return NextResponse.json({ error: 'query is required' }, { status: 400 });
    }
    const language = body.language ?? 'en';
    const result = await analyzeMarketPrices({ query: String(body.query), language: String(language) });
    return NextResponse.json(result);
  } catch (err: any) {
    console.error('API /market-analysis error:', err);
    return NextResponse.json({ error: err?.message ?? 'internal error' }, { status: 500 });
  }
}
