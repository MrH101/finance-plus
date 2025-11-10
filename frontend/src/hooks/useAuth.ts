import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { RootState } from '../store';
import { login, logout, fetchUserProfile, clearError } from '../store/slices/authSlice';

export const useAuth = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user, isAuthenticated, loading, error } = useSelector((state: RootState) => state.auth);

  const handleLogin = async (username: string, password: string) => {
    try {
      const result = await dispatch(login({ username, password }));
      if (login.fulfilled.match(result)) {
        // Fetch user profile after successful login
        await dispatch(fetchUserProfile());
        navigate('/dashboard');
        return { success: true };
      } else {
        return { success: false, error: result.payload as string };
      }
    } catch (error) {
      return { success: false, error: 'An unexpected error occurred' };
    }
  };

  const handleLogout = async () => {
    await dispatch(logout());
    navigate('/login');
  };

  const clearAuthError = () => {
    dispatch(clearError());
  };

  return {
    user,
    isAuthenticated,
    loading,
    error,
    login: handleLogin,
    logout: handleLogout,
    clearError: clearAuthError,
  };
};
