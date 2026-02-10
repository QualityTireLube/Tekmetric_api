# VIN Search Feature - Documentation

## Overview

The VIN Search feature allows users to search for all repair orders associated with a specific vehicle by entering its Vehicle Identification Number (VIN). This feature provides a streamlined way to view a vehicle's complete service history.

## Features

### Core Functionality

1. **VIN Input & Validation**
   - Text input field for entering VIN (17 characters max)
   - Automatic uppercase conversion
   - Input validation before search

2. **Vehicle Resolution**
   - Searches Tekmetric API for vehicles matching the VIN
   - Handles multiple scenarios:
     - Exact VIN match found
     - No vehicle found
     - Multiple vehicles returned (selects exact match or first result)
   - Displays comprehensive vehicle information

3. **Repair Orders Display**
   - Lists all repair orders for the matched vehicle
   - Includes pagination support (20 orders per page)
   - Displays key financial metrics:
     - Labor, Parts, Sublets, Fees
     - Discounts, Total Sales, Amount Paid
     - Outstanding Balance (calculated)

4. **Summary Statistics**
   - Aggregated totals across all displayed repair orders
   - Total Labor, Total Parts, Total Sales
   - Total Outstanding Balance

## User Interface

### Search Form
- **VIN Input Field**: Monospace font, uppercase, 17-character limit
- **Search Button**: Disabled when VIN is empty or search is in progress
- **Clear Button**: Appears after search to reset the form

### Vehicle Information Card
- Highlighted blue card displaying:
  - Vehicle Year, Make, Model, SubModel
  - VIN (monospace, highlighted)
  - Vehicle ID
  - License Plate & State
  - Color
  - Customer ID

### Repair Orders Table
Columns:
- RO # (Repair Order Number)
- Status (color-coded badge)
- Created Date
- Labor, Parts, Sublets, Fees
- Discounts (red text)
- Total Sales (bold)
- Amount Paid (green text)
- Balance (red/green based on amount)

### Pagination Controls
- Previous/Next buttons
- Current page indicator
- Disabled states when at boundaries

## Technical Implementation

### Component Structure

```
VinSearch.js
├── State Management
│   ├── vin (search input)
│   ├── loading (async operation status)
│   ├── error (error messages)
│   ├── vehicleInfo (matched vehicle data)
│   ├── repairOrders (RO list)
│   └── pagination (page state)
├── API Integration
│   ├── getVehicles() - Search by VIN
│   └── getRepairOrders() - Fetch ROs by vehicleId
└── UI Components
    ├── Search Form
    ├── Vehicle Info Card
    ├── Repair Orders Table
    └── Summary Section
```

### API Flow

1. **Vehicle Search**
   ```javascript
   GET /api/tekmetric/vehicles
   Params: {
     search: VIN,
     shop: shopId,
     size: 10
   }
   ```

2. **VIN Resolution**
   - Finds exact VIN match from results
   - Falls back to first result if no exact match
   - Warns if multiple vehicles found

3. **Repair Orders Fetch**
   ```javascript
   GET /api/tekmetric/repair-orders
   Params: {
     vehicleId: matchedVehicle.id,
     shop: shopId,
     size: 20,
     page: currentPage
   }
   ```

### Error Handling

- **No Shop ID**: "Shop ID not found. Please configure your shop settings."
- **No Vehicle Found**: "No vehicle found with VIN: {VIN}"
- **No Exact Match**: "No exact VIN match found for: {VIN}"
- **API Errors**: Displays error message from API response

### Loading States

- Search button shows "Searching..." during operation
- Spinner displayed during async operations
- Buttons disabled during loading
- Prevents duplicate searches

## Data Display

### Status Colors
- **ESTIMATE**: Orange (#f59e0b)
- **WORKINPROGRESS**: Purple (#8b5cf6)
- **COMPLETE**: Green (#10b981)
- **SAVEDFORLATER**: Gray (#6b7280)
- **POSTED**: Dark Green (#059669)
- **ACCOUNTSRECEIVABLE**: Red (#dc2626)
- **DELETED**: Bright Red (#ef4444)

### Currency Formatting
- All amounts displayed in USD format: `$X,XXX.XX`
- Stored in cents, converted to dollars for display
- Negative values (discounts) shown in red

### Date Formatting
- Dates displayed in localized format
- Example: `2/7/2026`

## Usage Example

### Step-by-Step

1. **Navigate to VIN Search**
   - Click "VIN Search" in the navigation menu

2. **Enter VIN**
   - Type or paste the 17-character VIN
   - VIN is automatically converted to uppercase

3. **Search**
   - Click "Search" button
   - System searches for vehicle and retrieves repair orders

4. **Review Results**
   - View vehicle information in the blue card
   - Scroll through repair orders table
   - Check summary statistics at bottom

5. **Pagination** (if needed)
   - Use Previous/Next buttons to navigate pages
   - Each page shows up to 20 repair orders

6. **Clear Search**
   - Click "Clear" to reset and search for another VIN

## Integration Points

### Required Dependencies
- React (hooks: useState)
- API service functions:
  - `getVehicles(params)`
  - `getRepairOrders(params)`

### Local Storage Requirements
- `tekmetric_shop_id`: Current shop ID must be set

### Routing
- Route path: `/vin-search`
- Component: `<VinSearch />`

## Best Practices

### Performance
- Pagination limits results to 20 per page
- Async operations prevent UI blocking
- Efficient state updates

### User Experience
- Clear error messages
- Loading indicators
- Disabled buttons during operations
- Visual feedback for all actions

### Data Integrity
- VIN validation (17 characters)
- Exact match prioritization
- Handles edge cases (no results, multiple results)

## Future Enhancements

Potential improvements:
1. **Export Functionality**: Export repair orders to CSV/PDF
2. **Detailed RO View**: Click on RO to see full details
3. **Date Range Filter**: Filter ROs by date range
4. **Status Filter**: Filter ROs by status
5. **Print View**: Printer-friendly layout
6. **Customer Information**: Display customer details alongside vehicle info
7. **Service History Timeline**: Visual timeline of services
8. **Cost Analysis**: Charts and graphs for cost breakdown

## Troubleshooting

### Common Issues

**Issue**: "Shop ID not found" error
- **Solution**: Navigate to Settings and configure shop ID

**Issue**: "No vehicle found" error
- **Solution**: Verify VIN is correct (17 characters, no spaces)

**Issue**: Vehicle found but no repair orders
- **Solution**: This is normal - vehicle may not have any service history

**Issue**: Multiple vehicles warning in console
- **Solution**: System automatically selects first match; verify VIN is correct

## Code Example

### Basic Usage

```javascript
import VinSearch from './components/VinSearch';

// In your routing configuration
<Route path="/vin-search" element={<VinSearch />} />
```

### API Service Integration

```javascript
// services/api.js
export const getVehicles = (params) => api.get('/tekmetric/vehicles', { params });
export const getRepairOrders = (params) => api.get('/tekmetric/repair-orders', { params });
```

## Testing Checklist

- [ ] Search with valid VIN returns results
- [ ] Search with invalid VIN shows error
- [ ] Empty VIN disables search button
- [ ] Loading states display correctly
- [ ] Pagination works correctly
- [ ] Clear button resets form
- [ ] Currency formatting is correct
- [ ] Status colors display properly
- [ ] Summary calculations are accurate
- [ ] Error messages are clear and helpful

## Support

For issues or questions:
1. Check console logs for detailed error messages
2. Verify API credentials are configured
3. Ensure shop ID is set in Settings
4. Review Tekmetric API documentation for endpoint details

---

**Version**: 1.0.0  
**Last Updated**: February 7, 2026  
**Component**: `VinSearch.js`  
**Route**: `/vin-search`
