import { NextRequest, NextResponse } from 'next/server';
import { TransactionService } from '@/lib/firebase-service';

interface MiddlemanOffer {
  id: string;
  listingId: string;
  middlemanId: string;
  middlemanName: string;
  offeredPrice: number;
  message: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: string;
}

interface CropListing {
  id: string;
  cropName: string;
  quantity: number;
  unit: string;
  quality: string;
  location: string;
  expectedPrice: number;
  marketPrice: number;
  harvestDate: string;
  description: string;
  farmerId: string;
  farmerName: string;
  status: 'pending' | 'negotiating' | 'sold' | 'cancelled';
  createdAt: string;
  negotiations?: MiddlemanOffer[];
}

// Mock data - in a real app, this would come from a database
const mockListings: CropListing[] = [
  {
    id: '1',
    cropName: 'Wheat',
    quantity: 100,
    unit: 'quintal',
    quality: 'premium',
    location: 'Pune, Maharashtra',
    expectedPrice: 2500,
    marketPrice: 2450,
    harvestDate: '2024-03-15',
    description: 'High quality wheat ready for harvest',
    farmerId: 'farmer1',
    farmerName: 'Rajesh Kumar',
    status: 'pending',
    createdAt: new Date().toISOString(),
    negotiations: []
  },
  {
    id: '2',
    cropName: 'Rice',
    quantity: 50,
    unit: 'quintal',
    quality: 'good',
    location: 'Aurangabad, Maharashtra',
    expectedPrice: 3200,
    marketPrice: 3150,
    harvestDate: '2024-03-20',
    description: 'Organic rice from sustainable farming',
    farmerId: 'farmer2',
    farmerName: 'Priya Sharma',
    status: 'pending',
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    negotiations: []
  }
];

const mockMiddlemen = [
  {
    id: 'mid1',
    name: 'Rajesh Traders',
    location: 'Pune, Maharashtra',
    specialties: ['Wheat', 'Rice', 'Maize'],
    rating: 4.8,
    phone: '+91-9876543210'
  },
  {
    id: 'mid2',
    name: 'Amit Agri Solutions',
    location: 'Aurangabad, Maharashtra',
    specialties: ['Rice', 'Cotton', 'Sugarcane'],
    rating: 4.6,
    phone: '+91-9876543211'
  }
];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const listingId = searchParams.get('listingId');

    switch (action) {
      case 'listings':
        // Return available crop listings for middlemen
        return NextResponse.json({
          success: true,
          data: mockListings.filter(listing => listing.status === 'pending'),
          count: mockListings.filter(listing => listing.status === 'pending').length
        });

      case 'middlemen':
        // Return list of registered middlemen
        return NextResponse.json({
          success: true,
          data: mockMiddlemen,
          count: mockMiddlemen.length
        });

      case 'offers':
        // Return offers for a specific listing
        if (!listingId) {
          return NextResponse.json(
            { error: 'Listing ID is required' },
            { status: 400 }
          );
        }
        
        const listing = mockListings.find(l => l.id === listingId);
        return NextResponse.json({
          success: true,
          data: listing?.negotiations || [],
          count: listing?.negotiations?.length || 0
        });

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Error in middleman API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, listingId, middlemanId, middlemanName, offeredPrice, message } = body;

    switch (action) {
      case 'make_offer':
        if (!listingId || !middlemanId || !middlemanName || !offeredPrice || !message) {
          return NextResponse.json(
            { error: 'Missing required fields' },
            { status: 400 }
          );
        }

        // Find the listing and add the offer
        const listingIndex = mockListings.findIndex(l => l.id === listingId);
        if (listingIndex === -1) {
          return NextResponse.json(
            { error: 'Listing not found' },
            { status: 404 }
          );
        }

        const newOffer: MiddlemanOffer = {
          id: Date.now().toString(),
          listingId,
          middlemanId,
          middlemanName,
          offeredPrice,
          message,
          status: 'pending',
          createdAt: new Date().toISOString()
        };

        if (!mockListings[listingIndex].negotiations) {
          mockListings[listingIndex].negotiations = [];
        }
        
        mockListings[listingIndex].negotiations!.push(newOffer);
        mockListings[listingIndex].status = 'negotiating';

        return NextResponse.json({
          success: true,
          data: newOffer,
          message: 'Offer made successfully'
        });

      case 'respond_offer':
        const { offerId, response } = body;
        
        if (!offerId || !response) {
          return NextResponse.json(
            { error: 'Missing required fields' },
            { status: 400 }
          );
        }

        // Find and update the offer
        for (const listing of mockListings) {
          if (listing.negotiations) {
            const offerIndex = listing.negotiations.findIndex(o => o.id === offerId);
            if (offerIndex !== -1) {
              listing.negotiations[offerIndex].status = response;
              
              if (response === 'accepted') {
                listing.status = 'sold';
                // Reject all other offers
                listing.negotiations.forEach((offer, index) => {
                  if (index !== offerIndex) {
                    offer.status = 'rejected';
                  }
                });

                // Store transaction in Firebase
                try {
                  const transactionData = {
                    listingId: listing.id,
                    cropName: listing.cropName,
                    quantity: listing.quantity,
                    unit: listing.unit,
                    agreedPrice: listing.negotiations[offerIndex].offeredPrice,
                    farmerId: listing.farmerId,
                    farmerName: listing.farmerName,
                    middlemanId: listing.negotiations[offerIndex].middlemanId,
                    middlemanName: listing.negotiations[offerIndex].middlemanName,
                    status: 'pending_payment' as const,
                    expectedDelivery: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days from now
                  };

                  const storeResult = await TransactionService.storeTransaction(transactionData);
                  if (storeResult.success) {
                    console.log('Transaction stored in Firebase successfully');
                  }
                } catch (firebaseError) {
                  console.error('Failed to store transaction in Firebase:', firebaseError);
                  // Continue even if Firebase storage fails
                }
              }
              
              return NextResponse.json({
                success: true,
                data: listing.negotiations[offerIndex],
                message: `Offer ${response} successfully`
              });
            }
          }
        }

        return NextResponse.json(
          { error: 'Offer not found' },
          { status: 404 }
        );

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Error in middleman API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
