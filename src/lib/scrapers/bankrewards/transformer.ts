import * as cheerio from 'cheerio';

import { BankRewardsOffer } from '@/types/scraper';
import { TransformedOffer, BonusTier, Details, Logo, Bonus, Metadata } from '@/types/transformed';

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
    const bonusSection = this.$('p:contains("Bonus Details:")').next();
    if (bonusSection.length) {
      let description = this.cleanText(bonusSection.text());
      if (description) {
        // Filter out ongoing rewards
        const sentences = description.split(/[.!?]+\s+/);
        description = sentences
          .filter((sentence) => !this.isOngoingReward(sentence))
          .join('. ');

        // Check for cash back matching
        const cashBackMatching = this.extractCashBackMatching();
        if (cashBackMatching) {
          const perks = this.$('p:contains("Card Perks:")').next().text();
          const cashBack = this.$('p:contains("Card Cash Back:")').next().text();

          // Combine cash back details with matching
          description = `${cashBackMatching}. ${this.cleanText(cashBack)}`;

          // Add any additional perks that aren't cash back related
          const otherPerks = perks
            .split(/[.!?]+\s+/)
            .filter((perk) => !perk.toLowerCase().includes('cash back'))
            .join('. ');

          if (otherPerks) {
            description = `${description}. ${otherPerks}`;
          }
        }

        return description;
      }
    }

    // Look for text patterns in the entire content
    const text = this.$('div').text();

    // Look for specific bonus patterns
    const patterns = [
      // Points bonus with spending requirement
      {
        pattern:
          /(?:Get|Earn|Receive)\s+(?:up\s+to\s+)?(\d+(?:,\d+)?(?:\.\d{2})?k?)\s+(?:bonus\s+)?points?\s+(?:after|when)\s+(?:spending|you\s+spend)\s+\$?(\d+(?:,\d+)?(?:\.\d{2})?k?)\s+(?:within|in)\s+(\d+)\s+(?:days?|months?)/i,
        handler: (match: RegExpMatchArray) =>
          `Earn ${this.normalizeAmount(match[1])} bonus points after spending $${this.normalizeAmount(match[2])} in ${match[3]} days`,
      },
      // Cash bonus with amount
      {
        pattern:
          /(?:Get|Earn|Receive)\s+(?:up\s+to\s+)?\$?(\d+(?:,\d+)?(?:\.\d{2})?k?)\s+(?:cash\s+)?bonus/i,
        handler: (match: RegExpMatchArray) => `$${this.normalizeAmount(match[1])} bonus`,
      },
      // Free stock/shares
      {
        pattern: /(?:Get|Earn|Receive)\s+(\d+)\s+(?:free\s+)?(?:stocks?|shares?)/i,
        handler: (match: RegExpMatchArray) => `Get ${match[1]} free stocks`,
      },
      // Statement credit
      {
        pattern: /\$?(\d+(?:,\d+)?(?:\.\d{2})?k?)\s+statement\s+credit/i,
        handler: (match: RegExpMatchArray) =>
          `$${this.normalizeAmount(match[1])} statement credit`,
      },
      // Cash back bonus
      {
        pattern: /\$?(\d+(?:,\d+)?(?:\.\d{2})?k?)\s+cash\s+back\s+bonus/i,
        handler: (match: RegExpMatchArray) =>
          `$${this.normalizeAmount(match[1])} cash back bonus`,
      },
    ];

    for (const { pattern, handler } of patterns) {
      const match = pattern.exec(text);
      if (match) {
        return handler(match);
      }
    }

    return '';
  }

  private combineBonusRequirements(requirements: string[]): string {
    if (requirements.length === 0) return '';

    // Group similar requirements
    const groups: { [key: string]: string[] } = {
      accounts: [],
      deposits: [],
      transactions: [],
      balance: [],
      enrollment: [],
      timeframes: [],
      other: [],
    };

    requirements.forEach((req) => {
      if (req.toLowerCase().includes('open') || req.toLowerCase().includes('account')) {
        groups.accounts.push(req);
      } else if (
        req.toLowerCase().includes('deposit') ||
        req.toLowerCase().includes('ach')
      ) {
        groups.deposits.push(req);
      } else if (
        req.toLowerCase().includes('transaction') ||
        req.toLowerCase().includes('purchase')
      ) {
        groups.transactions.push(req);
      } else if (req.toLowerCase().includes('balance')) {
        groups.balance.push(req);
      } else if (
        req.toLowerCase().includes('enroll') ||
        req.toLowerCase().includes('sign up')
      ) {
        groups.enrollment.push(req);
      } else if (
        req.toLowerCase().includes('days') ||
        req.toLowerCase().includes('months')
      ) {
        groups.timeframes.push(req);
      } else {
        groups.other.push(req);
      }
    });

    // Combine requirements within each group
    const combinedGroups = Object.values(groups)
      .filter((group) => group.length > 0)
      .map((group) => {
        if (group.length === 1) return group[0];

        // For multiple requirements in a group, use AND
        return group.join(' AND ');
      });

    // Join groups with appropriate conjunctions
    if (combinedGroups.length === 1) {
      return combinedGroups[0];
    } else if (combinedGroups.length === 2) {
      return `${combinedGroups[0]} AND ${combinedGroups[1]}`;
    } else {
      const lastGroup = combinedGroups.pop();
      return `${combinedGroups.join(', ')}, AND ${lastGroup}`;
    }
  }

  private extractBonusRequirements(): string {
    // Helper function to clean text without regex
    const cleanRequirementText = (text: string): string => {
      const $ = this.$;
      const div = $('<div>').html(text);

      // Remove known non-requirement sections
      div.find('*:contains("Account Type:")').remove();
      div.find('*:contains("Monthly Fees:")').remove();
      div.find('*:contains("Credit Inquiry:")').remove();
      div.find('*:contains("Bonus Details:")').remove();
      div.find('*:contains("Terms and Conditions")').remove();

      return div.text().replace(/\s+/g, ' ').trim();
    };

    // First try to find promo code
    const promoCodeSection = this.$('div')
      .filter((_, el) => {
        const text = this.$(el).text().toLowerCase();
        return (
          text.includes('promo code') ||
          text.includes('offer code') ||
          text.includes('bonus code')
        );
      })
      .first();

    let promoCode = '';
    if (promoCodeSection.length) {
      const text = promoCodeSection.text();
      const codeMatch = text.match(
        /(?:promo|offer|bonus|referral)\s+code\s+["']?\$?([A-Z0-9]+)["']?/i
      );
      if (codeMatch) {
        promoCode = `Use promo code ${codeMatch[1]}. `;
      }
    }

    // Look for requirements in multiple places
    const requirementPatterns = [
      // Direct deposit patterns
      /(?:make|have|receive|complete)\s+(?:a|direct)\s+deposits?\s+(?:of|totaling|worth)?\s+\$?(\d+(?:,\d+)?(?:\.\d{2})?k?)/i,
      /direct\s+deposits?\s+(?:of|totaling|worth)?\s+\$?(\d+(?:,\d+)?(?:\.\d{2})?k?)/i,

      // Spending patterns
      /spend\s+\$?(\d+(?:,\d+)?(?:\.\d{2})?k?)\s+(?:or\s+more\s+)?(?:within|in|during)?\s+(?:the\s+)?(?:first\s+)?(\d+)\s+days?/i,
      /spend\s+\$?(\d+(?:,\d+)?(?:\.\d{2})?k?)\s+or\s+more/i,

      // Balance patterns
      /maintain\s+(?:a|minimum|average)?\s+balance\s+of\s+\$?(\d+(?:,\d+)?(?:\.\d{2})?k?)/i,
      /keep\s+\$?(\d+(?:,\d+)?(?:\.\d{2})?k?)\s+in\s+(?:your|the)\s+account/i,

      // Transaction patterns
      /make\s+(\d+)\s+(?:debit\s+card\s+)?(?:purchase|transaction)s?/i,
      /complete\s+(\d+)\s+(?:debit\s+card\s+)?(?:purchase|transaction)s?/i,

      // Time-based patterns
      /within\s+(\d+)\s+days?\s+of\s+(?:account\s+)?opening/i,
      /in\s+the\s+first\s+(\d+)\s+days?/i,

      // Brokerage-specific patterns
      /(?:transfer|deposit|fund)\s+(?:a\s+minimum\s+of\s+)?\$?(\d+(?:,\d+)?(?:\.\d{2})?k?)\s+(?:to|into)\s+(?:your|the)\s+(?:new\s+)?(?:account|brokerage)/i,
      /link\s+(?:a|your)\s+(?:bank\s+)?account/i,
      /open\s+(?:and|&)?\s*fund\s+(?:a|your|an?\s+new)?\s+(?:account|brokerage)\s+with\s+\$?(\d+(?:,\d+)?(?:\.\d{2})?k?)/i,
      /minimum\s+(?:initial\s+)?(?:deposit|funding|investment)\s+of\s+\$?(\d+(?:,\d+)?(?:\.\d{2})?k?)/i,
      /fund\s+(?:your|the)\s+account\s+with\s+\$?(\d+(?:,\d+)?(?:\.\d{2})?k?)/i,
      /transfer\s+\$?(\d+(?:,\d+)?(?:\.\d{2})?k?)\s+(?:to|into)\s+(?:your|the)\s+account\s+within\s+(\d+)\s+days?/i,
      /link\s+(?:a|your)\s+bank\s+account\s+(?:and|&)?\s*(?:get|receive|earn)\s+\$?(\d+(?:,\d+)?(?:\.\d{2})?k?)/i,
    ];

    // Find the requirements section using Cheerio
    const requirementSections = this.$(
      [
        'div:contains("Bonus Requirements")',
        'div:contains("Requirements:")',
        'div:contains("To qualify:")',
        'div:contains("To earn:")',
        'div:contains("To receive:")',
        'div:contains("How to earn:")',
        'div:contains("Eligibility:")',
        'div:contains("Qualification:")',
        'div:contains("Bonus Requirement")', // Added singular form
        'div:contains("Bonus Details")', // Added bonus details as fallback
      ].join(', ')
    );

    let requirements = '';

    if (requirementSections.length) {
      // Get all text nodes after the requirements section
      const section = requirementSections.first();
      const nextElements = section.nextAll().slice(0, 5);

      // Extract requirements from text nodes and lists
      const reqTexts: string[] = [];

      nextElements.each((_, el) => {
        const $el = this.$(el);

        // Handle lists specially
        if ($el.is('ul, ol')) {
          $el.find('li').each((_, li) => {
            const text = cleanRequirementText(this.$(li).text());
            if (text && text.length > 10) {
              reqTexts.push(text);
            }
          });
        } else {
          const text = cleanRequirementText($el.text());
          if (text && text.length > 10) {
            reqTexts.push(text);
          }
        }
      });

      // Filter and combine requirements
      requirements = reqTexts
        .filter((text) => {
          const lower = text.toLowerCase();
          return (
            (lower.includes('deposit') ||
              lower.includes('balance') ||
              lower.includes('transaction') ||
              lower.includes('spend') ||
              lower.includes('purchase') ||
              lower.includes('open') ||
              lower.includes('maintain') ||
              lower.includes('within') ||
              lower.includes('days') ||
              lower.includes('link') || // Added for brokerage accounts
              lower.includes('fund') || // Added for brokerage accounts
              lower.includes('transfer')) && // Added for brokerage accounts
            !lower.includes('monthly fee') &&
            !lower.includes('account type')
          );
        })
        .map((text) => {
          // Clean up common prefixes/suffixes
          return text
            .replace(/^(?:and|or|plus)\s+/i, '')
            .replace(/\s+(?:and|or|plus)\s*$/i, '')
            .replace(/^[-•*]\s*/, '')
            .trim();
        })
        .filter((text) => text.length > 10)
        .join(' AND ');
    }

    // If no requirements found in sections, try finding them in paragraphs
    if (!requirements) {
      const paragraphs = this.$('p').filter((_, el) => {
        const text = this.$(el).text().toLowerCase();
        return (
          (text.includes('deposit') ||
            text.includes('balance') ||
            text.includes('transaction') ||
            text.includes('spend') ||
            text.includes('purchase') ||
            text.includes('within') ||
            text.includes('days') ||
            text.includes('link') || // Added for brokerage accounts
            text.includes('fund') || // Added for brokerage accounts
            text.includes('transfer')) && // Added for brokerage accounts
          !text.includes('monthly fee') &&
          !text.includes('account type')
        );
      });

      if (paragraphs.length) {
        requirements = cleanRequirementText(paragraphs.first().text());
      }
    }

    // If still no requirements found, try pattern matching on all content
    if (!requirements) {
      const allText = this.$('div').text();

      // First try to find requirements in the bonus description
      const bonusDescSection = this.$('div:contains("Bonus Details")').first();
      if (bonusDescSection.length) {
        const bonusDesc = bonusDescSection.nextAll().slice(0, 2).text();
        for (const pattern of requirementPatterns) {
          const match = bonusDesc.match(pattern);
          if (match) {
            if (pattern.source.includes('spend')) {
              requirements = match[2]
                ? `Spend $${this.normalizeAmount(match[1])} within ${match[2]} days of account opening`
                : `Spend $${this.normalizeAmount(match[1])} or more`;
            } else if (pattern.source.includes('deposit')) {
              requirements = `Make direct deposits of $${this.normalizeAmount(match[1])}`;
            } else if (pattern.source.includes('balance')) {
              requirements = `Maintain a balance of $${this.normalizeAmount(match[1])}`;
            } else if (pattern.source.includes('transaction')) {
              requirements = `Complete ${match[1]} transactions`;
            } else if (pattern.source.includes('days')) {
              const prevSentence = bonusDesc
                .split(/[.!?]\s+/)
                .find((s) => s.match(pattern));
              if (prevSentence) {
                requirements = cleanRequirementText(prevSentence);
              }
            } else if (pattern.source.includes('link')) {
              requirements = 'Link a bank account';
            } else if (pattern.source.includes('transfer') && match[2]) {
              requirements = `Transfer $${this.normalizeAmount(match[1])} into the account within ${match[2]} days`;
            } else if (pattern.source.includes('fund')) {
              requirements = `Fund the account with $${this.normalizeAmount(match[1])}`;
            }
            break;
          }
        }
      }

      // If still no requirements, try the entire content
      if (!requirements) {
        for (const pattern of requirementPatterns) {
          const match = allText.match(pattern);
          if (match) {
            if (pattern.source.includes('spend')) {
              requirements = match[2]
                ? `Spend $${this.normalizeAmount(match[1])} within ${match[2]} days of account opening`
                : `Spend $${this.normalizeAmount(match[1])} or more`;
            } else if (pattern.source.includes('deposit')) {
              requirements = `Make direct deposits of $${this.normalizeAmount(match[1])}`;
            } else if (pattern.source.includes('balance')) {
              requirements = `Maintain a balance of $${this.normalizeAmount(match[1])}`;
            } else if (pattern.source.includes('transaction')) {
              requirements = `Complete ${match[1]} transactions`;
            } else if (pattern.source.includes('link')) {
              requirements = 'Link a bank account';
            } else if (pattern.source.includes('transfer') && match[2]) {
              requirements = `Transfer $${this.normalizeAmount(match[1])} into the account within ${match[2]} days`;
            } else if (pattern.source.includes('fund')) {
              requirements = `Fund the account with $${this.normalizeAmount(match[1])}`;
            }
            break;
          }
        }
      }
    }

    if (!requirements) {
      return promoCode + 'Contact bank for specific requirements';
    }

    // Clean up the final requirements
    requirements = requirements
      .replace(/bonus\s+requirements?:?\s*/i, '')
      .replace(/requirements?:?\s*/i, '')
      .replace(/\s+/g, ' ')
      .trim();

    // Capitalize first letter
    requirements = requirements.charAt(0).toUpperCase() + requirements.slice(1);

    // Check for recurring requirements
    const bonusSection = this.$('div:contains("Bonus Details")').first();
    if (bonusSection.length) {
      const bonusText = bonusSection.nextAll().slice(0, 3).text();
      const recurring = this.extractRecurringRequirements(bonusText);
      if (recurring) {
        requirements = requirements ? `${requirements}. ${recurring}` : recurring;
      }
    }

    return promoCode + requirements;
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

  private extract524Status(): boolean | undefined {
    // Common patterns for 5/24 mentions
    const patterns = [
      /(?:chase\s+)?5\/24(?:\s+rule)?:?\s*([^.]+)/i,
      /(?:subject\s+to|under|affected\s+by)\s+(?:chase\s+)?5\/24(?:\s+rule)?:?\s*([^.]+)/i,
      /(?:chase\s+)?5\/24(?:\s+rule)?\s+(?:status|requirement):?\s*([^.]+)/i,
      /opened\s+(?:more\s+than\s+)?(\d+)\s+cards?\s+in\s+(?:the\s+)?(?:last\s+)?24\s+months/i,
      /five\s+cards?\s+in\s+(?:the\s+)?(?:last\s+)?24\s+months/i,
    ];

    // First try to find explicit 5/24 sections
    const under524Text = this.$(
      'p:contains("5/24"), p:contains("Chase 5/24"), p:contains("Under 5/24"), p:contains("five cards in 24 months")'
    ).text();

    if (under524Text) {
      for (const pattern of patterns) {
        const match = under524Text.match(pattern);
        if (match) {
          const details = match[1] ? this.cleanText(match[1]) : under524Text;
          return (
            details.toLowerCase().includes('yes') ||
            details.toLowerCase().includes('required') ||
            details.toLowerCase().includes('subject to') ||
            !details.toLowerCase().includes('no') ||
            !details.toLowerCase().includes('not')
          );
        }
      }
    }

    // If no explicit section, search in general content
    const generalText = this.$('div').text();
    for (const pattern of patterns) {
      const match = generalText.match(pattern);
      if (match) {
        const details = match[1]
          ? this.cleanText(match[1])
          : match[0]
            ? this.cleanText(match[0])
            : 'Subject to Chase 5/24 rule';
        return (
          details.toLowerCase().includes('yes') ||
          details.toLowerCase().includes('required') ||
          details.toLowerCase().includes('subject to') ||
          !details.toLowerCase().includes('no') ||
          !details.toLowerCase().includes('not')
        );
      }
    }

    return undefined;
  }

  private extractCardDetails(details: Details): void {
    // Extract foreign transaction fees
    const foreignFeesText = this.$('p:contains("Foreign Transaction Fees:")').text();
    if (foreignFeesText) {
      const text = this.cleanText(foreignFeesText.split(':')[1]);
      const percentageMatch = text.match(/(\d+(?:\.\d+)?%?)/);
      const isWaived =
        text.toLowerCase().includes('none') ||
        text.toLowerCase().includes('no fee') ||
        text.toLowerCase().includes('waived') ||
        text.toLowerCase().includes('0%') ||
        text.toLowerCase().includes('$0');

      details.foreign_transaction_fees = {
        percentage: percentageMatch
          ? percentageMatch[1].endsWith('%')
            ? percentageMatch[1]
            : `${percentageMatch[1]}%`
          : isWaived
            ? '0%'
            : '3%', // Default to 3% if no percentage found and not waived
        waived: isWaived,
      };
    }

    // Extract annual fees
    const annualFeesText = this.$('p:contains("Annual Fees:")').text();
    if (annualFeesText) {
      const text = this.cleanText(annualFeesText.split(':')[1]);
      const amount =
        text.toLowerCase().includes('none') || text === '0' || text === '$0'
          ? '$0'
          : text.match(/\$?(\d+(?:\.\d{2})?)/)?.[0] || text;

      details.annual_fees = {
        amount: amount.startsWith('$') ? amount : `$${amount}`,
        waived_first_year:
          text.toLowerCase().includes('waived') ||
          text.toLowerCase().includes('first year free'),
      };
    }

    // Extract 5/24 status using the comprehensive method
    const status524 = this.extract524Status();
    if (status524 !== undefined) {
      details.under_5_24 = status524;
    }
  }

  private extractDetails(): Details {
    const details: Details = {};

    // Extract monthly fees with proper formatting and waiver conditions
    const monthlyFeesText = this.$('p:contains("Monthly Fees:")').text();
    if (monthlyFeesText) {
      const amount = this.cleanText(monthlyFeesText.split(':')[1]);

      // Look for waiver information in the content
      const waiverPatterns = [
        /(?:fees?\s+(?:are|is|will\s+be)\s+waived|no\s+(?:monthly\s+)?fees?\s+(?:when|if))\s+(?:any\s+of\s+the\s+following\s+(?:are|is)\s+achieve[d]?:?\s+)?([^.]+)/i,
        /to\s+avoid\s+(?:the\s+)?(?:monthly\s+)?fees?[,:]?\s+([^.]+)/i,
        /(?:monthly\s+)?fees?\s+(?:can\s+be|are|is)\s+waived\s+(?:when|if)\s+([^.]+)/i,
        /no\s+(?:monthly\s+)?fees?\s+with\s+([^.]+)/i,
      ];

      let waiverDetails = '';
      const content = this.$('div').text();

      for (const pattern of waiverPatterns) {
        const match = content.match(pattern);
        if (match && match[1]) {
          waiverDetails = this.cleanText(match[1]);
          break;
        }
      }

      details.monthly_fees = {
        amount:
          amount.toLowerCase() === 'none' || amount === '0' || amount === '$0'
            ? 'None'
            : amount.match(/\$?(\d+(?:\.\d{2})?)/)?.[0] || amount,
        waiver_details: waiverDetails || undefined,
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
        details: undefined,
      };
    }

    // Credit inquiry only for credit cards
    if (this.type === 'credit_card') {
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
    }

    // Bank Account specific fields
    if (this.type === 'bank') {
      // Extract minimum deposit
      const minDepositText = this.$('p:contains("Minimum Deposit:")').text();
      if (minDepositText) {
        const amount = this.cleanText(minDepositText.split(':')[1]);
        details.minimum_deposit =
          amount.toLowerCase() === 'none' || amount === '0' || amount === '$0'
            ? 'None'
            : amount.match(/\$?(\d+(?:\.\d{2})?)/)?.[0] || amount;
      }

      // Extract holding period
      const holdingPeriodText = this.$('p:contains("Holding Period:")').text();
      if (holdingPeriodText) {
        details.holding_period = this.cleanText(holdingPeriodText.split(':')[1]);
      }

      // Extract household limit
      const householdLimitText = this.$('p:contains("Household Limit:")').text();
      if (householdLimitText) {
        details.household_limit = this.cleanText(householdLimitText.split(':')[1]);
      }

      // Extract early closure fee
      const earlyClosureFeeText = this.$(
        'p:contains("Early Account Closure Fee:")'
      ).text();
      if (earlyClosureFeeText) {
        const amount = this.cleanText(earlyClosureFeeText.split(':')[1]);
        details.early_closure_fee =
          amount.toLowerCase() === 'none' || amount === '0' || amount === '$0'
            ? 'None'
            : amount.match(/\$?(\d+(?:\.\d{2})?)/)?.[0] || amount;
      }

      // Extract ChexSystems
      const chexSystemsText = this.$('p:contains("ChexSystems:")').text();
      if (chexSystemsText) {
        details.chex_systems = this.cleanText(chexSystemsText.split(':')[1]);
      }
    }

    // Credit Card specific fields
    if (this.type === 'credit_card') {
      // Extract 5/24 status using comprehensive method
      const status524 = this.extract524Status();
      if (status524 !== undefined) {
        details.under_5_24 = status524;
      }

      // Extract minimum credit limit
      const minCreditLimitText = this.$('p:contains("Minimum Credit Limit:")').text();
      if (minCreditLimitText) {
        const amount = this.cleanText(minCreditLimitText.split(':')[1]);
        details.minimum_credit_limit =
          amount.match(/\$?(\d+(?:,\d+)?(?:\.\d{2})?k?)/)?.[0] || amount;
      }

      // Extract rewards structure
      const rewardsText = this.$('p:contains("Rewards Structure:")').text();
      if (rewardsText) {
        const baseRewardsText = this.$('p:contains("Base Rewards:")').text();
        const welcomeBonusText = this.$('p:contains("Welcome Bonus:")').text();
        const bonusCategoriesText = this.$('p:contains("Bonus Categories:")').text();

        details.rewards_structure = {
          base_rewards: this.cleanText(baseRewardsText.split(':')[1]) || '',
          welcome_bonus: welcomeBonusText
            ? this.cleanText(welcomeBonusText.split(':')[1])
            : undefined,
          bonus_categories: bonusCategoriesText
            ? this.cleanText(bonusCategoriesText.split(':')[1])
                .split(',')
                .map((category) => {
                  const [cat, rate] = category.split('@').map((s) => s.trim());
                  const limitMatch = category.match(/up to \$([\d,]+)/);
                  return {
                    category: cat,
                    rate: rate || '',
                    limit: limitMatch ? limitMatch[1] : undefined,
                  };
                })
            : undefined,
        };
      }

      // Extract card-specific details (annual fees, foreign transaction fees)
      this.extractCardDetails(details);
    }

    // Brokerage specific fields
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

      // Extract trading requirements
      const tradingReqText = this.$('p:contains("Trading Requirements:")').text();
      if (tradingReqText) {
        details.trading_requirements = this.cleanText(tradingReqText.split(':')[1]);
      }

      // Extract platform features
      const platformFeaturesText = this.$('p:contains("Platform Features:")').text();
      if (platformFeaturesText) {
        const features = this.$('p:contains("Platform Features:")')
          .nextAll('ul')
          .first()
          .find('li');
        if (features.length) {
          details.platform_features = features
            .map((_, el) => {
              const featureText = this.$(el).text();
              const [name, description] = featureText.split(':').map((s) => s.trim());
              return {
                name,
                description: description || name,
              };
            })
            .get();
        }
      }
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

    // Special handling for credit card cash back matching
    const cashBackMatchingPatterns = [
      /cash\s+back\s+match(?:ing)?\s+(?:for|at|during)\s+(?:the\s+)?first\s+year/i,
      /match(?:es|ing)?\s+all\s+cash\s+back\s+earned\s+(?:in|during)\s+(?:the\s+)?first\s+year/i,
      /dollar[-\s]for[-\s]dollar\s+match(?:ing)?\s+(?:of|on)\s+(?:all\s+)?cash\s+back/i,
      /doubles?\s+(?:all\s+)?(?:your\s+)?(?:cash\s+back|rewards)\s+(?:earned\s+)?(?:in|during)\s+(?:the\s+)?first\s+year/i,
    ];

    for (const pattern of cashBackMatchingPatterns) {
      if (pattern.test(text)) {
        // Estimate value based on typical spending patterns
        const monthlySpend = 1000; // Assume $1000/month typical spend
        const categorySpendPercent = 0.3; // Assume 30% of spend in bonus categories
        const categorySpendLimit = 1000; // Quarterly limit on bonus categories

        // Calculate first year value with matching
        const regularCashBack = monthlySpend * 12 * 0.01; // 1% base
        const categoryCashBack =
          Math.min(monthlySpend * categorySpendPercent * 12, categorySpendLimit * 4) *
          0.02; // 2% categories
        const totalFirstYear = (regularCashBack + categoryCashBack) * 2; // Double with matching

        return Math.round(totalFirstYear);
      }
    }

    // Special handling for category rewards with quarterly limits
    const categoryRewardPatterns = [
      /(\d+)%\s+(?:cash\s+back|rewards?)\s+(?:on|at|for)\s+(?:.*?)\s+up\s+to\s+\$(\d+(?:,\d+)?)\s+(?:per|each|a)\s+quarter/i,
      /(\d+)%\s+(?:back|rewards?)\s+(?:on|at|for)\s+(?:.*?)\s+\(up\s+to\s+\$(\d+(?:,\d+)?)\s+quarterly\)/i,
    ];

    for (const pattern of categoryRewardPatterns) {
      const match = text.match(pattern);
      if (match) {
        const rate = parseInt(match[1]) / 100;
        const quarterlyLimit = parseFloat(this.normalizeAmount(match[2]));
        const annualValue = quarterlyLimit * 4 * rate;
        return Math.round(annualValue);
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
      tiers: tiers.length > 0 ? tiers.map(tier => {
        // Extract numeric value from reward (e.g. "6 shares" -> 6)
        const rewardValue = parseFloat(tier.reward.replace(/[^0-9.]/g, '')) || 0;
        
        // Extract numeric value from deposit (e.g. "$100" -> 100)
        const depositStr = tier.deposit || '0';
        const depositValue = parseFloat(depositStr.replace(/[^0-9.]/g, '')) || 0;
        
        return {
          reward: tier.reward,
          deposit: tier.deposit || '',
          level: tier.reward,
          value: rewardValue,
          minimum_deposit: depositValue,
          requirements: tier.requirement || tier.deposit || ''
        };
      }) : undefined,
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

  private validateTransformedOffer(offer: EnhancedTransformedOffer): void {
    // Validate required fields
    if (!offer.id) throw new Error('Missing ID in transformed offer');
    if (!offer.name) throw new Error('Missing name in transformed offer');
    if (!offer.type) throw new Error('Missing type in transformed offer');
    if (!offer.bonus) throw new Error('Missing bonus in transformed offer');
    if (!offer.details) throw new Error('Missing details in transformed offer');
    if (!offer.metadata) throw new Error('Missing metadata in transformed offer');

    // Validate type-specific fields
    if (offer.type === 'credit_card') {
      if (!offer.details.annual_fees) {
        console.warn(`Missing annual fees for credit card offer ${offer.id}`);
      }
      if (!offer.details.foreign_transaction_fees) {
        console.warn(
          `Missing foreign transaction fees for credit card offer ${offer.id}`
        );
      }
      if (!offer.details.under_5_24) {
        console.warn(`Missing 5/24 status for credit card offer ${offer.id}`);
      }
    }

    if (offer.type === 'bank') {
      if (!offer.details.minimum_deposit) {
        console.warn(`Missing minimum deposit for bank offer ${offer.id}`);
      }
      if (!offer.details.early_closure_fee) {
        console.warn(`Missing early closure fee for bank offer ${offer.id}`);
      }
      if (!offer.details.chex_systems) {
        console.warn(`Missing ChexSystems status for bank offer ${offer.id}`);
      }
    }

    if (offer.type === 'brokerage') {
      if (!offer.details.options_trading) {
        console.warn(`Missing options trading info for brokerage offer ${offer.id}`);
      }
      if (!offer.details.trading_requirements) {
        console.warn(`Missing trading requirements for brokerage offer ${offer.id}`);
      }
    }

    // Validate bonus structure
    if (!offer.bonus.description) {
      console.warn(`Missing bonus description for offer ${offer.id}`);
    }
    if (!offer.bonus.requirements?.description) {
      console.warn(`Missing bonus requirements for offer ${offer.id}`);
    }

    // Validate value
    if (offer.value === 0) {
      console.warn(`Zero value for offer ${offer.id}`);
    }
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

  private estimateStockValue(numStocks: number, company?: string): number {
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

    const companyValue = company
      ? Object.entries(stockValues).find(([key]) =>
          company.toLowerCase().includes(key)
        )?.[1] || stockValues.default
      : stockValues.default;

    return Math.round(numStocks * companyValue * 100) / 100;
  }

  // Add a method to handle tiered requirements
  private extractTieredRequirements(): { tier: string; requirements: string }[] {
    const tiers: { tier: string; requirements: string }[] = [];

    // Look for recurring/escalating bonus patterns in the content
    const bonusSection = this.$('div:contains("Bonus Details")').first();
    if (bonusSection.length) {
      const bonusText = bonusSection.nextAll().slice(0, 3).text();

      // Pattern for escalating bonuses with specific periods
      const escalatingPattern =
        /\$(\d+(?:,\d+)?)\s*(?:for|in|during)\s+(?:days?\s+)?(\d+)-(\d+)(?:\s*,\s*\$(\d+(?:,\d+)?)\s*(?:for|in|during)\s+(?:days?\s+)?(\d+)-(\d+))*(?:\s*,\s*\$(\d+(?:,\d+)?)\s*(?:for|in|during)\s+(?:days?\s+)?(\d+)-(\d+))*(?:\s*,\s*\$(\d+(?:,\d+)?)\s*(?:for|in|during)\s+(?:days?\s+)?(\d+)-(\d+))*/i;

      const match = bonusText.match(escalatingPattern);
      if (match) {
        // Extract all bonus tiers
        const amounts = [match[1], match[4], match[7], match[10]].filter(Boolean);
        const periods = [
          [match[2], match[3]],
          [match[5], match[6]],
          [match[8], match[9]],
          [match[11], match[12]],
        ].filter((period) => period[0] && period[1]);

        // Create tier entries for each period
        amounts.forEach((amount, index) => {
          if (periods[index]) {
            tiers.push({
              tier: `$${this.normalizeAmount(amount)}`,
              requirements: `Complete requirements during days ${periods[index][0]}-${periods[index][1]}`,
            });
          }
        });
      }

      // Pattern for recurring requirements with same bonus
      const recurringPattern =
        /(?:receive|get|earn)\s+(?:direct\s+deposits?)\s+(?:totaling|of)\s+\$?(\d+(?:,\d+)?)\s+(?:and|&)?\s*(?:make|complete)\s+(\d+)\s+(?:debit\s+card\s+)?(?:purchases?|transactions?)\s+(?:in|within|during|every)\s+(\d+)\s+days?/i;

      const recurringMatch = bonusText.match(recurringPattern);
      if (recurringMatch) {
        const [depositAmount, transactions, period] = recurringMatch;
        tiers.push({
          tier: 'Recurring Requirements',
          requirements: `Receive direct deposits totaling $${this.normalizeAmount(depositAmount)} and make ${transactions} debit card purchases every ${period} days`,
        });
      }
    }

    // Look for tiered structure in tables (existing code)
    this.$('table').each((_, table) => {
      const $table = this.$(table);
      const headers = $table
        .find('tr:first-child th, tr:first-child td')
        .map((_, cell) => this.$(cell).text().toLowerCase().trim())
        .get();

      const isTierTable = headers.some(
        (h) => h.includes('tier') || h.includes('bonus') || h.includes('reward')
      );

      if (isTierTable) {
        $table.find('tr:not(:first-child)').each((_, row) => {
          const cells = this.$(row).find('td');
          if (cells.length >= 2) {
            const tierText = this.cleanText(cells.eq(0).text());
            const reqText = this.cleanText(cells.eq(1).text());

            if (tierText && reqText) {
              tiers.push({
                tier: tierText,
                requirements: reqText,
              });
            }
          }
        });
      }
    });

    // Look for tiered structure in lists (existing code)
    this.$('ul, ol').each((_, list) => {
      const $list = this.$(list);
      const items = $list.find('li');

      if (items.length >= 2) {
        let isTierList = false;
        const tierTexts: string[] = [];

        items.each((_, item) => {
          const text = this.$(item).text().toLowerCase();
          if (text.includes('tier') || text.match(/\$\d+.*bonus/)) {
            isTierList = true;
            tierTexts.push(this.cleanText(this.$(item).text()));
          }
        });

        if (isTierList) {
          tierTexts.forEach((text) => {
            const [tier, ...rest] = text.split(/:\s+/);
            if (rest.length > 0) {
              tiers.push({
                tier: tier.trim(),
                requirements: rest.join(': ').trim(),
              });
            }
          });
        }
      }
    });

    return tiers;
  }

  // Add new patterns for recurring requirements
  private recurringPatterns = [
    {
      pattern:
        /(?:receive|get|earn)\s+(?:direct\s+deposits?)\s+(?:totaling|of)\s+\$?(\d+(?:,\d+)?(?:\.\d{2})?k?)\s+(?:and|&)?\s*(?:make|complete)\s+(\d+)\s+(?:debit\s+card\s+)?(?:purchases?|transactions?)\s+(?:in|within|during|every)\s+(\d+)\s+days?/i,
      handler: (match: RegExpMatchArray) =>
        `Receive direct deposits totaling $${this.normalizeAmount(match[1])} and make ${match[2]} debit card purchases within ${match[3]} days`,
    },
    {
      pattern:
        /(?:continue|repeat|do)\s+this\s+(?:again|process)?\s+(?:in|for|during)\s+(?:successive|following|next)\s+(\d+)-day\s+periods?/i,
      handler: (match: RegExpMatchArray) =>
        `Requirements must be met in successive ${match[1]}-day periods`,
    },
    {
      pattern:
        /(?:escalating|increasing)\s+bonuses?\s+of\s+\$?(\d+)(?:\s*,\s*\$?(\d+)(?:\s*,\s*\$?(\d+)(?:\s*,\s*\$?(\d+))?)?)?/i,
      handler: (match: RegExpMatchArray) => {
        const amounts = [match[1], match[2], match[3], match[4]].filter(Boolean);
        return `Escalating bonuses of $${amounts.join(', $')}`;
      },
    },
  ];

  // Add new method to handle recurring requirements
  private extractRecurringRequirements(text: string): string {
    for (const { pattern, handler } of this.recurringPatterns) {
      const match = text.match(pattern);
      if (match) {
        return handler(match);
      }
    }
    return '';
  }

  // Add new method to separate ongoing rewards from sign-up bonuses
  private isOngoingReward(text: string): boolean {
    const ongoingPatterns = [
      /cash\s+back\s+matching/i,
      /doubles?\s+(?:all|your)\s+cash\s+back/i,
      /\d+%\s+(?:cash\s+back|rewards?)\s+on/i,
      /unlimited\s+(?:cash\s+back|rewards?)/i,
      /quarterly\s+(?:cash\s+back|rewards?)/i,
    ];

    return ongoingPatterns.some((pattern) => pattern.test(text));
  }

  private extractCashBackMatching(): string | null {
    const matchingPatterns = [
      /cash\s+back\s+match(?:ing)?\s+(?:for|at|during)\s+(?:the\s+)?first\s+year/i,
      /match(?:es|ing)?\s+all\s+cash\s+back\s+earned\s+(?:in|during)\s+(?:the\s+)?first\s+year/i,
      /dollar[-\s]for[-\s]dollar\s+match(?:ing)?\s+(?:of|on)\s+(?:all\s+)?cash\s+back/i,
      /doubles?\s+(?:all\s+)?(?:your\s+)?(?:cash\s+back|rewards)\s+(?:earned\s+)?(?:in|during)\s+(?:the\s+)?first\s+year/i,
    ];

    const content = this.$(
      'div:contains("Card Perks"), div:contains("Bonus Details")'
    ).text();
    for (const pattern of matchingPatterns) {
      const match = content.match(pattern);
      if (match) {
        return 'Cash back will be matched dollar-for-dollar at the end of the first year';
      }
    }
    return null;
  }
}
