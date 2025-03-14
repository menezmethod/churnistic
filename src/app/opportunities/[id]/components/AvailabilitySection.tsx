import {
  Add as AddIcon,
  Public,
  LocationOn,
  Search as SearchIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import {
  Box,
  Chip,
  Paper,
  Typography,
  useTheme,
  alpha,
  Grid,
  Menu,
  MenuItem,
  ListSubheader,
  TextField,
  InputAdornment,
  Button,
} from '@mui/material';
import { motion } from 'framer-motion';
import * as React from 'react';

import { EditableWrapper } from './EditableWrapper';

// Add US states with abbreviations
const US_STATES_MAP: { [key: string]: string } = {
  AL: 'Alabama',
  AK: 'Alaska',
  AZ: 'Arizona',
  AR: 'Arkansas',
  CA: 'California',
  CO: 'Colorado',
  CT: 'Connecticut',
  DE: 'Delaware',
  FL: 'Florida',
  GA: 'Georgia',
  HI: 'Hawaii',
  ID: 'Idaho',
  IL: 'Illinois',
  IN: 'Indiana',
  IA: 'Iowa',
  KS: 'Kansas',
  KY: 'Kentucky',
  LA: 'Louisiana',
  ME: 'Maine',
  MD: 'Maryland',
  MA: 'Massachusetts',
  MI: 'Michigan',
  MN: 'Minnesota',
  MS: 'Mississippi',
  MO: 'Missouri',
  MT: 'Montana',
  NE: 'Nebraska',
  NV: 'Nevada',
  NH: 'New Hampshire',
  NJ: 'New Jersey',
  NM: 'New Mexico',
  NY: 'New York',
  NC: 'North Carolina',
  ND: 'North Dakota',
  OH: 'Ohio',
  OK: 'Oklahoma',
  OR: 'Oregon',
  PA: 'Pennsylvania',
  RI: 'Rhode Island',
  SC: 'South Carolina',
  SD: 'South Dakota',
  TN: 'Tennessee',
  TX: 'Texas',
  UT: 'Utah',
  VT: 'Vermont',
  VA: 'Virginia',
  WA: 'Washington',
  WV: 'West Virginia',
  WI: 'Wisconsin',
  WY: 'Wyoming',
};

interface ChipData {
  key: string;
  label: string;
  abbr: string;
}

interface AvailabilitySectionProps {
  availability?: {
    type?: string;
    states?: string[];
    details?: string;
  } | null;
  canModify?: boolean;
  isGlobalEditMode?: boolean;
  onUpdate?: (field: string, value: string | number | string[]) => void;
}

export default function AvailabilitySection({
  availability,
  canModify = false,
  isGlobalEditMode = false,
  onUpdate,
}: AvailabilitySectionProps) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const [searchTerm, setSearchTerm] = React.useState('');
  const open = Boolean(anchorEl);

  // Helper function to convert states object to array if needed
  const getStatesArray = (
    states: string[] | Record<string, string> | undefined
  ): string[] => {
    if (!states) return [];
    if (Array.isArray(states)) return states;
    if (typeof states === 'object') {
      return Object.values(states).filter(Boolean).map(String);
    }
    return [];
  };

  const [chipData, setChipData] = React.useState<readonly ChipData[]>(
    availability?.states
      ? getStatesArray(availability.states).map((state) => ({
          key: state,
          label: state,
          abbr:
            Object.entries(US_STATES_MAP).find(([name]) => name === state)?.[0] || state,
        }))
      : []
  );

  React.useEffect(() => {
    setChipData(
      availability?.states
        ? getStatesArray(availability.states).map((state) => ({
            key: state,
            label: state,
            abbr:
              Object.entries(US_STATES_MAP).find(([name]) => name === state)?.[0] ||
              state,
          }))
        : []
    );
  }, [availability?.states]);

  // Effect to ensure availability type stays consistent with selected states
  React.useEffect(() => {
    if (isGlobalEditMode && onUpdate) {
      const newIsNationwide = chipData.length === 0;
      const currentType = availability?.type;

      // Update the type only if it's inconsistent with the chip data
      if (newIsNationwide && currentType !== 'Nationwide') {
        onUpdate('details.availability.type', 'Nationwide');
      } else if (!newIsNationwide && currentType !== 'State-specific') {
        onUpdate('details.availability.type', 'State-specific');
      }
    }
  }, [chipData, isGlobalEditMode, onUpdate, availability?.type]);

  if (availability === undefined && !isGlobalEditMode) return null;

  // Updated logic: nationwide only when no states are selected
  const isNationwide =
    !chipData.length || // No states selected
    availability?.states === undefined || // No states defined in data
    (Array.isArray(availability?.states) && availability.states.length === 0); // Empty states array

  const handleAddClick = (
    event: React.MouseEvent<HTMLDivElement | HTMLButtonElement>
  ) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
    setSearchTerm('');
  };

  const handleStateSelect = (_event: React.MouseEvent, abbr: string, name: string) => {
    const newChips = [...chipData, { key: abbr, label: name, abbr }];
    setChipData(newChips);

    // When adding the first state, update from nationwide to state-specific
    if (newChips.length === 1 && isNationwide) {
      onUpdate?.('details.availability.type', 'State-specific');
    }

    onUpdate?.(
      'details.availability.states',
      newChips.map((chip) => chip.key)
    );
    handleClose();
  };

  const handleDelete = (chipToDelete: ChipData) => {
    const newChips = chipData.filter((chip) => chip.key !== chipToDelete.key);
    setChipData(newChips);

    // When removing the last state, update from state-specific to nationwide
    if (newChips.length === 0) {
      onUpdate?.('details.availability.type', 'Nationwide');
    }

    onUpdate?.(
      'details.availability.states',
      newChips.map((chip) => chip.key)
    );
  };

  const handleDetailsUpdate = (value: string | number) => {
    if (onUpdate) {
      onUpdate('details.availability.details', value.toString());
    }
  };

  const availableStates = Object.entries(US_STATES_MAP).filter(
    ([name]) => !chipData.some((chip) => chip.label === name)
  );

  const filteredStates = availableStates.filter(
    ([abbr, name]) =>
      name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      abbr.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Paper
      elevation={0}
      component={motion.div}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.4 }}
      sx={{
        p: 4,
        mb: 3,
        borderRadius: 3,
        bgcolor: isDark ? alpha(theme.palette.background.paper, 0.6) : 'background.paper',
        border: '1px solid',
        borderColor: isDark ? alpha(theme.palette.divider, 0.1) : 'divider',
        transition: 'all 0.3s',
        position: 'relative',
        overflow: 'hidden',
        backdropFilter: 'blur(8px)',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: theme.shadows[4],
        },
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 3,
          background: `linear-gradient(90deg, ${theme.palette.success.main}, ${theme.palette.success.light})`,
        },
      }}
    >
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
            <Box
              sx={{
                width: 48,
                height: 48,
                borderRadius: 2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: alpha(theme.palette.success.main, 0.1),
                color: theme.palette.success.main,
              }}
            >
              {isNationwide ? (
                <Public sx={{ fontSize: 28 }} />
              ) : (
                <LocationOn sx={{ fontSize: 28 }} />
              )}
            </Box>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Availability
              </Typography>
              <Chip
                label={
                  isNationwide
                    ? 'Available Nationwide'
                    : `Available in ${chipData.length} State${chipData.length !== 1 ? 's' : ''}`
                }
                size="small"
                sx={{
                  mt: 1,
                  bgcolor: isNationwide
                    ? alpha(theme.palette.success.main, 0.1)
                    : alpha(theme.palette.info.main, 0.1),
                  color: isNationwide
                    ? theme.palette.success.main
                    : theme.palette.info.main,
                  borderColor: isNationwide
                    ? alpha(theme.palette.success.main, 0.2)
                    : alpha(theme.palette.info.main, 0.2),
                  border: '1px solid',
                }}
              />
            </Box>
          </Box>
        </Grid>

        {/* Always show the state selection section in edit mode, 
            or when specific states are selected in view mode */}
        {(isGlobalEditMode || !isNationwide) && (
          <Grid item xs={12}>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                mb: 1,
              }}
            >
              <Typography variant="subtitle2" color="text.secondary">
                Available States
              </Typography>
              {isGlobalEditMode && (
                <Button
                  size="small"
                  startIcon={<AddIcon />}
                  onClick={handleAddClick}
                  sx={{
                    borderRadius: 1,
                    textTransform: 'none',
                  }}
                >
                  Add State
                </Button>
              )}
            </Box>
            <Box
              sx={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 0.5,
                p: 2,
                borderRadius: 2,
                bgcolor: alpha(theme.palette.background.default, 0.5),
                border: '1px solid',
                borderColor: alpha(theme.palette.divider, 0.1),
                minHeight: 50,
              }}
            >
              {chipData.map((data) => (
                <Chip
                  key={data.key}
                  label={data.abbr}
                  size="small"
                  title={data.label}
                  deleteIcon={canModify ? <CloseIcon fontSize="small" /> : undefined}
                  onDelete={canModify ? () => handleDelete(data) : undefined}
                  sx={{
                    minWidth: 48,
                    height: 28,
                    bgcolor: alpha(theme.palette.primary.main, 0.1),
                    color: theme.palette.primary.main,
                    border: '1px solid',
                    borderColor: alpha(theme.palette.primary.main, 0.2),
                    '& .MuiChip-label': {
                      px: 1,
                      fontSize: '0.75rem',
                      fontWeight: 600,
                    },
                    '& .MuiChip-deleteIcon': {
                      fontSize: '0.875rem',
                      margin: '0 2px',
                    },
                    '&:hover': {
                      bgcolor: alpha(theme.palette.primary.main, 0.15),
                    },
                  }}
                />
              ))}
              <Menu
                anchorEl={anchorEl}
                open={open}
                onClose={handleClose}
                MenuListProps={{
                  sx: {
                    p: 1,
                  },
                }}
                slotProps={{
                  paper: {
                    sx: {
                      mt: 1,
                      maxHeight: 400,
                      width: 300,
                    },
                  },
                }}
              >
                <ListSubheader sx={{ bgcolor: 'transparent', px: 2, py: 1 }}>
                  <TextField
                    size="small"
                    fullWidth
                    placeholder="Search states..."
                    value={searchTerm}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setSearchTerm(e.target.value)
                    }
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchIcon fontSize="small" />
                        </InputAdornment>
                      ),
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        bgcolor: alpha(theme.palette.background.paper, 0.8),
                      },
                    }}
                  />
                </ListSubheader>
                <Box
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(90px, 1fr))',
                    gap: 0.5,
                    p: 1,
                  }}
                >
                  {filteredStates.map(([abbr, name]) => (
                    <MenuItem
                      key={abbr}
                      onClick={(e) => handleStateSelect(e, abbr, name)}
                      sx={{
                        borderRadius: 1,
                        minHeight: 32,
                        fontSize: '0.875rem',
                        justifyContent: 'center',
                        '&:hover': {
                          bgcolor: alpha(theme.palette.primary.main, 0.1),
                        },
                      }}
                    >
                      <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="caption" sx={{ fontWeight: 600 }}>
                          {abbr}
                        </Typography>
                        <Typography
                          variant="caption"
                          sx={{ display: 'block', color: 'text.secondary' }}
                        >
                          {name}
                        </Typography>
                      </Box>
                    </MenuItem>
                  ))}
                </Box>
                {filteredStates.length === 0 && (
                  <MenuItem disabled>
                    <Typography variant="body2" color="text.secondary">
                      No states available
                    </Typography>
                  </MenuItem>
                )}
              </Menu>
              {!chipData.length && !anchorEl && isGlobalEditMode && (
                <Typography variant="body2" color="text.secondary">
                  Click + to add states
                </Typography>
              )}
            </Box>
          </Grid>
        )}

        {(availability?.details || isGlobalEditMode) && (
          <Grid item xs={12}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Additional Details
            </Typography>
            <EditableWrapper
              fieldName="details"
              value={availability?.details || ''}
              type="multiline"
              isGlobalEditMode={isGlobalEditMode}
              onUpdate={handleDetailsUpdate}
              hideIcon={!canModify}
              showEmpty={isGlobalEditMode}
              customStyles={{
                wrapper: { width: '100%' },
                input: {
                  '& .MuiInputBase-root': {
                    bgcolor: 'transparent',
                    '&:hover, &:focus-within': {
                      bgcolor: alpha(theme.palette.background.paper, 0.6),
                    },
                  },
                },
              }}
            >
              <Typography variant="body2">
                {availability?.details ||
                  (isGlobalEditMode ? '(Click to add details)' : '')}
              </Typography>
            </EditableWrapper>
          </Grid>
        )}
      </Grid>
    </Paper>
  );
}
