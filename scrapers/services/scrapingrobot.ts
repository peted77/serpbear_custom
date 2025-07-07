const scrapingRobot: ScraperSettings = {
  id: 'scrapingrobot',
  name: 'Scraping Robot',
  website: 'scrapingrobot.com',

  scrapeURL: (keyword, settings, countryData) => {
    const country = keyword.country || 'US';
    const device = keyword.device === 'mobile' ? '&mobile=true' : '';
    const lang = countryData?.[country]?.[2] || 'en';
    const query = encodeURIComponent(keyword.keyword);

    // ✅ Improved query string with better context
    const searchUrl = `https://www.google.com/search?num=100&hl=${lang}&gl=${country}&pws=0&safe=off&q=${query}`;
    const encodedUrl = encodeURIComponent(searchUrl);

    // ✅ Fixed typo and better formatting
    return `https://api.scrapingrobot.com/?token=${settings.scraping_api}&proxyCountry=${country}&render=false${device}&url=${encodedUrl}`;
  },

  resultObjectKey: 'result',
};

export default scrapingRobot;
