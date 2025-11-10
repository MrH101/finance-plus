import { renderHook, act } from '@testing-library/react';
import { vi } from 'vitest';
import axios from 'axios';
import { useApi } from '../useApi';

vi.mock('axios', () => ({
  default: {
    create: vi.fn(() => ({
      get: vi.fn(),
      post: vi.fn(),
      put: vi.fn(),
      delete: vi.fn(),
      interceptors: {
        request: {
          use: vi.fn(),
        },
      },
    })),
  },
}));

describe('useApi', () => {
  const mockAxios = axios.create();
  const mockData = { id: 1, name: 'Test' };
  const mockError = new Error('API Error');

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('initializes with default state', () => {
    const { result } = renderHook(() => useApi('/test'));

    expect(result.current.data).toBeNull();
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('handles successful GET request', async () => {
    (mockAxios.get as jest.Mock).mockResolvedValueOnce({ data: mockData });

    const { result } = renderHook(() => useApi('/test'));

    await act(async () => {
      await result.current.get();
    });

    expect(result.current.data).toEqual(mockData);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('handles failed GET request', async () => {
    (mockAxios.get as jest.Mock).mockRejectedValueOnce(mockError);

    const { result } = renderHook(() => useApi('/test'));

    await act(async () => {
      await result.current.get();
    });

    expect(result.current.data).toBeNull();
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe('API Error');
  });

  it('handles successful POST request', async () => {
    (mockAxios.post as jest.Mock).mockResolvedValueOnce({ data: mockData });

    const { result } = renderHook(() => useApi('/test'));

    await act(async () => {
      await result.current.post('/test', mockData);
    });

    expect(result.current.data).toEqual(mockData);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('handles failed POST request', async () => {
    (mockAxios.post as jest.Mock).mockRejectedValueOnce(mockError);

    const { result } = renderHook(() => useApi('/test'));

    await act(async () => {
      await result.current.post('/test', mockData);
    });

    expect(result.current.data).toBeNull();
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe('API Error');
  });

  it('handles successful PUT request', async () => {
    (mockAxios.put as jest.Mock).mockResolvedValueOnce({ data: mockData });

    const { result } = renderHook(() => useApi('/test'));

    await act(async () => {
      await result.current.put('/test', mockData);
    });

    expect(result.current.data).toEqual(mockData);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('handles failed PUT request', async () => {
    (mockAxios.put as jest.Mock).mockRejectedValueOnce(mockError);

    const { result } = renderHook(() => useApi('/test'));

    await act(async () => {
      await result.current.put('/test', mockData);
    });

    expect(result.current.data).toBeNull();
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe('API Error');
  });

  it('handles successful DELETE request', async () => {
    (mockAxios.delete as jest.Mock).mockResolvedValueOnce({});

    const { result } = renderHook(() => useApi('/test'));

    await act(async () => {
      await result.current.delete('/test');
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('handles failed DELETE request', async () => {
    (mockAxios.delete as jest.Mock).mockRejectedValueOnce(mockError);

    const { result } = renderHook(() => useApi('/test'));

    await act(async () => {
      await result.current.delete('/test');
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe('API Error');
  });

  it('adds authorization header when token exists', () => {
    const token = 'test-token';
    localStorage.setItem('token', token);

    renderHook(() => useApi('/test'));

    const interceptor = (mockAxios.interceptors.request.use as jest.Mock).mock.calls[0][0];
    const config = { headers: {} };
    const result = interceptor(config);

    expect(result.headers.Authorization).toBe(`Bearer ${token}`);
  });

  it('does not add authorization header when token does not exist', () => {
    renderHook(() => useApi('/test'));

    const interceptor = (mockAxios.interceptors.request.use as jest.Mock).mock.calls[0][0];
    const config = { headers: {} };
    const result = interceptor(config);

    expect(result.headers.Authorization).toBeUndefined();
  });
}); 