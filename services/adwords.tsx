import { NextRouter } from 'next/router';
import toast from 'react-hot-toast';
import { useMutation, useQuery, useQueryClient } from 'react-query';

// ✅ Shared fetch helper
async function fetchWithHandling(url: string, options: RequestInit, router?: NextRouter) {
  try {
    const res = await fetch(url, options);

    if (!res.ok) {
      if (res.status === 401 && router) {
        console.warn('Unauthorized');
        router.push('/login');
      }

      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData?.error || res.statusText || 'Request failed');
    }

    return res.json();
  } catch (err) {
    throw err;
  }
}

// ✅ Shared headers
function createHeaders() {
  return {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };
}

// ✅ Shared fetch options builder
function createFetchOptions(method: 'POST' | 'PUT', data: Record<string, any>): RequestInit {
  return {
    method,
    headers: createHeaders(),
    body: JSON.stringify(data),
  };
}

// ✅ Mutation: Test Google Ads integration
export function useTestAdwordsIntegration(onSuccess?: () => void) {
  return useMutation(
    async (payload: { developer_token: string; account_id: string }) => {
      const url = `${window.location.origin}/api/adwords`;
      const options = createFetchOptions('POST', payload);
      return await fetchWithHandling(url, options);
    },
    {
      onSuccess: (data) => {
        console.log('Google Ads integrated:', data);
        toast.success('Google Ads has been integrated successfully!', { id: 'ads-success' });
        onSuccess?.();
      },
      onError: (error) => {
        console.error('Integration error:', error);
        toast.error('Failed to connect to Google Ads. Check your API credentials.', { id: 'ads-error' });
      },
    }
  );
}

// ✅ API: Fetch keyword ideas
export async function fetchAdwordsKeywordIdeas(router: NextRouter, domainSlug: string) {
  if (!domainSlug) throw new Error('Missing domain');

  const url = `${window.location.origin}/api/ideas?domain=${encodeURIComponent(domainSlug)}`;
  return await fetchWithHandling(url, { method: 'GET', headers: createHeaders() }, router);
}

// ✅ Query: Get keyword ideas
export function useFetchKeywordIdeas(router: NextRouter, adwordsConnected = false) {
  const isResearch = router.pathname === '/research';
  const domainSlug = isResearch ? 'research' : String(router.query.slug || '');
  const enabled = adwordsConnected && !!domainSlug;

  return useQuery(
    [`keywordIdeas-${domainSlug}`],
    () => fetchAdwordsKeywordIdeas(router, domainSlug),
    { enabled, retry: false }
  );
}

// ✅ Mutation: Add keyword ideas
export function useMutateKeywordIdeas(router: NextRouter, onSuccess?: () => void) {
  const queryClient = useQueryClient();
  const domainSlug = router.pathname === '/research' ? 'research' : String(router.query.slug || '');

  return useMutation(
    async (data: Record<string, any>) => {
      const url = `${window.location.origin}/api/ideas`;
      const options = createFetchOptions('POST', data);
      return await fetchWithHandling(url, options);
    },
    {
      onSuccess: (data) => {
        console.log('Keyword ideas added:', data);
        toast.success('Keyword ideas loaded successfully!', { id: 'add-ideas-success' });
        onSuccess?.();
        queryClient.invalidateQueries([`keywordIdeas-${domainSlug}`]);
      },
      onError: (error) => {
        console.error('Error adding keyword ideas:', error);
        toast.error('Error adding keyword ideas.', { id: 'add-ideas-error' });
      },
    }
  );
}

// ✅ Mutation: Favorite a keyword idea
export function useMutateFavKeywordIdeas(router: NextRouter, onSuccess?: () => void) {
  const queryClient = useQueryClient();
  const domainSlug = router.pathname === '/research' ? 'research' : String(router.query.slug || '');

  return useMutation(
    async (payload: Record<string, any>) => {
      const url = `${window.location.origin}/api/ideas`;
      const options = createFetchOptions('PUT', payload);
      return await fetchWithHandling(url, options);
    },
    {
      onSuccess: (data) => {
        console.log('Keyword favorited:', data);
        onSuccess?.();
        queryClient.invalidateQueries([`keywordIdeas-${domainSlug}`]);
      },
      onError: (error) => {
        console.error('Error favoriting keyword:', error);
        toast.error('Error favoriting keyword.', { id: 'fav-keyword-error' });
      },
    }
  );
}

// ✅ Mutation: Get keyword volume
export function useMutateKeywordsVolume(onSuccess?: () => void) {
  const queryClient = useQueryClient();

  return useMutation(
    async (data: Record<string, any>) => {
      const url = `${window.location.origin}/api/volume`;
      const options = createFetchOptions('POST', data);
      return await fetchWithHandling(url, options);
    },
    {
      onSuccess: () => {
        toast.success('Keyword volume loaded. Refreshing…', { id: 'volume-success' });
        onSuccess?.();
        queryClient.invalidateQueries(['keywordVolume']);
        setTimeout(() => {
          window.location.reload(); // Optional: replace with soft refresh
        }, 3000);
      },
      onError: (error) => {
        console.error('Volume fetch error:', error);
        toast.error('Error loading keyword volume.', { id: 'volume-error' });
      },
    }
  );
}
