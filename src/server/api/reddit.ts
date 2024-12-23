import { NextResponse } from 'next/server';

// Rate limit tracking over 10-minute window
const WINDOW_SIZE_MS = 10 * 60 * 1000; // 10 minutes
const MAX_REQUESTS_PER_WINDOW = 100; // Reddit's OAuth limit
const MIN_REQUEST_INTERVAL = 100; // Minimum 100ms between requests for bursting

interface RateLimitInfo {
  used: number;
  remaining: number;
  resetTime: number;
}

interface RequestTracker {
  rateLimitInfo: RateLimitInfo;
  lastRequest: number;
}

interface RedditPost {
  id: string;
  title: string;
  selftext: string;
  created_utc: number;
  permalink: string;
  author: string;
}

interface RedditComment {
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
    }

    // Check if we have remaining requests
    if (this.requestTracker.rateLimitInfo.remaining <= 0) {
      return false;
    }

    // Ensure minimum interval between requests for bursting
    if (now - this.requestTracker.lastRequest < MIN_REQUEST_INTERVAL) {
      return false;
    }

    return true;
  }

  private async ensureAccessToken(): Promise<string> {
    if (this.accessToken && Date.now() < this.tokenExpiry) {
      console.log(
        'Using existing access token:',
        this.accessToken.substring(0, 10) + '...'
      );
      return this.accessToken;
    }

    if (!process.env.REDDIT_CLIENT_ID || !process.env.REDDIT_CLIENT_SECRET) {
      console.error('Missing Reddit credentials:', {
        hasClientId: !!process.env.REDDIT_CLIENT_ID,
        hasClientSecret: !!process.env.REDDIT_CLIENT_SECRET,
      });
      throw new Error('Reddit OAuth credentials not configured');
    }

    console.log('Requesting new access token...');
    const auth = Buffer.from(
      `${process.env.REDDIT_CLIENT_ID}:${process.env.REDDIT_CLIENT_SECRET}`
    ).toString('base64');
    const response = await fetch('https://www.reddit.com/api/v1/access_token', {
      method: 'POST',
      headers: {
        Authorization: `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': process.env.REDDIT_USER_AGENT || 'Churnistic/1.0.0',
      },
      body: 'grant_type=client_credentials',
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Reddit OAuth error:', error);
      console.error('Response status:', response.status);
      console.error('Response headers:', Object.fromEntries(response.headers.entries()));
      throw new Error(
        `Failed to obtain Reddit access token: ${response.status} ${error}`
      );
    }

    const data = (await response.json()) as RedditOAuthResponse;
    if (!data.access_token) {
      console.error('Invalid OAuth response:', data);
      throw new Error('No access token in Reddit response');
    }

    console.log('Obtained new access token:', data.access_token.substring(0, 10) + '...');
    console.log('Token expires in:', data.expires_in, 'seconds');

    this.accessToken = data.access_token;
    this.tokenExpiry = Date.now() + data.expires_in * 1000;
    return data.access_token;
  }

  async getWeeklyThreads(): Promise<RedditPost[]> {
    if (!this.canMakeRequest()) {
      throw new Error('Rate limit exceeded. Please try again later.');
    }

    const accessToken = await this.ensureAccessToken();
    // Try to get the most recent threads
    const url = 'https://oauth.reddit.com/r/churning/new.json?limit=10';

    console.log('Fetching weekly threads from URL:', url);
    console.log('Using access token:', accessToken.substring(0, 10) + '...');

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'User-Agent': process.env.REDDIT_USER_AGENT || 'Churnistic/1.0.0',
      },
    });

    this.updateRateLimits(response.headers);
    this.requestTracker.lastRequest = Date.now();

    if (!response.ok) {
      const error = await response.text();
      console.error('Reddit API error:', error);
      console.error('Response status:', response.status);
      console.error('Response headers:', Object.fromEntries(response.headers.entries()));
      throw new Error(`Error fetching data from Reddit: ${response.status} ${error}`);
    }

    const data = (await response.json()) as RedditListing<RedditPost>;
    console.log('Found total threads:', data.data.children.length);

    // Return all threads for now, let the UI handle filtering if needed
    const threads = data.data.children.map((child) => {
      console.log('Thread:', {
        title: child.data.title,
        author: child.data.author,
        created: new Date(child.data.created_utc * 1000).toISOString(),
      });
      return child.data;
    });

    console.log('Returning threads:', threads.length);
    return threads;
  }

  async getPostComments(postId: string): Promise<RedditComment[]> {
    if (!this.canMakeRequest()) {
      throw new Error('Rate limit exceeded. Please try again later.');
    }

    const accessToken = await this.ensureAccessToken();
    const url = `https://oauth.reddit.com/r/churning/comments/${postId}.json`;

    console.log('Fetching comments with token:', accessToken);
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'User-Agent': process.env.REDDIT_USER_AGENT || 'Churnistic/1.0.0',
      },
    });

    this.updateRateLimits(response.headers);
    this.requestTracker.lastRequest = Date.now();

    if (!response.ok) {
      const error = await response.text();
      console.error('Reddit API error:', error);
      throw new Error('Error fetching comments from Reddit');
    }

    const data = (await response.json()) as [
      RedditListing<RedditPost>,
      RedditListing<RedditComment>,
    ];
    console.log(
      'Reddit comments response:',
      JSON.stringify(data[1].data.children.slice(0, 2), null, 2)
    );

    // Get top 10 comments for better analysis
    return data[1].data.children.map((child) => child.data).slice(0, 10);
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
