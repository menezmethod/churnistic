import * as cheerio from 'cheerio';

import { FirestoreOpportunity } from '@/types/opportunity';
import { BankRewardsOffer } from '@/types/scraper';
import { BonusTier, CardImage, Details } from '@/types/transformed';

interface ExtractedRequirements {
  minimum_deposit?: number;
  trading_requirements?: string;
  holding_period?: string;
  spending_requirement?: {
    amount: number;
    timeframe: string;
  };
}

interface BonusCategory {
  category: string;
  rate: string;
  limit?: string;
}

export class BankRewardsTransformer {
  private $: cheerio.CheerioAPI = cheerio.load('');
  private type: 'bank' | 'credit_card' | 'brokerage' = 'bank';

  private initCheerio(html: string) {
    this.$ = cheerio.load(html);
  }

  private extractTableTiers(): BonusTier[] {
    const tiers: BonusTier[] = [];
    const seenTiers = new Set<string>();

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
            const normalizedReward = reward.startsWith('$')
              ? `$${this.normalizeAmount(reward.slice(1))}`
              : reward;

            // Create a unique key for this tier combination
            const tierKey = `${normalizedReward}-${normalizedDeposit}`;

            // Only add if we haven't seen this exact combination before
            if (!seenTiers.has(tierKey)) {
              seenTiers.add(tierKey);
              tiers.push({
                reward: normalizedReward,
                deposit: normalizedDeposit,
              });
            }
          }
        }
      });
    });

    return tiers;
  }

  private extractTextTiers(text: string): BonusTier[] {
    const tiers: BonusTier[] = [];
    const seenTiers = new Set<string>();
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
              const tier = handler(match);
              const tierKey = `${tier.reward}-${tier.deposit}`;
              if (!seenTiers.has(tierKey)) {
                seenTiers.add(tierKey);
                tiers.push(tier);
              }
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
            const tier = handler(match);
            const tierKey = `${tier.reward}-${tier.deposit}`;
            if (!seenTiers.has(tierKey)) {
              seenTiers.add(tierKey);
              tiers.push(tier);
            }
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
    const text = this.cleanText(this.$('div').text());

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
      /(?:spending|spend)\s+\$?([\d,]+)(?:\s+(?:within|in)\s+(\d+)\s+(days?|months?))/i
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
            if (
              !perk.toLowerCase().includes('view offer') &&
              !perk.toLowerCase().includes('see other offers') &&
              !perk.toLowerCase().includes('annual fee') &&
              !perk.toLowerCase().includes('foreign transaction') &&
              !perk.toLowerCase().includes('credit inquiry') &&
              !perk.toLowerCase().includes('availability') &&
              !perk.toLowerCase().includes('expiration')
            ) {
              allPerks.push(perk);
            }
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
        rewards.cash_back = this.cleanRewardsText(cashBack);
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
            const rewardText = pattern.source.includes('statement')
              ? `$${match[1]} statement credit for ${match[2].trim()}`
              : `${match[1]}${pattern.source.includes('points?|rewards?') ? 'x' : '%'} on ${match[2].trim()}`;

            if (
              !rewardText.toLowerCase().includes('view offer') &&
              !rewardText.toLowerCase().includes('see other offers') &&
              !rewardText.toLowerCase().includes('annual fee') &&
              !rewardText.toLowerCase().includes('foreign transaction') &&
              !rewardText.toLowerCase().includes('credit inquiry') &&
              !rewardText.toLowerCase().includes('availability') &&
              !rewardText.toLowerCase().includes('expiration')
            ) {
              allRewards.push(rewardText);
            }
          }
        }
      }

      if (allRewards.length > 0) {
        rewards.cash_back = this.cleanRewardsText([...new Set(allRewards)].join('. '));
      }
    }

    return Object.keys(rewards).length > 0 ? rewards : undefined;
  }

  private cleanRewardsText(text: string): string {
    return this.cleanText(text)
      .replace(/View Offer.*$/, '')
      .replace(/See Other Offers.*$/, '')
      .replace(/Annual Fees:.*$/, '')
      .replace(/Foreign Transaction Fees:.*$/, '')
      .replace(/Credit Inquiry:.*$/, '')
      .replace(/Availability:.*$/, '')
      .replace(/Expiration:.*$/, '')
      .replace(/Some offer links.*$/, '')
      .replace(/Bonus Requirements?:.*$/, '')
      .replace(/Card Cash Back:.*$/, '')
      .trim();
  }

  private extractCardDetails(details: Details): void {
    // Extract annual fees
    const annualFeesText = this.$('p:contains("Annual Fees:")').text();
    if (annualFeesText) {
      details.annual_fees = this.cleanText(annualFeesText.split(':')[1]);
    }

    // Extract foreign transaction fees
    const foreignFeesText = this.$('p:contains("Foreign Transaction Fees:")').text();
    if (foreignFeesText) {
      details.foreign_transaction_fees = this.cleanText(foreignFeesText.split(':')[1]);
    }

    // Extract 5/24 status for credit cards
    const under524Text = this.$('p:contains("Under 5/24:")').text();
    if (under524Text) {
      const text = this.cleanText(under524Text.split(':')[1]).toLowerCase();
      details.under_5_24 = text.includes('not be approved') ? 'Yes' : 'No';
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

  private getCardImage(): CardImage | undefined {
    const cardImg = this.$('img[src*="card" i], img[alt*="card" i]').first();
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

    // Ensure URL is absolute and properly encoded
    url = url.startsWith('/_next')
      ? `https://bankrewards.io${encodeURI(url.replace(/[\uD800-\uDFFF]/g, ''))}`
      : encodeURI(url.replace(/[\uD800-\uDFFF]/g, ''));

    // Try to determine card network from text content and image
    const text = this.cleanText(this.$('div').text().toLowerCase());
    const imgAlt = this.cleanText(cardImg.attr('alt')?.toLowerCase() || '');
    const title = this.cleanText(this.$('h1').text().toLowerCase());

    let network = 'Unknown';
    if (
      text.includes('visa') ||
      imgAlt.includes('visa') ||
      title.includes('visa') ||
      this.$('img[alt*="visa" i]').length ||
      url.toLowerCase().includes('visa')
    ) {
      network = 'VISA';
    } else if (
      text.includes('mastercard') ||
      imgAlt.includes('mastercard') ||
      title.includes('mastercard') ||
      this.$('img[alt*="mastercard" i]').length ||
      url.toLowerCase().includes('mastercard')
    ) {
      network = 'Mastercard';
    } else if (
      text.includes('amex') ||
      text.includes('american express') ||
      imgAlt.includes('amex') ||
      imgAlt.includes('american express') ||
      title.includes('amex') ||
      title.includes('american express') ||
      this.$('img[alt*="amex" i], img[alt*="american express" i]').length ||
      url.toLowerCase().includes('amex') ||
      url.toLowerCase().includes('american-express')
    ) {
      network = 'American Express';
    } else if (
      text.includes('discover') ||
      imgAlt.includes('discover') ||
      title.includes('discover') ||
      this.$('img[alt*="discover" i]').length ||
      url.toLowerCase().includes('discover')
    ) {
      network = 'Discover';
    }

    let color = 'Unknown';
    if (
      text.includes('platinum') ||
      imgAlt.includes('platinum') ||
      title.includes('platinum')
    ) {
      color = 'Platinum';
    } else if (
      text.includes('gold') ||
      imgAlt.includes('gold') ||
      title.includes('gold')
    ) {
      color = 'Gold';
    } else if (
      text.includes('black') ||
      imgAlt.includes('black') ||
      title.includes('black')
    ) {
      color = 'Black';
    } else if (
      text.includes('blue') ||
      imgAlt.includes('blue') ||
      title.includes('blue')
    ) {
      color = 'Blue';
    }

    return {
      url,
      network,
      color,
    };
  }

  private getLogo(): { url: string } {
    const logoImg = this.$('img[src*="logo" i], img[alt*="logo" i]').first();
    if (!logoImg.length) {
      // Fallback to any image that might be a logo
      const img = this.$('img').first();
      if (img.length) {
        const src = img.attr('src');
        if (src) {
          return {
            url: src.startsWith('/_next')
              ? `https://bankrewards.io${encodeURI(src.replace(/[\uD800-\uDFFF]/g, ''))}`
              : encodeURI(src.replace(/[\uD800-\uDFFF]/g, '')),
          };
        }
      }
    }

    const src = logoImg.attr('src');
    if (src) {
      return {
        url: src.startsWith('/_next')
          ? `https://bankrewards.io${encodeURI(src.replace(/[\uD800-\uDFFF]/g, ''))}`
          : encodeURI(src.replace(/[\uD800-\uDFFF]/g, '')),
      };
    }

    // Fallback to a default logo
    return {
      url: 'https://bankrewards.io/_next/image?url=%2Fblacklogo.png&w=128&q=75',
    };
  }

  private standardizeValue(text: string): number {
    // Helper function to estimate stock value based on historical data
    const estimateStockValue = (numStocks: number, company?: string): number => {
      if (isNaN(numStocks) || numStocks <= 0) return 0;

      // Historical average values for common stock rewards
      const stockValues: { [key: string]: number } = {
        moomoo: 15,
        webull: 10,
        robinhood: 12,
        sofi: 8,
        public: 10,
        tastyworks: 12,
        firstrade: 10,
        default: 12,
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
      if (isNaN(points) || points <= 0) return 0;

      // First check for explicit point value hints in the text
      const pointValueMatch = text.match(
        /(?:estimated|worth|valued at|rate of roughly|redeemed.*?at|value of)\s+(?:\$|)?(\d+(?:\.\d+)?)\s*(?:cents?|¢)\s+(?:per|each|\/)\s+point/i
      );
      if (pointValueMatch) {
        const centsPerPoint = parseFloat(pointValueMatch[1]) / 100;
        if (!isNaN(centsPerPoint) && centsPerPoint > 0) {
          return Math.round(points * centsPerPoint * 100) / 100;
        }
      }

      // Use standard conversion rates for known programs
      const cleanedText = this.cleanText(text.toLowerCase());
      if (cleanedText.includes('membership rewards') || cleanedText.includes('amex')) {
        return Math.round(points * 0.01 * 100) / 100;
      }
      if (cleanedText.includes('ultimate rewards') || cleanedText.includes('chase')) {
        return Math.round(points * 0.0125 * 100) / 100;
      }
      if (cleanedText.includes('thank you') || cleanedText.includes('citi')) {
        return Math.round(points * 0.01 * 100) / 100;
      }
      if (cleanedText.includes('capital one') || cleanedText.includes('venture')) {
        return Math.round(points * 0.01 * 100) / 100;
      }
      if (cleanedText.includes('marriott') || cleanedText.includes('bonvoy')) {
        return Math.round(points * 0.007 * 100) / 100;
      }
      if (cleanedText.includes('hilton') || cleanedText.includes('honors')) {
        return Math.round(points * 0.004 * 100) / 100;
      }
      if (cleanedText.includes('ihg') || cleanedText.includes('intercontinental')) {
        return Math.round(points * 0.005 * 100) / 100;
      }
      if (cleanedText.includes('united') || cleanedText.includes('mileageplus')) {
        return Math.round(points * 0.013 * 100) / 100;
      }
      if (cleanedText.includes('delta') || cleanedText.includes('skymiles')) {
        return Math.round(points * 0.011 * 100) / 100;
      }
      if (cleanedText.includes('american') || cleanedText.includes('aadvantage')) {
        return Math.round(points * 0.014 * 100) / 100;
      }
      if (cleanedText.includes('southwest') || cleanedText.includes('rapid rewards')) {
        return Math.round(points * 0.014 * 100) / 100;
      }
      if (cleanedText.includes('alaska') || cleanedText.includes('mileage plan')) {
        return Math.round(points * 0.018 * 100) / 100;
      }
      if (cleanedText.includes('british') || cleanedText.includes('avios')) {
        return Math.round(points * 0.014 * 100) / 100;
      }
      if (cleanedText.includes('aeroplan') || cleanedText.includes('air canada')) {
        return Math.round(points * 0.015 * 100) / 100;
      }

      // Default to 1 cent per point
      return Math.round(points * 0.01 * 100) / 100;
    };

    // Clean and normalize the text
    const cleanedText = this.cleanText(text);

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
      const match = cleanedText.match(pattern);
      if (match) {
        const points = parseFloat(this.normalizeAmount(match[1]));
        if (!isNaN(points) && points > 0) {
          return pointsToDollars(points, cleanedText);
        }
      }
    }

    // Helper function to extract the highest number from a range
    const getHighestFromRange = (text: string): number => {
      const patterns = [
        /(?:between\s+)?\$?(\d+(?:,\d+)?(?:\.\d{2})?k?)\s*(?:to|-|and)\s*\$?(\d+(?:,\d+)?(?:\.\d{2})?k?)/i,
        /up\s+to\s+\$?(\d+(?:,\d+)?(?:\.\d{2})?k?)/i,
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
            const val1 = parseFloat(this.normalizeAmount(match[1]));
            const val2 = parseFloat(this.normalizeAmount(match[2]));
            if (!isNaN(val1) && !isNaN(val2)) {
              return Math.max(val1, val2);
            }
          }
          const val = parseFloat(this.normalizeAmount(match[1]));
          if (!isNaN(val)) {
            return val;
          }
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
      /tier\s+being\s+\$(\d+(?:,\d+)?(?:\.\d{2})?k?)/i,
      /bonus\s+of\s+\$(\d+(?:,\d+)?(?:\.\d{2})?k?)/i,
      /\$(\d+(?:,\d+)?(?:\.\d{2})?k?)\s+for\s+(?:checking|savings)/i,
      /\$(\d+(?:,\d+)?(?:\.\d{2})?k?)\s+(?:welcome|sign[\s-]up)\s+(?:bonus|reward)/i,
      /\$(\d+(?:,\d+)?(?:\.\d{2})?k?)\s+in\s+(?:bonus|rewards?)/i,
      /\$(\d+(?:,\d+)?(?:\.\d{2})?k?)\s+after\s+/i,
      /\$(\d+(?:,\d+)?(?:\.\d{2})?k?)\s+when\s+/i,
    ];

    for (const pattern of dollarPatterns) {
      const match = cleanedText.match(pattern);
      if (match) {
        const val = parseFloat(this.normalizeAmount(match[1]));
        if (!isNaN(val)) {
          return val;
        }
      }
    }

    // Check for stock rewards
    const stockPatterns = [
      /(\d+)\s*(?:free\s+)?(?:stocks?|shares?)/i,
      /(?:get|earn|receive)\s+(\d+)\s*(?:free\s+)?(?:stocks?|shares?)/i,
    ];

    for (const pattern of stockPatterns) {
      const match = cleanedText.match(pattern);
      if (match) {
        const numStocks = parseInt(match[1]);
        if (!isNaN(numStocks) && numStocks > 0) {
          return estimateStockValue(numStocks);
        }
      }
    }

    // Try to find the highest value in any range
    const rangeValue = getHighestFromRange(cleanedText);
    if (!isNaN(rangeValue) && rangeValue > 0) {
      return rangeValue;
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
    const tiersValue = this.estimateValueFromTiers(tiers);

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
    if (!tiers || tiers.length === 0) return 0;

    const values = tiers.map((tier) => {
      if (tier.reward) {
        const match = tier.reward.match(/\$?(\d+(?:,\d+)?(?:\.\d{2})?k?)/);
        if (match) {
          const value = parseFloat(this.normalizeAmount(match[1]));
          if (!isNaN(value)) return value;
        }
      }
      return 0;
    });

    return Math.max(...values);
  }

  private transformTiers(tiers: BonusTier[]): Array<{
    reward: string;
    deposit: string;
    level: string;
    value: number;
    minimum_deposit: number;
    requirements: string;
  }> {
    return tiers.map((tier, index) => ({
      reward: tier.reward,
      deposit: tier.deposit || '$0', // Provide default value
      level: `Tier ${index + 1}`,
      value: this.extractValueFromTier(tier),
      minimum_deposit: this.extractMinimumDeposit(tier.deposit || '0'),
      requirements: `${tier.deposit || '$0'} deposit required`,
    }));
  }

  public transform(offer: BankRewardsOffer): FirestoreOpportunity {
    this.initCheerio(offer.metadata.rawHtml);

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
    const additionalInfo = this.extractAdditionalInfo();

    let estimatedValue = 0;
    if (offer.metadata.bonus) {
      const stockMatch = offer.metadata.bonus.match(/(\d+)\s*stocks?/i);
      if (stockMatch) {
        const numStocks = parseInt(stockMatch[1]);
        if (!isNaN(numStocks) && numStocks > 0) {
          estimatedValue = this.estimateStockValue(numStocks, offer.title);
        }
      } else {
        const match = offer.metadata.bonus.match(/\$?(\d+(?:,\d+)?(?:\.\d{2})?k?)/);
        if (match) {
          const value = parseFloat(this.normalizeAmount(match[1]));
          if (!isNaN(value) && value > 0) {
            estimatedValue = value;
          }
        }
      }
    }

    if (estimatedValue === 0) {
      const extractedValue = this.extractValue(offer.metadata.rawHtml);
      const tiersValue = this.estimateValueFromTiers(tiers);
      if (!isNaN(extractedValue) && !isNaN(tiersValue)) {
        estimatedValue = Math.max(extractedValue, tiersValue);
      } else if (!isNaN(extractedValue)) {
        estimatedValue = extractedValue;
      } else if (!isNaN(tiersValue)) {
        estimatedValue = tiersValue;
      }
    }

    const transformedTiers = this.transformTiers(tiers);
    const details = this.extractDetails();
    const rewards = this.extractRewards();

    const transformedOffer: FirestoreOpportunity = {
      id: offer.id,
      name: offer.title,
      type: this.type,
      offer_link: offer.metadata.offerBaseUrl || '',
      value: estimatedValue,
      description: bonusDescription || '',
      isNew: true,
      expirationDate: details.expiration,
      metadata: {
        created_at: offer.metadata.lastChecked
          ? offer.metadata.lastChecked instanceof Date
            ? offer.metadata.lastChecked.toISOString()
            : new Date(offer.metadata.lastChecked).toISOString()
          : new Date().toISOString(),
        updated_at: offer.metadata.lastChecked
          ? offer.metadata.lastChecked instanceof Date
            ? offer.metadata.lastChecked.toISOString()
            : new Date(offer.metadata.lastChecked).toISOString()
          : new Date().toISOString(),
        created_by: 'bankrewards_scraper',
        status: 'active',
        timing: details.expiration
          ? { bonus_posting_time: details.expiration }
          : undefined,
        availability: details.availability
          ? {
              is_nationwide: details.availability.type === 'Nationwide',
              regions: details.availability.states,
            }
          : undefined,
        credit: details.credit_inquiry
          ? {
              inquiry: details.credit_inquiry.toLowerCase().includes('hard')
                ? 'hard_pull'
                : 'soft_pull',
            }
          : undefined,
        source: {
          name: 'bankrewards.io',
          original_id: offer.id,
        },
      },
      bonus: {
        title: 'Bonus Details',
        description: bonusDescription || '',
        requirements: {
          title: 'Requirements',
          description: bonusRequirements || '',
          ...this.extractSpendingRequirement(bonusRequirements || ''),
        },
        additional_info: additionalInfo,
        tiers: transformedTiers.length > 0 ? transformedTiers : undefined,
      },
      details: {
        monthly_fees: details.monthly_fees
          ? {
              amount:
                typeof details.monthly_fees === 'string'
                  ? details.monthly_fees
                  : details.monthly_fees?.amount || 'None',
              waiver_details:
                typeof details.monthly_fees === 'string'
                  ? undefined
                  : details.monthly_fees?.waiver_details,
            }
          : undefined,
        account_type:
          this.type === 'credit_card'
            ? 'Credit Card'
            : this.type === 'brokerage'
              ? 'Brokerage Account'
              : 'Personal Bank Account',
        account_category: 'personal',
        availability: details.availability
          ? {
              type: details.availability.type === 'Nationwide' ? 'Nationwide' : 'State',
              states: details.availability.states,
            }
          : undefined,
        credit_inquiry: details.credit_inquiry?.replace(/\s*[🙂🙁]\s*$/, ''),
        credit_score: undefined,
        household_limit: details.household_limit,
        early_closure_fee: details.early_closure_fee,
        chex_systems: details.chex_systems,
        expiration: details.expiration,
        under_5_24: details.under_5_24
          ? {
              required: details.under_5_24 === 'Yes',
              details:
                details.under_5_24 === 'Yes'
                  ? 'If you have opened 5 or more new cards in the past 24 months, you will not be approved'
                  : 'No 5/24 restriction',
            }
          : undefined,
        annual_fees: details.annual_fees
          ? {
              amount: details.annual_fees,
              waived_first_year: details.annual_fees.toLowerCase().includes('waived'),
            }
          : undefined,
        foreign_transaction_fees: details.foreign_transaction_fees
          ? {
              percentage: details.foreign_transaction_fees.replace(/\s*[🙂🙁]\s*$/, ''),
              waived:
                details.foreign_transaction_fees.toLowerCase().includes('none') ||
                details.foreign_transaction_fees.toLowerCase().includes('0%'),
            }
          : undefined,
        minimum_credit_limit: undefined,
        rewards_structure:
          rewards && rewards.cash_back
            ? {
                base_rewards: rewards.cash_back,
                bonus_categories: this.extractBonusCategories(rewards.cash_back),
                welcome_bonus: bonusDescription || undefined,
              }
            : undefined,
        options_trading: details.options_trading,
        ira_accounts: details.ira_accounts,
      },
      logo: {
        type: 'icon',
        url: this.getLogo().url,
      },
      ...(this.type === 'credit_card' && { card_image: this.getCardImage() }),
    };

    return transformedOffer;
  }

  private extractSpendingRequirement(requirements: string): ExtractedRequirements {
    if (!requirements) return {};

    const result: ExtractedRequirements = {};

    const spendMatch = requirements.match(
      /spend\s+\$?(\d+(?:,\d+)?)\s+(?:within|in)\s+(\d+)\s+(days?|months?)/i
    );
    if (spendMatch) {
      const amount = parseFloat(this.normalizeAmount(spendMatch[1]));
      result.spending_requirement = {
        amount: isNaN(amount) ? 0 : amount,
        timeframe: `${spendMatch[2]} ${spendMatch[3]}`,
      };
    }

    const depositMatch = requirements.match(/deposit\s+\$?(\d+(?:,\d+)?)/i);
    if (depositMatch) {
      const amount = parseFloat(this.normalizeAmount(depositMatch[1]));
      result.minimum_deposit = isNaN(amount) ? 0 : amount;
    }

    const holdingMatch = requirements.match(/hold\s+(?:for\s+)?(\d+)\s+(days?|months?)/i);
    if (holdingMatch) {
      result.holding_period = `${holdingMatch[1]} ${holdingMatch[2]}`;
    }

    if (
      requirements.toLowerCase().includes('trade') ||
      requirements.toLowerCase().includes('trading')
    ) {
      result.trading_requirements = requirements;
    }

    return result;
  }

  private extractBonusCategories(cashBack: string): BonusCategory[] | undefined {
    if (!cashBack) return undefined;

    const categories: BonusCategory[] = [];

    const categoryMatches = Array.from(
      cashBack.matchAll(
        /(\d+(?:\.\d+)?(?:x|%))\s+(?:on|for|in)\s+([^.]+?)(?:\s+up\s+to\s+\$?(\d+(?:,\d+)?)|(?=\.|$))/gi
      )
    );

    for (const match of categoryMatches) {
      categories.push({
        category: match[2].trim(),
        rate: match[1],
        ...(match[3] && { limit: `$${this.normalizeAmount(match[3])}` }),
      });
    }

    return categories.length > 0 ? categories : undefined;
  }

  private extractValueFromTier(tier: BonusTier): number {
    const rewardMatch = tier.reward.match(/\$?(\d+(?:,\d+)?(?:\.\d{2})?k?)/);
    if (rewardMatch) {
      return parseFloat(this.normalizeAmount(rewardMatch[1]));
    }

    const sharesMatch = tier.reward.match(/(\d+)\s*(?:shares?|stocks?)/i);
    if (sharesMatch) {
      return parseInt(sharesMatch[1]) * 3; // Assume $3 per share
    }

    return 0;
  }

  private extractMinimumDeposit(deposit: string): number {
    const match = deposit.match(/\$?(\d+(?:,\d+)?(?:\.\d{2})?k?)/);
    return match ? parseFloat(this.normalizeAmount(match[1])) : 0;
  }

  private estimateStockValue(numStocks: number, company?: string): number {
    if (isNaN(numStocks) || numStocks <= 0) return 0;

    // Historical average values for common stock rewards
    const stockValues: { [key: string]: number } = {
      moomoo: 15,
      webull: 10,
      robinhood: 12,
      sofi: 8,
      public: 10,
      tastyworks: 12,
      firstrade: 10,
      default: 12,
    };

    // Try to find company-specific value
    const companyValue = company
      ? Object.entries(stockValues).find(([key]) =>
          company.toLowerCase().includes(key)
        )?.[1] || stockValues.default
      : stockValues.default;

    return Math.round(numStocks * companyValue * 100) / 100;
  }

  private cleanText(text: string): string {
    if (!text) return '';
    return text
      .replace(/[\uD800-\uDFFF]/g, '') // Remove surrogate pairs
      .replace(
        /[^\x20-\x7E\u00A0-\u00FF\u0100-\u017F\u0180-\u024F\u0370-\u03FF\u0400-\u04FF]/g,
        ''
      ) // Keep only basic Latin, Latin-1 Supplement, Latin Extended-A/B, Greek and Cyrillic
      .replace(/\s+/g, ' ')
      .trim();
  }

  private normalizeAmount(amount: string): string {
    if (!amount) return '0';

    // Remove any non-numeric characters except decimal points and commas
    let normalized = amount.replace(/[^\d.,]/g, '');

    // Handle 'k' suffix
    if (amount.toLowerCase().includes('k')) {
      normalized = (parseFloat(normalized.replace(/,/g, '')) * 1000).toString();
    }

    // Remove commas and ensure proper decimal formatting
    normalized = normalized.replace(/,/g, '');

    // Ensure we have at most 2 decimal places
    const parts = normalized.split('.');
    if (parts.length > 1) {
      normalized = `${parts[0]}.${parts[1].substring(0, 2)}`;
    }

    // Convert to number and back to string to ensure valid format
    const num = parseFloat(normalized);
    if (isNaN(num)) return '0';

    return num.toString();
  }

  private formatCurrencyValue(value: number): string {
    if (isNaN(value)) return '0';
    return value.toFixed(2);
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
