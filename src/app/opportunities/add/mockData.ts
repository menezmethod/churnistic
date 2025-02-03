import { Opportunity, OfferType } from '@/types/opportunity';

const mockOffers: Opportunity[] = [
  {
    name: 'Chase Sapphire Preferred',
    type: 'credit_card',
    status: 'pending',
    isStaged: false,
    offer_link: 'https://www.chase.com/sapphire-preferred',
    value: 800,
    bonus: {
      description:
        'Earn 80,000 bonus points after you spend $4,000 on purchases in the first 3 months',
      requirements: {
        description: 'Spend $4,000 on purchases in the first 3 months',
        spending_requirement: {
          amount: 4000,
          timeframe: '3 months',
        },
      },
    },
    details: {
      monthly_fees: {
        amount: '$95',
        waiver_details: 'Not waived first year',
      },
      account_type: 'Credit Card',
      account_category: 'personal',
      availability: { type: 'Nationwide' },
      credit_score: {
        min: 680,
        recommended: 720,
      },
      under_5_24: {
        required: true,
        details: 'Must be under 5/24 rule',
      },
      annual_fees: {
        amount: '$95',
        waived_first_year: false,
      },
      foreign_transaction_fees: {
        percentage: '0%',
        waived: true,
      },
      minimum_credit_limit: '$5,000',
      rewards_structure: {
        base_rewards: '1x points on all purchases',
        welcome_bonus: '80,000 points',
        bonus_categories: [
          {
            category: 'Travel',
            rate: '2x',
            limit: 'Unlimited',
          },
          {
            category: 'Dining',
            rate: '3x',
            limit: 'Unlimited',
          },
        ],
      },
    },
    logo: {
      url: 'https://bankrewards.io/_next/image?url=https%3A%2F%2Fplay-lh.googleusercontent.com%2FhGqUSy-kzb0D6FWrBH5Dv44uxmOqhdZyhAZUa3eZqVYsJHGUJkwEQhEXtGZh5SBR3zY&w=128&q=75',
    },
  },
  {
    name: 'Capital One 360 Checking',
    type: 'bank',
    status: 'pending',
    isStaged: false,
    offer_link: 'https://www.capitalone.com/360checking',
    value: 400,
    bonus: {
      description: 'Get a $400 bonus when you open a new 360 Checking account',
      requirements: {
        description: 'Receive 2 direct deposits totaling $1,000 or more within 60 days',
      },
    },
    details: {
      monthly_fees: {
        amount: 'None',
        waiver_details: 'No monthly fees for this account',
      },
      account_type: 'Checking Account',
      account_category: 'personal',
      availability: { type: 'Nationwide' },
      household_limit: 'One per person',
      early_closure_fee: '$50 if closed within 90 days',
      chex_systems: 'Sensitive',
    },
    logo: {
      url: 'https://bankrewards.io/_next/image?url=https%3A%2F%2Fplay-lh.googleusercontent.com%2FhGqUSy-kzb0D6FWrBH5Dv44uxmOqhdZyhAZUa3eZqVYsJHGUJkwEQhEXtGZh5SBR3zY&w=128&q=75',
    },
  },
  {
    name: 'Webull',
    type: 'brokerage',
    status: 'pending',
    isStaged: false,
    offer_link: 'https://www.webull.com',
    value: 250,
    bonus: {
      description: 'Get free stocks worth up to $250',
      requirements: {
        description: 'Open account and make a deposit',
        minimum_deposit: 1,
        trading_requirements: 'No trading requirements',
        holding_period: '30 days',
      },
      tiers: [
        {
          level: 'Basic',
          value: 300,
          minimum_deposit: 1,
          requirements: '2 stocks ($3-$300)',
        },
        {
          level: 'Silver',
          value: 3000,
          minimum_deposit: 100,
          requirements: '4 stocks ($7-$3,000)',
        },
        {
          level: 'Gold',
          value: 3000,
          minimum_deposit: 2000,
          requirements: '6 stocks ($15-$3,000)',
        },
      ],
      additional_info: 'Also receive 1 year of free Level 2 market data',
    },
    details: {
      monthly_fees: {
        amount: 'None',
        waiver_details: 'No monthly fees for this account',
      },
      account_type: 'Brokerage Account',
      availability: {
        type: 'Nationwide',
      },
      household_limit: 'One per person',
      early_closure_fee: 'None',
    },
    logo: {
      url: 'https://bankrewards.io/_next/image?url=https%3A%2F%2Fplay-lh.googleusercontent.com%2FhGqUSy-kzb0D6FWrBH5Dv44uxmOqhdZyhAZUa3eZqVYsJHGUJkwEQhEXtGZh5SBR3zY&w=128&q=75',
    },
  },
  {
    name: 'Moomoo',
    type: 'brokerage',
    status: 'pending',
    isStaged: false,
    offer_link: 'https://start.moomoo.com',
    value: 225,
    bonus: {
      description:
        'Get up to 15 free stocks when you make a qualified deposit + earn 8.1% APY on uninvested cash for 3 months + up to $300 in Cash Rewards if you transfer from another brokerage!',
      requirements: {
        description: 'Contact bank for specific requirements',
      },
    },
    details: {
      monthly_fees: {
        amount: 'None',
      },
      account_type: 'Brokerage Account',
      availability: {
        type: 'Nationwide',
      },
      options_trading: 'Yes (option fees apply)',
      ira_accounts: 'No',
    },
    logo: {
      url: 'https://bankrewards.io/_next/image?url=https%3A%2F%2Fplay-lh.googleusercontent.com%2FYAr7BMJmTnj8REa3yT9gP_y4xFBIWlAidF0jEyJuERb7ZftjSiVgcARQtn2ju4Yqxr0q&w=128&q=75',
    },
  },
  {
    name: 'Key Smart Checking®',
    type: 'bank',
    status: 'pending',
    isStaged: false,
    offer_link: 'https://click.linksynergy.com',
    value: 300,
    bonus: {
      description: '$300 bonus',
      requirements: {
        description: 'Contact bank for specific requirements',
      },
    },
    details: {
      monthly_fees: {
        amount: 'None',
      },
      account_type: 'Personal Bank Account',
      availability: {
        type: 'State',
        states: [
          'AK',
          'CO',
          'CT',
          'IN',
          'MA',
          'ME',
          'MI',
          'NY',
          'OH',
          'OR',
          'PA',
          'UT',
          'VT',
          'WA',
        ],
      },
      expiration: '5/16/2025',
    },
    logo: {
      url: 'https://bankrewards.io/_next/image?url=https%3A%2F%2Fwww.fintechfutures.com%2Ffiles%2F2017%2F11%2FKeyBank.jpeg&w=128&q=75',
    },
  },
  {
    name: 'SoFi Invest',
    type: 'brokerage',
    status: 'pending',
    isStaged: false,
    offer_link: 'https://www.sofi.com',
    value: 25,
    bonus: {
      description: 'Get $25 in stock after depositing $25',
      requirements: {
        description: 'Contact bank for specific requirements',
      },
    },
    details: {
      monthly_fees: {
        amount: 'None',
      },
      account_type: 'Brokerage Account',
      availability: {
        type: 'Nationwide',
      },
      options_trading: 'No',
      ira_accounts: 'Yes',
    },
    logo: {
      url: 'https://bankrewards.io/_next/image?url=https%3A%2F%2Fplay-lh.googleusercontent.com%2F2cUGJUpk3zdo8AsWUXYpDXjm8uRVCbkn7WPD-DE-LO-K0ZDvgbYcNXZ-fjgw9yfzNxK3%3Dw240-h480-rw&w=128&q=75',
    },
  },
  {
    name: 'Capital One Savor',
    type: 'credit_card',
    status: 'pending',
    isStaged: false,
    offer_link: 'https://i.capitalone.com',
    value: 250,
    bonus: {
      description: 'Earn $250 statement credit',
      requirements: {
        description: 'Spend $500 in 3 months',
      },
    },
    details: {
      monthly_fees: {
        amount: 'None',
      },
      account_type: 'Credit Card',
      availability: {
        type: 'Nationwide',
      },
      credit_inquiry: 'Hard Pull',
      expiration: 'None Listed',
      annual_fees: {
        amount: '$0',
        waived_first_year: false,
      },
      foreign_transaction_fees: {
        percentage: '0%',
        waived: true,
      },
    },
    logo: {
      url: 'https://bankrewards.io/_next/image?url=https%3A%2F%2Fplay-lh.googleusercontent.com%2FGhAZTgji_F_YJ_TmisXH7J0PgIOYNy4vLPULklCV3Ua6cV3epNZki5DxsAe-KZB7XA%3Dw240-h480-rw&w=128&q=75',
    },
    card_image: {
      url: 'https://bankrewards.io/_next/image?url=https%3A%2F%2Fecm.capitalone.com%2FWCM%2Fcard%2Fproducts%2Fsavorone-card-art.png&w=3840&q=75',
      network: 'Unknown',
      color: 'Unknown',
      badge: 'NO ANNUAL FEE',
    },
  },
  {
    name: 'Current',
    type: 'bank',
    status: 'pending',
    isStaged: false,
    offer_link: 'https://current.com',
    value: 50,
    bonus: {
      description: '$50 bonus. Use code ALEXANDZ395',
      requirements: {
        description: 'Contact bank for specific requirements',
      },
    },
    details: {
      monthly_fees: {
        amount: 'None',
      },
      account_type: 'Personal Bank Account',
      availability: {
        type: 'Nationwide',
      },
      credit_inquiry: 'none',
      household_limit: 'None listed',
      early_closure_fee: 'none',
      chex_systems: 'Unknown',
      expiration: 'None Listed',
    },
    logo: {
      url: '%2Fblacklogo.png&w=128&q=75',
    },
  },
  {
    name: 'Plynk',
    type: 'brokerage',
    status: 'pending',
    isStaged: false,
    offer_link: 'https://plynkinvest.app.link',
    value: 10,
    bonus: {
      description: 'Get $10 after linking a bank account!',
      requirements: {
        description: 'Contact bank for specific requirements',
      },
    },
    details: {
      monthly_fees: {
        amount: 'None',
      },
      account_type: 'Brokerage Account',
      availability: {
        type: 'Nationwide',
      },
      options_trading: 'No',
      ira_accounts: 'No',
    },
    logo: {
      url: 'https://bankrewards.io/_next/image?url=https%3A%2F%2Fplay-lh.googleusercontent.com%2F-aqwjHSDapQVvO59kYhL0R0aJI6f6tzCDFMOYYFALI0WBIOrHU23e2DAsXfYS0E1wuI&w=128&q=75',
    },
  },
  {
    name: 'Capital One Quicksilver',
    type: 'credit_card',
    status: 'pending',
    isStaged: false,
    offer_link: 'https://i.capitalone.com',
    value: 200,
    bonus: {
      description: 'Earn $200 statement credit',
      requirements: {
        description: 'Spend $500 in 3 months',
      },
    },
    details: {
      monthly_fees: {
        amount: 'None',
      },
      account_type: 'Credit Card',
      availability: {
        type: 'Nationwide',
      },
      credit_inquiry: 'Hard Pull',
      expiration: 'None Listed',
      annual_fees: {
        amount: '$0',
        waived_first_year: false,
      },
      foreign_transaction_fees: {
        percentage: '0%',
        waived: true,
      },
    },
    logo: {
      url: 'https://bankrewards.io/_next/image?url=https%3A%2F%2Fplay-lh.googleusercontent.com%2FGhAZTgji_F_YJ_TmisXH7J0PgIOYNy4vLPULklCV3Ua6cV3epNZki5DxsAe-KZB7XA%3Dw240-h480-rw&w=128&q=75',
    },
    card_image: {
      url: 'https://bankrewards.io/_next/image?url=https%3A%2F%2Fecm.capitalone.com%2FWCM%2Fcard%2Fproducts%2Ffreedom_unlimited_card_alt.png&w=3840&q=75',
      network: 'Unknown',
      color: 'Unknown',
      badge: 'NO ANNUAL FEE',
    },
  },
  {
    name: 'Discover Student',
    type: 'credit_card',
    status: 'pending',
    isStaged: false,
    offer_link: 'https://www.discover.com',
    value: 100,
    bonus: {
      description: 'Earn $100 statement credit',
      requirements: {
        description: 'Make one purchase in 3 months',
      },
    },
    details: {
      monthly_fees: {
        amount: 'None',
      },
      account_type: 'Credit Card',
      availability: {
        type: 'Nationwide',
      },
      credit_inquiry: 'Hard Pull',
      expiration: 'None Listed',
      annual_fees: {
        amount: '$0',
        waived_first_year: false,
      },
      foreign_transaction_fees: {
        percentage: '0%',
        waived: true,
      },
    },
    logo: {
      url: 'https://bankrewards.io/_next/image?url=https%3A%2F%2Fplay-lh.googleusercontent.com%2FPzp9uRoP0F1c0F-KlytEU9kw_J-fLe0Qw_L_8JIQZz_-vm-iYNj8olicense9Yw&w=128&q=75',
    },
    card_image: {
      url: 'https://bankrewards.io/_next/image?url=https%3A%2F%2Fwww.discover.com%2Fcontent%2Fdam%2Fdiscover%2Fen_us%2Fcards%2Fstudent%2Fstudent-chrome-card-art.png&w=3840&q=75',
      network: 'Discover',
      color: 'Chrome',
      badge: 'STUDENT',
    },
  },
  {
    name: 'Fidelity',
    type: 'brokerage',
    status: 'pending',
    isStaged: false,
    offer_link: 'https://www.fidelity.com',
    value: 100,
    bonus: {
      description: 'Get $100 when you open a new account',
      requirements: {
        description: 'Deposit $50 or more',
      },
    },
    details: {
      monthly_fees: {
        amount: 'None',
      },
      account_type: 'Brokerage Account',
      availability: {
        type: 'Nationwide',
      },
      options_trading: 'Yes',
      ira_accounts: 'Yes',
    },
    logo: {
      url: 'https://bankrewards.io/_next/image?url=https%3A%2F%2Fplay-lh.googleusercontent.com%2FvHxp1hF5ZzFHZxp4N-VvQUk-DEVVKzQHO5nz1VsN&w=128&q=75',
    },
  },
  {
    name: 'Chime',
    type: 'bank',
    status: 'pending',
    isStaged: false,
    offer_link: 'https://www.chime.com',
    value: 75,
    bonus: {
      description: '$75 welcome bonus',
      requirements: {
        description: 'Set up direct deposit of $500 or more',
      },
    },
    details: {
      monthly_fees: {
        amount: 'None',
      },
      account_type: 'Checking Account',
      availability: {
        type: 'Nationwide',
      },
      credit_inquiry: 'none',
      household_limit: '1',
      early_closure_fee: 'none',
      chex_systems: 'Yes',
      expiration: 'None Listed',
    },
    logo: {
      url: 'https://bankrewards.io/_next/image?url=https%3A%2F%2Fplay-lh.googleusercontent.com%2FvHxp1hF5ZzFHZxp4N-VvQUk-DEVVKzQHO5nz1VsN&w=128&q=75',
    },
  },
  {
    name: 'Citizens Equity First Credit Union',
    type: 'bank',
    status: 'pending',
    isStaged: false,
    offer_link: 'https://www.cefcu.com',
    value: 225,
    bonus: {
      description: '$200 bonus for direct deposit. $25 bonus for debit card spend',
      requirements: {
        description: 'Contact bank for specific requirements',
      },
    },
    details: {
      monthly_fees: {
        amount: 'None',
      },
      account_type: 'Personal Bank Account',
      availability: {
        type: 'State',
        states: ['CA'],
      },
      household_limit: 'None listed',
      chex_systems: 'Yes',
      expiration: '12/30/2024',
    },
    logo: {
      url: 'https://bankrewards.io/_next/image?url=https%3A%2F%2Fis1-ssl.mzstatic.com%2Fimage%2Fthumb%2FPurple211%2Fv4%2F26%2Fd4%2F01%2F26d40135-c925-e570-8724-cfb15303cf18%2FAppIcon-0-0-1x_U007emarketing-0-10-0-85-220.png%2F1024x1024.jpg&w=128&q=75',
    },
  },
  {
    name: 'Middlesex Federal',
    type: 'bank',
    status: 'pending',
    isStaged: false,
    offer_link: 'https://info.middlesexfederal.com',
    value: 150,
    bonus: {
      description:
        'Must requrest debit card and make over 15 transactions within 2nd and 4th "statement cycle"',
      requirements: {
        description: 'Contact bank for specific requirements',
      },
    },
    details: {
      monthly_fees: {
        amount: 'None',
      },
      account_type: 'Personal Bank Account',
      availability: {
        type: 'State',
        states: ['MA'],
      },
      credit_inquiry: 'unknown',
      household_limit: 'One',
      early_closure_fee: 'Unknown',
      expiration: 'None Listed',
    },
    logo: {
      url: 'https://bankrewards.io/_next/image?url=https%3A%2F%2Fencrypted-tbn0.gstatic.com%2Fimages%3Fq%3Dtbn%3AANd9GcTNp8bGdb6vYlJnPtpB_frPlEbbBdr949XdPBc1lTi1sw%26s&w=128&q=75',
    },
  },
  {
    name: 'Dedham Savings Bank',
    type: 'bank',
    status: 'pending',
    isStaged: false,
    offer_link: 'https://www.dedhamsavings.com',
    value: 250,
    bonus: {
      description: 'Earn $250 within 90 days after qualifications are met',
      requirements: {
        description: 'Contact bank for specific requirements',
      },
    },
    details: {
      monthly_fees: {
        amount: 'None',
      },
      account_type: 'Personal Bank Account',
      availability: {
        type: 'State',
        states: ['MA'],
      },
      credit_inquiry: 'Soft Pull',
      household_limit: 'None listed',
      expiration: '12/30/2024',
    },
    logo: {
      url: 'https://bankrewards.io/_next/image?url=https%3A%2F%2Fwww.dedhamsavings.com%2Fwp-content%2Fuploads%2F2023%2F01%2FDedham_Logo_vertical_color.png&w=128&q=75',
    },
  },
  {
    name: 'A+ Federal Credit Union',
    type: 'bank',
    status: 'pending',
    isStaged: false,
    offer_link: 'https://aplusfcu.org',
    value: 100,
    bonus: {
      description: '$100 bonus',
      requirements: {
        description: 'Contact bank for specific requirements',
      },
      tiers: [
        {
          level: 'Basic',
          value: 75,
          minimum_deposit: 800,
          requirements: 'Direct deposit of $800 or more',
        },
      ],
    },
    details: {
      monthly_fees: {
        amount: 'None',
      },
      account_type: 'Personal Bank Account',
      availability: {
        type: 'State',
        states: ['TX'],
      },
      expiration: '12/30/2024',
    },
    logo: {
      url: 'https://bankrewards.io/_next/image?url=https%3A%2F%2Ft3.gstatic.com%2FfaviconV2%3Fclient%3DSOCIAL%26type%3DFAVICON%26fallback_opts%3DTYPE%2CSIZE%2CURL%26url%3Dhttp%3A%2F%2Faplusfcu.org%26size%3D128&w=128&q=75',
    },
  },
  {
    name: 'U.S. Bank Altitude',
    type: 'credit_card',
    status: 'pending',
    isStaged: false,
    offer_link: 'https://www.usbank.com',
    value: 20,
    bonus: {
      description: 'Get 20,000 bonus points',
      requirements: {
        description: 'Spend $1,000 in 90 days',
      },
    },
    details: {
      monthly_fees: {
        amount: 'None',
      },
      account_type: 'Credit Card',
      availability: {
        type: 'Nationwide',
      },
      credit_inquiry: 'Hard Pull',
      expiration: 'None Listed',
      annual_fees: {
        amount: '$0',
        waived_first_year: false,
      },
      foreign_transaction_fees: {
        percentage: '0%',
        waived: true,
      },
    },
    logo: {
      url: 'https://bankrewards.io/_next/image?url=https%3A%2F%2Ft3.gstatic.com%2FfaviconV2%3Fclient%3DSOCIAL%26type%3DFAVICON%26fallback_opts%3DTYPE%2CSIZE%2CURL%26url%3Dhttp%3A%2F%2Fwww.usbank.com%26size%3D128&w=128&q=75',
    },
    card_image: {
      url: 'https://bankrewards.io/_next/image?url=https%3A%2F%2Fcdn.wallethub.com%2Fcommon%2Fproduct%2Fimages%2Fcreditcards%2F500%2Fu-s-bank-altitude-go-visa-signature-card-13003275c.png&w=3840&q=75',
      network: 'Unknown',
      color: 'Unknown',
      badge: 'NO ANNUAL FEE',
    },
  },
  {
    name: 'Simmons Bank',
    type: 'bank',
    status: 'pending',
    isStaged: false,
    offer_link: 'https://www.simmonsbank.com',
    value: 600,
    bonus: {
      description: 'Three bonuses of $50-$200 each depending on average daily balance',
      requirements: {
        description: 'Contact bank for specific requirements',
      },
    },
    details: {
      monthly_fees: {
        amount: 'None',
      },
      account_type: 'Personal Bank Account',
      availability: {
        type: 'State',
        states: ['OK', 'AK', 'TX'],
      },
      household_limit: 'None listed',
      expiration: '3/31/2025',
    },
    logo: {
      url: 'https://bankrewards.io/_next/image?url=https%3A%2F%2Ft3.gstatic.com%2FfaviconV2%3Fclient%3DSOCIAL%26type%3DFAVICON%26fallback_opts%3DTYPE%2CSIZE%2CURL%26url%3Dhttp%3A%2F%2Fwww.simmonsbank.com%26size%3D128&w=128&q=75',
    },
  },
  {
    name: 'Langley Credit Union',
    type: 'bank',
    status: 'pending',
    isStaged: false,
    offer_link: 'https://www.langleyfcu.org',
    value: 100,
    bonus: {
      description:
        'Open a new checking account and make any purchase with the debit card for a $100 credit',
      requirements: {
        description: 'Contact bank for specific requirements',
      },
    },
    details: {
      monthly_fees: {
        amount: 'None',
      },
      account_type: 'Personal Bank Account',
      availability: {
        type: 'Nationwide',
      },
      expiration: 'None Listed',
    },
    logo: {
      url: 'https://bankrewards.io/_next/image?url=https%3A%2F%2Ft3.gstatic.com%2FfaviconV2%3Fclient%3DSOCIAL%26type%3DFAVICON%26fallback_opts%3DTYPE%2CSIZE%2CURL%26url%3Dhttp%3A%2F%2Fwww.langleyfcu.org%26size%3D128&w=128&q=75',
    },
  },
  {
    name: 'Community America Credit Union',
    type: 'bank',
    status: 'pending',
    isStaged: false,
    offer_link: 'https://www.communityamerica.com',
    value: 400,
    bonus: {
      description: '$400 bonus with direct deposit',
      requirements: {
        description: 'Contact bank for specific requirements',
      },
    },
    details: {
      monthly_fees: {
        amount: 'None',
      },
      account_type: 'Personal Bank Account',
      availability: {
        type: 'State',
        states: ['MO', 'KS', 'IL'],
      },
      credit_inquiry: 'Soft Pull',
      early_closure_fee:
        'Account closed within 6 months will be charged the amount of the bonus',
      expiration: '12/31/2024',
    },
    logo: {
      url: 'https://bankrewards.io/_next/image?url=https%3A%2F%2Ft3.gstatic.com%2FfaviconV2%3Fclient%3DSOCIAL%26type%3DFAVICON%26fallback_opts%3DTYPE%2CSIZE%2CURL%26url%3Dhttp%3A%2F%2Fwww.communityamerica.com%26size%3D128&w=128&q=75',
    },
  },
  {
    name: 'River Valley Credit Union',
    type: 'bank',
    status: 'pending',
    isStaged: false,
    offer_link: 'https://rivervalleycu.org',
    value: 100,
    bonus: {
      description: '$100 cash bonus',
      requirements: {
        description: 'Contact bank for specific requirements',
      },
    },
    details: {
      monthly_fees: {
        amount: 'None',
      },
      account_type: 'Personal Bank Account',
      availability: {
        type: 'State',
        states: ['OH'],
      },
      expiration: '12/30/2024',
    },
    logo: {
      url: 'https://bankrewards.io/_next/image?url=https%3A%2F%2Fmedia.licdn.com%2Fdms%2Fimage%2FC560BAQHxi5UCYGcMBQ%2Fcompany-logo_200_200%2F0%2F1631361563890%3Fe%3D2147483647%26v%3Dbeta%26t%3DYBj2cH4UAJcbeB0NjEMJF9Sebjql1BC1MLxZIXDtS8g&w=128&q=75',
    },
  },
  {
    name: 'Old Second Bank',
    type: 'bank',
    status: 'pending',
    isStaged: false,
    offer_link: 'https://www.oldsecond.com',
    value: 300,
    bonus: {
      description:
        '$300 bonus: $50 on account open, $100 from direct deposits, and $150 from opening a Money Builder Savings account',
      requirements: {
        description: 'Contact bank for specific requirements',
      },
    },
    details: {
      monthly_fees: {
        amount: 'None',
      },
      account_type: 'Personal Bank Account',
      availability: {
        type: 'State',
        states: ['IL'],
      },
      credit_inquiry: 'Soft Pull',
      household_limit: 'One',
      early_closure_fee: '$25 if closed within 90 days',
      chex_systems: 'Unknown',
      expiration: '12/31/2024',
    },
    logo: {
      url: 'https://bankrewards.io/_next/image?url=https%3A%2F%2Ft3.gstatic.com%2FfaviconV2%3Fclient%3DSOCIAL%26type%3DFAVICON%26fallback_opts%3DTYPE%2CSIZE%2CURL%26url%3Dhttp%3A%2F%2Fwww.oldsecond.com%26size%3D128&w=128&q=75',
    },
  },
  {
    name: 'Andrews Federal Credit Union',
    type: 'bank',
    status: 'pending',
    isStaged: false,
    offer_link: 'https://www.andrewsfcu.org',
    value: 150,
    bonus: {
      description: '$150 bonus with direct deposit',
      requirements: {
        description: 'Contact bank for specific requirements',
      },
    },
    details: {
      monthly_fees: {
        amount: 'None',
      },
      account_type: 'Personal Bank Account',
      availability: {
        type: 'State',
        states: ['DC'],
      },
      credit_inquiry: 'Soft Pull',
      early_closure_fee: '$25 if closed within 60 days',
      expiration: 'None Listed',
    },
    logo: {
      url: 'https://bankrewards.io/_next/image?url=https%3A%2F%2Ft3.gstatic.com%2FfaviconV2%3Fclient%3DSOCIAL%26type%3DFAVICON%26fallback_opts%3DTYPE%2CSIZE%2CURL%26url%3Dhttp%3A%2F%2Fwww.andrewsfcu.org%26size%3D128&w=128&q=75',
    },
  },
  {
    name: 'Bank of America Travel Rewards',
    type: 'credit_card',
    status: 'pending',
    isStaged: false,
    offer_link: 'https://www.bankofamerica.com',
    value: 25,
    bonus: {
      description: 'Earn 25,000 online bonus points',
      requirements: {
        description: 'Spend $1,000 in 90 days',
      },
    },
    details: {
      monthly_fees: {
        amount: 'None',
      },
      account_type: 'Credit Card',
      availability: {
        type: 'Nationwide',
      },
      credit_inquiry: 'Hard Pull',
      expiration: 'None Listed',
      annual_fees: {
        amount: '$0',
        waived_first_year: false,
      },
      foreign_transaction_fees: {
        percentage: '0%',
        waived: true,
      },
    },
    logo: {
      url: 'https://bankrewards.io/_next/image?url=https%3A%2F%2Ft3.gstatic.com%2FfaviconV2%3Fclient%3DSOCIAL%26type%3DFAVICON%26fallback_opts%3DTYPE%2CSIZE%2CURL%26url%3Dhttp%3A%2F%2Fwww.bankofamerica.com%26size%3D128&w=128&q=75',
    },
    card_image: {
      url: 'https://bankrewards.io/_next/image?url=https%3A%2F%2Fwww.bankofamerica.com%2Fcontent%2Fdam%2Fdiscover%2Fen_us%2Fcards%2Fstudent%2Fstudent-chrome-card-art.png&w=3840&q=75',
      network: 'Unknown',
      color: 'Unknown',
      badge: 'NO ANNUAL FEE',
    },
  },
  {
    name: 'Simmons Bank MO/KS',
    type: 'bank',
    status: 'pending',
    isStaged: false,
    offer_link: 'https://www.simmonsbank.com',
    value: 900,
    bonus: {
      description:
        'Three bonuses of $100 or $300 each depending on how much your direct deposit is',
      requirements: {
        description: 'Contact bank for specific requirements',
      },
    },
    details: {
      monthly_fees: {
        amount: 'None',
      },
      account_type: 'Personal Bank Account',
      availability: {
        type: 'State',
        states: ['MO', 'KS'],
      },
      household_limit: 'None listed',
      expiration: '12/31/2024',
    },
    logo: {
      url: 'https://bankrewards.io/_next/image?url=https%3A%2F%2Ft3.gstatic.com%2FfaviconV2%3Fclient%3DSOCIAL%26type%3DFAVICON%26fallback_opts%3DTYPE%2CSIZE%2CURL%26url%3Dhttp%3A%2F%2Fwww.simmonsbank.com%26size%3D128&w=128&q=75',
    },
  },
  {
    name: 'Savings Bank of Danbury Priority Checking',
    type: 'bank',
    status: 'pending',
    isStaged: false,
    offer_link: 'https://www.sbdanbury.com',
    value: 100,
    bonus: {
      description:
        '$100 bonus with the Priority Checking account. Mutually exclusive with the other Savings Bank of Danbury checking accounts',
      requirements: {
        description: 'Contact bank for specific requirements',
      },
    },
    details: {
      monthly_fees: {
        amount: 'None',
      },
      account_type: 'Personal Bank Account',
      availability: {
        type: 'State',
        states: ['CT'],
      },
      chex_systems: 'Yes',
      expiration: 'None Listed',
    },
    logo: {
      url: 'https://bankrewards.io/_next/image?url=https%3A%2F%2Ft3.gstatic.com%2FfaviconV2%3Fclient%3DSOCIAL%26type%3DFAVICON%26fallback_opts%3DTYPE%2CSIZE%2CURL%26url%3Dhttp%3A%2F%2Fwww.sbdanbury.com%26size%3D128&w=128&q=75',
    },
  },
  {
    name: 'Stoneham Bank',
    type: 'bank',
    status: 'pending',
    isStaged: false,
    offer_link: 'https://www.stonehambank.com',
    value: 300,
    bonus: {
      description: '$300 bonus awarded within 120 days of direct deposit',
      requirements: {
        description: 'Contact bank for specific requirements',
      },
    },
    details: {
      monthly_fees: {
        amount: '$10',
      },
      account_type: 'Personal Bank Account',
      availability: {
        type: 'State',
        states: ['MA', 'NH'],
      },
      credit_inquiry: 'Soft Pull',
      expiration: 'None Listed',
    },
    logo: {
      url: 'https://bankrewards.io/_next/image?url=https%3A%2F%2Ft3.gstatic.com%2FfaviconV2%3Fclient%3DSOCIAL%26type%3DFAVICON%26fallback_opts%3DTYPE%2CSIZE%2CURL%26url%3Dhttp%3A%2F%2Fwww.stonehambank.com%26size%3D128&w=128&q=75',
    },
  },
  {
    name: 'Dollar Bank',
    type: 'bank',
    status: 'pending',
    isStaged: false,
    offer_link: 'https://dollar.bank',
    value: 300,
    bonus: {
      description:
        '$300 bonus: $200 as a Mastercard debit card rebate and $100 as a deposit after a year',
      requirements: {
        description: 'Contact bank for specific requirements',
      },
    },
    details: {
      monthly_fees: {
        amount: '$5',
      },
      account_type: 'Personal Bank Account',
      availability: {
        type: 'State',
        states: ['OH', 'PA', 'VA'],
      },
      credit_inquiry: 'Soft Pull',
      household_limit: 'One',
      expiration: '12/31/2024',
    },
    logo: {
      url: 'https://bankrewards.io/_next/image?url=https%3A%2F%2Fplay-lh.googleusercontent.com%2FS63PLiqeQltPJh9lyTFHpZQ4WM8lqZS37XZZwZxNBuCQOd1nwixFj1IySSfFko_B825I%3Dw240-h480-rw&w=128&q=75',
    },
  },
  {
    name: 'Achieva Credit Union',
    type: 'bank',
    status: 'pending',
    isStaged: false,
    offer_link: 'https://www.referlive.com',
    value: 100,
    bonus: {
      description: '$100 bonus, sent as a Mastercard Gift Card',
      requirements: {
        description: 'Contact bank for specific requirements',
      },
    },
    details: {
      monthly_fees: {
        amount: '$7',
      },
      account_type: 'Personal Bank Account',
      availability: {
        type: 'State',
        states: ['FL'],
      },
      expiration: 'None Listed',
    },
    logo: {
      url: 'https://bankrewards.io/_next/image?url=https%3A%2F%2Fplay-lh.googleusercontent.com%2FEIZLYKTCOEw9skBUAQm45uorjBLlk5_CohxHjqLrTcUASIPJDpWz7YMG5VyrCvapxNM%3Dw240-h480-rw&w=128&q=75',
    },
  },
  {
    name: 'Huntington Bank',
    type: 'bank',
    status: 'pending',
    isStaged: false,
    offer_link: 'https://www.huntington.com',
    value: 400,
    bonus: {
      description: '$400 bonus',
      requirements: {
        description: 'Contact bank for specific requirements',
      },
    },
    details: {
      monthly_fees: {
        amount: '$10',
      },
      account_type: 'Personal Bank Account',
      availability: {
        type: 'State',
        states: ['PA', 'CO', 'MN', 'SD', 'WI', 'IL', 'WV', 'KY', 'IN', 'OH', 'MI'],
      },
      expiration: '2/7/2025',
    },
    logo: {
      url: 'https://bankrewards.io/_next/image?url=https%3A%2F%2Ft3.gstatic.com%2FfaviconV2%3Fclient%3DSOCIAL%26type%3DFAVICON%26fallback_opts%3DTYPE%2CSIZE%2CURL%26url%3Dhttp%3A%2F%2Fwww.huntington.com%26size%3D128&w=128&q=75',
    },
  },
  {
    name: 'Everwise Credit Union',
    type: 'bank',
    status: 'pending',
    isStaged: false,
    offer_link: 'https://www.everwisecu.com',
    value: 200,
    bonus: {
      description: '$200 bonus',
      requirements: {
        description: 'Contact bank for specific requirements',
      },
    },
    details: {
      monthly_fees: {
        amount: 'None',
      },
      account_type: 'Personal Bank Account',
      availability: {
        type: 'State',
        states: ['IN', 'MI'],
      },
      credit_inquiry: 'Soft Pull',
      household_limit: 'None',
      expiration: 'None Listed',
    },
    logo: {
      url: 'https://bankrewards.io/_next/image?url=https%3A%2F%2Ft3.gstatic.com%2FfaviconV2%3Fclient%3DSOCIAL%26type%3DFAVICON%26fallback_opts%3DTYPE%2CSIZE%2CURL%26url%3Dhttp%3A%2F%2Fwww.everwisecu.com%26size%3D128&w=128&q=75',
    },
  },
  {
    name: 'Premier America Credit Union',
    type: 'bank',
    status: 'pending',
    isStaged: false,
    offer_link: 'https://www.premieramerica.com',
    value: 100,
    bonus: {
      description:
        '$25 bonus and $75 bonus, paid separately. It seems the $75 is for signing up and the $25 is for the direct deposit',
      requirements: {
        description: 'Contact bank for specific requirements',
      },
    },
    details: {
      monthly_fees: {
        amount: 'None',
      },
      account_type: 'Personal Bank Account',
      availability: {
        type: 'State',
        states: ['CA', 'TX'],
      },
      expiration: 'None Listed',
    },
    logo: {
      url: 'https://bankrewards.io/_next/image?url=https%3A%2F%2Ft3.gstatic.com%2FfaviconV2%3Fclient%3DSOCIAL%26type%3DFAVICON%26fallback_opts%3DTYPE%2CSIZE%2CURL%26url%3Dhttp%3A%2F%2Fwww.premieramerica.com%26size%3D128&w=128&q=75',
    },
  },
  {
    name: 'Citi',
    type: 'bank',
    status: 'pending',
    isStaged: false,
    offer_link: 'https://banking.citi.com',
    value: 300,
    bonus: {
      description: '$300 cash',
      requirements: {
        description: 'Contact bank for specific requirements',
      },
    },
    details: {
      monthly_fees: {
        amount: '$5',
      },
      account_type: 'Personal Bank Account',
      availability: {
        type: 'Nationwide',
      },
      credit_inquiry: 'Soft Pull',
      chex_systems: 'yes',
      expiration: '1/7/2025',
    },
    logo: {
      url: 'https://bankrewards.io/_next/image?url=https%3A%2F%2Ft3.gstatic.com%2FfaviconV2%3Fclient%3DSOCIAL%26type%3DFAVICON%26fallback_opts%3DTYPE%2CSIZE%2CURL%26url%3Dhttp%3A%2F%2Fbanking.citi.com%26size%3D128&w=128&q=75',
    },
  },
  {
    name: 'Sunflower Bank',
    type: 'bank',
    status: 'pending',
    isStaged: false,
    offer_link: 'https://www.sunflowerbank.com',
    value: 200,
    bonus: {
      description: '$200 bonus',
      requirements: {
        description: 'Contact bank for specific requirements',
      },
    },
    details: {
      monthly_fees: {
        amount: 'None',
      },
      account_type: 'Personal Bank Account',
      availability: {
        type: 'State',
        states: ['AZ', 'CO', 'KS', 'MO', 'NM', 'TX'],
      },
      credit_inquiry: 'Soft Pull',
      household_limit: 'None',
      early_closure_fee: '$30 if account is closed within 180 days',
      chex_systems: 'Yes',
      expiration: '12/31/2024',
    },
    logo: {
      url: 'https://bankrewards.io/_next/image?url=https%3A%2F%2Ft3.gstatic.com%2FfaviconV2%3Fclient%3DSOCIAL%26type%3DFAVICON%26fallback_opts%3DTYPE%2CSIZE%2CURL%26url%3Dhttp%3A%2F%2Fwww.sunflowerbank.com%26size%3D128&w=128&q=75',
    },
  },
  {
    name: 'Community Choice Credit Union',
    type: 'bank',
    status: 'pending',
    isStaged: false,
    offer_link: 'https://www.comchoicecu.org',
    value: 300,
    bonus: {
      description: '$300 bonus',
      requirements: {
        description: 'Contact bank for specific requirements',
      },
    },
    details: {
      monthly_fees: {
        amount: 'None',
      },
      account_type: 'Personal Bank Account',
      availability: {
        type: 'State',
        states: ['IA'],
      },
      credit_inquiry: 'Hard Pull',
      household_limit: 'Not listed',
      expiration: 'None Listed',
    },
    logo: {
      url: 'https://bankrewards.io/_next/image?url=https%3A%2F%2Ft3.gstatic.com%2FfaviconV2%3Fclient%3DSOCIAL%26type%3DFAVICON%26fallback_opts%3DTYPE%2CSIZE%2CURL%26url%3Dhttp%3A%2F%2Fwww.comchoicecu.org%26size%3D128&w=128&q=75',
    },
  },
  {
    name: 'BHCU',
    type: 'bank',
    status: 'pending',
    isStaged: false,
    offer_link: 'https://bhcu.org',
    value: 150,
    bonus: {
      description: '$150 bonus',
      requirements: {
        description: 'Contact bank for specific requirements',
      },
    },
    details: {
      monthly_fees: {
        amount: 'None',
      },
      account_type: 'Personal Bank Account',
      availability: {
        type: 'State',
        states: ['PA'],
      },
      credit_inquiry: 'unknown',
      household_limit: 'None listed',
      expiration: 'None Listed',
    },
    logo: {
      url: '%2Fblacklogo.png&w=128&q=75',
    },
  },
  {
    name: 'Visions Federal Credit Union',
    type: 'bank',
    status: 'pending',
    isStaged: false,
    offer_link: 'https://www.visionsfcu.org',
    value: 200,
    bonus: {
      description: '$200 cash',
      requirements: {
        description: 'Contact bank for specific requirements',
      },
    },
    details: {
      monthly_fees: {
        amount: 'None',
      },
      account_type: 'Personal Bank Account',
      availability: {
        type: 'State',
        states: ['PA'],
      },
      expiration: '12/30/2024',
    },
    logo: {
      url: 'https://bankrewards.io/_next/image?url=https%3A%2F%2Fplay-lh.googleusercontent.com%2F3hQIeNvrv-l9GWKxTNTB40Kph4bxdNAecL1SXo03vdKU7vJ49_VD4XCrAjS5ywyXHWY&w=128&q=75',
    },
  },
  {
    name: 'US Federal Credit Union',
    type: 'bank',
    status: 'pending',
    isStaged: false,
    offer_link: 'https://www.usfederalcu.org',
    value: 150,
    bonus: {
      description: '$150 bonus',
      requirements: {
        description: 'Contact bank for specific requirements',
      },
    },
    details: {
      monthly_fees: {
        amount: 'None',
      },
      account_type: 'Personal Bank Account',
      availability: {
        type: 'State',
        states: ['IN'],
      },
      expiration: 'None Listed',
    },
    logo: {
      url: 'https://bankrewards.io/_next/image?url=https%3A%2F%2Ft3.gstatic.com%2FfaviconV2%3Fclient%3DSOCIAL%26type%3DFAVICON%26fallback_opts%3DTYPE%2CSIZE%2CURL%26url%3Dhttp%3A%2F%2Fwww.usfederalcu.org%26size%3D128&w=128&q=75',
    },
  },
  {
    name: 'Associated Healthcare Credit Union',
    type: 'bank',
    status: 'pending',
    isStaged: false,
    offer_link: 'https://www.ahcu.org',
    value: 250,
    bonus: {
      description:
        '$250 bonus. Bonus will be paid by the 10th day of the month following requirements being met',
      requirements: {
        description: 'Contact bank for specific requirements',
      },
    },
    details: {
      monthly_fees: {
        amount: 'None',
      },
      account_type: 'Personal Bank Account',
      availability: {
        type: 'State',
        states: ['MN'],
      },
      credit_inquiry: 'Hard Pull',
      household_limit: 'None',
      chex_systems: 'Unknown',
      expiration: 'None Listed',
    },
    logo: {
      url: 'https://bankrewards.io/_next/image?url=https%3A%2F%2Ft3.gstatic.com%2FfaviconV2%3Fclient%3DSOCIAL%26type%3DFAVICON%26fallback_opts%3DTYPE%2CSIZE%2CURL%26url%3Dhttp%3A%2F%2Fwww.ahcu.org%26size%3D128&w=128&q=75',
    },
  },
  {
    name: 'Expedition Credit Union',
    type: 'bank',
    status: 'pending',
    isStaged: false,
    offer_link: 'https://www.expeditioncu.com',
    value: 200,
    bonus: {
      description:
        '$200 cash bonus, deposited within 30 days of completing requirements. Note that this bank conducts a hard pull, so keep that in mind was calculating risk vs reward',
      requirements: {
        description: 'Contact bank for specific requirements',
      },
    },
    details: {
      monthly_fees: {
        amount: 'None',
      },
      account_type: 'Personal Bank Account',
      availability: {
        type: 'State',
        states: ['MN'],
      },
      chex_systems: 'yes',
      expiration: '12/30/2024',
    },
    logo: {
      url: 'https://bankrewards.io/_next/image?url=https%3A%2F%2Fmedia.licdn.com%2Fdms%2Fimage%2FD4D0BAQHPFW7NOZIgig%2Fcompany-logo_200_200%2F0%2F1682612328615%3Fe%3D2147483647%26v%3Dbeta%26t%3DPqXVjSLre97yrpBGMtfubAFFmQXifhM_uUf2BK8appg&w=128&q=75',
    },
  },
  {
    name: 'Columbia Bank',
    type: 'bank',
    status: 'pending',
    isStaged: false,
    offer_link: 'https://www.columbiabankonline.com',
    value: 100,
    bonus: {
      description:
        'Get $100 after making 10 point-of-sale debit card purchases within 60 days of account opening. Stacks with the $300 bonus for direct deposit and the up-to-$400 bonus for maintaining a high balance',
      requirements: {
        description: 'Contact bank for specific requirements',
      },
    },
    details: {
      monthly_fees: {
        amount: 'None',
      },
      account_type: 'Personal Bank Account',
      availability: {
        type: 'State',
        states: ['NJ', 'NY', 'PA'],
      },
      expiration: 'None Listed',
    },
    logo: {
      url: 'https://bankrewards.io/_next/image?url=https%3A%2F%2Ft3.gstatic.com%2FfaviconV2%3Fclient%3DSOCIAL%26type%3DFAVICON%26fallback_opts%3DTYPE%2CSIZE%2CURL%26url%3Dhttp%3A%2F%2Fwww.columbiabankonline.com%26size%3D128&w=128&q=75',
    },
  },
  {
    name: 'Hancock Whitney',
    type: 'bank',
    status: 'pending',
    isStaged: false,
    offer_link: 'https://www.hancockwhitney.com',
    value: 200,
    bonus: {
      description: '200 for freestyle checking account',
      requirements: {
        description: 'Contact bank for specific requirements',
      },
    },
    details: {
      monthly_fees: {
        amount: '$10',
      },
      account_type: 'Personal Bank Account',
      availability: {
        type: 'State',
        states: ['LA', 'MS', 'FL', 'AL', 'TX'],
      },
      early_closure_fee: '$20 fee and bonus forfeit if closed within 6 months',
      expiration: '12/31/2024',
    },
    logo: {
      url: 'https://bankrewards.io/_next/image?url=https%3A%2F%2Fcdn.finanso.com%2Ffiles%2F23%2F03%2Fhancock_whitney_logo-svg--1-.jpg&w=128&q=75',
    },
  },
  {
    name: 'DuPage Credit Union',
    type: 'bank',
    status: 'pending',
    isStaged: false,
    offer_link: 'https://www.dupagecu.com',
    value: 205,
    bonus: {
      description: '$200 Welcome Reward, plus 0.5% cash back',
      requirements: {
        description: 'Contact bank for specific requirements',
      },
    },
    details: {
      monthly_fees: {
        amount: 'None',
      },
      account_type: 'Personal Bank Account',
      availability: {
        type: 'State',
        states: ['IL'],
      },
      expiration: '12/31/2024',
    },
    logo: {
      url: 'https://bankrewards.io/_next/image?url=https%3A%2F%2Ft3.gstatic.com%2FfaviconV2%3Fclient%3DSOCIAL%26type%3DFAVICON%26fallback_opts%3DTYPE%2CSIZE%2CURL%26url%3Dhttp%3A%2F%2Fwww.dupagecu.com%26size%3D128&w=128&q=75',
    },
  },
  {
    name: 'Public Service Credit Union',
    type: 'bank',
    status: 'pending',
    isStaged: false,
    offer_link: 'https://www.mypscu.com',
    value: 100,
    bonus: {
      description: '$100 bonus',
      requirements: {
        description: 'Contact bank for specific requirements',
      },
    },
    details: {
      monthly_fees: {
        amount: 'None',
      },
      account_type: 'Personal Bank Account',
      availability: {
        type: 'State',
        states: ['IN'],
      },
      expiration: 'None Listed',
    },
    logo: {
      url: 'https://bankrewards.io/_next/image?url=https%3A%2F%2Ft3.gstatic.com%2FfaviconV2%3Fclient%3DSOCIAL%26type%3DFAVICON%26fallback_opts%3DTYPE%2CSIZE%2CURL%26url%3Dhttp%3A%2F%2Fwww.mypscu.com%26size%3D128&w=128&q=75',
    },
  },
  {
    name: 'Citizens Equity First Credit Union',
    type: 'bank',
    status: 'pending',
    isStaged: false,
    offer_link: 'https://www.cefcu.com',
    value: 175,
    bonus: {
      description: '$150 Direct Deposit Bonus, $25 debit card spend bonus',
      requirements: {
        description: 'Contact bank for specific requirements',
      },
    },
    details: {
      monthly_fees: {
        amount: 'None',
      },
      account_type: 'Personal Bank Account',
      availability: {
        type: 'State',
        states: ['IL'],
      },
      chex_systems: 'yes',
      expiration: '12/30/2024',
    },
    logo: {
      url: 'https://bankrewards.io/_next/image?url=https%3A%2F%2Fis1-ssl.mzstatic.com%2Fimage%2Fthumb%2FPurple211%2Fv4%2F26%2Fd4%2F01%2F26d40135-c925-e570-8724-cfb15303cf18%2FAppIcon-0-0-1x_U007emarketing-0-10-0-85-220.png%2F1024x1024.jpg&w=128&q=75',
    },
  },
  {
    name: 'Truist Bank',
    type: 'bank',
    status: 'pending',
    isStaged: false,
    offer_link: 'https://www.truist.com',
    value: 400,
    bonus: {
      description: '$400 bonus',
      requirements: {
        description: 'Contact bank for specific requirements',
      },
    },
    details: {
      monthly_fees: {
        amount: '$12',
      },
      account_type: 'Personal Bank Account',
      availability: {
        type: 'State',
        states: [
          'AL',
          'AR',
          'GA',
          'FL',
          'IN',
          'KY',
          'MD',
          'MS',
          'NC',
          'NJ',
          'OH',
          'PA',
          'SC',
          'TN',
          'TX',
          'VA',
          'WV',
          'DC',
        ],
      },
      credit_inquiry: 'Soft Pull',
      household_limit: 'None',
      expiration: '4/30/2025',
    },
    logo: {
      url: 'https://bankrewards.io/_next/image?url=https%3A%2F%2Ft3.gstatic.com%2FfaviconV2%3Fclient%3DSOCIAL%26type%3DFAVICON%26fallback_opts%3DTYPE%2CSIZE%2CURL%26url%3Dhttp%3A%2F%2Fwww.truist.com%26size%3D128&w=128&q=75',
    },
  },
  {
    name: 'Sunmark Credit Union',
    type: 'bank',
    status: 'pending',
    isStaged: false,
    offer_link: 'https://www.sunmark.org',
    value: 250,
    bonus: {
      description: '$250 bonus for opening checking account',
      requirements: {
        description: 'Contact bank for specific requirements',
      },
    },
    details: {
      monthly_fees: {
        amount: 'None',
      },
      account_type: 'Personal Bank Account',
      availability: {
        type: 'State',
        states: ['NY'],
      },
      credit_inquiry: 'Hard Pull',
      household_limit: 'Not listed',
      expiration: 'None Listed',
    },
    logo: {
      url: 'https://bankrewards.io/_next/image?url=https%3A%2F%2Ft3.gstatic.com%2FfaviconV2%3Fclient%3DSOCIAL%26type%3DFAVICON%26fallback_opts%3DTYPE%2CSIZE%2CURL%26url%3Dhttp%3A%2F%2Fwww.sunmark.org%26size%3D128&w=128&q=75',
    },
  },
  {
    name: 'First National Bank',
    type: 'bank',
    status: 'pending',
    isStaged: false,
    offer_link: 'https://www.fnbc.bank',
    value: 100,
    bonus: {
      description: '$100 bonus',
      requirements: {
        description: 'Contact bank for specific requirements',
      },
    },
    details: {
      monthly_fees: {
        amount: 'None',
      },
      account_type: 'Personal Bank Account',
      availability: {
        type: 'State',
        states: ['IA'],
      },
      credit_inquiry: 'unknown',
      household_limit: 'None listed',
      early_closure_fee: 'Not listed',
      chex_systems: 'Unknown',
      expiration: 'None Listed',
    },
    logo: {
      url: 'https://bankrewards.io/_next/image?url=https%3A%2F%2Ft3.gstatic.com%2FfaviconV2%3Fclient%3DSOCIAL%26type%3DFAVICON%26fallback_opts%3DTYPE%2CSIZE%2CURL%26url%3Dhttp%3A%2F%2Fwww.fnbc.bank%26size%3D128&w=128&q=75',
    },
  },
  {
    name: 'Mountain America Credit Union',
    type: 'bank',
    status: 'pending',
    isStaged: false,
    offer_link: 'https://www.macu.com',
    value: 100,
    bonus: {
      description: '$100 bonus',
      requirements: {
        description: 'Contact bank for specific requirements',
      },
    },
    details: {
      monthly_fees: {
        amount: 'None',
      },
      account_type: 'Personal Bank Account',
      availability: {
        type: 'State',
        states: ['UT'],
      },
      expiration: 'None Listed',
    },
    logo: {
      url: 'https://bankrewards.io/_next/image?url=https%3A%2F%2Ft3.gstatic.com%2FfaviconV2%3Fclient%3DSOCIAL%26type%3DFAVICON%26fallback_opts%3DTYPE%2CSIZE%2CURL%26url%3Dhttp%3A%2F%2Fwww.macu.com%26size%3D128&w=128&q=75',
    },
  },
  {
    name: 'FirstMark Credit Union',
    type: 'bank',
    status: 'pending',
    isStaged: false,
    offer_link: 'https://www.firstmarkcu.org',
    value: 300,
    bonus: {
      description:
        '$300 bonus - $50 in the first 30 days and $250 between days 31 and 90',
      requirements: {
        description: 'Contact bank for specific requirements',
      },
    },
    details: {
      monthly_fees: {
        amount: 'None',
      },
      account_type: 'Personal Bank Account',
      availability: {
        type: 'State',
        states: ['TX'],
      },
      credit_inquiry: 'Hard Pull',
      household_limit: 'One per customer',
      early_closure_fee:
        "If you close your account within six months you'll be charged a $10 closing fee",
      expiration: 'None Listed',
    },
    logo: {
      url: 'https://bankrewards.io/_next/image?url=https%3A%2F%2Ft3.gstatic.com%2FfaviconV2%3Fclient%3DSOCIAL%26type%3DFAVICON%26fallback_opts%3DTYPE%2CSIZE%2CURL%26url%3Dhttp%3A%2F%2Fwww.firstmarkcu.org%26size%3D128&w=128&q=75',
    },
  },
  {
    name: 'America First Credit Union',
    type: 'bank',
    status: 'pending',
    isStaged: false,
    offer_link: 'https://www.americafirst.com',
    value: 100,
    bonus: {
      description:
        '$100 bonus for opening a savings account and adding Classic or Premium Checking',
      requirements: {
        description: 'Contact bank for specific requirements',
      },
    },
    details: {
      monthly_fees: {
        amount: 'None',
      },
      account_type: 'Personal Bank Account',
      availability: {
        type: 'State',
        states: ['AZ', 'NM', 'NV'],
      },
      credit_inquiry: 'Hard Pull',
      household_limit: 'None listed',
      expiration: 'None Listed',
    },
    logo: {
      url: 'https://www.americafirst.com/content/experience-fragments/afcu/us/en/site/footer/master/_jcr_content/root/container/animation_container/col-3-3-3-3-1/image.coreimg.svg/1711043526833/afcu-logo-footer.svg',
    },
  },
  {
    name: 'Hercules First Federal Credit Union',
    type: 'bank',
    status: 'pending',
    isStaged: false,
    offer_link: 'https://herculescu.com',
    value: 150,
    bonus: {
      description: '$150 bonus after direct deposit is received',
      requirements: {
        description: 'Contact bank for specific requirements',
      },
    },
    details: {
      monthly_fees: {
        amount: 'None',
      },
      account_type: 'Personal Bank Account',
      availability: {
        type: 'State',
        states: ['UT'],
      },
      credit_inquiry: 'Soft Pull',
      early_closure_fee: '$5 Account Closure Fee for accounts closed within 90 days',
      expiration: 'None Listed',
    },
    logo: {
      url: 'https://bankrewards.io/_next/image?url=https%3A%2F%2Ft3.gstatic.com%2FfaviconV2%3Fclient%3DSOCIAL%26type%3DFAVICON%26fallback_opts%3DTYPE%2CSIZE%2CURL%26url%3Dhttp%3A%2F%2Fherculescu.com%26size%3D128&w=128&q=75',
    },
  },
  {
    name: 'Legacy Bank',
    type: 'bank',
    status: 'pending',
    isStaged: false,
    offer_link: 'https://legacy.bank',
    value: 150,
    bonus: {
      description: '$250 cash bonus',
      requirements: {
        description: 'Contact bank for specific requirements',
      },
    },
    details: {
      monthly_fees: {
        amount: 'None',
      },
      account_type: 'Personal Bank Account',
      availability: {
        type: 'State',
        states: ['KS'],
      },
      expiration: 'None Listed',
    },
    logo: {
      url: 'https://bankrewards.io/_next/image?url=https%3A%2F%2Fencrypted-tbn0.gstatic.com%2Fimages%3Fq%3Dtbn%3AANd9GcRK5DBHvFYDNba4eMwufiwh4OIIN29A8UtcOw%26s&w=128&q=75',
    },
  },
];

export function getRandomOffer(type: OfferType): Opportunity {
  const filteredOffers = mockOffers.filter((offer) => offer.type === type);
  if (filteredOffers.length === 0) {
    throw new Error(`No mock offers found for type: ${type}`);
  }
  return { ...filteredOffers[Math.floor(Math.random() * filteredOffers.length)] };
}
