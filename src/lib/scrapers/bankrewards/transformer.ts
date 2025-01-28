import * as cheerio from 'cheerio';

import { BankRewardsOffer } from '@/types/scraper';
import {
  TransformedOffer,
  BonusTier,
  Details,
  Logo,
  Metadata,
  Bonus,
} from '@/types/transformed';

export interface EnhancedTransformedOffer extends TransformedOffer {
  value: number;
}

export class BankRewardsTransformer {
  private $: cheerio.CheerioAPI = cheerio.load('');
  private type: 'bank' | 'credit_card' | 'brokerage' = 'bank';

  private initCheerio(html: string) {
    this.$ = cheerio.load(html);
  }

  private extractTableTiers(): BonusTier[] {
    const tiers: BonusTier[] = [];

    // Find tables that might contain tier information
    const tables = this.$('table');

    tables.each((_, table) => {
      const $table = this.$(table);
      const rows = $table.find('tr');

      // Skip tables without enough rows or that don't look like tier tables
      if (rows.length < 2) return;

      // Check if this looks like a tier table by examining headers
      const headers = this.$(rows[0])
        .find('th, td')
        .map((_, cell) => this.cleanText(this.$(cell).text()).toLowerCase())
        .get();

      const isRewardTable = headers.some(
        (h) =>
          h.includes('reward') ||
          h.includes('bonus') ||
          h.includes('stock') ||
          h.includes('share')
      );
      const isDepositTable = headers.some(
        (h) => h.includes('deposit') || h.includes('spend') || h.includes('requirement')
      );

      if (!isRewardTable || !isDepositTable) return;

      // Extract tiers from valid table
      rows.slice(1).each((_, row) => {
        const cells = this.$(row).find('td');
        if (cells.length >= 2) {
          const reward = this.cleanText(cells.eq(0).text());
          const deposit = this.cleanText(cells.eq(1).text());

          if (reward && deposit) {
            const normalizedDeposit = deposit.startsWith('$')
              ? deposit
              : `$${this.normalizeAmount(deposit)}`;

            tiers.push({
              reward: reward.startsWith('$')
                ? `$${this.normalizeAmount(reward.slice(1))}`
                : reward,
              deposit: normalizedDeposit,
            });
          }
        }
      });
    });

    return tiers;
  }

  private extractTextTiers(text: string): BonusTier[] {
    const tiers: BonusTier[] = [];
    const patterns = [
      // Share/Stock rewards with deposit tiers
      {
        pattern:
          /(?:get|earn|receive)?\s*(\d+)\s*(?:free\s+)?(?:shares?|stocks?)\s*(?:for|with|when)?\s*\$?(\d+(?:,\d+)?(?:\.\d{2})?k?)/gi,
        handler: (match: RegExpMatchArray) => ({
          reward: `${match[1]} shares`,
          deposit: `$${this.normalizeAmount(match[2])}`,
        }),
      },
      // Direct deposit tiers
      {
        pattern:
          /\$?(\d+(?:,\d+)?(?:\.\d{2})?k?)\s*(?:bonus)?\s*(?:for|with|when|after)\s*\$?(\d+(?:,\d+)?(?:\.\d{2})?k?)\s*(?:in\s+)?(?:direct\s+deposits?|dd)/gi,
        handler: (match: RegExpMatchArray) => ({
          reward: `$${this.normalizeAmount(match[1])}`,
          deposit: `$${this.normalizeAmount(match[2])}`,
        }),
      },
      // Spending tiers
      {
        pattern:
          /\$?(\d+(?:,\d+)?(?:\.\d{2})?k?)\s*(?:bonus|cash\s+back)?\s*(?:after|for|when)\s*(?:you\s+)?spend(?:ing)?\s*\$?(\d+(?:,\d+)?(?:\.\d{2})?k?)/gi,
        handler: (match: RegExpMatchArray) => ({
          reward: `$${this.normalizeAmount(match[1])}`,
          deposit: `$${this.normalizeAmount(match[2])}`,
        }),
      },
      // Colon-separated format
      {
        pattern:
          /\$?(\d+(?:,\d+)?(?:\.\d{2})?k?)\s*:\s*\$?(\d+(?:,\d+)?(?:\.\d{2})?k?)/gi,
        handler: (match: RegExpMatchArray) => ({
          reward: `$${this.normalizeAmount(match[1])}`,
          deposit: `$${this.normalizeAmount(match[2])}`,
        }),
      },
    ];

    // First try to find a list of tiers
    const lists = this.$('ul, ol').filter((_, el) => {
      const text = this.$(el).text().toLowerCase();
      return text.includes('bonus') || text.includes('reward') || text.includes('tier');
    });

    lists.each((_, list) => {
      this.$(list)
        .find('li')
        .each((_, item) => {
          const itemText = this.cleanText(this.$(item).text());
          for (const { pattern, handler } of patterns) {
            const match = itemText.match(pattern);
            if (match && match[1] && match[2]) {
              tiers.push(handler(match));
              break;
            }
          }
        });
    });

    // If no tiers found in lists, try text patterns
    if (tiers.length === 0) {
      for (const { pattern, handler } of patterns) {
        const matches = Array.from(text.matchAll(pattern));
        for (const match of matches) {
          if (match[1] && match[2]) {
            tiers.push(handler(match));
          }
        }
      }
    }

    return tiers;
  }

  private extractBonusDescription(): string {
    // Try to find the description text after "Bonus Details:"
    const bonusSection = this.$('p:contains("Bonus Details:")').next();
    if (bonusSection.length) {
      const description = this.cleanText(bonusSection.text());
      if (description) return description;
    }

    // Look for text patterns in the entire content
    const text = this.$('div').text();

    // Look for specific bonus patterns
    const patterns = [
      // Points bonus with spending requirement
      /(?:Get|Earn|Receive)\s+(?:up\s+to\s+)?(\d+(?:,\d+)?(?:\.\d{2})?k?)\s+(?:bonus\s+)?points?\s+(?:after|when)\s+(?:spending|you\s+spend)\s+\$?(\d+(?:,\d+)?(?:\.\d{2})?k?)\s+(?:within|in)\s+(\d+)\s+(?:days?|months?)/gi,
      // Cash bonus with amount
      /(?:Get|Earn|Receive)\s+(?:up\s+to\s+)?\$?(\d+(?:,\d+)?(?:\.\d{2})?k?)\s+(?:cash\s+)?bonus/gi,
      // Free stock/shares
      /(?:Get|Earn|Receive)\s+(\d+)\s+(?:free\s+)?(?:stocks?|shares?)/gi,
      // Statement credit
      /\$?(\d+(?:,\d+)?(?:\.\d{2})?k?)\s+statement\s+credit/gi,
      // Cash back bonus
      /\$?(\d+(?:,\d+)?(?:\.\d{2})?k?)\s+cash\s+back\s+bonus/gi,
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        if (pattern.source.includes('points')) {
          return `Earn ${this.normalizeAmount(match[1])} bonus points after spending $${this.normalizeAmount(match[2])} in ${match[3]} days`;
        }
        const amount = this.normalizeAmount(match[1]);
        if (pattern.source.includes('stock')) {
          return `Get ${amount} free stocks`;
        }
        return `$${amount} bonus`;
      }
    }

    return '';
  }

  private extractBonusRequirements(): string {
    // First try to find the requirements section
    const requirementsSection = this.$(
      'p:contains("Bonus Requirements:"), p:contains("Requirements:")'
    );
    if (requirementsSection.length) {
      // Get all text nodes after the requirements label
      const reqContent = requirementsSection.nextAll().slice(0, 3);
      const requirements = reqContent
        .map((_, el) => {
          const text = this.$(el).text().trim();
          // Only include text that looks like spending requirements
          if (
            text.toLowerCase().includes('spend') ||
            text.toLowerCase().includes('purchase') ||
            text.toLowerCase().includes('deposit')
          ) {
            return text;
          }
          return null;
        })
        .get()
        .filter(Boolean)[0]; // Take the first valid requirement

      if (requirements) {
        // Extract amount and timeframe using simpler patterns
        const amount = requirements.match(/\$?([\d,]+)/)?.[1];
        const months = requirements.match(/(\d+)\s*months?/)?.[1];
        const days = requirements.match(/(\d+)\s*days?/)?.[1];

        if (amount && (months || days)) {
          const timeframe = months
            ? `${months} ${months === '1' ? 'month' : 'months'}`
            : `${days} days`;
          return `Spend $${this.normalizeAmount(amount)} in ${timeframe}`;
        }

        // If we can't parse it cleanly, at least clean up any duplicates
        return this.cleanText(requirements)
          .replace(
            /(?:spend\s+\$[\d,]+\s+in\s+(?:\d+\s+(?:months?|days?))\s*)+/gi,
            (match) => match.split(/\s+in\s+/)[0] + ' in ' + match.split(/\s+in\s+/)[1]
          )
          .replace(/\s+months?\s+months?/, ' months');
      }
    }

    // If we can't find a dedicated requirements section, look in the bonus description
    const bonusDesc = this.extractBonusDescription();
    const spendMatch = bonusDesc.match(
      /(?:spending|spend)\s+\$?([\d,]+)(?:\s+(?:within|in)\s+(\d+)\s+(days?|months?))?/i
    );
    if (spendMatch) {
      const [, amount, period, unit] = spendMatch;
      if (period) {
        return `Spend $${this.normalizeAmount(amount)} in ${period} ${unit}`;
      }
      return `Spend $${this.normalizeAmount(amount)}`;
    }

    // Fallback to looking in the general content with simpler patterns
    const text = this.$('div').text();
    const generalSpendMatch = text.match(
      /spend\s+\$?([\d,]+)(?:\s+(?:within|in)\s+(\d+)\s+(days?|months?))/i
    );
    if (generalSpendMatch) {
      const [, amount, period, unit] = generalSpendMatch;
      return `Spend $${this.normalizeAmount(amount)} in ${period} ${unit}`;
    }

    return 'Contact bank for specific requirements';
  }

  private extractAdditionalInfo(): string | undefined {
    // Look for additional info after the table
    const table = this.$('table');
    if (table.length) {
      const nextP = table.next('p');
      if (nextP.length) {
        const text = this.cleanText(nextP.text());
        if (text && !text.toLowerCase().includes('bonus requirement')) {
          return text;
        }
      }
    }

    // Look for additional terms or conditions
    const terms = this.$(
      'p:contains("Terms:"), p:contains("Additional Terms:"), p:contains("Conditions:")'
    ).next();
    if (terms.length) {
      const text = this.cleanText(terms.text());
      if (text) {
        return text;
      }
    }

    // Look for any other important information
    const additionalInfo = this.$(
      'p:contains("Additional Information:"), p:contains("Note:")'
    ).next();
    if (additionalInfo.length) {
      const text = this.cleanText(additionalInfo.text());
      if (text) {
        return text;
      }
    }

    return undefined;
  }

  private extractRewards(): { card_perks?: string; cash_back?: string } | undefined {
    const rewards: { card_perks?: string; cash_back?: string } = {};

    // Extract card perks
    const perksSection = this.$('p:contains("Card Perks:")').next();
    if (perksSection.length) {
      const perks = this.cleanText(perksSection.text());
      if (perks) {
        rewards.card_perks = perks;
      }
    } else {
      // Try to find perks in general content
      const text = this.$('div').text();
      const perksPatterns = [
        /(?:benefits?|perks?|features?):\s*([^.]+)/gi,
        /card\s+benefits?\s+include:\s*([^.]+)/gi,
        /enjoy\s+these\s+benefits?:\s*([^.]+)/gi,
        /complimentary\s+(?:access|membership)\s+to\s+([^.]+)/gi,
        /(?:receive|get|earn)\s+([^.]+(?:status|membership)[^.]+)/gi,
        /(\d+(?:,\d+)?)\s+(?:bonus\s+)?points?\s+(?:each|per|every)\s+(?:card\s+)?anniversary/gi,
        /(\d+)%\s+(?:discount|savings?|off)\s+(?:when|on)\s+([^.]+)/gi,
      ];

      const allPerks: string[] = [];
      for (const pattern of perksPatterns) {
        const matches = Array.from(text.matchAll(pattern));
        for (const match of matches) {
          if (match[1]) {
            const perk = match[2]
              ? `${match[1]}% discount on ${match[2].trim()}`
              : this.cleanText(match[1]);
            allPerks.push(perk);
          }
        }
      }

      if (allPerks.length > 0) {
        rewards.card_perks = [...new Set(allPerks)].join('. ');
      }
    }

    // Extract points/cash back rates
    const cashBackSection = this.$(
      'p:contains("Card Cash Back:"), p:contains("Card Rewards:")'
    ).next();
    if (cashBackSection.length) {
      const cashBack = this.cleanText(cashBackSection.text());
      if (cashBack) {
        rewards.cash_back = cashBack.replace(/%%/g, '%');
      }
    } else {
      // Try to find rewards rates in general content
      const text = this.$('div').text();
      const patterns = [
        // Points multiplier with category
        /(\d+)x?\s+(?:points?|rewards?)\s+(?:on|at|for|in)\s+([^.]+)/gi,
        // Cash back percentage with category
        /(\d+(?:\.\d+)?)%\s+(?:cash\s+back|rewards?)\s+(?:on|at|for|in)\s+([^.]+)/gi,
        // Flat rate points/cash back
        /(\d+(?:\.\d+)?(?:x|%))\s+(?:points?|cash\s+back|rewards?)\s+on\s+(?:all|every|other)\s+(?:purchases?|spending)/gi,
        // Statement credits
        /\$(\d+)\s+(?:annual|monthly)?\s+statement\s+credit\s+for\s+([^.]+)/gi,
      ];

      const allRewards: string[] = [];
      for (const pattern of patterns) {
        const matches = Array.from(text.matchAll(pattern));
        for (const match of matches) {
          if (match[2]) {
            if (pattern.source.includes('statement')) {
              allRewards.push(`$${match[1]} statement credit for ${match[2].trim()}`);
            } else {
              const multiplier = pattern.source.includes('points?|rewards?') ? 'x' : '%';
              allRewards.push(`${match[1]}${multiplier} on ${match[2].trim()}`);
            }
          }
        }
      }

      if (allRewards.length > 0) {
        rewards.cash_back = [...new Set(allRewards)].join('. ');
      }
    }

    return Object.keys(rewards).length > 0 ? rewards : undefined;
  }

  private extractCardDetails(details: Details): void {
    // Extract annual fees
    const annualFeesText = this.$('p:contains("Annual Fees:")').text();
    if (annualFeesText) {
      const amount = this.cleanText(annualFeesText.split(':')[1]);
      details.annual_fees = amount.toLowerCase() === 'none' || amount === '0' || amount === '$0'
        ? 'None'
        : amount.match(/\$?(\d+(?:\.\d{2})?)/)?.[0] || amount;
    }

    // Extract foreign transaction fees
    const foreignFeesText = this.$('p:contains("Foreign Transaction Fees:")').text();
    if (foreignFeesText) {
      details.foreign_transaction_fees = this.cleanText(foreignFeesText.split(':')[1]);
    }

    // Extract 5/24 status for credit cards
    const under524Text = this.$('p:contains("Under 5/24:")').text();
    if (under524Text) {
      details.under_5_24 = this.cleanText(under524Text.split(':')[1]);
    } else {
      // Try to find 5/24 info in general text
      const text = this.$('div').text().toLowerCase();
      if (text.includes('5/24') || text.includes('five cards in 24 months')) {
        details.under_5_24 = text.includes('not be approved') ? 'Yes' : 'No';
      }
    }
  }

  private extractDetails(): Details {
    const details: Details = {};

    // Extract monthly fees with proper formatting
    const monthlyFeesText = this.$('p:contains("Monthly Fees:")').text();
    if (monthlyFeesText) {
      const amount = this.cleanText(monthlyFeesText.split(':')[1]);
      details.monthly_fees = {
        amount:
          amount.toLowerCase() === 'none' || amount === '0' || amount === '$0'
            ? 'None'
            : amount.match(/\$?(\d+(?:\.\d{2})?)/)?.[0] || amount,
        waiver_details:
          this.cleanText(
            this.$('p:contains("Monthly Fee Waiver:")').text().split(':')[1]
          ) || undefined,
      };
    }

    // Extract account type
    const accountTypeText = this.$('p:contains("Account Type:")').text();
    if (accountTypeText) {
      details.account_type = this.cleanText(accountTypeText.split(':')[1]);
    }

    // Extract availability
    const availabilityText = this.$('p:contains("Availability:")').text();
    if (availabilityText) {
      const text = this.cleanText(availabilityText);
      const isNationwide = text.toLowerCase().includes('nationwide');
      const states = Array.from(text.matchAll(/\b([A-Z]{2})\b/g))
        .map((m) => m[1])
        .filter((state) => !['AM', 'PM', 'US', 'ID'].includes(state));

      details.availability = {
        type: isNationwide ? 'Nationwide' : states.length > 0 ? 'State' : undefined,
        states: states.length > 0 ? states : undefined,
        details: undefined, // Removed redundant details
      };
    }

    // Extract credit inquiry with consistent casing
    const creditInquiryText = this.$('p:contains("Credit Inquiry:")').text();
    if (creditInquiryText) {
      const inquiry = this.cleanText(creditInquiryText.split(':')[1]).toLowerCase();
      if (inquiry.includes('hard')) {
        details.credit_inquiry = 'Hard Pull';
      } else if (inquiry.includes('soft')) {
        details.credit_inquiry = 'Soft Pull';
      } else {
        details.credit_inquiry = inquiry;
      }
    }

    // Extract household limit
    const householdLimitText = this.$('p:contains("Household Limit:")').text();
    if (householdLimitText) {
      details.household_limit = this.cleanText(householdLimitText.split(':')[1]);
    }

    // Extract early closure fee
    const earlyClosureFeeText = this.$('p:contains("Early Account Closure Fee:")').text();
    if (earlyClosureFeeText) {
      details.early_closure_fee = this.cleanText(earlyClosureFeeText.split(':')[1]);
    }

    // Extract ChexSystems
    const chexSystemsText = this.$('p:contains("ChexSystems:")').text();
    if (chexSystemsText) {
      details.chex_systems = this.cleanText(chexSystemsText.split(':')[1]);
    }

    // Extract expiration
    const expirationText = this.$('p:contains("Expiration:")').text();
    if (expirationText) {
      details.expiration = this.cleanText(expirationText.split(':')[1]) || 'None Listed';
    }

    // Extract brokerage-specific details
    if (this.type === 'brokerage') {
      // Extract options trading
      const optionsTradingText = this.$('p:contains("Options Trading:")').text();
      if (optionsTradingText) {
        details.options_trading = this.cleanText(optionsTradingText.split(':')[1]);
      }

      // Extract IRA accounts
      const iraAccountsText = this.$('p:contains("IRA Accounts:")').text();
      if (iraAccountsText) {
        details.ira_accounts = this.cleanText(iraAccountsText.split(':')[1]);
      }
    }

    // Extract credit card specific details if this is a credit card
    if (this.type === 'credit_card') {
      this.extractCardDetails(details);
    }

    return details;
  }

  private extractDisclosure(): string | undefined {
    const disclosureText = this.$('p:contains("Disclosure:")').text();
    if (disclosureText) {
      const text = this.cleanText(disclosureText.split(':')[1]);
      return text || undefined;
    }
    return undefined;
  }

  private getCardImage():
    | { url: string; network: string; color: string; badge?: string }
    | undefined {
    if (this.type !== 'credit_card') return undefined;

    // Find card image in the main content area
    const cardImg = this.$('div[style*="text-align:center"] img').first();
    if (!cardImg.length) return undefined;

    const src = cardImg.attr('src');
    if (!src) return undefined;

    // Get the highest resolution image from srcset if available
    const srcset = cardImg.attr('srcset');
    let url = src;
    if (srcset) {
      const srcsetParts = srcset.split(',');
      const lastSrcset = srcsetParts[srcsetParts.length - 1].trim().split(' ')[0];
      url = lastSrcset;
    }

    // Ensure URL is absolute
    url = url.startsWith('/_next') ? `https://bankrewards.io${url}` : url;

    // Try to determine card network from text content and image
    const text = this.$('div').text().toLowerCase();
    const imgAlt = cardImg.attr('alt')?.toLowerCase() || '';
    let network = 'Unknown';
    if (
      text.includes('visa') ||
      imgAlt.includes('visa') ||
      this.$('img[alt*="visa" i]').length
    ) {
      network = 'VISA';
    } else if (text.includes('mastercard') || imgAlt.includes('mastercard')) {
      network = 'MASTERCARD';
    } else if (text.includes('amex') || text.includes('american express')) {
      network = 'AMEX';
    } else if (text.includes('discover')) {
      network = 'DISCOVER';
    }

    // Try to find color description from specific field or image name
    const colorText = this.$(
      'p:contains("Card Color:"), p:contains("Card Design:")'
    ).text();
    let color = 'Unknown';
    if (colorText) {
      color = this.cleanText(colorText.split(':')[1]);
    } else if (url.toLowerCase().includes('metal')) {
      color = 'Metal';
    } else if (imgAlt.includes('blue')) {
      color = 'Blue';
    }

    // Try to find badge text from specific field or image alt text
    let badge: string | undefined;
    const badgeText = this.$('p:contains("Card Badge:")').text();
    if (badgeText) {
      badge = this.cleanText(badgeText.split(':')[1]);
    } else {
      // Try to extract badge from text content
      const noAnnualFeeMatch = text.match(/no annual fee/i);
      if (noAnnualFeeMatch) {
        badge = 'NO ANNUAL FEE';
      }
    }

    return {
      url,
      network,
      color,
      ...(badge && { badge }),
    };
  }

  private standardizeValue(text: string): number {
    // Helper function to estimate stock value based on historical data
    const estimateStockValue = (numStocks: number, company?: string): number => {
      // Historical average values for common stock rewards
      const stockValues: { [key: string]: number } = {
        moomoo: 15, // Futu Holdings stock ~$15
        webull: 10, // Common stock rewards ~$10
        robinhood: 12, // Common stock rewards ~$12
        sofi: 8, // SoFi stock ~$8
        public: 10, // Common stock rewards ~$10
        tastyworks: 12, // Common stock rewards ~$12
        firstrade: 10, // Common stock rewards ~$10
        default: 12, // Default estimate for unknown brokers
      };

      // Try to find company-specific value
      const companyValue = company
        ? Object.entries(stockValues).find(([key]) =>
            company.toLowerCase().includes(key)
          )?.[1] || stockValues.default
        : stockValues.default;

      return Math.round(numStocks * companyValue * 100) / 100;
    };

    // Helper function to convert points to dollars based on program
    const pointsToDollars = (points: number, text: string): number => {
      // First check for explicit point value hints in the text
      const pointValueMatch = text.match(
        /(?:estimated|worth|valued at|rate of roughly|redeemed.*?at|value of)\s+(?:\$|)?(\d+(?:\.\d+)?)\s*(?:cents?|¢)\s+(?:per|each|\/)\s+point/i
      );
      if (pointValueMatch) {
        const centsPerPoint = parseFloat(pointValueMatch[1]) / 100;
        return Math.round(points * centsPerPoint * 100) / 100;
      }

      // Check for program-specific rates based on historical values
      const conversionRates: { [key: string]: number } = {
        'United Mileage Plus': 0.013, // United points worth ~1.3 cents each
        'United Miles': 0.013, // United points worth ~1.3 cents each
        'Southwest Rapid Rewards': 0.014, // Southwest points worth ~1.4 cents each
        'Chase Ultimate Rewards': 0.0175, // Chase UR points worth ~1.75 cents each (avg between CSP/CSR)
        'American Express Membership Rewards': 0.017, // Amex MR points worth ~1.7 cents each with transfers
        'Capital One': 0.015, // Capital One miles worth ~1.5 cents each
        'Marriott Bonvoy': 0.007, // Marriott points worth ~0.7 cents each
        'Hilton Honors': 0.005, // Hilton points worth ~0.5 cents each
        'Delta Skymiles': 0.011, // Delta points worth ~1.1 cents each
        AAdvantage: 0.014, // American Airlines miles worth ~1.4 cents each
        Avios: 0.014, // Avios points worth ~1.4 cents each
        ThankYou: 0.016, // Citi ThankYou points worth ~1.6 cents each with transfers
        Aeroplan: 0.015, // Aeroplan points worth ~1.5 cents each
        'Alaska Mileage Plan': 0.016, // Alaska miles worth ~1.6 cents each
        'JetBlue TrueBlue': 0.013, // JetBlue points worth ~1.3 cents each
        'IHG Rewards': 0.005, // IHG points worth ~0.5 cents each
        'World of Hyatt': 0.017, // Hyatt points worth ~1.7 cents each
        'Wyndham Rewards': 0.009, // Wyndham points worth ~0.9 cents each
        'Choice Privileges': 0.006, // Choice points worth ~0.6 cents each
        'Hotel Rewards': 0.007, // Generic hotel points worth ~0.7 cents each
        'Airline Miles': 0.013, // Generic airline miles worth ~1.3 cents each
        'Bank Points': 0.01, // Generic bank points worth ~1 cent each
        default: 0.012, // Default 1.2 cents per point for unknown programs
      };

      // Find the matching rate or use default
      const rate =
        Object.entries(conversionRates).find(([key]) =>
          text.toLowerCase().includes(key.toLowerCase())
        )?.[1] || conversionRates.default;

      return Math.round(points * rate * 100) / 100;
    };

    // Check for stock rewards first for brokerage offers
    const stockPatterns = [
      /(?:get|earn|receive)\s+(?:up\s+to\s+)?(\d+)\s+(?:free\s+)?(?:stocks?|shares?)/i,
      /(\d+)\s+(?:free\s+)?(?:stocks?|shares?)\s+(?:worth|valued at)/i,
      /(?:stocks?|shares?)\s+valued\s+(?:up\s+to|at)\s+\$(\d+)/i,
      /free\s+(?:stocks?|shares?)\s+valued\s+between\s+\$(\d+)\s+(?:to|-|and)\s+\$(\d+)/i,
    ];

    for (const pattern of stockPatterns) {
      const match = text.match(pattern);
      if (match) {
        if (pattern.source.includes('valued')) {
          // If explicit value given, use that
          return parseFloat(this.normalizeAmount(match[1]));
        } else {
          // Otherwise estimate based on number of stocks
          const numStocks = parseInt(match[1]);
          return estimateStockValue(numStocks, text);
        }
      }
    }

    // Check for points/miles patterns
    const pointsPatterns = [
      /(?:earn|get|receive)\s+(?:up\s+to\s+)?(\d+(?:,\d+)?k?)\s*(?:points?|miles?|Membership\s+Rewards|Ultimate\s+Rewards|Mileage\s+Plus|Rapid\s+Rewards|Bonvoy|Avios|AAdvantage|ThankYou|Aeroplan)/i,
      /(\d+(?:,\d+)?k?)\s*(?:points?|miles?|Membership\s+Rewards|Ultimate\s+Rewards|Mileage\s+Plus|Rapid\s+Rewards|Bonvoy|Avios|AAdvantage|ThankYou|Aeroplan)/i,
      /(?:points?|miles?|rewards?)\s+bonus\s+of\s+(\d+(?:,\d+)?k?)/i,
      /bonus\s+(?:of\s+)?(\d+(?:,\d+)?k?)\s*(?:points?|miles?)/i,
      /earn\s+(\d+(?:,\d+)?k?)\s*(?:points?|miles?)/i,
      /get\s+(\d+(?:,\d+)?k?)\s*(?:points?|miles?)/i,
      /(\d+(?:,\d+)?k?)\s*bonus\s*(?:points?|miles?)/i,
      /bonus\s+of\s+(?:\$\d+\s*\+\s*)?(\d+(?:,\d+)?k?)\s*Points?/i,
      /\+\s*(\d+(?:,\d+)?k?)\s*Points?/i,
      /\+\s*(\d+(?:,\d+)?k?)\s*points?/i,
      /(\d+(?:,\d+)?k?)\s*(?:points?|miles?)\s+bonus/i,
    ];

    for (const pattern of pointsPatterns) {
      const match = text.match(pattern);
      if (match) {
        const points = parseFloat(this.normalizeAmount(match[1]));
        return pointsToDollars(points, text);
      }
    }

    // Helper function to extract the highest number from a range
    const getHighestFromRange = (text: string): number => {
      const patterns = [
        /(?:between\s+)?\$?(\d+(?:,\d+)?(?:\.\d{2})?k?)\s*(?:to|-|and)\s*\$?(\d+(?:,\d+)?(?:\.\d{2})?k?)/i,
        /up\s+to\s+\$?(\d+(?:,\d+)?(?:\.\d{2})?k?)/i,
        /as\s+much\s+as\s+\$?(\d+(?:,\d+)?(?:\.\d{2})?k?)/i,
        /earn\s+up\s+to\s+\$?(\d+(?:,\d+)?(?:\.\d{2})?k?)/i,
        /best\s+tier\s+being\s+\$?(\d+(?:,\d+)?(?:\.\d{2})?k?)/i,
        /totally\s+\$?(\d+(?:,\d+)?(?:\.\d{2})?k?)/i,
        /tiered\s+bonus\s+of\s+(?:\$?\d+(?:,\d+)?(?:\.\d{2})?k?\/)*\$?(\d+(?:,\d+)?(?:\.\d{2})?k?)/i,
        /highest\s+tier\s+being\s+\$?(\d+(?:,\d+)?(?:\.\d{2})?k?)/i,
        /maximum\s+of\s+\$?(\d+(?:,\d+)?(?:\.\d{2})?k?)/i,
      ];

      for (const pattern of patterns) {
        const match = text.match(pattern);
        if (match) {
          if (match.length === 3) {
            return Math.max(
              parseFloat(this.normalizeAmount(match[1])),
              parseFloat(this.normalizeAmount(match[2]))
            );
          }
          return parseFloat(this.normalizeAmount(match[1]));
        }
      }
      return 0;
    };

    // Check for explicit dollar amounts with more patterns
    const dollarPatterns = [
      /\$(\d+(?:,\d+)?(?:\.\d{2})?k?)\s*(?:bonus|cash\s+back|reward|statement\s*credits?)/i,
      /\$(\d+(?:,\d+)?(?:\.\d{2})?k?)\s*(?:gift\s*card|gc)\b/i,
      /earn\s+\$(\d+(?:,\d+)?(?:\.\d{2})?k?)/i,
      /get\s+\$(\d+(?:,\d+)?(?:\.\d{2})?k?)/i,
      /receive\s+\$(\d+(?:,\d+)?(?:\.\d{2})?k?)/i,
      /worth\s+\$(\d+(?:,\d+)?(?:\.\d{2})?k?)/i,
      /valued\s+at\s+\$(\d+(?:,\d+)?(?:\.\d{2})?k?)/i,
      /(\d+(?:,\d+)?(?:\.\d{2})?k?)\s*dollars?\b/i,
      /cash\s+bonus\s+of\s+\$(\d+(?:,\d+)?(?:\.\d{2})?k?)/i,
      /\$(\d+(?:,\d+)?(?:\.\d{2})?k?)\s+cash/i,
      /bonus:\s*\$(\d+(?:,\d+)?(?:\.\d{2})?k?)/i,
      /tier\s+being\s+\$(\d+(?:,\d+)?(?:\.\d{2})?k?)/i,
      /bonus\s+of\s+\$(\d+(?:,\d+)?(?:\.\d{2})?k?)/i,
      /\$(\d+(?:,\d+)?(?:\.\d{2})?k?)\s+for\s+(?:checking|savings)/i,
      /\$(\d+(?:,\d+)?(?:\.\d{2})?k?)\s+(?:welcome|sign[\s-]up)\s+(?:bonus|reward)/i,
      /\$(\d+(?:,\d+)?(?:\.\d{2})?k?)\s+in\s+(?:bonus|rewards?)/i,
      /\$(\d+(?:,\d+)?(?:\.\d{2})?k?)\s+after\s+/i,
      /\$(\d+(?:,\d+)?(?:\.\d{2})?k?)\s+when\s+/i,
    ];

    for (const pattern of dollarPatterns) {
      const match = text.match(pattern);
      if (match) {
        return parseFloat(this.normalizeAmount(match[1]));
      }
    }

    // Check for ranges and use the higher value
    const rangeValue = getHighestFromRange(text);
    if (rangeValue > 0) {
      return rangeValue;
    }

    // Check for percentage cashback with spending caps
    const cashbackPatterns = [
      /(\d+(?:\.\d+)?%?)(?:\s*cash\s*back|\s*rewards?)\s+.*?up\s+to\s+\$(\d+(?:,\d+)?(?:\.\d{2})?k?)/i,
      /(\d+(?:\.\d+)?%?)\s+back\s+.*?up\s+to\s+\$(\d+(?:,\d+)?(?:\.\d{2})?k?)/i,
      /earn\s+(\d+(?:\.\d+)?%?)\s+back\s+.*?up\s+to\s+\$(\d+(?:,\d+)?(?:\.\d{2})?k?)/i,
      /(\d+(?:\.\d+)?%?)\s+cash\s+back\s+on\s+.*?up\s+to\s+\$(\d+(?:,\d+)?(?:\.\d{2})?k?)/i,
    ];

    for (const pattern of cashbackPatterns) {
      const match = text.match(pattern);
      if (match) {
        return parseFloat(this.normalizeAmount(match[2]));
      }
    }

    // Check for hotel nights with value
    const nightsMatch = text.match(/(\d+)\s+(?:free\s+)?(?:hotel\s+)?nights?/i);
    if (nightsMatch) {
      const nights = parseInt(nightsMatch[1]);
      const valueMatch = text.match(
        /valued\s*(?:at|up\s+to)\s*(?:\$|\s*)?(\d+(?:,\d+)?(?:\.\d{2})?k?)/i
      );
      const nightValue = valueMatch
        ? parseFloat(this.normalizeAmount(valueMatch[1]))
        : 200; // Default to $200 per night
      return nights * nightValue;
    }

    // Check for monthly bonuses
    const monthlyBonusMatch = text.match(
      /\$(\d+(?:,\d+)?(?:\.\d{2})?k?)\/month\s+for\s+(\d+)\s+months/i
    );
    if (monthlyBonusMatch) {
      const monthlyAmount = parseFloat(this.normalizeAmount(monthlyBonusMatch[1]));
      const months = parseInt(monthlyBonusMatch[2]);
      return monthlyAmount * months;
    }

    // Check for gift cards and merchandise
    const giftCardPatterns = [
      /\$(\d+(?:,\d+)?(?:\.\d{2})?k?)\s+(?:amazon|visa|gift)\s+card/i,
      /(?:amazon|visa|gift)\s+card\s+(?:worth\s+)?\$(\d+(?:,\d+)?(?:\.\d{2})?k?)/i,
      /(?:amazon|visa|gift)\s+card\s+(?:valued\s+at\s+)?\$(\d+(?:,\d+)?(?:\.\d{2})?k?)/i,
    ];

    for (const pattern of giftCardPatterns) {
      const match = text.match(pattern);
      if (match) {
        return parseFloat(this.normalizeAmount(match[1]));
      }
    }

    // Check for percentage-based rewards without caps
    const percentageMatch = text.match(/earn\s+(\d+(?:\.\d+)?%?)\s+back/i);
    if (percentageMatch) {
      const percentage = parseFloat(percentageMatch[1]);
      // For percentage-based rewards without caps, estimate a reasonable value
      // based on typical spending patterns
      const estimatedMonthlySpend = 1000; // Assume $1000/month typical spend
      const estimatedAnnualValue = (estimatedMonthlySpend * 12 * percentage) / 100;
      return Math.min(estimatedAnnualValue, 500); // Cap at $500 to be conservative
    }

    // Check for tiered bonuses with multiple values
    const tieredBonusMatches = text.match(
      /\$(\d+(?:,\d+)?(?:\.\d{2})?k?)(?:\s*\/\s*\$(\d+(?:,\d+)?(?:\.\d{2})?k?)){1,}/g
    );
    if (tieredBonusMatches) {
      const values = tieredBonusMatches[0].match(/\d+(?:,\d+)?(?:\.\d{2})?k?/g);
      if (values) {
        return Math.max(...values.map((v) => parseFloat(this.normalizeAmount(v))));
      }
    }

    return 0;
  }

  private extractValue(html: string): number {
    this.initCheerio(html);

    // First check if we have a bonus value in metadata
    const metaDesc = this.$('meta[name="description"]').attr('content') || '';
    const bonusMatch = metaDesc.match(
      /metadata\.bonus:\s*\$?(\d+(?:,\d+)?(?:\.\d{2})?k?)/i
    );
    if (bonusMatch) {
      return parseFloat(this.normalizeAmount(bonusMatch[1]));
    }

    // Get value from bonus description if no point value found
    const bonusSection = this.$('p:contains("Bonus Details:")').next();
    const bonusText = bonusSection.length ? bonusSection.text() : '';
    const bonusValue = bonusText ? this.standardizeValue(bonusText) : 0;

    // Get value from requirements if it exists
    const requirementsSection = this.$('p:contains("Bonus Requirements:")').next();
    const requirementsText = requirementsSection.length ? requirementsSection.text() : '';
    const requirementsValue = requirementsText
      ? this.standardizeValue(requirementsText)
      : 0;

    // Get value from additional info if it exists
    const additionalInfo = this.extractAdditionalInfo();
    const additionalValue = additionalInfo ? this.standardizeValue(additionalInfo) : 0;

    // Get value from tiers if they exist
    const tiers = this.extractTableTiers();
    const tiersValue = tiers.length > 0 ? this.estimateValueFromTiers(tiers) : 0;

    // Get value from cash back section if it exists
    const cashBackSection = this.$('p:contains("Card Cash Back:")').next();
    const cashBackText = cashBackSection.length ? cashBackSection.text() : '';
    const cashBackValue = cashBackText ? this.standardizeValue(cashBackText) : 0;

    // Return the highest non-zero value found
    return (
      Math.max(
        bonusValue,
        requirementsValue,
        additionalValue,
        tiersValue,
        cashBackValue
      ) || 0
    );
  }

  private estimateValueFromTiers(tiers: BonusTier[]): number {
    if (tiers.length === 0) return 0;

    // For each tier, calculate its value
    const tierValues = tiers.map((tier) => {
      // Handle share/stock rewards
      const sharesMatch = tier.reward.match(/(\d+)\s*(?:shares?|stocks?)/i);
      if (sharesMatch) {
        return parseInt(sharesMatch[1]) * 3; // Assume $3 per share
      }

      // Handle direct monetary values
      const match = tier.reward.match(/\$?(\d+(?:,\d+)?(?:\.\d{2})?k?)/);
      if (match) {
        return parseFloat(this.normalizeAmount(match[1]));
      }

      return 0;
    });

    // For stock/share rewards, sum up all tiers as they might be cumulative
    if (
      tiers.some(
        (tier) =>
          tier.reward.toLowerCase().includes('share') ||
          tier.reward.toLowerCase().includes('stock')
      )
    ) {
      return tierValues.reduce((sum, value) => sum + value, 0);
    }

    // For other rewards, take the highest value
    return Math.max(...tierValues);
  }

  public transform(offer: BankRewardsOffer): EnhancedTransformedOffer {
    this.initCheerio(offer.metadata.rawHtml);

    // Set the type based on the offer type
    this.type =
      offer.type.toLowerCase() === 'credit_card'
        ? 'credit_card'
        : offer.type.toLowerCase() === 'brokerage'
          ? 'brokerage'
          : 'bank';

    const tiers = this.extractTableTiers();
    if (tiers.length === 0) {
      const textTiers = this.extractTextTiers(this.$('div').text());
      tiers.push(...textTiers);
    }

    const bonusDescription = this.extractBonusDescription();
    const bonusRequirements = this.extractBonusRequirements();

    // Helper function to estimate stock value based on historical data
    const estimateStockValue = (numStocks: number, company?: string): number => {
      // Historical average values for common stock rewards
      const stockValues: { [key: string]: number } = {
        moomoo: 15, // Futu Holdings stock ~$15
        webull: 10, // Common stock rewards ~$10
        robinhood: 12, // Common stock rewards ~$12
        sofi: 8, // SoFi stock ~$8
        public: 10, // Common stock rewards ~$10
        tastyworks: 12, // Common stock rewards ~$12
        firstrade: 10, // Common stock rewards ~$10
        default: 12, // Default estimate for unknown brokers
      };

      // Try to find company-specific value
      const companyValue = company
        ? Object.entries(stockValues).find(([key]) =>
            company.toLowerCase().includes(key)
          )?.[1] || stockValues.default
        : stockValues.default;

      return Math.round(numStocks * companyValue * 100) / 100;
    };

    // Use metadata.bonus if available, otherwise fall back to extractValue
    let estimatedValue = 0;
    if (offer.metadata.bonus) {
      // Check for stock format (e.g. "15 Stocks")
      const stockMatch = offer.metadata.bonus.match(/(\d+)\s*stocks?/i);
      if (stockMatch) {
        const numStocks = parseInt(stockMatch[1]);
        estimatedValue = estimateStockValue(numStocks, offer.title);
      } else {
        // Check for dollar amount format
        const match = offer.metadata.bonus.match(/\$?(\d+(?:,\d+)?(?:\.\d{2})?k?)/);
        if (match) {
          estimatedValue = parseFloat(this.normalizeAmount(match[1]));
        }
      }
    }

    // If no value from metadata.bonus, try extracting from HTML
    if (estimatedValue === 0) {
      const extractedValue = this.extractValue(offer.metadata.rawHtml);
      const tiersValue = this.estimateValueFromTiers(tiers);
      estimatedValue = Math.max(extractedValue, tiersValue);
    }

    const additionalInfo = this.extractAdditionalInfo();

    const bonus: Bonus = {
      title: 'Bonus Details',
      description: bonusDescription,
      requirements: {
        title: 'Bonus Requirements',
        description: bonusRequirements,
      },
      tiers: tiers.length > 0 ? tiers : undefined,
      additional_info: additionalInfo,
    };

    const details = this.extractDetails();

    const metadata: Metadata = {
      created: new Date(offer.metadata.lastChecked).toISOString(),
      updated: new Date(offer.metadata.lastChecked).toISOString(),
    };

    return {
      id: offer.id,
      name: offer.title,
      type: this.type,
      offer_link: offer.metadata.offerBaseUrl || '',
      value: estimatedValue,
      bonus,
      details,
      metadata,
      logo: this.getLogo(offer.title),
      ...(this.type === 'credit_card' && { card_image: this.getCardImage() }),
    };
  }

  private cleanText(text: string): string {
    if (!text) return '';

    // Decode HTML entities and normalize spaces
    const decoded = this.$('<div>').html(text).text().replace(/\s+/g, ' ').trim();

    // Remove common field labels
    const cleaned = decoded.replace(
      /(?:Bonus|Monthly Fee|Credit Inquiry|Household Limit|Early Account Closure Fee|ChexSystems|Expiration|Disclosure)\s*Details?:?/gi,
      ''
    );

    // Remove duplicate phrases
    return [...new Set(cleaned.split(/\.\s+/))]
      .join('. ')
      .replace(/[.,:;]+$/, '')
      .trim();
  }

  private normalizeAmount(amount: string): string {
    // Handle k notation (e.g., 5k -> 5000)
    if (amount.toLowerCase().endsWith('k')) {
      const num = parseFloat(amount.slice(0, -1)) * 1000;
      return num.toLocaleString();
    }

    // Remove any non-numeric characters except decimal point
    const cleaned = amount.replace(/[^\d.]/g, '');
    const num = parseFloat(cleaned);

    // Format with commas for thousands
    return num.toLocaleString();
  }

  private getLogo(name: string): Logo {
    // Try to find favicon image in the HTML that is NOT base64
    const faviconImg = this.$('img[alt$="favicon"]').filter(function () {
      const src = this.attribs['src'];
      return Boolean(src && !src.startsWith('data:'));
    });

    if (faviconImg.length) {
      const srcset = faviconImg.attr('srcset');
      const src = faviconImg.attr('src');

      // Extract the highest resolution image URL from srcset if available
      if (srcset) {
        const srcsetParts = srcset.split(',');
        const lastSrcset = srcsetParts[srcsetParts.length - 1].trim().split(' ')[0];
        if (!lastSrcset.startsWith('data:')) {
          const url = lastSrcset.startsWith('/_next')
            ? `https://bankrewards.io${lastSrcset}`
            : lastSrcset;
          return {
            type: 'icon',
            url,
          };
        }
      }

      // Fallback to src if no srcset
      if (src && !src.startsWith('data:')) {
        const url = src.startsWith('/_next') ? `https://bankrewards.io${src}` : src;
        return {
          type: 'icon',
          url,
        };
      }
    }

    // Try to find any image with bank/card name that is NOT base64
    const nameImg = this.$(`img[alt*="${name.toLowerCase()}"]`).filter(function () {
      const src = this.attribs['src'];
      return Boolean(src && !src.startsWith('data:'));
    });

    if (nameImg.length) {
      const src = nameImg.attr('src');
      if (src) {
        const url = src.startsWith('/_next') ? `https://bankrewards.io${src}` : src;
        return {
          type: 'icon',
          url,
        };
      }
    }

    // If no valid image found, return default logo
    return {
      type: 'icon',
      url: 'https://bankrewards.io/_next/image?url=%2Fblacklogo.png&w=128&q=75',
    };
  }

  private formatDate(date: Date | string): string {
    if (typeof date === 'string') {
      if (date.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)) {
        return date;
      }
      return new Date(date).toISOString();
    }
    return date.toISOString();
  }
}
