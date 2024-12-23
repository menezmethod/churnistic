'use client';

import {
  Box,
  Typography,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  Chip,
  Stack,
} from '@mui/material';
import React, { useEffect, useState } from 'react';

interface RedditComment {
  id: string;
  body: string;
  author: string;
  created_utc: number;
  body_html: string;
  permalink: string;
  score: number;
  author_flair_text?: string;
  subreddit: string;
  subreddit_id: string;
}

interface RedditPost {
  id: string;
  title: string;
  selftext: string;
  created_utc: number;
  permalink: string;
  author: string;
}

interface RedditData {
  data: {
    children: Array<{
      data: RedditPost;
    }>;
  };
}

interface ChurningOpportunity {
  title: string;
  description: string;
  cardName: string;
  rewardType: string;
  rewardValue: string;
  requirements: string[];
  riskLevel: 'Low' | 'Medium' | 'High';
  timeframe: string;
  source: string;
}

interface AnalyzedData {
  opportunities: ChurningOpportunity[];
  summary: string;
  riskAssessment: string;
}

interface PythonOpportunity {
  type: 'credit_card' | 'bank_account';
  title: string;
  description: string;
  card_name: string;
  bank_name: string;
  signup_bonus: string;
  bonus_amount: string;
  requirements: string[];
  risk_level: number;
  time_limit: string;
  expiration: string;
  source: string;
}

interface PythonAnalysis {
  opportunities: PythonOpportunity[];
  summary: { overview?: string } | string;
  risk_assessment: { overview?: string } | string;
}

export default function RedditTest() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [redditData, setRedditData] = useState<RedditPost[]>([]);
  const [comments, setComments] = useState<RedditComment[]>([]);
  const [analyzedData, setAnalyzedData] = useState<AnalyzedData | null>(null);

  const analyzeContent = async (post: RedditPost, comments: RedditComment[]) => {
    try {
      const response = await fetch('http://localhost:8000/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          thread_title: post.title,
          thread_content: post.selftext,
          comments: comments.map((comment) => comment.body),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        console.error('Analysis error details:', errorData);
        throw new Error(`Failed to analyze content: ${response.status}`);
      }

      const analysis = (await response.json()) as PythonAnalysis;
      setAnalyzedData({
        opportunities: analysis.opportunities.map((opp: PythonOpportunity) => ({
          title: opp.title,
          description: opp.description,
          cardName:
            opp.type === 'credit_card' ? opp.card_name : opp.bank_name || 'Unknown',
          rewardType: opp.type === 'credit_card' ? 'Points/Miles' : 'Cash',
          rewardValue:
            opp.type === 'credit_card' ? opp.signup_bonus : opp.bonus_amount || 'Unknown',
          requirements: opp.requirements,
          riskLevel:
            opp.risk_level <= 3 ? 'Low' : opp.risk_level <= 7 ? 'Medium' : 'High',
          timeframe:
            opp.type === 'credit_card' ? opp.time_limit : opp.expiration || 'Unknown',
          source: opp.source,
        })),
        summary:
          typeof analysis.summary === 'string'
            ? analysis.summary
            : analysis.summary.overview || 'No summary available',
        riskAssessment:
          typeof analysis.risk_assessment === 'string'
            ? analysis.risk_assessment
            : analysis.risk_assessment.overview || 'No risk assessment available',
      });
    } catch (err) {
      console.error('Analysis error:', err);
      setError(err instanceof Error ? err.message : 'Failed to analyze content');
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        console.log('Fetching weekly threads...');

        // Fetch weekly threads
        const response = await fetch('/api/reddit?endpoint=weekly-threads');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = (await response.json()) as RedditData;
        console.log('Parsed Reddit data:', data);

        if (!data.data?.children) {
          throw new Error('Invalid Reddit data format');
        }

        const threads = data.data.children.map((child) => child.data);
        if (threads.length === 0) {
          throw new Error('No threads found');
        }

        // Select the first thread
        const selectedThread = threads[0];
        console.log('Selected thread:', selectedThread);
        setRedditData([selectedThread]);

        // Fetch comments for the selected thread
        console.log('Fetching comments for thread:', selectedThread.id);
        const commentsResponse = await fetch(
          `/api/reddit?endpoint=comments&postId=${selectedThread.id}`
        );
        if (!commentsResponse.ok) {
          throw new Error(`HTTP error! status: ${commentsResponse.status}`);
        }

        const commentsData = await commentsResponse.json();
        console.log('Parsed comments data:', commentsData);

        if (!Array.isArray(commentsData)) {
          throw new Error('Invalid comments data format');
        }

        // Filter valid comments
        const validComments = commentsData.filter(
          (comment) => comment && comment.body && comment.author
        );
        setComments(validComments);

        // Analyze the content using the Python service
        await analyzeContent(selectedThread, validComments);
        setLoading(false);
      } catch (err) {
        console.error('Error:', err);
        setError(err instanceof Error ? err.message : 'An error occurred');
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={2}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  return (
    <Box p={2}>
      {redditData.map((post) => (
        <Box key={post.id} mb={4}>
          <Typography variant="h4" gutterBottom>
            Churning Analysis Test
          </Typography>

          <Card sx={{ mb: 4 }}>
            <CardContent>
              <Typography variant="h5" gutterBottom>
                {post.title}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Posted by {post.author} on{' '}
                {new Date(post.created_utc * 1000).toLocaleString()}
              </Typography>
              <Typography variant="body1" paragraph>
                {post.selftext}
              </Typography>
            </CardContent>
          </Card>

          {analyzedData && (
            <>
              <Card sx={{ mb: 4 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Summary
                  </Typography>
                  <Typography variant="body1" paragraph>
                    {analyzedData.summary}
                  </Typography>
                  <Typography variant="h6" gutterBottom>
                    Risk Assessment
                  </Typography>
                  <Typography variant="body1" paragraph>
                    {analyzedData.riskAssessment}
                  </Typography>
                </CardContent>
              </Card>

              <Typography variant="h6" gutterBottom>
                Opportunities ({analyzedData.opportunities.length})
              </Typography>
              {analyzedData.opportunities.map((opportunity, index) => (
                <Card key={index} sx={{ mb: 2 }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      {opportunity.cardName}
                    </Typography>
                    <Typography variant="body1" paragraph>
                      {opportunity.description}
                    </Typography>
                    <Stack direction="row" spacing={1} mb={1}>
                      <Chip
                        label={`Reward: ${opportunity.rewardValue} ${opportunity.rewardType}`}
                        color="primary"
                      />
                      <Chip
                        label={`Risk: ${opportunity.riskLevel}`}
                        color={
                          opportunity.riskLevel === 'Low'
                            ? 'success'
                            : opportunity.riskLevel === 'Medium'
                              ? 'warning'
                              : 'error'
                        }
                      />
                      <Chip label={`Timeframe: ${opportunity.timeframe}`} />
                    </Stack>
                    <Typography variant="subtitle2" gutterBottom>
                      Requirements:
                    </Typography>
                    <ul>
                      {opportunity.requirements.map((req, i) => (
                        <li key={i}>{req}</li>
                      ))}
                    </ul>
                    <Typography variant="caption" color="text.secondary">
                      Source: {opportunity.source}
                    </Typography>
                  </CardContent>
                </Card>
              ))}
            </>
          )}

          <Box mt={4}>
            <Typography variant="h6" gutterBottom>
              Comments ({comments.length})
            </Typography>
            {comments.map((comment) => (
              <Card key={comment.id} sx={{ mb: 2 }}>
                <CardContent>
                  <Typography variant="body1" paragraph>
                    {comment.body}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {comment.author}{' '}
                    {comment.author_flair_text && `(${comment.author_flair_text})`} •
                    Score: {comment.score} •{' '}
                    {new Date(comment.created_utc * 1000).toLocaleString()}
                  </Typography>
                </CardContent>
              </Card>
            ))}
          </Box>
        </Box>
      ))}
    </Box>
  );
}
