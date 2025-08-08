// Main application entry point
import { API } from './src/modules/api.js';
import { UI } from './src/modules/ui.js';
import { I18n } from './src/modules/i18n.js';
import { Storage } from './src/modules/storage.js';

class AmazonScraper {
    constructor() {
        this.api = new API();
        this.i18n = new I18n();
        this.ui = new UI(this.i18n); // Pass i18n instance to UI
        this.storage = new Storage();
        
        this.isSearching = false;
        this.currentSearchController = null;
        
        this.init();
    }
    
    async init() {
        try {
            // Initialize internationalization
            await this.i18n.init();
            
            // Load saved settings
            this.loadSettings();
            
            // Initialize UI components
            this.initializeEventListeners();
            
            // Apply initial translations
            this.i18n.applyTranslations();
            
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
        
        // Country selection
        const countrySelect = document.getElementById('country-select');
        countrySelect?.addEventListener('change', (e) => this.handleCountryChange(e));
        
        // Search input for suggestions
        const searchInput = document.getElementById('search-input');
        searchInput?.addEventListener('input', (e) => this.handleSearchInput(e));
        searchInput?.addEventListener('focus', (e) => this.handleSearchFocus(e));
        searchInput?.addEventListener('blur', (e) => this.handleSearchBlur(e));
        
        // Retry button
        const retryButton = document.getElementById('retry-button');
        retryButton?.addEventListener('click', () => this.handleRetry());
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => this.handleKeydown(e));
        
        // Click outside to close suggestions
        document.addEventListener('click', (e) => this.handleDocumentClick(e));
    }
    
    loadSettings() {
        // Load language preference
        const savedLanguage = this.storage.get('language', 'en');
        const languageSelect = document.getElementById('language-select');
        if (languageSelect) {
            languageSelect.value = savedLanguage;
            this.i18n.setLanguage(savedLanguage);
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
                this.ui.showResults(results.products, keyword);
                this.saveRecentSearch(keyword);
            } else {
                this.ui.showError(this.i18n.t('noProductsError', { keyword }));
            }
            
        } catch (error) {
            console.error('Search error:', error);
            
            if (error.name === 'AbortError') {
                console.log('Search was cancelled');
                return;
            }
            
            let errorMessage = this.i18n.t('errorMessage');
            
            if (error.message === 'NO_PRODUCTS_FOUND') {
                errorMessage = this.i18n.t('noProductsError', { keyword });
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
    
    handleLanguageChange(event) {
        const language = event.target.value;
        this.i18n.setLanguage(language);
        this.storage.set('language', language);
        this.i18n.applyTranslations();
    }
    
    handleCountryChange(event) {
        const country = event.target.value;
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
    
    handleDocumentClick(event) {
        const suggestions = document.getElementById('suggestions');
        const searchInput = document.getElementById('search-input');
        
        if (suggestions && 
            !suggestions.contains(event.target) && 
            !searchInput?.contains(event.target)) {
            this.ui.hideSuggestions();
        }
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
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.amazonScraper = new AmazonScraper();
});

// Export for potential external use
export { AmazonScraper };
