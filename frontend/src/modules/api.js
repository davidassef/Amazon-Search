// API communication module
export class API {
  constructor(baseURL = undefined) {
    // Allow configuration via environment variable with fallback to '/api'
    const envBase = typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_BASE_URL
      ? import.meta.env.VITE_API_BASE_URL
      : undefined;
    this.baseURL = baseURL || envBase || '/api';
    this.COUNTRY_TO_DOMAIN = {
      us: 'amazon.com',
      ca: 'amazon.ca',
      uk: 'amazon.co.uk',
      de: 'amazon.de',
      fr: 'amazon.fr',
      es: 'amazon.es',
      it: 'amazon.it',
      jp: 'amazon.co.jp',
      au: 'amazon.com.au',
      in: 'amazon.in',
      br: 'amazon.com.br',
      mx: 'amazon.com.mx',
    };
  }

  async searchProducts(keyword, country = 'us', { signal, onProgress } = {}) {
    // Map country code to backend domain
    const domain = this.COUNTRY_TO_DOMAIN[country] || this.COUNTRY_TO_DOMAIN.us;

    const params = new URLSearchParams({ keyword, domain });
    const url = `${this.baseURL}/scrape?${params.toString()}`;

    // Notify progress
    if (onProgress) onProgress('Connecting to Amazon...');

    const response = await fetch(url, { signal });
    if (!response.ok) {
      // Try to read error body for more details
      let details = '';
      try {
        const errData = await response.json();
        details = errData?.error || '';
      } catch {}
      const msg = details ? `HTTP_${response.status}: ${details}` : `HTTP_${response.status}`;
      throw new Error(msg);
    }

    // Notify progress
    if (onProgress) onProgress('Processing results...');

    const data = await response.json();

    // Backend returns { success, products, ... }
    if (data && data.success === false) {
      throw new Error(data.error || 'API_ERROR');
    }

    // Normalize response shape
    const products = (data.products || []).map((item) => {
      // Normalize values from backend keys
      const title = item.title || item.name || '';
      const url = item.url || item.productUrl || item.link || '#';
      const image = item.image || item.imageUrl || item.thumbnail || '';

      // Normalize price string
      const priceRaw = item.price ?? item.priceText ?? null;
      const price = priceRaw && priceRaw !== 'N/A' ? priceRaw : null;

      // Normalize rating to a number if possible
      let rating = null;
      if (typeof item.rating === 'number') rating = item.rating;
      else if (typeof item.rating === 'string' && item.rating !== 'N/A') {
        const n = parseFloat(item.rating.replace(',', '.'));
        rating = Number.isNaN(n) ? null : n;
      }

      // Normalize reviews to integer
      let reviews = 0;
      if (typeof item.reviews === 'number') reviews = item.reviews;
      else if (typeof item.reviews === 'string' && item.reviews !== 'N/A') {
        const n = parseInt(item.reviews.replace(/[,\.]/g, ''), 10);
        reviews = Number.isNaN(n) ? 0 : n;
      }

      return {
        id: item.id || item.asin || crypto.randomUUID(),
        title,
        url,
        image,
        price,
        rating,
        reviews,
      };
    });

    if (!products.length) {
      const err = new Error('NO_PRODUCTS_FOUND');
      throw err;
    }

    return { products };
  }
}

