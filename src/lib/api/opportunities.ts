import { FirestoreOpportunity } from '@/types/opportunity';

export async function getOpportunities(): Promise<FirestoreOpportunity[]> {
  const response = await fetch('/api/opportunities');
  if (!response.ok) {
    const errorText = await response.text();
    console.error('Failed to fetch opportunities:', response.status, errorText);
    throw new Error(`Failed to fetch opportunities: ${response.status} - ${errorText}`);
  }

  const opportunities = (await response.json()) as FirestoreOpportunity[];
  return opportunities;
}

export async function deleteOpportunity(id: string): Promise<void> {
  const response = await fetch(`/api/opportunities/${id}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Failed to delete opportunity:', response.status, errorText);
    throw new Error(`Failed to delete opportunity: ${response.status} - ${errorText}`);
  }
}

export async function getOpportunityById(id: string) {
  const response = await fetch(`/api/opportunities/${id}`);
  if (!response.ok) {
    const errorText = await response.text();
    console.error('Failed to fetch opportunity:', response.status, errorText);
    throw new Error(`Failed to fetch opportunity: ${response.status} - ${errorText}`);
  }

  const opportunity = (await response.json()) as FirestoreOpportunity;
  return opportunity;
}

export async function createOpportunity(data: Omit<FirestoreOpportunity, 'id'>) {
  const response = await fetch('/api/opportunities', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Failed to create opportunity:', response.status, errorText);
    throw new Error(`Failed to create opportunity: ${response.status} - ${errorText}`);
  }

  return response.json();
}

export async function updateOpportunity(id: string, data: Partial<FirestoreOpportunity>) {
  const response = await fetch(`/api/opportunities/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Failed to update opportunity:', response.status, errorText);
    throw new Error(`Failed to update opportunity: ${response.status} - ${errorText}`);
  }

  return response.json();
}
