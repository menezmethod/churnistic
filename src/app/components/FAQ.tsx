'use client';

import { ExpandMore } from '@mui/icons-material';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Container,
  Typography,
  useTheme,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import { motion } from 'framer-motion';

const FAQ_ITEMS = [
  {
    question: 'How do bank bonuses work?',
    answer:
      'Bank bonuses are incentives offered by financial institutions when you open a new account and meet specific requirements. These typically involve maintaining a minimum balance, setting up direct deposits, or making a certain number of transactions within a specified timeframe.',
  },
  {
    question: 'Will this hurt my credit score?',
    answer:
      "It depends on the type of account. Bank account openings usually only involve a soft pull, which doesn't affect your credit score. Credit card applications typically require a hard pull, which may temporarily lower your score by a few points. We clearly mark which opportunities require hard pulls.",
  },
  {
    question: 'Why do banks offer bonuses?',
    answer:
      "Banks offer bonuses to attract new customers and expand their customer base. They know that once you open an account, you're likely to keep it and potentially use other services. This makes offering sign-up bonuses a cost-effective way for them to acquire long-term customers.",
  },
  {
    question: 'How do I find the best bank bonuses?',
    answer:
      'Our platform tracks and analyzes hundreds of bank bonuses to help you find the most valuable opportunities. We consider factors like bonus value, requirements, time commitment, and geographical restrictions to help you make informed decisions.',
  },
  {
    question: 'How often are new bonuses added?',
    answer:
      'New bonuses are added daily as banks release new promotions. Our system automatically tracks and verifies new offers, ensuring you always have access to the latest opportunities.',
  },
];

export function FAQ() {
  const theme = useTheme();

  return (
    <Container maxWidth="lg">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <Typography
          variant="h4"
          align="center"
          sx={{
            mb: 6,
            fontWeight: 700,
            background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.primary.light})`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          Frequently Asked Questions
        </Typography>
        <Box sx={{ maxWidth: 800, mx: 'auto' }}>
          {FAQ_ITEMS.map((item, index) => (
            <motion.div
              key={item.question}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Accordion
                sx={{
                  mb: 2,
                  bgcolor: 'background.paper',
                  borderRadius: '8px !important',
                  '&:before': { display: 'none' },
                  boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.08)}`,
                  border: `1px solid ${theme.palette.divider}`,
                  overflow: 'hidden',
                  '&.Mui-expanded': {
                    boxShadow: `0 8px 24px ${alpha(theme.palette.primary.main, 0.12)}`,
                  },
                }}
              >
                <AccordionSummary
                  expandIcon={<ExpandMore />}
                  sx={{
                    '& .MuiAccordionSummary-content': {
                      my: 2,
                    },
                  }}
                >
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    {item.question}
                  </Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Typography
                    variant="body1"
                    color="text.secondary"
                    sx={{ mb: 2, lineHeight: 1.7 }}
                  >
                    {item.answer}
                  </Typography>
                </AccordionDetails>
              </Accordion>
            </motion.div>
          ))}
        </Box>
      </motion.div>
    </Container>
  );
}
