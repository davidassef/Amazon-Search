// Internationalization module
export class I18n {
  constructor() {
    const defaultLang = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_DEFAULT_LOCALE) || 'en';
    this.language = defaultLang;
    this.translations = {};
    this.supported = ['en', 'pt', 'es'];
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
      this.translations = await response.json();
    } catch (e) {
      console.error('I18n load error:', e);
      this.translations = {};
    }
  }

  setLanguage(lang) {
    this.loadLanguage(lang).then(() => this.applyTranslations());
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
  }
}

