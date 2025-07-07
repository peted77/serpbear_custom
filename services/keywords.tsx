import { useRouter, NextRouter } from 'next/router';
import toast from 'react-hot-toast';
import { useMutation, useQuery, useQueryClient } from 'react-query';

// Types
type UpdatePayload = {
  domainSettings: DomainSettings;
  domain: DomainType;
};

// Shared utilities
const createHeaders = () => ({
  'Content-Type': 'application/json',
  Accept: 'application/json',
});

function createFetchOptions(
  method: 'GET' | 'POST' | 'PUT' | 'DELETE',
  data?: Record<string, any>
): RequestInit {
  return {
    method,
    headers: createHeaders(),
    ...(data && { body: JSON.stringify(data) }),
  };
}

async function fetchWithHandling(
  url: string,
  options: RequestInit,
  router?: NextRouter
) {
  const res = await fetch(url, options);
  if (!res.ok) {
    if (res.status === 401 && router) router.push('/login');
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData?.error || res.statusText || 'Request failed');
  }
  return res.json();
}

// Fetch all domains
export async function fetchDomains(router: NextRouter, withStats: boolean): Promise<{ domains: DomainType[] }> {
  const url = `/api/domains${withStats ? '?withstats=true' : ''}`;
  return await fetchWithHandling(url, createFetchOptions('GET'), router);
}

// Fetch a single domain
export async function fetchDomain(router: NextRouter, domainName: string): Promise<{ domain: DomainType }> {
  if (!domainName) throw new Error('No Domain Name Provided!');
  const url = `/api/domain?domain=${encodeURIComponent(domainName)}`;
  return await fetchWithHandling(url, createFetchOptions('GET'), router);
}

// Fetch domain screenshot and cache to localStorage
export async function fetchDomainScreenshot(domain: string, screenshotKey: string, forceFetch = false): Promise<string | false> {
  if (typeof window === 'undefined') return false;

  const cached = localStorage.getItem('domainThumbs');
  const domainThumbs = cached ? JSON.parse(cached) : {};

  if (!domainThumbs[domain] || forceFetch) {
    try {
      const screenshotURL = `https://image.thum.io/get/auth/${screenshotKey}/maxAge/96/width/200/https://${domain}`;
      const res = await fetch(screenshotURL);
      if (!res.ok) return false;
      const blob = await res.blob();

      const reader = new FileReader();
      const result = await new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });

      domainThumbs[domain] = result;
      localStorage.setItem('domainThumbs', JSON.stringify(domainThumbs));
      return result;
    } catch {
      return false;
    }
  }

  return domainThumbs[domain];
}

// React Query Hooks

export function useFetchDomains(router: NextRouter, withStats = false) {
  return useQuery(['domains', withStats], () => fetchDomains(router, withStats), {
    retry: false,
  });
}

export function useFetchDomain(router: NextRouter, domainName: string, onSuccess?: (domain: DomainType) => void) {
  return useQuery(['domain', domainName], () => fetchDomain(router, domainName), {
    enabled: !!domainName,
    retry: false,
    onSuccess: (data) => {
      console.log('Domain Loaded:', data.domain);
      onSuccess?.(data.domain);
    },
  });
}

export function useAddDomain(onSuccess?: () => void) {
  const router = useRouter();
  const queryClient = useQueryClient();

  return useMutation(
    async (domains: string[]) => {
      const url = '/api/domains';
      const options = createFetchOptions('POST', { domains });
      return await fetchWithHandling(url, options);
    },
    {
      onSuccess: (data) => {
        const newDomains: DomainType[] = data.domains;
        const singleDomain = newDomains.length === 1;

        toast.success(
          singleDomain
            ? `Domain "${newDomains[0].domain}" added successfully!`
            : `${newDomains.length} domains added successfully!`,
          { id: 'domain-add-success' }
        );

        onSuccess?.();

        if (singleDomain) {
          router.push(`/domain/${newDomains[0].slug}`);
        }

        queryClient.invalidateQueries(['domains']);
      },
      onError: () => {
        console.error('Error Adding New Domain');
        toast.error('Error Adding New Domain', { id: 'domain-add-error' });
      },
    }
  );
}

export function useUpdateDomain(onSuccess?: () => void) {
  const queryClient = useQueryClient();

  return useMutation(
    async ({ domainSettings, domain }: UpdatePayload) => {
      const url = `/api/domains?domain=${encodeURIComponent(domain.domain)}`;
      const options = createFetchOptions('PUT', domainSettings);
      return await fetchWithHandling(url, options);
    },
    {
      onSuccess: () => {
        toast.success('Settings Updated!', { id: 'domain-update-success' });
        onSuccess?.();
        queryClient.invalidateQueries(['domains']);
      },
      onError: (error) => {
        console.error('Error Updating Domain Settings:', error);
        toast.error('Error Updating Domain Settings', { id: 'domain-update-error' });
      },
    }
  );
}

export function useDeleteDomain(onSuccess?: () => void) {
  const queryClient = useQueryClient();

  return useMutation(
    async (domain: DomainType) => {
      const url = `/api/domains?domain=${encodeURIComponent(domain.domain)}`;
      return await fetchWithHandling(url, createFetchOptions('DELETE'));
    },
    {
      onSuccess: () => {
        toast.success('Domain Removed Successfully!', { id: 'domain-delete-success' });
        onSuccess?.();
        queryClient.invalidateQueries(['domains']);
      },
      onError: () => {
        console.error('Error Removing Domain');
        toast.error('Error Removing Domain', { id: 'domain-delete-error' });
      },
    }
  );
}
