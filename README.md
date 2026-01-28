# Tekmetric API Integration

A full-stack application for integrating with the Tekmetric API. This project includes a Node.js/Express backend server with OAuth2 authentication and a modern React frontend dashboard.

## Features

- **OAuth2 Authentication**: Secure authentication with Tekmetric API using client credentials flow
- **Full API Coverage**: Access to all major Tekmetric endpoints:
  - Shops
  - Customers
  - Vehicles
  - Repair Orders
  - Jobs
  - Inspections
  - Employees
- **Modern UI**: Beautiful, responsive React dashboard
- **Real-time Data**: View and manage your Tekmetric data in real-time
- **CRUD Operations**: Create, read, update data across multiple resources

## Project Structure

```
Tekmetric_api/
├── server/                 # Backend Express server
│   ├── index.js           # Main server file
│   ├── routes/            # API routes
│   │   ├── auth.js        # Authentication routes
│   │   └── tekmetric.js   # Tekmetric API routes
│   └── services/          # Business logic
│       └── tekmetricService.js
├── client/                # React frontend
│   ├── public/
│   └── src/
│       ├── components/    # React components
│       ├── services/      # API service layer
│       ├── App.js
│       └── App.css
├── .env                   # Environment variables (not in git)
├── .env.example          # Environment template
└── package.json          # Backend dependencies
```

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Tekmetric API credentials (client_id, client_secret)

## Installation

### 1. Clone the repository

```bash
git clone <your-repo-url>
cd Tekmetric_api
```

### 2. Install backend dependencies

```bash
npm install
```

### 3. Install frontend dependencies

```bash
cd client
npm install
cd ..
```

### 4. Configure environment variables

The `.env` file has already been created with your credentials:

```env
TEKMETRIC_CLIENT_ID=87c51228f8da4c98
TEKMETRIC_CLIENT_SECRET=208536b763d94a6a81b0c3c3
TEKMETRIC_ENVIRONMENT=sandbox.tekmetric.com
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
```

## Running the Application

### Option 1: Run both servers concurrently (Recommended)

```bash
npm run dev:all
```

This will start:
- Backend server on `http://localhost:3001`
- Frontend server on `http://localhost:3000`

### Option 2: Run servers separately

**Terminal 1 - Backend:**
```bash
npm run dev
```

**Terminal 2 - Frontend:**
```bash
npm run client
```

## Usage

1. Open your browser and navigate to `http://localhost:3000`
2. You'll see the Tekmetric API Dashboard
3. Click "Test Authentication" to verify your API connection
4. Navigate through different sections using the navigation bar:
   - **Dashboard**: Overview and connection status
   - **Customers**: View and create customers
   - **Vehicles**: View and create vehicles
   - **Repair Orders**: View all repair orders
   - **Inspections**: View inspections
   - **Employees**: View employee list

## API Endpoints

### Authentication
- `GET /api/auth/test` - Test API authentication
- `GET /api/auth/status` - Get authentication status

### Shops
- `GET /api/tekmetric/shops` - Get all shops
- `GET /api/tekmetric/shops/:shopId` - Get specific shop

### Customers
- `GET /api/tekmetric/customers` - Get all customers
- `GET /api/tekmetric/customers/:customerId` - Get specific customer
- `POST /api/tekmetric/customers` - Create new customer
- `PUT /api/tekmetric/customers/:customerId` - Update customer

### Vehicles
- `GET /api/tekmetric/vehicles` - Get all vehicles
- `GET /api/tekmetric/vehicles/:vehicleId` - Get specific vehicle
- `POST /api/tekmetric/vehicles` - Create new vehicle

### Repair Orders
- `GET /api/tekmetric/repair-orders` - Get all repair orders
- `GET /api/tekmetric/repair-orders/:repairOrderId` - Get specific repair order
- `POST /api/tekmetric/repair-orders` - Create new repair order
- `PUT /api/tekmetric/repair-orders/:repairOrderId` - Update repair order

### Jobs
- `GET /api/tekmetric/repair-orders/:repairOrderId/jobs` - Get jobs for repair order
- `POST /api/tekmetric/repair-orders/:repairOrderId/jobs` - Create new job

### Inspections
- `GET /api/tekmetric/inspections` - Get all inspections
- `GET /api/tekmetric/inspections/:inspectionId` - Get specific inspection

### Employees
- `GET /api/tekmetric/employees` - Get all employees
- `GET /api/tekmetric/employees/:employeeId` - Get specific employee

## Security Features

- **Helmet.js**: Security headers
- **CORS**: Configured for frontend origin
- **Rate Limiting**: 100 requests per 15 minutes per IP
- **Environment Variables**: Sensitive data stored securely
- **Token Caching**: OAuth tokens cached and refreshed automatically

## Development

### Backend Development

The backend uses:
- Express.js for the server
- Axios for HTTP requests
- OAuth2 client credentials flow for authentication
- Automatic token refresh

### Frontend Development

The frontend uses:
- React 18
- React Router for navigation
- Axios for API calls
- Modern CSS with gradients and animations

### Adding New Endpoints

1. Add the method to `server/services/tekmetricService.js`
2. Create a route in `server/routes/tekmetric.js`
3. Add the API call to `client/src/services/api.js`
4. Use it in your React components

## Troubleshooting

### Authentication Errors

If you see authentication errors:
1. Verify your credentials in `.env`
2. Check that you're using the correct environment (sandbox vs production)
3. Test the auth endpoint: `http://localhost:3001/api/auth/test`

### CORS Errors

If you see CORS errors:
1. Ensure the backend is running on port 3001
2. Ensure the frontend is running on port 3000
3. Check the `FRONTEND_URL` in `.env`

### API Errors

If API calls fail:
1. Check the browser console for error messages
2. Check the server logs in your terminal
3. Verify the endpoint exists in Tekmetric's API documentation

## Building for Production

### Build the frontend

```bash
cd client
npm run build
```

This creates an optimized production build in `client/build/`.

### Deploy

You can deploy this application to:
- **Backend**: Heroku, AWS, DigitalOcean, etc.
- **Frontend**: Netlify, Vercel, AWS S3, etc.

Make sure to:
1. Set environment variables on your hosting platform
2. Update `FRONTEND_URL` to your production frontend URL
3. Update the API URL in the frontend (create `.env` in client folder with `REACT_APP_API_URL`)

## Environment Variables Reference

| Variable | Description | Example |
|----------|-------------|---------|
| `TEKMETRIC_CLIENT_ID` | Your Tekmetric API client ID | `87c51228f8da4c98` |
| `TEKMETRIC_CLIENT_SECRET` | Your Tekmetric API client secret | `208536b763d94a6a81b0c3c3` |
| `TEKMETRIC_ENVIRONMENT` | Tekmetric environment | `sandbox.tekmetric.com` |
| `PORT` | Backend server port | `3001` |
| `NODE_ENV` | Node environment | `development` or `production` |
| `FRONTEND_URL` | Frontend URL for CORS | `http://localhost:3000` |

## License

MIT

## Support

For Tekmetric API documentation and support, visit [Tekmetric's developer portal](https://tekmetric.com).

## Notes

- This application is currently configured for the Tekmetric **sandbox** environment
- To use in production, update `TEKMETRIC_ENVIRONMENT` to your production domain
- Some API endpoints may require additional parameters based on Tekmetric's API specifications
- The actual API response structure may vary - adjust the frontend components as needed based on real API responses
