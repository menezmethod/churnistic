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

    console.log('Writing to cache:', key);
    const docRef = db.collection(CACHE_COLLECTION).doc(key);
    
    try {
      await docRef.set({
        data,
        timestamp: Date.now()
      });

      return NextResponse.json({ success: true });
    } catch (dbError) {
      console.error('Firestore error:', dbError);
      throw new Error('Database error');
    }
  } catch (error) {
    console.error('Cache write error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 