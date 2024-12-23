'use client';

import { useEffect, useState } from 'react';
import { Box, Button, Typography } from '@mui/material';
import RedditTest from '@/components/RedditTest';

export default function TestPage() {
  const [testMode, setTestMode] = useState(false);

  useEffect(() => {
    // Override the fetch function when in test mode
    if (testMode) {
      const originalFetch = window.fetch;
      window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = input.toString();
        
        if (url.includes('/api/reddit')) {
          // Mock Reddit API response
          return new Response(JSON.stringify({
            posts: [{
              id: 'test123',
              selftext: 'Test weekly thread content about Chase Sapphire Preferred and Chase Total Checking offers',
              title: 'Weekly Discussion Thread'
            }],
            comments: [{
              id: 'comment1',
              body: 'Great offers from Chase this week!'
            }]
          }));
        }
        
        if (url.includes('/api/analyze')) {
          // Use the test endpoint from our Python service
          const testResponse = await originalFetch('http://localhost:8000/test');
          return testResponse;
        }
        
        return originalFetch(input, init);
      };
    }
  }, [testMode]);

  return (
    <Box p={3}>
      <Box mb={3} display="flex" alignItems="center" gap={2}>
        <Typography variant="h4">Churning Analysis Test</Typography>
        <Button
          variant={testMode ? 'contained' : 'outlined'}
          onClick={() => setTestMode(!testMode)}
        >
          {testMode ? 'Using Test Data' : 'Use Test Data'}
        </Button>
      </Box>
      
      <RedditTest />
    </Box>
  );
} 