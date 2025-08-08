# Components and Modules

This document describes the main modules, UI patterns, and architecture of the Amazon Product Scraper frontend.

## 🏗️ Module Architecture

### `src/modules/api.js`
**Backend API client with modern features:**

```javascript
class API {
  constructor(baseUrl = import.meta.env.VITE_API_BASE_URL || '/api')
  
  // Main method for product search
  async searchProducts(keyword, country, options = {})
  // Options: { signal: AbortController.signal, onProgress: Function }
}
```

**Features:**
- AbortController support for cancellable requests
- Progress callbacks for loading states
- Automatic request timeout (30s)
- Error normalization and retry logic
- Configurable base URL via environment variables

### `src/modules/i18n.js`
**Internationalization with dynamic loading:**

```javascript
class I18n {
  constructor() // Auto-detects default locale from VITE_DEFAULT_LOCALE
  
  async init()                    // Load default language translations
  async loadLanguage(lang)        // Load specific language
  setLanguage(lang)              // Change language and apply translations  
  t(key, params = {})            // Translate key with parameter interpolation
  applyTranslations()            // Apply translations to DOM elements
}
```

**Features:**
- Dynamic JSON loading from `/locales/{lang}.json`
- Template parameter interpolation: `{{count}}`, `{{keyword}}`
- Automatic DOM updates via `data-i18n` attributes
- Fallback to key name if translation missing
- Shared instance pattern (fixed in Aug 2025 update)

### `src/modules/storage.js`
**localStorage wrapper with safety:**

```javascript
class Storage {
  constructor(prefix = 'amazon-scraper')
  
  get(key, defaultValue = null)   // Get with fallback
  set(key, value)                 // Set with JSON serialization
  remove(key)                     // Remove specific key
  clearAll()                      // Clear all prefixed keys
}
```

**Features:**
- Automatic JSON serialization/deserialization
- Key prefixing to avoid conflicts
- Error handling for quota exceeded
- Graceful fallback when localStorage unavailable

### `src/modules/ui.js`
**UI rendering and state management:**

```javascript
class UI {
  constructor(i18n)               // Requires shared i18n instance
  
  // Loading states
  showLoading() / hideLoading()
  renderSkeletons(count = 8)      // Animated skeleton cards
  
  // Error handling
  showError(message) / hideError()
  
  // Results display  
  showResults(products, keyword)   // Render product grid
  renderProductCard(product)       // Individual product card
  
  // Search suggestions
  showSuggestions(list, query) / hideSuggestions()
  
  // Utilities
  renderStars(rating)             // Star rating display
  formatReviews(count)            // Review count formatting
}
```

**Features:**
- Skeleton loading animations
- Responsive product grid (1-4 columns)
- Search suggestions with highlighting
- Accessibility-focused markup
- Amazon-inspired visual design

## 🎨 UI Patterns

### Product Cards
- **Layout**: Image + title + price + rating + reviews + CTA button
- **Styling**: Tailwind utilities with custom classes in `src/styles.css`
- **Accessibility**: Alt text, external link indicators, keyboard focusable
- **Performance**: Lazy loading images, optimized for mobile

### Loading States
- **Skeleton screens**: Animated placeholders during API calls
- **Progressive messages**: "Connecting" → "Searching" → "Processing"
- **Cancellation**: ESC key or AbortController for user control

### Search Experience
- **Real-time suggestions**: From localStorage recent searches
- **Debounced input**: 300ms delay to avoid excessive API calls
- **Keyboard navigation**: Arrow keys, Enter, ESC support
- **Visual feedback**: Highlighting matched text in suggestions

## 🌍 Internationalization

### Translation Files
Location: `public/locales/{lang}.json`

```json
{
  "searchPlaceholder": "Enter product keyword...",
  "resultsCount": "{{count}} products found",
  "multipleReviews": "{{count}} reviews",
  "viewProduct": "View on Amazon"
}
```

### Implementation
```html
<!-- Static translations -->
<h1 data-i18n="title">Amazon Product Scraper</h1>
<input data-i18n-placeholder="searchPlaceholder" />

<!-- Dynamic translations -->
<script>
const message = i18n.t('resultsCount', { count: 42 });
// → "42 products found"
</script>
```

### Supported Languages
- **English** (`en`) - Default
- **Portuguese** (`pt`) - Brazilian Portuguese  
- **Spanish** (`es`) - International Spanish

## 🔧 Extending the Frontend

### Adding New Modules
1. Create `src/modules/your-module.js`
2. Export class or functions
3. Import in `main.js` and integrate
4. Follow ES module patterns

### Adding New Languages
1. Create `public/locales/{lang}.json`
2. Copy structure from `en.json`
3. Translate all keys
4. Add language to `i18n.js` supported array
5. Update language selector in UI

### Customizing UI
1. **Styles**: Modify `src/styles.css` (Tailwind components)
2. **Layout**: Update HTML structure in `ui.js` render methods
3. **Behavior**: Extend classes or add event listeners in `main.js`

## 🚀 Performance Optimizations

- **Code splitting**: Vite automatically splits modules
- **Tree shaking**: Unused code eliminated in build
- **Asset optimization**: Images, fonts, and icons optimized
- **Caching**: Proper cache headers for static assets
- **Lazy loading**: Images and non-critical resources
- **Debouncing**: Search input and API calls optimized

---

*Last updated: January 2025 - Reflects current modular architecture and i18n fixes*

