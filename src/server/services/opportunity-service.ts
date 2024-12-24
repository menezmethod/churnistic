import { RedditThread, RedditComment } from '@prisma/client';

import { prisma } from '@/lib/prisma/db';

export async function upsertThread(thread: RedditThread) {
  return prisma.redditThread.upsert({
    where: { threadId: thread.threadId },
    create: thread,
    update: thread,
  });
}

export async function upsertComment(comment: RedditComment, threadId: string) {
  try {
    const result = await prisma.redditComment.upsert({
      where: { commentId: comment.commentId },
      create: { ...comment, threadId },
      update: comment,
    });
    return result;
  } catch (error) {
    console.error('Error upserting comment:', error);
    throw error;
  }
}
