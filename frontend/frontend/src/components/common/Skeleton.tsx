import React from 'react';

interface SkeletonProps {
  className?: string;
  lines?: number;
}

const Skeleton: React.FC<SkeletonProps> = ({ className = '', lines = 1 }) => {
  return (
    <div className={`animate-pulse ${className}`}>
      {Array.from({ length: lines }).map((_, idx) => (
        <div key={idx} className="h-4 bg-gray-200 rounded mb-2 last:mb-0" />
      ))}
    </div>
  );
};

export default Skeleton; 