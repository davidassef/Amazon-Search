// Configuration
const API_BASE_URL = 'http://localhost:3000';

// Import i18n
import './i18n.js';
import i18next from 'i18next';

// DOM Elements
const searchInput = document.getElementById('searchInput');
const searchButton = document.getElementById('searchButton');
const loadingMessage = document.getElementById('loadingMessage');
const errorMessage = document.getElementById('errorMessage');
const resultsContainer = document.getElementById('resultsContainer');
const productsList = document.getElementById('productsList');
const resultsCount = document.getElementById('resultsCount');
const searchKeyword = document.getElementById('searchKeyword');
const buttonText = document.querySelector('.button-text');
const loadingSpinner = document.querySelector('.loading-spinner');
const languageSelect = document.getElementById('languageSelect');

/**
 * Initialize the application
 */
function init() {
    // Initialize translations
    updateTranslations();
    
    // Set initial language to English as default
    const defaultLanguage = 'en';
    const savedLanguage = localStorage.getItem('selectedLanguage') || defaultLanguage;
    languageSelect.value = savedLanguage;
    i18next.changeLanguage(savedLanguage);
    
    // If no language was saved, save English as default
    if (!localStorage.getItem('selectedLanguage')) {
        localStorage.setItem('selectedLanguage', defaultLanguage);
    }
    
    // Add event listeners
    searchButton.addEventListener('click', handleSearch);
    searchInput.addEventListener('keypress', handleKeyPress);
    searchInput.addEventListener('input', handleInputChange);
    languageSelect.addEventListener('change', handleLanguageChange);
    
    // Listen for language changes
    i18next.on('languageChanged', updateTranslations);
    
    // Focus on search input
    searchInput.focus();
    
    console.log('Amazon Product Scraper initialized');
}

/**
 * Handle input changes to enable/disable search button
 */
function handleInputChange() {
    const keyword = searchInput.value.trim();
    searchButton.disabled = keyword.length < 2;
}

/**
 * Handle language change
 */
function handleLanguageChange() {
    const selectedLanguage = languageSelect.value;
    i18next.changeLanguage(selectedLanguage);
    localStorage.setItem('selectedLanguage', selectedLanguage);
}

/**
 * Update all translations in the interface
 */
function updateTranslations() {
    // Update all elements with data-i18n attribute
    document.querySelectorAll('[data-i18n]').forEach(element => {
        const key = element.getAttribute('data-i18n');
        element.textContent = i18next.t(key);
    });
    
    // Update placeholder text
    document.querySelectorAll('[data-i18n-placeholder]').forEach(element => {
        const key = element.getAttribute('data-i18n-placeholder');
        element.placeholder = i18next.t(key);
    });
}

/**
 * Handle Enter key press in search input
 * @param {KeyboardEvent} event 
 */
function handleKeyPress(event) {
    if (event.key === 'Enter') {
        event.preventDefault();
        handleSearch();
    }
}

/**
 * Handle language change
 */
function handleLanguageChange() {
    const selectedLanguage = languageSelect.value;
    i18next.changeLanguage(selectedLanguage);
    localStorage.setItem('selectedLanguage', selectedLanguage);
}

/**
 * Update all translations in the DOM
 */
function updateTranslations() {
    // Update elements with data-i18n attribute
    document.querySelectorAll('[data-i18n]').forEach(element => {
        const key = element.getAttribute('data-i18n');
        element.textContent = i18next.t(key);
    });
    
    // Update placeholder
    const placeholder = document.querySelector('[data-i18n-placeholder]');
    if (placeholder) {
        const key = placeholder.getAttribute('data-i18n-placeholder');
        placeholder.placeholder = i18next.t(key);
    }
}

/**
 * Handle search button click
 */
async function handleSearch() {
    const keyword = searchInput.value.trim();
    
    // Validate input
    if (!keyword) {
        showError(i18next.t('keywordRequired'));
        return;
    }
    
    if (keyword.length < 2) {
        showError(i18next.t('keywordTooShort'));
        return;
    }
    
    try {
        // Show loading state
        setLoadingState(true);
        hideMessages();
        
        // Make API request
        const products = await searchProducts(keyword);
        
        // Display results
        displayResults(keyword, products);
        
    } catch (error) {
        console.error('Search error:', error);
        showError(error.message || i18next.t('errorMessage'));
    } finally {
        setLoadingState(false);
    }
}

/**
 * Search for products using the API
 * @param {string} keyword - Search keyword
 * @returns {Promise<Array>} Array of products
 */
async function searchProducts(keyword) {
    const url = `${API_BASE_URL}/api/scrape?keyword=${encodeURIComponent(keyword)}`;
    
    console.log(`Searching for: ${keyword}`);
    
    const response = await fetch(url, {
        method: 'GET',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
        },
        // Add timeout
        signal: AbortSignal.timeout(30000) // 30 seconds
    });
    
    const data = await response.json();
    
    if (!response.ok) {
        throw new Error(data.error || `HTTP ${response.status}: ${response.statusText}`);
    }
    
    if (!data.success) {
        throw new Error(data.error || 'Search was not successful');
    }
    
    return data.products || [];
}

/**
 * Display search results
 * @param {string} keyword - Search keyword
 * @param {Array} products - Array of products
 */
function displayResults(keyword, products) {
    console.log(`Displaying ${products.length} products for: ${keyword}`);
    
    // Update results info
    resultsCount.textContent = i18next.t('resultsCount', { count: products.length });
    searchKeyword.textContent = i18next.t('resultsKeyword', { keyword });
    
    // Clear previous results
    productsList.innerHTML = '';
    
    // Check if we have products
    if (products.length === 0) {
        showError(i18next.t('noProductsError', { keyword }));
        return;
    }
    
    // Create product cards
    products.forEach((product, index) => {
        const productCard = createProductCard(product, index);
        productsList.appendChild(productCard);
    });
    
    // Show results container
    resultsContainer.style.display = 'block';
    
    // Scroll to results
    resultsContainer.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'start' 
    });
}

/**
 * Create a product card element
 * @param {Object} product - Product data
 * @param {number} index - Product index
 * @returns {HTMLElement} Product card element
 */
function createProductCard(product, index) {
    const card = document.createElement('div');
    card.className = 'product-card';
    
    // Format rating stars
    const ratingStars = formatRating(product.rating);
    
    // Format reviews count
    const reviewsText = formatReviews(product.reviews);
    
    // Format price
    const priceText = formatPrice(product.price);
    
    // Handle image error
    const imageUrl = product.imageUrl && product.imageUrl !== 'N/A' 
        ? product.imageUrl 
        : 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRjhGOUZBIi8+CjxwYXRoIGQ9Ik0xMDAgMTIwQzExMC40NTcgMTIwIDEyMCAxMTAuNDU3IDEyMCAxMDBDMTIwIDg5LjU0MyAxMTAuNDU3IDgwIDEwMCA4MEM4OS41NDMgODAgODAgODkuNTQzIDgwIDEwMEM4MCAxMTAuNDU3IDg5LjU0MyAxMjAgMTAwIDEyMFoiIGZpbGw9IiNEMUQ1REIiLz4KPHA+CjwvcGF0aD4KPC9zdmc+';
    
    card.innerHTML = `
        <img 
            src="${imageUrl}" 
            alt="${escapeHtml(product.title)}"
            class="product-image"
            loading="lazy"
            onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRjhGOUZBIi8+CjxwYXRoIGQ9Ik0xMDAgMTIwQzExMC40NTcgMTIwIDEyMCAxMTAuNDU3IDEyMCAxMDBDMTIwIDg5LjU0MyAxMTAuNDU3IDgwIDEwMCA4MEM4OS41NDMgODAgODAgODkuNTQzIDgwIDEwMEM4MCAxMTAuNDU3IDg5LjU0MyAxMjAgMTAwIDEyMFoiIGZpbGw9IiNEMUQ1REIiLz4KPC9zdmc+'"
        >
        <div class="product-title" title="${escapeHtml(product.title)}">
            ${escapeHtml(product.title)}
        </div>
        <div class="product-price">
            ${priceText}
        </div>
        <div class="product-details">
            <div class="product-rating">
                ${ratingStars}
                ${product.rating !== 'N/A' ? product.rating : ''}
            </div>
            <div class="product-reviews">
                ${reviewsText}
            </div>
        </div>
        <div class="product-actions">
            <button class="view-product-btn" data-product-url="${product.productUrl}">
                ${i18next.t('viewProduct')}
            </button>
        </div>
    `;
    
    // Add click handlers
    const viewBtn = card.querySelector('.view-product-btn');
    if (viewBtn && product.productUrl !== 'N/A') {
        viewBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            window.open(product.productUrl, '_blank', 'noopener,noreferrer');
        });
    }
    
    // Make entire card clickable if we have URL
    if (product.productUrl !== 'N/A') {
        card.style.cursor = 'pointer';
        card.addEventListener('click', () => {
            window.open(product.productUrl, '_blank', 'noopener,noreferrer');
        });
    }
    
    // Add animation delay
    card.style.animationDelay = `${index * 0.1}s`;
    
    return card;
}

/**
 * Format rating as stars
 * @param {string|number} rating - Rating value
 * @returns {string} Formatted stars HTML
 */
function formatRating(rating) {
    if (!rating || rating === 'N/A') {
        return `<span class="stars">${i18next.t('noRating')}</span>`;
    }
    
    const numRating = parseFloat(rating);
    if (isNaN(numRating)) {
        return `<span class="stars">${i18next.t('noRating')}</span>`;
    }
    
    const fullStars = Math.floor(numRating);
    const hasHalfStar = numRating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
    
    let stars = '';
    stars += '★'.repeat(fullStars);
    if (hasHalfStar) stars += '☆';
    stars += '☆'.repeat(emptyStars);
    
    return `<span class="stars">${stars}</span>`;
}

/**
 * Format reviews count
 * @param {string|number} reviews - Reviews count
 * @returns {string} Formatted reviews text
 */
function formatReviews(reviews) {
    if (!reviews || reviews === 'N/A') {
        return i18next.t('noReviews');
    }
    
    const reviewsStr = String(reviews).replace(/,/g, '');
    const reviewCount = parseInt(reviewsStr);
    
    if (isNaN(reviewCount)) {
        return i18next.t('noReviews');
    }
    
    if (reviewCount === 1) {
        return i18next.t('oneReview');
    }
    
    return i18next.t('multipleReviews', { count: reviews });
}

/**
 * Format price
 * @param {string} price - Price value
 * @returns {string} Formatted price text
 */
function formatPrice(price) {
    if (!price || price === 'N/A') {
        return i18next.t('noPrice');
    }
    
    return price;
}

/**
 * Escape HTML to prevent XSS
 * @param {string} text - Text to escape
 * @returns {string} Escaped text
 */
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * Set loading state
 * @param {boolean} isLoading - Loading state
 */
function setLoadingState(isLoading) {
    searchButton.disabled = isLoading;
    
    if (isLoading) {
        buttonText.style.display = 'none';
        loadingSpinner.style.display = 'inline-block';
        loadingMessage.style.display = 'block';
        searchInput.disabled = true;
    } else {
        buttonText.style.display = 'inline-block';
        loadingSpinner.style.display = 'none';
        loadingMessage.style.display = 'none';
        searchInput.disabled = false;
        searchInput.focus();
    }
}

/**
 * Show error message
 * @param {string} message - Error message
 */
function showError(message) {
    errorMessage.querySelector('p').textContent = message;
    errorMessage.style.display = 'block';
    resultsContainer.style.display = 'none';
    
    // Hide error after 5 seconds
    setTimeout(() => {
        errorMessage.style.display = 'none';
    }, 5000);
}

/**
 * Hide all messages
 */
function hideMessages() {
    loadingMessage.style.display = 'none';
    errorMessage.style.display = 'none';
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', init);
