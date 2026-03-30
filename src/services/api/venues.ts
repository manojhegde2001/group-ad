import { apiClient } from '@/lib/api-client';

export interface Venue {
  id: string;
  name: string;
  city: string;
  state: string;
}

export const venueService = {
  getVenues: (city?: string) => {
    const url = city ? `/api/venues?city=${encodeURIComponent(city)}` : '/api/venues';
    return apiClient.get<{ venues: Venue[]; count: number }>(url);
  },
};
