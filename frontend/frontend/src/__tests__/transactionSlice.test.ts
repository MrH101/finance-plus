import { describe, it, expect } from 'vitest';
import transactionReducer, {
  setTransactions,
  addTransaction,
  updateTransaction,
  deleteTransaction,
  setLoading,
  setError,
  setFilters,
  clearFilters,
  type Transaction,
} from '../store/slices/transactionSlice';

describe('Transaction Slice', () => {
  const initialState = {
    transactions: [],
    loading: false,
    error: null,
    filters: {
      type: 'all' as const,
      dateRange: {
        start: null,
        end: null,
      },
      category: null,
    },
  };

  const mockTransactions: Transaction[] = [
    {
      id: '1',
      type: 'income',
      amount: 1000,
      category: 'Salary',
      description: 'Monthly salary',
      date: '2024-03-01',
      status: 'completed',
    },
    {
      id: '2',
      type: 'expense',
      amount: 500,
      category: 'Rent',
      description: 'Monthly rent',
      date: '2024-03-02',
      status: 'completed',
    },
  ];

  it('should handle initial state', () => {
    expect(transactionReducer(undefined, { type: 'unknown' })).toEqual(initialState);
  });

  it('should handle setTransactions', () => {
    const actual = transactionReducer(initialState, setTransactions(mockTransactions));
    expect(actual.transactions).toEqual(mockTransactions);
  });

  it('should handle addTransaction', () => {
    const newTransaction: Transaction = {
      id: '3',
      type: 'expense',
      amount: 200,
      category: 'Groceries',
      description: 'Weekly groceries',
      date: '2024-03-03',
      status: 'completed',
    };
    const actual = transactionReducer(
      { ...initialState, transactions: mockTransactions },
      addTransaction(newTransaction)
    );
    expect(actual.transactions).toHaveLength(3);
    expect(actual.transactions).toContain(newTransaction);
  });

  it('should handle updateTransaction', () => {
    const updatedTransaction: Transaction = {
      ...mockTransactions[0],
      amount: 1500,
      description: 'Updated salary',
    };
    const actual = transactionReducer(
      { ...initialState, transactions: mockTransactions },
      updateTransaction(updatedTransaction)
    );
    expect(actual.transactions[0]).toEqual(updatedTransaction);
    expect(actual.transactions[1]).toEqual(mockTransactions[1]);
  });

  it('should handle deleteTransaction', () => {
    const actual = transactionReducer(
      { ...initialState, transactions: mockTransactions },
      deleteTransaction('1')
    );
    expect(actual.transactions).toHaveLength(1);
    expect(actual.transactions[0]).toEqual(mockTransactions[1]);
  });

  it('should handle setLoading', () => {
    const actual = transactionReducer(initialState, setLoading(true));
    expect(actual.loading).toBe(true);
  });

  it('should handle setError', () => {
    const errorMessage = 'Failed to fetch transactions';
    const actual = transactionReducer(initialState, setError(errorMessage));
    expect(actual.error).toBe(errorMessage);
  });

  it('should handle setFilters', () => {
    const newFilters = {
      type: 'income' as const,
      dateRange: {
        start: '2024-03-01',
        end: '2024-03-31',
      },
      category: 'Salary',
    };
    const actual = transactionReducer(initialState, setFilters(newFilters));
    expect(actual.filters).toEqual(newFilters);
  });

  it('should handle clearFilters', () => {
    const stateWithFilters = {
      ...initialState,
      filters: {
        type: 'income' as const,
        dateRange: {
          start: '2024-03-01',
          end: '2024-03-31',
        },
        category: 'Salary',
      },
    };
    const actual = transactionReducer(stateWithFilters, clearFilters());
    expect(actual.filters).toEqual(initialState.filters);
  });
}); 