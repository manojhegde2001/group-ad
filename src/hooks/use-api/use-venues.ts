import { useQuery } from '@tanstack/react-query';
import { venueService } from '@/services/api/venues';

export const useVenues = (city?: string) => {
  return useQuery({
    queryKey: ['venues', { city }],
    queryFn: () => venueService.getVenues(city),
  });
};
