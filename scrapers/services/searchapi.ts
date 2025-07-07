import countries from '../../utils/countries';

// ✅ Define input type for clarity and safety
interface KeywordInput {
  keyword: string;
  country?: string;
  city?: string;
  device?: string;
  engine?: string;
}

interface SearchApiResult {
  title: string;
  link: string;
  position: number;
}

const searchapi: ScraperSettings = {
  id: 'searchapi',
  name: 'SearchApi.io',
  website: 'searchapi.io',
  allowsCity: true,

  // ✅ FIXED: Typo in "scraping_api"
  headers: (keyword: KeywordInput, settings) => ({
    'Content-Type': 'application/json',
    Authorization: `Bearer ${settings.scraping_api}`,
  }),

  scrapeURL: (keyword: KeywordInput) => {
    // ✅ FIXED: Safe country code fallback
    const country = keyword.country || 'US';
    const countryName = countries[country]?.[0] || '';

    // ✅ FIXED: Device fallback
    const device = keyword.device || 'desktop';

    // ✅ ENHANCEMENT: Support optional city & location
    const location = keyword.city && countryName
      ? `&location=${encodeURIComponent(`${keyword.city},${countryName}`)}`
      : '';

    // ✅ ENHANCEMENT: Engine can be made configurable
    const engine = keyword.engine || 'google';

    return `https://www.searchapi.io/api/v1/search?engine=${engine}&q=${encodeURIComponent(
      keyword.keyword
    )}&num=100&gl=${country}&device=${device}${location}`;
  },

  resultObjectKey: 'organic_results',

  // ✅ FIXED: Safely parse and access `organic_results` only
  serpExtractor: (content) => {
    const extractedResult = [];

    const parsed = typeof content === 'string' ? JSON.parse(content) : content;
    const results: SearchApiResult[] = Array.isArray(parsed?.organic_results)
      ? parsed.organic_results
      : [];

    for (const { link, title, position } of results) {
      if (title && link) {
        extractedResult.push({
          title,
          url: link,
          position,
        });
      }
    }

    return extractedResult;
  },
};

export default searchapi;
