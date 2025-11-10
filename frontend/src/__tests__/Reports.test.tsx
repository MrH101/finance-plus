import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import Reports from '../pages/Reports';
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
  {
    id: '3',
    type: 'expense',
    amount: 200,
    category: 'Groceries',
    description: 'Weekly groceries',
    date: '2024-03-03',
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

describe('Reports Page', () => {
  const mockUseApi = {
    data: mockTransactions,
    loading: false,
    error: null,
    get: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (useApi as unknown as ReturnType<typeof vi.fn>).mockReturnValue(mockUseApi);
  });

  const renderReports = () => {
    return render(
      <Provider store={testStore}>
        <BrowserRouter>
          <Reports />
        </BrowserRouter>
      </Provider>
    );
  };

  it('renders financial summary cards', () => {
    renderReports();

    expect(screen.getByText('Total Income')).toBeInTheDocument();
    expect(screen.getByText('Total Expenses')).toBeInTheDocument();
    expect(screen.getByText('Net Balance')).toBeInTheDocument();

    expect(screen.getByText('$1,000.00')).toBeInTheDocument(); // Total Income
    expect(screen.getByText('$700.00')).toBeInTheDocument(); // Total Expenses
    expect(screen.getByText('$300.00')).toBeInTheDocument(); // Balance
  });

  it('renders time range selector', () => {
    renderReports();

    const timeRangeSelect = screen.getByRole('combobox');
    expect(timeRangeSelect).toBeInTheDocument();
    expect(screen.getByText('Last Week')).toBeInTheDocument();
    expect(screen.getByText('Last Month')).toBeInTheDocument();
    expect(screen.getByText('Last Year')).toBeInTheDocument();
  });

  it('changes time range when selecting different options', async () => {
    renderReports();

    const timeRangeSelect = screen.getByRole('combobox');
    fireEvent.change(timeRangeSelect, { target: { value: 'week' } });

    await waitFor(() => {
      expect(timeRangeSelect).toHaveValue('week');
    });
  });

  it('displays category breakdown', () => {
    renderReports();

    expect(screen.getByText('Category Breakdown')).toBeInTheDocument();
    expect(screen.getByText('Salary')).toBeInTheDocument();
    expect(screen.getByText('Rent')).toBeInTheDocument();
    expect(screen.getByText('Groceries')).toBeInTheDocument();
  });

  it('shows loading state', () => {
    (useApi as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      ...mockUseApi,
      loading: true,
    });

    renderReports();
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('shows error state', () => {
    const errorMessage = 'Failed to load transactions';
    (useApi as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      ...mockUseApi,
      error: errorMessage,
    });

    renderReports();
    expect(screen.getByText(`Error loading reports: ${errorMessage}`)).toBeInTheDocument();
  });
}); 