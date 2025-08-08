# Contributing Guidelines

## 🤝 Welcome Contributors

Thank you for your interest in contributing to the Amazon Product Scraper! This guide provides comprehensive information on how to contribute effectively to this project.

---

## 📋 Quick Start for Contributors

### 1. Get the Codebase

```bash
# Fork the repository on GitHub
# Then clone your fork
git clone https://github.com/YOUR_USERNAME/Amazon-Search.git
cd Amazon-Search

# Add upstream remote
git remote add upstream https://github.com/davidassef/Amazon-Search.git
```

### 2. Set Up Development Environment

```bash
# Install backend dependencies
cd backend
bun install

# Install frontend dependencies
cd ../frontend
bun install

# Start development servers
# Terminal 1 - Backend
cd backend && bun run dev

# Terminal 2 - Frontend
cd frontend && bun run dev
```

### 3. Make Your First Contribution

```bash
# Create a feature branch
git checkout -b feature/your-feature-name

# Make your changes
# ... code changes ...

# Run tests
cd frontend && bun test
cd ../backend && bun test  # (when Jest/Bun compatibility is fixed)

# Commit and push
git add .
git commit -m "feat: add your feature description"
git push origin feature/your-feature-name

# Create a Pull Request on GitHub
```

---

## 🎯 Types of Contributions

### 🐛 Bug Reports
- Report issues with detailed reproduction steps
- Include environment information
- Provide expected vs actual behavior

### ✨ Feature Requests
- Propose new functionality
- Explain use cases and benefits
- Discuss implementation approach

### 🔧 Code Contributions
- Bug fixes and improvements
- New features and enhancements
- Performance optimizations
- Test coverage improvements

### 📚 Documentation
- README improvements
- Code documentation
- Tutorial creation
- API documentation updates

### 🧪 Testing
- Writing unit tests
- Integration test improvements
- End-to-end testing
- Performance testing

---

## 🏗️ Development Workflow

### Branch Naming Convention

```bash
# Feature branches
feature/add-search-suggestions
feature/improve-error-handling

# Bug fix branches
bugfix/fix-rating-parsing
bugfix/cors-configuration

# Documentation branches
docs/api-documentation
docs/contributing-guide

# Chore/maintenance branches
chore/update-dependencies
chore/refactor-selectors
```

### Commit Message Format

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

#### Types:
- `feat`: New features
- `fix`: Bug fixes
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Build process or auxiliary tool changes

#### Examples:

```bash
# Feature
git commit -m "feat(scraper): add support for Amazon.de domain"

# Bug fix
git commit -m "fix(parser): handle missing product ratings gracefully"

# Documentation
git commit -m "docs: update installation guide for Bun runtime"

# Refactoring
git commit -m "refactor(api): extract domain configuration to separate module"

# Tests
git commit -m "test(frontend): add unit tests for search component"
```

### Pull Request Process

1. **Before Creating PR**:
   ```bash
   # Update your fork
   git checkout main
   git pull upstream main
   git push origin main
   
   # Rebase your feature branch
   git checkout feature/your-feature
   git rebase main
   ```

2. **PR Description Template**:
   ```markdown
   ## Description
   Brief description of changes
   
   ## Type of Change
   - [ ] Bug fix
   - [ ] New feature
   - [ ] Breaking change
   - [ ] Documentation update
   
   ## Testing
   - [ ] Unit tests pass
   - [ ] Integration tests pass
   - [ ] Manual testing completed
   
   ## Checklist
   - [ ] Code follows style guidelines
   - [ ] Self-review completed
   - [ ] Documentation updated
   - [ ] Tests added/updated
   ```

3. **PR Review Process**:
   - Automated checks must pass
   - At least one maintainer approval required
   - Address review comments
   - Maintain clean commit history

---

## 💻 Coding Standards

### JavaScript/TypeScript Style

#### General Guidelines

```javascript
// ✅ Good: Use descriptive names
const amazonProductScraper = new AmazonScraper();
const searchKeyword = 'laptop';

// ❌ Bad: Unclear abbreviations
const aps = new AmazonScraper();
const kwd = 'laptop';

// ✅ Good: Consistent function naming
async function searchProducts(keyword, domain) {
  // Implementation
}

// ✅ Good: Clear error handling
try {
  const products = await scraper.searchProducts(keyword);
  return products;
} catch (error) {
  console.error('Search failed:', error.message);
  throw new ScrapingError('Failed to fetch products', error);
}
```

#### Code Organization

```javascript
// ✅ Good: Organized imports
// Third-party dependencies
const express = require('express');
const axios = require('axios');

// Internal modules
const { scrapeAmazonProducts } = require('./services/scraper');
const { validateSearchParams } = require('./utils/validation');

// ✅ Good: Consistent async/await usage
async function handleSearchRequest(req, res) {
  try {
    const { keyword, domain = 'amazon.com' } = req.query;
    
    // Validate input
    validateSearchParams({ keyword, domain });
    
    // Process request
    const products = await scrapeAmazonProducts(keyword, domain);
    
    // Return response
    res.json({
      success: true,
      products,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}
```

### CSS/Styling Guidelines

#### Tailwind CSS Best Practices

```css
/* ✅ Good: Semantic class grouping */
.product-card {
  @apply flex flex-col p-4 bg-white rounded-lg shadow-md
         hover:shadow-lg transition-shadow duration-200
         md:flex-row md:p-6;
}

/* ✅ Good: Responsive design */
.search-input {
  @apply w-full px-4 py-2 text-sm border border-gray-300 rounded-md
         focus:ring-2 focus:ring-blue-500 focus:border-blue-500
         sm:text-base;
}

/* ✅ Good: Custom properties for consistency */
:root {
  --amazon-orange: #FF9900;
  --amazon-blue: #232F3E;
  --transition-duration: 200ms;
}
```

#### Mobile-First Approach

```css
/* ✅ Good: Mobile-first responsive design */
.product-grid {
  @apply grid grid-cols-1 gap-4
         sm:grid-cols-2 
         md:grid-cols-3 
         lg:grid-cols-4;
}

/* ✅ Good: Touch-friendly targets */
.search-button {
  @apply min-h-[44px] min-w-[44px] px-6 py-3
         bg-blue-600 text-white rounded-md
         hover:bg-blue-700 active:bg-blue-800
         focus:ring-2 focus:ring-blue-500;
}
```

---

## 🧪 Testing Guidelines

### Unit Testing Standards

#### Frontend Testing (Vitest)

```javascript
// test/components/SearchForm.test.js
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SearchForm } from '../src/components/SearchForm';

describe('SearchForm', () => {
  let mockOnSearch;
  
  beforeEach(() => {
    mockOnSearch = vi.fn();
  });
  
  it('should call onSearch with keyword when form is submitted', async () => {
    const keyword = 'laptop';
    
    // Render component with props
    render(<SearchForm onSearch={mockOnSearch} />);
    
    // Interact with form
    await user.type(screen.getByPlaceholderText(/search/i), keyword);
    await user.click(screen.getByRole('button', { name: /search/i }));
    
    // Assert behavior
    expect(mockOnSearch).toHaveBeenCalledWith(keyword);
  });
  
  it('should disable submit button when keyword is empty', () => {
    render(<SearchForm onSearch={mockOnSearch} />);
    
    const submitButton = screen.getByRole('button', { name: /search/i });
    expect(submitButton).toBeDisabled();
  });
});
```

#### Backend Testing (Jest)

```javascript
// tests/services/scraper.test.js
const { scrapeAmazonProducts } = require('../src/services/scraper');
const axios = require('axios');

jest.mock('axios');
const mockedAxios = axios;

describe('Amazon Scraper Service', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });
  
  it('should return products for valid search', async () => {
    // Mock HTML response
    const mockHTML = `
      <div data-component-type="s-search-result">
        <h2><a href="/dp/B123"><span>Test Laptop</span></a></h2>
        <span class="a-price-whole">599</span>
        <span class="a-icon-alt">4.5 out of 5 stars</span>
      </div>
    `;
    
    mockedAxios.get.mockResolvedValueOnce({ data: mockHTML });
    
    const products = await scrapeAmazonProducts('laptop');
    
    expect(products).toHaveLength(1);
    expect(products[0]).toMatchObject({
      title: 'Test Laptop',
      price: expect.stringContaining('599'),
      rating: '4.5'
    });
  });
  
  it('should handle network errors gracefully', async () => {
    mockedAxios.get.mockRejectedValueOnce(new Error('Network error'));
    
    await expect(scrapeAmazonProducts('laptop'))
      .rejects.toThrow('Failed to scrape Amazon products');
  });
});
```

### Integration Testing

```javascript
// tests/integration/api.test.js
const request = require('supertest');
const app = require('../src/server');

describe('API Integration Tests', () => {
  describe('GET /api/scrape', () => {
    it('should return products for valid search', async () => {
      const response = await request(app)
        .get('/api/scrape')
        .query({ keyword: 'test' })
        .expect(200);
      
      expect(response.body).toMatchObject({
        success: true,
        keyword: 'test',
        products: expect.any(Array)
      });
    });
    
    it('should return error for missing keyword', async () => {
      const response = await request(app)
        .get('/api/scrape')
        .expect(400);
      
      expect(response.body).toMatchObject({
        success: false,
        error: expect.stringContaining('keyword')
      });
    });
  });
});
```

### Test Coverage Requirements

- **Unit Tests**: Minimum 80% coverage
- **Integration Tests**: All API endpoints
- **Edge Cases**: Error conditions and boundary cases
- **Performance Tests**: Response time benchmarks

---

## 📝 Documentation Standards

### Code Documentation

#### JSDoc Comments

```javascript
/**
 * Scrapes Amazon search results for products
 * @param {string} keyword - Search term for products
 * @param {string} [domain='amazon.com'] - Amazon domain to search
 * @param {number} [retryCount=0] - Current retry attempt
 * @returns {Promise<Product[]>} Array of scraped product objects
 * @throws {ScrapingError} When scraping fails after all retries
 * 
 * @example
 * const products = await scrapeAmazonProducts('laptop', 'amazon.com');
 * console.log(`Found ${products.length} products`);
 */
async function scrapeAmazonProducts(keyword, domain = 'amazon.com', retryCount = 0) {
  // Implementation...
}
```

#### README Updates

When adding features, update relevant documentation:

```markdown
## New Feature: Search Suggestions

### Usage
```javascript
const suggestions = await api.getSearchSuggestions('lapt', 5);
console.log(suggestions); // ['laptop', 'laptop stand', ...]
```

### API Endpoint
- **URL**: `/api/suggestions`
- **Method**: GET
- **Parameters**: 
  - `q` (string): Partial search query
  - `limit` (number, optional): Maximum suggestions (default: 5)
```

### Changelog Updates

```markdown
## [1.2.0] - 2025-01-07

### Added
- Search suggestions API endpoint
- Multi-domain price comparison
- Enhanced error handling with retry logic

### Changed
- Improved mobile responsiveness
- Updated dependency versions

### Fixed
- Rating parsing for products without reviews
- CORS configuration for production deployment
```

---

## 🔍 Code Review Guidelines

### For Contributors

#### Before Submitting PR

```bash
# Self-review checklist
□ Code follows project conventions
□ Tests are added/updated
□ Documentation is updated
□ No console.log statements left
□ No commented-out code
□ Error handling is comprehensive
□ Performance impact considered
```

#### PR Description Best Practices

```markdown
## Summary
Brief description of what the PR accomplishes

## Changes Made
- Specific change 1
- Specific change 2
- Specific change 3

## Testing
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Manual testing on multiple browsers
- [ ] Mobile responsiveness verified

## Screenshots (if UI changes)
Before: [screenshot]
After: [screenshot]

## Breaking Changes
- List any breaking changes
- Migration instructions if needed
```

### For Reviewers

#### Review Checklist

```markdown
□ Code quality and readability
□ Adherence to project conventions
□ Adequate test coverage
□ Security considerations
□ Performance implications
□ Documentation completeness
□ Browser compatibility (if frontend)
□ Mobile responsiveness (if UI)
```

#### Providing Feedback

```markdown
// ✅ Good: Constructive feedback
Consider using async/await instead of Promise chains for better readability:

```javascript
// Instead of
return fetchData().then(data => processData(data)).then(result => result);

// Consider
const data = await fetchData();
const result = await processData(data);
return result;
```

// ✅ Good: Specific suggestions
The error handling could be more specific. Consider catching different error types:

```javascript
try {
  // operation
} catch (error) {
  if (error instanceof NetworkError) {
    // handle network errors
  } else if (error instanceof ParseError) {
    // handle parsing errors
  }
  throw error;
}
```
```

---

## 🏷️ Release Process

### Version Numbering

We follow [Semantic Versioning](https://semver.org/):

- **MAJOR**: Breaking changes
- **MINOR**: New features (backward compatible)
- **PATCH**: Bug fixes (backward compatible)

### Release Checklist

```markdown
□ All tests pass
□ Documentation updated
□ Changelog updated
□ Version bumped in package.json
□ Git tag created
□ Release notes written
□ Deployment tested
```

### Creating a Release

```bash
# Update version
npm version patch  # or minor, major

# Update changelog
# Update CHANGELOG.md with new version info

# Create release commit
git add .
git commit -m "chore: release v1.2.3"

# Create and push tag
git tag v1.2.3
git push origin main --tags

# Create GitHub release with notes
gh release create v1.2.3 --notes-file RELEASE_NOTES.md
```

---

## 🤔 Getting Help

### Discussion Channels

- **GitHub Issues**: Bug reports and feature requests
- **GitHub Discussions**: General questions and ideas
- **Code Review**: PR comments and feedback

### Asking Questions

When asking for help, include:

1. **Context**: What are you trying to accomplish?
2. **Problem**: What specific issue are you facing?
3. **Environment**: OS, Node/Bun version, browser
4. **Code**: Minimal reproducible example
5. **Attempts**: What have you tried so far?

#### Good Question Example

```markdown
## Problem
I'm trying to add support for Amazon.ca but getting parsing errors.

## Environment
- OS: macOS 13.0
- Bun: v1.0.15
- Browser: Chrome 120

## Code
```javascript
const products = await scrapeAmazonProducts('laptop', 'amazon.ca');
// Returns empty array instead of products
```

## What I've Tried
1. Added domain configuration in domains.js
2. Updated selectors for .ca site
3. Tested with different keywords

## Expected vs Actual
Expected: Array of product objects
Actual: Empty array, no errors thrown
```

---

## 🎉 Recognition

### Contributors Hall of Fame

We maintain a list of contributors in our README and acknowledge contributions in release notes.

### Types of Recognition

- **Code Contributors**: Listed in README contributors section
- **Bug Reporters**: Mentioned in issue resolution
- **Documentation**: Credited in documentation updates
- **Community Support**: Recognized in community contributions

---

## 📊 Project Metrics

### Quality Metrics

- **Code Coverage**: Target 80% minimum
- **Performance**: API response time < 5s average
- **Reliability**: 99% uptime for demo deployment
- **Security**: No known vulnerabilities

### Contribution Metrics

- **Response Time**: Issues responded to within 48 hours
- **PR Review Time**: Code reviewed within 72 hours
- **Release Frequency**: Monthly releases for features, immediate for critical bugs

---

## 🔗 Useful Links

- **Main Repository**: https://github.com/davidassef/Amazon-Search
- **Issue Tracker**: https://github.com/davidassef/Amazon-Search/issues
- **Documentation**: [Project Documentation](../INDEX.md)
- **API Reference**: [API Endpoints](../api/endpoints.md)
- **Architecture Guide**: [System Architecture](architecture-overview.md)

---

Thank you for contributing to the Amazon Product Scraper! Your contributions help make this project better for everyone. 🚀

*For questions about these guidelines, please open an issue or start a discussion on GitHub.*
