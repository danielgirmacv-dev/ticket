import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import laravelClient, { Location, Profile } from '@/integrations/laravel/client';
import { toast } from 'sonner';
import { getApiErrorMessage } from '@/lib/api-error';

export type AppRole = 'super_admin' | 'admin' | 'technician' | 'requester';

export interface UserWithRole {
  id: string; // Profile ID
  user_id: number;
  name: string;
  email: string;
  avatar_url: string | null;
  department: string | null;
  location_id?: string | null;
  location?: Location | null;
  created_at: string;
  role: AppRole;
  status?: 'pending' | 'active' | 'rejected';
}

export function useUsers() {
  return useQuery({
    queryKey: ['users'],
    queryFn: async (): Promise<UserWithRole[]> => {
      const response = await laravelClient.get('/profiles');
      const profiles = response.data;

      return profiles.map((profile: Profile) => {
        const role = profile.user?.roles?.[0]?.name as AppRole || 'requester';
        return {
          id: profile.id,
          user_id: profile.user_id,
          name: profile.name,
          email: profile.email,
          avatar_url: profile.avatar_url,
          department: profile.department,
          location_id: profile.location_id,
          location: profile.location,
          created_at: profile.created_at,
          role: role,
          status: profile.user?.status || 'active'
        };
      });
    }
  });
}

interface CreateUserData {
  email: string;
  password: string;
  name: string;
  role: AppRole;
  department?: string;
  location_id?: string;
}

export function useCreateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateUserData) => {
      const response = await laravelClient.post('/users', {
        name: data.name,
        email: data.email,
        password: data.password,
        role: data.role,
        department: data.department || undefined,
        location_id: data.location_id || undefined,
      });

      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('User created successfully');
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, 'Failed to create user'));
    }
  });
}

export function useUpdateUserRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: AppRole }) => {
      // Note: userId here is actually the Profile ID based on how the UI uses it
      // We need to verify if the UI passes Profile ID or User ID.
      // Looking at useUsers mapping: id is Profile ID.
      // So userId passed here is likely Profile ID.

      await laravelClient.patch(`/profiles/${userId}/role`, {
        role
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('User role updated');
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, 'Failed to update user role'));
    }
  });
}
