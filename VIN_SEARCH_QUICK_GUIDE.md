# VIN Search - Quick Reference Guide

## Quick Start

1. Navigate to **VIN Search** in the navigation menu
2. Enter a 17-character VIN
3. Click **Search**
4. View vehicle info and repair orders

## API Endpoints Used

### 1. Vehicle Search
```
GET /api/tekmetric/vehicles
Parameters:
  - search: {VIN}
  - shop: {shopId}
  - size: 10
```

### 2. Repair Orders Fetch
```
GET /api/tekmetric/repair-orders
Parameters:
  - vehicleId: {vehicleId}
  - shop: {shopId}
  - size: 20
  - page: {pageNumber}
```

## Component Props & State

### State Variables
```javascript
vin                 // String - VIN input value
loading             // Boolean - Loading state
error               // String - Error message
vehicleInfo         // Object - Matched vehicle data
repairOrders        // Array - List of repair orders
pagination          // Object - Pagination state
  ├── currentPage   // Number - Current page (0-indexed)
  ├── totalPages    // Number - Total pages available
  ├── totalElements // Number - Total ROs count
  └── size          // Number - Items per page (20)
```

## Key Functions

### `handleSearch(e)`
- Validates VIN input
- Calls `searchByVin()` with page 0

### `searchByVin(vinNumber, page)`
1. Fetches vehicles by VIN
2. Finds exact VIN match
3. Fetches repair orders for vehicle
4. Updates state with results

### `handlePageChange(newPage)`
- Navigates to different page
- Calls `searchByVin()` with new page number

### `handleClear()`
- Resets all state
- Clears form

## Error Handling

| Error | Cause | Solution |
|-------|-------|----------|
| "Shop ID not found" | No shop ID in localStorage | Configure shop in Settings |
| "No vehicle found with VIN: {VIN}" | VIN doesn't exist | Verify VIN is correct |
| "No exact VIN match found" | Multiple vehicles, no exact match | Check VIN accuracy |
| API error messages | API request failed | Check console logs |

## Data Flow

```
User Input (VIN)
    ↓
Validate Input
    ↓
Search Vehicles API
    ↓
Match VIN → vehicleId
    ↓
Fetch Repair Orders API
    ↓
Display Results
```

## UI Components

### 1. Search Form
- VIN input (17 chars, uppercase, monospace)
- Search button (disabled when empty/loading)
- Clear button (shows after search)

### 2. Vehicle Info Card
- Blue highlighted card
- Vehicle details (Year, Make, Model, VIN)
- Customer & identification info

### 3. Repair Orders Table
- 11 columns (RO#, Status, Dates, Financials)
- Color-coded status badges
- Currency formatting
- Balance calculation

### 4. Pagination
- Previous/Next buttons
- Page indicator
- Disabled at boundaries

### 5. Summary Section
- Aggregated totals
- 4 metrics (Labor, Parts, Sales, Balance)

## Styling Classes

```css
.card                 // Main container
.form-group          // Form field wrapper
.btn-primary         // Primary action button
.btn-secondary       // Secondary action button
.alert-error         // Error message box
.spinner             // Loading spinner
.table-container     // Table wrapper
.grid                // CSS Grid layout
```

## Status Badge Colors

```javascript
ESTIMATE           → Orange  (#f59e0b)
WORKINPROGRESS     → Purple  (#8b5cf6)
COMPLETE           → Green   (#10b981)
SAVEDFORLATER      → Gray    (#6b7280)
POSTED             → D.Green (#059669)
ACCOUNTSRECEIVABLE → Red     (#dc2626)
DELETED            → B.Red   (#ef4444)
```

## Utility Functions

### `formatCurrency(cents)`
```javascript
// Converts cents to dollar format
// Input: 12345 → Output: "$123.45"
```

### `formatDate(dateString)`
```javascript
// Formats ISO date to locale string
// Input: "2026-02-07T..." → Output: "2/7/2026"
```

### `getStatusColor(statusCode)`
```javascript
// Returns hex color for status
// Input: "COMPLETE" → Output: "#10b981"
```

## Integration Checklist

- [x] Component created: `VinSearch.js`
- [x] Route added: `/vin-search`
- [x] Navigation link added
- [x] API functions imported
- [x] Error handling implemented
- [x] Loading states added
- [x] Pagination implemented
- [x] Summary calculations added

## File Locations

```
client/src/
├── components/
│   └── VinSearch.js          // Main component
├── services/
│   └── api.js                // API functions
└── App.js                     // Routing config
```

## Testing Commands

```bash
# Start development server
npm start

# Test VIN search
# 1. Navigate to http://localhost:3000/vin-search
# 2. Enter test VIN
# 3. Verify results display
```

## Common Patterns

### Async Operation Pattern
```javascript
setLoading(true);
setError(null);
try {
  const response = await apiCall(params);
  setState(response.data);
} catch (err) {
  setError(err.message);
} finally {
  setLoading(false);
}
```

### Conditional Rendering Pattern
```javascript
{loading && <Spinner />}
{error && <ErrorAlert message={error} />}
{data && <DataDisplay data={data} />}
```

## Performance Notes

- **Pagination**: Limits to 20 ROs per page
- **Debouncing**: Not implemented (single search action)
- **Caching**: Not implemented (fresh data on each search)
- **Lazy Loading**: Not implemented (loads all data for page)

## Accessibility

- Semantic HTML elements
- Form labels for inputs
- Button disabled states
- Loading indicators
- Error messages

## Browser Support

- Modern browsers (Chrome, Firefox, Safari, Edge)
- ES6+ JavaScript features
- CSS Grid support required
- Flexbox support required

## Dependencies

```json
{
  "react": "^18.x",
  "react-router-dom": "^6.x",
  "axios": "^1.x"
}
```

## Environment Variables

```bash
REACT_APP_API_URL=http://localhost:3001/api
```

## localStorage Keys

```javascript
tekmetric_shop_id  // Current shop ID (required)
```

## Console Logs

Development logs for debugging:
- `Searching for VIN: {VIN}`
- `Found {count} vehicle(s)`
- `Matched vehicle ID: {id}`
- `Fetching repair orders for vehicle ID: {id}`
- `Found {count} repair order(s)`
- Warning: `Multiple vehicles found. Using first match: {VIN}`

## Quick Troubleshooting

| Symptom | Check |
|---------|-------|
| Search button disabled | VIN field empty? |
| "Shop ID not found" | localStorage has shop ID? |
| No results | VIN correct? Vehicle exists? |
| Pagination not working | totalPages > 1? |
| Styling broken | CSS imported? |

## Related Components

- `Vehicles.js` - Vehicle management
- `RepairOrders.js` - RO management
- `Dashboard.js` - Main dashboard
- `Settings.js` - Configuration

## API Response Structures

### Vehicle Response
```json
{
  "id": 12345,
  "vin": "1HGBH41JXMN109186",
  "year": 2021,
  "make": "Honda",
  "model": "Accord",
  "customerId": 67890,
  "licensePlate": "ABC123",
  "state": "TX"
}
```

### Repair Order Response
```json
{
  "id": 54321,
  "repairOrderNumber": "RO-2026-001",
  "vehicleId": 12345,
  "repairOrderStatus": {
    "code": "COMPLETE",
    "name": "Complete"
  },
  "laborSales": 15000,
  "partsSales": 25000,
  "totalSales": 40000,
  "amountPaid": 40000
}
```

---

**Component**: VinSearch.js  
**Route**: /vin-search  
**Version**: 1.0.0
