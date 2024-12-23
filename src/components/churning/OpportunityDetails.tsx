import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ListAltIcon from '@mui/icons-material/ListAlt';
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn';
import TimerIcon from '@mui/icons-material/Timer';
import { TreeView, TreeItem } from '@mui/lab';
import { Box, Typography } from '@mui/material';
import React from 'react';

interface ChurningOpportunity {
  id: string;
  type: string;
  title: string;
  description: string;
  value: string;
  status: string;
  card_name?: string;
  bank_name?: string;
  signup_bonus?: string;
  bonus_amount?: string;
  requirements: string[];
  risk_level: number;
  time_limit?: string;
  expiration: string;
  source: string;
}

interface OpportunityDetailsProps {
  opportunity: ChurningOpportunity;
}

export const OpportunityDetails: React.FC<OpportunityDetailsProps> = ({
  opportunity,
}) => {
  return (
    <Box sx={{ maxWidth: 400 }}>
      <Typography variant="h6" gutterBottom>
        {opportunity.type === 'credit card' ? (
          <CreditCardIcon sx={{ mr: 1 }} />
        ) : (
          <AccountBalanceIcon sx={{ mr: 1 }} />
        )}
        {opportunity.title}
      </Typography>

      <TreeView
        aria-label="opportunity details"
        defaultExpanded={['1']}
        defaultExpandIcon={<ChevronRightIcon />}
        defaultCollapseIcon={<ExpandMoreIcon />}
        sx={{ flexGrow: 1 }}
      >
        <TreeItem
          nodeId="1"
          label={
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <ListAltIcon sx={{ mr: 1 }} />
              <Typography variant="body1">Basic Information</Typography>
            </Box>
          }
        >
          <TreeItem nodeId="1-1" label={`Type: ${opportunity.type}`} />
          <TreeItem nodeId="1-2" label={`Description: ${opportunity.description}`} />
          <TreeItem nodeId="1-3" label={`Value: ${opportunity.value}`} />
          <TreeItem nodeId="1-4" label={`Status: ${opportunity.status}`} />
          {opportunity.card_name && (
            <TreeItem nodeId="1-5" label={`Card Name: ${opportunity.card_name}`} />
          )}
          {opportunity.bank_name && (
            <TreeItem nodeId="1-6" label={`Bank Name: ${opportunity.bank_name}`} />
          )}
        </TreeItem>

        <TreeItem
          nodeId="2"
          label={
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <MonetizationOnIcon sx={{ mr: 1 }} />
              <Typography variant="body1">Bonus Details</Typography>
            </Box>
          }
        >
          {opportunity.signup_bonus && (
            <TreeItem nodeId="2-1" label={`Signup Bonus: ${opportunity.signup_bonus}`} />
          )}
          {opportunity.bonus_amount && (
            <TreeItem nodeId="2-2" label={`Bonus Amount: ${opportunity.bonus_amount}`} />
          )}
        </TreeItem>

        <TreeItem
          nodeId="3"
          label={
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <ListAltIcon sx={{ mr: 1 }} />
              <Typography variant="body1">Requirements</Typography>
            </Box>
          }
        >
          {opportunity.requirements.map((req, index) => (
            <TreeItem key={index} nodeId={`3-${index}`} label={req} />
          ))}
        </TreeItem>

        <TreeItem
          nodeId="4"
          label={
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <TimerIcon sx={{ mr: 1 }} />
              <Typography variant="body1">Timing & Risk</Typography>
            </Box>
          }
        >
          <TreeItem nodeId="4-1" label={`Risk Level: ${opportunity.risk_level}/10`} />
          {opportunity.time_limit && (
            <TreeItem nodeId="4-2" label={`Time Limit: ${opportunity.time_limit}`} />
          )}
          <TreeItem nodeId="4-3" label={`Expiration: ${opportunity.expiration}`} />
        </TreeItem>
      </TreeView>
    </Box>
  );
};
