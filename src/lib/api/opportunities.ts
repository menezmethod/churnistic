import { FirestoreOpportunity } from '@/types/opportunity';

const API_BASE_URL = '/api/opportunities';

export async function getOpportunities(): Promise<FirestoreOpportunity[]> {
  const response = await fetch(API_BASE_URL);
  if (!response.ok) {
    throw new Error('Failed to fetch opportunities');
  }
  const data = await response.json();
  return data.opportunities || [];
}

export async function createOpportunity(
  opportunity: Omit<FirestoreOpportunity, 'id'>
): Promise<FirestoreOpportunity> {
  const response = await fetch(API_BASE_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(opportunity),
  });
  if (!response.ok) {
    throw new Error('Failed to create opportunity');
  }
  return response.json();
}

export async function updateOpportunity(
  id: string,
  data: Partial<FirestoreOpportunity>
): Promise<FirestoreOpportunity> {
  const response = await fetch(`${API_BASE_URL}/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    throw new Error('Failed to update opportunity');
  }
  return response.json();
}

export async function deleteOpportunity(id: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/${id}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    throw new Error('Failed to delete opportunity');
  }
}

export async function getOpportunityById(id: string): Promise<FirestoreOpportunity> {
  const response = await fetch(`${API_BASE_URL}/${id}`);
  if (!response.ok) {
    throw new Error('Failed to fetch opportunity');
  }
  return response.json();
}