import { NextRequest, NextResponse } from 'next/server';
import { TransactionService } from '@/lib/firebase-service';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const userType = searchParams.get('userType') as 'farmer' | 'middleman';
    const limit = parseInt(searchParams.get('limit') || '100');

    if (userId && userType) {
      // Get user-specific transactions
      const result = await TransactionService.getUserTransactions(userId, userType);
      return NextResponse.json(result);
    } else {
      // Get recent transactions
      const result = await TransactionService.getRecentTransactions(limit);
      return NextResponse.json(result);
    }
  } catch (error) {
    console.error('Error fetching transactions:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, transactionData, transactionId, status, additionalData } = body;

    switch (action) {
      case 'create':
        if (!transactionData) {
          return NextResponse.json(
            { error: 'Transaction data is required' },
            { status: 400 }
          );
        }
        const createResult = await TransactionService.storeTransaction(transactionData);
        return NextResponse.json(createResult);

      case 'update_status':
        if (!transactionId || !status) {
          return NextResponse.json(
            { error: 'Transaction ID and status are required' },
            { status: 400 }
          );
        }
        const updateResult = await TransactionService.updateTransactionStatus(
          transactionId, 
          status, 
          additionalData
        );
        return NextResponse.json(updateResult);

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Error in transactions API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
