import { useQuery } from '@tanstack/react-query';
import laravelClient, { Profile } from '@/integrations/laravel/client';
import { toast } from 'sonner';
import { getApiErrorMessage } from '@/lib/api-error';

export function useProfilesByLocation(locationId?: string) {
  return useQuery<Profile[], Error>({
    queryKey: ['profiles', 'byLocation', locationId],
    queryFn: async (): Promise<Profile[]> => {
      try {
        const response = await laravelClient.get(`/locations/${locationId}/profiles`);
        return response.data;
      } catch (error) {
        toast.error(getApiErrorMessage(error, 'Failed to load profiles for location'));
        throw error;
      }
    },
    enabled: !!locationId,
  });
}
