# Quick Start Guide

Get up and running with the Tekmetric API integration in 5 minutes!

## Step 1: Install Dependencies

```bash
# Install backend dependencies
npm install

# Install frontend dependencies
cd client && npm install && cd ..
```

## Step 2: Verify Configuration

Your API credentials are already configured in `.env`:
- Client ID: `87c51228f8da4c98`
- Client Secret: `208536b763d94a6a81b0c3c3`
- Environment: `sandbox.tekmetric.com`

## Step 3: Start the Application

```bash
npm run dev:all
```

This starts both the backend (port 3001) and frontend (port 3000).

## Step 4: Open the Dashboard

Navigate to: `http://localhost:3000`

## Step 5: Test the Connection

1. Click the "Test Authentication" button on the dashboard
2. If successful, you'll see a success message with your access token preview
3. Start exploring the different sections!

## What You Can Do

- **View Data**: Browse customers, vehicles, repair orders, inspections, and employees
- **Create Records**: Add new customers and vehicles
- **Monitor Status**: Check your API connection status in real-time

## Common Commands

```bash
# Start both servers
npm run dev:all

# Start backend only
npm run dev

# Start frontend only
npm run client

# Build for production
cd client && npm run build
```

## Need Help?

Check the full [README.md](./README.md) for detailed documentation.

## API Testing

You can also test the API directly:

```bash
# Test authentication
curl http://localhost:3001/api/auth/test

# Check health
curl http://localhost:3001/health

# Get customers
curl http://localhost:3001/api/tekmetric/customers
```

## Next Steps

1. Explore the different sections in the dashboard
2. Try creating a customer or vehicle
3. Check out the API endpoints in the backend
4. Customize the frontend components to match your needs
5. Review the code in `server/services/tekmetricService.js` to understand the API integration

Happy coding!
