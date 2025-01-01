import * as cheerio from 'cheerio';

import { BankRewardsOffer } from '@/types/scraper';
import { TransformedOffer, BonusTier, Details } from '@/types/transformed';

export class BankRewardsTransformer {
  private $: cheerio.CheerioAPI = cheerio.load('');

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
      const headers = this.$(rows[0]).find('th, td').map((_, cell) => 
        this.cleanText(this.$(cell).text()).toLowerCase()
      ).get();
      
      const isRewardTable = headers.some(h => 
        h.includes('reward') || h.includes('bonus') || h.includes('stock') || h.includes('share')
      );
      const isDepositTable = headers.some(h => 
        h.includes('deposit') || h.includes('spend') || h.includes('requirement')
      );
      
      if (!isRewardTable || !isDepositTable) return;
      
      // Extract tiers from valid table
      rows.slice(1).each((_, row) => {
        const cells = this.$(row).find('td');
        if (cells.length >= 2) {
          const reward = this.cleanText(cells.eq(0).text());
          const deposit = this.cleanText(cells.eq(1).text());
          
          if (reward && deposit) {
            const normalizedDeposit = deposit.startsWith('$') ? 
              deposit : 
              `$${this.normalizeAmount(deposit)}`;
            
            tiers.push({
              reward: reward.startsWith('$') ? 
                `$${this.normalizeAmount(reward.slice(1))}` : 
                reward,
              deposit: normalizedDeposit
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
        pattern: /(?:get|earn|receive)?\s*(\d+)\s*(?:free\s+)?(?:shares?|stocks?)\s*(?:for|with|when)?\s*\$?(\d+(?:,\d+)?(?:\.\d{2})?k?)/gi,
        handler: (match: RegExpMatchArray) => ({
          reward: `${match[1]} shares`,
          deposit: `$${this.normalizeAmount(match[2])}`
        })
      },
      // Direct deposit tiers
      {
        pattern: /\$?(\d+(?:,\d+)?(?:\.\d{2})?k?)\s*(?:bonus)?\s*(?:for|with|when|after)\s*\$?(\d+(?:,\d+)?(?:\.\d{2})?k?)\s*(?:in\s+)?(?:direct\s+deposits?|dd)/gi,
        handler: (match: RegExpMatchArray) => ({
          reward: `$${this.normalizeAmount(match[1])}`,
          deposit: `$${this.normalizeAmount(match[2])}`
        })
      },
      // Spending tiers
      {
        pattern: /\$?(\d+(?:,\d+)?(?:\.\d{2})?k?)\s*(?:bonus|cash\s+back)?\s*(?:after|for|when)\s*(?:you\s+)?spend(?:ing)?\s*\$?(\d+(?:,\d+)?(?:\.\d{2})?k?)/gi,
        handler: (match: RegExpMatchArray) => ({
          reward: `$${this.normalizeAmount(match[1])}`,
          deposit: `$${this.normalizeAmount(match[2])}`
        })
      },
      // Colon-separated format
      {
        pattern: /\$?(\d+(?:,\d+)?(?:\.\d{2})?k?)\s*:\s*\$?(\d+(?:,\d+)?(?:\.\d{2})?k?)/gi,
        handler: (match: RegExpMatchArray) => ({
          reward: `$${this.normalizeAmount(match[1])}`,
          deposit: `$${this.normalizeAmount(match[2])}`
        })
      }
    ];

    // First try to find a list of tiers
    const lists = this.$('ul, ol').filter((_, el) => {
      const text = this.$(el).text().toLowerCase();
      return text.includes('bonus') || text.includes('reward') || text.includes('tier');
    });

    lists.each((_, list) => {
      this.$(list).find('li').each((_, item) => {
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
      // Cash bonus with amount
      /(?:Get|Earn|Receive)\s+(?:up\s+to\s+)?\$?(\d+(?:,\d+)?(?:\.\d{2})?k?)\s+(?:cash\s+)?bonus/i,
      // Free stock/shares
      /(?:Get|Earn|Receive)\s+(\d+)\s+(?:free\s+)?(?:stocks?|shares?)/i,
      // Statement credit
      /\$?(\d+(?:,\d+)?(?:\.\d{2})?k?)\s+statement\s+credit/i,
      // Cash back bonus
      /\$?(\d+(?:,\d+)?(?:\.\d{2})?k?)\s+cash\s+back\s+bonus/i
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        const amount = this.normalizeAmount(match[1]);
        if (pattern.source.includes('stock')) {
          return `Get ${amount} free stocks`;
        }
        return `$${amount} bonus`;
      }
    }

    // If we have tiers, use a default description
    const tiers = this.extractTableTiers();
    if (tiers.length > 0) {
      if (tiers[0].reward.includes('shares') || tiers[0].reward.includes('stocks')) {
        return 'Get free shares based on the following tiers:';
      }
      
      // Calculate total possible bonus for direct deposit tiers
      const totalBonus = tiers.reduce((sum, tier) => {
        if (!tier.reward) return sum;
        const amount = parseInt(tier.reward.replace(/[^\d]/g, ''));
        return sum + amount;
      }, 0);

      if (totalBonus > 0) {
        return `$${totalBonus} bonus: ${tiers.map(t => t.reward).join(' + ')} with qualifying deposits`;
      }
    }

    return '';
  }

  private extractBonusRequirements(): string {
    // Try to find the requirements text after "Bonus Requirements:"
    const requirementsSection = this.$('p:contains("Bonus Requirements:"), p:contains("Requirements:")').next();
    if (requirementsSection.length) {
      const requirements = this.cleanText(requirementsSection.text());
      if (requirements) return requirements;
    }

    // Look for common requirement patterns in the content
    const text = this.$('div').text();
    const patterns = [
      // Spending requirement
      /(?:spend|purchase)\s+\$?(\d+(?:,\d+)?(?:\.\d{2})?k?)\s+(?:or\s+more\s+)?(?:within|in|during)\s+(\d+)\s+(?:days?|months?)/i,
      // Direct deposit requirement
      /(?:direct\s+deposit|dd)\s+of\s+\$?(\d+(?:,\d+)?(?:\.\d{2})?k?)\s+(?:or\s+more\s+)?(?:within|in|during)\s+(\d+)\s+(?:days?|months?)/i,
      // Account opening requirement
      /open\s+(?:a\s+new\s+)?account\s+(?:and|with)\s+(?:minimum\s+)?(?:deposit|balance)\s+of\s+\$?(\d+(?:,\d+)?(?:\.\d{2})?k?)/i
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        if (pattern.source.includes('spend')) {
          return `Spend $${this.normalizeAmount(match[1])} within ${match[2]} ${match[2] === '1' ? 'month' : 'months'}`;
        }
        if (pattern.source.includes('direct')) {
          return `Set up direct deposit of $${this.normalizeAmount(match[1])} within ${match[2]} ${match[2] === '1' ? 'month' : 'months'}`;
        }
        if (pattern.source.includes('open')) {
          return `Open a new account with minimum deposit of $${this.normalizeAmount(match[1])}`;
        }
      }
    }

    return '';
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
    return undefined;
  }

  private extractDetails(): Details {
    const details: Details = {};

    // Extract monthly fees
    const monthlyFeesText = this.$('p:contains("Monthly Fees:")').text();
    if (monthlyFeesText) {
      const amount = this.cleanText(monthlyFeesText.split(':')[1]);
      details.monthly_fees = amount || 'None';
    }

    // Extract account type
    const accountTypeText = this.$('p:contains("Account Type:")').text();
    if (accountTypeText) {
      details.account_type = this.cleanText(accountTypeText.split(':')[1]);
    }

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

    // Extract availability
    const availabilityText = this.$('p:contains("Availability:")').text();
    if (availabilityText) {
      const text = this.cleanText(availabilityText);
      const isNationwide = text.toLowerCase().includes('nationwide');
      const states = Array.from(text.matchAll(/\b([A-Z]{2})\b/g))
        .map(m => m[1])
        .filter(state => !['AM', 'PM', 'US', 'ID'].includes(state));

      details.availability = {
        type: isNationwide ? 'Nationwide' : states.length > 0 ? 'State' : undefined,
        states: states.length > 0 ? states : undefined,
        details: text.includes(':') ? this.cleanText(text.split(':')[1]) : undefined
      };
    }

    // Extract credit inquiry
    const creditInquiryText = this.$('p:contains("Credit Inquiry:")').text();
    if (creditInquiryText) {
      details.credit_inquiry = this.cleanText(creditInquiryText.split(':')[1]);
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

  public transform(offer: BankRewardsOffer): TransformedOffer {
    this.initCheerio(offer.metadata.rawHtml);
    
    // Extract tiers first - try table format, then fallback to text patterns
    const tableTiers = this.extractTableTiers();
    const textTiers = this.extractTextTiers(offer.metadata.rawHtml);
    const tiers = tableTiers.length > 0 ? tableTiers : textTiers;

    const transformed: TransformedOffer = {
      name: offer.title,
      type: offer.type.toLowerCase() as 'bank' | 'credit_card' | 'brokerage',
      logo: this.getLogo(offer.title),
      offer_link: offer.metadata.offerBaseUrl || '',
      bonus: {
        title: 'Bonus Details:',
        description: this.extractBonusDescription(),
        requirements: {
          title: 'Bonus Requirements:',
          description: this.extractBonusRequirements()
        },
        ...(tiers.length > 0 && { tiers }),
        ...(this.extractAdditionalInfo() && { additional_info: this.extractAdditionalInfo() })
      },
      details: this.extractDetails(),
      ...(this.extractDisclosure() && { disclosure: this.extractDisclosure() }),
      metadata: {
        created: this.formatDate(offer.metadata.lastChecked),
        updated: this.formatDate(offer.metadata.lastChecked)
      }
    };

    return transformed;
  }

  private cleanText(text: string): string {
    if (!text) return '';
    
    // Decode HTML entities
    const decoded = this.$('<div>').html(text).text();
    
    return decoded
      // Remove field labels
      .replace(/(?:Bonus|Monthly Fee|Credit Inquiry|Household Limit|Early Account Closure Fee|ChexSystems|Expiration|Disclosure)\s*Details?:?/gi, '')
      // Clean up whitespace
      .replace(/\s+/g, ' ')
      // Remove trailing punctuation
      .replace(/[.,:;]+$/, '')
      // Trim
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

  private getLogo(name: string): { type: string; url: string } {
    // Map product names to their logos
    const logoMap: Record<string, string> = {
      'WeBull': 'webull-logo.svg',
      'Moomoo': 'moomoo-logo.svg',
      'SoFi': 'sofi-logo.svg',
      'Chase': 'chase-logo.svg',
      'Capital One': 'capital-one-logo.svg',
      'Key': 'key-logo.svg',
      'Thomaston': 'thomaston-logo.svg'
    };

    const logoName = Object.keys(logoMap).find(key => name.includes(key));
    return {
      type: 'icon',
      url: `path/to/${logoName ? logoMap[logoName] : 'default-logo.svg'}`
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
