"use client";

import { useState, useEffect } from 'react';
import { MarketPrices } from '../dashboard/market-analyst/_components/market-prices';
import { PriceAlerts } from '../dashboard/market-analyst/_components/price-alerts';

export default function TestMarketPage() {
  const [apiStatus, setApiStatus] = useState<string>('Testing...');

  useEffect(() => {
    // Test the API endpoint
    fetch('/api/market-prices')
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          setApiStatus(`✅ API Working! Got ${data.count} items from ${data.source}`);
        } else {
          setApiStatus('❌ API Error: ' + data.error);
        }
      })
      .catch(error => {
        setApiStatus('❌ API Failed: ' + error.message);
      });
  }, []);

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">🧪 Market Integration Test</h1>
      
      <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h2 className="text-xl font-semibold mb-2">API Status</h2>
        <p className="text-sm">{apiStatus}</p>
      </div>

      <div className="grid gap-8">
        <div>
          <h2 className="text-2xl font-bold mb-4">📊 Market Prices Component Test</h2>
          <MarketPrices />
        </div>

        <div>
          <h2 className="text-2xl font-bold mb-4">🔔 Price Alerts Component Test</h2>
          <PriceAlerts />
        </div>
      </div>
    </div>
  );
}
