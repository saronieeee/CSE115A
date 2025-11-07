export const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:4000/api';

export async function fetchClothingItems(params: {
  categories?: string[];
  query?: string;
  limit?: number;
  offset?: number;
}) {
  const searchParams = new URLSearchParams();
  
  if (params.categories?.length) {
    searchParams.set('categories', params.categories.join(','));
  }
  if (params.query?.trim()) {
    searchParams.set('q', params.query.trim());
  }
  if (params.limit) {
    searchParams.set('limit', params.limit.toString());
  }
  if (params.offset) {
    searchParams.set('offset', params.offset.toString());
  }

  const response = await fetch(`${API_BASE_URL}/clothing-items?${searchParams.toString()}`);
  if (!response.ok) {
    throw new Error(`API Error: ${response.status} ${response.statusText}`);
  }
  
  const data = await response.json();
  if (data.error) {
    throw new Error(data.error);
  }
  
  return data;
}

export async function updateClothingItem(id: string, updates: {
  favorite?: boolean;
  times_worn?: number;
  category?: string;
  color?: string;
  occasion?: string;
}) {
  const response = await fetch(`${API_BASE_URL}/clothing-items/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(updates),
  });

  if (!response.ok) {
    throw new Error(`API Error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  if (data.error) {
    throw new Error(data.error);
  }

  return data.item;
}