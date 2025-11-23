"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { RefreshCw, TrendingUp, TrendingDown, Minus, Search, Filter } from 'lucide-react';
import { useTranslation } from '@/contexts/language-context';

interface MarketData {
  timestamp: string;
  commodity: string;
  location: string;
  time: string;
  price: string;
  change: string;
}

interface MarketPricesResponse {
  success: boolean;
  data: MarketData[];
  timestamp: string;
  count: number;
  error?: string;
}

export function MarketPrices() {
  const { t } = useTranslation();
  const [marketData, setMarketData] = useState<MarketData[]>([]);
  const [filteredData, setFilteredData] = useState<MarketData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCommodity, setSelectedCommodity] = useState<string>('all');
  const [selectedLocation, setSelectedLocation] = useState<string>('all');
  const [lastUpdated, setLastUpdated] = useState<string>('');

  const fetchMarketData = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/market-prices');
      const result: MarketPricesResponse = await response.json();
      
      if (result.success) {
        setMarketData(result.data);
        setFilteredData(result.data);
        setLastUpdated(result.timestamp);
      } else {
        throw new Error(result.error || 'Failed to fetch data');
      }
    } catch (error) {
      console.error('Error fetching market data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMarketData();
  }, []);

  useEffect(() => {
    let filtered = marketData;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(item =>
        item.commodity.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.location.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by commodity
    if (selectedCommodity !== 'all') {
      filtered = filtered.filter(item => item.commodity === selectedCommodity);
    }

    // Filter by location
    if (selectedLocation !== 'all') {
      filtered = filtered.filter(item => item.location === selectedLocation);
    }

    setFilteredData(filtered);
  }, [searchTerm, selectedCommodity, selectedLocation, marketData]);

  const getUniqueCommodities = () => {
    return Array.from(new Set(marketData.map(item => item.commodity))).sort();
  };

  const getUniqueLocations = () => {
    return Array.from(new Set(marketData.map(item => item.location))).sort();
  };

  const getChangeColor = (change: string) => {
    if (!change) return 'text-gray-500';
    const num = parseFloat(change.replace(/[^\d.-]/g, ''));
    if (isNaN(num)) return 'text-gray-500';
    if (num > 0) return 'text-green-600';
    if (num < 0) return 'text-red-600';
    return 'text-gray-500';
  };

  const getChangeIcon = (change: string) => {
    if (!change) return <Minus className="h-4 w-4" />;
    const num = parseFloat(change.replace(/[^\d.-]/g, ''));
    if (isNaN(num)) return <Minus className="h-4 w-4" />;
    if (num > 0) return <TrendingUp className="h-4 w-4" />;
    if (num < 0) return <TrendingDown className="h-4 w-4" />;
    return <Minus className="h-4 w-4" />;
  };

  return (
    <div className="space-y-6">
      {/* Header with refresh button */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold font-headline">📊 Live Market Prices</h2>
          <p className="text-muted-foreground">
            Real-time commodity prices from NCDEX
            {lastUpdated && (
              <span className="ml-2 text-sm">
                Last updated: {new Date(lastUpdated).toLocaleString()}
              </span>
            )}
          </p>
        </div>
        <Button onClick={fetchMarketData} disabled={isLoading} className="shrink-0">
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          {isLoading ? 'Updating...' : 'Refresh'}
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters & Search
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search commodities..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={selectedCommodity} onValueChange={setSelectedCommodity}>
              <SelectTrigger>
                <SelectValue placeholder="Select commodity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Commodities</SelectItem>
                {getUniqueCommodities().map(commodity => (
                  <SelectItem key={commodity} value={commodity}>{commodity}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedLocation} onValueChange={setSelectedLocation}>
              <SelectTrigger>
                <SelectValue placeholder="Select location" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Locations</SelectItem>
                {getUniqueLocations().map(location => (
                  <SelectItem key={location} value={location}>{location}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Data Table */}
      <Card>
        <CardHeader>
          <CardTitle>📋 Price Details</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : filteredData.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Commodity</th>
                    <th className="text-left p-2">Location</th>
                    <th className="text-left p-2">Price</th>
                    <th className="text-left p-2">Change</th>
                    <th className="text-left p-2">Time</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredData.map((item, index) => (
                    <tr key={index} className="border-b hover:bg-muted/50">
                      <td className="p-2 font-medium">{item.commodity}</td>
                      <td className="p-2">
                        <Badge variant="outline">{item.location}</Badge>
                      </td>
                      <td className="p-2 font-bold">₹{item.price}</td>
                      <td className={`p-2 flex items-center gap-1 ${getChangeColor(item.change)}`}>
                        {getChangeIcon(item.change)}
                        {item.change || '0'}
                      </td>
                      <td className="p-2 text-sm text-muted-foreground">{item.time}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No data available with current filters
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
