'use client';

import { GridColDef } from '@mui/x-data-grid';

import { OpportunityActionButtons } from '../components/OpportunityActionButtons';
import { OpportunityStatusChip } from '../components/OpportunityStatusChip';
import {
  ExpiryCell,
  InstitutionCell,
  TypeCell,
  ValueCell,
} from '../components/OpportunityTableCells';
import { Opportunity } from '../types/opportunity';
import { checkOpportunityForReview } from '../utils/reviewRules';

interface GetColumnsProps {
  onPreview: (opportunity: Opportunity) => void;
  onApprove?: (opportunity: Opportunity) => void;
  onReject: (opportunity: Opportunity) => void;
  showApprove?: boolean;
  rejectTooltip?: string;
  showReviewReason?: boolean;
}

export const getColumns = ({
  onPreview,
  onApprove,
  onReject,
  showApprove = true,
  rejectTooltip,
  showReviewReason = false,
}: GetColumnsProps): GridColDef[] => {
  const baseColumns: GridColDef[] = [
    {
      field: 'name',
      headerName: 'Institution',
      flex: 1,
      minWidth: 250,
      renderCell: (params) => (
        <InstitutionCell
          name={params.row.name}
          description={params.row.description}
          logo={params.row.logo}
        />
      ),
    },
    {
      field: 'type',
      headerName: 'Type',
      width: 130,
      renderCell: (params) => <TypeCell type={params.value} />,
    },
    {
      field: 'value',
      headerName: 'Bonus Value',
      width: 130,
      renderCell: (params) => (
        <ValueCell value={params.value} spendRequirement={params.row.spend_requirement} />
      ),
    },
    {
      field: 'expiry',
      headerName: 'Expiry',
      width: 120,
      renderCell: (params) => (
        <ExpiryCell
          expiration={params.row.details?.expiration}
          bonusPostingTime={params.row.metadata?.timing?.bonus_posting_time}
        />
      ),
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 120,
      renderCell: (params) => <OpportunityStatusChip status={params.value} />,
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 180,
      sortable: false,
      renderCell: (params) => (
        <OpportunityActionButtons
          opportunity={params.row}
          onPreview={() => onPreview(params.row)}
          onApprove={onApprove ? () => onApprove(params.row) : undefined}
          onReject={() => onReject(params.row)}
          showApprove={showApprove}
          rejectTooltip={rejectTooltip}
        />
      ),
    },
  ];

  if (showReviewReason) {
    baseColumns.splice(baseColumns.length - 1, 0, {
      field: 'problem',
      headerName: 'Problem',
      width: 200,
      renderCell: (params) => {
        const opportunity = params.row as Opportunity;
        const { needsReview, message } = checkOpportunityForReview(opportunity);
        return needsReview ? message : null;
      },
    });
  }

  return baseColumns;
};
