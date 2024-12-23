import { NextResponse } from 'next/server';
import { RedditAPI } from '@/server/api/reddit';

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