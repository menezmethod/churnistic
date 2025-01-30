import { collection, getDocs, Timestamp, writeBatch, doc } from 'firebase/firestore';
import { NextResponse } from 'next/server';

import { db } from '@/lib/firebase/config';
import { FirestoreOpportunity } from '@/types/opportunity';

interface BankRewardsOffer {
  id: string;
  name: string;
  type: string;
  offer_link: string;
  value: number | string;
  bonus?: {
    title?: string;
    description?: string;
    requirements?: {
      title?: string;
      description?: string;
    };
    tiers?: Array<{
      level: string;
      value: number;
      minimum_deposit: number;
      requirements: string;
    }>;
  };
  details?: {
    monthly_fees?: {
      amount?: string;
      waiver_details?: string;
    };
    account_type?: string;
    availability?: {
      type?: string;
      states?: string[];
    };
    credit_inquiry?: string;
    household_limit?: string;
    early_closure_fee?: string;
    chex_systems?: string;
    expiration?: string;
    options_trading?: string;
    ira_accounts?: string;
  };
  logo?: {
    type?: string;
    url?: string;
  };
  card_image?: {
    url?: string;
    network?: string;
    color?: string;
    badge?: string;
  };
  metadata?: {
    created?: string;
    updated?: string;
  };
}

const transformBankRewardsOffer = (
  offer: BankRewardsOffer
): Partial<FirestoreOpportunity> => {
  console.log('Transforming offer:', offer.name);

  const transformed: Partial<FirestoreOpportunity> = {
    name: offer.name,
    type: offer.type.toLowerCase() as FirestoreOpportunity['type'],
    offer_link: offer.offer_link,
    value: typeof offer.value === 'string' ? parseInt(offer.value) || 0 : offer.value,
    description: offer.bonus?.description || '',
    bonus: {
      title: offer.bonus?.title || '',
      description: offer.bonus?.description || '',
      requirements: {
        title: offer.bonus?.requirements?.title || '',
        description: offer.bonus?.requirements?.description || '',
        minimum_deposit: undefined,
        trading_requirements: undefined,
        holding_period: undefined,
      },
      additional_info: undefined,
      tiers: offer.bonus?.tiers?.length
        ? offer.bonus.tiers.map((tier) => ({
            ...tier,
            reward: '',
            deposit: '',
          }))
        : undefined,
    },
    details: {
      monthly_fees: {
        amount: offer.details?.monthly_fees?.amount || '0',
      },
      account_type: offer.details?.account_type || '',
      availability: {
        type: (offer.details?.availability?.type || 'Nationwide') as
          | 'Nationwide'
          | 'State',
        states: offer.details?.availability?.states || [],
      },
      credit_inquiry: offer.details?.credit_inquiry || undefined,
      household_limit: offer.details?.household_limit || undefined,
      early_closure_fee: offer.details?.early_closure_fee || undefined,
      chex_systems: offer.details?.chex_systems || undefined,
      expiration: offer.details?.expiration || undefined,
    },
    logo: {
      type: (offer.logo?.type || 'icon') as 'icon' | 'url',
      url: offer.logo?.url || '',
    },
    card_image:
      offer.type.toLowerCase() === 'credit_card' && offer.card_image
        ? {
            url: offer.card_image.url || '',
            network: offer.card_image.network,
            color: offer.card_image.color,
            badge: offer.card_image.badge,
          }
        : undefined,
    metadata: {
      created_at: Timestamp.now().toDate().toISOString(),
      updated_at: Timestamp.now().toDate().toISOString(),
      created_by: 'bank-rewards-sync',
      status: 'inactive',
      source: {
        name: 'bankrewards',
        original_id: offer.id,
      },
    },
  };

  console.log('Transformed offer:', transformed.name);
  return transformed;
};

export async function GET() {
  try {
    console.log('Starting bank rewards sync...');

    // Fetch bank rewards offers
    const response = await fetch('http://localhost:3000/api/bankrewards?format=detailed');
    const data = await response.json();

    console.log('Raw API response:', JSON.stringify(data).slice(0, 200));
    console.log('Data type:', typeof data);
    console.log('Data keys:', Object.keys(data));

    // The API returns an object with a nested structure: data.offers contains the array
    const offers = data?.data?.offers || [];
    console.log('Offers type:', typeof offers);
    console.log('Is offers array?', Array.isArray(offers));
    console.log(`Fetched ${offers.length} bank rewards offers`);

    // Get existing staged offers
    const stagedOffersRef = collection(db, 'staged_offers');
    const stagedOffersSnapshot = await getDocs(stagedOffersRef);
    const existingOfferIds = new Set(
      stagedOffersSnapshot.docs.map((doc) => {
        const data = doc.data();
        return data.metadata?.source?.original_id;
      })
    );

    console.log('Existing offer IDs:', Array.from(existingOfferIds));

    // Transform and add new offers
    const newOffers = [];
    for (const offer of offers) {
      if (!existingOfferIds.has(offer.id)) {
        const transformedOffer = transformBankRewardsOffer(offer);
        newOffers.push(transformedOffer);
      }
    }

    console.log(`Found ${newOffers.length} new offers to add`);

    // Add new offers to Firestore
    const batch = writeBatch(db);
    for (const offer of newOffers) {
      const docRef = doc(stagedOffersRef);
      batch.set(docRef, offer);
    }
    await batch.commit();

    // Fetch existing opportunities
    const opportunitiesRef = collection(db, 'opportunities');
    const snapshot = await getDocs(opportunitiesRef);

    const opportunities = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...(doc.data() as {
        source?: { name?: string };
        details?: { expiration?: string };
      }),
    }));

    // Filter only bank rewards opportunities
    const bankRewardsOffers = opportunities.filter(
      (opp) => opp.source?.name === 'bankrewards'
    );

    // Calculate stats
    const stats = {
      total: bankRewardsOffers.length,
      active: bankRewardsOffers.filter(
        (opp) => !opp.details?.expiration || new Date(opp.details.expiration) > new Date()
      ).length,
      expired: bankRewardsOffers.filter(
        (opp) => opp.details?.expiration && new Date(opp.details.expiration) <= new Date()
      ).length,
    };

    return NextResponse.json({
      success: true,
      message: `Successfully synced ${newOffers.length} new bank rewards offers`,
      total_offers: offers.length,
      new_offers: newOffers.length,
      data: {
        stats,
        offers: bankRewardsOffers,
      },
    });
  } catch (error) {
    console.error('Error syncing bank rewards:', error);
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error occurred';
    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
  }
}
