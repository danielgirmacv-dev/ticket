import { useQuery } from '@tanstack/react-query';
import laravelClient, { Profile } from '@/integrations/laravel/client';
import { toast } from 'sonner';

export function useProfilesByLocation(locationId?: string) {
  return useQuery({
    queryKey: ['profiles', 'byLocation', locationId],
    queryFn: async (): Promise<Profile[]> => {
      const response = await laravelClient.get(`/locations/${locationId}/profiles`);
      return response.data;
    },
    enabled: !!locationId,
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to load profiles for location');
    }
  });
}
