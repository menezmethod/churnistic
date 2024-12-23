import { NextResponse } from 'next/server';

import { RedditAPI } from '@/server/api/reddit';

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

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const postId = searchParams.get('postId');

    if (!postId) {
      return NextResponse.json({ error: 'Missing postId parameter' }, { status: 400 });
    }

    const api = new RedditAPI();
    const comments = await api.getPostComments(postId);

    // Format the response to match Reddit's API structure
    const formattedComments: RedditListing<RedditComment> = {
      kind: 'Listing',
      data: {
        children: comments.map((comment) => ({
          kind: 't1',
          data: comment,
        })),
      },
    };

    return NextResponse.json(formattedComments);
  } catch (error) {
    console.error('Error fetching comments:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
