# Component-Based CSS System

This document provides examples of how to update your HTML to use the new component-based CSS system.

## Updated HTML Structure Examples

### 1. Search Input (Updated)

**Before:**
```html
<input 
  type="text" 
  id="searchInput" 
  class="search-input"
  placeholder="Enter product name..."
>
```

**After (Enhanced with BEM):**
```html
<div class="search-input-group">
  <div class="search-input-group__icon">
    <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
      <path d="M21.53 20.47l-3.66-3.66C19.195 15.24 20 13.214 20 11c0-4.97-4.03-9-9-9s-9 4.03-9 9 4.03 9 9 9c2.215 0 4.24-.804 5.808-2.13l3.66 3.66c.147.146.34.22.53.22s.385-.073.53-.22c.295-.293.295-.767.002-1.06zM3.5 11c0-4.135 3.365-7.5 7.5-7.5s7.5 3.365 7.5 7.5-3.365 7.5-7.5 7.5-7.5-3.365-7.5-7.5z"/>
    </svg>
  </div>
  <input 
    type="text" 
    id="searchInput" 
    class="search-input search-input--with-icon"
    placeholder="Enter product name..."
    aria-label="Product search"
  >
</div>
```

### 2. Primary Button (Updated)

**Before:**
```html
<button id="searchButton" type="submit" class="search-button">
  <span class="button-text">Search Products</span>
  <span class="loading-spinner hidden">
    <svg class="animate-spin h-6 w-6 text-white">...</svg>
  </span>
</button>
```

**After (Enhanced with BEM):**
```html
<button id="searchButton" type="submit" class="btn-primary">
  <div class="btn-primary__spinner u-hidden">
    <svg class="u-animate-spin" width="20" height="20" fill="none" viewBox="0 0 24 24">
      <circle class="u-opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
      <path class="u-opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
  </div>
  <span class="btn-primary__text">Search Products</span>
</button>
```

### 3. Product Card (Updated)

**Before (existing structure):**
```html
<div class="product-card group relative">
  <div class="relative overflow-hidden">
    <img src="..." alt="..." class="w-full h-48 object-contain bg-gray-50 group-hover:scale-105 transition-transform duration-300">
    <div class="absolute top-2 right-2 bg-amazon-orange text-white text-xs font-bold px-2 py-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300">
      Amazon
    </div>
  </div>
  
  <div class="p-4 space-y-3">
    <h3 class="font-semibold text-gray-900 line-clamp-2 text-sm leading-snug group-hover:text-amazon-lightblue transition-colors duration-200">
      Product Title
    </h3>
    
    <div class="text-xl font-bold text-amazon-orange">
      $29.99
    </div>
    
    <div class="flex items-center justify-between text-sm">
      <div class="flex items-center space-x-1">
        <!-- Rating stars -->
        <span class="text-gray-600">4.0</span>
      </div>
      <div class="text-gray-500 text-xs">
        (123)
      </div>
    </div>
    
    <button class="product-button">
      View on Amazon →
    </button>
  </div>
</div>
```

**After (Enhanced with BEM):**
```html
<div class="product-card">
  <div class="product-card__image-container">
    <img 
      class="product-card__image" 
      src="..." 
      alt="Product Title"
      loading="lazy"
    >
    <div class="product-card__badge">Amazon</div>
  </div>
  
  <div class="product-card__content">
    <h3 class="product-card__title">
      Product Title Here That Can Span Multiple Lines
    </h3>
    
    <div class="product-card__price">$29.99</div>
    
    <div class="product-card__rating">
      <div class="product-card__stars">
        <span class="product-card__star">★</span>
        <span class="product-card__star">★</span>
        <span class="product-card__star">★</span>
        <span class="product-card__star">★</span>
        <span class="product-card__star product-card__star--empty">☆</span>
        <span class="product-card__rating-value">4.0</span>
      </div>
      <div class="product-card__reviews">(123)</div>
    </div>
    
    <button class="product-card__action" data-product-url="...">
      View on Amazon →
    </button>
  </div>
</div>
```

### 4. Skeleton Cards (New)

**Before (basic loading state):**
```html
<div id="skeletonLoading" class="hidden skeleton-grid">
  <div class="skeleton-card">
    <div class="skeleton-image"></div>
    <div class="skeleton-content">
      <div class="skeleton-title"></div>
      <div class="skeleton-price"></div>
    </div>
  </div>
</div>
```

**After (Enhanced BEM structure):**
```html
<div id="skeletonLoading" class="u-hidden">
  <div class="skeleton-card-grid">
    <div class="skeleton-card">
      <div class="skeleton-card__image"></div>
      <div class="skeleton-card__content">
        <div class="skeleton-card__title"></div>
        <div class="skeleton-card__title-line"></div>
        <div class="skeleton-card__price"></div>
        <div class="skeleton-card__rating">
          <div class="skeleton-card__stars">
            <div class="skeleton-card__star"></div>
            <div class="skeleton-card__star"></div>
            <div class="skeleton-card__star"></div>
            <div class="skeleton-card__star"></div>
            <div class="skeleton-card__star"></div>
          </div>
          <div class="skeleton-card__reviews"></div>
        </div>
        <div class="skeleton-card__action"></div>
      </div>
    </div>
    <!-- Repeat for multiple skeleton cards -->
    <div class="skeleton-card">...</div>
    <div class="skeleton-card">...</div>
    <div class="skeleton-card">...</div>
  </div>
</div>
```

### 5. Product Grid (Updated)

**Before:**
```html
<div id="productsList" class="results-grid">
  <!-- Products inserted here -->
</div>
```

**After:**
```html
<div id="productsList" class="product-card-grid">
  <!-- Products inserted here using the new product-card structure -->
</div>
```

## JavaScript Updates

### Button State Management

```javascript
// Loading state
function setButtonLoading(isLoading) {
  const button = document.getElementById('searchButton');
  const spinner = button.querySelector('.btn-primary__spinner');
  const text = button.querySelector('.btn-primary__text');
  
  if (isLoading) {
    button.classList.add('btn-primary--loading');
    spinner.classList.remove('u-hidden');
    text.classList.add('u-hidden');
    button.disabled = true;
  } else {
    button.classList.remove('btn-primary--loading');
    spinner.classList.add('u-hidden');
    text.classList.remove('u-hidden');
    button.disabled = false;
  }
}
```

### Product Card Creation

```javascript
function createProductCard(product) {
  const card = document.createElement('div');
  card.className = 'product-card';
  
  // Format rating stars
  const ratingStars = formatRating(product.rating);
  const priceText = formatPrice(product.price);
  const reviewsText = formatReviews(product.reviews);
  
  card.innerHTML = `
    <div class="product-card__image-container">
      <img 
        class="product-card__image" 
        src="${product.imageUrl}"
        alt="${escapeHtml(product.title)}"
        loading="lazy"
        onerror="this.src='data:image/svg+xml;base64,...'"
      >
      <div class="product-card__badge">Amazon</div>
    </div>
    
    <div class="product-card__content">
      <h3 class="product-card__title" title="${escapeHtml(product.title)}">
        ${escapeHtml(product.title)}
      </h3>
      
      <div class="product-card__price">${priceText}</div>
      
      <div class="product-card__rating">
        <div class="product-card__stars">
          ${ratingStars}
        </div>
        <div class="product-card__reviews">${reviewsText}</div>
      </div>
      
      <button class="product-card__action" data-product-url="${product.productUrl}">
        View on Amazon →
      </button>
    </div>
  `;
  
  return card;
}
```

## CSS Import Update

Update your main CSS file to import the new component system:

**src/style.css:**
```css
/* Import the new component system */
@import './components.css';

/* Keep existing Tailwind utilities if needed */
/* Your existing styles can coexist */
```

## Benefits of This System

1. **Consistent Design**: All components follow the same design tokens
2. **Maintainable**: BEM methodology makes classes predictable and organized
3. **Themeable**: CSS custom properties allow easy theme customization
4. **Accessible**: Built-in focus states, reduced motion, and high contrast support
5. **Responsive**: Mobile-first responsive design baked in
6. **Performance**: Optimized animations and loading states
7. **Scalable**: Easy to add new components following the same patterns

## Migration Strategy

1. Import the new component system CSS
2. Update HTML structure component by component
3. Update JavaScript to use new class names
4. Test thoroughly on all screen sizes
5. Gradually remove old Tailwind classes that are now covered by components
6. Keep Tailwind for unique layouts and spacing that aren't covered by components
