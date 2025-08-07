// Import i18next
import './i18n.js';

// DOM elements
const searchInput = document.getElementById('searchInput');
const searchButton = document.getElementById('searchButton');
const buttonText = searchButton.querySelector('.button-text');
const loadingSpinner = searchButton.querySelector('.loading-spinner');
const loadingMessage = document.getElementById('loadingMessage');
const errorMessage = document.getElementById('errorMessage');
const resultsContainer = document.getElementById('resultsContainer');
const productsList = document.getElementById('productsList');
const resultsCount = document.getElementById('resultsCount');
const searchKeyword = document.getElementById('searchKeyword');
const languageSelect = document.getElementById('languageSelect');

// API configuration
const API_BASE_URL = 'http://localhost:3000';
const API_ENDPOINT = '/api/scrape';

/**
 * Initialize the application
 */
function init() {
    // Event listeners
    searchButton.addEventListener('click', handleSearch);
    searchInput.addEventListener('keypress', handleKeyPress);
    languageSelect.addEventListener('change', handleLanguageChange);
    
    // Set initial focus
    searchInput.focus();
    
    // Initialize translations when i18next is ready
    if (window.i18next && window.i18next.isInitialized) {
        updateTranslations();
        setLanguageFromStorage();
    } else {
        document.addEventListener('i18nextInitialized', (event) => {
            console.log('Received i18nextInitialized event');
            updateTranslations();
            setLanguageFromStorage();
        });
        
        // Fallback: try again after a short delay
        setTimeout(() => {
            if (window.i18next && window.i18next.isInitialized && !document.querySelector('[data-i18n]').innerHTML.includes('{{')) {
                console.log('Fallback: Applying translations');
                updateTranslations();
                setLanguageFromStorage();
            }
        }, 500);
    }
}

/**
 * Handle search button click
 */
async function handleSearch() {
    const keyword = searchInput.value.trim();
    
    // Validate input
    if (!keyword) {
        showError(window.i18next?.t('keywordRequired') || 'Please enter a search keyword');
        return;
    }
    
    if (keyword.length < 2) {
        showError(window.i18next?.t('keywordTooShort') || 'Keyword must be at least 2 characters long');
        return;
    }
    
    // Clear previous results
    hideMessages();
    
    try {
        setLoadingState(true);
        
        // Make API request
        const response = await fetch(`${API_BASE_URL}${API_ENDPOINT}?keyword=${encodeURIComponent(keyword)}`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (!data.success) {
            throw new Error(data.message || 'API request failed');
        }
        
        // Display results
        displayResults(data.products, keyword);
        
    } catch (error) {
        console.error('Search error:', error);
        showError(error.message || window.i18next?.t('errorMessage') || 'An error occurred while searching');
    } finally {
        setLoadingState(false);
    }
}

/**
 * Display search results
 */
function displayResults(products, keyword) {
    if (!products || products.length === 0) {
        showError(window.i18next?.t('noProductsError', { keyword }) || `No products found for "${keyword}"`);
        return;
    }
    
    // Update results info
    resultsCount.textContent = `${products.length} products found`;
    searchKeyword.textContent = `"${keyword}"`;
    
    // Clear previous results
    productsList.innerHTML = '';
    
    // Create product cards
    products.forEach((product, index) => {
        const productCard = createProductCard(product, index);
        productsList.appendChild(productCard);
    });
    
    // Show results
    resultsContainer.classList.remove('hidden');
}

/**
 * Create product card
 */
function createProductCard(product, index) {
    const card = document.createElement('div');
    card.className = 'product-card group relative';
    
    // Format rating stars
    const ratingStars = formatRating(product.rating);
    
    // Format reviews count
    const reviewsText = formatReviews(product.reviews);
    
    // Format price
    const priceText = formatPrice(product.price);
    
    // Determine link type and button text
    const isSearchLink = product.productUrl && product.productUrl.includes('/s?k=');
    const buttonText = isSearchLink 
        ? (window.i18next?.t('searchOnAmazon') || 'Search on Amazon')
        : (window.i18next?.t('viewProduct') || 'View on Amazon');
    
    // Handle image error
    const imageUrl = product.imageUrl && product.imageUrl !== 'N/A' 
        ? product.imageUrl 
        : 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRjhGOUZBIi8+CjxwYXRoIGQ9Ik0xMDAgMTIwQzExMC40NTcgMTIwIDEyMCAxMTAuNDU3IDEyMCAxMDBDMTIwIDg5LjU0MyAxMTAuNDU3IDgwIDEwMCA4MEM4OS41NDMgODAgODAgODkuNTQzIDgwIDEwMEM4MCAxMTAuNDU3IDg5LjU0MyAxMjAgMTAwIDEyMFoiIGZpbGw9IiNEMUQ1REIiLz4KPC9zdmc+';
    
    card.innerHTML = `
        <div class="relative overflow-hidden">
            <img 
                src="${imageUrl}"
                alt="${escapeHtml(product.title)}"
                class="w-full h-48 object-contain bg-gray-50 group-hover:scale-105 transition-transform duration-300"
                loading="lazy"
                onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRjhGOUZBIi8+CjxwYXRoIGQ9Ik0xMDAgMTIwQzExMC40NTcgMTIwIDEyMCAxMTAuNDU3IDEyMCAxMDBDMTIwIDg5LjU0MyAxMTAuNDU3IDgwIDEwMCA4MEM4OS41NDMgODAgODAgODkuNTQzIDgwIDEwMEM4MCAxMTAuNDU3IDg5LjU0MyAxMjAgMTAwIDEyMFoiIGZpbGw9IiNEMUQ1REIiLz4KPC9zdmc+'"
            >
            <div class="absolute top-2 right-2 bg-amazon-orange text-white text-xs font-bold px-2 py-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                Amazon
            </div>
        </div>
        
        <div class="p-4 space-y-3">
            <h3 class="font-semibold text-gray-800 line-clamp-2 text-sm leading-snug group-hover:text-amazon-lightblue transition-colors duration-200"
                title="${escapeHtml(product.title)}">
                ${escapeHtml(product.title)}
            </h3>
            
            <div class="text-xl font-bold text-amazon-orange">
                ${priceText}
            </div>
            
            <div class="flex items-center justify-between text-sm">
                <div class="flex items-center space-x-1">
                    ${ratingStars}
                    ${product.rating !== 'N/A' ? `<span class="text-gray-600">${product.rating}</span>` : ''}
                </div>
                <div class="text-gray-500 text-xs">
                    ${reviewsText}
                </div>
            </div>
            
            <button class="view-product-btn w-full mt-4 bg-amazon-lightblue hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 transform hover:scale-105 ${isSearchLink ? 'search-link' : 'direct-link'}"
                    data-product-url="${product.productUrl}"
                    title="${isSearchLink ? 'Search for this product on Amazon' : 'Go directly to product page'}">
                ${buttonText}
                ${isSearchLink ? ' 🔍' : ' →'}
            </button>
        </div>
    `;
    
    // Add click handlers - now works for all products since we always have a URL
    const viewBtn = card.querySelector('.view-product-btn');
    if (viewBtn && product.productUrl && product.productUrl !== 'N/A') {
        viewBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            console.log('Opening URL:', product.productUrl);
            window.open(product.productUrl, '_blank', 'noopener,noreferrer');
        });
    }
    
    // Make entire card clickable if we have URL
    if (product.productUrl && product.productUrl !== 'N/A') {
        card.style.cursor = 'pointer';
        card.addEventListener('click', () => {
            console.log('Card clicked, opening URL:', product.productUrl);
            window.open(product.productUrl, '_blank', 'noopener,noreferrer');
        });
    } else {
        console.warn('Product has no URL:', product.title);
    }
    
    return card;
}

/**
 * Format rating as stars
 */
function formatRating(rating) {
    if (!rating || rating === 'N/A') {
        return `<span class="text-gray-400 text-sm">${window.i18next?.t('noRating') || 'No rating'}</span>`;
    }
    
    const numRating = parseFloat(rating);
    if (isNaN(numRating)) {
        return `<span class="text-gray-400 text-sm">${window.i18next?.t('noRating') || 'No rating'}</span>`;
    }
    
    const fullStars = Math.floor(numRating);
    const hasHalfStar = numRating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
    
    let stars = '';
    stars += '<span class="text-yellow-400">★</span>'.repeat(fullStars);
    if (hasHalfStar) stars += '<span class="text-yellow-400">☆</span>';
    stars += '<span class="text-gray-300">☆</span>'.repeat(emptyStars);
    
    return `<div class="flex items-center">${stars}</div>`;
}

/**
 * Format reviews count
 */
function formatReviews(reviews) {
    if (!reviews || reviews === 'N/A' || reviews === '0') {
        return window.i18next?.t('noReviews') || 'No reviews';
    }
    return `(${reviews})`;
}

/**
 * Format price
 */
function formatPrice(price) {
    if (!price || price === 'N/A') {
        return window.i18next?.t('priceNotAvailable') || 'Price not available';
    }
    return price;
}

/**
 * Handle Enter key press in search input
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
    if (window.i18next) {
        console.log('Changing language to:', selectedLanguage);
        window.i18next.changeLanguage(selectedLanguage).then(() => {
            updateTranslations();
            console.log('Language changed and translations updated');
        });
        localStorage.setItem('selectedLanguage', selectedLanguage);
    }
}

/**
 * Update all translations in the DOM
 */
function updateTranslations() {
    if (!window.i18next) return;
    
    console.log('Updating translations...');
    
    // Update elements with data-i18n attribute
    document.querySelectorAll('[data-i18n]').forEach(element => {
        const key = element.getAttribute('data-i18n');
        const translation = window.i18next.t(key);
        if (translation !== key) { // Only update if translation exists
            element.textContent = translation;
        }
    });
    
    // Update placeholder
    const placeholder = document.querySelector('[data-i18n-placeholder]');
    if (placeholder) {
        const key = placeholder.getAttribute('data-i18n-placeholder');
        const translation = window.i18next.t(key);
        if (translation !== key) {
            placeholder.placeholder = translation;
        }
    }
}

/**
 * Set language selector from localStorage
 */
function setLanguageFromStorage() {
    const savedLanguage = localStorage.getItem('selectedLanguage');
    if (savedLanguage && languageSelect) {
        languageSelect.value = savedLanguage;
        console.log('Set language selector to:', savedLanguage);
    }
}

/**
 * Set loading state
 */
function setLoadingState(isLoading) {
    searchButton.disabled = isLoading;
    
    if (isLoading) {
        buttonText.classList.add('hidden');
        loadingSpinner.classList.remove('hidden');
        loadingMessage.classList.remove('hidden');
        searchInput.disabled = true;
    } else {
        buttonText.classList.remove('hidden');
        loadingSpinner.classList.add('hidden');
        loadingMessage.classList.add('hidden');
        searchInput.disabled = false;
        searchInput.focus();
    }
}

/**
 * Show error message
 */
function showError(message) {
    const errorText = document.getElementById('errorText');
    if (errorText) {
        errorText.textContent = message;
    }
    errorMessage.classList.remove('hidden');
    resultsContainer.classList.add('hidden');
    
    // Hide error after 5 seconds
    setTimeout(() => {
        errorMessage.classList.add('hidden');
    }, 5000);
}

/**
 * Hide all messages
 */
function hideMessages() {
    loadingMessage.classList.add('hidden');
    errorMessage.classList.add('hidden');
}

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', init);

export { 
    handleSearch, 
    displayResults, 
    createProductCard, 
    init, 
    handleKeyPress, 
    handleLanguageChange, 
    updateTranslations,
    setLanguageFromStorage,
    setLoadingState, 
    showError, 
    hideMessages, 
    escapeHtml,
    formatRating,
    formatReviews,
    formatPrice
};