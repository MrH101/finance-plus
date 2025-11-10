import { createContext, useContext, useState, ReactNode } from 'react';

interface ErrorContextType {
  error: string | null;
  setError: (error: string | null) => void;
  clearError: () => void;
  handleError: (error: any) => void;
}

const ErrorContext = createContext<ErrorContextType | undefined>(undefined);

export const useError = () => {
  const context = useContext(ErrorContext);
  if (context === undefined) {
    throw new Error('useError must be used within an ErrorProvider');
  }
  return context;
};

interface ErrorProviderProps {
  children: ReactNode;
}

export const ErrorProvider: React.FC<ErrorProviderProps> = ({ children }) => {
  const [error, setError] = useState<string | null>(null);

  const clearError = () => {
    setError(null);
  };

  const handleError = (error: any) => {
    console.error('Error caught by ErrorProvider:', error);
    
    let errorMessage = 'An unexpected error occurred';
    
    if (error?.response?.data?.message) {
      errorMessage = error.response.data.message;
    } else if (error?.response?.data?.detail) {
      errorMessage = error.response.data.detail;
    } else if (error?.message) {
      errorMessage = error.message;
    } else if (typeof error === 'string') {
      errorMessage = error;
    }
    
    setError(errorMessage);
  };

  return (
    <ErrorContext.Provider value={{ error, setError, clearError, handleError }}>
      {children}
    </ErrorContext.Provider>
  );
}; 