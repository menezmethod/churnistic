import { NextResponse } from 'next/server';

// Rate limit tracking over 10-minute window
const WINDOW_SIZE_MS = 10 * 60 * 1000; // 10 minutes
const MAX_REQUESTS_PER_WINDOW = 100; // Reddit's OAuth limit
const MIN_REQUEST_INTERVAL = 100; // Minimum 100ms between requests for bursting
const USER_AGENT = 'web:churnistic:1.0.0 (by u/MenezDev)'; // Reddit requires a specific User-Agent format

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
  private static instance: RedditAPI | null = null;
  private baseUrl = 'https://www.reddit.com';
  private headers = {
    'User-Agent': 'Churnistic/1.0.0',
  };

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

  static getInstance(): RedditAPI {
    if (!RedditAPI.instance) {
      RedditAPI.instance = new RedditAPI();
    }
    return RedditAPI.instance;
  }

  private async ensureAccessToken(): Promise<string> {
    if (this.accessToken && Date.now() < this.tokenExpiry) {
      return this.accessToken;
    }

    if (!process.env.REDDIT_CLIENT_ID || !process.env.REDDIT_CLIENT_SECRET) {
      throw new Error('Reddit OAuth credentials not configured');
    }

    console.log('Requesting token with client ID:', process.env.REDDIT_CLIENT_ID);

    const auth = Buffer.from(
      `${process.env.REDDIT_CLIENT_ID}:${process.env.REDDIT_CLIENT_SECRET}`
    ).toString('base64');

    const params = new URLSearchParams({
      grant_type: 'client_credentials',
    });

    const response = await fetch('https://www.reddit.com/api/v1/access_token', {
      method: 'POST',
      headers: {
        Authorization: `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': USER_AGENT,
      },
      body: params.toString(),
    });

    if (!response.ok) {
      const text = await response.text();
      console.error('Token response:', text);
      console.error('Response status:', response.status);
      console.error('Response headers:', Object.fromEntries(response.headers.entries()));
      console.error('Auth header:', `Basic ${auth}`);
      throw new Error(`Failed to obtain Reddit access token: ${response.status} ${text}`);
    }

    const data = (await response.json()) as RedditOAuthResponse;
    this.accessToken = data.access_token;
    this.tokenExpiry = Date.now() + data.expires_in * 1000;
    return this.accessToken;
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

    // Ensure minimum interval between requests
    if (now - this.requestTracker.lastRequest < MIN_REQUEST_INTERVAL) {
      return false;
    }

    return true;
  }

  async getWeeklyThreads(): Promise<RedditPost[]> {
    try {
      const response = await fetch(
        `${this.baseUrl}/r/churning/search.json?q=Weekly+Discussion+Thread&restrict_sr=on&sort=new&t=month`,
        {
          headers: this.headers,
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = (await response.json()) as RedditListing<RedditPost>;

      if (!data?.data?.children) {
        console.log('No threads found in response');
        return [];
      }

      console.log('Found total threads:', data.data.children.length);

      // Filter for weekly discussion threads with more flexible matching
      const weeklyThreads = data.data.children
        .map((child: { data: RedditPost }) => child.data)
        .filter((post) => {
          const title = post.title.toLowerCase();
          return (
            title.includes('weekly') &&
            (title.includes('discussion') ||
              title.includes('trip report') ||
              title.includes('data points'))
          );
        });

      return weeklyThreads;
    } catch (error) {
      console.error('Error fetching weekly threads:', error);
      throw error;
    }
  }

  async getPostComments(postId: string): Promise<RedditComment[]> {
    try {
      const response = await fetch(`${this.baseUrl}/r/churning/comments/${postId}.json`, {
        headers: this.headers,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Raw comments response:', data);

      if (!Array.isArray(data) || !data[1]?.data?.children) {
        console.log('No comments found in response');
        return [];
      }

      // The second element in the array contains the comments
      return data[1].data.children.map((child: { data: RedditComment }) => child.data);
    } catch (error) {
      console.error('Error fetching post comments:', error);
      throw error;
    }
  }

  async getThread(threadId: string): Promise<RedditPost> {
    if (!this.canMakeRequest()) {
      throw new Error('Rate limit exceeded. Please try again later.');
    }

    try {
      // Use the public JSON API instead of OAuth
      const url = `https://www.reddit.com/by_id/t3_${threadId}.json`;

      const response = await fetch(url, {
        headers: {
          'User-Agent': USER_AGENT,
        },
      });

      this.requestTracker.lastRequest = Date.now();

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`Error fetching thread from Reddit: ${response.status} ${text}`);
      }

      const data = (await response.json()) as RedditListing<RedditPost>;
      return data.data.children[0].data;
    } catch (error) {
      console.error('Error fetching thread:', error);
      throw error;
    }
  }

  async searchThreads(query: string): Promise<RedditPost[]> {
    if (!this.canMakeRequest()) {
      throw new Error('Rate limit exceeded. Please try again later.');
    }

    try {
      // Use the public JSON API instead of OAuth
      const url = `https://www.reddit.com/r/churning/search.json?q=${encodeURIComponent(query)}&restrict_sr=1&sort=new&type=link`;

      const response = await fetch(url, {
        headers: {
          'User-Agent': USER_AGENT,
        },
      });

      this.requestTracker.lastRequest = Date.now();

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`Error searching Reddit: ${response.status} ${text}`);
      }

      const data = (await response.json()) as RedditListing<RedditPost>;
      return data.data.children.map((child) => child.data);
    } catch (error) {
      console.error('Error searching threads:', error);
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

    const api = RedditAPI.getInstance();

    switch (endpoint) {
      case 'weekly-threads':
        const threads = await api.getWeeklyThreads();
        console.log('Found', threads.length, 'threads');
        // Format response to match expected structure
        return NextResponse.json({
          kind: 'Listing',
          data: {
            children: threads.map((thread) => ({
              kind: 't3',
              data: thread,
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
        console.log('Found', comments.length, 'comments');
        // Return the raw comments array since the component expects it
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
