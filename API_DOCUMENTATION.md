# Tekmetric API Integration - API Documentation

Complete API documentation for the Tekmetric API integration server.

## Base URL

```
http://localhost:3001/api
```

## Authentication

All Tekmetric endpoints automatically handle OAuth2 authentication using the client credentials flow. The access token is managed internally and refreshed automatically.

---

## Health Check

### GET /health

Check if the server is running.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2026-01-28T12:00:00.000Z",
  "environment": "sandbox.tekmetric.com"
}
```

---

## Authentication Endpoints

### GET /api/auth/test

Test authentication with Tekmetric API.

**Response (Success):**
```json
{
  "success": true,
  "message": "Successfully authenticated with Tekmetric API",
  "tokenPreview": "eyJhbGciOiJIUzI1NiIs...",
  "environment": "sandbox.tekmetric.com"
}
```

### GET /api/auth/status

Get current authentication status.

**Response:**
```json
{
  "configured": true,
  "environment": "sandbox.tekmetric.com",
  "hasToken": true,
  "tokenExpiry": "2026-01-28T13:00:00.000Z"
}
```

---

## Shop Endpoints

### GET /api/tekmetric/shops

Get all shops associated with your account.

**Response:**
```json
[
  {
    "id": 123,
    "name": "Main Street Auto",
    "email": "info@mainstreetauto.com",
    "phone": "(555) 123-4567",
    "address": "123 Main St, City, ST 12345"
  }
]
```

### GET /api/tekmetric/shops/:shopId

Get details for a specific shop.

**Parameters:**
- `shopId` (path) - Shop ID

**Response:**
```json
{
  "id": 123,
  "name": "Main Street Auto",
  "email": "info@mainstreetauto.com",
  "phone": "(555) 123-4567",
  "address": "123 Main St, City, ST 12345",
  "city": "City",
  "state": "ST",
  "zip": "12345"
}
```

---

## Customer Endpoints

### GET /api/tekmetric/customers

Get all customers.

**Query Parameters:**
- `page` (optional) - Page number
- `size` (optional) - Page size
- `search` (optional) - Search term

**Response:**
```json
{
  "content": [
    {
      "id": 456,
      "firstName": "John",
      "lastName": "Doe",
      "email": "john.doe@email.com",
      "phone": "(555) 987-6543",
      "createdDate": "2026-01-15T10:30:00.000Z"
    }
  ],
  "totalElements": 1,
  "totalPages": 1
}
```

### GET /api/tekmetric/customers/:customerId

Get a specific customer.

**Parameters:**
- `customerId` (path) - Customer ID

**Response:**
```json
{
  "id": 456,
  "firstName": "John",
  "lastName": "Doe",
  "email": "john.doe@email.com",
  "phone": "(555) 987-6543",
  "address": "456 Oak Ave",
  "city": "City",
  "state": "ST",
  "zip": "12345",
  "createdDate": "2026-01-15T10:30:00.000Z"
}
```

### POST /api/tekmetric/customers

Create a new customer.

**Request Body:**
```json
{
  "firstName": "Jane",
  "lastName": "Smith",
  "email": "jane.smith@email.com",
  "phone": "(555) 111-2222",
  "address": "789 Elm St",
  "city": "City",
  "state": "ST",
  "zip": "12345"
}
```

**Response:**
```json
{
  "id": 457,
  "firstName": "Jane",
  "lastName": "Smith",
  "email": "jane.smith@email.com",
  "phone": "(555) 111-2222",
  "createdDate": "2026-01-28T12:00:00.000Z"
}
```

### PUT /api/tekmetric/customers/:customerId

Update an existing customer.

**Parameters:**
- `customerId` (path) - Customer ID

**Request Body:**
```json
{
  "firstName": "Jane",
  "lastName": "Smith-Jones",
  "email": "jane.jones@email.com",
  "phone": "(555) 111-2222"
}
```

**Response:**
```json
{
  "id": 457,
  "firstName": "Jane",
  "lastName": "Smith-Jones",
  "email": "jane.jones@email.com",
  "phone": "(555) 111-2222"
}
```

---

## Vehicle Endpoints

### GET /api/tekmetric/vehicles

Get all vehicles.

**Query Parameters:**
- `page` (optional) - Page number
- `size` (optional) - Page size
- `customerId` (optional) - Filter by customer ID

**Response:**
```json
{
  "content": [
    {
      "id": 789,
      "year": 2020,
      "make": "Toyota",
      "model": "Camry",
      "vin": "1HGBH41JXMN109186",
      "licensePlate": "ABC123",
      "customerId": 456
    }
  ]
}
```

### GET /api/tekmetric/vehicles/:vehicleId

Get a specific vehicle.

**Parameters:**
- `vehicleId` (path) - Vehicle ID

**Response:**
```json
{
  "id": 789,
  "year": 2020,
  "make": "Toyota",
  "model": "Camry",
  "vin": "1HGBH41JXMN109186",
  "licensePlate": "ABC123",
  "customerId": 456,
  "mileage": 45000
}
```

### POST /api/tekmetric/vehicles

Create a new vehicle.

**Request Body:**
```json
{
  "year": 2021,
  "make": "Honda",
  "model": "Accord",
  "vin": "1HGCV1F16LA012345",
  "licensePlate": "XYZ789",
  "customerId": 456
}
```

**Response:**
```json
{
  "id": 790,
  "year": 2021,
  "make": "Honda",
  "model": "Accord",
  "vin": "1HGCV1F16LA012345",
  "licensePlate": "XYZ789",
  "customerId": 456
}
```

---

## Repair Order Endpoints

### GET /api/tekmetric/repair-orders

Get all repair orders.

**Query Parameters:**
- `page` (optional) - Page number
- `size` (optional) - Page size
- `status` (optional) - Filter by status
- `customerId` (optional) - Filter by customer ID

**Response:**
```json
{
  "content": [
    {
      "id": 1001,
      "number": "RO-2026-001",
      "customerId": 456,
      "customerName": "John Doe",
      "vehicleId": 789,
      "vehicleDescription": "2020 Toyota Camry",
      "status": "in_progress",
      "total": 450.00,
      "createdDate": "2026-01-28T09:00:00.000Z"
    }
  ]
}
```

### GET /api/tekmetric/repair-orders/:repairOrderId

Get a specific repair order.

**Parameters:**
- `repairOrderId` (path) - Repair Order ID

**Response:**
```json
{
  "id": 1001,
  "number": "RO-2026-001",
  "customerId": 456,
  "customerName": "John Doe",
  "vehicleId": 789,
  "vehicleDescription": "2020 Toyota Camry",
  "status": "in_progress",
  "total": 450.00,
  "subtotal": 400.00,
  "tax": 50.00,
  "jobs": [],
  "createdDate": "2026-01-28T09:00:00.000Z"
}
```

### POST /api/tekmetric/repair-orders

Create a new repair order.

**Request Body:**
```json
{
  "customerId": 456,
  "vehicleId": 789,
  "status": "draft",
  "notes": "Customer reports strange noise from engine"
}
```

**Response:**
```json
{
  "id": 1002,
  "number": "RO-2026-002",
  "customerId": 456,
  "vehicleId": 789,
  "status": "draft",
  "total": 0.00,
  "createdDate": "2026-01-28T12:00:00.000Z"
}
```

### PUT /api/tekmetric/repair-orders/:repairOrderId

Update a repair order.

**Parameters:**
- `repairOrderId` (path) - Repair Order ID

**Request Body:**
```json
{
  "status": "authorized",
  "notes": "Customer approved estimate"
}
```

---

## Job Endpoints

### GET /api/tekmetric/repair-orders/:repairOrderId/jobs

Get all jobs for a repair order.

**Parameters:**
- `repairOrderId` (path) - Repair Order ID

**Response:**
```json
[
  {
    "id": 2001,
    "repairOrderId": 1001,
    "name": "Oil Change",
    "description": "Standard oil change with filter",
    "laborCost": 50.00,
    "partsCost": 30.00,
    "total": 80.00,
    "status": "completed"
  }
]
```

### POST /api/tekmetric/repair-orders/:repairOrderId/jobs

Create a new job for a repair order.

**Parameters:**
- `repairOrderId` (path) - Repair Order ID

**Request Body:**
```json
{
  "name": "Brake Pad Replacement",
  "description": "Replace front brake pads",
  "laborCost": 150.00,
  "partsCost": 120.00
}
```

---

## Inspection Endpoints

### GET /api/tekmetric/inspections

Get all inspections.

**Query Parameters:**
- `page` (optional) - Page number
- `size` (optional) - Page size
- `vehicleId` (optional) - Filter by vehicle ID

**Response:**
```json
{
  "content": [
    {
      "id": 3001,
      "vehicleId": 789,
      "vehicleDescription": "2020 Toyota Camry",
      "technicianId": 101,
      "technicianName": "Mike Johnson",
      "status": "completed",
      "createdDate": "2026-01-28T10:00:00.000Z"
    }
  ]
}
```

### GET /api/tekmetric/inspections/:inspectionId

Get a specific inspection.

**Parameters:**
- `inspectionId` (path) - Inspection ID

**Response:**
```json
{
  "id": 3001,
  "vehicleId": 789,
  "vehicleDescription": "2020 Toyota Camry",
  "technicianId": 101,
  "technicianName": "Mike Johnson",
  "status": "completed",
  "items": [],
  "createdDate": "2026-01-28T10:00:00.000Z"
}
```

---

## Employee Endpoints

### GET /api/tekmetric/employees

Get all employees.

**Response:**
```json
[
  {
    "id": 101,
    "firstName": "Mike",
    "lastName": "Johnson",
    "email": "mike.johnson@shop.com",
    "role": "Technician",
    "active": true
  }
]
```

### GET /api/tekmetric/employees/:employeeId

Get a specific employee.

**Parameters:**
- `employeeId` (path) - Employee ID

**Response:**
```json
{
  "id": 101,
  "firstName": "Mike",
  "lastName": "Johnson",
  "email": "mike.johnson@shop.com",
  "role": "Technician",
  "active": true,
  "hireDate": "2025-01-15T00:00:00.000Z"
}
```

---

## Error Responses

All endpoints may return error responses in the following format:

**400 Bad Request:**
```json
{
  "error": {
    "message": "Invalid request parameters",
    "status": 400
  }
}
```

**401 Unauthorized:**
```json
{
  "error": {
    "message": "Failed to authenticate with Tekmetric API",
    "status": 401
  }
}
```

**404 Not Found:**
```json
{
  "error": {
    "message": "Resource not found",
    "status": 404
  }
}
```

**500 Internal Server Error:**
```json
{
  "error": {
    "message": "Internal server error",
    "status": 500
  }
}
```

---

## Rate Limiting

The API implements rate limiting:
- **Limit**: 100 requests per 15 minutes per IP address
- **Response when exceeded**: 429 Too Many Requests

---

## Notes

1. All timestamps are in ISO 8601 format (UTC)
2. All monetary values are in USD
3. The actual response structure may vary based on Tekmetric's API version
4. Some fields may be optional or null depending on the data
5. Pagination parameters work with Tekmetric's pagination system
