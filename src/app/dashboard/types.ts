import type { UserProfile } from '@/types/user';

export interface Opportunity {
  id: string;
  title: string;
  type: 'credit_card' | 'bank_account';
  value: string | number;
  bank: string;
  description: string;
  requirements: string[];
  source: string;
  sourceLink: string;
  postedDate: string;
  expirationDate?: string;
  confidence: number;
  status: string;
  metadata?: {
    progress?: number;
    target?: number;
    riskLevel?: number;
    riskFactors?: string[];
  };
  timeframe?: string;
}

export interface TrackedOpportunity {
  id: string;
  title: string;
  type: 'credit_card' | 'bank_account';
  progress: number;
  target: number;
  daysLeft: number;
}

export interface Activity {
  id: string;
  type: 'success' | 'warning' | 'info';
  icon: string;
  message: string;
  time: string;
  title?: string;
  description?: string;
}

export interface DashboardData {
  profile: UserProfile | null;
  loadingProfile: boolean;
  authLoading: boolean;
  oppsLoading: boolean;
  activeOpportunities: Opportunity[];
  quickOpportunities: Opportunity[];
  totalPotentialValue: number;
  trackedOpportunities: TrackedOpportunity[];
  recentActivities: Activity[];
  user: {
    id: string;
    email: string;
    role: string;
  };
  opportunities: {
    active: Opportunity[];
    tracked: TrackedOpportunity[];
    quick: Opportunity[];
  };
}

export const recentActivities: Activity[] = [
  {
    id: '1',
    type: 'success',
    icon: 'CheckCircle',
    message: 'New opportunity added',
    time: '2 hours ago',
    title: 'Chase Sapphire Preferred',
    description: '100,000 points signup bonus',
  },
  {
    id: '2',
    type: 'info',
    icon: 'InfoOutlined',
    message: 'Progress updated',
    time: '4 hours ago',
    title: 'Bank of America Customized Cash Rewards',
    description: 'Reached 50% of spending requirement',
  },
  {
    id: '3',
    type: 'warning',
    icon: 'Warning',
    message: 'Opportunity expiring soon',
    time: '1 day ago',
    title: 'Citi Double Cash',
    description: 'Expires in 7 days',
  },
];
