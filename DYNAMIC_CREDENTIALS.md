# Dynamic Credentials Management

## 🎉 New Feature: Update Credentials Without Restarting!

You can now update your Tekmetric API credentials dynamically through the Settings page, without editing files or restarting the server.

## 🚀 How to Use

### Quick Steps

1. **Open Settings Page**
   ```
   http://localhost:3000/settings
   ```

2. **Click "🔧 Update Credentials"**
   - Located at the top of the "Current Configuration" section

3. **Enter Your Credentials**
   - Client ID
   - Client Secret
   - Environment (Sandbox or Live)

4. **Click "💾 Save Credentials"**
   - Confirm the update
   - Changes take effect immediately!

5. **Refresh the Page**
   - Load data from the new environment

## 📋 Step-by-Step Guide

### Switching from Sandbox to Live

```
Step 1: Open Settings
┌────────────────────────────────────────┐
│ http://localhost:3000/settings         │
└────────────────────────────────────────┘

Step 2: Click "Update Credentials"
┌────────────────────────────────────────┐
│ Current Configuration                  │
│ [🔧 Update Credentials]                │
└────────────────────────────────────────┘

Step 3: Fill in the Form
┌────────────────────────────────────────┐
│ Client ID: your_live_client_id         │
│ Client Secret: ••••••••••••••          │
│ Environment: [Live (shop.tekmetric)]   │
│                                        │
│ [💾 Save Credentials] [Cancel]        │
└────────────────────────────────────────┘

Step 4: Confirm
┌────────────────────────────────────────┐
│ Are you sure you want to update?      │
│ [OK] [Cancel]                          │
└────────────────────────────────────────┘

Step 5: Success!
┌────────────────────────────────────────┐
│ ✅ Credentials updated successfully!   │
│ [🔄 Refresh Page]                      │
└────────────────────────────────────────┘
```

## ✨ Features

### 1. Instant Updates
- No server restart required
- Changes take effect immediately
- Seamless environment switching

### 2. Secure Display
- Client ID is partially masked (shows first 4 and last 4 characters)
- Client Secret is fully masked (••••••••)
- Environment is shown in full

### 3. Automatic Cache Clearing
- OAuth tokens are automatically cleared when credentials change
- Ensures clean connection to new environment
- No manual cache clearing needed for credentials

### 4. Validation
- Required field validation
- Environment format validation
- Confirmation dialog before updating

### 5. Visual Feedback
- Success/error messages
- Loading states
- Current configuration display

## 🎯 Use Cases

### Quick Testing
```
Scenario: Testing different sandbox accounts
Solution: Switch credentials instantly without restarting
```

### Environment Switching
```
Scenario: Moving from sandbox to live
Solution: Update credentials in Settings page
```

### Multi-Shop Management
```
Scenario: Managing multiple shops with different credentials
Solution: Switch between credential sets dynamically
```

### Development & Production
```
Scenario: Different credentials for dev and prod
Solution: Quick switch without file editing
```

## 🔐 Security

### What's Stored

**In Memory (Server)**
```javascript
{
  clientId: "your_client_id",
  clientSecret: "your_client_secret",
  environment: "sandbox.tekmetric.com"
}
```

**Display (Client)**
```javascript
{
  clientId: "87c5...4c98",      // Masked
  clientSecret: "••••••••••••",  // Fully masked
  environment: "sandbox.tekmetric.com"
}
```

### Security Features

1. **Masked Display**: Credentials are never shown in full on the frontend
2. **HTTPS Recommended**: Use HTTPS in production
3. **No Local Storage**: Credentials not stored in browser
4. **Server-Side Only**: Credentials stored only in server memory
5. **Validation**: Input validation before accepting credentials

## 📊 Comparison: Dynamic vs Manual

| Feature | Dynamic Update | Manual (.env) |
|---------|---------------|---------------|
| **Speed** | Instant | Requires restart |
| **Ease of Use** | Click & type | Edit file |
| **Server Restart** | Not needed | Required |
| **Persistence** | Until restart | Permanent |
| **Best For** | Quick switching | Default config |

## 💡 Best Practices

### 1. Use Dynamic for Testing
```
✅ Quick environment switches
✅ Testing different accounts
✅ Temporary credential changes
```

### 2. Use .env for Defaults
```
✅ Production credentials
✅ Default startup config
✅ Permanent settings
```

### 3. Combine Both Methods
```
1. Set default credentials in .env
2. Use dynamic updates for temporary changes
3. Server restart loads .env defaults
```

## 🔄 Workflow Examples

### Example 1: Daily Development

```
Morning:
1. Server starts with .env (sandbox credentials)
2. Work with sandbox data

Afternoon:
3. Need to test with live data
4. Use Settings page to switch to live
5. Test features with live data

Evening:
6. Restart server (loads sandbox from .env)
7. Back to sandbox for development
```

### Example 2: Client Demo

```
Before Demo:
1. Switch to client's live credentials via Settings
2. Show real data during demo
3. No server restart needed

After Demo:
4. Switch back to sandbox credentials
5. Continue development
```

## 🛠️ API Reference

### Update Credentials

```bash
POST /api/auth/update-credentials
Content-Type: application/json

{
  "clientId": "your_client_id",
  "clientSecret": "your_client_secret",
  "environment": "sandbox.tekmetric.com"
}

Response:
{
  "success": true,
  "message": "Credentials updated successfully",
  "environment": "sandbox.tekmetric.com"
}
```

### Get Current Credentials

```bash
GET /api/auth/credentials

Response:
{
  "clientId": "87c5...4c98",
  "clientSecret": "••••••••••••",
  "environment": "sandbox.tekmetric.com",
  "configured": true
}
```

## 🎨 UI Components

### Update Credentials Button
```
Location: Settings page, top of "Current Configuration"
Label: "🔧 Update Credentials"
Action: Shows/hides credential form
```

### Credentials Form
```
Fields:
- Client ID (text, required)
- Client Secret (password, required)
- Environment (dropdown, required)

Actions:
- Save Credentials (submit)
- Cancel (close form)
```

### Current Configuration Display
```
Shows:
- Client ID (masked)
- Client Secret (masked)
- Environment (full)
- Connection Status
- Cached Shop ID
```

## 🚨 Troubleshooting

### Issue: Credentials not updating

**Solution:**
1. Check browser console for errors
2. Verify all fields are filled
3. Ensure environment format is correct
4. Try refreshing the page

### Issue: Connection fails after update

**Solution:**
1. Verify credentials are correct
2. Check environment domain
3. Test with original .env credentials
4. Check server logs for errors

### Issue: Old data still showing

**Solution:**
1. Click "Clear All Cache" button
2. Refresh the browser
3. Check that environment changed in Settings

## 📝 Notes

### Credential Persistence

- **Dynamic updates**: Lost on server restart
- **.env file**: Persists across restarts
- **Best practice**: Use .env for defaults, dynamic for temporary changes

### When Server Restarts

```
Server Restart
    ↓
Loads credentials from .env
    ↓
Dynamic updates are cleared
    ↓
Back to .env defaults
```

### Multiple Environments

You can quickly switch between multiple environments:

```
Sandbox → Live → Custom → Sandbox
   ↓       ↓       ↓        ↓
All via Settings page, no restarts!
```

## 🎓 Tips & Tricks

### Tip 1: Quick Switch Shortcut
```
Bookmark: http://localhost:3000/settings
Quick access to credential updates
```

### Tip 2: Test Before Committing
```
1. Use dynamic update to test new credentials
2. Verify everything works
3. Then update .env file
4. Commit changes
```

### Tip 3: Document Your Environments
```
Keep a note of your credential sets:
- Sandbox: Client ID xxx...
- Live: Client ID yyy...
- Custom: Client ID zzz...
```

### Tip 4: Use Environment Dropdown
```
Pre-configured options:
- sandbox.tekmetric.com
- shop.tekmetric.com
- (or enter custom domain)
```

## ✅ Checklist

Before updating credentials:

- [ ] Have new Client ID ready
- [ ] Have new Client Secret ready
- [ ] Know which environment (sandbox/live)
- [ ] Understand changes take effect immediately
- [ ] Ready to refresh page after update

After updating credentials:

- [ ] Verify environment in Settings page
- [ ] Check connection status shows "Connected"
- [ ] Test loading some data
- [ ] Confirm data is from correct environment
- [ ] Optionally clear cache if needed

## 🎉 Benefits

### For Developers
- ✅ Faster testing
- ✅ No file editing
- ✅ No server restarts
- ✅ Quick environment switching

### For Teams
- ✅ Easy to use
- ✅ No technical knowledge needed
- ✅ Visual interface
- ✅ Immediate feedback

### For Operations
- ✅ Reduced downtime
- ✅ Faster deployments
- ✅ Easy rollback
- ✅ Better testing

---

**Feature Version:** 1.0
**Last Updated:** February 5, 2024
**Status:** ✅ Ready to Use

**Try it now:** http://localhost:3000/settings
