import { NextResponse } from 'next/server';

interface BankRewardsResponse {
  id: string;
  data: Record<string, unknown>;
}

export async function GET(request: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  try {
    const response = await fetch(
      `${process.env.BANKREWARDS_API_URL}/offers/${params.id}`,
      {
        headers: {
          'x-api-key': process.env.BANKREWARDS_API_KEY || '',
        },
      }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch opportunity');
    }

    const data: BankRewardsResponse = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An error occurred';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
