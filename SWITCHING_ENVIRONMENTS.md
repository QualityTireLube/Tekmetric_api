# Switching Between Sandbox and Live Environments

This guide explains how to switch between Tekmetric sandbox and live environments, and how to clear cached data.

## Overview

Your application stores data in two places:

1. **Client-side (Browser)**:
   - `localStorage.tekmetric_shop_id` - The currently selected shop ID
   - Other cached settings

2. **Server-side (Node.js)**:
   - OAuth access tokens (cached in memory)
   - Token expiry times

When switching between sandbox and live environments, you **must clear all cached data** to prevent mixing data from different environments.

## Quick Steps to Switch Environments

### 1. Update Server Credentials

Edit your `.env` file in the root directory:

```env
# For Sandbox:
TEKMETRIC_CLIENT_ID=your_sandbox_client_id
TEKMETRIC_CLIENT_SECRET=your_sandbox_client_secret
TEKMETRIC_ENVIRONMENT=sandbox.tekmetric.com

# For Live/Production:
TEKMETRIC_CLIENT_ID=your_live_client_id
TEKMETRIC_CLIENT_SECRET=your_live_client_secret
TEKMETRIC_ENVIRONMENT=your_live_domain.tekmetric.com
```

### 2. Restart the Backend Server

Stop the server (Ctrl+C) and restart it:

```bash
npm run dev
# or
npm start
```

### 3. Clear All Cached Data

**Option A: Use the Settings Page (Recommended)**

1. Open your browser and navigate to `http://localhost:3000/settings`
2. Click the "🗑️ Clear All Cache" button
3. Confirm the action
4. Click "🔄 Refresh Page" when prompted

**Option B: Manual Clear**

Open your browser's Developer Console (F12) and run:

```javascript
// Clear localStorage
localStorage.clear();

// Clear sessionStorage
sessionStorage.clear();

// Reload the page
location.reload();
```

### 4. Verify the Switch

1. Go to the Dashboard or Settings page
2. Check that the environment shows the correct value (sandbox or live)
3. Test loading some data to ensure it's from the correct environment

## Using the Settings Page

The Settings page (`/settings`) provides a convenient interface for managing your environment:

### Features:

- **Current Environment Status**: Shows which environment you're connected to
- **Connection Status**: Displays whether the API is properly configured
- **Cached Shop ID**: Shows the currently cached shop ID
- **Clear All Cache Button**: One-click solution to clear all cached data
- **Environment Instructions**: Step-by-step guide for switching

### Clear Cache Button

When you click "Clear All Cache":

1. ✅ Clears all localStorage data
2. ✅ Clears all sessionStorage data
3. ✅ Sends a request to the server to clear OAuth tokens
4. ✅ Shows a success message
5. ✅ Provides a refresh button to reload the page

## API Endpoints

### Clear Server Cache

```bash
POST /api/auth/clear-cache
```

This endpoint clears the server-side OAuth token cache.

**Response:**
```json
{
  "success": true,
  "message": "Server cache cleared successfully"
}
```

### Check Auth Status

```bash
GET /api/auth/status
```

Returns the current authentication status and environment.

**Response:**
```json
{
  "configured": true,
  "environment": "sandbox.tekmetric.com",
  "hasToken": true,
  "tokenExpiry": "2024-02-05T12:00:00.000Z"
}
```

## Programmatic Cache Clearing

If you're developing and need to clear cache programmatically:

### Client-side (React)

```javascript
import { clearAllCache } from './utils/cache';

// Clear all cache (client + server)
await clearAllCache();

// Clear only client cache
import { clearAllClientCache } from './utils/cache';
clearAllClientCache();

// Clear only server cache
import { clearServerCache } from './utils/cache';
await clearServerCache();
```

### Server-side (Node.js)

```javascript
const tekmetricService = require('./services/tekmetricService');

// Clear token cache
tekmetricService.clearTokenCache();
```

## Common Issues

### Issue: Data from wrong environment appearing

**Solution**: You forgot to clear the cache. Follow steps 3-4 above.

### Issue: "Not Configured" error after switching

**Solution**: 
1. Verify your `.env` file has the correct credentials
2. Restart the backend server
3. Check the Settings page to see the current environment

### Issue: Shop ID is wrong

**Solution**: 
1. Clear the cache using the Settings page
2. Refresh the page
3. The app will load the shops from the new environment

### Issue: OAuth token errors

**Solution**:
1. Clear the server cache using the Settings page
2. The server will request a new token from the correct environment

## Best Practices

1. **Always clear cache when switching environments** - This prevents data contamination
2. **Verify the environment** - Check the Settings page after switching
3. **Test with a simple query** - Load shops or customers to verify the switch worked
4. **Keep credentials secure** - Never commit your `.env` file to version control
5. **Document your environments** - Keep track of which credentials are for sandbox vs live

## Environment Variables Reference

| Variable | Description | Example |
|----------|-------------|---------|
| `TEKMETRIC_CLIENT_ID` | Your Tekmetric API client ID | `87c51228f8da4c98` |
| `TEKMETRIC_CLIENT_SECRET` | Your Tekmetric API client secret | `208536b763d94a6a81b0c3c3` |
| `TEKMETRIC_ENVIRONMENT` | Tekmetric environment domain | `sandbox.tekmetric.com` |

## Troubleshooting

### How do I know which environment I'm currently using?

Check the Settings page (`/settings`) or look at the top-right corner of the navigation bar.

### Can I have both sandbox and live running at the same time?

Not with the current setup. You would need to run two separate instances of the application with different ports and different `.env` files.

### What happens if I don't clear the cache?

You might see:
- Shop IDs from the wrong environment
- Data that doesn't exist in the new environment
- Confusing or incorrect data
- API errors due to invalid IDs

### How often should I clear the cache?

Only when:
- Switching between sandbox and live
- Experiencing data issues
- After major API credential changes

## Support

For more information about the Tekmetric API, visit:
- [Tekmetric API Documentation](https://tekmetric.com)
- [Developer Portal](https://tekmetric.com/developers)
