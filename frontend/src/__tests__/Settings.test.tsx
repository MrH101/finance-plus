import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import Settings from '../pages/Settings';
import { useApi } from '../hooks/useApi';
import authReducer from '../store/slices/authSlice';

// Mock the useApi hook
vi.mock('../hooks/useApi', () => ({
  useApi: vi.fn(),
}));

// Mock the useNotification hook
vi.mock('../hooks/useNotification', () => ({
  useNotification: vi.fn(() => ({
    showNotification: vi.fn(),
  })),
}));

const mockUser = {
  id: '1',
  name: 'John Doe',
  email: 'john@example.com',
  role: 'user',
};

const testStore = configureStore({
  reducer: {
    auth: authReducer,
  },
  preloadedState: {
    auth: {
      user: mockUser,
      token: 'mock-token',
      isAuthenticated: true,
      loading: false,
      error: null,
    },
  },
});

describe('Settings Page', () => {
  const mockUseApi = {
    data: mockUser,
    loading: false,
    error: null,
    put: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (useApi as unknown as ReturnType<typeof vi.fn>).mockReturnValue(mockUseApi);
  });

  const renderSettings = () => {
    return render(
      <Provider store={testStore}>
        <BrowserRouter>
          <Settings />
        </BrowserRouter>
      </Provider>
    );
  };

  it('renders settings form with user data', () => {
    renderSettings();

    expect(screen.getByText('Profile Information')).toBeInTheDocument();
    expect(screen.getByLabelText('Name')).toHaveValue('John Doe');
    expect(screen.getByLabelText('Email')).toHaveValue('john@example.com');
  });

  it('updates profile information', async () => {
    renderSettings();

    const nameInput = screen.getByLabelText('Name');
    const emailInput = screen.getByLabelText('Email');

    fireEvent.change(nameInput, { target: { value: 'Jane Doe' } });
    fireEvent.change(emailInput, { target: { value: 'jane@example.com' } });

    const updateButton = screen.getByText('Update Profile');
    fireEvent.click(updateButton);

    await waitFor(() => {
      expect(mockUseApi.put).toHaveBeenCalledWith('/users/profile', {
        name: 'Jane Doe',
        email: 'jane@example.com',
      });
    });
  });

  it('updates password', async () => {
    renderSettings();

    const currentPasswordInput = screen.getByLabelText('Current Password');
    const newPasswordInput = screen.getByLabelText('New Password');
    const confirmPasswordInput = screen.getByLabelText('Confirm New Password');

    fireEvent.change(currentPasswordInput, { target: { value: 'oldpass123' } });
    fireEvent.change(newPasswordInput, { target: { value: 'newpass123' } });
    fireEvent.change(confirmPasswordInput, { target: { value: 'newpass123' } });

    const updateButton = screen.getByText('Update Password');
    fireEvent.click(updateButton);

    await waitFor(() => {
      expect(mockUseApi.put).toHaveBeenCalledWith('/users/password', {
        currentPassword: 'oldpass123',
        newPassword: 'newpass123',
      });
    });
  });

  it('shows error when passwords do not match', async () => {
    renderSettings();

    const newPasswordInput = screen.getByLabelText('New Password');
    const confirmPasswordInput = screen.getByLabelText('Confirm New Password');

    fireEvent.change(newPasswordInput, { target: { value: 'newpass123' } });
    fireEvent.change(confirmPasswordInput, { target: { value: 'differentpass' } });

    const updateButton = screen.getByText('Update Password');
    fireEvent.click(updateButton);

    await waitFor(() => {
      expect(screen.getByText('New passwords do not match')).toBeInTheDocument();
    });
  });

  it('shows loading state', () => {
    (useApi as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      ...mockUseApi,
      loading: true,
    });

    renderSettings();
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('shows error state', () => {
    const errorMessage = 'Failed to load user data';
    (useApi as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      ...mockUseApi,
      error: errorMessage,
    });

    renderSettings();
    expect(screen.getByText(`Error loading settings: ${errorMessage}`)).toBeInTheDocument();
  });
}); 