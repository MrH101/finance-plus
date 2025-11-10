// src/components/Shared/ErrorAlert.jsx
import React from 'react';
import { useError } from '../../contexts/ErrorContext';

const ErrorAlert = () => {
  const { error } = useError();

  if (!error) return null;

  return (
    <div className="fixed bottom-4 right-4 bg-red-500 text-white p-4 rounded-lg shadow-lg animate-fade-in">
      {error}
    </div>
  );
};
export default ErrorAlert;