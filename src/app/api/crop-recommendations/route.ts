import { NextRequest, NextResponse } from 'next/server';
import { recommendCrops, type RecommendCropsInput } from '@/ai/flows/recommend-crops';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate the input data
    if (!body.soilType || !body.climate || !body.season || !body.language) {
      return NextResponse.json(
        { error: 'Missing required fields: soilType, climate, season, language' },
        { status: 400 }
      );
    }

    const input: RecommendCropsInput = {
      soilType: body.soilType,
      climate: body.climate,
      season: body.season,
      language: body.language
    };

    const result = await recommendCrops(input);
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error in crop recommendations API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
