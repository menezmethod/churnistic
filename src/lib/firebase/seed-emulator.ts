import { doc, setDoc } from 'firebase/firestore';

import { db } from './firebase';

async function seedTestData() {
  const offersRef = collection(db, 'bankrewards');

  // Sample test offers
  const testOffers = [
    {
      id: 'test-offer-1',
      sourceUrl: 'https://www.bankrewards.io/credit-card/test-1',
      sourceId: 'test-1',
      title: 'Test Credit Card Offer',
      type: 'CREDIT_CARD',
      metadata: {
        bonus: '$200 welcome bonus',
        rawHtml: '<div>Test offer content</div>',
        lastChecked: Timestamp.fromDate(new Date()),
        lastUpdated: Timestamp.fromDate(new Date()),
        status: 'active',
        offerBaseUrl: 'https://www.bankrewards.io',
      },
    },
    {
      id: 'test-offer-2',
      sourceUrl: 'https://www.bankrewards.io/bank/test-2',
      sourceId: 'test-2',
      title: 'Test Bank Account Offer',
      type: 'BANK_ACCOUNT',
      metadata: {
        bonus: '$300 signup bonus',
        rawHtml: '<div>Test bank offer content</div>',
        lastChecked: Timestamp.fromDate(new Date()),
        lastUpdated: Timestamp.fromDate(new Date()),
        status: 'active',
        offerBaseUrl: 'https://www.bankrewards.io',
      },
    },
  ];

  console.log('Seeding test data...');

  try {
    for (const offer of testOffers) {
      await setDoc(doc(offersRef, offer.id), offer);
      console.log(`Added test offer: ${offer.title}`);
    }
    console.log('Successfully seeded test data!');
  } catch (error) {
    console.error('Error seeding test data:', error);
  }
}

// Run if this file is executed directly
if (require.main === module) {
  seedTestData();
}

export { seedTestData };
