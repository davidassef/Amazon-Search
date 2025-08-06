// Configuration
const API_BASE_URL = 'http://localhost:3000';

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

/**
 * Initialize the application
 */
function init() {
    // Add event listeners
    searchButton.addEventListener('click', handleSearch);
    searchInput.addEventListener('keypress', handleKeyPress);
    searchInput.addEventListener('input', handleInputChange);
    
    // Focus on search input
    searchInput.focus();
    
    console.log('Amazon Product Scraper initialized');
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
 * Handle input changes to enable/disable search button
 */
function handleInputChange() {
    const keyword = searchInput.value.trim();
    searchButton.disabled = keyword.length < 2;
}

/**
 * Handle search button click
 */
async function handleSearch() {
    const keyword = searchInput.value.trim();
    
    // Validate input
    if (!keyword) {
        showError('Please enter a search keyword');
        return;
    }
    
    if (keyword.length < 2) {
        showError('Search keyword must be at least 2 characters long');
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
        showError(error.message || 'Failed to search products. Please try again.');
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
    resultsCount.textContent = `${products.length} products found`;
    searchKeyword.textContent = `for "${keyword}"`;
    
    // Clear previous results
    productsList.innerHTML = '';
    
    // Check if we have products
    if (products.length === 0) {
        showError(`No products found for "${keyword}". Try a different search term.`);
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
        <div class="product-details">
            <div class="product-rating">
                ${ratingStars}
                ${product.rating !== 'N/A' ? product.rating : ''}
            </div>
            <div class="product-reviews">
                ${reviewsText}
            </div>
        </div>
    `;
    
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
        return '<span class="stars">No rating</span>';
    }
    
    const numRating = parseFloat(rating);
    if (isNaN(numRating)) {
        return '<span class="stars">No rating</span>';
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
        return 'No reviews';
    }
    
    const reviewsStr = String(reviews);
    return `${reviewsStr} ${reviewsStr === '1' ? 'review' : 'reviews'}`;
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
