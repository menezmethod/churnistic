import React from 'react';

type StatusType = 'active' | 'pending' | 'completed' | 'expired';

interface OpportunityStatusProps {
  status: StatusType;
  className?: string;
}

export const OpportunityStatus: React.FC<OpportunityStatusProps> = ({
  status,
  className = '',
}) => {
  const getStatusColor = (status: StatusType) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      case 'expired':
        return 'bg-red-100 text-red-800';
    }
  };

  return (
    <span
      className={`px-2 py-1 text-sm font-medium rounded-full ${getStatusColor(status)} ${className}`}
    >
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
};
