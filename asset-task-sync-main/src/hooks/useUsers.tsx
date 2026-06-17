import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import laravelClient, { Profile } from '@/integrations/laravel/client';
import { toast } from 'sonner';

export type AppRole = 'admin' | 'technician' | 'requester';

export interface UserWithRole {
  id: string; // Profile ID
  user_id: number;
  name: string;
  email: string;
  avatar_url: string | null;
  department: string | null;
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

      return profiles.map((profile: any) => {
        const role = profile.user?.roles?.[0]?.name as AppRole || 'requester';
        return {
          id: profile.id,
          user_id: profile.user_id,
          name: profile.name,
          email: profile.email,
          avatar_url: profile.avatar_url,
          department: profile.department,
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
}

export function useCreateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateUserData) => {
      // 1. Register the user
      const response = await laravelClient.post('/register', {
        name: data.name,
        email: data.email,
        password: data.password,
        password_confirmation: data.password,
      });

      const newUser = response.data.user;
      const profileId = newUser.profile.id;

      // 2. Update role if not requester (default)
      if (data.role !== 'requester') {
        await laravelClient.patch(`/profiles/${profileId}/role`, {
          role: data.role
        });
      }

      // 3. Update department if provided
      if (data.department) {
        await laravelClient.put(`/profiles/${profileId}`, {
          department: data.department
        });
      }

      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('User created successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create user');
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
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update user role');
    }
  });
}

