import { apiRequest } from './api';

export const postSuggestion = async (content: string): Promise<void> => {
  const res = await apiRequest('/suggestion/', {
    method: 'POST',
    body: JSON.stringify({ content }),
  });
  if (!res.ok) throw new Error('Nie udało się wysłać sugestii');
};
