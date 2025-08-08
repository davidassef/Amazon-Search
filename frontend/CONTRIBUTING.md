# Contributing Guide

🙏 **Thank you for contributing to the Amazon Product Scraper frontend!**

This project uses modern web technologies: Vite, Tailwind CSS, and ES modules.

## 🔧 Development Setup

### Prerequisites
- **Node.js 18+** and **npm 9+**
- **Git** for version control
- **Code editor** with JavaScript/ES6+ support (VS Code recommended)

### Local Development
```bash
# 1. Fork and clone the repository
git clone https://github.com/your-username/amazon-scraper-frontend.git
cd amazon-scraper-frontend/frontend

# 2. Create a feature branch
git checkout -b feature/your-feature-name

# 3. Install dependencies (use ci for reproducible builds)
npm ci

# 4. Copy environment template
cp .env.example .env

# 5. Start development server
npm run dev
# → Opens http://localhost:5173 (or next available port)
```

## 📝 Coding Standards

### JavaScript/ES6+
- **ES Modules**: Always use `import`/`export`, avoid CommonJS
- **Modern syntax**: Arrow functions, destructuring, template literals
- **Async/await**: Prefer over Promise chains
- **Classes**: Use for stateful modules (API, UI, I18n, Storage)
- **Constants**: Use `UPPER_SNAKE_CASE` for module-level constants

```javascript
// ✅ Good
import { API } from './modules/api.js';
const api = new API();
const results = await api.searchProducts(keyword, country);

// ❌ Avoid
const API = require('./modules/api.js');
api.searchProducts(keyword, country).then(results => { ... });
```

### Module Organization
- **Small & focused**: Each module has a single responsibility
- **Clear APIs**: Export classes with documented methods
- **Error handling**: Always handle errors gracefully
- **Dependencies**: Avoid circular imports, use dependency injection

### HTML & Accessibility
- **Semantic HTML**: Use proper elements (`<main>`, `<section>`, `<article>`)
- **ARIA labels**: Add where semantic HTML isn't enough
- **Keyboard navigation**: All interactive elements focusable
- **Alt text**: Descriptive text for all images
- **External links**: Use `rel="noopener noreferrer"`

```html
<!-- ✅ Good -->
<button type="submit" aria-label="Search for products">
  <span data-i18n="searchButton">Search</span>
</button>

<!-- ❌ Avoid -->
<div onclick="search()">Search</div>
```

### CSS & Styling
- **Tailwind first**: Use utility classes for most styling
- **Custom components**: Only in `src/styles.css` for reusable patterns
- **Responsive design**: Mobile-first approach with Tailwind breakpoints
- **Performance**: Avoid large custom CSS, leverage Tailwind's purging

## 🔍 Code Quality

### Before Submitting
```bash
# Build production version (must pass)
npm run build

# Preview production build
npm run preview

# Check for common issues
npm run lint  # (if configured)
```

### Performance Checks
- **Bundle size**: Keep JavaScript under 50KB gzipped
- **Loading speed**: Test on slow 3G connections
- **Memory usage**: Avoid memory leaks in long-running sessions
- **Images**: Use appropriate formats and lazy loading

## 📦 Commit Guidelines

### Conventional Commits
We use [Conventional Commits](https://www.conventionalcommits.org/) for clear history:

```bash
# Features
feat(api): add search cancellation with AbortController
feat(ui): add skeleton loading animations

# Bug fixes
fix(i18n): resolve shared instance translation loading
fix(ui): correct responsive grid layout on mobile

# Documentation
docs: update README with 2025 architecture changes
docs(components): add module API examples

# Maintenance
chore: update Tailwind to v3.4
refactor(storage): simplify localStorage error handling
```

### Commit Best Practices
- **Atomic commits**: One logical change per commit
- **Descriptive messages**: Explain what and why, not just what
- **Scope**: Use module names (api, ui, i18n, docs, etc.)
- **Present tense**: "add feature" not "added feature"

## 🔄 Pull Request Process

### Before Opening PR
1. **Sync with main**: `git pull origin main`
2. **Build successfully**: `npm run build` passes
3. **Test manually**: Verify your changes work
4. **Self-review**: Check diff for unintended changes

### PR Template
```markdown
## 🎯 What & Why
Brief description of the change and motivation.

## 🧪 Testing
- [ ] Tested in Chrome, Firefox, Safari
- [ ] Tested on mobile (responsive)
- [ ] Tested with keyboard navigation
- [ ] Verified translations work (if applicable)

## 📸 Screenshots
(For UI changes, add before/after screenshots)

## 🔗 Related Issues
Closes #123
Related to #456
```

### Review Process
- **Code review**: At least one maintainer approval
- **CI checks**: All automated checks must pass
- **Manual testing**: Reviewer will test key functionality
- **Documentation**: Update docs if APIs change

## 🌟 Feature Requests

### Good Feature Ideas
- **Accessibility improvements**: Screen reader support, high contrast
- **Performance optimizations**: Faster loading, better caching
- **Internationalization**: Additional language support
- **User experience**: Better error messages, loading states
- **API enhancements**: New endpoints, better error handling

### Process
1. **Search existing issues**: Avoid duplicates
2. **Open discussion issue**: Describe use case and benefits
3. **Wait for feedback**: Maintainers will provide guidance
4. **Implementation**: Follow this guide for development

## 🐛 Bug Reports

### Required Information
- **Environment**: Browser, OS, Node.js version
- **Steps to reproduce**: Detailed reproduction steps
- **Expected behavior**: What should happen
- **Actual behavior**: What actually happens
- **Screenshots**: For visual issues
- **Console errors**: Copy any JavaScript errors

## 🎉 Recognition

Contributors will be:
- **Added to README**: Recognition in contributors section
- **Mentioned in releases**: Called out in release notes
- **GitHub profile**: Contributions visible on your profile

---

**Questions?** Open a discussion issue or contact maintainers.

*Last updated: January 2025*

