'use client';

import CancelIcon from '@mui/icons-material/Cancel';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PreviewIcon from '@mui/icons-material/Preview';
import WarningIcon from '@mui/icons-material/Warning';
import {
  Box,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from '@mui/material';
import Image from 'next/image';
import { useState } from 'react';

import { OpportunityPreviewModal } from './OpportunityPreviewModal';
import { Opportunity } from '../types/opportunity';

interface OpportunitiesTableProps {
  opportunities: Opportunity[];
  canManageOpportunities: boolean;
  onApprove: (id: string) => Promise<void>;
  onReject: (id: string) => Promise<void>;
}

export const OpportunitiesTable = ({
  opportunities,
  canManageOpportunities,
  onApprove,
  onReject,
}: OpportunitiesTableProps) => {
  const [selectedOpportunity, setSelectedOpportunity] = useState<Opportunity | null>(
    null
  );

  const handlePreview = (opportunity: Opportunity) => {
    setSelectedOpportunity(opportunity);
  };

  const handleClosePreview = () => {
    setSelectedOpportunity(null);
  };

  const handleApprove = async (id: string) => {
    await onApprove(id);
    if (selectedOpportunity?.id === id) {
      handleClosePreview();
    }
  };

  const handleReject = async (id: string) => {
    await onReject(id);
    if (selectedOpportunity?.id === id) {
      handleClosePreview();
    }
  };

  return (
    <>
      <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Offer Details</TableCell>
              <TableCell>Source</TableCell>
              <TableCell>Requirements</TableCell>
              <TableCell>AI Insights</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {opportunities.map((opportunity) => (
              <TableRow
                key={opportunity.id}
                sx={{
                  '&:last-child td, &:last-child th': { border: 0 },
                  '&:hover': { bgcolor: 'action.hover' },
                }}
              >
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    {opportunity.logo && (
                      <Box
                        sx={{
                          width: 40,
                          height: 40,
                          position: 'relative',
                          borderRadius: 1,
                          overflow: 'hidden',
                          flexShrink: 0,
                        }}
                      >
                        <Image
                          src={opportunity.logo.url}
                          alt={opportunity.name}
                          fill
                          style={{ objectFit: 'contain' }}
                        />
                      </Box>
                    )}
                    <Box>
                      <Typography variant="subtitle1">{opportunity.name}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {opportunity.type.charAt(0).toUpperCase() +
                          opportunity.type.slice(1)}
                      </Typography>
                      <Typography variant="h6" color="primary">
                        ${opportunity.value.toLocaleString()}
                      </Typography>
                    </Box>
                  </Box>
                </TableCell>

                <TableCell>
                  <Typography variant="body2">{opportunity.source.name}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {new Date(opportunity.source.collected_at).toLocaleDateString()}
                  </Typography>
                </TableCell>

                <TableCell>
                  {opportunity.bonus.requirements.map((req, index) => (
                    <Typography key={index} variant="body2">
                      {req.type === 'spending' && (
                        <>
                          Spend ${req.details.amount.toLocaleString()} in{' '}
                          {req.details.period} days
                        </>
                      )}
                      {req.type === 'direct_deposit' && (
                        <>Direct deposit of ${req.details.amount.toLocaleString()}</>
                      )}
                      {req.type === 'deposit' && (
                        <>
                          Deposit ${req.details.amount.toLocaleString()}
                          {req.details.hold_period &&
                            ` and maintain for ${req.details.hold_period} days`}
                        </>
                      )}
                      {req.type === 'account_closure' && (
                        <>Keep account open for {req.details.period} days</>
                      )}
                    </Typography>
                  ))}
                  {opportunity.details?.expiration && (
                    <Typography variant="caption" color="text.secondary">
                      Expires: {opportunity.details.expiration}
                    </Typography>
                  )}
                </TableCell>

                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography
                      variant="body2"
                      color={
                        opportunity.ai_insights.confidence_score >= 0.8
                          ? 'success.main'
                          : 'warning.main'
                      }
                    >
                      {(opportunity.ai_insights.confidence_score * 100).toFixed(0)}%
                    </Typography>
                    {opportunity.ai_insights.validation_warnings.length > 0 && (
                      <Tooltip
                        title={opportunity.ai_insights.validation_warnings.join('\n')}
                        arrow
                      >
                        <WarningIcon color="warning" sx={{ fontSize: 20 }} />
                      </Tooltip>
                    )}
                  </Box>
                </TableCell>

                <TableCell align="right">
                  <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                    <Tooltip title="Preview">
                      <IconButton size="small" onClick={() => handlePreview(opportunity)}>
                        <PreviewIcon />
                      </IconButton>
                    </Tooltip>

                    {canManageOpportunities && (
                      <>
                        <Tooltip title="Approve">
                          <IconButton
                            size="small"
                            color="success"
                            onClick={() => handleApprove(opportunity.id)}
                          >
                            <CheckCircleIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Reject">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleReject(opportunity.id)}
                          >
                            <CancelIcon />
                          </IconButton>
                        </Tooltip>
                      </>
                    )}
                  </Box>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {selectedOpportunity && (
        <OpportunityPreviewModal
          opportunity={selectedOpportunity}
          open={true}
          onClose={handleClosePreview}
          onApprove={() => handleApprove(selectedOpportunity.id)}
          onReject={() => handleReject(selectedOpportunity.id)}
        />
      )}
    </>
  );
};
