# Day 2: API Integration & Data Collection (Tuesday)

## Core Principles

1. Minimal User Input
   - API-based data collection
   - Smart data processing
   - Quick tracking
   - Progress monitoring

2. Fast Development
   - Direct API access
   - Type-safe integration
   - Clear patterns
   - Quick feedback

## Morning Session (4 hours)

### 1. Reddit API Integration

```typescript
// src/server/api/reddit.ts
import { z } from 'zod';

const RedditPost = z.object({
  title: z.string(),
  selftext: z.string(),
  permalink: z.string(),
  created_utc: z.number(),
  score: z.number(),
  author: z.string()
});

export class RedditAPI {
  private token: string;
  private baseUrl = 'https://oauth.reddit.com';

  constructor() {
    this.token = process.env.REDDIT_API_TOKEN!;
  }

  async getChurningPosts(options: {
    timeframe: 'day' | 'week' | 'month',
    flair?: string
  }) {
    const params = new URLSearchParams({
      sort: 'new',
      limit: '100',
      restrict_sr: 'on',
      t: options.timeframe,
      ...(options.flair && { q: `flair:"${options.flair}"` })
    });

    const response = await fetch(
      `${this.baseUrl}/r/churning/search.json?${params}`,
      {
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'User-Agent': 'Churnistic/1.0.0'
        }
      }
    );

    const data = await response.json();
    return z.array(RedditPost).parse(data.data.children.map(c => c.data));
  }

  async getPostComments(postId: string) {
    const response = await fetch(
      `${this.baseUrl}/r/churning/comments/${postId}.json`,
      {
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'User-Agent': 'Churnistic/1.0.0'
        }
      }
    );

    return response.json();
  }
}

// src/server/api/doc.ts
export class DocAPI {
  private baseUrl = 'https://www.doctorofcredit.com/wp-json/wp/v2';

  async getBonusPosts() {
    const params = new URLSearchParams({
      categories: '5', // Bank bonus category ID
      per_page: '100',
      orderby: 'date',
      status: 'publish'
    });

    const response = await fetch(
      `${this.baseUrl}/posts?${params}`,
      {
        headers: {
          'User-Agent': 'Churnistic/1.0.0'
        }
      }
    );

    return response.json();
  }

  async getPost(id: number) {
    const response = await fetch(
      `${this.baseUrl}/posts/${id}`,
      {
        headers: {
          'User-Agent': 'Churnistic/1.0.0'
        }
      }
    );

    return response.json();
  }
}
```

### 2. Data Processing Service

```typescript
// src/server/services/bonus-processor.ts
import { RedditAPI } from '../api/reddit';
import { DocAPI } from '../api/doc';
import { prisma } from '@/lib/prisma';

interface ProcessedBonus {
  bank: string;
  amount: number;
  requirements: {
    type: 'directDeposit' | 'balance' | 'transactions';
    details: Record<string, any>;
  }[];
  expirationDate?: Date;
  source: {
    url: string;
    type: 'reddit' | 'doc';
    dateFound: Date;
  };
}

export class BonusProcessor {
  private reddit: RedditAPI;
  private doc: DocAPI;

  constructor() {
    this.reddit = new RedditAPI();
    this.doc = new DocAPI();
  }

  async processRedditPost(post: any): Promise<ProcessedBonus | null> {
    // Extract bonus details from title and body
    const amountMatch = post.title.match(/\$(\d+)/);
    if (!amountMatch) return null;

    const bankMatch = post.title.match(/(Chase|Citi|Wells Fargo|BoA|Capital One)/i);
    if (!bankMatch) return null;

    return {
      bank: bankMatch[1],
      amount: parseInt(amountMatch[1]),
      requirements: this.extractRequirements(post.selftext),
      source: {
        url: `https://reddit.com${post.permalink}`,
        type: 'reddit',
        dateFound: new Date(post.created_utc * 1000)
      }
    };
  }

  async processDocPost(post: any): Promise<ProcessedBonus | null> {
    // Process structured data from DoC's API
    const content = post.content.rendered;
    const amount = this.extractAmount(content);
    if (!amount) return null;

    return {
      bank: this.extractBank(post.title.rendered),
      amount,
      requirements: this.extractRequirements(content),
      expirationDate: this.extractExpiration(content),
      source: {
        url: post.link,
        type: 'doc',
        dateFound: new Date(post.date)
      }
    };
  }

  private extractRequirements(text: string) {
    const requirements = [];
    
    // Direct deposit detection
    const ddMatch = text.match(/direct deposit.{0,50}(\$[\d,]+)/i);
    if (ddMatch) {
      requirements.push({
        type: 'directDeposit',
        details: {
          amount: parseInt(ddMatch[1].replace(/[$,]/g, '')),
          frequency: 'monthly' // Default, can be refined
        }
      });
    }

    // Balance detection
    const balanceMatch = text.match(/maintain.{0,30}(\$[\d,]+).{0,30}balance/i);
    if (balanceMatch) {
      requirements.push({
        type: 'balance',
        details: {
          amount: parseInt(balanceMatch[1].replace(/[$,]/g, '')),
          duration: 60 // Default 60 days, can be refined
        }
      });
    }

    return requirements;
  }

  private extractBank(title: string): string {
    const banks = ['Chase', 'Citi', 'Wells Fargo', 'Bank of America', 'Capital One'];
    for (const bank of banks) {
      if (title.includes(bank)) return bank;
    }
    return 'Unknown Bank';
  }

  private extractAmount(content: string): number | null {
    const match = content.match(/bonus.*?\$(\d+)/i);
    return match ? parseInt(match[1]) : null;
  }

  private extractExpiration(content: string): Date | undefined {
    const match = content.match(/expires?.*?(\d{1,2}\/\d{1,2}\/\d{2,4})/i);
    return match ? new Date(match[1]) : undefined;
  }
}
```

### 3. Automated Collection Job

```typescript
// src/server/jobs/collector.ts
import { RedditAPI } from '../api/reddit';
import { DocAPI } from '../api/doc';
import { BonusProcessor } from '../services/bonus-processor';
import { prisma } from '@/lib/prisma';

export async function collectNewBonuses() {
  const reddit = new RedditAPI();
  const doc = new DocAPI();
  const processor = new BonusProcessor();

  // 1. Collect from Reddit
  const redditPosts = await reddit.getChurningPosts({
    timeframe: 'day',
    flair: 'Bank Account Bonus'
  });

  // 2. Collect from DoC
  const docPosts = await doc.getBonusPosts();

  // 3. Process all bonuses
  const bonuses = await Promise.all([
    ...redditPosts.map(post => processor.processRedditPost(post)),
    ...docPosts.map(post => processor.processDocPost(post))
  ]);

  // 4. Filter valid bonuses and remove duplicates
  const validBonuses = bonuses
    .filter((bonus): bonus is ProcessedBonus => bonus !== null)
    .filter(bonus => bonus.amount >= 100); // Minimum bonus amount

  // 5. Store in database
  for (const bonus of validBonuses) {
    await prisma.bonus.upsert({
      where: {
        sourceUrl: bonus.source.url
      },
      update: {
        lastSeen: new Date()
      },
      create: {
        bank: bonus.bank,
        amount: bonus.amount,
        requirements: bonus.requirements,
        expirationDate: bonus.expirationDate,
        sourceUrl: bonus.source.url,
        sourceType: bonus.source.type,
        dateFound: bonus.source.dateFound,
        status: 'active'
      }
    });
  }

  return validBonuses.length;
}
```

## Afternoon Session (4 hours)

### 4. Progress Tracking

```typescript
// src/server/routers/bonus.ts
export const bonusRouter = router({
  updateProgress: protectedProcedure
    .input(z.object({
      bonusId: z.string(),
      transactions: z.array(z.object({
        date: z.date(),
        amount: z.number(),
        description: z.string()
      }))
    }))
    .mutation(async ({ input, ctx }) => {
      const bonus = await prisma.bonus.findUnique({
        where: { id: input.bonusId }
      });

      // Calculate progress
      const progress = calculateProgress(bonus, input.transactions);

      return prisma.bonus.update({
        where: { id: input.bonusId },
        data: { progress }
      });
    }),

  getDeadlines: protectedProcedure
    .query(async ({ ctx }) => {
      const today = new Date();
      const thirtyDaysFromNow = new Date(today.setDate(today.getDate() + 30));

      return prisma.bonus.findMany({
        where: {
          userId: ctx.user.id,
          status: { in: ['planned', 'in_progress'] },
          expirationDate: { lte: thirtyDaysFromNow }
        },
        orderBy: { expirationDate: 'asc' }
      });
    })
});
```

## End of Day Verification

### 1. Test API Integration

```bash
# Test Reddit API
curl -X POST http://localhost:3000/api/trpc/bonus.collectReddit \
  -H "Content-Type: application/json"

# Test DoC API
curl -X POST http://localhost:3000/api/trpc/bonus.collectDoc \
  -H "Content-Type: application/json"
```

### 2. Verify Data Processing

```bash
# Check processed bonuses
npx prisma studio

# Run collection job
npm run collect-bonuses
```

### 3. Test Progress Tracking

```bash
# Add test transactions
curl -X POST http://localhost:3000/api/trpc/bonus.updateProgress \
  -H "Content-Type: application/json" \
  -d '{"bonusId": "test", "transactions": [...]}'

# Check progress
curl http://localhost:3000/api/trpc/bonus.getProgress?id=test
```

## Next Steps

1. Email Notifications (Day 3)
2. User Dashboard (Day 3)
3. Analytics Setup (Day 3)
4. Mobile UI (Day 3)