import { NextRequest, NextResponse } from 'next/server';
import { MarketPriceService } from '@/lib/firebase-service';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const commodity = searchParams.get('commodity');
    const days = parseInt(searchParams.get('days') || '30');
    const limit = parseInt(searchParams.get('limit') || '100');

    if (commodity) {
      // Get history for specific commodity
      const result = await MarketPriceService.getCommodityHistory(commodity, days);
      return NextResponse.json(result);
    } else {
      // Get recent market prices
      const result = await MarketPriceService.getRecentMarketPrices(limit);
      return NextResponse.json(result);
    }
  } catch (error) {
    console.error('Error fetching market price history:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
