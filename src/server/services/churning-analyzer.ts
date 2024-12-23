// Third-party dependencies
import { Groq } from 'groq-sdk';

// Internal dependencies
import { RedditAPI, RedditPost, RedditComment } from '../api/reddit';

// Constants
const MAX_TEXT_LENGTH = 1000;
const MAX_COMMENT_LENGTH = 500;
const MAX_THREADS_TO_ANALYZE = 3;
const MODEL_NAME = 'llama-3.1-8b-instant';

// Types
export interface CreditCardOpportunities {
  signupBonuses: string[];
  strategies: string[];
  redemptions: string[];
}

export interface BankAccountOpportunities {
  bonuses: string[];
  requirements: string[];
  tips: string[];
}

export interface ChurningAnalysis {
  creditCardOpportunities: CreditCardOpportunities;
  bankAccountOpportunities: BankAccountOpportunities;
  actionableOpportunities: string[];
}

export class ChurningAnalyzer {
  private groq: Groq;
  private redditApi: RedditAPI;

  constructor() {
    if (!process.env.GROQ_API_KEY) {
      throw new Error('Groq API key not configured');
    }
    this.groq = new Groq({
      apiKey: process.env.GROQ_API_KEY,
    });
    this.redditApi = new RedditAPI();
  }

  private truncateText(text: string, maxLength: number = MAX_TEXT_LENGTH): string {
    if (!text) return '';
    return text.length <= maxLength ? text : `${text.slice(0, maxLength)}...`;
  }

  private formatThreadData(threads: RedditPost[], comments: RedditComment[][]): string {
    let formattedData = '';

    for (let i = 0; i < Math.min(MAX_THREADS_TO_ANALYZE, threads.length); i++) {
      const thread = threads[i];
      formattedData += `Thread ${i + 1}:\n`;
      formattedData += `Title: ${thread.title}\n`;
      formattedData += `Content: ${this.truncateText(thread.selftext)}\n`;

      if (comments[i]?.length > 0) {
        formattedData += 'Top Comments:\n';
        comments[i].forEach((comment, idx) => {
          formattedData += `Comment ${idx + 1}: ${this.truncateText(
            comment.body,
            MAX_COMMENT_LENGTH
          )}\n`;
        });
      }
      formattedData += '\n';
    }

    return formattedData;
  }

  private parseAnalysisResponse(content: string): ChurningAnalysis {
    const analysis: ChurningAnalysis = {
      creditCardOpportunities: {
        signupBonuses: [],
        strategies: [],
        redemptions: [],
      },
      bankAccountOpportunities: {
        bonuses: [],
        requirements: [],
        tips: [],
      },
      actionableOpportunities: [],
    };

    const sections = content.split(/\d+\.\s+/);
    sections.forEach((section) => {
      const lines = section.split('\n');

      if (section.includes('Credit Card Opportunities')) {
        lines.forEach((line) => {
          const cleanLine = line.replace(/^[^:]+:\s*/, '').trim();
          if (!cleanLine) return;

          if (line.includes('Signup Bonus')) {
            analysis.creditCardOpportunities.signupBonuses.push(cleanLine);
          } else if (line.includes('Application Strateg')) {
            analysis.creditCardOpportunities.strategies.push(cleanLine);
          } else if (line.includes('Redemption')) {
            analysis.creditCardOpportunities.redemptions.push(cleanLine);
          }
        });
      } else if (section.includes('Bank Account Opportunities')) {
        lines.forEach((line) => {
          const cleanLine = line.replace(/^[^:]+:\s*/, '').trim();
          if (!cleanLine) return;

          if (line.includes('Bonus')) {
            analysis.bankAccountOpportunities.bonuses.push(cleanLine);
          } else if (line.includes('Requirement')) {
            analysis.bankAccountOpportunities.requirements.push(cleanLine);
          } else if (line.includes('Tip') || line.includes('Strateg')) {
            analysis.bankAccountOpportunities.tips.push(cleanLine);
          }
        });
      } else if (section.includes('Actionable Opportunities')) {
        lines.forEach((line) => {
          const cleanLine = line.trim();
          if (cleanLine && !cleanLine.includes('Actionable Opportunities')) {
            analysis.actionableOpportunities.push(cleanLine);
          }
        });
      }
    });

    return analysis;
  }

  async analyzeThreads(): Promise<ChurningAnalysis> {
    try {
      // Get weekly threads
      console.log('Fetching weekly threads...');
      const threads = await this.redditApi.getWeeklyThreads();
      if (!threads.length) {
        throw new Error('No weekly threads found to analyze.');
      }

      // Get comments for each thread
      console.log('Fetching comments for threads...');
      const comments = await Promise.all(
        threads
          .slice(0, MAX_THREADS_TO_ANALYZE)
          .map((thread) => this.redditApi.getPostComments(thread.id))
      );

      // Format the data
      console.log('Formatting thread data for analysis...');
      const formattedData = this.formatThreadData(threads, comments);

      // Get analysis from Groq
      console.log('Requesting analysis from Groq...');
      const chatCompletion = await this.groq.chat.completions.create({
        messages: [
          {
            role: 'system',
            content:
              'You are a credit card and bank account churning expert. Analyze the provided data and extract specific opportunities, focusing on actionable insights and recent trends. Format your response in a structured way with clear sections for credit cards and bank accounts.',
          },
          {
            role: 'user',
            content: `Please analyze the following churning data and provide a detailed summary of credit card and bank account opportunities. Structure your response with the following sections:

1. Credit Card Opportunities:
   - Signup Bonuses: List specific card offers with bonus amounts
   - Application Strategies: Tips for approval and timing
   - Notable Redemptions: Successful point redemption examples

2. Bank Account Opportunities:
   - Available Bonuses: Current bank account offers
   - Requirements: Key requirements for each bonus
   - Tips & Strategies: How to maximize success

3. Actionable Opportunities:
   - Time-sensitive offers
   - Best current opportunities
   - Important deadlines

Here's the data to analyze:

${formattedData}`,
          },
        ],
        model: MODEL_NAME,
        temperature: 0.5,
        max_tokens: 2000,
        top_p: 1,
        stream: false,
      });

      const content = chatCompletion.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No analysis available from Groq');
      }

      // Parse the response into structured format
      console.log('Parsing analysis response...');
      const analysis = this.parseAnalysisResponse(content);

      return analysis;
    } catch (error) {
      console.error('Error analyzing churning data:', error);
      throw error;
    }
  }
}
