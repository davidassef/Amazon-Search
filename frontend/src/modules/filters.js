export class ProductFilters {
    constructor() {
        this.filters = {
            minPrice: null,
            maxPrice: null,
            minRating: null,
            brand: '',
            dateFrom: null,
            dateTo: null,
            freeShipping: false,
            sortBy: 'relevance'
        };
    }

    // Apply all active filters to products
    apply(products) {
        if (!products || !Array.isArray(products)) return [];

        let filtered = [...products];

        // Apply price filters
        if (this.filters.minPrice !== null) {
            filtered = filtered.filter(product => {
                const price = this.extractPrice(product.price);
                return price >= this.filters.minPrice;
            });
        }

        if (this.filters.maxPrice !== null) {
            filtered = filtered.filter(product => {
                const price = this.extractPrice(product.price);
                return price <= this.filters.maxPrice;
            });
        }

        // Apply rating filter
        if (this.filters.minRating !== null) {
            filtered = filtered.filter(product => {
                const rating = this.extractRating(product.rating);
                return rating >= this.filters.minRating;
            });
        }

        // Apply brand filter (checks product.brand and title)
        if (this.filters.brand && this.filters.brand.trim().length > 0) {
            const b = this.filters.brand.trim().toLowerCase();
            filtered = filtered.filter(product => {
                const brand = (product.brand || '').toLowerCase();
                const title = (product.title || '').toLowerCase();
                return brand.includes(b) || title.includes(b);
            });
        }

        // Apply date range filter
        if (this.filters.dateFrom || this.filters.dateTo) {
            const from = this.filters.dateFrom ? new Date(this.filters.dateFrom).getTime() : null;
            const to = this.filters.dateTo ? new Date(this.filters.dateTo).getTime() : null;
            filtered = filtered.filter(product => {
                const ts = this.extractTimestamp(product);
                if (!ts) return false;
                if (from && ts < from) return false;
                if (to && ts > to) return false;
                return true;
            });
        }

        // Apply free shipping filter
        if (this.filters.freeShipping) {
            filtered = filtered.filter(product => 
                product.shippingInfo?.toLowerCase().includes('free shipping')
            );
        }

        // Apply sorting
        filtered = this.sortProducts(filtered);

        return filtered;
    }

    // Extract numeric price from price string (e.g., "$19.99" -> 19.99)
    extractPrice(priceStr) {
        if (!priceStr) return 0;
        const numericValue = priceStr.replace(/[^0-9.,]+/g, '').replace(',', '.');
        return parseFloat(numericValue) || 0;
    }

    // Extract numeric rating from various formats (e.g., '4.5', '4,5', '4.5 out of 5')
    extractRating(rating) {
        const max = 5;
        if (typeof rating === 'number') {
          return Math.min(Math.max(rating, 0), max);
        }
        const str = String(rating || '').trim();
        const m = str.match(/\d+[\.,]?\d*/);
        const num = m ? parseFloat(m[0].replace(',', '.')) : 0;
        const clamped = Math.min(Math.max(num || 0, 0), max);
        return clamped;
    }

    // Extract timestamp from various potential fields
    extractTimestamp(product) {
        const raw = product?.date || product?.listedAt || product?.timestamp || product?.postedAt || product?.publishedAt;
        if (!raw) return null;
        const ts = Date.parse(raw);
        return isNaN(ts) ? null : ts;
    }

    // Sort products based on selected criteria
    sortProducts(products) {
        const sorted = [...products];
        
        switch (this.filters.sortBy) {
            case 'price-asc':
                return sorted.sort((a, b) => 
                    this.extractPrice(a.price) - this.extractPrice(b.price)
                );
                
            case 'price-desc':
                return sorted.sort((a, b) => 
                    this.extractPrice(b.price) - this.extractPrice(a.price)
                );
                
            case 'rating-asc':
                return sorted.sort((a, b) => 
                    this.extractRating(a.rating) - this.extractRating(b.rating)
                );

            case 'rating-desc':
                return sorted.sort((a, b) => 
                    this.extractRating(b.rating) - this.extractRating(a.rating)
                );
                
            case 'date-desc': {
                return sorted.sort((a, b) => (this.extractTimestamp(b) || 0) - (this.extractTimestamp(a) || 0));
            }
            case 'date-asc': {
                return sorted.sort((a, b) => (this.extractTimestamp(a) || 0) - (this.extractTimestamp(b) || 0));
            }

            case 'newest':
                // Assuming newer products have higher IDs or timestamps
                return sorted.reverse();
                
            case 'relevance':
            default:
                return sorted;
        }
    }

    // Update filters from form inputs
    updateFromForm() {
        const minPrice = document.getElementById('min-price')?.value;
        const maxPrice = document.getElementById('max-price')?.value;
        const minRating = document.getElementById('min-rating')?.value;
        const brand = document.getElementById('brand')?.value || '';
        const dateFrom = document.getElementById('date-from')?.value || null;
        const dateTo = document.getElementById('date-to')?.value || null;
        const freeShipping = document.getElementById('free-shipping')?.checked;
        const sortBy = document.getElementById('sort-by')?.value;

        this.filters = {
            minPrice: minPrice ? parseFloat(minPrice) : null,
            maxPrice: maxPrice ? parseFloat(maxPrice) : null,
            minRating: minRating ? parseFloat(minRating) : null,
            brand: brand,
            dateFrom: dateFrom,
            dateTo: dateTo,
            freeShipping: !!freeShipping,
            sortBy: sortBy || 'relevance'
        };

        return this.filters;
    }

    // Reset all filters to default values
    reset() {
        this.filters = {
            minPrice: null,
            maxPrice: null,
            minRating: null,
            brand: '',
            dateFrom: null,
            dateTo: null,
            freeShipping: false,
            sortBy: 'relevance'
        };
        
        // Reset form inputs
        if (document.getElementById('min-price')) document.getElementById('min-price').value = '';
        if (document.getElementById('max-price')) document.getElementById('max-price').value = '';
        if (document.getElementById('min-rating')) document.getElementById('min-rating').value = '';
        if (document.getElementById('brand')) document.getElementById('brand').value = '';
        if (document.getElementById('date-from')) document.getElementById('date-from').value = '';
        if (document.getElementById('date-to')) document.getElementById('date-to').value = '';
        if (document.getElementById('free-shipping')) document.getElementById('free-shipping').checked = false;
        if (document.getElementById('sort-by')) document.getElementById('sort-by').value = 'relevance';
        
        return this.filters;
    }
}
