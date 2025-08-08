# Installation Guide

**Description:** Complete installation guide covering system requirements, step-by-step setup instructions, and troubleshooting for the Amazon Product Scraper.

**Last Updated:** January 2025

---

## Table of Contents

- [System Requirements](#-system-requirements)
- [Quick Installation](#-quick-installation)
- [Detailed Installation Steps](#-detailed-installation-steps)
- [Environment Configuration](#-environment-configuration)
- [Startup Scripts](#-startup-scripts)
- [Verification Steps](#-verification-steps)
- [Troubleshooting](#-troubleshooting)
- [Alternative Installation Methods](#-alternative-installation-methods)
- [Post-Installation](#-post-installation)

---

## 📋 System Requirements

### Minimum Requirements
- **Operating System**: Windows 10+, macOS 10.15+, or Linux (Ubuntu 18.04+)
- **Memory**: 4GB RAM minimum (8GB recommended)
- **Storage**: 1GB free disk space
- **Network**: Stable internet connection for Amazon scraping

### Required Software

#### Primary Runtime
- **[Bun](https://bun.sh/) v1.0+** - JavaScript runtime and package manager
  - Handles both backend and frontend dependencies
  - Provides fast package installation and execution
  - Built-in testing capabilities

#### Alternative Runtime (Optional)
- **[Node.js](https://nodejs.org/) v18+** - Alternative JavaScript runtime
  - Required only if not using Bun
  - Includes npm package manager

### Recommended Tools
- **Git** - Version control (for cloning the repository)
- **VS Code** or similar editor with JavaScript support
- **Modern web browser** - Chrome, Firefox, Safari, or Edge

---

## 🚀 Quick Installation

### Method 1: Using Bun (Recommended)

```bash
# 1. Clone the repository
git clone https://github.com/davidassef/Amazon-Search
cd Amazon-Search

# 2. Install backend dependencies
cd backend
bun install

# 3. Install frontend dependencies
cd ../frontend
bun install

# 4. Start the application
# Terminal 1 - Backend
cd ../backend && bun run dev

# Terminal 2 - Frontend
cd frontend && bun run dev
```

### Method 2: Using Node.js

```bash
# 1. Clone the repository
git clone https://github.com/davidassef/Amazon-Search
cd Amazon-Search

# 2. Install backend dependencies
cd backend
npm install

# 3. Install frontend dependencies
cd ../frontend
npm install

# 4. Start the application
# Terminal 1 - Backend
cd ../backend && npm run dev

# Terminal 2 - Frontend
cd frontend && npm run dev
```

---

## 🔧 Detailed Installation Steps

### Step 1: Install Bun Runtime

#### Windows
```powershell
# Using PowerShell
powershell -c "irm bun.sh/install.ps1 | iex"

# Using Scoop (if available)
scoop install bun
```

#### macOS
```bash
# Using curl
curl -fsSL https://bun.sh/install | bash

# Using Homebrew
brew tap oven-sh/bun
brew install bun
```

#### Linux
```bash
# Using curl
curl -fsSL https://bun.sh/install | bash

# Add to PATH (if needed)
echo 'export PATH="$HOME/.bun/bin:$PATH"' >> ~/.bashrc
source ~/.bashrc
```

### Step 2: Verify Installation

```bash
# Check Bun version
bun --version

# Check Node.js version (if using Node.js)
node --version
npm --version
```

### Step 3: Clone Repository

```bash
# Using HTTPS
git clone https://github.com/davidassef/Amazon-Search
cd Amazon-Search

# Using SSH (if configured)
git clone git@github.com:davidassef/Amazon-Search.git
cd Amazon-Search

# Or download ZIP and extract
# https://github.com/davidassef/Amazon-Search/archive/main.zip
```

### Step 4: Backend Setup

```bash
cd backend

# Install dependencies
bun install

# Verify installation
ls node_modules  # Should show installed packages

# Test backend startup (optional)
bun run start --test
```

#### Backend Dependencies Installed:
- **express** - Web framework
- **axios** - HTTP client for web scraping
- **jsdom** - HTML parsing and manipulation
- **cors** - Cross-origin resource sharing
- **supertest** - API testing (dev dependency)

### Step 5: Frontend Setup

```bash
cd ../frontend

# Install dependencies
bun install

# Verify installation
ls node_modules  # Should show installed packages

# Build CSS (optional test)
bunx tailwindcss -i src/input.css -o dist/output.css --watch
```

#### Frontend Dependencies Installed:
- **vite** - Build tool and dev server
- **tailwindcss** - CSS framework
- **i18next** - Internationalization
- **vitest** - Testing framework
- **autoprefixer** - CSS post-processing
- **postcss** - CSS transformation

### Step 6: Configuration Verification

```bash
# Check configuration files exist
ls backend/package.json
ls frontend/package.json
ls frontend/vite.config.js
ls frontend/tailwind.config.js

# Verify ports are available
netstat -an | grep :3000  # Backend port
netstat -an | grep :5173  # Frontend port
```

---

## 🔧 Environment Configuration

### Backend Environment Variables (Optional)

Create `backend/.env` file if custom configuration needed:

```env
# Port configuration
PORT=3000

# Development settings
NODE_ENV=development

# Request timeout (milliseconds)
REQUEST_TIMEOUT=10000

# Rate limiting
MAX_REQUESTS_PER_MINUTE=60
```

### Frontend Environment Variables (Optional)

Create `frontend/.env` file if needed:

```env
# API base URL
VITE_API_BASE_URL=http://localhost:3000

# Development settings
VITE_NODE_ENV=development
```

---

## ⚡ Startup Scripts

### Backend Scripts

```bash
cd backend

# Development mode (auto-reload)
bun run dev
# or: node --watch server.js

# Production mode
bun run start
# or: bun start
# or: node server.js

# Testing (when fixed)
bun test
```

### Frontend Scripts

```bash
cd frontend

# Development server
bun run dev
# Opens: http://localhost:5173

# Production build
bun run build

# Preview production build
bun run preview

# Run tests
bun test

# Coverage report
bun run coverage
```

---

## ✅ Verification Steps

### 1. Backend Verification

```bash
cd backend
bun run dev
```

Expected output:
```
Server running on http://localhost:3000
```

Test endpoints:
```bash
# Health check
curl http://localhost:3000/api/health

# Sample scrape (should return JSON)
curl "http://localhost:3000/api/scrape?keyword=laptop"
```

### 2. Frontend Verification

```bash
cd frontend
bun run dev
```

Expected output:
```
VITE v5.0.8 ready in 324 ms

➜  Local:   http://localhost:5173/
➜  Network: use --host to expose
```

Open browser to `http://localhost:5173` and verify:
- Page loads without errors
- Search interface is visible
- Language selector works
- CSS styling is applied

### 3. Integration Test

1. Start both servers
2. Open frontend at `http://localhost:5173`
3. Enter search term (e.g., "laptop")
4. Click "Search Products"
5. Verify products display correctly

---

## 🐛 Troubleshooting

### Common Issues

#### Port Already in Use
```bash
# Find process using port
lsof -i :3000  # Backend
lsof -i :5173  # Frontend

# Kill process
kill -9 <PID>
```

#### Permission Issues (Linux/macOS)
```bash
# Fix npm permissions
sudo chown -R $(whoami) ~/.npm
sudo chown -R $(whoami) ~/.bun
```

#### Bun Installation Issues
```bash
# Uninstall and reinstall Bun
rm -rf ~/.bun
curl -fsSL https://bun.sh/install | bash

# Add to PATH manually
export PATH="$HOME/.bun/bin:$PATH"
```

#### Network/Proxy Issues
```bash
# Configure npm/bun proxy (if behind corporate firewall)
bun config set registry https://registry.npmjs.org/
npm config set registry https://registry.npmjs.org/

# Or use different registry
bun config set registry https://registry.yarnpkg.com/
```

#### Frontend Build Issues
```bash
cd frontend

# Clear cache and reinstall
rm -rf node_modules
rm bun.lockb
bun install

# Rebuild Tailwind CSS
bunx tailwindcss -i src/input.css -o src/style.css --watch
```

#### Backend Module Issues
```bash
cd backend

# Clear and reinstall
rm -rf node_modules
rm bun.lockb
bun install

# Test specific modules
node -e "console.log(require('express'))"
```

### Getting Help

If installation issues persist:

1. **Check Documentation**: [Project README](../../README.md)
2. **Review Issues**: Search existing issues on GitHub
3. **System Requirements**: Verify all requirements are met
4. **Version Compatibility**: Ensure using supported versions
5. **Clean Install**: Try removing all `node_modules` and reinstalling

---

## 🔄 Alternative Installation Methods

### Using Docker (Advanced)

```dockerfile
# Create Dockerfile in project root
FROM oven/bun:1

WORKDIR /app

# Copy backend
COPY backend/package.json backend/bun.lockb ./backend/
RUN cd backend && bun install

# Copy frontend  
COPY frontend/package.json frontend/bun.lockb ./frontend/
RUN cd frontend && bun install

COPY . .

EXPOSE 3000 5173

CMD ["bun", "run", "start"]
```

### Development Container (VS Code)

Create `.devcontainer/devcontainer.json`:

```json
{
  "name": "Amazon Scraper Dev",
  "image": "mcr.microsoft.com/devcontainers/javascript-node:18",
  "features": {
    "ghcr.io/devcontainers-contrib/features/bun:1": {}
  },
  "forwardPorts": [3000, 5173],
  "postCreateCommand": "cd backend && bun install && cd ../frontend && bun install"
}
```

---

## 📝 Post-Installation

After successful installation:

1. **Bookmark URLs**:
   - Frontend: `http://localhost:5173`
   - Backend API: `http://localhost:3000`

2. **Read Documentation**:
   - [Configuration Guide](configuration.md)
   - [API Documentation](../api/endpoints.md)
   - [Development Guide](../development/contributing.md)

3. **Run Tests**:
   ```bash
   cd frontend && bun test
   ```

4. **Explore Features**:
   - Try different search terms
   - Test language switching
   - Verify mobile responsiveness

---

---

## 🔗 Related Documentation

- **Previous:** [Quick Start Guide](quick-start.md)
- **Next:** [Configuration Guide](configuration.md)
- **Related:** [Deployment Guide](../guides/deployment.md) | [Testing Overview](../testing/testing-overview.md)

---

*This installation guide covers standard setup procedures. For deployment instructions, see the [Deployment Guide](../guides/deployment.md).*
