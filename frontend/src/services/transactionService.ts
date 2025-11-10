import api from './api';
import { ENDPOINTS } from './api';

export interface Transaction {
  id: string;
  description: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  date: string;
  created_at?: string;
  updated_at?: string;
  account_type?: 'bank' | 'mobile' | 'cash' | 'pos' | 'purchase';
  account_id?: number;
  account_name?: string;
  reference?: string;
  status?: string;
  transaction_type?: string;
  payment_method?: string;
  value_date?: string;
}

export interface CreateTransactionData {
  description: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  date: string;
}

export interface UpdateTransactionData extends Partial<CreateTransactionData> {
  id: string;
}

export const transactionService = {
  // Get all transactions (unified endpoint)
  async getTransactions(params?: {
    type?: 'all' | 'income' | 'expense';
    account_type?: 'all' | 'bank' | 'mobile' | 'cash' | 'pos' | 'purchase';
    start_date?: string;
    end_date?: string;
  }): Promise<Transaction[]> {
    const response = await api.get<{ results: Transaction[]; count: number }>('/transactions/', { params });
    return response.data.results || [];
  },

  // Get transaction by ID (from unified transactions)
  async getTransaction(id: string, accountType?: string): Promise<Transaction | null> {
    // Extract the actual ID and type from the unified transaction ID
    // Format: "bank_123", "mobile_456", "pos_789", etc.
    const [type, actualId] = id.split('_');
    
    try {
      if (type === 'bank') {
        const response = await api.get<Transaction>(`/bank-transactions/${actualId}/`);
        return response.data as any;
      } else if (type === 'mobile') {
        const response = await api.get<Transaction>(`/mobile-money-transactions/${actualId}/`);
        return response.data as any;
      }
      // POS and Purchase transactions are read-only, return null to indicate they can't be fetched individually
      return null;
    } catch (error) {
      console.error('Error fetching transaction:', error);
      return null;
    }
  },

  // Create new transaction
  async createTransaction(data: any, accountType: 'bank' | 'mobile' = 'bank'): Promise<Transaction> {
    if (accountType === 'bank') {
      const response = await api.post<Transaction>('/bank-transactions/', data);
      return response.data as any;
    } else if (accountType === 'mobile') {
      const response = await api.post<Transaction>('/mobile-money-transactions/', data);
      return response.data as any;
    }
    throw new Error('Invalid account type for transaction creation');
  },

  // Update transaction
  async updateTransaction(id: string, data: any, accountType?: string): Promise<Transaction> {
    // Extract the actual ID and type from the unified transaction ID
    const [type, actualId] = id.split('_');
    
    if (type === 'bank') {
      const response = await api.put<Transaction>(`/bank-transactions/${actualId}/`, data);
      return response.data as any;
    } else if (type === 'mobile') {
      const response = await api.put<Transaction>(`/mobile-money-transactions/${actualId}/`, data);
      return response.data as any;
    }
    throw new Error('Cannot update this transaction type');
  },

  // Delete transaction
  async deleteTransaction(id: string, accountType?: string): Promise<void> {
    // Extract the actual ID and type from the unified transaction ID
    const [type, actualId] = id.split('_');
    
    if (type === 'bank') {
      await api.delete(`/bank-transactions/${actualId}/`);
    } else if (type === 'mobile') {
      await api.delete(`/mobile-money-transactions/${actualId}/`);
    } else {
      throw new Error('Cannot delete this transaction type');
    }
  },

  // Get transactions by date range
  async getTransactionsByDateRange(startDate: string, endDate: string): Promise<Transaction[]> {
    const response = await api.get<Transaction[]>('/bank-transactions/', {
      params: {
        start_date: startDate,
        end_date: endDate,
      },
    });
    return response.data as any;
  },

  // Get transactions by category
  async getTransactionsByCategory(category: string): Promise<Transaction[]> {
    const response = await api.get<Transaction[]>('/bank-transactions/', {
      params: {
        category,
      },
    });
    return response.data as any;
  },

  // Fetch budgets
  async fetchBudgets() {
    return api.get(ENDPOINTS.budgets);
  },

  // Create budget
  async createBudget(data: any) {
    return api.post(ENDPOINTS.budgets, data);
  },

  // Update budget
  async updateBudget(id: number, data: any) {
    return api.put(`${ENDPOINTS.budgets}${id}/`, data);
  },

  // Delete budget
  async deleteBudget(id: number) {
    return api.delete(`${ENDPOINTS.budgets}${id}/`);
  },

  // Fetch accounts payable
  async fetchAccountsPayable() {
    return api.get(ENDPOINTS.accountsPayable);
  },

  // Fetch accounts receivable
  async fetchAccountsReceivable() {
    return api.get(ENDPOINTS.accountsReceivable);
  },

  // Fetch ledger
  async fetchLedger() {
    return api.get(ENDPOINTS.ledger);
  },
};

export default transactionService; 