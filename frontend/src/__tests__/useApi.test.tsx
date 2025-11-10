import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useApi } from '../hooks/useApi';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../store/slices/authSlice';
import axios from 'axios';
import type { ReactNode } from 'react';

vi.mock('axios');

const mockStore = configureStore({
  reducer: {
    auth: authReducer,
  },
  preloadedState: {
    auth: {
      token: 'mock-token',
      user: null,
      isAuthenticated: true,
      loading: false,
      error: null,
    },
  },
});

const Wrapper = ({ children }: { children: ReactNode }) => (
  <Provider store={mockStore}>{children}</Provider>
);

describe('useApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('creates axios instance with correct base URL', () => {
    const { result } = renderHook(() => useApi(), { wrapper: Wrapper });
    expect(axios.create).toHaveBeenCalledWith({
      baseURL: expect.any(String),
      headers: {
        'Content-Type': 'application/json',
      },
    });
  });

  it('adds authorization header when token is present', () => {
    const { result } = renderHook(() => useApi(), { wrapper: Wrapper });
    expect(axios.create).toHaveBeenCalledWith(
      expect.objectContaining({
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
        }),
      })
    );
  });

  it('makes GET request correctly', async () => {
    const mockResponse = { data: { test: 'data' } };
    (axios.create as any).mockReturnValue({
      get: vi.fn().mockResolvedValue(mockResponse),
    });

    const { result } = renderHook(() => useApi(), { wrapper: Wrapper });
    const response = await result.current.get('/test');

    expect(response).toBe(mockResponse);
  });

  it('makes POST request correctly', async () => {
    const mockResponse = { data: { test: 'data' } };
    const mockData = { test: 'input' };
    (axios.create as any).mockReturnValue({
      post: vi.fn().mockResolvedValue(mockResponse),
    });

    const { result } = renderHook(() => useApi(), { wrapper: Wrapper });
    const response = await result.current.post('/test', mockData);

    expect(response).toBe(mockResponse);
  });

  it('makes PUT request correctly', async () => {
    const mockResponse = { data: { test: 'data' } };
    const mockData = { test: 'input' };
    (axios.create as any).mockReturnValue({
      put: vi.fn().mockResolvedValue(mockResponse),
    });

    const { result } = renderHook(() => useApi(), { wrapper: Wrapper });
    const response = await result.current.put('/test', mockData);

    expect(response).toBe(mockResponse);
  });

  it('makes DELETE request correctly', async () => {
    const mockResponse = { data: { test: 'data' } };
    (axios.create as any).mockReturnValue({
      delete: vi.fn().mockResolvedValue(mockResponse),
    });

    const { result } = renderHook(() => useApi(), { wrapper: Wrapper });
    const response = await result.current.delete('/test');

    expect(response).toBe(mockResponse);
  });

  it('handles request errors correctly', async () => {
    const mockError = new Error('Network error');
    (axios.create as any).mockReturnValue({
      get: vi.fn().mockRejectedValue(mockError),
    });

    const { result } = renderHook(() => useApi(), { wrapper: Wrapper });
    await expect(result.current.get('/test')).rejects.toThrow('Network error');
  });
}); 