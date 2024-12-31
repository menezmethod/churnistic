import { BankRewardsOffer } from '@/types/scraper';
import { prisma } from '@/lib/prisma';

export class BankRewardsDatabase {
  public async saveOffer(offer: BankRewardsOffer) {
    try {
      await prisma.opportunity.upsert({
        where: {
          id: offer.sourceId,
        },
        update: {
          title: `${offer.value} - ${offer.name}`,
          description: offer.requirements.join('\\n'),
          value: offer.value,
          type: offer.type.toLowerCase(),
          bank: offer.institution,
          requirements: offer.requirements,
          source: 'bankrewards',
          sourceLink: offer.sourceUrl,
          expirationDate: offer.expirationDate,
          confidence: 1,
          status: offer.metadata.status,
          metadata: offer.metadata,
        },
        create: {
          id: offer.sourceId,
          title: `${offer.value} - ${offer.name}`,
          description: offer.requirements.join('\\n'),
          value: offer.value,
          type: offer.type.toLowerCase(),
          bank: offer.institution,
          requirements: offer.requirements,
          source: 'bankrewards',
          sourceLink: offer.sourceUrl,
          expirationDate: offer.expirationDate,
          confidence: 1,
          status: offer.metadata.status,
          metadata: offer.metadata,
        },
      });
    } catch (error) {
      throw new Error(`Failed to save offer: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  public async getLastCollection() {
    return prisma.opportunity.findFirst({
      where: {
        source: 'bankrewards',
      },
      orderBy: {
        updatedAt: 'desc',
      },
      select: {
        updatedAt: true,
      },
    });
  }

  public async markOffersAsExpired() {
    return prisma.opportunity.updateMany({
      where: {
        source: 'bankrewards',
        status: 'active',
      },
      data: {
        status: 'expired',
        metadata: {
          lastChecked: new Date(),
          status: 'expired',
        },
      },
    });
  }

  public async deleteAllOffers() {
    try {
      const result = await prisma.opportunity.deleteMany({
        where: {
          source: 'bankrewards',
        },
      });

      return {
        success: true,
        deletedCount: result.count,
      };
    } catch (error) {
      throw new Error(`Failed to delete offers: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  public async getStats() {
    try {
      const [total, active, expired] = await Promise.all([
        prisma.opportunity.count({
          where: { source: 'bankrewards' },
        }),
        prisma.opportunity.count({
          where: { 
            source: 'bankrewards',
            status: 'active',
          },
        }),
        prisma.opportunity.count({
          where: {
            source: 'bankrewards',
            status: 'expired',
          },
        }),
      ]);

      return {
        total,
        active,
        expired,
        lastUpdated: new Date(),
      };
    } catch (error) {
      throw new Error(`Failed to get stats: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
} 