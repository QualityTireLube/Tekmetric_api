# 🎉 Credential Management System

## Overview

Save and manage multiple Tekmetric API credential sets and switch between them instantly!

## ✨ Features

### 1. Save Multiple Credentials
- Store unlimited credential sets
- Give each set a custom name
- Client ID, Client Secret, and Environment for each

### 2. Quick Switching
- Switch between credentials with one click
- No server restart required
- Instant environment changes

### 3. Secure Storage
- Credentials masked in display
- Client ID: Shows first 4 and last 4 characters
- Client Secret: Fully masked (••••••••)

### 4. Easy Management
- Add new credential sets
- Delete unused credentials
- See which one is active
- View creation dates

## 🚀 How to Use

### Step 1: Add Your First Credential Set

1. **Open Settings**: http://localhost:3000/settings
2. **Click**: "➕ Add New" button
3. **Fill in the form**:
   - **Name**: Give it a memorable name (e.g., "Production", "Sandbox", "Client Demo")
   - **Client ID**: Your Tekmetric Client ID
   - **Client Secret**: Your Tekmetric Client Secret
   - **Environment**: Select Sandbox or Live from dropdown
4. **Click**: "💾 Save Credential Set"

### Step 2: Add More Credentials

Repeat Step 1 for each environment you want to save:
- Sandbox credentials
- Live/Production credentials
- Test environment credentials
- Client-specific credentials
- etc.

### Step 3: Switch Between Credentials

1. **Find the credential** you want to use in the list
2. **Click**: "🔄 Switch to This" button
3. **Confirm** the switch
4. **Refresh** the page when prompted
5. **Done!** You're now using the new credentials

### Step 4: Delete Unused Credentials

1. **Find the credential** you want to remove
2. **Click**: "🗑️ Delete" button
3. **Confirm** the deletion
4. **Done!** The credential set is removed

**Note**: You cannot delete the currently active credential set.

## 📊 Visual Guide

### Settings Page Layout

```
┌─────────────────────────────────────────────────────────┐
│ Settings & Configuration                                │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ 🔵 Currently Active                                     │
│ ┌─────────────────────────────────────────────────┐   │
│ │ Client ID: 87c5...4c98                          │   │
│ │ Environment: sandbox.tekmetric.com              │   │
│ │ Status: ✓ Connected                             │   │
│ └─────────────────────────────────────────────────┘   │
│                                                         │
│ 💾 Saved Credentials (3)          [➕ Add New]         │
│ ┌─────────────────────────────────────────────────┐   │
│ │ Production                        ✓ ACTIVE      │   │
│ │ Client ID: 87c5...4c98                          │   │
│ │ Environment: shop.tekmetric.com                 │   │
│ │ [🗑️ Delete]                                     │   │
│ └─────────────────────────────────────────────────┘   │
│                                                         │
│ ┌─────────────────────────────────────────────────┐   │
│ │ Sandbox Testing                                 │   │
│ │ Client ID: abc1...xyz9                          │   │
│ │ Environment: sandbox.tekmetric.com              │   │
│ │ [🔄 Switch to This] [🗑️ Delete]                │   │
│ └─────────────────────────────────────────────────┘   │
│                                                         │
│ ┌─────────────────────────────────────────────────┐   │
│ │ Client Demo                                     │   │
│ │ Client ID: def4...uvw7                          │   │
│ │ Environment: sandbox.tekmetric.com              │   │
│ │ [🔄 Switch to This] [🗑️ Delete]                │   │
│ └─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

## 🎯 Use Cases

### Use Case 1: Development Workflow
```
Morning: Switch to "Sandbox" credentials
         Develop and test features

Afternoon: Switch to "Staging" credentials
           Test with staging data

Evening: Switch back to "Sandbox"
         Continue development
```

### Use Case 2: Client Demos
```
Before Demo: Switch to "Client Demo" credentials
             Show client their live data

After Demo: Switch back to "Development"
            Continue your work
```

### Use Case 3: Multi-Shop Management
```
Shop A: Switch to "Shop A - Production"
        Manage Shop A data

Shop B: Switch to "Shop B - Production"
        Manage Shop B data

Testing: Switch to "Sandbox"
         Test new features
```

### Use Case 4: Team Collaboration
```
Each team member can save:
- Personal sandbox credentials
- Shared staging credentials
- Production credentials (read-only)
- Test environment credentials
```

## 🔐 Security

### What's Stored
- Credential sets stored in server memory
- Lost when server restarts
- Not persisted to disk
- Not in version control

### What's Displayed
- **Client ID**: Partially masked (e.g., `87c5...4c98`)
- **Client Secret**: Fully masked (e.g., `••••••••••••`)
- **Environment**: Shown in full
- **Name**: Shown in full

### Best Practices
1. Use descriptive names (don't include sensitive info)
2. Don't share screenshots with full credentials
3. Delete unused credential sets
4. Keep .env file as backup
5. Use HTTPS in production

## 💡 Pro Tips

### Tip 1: Naming Convention
```
Good Names:
✅ "Production - Shop A"
✅ "Sandbox - Testing"
✅ "Client Demo - ABC Corp"
✅ "Staging Environment"

Avoid:
❌ "87c51228f8da4c98" (using actual ID)
❌ "Secret Credentials" (not descriptive)
❌ "Test" (too generic)
```

### Tip 2: Organization
```
Organize by:
- Environment (Production, Sandbox, Staging)
- Client (Client A, Client B, Client C)
- Purpose (Demo, Testing, Development)
- Shop (Shop 1, Shop 2, Shop 3)
```

### Tip 3: Quick Access
```
Save frequently-used credentials:
1. Your main development sandbox
2. Production (for quick checks)
3. Staging (for testing)
4. Client demo (for presentations)
```

### Tip 4: Backup Strategy
```
1. Save credentials in the app
2. Keep .env file with default credentials
3. Document credential sets in secure location
4. Share with team via secure channel
```

## 📝 API Reference

### Save Credential Set
```bash
POST /api/auth/credentials/save
Body: {
  "name": "Production",
  "clientId": "your_client_id",
  "clientSecret": "your_client_secret",
  "environment": "shop.tekmetric.com"
}
```

### Get All Saved Credentials
```bash
GET /api/auth/credentials/list
Response: {
  "success": true,
  "credentials": [...]
}
```

### Switch to Credential Set
```bash
POST /api/auth/credentials/switch
Body: {
  "id": "1707145200000"
}
```

### Delete Credential Set
```bash
DELETE /api/auth/credentials/:id
```

## 🎨 UI Components

### Active Credential Display
- Shows currently active credentials
- Blue background with border
- Connection status indicator
- Masked credentials

### Credential Cards
- One card per saved credential
- Shows name, masked credentials, environment
- "ACTIVE" badge on current credential
- Switch and Delete buttons
- Created date timestamp

### Add New Form
- Name/Label field
- Client ID field
- Client Secret field (password type)
- Environment dropdown
- Save and Cancel buttons

## ⚠️ Important Notes

### Persistence
- Credentials stored in server memory only
- **Lost when server restarts**
- Re-add credentials after restart
- Or keep in .env file as default

### Active Credential
- Only one credential can be active at a time
- Active credential cannot be deleted
- Switch to another before deleting

### Server Restart
- All saved credentials are cleared
- Server loads .env credentials on startup
- Re-save your credential sets after restart

## 🚨 Troubleshooting

### Issue: Credentials not saving
**Solution**: Check server logs for errors, verify all fields are filled

### Issue: Can't switch credentials
**Solution**: Refresh the page after switching, check connection status

### Issue: Credentials disappeared
**Solution**: Server was restarted - re-add your credentials

### Issue: Can't delete active credential
**Solution**: Switch to another credential first, then delete

## ✅ Checklist

Before using credential management:
- [ ] Have multiple credential sets ready
- [ ] Know which environment each belongs to
- [ ] Have descriptive names planned
- [ ] Understand credentials are lost on restart

After adding credentials:
- [ ] Verify all credentials saved correctly
- [ ] Test switching between credentials
- [ ] Confirm data loads from correct environment
- [ ] Document your credential sets

## 🎊 Benefits

### Time Savings
- ⏱️ Switch in 10 seconds (vs 2-3 minutes manually)
- 🚀 No server restarts needed
- 📝 No file editing required

### Convenience
- 💾 Save unlimited credential sets
- 🔄 One-click switching
- 👁️ Visual interface
- ✅ Easy management

### Flexibility
- 🎯 Multiple environments
- 👥 Multiple clients
- 🏪 Multiple shops
- 🧪 Multiple test accounts

---

**Feature Version:** 2.0
**Last Updated:** February 5, 2024
**Status:** ✅ Ready to Use

**Try it now:** http://localhost:3000/settings
