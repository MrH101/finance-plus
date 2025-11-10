import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import api from '../../services/api';

interface Transaction {
  id: number | string;
  type: string;
  amount: number;
  description: string;
  date: string;
  category?: string;
  source?: string;
  status?: string;
}

interface TransactionState {
  transactions: Transaction[];
  loading: boolean;
  error: string | null;
}

const initialState: TransactionState = {
  transactions: [],
  loading: false,
  error: null,
};

// Async thunks
export const fetchTransactions = createAsyncThunk(
  'transaction/fetchTransactions',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/bank-transactions/');
      return response.data.results || response.data || [];
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch transactions');
    }
  }
);

export const addTransaction = createAsyncThunk(
  'transaction/addTransaction',
  async (transactionData: any, { rejectWithValue }) => {
    try {
      const response = await api.post('/bank-transactions/', transactionData);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to add transaction');
    }
  }
);

export const updateTransaction = createAsyncThunk(
  'transaction/updateTransaction',
  async ({ id, data }: { id: number; data: any }, { rejectWithValue }) => {
    try {
      const response = await api.patch(`/bank-transactions/${id}/`, data);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to update transaction');
    }
  }
);

export const deleteTransaction = createAsyncThunk(
  'transaction/deleteTransaction',
  async (id: number, { rejectWithValue }) => {
    try {
      await api.delete(`/bank-transactions/${id}/`);
      return id;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to delete transaction');
    }
  }
);

const transactionSlice = createSlice({
  name: 'transaction',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setTransactions: (state, action: PayloadAction<Transaction[]>) => {
      state.transactions = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch transactions
      .addCase(fetchTransactions.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTransactions.fulfilled, (state, action) => {
        state.loading = false;
        state.transactions = action.payload as Transaction[];
      })
      .addCase(fetchTransactions.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Add transaction
      .addCase(addTransaction.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addTransaction.fulfilled, (state, action) => {
        state.loading = false;
        state.transactions.unshift(action.payload as Transaction);
      })
      .addCase(addTransaction.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Update transaction
      .addCase(updateTransaction.fulfilled, (state, action) => {
        const updated = action.payload as Transaction;
        const index = state.transactions.findIndex(t => t.id === updated.id);
        if (index !== -1) {
          state.transactions[index] = updated;
        }
      })
      // Delete transaction
      .addCase(deleteTransaction.fulfilled, (state, action) => {
        state.transactions = state.transactions.filter(t => t.id !== action.payload);
      });
  },
});

export const { clearError, setTransactions } = transactionSlice.actions;
export default transactionSlice.reducer;
