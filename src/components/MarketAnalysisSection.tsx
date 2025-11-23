"use client";
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useTranslation } from '@/contexts/language-context';
import { useNotifications } from '@/contexts/notification-context';
import { Loader2, BarChart3, RotateCcw } from 'lucide-react';
import MarketAnalysisCard from './ui/MarketAnalysisCard';

export default function MarketAnalysisSection() {
  const { t, language } = useTranslation();
  const { addNotification } = useNotifications();
  const [query, setQuery] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState<string>(language);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ recommendation: string; analysis: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleAnalyze(e?: React.FormEvent) {
    e?.preventDefault();
    setError(null);
    setResult(null);
    
    if (!query.trim()) {
      setError('Please enter crop and optionally location (e.g. "wheat in Ludhiana")');
      return;
    }
    
    setLoading(true);
    try {
      const res = await fetch('/api/market-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: query.trim(), language: selectedLanguage }),
      });
      
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || 'Failed to analyze market data');
      
      setResult({ recommendation: json.recommendation, analysis: json.analysis });
      
      // Add notification for successful analysis
      addNotification({
        title: "Market Analysis Complete",
        description: `Analysis completed for "${query.trim()}"`,
        type: "success"
      });
      
    } catch (err: any) {
      const errorMessage = err?.message || 'Error calling market analysis';
      setError(errorMessage);
      
      // Add notification for error
      addNotification({
        title: "Market Analysis Failed",
        description: errorMessage,
        type: "error"
      });
    } finally {
      setLoading(false);
    }
  }

  const handleReset = () => {
    setQuery('');
    setResult(null);
    setError(null);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-primary" />
          <div>
            <CardTitle>Market Price Analysis</CardTitle>
            <CardDescription>
              Get AI-powered market analysis and recommendations for your crops
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={handleAnalyze} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="query">Crop & Location Query</Label>
            <Input
              id="query"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="e.g. wheat in Ludhiana, rice prices, cotton market"
              className="w-full"
              disabled={loading}
            />
            <p className="text-xs text-muted-foreground">
              Enter the crop name and optionally include location for more specific analysis
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="language">Analysis Language</Label>
            <Select value={selectedLanguage} onValueChange={setSelectedLanguage} disabled={loading}>
              <SelectTrigger>
                <SelectValue placeholder="Select language" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="hi">हिन्दी (Hindi)</SelectItem>
                <SelectItem value="kn">ಕನ್ನಡ (Kannada)</SelectItem>
                <SelectItem value="bn">বাংলা (Bengali)</SelectItem>
                <SelectItem value="bho">भोजपुरी (Bhojpuri)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-2">
            <Button 
              type="submit" 
              disabled={loading || !query.trim()}
              className="flex-1"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <BarChart3 className="mr-2 h-4 w-4" />
                  Analyze Market
                </>
              )}
            </Button>
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleReset}
              disabled={loading}
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              Reset
            </Button>
          </div>
        </form>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {result && (
          <div className="mt-4">
            <MarketAnalysisCard recommendation={result.recommendation} analysis={result.analysis} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
