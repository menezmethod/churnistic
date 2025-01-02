import { NextResponse } from 'next/server';

interface BankFeatures {
  monthly_fees: string;
  monthly_fee_details: string;
  minimum_balance: string;
  account_type_details: string;
  interest_rate: string;
}

interface BrokerageFeatures {
  options_trading: string;
  ira_accounts: string;
  trading_fees: string;
  account_types: string;
  platform_features: string;
}

interface CardFeatures {
  perks: string;
  rewards: string;
  chase_524_rule: {
    applies: boolean;
    details: string;
  };
}

interface Fees {
  annual: string;
  foreign_transaction: string;
}

interface Credit {
  inquiry: string;
  type: string;
  impact: string;
}

interface BonusTier {
  bonus: string;
  details: string;
  requirement: string;
}

interface InstitutionDetails {
  name: string;
  url: string;
  offer_link: string;
}

interface Bonus {
  value: number;
  description: string;
  requirements: string[];
  details: string;
  tiers: BonusTier[];
}

interface Availability {
  regions: string[];
  is_nationwide?: boolean;
  restrictions?: string | null;
}

interface Timing {
  posted_date: string;
  last_verified: string;
  expiration: string;
}

interface SourceHistory {
  timestamp: string;
  source: string;
  url: string;
}

interface ChangeHistory {
  timestamp: string;
  field: string;
  old_value: string | number | boolean | null;
  new_value: string | number | boolean | null;
}

interface BankRewardsTracking {
  first_seen: string;
  last_seen: string;
  times_seen: number;
  changes: ChangeHistory[];
  source_history: SourceHistory[];
}

interface BankRewardsOpportunity {
  _id: string;
  id: string;
  institution: string;
  type: 'credit_card' | 'bank_account' | 'brokerage_account';
  value: number;
  title: string;
  description: string;
  requirements: string[];
  bonus: Bonus;
  availability: Availability;
  timing: Timing;
  institution_details: InstitutionDetails;
  bank_features?: BankFeatures;
  brokerage_features?: BrokerageFeatures;
  card_features?: CardFeatures;
  fees?: Fees;
  credit?: Credit;
  source: {
    name: string;
    url: string;
  };
  tracking: BankRewardsTracking;
  created_at: string;
  last_updated: string;
  url?: string;
  offer_link?: string;
}

interface BankRewardsResponse {
  opportunities: BankRewardsOpportunity[];
  count: number;
  timestamp: string;
  is_collecting: boolean;
  last_collection_start: string | null;
}

export async function GET() {
  try {
    const response = await fetch('http://localhost:8000/api/opportunities/bankrewards', {
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error('Failed to fetch opportunities');
    }

    const data: BankRewardsResponse = await response.json();
    console.log('Raw response:', data); // Debug log

    if (!data.opportunities || !Array.isArray(data.opportunities)) {
      console.error('Invalid response format:', data);
      return NextResponse.json([]);
    }

    // Transform the data to match our application's expected format
    const transformedOpportunities = data.opportunities
      .filter((opp) => opp && opp._id) // Filter out opportunities without IDs
      .map((opp) => {
        try {
          return {
            id: opp._id,
            title: opp.title,
            type: opp.type === 'brokerage_account' ? 'brokerage' : opp.type,
            value: opp.value,
            bank: opp.institution,
            description: opp.description,
            requirements: opp.requirements,
            source: opp.source.name,
            sourceLink: opp.source.url,
            postedDate: opp.timing?.posted_date || opp.created_at,
            expirationDate: opp.timing?.expiration || null,
            confidence: 1,
            status: 'active',
            url: opp.url,
            offer_link: opp.offer_link,
            metadata: {
              accountType: opp.type,
              fees:
                opp.type === 'credit_card'
                  ? {
                      annual: opp.fees?.annual || 'None',
                      foreign_transaction: opp.fees?.foreign_transaction || 'None',
                      details: '',
                    }
                  : {
                      monthly: opp.bank_features?.monthly_fees || 'None',
                      details: opp.bank_features?.monthly_fee_details || '',
                    },
              credit:
                opp.type === 'credit_card'
                  ? {
                      inquiry: opp.credit?.inquiry || 'Unknown',
                      type: opp.credit?.type || '',
                      impact: opp.credit?.impact || '',
                    }
                  : undefined,
              features:
                opp.type === 'credit_card'
                  ? [
                      opp.card_features?.rewards || '',
                      opp.card_features?.perks || '',
                      opp.card_features?.chase_524_rule?.applies &&
                        'Subject to Chase 5/24 Rule',
                    ].filter(Boolean)
                  : opp.type === 'brokerage_account'
                    ? [
                        opp.brokerage_features?.options_trading &&
                          `Options Trading: ${opp.brokerage_features.options_trading}`,
                        opp.brokerage_features?.ira_accounts &&
                          `IRA Accounts: ${opp.brokerage_features.ira_accounts}`,
                      ].filter(Boolean)
                    : [
                        opp.bank_features?.interest_rate &&
                          `Interest Rate: ${opp.bank_features.interest_rate}`,
                        opp.bank_features?.minimum_balance &&
                          `Minimum Balance: ${opp.bank_features.minimum_balance}`,
                      ].filter(Boolean),
              bonus: {
                value: opp.value,
                description: opp.description,
                requirements: opp.requirements,
                details: opp.description,
                tiers: [],
              },
              availability: {
                regions: opp.availability?.regions || [],
                is_nationwide: opp.availability?.is_nationwide ?? false,
                restrictions: opp.availability?.restrictions ?? null,
              },
              lastVerified: opp.last_updated,
              tracking: {
                first_seen: opp.created_at,
                last_seen: opp.last_updated,
                times_seen: 1,
                source_history: [
                  {
                    source: opp.source.name,
                    first_seen: opp.created_at,
                    last_seen: opp.last_updated,
                  },
                ],
              },
            },
          };
        } catch (error) {
          console.error('Error transforming opportunity:', error, opp);
          return null;
        }
      })
      .filter(Boolean); // Remove any null entries

    console.log('Transformed opportunities:', transformedOpportunities.length); // Debug log
    return NextResponse.json(transformedOpportunities);
  } catch (error) {
    console.error('Error fetching opportunities:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}
