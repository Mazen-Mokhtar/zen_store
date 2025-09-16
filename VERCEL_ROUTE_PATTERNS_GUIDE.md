# Vercel Route Patterns Guide

This guide explains the correct route pattern syntax for Vercel deployments to prevent "Invalid Route Source Pattern" errors.

## Overview

Vercel uses path-to-regexp syntax for route patterns in `next.config.js` and `vercel.json`. Using incorrect patterns will cause deployment failures.

## ✅ Valid Patterns

### Basic Wildcards
- **Use**: `:path*` for catch-all segments
- **Example**: `/api/:path*` matches `/api/users`, `/api/users/123`, etc.

### Static Paths
- **Use**: Exact paths without regex
- **Example**: `/api/users`, `/images/logo.png`

### File Extensions
- **Use**: `:path*\.ext` for files with specific extensions
- **Example**: `/:path*\.js` matches any JavaScript file

### Multiple Extensions
- **Use**: `:path*\.(ext1|ext2|ext3)`
- **Example**: `/:path*\.(woff|woff2|eot|ttf|otf)`

## ❌ Invalid Patterns (Fixed)

### Before (Causes Errors)
```javascript
// ❌ These patterns cause Vercel deployment failures
source: '/(.*)'                    // Invalid regex syntax
source: '/api/(.*)'                // Invalid regex syntax
source: '/_next/static/(.*)'       // Invalid regex syntax
source: '/(.*)\.(js|css)'          // Invalid regex syntax
source: '/api/proxy/(.*)'          // Invalid in rewrites
```

### After (Vercel Compatible)
```javascript
// ✅ These patterns work with Vercel
source: '/:path*'                  // Matches any path
source: '/api/:path*'              // Matches /api/* paths
source: '/_next/static/:path*'     // Matches static assets
source: '/:path*\.(js|css)'        // Matches files with extensions
source: '/api/proxy/:path*'        // Works in rewrites
```

## Common Conversions

| Old Pattern | New Pattern | Description |
|-------------|-------------|-------------|
| `/(.*)`     | `/:path*`   | Match any path |
| `/api/(.*)`  | `/api/:path*` | Match API routes |
| `/(.*)\.js` | `/:path*\.js` | Match JS files |
| `/proxy/(.*)` | `/proxy/:path*` | Proxy routes |

## Special Cases

### Negative Lookahead (Advanced)
- **Pattern**: `/((?!api).*)`
- **Use**: When you need to exclude specific paths
- **Note**: This pattern is complex and should be used sparingly

### Destination Patterns
In rewrites, update both source and destination:
```javascript
// Before
{
  source: '/api/proxy/(.*)',
  destination: 'https://api.example.com/$1'
}

// After
{
  source: '/api/proxy/:path*',
  destination: 'https://api.example.com/:path*'
}
```

## Files to Check

When updating route patterns, check these files:
1. `next.config.js` - headers(), redirects(), rewrites()
2. `vercel.json` - headers, redirects, rewrites sections
3. `middleware.ts` - if using custom routing logic

## Testing

After making changes:
1. Run `npm run build` locally
2. Check for build errors
3. Test deployment on Vercel
4. Verify routes work as expected

## Best Practices

1. **Always use `:path*`** instead of `(.*)`
2. **Escape special characters** with `\\`
3. **Test locally** before deploying
4. **Keep patterns simple** when possible
5. **Document complex patterns** with comments

## Troubleshooting

If you encounter "Invalid Route Source Pattern" errors:
1. Check all route patterns in config files
2. Replace `(.*)` with `:path*`
3. Ensure proper escaping of special characters
4. Test with `npm run build`
5. Verify Vercel deployment logs

---

**Last Updated**: January 2025
**Status**: All route patterns have been fixed and tested successfully