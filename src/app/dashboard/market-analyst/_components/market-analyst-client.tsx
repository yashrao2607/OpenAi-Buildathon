
"use client";

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { analyzeMarketPrices, type AnalyzeMarketPricesOutput } from '@/ai/flows/analyze-market-prices';
import { generateSpeech } from '@/ai/flows/text-to-speech';
import { Bot, LineChart, Mic, TrendingUp, Volume2, Square, Pause, AlertCircle, Calculator, Info, BarChart3, Bell } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { useTranslation } from '@/contexts/language-context';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MarketPrices } from './market-prices';
import { PriceAlerts } from './price-alerts';
import { PriceGraph } from './price-graph';
import { usePriceHistory } from '@/lib/price-history-service';

// Type declarations for SpeechRecognition
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

// Check for SpeechRecognition API
const SpeechRecognition =
  (typeof window !== 'undefined' && (window.SpeechRecognition || window.webkitSpeechRecognition));

interface MarketData {
  timestamp: string;
  commodity: string;
  location: string;
  time: string;
  price: string;
  change: string;
}

interface PriceCalculation {
  commodity: string;
  quantity: number;
  unit: string;
  pricePerUnit: number;
  totalPrice: number;
  location: string;
  timestamp: string;
}

export function MarketAnalystClient() {
  const { t, language } = useTranslation();
  const { storeData } = usePriceHistory();
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [result, setResult] = useState<AnalyzeMarketPricesOutput | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isGeneratingSpeech, setIsGeneratingSpeech] = useState(false);
  const [activeAudio, setActiveAudio] = useState<{ id: 'recommendation' | 'analysis'; isPlaying: boolean } | null>(null);
  const [liveMarketData, setLiveMarketData] = useState<MarketData[]>([]);
  const [priceCalculation, setPriceCalculation] = useState<PriceCalculation | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Cleanup audio element and its event listeners
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
        audioRef.current = null;
      }
    };
  }, []);

  // Fetch live market data when component mounts
  useEffect(() => {
    fetchLiveMarketData();
  }, [storeData]);

  const fetchLiveMarketData = async () => {
    try {
      const response = await fetch('/api/market-prices');
      const result = await response.json();
      
      if (result.success) {
        setLiveMarketData(result.data);
        // Store the market data to Firebase for price trends
        await storeData(result.data);
        toast({
          title: "Data Updated",
          description: "Market data has been refreshed and stored in Firebase for price trends.",
        });
      }
    } catch (error) {
      console.error('Error fetching live market data:', error);
      toast({
        title: "Error",
        description: "Failed to refresh market data.",
        variant: "destructive",
      });
    }
  };

  const extractPriceQuery = (query: string): { commodity: string; quantity: number; unit: string } | null => {
    // Common patterns for price queries
    const patterns = [
      // "100kg guar price", "50 kg wheat price", "25 quintal rice price"
      /(\d+(?:\.\d+)?)\s*(kg|quintal|ton|tonne|qty|quantity)\s+(\w+)\s+price/i,
      // "guar price for 100kg", "wheat price 50 kg"
      /(\w+)\s+price\s+(?:for\s+)?(\d+(?:\.\d+)?)\s*(kg|quintal|ton|tonne|qty|quantity)/i,
      // "100 kg of guar", "50 quintal wheat"
      /(\d+(?:\.\d+)?)\s*(kg|quintal|ton|tonne|qty|quantity)\s+(?:of\s+)?(\w+)/i
    ];

    for (const pattern of patterns) {
      const match = query.match(pattern);
      if (match) {
        const quantity = parseFloat(match[1]);
        const unit = match[2].toLowerCase();
        const commodity = match[3].toLowerCase();
        
        if (quantity > 0 && commodity) {
          return { commodity, quantity, unit };
        }
      }
    }

    return null;
  };

  const calculatePrice = (query: string): PriceCalculation | null => {
    const extracted = extractPriceQuery(query);
    if (!extracted) return null;

    const { commodity, quantity, unit } = extracted;
    
    // Find matching commodity in live market data
    const marketItem = liveMarketData.find(item => 
      item.commodity.toLowerCase().includes(commodity) || 
      commodity.includes(item.commodity.toLowerCase())
    );

    if (!marketItem) return null;

    // Parse price (remove ₹ symbol and commas)
    const pricePerUnit = parseFloat(marketItem.price.replace(/[₹,\s]/g, ''));
    if (isNaN(pricePerUnit)) return null;

    // Convert units to kg for calculation
    let quantityInKg = quantity;
    if (unit === 'quintal') quantityInKg = quantity * 100; // 1 quintal = 100 kg
    if (unit === 'ton' || unit === 'tonne') quantityInKg = quantity * 1000; // 1 ton = 1000 kg

    // Calculate total price (assuming price is per kg)
    const totalPrice = quantityInKg * pricePerUnit;

    return {
      commodity: marketItem.commodity,
      quantity,
      unit,
      pricePerUnit,
      totalPrice,
      location: marketItem.location,
      timestamp: marketItem.timestamp
    };
  };

  const handleMicClick = () => {
    if (!SpeechRecognition) {
      toast({
        title: t('toast.browserNotSupported'),
        description: t('toast.noVoiceSupport'),
        variant: "destructive",
      });
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    
    // Set language for speech recognition
    const langMap: Record<string, string> = { en: 'en-IN', hi: 'hi-IN', kn: 'kn-IN', bn: 'bn-IN' };
    recognition.lang = langMap[language] || 'en-IN';

    recognition.onstart = () => {
      setIsRecording(true);
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setQuery(transcript);
    };

    recognition.onerror = (event: any) => {
      if (event.error === 'no-speech') {
        toast({
            title: t('toast.noSpeechDetected'),
            description: t('toast.tryAgain'),
            variant: "destructive",
        });
      } else {
        toast({
            title: t('toast.voiceError'),
            description: event.error,
            variant: "destructive",
        });
      }
    };
    
    recognition.onend = () => {
      setIsRecording(false);
    };

    recognition.start();
  };

  const playAudio = async (text: string, id: 'recommendation' | 'analysis') => {
    // If this audio is already playing, pause it
    if (activeAudio?.id === id && activeAudio.isPlaying) {
      audioRef.current?.pause();
      setActiveAudio({ ...activeAudio, isPlaying: false });
      return;
    }
    
    // If another audio is playing, pause it before starting the new one
    if (audioRef.current && !audioRef.current.paused) {
        audioRef.current.pause();
    }
    
    // If we're resuming a paused audio
    if (activeAudio?.id === id && !activeAudio.isPlaying) {
        audioRef.current?.play();
        setActiveAudio({ ...activeAudio, isPlaying: true });
        return;
    }

    // Otherwise, generate new audio
    setIsGeneratingSpeech(true);
    setActiveAudio(null);
    try {
      const response = await generateSpeech({ text, language });
      if (response.media) {
        if (!audioRef.current) {
          audioRef.current = new Audio();
          audioRef.current.onended = () => {
            setActiveAudio((current) => current ? { ...current, isPlaying: false } : null);
          };
          audioRef.current.onpause = () => {
             setActiveAudio((current) => current ? { ...current, isPlaying: false } : null);
          };
          audioRef.current.onplay = () => {
            setActiveAudio((current) => current ? { ...current, isPlaying: true } : null);
          };
        }
        audioRef.current.src = response.media;
        audioRef.current.play();
        setActiveAudio({ id, isPlaying: true });
      }
    } catch (error) {
      console.error("Speech generation failed", error);
      toast({
        title: t('toast.speechGenerationFailed'),
        description: t('toast.couldNotGenerateAudioAnalysis'),
        variant: "destructive",
      });
    } finally {
      setIsGeneratingSpeech(false);
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!query.trim()) {
      toast({
        title: t('toast.emptyQuery'),
        description: t('toast.enterMarketQuestion'),
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setResult(null);
    setError(null);
    setPriceCalculation(null);
    setActiveAudio(null);
    if (audioRef.current) {
        audioRef.current.pause();
    }

    try {
      // First, check if this is a price calculation query
      const calculatedPrice = calculatePrice(query);
      if (calculatedPrice) {
        setPriceCalculation(calculatedPrice);
        setIsLoading(false);
        return;
      }

      // If not a price calculation, proceed with AI analysis
      const analysisResult = await analyzeMarketPrices({ query, language });
      if (analysisResult.recommendation === "Service Unavailable") {
        setError(analysisResult.analysis);
        setResult(null);
      } else {
        setResult(analysisResult);
      }
    } catch (error) {
      console.error(error);
      const errorMessage = t('toast.errorAnalyzingMarket');
      setError(errorMessage);
      toast({
        title: t('toast.analysisFailed'),
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(price);
  };

  return (
    <Tabs defaultValue="ai-analysis" className="w-full">
      <div className="flex items-center justify-between mb-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="ai-analysis" className="flex items-center gap-2">
            <Bot className="h-4 w-4" />
            AI Analysis
          </TabsTrigger>
          <TabsTrigger value="live-prices" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Live Prices
          </TabsTrigger>
          <TabsTrigger value="price-graph" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Price Trends
          </TabsTrigger>
          <TabsTrigger value="price-alerts" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Price Alerts
          </TabsTrigger>
        </TabsList>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={fetchLiveMarketData}
          disabled={isLoading}
          className="ml-4"
        >
          {isLoading ? 'Refreshing...' : 'Refresh Data'}
        </Button>
      </div>

      <TabsContent value="ai-analysis" className="mt-6">
        <div className="grid gap-8 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>{t('marketAnalyst.client.askTitle')}</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <Textarea
                  placeholder={t('marketAnalyst.client.placeholder')}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  rows={4}
                />
                <div className="flex items-center gap-2">
                  <Button type="submit" disabled={isLoading || isRecording} className="flex-1">
                    {isLoading ? t('marketAnalyst.client.analyzing') : t('marketAnalyst.client.getAnalysis')}
                  </Button>
                   <Button type="button" variant={isRecording ? "destructive" : "outline"} size="icon" onClick={handleMicClick} disabled={isLoading}>
                      {isRecording ? <Square className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                      <span className="sr-only">{isRecording ? t('marketAnalyst.client.stopRecording') : t('marketAnalyst.client.useVoice')}</span>
                    </Button>
                </div>
                
                {/* Price calculation examples */}
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Info className="h-4 w-4 text-blue-600" />
                    <span className="text-sm font-medium text-blue-800">💡 Try asking for specific quantities:</span>
                  </div>
                  <div className="text-xs text-blue-700 space-y-1">
                    <p>• "100kg guar price"</p>
                    <p>• "50 quintal wheat price"</p>
                    <p>• "25 ton rice price"</p>
                  </div>
                </div>
              </form>
            </CardContent>
          </Card>
          
          <div>
            <h2 className="text-2xl font-bold mb-4 font-headline">{t('marketAnalyst.client.resultTitle')}</h2>
            {isLoading && <LoadingSkeleton />}
            
            {/* Price Calculation Result */}
            {priceCalculation && !isLoading && (
              <Card className="border-green-200 bg-green-50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-green-800">
                    <Calculator className="h-5 w-5" />
                    Price Calculation
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-gray-600">Commodity:</span>
                      <p className="font-semibold">{priceCalculation.commodity}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-600">Quantity:</span>
                      <p className="font-semibold">{priceCalculation.quantity} {priceCalculation.unit}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-600">Price per kg:</span>
                      <p className="font-semibold">{formatPrice(priceCalculation.pricePerUnit)}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-600">Location:</span>
                      <p className="font-semibold">{priceCalculation.location}</p>
                    </div>
                  </div>
                  
                  <div className="pt-3 border-t border-green-200">
                    <div className="text-center">
                      <span className="text-lg font-medium text-gray-600">Total Price:</span>
                      <p className="text-3xl font-bold text-green-700">{formatPrice(priceCalculation.totalPrice)}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        Based on live market data from {new Date(priceCalculation.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {error && !isLoading && (
                 <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>{t('toast.analysisFailed')}</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}
            {result && !isLoading && !error && (
              <div className="space-y-4">
                <Alert>
                  <div className="flex justify-between items-center w-full">
                    <div className='flex-1'>
                      <div className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4" />
                        <AlertTitle>{t('marketAnalyst.client.recommendation')}</AlertTitle>
                      </div>
                      <AlertDescription className='pl-6'>{result.recommendation}</AlertDescription>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => playAudio(result.recommendation, 'recommendation')} disabled={isGeneratingSpeech}>
                        {activeAudio?.id === 'recommendation' && activeAudio.isPlaying ? <Pause className="h-5 w-5"/> : <Volume2 className="h-5 w-5"/>}
                    </Button>
                  </div>
                </Alert>
                <Alert>
                  <div className="flex justify-between items-center w-full">
                    <div className='flex-1'>
                        <div className='flex items-center gap-2'>
                            <LineChart className="h-4 w-4" />
                            <AlertTitle>{t('marketAnalyst.client.marketAnalysis')}</AlertTitle>
                        </div>
                        <AlertDescription className='pl-6'>{result.analysis}</AlertDescription>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => playAudio(result.analysis, 'analysis')} disabled={isGeneratingSpeech}>
                         {activeAudio?.id === 'analysis' && activeAudio.isPlaying ? <Pause className="h-5 w-5"/> : <Volume2 className="h-5 w-5"/>}
                    </Button>
                  </div>
                </Alert>
              </div>
            )}
            {!result && !priceCalculation && !isLoading && !error && (
              <Card className="flex flex-col items-center justify-center p-8 text-center h-full">
                <CardContent>
                  <Bot className="mx-auto h-12 w-12 text-muted-foreground" />
                  <p className="mt-4 text-muted-foreground">{t('marketAnalyst.client.resultPlaceholder')}</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </TabsContent>

      <TabsContent value="live-prices" className="mt-6">
        <MarketPrices />
      </TabsContent>

      <TabsContent value="price-graph" className="mt-6">
        <PriceGraph />
      </TabsContent>

      <TabsContent value="price-alerts" className="mt-6">
        <PriceAlerts />
      </TabsContent>
    </Tabs>
  );
}

const LoadingSkeleton = () => (
    <div className="space-y-4">
      <Skeleton className="h-20 w-full" />
      <Skeleton className="h-32 w-full" />
    </div>
);
