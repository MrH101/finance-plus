import { describe, it, expect } from 'vitest';
import { store } from '../store';
import { addNotification } from '../store/slices/notificationSlice';
import { setTheme } from '../store/slices/uiSlice';
import { addTransaction } from '../store/slices/transactionSlice';
import { loginSuccess } from '../store/slices/authSlice';

describe('Store', () => {
  it('should handle notification actions', () => {
    const notification = {
      type: 'success' as const,
      message: 'Test notification',
    };

    store.dispatch(addNotification(notification));
    const state = store.getState();

    expect(state.notifications.notifications).toHaveLength(1);
    expect(state.notifications.notifications[0]).toEqual({
      ...notification,
      id: expect.any(String),
      timestamp: expect.any(Number),
    });
  });

  it('should handle UI actions', () => {
    store.dispatch(setTheme('dark'));
    const state = store.getState();

    expect(state.ui.theme).toBe('dark');
  });

  it('should handle transaction actions', () => {
    const transaction = {
      id: '1',
      type: 'income' as const,
      amount: 1000,
      category: 'Salary',
      description: 'Monthly salary',
      date: '2024-03-01',
      status: 'completed' as const,
    };

    store.dispatch(addTransaction(transaction));
    const state = store.getState();

    expect(state.transactions.transactions).toHaveLength(1);
    expect(state.transactions.transactions[0]).toEqual(transaction);
  });

  it('should handle auth actions', () => {
    const user = {
      id: '1',
      name: 'John Doe',
      email: 'john@example.com',
      role: 'user' as const,
    };
    const token = 'mock-token';

    store.dispatch(loginSuccess({ user, token }));
    const state = store.getState();

    expect(state.auth.user).toEqual(user);
    expect(state.auth.token).toBe(token);
    expect(state.auth.isAuthenticated).toBe(true);
  });
}); 