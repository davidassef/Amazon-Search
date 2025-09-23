// API communication module
// UUID helper com fallback para ambientes sem crypto.randomUUID
const uid = () => {
  try {
    if (typeof crypto !== 'undefined') {
      if (typeof crypto.randomUUID === 'function') {
        return crypto.randomUUID();
      }
      if (typeof crypto.getRandomValues === 'function') {
        const buf = new Uint8Array(16);
        crypto.getRandomValues(buf);
        // Ajuste de bits conforme RFC 4122 v4
        buf[6] = (buf[6] & 0x0f) | 0x40;
        buf[8] = (buf[8] & 0x3f) | 0x80;
        const b = Array.from(buf, x => x.toString(16).padStart(2, '0'));
        return `${b[0]}${b[1]}${b[2]}${b[3]}-${b[4]}${b[5]}-${b[6]}${b[7]}-${b[8]}${b[9]}-${b[10]}${b[11]}${b[12]}${b[13]}${b[14]}${b[15]}`;
      }
    }
  } catch {}
  // Fallback simples (não-criptográfico)
  const s4 = () => Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
  return `${s4()}${s4()}-${s4()}-${s4()}-${s4()}-${s4()}${s4()}${s4()}`;
};
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

  async searchProducts(keyword, countries = ['us'], convertTo = null, { signal, onProgress } = {}) {
    // Map country codes to backend domains
    const domains = countries.map(country => this.COUNTRY_TO_DOMAIN[country] || this.COUNTRY_TO_DOMAIN.us).join(',');

    const params = new URLSearchParams({ keyword, domains });
    if (convertTo) {
      params.append('convertTo', convertTo);
    }
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

    // Backend returns { success, results: { domain: { products, ... } } }
    if (data && data.success === false) {
      throw new Error(data.error || 'API_ERROR');
    }

    // Helper interno para extrair rating com robustez de múltiplas chaves
    /**
     * Extrai a avaliação (0-5) a partir de possíveis chaves do item do backend.
     * Aceita number direto ou string em formatos "4,5", "4.5", "4.5 out of 5".
     * Retorna null se não conseguir extrair número válido.
     */
    const extractRating = (item) => {
      const keys = [
        'rating',
        'ratingText',
        'stars',
        'starsText',
        'averageRating',
        'avgRating',
        'rating_value',
        'ratingValue',
        'ratingOutOf5',
        'score'
      ];
      for (const k of keys) {
        if (k in item && item[k] != null && item[k] !== 'N/A') {
          const v = item[k];
          if (typeof v === 'number') {
            const n = Math.max(0, Math.min(5, v));
            return Number.isFinite(n) ? n : null;
          }
          const str = String(v).trim();
          const m = str.match(/\d+[\.,]?\d*/);
          if (m) {
            const n = parseFloat(m[0].replace(',', '.'));
            if (!Number.isNaN(n)) {
              const clamped = Math.max(0, Math.min(5, n));
              return clamped;
            }
          }
        }
      }
      return null;
    };

    // Normalize response shape for both single and multi-domain responses
    if (data.results) { // Multi-domain response
        for (const domain in data.results) {
            data.results[domain].products = (data.results[domain].products || []).map(item => this.normalizeProduct(item));
        }
    } else { // Fallback for single domain response
        data.products = (data.products || []).map(item => this.normalizeProduct(item));
    }

    return data;
  }

  normalizeProduct(item) {
      // Normalize values from backend keys
      const title = item.title || item.name || '';
      const url = item.url || item.productUrl || item.link || '#';
      const image = item.image || item.imageUrl || item.thumbnail || '';

      // Normalize price string
      const priceRaw = item.price ?? item.priceText ?? null;
      const price = priceRaw && priceRaw !== 'N/A' ? priceRaw : null;

      const convertedPrice = item.convertedPrice ?? null;

      // Normalize rating a partir de múltiplas chaves
      const rating = this.extractRating(item);

      // Normalize reviews to integer
      let reviews = 0;
      if (typeof item.reviews === 'number') reviews = item.reviews;
      else if (typeof item.reviews === 'string' && item.reviews !== 'N/A') {
        const n = parseInt(item.reviews.replace(/[,\.]/g, ''), 10);
        reviews = Number.isNaN(n) ? 0 : n;
      }

      return {
        id: item.id || item.asin || uid(),
        title,
        url,
        image,
        price,
        convertedPrice,
        rating,
        reviews,
      };
  }

  extractRating(item) {
    const keys = [
      'rating',
      'ratingText',
      'stars',
      'starsText',
      'averageRating',
      'avgRating',
      'rating_value',
      'ratingValue',
      'ratingOutOf5',
      'score'
    ];
    for (const k of keys) {
      if (k in item && item[k] != null && item[k] !== 'N/A') {
        const v = item[k];
        if (typeof v === 'number') {
          const n = Math.max(0, Math.min(5, v));
          return Number.isFinite(n) ? n : null;
        }
        const str = String(v).trim();
        const m = str.match(/\d+[\.,]?\d*/);
        if (m) {
          const n = parseFloat(m[0].replace(',', '.'));
          if (!Number.isNaN(n)) {
            const clamped = Math.max(0, Math.min(5, n));
            return clamped;
          }
        }
      }
    }
    return null;
  }
}

