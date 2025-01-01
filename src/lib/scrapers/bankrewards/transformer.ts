import * as cheerio from 'cheerio';

import { BankRewardsOffer } from '@/types/scraper';
import { TransformedOffer, BonusTier, Details, Logo } from '@/types/transformed';

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
      // Direct deposit requirement with amount and timeframe
      /(?:direct\s+deposit|dd)\s+(?:of\s+)?\$?(\d+(?:,\d+)?(?:\.\d{2})?k?)\s+(?:or\s+more\s+)?(?:within|in|during)\s+(\d+)\s+(?:days?|months?)/i,
      // Direct deposit requirement with timeframe only
      /(?:direct\s+deposit|dd)\s+(?:within|in|during)\s+(\d+)\s+(?:days?|months?)/i,
      // Spending requirement with amount and timeframe
      /(?:spend|purchase)\s+\$?(\d+(?:,\d+)?(?:\.\d{2})?k?)\s+(?:or\s+more\s+)?(?:within|in|during)\s+(\d+)\s+(?:days?|months?)/i,
      // Debit card transactions requirement
      /(?:make|complete)\s+(\d+)\s+(?:debit\s+card\s+)?(?:purchases?|transactions?)/i,
      // Minimum deposit requirement
      /(?:minimum|initial)\s+deposit\s+of\s+\$?(\d+(?:,\d+)?(?:\.\d{2})?k?)/i,
      // Maintain balance requirement
      /maintain\s+(?:a\s+)?(?:minimum\s+)?balance\s+of\s+\$?(\d+(?:,\d+)?(?:\.\d{2})?k?)\s+(?:for|during)\s+(\d+)\s+(?:days?|months?)/i
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        if (pattern.source.includes('direct deposit') && match[1] && match[2]) {
          return `Set up direct deposit of $${this.normalizeAmount(match[1])} within ${match[2]} ${match[2] === '1' ? 'month' : 'months'}`;
        }
        if (pattern.source.includes('direct deposit') && match[1]) {
          return `Set up direct deposit within ${match[1]} ${match[1] === '1' ? 'month' : 'months'}`;
        }
        if (pattern.source.includes('spend')) {
          return `Spend $${this.normalizeAmount(match[1])} within ${match[2]} ${match[2] === '1' ? 'month' : 'months'}`;
        }
        if (pattern.source.includes('debit card')) {
          return `Complete ${match[1]} debit card transactions`;
        }
        if (pattern.source.includes('minimum deposit')) {
          return `Make a minimum deposit of $${this.normalizeAmount(match[1])}`;
        }
        if (pattern.source.includes('maintain')) {
          return `Maintain a balance of $${this.normalizeAmount(match[1])} for ${match[2]} ${match[2] === '1' ? 'month' : 'months'}`;
        }
      }
    }

    // Look for requirements in the bonus description
    const bonusDesc = this.extractBonusDescription().toLowerCase();
    if (bonusDesc.includes('direct deposit')) {
      return 'Set up direct deposit';
    }
    if (bonusDesc.includes('debit card')) {
      return 'Complete debit card transactions';
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
    return undefined;
  }

  private extractRewards(): { card_perks?: string, cash_back?: string } | undefined {
    const rewards: { card_perks?: string, cash_back?: string } = {};

    // Extract cash back rates
    const cashBackPattern = /(\d+(?:\.\d+)?%)\s+cash\s+back/i;
    const text = this.$('div').text();
    const cashBackMatch = text.match(cashBackPattern);
    if (cashBackMatch) {
      rewards.cash_back = cashBackMatch[0];
    }

    // Extract card perks
    const perksSection = this.$('p:contains("Card Perks:")').next();
    if (perksSection.length) {
      const perks = this.cleanText(perksSection.text());
      if (perks) {
        rewards.card_perks = perks;
      }
    }

    // Only return if we found any rewards
    return Object.keys(rewards).length > 0 ? rewards : undefined;
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
      details.under_5_24 = this.cleanText(under524Text.split(':')[1]);
    }
  }

  private extractDetails(): Details {
    const details: Details = {};

    // Extract monthly fees with proper formatting
    const monthlyFeesText = this.$('p:contains("Monthly Fees:")').text();
    if (monthlyFeesText) {
      const amount = this.cleanText(monthlyFeesText.split(':')[1]);
      if (amount) {
        if (amount.toLowerCase() === 'none' || amount === '0' || amount === '$0') {
          details.monthly_fees = 'None';
        } else {
          const match = amount.match(/\$?(\d+(?:\.\d{2})?)/);
          if (match) {
            details.monthly_fees = `$${parseFloat(match[1]).toFixed(2)}`;
          } else {
            details.monthly_fees = amount;
          }
        }
      } else {
        details.monthly_fees = 'None';
      }
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

  public transform(offer: BankRewardsOffer): TransformedOffer {
    this.initCheerio(offer.metadata.rawHtml);
    this.type = offer.type.toLowerCase() as 'bank' | 'credit_card' | 'brokerage';
    
    // Extract tiers first - try table format, then fallback to text patterns
    const tableTiers = this.extractTableTiers();
    const textTiers = this.extractTextTiers(offer.metadata.rawHtml);
    const tiers = tableTiers.length > 0 ? tableTiers : textTiers;

    const transformed: TransformedOffer = {
      id: offer.id,
      name: offer.title,
      type: this.type,
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
      ...(this.extractRewards() && { rewards: this.extractRewards() }),
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

  private getLogo(name: string): Logo {
    // Try to find favicon image in the HTML that is NOT base64
    const faviconImg = this.$('img[alt$="favicon"]').filter(function() {
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
          const url = lastSrcset.startsWith('/_next') ? 
            `https://bankrewards.io${lastSrcset}` : lastSrcset;
          return {
            type: 'icon',
            url
          };
        }
      }
      
      // Fallback to src if no srcset
      if (src && !src.startsWith('data:')) {
        const url = src.startsWith('/_next') ? 
          `https://bankrewards.io${src}` : src;
        return {
          type: 'icon',
          url
        };
      }
    }

    // Try to find any image with bank/card name that is NOT base64
    const nameImg = this.$(`img[alt*="${name.toLowerCase()}"]`).filter(function() {
      const src = this.attribs['src'];
      return Boolean(src && !src.startsWith('data:'));
    });

    if (nameImg.length) {
      const src = nameImg.attr('src');
      if (src) {
        const url = src.startsWith('/_next') ? 
          `https://bankrewards.io${src}` : src;
        return {
          type: 'icon',
          url
        };
      }
    }

    // If no valid image found, return default logo
    return {
      type: 'icon',
      url: 'https://bankrewards.io/_next/image?url=%2Fblacklogo.png&w=128&q=75'
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
