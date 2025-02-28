import { KeyboardArrowRight, Send, Close, MoreVert, AccountBalance, CreditCard, TrendingUp } from '@mui/icons-material';
import {
  alpha,
  Box,
  Button,
  IconButton,
  Paper,
  TextField,
  Typography,
  useTheme,
  CircularProgress,
  Menu,
  MenuItem,
  Tooltip,
  Chip,
  Stack,
} from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import ReactMarkdown from 'react-markdown';

import { useChat } from '@/lib/hooks/useChat';
import { Message as ChatMessage } from '@/types/chat';

const EXAMPLE_QUESTIONS = [
  { text: "What's the best bank bonus right now?", icon: <AccountBalance sx={{ fontSize: 16 }} /> },
  { text: "Show me top credit card offers", icon: <CreditCard sx={{ fontSize: 16 }} /> },
  { text: "Current brokerage promotions?", icon: <TrendingUp sx={{ fontSize: 16 }} /> },
];

export const ChatBox = () => {
  const theme = useTheme();
  const [isExpanded, setIsExpanded] = useState(false);
  const [message, setMessage] = useState('');
  const { messages, isTyping, error, sendMessage, clearChat } = useChat();
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim()) {
      sendMessage(message.trim());
      setMessage('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleExampleClick = (question: string) => {
    sendMessage(question);
  };

  const MessageBubble = ({ message }: { message: ChatMessage }) => (
    <Box
      sx={{
        p: 2.5,
        borderRadius: message.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
        bgcolor: message.role === 'user' 
          ? alpha(theme.palette.primary.main, 0.12)
          : alpha(theme.palette.common.white, 0.05),
        color: 'common.white',
        maxWidth: '85%',
        ml: message.role === 'user' ? 'auto' : 0,
        mb: 3,
        position: 'relative',
        boxShadow: `0 2px 8px ${alpha(
          theme.palette.common.black,
          message.role === 'user' ? 0.08 : 0.04
        )}`,
      }}
    >
      <ReactMarkdown
        components={{
          p: ({ children }) => (
            <Typography
              variant="body1"
              component="div"
              sx={{
                lineHeight: 1.6,
                letterSpacing: 0.2,
                fontWeight: 400,
              }}
            >
              {children}
            </Typography>
          ),
        }}
      >
        {message.content}
      </ReactMarkdown>
      <Typography
        variant="caption"
        sx={{
          position: 'absolute',
          bottom: -20,
          right: message.role === 'user' ? 4 : 'auto',
          left: message.role === 'assistant' ? 4 : 'auto',
          color: alpha(theme.palette.common.white, 0.5),
          fontSize: '0.7rem',
        }}
      >
        {new Date(message.timestamp).toLocaleTimeString()}
      </Typography>
    </Box>
  );

  return (
    <Box
      component={motion.div}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      sx={{
        position: 'fixed',
        bottom: 24,
        right: 24,
        zIndex: 1000,
      }}
    >
      <AnimatePresence>
        {isExpanded && (
          <Paper
            component={motion.div}
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            sx={{
              position: 'absolute',
              bottom: '100%',
              right: 0,
              mb: 2,
              width: {
                xs: 'calc(100vw - 32px)',
                sm: 400,
                md: 440,
                lg: 480,
              },
              maxWidth: '100vw',
              height: {
                xs: 'calc(100vh - 100px)',
                sm: 540,
                md: 600,
              },
              maxHeight: 'calc(100vh - 100px)',
              overflow: 'hidden',
              borderRadius: 2,
              bgcolor: alpha(theme.palette.primary.dark, 0.95),
              backdropFilter: 'blur(10px)',
              border: '1px solid',
              borderColor: alpha(theme.palette.common.white, 0.1),
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {/* Chat Header */}
            <Box
              sx={{
                px: 2.5,
                py: 2,
                bgcolor: theme.palette.primary.dark,
                borderBottom: '1px solid',
                borderColor: alpha(theme.palette.common.white, 0.1),
              }}
            >
              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                mb: 1,
              }}>
                <Typography
                  variant="h6"
                  sx={{
                    color: 'common.white',
                    fontWeight: 600,
                    fontSize: { xs: '1.1rem', sm: '1.25rem' },
                    letterSpacing: 0.5,
                  }}
                >
                  Financial Rewards Assistant
                </Typography>
                <Box sx={{ display: 'flex', gap: 0.5 }}>
                  <Tooltip title="Menu">
                    <IconButton
                      onClick={(e) => setMenuAnchor(e.currentTarget)}
                      size="small"
                      sx={{ color: 'common.white' }}
                    >
                      <MoreVert fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Menu
                    anchorEl={menuAnchor}
                    open={Boolean(menuAnchor)}
                    onClose={() => setMenuAnchor(null)}
                    PaperProps={{
                      sx: {
                        bgcolor: theme.palette.primary.dark,
                        color: 'common.white',
                        minWidth: 120,
                      },
                    }}
                  >
                    <MenuItem onClick={() => {
                      clearChat();
                      setMenuAnchor(null);
                    }}>
                      Clear Chat
                    </MenuItem>
                  </Menu>
                  <Tooltip title="Close">
                    <IconButton
                      onClick={() => setIsExpanded(false)}
                      size="small"
                      sx={{ color: 'common.white' }}
                    >
                      <Close fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Box>
              </Box>
              <Typography
                variant="caption"
                sx={{
                  color: alpha(theme.palette.common.white, 0.7),
                  letterSpacing: 0.3,
                }}
              >
                Ask about bank bonuses, credit card rewards, or brokerage promotions
              </Typography>
            </Box>

            {/* Chat Messages Area */}
            <Box
              sx={{
                flex: 1,
                overflowY: 'auto',
                p: 3,
                display: 'flex',
                flexDirection: 'column',
                '&::-webkit-scrollbar': {
                  width: '6px',
                },
                '&::-webkit-scrollbar-track': {
                  background: 'transparent',
                },
                '&::-webkit-scrollbar-thumb': {
                  background: alpha(theme.palette.common.white, 0.2),
                  borderRadius: '3px',
                },
                '&::-webkit-scrollbar-thumb:hover': {
                  background: alpha(theme.palette.common.white, 0.3),
                },
              }}
            >
              {messages.length === 0 ? (
                <>
                  <Box
                    sx={{
                      p: 2.5,
                      borderRadius: 2,
                      bgcolor: alpha(theme.palette.common.white, 0.05),
                      color: 'common.white',
                      maxWidth: '85%',
                      border: '1px solid',
                      borderColor: alpha(theme.palette.common.white, 0.1),
                      mb: 3,
                    }}
                  >
                    <Typography variant="body1" sx={{ lineHeight: 1.6 }}>
                      Hi! I can help you find the best financial opportunities across banks, credit cards, and brokerages. What would you like to know?
                    </Typography>
                  </Box>
                  <Typography
                    variant="caption"
                    sx={{
                      color: alpha(theme.palette.common.white, 0.7),
                      mb: 1.5,
                      fontWeight: 500,
                    }}
                  >
                    Try asking about:
                  </Typography>
                  <Stack direction="row" spacing={1} flexWrap="wrap" gap={1}>
                    {EXAMPLE_QUESTIONS.map((q, i) => (
                      <Chip
                        key={i}
                        label={q.text}
                        icon={q.icon}
                        onClick={() => handleExampleClick(q.text)}
                        sx={{
                          bgcolor: alpha(theme.palette.common.white, 0.08),
                          color: 'common.white',
                          '&:hover': {
                            bgcolor: alpha(theme.palette.common.white, 0.12),
                          },
                          '& .MuiChip-icon': {
                            color: 'inherit',
                          },
                        }}
                      />
                    ))}
                  </Stack>
                </>
              ) : (
                messages.map((msg) => (
                  <MessageBubble key={msg.id} message={msg} />
                ))
              )}
              {isTyping && (
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.5,
                    color: 'common.white',
                    p: 2,
                  }}
                >
                  <CircularProgress size={14} color="inherit" />
                  <Typography variant="body2" sx={{ letterSpacing: 0.3 }}>
                    Searching for opportunities...
                  </Typography>
                </Box>
              )}
              {error && (
                <Typography
                  variant="body2"
                  sx={{
                    color: theme.palette.error.light,
                    mt: 1,
                    textAlign: 'center',
                    p: 2,
                    borderRadius: 2,
                    bgcolor: alpha(theme.palette.error.main, 0.1),
                  }}
                >
                  {error}
                </Typography>
              )}
            </Box>

            {/* Chat Input */}
            <Box
              component="form"
              onSubmit={handleSubmit}
              sx={{
                p: 2,
                borderTop: '1px solid',
                borderColor: alpha(theme.palette.common.white, 0.1),
                bgcolor: alpha(theme.palette.primary.dark, 0.6),
              }}
            >
              <Box sx={{ display: 'flex', gap: 1 }}>
                <TextField
                  fullWidth
                  multiline
                  maxRows={4}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask about any financial rewards..."
                  variant="outlined"
                  size="small"
                  disabled={isTyping}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      bgcolor: alpha(theme.palette.common.white, 0.05),
                      color: 'common.white',
                      borderRadius: 1.5,
                      '& fieldset': {
                        borderColor: alpha(theme.palette.common.white, 0.2),
                      },
                      '&:hover fieldset': {
                        borderColor: alpha(theme.palette.common.white, 0.25),
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: alpha(theme.palette.common.white, 0.3),
                      },
                    },
                    '& .MuiInputBase-input': {
                      p: 1.5,
                    },
                    '& .MuiInputBase-input::placeholder': {
                      color: alpha(theme.palette.common.white, 0.5),
                      opacity: 1,
                    },
                  }}
                />
                <Tooltip title={isTyping ? 'Processing...' : 'Send message'}>
                  <span>
                    <IconButton
                      type="submit"
                      disabled={isTyping || !message.trim()}
                      sx={{
                        bgcolor: alpha(theme.palette.common.white, 0.1),
                        color: 'common.white',
                        width: 40,
                        height: 40,
                        '&:hover': {
                          bgcolor: alpha(theme.palette.common.white, 0.15),
                        },
                        '&.Mui-disabled': {
                          bgcolor: alpha(theme.palette.common.white, 0.05),
                          color: alpha(theme.palette.common.white, 0.3),
                        },
                      }}
                    >
                      <Send fontSize="small" />
                    </IconButton>
                  </span>
                </Tooltip>
              </Box>
            </Box>
          </Paper>
        )}
      </AnimatePresence>

      {/* Chat Toggle Button */}
      <Button
        onClick={() => setIsExpanded(!isExpanded)}
        variant="contained"
        startIcon={<KeyboardArrowRight />}
        sx={{
          minWidth: 240,
          py: 1.5,
          px: 2.5,
          borderRadius: 2,
          bgcolor: theme.palette.primary.dark,
          color: 'common.white',
          textTransform: 'none',
          fontSize: '1rem',
          fontWeight: 600,
          letterSpacing: 0.3,
          '&:hover': {
            bgcolor: theme.palette.primary.dark,
            transform: 'translateY(-2px)',
          },
        }}
      >
        {isExpanded ? 'Close Assistant' : 'Financial Rewards Assistant'}
      </Button>
    </Box>
  );
}; 