import axios from 'axios';
import { toast } from 'react-hot-toast';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';
const REQUEST_TIMEOUT_MS = 15000;
const TOAST_THROTTLE_MS = 2000;
let lastNetworkToastAt = 0;

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: REQUEST_TIMEOUT_MS,
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const accessToken = localStorage.getItem('access');
    if (accessToken) {
      (config.headers as any).Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token refresh and user-friendly errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config || {};
    const isNetworkError = !error.response;
    const method = (originalRequest.method || '').toLowerCase();
    const status = error.response?.status;
    const isTransient = status === 502 || status === 503 || status === 504;
    const canRetry = method === 'get';

    // Ignore canceled requests and preflight/OPTIONS noise
    if (error.code === 'ERR_CANCELED' || method === 'options') {
      return Promise.reject(error);
    }

    // If completely offline or network error, surface a clear message
    if (isNetworkError) {
      // Silent for refresh endpoint to avoid noisy toasts during tab wakes
      if ((originalRequest.url || '').includes('/token/refresh/')) {
        return Promise.reject(error);
      }
      if (navigator && navigator.onLine === false) {
        const now = Date.now();
        if (now - lastNetworkToastAt > TOAST_THROTTLE_MS) {
          lastNetworkToastAt = now;
          toast.error('You are offline. Check your internet connection.');
        }
      } else {
        // Auto-retry GET once for transient network errors
        if (canRetry && !originalRequest._networkRetry) {
          originalRequest._networkRetry = true;
          await new Promise((r) => setTimeout(r, 600));
          return api(originalRequest);
        }
        const now = Date.now();
        if (now - lastNetworkToastAt > TOAST_THROTTLE_MS) {
          lastNetworkToastAt = now;
          toast.error('Network error. Please check your connection and try again.');
        }
      }
      return Promise.reject(error);
    }

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refresh');
        if (refreshToken) {
          const response = await axios.post(`${API_BASE_URL}/token/refresh/`, {
            refresh: refreshToken,
          });

          const { access } = response.data;
          localStorage.setItem('access', access);
          
          // Retry original request with new token
          originalRequest.headers = originalRequest.headers || {};
          originalRequest.headers.Authorization = `Bearer ${access}`;
          return api(originalRequest);
        }
      } catch (refreshError: any) {
        const status = refreshError?.response?.status;
        if (status === 401 || status === 403) {
          toast.error('Session expired. Please log in again.');
          localStorage.removeItem('access');
          localStorage.removeItem('refresh');
          window.location.href = '/login';
          return Promise.reject(refreshError);
        }
        // Network/other error during refresh: surface message but don't force logout
        if (!refreshError.response) {
          const now = Date.now();
          if (now - lastNetworkToastAt > TOAST_THROTTLE_MS) {
            lastNetworkToastAt = now;
            toast.error('Network error during session refresh. Try again.');
          }
        }
        return Promise.reject(refreshError);
      }
    }

    // Standard error handling for non-auth failures
    const detail = error.response?.data?.detail || error.response?.data?.error || error.message;
    if (status && status >= 500) {
      // Auto-retry GET once for common transient 5xx
      if (canRetry && isTransient && !originalRequest._5xxRetry) {
        originalRequest._5xxRetry = true;
        await new Promise((r) => setTimeout(r, 600));
        return api(originalRequest);
      }
      toast.error('Server error. Please try again later.');
    } else if (status && status >= 400) {
      toast.error(typeof detail === 'string' ? detail : 'Request failed');
    } else {
      const now = Date.now();
      if (now - lastNetworkToastAt > TOAST_THROTTLE_MS) {
        lastNetworkToastAt = now;
        toast.error('Network error. Please check your connection.');
      }
    }

    return Promise.reject(error);
  }
);

export default api;

// API Endpoints
export const ENDPOINTS = {
  users: '/users/',
  employees: '/employees/',
  departments: '/departments/',
  projects: '/projects/',
  'project-tasks': '/project-tasks/',
  'project-timesheets': '/project-timesheets/',
  'project-expenses': '/project-expenses/',
  customers: '/customers/',
  payroll: '/payroll/',
  inventory: '/inventory/',
  products: '/products/',
  stores: '/stores/',
  'chart-of-accounts': '/chart-of-accounts/',
  'journal-entries': '/journal-entries/',
  'general-ledger': '/general-ledger/',
  'bank-accounts': '/bank-accounts/',
  'mobile-money-accounts': '/mobile-money-accounts/',
  'bank-transactions': '/bank-transactions/',
  'mobile-money-transactions': '/mobile-money-transactions/',
  modules: '/modules/',
  'sale-sessions': '/sale-sessions/',
  'pos-sales': '/pos-sales/',
  'pos-items': '/pos-items/',
  'fiscalization-logs': '/fiscalization-logs/',
  login: '/login/',
  logout: '/logout/',
  'user-profile': '/users/me/',
  dashboard: '/dashboard/',
  reports: '/reports/',
  'export-reports': '/export-reports/',
  // Advanced endpoints used by advancedService
  budgets: '/budgets/',
  accountsPayable: '/accounts-payable/',
  accountsReceivable: '/accounts-receivable/',
  generalLedger: '/general-ledger/',
  documentTemplates: '/document-templates/',
  letters: '/letters/',
  generatedDocuments: '/generated-documents/',
  auditLogs: '/audit-logs/',
  store: '/stores/',
  leaveRequests: '/leave-requests/',
  overtime: '/overtime/',
} as const;
