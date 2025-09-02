// Main application entry point
import { API } from './src/modules/api.js';
import { UI } from './src/modules/ui.js';
import { I18n } from './src/modules/i18n.js';
import { Storage } from './src/modules/storage.js';
import { ProductFilters } from './src/modules/filters.js';

// Feature flags: enable custom dropdowns with flags (set to false to rollback)
const ENABLE_CUSTOM_COUNTRY = true;
const ENABLE_CUSTOM_LANGUAGE = true;

class AmazonScraper {
    constructor() {
        this.api = new API();
        this.i18n = new I18n();
        this.ui = new UI(this.i18n); // Pass i18n instance to UI
        this.storage = new Storage();
        this.filters = new ProductFilters();
        
        this.isSearching = false;
        this.currentSearchController = null;
        this.currentResults = [];
        this.currentKeyword = '';
        this.currentCountry = 'us';
        
        this.init();
    }
    
    async init() {
        try {
            // Initialize internationalization
            await this.i18n.init();
            
            // Load saved settings (await language application to avoid race with placeholders)
            await this.loadSettings();
            
            // Initialize UI components
            this.initializeEventListeners();
            
            // Apply initial translations
            this.i18n.applyTranslations();
            // Build custom country dropdown (progressive enhancement)
            this.buildCustomCountryDropdown();
            // Ensure emojis render with Twemoji
            this.renderTwemoji(document.getElementById('country-custom'));
            // Build custom language dropdown (progressive enhancement)
            this.buildCustomLanguageDropdown();
            this.renderTwemoji(document.getElementById('language-custom'));
            
            console.log('Amazon Scraper initialized successfully');
        } catch (error) {
            console.error('Failed to initialize application:', error);
            this.ui.showError('Failed to initialize application. Please refresh the page.');
        }
    }
    
    initializeEventListeners() {
        // Search form submission
        const searchForm = document.getElementById('search-form');
        searchForm?.addEventListener('submit', (e) => this.handleSearch(e));
        
        // Language selection
        const languageSelect = document.getElementById('language-select');
        languageSelect?.addEventListener('change', (e) => this.handleLanguageChange(e));
        // Keep custom language dropdown in sync
        languageSelect?.addEventListener('change', () => this.updateCustomLanguageSelected());
        
        // Country selection
        const countrySelect = document.getElementById('country-select');
        countrySelect?.addEventListener('change', (e) => this.handleCountryChange(e));
        // Keep custom dropdown in sync when native select changes programmatically
        countrySelect?.addEventListener('change', () => this.updateCustomCountrySelected());
        
        // Search input for suggestions
        const searchInput = document.getElementById('search-input');
        searchInput?.addEventListener('input', (e) => this.handleSearchInput(e));
        searchInput?.addEventListener('focus', (e) => this.handleSearchFocus(e));
        searchInput?.addEventListener('blur', (e) => this.handleSearchBlur(e));
        
        // Filter toggle
        const filterToggle = document.getElementById('filter-toggle');
        filterToggle?.addEventListener('click', (e) => this.toggleFiltersPanel(e));
        
        // Apply filters button
        const applyFiltersBtn = document.getElementById('apply-filters');
        applyFiltersBtn?.addEventListener('click', (e) => this.applyFilters(e));
        // Apply filters when the filters form is submitted (e.g., from chips clear)
        const filtersForm = document.getElementById('filters-form');
        filtersForm?.addEventListener('submit', (e) => this.applyFilters(e));
        
        // Sort by change
        const sortBySelect = document.getElementById('sort-by');
        sortBySelect?.addEventListener('change', () => this.handleSortChange());
        
        // Retry button
        const retryButton = document.getElementById('retry-button');
        retryButton?.addEventListener('click', () => this.handleRetry());
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => this.handleKeydown(e));
        
        // Click outside to close suggestions
        document.addEventListener('click', (e) => this.handleDocumentClick(e));
    }
    
    async loadSettings() {
        // Load language preference
        const savedLanguage = this.storage.get('language', 'en');
        const languageSelect = document.getElementById('language-select');
        if (languageSelect) {
            languageSelect.value = savedLanguage;
            await this.i18n.setLanguage(savedLanguage);
        }
        
        // Load country preference
        const savedCountry = this.storage.get('country', 'us');
        const countrySelect = document.getElementById('country-select');
        if (countrySelect) {
            countrySelect.value = savedCountry;
        }
        
        // Load recent searches
        const recentSearches = this.storage.get('recentSearches', []);
        this.ui.setRecentSearches(recentSearches);
    }
    
    async handleSearch(event) {
        event.preventDefault();
        
        if (this.isSearching) {
            return;
        }
        
        const searchInput = document.getElementById('search-input');
        const countrySelect = document.getElementById('country-select');
        
        const keyword = searchInput?.value.trim();
        const country = countrySelect?.value || 'us';
        
        // Validate input
        if (!keyword) {
            this.ui.showError(this.i18n.t('keywordRequired'));
            searchInput?.focus();
            return;
        }
        
        if (keyword.length < 2) {
            this.ui.showError(this.i18n.t('keywordTooShort'));
            searchInput?.focus();
            return;
        }
        
        try {
            this.isSearching = true;
            this.currentKeyword = keyword;
            this.currentCountry = country;
            
            this.ui.showLoading();
            this.ui.hideSuggestions();
            
            // Create abort controller for this search
            this.currentSearchController = new AbortController();
            
            // Update loading messages
            this.updateLoadingStatus();
            
            // Perform the search
            const results = await this.api.searchProducts(keyword, country, {
                signal: this.currentSearchController.signal,
                onProgress: (status) => this.updateLoadingMessage(status)
            });
            
            // Handle successful results
            if (results && results.products && results.products.length > 0) {
                this.currentResults = results.products;
                this.applyFilters();
                this.saveRecentSearch(keyword);
            } else {
                this.currentResults = [];
                // Mostrar estado de "sem resultados" em vez de erro
                this.ui.showResults([], this.currentKeyword);
                this.saveRecentSearch(keyword);
            }
            
        } catch (error) {
            console.error('Search error:', error);
            
            if (error.name === 'AbortError') {
                console.log('Search was cancelled');
                return;
            }
            
            let errorMessage = this.i18n.t('errorMessage');
            
            if (error.message === 'NO_PRODUCTS_FOUND') {
                // Tratar como "sem resultados" e não como erro
                this.ui.showResults([], this.currentKeyword);
                this.saveRecentSearch(this.currentKeyword);
                return;
            } else if (error.message.includes('timeout')) {
                errorMessage = 'Request timeout. Please try again.';
            } else if (error.message.includes('network')) {
                errorMessage = 'Network error. Please check your connection.';
            }
            
            this.ui.showError(errorMessage);
        } finally {
            this.isSearching = false;
            this.currentSearchController = null;
        }
    }
    
    updateLoadingStatus() {
        const messages = [
            { key: 'connecting', delay: 0 },
            { key: 'searchingProducts', delay: 2000 },
            { key: 'processingResults', delay: 4000 }
        ];
        
        messages.forEach(({ key, delay }) => {
            setTimeout(() => {
                if (this.isSearching) {
                    this.updateLoadingMessage(this.i18n.t(key));
                }
            }, delay);
        });
    }
    
    updateLoadingMessage(message) {
        const loadingStatus = document.getElementById('loading-status');
        if (loadingStatus && this.isSearching) {
            loadingStatus.textContent = message;
        }
    }
    
    async handleLanguageChange(event) {
        const language = event.target.value;
        await this.i18n.setLanguage(language);
        this.storage.set('language', language);
        // Rebuild custom country labels to reflect new language
        this.updateCustomCountryLabels();
        // Rebuild custom language labels (localized names)
        this.updateCustomLanguageLabels();
    }
    
    handleCountryChange(event) {
        const country = event.target.value;
        this.currentCountry = country;
        this.storage.set('country', country);
    }
    
    async handleSearchInput(event) {
        const query = event.target.value.trim();
        
        if (query.length < 2) {
            this.ui.hideSuggestions();
            return;
        }
        
        // Show suggestions based on recent searches
        const recentSearches = this.storage.get('recentSearches', []);
        const suggestions = recentSearches
            .filter(search => search.toLowerCase().includes(query.toLowerCase()))
            .slice(0, 5);
        
        this.ui.showSuggestions(suggestions, query);
    }
    
    handleSearchFocus(event) {
        const query = event.target.value.trim();
        if (query.length >= 2) {
            this.handleSearchInput(event);
        }
    }
    
    handleSearchBlur(event) {
        // Delay hiding suggestions to allow clicking on them
        setTimeout(() => {
            this.ui.hideSuggestions();
        }, 200);
    }
    
    handleRetry() {
        const searchInput = document.getElementById('search-input');
        if (searchInput?.value.trim()) {
            const searchForm = document.getElementById('search-form');
            searchForm?.dispatchEvent(new Event('submit'));
        }
    }
    
    handleKeydown(event) {
        // Escape key to cancel search or close suggestions
        if (event.key === 'Escape') {
            if (this.isSearching && this.currentSearchController) {
                this.currentSearchController.abort();
                this.ui.hideLoading();
            } else {
                this.ui.hideSuggestions();
            }
        }
        
        // Enter key in suggestions
        if (event.key === 'Enter' && document.activeElement?.classList.contains('suggestion-item')) {
            event.preventDefault();
            document.activeElement.click();
        }
    }
    
    // Toggle filters panel visibility
    toggleFiltersPanel(event) {
        event.preventDefault();
        const filtersPanel = document.getElementById('filters-panel');
        if (filtersPanel) {
            filtersPanel.classList.toggle('hidden');
        }
    }
    
    // Apply filters and update results
    applyFilters(event) {
        if (event) event.preventDefault();
        
        // Update filters from form
        this.filters.updateFromForm();
        
        // Apply filters to current results
        if (this.currentResults && this.currentResults.length > 0) {
            const filteredResults = this.filters.apply(this.currentResults);
            this.ui.showResults(filteredResults, this.currentKeyword);
        }
        
        // Hide filters panel on mobile
        if (window.innerWidth < 768) {
            const filtersPanel = document.getElementById('filters-panel');
            if (filtersPanel) {
                filtersPanel.classList.add('hidden');
            }
        }
    }
    
    // Handle sort change
    handleSortChange() {
        const sortBy = document.getElementById('sort-by')?.value || 'relevance';
        this.filters.filters.sortBy = sortBy;
        this.applyFilters();
    }
    
    handleDocumentClick(event) {
        const suggestions = document.getElementById('suggestions');
        const searchInput = document.getElementById('search-input');
        const filtersPanel = document.getElementById('filters-panel');
        const filterToggle = document.getElementById('filter-toggle');
        
        // Close suggestions when clicking outside
        if (suggestions && 
            !suggestions.contains(event.target) && 
            !searchInput?.contains(event.target)) {
            this.ui.hideSuggestions();
        }
        
        // Do NOT close filters panel when clicking outside (keep it open until explicitly closed)
    }
    
    saveRecentSearch(keyword) {
        const recentSearches = this.storage.get('recentSearches', []);
        
        // Remove existing occurrence
        const filtered = recentSearches.filter(search => 
            search.toLowerCase() !== keyword.toLowerCase()
        );
        
        // Add to beginning
        filtered.unshift(keyword);
        
        // Keep only last 10 searches
        const updated = filtered.slice(0, 10);
        
        this.storage.set('recentSearches', updated);
        this.ui.setRecentSearches(updated);
    }

    // ============================
    // Custom Country Dropdown (PE)
    // ============================
    buildCustomCountryDropdown() {
        const container = document.getElementById('country-custom');
        const select = document.getElementById('country-select');
        if (!container || !select) return;

        if (!ENABLE_CUSTOM_COUNTRY) {
            this.teardownCustomCountryDropdown();
            return;
        }

        // Build items from native select
        const opts = [...select.options].map(opt => {
            const code = opt.value;
            const normalized = code?.toLowerCase() === 'uk' ? 'gb' : (code || '').toLowerCase();
            const flag = opt.dataset.flag
                || this.i18n.extractLeadingEmoji(opt.textContent)
                || this.i18n.flags[normalized]
                || this.i18n.flagFromCountryCode(normalized)
                || '';
            const label = this.i18n.getCountryName(code);
            return { code, flag, label };
        });

        // Render dropdown
        const current = select.value || opts[0]?.code || 'us';
        const currentItem = opts.find(o => o.code === current) || opts[0];
        container.innerHTML = `
            <div class="relative inline-block text-left">
                <button id="country-dd-btn" type="button" class="inline-flex w-full justify-center gap-2 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none" aria-haspopup="listbox" aria-expanded="false">
                    <span class="text-base">${currentItem?.flag || ''}</span>
                    <span>${currentItem?.label || ''}</span>
                    <svg class="-mr-1 h-4 w-4 text-gray-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z" clip-rule="evenodd"/></svg>
                </button>
                <ul id="country-dd-list" class="absolute z-20 mt-1 max-h-60 w-56 overflow-auto rounded-md bg-white py-1 text-sm shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none hidden" role="listbox">
                    ${opts.map(o => `
                        <li class="cursor-pointer select-none px-3 py-2 text-gray-700 hover:bg-gray-100 flex items-center gap-2" role="option" data-value="${o.code}">
                            <span class="text-base">${o.flag}</span>
                            <span>${o.label}</span>
                        </li>`).join('')}
                </ul>
            </div>
        `;

        // Hide native select but keep for form behavior
        select.classList.add('hidden');
        const btn = container.querySelector('#country-dd-btn');
        const list = container.querySelector('#country-dd-list');
        const toggle = () => list.classList.toggle('hidden');
        const close = () => list.classList.add('hidden');

        btn?.addEventListener('click', (e) => {
            e.preventDefault();
            toggle();
        });
        list?.querySelectorAll('[data-value]')?.forEach(item => {
            item.addEventListener('click', () => {
                const val = item.getAttribute('data-value');
                if (!val) return;
                select.value = val;
                // Trigger native change
                select.dispatchEvent(new Event('change', { bubbles: true }));
                // Update button label
                const found = opts.find(o => o.code === val);
                if (found) btn.innerHTML = `<span class="text-base">${found.flag}</span><span>${found.label}</span><svg class=\"-mr-1 h-4 w-4 text-gray-500\" xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 20 20\" fill=\"currentColor\"><path fill-rule=\"evenodd\" d=\"M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z\" clip-rule=\"evenodd\"/></svg>`;
                close();
            });
        });

        // Click outside to close
        this._countryOutsideHandler = (ev) => {
            if (!container.contains(ev.target)) close();
        };
        document.addEventListener('click', this._countryOutsideHandler);
    }

    teardownCustomCountryDropdown() {
        const container = document.getElementById('country-custom');
        const select = document.getElementById('country-select');
        if (container) container.innerHTML = '';
        if (select) select.classList.remove('hidden');
        if (this._countryOutsideHandler) {
            document.removeEventListener('click', this._countryOutsideHandler);
            this._countryOutsideHandler = null;
        }
    }

    updateCustomCountryLabels() {
        if (!ENABLE_CUSTOM_COUNTRY) return;
        // Rebuild to re-render translated names and flags
        this.buildCustomCountryDropdown();
        this.renderTwemoji(document.getElementById('country-custom'));
    }

    updateCustomCountrySelected() {
        if (!ENABLE_CUSTOM_COUNTRY) return;
        const container = document.getElementById('country-custom');
        const select = document.getElementById('country-select');
        const btn = container?.querySelector('#country-dd-btn');
        if (!container || !select || !btn) return;
        const code = select.value;
        const label = this.i18n.getCountryName(code);
        const normalized = code?.toLowerCase() === 'uk' ? 'gb' : (code || '').toLowerCase();
        const flag = this.i18n.flags[normalized] || this.i18n.flagFromCountryCode(normalized) || '';
        btn.innerHTML = `<span class="text-base">${flag}</span><span>${label}</span><svg class=\"-mr-1 h-4 w-4 text-gray-500\" xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 20 20\" fill=\"currentColor\"><path fill-rule=\"evenodd\" d=\"M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z\" clip-rule=\"evenodd\"/></svg>`;
        this.renderTwemoji(container);
    }

    // Render emojis as SVGs via Twemoji for cross-platform consistency
    renderTwemoji(rootEl) {
        try {
            const tw = window?.twemoji;
            if (!tw || !rootEl) return;
            tw.parse(rootEl, {
                folder: 'svg',
                ext: '.svg',
                className: 'emoji',
                base: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/'
            });
        } catch (_) { /* noop */ }
    }

    // ============================
    // Custom Language Dropdown (PE)
    // ============================
    buildCustomLanguageDropdown() {
        const container = document.getElementById('language-custom');
        const select = document.getElementById('language-select');
        if (!container || !select) return;

        if (!ENABLE_CUSTOM_LANGUAGE) {
            this.teardownCustomLanguageDropdown();
            return;
        }

        // Build items from native select
        const opts = [...select.options].map(opt => {
            const code = opt.value; // 'en', 'pt', 'es'
            const flag = opt.dataset.flag
                || this.i18n.extractLeadingEmoji(opt.textContent)
                || '';
            // Localized language names from translations if available
            const label = this.i18n.t(`lang.${code}`) !== `lang.${code}`
                ? this.i18n.t(`lang.${code}`)
                : opt.textContent?.replace(this.i18n.extractLeadingEmoji(opt.textContent), '').trim();
            return { code, flag, label };
        });

        const current = select.value || opts[0]?.code || 'en';
        const currentItem = opts.find(o => o.code === current) || opts[0];
        container.innerHTML = `
            <div class="relative inline-block text-left">
                <button id="lang-dd-btn" type="button" class="inline-flex w-full justify-center gap-2 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none" aria-haspopup="listbox" aria-expanded="false">
                    <span class="text-base">${currentItem?.flag || ''}</span>
                    <span>${currentItem?.label || ''}</span>
                    <svg class="-mr-1 h-4 w-4 text-gray-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z" clip-rule="evenodd"/></svg>
                </button>
                <ul id="lang-dd-list" class="absolute z-20 mt-1 max-h-60 w-56 overflow-auto rounded-md bg-white py-1 text-sm shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none hidden" role="listbox">
                    ${opts.map(o => `
                        <li class="cursor-pointer select-none px-3 py-2 text-gray-700 hover:bg-gray-100 flex items-center gap-2" role="option" data-value="${o.code}">
                            <span class="text-base">${o.flag}</span>
                            <span>${o.label}</span>
                        </li>`).join('')}
                </ul>
            </div>
        `;

        // Hide native select but keep for behavior
        select.classList.add('hidden');
        const btn = container.querySelector('#lang-dd-btn');
        const list = container.querySelector('#lang-dd-list');
        const toggle = () => list.classList.toggle('hidden');
        const close = () => list.classList.add('hidden');

        btn?.addEventListener('click', (e) => {
            e.preventDefault();
            toggle();
        });
        list?.querySelectorAll('[data-value]')?.forEach(item => {
            item.addEventListener('click', () => {
                const val = item.getAttribute('data-value');
                if (!val) return;
                select.value = val;
                // Trigger native change to update language
                select.dispatchEvent(new Event('change', { bubbles: true }));
                // Update button label
                const found = opts.find(o => o.code === val);
                if (found) btn.innerHTML = `<span class="text-base">${found.flag}</span><span>${found.label}</span><svg class=\"-mr-1 h-4 w-4 text-gray-500\" xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 20 20\" fill=\"currentColor\"><path fill-rule=\"evenodd\" d=\"M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z\" clip-rule=\"evenodd\"/></svg>`;
                close();
            });
        });

        // Click outside to close
        this._langOutsideHandler = (ev) => {
            if (!container.contains(ev.target)) close();
        };
        document.addEventListener('click', this._langOutsideHandler);

        // Render emojis
        this.renderTwemoji(container);
    }

    teardownCustomLanguageDropdown() {
        const container = document.getElementById('language-custom');
        const select = document.getElementById('language-select');
        if (container) container.innerHTML = '';
        if (select) select.classList.remove('hidden');
        if (this._langOutsideHandler) {
            document.removeEventListener('click', this._langOutsideHandler);
            this._langOutsideHandler = null;
        }
    }

    updateCustomLanguageLabels() {
        if (!ENABLE_CUSTOM_LANGUAGE) return;
        // Rebuild to re-render translated labels and flags
        this.buildCustomLanguageDropdown();
        this.renderTwemoji(document.getElementById('language-custom'));
    }

    updateCustomLanguageSelected() {
        if (!ENABLE_CUSTOM_LANGUAGE) return;
        const container = document.getElementById('language-custom');
        const select = document.getElementById('language-select');
        const btn = container?.querySelector('#lang-dd-btn');
        if (!container || !select || !btn) return;
        const code = select.value;
        const opts = [...select.options];
        const opt = opts.find(o => o.value === code);
        const flag = opt?.dataset.flag || this.i18n.extractLeadingEmoji(opt?.textContent) || '';
        const label = this.i18n.t(`lang.${code}`) !== `lang.${code}`
            ? this.i18n.t(`lang.${code}`)
            : opt?.textContent?.replace(this.i18n.extractLeadingEmoji(opt?.textContent), '').trim() || code.toUpperCase();
        btn.innerHTML = `<span class="text-base">${flag}</span><span>${label}</span><svg class=\"-mr-1 h-4 w-4 text-gray-500\" xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 20 20\" fill=\"currentColor\"><path fill-rule=\"evenodd\" d=\"M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z\" clip-rule=\"evenodd\"/></svg>`;
        this.renderTwemoji(container);
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.amazonScraper = new AmazonScraper();
});

// Export for potential external use
export { AmazonScraper };
