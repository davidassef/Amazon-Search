// LocalStorage management module
export class Storage {
  constructor(prefix = 'amazon_scraper_') {
    this.prefix = prefix;
  }

  key(k) {
    return `${this.prefix}${k}`;
  }

  get(key, fallback = null) {
    try {
      const v = localStorage.getItem(this.key(key));
      return v ? JSON.parse(v) : fallback;
    } catch (e) {
      return fallback;
    }
  }

  set(key, value) {
    try {
      localStorage.setItem(this.key(key), JSON.stringify(value));
    } catch (e) {
      // Ignore quota errors
    }
  }

  remove(key) {
    try {
      localStorage.removeItem(this.key(key));
    } catch (e) {}
  }

  clearAll() {
    Object.keys(localStorage)
      .filter(k => k.startsWith(this.prefix))
      .forEach(k => localStorage.removeItem(k));
  }
}

