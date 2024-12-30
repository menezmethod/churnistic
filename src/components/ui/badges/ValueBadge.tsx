import React from 'react';

interface ValueBadgeProps {
  value: string | number;
  label?: string;
  className?: string;
}

export const ValueBadge: React.FC<ValueBadgeProps> = ({
  value,
  label,
  className = '',
}) => {
  return (
    <div className={`inline-flex items-center ${className}`}>
      {label && <span className="mr-2 text-gray-600">{label}:</span>}
      <span className="px-2 py-1 text-sm font-medium bg-blue-100 text-blue-800 rounded-full">
        {value}
      </span>
    </div>
  );
};
