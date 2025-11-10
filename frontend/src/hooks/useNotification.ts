import { useCallback } from 'react';
import { toast, ToastOptions } from 'react-toastify';

type NotificationType = 'success' | 'error' | 'info' | 'warning';

interface UseNotification {
  showNotification: (message: string, type?: NotificationType) => void;
}

const defaultOptions: ToastOptions = {
  position: 'top-right',
  autoClose: 3000,
  hideProgressBar: false,
  closeOnClick: true,
  pauseOnHover: true,
  draggable: true,
};

export function useNotification(): UseNotification {
  const showNotification = useCallback((message: string, type: NotificationType = 'info') => {
    toast[type](message, defaultOptions);
  }, []);

  return { showNotification };
}

export default useNotification; 