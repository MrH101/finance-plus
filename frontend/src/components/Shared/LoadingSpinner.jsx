// src/components/Shared/LoadingSpinner.jsx
import React from 'react';

const LoadingSpinner = ({ size = 'h-8 w-8' }) => {
  return (
    <div className={`animate-spin rounded-full ${size} border-b-2 border-gray-900 dark:border-gray-100`}>
      <span className="sr-only">Loading...</span>
    </div>
  );
};
export default LoadingSpinner;