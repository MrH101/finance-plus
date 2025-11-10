import api from './api';
import config from '../config/environment';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SignupData {
  username: string;
  email: string;
  phone: string;
  password: string;
  firstName?: string;
  lastName?: string;
  businessName?: string;
}

export interface AuthResponse {
  access: string;
  refresh: string;
  user: {
    id: number;
    email: string;
    name: string;
    role: string;
  };
}

export const authService = {
  // Login user
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/login/', credentials);
    return response.data;
  },

  // Register new user
  async signup(data: SignupData): Promise<AuthResponse> {
    const payload = {
      ...data,
      first_name: data.firstName,
      last_name: data.lastName,
      business_name: data.businessName,
    };
    const response = await api.post<AuthResponse>('/signup/', payload);
    return response.data;
  },
};

export default authService; 