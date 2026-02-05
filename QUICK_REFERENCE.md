# Quick Reference Card

## 🔄 Switch Environments (Sandbox ↔ Live)

### Step-by-Step

1. **Update `.env` file**
   ```env
   TEKMETRIC_CLIENT_ID=your_new_client_id
   TEKMETRIC_CLIENT_SECRET=your_new_client_secret
   TEKMETRIC_ENVIRONMENT=sandbox.tekmetric.com  # or live domain
   ```

2. **Restart backend**
   ```bash
   # Stop server (Ctrl+C), then:
   npm run dev
   ```

3. **Clear cache**
   - Go to: `http://localhost:3000/settings`
   - Click: "🗑️ Clear All Cache"
   - Click: "🔄 Refresh Page"

4. **Verify**
   - Check environment in Settings page
   - Test loading some data

---

## 🗑️ Clear Cache Commands

### Via Settings Page (Easiest)
```
http://localhost:3000/settings → Click "Clear All Cache"
```

### Via Command Line
```bash
npm run clear-cache
```

### Via Browser Console (F12)
```javascript
localStorage.clear();
sessionStorage.clear();
location.reload();
```

### Via API
```bash
curl -X POST http://localhost:3001/api/auth/clear-cache
```

---

## 📍 Important URLs

| Page | URL |
|------|-----|
| Dashboard | `http://localhost:3000/` |
| Settings | `http://localhost:3000/settings` |
| Backend API | `http://localhost:3001/api` |
| Auth Status | `http://localhost:3001/api/auth/status` |
| Health Check | `http://localhost:3001/health` |

---

## 🚀 Start Application

### Both servers at once
```bash
npm run dev:all
```

### Separate terminals
```bash
# Terminal 1 - Backend
npm run dev

# Terminal 2 - Frontend
npm run client
```

---

## 🔍 Check Current Environment

### Via Settings Page
```
http://localhost:3000/settings
```

### Via API
```bash
curl http://localhost:3001/api/auth/status
```

### Via Browser Console
```javascript
console.log(localStorage.getItem('tekmetric_environment'));
console.log(localStorage.getItem('tekmetric_shop_id'));
```

---

## 📦 Data Storage Locations

| Type | Location | What's Stored |
|------|----------|---------------|
| localStorage | Browser | Shop ID, environment name |
| sessionStorage | Browser | Temporary session data |
| Server Memory | Node.js | OAuth tokens, token expiry |

---

## ⚠️ Common Issues

### Wrong environment data showing
```
→ Clear cache in Settings page
→ Refresh browser
```

### "Not Configured" error
```
→ Check .env file
→ Restart backend server
→ Clear cache
```

### OAuth token errors
```
→ Clear server cache
→ Check credentials in .env
→ Restart backend
```

### Shop ID is wrong
```
→ Clear cache
→ Reload page
→ Select correct shop
```

---

## 🔐 Environment Variables

```env
# Required
TEKMETRIC_CLIENT_ID=your_client_id
TEKMETRIC_CLIENT_SECRET=your_client_secret
TEKMETRIC_ENVIRONMENT=sandbox.tekmetric.com

# Optional
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
```

---

## 📚 Documentation Files

| File | Purpose |
|------|---------|
| `README.md` | Main documentation |
| `SWITCHING_ENVIRONMENTS.md` | Detailed switching guide |
| `CACHE_MANAGEMENT.md` | Cache management details |
| `QUICK_REFERENCE.md` | This file - quick reference |
| `TROUBLESHOOTING.md` | Common issues and solutions |

---

## 🛠️ NPM Scripts

```bash
npm start              # Start backend (production)
npm run dev            # Start backend (development)
npm run client         # Start frontend
npm run dev:all        # Start both servers
npm run clear-cache    # Clear server cache
npm run install:all    # Install all dependencies
npm run build          # Build frontend for production
```

---

## 🎯 Best Practices

1. ✅ Always clear cache when switching environments
2. ✅ Verify environment after switching
3. ✅ Keep `.env` file secure (never commit)
4. ✅ Test with simple query after switching
5. ✅ Document which environment you're using
6. ✅ Use Settings page for convenience

---

## 📞 Quick Help

**Can't connect to API?**
- Check backend is running on port 3001
- Verify credentials in `.env`
- Check Settings page for status

**Data looks wrong?**
- Clear cache
- Verify environment
- Refresh page

**Need to switch environments?**
- Follow "Switch Environments" steps above
- Don't forget to clear cache!

---

**Last Updated:** 2024
**Version:** 1.0
