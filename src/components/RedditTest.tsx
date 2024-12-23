'use client';

import {
  Box,
  Typography,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  Button,
  Link,
} from '@mui/material';
import React, { useEffect, useState } from 'react';

// Enhanced interfaces to capture more metadata for LLM analysis
interface RedditComment {
  id: string;
  body: string; // Raw comment text
  body_html: string; // HTML formatted text for parsing
  author: string;
  author_flair_text?: string; // User flair can indicate expertise/credibility
  created_utc: number;
  permalink: string;
  score: number; // Upvotes - downvotes
  controversiality?: number;
  depth?: number; // Comment nesting level
  subreddit: string;
  subreddit_id: string;
  distinguished?: string; // Mod/admin status
  gilded?: number; // Awards received
  is_submitter?: boolean; // If comment author is OP
  stickied?: boolean; // Pinned status
  replies?: {
    data: {
      children: Array<{
        data: RedditComment;
      }>;
    };
  };
  // Metadata for LLM analysis
  engagement_metrics?: {
    child_count?: number; // Number of replies
    total_child_score?: number; // Sum of reply scores
    avg_reply_length?: number;
    time_to_first_reply?: number;
  };
}

interface RedditPost {
  id: string;
  title: string;
  selftext: string;
  selftext_html: string;
  created_utc: number;
  permalink: string;
  author: string;
  score: number;
  upvote_ratio: number;
  num_comments: number;
  subreddit: string;
  subreddit_subscribers: number;
  stickied: boolean;
  distinguished?: string;
  gilded: number;
  // Metadata for LLM analysis
  thread_metrics?: {
    top_level_comments?: number;
    avg_comment_score?: number;
    avg_comment_length?: number;
    discussion_velocity?: number; // Comments per hour in first 24h
    engagement_ratio?: number; // Comments/upvotes ratio
  };
  content_markers?: {
    contains_urls?: boolean;
    contains_tables?: boolean;
    formatting_complexity?: number; // Measure of markdown usage
    key_terms?: string[]; // Extracted relevant terms
  };
}

interface RedditResponse<T> {
  data: {
    children: Array<{
      data: T;
      kind: string; // t1 = comment, t3 = post
    }>;
    after?: string; // Pagination token
    before?: string;
  };
  metadata?: {
    retrieved_at: number;
    rate_limit_remaining: number;
  };
}

const Comment = ({ comment }: { comment: RedditComment }) => (
  <Card sx={{ mb: 2 }}>
    <CardContent>
      <Typography variant="body1" paragraph>
        {comment.body}
      </Typography>
      <Typography variant="caption" color="text.secondary">
        {comment.author} {comment.author_flair_text && `(${comment.author_flair_text})`} •{' '}
        Score: {comment.score} • {new Date(comment.created_utc * 1000).toLocaleString()} •{' '}
        <Link
          href={`https://reddit.com${comment.permalink}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          View on Reddit
        </Link>
      </Typography>
      {comment.replies && comment.replies.data.children.length > 0 && (
        <Box sx={{ ml: 4, mt: 2 }}>
          {comment.replies.data.children.map((reply) => (
            <Comment key={reply.data.id} comment={reply.data} />
          ))}
        </Box>
      )}
    </CardContent>
  </Card>
);

export default function RedditTest() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [redditData, setRedditData] = useState<RedditPost[]>([]);
  const [comments, setComments] = useState<RedditComment[]>([]);

  // Enhanced data fetching with metadata collection
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        console.log('Fetching recent threads...');

        const threadsResponse = await fetch('/api/reddit?endpoint=weekly-threads');

        if (!threadsResponse.ok) {
          const text = await threadsResponse.text();
          const data = JSON.parse(text);

          if (data.error?.includes('Authentication required')) {
            const authUrl = data.error.split('Please visit: ')[1];
            setError('Reddit authentication required');
            window.localStorage.setItem('redditAuthUrl', authUrl);
            return;
          }

          throw new Error(`HTTP error! status: ${threadsResponse.status}, body: ${text}`);
        }

        const threadsData = (await threadsResponse.json()) as RedditResponse<RedditPost>;
        console.log('Threads response:', threadsData);

        if (!threadsData.data?.children?.length) {
          console.error('No threads found in response:', threadsData);
          throw new Error('No threads found in response');
        }

        // Enhanced thread selection with metadata
        const weeklyThread = threadsData.data.children.find((child) => {
          const title = child.data.title.toLowerCase();
          const isWeekly =
            title.includes('weekly') ||
            title.includes('week of') ||
            title.includes('weekly thread');
          if (isWeekly) {
            // Enrich with thread metrics
            child.data.thread_metrics = {
              engagement_ratio: child.data.num_comments / (child.data.score || 1),
              top_level_comments: 0, // To be calculated
              avg_comment_score: 0, // To be calculated
            };
          }
          return isWeekly;
        })?.data;

        if (!weeklyThread) {
          console.error(
            'Weekly discussion thread not found in threads:',
            threadsData.data.children.map((child) => child.data.title)
          );
          throw new Error('Weekly discussion thread not found');
        }

        setRedditData([weeklyThread]);

        const commentsResponse = await fetch(
          `/api/reddit?endpoint=comments&postId=${weeklyThread.id}`
        );

        if (!commentsResponse.ok) {
          const text = await commentsResponse.text();
          throw new Error(
            `HTTP error! status: ${commentsResponse.status}, body: ${text}`
          );
        }

        const commentsData = (await commentsResponse.json()) as RedditComment[];

        // Enrich comments with engagement metrics
        const enrichedComments = commentsData.map((comment) => ({
          ...comment,
          engagement_metrics: {
            child_count: comment.replies?.data?.children?.length ?? 0,
            total_child_score:
              comment.replies?.data?.children?.reduce(
                (sum, reply) => sum + (reply.data?.score ?? 0),
                0
              ) ?? 0,
            avg_reply_length:
              comment.replies?.data?.children?.reduce(
                (sum, reply) => sum + (reply.data?.body?.length ?? 0),
                0
              ) ?? 0 / (comment.replies?.data?.children?.length ?? 1),
          },
        }));

        setComments(enrichedComments);
        setLoading(false);
      } catch (err) {
        console.error('Error:', err);
        setError(err instanceof Error ? err.message : 'An error occurred');
        setLoading(false);
      }
    };

    const params = new URLSearchParams(window.location.search);
    const error = params.get('error');
    const success = params.get('success');

    if (error) {
      setError(`Authentication failed: ${error}`);
    } else if (success) {
      window.localStorage.removeItem('redditAuthUrl');
      fetchData();
    } else {
      fetchData();
    }
  }, []);

  if (loading) {
    return (
      <Box
        display="flex"
        flexDirection="column"
        alignItems="center"
        gap={2}
        minHeight="200px"
      >
        <CircularProgress />
        <Typography>Loading Reddit data...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={2}>
        <Alert severity="error" sx={{ mb: 2 }}>
          <Typography variant="h6">Error loading Reddit data</Typography>
          <Typography>{error}</Typography>
        </Alert>
        {window.localStorage.getItem('redditAuthUrl') && (
          <Button
            variant="contained"
            onClick={() => {
              const authUrl = window.localStorage.getItem('redditAuthUrl');
              if (authUrl) window.location.href = authUrl;
            }}
            sx={{ mt: 2 }}
          >
            Authorize with Reddit
          </Button>
        )}
      </Box>
    );
  }

  return (
    <Box p={2}>
      {redditData.map((post) => (
        <Box key={post.id} mb={4}>
          <Typography variant="h4" gutterBottom>
            Reddit Thread Analysis
          </Typography>

          <Card sx={{ mb: 4 }}>
            <CardContent>
              <Link
                href={`https://reddit.com${post.permalink}`}
                target="_blank"
                rel="noopener noreferrer"
                sx={{
                  textDecoration: 'none',
                  color: 'inherit',
                  '&:hover': {
                    textDecoration: 'underline',
                  },
                }}
              >
                <Typography variant="h5" gutterBottom>
                  {post.title}
                </Typography>
              </Link>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Posted by {post.author} • Score: {post.score} • Upvote Ratio:{' '}
                {(post.upvote_ratio * 100).toFixed(1)}% •{' '}
                {new Date(post.created_utc * 1000).toLocaleString()}
              </Typography>
              <Typography variant="body1" paragraph>
                {post.selftext}
              </Typography>
            </CardContent>
          </Card>

          <Box mt={4}>
            <Typography variant="h6" gutterBottom>
              Comments ({comments.length})
            </Typography>
            {comments.map((comment) => (
              <Comment key={comment.id} comment={comment} />
            ))}
          </Box>
        </Box>
      ))}
    </Box>
  );
}
