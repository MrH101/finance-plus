import React, { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { initializeAuth } from '../../store/slices/authSlice';
import api from '../../services/api';

const AuthInitializer: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const dispatch = useDispatch();

  useEffect(() => {
    const initializeAuthState = async () => {
      const accessToken = localStorage.getItem('access');
      
      if (accessToken) {
        try {
          // Set the token in the API headers
          api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
          
          // Fetch user data
          const response = await api.get('/users/me/');
          const userData = {
            id: response.data.id.toString(),
            email: response.data.email,
            name: response.data.name || response.data.email,
            role: response.data.role
          };
          
          // Initialize auth state with user data
          dispatch(initializeAuth({ user: userData }));
        } catch (error) {
          console.error('Failed to initialize auth:', error);
          // Clear invalid tokens
          localStorage.removeItem('access');
          localStorage.removeItem('refresh');
          delete api.defaults.headers.common['Authorization'];
        }
      }
    };

    initializeAuthState();
  }, [dispatch]);

  return <>{children}</>;
};

export default AuthInitializer; 