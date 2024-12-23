import type { RedditThread, RedditComment, Opportunity } from '@prisma/client';

import { prisma } from '@/lib/prisma/db';

async function saveRedditThread(thread: RedditThread): Promise<RedditThread> {
  return prisma.redditThread.upsert({
    where: { thread_id: thread.thread_id },
    update: thread,
    create: thread,
  });
}

async function saveRedditComments(
  threadId: string,
  comments: RedditComment[]
): Promise<RedditComment[]> {
  const savedComments = await Promise.all(
    comments.map((comment) =>
      prisma.redditComment.upsert({
        where: { comment_id: comment.comment_id },
        update: comment,
        create: { ...comment, thread_id: threadId },
      })
    )
  );
  return savedComments;
}

async function saveOpportunity(opportunity: Opportunity): Promise<Opportunity> {
  // Check if opportunity already exists
  const existingOpportunity = await prisma.opportunity.findFirst({
    where: {
      sourceId: opportunity.sourceId,
      title: opportunity.title,
    },
  });

  if (existingOpportunity) {
    // Update if new opportunity has higher confidence
    if (opportunity.confidence > existingOpportunity.confidence) {
      return prisma.opportunity.update({
        where: { id: existingOpportunity.id },
        data: opportunity,
      });
    }
    return existingOpportunity;
  }

  // Create new opportunity
  return prisma.opportunity.create({
    data: opportunity,
  });
}

async function getOpportunities(
  filters: {
    type?: string;
    bank?: string;
    minValue?: number;
    maxValue?: number;
    status?: string;
  } = {}
): Promise<Opportunity[]> {
  const where: Record<string, unknown> = {
    status: filters.status || 'active',
  };

  if (filters.type) where.type = filters.type;
  if (filters.bank) where.bank = filters.bank;
  if (filters.minValue) where.value = { gte: filters.minValue };
  if (filters.maxValue) where.value = { ...where.value, lte: filters.maxValue };

  return prisma.opportunity.findMany({
    where,
    orderBy: [{ confidence: 'desc' }, { postedDate: 'desc' }],
  });
}

export const opportunityService = {
  saveRedditThread,
  saveRedditComments,
  saveOpportunity,
  getOpportunities,
};
