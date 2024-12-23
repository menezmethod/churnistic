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

export class RedditAPI {
  private requestTracker: RequestTracker;

  constructor() {
    this.requestTracker = {
      rateLimitInfo: {
        used: 0,
        remaining: MAX_REQUESTS_PER_WINDOW,
        resetTime: Date.now() + WINDOW_SIZE_MS
      },
      lastRequest: 0
    };
  }

  private updateRateLimits(headers: Headers) {
    const used = parseInt(headers.get('x-ratelimit-used') || '0', 10);
    const remaining = parseInt(headers.get('x-ratelimit-remaining') || '0', 10);
    const resetSeconds = parseInt(headers.get('x-ratelimit-reset') || '0', 10);

    this.requestTracker.rateLimitInfo = {
      used,
      remaining,
      resetTime: Date.now() + (resetSeconds * 1000)
    };
  }

  private canMakeRequest(): boolean {
    const now = Date.now();

    // Reset rate limit info if window has passed
    if (now >= this.requestTracker.rateLimitInfo.resetTime) {
      this.requestTracker.rateLimitInfo = {
        used: 0,
        remaining: MAX_REQUESTS_PER_WINDOW,
        resetTime: now + WINDOW_SIZE_MS
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

  private async getAccessToken(): Promise<string> {
    if (!process.env.REDDIT_CLIENT_ID || !process.env.REDDIT_CLIENT_SECRET) {
      throw new Error('Reddit OAuth credentials not configured');
    }

    const auth = Buffer.from(`${process.env.REDDIT_CLIENT_ID}:${process.env.REDDIT_CLIENT_SECRET}`).toString('base64');
    const response = await fetch('https://www.reddit.com/api/v1/access_token', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'Churnistic/1.0.0'
      },
      body: 'grant_type=client_credentials'
    });

    if (!response.ok) {
      throw new Error('Failed to obtain Reddit access token');
    }

    const data = await response.json();
    return data.access_token;
  }

  async getWeeklyThreads(): Promise<RedditPost[]> {
    if (!this.canMakeRequest()) {
      throw new Error('Rate limit exceeded. Please try again later.');
    }

    const accessToken = await this.getAccessToken();
    const url = 'https://oauth.reddit.com/r/churning/search.json?q=title%3A%22Trip+Report+and+Churning+Success+Story+Weekly+Thread%22&restrict_sr=on&sort=new&t=all&limit=1';

    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'User-Agent': 'Churnistic/1.0.0'
      }
    });

    this.updateRateLimits(response.headers);
    this.requestTracker.lastRequest = Date.now();

    if (!response.ok) {
      throw new Error('Error fetching data from Reddit');
    }

    const data = await response.json() as RedditListing<RedditPost>;
    return data.data.children.map(child => child.data);
  }

  async getPostComments(postId: string): Promise<RedditComment[]> {
    if (!this.canMakeRequest()) {
      throw new Error('Rate limit exceeded. Please try again later.');
    }

    const accessToken = await this.getAccessToken();
    const url = `https://oauth.reddit.com/r/churning/comments/${postId}.json`;

    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'User-Agent': 'Churnistic/1.0.0'
      }
    });

    this.updateRateLimits(response.headers);
    this.requestTracker.lastRequest = Date.now();

    if (!response.ok) {
      throw new Error('Error fetching comments from Reddit');
    }

    const data = await response.json() as [RedditListing<RedditPost>, RedditListing<RedditComment>];
    return data[1].data.children
      .map(child => child.data)
      .slice(0, 3); // Only return top 3 comments
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
        return NextResponse.json({ data: { children: threads.map(thread => ({ data: thread })) } });
      case 'comments':
        if (!postId) {
          return NextResponse.json({ error: 'Missing postId parameter' }, { status: 400 });
        }
        const comments = await api.getPostComments(postId);
        return NextResponse.json(comments);
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