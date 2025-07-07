import toast from 'react-hot-toast';
import { useMutation, useQuery, useQueryClient } from 'react-query';

// ✅ Centralized fetch error handling
async function fetchWithHandling(
  input: RequestInfo,
  init?: RequestInit
): Promise<any> {
  const res = await fetch(input, init);
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData?.error || res.statusText || 'Request failed');
  }
  return res.json();
}

// ✅ Fetch settings
export async function fetchSettings() {
  return fetchWithHandling('/api/settings');
}

export function useFetchSettings() {
  return useQuery(['settings'], fetchSettings, {
    staleTime: 60 * 1000,
    retry: 1,
  });
}

// ✅ Update settings
export const useUpdateSettings = (onSuccess?: () => void) => {
  const queryClient = useQueryClient();

  return useMutation(
    async (settings: SettingsType) => {
      return fetchWithHandling('/api/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({ settings }),
      });
    },
    {
      onSuccess: () => {
        toast.success('Settings Updated!', { icon: '✔️', id: 'settings-update-success' });
        onSuccess?.();
        queryClient.invalidateQueries(['settings']);
      },
      onError: () => {
        console.error('Error Updating App Settings');
        toast.error('Error Updating App Settings.', { icon: '⚠️', id: 'settings-update-error' });
      },
    }
  );
};

// ✅ Clear failed queue
export function useClearFailedQueue(onSuccess: () => void) {
  const queryClient = useQueryClient();

  return useMutation(
    async () =>
      fetchWithHandling('/api/clearfailed', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
      }),
    {
      onSuccess: () => {
        toast.success('Failed Queue Cleared', { icon: '✔️', id: 'queue-clear' });
        onSuccess();
        queryClient.invalidateQueries(['settings']);
      },
      onError: () => {
        console.error('Error Clearing Failed Queue');
        toast.error('Error Clearing Failed Queue.', { icon: '⚠️', id: 'queue-clear-error' });
      },
    }
  );
}

// ✅ Fetch DB migration status
export async function fetchMigrationStatus() {
  return fetchWithHandling('/api/dbmigrate');
}

export function useCheckMigrationStatus() {
  return useQuery(['dbmigrate'], fetchMigrationStatus, {
    staleTime: 60 * 1000,
    retry: 1,
  });
}

// ✅ Run DB migration
export const useMigrateDatabase = (onSuccess?: (res?: any) => void) => {
  const queryClient = useQueryClient();

  return useMutation(
    async () => fetchWithHandling('/api/dbmigrate', { method: 'POST' }),
    {
      onSuccess: (res) => {
        toast.success('Database Updated!', { icon: '✔️', id: 'db-update' });
        onSuccess?.(res);
        queryClient.invalidateQueries(['settings']);
      },
      onError: () => {
        console.error('Error Updating Database');
        toast.error('Error Updating Database.', { icon: '⚠️', id: 'db-update-error' });
      },
    }
  );
};
