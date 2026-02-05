# Architecture & Data Flow

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER'S BROWSER                          │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              React Frontend (Port 3000)                   │  │
│  │                                                           │  │
│  │  ┌────────────┐  ┌────────────┐  ┌──────────────────┐  │  │
│  │  │ Dashboard  │  │ Customers  │  │    Settings      │  │  │
│  │  └────────────┘  └────────────┘  │  (Clear Cache)   │  │  │
│  │  ┌────────────┐  ┌────────────┐  └──────────────────┘  │  │
│  │  │ Vehicles   │  │ Repair     │  ┌──────────────────┐  │  │
│  │  │            │  │ Orders     │  │  Appointments    │  │  │
│  │  └────────────┘  └────────────┘  └──────────────────┘  │  │
│  │                                                           │  │
│  │  ┌─────────────────────────────────────────────────┐    │  │
│  │  │         Cache (localStorage)                     │    │  │
│  │  │  • tekmetric_shop_id                            │    │  │
│  │  │  • tekmetric_environment                        │    │  │
│  │  └─────────────────────────────────────────────────┘    │  │
│  └───────────────────────────┬───────────────────────────────┘  │
└────────────────────────────────┼────────────────────────────────┘
                                 │
                                 │ HTTP Requests
                                 │ (axios)
                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Express Backend (Port 3001)                  │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                     API Routes                            │  │
│  │                                                           │  │
│  │  /api/auth/test         - Test authentication           │  │
│  │  /api/auth/status       - Get auth status               │  │
│  │  /api/auth/clear-cache  - Clear token cache            │  │
│  │                                                           │  │
│  │  /api/tekmetric/*       - Proxy to Tekmetric API        │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              TekmetricService (Singleton)                 │  │
│  │                                                           │  │
│  │  ┌─────────────────────────────────────────────────┐    │  │
│  │  │         Cache (In-Memory)                        │    │  │
│  │  │  • accessToken                                  │    │  │
│  │  │  • tokenExpiry                                  │    │  │
│  │  └─────────────────────────────────────────────────┘    │  │
│  │                                                           │  │
│  │  Methods:                                                 │  │
│  │  • getAccessToken()                                      │  │
│  │  • makeRequest()                                         │  │
│  │  • clearTokenCache()  ← NEW                             │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              Environment Variables (.env)                 │  │
│  │                                                           │  │
│  │  • TEKMETRIC_CLIENT_ID                                   │  │
│  │  • TEKMETRIC_CLIENT_SECRET                               │  │
│  │  • TEKMETRIC_ENVIRONMENT                                 │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────┬───────────────────────────────┘
                                  │
                                  │ OAuth2 + API Requests
                                  │ (axios)
                                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                       Tekmetric API                             │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  sandbox.tekmetric.com  OR  live.tekmetric.com          │  │
│  │                                                           │  │
│  │  • /api/v1/oauth/token     - Get OAuth token            │  │
│  │  • /api/v1/shops           - Shop data                  │  │
│  │  • /api/v1/customers       - Customer data              │  │
│  │  • /api/v1/vehicles        - Vehicle data               │  │
│  │  • /api/v1/repair-orders   - Repair order data          │  │
│  │  • /api/v1/appointments    - Appointment data           │  │
│  │  • ... and more                                          │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

## Data Flow

### 1. Initial Load

```
User opens browser
    ↓
React App loads
    ↓
Check localStorage for cached shop_id
    ↓
Request auth status from backend
    ↓
Backend checks .env credentials
    ↓
Display environment in UI
```

### 2. API Request Flow

```
User clicks "Load Customers"
    ↓
React component calls api.getCustomers()
    ↓
axios sends GET to /api/tekmetric/customers
    ↓
Backend route receives request
    ↓
TekmetricService.getCustomers() called
    ↓
Check if access token is cached and valid
    ├─ Valid: Use cached token
    └─ Invalid/Expired: Request new token from Tekmetric
        ↓
        POST to Tekmetric OAuth endpoint
        ↓
        Receive and cache new token
    ↓
Make API request to Tekmetric with token
    ↓
Receive data from Tekmetric
    ↓
Return data to frontend
    ↓
React component displays data
```

### 3. Cache Clear Flow

```
User clicks "Clear All Cache" in Settings
    ↓
clearAllCache() function called
    ↓
┌─────────────────────────────────┐
│ Client-side:                    │
│ • localStorage.clear()          │
│ • sessionStorage.clear()        │
└─────────────────────────────────┘
    ↓
POST to /api/auth/clear-cache
    ↓
┌─────────────────────────────────┐
│ Server-side:                    │
│ • accessToken = null            │
│ • tokenExpiry = null            │
└─────────────────────────────────┘
    ↓
Success message displayed
    ↓
User refreshes page
    ↓
Fresh data loaded from new environment
```

## Cache Locations

### Client-Side (Browser)

```javascript
// localStorage (Persistent)
{
  "tekmetric_shop_id": "12345",
  "tekmetric_environment": "sandbox.tekmetric.com",
  "tekmetric_last_shop": "Main Shop"
}

// sessionStorage (Session only)
{
  // Temporary session data
}

// Component State (Memory, lost on refresh)
{
  appointments: [...],
  customers: [...],
  vehicles: [...]
}
```

### Server-Side (Node.js)

```javascript
// TekmetricService instance (Memory)
{
  accessToken: "eyJhbGciOiJIUzI1NiIs...",
  tokenExpiry: 1707145200000,  // Unix timestamp
  clientId: "from .env",
  clientSecret: "from .env",
  environment: "from .env",
  baseUrl: "https://sandbox.tekmetric.com/api/v1"
}
```

## Environment Switching Process

```
┌─────────────────────────────────────────────────────────────┐
│ Step 1: Update Credentials                                  │
│                                                             │
│ Edit .env file:                                             │
│   TEKMETRIC_CLIENT_ID=new_id                               │
│   TEKMETRIC_CLIENT_SECRET=new_secret                       │
│   TEKMETRIC_ENVIRONMENT=new_environment                    │
└─────────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────────┐
│ Step 2: Restart Backend                                     │
│                                                             │
│ $ npm run dev                                               │
│                                                             │
│ • Loads new .env variables                                  │
│ • Clears old token cache (restart)                         │
│ • Server ready with new credentials                         │
└─────────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────────┐
│ Step 3: Clear Browser Cache                                 │
│                                                             │
│ Via Settings Page:                                          │
│   • Click "Clear All Cache"                                │
│   • Clears localStorage                                     │
│   • Clears sessionStorage                                   │
│   • Sends clear-cache request to server                    │
└─────────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────────┐
│ Step 4: Refresh & Verify                                    │
│                                                             │
│ • Refresh browser (F5 or Ctrl+R)                           │
│ • Check Settings page for new environment                   │
│ • Test loading data                                         │
│ • Verify data is from correct environment                   │
└─────────────────────────────────────────────────────────────┘
```

## Security Considerations

### Credentials Storage

```
.env file (Server-side)
    ↓
Environment Variables (Server memory)
    ↓
NEVER sent to client
    ↓
Used only for OAuth token requests
```

### Token Management

```
OAuth Token (Server-side)
    ↓
Cached in memory (not persisted)
    ↓
Expires after ~1 hour
    ↓
Auto-refreshed when needed
    ↓
Cleared on server restart
```

### Client-Side Storage

```
localStorage
    ↓
Only stores non-sensitive data
    ↓
• Shop ID (public)
• Environment name (public)
    ↓
NO credentials or tokens stored
```

## Component Hierarchy

```
App.js
├── Dashboard
│   ├── Auth Status Display
│   └── Quick Stats
├── Customers
│   ├── Customer List
│   └── Customer Form
├── Vehicles
│   ├── Vehicle List
│   └── Vehicle Form
├── Repair Orders
│   ├── RO List
│   └── RO Details
├── Jobs
│   ├── Job List
│   └── Job Management
├── Appointments
│   ├── Appointment List
│   ├── Appointment Form
│   └── Appointment Modal
├── Inventory
│   └── Parts List
├── Inspections
│   └── Inspection List
├── Employees
│   └── Employee List
└── Settings ← NEW
    ├── Environment Status
    ├── Clear Cache Button
    └── Instructions
```

## API Endpoints

### Authentication

```
GET  /api/auth/test         - Test authentication
GET  /api/auth/status       - Get auth status
POST /api/auth/clear-cache  - Clear token cache (NEW)
GET  /api/auth/debug        - Debug authentication
```

### Tekmetric Resources

```
GET    /api/tekmetric/shops
GET    /api/tekmetric/shops/:id
GET    /api/tekmetric/customers
POST   /api/tekmetric/customers
PATCH  /api/tekmetric/customers/:id
GET    /api/tekmetric/vehicles
POST   /api/tekmetric/vehicles
GET    /api/tekmetric/repair-orders
POST   /api/tekmetric/repair-orders
GET    /api/tekmetric/appointments
POST   /api/tekmetric/appointments
PATCH  /api/tekmetric/appointments/:id
DELETE /api/tekmetric/appointments/:id
... and more
```

## Technology Stack

```
Frontend:
├── React 18
├── React Router
├── Axios
└── CSS3

Backend:
├── Node.js
├── Express
├── Axios
├── dotenv
├── Helmet (security)
├── CORS
└── Morgan (logging)

External:
└── Tekmetric API
    ├── OAuth2
    └── REST API
```

## File Structure

```
Tekmetric_api/
├── server/
│   ├── index.js              - Express server
│   ├── routes/
│   │   ├── auth.js          - Auth routes (+ clear-cache)
│   │   └── tekmetric.js     - Tekmetric proxy routes
│   └── services/
│       └── tekmetricService.js - API service (+ clearTokenCache)
├── client/
│   ├── public/
│   └── src/
│       ├── components/
│       │   ├── Dashboard.js
│       │   ├── Customers.js
│       │   ├── Vehicles.js
│       │   ├── RepairOrders.js
│       │   ├── Jobs.js
│       │   ├── Appointments.js
│       │   ├── Inventory.js
│       │   ├── Inspections.js
│       │   ├── Employees.js
│       │   └── Settings.js   - NEW
│       ├── services/
│       │   └── api.js
│       ├── utils/
│       │   └── cache.js      - NEW
│       ├── App.js
│       └── App.css
├── scripts/
│   └── clear-cache.js        - NEW
├── .env                      - Credentials (not in git)
├── .env.example
├── package.json
└── Documentation files       - Multiple NEW files
```

## Performance Considerations

### Token Caching

- Tokens cached for 50 minutes
- Reduces OAuth requests
- Automatic refresh on expiry

### Data Caching

- Shop ID cached in localStorage
- Reduces redundant API calls
- Cleared when switching environments

### Request Optimization

- Rate limiting: 100 requests per 15 minutes
- Error handling and retry logic
- Efficient data fetching

## Monitoring & Debugging

### Health Check

```bash
GET http://localhost:3001/health

Response:
{
  "status": "ok",
  "timestamp": "2024-02-05T12:00:00.000Z",
  "environment": "sandbox.tekmetric.com"
}
```

### Auth Status

```bash
GET http://localhost:3001/api/auth/status

Response:
{
  "configured": true,
  "environment": "sandbox.tekmetric.com",
  "hasToken": true,
  "tokenExpiry": "2024-02-05T13:00:00.000Z"
}
```

### Browser Console

```javascript
// Check cached data
console.log(localStorage);

// Check current environment
console.log(localStorage.getItem('tekmetric_environment'));

// Check shop ID
console.log(localStorage.getItem('tekmetric_shop_id'));
```

---

**Last Updated:** February 5, 2024
**Version:** 1.0
