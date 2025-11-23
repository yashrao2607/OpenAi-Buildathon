import { NextRequest, NextResponse } from 'next/server';
import { MarketPriceService } from '@/lib/firebase-service';

// Mock data for testing when scraping fails
const mockData = [
  {
    timestamp: new Date().toLocaleString(),
    commodity: 'Wheat',
    location: 'Delhi',
    time: '14:30',
    price: '2,450',
    change: '+25',
    changePercent: '+1.03'
  },
  {
    timestamp: new Date().toLocaleString(),
    commodity: 'Rice',
    location: 'Mumbai',
    time: '14:30',
    price: '3,200',
    change: '-15',
    changePercent: '-0.47'
  },
  {
    timestamp: new Date().toLocaleString(),
    commodity: 'Maize',
    location: 'Karnataka',
    time: '14:30',
    price: '1,850',
    change: '+10',
    changePercent: '+0.54'
  },
  {
    timestamp: new Date().toLocaleString(),
    commodity: 'Pulses',
    location: 'Rajasthan',
    time: '14:30',
    price: '4,100',
    change: '+30',
    changePercent: '+0.74'
  },
  {
    timestamp: new Date().toLocaleString(),
    commodity: 'Cotton',
    location: 'Gujarat',
    time: '14:30',
    price: '6,750',
    change: '-45',
    changePercent: '-0.66'
  }
];

export async function GET(request: NextRequest) {
  try {
    // Try to use Puppeteer for real scraping
    let puppeteer: any;
    
    try {
      // Dynamic import to avoid build-time issues
      if (!puppeteer) {
        puppeteer = await import('puppeteer');
      }

      const browser = await puppeteer.default.launch({
        headless: 'new',
        args: [
          '--no-sandbox', 
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu'
        ],
      });

      const page = await browser.newPage();
      
      // Set a reasonable timeout
      page.setDefaultTimeout(30000);
      
      await page.goto('https://www.ncdex.com/markets/livespot', {
        waitUntil: 'networkidle2',
      });

      // Wait for the table to load
      await page.waitForSelector('table.table', { timeout: 10000 });

      const data = await page.evaluate(() => {
        const rows = Array.from(document.querySelectorAll('table.table tbody tr'));
        return rows.map(row => {
          const cols = row.querySelectorAll('td');
          const change = cols[5]?.innerText.trim() || '';
          const changeValue = parseFloat(change.replace(/[^\d.-]/g, ''));
          const price = cols[4]?.innerText.trim() || '';
          const priceValue = parseFloat(price.replace(/[^\d.-]/g, ''));
          const changePercent = priceValue && changeValue ? ((changeValue / priceValue) * 100).toFixed(2) : '0.00';
          
          return {
            timestamp: new Date().toLocaleString(),
            commodity: cols[0]?.innerText.trim() || '',
            location: cols[2]?.innerText.trim() || '',
            time: cols[3]?.innerText.trim() || '',
            price: price,
            change: change,
            changePercent: `${changeValue >= 0 ? '+' : ''}${changePercent}`
          };
        }).filter(item => item.commodity && item.price); // Filter out empty rows
      });

      await browser.close();

      // If we got real data, store it in Firebase and return it
      if (data && data.length > 0) {
        // Store in Firebase
        try {
          const storeResult = await MarketPriceService.storeMarketPrices(data);
          if (storeResult.success) {
            console.log('Market prices stored in Firebase successfully');
          }
        } catch (firebaseError) {
          console.error('Failed to store in Firebase:', firebaseError);
          // Continue even if Firebase storage fails
        }

        return NextResponse.json({
          success: true,
          data,
          timestamp: new Date().toISOString(),
          count: data.length,
          source: 'NCDEX Live'
        });
      }
    } catch (scrapingError) {
      console.log('Scraping failed, using mock data:', scrapingError instanceof Error ? scrapingError.message : String(scrapingError));
    }

    // Fallback to mock data
    // Store mock data in Firebase as well
    try {
      const storeResult = await MarketPriceService.storeMarketPrices(mockData);
      if (storeResult.success) {
        console.log('Mock market prices stored in Firebase successfully');
      }
    } catch (firebaseError) {
      console.error('Failed to store mock data in Firebase:', firebaseError);
    }

    return NextResponse.json({
      success: true,
      data: mockData,
      timestamp: new Date().toISOString(),
      count: mockData.length,
      source: 'Mock Data (Scraping Unavailable)'
    });

  } catch (error) {
    console.error('Market prices API error:', error);
    
    // Return mock data even on complete failure
    return NextResponse.json({
      success: true,
      data: mockData,
      timestamp: new Date().toISOString(),
      count: mockData.length,
      source: 'Mock Data (Error Fallback)'
    });
  }
}
