'use client';

import { List } from '@mui/material';

import { FirestoreOpportunity } from '@/types/opportunity';

import OpportunityCard from './OpportunityCard';

interface OpportunityListProps {
  opportunities: FirestoreOpportunity[];
  isDeleting: string | null;
  onDeleteClick: (opportunity: FirestoreOpportunity) => void;
  onFeatureClick?: (opportunity: FirestoreOpportunity) => Promise<void>;
}

const OpportunityList = ({
  opportunities,
  isDeleting,
  onDeleteClick,
  onFeatureClick,
}: OpportunityListProps) => {
  return (
    <List sx={{ width: '100%', p: 0 }}>
      {opportunities.map((opportunity, index) => (
        <OpportunityCard
          key={opportunity.id}
          opportunity={opportunity}
          isDeleting={isDeleting === opportunity.id}
          viewMode="list"
          index={index}
          onDeleteClick={onDeleteClick}
          onFeatureClick={onFeatureClick}
        />
      ))}
    </List>
  );
};

export default OpportunityList;
