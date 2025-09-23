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
        this.selectedCountries = ['us'];
        
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

            // Build custom language dropdown (progressive enhancement)
            this.buildCustomLanguageDropdown();
            this.renderTwemoji(document.getElementById('language-custom'));
            
            // Build multi-select country dropdown
            this.buildCountryMultiSelect();

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
        
        // Country multiselect
        const countryMultiSelectButton = document.getElementById('country-multiselect-button');
        countryMultiSelectButton?.addEventListener('click', () => {
            document.getElementById('country-multiselect-dropdown').classList.toggle('hidden');
        });

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
        const savedCountries = this.storage.get('countries', ['us']);
        this.selectedCountries = savedCountries;
        this.updateCountryMultiSelectButton();
        
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
        const keyword = searchInput?.value.trim();
        const convertCurrencyCheckbox = document.getElementById('convert-currency-checkbox');
        const currencySelect = document.getElementById('currency-select');

        const convertCurrency = convertCurrencyCheckbox.checked ? currencySelect.value : null;
        
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

        if (this.selectedCountries.length === 0) {
            this.ui.showError(this.i18n.t('countryRequired'));
            return;
        }
        
        try {
            this.isSearching = true;
            this.currentKeyword = keyword;
            
            this.ui.showLoading();
            this.ui.hideSuggestions();
            
            // Create abort controller for this search
            this.currentSearchController = new AbortController();
            
            // Check backend health first
            this.updateLoadingMessage('Checking backend availability...');
            const healthCheck = await this.api.checkHealth();
            if (!healthCheck.available) {
                throw new Error(`Backend server is not running. Please start the backend server first.\n\nTip: Run both servers using the start-dev.sh script or start them separately:\n- Backend: cd backend && npm start\n- Frontend: cd frontend && npm run dev`);
            }
            
            // Update loading messages
            this.updateLoadingStatus();
            
            // Perform the search
            const results = await this.api.searchProducts(keyword, this.selectedCountries, convertCurrency, {
                signal: this.currentSearchController.signal,
                onProgress: (status) => this.updateLoadingMessage(status)
            });
            
            // Handle successful results
            const isComparison = this.selectedCountries.length > 1;
            this.ui.showResults(results, this.currentKeyword, isComparison);
            if (!isComparison) {
                this.applyFilters();
            }
            this.saveRecentSearch(keyword);
            
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
    // Custom Country MultiSelect
    // ============================
    buildCountryMultiSelect() {
        const dropdown = document.getElementById('country-multiselect-dropdown');
        const button = document.getElementById('country-multiselect-button');
        if (!dropdown || !button) return;

        const countries = [
            { code: 'us', name: 'United States', flag: '🇺🇸' },
            { code: 'ca', name: 'Canada', flag: '🇨🇦' },
            { code: 'uk', name: 'United Kingdom', flag: '🇬🇧' },
            { code: 'de', name: 'Germany', flag: '🇩🇪' },
            { code: 'fr', name: 'France', flag: '🇫🇷' },
            { code: 'es', name: 'Spain', flag: '🇪🇸' },
            { code: 'it', name: 'Italy', flag: '🇮🇹' },
            { code: 'jp', name: 'Japan', flag: '🇯🇵' },
            { code: 'au', name: 'Australia', flag: '🇦🇺' },
            { code: 'in', name: 'India', flag: '🇮🇳' },
            { code: 'br', name: 'Brazil', flag: '🇧🇷' },
            { code: 'mx', name: 'Mexico', flag: '🇲🇽' },
        ];

        const list = dropdown.querySelector('ul');
        list.innerHTML = countries.map(country => `
            <li>
                <label class="flex items-center px-4 py-2 hover:bg-gray-100 cursor-pointer">
                    <input type="checkbox" value="${country.code}" class="form-checkbox h-4 w-4 text-amazon-orange focus:ring-amazon-orange border-gray-300 rounded">
                    <span class="ml-3 text-sm text-gray-700">${country.flag} ${country.name}</span>
                </label>
            </li>
        `).join('');

        list.addEventListener('change', (e) => {
            if (e.target.type === 'checkbox') {
                const selected = Array.from(list.querySelectorAll('input:checked')).map(input => input.value);
                if (selected.length > 3) {
                    e.target.checked = false;
                    alert('You can select up to 3 regions.');
                    return;
                }
                this.selectedCountries = selected;
                this.storage.set('countries', this.selectedCountries);
                this.updateCountryMultiSelectButton();
            }
        });

        // Set initial state
        this.selectedCountries.forEach(code => {
            const checkbox = list.querySelector(`input[value="${code}"]`);
            if (checkbox) checkbox.checked = true;
        });
        this.updateCountryMultiSelectButton();
    }

    updateCountryMultiSelectButton() {
        const button = document.getElementById('country-multiselect-button');
        if (!button) return;

        if (this.selectedCountries.length === 0) {
            button.textContent = this.i18n.t('selectRegions');
        } else if (this.selectedCountries.length === 1) {
             button.textContent = this.i18n.getCountryName(this.selectedCountries[0]);
        } else {
            button.textContent = `${this.selectedCountries.length} ${this.i18n.t('regions')}`;
        }

        const comparisonOptions = document.getElementById('comparison-options');
        if (this.selectedCountries.length > 1) {
            comparisonOptions.classList.remove('hidden');
        } else {
            comparisonOptions.classList.add('hidden');
        }
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
                if (found) btn.innerHTML = `<span class="text-base">${found.flag}</span><span>${found.label}</span><svg class=\"-mr-1 h-4 w-4 text-gray-500\" xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 20 20\" fill=\"currentColor\"><path fill-rule=\"evenodd\" d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z\" clip-rule=\"evenodd\"/></svg>`;
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
