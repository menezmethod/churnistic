# Day 3: User Interface & Notifications (Wednesday)

## Core Principles

1. Minimal User Input
   - One-click actions
   - Smart defaults
   - Auto-refresh
   - Clear feedback

2. Fast Development
   - Reusable components
   - Simple layouts
   - Quick iterations
   - Rapid testing

## Morning Session (4 hours)

### 1. Dashboard Layout

```typescript
// src/app/dashboard/layout.tsx
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';

export default function DashboardLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header />
        <main className="flex-1 p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}

// src/components/layout/sidebar.tsx
export function Sidebar() {
  const menuItems = [
    { label: 'Overview', href: '/dashboard', icon: HomeIcon },
    { label: 'Active Bonuses', href: '/dashboard/bonuses', icon: DollarIcon },
    { label: 'Banks', href: '/dashboard/banks', icon: BankIcon },
    { label: 'Progress', href: '/dashboard/progress', icon: ChartIcon },
    { label: 'Settings', href: '/dashboard/settings', icon: SettingsIcon }
  ];

  return (
    <aside className="w-64 border-r bg-gray-50">
      <nav className="space-y-1">
        {menuItems.map(item => (
          <SidebarItem key={item.href} {...item} />
        ))}
      </nav>
    </aside>
  );
}
```

### 2. Dashboard Components

```typescript
// src/components/dashboard/bonus-card.tsx
interface BonusCardProps {
  bank: string;
  amount: number;
  requirements: any[];
  progress: number;
  daysLeft: number;
}

export function BonusCard({
  bank,
  amount,
  requirements,
  progress,
  daysLeft
}: BonusCardProps) {
  return (
    <div className="rounded-lg border p-4 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="font-medium">{bank}</h3>
          <p className="text-2xl font-bold">${amount}</p>
        </div>
        <Badge>{daysLeft} days left</Badge>
      </div>
      
      <Progress value={progress} className="mt-4" />
      
      <div className="mt-4 space-y-2">
        {requirements.map((req, i) => (
          <RequirementItem key={i} {...req} />
        ))}
      </div>
    </div>
  );
}

// src/components/dashboard/stats-grid.tsx
export function StatsGrid() {
  const stats = [
    {
      label: 'Active Bonuses',
      value: '5',
      change: '+2 this week',
      trend: 'up'
    },
    {
      label: 'Total Earned',
      value: '$2,500',
      change: '+$500 this month',
      trend: 'up'
    },
    {
      label: 'Success Rate',
      value: '92%',
      change: '+5% vs last month',
      trend: 'up'
    },
    {
      label: 'Pending Payout',
      value: '$1,200',
      change: '3 bonuses',
      trend: 'neutral'
    }
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map(stat => (
        <StatCard key={stat.label} {...stat} />
      ))}
    </div>
  );
}
```

## Afternoon Session (4 hours)

### 3. Email Notification System

```typescript
// src/server/services/email.ts
import { createTransport } from 'nodemailer';
import { render } from '@react-email/render';
import { BonusEmail } from '@/emails/bonus';

export class EmailService {
  private transporter;

  constructor() {
    this.transporter = createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT!),
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
  }

  async sendBonusReminder({
    to,
    bonus,
    daysLeft
  }: {
    to: string;
    bonus: any;
    daysLeft: number;
  }) {
    const html = render(
      <BonusEmail
        bank={bonus.bank}
        amount={bonus.amount}
        daysLeft={daysLeft}
        requirements={bonus.requirements}
      />
    );

    await this.transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to,
      subject: `Action Required: ${bonus.bank} Bonus Deadline in ${daysLeft} Days`,
      html
    });
  }

  async sendNewBonusAlert({
    to,
    bonus
  }: {
    to: string;
    bonus: any;
  }) {
    const html = render(
      <NewBonusEmail
        bank={bonus.bank}
        amount={bonus.amount}
        requirements={bonus.requirements}
      />
    );

    await this.transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to,
      subject: `New ${bonus.bank} Bonus: Earn $${bonus.amount}`,
      html
    });
  }
}

// src/server/jobs/notifications.ts
export async function sendDailyNotifications() {
  const email = new EmailService();
  
  // 1. Find users with bonuses nearing deadline
  const deadlineBonuses = await prisma.bonus.findMany({
    where: {
      status: 'in_progress',
      expirationDate: {
        lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
      }
    },
    include: { user: true }
  });

  // 2. Send reminders
  for (const bonus of deadlineBonuses) {
    const daysLeft = Math.ceil(
      (bonus.expirationDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );

    await email.sendBonusReminder({
      to: bonus.user.email,
      bonus,
      daysLeft
    });
  }

  // 3. Find and notify about new bonuses
  const newBonuses = await prisma.bonus.findMany({
    where: {
      createdAt: {
        gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
      }
    }
  });

  const users = await prisma.user.findMany({
    where: {
      notificationPreferences: {
        newBonuses: true
      }
    }
  });

  for (const bonus of newBonuses) {
    for (const user of users) {
      await email.sendNewBonusAlert({
        to: user.email,
        bonus
      });
    }
  }
}
```

### 4. Notification Preferences

```typescript
// src/app/dashboard/settings/notifications/page.tsx
'use client';

import { useState } from 'react';
import { Switch } from '@/components/ui/switch';
import { trpc } from '@/lib/trpc';

export default function NotificationSettings() {
  const [preferences, setPreferences] = useState({
    newBonuses: true,
    deadlineReminders: true,
    progressUpdates: true,
    successStories: false
  });

  const updatePreferences = trpc.user.updateNotificationPreferences.useMutation();

  const handleChange = (key: keyof typeof preferences) => {
    const newPreferences = {
      ...preferences,
      [key]: !preferences[key]
    };
    setPreferences(newPreferences);
    updatePreferences.mutate(newPreferences);
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Notification Preferences</h1>
      
      <div className="space-y-6">
        {Object.entries(preferences).map(([key, value]) => (
          <div key={key} className="flex items-center justify-between">
            <div>
              <h3 className="font-medium">{formatKey(key)}</h3>
              <p className="text-sm text-gray-500">
                {getDescription(key)}
              </p>
            </div>
            <Switch
              checked={value}
              onCheckedChange={() => handleChange(key as any)}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
```

## End of Day Verification

### 1. Test Dashboard

```bash
# Start dev server
npm run dev

# Check responsive layout
open http://localhost:3000/dashboard
```

### 2. Verify Email System

```bash
# Test email sending
curl -X POST http://localhost:3000/api/trpc/email.test \
  -H "Content-Type: application/json" \
  -d '{"to": "test@example.com"}'

# Run notification job
npm run job:notifications
```

### 3. Check Components

```bash
# Run component tests
npm test src/components/dashboard

# Check storybook
npm run storybook
```

## Next Steps

1. Analytics Dashboard (Day 4)
2. Bank Integration (Day 4)
3. Mobile UI (Day 5)
4. Final Testing (Day 5)
