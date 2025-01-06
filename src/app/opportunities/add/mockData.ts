import { FormData, OfferType } from '@/types/opportunity';

const bankOffers: FormData[] = [
  {
    name: 'Chase Total Checking',
    type: 'bank',
    offer_link: 'https://accounts.chase.com',
    value: '300',
    bonus: {
      title: 'Bonus Details',
      description: '$300 bonus',
      requirements: {
        title: 'Bonus Requirements',
        description: 'Set up direct deposit within 90 days',
      },
    },
    details: {
      monthly_fees: { amount: '$12' },
      account_type: 'Personal Bank Account',
      availability: { type: 'Nationwide' },
      expiration: '2025-12-31',
      credit_inquiry: 'Soft Pull',
      household_limit: 'One per household',
      early_closure_fee: '$50 if closed within 6 months',
    },
    logo: {
      type: 'icon',
      url: 'https://bankrewards.io/_next/image?url=https%3A%2F%2Fpbs.twimg.com%2Fprofile_images%2F748885874516094980%2Fywt_aKRx_400x400.jpg&w=128&q=75',
    },
  },
  {
    name: 'Citi Priority Account',
    type: 'bank',
    offer_link: 'https://banking.citi.com',
    value: '2000',
    bonus: {
      title: 'Bonus Details',
      description: 'Earn up to $2,000 bonus',
      requirements: {
        title: 'Bonus Requirements',
        description: 'Maintain minimum balance for 60 days',
      },
      tiers: [
        { reward: '$200', deposit: '$10,000' },
        { reward: '$500', deposit: '$30,000' },
        { reward: '$1,000', deposit: '$75,000' },
        { reward: '$2,000', deposit: '$200,000' },
      ],
    },
    details: {
      monthly_fees: { amount: '$30' },
      account_type: 'Premium Checking',
      availability: {
        type: 'State',
        states: ['NY', 'CA', 'FL', 'TX'],
      },
      expiration: '2024-12-31',
      credit_inquiry: 'Soft Pull',
      chex_systems: 'Yes',
    },
    logo: {
      type: 'icon',
      url: 'https://bankrewards.io/_next/image?url=https%3A%2F%2Ft3.gstatic.com%2FfaviconV2%3Fclient%3DSOCIAL%26type%3DFAVICON%26fallback_opts%3DTYPE%2CSIZE%2CURL%26url%3Dhttp%3A%2F%2Fbanking.citi.com%26size%3D128&w=128&q=75',
    },
  },
];

const creditCardOffers: FormData[] = [
  {
    name: 'Chase Sapphire Preferred',
    type: 'credit_card',
    offer_link: 'https://www.referyourchasecard.com',
    value: '900',
    bonus: {
      title: 'Bonus Details',
      description: 'Earn 60,000 Chase Ultimate Rewards points (worth ~$900)',
      requirements: {
        title: 'Bonus Requirements',
        description: 'Spend $4,000 in 3 months',
      },
      additional_info:
        'Points are worth 50% more when redeemed for travel through Chase Ultimate Rewards',
    },
    details: {
      monthly_fees: { amount: '$95' },
      account_type: 'Premium Travel Card',
      availability: { type: 'Nationwide' },
      credit_inquiry: 'Hard Pull',
      expiration: '2025-12-31',
    },
    logo: {
      type: 'icon',
      url: 'https://bankrewards.io/_next/image?url=https%3A%2F%2Ft3.gstatic.com%2FfaviconV2%3Fclient%3DSOCIAL%26type%3DFAVICON%26fallback_opts%3DTYPE%2CSIZE%2CURL%26url%3Dhttp%3A%2F%2Fwww.referyourchasecard.com%26size%3D128&w=128&q=75',
    },
    card_image: {
      url: 'https://creditcards.chase.com/K-Marketplace/images/cardart/sapphire_preferred_card.png',
      network: 'Visa',
      color: 'Blue',
      badge: 'PREMIUM REWARDS',
    },
  },
  {
    name: 'Capital One Venture X',
    type: 'credit_card',
    offer_link: 'https://capital.one/venture',
    value: '1500',
    bonus: {
      title: 'Bonus Details',
      description: 'Earn 150,000 miles (worth $1,500+ in travel)',
      requirements: {
        title: 'Bonus Requirements',
        description: 'Spend $5,000 in 6 months',
      },
      additional_info: 'Includes $300 annual travel credit and Priority Pass membership',
    },
    details: {
      monthly_fees: { amount: '$395' },
      account_type: 'Premium Travel Card',
      availability: { type: 'Nationwide' },
      credit_inquiry: 'Hard Pull',
      expiration: '2024-12-31',
    },
    logo: {
      type: 'icon',
      url: 'https://bankrewards.io/_next/image?url=https%3A%2F%2Fplay-lh.googleusercontent.com%2FPxZGVNHgFaLXfcrH9xLz3jvkqJ_9DVRoZ9FQ8DYa-tABxHXKYqS_-jqCJo04v6Pxbw&w=128&q=75',
    },
    card_image: {
      url: 'https://cdn.wallethub.com/common/product/images/creditcards/500/capital-one-venture-x-rewards-credit-card-13011415c.png',
      network: 'Visa Infinite',
      color: 'Black',
      badge: 'PREMIUM METAL CARD',
    },
  },
];

const brokerageOffers: FormData[] = [
  {
    name: 'Charles Schwab',
    type: 'brokerage',
    offer_link: 'https://www.schwab.com',
    value: '101',
    bonus: {
      title: 'Bonus Details',
      description: 'Get $101 in stock after funding your account',
      requirements: {
        title: 'Bonus Requirements',
        description: 'Fund account with $50 within 30 days',
      },
    },
    details: {
      monthly_fees: { amount: 'None' },
      account_type: 'Brokerage Account',
      availability: { type: 'Nationwide' },
      expiration: '2025-12-31',
    },
    logo: {
      type: 'icon',
      url: 'https://bankrewards.io/_next/image?url=https%3A%2F%2Fupload.wikimedia.org%2Fwikipedia%2Fcommons%2Fthumb%2F4%2F4b%2FCharles_Schwab_Corporation_logo.svg%2F1200px-Charles_Schwab_Corporation_logo.svg.png&w=128&q=75',
    },
  },
  {
    name: 'Webull',
    type: 'brokerage',
    offer_link: 'https://www.webull.com',
    value: '250',
    bonus: {
      title: 'Bonus Details',
      description: 'Get free stocks worth up to $250',
      requirements: {
        title: 'Bonus Requirements',
        description: 'Open account and make a deposit',
      },
      tiers: [
        { reward: '2 stocks ($3-$300)', deposit: '$1' },
        { reward: '4 stocks ($7-$3,000)', deposit: '$100' },
        { reward: '6 stocks ($15-$3,000)', deposit: '$2,000' },
      ],
      additional_info: 'Also receive 1 year of free Level 2 market data',
    },
    details: {
      monthly_fees: { amount: 'None' },
      account_type: 'Brokerage Account',
      availability: { type: 'Nationwide' },
      credit_inquiry: 'Soft Pull',
      expiration: 'None',
    },
    logo: {
      type: 'icon',
      url: 'https://bankrewards.io/_next/image?url=https%3A%2F%2Fplay-lh.googleusercontent.com%2FhGqUSy-kzb0D6FWrBH5Dv44uxmOqhdZyhAZUa3eZqVYsJHGUJkwEQhEXtGZh5SBR3zY&w=128&q=75',
    },
  },
];

const allOffers: Record<OfferType, FormData[]> = {
  bank: bankOffers,
  credit_card: creditCardOffers,
  brokerage: brokerageOffers,
};

export const getRandomOffer = (type: OfferType): FormData => {
  const offers = allOffers[type];
  return offers[Math.floor(Math.random() * offers.length)];
};

export const getAllOffers = () => allOffers;
