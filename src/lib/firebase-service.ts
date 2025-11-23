import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  orderBy, 
  limit, 
  where, 
  doc, 
  updateDoc, 
  deleteDoc, 
  Timestamp,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from './firebase-config';

// Market Price Data Interface
export interface MarketPriceData {
  id?: string;
  commodity: string;
  price: string;
  location: string;
  timestamp: string;
  change: string;
  changePercent: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Transaction Data Interface
export interface TransactionData {
  id?: string;
  listingId: string;
  cropName: string;
  quantity: number;
  unit: string;
  agreedPrice: number;
  farmerId: string;
  farmerName: string;
  middlemanId: string;
  middlemanName: string;
  status: 'pending_payment' | 'payment_received' | 'in_transit' | 'delivered' | 'completed' | 'cancelled';
  createdAt: Timestamp;
  updatedAt: Timestamp;
  expectedDelivery?: string;
  trackingInfo?: {
    currentLocation: string;
    estimatedDelivery: string;
    deliveryPerson: string;
    contact: string;
  };
  paymentInfo?: {
    amount: number;
    method: string;
    transactionId: string;
    paidAt: string;
  };
}

// Market Price Service
export class MarketPriceService {
  private static collectionName = 'marketPrices';

  // Store market price data
  static async storeMarketPrices(marketData: Omit<MarketPriceData, 'id' | 'createdAt' | 'updatedAt'>[]) {
    try {
      const batch = marketData.map(data => ({
        ...data,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      }));

      // Store each price data
      const promises = batch.map(data => addDoc(collection(db, this.collectionName), data));
      await Promise.all(promises);
      
      console.log('Market prices stored successfully');
      return { success: true };
    } catch (error) {
      console.error('Error storing market prices:', error);
      return { success: false, error };
    }
  }

  // Get recent market prices
  static async getRecentMarketPrices(limitCount: number = 50) {
    try {
      const q = query(
        collection(db, this.collectionName),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );
      
      const querySnapshot = await getDocs(q);
      const prices: MarketPriceData[] = [];
      
      querySnapshot.forEach((doc) => {
        prices.push({
          id: doc.id,
          ...doc.data()
        } as MarketPriceData);
      });
      
      return { success: true, data: prices };
    } catch (error) {
      console.error('Error fetching market prices:', error);
      return { success: false, error, data: [] };
    }
  }

  // Get market price history for a specific commodity
  static async getCommodityHistory(commodity: string, days: number = 30) {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      
      const q = query(
        collection(db, this.collectionName),
        where('commodity', '==', commodity),
        where('createdAt', '>=', Timestamp.fromDate(startDate)),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const prices: MarketPriceData[] = [];
      
      querySnapshot.forEach((doc) => {
        prices.push({
          id: doc.id,
          ...doc.data()
        } as MarketPriceData);
      });
      
      return { success: true, data: prices };
    } catch (error) {
      console.error('Error fetching commodity history:', error);
      return { success: false, error, data: [] };
    }
  }
}

// Transaction Service
export class TransactionService {
  private static collectionName = 'transactions';

  // Store transaction
  static async storeTransaction(transactionData: Omit<TransactionData, 'id' | 'createdAt' | 'updatedAt'>) {
    try {
      const docRef = await addDoc(collection(db, this.collectionName), {
        ...transactionData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      console.log('Transaction stored successfully with ID:', docRef.id);
      return { success: true, id: docRef.id };
    } catch (error) {
      console.error('Error storing transaction:', error);
      return { success: false, error };
    }
  }

  // Update transaction status
  static async updateTransactionStatus(transactionId: string, status: TransactionData['status'], additionalData?: Partial<TransactionData>) {
    try {
      const transactionRef = doc(db, this.collectionName, transactionId);
      await updateDoc(transactionRef, {
        status,
        ...additionalData,
        updatedAt: serverTimestamp()
      });
      
      console.log('Transaction updated successfully');
      return { success: true };
    } catch (error) {
      console.error('Error updating transaction:', error);
      return { success: false, error };
    }
  }

  // Get user transactions
  static async getUserTransactions(userId: string, userType: 'farmer' | 'middleman') {
    try {
      const fieldName = userType === 'farmer' ? 'farmerId' : 'middlemanId';
      const q = query(
        collection(db, this.collectionName),
        where(fieldName, '==', userId),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const transactions: TransactionData[] = [];
      
      querySnapshot.forEach((doc) => {
        transactions.push({
          id: doc.id,
          ...doc.data()
        } as TransactionData);
      });
      
      return { success: true, data: transactions };
    } catch (error) {
      console.error('Error fetching user transactions:', error);
      return { success: false, error, data: [] };
    }
  }

  // Get recent transactions (for history view)
  static async getRecentTransactions(limitCount: number = 100) {
    try {
      const q = query(
        collection(db, this.collectionName),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );
      
      const querySnapshot = await getDocs(q);
      const transactions: TransactionData[] = [];
      
      querySnapshot.forEach((doc) => {
        transactions.push({
          id: doc.id,
          ...doc.data()
        } as TransactionData);
      });
      
      return { success: true, data: transactions };
    } catch (error) {
      console.error('Error fetching recent transactions:', error);
      return { success: false, error, data: [] };
    }
  }

  // Get transaction statistics
  static async getTransactionStats(userId?: string) {
    try {
      let q = query(collection(db, this.collectionName));
      
      if (userId) {
        q = query(
          collection(db, this.collectionName),
          where('farmerId', '==', userId)
        );
      }
      
      const querySnapshot = await getDocs(q);
      const stats = {
        total: 0,
        completed: 0,
        pending: 0,
        cancelled: 0,
        totalValue: 0
      };
      
      querySnapshot.forEach((doc) => {
        const data = doc.data() as TransactionData;
        stats.total++;
        
        if (data.status === 'completed') stats.completed++;
        else if (data.status === 'pending_payment' || data.status === 'payment_received' || data.status === 'in_transit') stats.pending++;
        else if (data.status === 'cancelled') stats.cancelled++;
        
        stats.totalValue += data.agreedPrice * data.quantity;
      });
      
      return { success: true, data: stats };
    } catch (error) {
      console.error('Error fetching transaction stats:', error);
      return { success: false, error, data: null };
    }
  }
}
