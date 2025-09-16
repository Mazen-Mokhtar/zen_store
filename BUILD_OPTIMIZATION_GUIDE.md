# Build Optimization Guide

## CI/CD Caching Strategy for Faster Builds

### 1. GitHub Actions Caching Strategy

```yaml
# .github/workflows/ci.yml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4
      
      # Cache Node.js dependencies
      - name: Cache Node.js dependencies
        uses: actions/cache@v3
        with:
          path: |
            ~/.npm
            node_modules
            .next/cache
          key: ${{ runner.os }}-nextjs-${{ hashFiles('**/package-lock.json') }}-${{ hashFiles('**/*.js', '**/*.jsx', '**/*.ts', '**/*.tsx') }}
          restore-keys: |
            ${{ runner.os }}-nextjs-${{ hashFiles('**/package-lock.json') }}-
            ${{ runner.os }}-nextjs-
      
      # Setup Node.js with caching
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
      
      # Install dependencies (will use cache if available)
      - name: Install dependencies
        run: npm ci --prefer-offline --no-audit
      
      # Build with optimizations
      - name: Build application
        run: |
          npm run build --no-lint
        env:
          NODE_ENV: production
          NEXT_TELEMETRY_DISABLED: 1
```

### 2. Docker Build Optimization

```dockerfile
# Multi-stage Dockerfile for better caching
FROM node:18-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy package files for dependency caching
COPY package.json package-lock.json ./
RUN npm ci --only=production --prefer-offline

FROM node:18-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build with optimizations
ENV NEXT_TELEMETRY_DISABLED 1
ENV NODE_ENV production
RUN npm run build --no-lint

FROM node:18-alpine AS runner
WORKDIR /app
ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3000
CMD ["node", "server.js"]
```

### 3. Vercel Deployment Optimization

```json
// vercel.json
{
  "buildCommand": "npm run build --no-lint",
  "framework": "nextjs",
  "functions": {
    "app/api/**/*.ts": {
      "maxDuration": 30
    }
  },
  "crons": [],
  "env": {
    "NEXT_TELEMETRY_DISABLED": "1"
  }
}
```

### 4. Package.json Build Scripts Optimization

```json
{
  "scripts": {
    "build": "next build",
    "build:fast": "NEXT_TELEMETRY_DISABLED=1 next build --no-lint",
    "build:analyze": "ANALYZE=true npm run build",
    "build:ci": "npm ci --prefer-offline --no-audit && npm run build:fast"
  }
}
```

### 5. Local Development Optimization

#### .env.local for faster development builds:
```env
# Disable telemetry for faster builds
NEXT_TELEMETRY_DISABLED=1

# Skip type checking during development
TSC_COMPILE_ON_ERROR=true

# Disable source maps in development for faster builds
GENERATE_SOURCEMAP=false
```

### 6. Build Performance Monitoring

#### Add to package.json:
```json
{
  "scripts": {
    "build:time": "time npm run build:fast",
    "analyze:bundle": "npm run build:analyze && npx @next/bundle-analyzer"
  }
}
```

### 7. Recommended Build Commands

- **Development**: `npm run dev`
- **Production Build**: `npm run build:fast`
- **CI/CD Build**: `npm run build:ci`
- **Bundle Analysis**: `npm run analyze:bundle`

### 8. Expected Performance Improvements

| Optimization | Expected Improvement |
|--------------|---------------------|
| Tailwind Safelist Optimization | 20-30% faster CSS generation |
| Turbopack Enabled | 40-60% faster builds |
| Image Optimization Reduced | 15-25% faster builds |
| Node Modules Caching | 50-70% faster CI builds |
| .next/cache Caching | 30-50% faster subsequent builds |
| Skip Linting | 10-20% faster builds |

### 9. Monitoring Build Performance

```bash
# Measure build time
time npm run build:fast

# Analyze bundle size
npm run analyze:bundle

# Check build cache effectiveness
ls -la .next/cache/
```

### 10. Additional Tips

1. **Use `npm ci` instead of `npm install` in CI/CD**
2. **Enable persistent caching in your CI/CD platform**
3. **Use `--prefer-offline` flag when possible**
4. **Skip unnecessary steps like linting during builds**
5. **Use multi-stage Docker builds for better layer caching**
6. **Monitor bundle size regularly to prevent bloat**

### 11. Troubleshooting

If builds are still slow:
1. Clear `.next` folder: `rm -rf .next`
2. Clear node_modules: `rm -rf node_modules && npm ci`
3. Check for large dependencies: `npm ls --depth=0`
4. Analyze bundle: `npm run analyze:bundle`