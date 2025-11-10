import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import Transactions from '../pages/Transactions';
import { useApi } from '../hooks/useApi';
import transactionReducer from '../store/slices/transactionSlice';
import type { Transaction } from '../store/slices/transactionSlice';

// Mock the useApi hook
vi.mock('../hooks/useApi', () => ({
  useApi: vi.fn(),
}));

// Mock the useNotification hook
vi.mock('../hooks/useNotification', () => ({
  useNotification: vi.fn(() => ({
    showNotification: vi.fn(),
  })),
}));

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

const testStore = configureStore({
  reducer: {
    transactions: transactionReducer,
  },
  preloadedState: {
    transactions: {
      transactions: mockTransactions,
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
    },
  },
});

describe('Transactions Page', () => {
  const mockUseApi = {
    data: mockTransactions,
    loading: false,
    error: null,
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (useApi as unknown as ReturnType<typeof vi.fn>).mockReturnValue(mockUseApi);
  });

  const renderTransactions = () => {
    return render(
      <Provider store={testStore}>
        <BrowserRouter>
          <Transactions />
        </BrowserRouter>
      </Provider>
    );
  };

  it('renders transactions table with data', async () => {
    renderTransactions();

    // Check if the table headers are rendered
    expect(screen.getByText('Date')).toBeInTheDocument();
    expect(screen.getByText('Type')).toBeInTheDocument();
    expect(screen.getByText('Category')).toBeInTheDocument();
    expect(screen.getByText('Description')).toBeInTheDocument();
    expect(screen.getByText('Amount')).toBeInTheDocument();
    expect(screen.getByText('Status')).toBeInTheDocument();
    expect(screen.getByText('Actions')).toBeInTheDocument();

    // Check if the transaction data is rendered
    expect(screen.getByText('Salary')).toBeInTheDocument();
    expect(screen.getByText('Monthly salary')).toBeInTheDocument();
    expect(screen.getByText('$1,000.00')).toBeInTheDocument();
    expect(screen.getByText('Completed')).toBeInTheDocument();

    expect(screen.getByText('Rent')).toBeInTheDocument();
    expect(screen.getByText('Monthly rent')).toBeInTheDocument();
    expect(screen.getByText('$500.00')).toBeInTheDocument();
  });

  it('shows loading state', () => {
    (useApi as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      ...mockUseApi,
      loading: true,
    });

    renderTransactions();
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('shows error state', () => {
    const errorMessage = 'Failed to load transactions';
    (useApi as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      ...mockUseApi,
      error: errorMessage,
    });

    renderTransactions();
    expect(screen.getByText(`Error loading transactions: ${errorMessage}`)).toBeInTheDocument();
  });

  it('opens add transaction modal when clicking add button', async () => {
    renderTransactions();

    const addButton = screen.getByText('Add Transaction');
    fireEvent.click(addButton);

    await waitFor(() => {
      expect(screen.getByText('Add Transaction')).toBeInTheDocument();
      expect(screen.getByLabelText('Type')).toBeInTheDocument();
      expect(screen.getByLabelText('Amount')).toBeInTheDocument();
      expect(screen.getByLabelText('Category')).toBeInTheDocument();
      expect(screen.getByLabelText('Description')).toBeInTheDocument();
      expect(screen.getByLabelText('Date')).toBeInTheDocument();
      expect(screen.getByLabelText('Status')).toBeInTheDocument();
    });
  });

  it('handles transaction deletion', async () => {
    window.confirm = vi.fn(() => true);
    renderTransactions();

    const deleteButtons = screen.getAllByTestId('delete-button');
    fireEvent.click(deleteButtons[0]);

    await waitFor(() => {
      expect(window.confirm).toHaveBeenCalledWith('Are you sure you want to delete this transaction?');
      expect(mockUseApi.delete).toHaveBeenCalledWith('/transactions/1', expect.any(Object));
      expect(mockUseApi.get).toHaveBeenCalledWith('/transactions');
    });
  });
}); 