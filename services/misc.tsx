import { useQuery } from 'react-query';

type GitHubRelease = {
  tag_name: string;
  name: string;
  body: string;
  published_at: string;
  html_url: string;
};

export async function fetchChangelog(): Promise<GitHubRelease[]> {
  const res = await fetch('https://api.github.com/repos/towfiqi/serpbear/releases');

  if (!res.ok) {
    throw new Error(`GitHub API error: ${res.status} ${res.statusText}`);
  }

  const data = await res.json();
  if (!Array.isArray(data)) {
    throw new Error('Unexpected GitHub API response format');
  }

  return data;
}

export function useFetchChangelog() {
  return useQuery(['changelog'], fetchChangelog, {
    staleTime: 60 * 60 * 1000, // 1 hour
    cacheTime: 2 * 60 * 60 * 1000,
    retry: 1,
  });
}
