import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import notificationReducer, {
  addNotification,
  removeNotification,
  clearNotifications,
} from '../store/slices/notificationSlice';

interface Notification {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
  timestamp: number;
}

describe('Notification Slice', () => {
  const initialState: { notifications: Notification[] } = {
    notifications: [],
  };

  const mockNotification = {
    type: 'success' as const,
    message: 'Test notification',
  };

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-03-01'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should handle initial state', () => {
    expect(notificationReducer(undefined, { type: 'unknown' })).toEqual(initialState);
  });

  it('should handle addNotification', () => {
    const actual = notificationReducer(initialState, addNotification(mockNotification));
    expect(actual.notifications).toHaveLength(1);
    expect(actual.notifications[0]).toEqual({
      ...mockNotification,
      id: expect.any(String),
      timestamp: new Date().getTime(),
    });
  });

  it('should handle removeNotification', () => {
    const stateWithNotification = notificationReducer(initialState, addNotification(mockNotification));
    const notificationId = stateWithNotification.notifications[0].id;

    const actual = notificationReducer(stateWithNotification, removeNotification(notificationId));
    expect(actual.notifications).toHaveLength(0);
  });

  it('should handle clearNotifications', () => {
    const stateWithNotifications = notificationReducer(initialState, addNotification(mockNotification));
    const actual = notificationReducer(stateWithNotifications, clearNotifications());
    expect(actual.notifications).toHaveLength(0);
  });

  it('should generate unique IDs for notifications', () => {
    const firstNotification = notificationReducer(initialState, addNotification(mockNotification));
    const secondNotification = notificationReducer(firstNotification, addNotification(mockNotification));

    const firstId = firstNotification.notifications[0].id;
    const secondId = secondNotification.notifications[1].id;

    expect(firstId).not.toBe(secondId);
  });

  it('should handle multiple notifications', () => {
    const notifications = [
      { type: 'success' as const, message: 'Success message' },
      { type: 'error' as const, message: 'Error message' },
      { type: 'info' as const, message: 'Info message' },
    ];

    let state = initialState;
    notifications.forEach((notification) => {
      state = notificationReducer(state, addNotification(notification));
    });

    expect(state.notifications).toHaveLength(3);
    expect(state.notifications[0].message).toBe('Success message');
    expect(state.notifications[1].message).toBe('Error message');
    expect(state.notifications[2].message).toBe('Info message');
  });
}); 