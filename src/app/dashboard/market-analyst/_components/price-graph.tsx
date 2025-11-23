"use client";

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useTranslation } from '@/contexts/language-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BarChart3, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { LineChart, BarChart, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Line, Bar } from 'recharts';
import { usePriceHistory } from '@/lib/price-history-service';

interface ChartDataPoint {
  date: string;
  price: number;
  change: string;
  timestamp: string;
}

export function PriceGraph() {
  const { t } = useTranslation();
  const { 
    getPriceHistory, 
    getAllCommodities, 
    getLocationsForCommodity, 
    getDataSummary, 
    commodities,
    isLoading: priceHistoryLoading 
  } = usePriceHistory();
  
  const [selectedCommodity, setSelectedCommodity] = useState<string>('');
  const [selectedLocation, setSelectedLocation] = useState<string>('all');
  const [chartType, setChartType] = useState<'line' | 'bar'>('line');
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | 'all'>('30d');
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [locations, setLocations] = useState<string[]>([]);
  const [dataSummary, setDataSummary] = useState<{ totalEntries: number; commodities: number; locations: number }>({ totalEntries: 0, commodities: 0, locations: 0 });

  // Process chart data
  const processedChartData = useMemo(() => {
    if (!chartData.length) {
      console.log('No chart data available');
      return [];
    }

    console.log('Processing chart data:', chartData);

    // Filter by time range
    let filteredData = chartData;
    const now = new Date();
    
    switch (timeRange) {
      case '7d':
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        filteredData = chartData.filter(item => new Date(item.timestamp) >= sevenDaysAgo);
        break;
      case '30d':
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        filteredData = chartData.filter(item => new Date(item.timestamp) >= thirtyDaysAgo);
        break;
      case '90d':
        const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        filteredData = chartData.filter(item => new Date(item.timestamp) >= ninetyDaysAgo);
        break;
      // 'all' - no filtering
    }

    // Group by date and get average price for each day
    const groupedData = filteredData.reduce((acc, item) => {
      const date = item.date;
      if (!acc[date]) {
        acc[date] = { prices: [], changes: [] };
      }
      acc[date].prices.push(item.price);
      acc[date].changes.push(item.change);
      return acc;
    }, {} as Record<string, { prices: number[]; changes: string[] }>);

    console.log('Grouped data:', groupedData);

    // Calculate average price and change for each day
    const result = Object.entries(groupedData).map(([date, data]) => {
      const avgPrice = data.prices.reduce((sum, price) => sum + price, 0) / data.prices.length;
      
      // For sample data, just take the first change value since they're all the same for each date
      const change = data.changes[0] || '0%';

      const item = {
        date: new Date(date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }),
        price: Math.round(avgPrice * 100) / 100,
        change: change,
        timestamp: date
      };
      
      console.log('Processed item:', item);
      return item;
    }).sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    console.log('Final processed data:', result);
    return result;
  }, [chartData, timeRange]);

  // Load chart data when commodity or location changes
  useEffect(() => {
    const loadChartData = async () => {
      if (selectedCommodity) {
        setIsLoading(true);
        try {
          const history = await getPriceHistory(selectedCommodity, selectedLocation === 'all' ? undefined : selectedLocation);
          
          // Only set chart data if we have real data, otherwise keep sample data
          if (history.length > 0) {
            setChartData(history);
          }
        } catch (error) {
          console.error('Error loading chart data:', error);
        } finally {
          setIsLoading(false);
        }
      }
    };

    loadChartData();
  }, [selectedCommodity, selectedLocation, getPriceHistory]);

  // Auto-select first commodity if none selected
  useEffect(() => {
    if (commodities.length > 0 && !selectedCommodity) {
      setSelectedCommodity(commodities[0]);
    }
  }, [commodities, selectedCommodity]);

  // Load locations when commodity changes
  useEffect(() => {
    const loadLocations = async () => {
      if (selectedCommodity) {
        try {
          const locationsList = await getLocationsForCommodity(selectedCommodity);
          setLocations(locationsList);
        } catch (error) {
          console.error('Error loading locations:', error);
        }
      } else {
        setLocations([]);
      }
    };

    loadLocations();
  }, [selectedCommodity, getLocationsForCommodity]);

  // Load data summary
  useEffect(() => {
    const loadSummary = async () => {
      try {
        const summary = await getDataSummary();
        setDataSummary(summary);
      } catch (error) {
        console.error('Error loading data summary:', error);
      }
    };

    loadSummary();
  }, [getDataSummary]);

  // Create sample data for demonstration if no real data exists
  useEffect(() => {
    if (commodities.length === 0 && !priceHistoryLoading && !isLoading && chartData.length === 0) {
      // Create sample data for demonstration
      const sampleData: ChartDataPoint[] = [
        { date: '2024-01-01', price: 2500, change: '+2.5%', timestamp: '2024-01-01T00:00:00Z' },
        { date: '2024-01-02', price: 2550, change: '+2.0%', timestamp: '2024-01-02T00:00:00Z' },
        { date: '2024-01-03', price: 2480, change: '-2.7%', timestamp: '2024-01-03T00:00:00Z' },
        { date: '2024-01-04', price: 2620, change: '+5.6%', timestamp: '2024-01-04T00:00:00Z' },
        { date: '2024-01-05', price: 2580, change: '-1.5%', timestamp: '2024-01-05T00:00:00Z' },
        { date: '2024-01-06', price: 2650, change: '+2.7%', timestamp: '2024-01-06T00:00:00Z' },
        { date: '2024-01-07', price: 2700, change: '+1.9%', timestamp: '2024-01-07T00:00:00Z' },
        { date: '2024-01-08', price: 2680, change: '-0.7%', timestamp: '2024-01-08T00:00:00Z' },
        { date: '2024-01-09', price: 2750, change: '+2.6%', timestamp: '2024-01-09T00:00:00Z' },
        { date: '2024-01-10', price: 2720, change: '-1.1%', timestamp: '2024-01-10T00:00:00Z' },
      ];
      setChartData(sampleData);
      setSelectedCommodity('Sample Rice Data');
    }
  }, [commodities, priceHistoryLoading, isLoading, chartData.length]);

  // Auto-select first location if none selected
  useEffect(() => {
    if (locations.length > 0 && selectedLocation === 'all') {
      // Keep "all" as default, don't auto-select first location
      return;
    }
  }, [locations, selectedLocation]);

  const getChangeColor = (change: string) => {
    const num = parseFloat(change.replace(/[^\d.-]/g, '')) || 0;
    if (num > 0) return '#10b981'; // green
    if (num < 0) return '#ef4444'; // red
    return '#6b7280'; // gray
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const change = payload[0].payload.change;
      const changeColor = getChangeColor(change);
      
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-semibold">{label}</p>
          <p className="font-medium" style={{ color: changeColor }}>
            Change: {change}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">Price Trends</h2>
          <p className="text-muted-foreground">
            Historical price data visualization with interactive charts
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant={chartType === 'line' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setChartType('line')}
          >
            <TrendingUp className="h-4 w-4 mr-2" />
            Line Chart
          </Button>
          <Button
            variant={chartType === 'bar' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setChartType('bar')}
          >
            <BarChart3 className="h-4 w-4 mr-2" />
            Bar Chart
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Commodity</CardTitle>
          </CardHeader>
          <CardContent>
            <Select value={selectedCommodity} onValueChange={setSelectedCommodity}>
              <SelectTrigger>
                <SelectValue placeholder="Select commodity" />
              </SelectTrigger>
              <SelectContent>
                {commodities.map((commodity) => (
                  <SelectItem key={commodity} value={commodity}>
                    {commodity}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Location</CardTitle>
          </CardHeader>
          <CardContent>
            <Select value={selectedLocation} onValueChange={setSelectedLocation}>
              <SelectTrigger>
                <SelectValue placeholder="Select location" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Locations</SelectItem>
                {locations.map((location) => (
                  <SelectItem key={location} value={location}>
                    {location}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Time Range</CardTitle>
          </CardHeader>
          <CardContent>
            <Select value={timeRange} onValueChange={(value: '7d' | '30d' | '90d' | 'all') => setTimeRange(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
                <SelectItem value="90d">Last 90 days</SelectItem>
                <SelectItem value="all">All time</SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
      </div>

      {/* Chart */}
      <Card>
        <CardHeader>
          <CardTitle>
            {selectedCommodity && selectedLocation !== 'all' 
              ? `${selectedCommodity} - ${selectedLocation}` 
              : selectedCommodity || 'Price Trends'
            }
          </CardTitle>
          <CardDescription>
            {chartType === 'line' ? 'Line chart showing price trends over time' : 'Bar chart showing price trends over time'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="h-80 flex items-center justify-center">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground">Loading chart data...</p>
              </div>
            </div>
          ) : processedChartData.length > 0 ? (
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                {chartType === 'line' ? (
                  <LineChart data={processedChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="date" 
                      tick={{ fontSize: 12 }}
                      angle={-45}
                      textAnchor="end"
                      height={60}
                    />
                    <YAxis 
                      tick={{ fontSize: 12 }}
                      tickFormatter={(value) => `₹${value}`}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Line 
                      type="monotone" 
                      dataKey="price" 
                      stroke="#3b82f6" 
                      strokeWidth={2}
                      dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                      activeDot={{ r: 6, stroke: '#3b82f6', strokeWidth: 2 }}
                    />
                  </LineChart>
                ) : (
                  <BarChart data={processedChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="date" 
                      tick={{ fontSize: 12 }}
                      angle={-45}
                      textAnchor="end"
                      height={60}
                    />
                    <YAxis 
                      tick={{ fontSize: 12 }}
                      tickFormatter={(value) => `₹${value}`}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar 
                      dataKey="price" 
                      fill="#3b82f6"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                )}
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-80 flex flex-col items-center justify-center text-center">
              <BarChart3 className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Data Available</h3>
              <p className="text-muted-foreground max-w-md mb-4">
                {commodities.length === 0 
                  ? "No price history data available. Visit the Live Prices tab and click 'Refresh Data' to start collecting data."
                  : "No data available for the selected commodity and location combination. Try refreshing the data."
                }
              </p>
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg max-w-md">
                <p className="text-sm text-blue-800 font-medium mb-2">💡 How to get data:</p>
                <ol className="text-sm text-blue-700 text-left space-y-1">
                  <li>1. Click "Refresh Data" button above</li>
                  <li>2. Select a commodity from the dropdown</li>
                  <li>3. Choose a location (optional)</li>
                  <li>4. View your price trends chart</li>
                </ol>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Data Summary */}
      {dataSummary.totalEntries > 0 && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm font-medium text-green-800">
                  📊 Data Summary
                </p>
                <p className="text-xs text-green-600">
                  {dataSummary.totalEntries} price points • {dataSummary.commodities} commodities • {dataSummary.locations} locations
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}