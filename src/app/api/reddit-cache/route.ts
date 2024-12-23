import { NextResponse } from 'next/server';

import db from '@/lib/prisma/db';
import { RedditAPI, RedditPost, RedditComment } from '@/server/api/reddit';

// Constants
const CACHE_TTL = 60 * 60 * 1000; // 1 hour in milliseconds


interface RedditThreadsResponse {
  data: {
    children: Array<{
      data: RedditPost;
    }>;
  };
}

async function getCachedData<T>(key: string): Promise<T | null> {
  try {
    const cacheEntry = await db.cache.findUnique({
      where: { key },
    });

    if (!cacheEntry) {
      return null;
    }

    const now = new Date();
    const updatedAt = new Date(cacheEntry.updatedAt);
    if (now.getTime() - updatedAt.getTime() > CACHE_TTL) {
      console.log('Cache expired for key:', key);
      return null;
    }

    console.log('Cache hit for key:', key);
    return JSON.parse(cacheEntry.data) as T;
  } catch (error) {
    console.error('Error reading from cache:', error);
    return null;
  }
}

async function setCachedData<T>(key: string, data: T): Promise<void> {
  try {
    await db.cache.upsert({
      where: { key },
      update: {
        data: JSON.stringify(data),
        updatedAt: new Date(),
      },
      create: {
        key,
        data: JSON.stringify(data),
      },
    });
    console.log('Cache updated for key:', key);
  } catch (error) {
    console.error('Error writing to cache:', error);
    throw error;
  }
}

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
      case 'weekly-threads': {
        const cacheKey = 'weekly-threads';
        const cachedData = await getCachedData<RedditThreadsResponse>(cacheKey);

        if (cachedData) {
          return NextResponse.json(cachedData);
        }

        console.log('Cache miss for weekly threads, fetching from Reddit...');
        const threads = await api.getWeeklyThreads();
        const response: RedditThreadsResponse = {
          data: { children: threads.map((thread) => ({ data: thread })) },
        };
        await setCachedData(cacheKey, response);
        return NextResponse.json(response);
      }

      case 'comments': {
        if (!postId) {
          return NextResponse.json(
            { error: 'Missing postId parameter' },
            { status: 400 }
          );
        }

        const cacheKey = `comments:${postId}`;
        const cachedData = await getCachedData<RedditComment[]>(cacheKey);

        if (cachedData) {
          return NextResponse.json(cachedData);
        }

        console.log('Cache miss for comments, fetching from Reddit...');
        const comments = await api.getPostComments(postId);
        await setCachedData(cacheKey, comments);
        return NextResponse.json(comments);
      }

      default:
        return NextResponse.json({ error: 'Invalid endpoint' }, { status: 400 });
    }
  } catch (error) {
    console.error('Reddit cache API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { key, data } = body;

    if (!key || !data) {
      return NextResponse.json({ error: 'Missing key or data' }, { status: 400 });
    }

    await setCachedData(key, data);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Cache write error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
