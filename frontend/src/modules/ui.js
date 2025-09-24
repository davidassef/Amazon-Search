// UI components and rendering module
export class UI {
  constructor(i18n) {
    this.i18n = i18n; // Use shared i18n instance
    this.currentResults = [];
    this.currentKeyword = '';
  }

  // Loading state handlers
  showLoading() {
    this.hideError();
    const loadingSection = document.getElementById('loading-section');
    loadingSection?.classList.remove('hidden');
    document.getElementById('results-section')?.classList.add('hidden');
    const status = document.getElementById('loading-status');
    if (status) status.textContent = '';

    // Render skeleton screens while loading
    this.renderSkeletons(8);
  }

  hideLoading() {
    document.getElementById('loading-section')?.classList.add('hidden');
    // Clear skeletons when hiding loading
    const container = document.getElementById('loading-skeletons');
    if (container) container.innerHTML = '';
  }

  // Error state
  showError(message) {
    this.hideLoading();
    const errorSection = document.getElementById('error-section');
    const errorMessage = document.getElementById('error-message');
    if (errorSection && errorMessage) {
      errorMessage.textContent = message || this.i18n.t('errorMessage');
      errorSection.classList.remove('hidden');
      errorSection.classList.add('fade-in');
    }
  }

  hideError() {
    document.getElementById('error-section')?.classList.add('hidden');
  }

  // Results rendering
  showResults(data, keyword, isComparison) {
    this.hideLoading();
    this.hideError();

    const resultsSection = document.getElementById('results-section');
    if (!resultsSection) return;

    this.currentKeyword = keyword || '';

    // Display currency conversion info if available
    if (data.conversionInfo) {
      this.showConversionInfo(data.conversionInfo);
    }

    if (isComparison) {
        this.renderComparisonView(data);
    } else {
        const products = data.results ? Object.values(data.results)[0].products : [];
        this.currentResults = products;
        this.renderSingleGridView(products);
    }
    // Always ensure filters are visible when results are shown
    document.getElementById('filter-toggle').classList.remove('hidden');
    document.getElementById('sort-by').classList.remove('hidden');

    // Show section
    resultsSection.classList.remove('hidden');
    resultsSection.classList.add('slide-in');
    
    // Update filters summary
    this.updateFiltersSummary();
  }

  showConversionInfo(conversionInfo) {
    // Create or update conversion info banner
    let conversionBanner = document.getElementById('conversion-info-banner');
    if (!conversionBanner) {
      conversionBanner = document.createElement('div');
      conversionBanner.id = 'conversion-info-banner';
      conversionBanner.className = 'bg-blue-50 border-l-4 border-blue-400 p-4 mb-4 rounded-md';
      
      const resultsSection = document.getElementById('results-section');
      const resultsGrid = document.getElementById('results-grid');
      resultsSection.insertBefore(conversionBanner, resultsGrid);
    }

    const statusIcon = conversionInfo.isFallback ? 
      '⚠️' : '✅';
    const statusText = conversionInfo.isFallback ? 
      this.i18n.t('usingFallbackRates') || 'Using fallback exchange rates' :
      this.i18n.t('usingLiveRates') || 'Using live exchange rates';

    conversionBanner.innerHTML = `
      <div class="flex">
        <div class="flex-shrink-0">
          <span class="text-xl">${statusIcon}</span>
        </div>
        <div class="ml-3">
          <p class="text-sm text-blue-700">
            <strong>${statusText}</strong><br>
            ${this.i18n.t('ratesLastUpdated') || 'Exchange rates last updated'}: ${conversionInfo.lastUpdate}
            ${conversionInfo.isFallback ? `<br><em>${this.i18n.t('fallbackRatesNote') || 'Note: Using approximate exchange rates due to API unavailability'}</em>` : ''}
          </p>
        </div>
      </div>
    `;
  }

  renderSingleGridView(products) {
    const resultsGrid = document.getElementById('results-grid');
    const comparisonGrid = document.getElementById('comparison-results-grid');
    const resultsCount = document.getElementById('results-count');
    const resultsKeyword = document.getElementById('results-keyword');

    resultsGrid.innerHTML = products.map((p) => this.renderProductCard(p)).join('');
    resultsGrid.classList.remove('hidden');
    comparisonGrid.classList.add('hidden');

    resultsCount.textContent = this.i18n.t('resultsCount', { count: products.length });
    resultsKeyword.textContent = this.i18n.t('resultsKeyword', { keyword: this.currentKeyword });
  }

  renderComparisonView(data) {
    const resultsGrid = document.getElementById('results-grid');
    const comparisonGrid = document.getElementById('comparison-results-grid');
    const resultsCount = document.getElementById('results-count');
    const resultsKeyword = document.getElementById('results-keyword');

    resultsGrid.classList.add('hidden');
    comparisonGrid.classList.remove('hidden');

    const domains = Object.keys(data.results);

    // Create a flex container for the columns
    let columnsHTML = '<div class="flex flex-col md:flex-row gap-6">';

    domains.forEach((domain, index) => {
      const result = data.results[domain];
      const products = result.products || [];

      // Add a separator for all columns except the first one
      const separatorClass = index > 0 ? 'md:border-l md:border-gray-200 md:pl-6' : '';

      // Start column
      columnsHTML += `<div class="flex-1 min-w-0 ${separatorClass}">`;

      // Column Header
      columnsHTML += `<h3 class="text-lg font-bold text-center mb-4 p-2 bg-yellow-400 text-white rounded-t-lg" style="text-shadow: 1px 1px 1px #000;">${domain}</h3>`;

      // Products Grid for this column
      columnsHTML += '<div class="grid grid-cols-1 gap-6">';
      if (products.length > 0) {
        columnsHTML += products.map(p => this.renderProductCard(p)).join('');
      } else {
        columnsHTML += `<p class="text-center text-gray-500">${this.i18n.t('noResults')}</p>`;
      }
      columnsHTML += '</div>'; // End products grid

      columnsHTML += '</div>'; // End column
    });

    columnsHTML += '</div>'; // End flex container

    comparisonGrid.innerHTML = columnsHTML;

    // Also update the main results header
    if (resultsCount) resultsCount.textContent = this.i18n.t('comparisonTitleWithKeyword', { keyword: this.currentKeyword });
    if (resultsKeyword) resultsKeyword.textContent = ''; // This span is no longer needed
  }

  renderProductCard(product) {
    const ratingStars = this.renderStars(product.rating || 0);
    const reviewsText = this.formatReviews(product.reviews || 0);

    let priceHTML = '';
    
    // Enhanced currency conversion display with better validation
    if (product.convertedPrice && 
        product.convertedPrice !== 'N/A' && 
        product.convertedPrice !== null && 
        product.convertedPrice !== undefined &&
        product.convertedPrice.trim() !== '') {
        
        // Show converted price prominently, original price smaller
        const originalCurrency = product.originalCurrency || '';
        const originalPrice = product.originalPrice || product.price;
        
        priceHTML = `
            <div class="product-price text-lg font-bold text-green-600" title="Converted price">${product.convertedPrice}</div>
            <div class="text-sm text-gray-500" title="Original price">
                <span class="original-price">${originalPrice}</span>
                ${originalCurrency ? `<span class="ml-1 text-xs">(${originalCurrency})</span>` : ''}
            </div>
        `;
    } else {
        // Fallback to original price with clearer indication when conversion was attempted but failed
        const priceDisplayText = product.price || this.i18n.t('priceNotAvailable');
        const failedConversionNote = (product.convertedPrice === 'N/A') ? 
            ` title="Currency conversion not available"` : '';
        
        priceHTML = `<div class="product-price"${failedConversionNote}>${priceDisplayText}</div>`;
    }

    return `
      <article class="product-card">
        <a href="${product.url}" target="_blank" rel="noopener noreferrer" class="block">
          <img src="${product.image}" alt="${product.title}" class="product-image" loading="lazy" />
        </a>
        <div class="p-4">
          <h3 class="product-title">${product.title}</h3>
          ${priceHTML}
          <div class="product-rating">
            ${ratingStars}
            <span class="product-reviews">${reviewsText}</span>
          </div>
          <a href="${product.url}" target="_blank" rel="noopener noreferrer" class="product-link" data-i18n="viewProduct">${this.i18n.t('viewProduct')}</a>
        </div>
      </article>
    `;
  }

  renderStars(rating) {
    const maxStars = 5;
    // Parse rating safely from possible formats like "4.5", "4,5", "4.5 out of 5"
    const numeric = (() => {
      if (typeof rating === 'number') return rating;
      const str = String(rating).trim();
      const m = str.match(/\d+[\.,]?\d*/);
      if (!m) return 0;
      return parseFloat(m[0].replace(',', '.')) || 0;
    })();
    const clamped = Math.min(Math.max(numeric, 0), maxStars);
    const filled = Math.round(clamped);
    const empty = maxStars - filled;

    const starFilled = '<svg class="star star-filled" viewBox="0 0 20 20" fill="currentColor"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.2 3.674a1 1 0 00.95.69h3.862c.969 0 1.371 1.24.588 1.81l-3.125 2.27a1 1 0 00-.364 1.118l1.2 3.674c.3.921-.755 1.688-1.538 1.118l-3.125-2.27a1 1 0 00-1.176 0l-3.125 2.27c-.783.57-1.838-.197-1.538-1.118l1.2-3.674a1 1 0 00-.364-1.118L2.349 9.1c-.783-.57-.38-1.81.588-1.81h3.862a1 1 0 00.95-.69l1.2-3.674z"/></svg>';
    const starEmpty = '<svg class="star star-empty" viewBox="0 0 20 20" fill="currentColor"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.2 3.674a1 1 0 00.95.69h3.862c.969 0 1.371 1.24.588 1.81l-3.125 2.27a1 1 0 00-.364 1.118l1.2 3.674c.3.921-.755 1.688-1.538 1.118l-3.125-2.27a1 1 0 00-1.176 0l-3.125 2.27c-.783.57-1.838-.197-1.538-1.118l1.2-3.674a1 1 0 00-.364-1.118L2.349 9.1c-.783-.57-.38-1.81.588-1.81h3.862a1 1 0 00.95-.69l1.2-3.674z"/></svg>';

    return `${starFilled.repeat(filled)}${starEmpty.repeat(empty)}`;
  }

  formatReviews(count) {
    if (!count || count === 0) return this.i18n.t('noReviews');
    if (count === 1) return this.i18n.t('oneReview');
    return this.i18n.t('multipleReviews', { count });
  }

  // Suggestions UI
  showSuggestions(suggestions, query) {
    const container = document.getElementById('suggestions');
    if (!container) return;

    if (!suggestions.length) {
      container.innerHTML = `<div class="suggestion-item" tabindex="0">${this.i18n.t('noSuggestions')}</div>`;
      container.classList.remove('hidden');
      return;
    }

    const regex = new RegExp(`(${query})`, 'gi');
    container.innerHTML = suggestions
      .map((s) => {
        const highlighted = s.replace(regex, '<span class="suggestion-highlight">$1</span>');
        return `<div class="suggestion-item" tabindex="0" data-value="${s}">${highlighted}</div>`;
      })
      .join('');

    container.classList.remove('hidden');

    // Click/keyboard interaction
    container.querySelectorAll('.suggestion-item').forEach((el) => {
      el.addEventListener('click', () => {
        const value = el.getAttribute('data-value');
        const input = document.getElementById('search-input');
        if (input && value) {
          input.value = value;
          const form = document.getElementById('search-form');
          form?.dispatchEvent(new Event('submit'));
        }
      });
    });
  }

  hideSuggestions() {
    document.getElementById('suggestions')?.classList.add('hidden');
  }

  setRecentSearches(list) {
    this.recentSearches = Array.isArray(list) ? list : [];
  }

  // Skeleton rendering under the loading section
  renderSkeletons(count = 8) {
    const loadingSection = document.getElementById('loading-section');
    if (!loadingSection) return;

    let container = document.getElementById('loading-skeletons');
    if (!container) {
      container = document.createElement('div');
      container.id = 'loading-skeletons';
      container.className = 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mt-8';
      loadingSection.appendChild(container);
    }

    const card = `
      <article class="product-card animate-pulse">
        <div class="block">
          <div class="product-image bg-gray-200"></div>
        </div>
        <div class="p-4">
          <div class="h-5 bg-gray-200 rounded w-3/4 mb-3"></div>
          <div class="h-4 bg-gray-200 rounded w-1/3 mb-3"></div>
          <div class="flex items-center gap-2 mb-2">
            <div class="h-4 bg-gray-200 rounded w-24"></div>
            <div class="h-4 bg-gray-200 rounded w-12"></div>
          </div>
          <div class="h-9 bg-gray-200 rounded w-28"></div>
        </div>
      </article>`;

    container.innerHTML = new Array(count).fill(card).join('');
  }
  
  // Update filters summary based on active filters
  updateFiltersSummary() {
    const filtersSummary = document.getElementById('filters-summary');
    const activeFilters = [];
    
    // Check price range
    const minPrice = document.getElementById('min-price')?.value;
    const maxPrice = document.getElementById('max-price')?.value;
    
    if (minPrice) {
      activeFilters.push({
        key: 'minPrice',
        label: this.i18n.t('minPrice') + `: ${minPrice}`,
        value: minPrice
      });
    }
    if (maxPrice) {
      activeFilters.push({
        key: 'maxPrice',
        label: this.i18n.t('maxPrice') + `: ${maxPrice}`,
        value: maxPrice
      });
    }
    
    // Check rating
    const minRating = document.getElementById('min-rating')?.value;
    if (minRating) {
      activeFilters.push({
        key: 'minRating',
        label: this.i18n.t('ratingAndUp', { rating: minRating }),
        value: minRating
      });
    }
    
    // Check brand
    const brand = document.getElementById('brand')?.value;
    if (brand && brand.trim().length > 0) {
      activeFilters.push({
        key: 'brand',
        label: this.i18n.t('brand') + `: ${brand.trim()}`,
        value: brand.trim()
      });
    }

    // Check date range
    const dateFrom = document.getElementById('date-from')?.value;
    const dateTo = document.getElementById('date-to')?.value;
    if (dateFrom || dateTo) {
      const fromLabel = dateFrom ? new Date(dateFrom).toLocaleDateString() : '—';
      const toLabel = dateTo ? new Date(dateTo).toLocaleDateString() : '—';
      activeFilters.push({
        key: 'dateRange',
        label: `${this.i18n.t('dateRange')}: ${fromLabel} - ${toLabel}`,
        value: `${dateFrom || ''}|${dateTo || ''}`
      });
    }

    // Check free shipping
    const freeShipping = document.getElementById('free-shipping')?.checked;
    if (freeShipping) {
      activeFilters.push({
        key: 'freeShipping',
        label: this.i18n.t('freeShipping'),
        value: true
      });
    }
    
    // Update UI
    if (filtersSummary) {
      if (activeFilters.length > 0) {
        filtersSummary.innerHTML = `
          <div class="flex flex-wrap items-center gap-2">
            <span class="text-sm font-medium text-gray-700">${this.i18n.t('activeFilters')}:</span>
            ${activeFilters.map(filter => `
              <div class="flex items-center gap-1 bg-blue-50 text-blue-700 text-xs font-medium px-2.5 py-1 rounded-full border border-blue-100">
                <span>${filter.label}</span>
                <button 
                  class="ml-1 text-blue-500 hover:text-blue-700 focus:outline-none"
                  data-filter-key="${filter.key}"
                  aria-label="${this.i18n.t('removeFilter', { filter: filter.label })}"
                >
                  <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                  </svg>
                </button>
              </div>
            `).join('')}
            <button 
              id="clear-filters" 
              class="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center gap-1 px-2 py-1 hover:bg-blue-50 rounded-md transition-colors"
            >
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
              </svg>
              <span>${this.i18n.t('clearAll')}</span>
            </button>
          </div>
        `;
        
        // Add event listeners to clear filters buttons
        activeFilters.forEach(filter => {
          const removeBtn = filtersSummary.querySelector(`[data-filter-key="${filter.key}"]`);
          if (removeBtn) {
            removeBtn.addEventListener('click', (e) => {
              e.preventDefault();
              this.clearSingleFilter(filter.key);
            });
          }
        });
        
        const clearFiltersBtn = document.getElementById('clear-filters');
        if (clearFiltersBtn) {
          clearFiltersBtn.addEventListener('click', (e) => {
            e.preventDefault();
            this.clearFilters();
          });
        }
        
        filtersSummary.classList.remove('hidden');
      } else {
        filtersSummary.classList.add('hidden');
      }
    }
  }
  
  // Clear a single filter
  clearSingleFilter(filterKey) {
    switch(filterKey) {
      case 'minPrice':
        document.getElementById('min-price').value = '';
        break;
      case 'maxPrice':
        document.getElementById('max-price').value = '';
        break;
      case 'minRating':
        document.getElementById('min-rating').value = '';
        break;
      case 'brand':
        document.getElementById('brand').value = '';
        break;
      case 'dateRange':
        if (document.getElementById('date-from')) document.getElementById('date-from').value = '';
        if (document.getElementById('date-to')) document.getElementById('date-to').value = '';
        break;
      case 'freeShipping':
        document.getElementById('free-shipping').checked = false;
        break;
    }
    
    // Trigger filter change via form submit (so main.js can handle it)
    const form = document.getElementById('filters-form');
    if (form) {
      form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    }
  }
  
  // Clear all filters
  clearFilters() {
    // Reset form inputs
    const form = document.getElementById('filters-form');
    if (form) {
      form.reset();
    }
    
    // Reset sort to default
    const sortBy = document.getElementById('sort-by');
    if (sortBy) {
      sortBy.value = 'relevance';
    }
    
    // Trigger filter change via form submit (handled by main.js)
    const formEl = document.getElementById('filters-form');
    if (formEl) {
      formEl.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    }
  }
}

