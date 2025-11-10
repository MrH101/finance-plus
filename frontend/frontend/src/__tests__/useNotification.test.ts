import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useNotification } from '../hooks/useNotification';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import notificationReducer from '../store/slices/notificationSlice';
import type { ReactNode } from 'react';

vi.mock('axios');

const mockStore = configureStore({
  reducer: {
    notifications: notificationReducer,
  },
});

const Wrapper = ({ children }: { children: ReactNode }) => (
  <Provider store={mockStore}>{children}</Provider>
);

describe('useNotification', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows success notification', () => {
    const { result } = renderHook(() => useNotification(), { wrapper: Wrapper });

    act(() => {
      result.current.showNotification('Operation successful', 'success');
    });

    const state = mockStore.getState();
    expect(state.notifications.notifications).toHaveLength(1);
    expect(state.notifications.notifications[0]).toEqual({
      id: expect.any(String),
      type: 'success',
      message: 'Operation successful',
      timestamp: expect.any(Number),
    });
  });

  it('shows error notification', () => {
    const { result } = renderHook(() => useNotification(), { wrapper: Wrapper });

    act(() => {
      result.current.showNotification('Operation failed', 'error');
    });

    const state = mockStore.getState();
    expect(state.notifications.notifications).toHaveLength(1);
    expect(state.notifications.notifications[0]).toEqual({
      id: expect.any(String),
      type: 'error',
      message: 'Operation failed',
      timestamp: expect.any(Number),
    });
  });

  it('shows info notification', () => {
    const { result } = renderHook(() => useNotification(), { wrapper: Wrapper });

    act(() => {
      result.current.showNotification('Please note', 'info');
    });

    const state = mockStore.getState();
    expect(state.notifications.notifications).toHaveLength(1);
    expect(state.notifications.notifications[0]).toEqual({
      id: expect.any(String),
      type: 'info',
      message: 'Please note',
      timestamp: expect.any(Number),
    });
  });

  it('shows warning notification', () => {
    const { result } = renderHook(() => useNotification(), { wrapper: Wrapper });

    act(() => {
      result.current.showNotification('Be careful', 'warning');
    });

    const state = mockStore.getState();
    expect(state.notifications.notifications).toHaveLength(1);
    expect(state.notifications.notifications[0]).toEqual({
      id: expect.any(String),
      type: 'warning',
      message: 'Be careful',
      timestamp: expect.any(Number),
    });
  });

  it('shows multiple notifications', () => {
    const { result } = renderHook(() => useNotification(), { wrapper: Wrapper });

    act(() => {
      result.current.showNotification('First notification', 'success');
      result.current.showNotification('Second notification', 'error');
    });

    const state = mockStore.getState();
    expect(state.notifications.notifications).toHaveLength(2);
    expect(state.notifications.notifications[0].message).toBe('First notification');
    expect(state.notifications.notifications[1].message).toBe('Second notification');
  });

  it('generates unique IDs for notifications', () => {
    const { result } = renderHook(() => useNotification(), { wrapper: Wrapper });

    act(() => {
      result.current.showNotification('First notification', 'success');
      result.current.showNotification('Second notification', 'success');
    });

    const state = mockStore.getState();
    expect(state.notifications.notifications[0].id).not.toBe(state.notifications.notifications[1].id);
  });
}); 