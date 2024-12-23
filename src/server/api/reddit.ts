import { NextResponse } from 'next/server';

// Rate limit tracking over 10-minute window
const WINDOW_SIZE_MS = 10 * 60 * 1000; // 10 minutes
const MAX_REQUESTS_PER_WINDOW = 100; // Reddit's OAuth limit
const MIN_REQUEST_INTERVAL = 100; // Minimum 100ms between requests for bursting
const USER_AGENT = 'Churnistic/1.0.0';

interface RateLimitInfo {
  used: number;
  remaining: number;
  resetTime: number;
}

interface RequestTracker {
  rateLimitInfo: RateLimitInfo;
  lastRequest: number;
}

export interface RedditPost {
  id: string;
  title: string;
  selftext: string;
  created_utc: number;
  permalink: string;
  author: string;
}

export interface RedditComment {
  id: string;
  body: string;
  author: string;
  created_utc: number;
}

interface RedditListingChild<T> {
  kind: string;
  data: T;
}

interface RedditListing<T> {
  kind: string;
  data: {
    children: RedditListingChild<T>[];
  };
}

interface RedditOAuthResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  scope: string;
}

export class RedditAPI {
  private requestTracker: RequestTracker;
  private accessToken: string | null = null;
  private tokenExpiry: number = 0;

  constructor() {
    this.requestTracker = {
      rateLimitInfo: {
        used: 0,
        remaining: MAX_REQUESTS_PER_WINDOW,
        resetTime: Date.now() + WINDOW_SIZE_MS,
      },
      lastRequest: 0,
    };
  }

  private updateRateLimits(headers: Headers) {
    const used = parseInt(headers.get('x-ratelimit-used') || '0', 10);
    const remaining = parseInt(headers.get('x-ratelimit-remaining') || '0', 10);
    const resetSeconds = parseInt(headers.get('x-ratelimit-reset') || '0', 10);

    this.requestTracker.rateLimitInfo = {
      used,
      remaining,
      resetTime: Date.now() + resetSeconds * 1000,
    };

    // Log rate limit info for monitoring
    console.log('Rate limit info:', {
      used,
      remaining,
      resetTime: new Date(this.requestTracker.rateLimitInfo.resetTime).toISOString(),
    });
  }

  private canMakeRequest(): boolean {
    const now = Date.now();

    // Reset rate limit info if window has passed
    if (now >= this.requestTracker.rateLimitInfo.resetTime) {
      this.requestTracker.rateLimitInfo = {
        used: 0,
        remaining: MAX_REQUESTS_PER_WINDOW,
        resetTime: now + WINDOW_SIZE_MS,
      };
      console.log('Rate limit window reset');
    }

    // Check if we have remaining requests
    if (this.requestTracker.rateLimitInfo.remaining <= 0) {
      console.warn('Rate limit exceeded, waiting for reset');
      return false;
    }

    // Ensure minimum interval between requests for bursting
    if (now - this.requestTracker.lastRequest < MIN_REQUEST_INTERVAL) {
      console.warn('Request interval too short, waiting');
      return false;
    }

    return true;
  }

  private async ensureAccessToken(): Promise<string> {
    if (this.accessToken && Date.now() < this.tokenExpiry) {
      return this.accessToken;
    }

    if (!process.env.REDDIT_CLIENT_ID || !process.env.REDDIT_CLIENT_SECRET) {
      throw new Error('Reddit OAuth credentials not configured');
    }

    console.log('Requesting new access token...');
    const auth = Buffer.from(
      `${process.env.REDDIT_CLIENT_ID}:${process.env.REDDIT_CLIENT_SECRET}`
    ).toString('base64');

    try {
      const response = await fetch('https://www.reddit.com/api/v1/access_token', {
        method: 'POST',
        headers: {
          Authorization: `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': process.env.REDDIT_USER_AGENT || USER_AGENT,
        },
        body: 'grant_type=client_credentials',
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Failed to obtain Reddit access token: ${response.status} ${error}`);
      }

      const data = (await response.json()) as RedditOAuthResponse;
      if (!data.access_token) {
        throw new Error('No access token in Reddit response');
      }

      this.accessToken = data.access_token;
      this.tokenExpiry = Date.now() + data.expires_in * 1000;
      return data.access_token;
    } catch (error) {
      console.error('Error obtaining Reddit access token:', error);
      throw error;
    }
  }

  async getWeeklyThreads(): Promise<RedditPost[]> {
    if (!this.canMakeRequest()) {
      throw new Error('Rate limit exceeded. Please try again later.');
    }

    try {
      const accessToken = await this.ensureAccessToken();
      const url = 'https://oauth.reddit.com/r/churning/new.json?limit=10';

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'User-Agent': process.env.REDDIT_USER_AGENT || USER_AGENT,
        },
      });

      this.updateRateLimits(response.headers);
      this.requestTracker.lastRequest = Date.now();

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Error fetching data from Reddit: ${response.status} ${error}`);
      }

      const data = (await response.json()) as RedditListing<RedditPost>;
      const threads = data.data.children.map((child) => child.data);

      console.log('Retrieved weekly threads:', {
        count: threads.length,
        titles: threads.map((t) => t.title),
      });

      return threads;
    } catch (error) {
      console.error('Error fetching weekly threads:', error);
      throw error;
    }
  }

  async getPostComments(postId: string): Promise<RedditComment[]> {
    if (!this.canMakeRequest()) {
      throw new Error('Rate limit exceeded. Please try again later.');
    }

    try {
      const accessToken = await this.ensureAccessToken();
      const url = `https://oauth.reddit.com/r/churning/comments/${postId}.json`;

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'User-Agent': process.env.REDDIT_USER_AGENT || USER_AGENT,
        },
      });

      this.updateRateLimits(response.headers);
      this.requestTracker.lastRequest = Date.now();

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Error fetching comments from Reddit: ${response.status} ${error}`);
      }

      const data = (await response.json()) as [
        RedditListing<RedditPost>,
        RedditListing<RedditComment>,
      ];

      const comments = data[1].data.children.map((child) => child.data).slice(0, 10);
      console.log('Retrieved comments:', {
        postId,
        count: comments.length,
      });

      return comments;
    } catch (error) {
      console.error('Error fetching post comments:', error);
      throw error;
    }
  }
}

// API Route handler
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const endpoint = searchParams.get('endpoint');
    const postId = searchParams.get('postId');

    if (!endpoint) {
      return NextResponse.json({ error: 'Missing endpoint parameter' }, { status: 400 });
    }

    const api = new RedditAPI();

    switch (endpoint) {
      case 'weekly-threads':
        const threads = await api.getWeeklyThreads();
        // Format response to match expected structure
        return NextResponse.json({
          data: {
            children: threads.map((thread) => ({
              data: {
                id: thread.id,
                title: thread.title,
                selftext: thread.selftext,
                created_utc: thread.created_utc,
                permalink: thread.permalink,
                author: thread.author,
              },
            })),
          },
        });
      case 'comments':
        if (!postId) {
          return NextResponse.json(
            { error: 'Missing postId parameter' },
            { status: 400 }
          );
        }
        const comments = await api.getPostComments(postId);
        // Format comments to match expected structure
        return NextResponse.json({
          data: {
            children: comments.map((comment) => ({
              data: {
                id: comment.id,
                body: comment.body,
                author: comment.author,
                created_utc: comment.created_utc,
              },
            })),
          },
        });
      default:
        return NextResponse.json({ error: 'Invalid endpoint' }, { status: 400 });
    }
  } catch (error) {
    console.error('Reddit API route error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
