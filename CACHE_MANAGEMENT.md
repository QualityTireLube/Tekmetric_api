# Cache Management Guide

## Quick Reference

### Where is data cached?

1. **Browser (Client-side)**
   - `localStorage.tekmetric_shop_id` - Current shop ID
   - `localStorage.tekmetric_environment` - Environment name
   - Other component-specific data

2. **Server (Backend)**
   - OAuth access tokens (in memory)
   - Token expiry timestamps

## How to Clear Cache

### Method 1: Settings Page (Easiest)

1. Navigate to `http://localhost:3000/settings`
2. Click "🗑️ Clear All Cache"
3. Click "🔄 Refresh Page"

### Method 2: Command Line

```bash
npm run clear-cache
```

### Method 3: Browser Console

Open Developer Tools (F12) and run:

```javascript
localStorage.clear();
sessionStorage.clear();
location.reload();
```

### Method 4: API Call

```bash
curl -X POST http://localhost:3001/api/auth/clear-cache
```

## When to Clear Cache

Clear cache when:

- ✅ Switching from sandbox to live (or vice versa)
- ✅ Changing API credentials
- ✅ Seeing data from wrong environment
- ✅ Experiencing authentication issues
- ✅ Shop IDs don't match expected values

Don't clear cache when:

- ❌ Just refreshing data
- ❌ Normal operation
- ❌ Minor UI changes

## Cache Clearing Functions

### JavaScript/React

```javascript
// Import utilities
import { 
  clearAllCache,           // Clear everything (client + server)
  clearAllClientCache,     // Clear only browser cache
  clearServerCache,        // Clear only server cache
  clearLocalStorage,       // Clear only localStorage
  clearSessionStorage      // Clear only sessionStorage
} from './utils/cache';

// Clear everything
await clearAllCache();

// Clear only client
clearAllClientCache();

// Clear only server
await clearServerCache();
```

### Node.js/Express

```javascript
const tekmetricService = require('./services/tekmetricService');

// Clear token cache
tekmetricService.clearTokenCache();
```

## Verification

After clearing cache, verify:

1. **Check Environment**
   - Go to Settings page
   - Verify "Current Environment" shows correct value

2. **Check Connection**
   - Status badge should show "✓ Connected"
   - Environment should match your `.env` file

3. **Test Data Load**
   - Try loading shops, customers, or appointments
   - Verify data is from correct environment

## Troubleshooting

### Cache not clearing?

1. Try hard refresh: `Ctrl+Shift+R` (Windows/Linux) or `Cmd+Shift+R` (Mac)
2. Clear browser cache manually in browser settings
3. Try incognito/private window

### Still seeing old data?

1. Restart the backend server
2. Clear cache again
3. Close all browser tabs and reopen

### Server cache not clearing?

1. Verify server is running
2. Check server logs for errors
3. Restart the server manually

## Automated Cache Management

The app automatically manages cache in these scenarios:

- **Token Expiry**: Tokens are automatically refreshed after 50 minutes
- **401 Errors**: Token cache is cleared on authentication failures
- **Component Unmount**: Some components clean up their local state

## Best Practices

1. **Always clear cache when switching environments**
2. **Use the Settings page for convenience**
3. **Verify environment after clearing**
4. **Document which environment you're using**
5. **Keep `.env` file secure and never commit it**

## Cache Structure

### localStorage Keys

```javascript
{
  "tekmetric_shop_id": "12345",           // Currently selected shop
  "tekmetric_environment": "sandbox",     // Current environment
  "tekmetric_last_shop": "Shop Name"      // Last selected shop name
}
```

### Server Cache

```javascript
{
  accessToken: "eyJhbGciOiJIUzI1NiIs...",  // OAuth token
  tokenExpiry: 1707145200000               // Expiry timestamp
}
```

## API Reference

### POST /api/auth/clear-cache

Clears server-side OAuth token cache.

**Request:**
```bash
POST http://localhost:3001/api/auth/clear-cache
Content-Type: application/json
```

**Response:**
```json
{
  "success": true,
  "message": "Server cache cleared successfully"
}
```

### GET /api/auth/status

Get current authentication and cache status.

**Request:**
```bash
GET http://localhost:3001/api/auth/status
```

**Response:**
```json
{
  "configured": true,
  "environment": "sandbox.tekmetric.com",
  "hasToken": true,
  "tokenExpiry": "2024-02-05T12:00:00.000Z"
}
```

## Related Documentation

- [SWITCHING_ENVIRONMENTS.md](./SWITCHING_ENVIRONMENTS.md) - Complete guide for switching between sandbox and live
- [README.md](./README.md) - Main project documentation
- [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) - Common issues and solutions
