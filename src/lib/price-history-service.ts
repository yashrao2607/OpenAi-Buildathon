"use client";

import { useState, useEffect, useCallback } from 'react';
import { MarketPriceService } from './firebase-service';

export interface PriceHistoryEntry {
  commodity: string;
  location: string;
  price: number;
  change: string;
  timestamp: string;
}

export interface PriceHistoryData {
  [key: string]: PriceHistoryEntry[];
}

class PriceHistoryService {
  private static instance: PriceHistoryService;
  private cache: PriceHistoryData = {};
  private lastFetchTime: number = 0;
  private cacheExpiry = 5 * 60 * 1000; // 5 minutes

  private constructor() {}

  static getInstance(): PriceHistoryService {
    if (!PriceHistoryService.instance) {
      PriceHistoryService.instance = new PriceHistoryService();
    }
    return PriceHistoryService.instance;
  }

  async storePriceData(marketData: any[]): Promise<void> {
    try {
      // Convert market data to Firebase format
      const firebaseData = marketData.map(item => ({
        commodity: item.commodity,
        location: item.location,
        price: item.price,
        change: item.change,
        changePercent: item.change,
        timestamp: new Date().toISOString()
      }));

      // Store in Firebase
      await MarketPriceService.storeMarketPrices(firebaseData);
      
      // Update local cache
      this.updateLocalCache(marketData);
      
      console.log('Price data stored successfully to Firebase');
    } catch (error) {
      console.error('Error storing price data to Firebase:', error);
      // Fallback to local cache update only
      this.updateLocalCache(marketData);
    }
  }

  private updateLocalCache(marketData: any[]): void {
    const newEntries: PriceHistoryEntry[] = marketData.map(item => ({
      commodity: item.commodity,
      location: item.location,
      price: parseFloat(item.price) || 0,
      change: item.change,
      timestamp: new Date().toISOString()
    }));

    // Update cache
    newEntries.forEach(entry => {
      const key = `${entry.commodity}-${entry.location}`;
      if (!this.cache[key]) {
        this.cache[key] = [];
      }
      
      // Add new entry
      this.cache[key].push(entry);
      
      // Keep only last 100 entries per commodity-location
      if (this.cache[key].length > 100) {
        this.cache[key] = this.cache[key].slice(-100);
      }
    });
  }

  async getStoredData(): Promise<PriceHistoryData> {
    try {
      // Check if cache is still valid
      const now = Date.now();
      if (this.lastFetchTime && (now - this.lastFetchTime) < this.cacheExpiry) {
        return this.cache;
      }

      // Fetch from Firebase
      const result = await MarketPriceService.getRecentMarketPrices(500); // Get more data for trends
      
      if (result.success && result.data.length > 0) {
        // Convert Firebase data to our format
        const groupedData: PriceHistoryData = {};
        
        result.data.forEach(item => {
          const key = `${item.commodity}-${item.location}`;
          if (!groupedData[key]) {
            groupedData[key] = [];
          }
          
          groupedData[key].push({
            commodity: item.commodity,
            location: item.location,
            price: parseFloat(item.price) || 0,
            change: item.change,
            timestamp: item.timestamp
          });
        });

        // Sort entries by timestamp
        Object.keys(groupedData).forEach(key => {
          groupedData[key].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
        });

        this.cache = groupedData;
        this.lastFetchTime = now;
      }
      
      return this.cache;
    } catch (error) {
      console.error('Error retrieving stored data:', error);
      return this.cache; // Return cached data as fallback
    }
  }

  async getPriceHistory(commodity: string, location?: string): Promise<PriceHistoryEntry[]> {
    const data = await this.getStoredData();
    
    if (location) {
      const key = `${commodity}-${location}`;
      return data[key] || [];
    } else {
      // Get all entries for the commodity across all locations
      const allEntries: PriceHistoryEntry[] = [];
      Object.keys(data).forEach(key => {
        if (key.startsWith(`${commodity}-`)) {
          allEntries.push(...data[key]);
        }
      });
      
      // Sort by timestamp
      return allEntries.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    }
  }

  async getAllCommodities(): Promise<string[]> {
    const data = await this.getStoredData();
    const commodities = new Set<string>();
    
    Object.keys(data).forEach(key => {
      const commodity = key.split('-')[0];
      commodities.add(commodity);
    });
    
    return Array.from(commodities);
  }

  async getLocationsForCommodity(commodity: string): Promise<string[]> {
    const data = await this.getStoredData();
    const locations = new Set<string>();
    
    Object.keys(data).forEach(key => {
      if (key.startsWith(`${commodity}-`)) {
        const location = key.split('-').slice(1).join('-');
        locations.add(location);
      }
    });
    
    return Array.from(locations);
  }

  async getDataSummary(): Promise<{ totalEntries: number; commodities: number; locations: number }> {
    const data = await this.getStoredData();
    let totalEntries = 0;
    const commodities = new Set<string>();
    const locations = new Set<string>();
    
    Object.keys(data).forEach(key => {
      const [commodity, ...locationParts] = key.split('-');
      const location = locationParts.join('-');
      
      commodities.add(commodity);
      locations.add(location);
      totalEntries += data[key].length;
    });
    
    return {
      totalEntries,
      commodities: commodities.size,
      locations: locations.size
    };
  }

  async clearAllData(): Promise<void> {
    try {
      // Clear local cache
      this.cache = {};
      this.lastFetchTime = 0;
      
      // Note: We don't clear Firebase data as it might be used by other users
      // In a real app, you might want to implement admin functionality for this
      console.log('Local price history cache cleared');
    } catch (error) {
      console.error('Error clearing data:', error);
    }
  }
}

export const priceHistoryService = PriceHistoryService.getInstance();

// Hook for using price history
export function usePriceHistory() {
  const [data, setData] = useState<PriceHistoryData>({});
  const [isLoading, setIsLoading] = useState(false);
  const [commodities, setCommodities] = useState<string[]>([]);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const storedData = await priceHistoryService.getStoredData();
      setData(storedData);
      
      // Also load commodities for immediate use
      const commoditiesList = await priceHistoryService.getAllCommodities();
      setCommodities(commoditiesList);
    } catch (error) {
      console.error('Error loading price history:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const storeData = useCallback(async (marketData: any[]) => {
    setIsLoading(true);
    try {
      await priceHistoryService.storePriceData(marketData);
      // Reload data after storing
      await loadData();
    } catch (error) {
      console.error('Error storing price data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [loadData]);

  const getPriceHistory = useCallback(async (commodity: string, location?: string) => {
    try {
      return await priceHistoryService.getPriceHistory(commodity, location);
    } catch (error) {
      console.error('Error getting price history:', error);
      return [];
    }
  }, []);

  const getAllCommodities = useCallback(async () => {
    try {
      const commoditiesList = await priceHistoryService.getAllCommodities();
      setCommodities(commoditiesList);
      return commoditiesList;
    } catch (error) {
      console.error('Error getting commodities:', error);
      return commodities; // Return cached commodities as fallback
    }
  }, [commodities]);

  const getLocationsForCommodity = useCallback(async (commodity: string) => {
    try {
      return await priceHistoryService.getLocationsForCommodity(commodity);
    } catch (error) {
      console.error('Error getting locations:', error);
      return [];
    }
  }, []);

  const getDataSummary = useCallback(async () => {
    try {
      return await priceHistoryService.getDataSummary();
    } catch (error) {
      console.error('Error getting data summary:', error);
      return { totalEntries: 0, commodities: 0, locations: 0 };
    }
  }, []);

  const clearAllData = useCallback(async () => {
    setIsLoading(true);
    try {
      await priceHistoryService.clearAllData();
      setData({});
      setCommodities([]);
    } catch (error) {
      console.error('Error clearing data:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    data,
    isLoading,
    commodities, // Provide commodities directly from state
    storeData,
    getPriceHistory,
    getAllCommodities,
    getLocationsForCommodity,
    getDataSummary,
    clearAllData,
  };
}
