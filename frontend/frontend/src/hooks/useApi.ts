import { useCallback } from 'react';
import axios from 'axios';
import type { AxiosRequestConfig } from 'axios';
import { useSelector } from 'react-redux';
import type { RootState } from '../store';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

export const useApi = () => {
  const token = useSelector((state: RootState) => state.auth.token);

  const createAxiosInstance = useCallback(() => {
    const instance = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (token) {
      instance.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }

    return instance;
  }, [token]);

  const get = useCallback(
    async <T>(url: string, config?: AxiosRequestConfig) => {
      const instance = createAxiosInstance();
      const response = await instance.get<T>(url, config);
      return response;
    },
    [createAxiosInstance]
  );

  const post = useCallback(
    async <T>(url: string, data?: any, config?: AxiosRequestConfig) => {
      const instance = createAxiosInstance();
      const response = await instance.post<T>(url, data, config);
      return response;
    },
    [createAxiosInstance]
  );

  const put = useCallback(
    async <T>(url: string, data?: any, config?: AxiosRequestConfig) => {
      const instance = createAxiosInstance();
      const response = await instance.put<T>(url, data, config);
      return response;
    },
    [createAxiosInstance]
  );

  const del = useCallback(
    async <T>(url: string, config?: AxiosRequestConfig) => {
      const instance = createAxiosInstance();
      const response = await instance.delete<T>(url, config);
      return response;
    },
    [createAxiosInstance]
  );

  return {
    get,
    post,
    put,
    delete: del,
  };
}; 