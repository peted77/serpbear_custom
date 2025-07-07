// scraper.ts (fully refactored with inline comments)

import axios, { AxiosResponse, CreateAxiosDefaults } from 'axios';
import * as cheerio from 'cheerio';
import { readFile, writeFile } from 'fs/promises';
import path from 'path';
import HttpsProxyAgent from 'https-proxy-agent';
import countries from './countries';
import allScrapers from '../scrapers/index';

// Types
interface SearchResult {
  title: string;
  url: string;
  position: number;
}

interface SERPObject {
  position: number;
  url: string;
}

export interface RefreshResult {
  ID: number;
  keyword: string;
  position: number;
  url: string;
  result: SearchResult[];
  error?: boolean | string;
}

// Fix: Renamed typo 'postion' -> 'position'

export const getScraperClient = (
  keyword: KeywordType,
  settings: SettingsType,
  scraper?: ScraperSettings
): Promise<AxiosResponse | Response> | false => {
  const headers: any = {
    'Content-Type': 'application/json',
    'User-Agent': keyword.device === 'mobile'
      ? 'Mozilla/5.0 (Linux; Android 10; ... Mobile Safari/537.36'
      : 'Mozilla/5.0 (Windows NT 10.0; ... Edge/12.246',
    Accept: 'application/json; charset=utf8;',
  };

  let apiURL = scraper?.scrapeURL?.(keyword, settings, countries);
  if (!apiURL) return false;

  const scraperHeaders = scraper?.headers?.(keyword, settings);
  if (scraperHeaders) {
    Object.entries(scraperHeaders).forEach(([k, v]) => headers[k] = v);
  }

  if (settings.scraper_type === 'proxy' && settings.proxy) {
    const proxies = settings.proxy.split(/\r?\n/).map(p => p.trim());
    const proxyURL = proxies[Math.floor(Math.random() * proxies.length)];

    const axiosConfig: CreateAxiosDefaults = {
      headers,
      httpsAgent: new (HttpsProxyAgent as any)(proxyURL),
      proxy: false,
    };

    const axiosClient = axios.create(axiosConfig);
    return axiosClient.get(`https://www.google.com/search?num=100&q=${encodeURIComponent(keyword.keyword)}`);
  }

  return fetch(apiURL, { method: 'GET', headers });
};

export const scrapeKeywordFromGoogle = async (
  keyword: KeywordType,
  settings: SettingsType
): Promise<RefreshResult | false> => {
  const scraper = allScrapers.find(s => s.id === settings.scraper_type);
  const client = getScraperClient(keyword, settings, scraper);

  if (!client) return false;

  let refreshed: RefreshResult = {
    ID: keyword.ID,
    keyword: keyword.keyword,
    position: keyword.position,
    url: keyword.url,
    result: keyword.lastResult,
    error: true,
  };

  try {
    const res = await client;
    const data = 'json' in res ? await (res as Response).json() : (res as AxiosResponse).data;

    const raw = scraper?.resultObjectKey && data?.[scraper.resultObjectKey] || data.html || data.results || '';
    const extracted = scraper?.serpExtractor?.(raw) || extractScrapedResult(raw, keyword.device);

    const serp = getSerp(keyword.domain, extracted);
    refreshed = { ...refreshed, position: serp.position, url: serp.url, result: extracted, error: false };
  } catch (err: any) {
    refreshed.error = err.message || 'Unknown Error';
    console.warn('[SCRAPER ERROR]', err);
  }

  return refreshed;
};

export const extractScrapedResult = (html: string, device: string): SearchResult[] => {
  const $ = cheerio.load(html);
  const result: SearchResult[] = [];

  let position = 0;
  $('h3').each((_, el) => {
    const title = $(el).text();
    const url = $(el).closest('a').attr('href');
    if (title && url) {
      position += 1;
      result.push({ title, url, position });
    }
  });

  if (result.length === 0 && device === 'mobile') {
    $('#rso div').each((_, el) => {
      const anchor = $(el).find('a[role="presentation"]');
      const title = anchor.find('[role="link"]').text();
      const url = anchor.attr('href');
      if (title && url) {
        position += 1;
        result.push({ title, url, position });
      }
    });
  }

  return result;
};

export const getSerp = (domainURL: string, result: SearchResult[]): SERPObject => {
  if (!domainURL || result.length === 0) return { position: 0, url: '' };

  const target = new URL(domainURL.includes('https://') ? domainURL : `https://${domainURL}`);

  for (const item of result) {
    const itemURL = new URL(item.url.includes('https://') ? item.url : `https://${item.url}`);
    if (itemURL.hostname === target.hostname && (target.pathname === '/' || itemURL.pathname === target.pathname)) {
      return { position: item.position, url: item.url };
    }
  }

  return { position: 0, url: '' };
};

export const retryScrape = async (id: number): Promise<void> => {
  if (!Number.isInteger(id)) return;

  const file = path.join(process.cwd(), 'data', 'failed_queue.json');
  const content = await readFile(file, 'utf-8').catch(() => '[]');
  const queue = new Set<number>(JSON.parse(content));

  queue.add(Math.abs(id));
  await writeFile(file, JSON.stringify([...queue]), 'utf-8');
};

export const removeFromRetryQueue = async (id: number): Promise<void> => {
  if (!Number.isInteger(id)) return;

  const file = path.join(process.cwd(), 'data', 'failed_queue.json');
  const content = await readFile(file, 'utf-8').catch(() => '[]');
  const queue = new Set<number>(JSON.parse(content));

  queue.delete(Math.abs(id));
  await writeFile(file, JSON.stringify([...queue]), 'utf-8');
};
