import { describe, it, expect } from 'vitest';
import authReducer, {
  loginStart,
  loginSuccess,
  loginFailure,
  logout,
  updateUser,
} from '../store/slices/authSlice';

describe('Auth Slice', () => {
  const initialState = {
    user: null,
    token: null,
    isAuthenticated: false,
    loading: false,
    error: null,
  };

  const mockUser = {
    id: '1',
    name: 'John Doe',
    email: 'john@example.com',
    role: 'user',
  };

  it('should handle initial state', () => {
    expect(authReducer(undefined, { type: 'unknown' })).toEqual(initialState);
  });

  it('should handle loginStart', () => {
    const actual = authReducer(initialState, loginStart());
    expect(actual.loading).toBe(true);
    expect(actual.error).toBe(null);
  });

  it('should handle loginSuccess', () => {
    const mockToken = 'mock-token';
    const actual = authReducer(
      initialState,
      loginSuccess({ user: mockUser, token: mockToken })
    );
    expect(actual.loading).toBe(false);
    expect(actual.isAuthenticated).toBe(true);
    expect(actual.user).toEqual(mockUser);
    expect(actual.token).toBe(mockToken);
    expect(actual.error).toBe(null);
  });

  it('should handle loginFailure', () => {
    const errorMessage = 'Invalid credentials';
    const actual = authReducer(initialState, loginFailure(errorMessage));
    expect(actual.loading).toBe(false);
    expect(actual.error).toBe(errorMessage);
    expect(actual.isAuthenticated).toBe(false);
    expect(actual.user).toBe(null);
    expect(actual.token).toBe(null);
  });

  it('should handle logout', () => {
    const loggedInState = {
      user: mockUser,
      token: 'mock-token',
      isAuthenticated: true,
      loading: false,
      error: null,
    };
    const actual = authReducer(loggedInState, logout());
    expect(actual).toEqual(initialState);
  });

  it('should handle updateUser', () => {
    const loggedInState = {
      user: mockUser,
      token: 'mock-token',
      isAuthenticated: true,
      loading: false,
      error: null,
    };
    const updatedUser = { ...mockUser, name: 'Jane Doe' };
    const actual = authReducer(loggedInState, updateUser(updatedUser));
    expect(actual.user).toEqual(updatedUser);
    expect(actual.isAuthenticated).toBe(true);
    expect(actual.token).toBe('mock-token');
  });
}); 