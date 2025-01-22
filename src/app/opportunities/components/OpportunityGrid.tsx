'use client';

import { Grid } from '@mui/material';

import { FirestoreOpportunity } from '@/types/opportunity';

import OpportunityCard from './OpportunityCard';

interface OpportunityGridProps {
  opportunities: FirestoreOpportunity[];
  isDeleting: string | null;
  onDeleteClick: (opportunity: FirestoreOpportunity) => void;
}

export default function OpportunityGrid({
  opportunities,
  isDeleting,
  onDeleteClick,
}: OpportunityGridProps) {
  return (
    <Grid container spacing={2}>
      {opportunities.map((opportunity, index) => (
        <Grid item xs={12} sm={6} md={4} key={opportunity.id}>
          <OpportunityCard
            opportunity={opportunity}
            isDeleting={isDeleting === opportunity.id}
            viewMode="grid"
            index={index}
            onDeleteOpportunityAction={onDeleteClick}
          />
        </Grid>
      ))}
    </Grid>
  );
}
