import RestartAltIcon from '@mui/icons-material/RestartAlt';
import { Box, Button, ButtonGroup, IconButton, Tooltip } from '@mui/material';

import { FormData, OfferType } from '@/types/opportunity';

interface DebugToolsProps {
  formData: FormData;
  onLoadSample: (type: OfferType) => void;
  onReset: () => void;
}

export function DebugTools({ formData, onLoadSample, onReset }: DebugToolsProps) {
  if (process.env.NODE_ENV === 'production') return null;

  const offerTypes: OfferType[] = ['bank', 'credit_card', 'brokerage'];

  return (
    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
      <ButtonGroup variant="outlined" size="small">
        {offerTypes.map((type) => (
          <Button
            key={type}
            onClick={() => onLoadSample(type)}
            variant={formData.type === type ? 'contained' : 'outlined'}
          >
            Load {type.replace('_', ' ')}
          </Button>
        ))}
      </ButtonGroup>
      <Tooltip title="Reset form" arrow placement="left">
        <IconButton
          onClick={onReset}
          size="small"
          sx={{
            transition: 'transform 0.2s',
            '&:hover': {
              transform: 'rotate(180deg)',
            },
          }}
        >
          <RestartAltIcon />
        </IconButton>
      </Tooltip>
    </Box>
  );
}
