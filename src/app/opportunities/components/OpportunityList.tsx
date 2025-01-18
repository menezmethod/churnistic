'use client';

import { Box } from '@mui/material';

import { FirestoreOpportunity } from '@/types/opportunity';

import OpportunityCard from './OpportunityCard';

interface OpportunityListProps {
  opportunities: FirestoreOpportunity[];
  onDeleteClick: (opportunity: { id?: string; name?: string }) => void;
  isDeleting?: string | null;
}

export default function OpportunityList({
  opportunities,
  onDeleteClick,
  isDeleting,
}: OpportunityListProps) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {opportunities.map((opportunity, index) => (
        <OpportunityCard
          key={opportunity.id}
          opportunity={opportunity}
          onDeleteClick={onDeleteClick}
          isDeleting={isDeleting}
          viewMode="list"
          index={index}
        />
      ))}
    </Box>
  );
}
