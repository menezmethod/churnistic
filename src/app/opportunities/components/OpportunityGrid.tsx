'use client';

import { Grid } from '@mui/material';

import { FirestoreOpportunity } from '@/types/opportunity';

import OpportunityCard from './OpportunityCard';

interface OpportunityGridProps {
  opportunities: FirestoreOpportunity[];
  onDeleteClick: (opportunity: { id?: string; name?: string }) => void;
  isDeleting?: string | null;
}

export default function OpportunityGrid({
  opportunities,
  onDeleteClick,
  isDeleting,
}: OpportunityGridProps) {
  return (
    <Grid container spacing={2}>
      {opportunities.map((opportunity, index) => (
        <Grid item xs={12} sm={6} md={4} key={opportunity.id}>
          <OpportunityCard
            opportunity={opportunity}
            onDeleteClick={onDeleteClick}
            isDeleting={isDeleting}
            viewMode="grid"
            index={index}
          />
        </Grid>
      ))}
    </Grid>
  );
}
