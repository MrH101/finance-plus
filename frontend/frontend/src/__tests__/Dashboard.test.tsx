import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import Dashboard from '../pages/Dashboard';
import transactionReducer from '../store/slices/transactionSlice';
import type { Transaction } from '../store/slices/transactionSlice';

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

const store = configureStore({
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

describe('Dashboard', () => {
  it('renders the dashboard title', () => {
    render(
      <Provider store={store}>
        <Dashboard />
      </Provider>
    );
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
  });

  it('displays total balance', () => {
    render(
      <Provider store={store}>
        <Dashboard />
      </Provider>
    );
    expect(screen.getByText('$300.00')).toBeInTheDocument();
  });

  it('displays total income', () => {
    render(
      <Provider store={store}>
        <Dashboard />
      </Provider>
    );
    expect(screen.getByText('$1,000.00')).toBeInTheDocument();
  });

  it('displays total expenses', () => {
    render(
      <Provider store={store}>
        <Dashboard />
      </Provider>
    );
    expect(screen.getByText('$700.00')).toBeInTheDocument();
  });

  it('displays recent transactions', () => {
    render(
      <Provider store={store}>
        <Dashboard />
      </Provider>
    );
    expect(screen.getByText('Monthly salary')).toBeInTheDocument();
    expect(screen.getByText('Monthly rent')).toBeInTheDocument();
    expect(screen.getByText('Weekly groceries')).toBeInTheDocument();
  });

  it('displays transaction amounts correctly', () => {
    render(
      <Provider store={store}>
        <Dashboard />
      </Provider>
    );
    expect(screen.getByText('+$1,000.00')).toBeInTheDocument();
    expect(screen.getByText('-$500.00')).toBeInTheDocument();
    expect(screen.getByText('-$200.00')).toBeInTheDocument();
  });
}); 