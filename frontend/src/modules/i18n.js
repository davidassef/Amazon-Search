// Internationalization module
export class I18n {
  constructor() {
    const defaultLang = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_DEFAULT_LOCALE) || 'en';
    this.language = defaultLang;
    this.translations = {};
    this.supported = ['en', 'pt', 'es'];
    // Fallback country names when not present in translation files
    this.countryNames = {
      en: {
        us: 'United States', ca: 'Canada', uk: 'United Kingdom', de: 'Germany', fr: 'France', es: 'Spain', it: 'Italy', jp: 'Japan', au: 'Australia', in: 'India', br: 'Brazil', mx: 'Mexico'
      },
      pt: {
        us: 'Estados Unidos', ca: 'Canadá', uk: 'Reino Unido', de: 'Alemanha', fr: 'França', es: 'Espanha', it: 'Itália', jp: 'Japão', au: 'Austrália', in: 'Índia', br: 'Brasil', mx: 'México'
      },
      es: {
        us: 'Estados Unidos', ca: 'Canadá', uk: 'Reino Unido', de: 'Alemania', fr: 'Francia', es: 'España', it: 'Italia', jp: 'Japón', au: 'Australia', in: 'India', br: 'Brasil', mx: 'México'
      }
    };

    // Default UI translations to ensure UI works even if locale files are missing
    this.defaults = {
      en: {
        title: 'Amazon Product Scraper',
        language: 'Language',
        searchTitle: 'Find products on Amazon',
        searchSubtitle: 'Enter a product name and select your preferred Amazon country',
        searchFor: 'Search for products',
        searchPlaceholder: 'Enter product keyword (e.g., laptop, headphones, books...)',
        searchButton: 'Search Products',
        country: 'Country/Region',
        searchInfo: 'Press Enter to search quickly',
        resultsTitle: 'Search Results',
        resultsCount: '{{count}} results',
        resultsKeyword: 'for "{{keyword}}"',
        filters: 'Filters',
        priceRange: 'Price Range',
        minPrice: 'Min Price',
        maxPrice: 'Max Price',
        minRating: 'Minimum Rating',
        anyRating: 'Any Rating',
        stars: 'stars',
        brand: 'Brand',
        brandPlaceholder: 'e.g. Apple, Samsung',
        dateRange: 'Date Range',
        startDate: 'Start date',
        endDate: 'End date',
        freeShipping: 'Free Shipping',
        applyFilters: 'Apply Filters',
        activeFilters: 'Active filters',
        clearAll: 'Clear all',
        removeFilter: 'Remove filter',
        sortRelevance: 'Relevance',
        sortPriceAsc: 'Price: Low to High',
        sortPriceDesc: 'Price: High to Low',
        sortRatingAsc: 'Lowest Rated',
        sortRating: 'Top Rated',
        sortDateDesc: 'Newest',
        sortDateAsc: 'Oldest',
        sortNewest: 'Newest Arrivals',
        noSuggestions: 'No suggestions',
        priceNotAvailable: 'Price not available',
        viewProduct: 'View product',
        noReviews: 'No reviews',
        oneReview: '1 review',
        multipleReviews: '{{count}} reviews',
        errorMessage: 'Something went wrong. Please try again.',
        loadingMessage: 'Scraping Amazon products...',
        connecting: 'Connecting to server...',
        searchingProducts: 'Searching products...',
        processingResults: 'Processing results...',
        keywordRequired: 'Please enter a keyword',
        keywordTooShort: 'Keyword is too short',
        noProductsError: 'No products found for "{{keyword}}"',
        // Optional country keys
        'country.us': 'United States', 'country.ca': 'Canada', 'country.uk': 'United Kingdom',
        'country.de': 'Germany', 'country.fr': 'France', 'country.es': 'Spain', 'country.it': 'Italy',
        'country.jp': 'Japan', 'country.au': 'Australia', 'country.in': 'India', 'country.br': 'Brazil', 'country.mx': 'Mexico'
      },
      pt: {
        title: 'Amazon Product Scraper',
        language: 'Idioma',
        searchTitle: 'Encontre produtos na Amazon',
        searchSubtitle: 'Digite um produto e selecione o país da Amazon',
        searchFor: 'Buscar por produtos',
        searchPlaceholder: 'Digite a palavra-chave (ex.: notebook, fones, livros...)',
        searchButton: 'Buscar Produtos',
        country: 'País/Região',
        searchInfo: 'Pressione Enter para buscar rapidamente',
        resultsTitle: 'Resultados da busca',
        resultsCount: '{{count}} resultados',
        resultsKeyword: 'para "{{keyword}}"',
        filters: 'Filtros',
        priceRange: 'Faixa de Preço',
        minPrice: 'Preço Min',
        maxPrice: 'Preço Máx',
        minRating: 'Avaliação Mínima',
        anyRating: 'Qualquer avaliação',
        stars: 'estrelas',
        brand: 'Marca',
        brandPlaceholder: 'ex.: Apple, Samsung',
        dateRange: 'Período',
        startDate: 'Data inicial',
        endDate: 'Data final',
        freeShipping: 'Frete Grátis',
        applyFilters: 'Aplicar Filtros',
        activeFilters: 'Filtros ativos',
        clearAll: 'Limpar tudo',
        removeFilter: 'Remover filtro',
        sortRelevance: 'Relevância',
        sortPriceAsc: 'Preço: Menor para Maior',
        sortPriceDesc: 'Preço: Maior para Menor',
        sortRatingAsc: 'Piores Avaliados',
        sortRating: 'Melhor Avaliados',
        sortDateDesc: 'Mais novos',
        sortDateAsc: 'Mais antigos',
        sortNewest: 'Lançamentos',
        noSuggestions: 'Sem sugestões',
        priceNotAvailable: 'Preço indisponível',
        viewProduct: 'Ver produto',
        noReviews: 'Sem avaliações',
        oneReview: '1 avaliação',
        multipleReviews: '{{count}} avaliações',
        errorMessage: 'Ocorreu um erro. Tente novamente.',
        loadingMessage: 'Buscando produtos na Amazon...',
        connecting: 'Conectando ao servidor...',
        searchingProducts: 'Buscando produtos...',
        processingResults: 'Processando resultados...',
        keywordRequired: 'Digite uma palavra-chave',
        keywordTooShort: 'Palavra-chave muito curta',
        noProductsError: 'Nenhum produto encontrado para "{{keyword}}"',
        'country.us': 'Estados Unidos', 'country.ca': 'Canadá', 'country.uk': 'Reino Unido',
        'country.de': 'Alemanha', 'country.fr': 'França', 'country.es': 'Espanha', 'country.it': 'Itália',
        'country.jp': 'Japão', 'country.au': 'Austrália', 'country.in': 'Índia', 'country.br': 'Brasil', 'country.mx': 'México'
      },
      es: {
        title: 'Amazon Product Scraper',
        language: 'Idioma',
        searchTitle: 'Encuentra productos en Amazon',
        searchSubtitle: 'Ingresa un producto y selecciona el país de Amazon',
        searchFor: 'Buscar productos',
        searchPlaceholder: 'Ingresa palabra clave (ej.: portátil, auriculares, libros...)',
        searchButton: 'Buscar Productos',
        country: 'País/Región',
        searchInfo: 'Presiona Enter para buscar rápidamente',
        resultsTitle: 'Resultados de búsqueda',
        resultsCount: '{{count}} resultados',
        resultsKeyword: 'para "{{keyword}}"',
        filters: 'Filtros',
        priceRange: 'Rango de precios',
        minPrice: 'Precio Mín',
        maxPrice: 'Precio Máx',
        minRating: 'Calificación mínima',
        anyRating: 'Cualquier calificación',
        stars: 'estrellas',
        brand: 'Marca',
        brandPlaceholder: 'ej.: Apple, Samsung',
        dateRange: 'Rango de fechas',
        startDate: 'Fecha inicio',
        endDate: 'Fecha fin',
        freeShipping: 'Envío gratis',
        applyFilters: 'Aplicar filtros',
        activeFilters: 'Filtros activos',
        clearAll: 'Limpiar todo',
        removeFilter: 'Eliminar filtro',
        sortRelevance: 'Relevancia',
        sortPriceAsc: 'Precio: de menor a mayor',
        sortPriceDesc: 'Precio: de mayor a menor',
        sortRatingAsc: 'Peor calificados',
        sortRating: 'Mejor calificados',
        sortDateDesc: 'Más nuevos',
        sortDateAsc: 'Más antiguos',
        sortNewest: 'Novedades',
        noSuggestions: 'Sin sugerencias',
        priceNotAvailable: 'Precio no disponible',
        viewProduct: 'Ver producto',
        noReviews: 'Sin reseñas',
        oneReview: '1 reseña',
        multipleReviews: '{{count}} reseñas',
        errorMessage: 'Algo salió mal. Intenta de nuevo.',
        loadingMessage: 'Extrayendo productos de Amazon...',
        connecting: 'Conectando al servidor...',
        searchingProducts: 'Buscando productos...',
        processingResults: 'Procesando resultados...',
        keywordRequired: 'Ingresa una palabra clave',
        keywordTooShort: 'La palabra clave es muy corta',
        noProductsError: 'No se encontraron productos para "{{keyword}}"',
        'country.us': 'Estados Unidos', 'country.ca': 'Canadá', 'country.uk': 'Reino Unido',
        'country.de': 'Alemania', 'country.fr': 'Francia', 'country.es': 'España', 'country.it': 'Italia',
        'country.jp': 'Japón', 'country.au': 'Australia', 'country.in': 'India', 'country.br': 'Brasil', 'country.mx': 'México'
      }
    };

    // Static flags map + fallback generator from country code
    this.flags = {
      us: '🇺🇸', ca: '🇨🇦', uk: '🇬🇧', gb: '🇬🇧', de: '🇩🇪', fr: '🇫🇷', es: '🇪🇸', it: '🇮🇹',
      jp: '🇯🇵', au: '🇦🇺', in: '🇮🇳', br: '🇧🇷', mx: '🇲🇽'
    };
  }

  async init() {
    // Load default language
    await this.loadLanguage(this.language);
  }

  async loadLanguage(lang) {
    if (!this.supported.includes(lang)) lang = 'en';
    this.language = lang;

    try {
      const response = await fetch(`/locales/${lang}.json`, { cache: 'no-store' });
      if (!response.ok) throw new Error('Failed to load translations');
      const loaded = await response.json();
      const defaults = this.defaults[lang] || this.defaults.en || {};
      this.translations = { ...defaults, ...loaded };
      // Debug do carregamento e merge
      try {
        console.debug('[i18n] loadLanguage ok', {
          lang,
          loadedMin: loaded?.minPrice,
          loadedMax: loaded?.maxPrice,
          finalMin: this.translations.minPrice,
          finalMax: this.translations.maxPrice
        });
      } catch (_) { /* noop */ }
    } catch (e) {
      console.error('I18n load error:', e);
      const defaults = this.defaults[lang] || this.defaults.en || {};
      this.translations = { ...defaults };
      try {
        console.debug('[i18n] loadLanguage fallback defaults', {
          lang,
          finalMin: this.translations.minPrice,
          finalMax: this.translations.maxPrice
        });
      } catch(_) { /* noop */ }
    }
  }

  async setLanguage(lang) {
    await this.loadLanguage(lang);
    this.applyTranslations();
    return true;
  }

  t(key, params = {}) {
    const text = this.translations[key] || key;
    return text.replace(/\{\{(.*?)\}\}/g, (_, k) => params[k.trim()] ?? '');
  }

  applyTranslations() {
    // Elements with data-i18n attributes
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      el.textContent = this.t(key);
    });

    // Elements with data-i18n-placeholder
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
      const key = el.getAttribute('data-i18n-placeholder');
      el.setAttribute('placeholder', this.t(key));
    });

    // Debug: verificar idioma e valores aplicados de min/max price
    try {
      // Evita log excessivo durante cargas iniciais muito frequentes
      if (!this._lastDebugLang || this._lastDebugLang !== this.language) {
        this._lastDebugLang = this.language;
        console.debug('[i18n] applyTranslations', {
          language: this.language,
          minPrice: this.t('minPrice'),
          maxPrice: this.t('maxPrice')
        });
      }
    } catch (_) { /* noop */ }

    // Update dynamic country options preserving emoji flags
    this.updateCountryOptions();
  }

  // Get translated country name with fallback map
  getCountryName(code) {
    const key = `country.${code}`;
    const translated = this.translations[key];
    if (translated) return translated;
    const map = this.countryNames[this.language] || this.countryNames.en;
    return map[code] || code.toUpperCase();
  }

  // Update country <select> option labels while preserving emojis via data-flag
  updateCountryOptions() {
    const select = document.getElementById('country-select');
    if (!select) return;
    [...select.options].forEach(opt => {
      const code = opt.value;
      const normalized = (code || '').toLowerCase() === 'uk' ? 'gb' : (code || '').toLowerCase();
      const flag = opt.dataset.flag 
        || this.extractLeadingEmoji(opt.textContent) 
        || this.flags[normalized]
        || this.flagFromCountryCode(normalized)
        || '';
      const name = this.getCountryName(code);
      opt.dataset.flag = flag; // persist for next updates
      opt.textContent = `${flag} ${name}`.trim();
    });
  }

  // Best-effort: take first grapheme which is likely an emoji flag
  extractLeadingEmoji(text) {
    if (!text) return '';
    const m = text.trim().match(/^[\p{Emoji}\p{Extended_Pictographic}]+/u);
    return m ? m[0] : '';
  }

  // Generate flag emoji from 2-letter country code using regional indicators
  flagFromCountryCode(code) {
    if (!code || code.length < 2) return '';
    const cc = code.trim().toUpperCase();
    // Special case: UK -> GB
    const norm = cc === 'UK' ? 'GB' : cc;
    const A = 0x1F1E6;
    const base = 'A'.charCodeAt(0);
    try {
      const chars = [...norm.slice(0,2)].map(c => String.fromCodePoint(A + (c.charCodeAt(0) - base)));
      return chars.join('');
    } catch {
      return '';
    }
  }
}

