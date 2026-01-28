# Troubleshooting Guide

## Authentication Error: 405 Method Not Allowed

If you're seeing this error:
```
Error getting access token: 405 Method Not Allowed
Failed to authenticate with Tekmetric API
```

This means the OAuth2 endpoint or authentication method needs adjustment.

### Possible Causes

1. **Wrong OAuth2 Endpoint**: The endpoint URL might be different
2. **Wrong Authentication Method**: Tekmetric might use a different auth flow
3. **Credentials Format**: The client_id/client_secret might need different formatting
4. **API Version**: The sandbox environment might work differently

### Solutions to Try

#### Solution 1: Use the Debug Endpoint

Visit this URL in your browser while the server is running:
```
http://localhost:3001/api/auth/debug
```

This will test multiple authentication methods and show you which one works.

#### Solution 2: Check Tekmetric Documentation

Contact Tekmetric support or check their developer portal for:
- The correct OAuth2 token endpoint URL
- Required authentication method (OAuth2, Basic Auth, API Key, etc.)
- Any special headers or parameters needed

#### Solution 3: Verify Your Credentials

1. Check that your credentials are correct in `.env`:
   ```bash
   cat .env
   ```

2. Verify the environment URL:
   - Sandbox: `sandbox.tekmetric.com`
   - Production: `api.tekmetric.com` (or similar)

3. Make sure there are no extra spaces or quotes

#### Solution 4: Try Different Authentication Methods

The code now tries multiple authentication methods automatically:

1. **Form-urlencoded OAuth2** (most common)
2. **Basic Auth with OAuth2**
3. **Direct credentials** (fallback)

#### Solution 5: Contact Tekmetric Support

You may need to:
1. Verify your API access is enabled
2. Get the correct API documentation
3. Confirm the authentication method for your account type

### Testing Authentication Manually

#### Test with curl (Form-urlencoded):
```bash
curl -X POST https://sandbox.tekmetric.com/oauth2/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=client_credentials&client_id=87c51228f8da4c98&client_secret=208536b763d94a6a81b0c3c3"
```

#### Test with curl (Basic Auth):
```bash
curl -X POST https://sandbox.tekmetric.com/oauth2/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -H "Authorization: Basic ODdjNTEyMjhmOGRhNGM5ODoyMDg1MzZiNzYzZDk0YTZhODFiMGMzYzM=" \
  -d "grant_type=client_credentials"
```

#### Test API endpoint directly:
```bash
curl -X GET https://sandbox.tekmetric.com/api/v1/shops \
  -H "Authorization: Basic ODdjNTEyMjhmOGRhNGM5ODoyMDg1MzZiNzYzZDk0YTZhODFiMGMzYzM="
```

### Common Issues

#### Issue: "Method Not Allowed"
- **Cause**: Wrong HTTP method or endpoint
- **Fix**: Check Tekmetric docs for correct endpoint

#### Issue: "Unauthorized" (401)
- **Cause**: Invalid credentials
- **Fix**: Verify client_id and client_secret

#### Issue: "Forbidden" (403)
- **Cause**: API access not enabled
- **Fix**: Contact Tekmetric to enable API access

#### Issue: "Not Found" (404)
- **Cause**: Wrong endpoint URL
- **Fix**: Verify the base URL and API version

### Alternative: Mock Mode for Development

If you can't get authentication working immediately, you can create a mock mode:

1. Edit `server/services/tekmetricService.js`
2. Add a mock mode that returns sample data
3. Develop the UI while waiting for auth clarification

### Getting Help

1. **Check server logs**: Look at terminal output for detailed errors
2. **Use debug endpoint**: Visit `/api/auth/debug` for diagnostics
3. **Check browser console**: Look for frontend errors
4. **Review Tekmetric docs**: Get official authentication guide
5. **Contact Tekmetric**: support@tekmetric.com

### Next Steps

Once you have the correct authentication method from Tekmetric:

1. Update `server/services/tekmetricService.js` with the correct method
2. Test with `/api/auth/test` endpoint
3. Verify with `/api/auth/debug` endpoint
4. Try accessing actual data endpoints

### Temporary Workaround

If you need to continue development while resolving auth:

1. Create mock data responses
2. Build out the UI
3. Fix authentication later

See `MOCK_MODE.md` (if created) for mock data setup.
