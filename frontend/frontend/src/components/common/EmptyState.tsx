import React from 'react';

interface EmptyStateProps {
  title?: string;
  description?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
}

const EmptyState: React.FC<EmptyStateProps> = ({
  title = 'No data yet',
  description = 'Connect your data source or create your first record.',
  icon = '📭',
  action,
}) => {
  return (
    <div className="flex flex-col items-center justify-center text-center p-10 bg-white border border-dashed border-gray-200 rounded-lg">
      <div className="text-5xl mb-3">{icon}</div>
      <h3 className="text-lg font-semibold text-gray-900 mb-1">{title}</h3>
      <p className="text-sm text-gray-500 mb-4">{description}</p>
      {action}
    </div>
  );
};

export default EmptyState; 