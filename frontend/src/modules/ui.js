// UI components and rendering module
export class UI {
  constructor(i18n) {
    this.i18n = i18n; // Use shared i18n instance
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
  showResults(products, keyword) {
    this.hideLoading();
    this.hideError();

    const resultsSection = document.getElementById('results-section');
    const resultsGrid = document.getElementById('results-grid');
    const resultsCount = document.getElementById('results-count');
    const resultsKeyword = document.getElementById('results-keyword');

    if (!resultsSection || !resultsGrid) return;

    // Update header info
    resultsCount.textContent = this.i18n.t('resultsCount', { count: products.length });
    resultsKeyword.textContent = ` ${this.i18n.t('resultsKeyword', { keyword })}`;

    // Render product cards
    resultsGrid.innerHTML = products.map((p) => this.renderProductCard(p)).join('');

    // Show section
    resultsSection.classList.remove('hidden');
    resultsSection.classList.add('slide-in');
  }

  renderProductCard(product) {
    const ratingStars = this.renderStars(product.rating || 0);
    const reviewsText = this.formatReviews(product.reviews || 0);
    const priceText = product.price || this.i18n.t('priceNotAvailable');

    return `
      <article class="product-card">
        <a href="${product.url}" target="_blank" rel="noopener noreferrer" class="block">
          <img src="${product.image}" alt="${product.title}" class="product-image" loading="lazy" />
        </a>
        <div class="p-4">
          <h3 class="product-title">${product.title}</h3>
          <div class="product-price">${priceText}</div>
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
    const filled = Math.round(Math.min(Math.max(rating, 0), maxStars));
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
}

