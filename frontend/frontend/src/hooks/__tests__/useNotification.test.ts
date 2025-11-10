import { renderHook } from '@testing-library/react';
import { toast } from 'react-toastify';
import { vi } from 'vitest';
import { useNotification } from '../useNotification';

vi.mock('react-toastify', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warning: vi.fn(),
  },
}));

describe('useNotification', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows success notification', () => {
    const { result } = renderHook(() => useNotification());
    result.current.showNotification('Success message', 'success');

    expect(toast.success).toHaveBeenCalledWith('Success message', {
      position: 'top-right',
      autoClose: 3000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
    });
  });

  it('shows error notification', () => {
    const { result } = renderHook(() => useNotification());
    result.current.showNotification('Error message', 'error');

    expect(toast.error).toHaveBeenCalledWith('Error message', {
      position: 'top-right',
      autoClose: 3000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
    });
  });

  it('shows info notification', () => {
    const { result } = renderHook(() => useNotification());
    result.current.showNotification('Info message', 'info');

    expect(toast.info).toHaveBeenCalledWith('Info message', {
      position: 'top-right',
      autoClose: 3000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
    });
  });

  it('shows warning notification', () => {
    const { result } = renderHook(() => useNotification());
    result.current.showNotification('Warning message', 'warning');

    expect(toast.warning).toHaveBeenCalledWith('Warning message', {
      position: 'top-right',
      autoClose: 3000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
    });
  });

  it('defaults to info type when no type is provided', () => {
    const { result } = renderHook(() => useNotification());
    result.current.showNotification('Default message');

    expect(toast.info).toHaveBeenCalledWith('Default message', {
      position: 'top-right',
      autoClose: 3000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
    });
  });
}); 