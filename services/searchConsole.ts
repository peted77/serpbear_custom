import { NextRouter } from 'next/router';
import { useQuery } from 'react-query';

// ✅ Shared fetch logic
async function fetchWithHandling(path: string, router: NextRouter) {
  const res = await fetch(path);
  if (!res.ok) {
    if (res.status === 401) {
      console.warn('Unauthorized');
      router.push('/login');
    }
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData?.error || res.statusText || 'Request failed');
  }
  return res.json();
}

// ✅ Keyword fetch with safe input
export async function fetchSCKeywords(router: NextRouter) {
  const slug = router.query.slug;
  if (typeof slug !== 'string') throw new Error('Invalid domain slug');
  const url = `/api/searchconsole?domain=${encodeURIComponent(slug)}`;
  return fetchWithHandling(url, router);
}

export function useFetchSCKeywords(router: NextRouter, domainLoaded = false) {
  return useQuery(['sckeywords', router.query.slug], () => fetchSCKeywords(router), {
    enabled: domainLoaded && typeof router.query.slug === 'string',
    retry: false,
  });
}

// ✅ Insight fetch with safe input
export async function fetchSCInsight(router: NextRouter) {
  const slug = router.query.slug;
  if (typeof slug !== 'string') throw new Error('Invalid domain slug');
  const url = `/api/insight?domain=${encodeURIComponent(slug)}`;
  return fetchWithHandling(url, router);
}

export function useFetchSCInsight(router: NextRouter, domainLoaded = false) {
  return useQuery(['scinsight', router.query.slug], () => fetchSCInsight(router), {
    enabled: domainLoaded && typeof router.query.slug === 'string',
    retry: false,
  });
}
