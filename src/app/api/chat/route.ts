import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// Schema for request validation
const chatRequestSchema = z.object({
  question: z.string().min(1, 'Question is required').max(1000, 'Question is too long'),
});

// Environment variables
const CHAT_API_URL = process.env.NEXT_PUBLIC_CHAT_API_URL;

if (!CHAT_API_URL) {
  console.warn(
    'Warning: NEXT_PUBLIC_CHAT_API_URL is not defined. Chat API will use mock responses.'
  );
}

const mockResponses: Record<string, string> = {
  bank: 'Based on current offers, Chase and Capital One have the best bank account bonuses right now. Chase is offering $300 for new checking accounts with direct deposit, while Capital One is offering $400 for new checking and savings accounts combined. Both require maintaining minimum balances for 90 days. Would you like more details on either of these offers?',
  credit:
    'The Chase Sapphire Preferred has an excellent welcome bonus of 60,000 points (worth about $750 in travel) after spending $4,000 in the first 3 months. The American Express Gold Card also has a strong offer of 60,000 points after $4,000 spend in 6 months, plus dining credits. Which card features are most important to you?',
  brokerage:
    'Several brokerages have competitive offers right now. Charles Schwab is offering $500 for accounts funded with $100,000+, while Fidelity offers 500 free trades with a new account funded at $100,000+. E*TRADE gives $600 cash for new accounts with $250,000+. Would you like me to explain any of these offers in more detail?',
};

/**
 * Mock implementation of chat API when actual API URL is not available
 */
async function mockChatResponse(question: string): Promise<Response> {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 1000));

  const lowerQuestion = question.toLowerCase();
  let response: string;

  if (lowerQuestion.includes('bank') || lowerQuestion.includes('bonus')) {
    response = mockResponses.bank;
  } else if (
    lowerQuestion.includes('credit card') ||
    lowerQuestion.includes('credit cards')
  ) {
    response = mockResponses.credit;
  } else if (lowerQuestion.includes('brokerage')) {
    response = mockResponses.brokerage;
  } else {
    response =
      "I can help you find the best financial offers across banks, credit cards, and brokerages. Could you provide more details about what specific type of offer you're looking for?";
  }

  return NextResponse.json({
    data: {
      response,
      metadata: {
        processed_at: new Date().toISOString(),
        processing_time: 0.89, // mock processing time
      },
    },
  });
}

export async function POST(req: NextRequest) {
  try {
    // Apply simple rate limiting in memory
    // For production, use a more robust solution like Redis

    // Parse request body
    const body = await req.json();
    const result = chatRequestSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        {
          error: 'Validation error',
          code: 'validation_error',
          details: result.error.format(),
          status: 400,
        },
        { status: 400 }
      );
    }

    const { question } = result.data;

    // If no API URL is configured, use mock implementation
    if (!CHAT_API_URL) {
      return mockChatResponse(question);
    }

    // Forward the request to the actual Chat API
    try {
      const response = await fetch(CHAT_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({ question }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Chat API responded with ${response.status}: ${errorText}`);
      }

      // Process the response from the external API
      const data = await response.json();

      // Return the processed data
      return NextResponse.json(data);
    } catch (error) {
      console.error('Error forwarding to Chat API:', error);
      return NextResponse.json(
        {
          error: 'Failed to process chat request',
          code: 'chat_api_error',
          status: 500,
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Unhandled error in chat API:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        code: 'internal_server_error',
        status: 500,
      },
      { status: 500 }
    );
  }
}
