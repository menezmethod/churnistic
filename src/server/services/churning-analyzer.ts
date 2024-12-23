// Third-party dependencies
import { Groq } from 'groq-sdk';

// Internal dependencies
import { RedditAPI } from '../api/reddit';

// Types
interface RedditThread {
  id: string;
  title: string;
  selftext: string;
}

interface RedditComment {
  body: string;
}

export interface ChurningAnalysis {
  creditCardOpportunities: {
    signupBonuses: string[];
    strategies: string[];
    redemptions: string[];
  };
  bankAccountOpportunities: {
    bonuses: string[];
    requirements: string[];
    tips: string[];
  };
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

  private truncateText(text: string, maxLength: number = 1000): string {
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength) + '...';
  }

  private formatThreadData(threads: RedditThread[], comments: RedditComment[][]): string {
    let formattedData = '';
    for (let i = 0; i < Math.min(3, threads.length); i++) {
      const thread = threads[i];
      formattedData += `Thread ${i + 1}:\n`;
      formattedData += `Title: ${thread.title}\n`;
      formattedData += `Content: ${this.truncateText(thread.selftext)}\n`;

      if (comments[i] && comments[i].length > 0) {
        formattedData += 'Top Comments:\n';
        comments[i].forEach((comment, idx) => {
          formattedData += `Comment ${idx + 1}: ${this.truncateText(comment.body, 500)}\n`;
        });
      }
      formattedData += '\n';
    }
    return formattedData;
  }

  async analyzeThreads(): Promise<ChurningAnalysis> {
    try {
      // Get weekly threads
      const threads = await this.redditApi.getWeeklyThreads();
      if (!threads.length) {
        throw new Error('No weekly threads found to analyze.');
      }

      // Get comments for each thread
      const comments = await Promise.all(
        threads.slice(0, 3).map((thread) => this.redditApi.getPostComments(thread.id))
      );

      // Format the data
      const formattedData = this.formatThreadData(threads, comments);

      // Get analysis from Groq
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
        model: 'llama-3.1-8b-instant',
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

      // Split content into sections and parse
      const sections = content.split(/\d+\.\s+/);
      sections.forEach((section) => {
        if (section.includes('Credit Card Opportunities')) {
          const lines = section.split('\n');
          lines.forEach((line) => {
            if (line.includes('Signup Bonus')) {
              analysis.creditCardOpportunities.signupBonuses.push(
                line.replace(/^[^:]+:\s*/, '')
              );
            } else if (line.includes('Application Strateg')) {
              analysis.creditCardOpportunities.strategies.push(
                line.replace(/^[^:]+:\s*/, '')
              );
            } else if (line.includes('Redemption')) {
              analysis.creditCardOpportunities.redemptions.push(
                line.replace(/^[^:]+:\s*/, '')
              );
            }
          });
        } else if (section.includes('Bank Account Opportunities')) {
          const lines = section.split('\n');
          lines.forEach((line) => {
            if (line.includes('Bonus')) {
              analysis.bankAccountOpportunities.bonuses.push(
                line.replace(/^[^:]+:\s*/, '')
              );
            } else if (line.includes('Requirement')) {
              analysis.bankAccountOpportunities.requirements.push(
                line.replace(/^[^:]+:\s*/, '')
              );
            } else if (line.includes('Tip') || line.includes('Strateg')) {
              analysis.bankAccountOpportunities.tips.push(line.replace(/^[^:]+:\s*/, ''));
            }
          });
        } else if (section.includes('Actionable Opportunities')) {
          const lines = section.split('\n');
          lines.forEach((line) => {
            if (line.trim() && !line.includes('Actionable Opportunities')) {
              analysis.actionableOpportunities.push(line.trim());
            }
          });
        }
      });

      return analysis;
    } catch (error) {
      console.error('Error analyzing churning data:', error);
      throw error;
    }
  }
}
