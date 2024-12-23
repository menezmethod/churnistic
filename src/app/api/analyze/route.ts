// Third-party dependencies
import { Groq } from 'groq-sdk';

// Next.js dependencies
import { NextResponse } from 'next/server';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY!
});

export async function POST(request: Request) {
  try {
    const { content } = await request.json();

    if (!content) {
      return NextResponse.json({ error: 'Missing content' }, { status: 400 });
    }

    const prompt = `Analyze the following Reddit thread content and provide a summary in two sections:
1. Credit Card Trip Ideas: List any interesting credit card rewards trips or redemptions mentioned
2. Bank Account Bonuses: List any bank account signup bonuses or opportunities mentioned

Content to analyze:
${content}

Please provide the response in the following JSON format:
{
  "creditCardIdeas": ["idea 1", "idea 2", ...],
  "bankBonuses": ["bonus 1", "bonus 2", ...]
}

Keep each point concise and actionable. Focus only on the most valuable opportunities mentioned.`;

    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ],
      model: 'mixtral-8x7b-32768',
      temperature: 0.5,
      max_tokens: 2048,
    });

    const response = completion.choices[0]?.message?.content;
    if (!response) {
      throw new Error('No response from Groq');
    }

    // Parse the JSON response
    const summary = JSON.parse(response);
    return NextResponse.json(summary);
  } catch (error) {
    console.error('Analysis error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error analyzing content' },
      { status: 500 }
    );
  }
} 