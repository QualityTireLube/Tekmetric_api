# Getting Started with Tekmetric API Integration

Welcome! This guide will get you up and running in just a few minutes.

## What You Have

A complete full-stack application with:
- ✅ **Backend Server** - Node.js/Express with OAuth2 authentication
- ✅ **Frontend Dashboard** - Modern React UI
- ✅ **API Integration** - Full Tekmetric API coverage
- ✅ **Your Credentials** - Pre-configured and ready to use

## Visual Overview

```
┌─────────────────────────────────────────────────────────┐
│                    YOUR BROWSER                         │
│              http://localhost:3000                      │
│                                                         │
│  ┌─────────────────────────────────────────────────┐  │
│  │         Tekmetric Dashboard (React)             │  │
│  │  • View Customers, Vehicles, Repair Orders      │  │
│  │  • Create new records                           │  │
│  │  • Beautiful, modern UI                         │  │
│  └─────────────────────────────────────────────────┘  │
└──────────────────────┬──────────────────────────────────┘
                       │ HTTP Requests
                       ↓
┌─────────────────────────────────────────────────────────┐
│              YOUR BACKEND SERVER                        │
│            http://localhost:3001/api                    │
│                                                         │
│  ┌─────────────────────────────────────────────────┐  │
│  │      Express Server (Node.js)                   │  │
│  │  • OAuth2 Authentication                        │  │
│  │  • Token Management                             │  │
│  │  • Security & Rate Limiting                     │  │
│  └─────────────────────────────────────────────────┘  │
└──────────────────────┬──────────────────────────────────┘
                       │ Authenticated API Calls
                       ↓
┌─────────────────────────────────────────────────────────┐
│              TEKMETRIC API                              │
│         sandbox.tekmetric.com/api/v1                    │
│                                                         │
│  • Your Tekmetric Account Data                         │
│  • Customers, Vehicles, Repair Orders, etc.            │
└─────────────────────────────────────────────────────────┘
```

## Step-by-Step Setup

### Step 1: Open Terminal

Open your terminal and navigate to the project:

```bash
cd /Users/stephenvillavaso/Documents/GitHub/Tekmetric_api
```

### Step 2: Install Dependencies

Install all required packages for both backend and frontend:

```bash
# Install backend dependencies
npm install

# Install frontend dependencies
cd client
npm install
cd ..
```

**Expected output:** You should see packages being installed. This takes about 1-2 minutes.

### Step 3: Start the Application

Start both servers with one command:

```bash
npm run dev:all
```

**What happens:**
- Backend server starts on port 3001
- Frontend server starts on port 3000
- Your browser may automatically open to http://localhost:3000

**Expected output:**
```
🚀 Server running on port 3001
📡 Environment: sandbox.tekmetric.com
🔗 Health check: http://localhost:3001/health

Compiled successfully!
You can now view client in the browser.
  Local:            http://localhost:3000
```

### Step 4: Open the Dashboard

If your browser didn't open automatically, navigate to:

```
http://localhost:3000
```

You should see:
- A purple gradient navigation bar
- "Tekmetric API Dashboard" title
- Connection status showing "✓ Connected"
- Dashboard with your connection information

### Step 5: Test Authentication

1. Click the **"Test Authentication"** button
2. You should see a success message: "Successfully authenticated with Tekmetric API"
3. This confirms your credentials are working!

### Step 6: Explore Features

Navigate through the different sections:

1. **Dashboard** - Overview and connection status
2. **Customers** - View and create customers
3. **Vehicles** - View and create vehicles
4. **Repair Orders** - View all repair orders
5. **Inspections** - View inspections
6. **Employees** - View employee list

## Try Creating a Customer

1. Click **"Customers"** in the navigation
2. Click **"+ Add Customer"** button
3. Fill in the form:
   - First Name: John
   - Last Name: Doe
   - Email: john.doe@example.com
   - Phone: (555) 123-4567
4. Click **"Create Customer"**
5. The customer should appear in the table!

## Understanding the Code

### Backend Structure

```
server/
├── index.js                    # Main server, middleware, routes
├── routes/
│   ├── auth.js                # Authentication endpoints
│   └── tekmetric.js           # All Tekmetric API endpoints
└── services/
    └── tekmetricService.js    # OAuth2 & API logic
```

**Key file:** `server/services/tekmetricService.js`
- Handles OAuth2 authentication
- Manages access tokens
- Makes API requests to Tekmetric

### Frontend Structure

```
client/src/
├── App.js                     # Main app, routing
├── App.css                    # Styles
├── components/
│   ├── Dashboard.js          # Home page
│   ├── Customers.js          # Customer management
│   ├── Vehicles.js           # Vehicle management
│   ├── RepairOrders.js       # Repair orders view
│   ├── Inspections.js        # Inspections view
│   └── Employees.js          # Employees view
└── services/
    └── api.js                # API calls to backend
```

**Key file:** `client/src/services/api.js`
- All API endpoint definitions
- Axios configuration
- Error handling

## Common Tasks

### View Logs

**Backend logs:**
- Check the terminal where you ran `npm run dev:all`
- Look for the section with "Server running on port 3001"

**Frontend logs:**
- Open browser Developer Tools (F12)
- Go to Console tab
- See any errors or API responses

### Stop the Servers

Press `Ctrl + C` in the terminal where servers are running.

### Restart the Servers

```bash
npm run dev:all
```

### Test Backend Directly

```bash
# Test health endpoint
curl http://localhost:3001/health

# Test authentication
curl http://localhost:3001/api/auth/test

# Get customers
curl http://localhost:3001/api/tekmetric/customers
```

## Configuration

Your credentials are in `.env`:

```env
TEKMETRIC_CLIENT_ID=87c51228f8da4c98
TEKMETRIC_CLIENT_SECRET=208536b763d94a6a81b0c3c3
TEKMETRIC_ENVIRONMENT=sandbox.tekmetric.com
```

**Note:** This is the **sandbox** environment for testing.

## Troubleshooting

### "Port 3001 already in use"

Kill the process using that port:
```bash
lsof -ti:3001 | xargs kill -9
```

### "Port 3000 already in use"

Kill the process using that port:
```bash
lsof -ti:3000 | xargs kill -9
```

### Authentication Fails

1. Check `.env` file has correct credentials
2. Verify you're using sandbox environment
3. Check terminal for error messages

### Can't See Data

1. Make sure both servers are running
2. Check browser console for errors
3. Verify API connection with "Test Authentication"
4. You may not have data in your sandbox account yet

## Next Steps

### 1. Explore the Code

- Open `server/services/tekmetricService.js` to see API integration
- Check `client/src/components/Dashboard.js` to see React components
- Review `server/routes/tekmetric.js` for available endpoints

### 2. Customize the UI

- Edit `client/src/App.css` to change colors
- Modify components to add features
- Update the navigation

### 3. Add More Features

- Add search functionality
- Implement filtering
- Create reports
- Add data visualization

### 4. Deploy to Production

- Follow `DEPLOYMENT.md` for deployment instructions
- Update credentials to production
- Deploy to Heroku, AWS, or DigitalOcean

## Documentation Reference

- **README.md** - Complete documentation
- **QUICK_START.md** - 5-minute quick start
- **API_DOCUMENTATION.md** - All API endpoints
- **DEPLOYMENT.md** - Production deployment
- **PROJECT_SUMMARY.md** - Project overview

## Need Help?

1. Check the error message in terminal or browser console
2. Review the documentation files
3. Test the backend directly with curl
4. Verify your credentials are correct

## Success Checklist

- [ ] Dependencies installed
- [ ] Servers running (3000 & 3001)
- [ ] Dashboard loads in browser
- [ ] Connection status shows "✓ Connected"
- [ ] Authentication test succeeds
- [ ] Can view customers/vehicles
- [ ] Can create a new customer

## You're All Set!

Your Tekmetric API integration is ready to use. Start exploring the dashboard and building your application!

**Quick Commands:**
```bash
# Start everything
npm run dev:all

# Stop servers
Ctrl + C

# View health
curl http://localhost:3001/health
```

Happy coding! 🚀
