import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { store } from '../store';
import Users from '../pages/Users';
import { useApi } from '../hooks/useApi';
import { vi } from 'vitest';

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

describe('Users Page', () => {
  const mockUsers = [
    {
      id: '1',
      name: 'John Doe',
      email: 'john@example.com',
      role: 'admin',
      status: 'active',
      createdAt: '2024-02-20T00:00:00.000Z',
    },
    {
      id: '2',
      name: 'Jane Smith',
      email: 'jane@example.com',
      role: 'user',
      status: 'inactive',
      createdAt: '2024-02-20T00:00:00.000Z',
    },
  ];

  const mockUseApi = {
    data: mockUsers,
    loading: false,
    error: null,
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (useApi as jest.Mock).mockReturnValue(mockUseApi);
  });

  const renderUsers = () => {
    return render(
      <Provider store={store}>
        <BrowserRouter>
          <Users />
        </BrowserRouter>
      </Provider>
    );
  };

  it('renders users table with data', async () => {
    renderUsers();

    // Check if the table headers are rendered
    expect(screen.getByText('Name')).toBeInTheDocument();
    expect(screen.getByText('Email')).toBeInTheDocument();
    expect(screen.getByText('Role')).toBeInTheDocument();
    expect(screen.getByText('Status')).toBeInTheDocument();
    expect(screen.getByText('Actions')).toBeInTheDocument();

    // Check if the user data is rendered
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('john@example.com')).toBeInTheDocument();
    expect(screen.getByText('admin')).toBeInTheDocument();
    expect(screen.getByText('active')).toBeInTheDocument();

    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    expect(screen.getByText('jane@example.com')).toBeInTheDocument();
    expect(screen.getByText('user')).toBeInTheDocument();
    expect(screen.getByText('inactive')).toBeInTheDocument();
  });

  it('shows loading state', () => {
    (useApi as jest.Mock).mockReturnValue({
      ...mockUseApi,
      loading: true,
    });

    renderUsers();
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('shows error state', () => {
    const errorMessage = 'Failed to load users';
    (useApi as jest.Mock).mockReturnValue({
      ...mockUseApi,
      error: errorMessage,
    });

    renderUsers();
    expect(screen.getByText(`Error loading users: ${errorMessage}`)).toBeInTheDocument();
  });

  it('opens add user modal when clicking add button', async () => {
    renderUsers();

    const addButton = screen.getByText('Add User');
    fireEvent.click(addButton);

    await waitFor(() => {
      expect(screen.getByText('Add User')).toBeInTheDocument();
      expect(screen.getByLabelText('Name')).toBeInTheDocument();
      expect(screen.getByLabelText('Email')).toBeInTheDocument();
      expect(screen.getByLabelText('Role')).toBeInTheDocument();
      expect(screen.getByLabelText('Status')).toBeInTheDocument();
    });
  });

  it('opens edit user modal when clicking edit button', async () => {
    renderUsers();

    const editButtons = screen.getAllByTestId('edit-button');
    fireEvent.click(editButtons[0]);

    await waitFor(() => {
      expect(screen.getByText('Edit User')).toBeInTheDocument();
      expect(screen.getByDisplayValue('John Doe')).toBeInTheDocument();
      expect(screen.getByDisplayValue('john@example.com')).toBeInTheDocument();
    });
  });

  it('handles user deletion', async () => {
    window.confirm = vi.fn(() => true);
    renderUsers();

    const deleteButtons = screen.getAllByTestId('delete-button');
    fireEvent.click(deleteButtons[0]);

    await waitFor(() => {
      expect(window.confirm).toHaveBeenCalledWith('Are you sure you want to delete this user?');
      expect(mockUseApi.delete).toHaveBeenCalledWith('/users/1', expect.any(Object));
      expect(mockUseApi.get).toHaveBeenCalledWith('/users');
    });
  });
}); 