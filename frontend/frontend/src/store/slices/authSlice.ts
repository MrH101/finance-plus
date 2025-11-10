import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import api from '../../services/api';

interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  business: number | null;
  phone: string;
  is_verified: boolean;
  is_staff: boolean;
}

interface AuthState {
  user: User | null;
  access: string | null;
  refresh: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  user: null,
  access: localStorage.getItem('access'),
  refresh: localStorage.getItem('refresh'),
  isAuthenticated: !!localStorage.getItem('access'),
  loading: false,
  error: null,
};

// Async thunks
export const login = createAsyncThunk(
  'auth/login',
  async (credentials: { username: string; password: string }, { rejectWithValue }) => {
    try {
      const response = await api.post('/login/', credentials);
      const { access, refresh, user_id, email, role } = response.data;
      
      // Store tokens
      localStorage.setItem('access', access);
      localStorage.setItem('refresh', refresh);
      
      return { access, refresh, user_id, email, role };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Login failed');
    }
  }
);

export const logout = createAsyncThunk(
  'auth/logout',
  async (_, { rejectWithValue }) => {
    try {
      await api.post('/logout/');
      localStorage.removeItem('access');
      localStorage.removeItem('refresh');
    } catch (error: any) {
      // Even if logout fails on server, clear local storage
      localStorage.removeItem('access');
      localStorage.removeItem('refresh');
    }
  }
);

export const fetchUserProfile = createAsyncThunk(
  'auth/fetchUserProfile',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/users/me/');
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch user profile');
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    initializeAuth: (state, action: PayloadAction<User>) => {
      state.user = action.payload;
      state.isAuthenticated = true;
    },
  },
  extraReducers: (builder) => {
    builder
      // Login
      .addCase(login.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.loading = false;
        state.access = action.payload.access;
        state.refresh = action.payload.refresh;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.isAuthenticated = false;
      })
      // Logout
      .addCase(logout.fulfilled, (state) => {
        state.user = null;
        state.access = null;
        state.refresh = null;
        state.isAuthenticated = false;
        state.error = null;
      })
      // Fetch user profile
      .addCase(fetchUserProfile.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchUserProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
      })
      .addCase(fetchUserProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearError, initializeAuth } = authSlice.actions;
export default authSlice.reducer;
