import React from 'react';
import { cn } from '../../utils/cn';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  color?: 'primary' | 'secondary' | 'white';
  text?: string;
  className?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  color = 'primary',
  text,
  className,
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  const colorClasses = {
    primary: 'text-blue-600',
    secondary: 'text-gray-600',
    white: 'text-white',
  };

  return (
    <div className={cn('flex flex-col items-center justify-center', className)}>
      <svg
        className={cn('animate-spin', sizeClasses[size], colorClasses[color])}
        fill="none"
        viewBox="0 0 24 24"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
      {text && (
        <p className="mt-2 text-sm text-gray-600">{text}</p>
      )}
    </div>
  );
};

// Skeleton components for loading states
export const SkeletonLoader: React.FC<{ className?: string }> = ({ className }) => (
  <div className={cn('animate-pulse bg-gray-200 rounded', className)} />
);

export const CardSkeleton: React.FC = () => (
  <div className="bg-white p-6 rounded-lg shadow">
    <SkeletonLoader className="h-4 w-3/4 mb-4" />
    <SkeletonLoader className="h-4 w-1/2 mb-2" />
    <SkeletonLoader className="h-4 w-2/3" />
  </div>
);

export const TableSkeleton: React.FC = () => (
  <div className="bg-white rounded-lg shadow overflow-hidden">
    <div className="px-6 py-4 border-b border-gray-200">
      <SkeletonLoader className="h-4 w-1/4" />
    </div>
    <div className="divide-y divide-gray-200">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="px-6 py-4">
          <div className="flex space-x-4">
            <SkeletonLoader className="h-4 w-1/4" />
            <SkeletonLoader className="h-4 w-1/3" />
            <SkeletonLoader className="h-4 w-1/6" />
            <SkeletonLoader className="h-4 w-1/5" />
          </div>
        </div>
      ))}
    </div>
  </div>
);

export default LoadingSpinner;
