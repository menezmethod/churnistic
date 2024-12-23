import { NextResponse } from 'next/server';

import { RedditAPI } from '@/server/api/reddit';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const endpoint = searchParams.get('endpoint');
    const postId = searchParams.get('postId');

    console.log('Reddit API request:', { endpoint, postId });

    if (!endpoint) {
      return NextResponse.json({ error: 'Missing endpoint parameter' }, { status: 400 });
    }

    if (!process.env.REDDIT_CLIENT_ID || !process.env.REDDIT_CLIENT_SECRET) {
      console.error('Missing Reddit API credentials:', {
        hasClientId: !!process.env.REDDIT_CLIENT_ID,
        hasClientSecret: !!process.env.REDDIT_CLIENT_SECRET,
        userAgent: process.env.REDDIT_USER_AGENT,
      });
      return NextResponse.json({ error: 'Reddit API not configured' }, { status: 500 });
    }

    const api = new RedditAPI();

    switch (endpoint) {
      case 'weekly-threads':
        console.log('Fetching weekly threads...');
        const threads = await api.getWeeklyThreads();
        console.log(`Found ${threads.length} threads`);

        return NextResponse.json({
          data: {
            children: threads.map((thread) => ({
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
        console.log('Fetching comments for post:', postId);
        const comments = await api.getPostComments(postId);
        console.log(`Found ${comments.length} comments`);

        return NextResponse.json(comments);

      default:
        return NextResponse.json({ error: 'Invalid endpoint' }, { status: 400 });
    }
  } catch (error) {
    console.error('Reddit API route error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    console.error('Error details:', errorMessage);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
