// Environment configuration for the application
export const config = {
  // API Configuration
  api: {
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api',
    timeout: 10000,
  },
  
  // App Configuration
  app: {
    name: import.meta.env.VITE_APP_NAME || 'Finance Plus',
    version: import.meta.env.VITE_APP_VERSION || '1.0.0',
    devMode: import.meta.env.VITE_DEV_MODE === 'true',
  },
  
  // Authentication
  auth: {
    tokenKey: 'token',
    refreshTokenKey: 'refreshToken',
  },
};

export default config; 