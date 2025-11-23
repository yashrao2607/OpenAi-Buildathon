"use client";
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Minus, Info } from 'lucide-react';

interface MarketAnalysisCardProps {
  recommendation: string;
  analysis: string;
}

export default function MarketAnalysisCard({ recommendation, analysis }: MarketAnalysisCardProps) {
  // Extract recommendation type for styling
  const getRecommendationType = (rec: string) => {
    const lowerRec = rec.toLowerCase();
    if (lowerRec.includes('sell') || lowerRec.includes('good')) return 'sell';
    if (lowerRec.includes('wait') || lowerRec.includes('hold')) return 'wait';
    if (lowerRec.includes('buy')) return 'buy';
    return 'neutral';
  };

  const getRecommendationIcon = (type: string) => {
    switch (type) {
      case 'sell':
        return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'wait':
        return <Minus className="h-4 w-4 text-yellow-600" />;
      case 'buy':
        return <TrendingDown className="h-4 w-4 text-blue-600" />;
      default:
        return <Info className="h-4 w-4 text-gray-600" />;
    }
  };

  const getRecommendationBadgeVariant = (type: string) => {
    switch (type) {
      case 'sell':
        return 'default' as const;
      case 'wait':
        return 'secondary' as const;
      case 'buy':
        return 'outline' as const;
      default:
        return 'secondary' as const;
    }
  };

  const recommendationType = getRecommendationType(recommendation);

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          {getRecommendationIcon(recommendationType)}
          <CardTitle className="text-lg">Market Analysis Result</CardTitle>
          <Badge variant={getRecommendationBadgeVariant(recommendationType)} className="ml-auto">
            {recommendationType.toUpperCase()}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h4 className="text-sm font-semibold mb-2 text-primary">Recommendation</h4>
          <p className="text-sm leading-relaxed bg-primary/5 p-3 rounded-lg border-l-4 border-primary">
            {recommendation}
          </p>
        </div>
        <div>
          <h4 className="text-sm font-semibold mb-2 text-muted-foreground">Detailed Analysis</h4>
          <p className="text-sm leading-relaxed text-muted-foreground whitespace-pre-line">
            {analysis}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
