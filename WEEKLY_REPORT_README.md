# Weekly Report Page - Technical Documentation

## Overview

The Weekly Report page is a **drift-proof** internal operations reporting tool designed for auto repair businesses. It implements exact reporting definitions with strict date logic separation to ensure accuracy and auditability.

**Critical Principle**: Sales ≠ Production ≠ Cash

Each section uses different date fields and never mixes date logic.

## File Location

- **Component**: `/client/src/components/WeeklyReport.js`
- **Route**: `/weekly-report`
- **Navigation**: Added to main navigation menu as "Weekly Report"

## Architecture

### Data Sources

All data comes from the Tekmetric API via two endpoints:

1. **Repair Orders** (`/api/v1/repair-orders`)
   - Used for Production and Cash sections
   - Contains embedded jobs data
   
2. **Jobs** (accessed via Repair Orders)
   - Used for Sales section
   - Embedded within repair orders

### Authentication

- Uses Bearer token authentication (handled by API service layer)
- Requires shop ID from localStorage (`tekmetric_shop_id`)

### Pagination Handling

The API returns maximum 100 items per page. The component implements automatic pagination:

```javascript
const fetchAllPages = async (fetchFunction, params) => {
  let allData = [];
  let page = 0;
  let hasMore = true;
  
  while (hasMore) {
    const response = await fetchFunction({ ...params, page, size: 100 });
    const data = response.data;
    
    if (data.content && Array.isArray(data.content)) {
      allData = [...allData, ...data.content];
      hasMore = page < data.totalPages - 1;
      page++;
    } else if (Array.isArray(data)) {
      allData = data;
      hasMore = false;
    } else {
      hasMore = false;
    }
  }
  
  return allData;
};
```

## Global Controls

### Shop Selector
- **Required**: Yes
- **Default**: Reads from `localStorage.getItem('tekmetric_shop_id')`
- **Purpose**: Filters all data to specific shop location

### Week Selector
- **Week Start**: Monday at 00:00:00
- **Week End**: Sunday at 23:59:59
- **Default**: Current week (auto-calculated on mount)
- **Format**: YYYY-MM-DD

### Calculation Trigger
- All calculations re-run when "Generate Report" button is clicked
- Three sections calculate in parallel for performance
- Each section has independent loading and error states

## Section A: Sales & Work Sold

### Purpose
Track work that was **authorized** (sold) during the week.

### Date Driver
**`authorizedDate`** from Jobs

**Why**: This represents when the customer approved the work, which is when the sale occurred.

### Data Source
- Primary: Jobs (embedded in Repair Orders)
- Endpoint: Repair Orders with jobs included

### Filters

```javascript
// 1. Job must be authorized
job.authorized === true

// 2. Job authorized date must be in week range
job.authorizedDate >= weekStart && job.authorizedDate <= weekEnd

// 3. Repair Order must have valid status
ro.repairOrderStatusId IN [2, 3, 5, 6]
// 2 = Work-in-Progress
// 3 = Complete
// 5 = Posted
// 6 = Accounts Receivable
```

### Metrics Calculated

| Metric | Calculation | Source Field | Notes |
|--------|-------------|--------------|-------|
| Authorized Jobs | Count of filtered jobs | - | Jobs meeting all filter criteria |
| Sold Labor | Sum of labor totals | `job.laborTotal` | Converted from cents to dollars |
| Sold Parts | Sum of parts totals | `job.partsTotal` | Converted from cents to dollars |
| Sold Sublet | Sum of sublet totals | `job.subletTotal` | Converted from cents to dollars |
| Fees | Sum of fee totals | `job.feeTotal` | Converted from cents to dollars |
| Discounts | Sum of discount totals | `job.discountTotal` | Converted from cents to dollars |
| Total Sold | Sum of subtotals | `job.subtotal` | **NO TAX INCLUDED** |

### Rollover Sold

**Definition**: Work that was sold in a previous period but belongs to an older repair order.

**Logic**:
```javascript
// Job authorized BEFORE week start
job.authorizedDate < weekStart

// AND Repair Order created BEFORE week start
ro.createdDate < weekStart
```

**Metrics**:
- Count of rollover jobs
- Total dollar value of rollover jobs

### Implementation

```javascript
const calculateSalesMetrics = async () => {
  // Fetch all repair orders (includes embedded jobs)
  const allROs = await fetchAllPages(getRepairOrders, { shop: selectedShop });
  
  const weekStartDate = new Date(weekStart + 'T00:00:00');
  const weekEndDate = new Date(weekEnd + 'T23:59:59');
  const validStatusIds = [2, 3, 5, 6];
  
  let authorizedJobs = [];
  let rolloverSoldJobs = [];
  
  allROs.forEach(ro => {
    if (!validStatusIds.includes(ro.repairOrderStatusId) || !ro.jobs) return;
    
    ro.jobs.forEach(job => {
      if (!job.authorized || !job.authorizedDate) return;
      
      const authorizedDate = new Date(job.authorizedDate);
      
      // Current week sales
      if (authorizedDate >= weekStartDate && authorizedDate <= weekEndDate) {
        authorizedJobs.push({ ...job, ro });
      }
      
      // Rollover sales
      if (authorizedDate < weekStartDate && ro.createdDate) {
        const roCreatedDate = new Date(ro.createdDate);
        if (roCreatedDate < weekStartDate) {
          rolloverSoldJobs.push({ ...job, ro });
        }
      }
    });
  });
  
  // Calculate metrics...
};
```

## Section B: Production & Completion

### Purpose
Track work that was **completed** (posted) during the week.

### Date Driver
**`postedDate`** from Repair Orders

**Why**: This represents when the repair order was finalized and posted to accounting, which is when production was completed.

### Data Source
- Primary: Repair Orders
- Endpoint: `/api/v1/repair-orders`

### Filters

```javascript
// 1. Repair Order must have posted or AR status
ro.repairOrderStatusId IN [5, 6]
// 5 = Posted
// 6 = Accounts Receivable

// 2. Posted date must be in week range
ro.postedDate >= weekStart && ro.postedDate <= weekEnd
```

### Metrics Calculated

| Metric | Calculation | Source Field | Notes |
|--------|-------------|--------------|-------|
| Repair Orders Completed | Count of filtered ROs | - | ROs meeting filter criteria |
| Jobs Completed | Sum of job counts | `ro.jobs.length` | Total jobs in completed ROs |
| Unique Vehicles | Distinct vehicle count | `ro.vehicleId` | Uses Set for uniqueness |
| Billable Labor Hours | Sum of completed labor hours | `laborItem.hours` | Only where `laborItem.complete === true` |
| Total Completed | Sum of RO totals | `ro.totalSales` | Converted from cents, **NO TAX** |

### Rollover Completed

**Definition**: Work that was authorized in a previous period but completed this week.

**Logic**:
```javascript
// Job authorized BEFORE week start
job.authorizedDate < weekStart

// BUT Repair Order posted IN week range
ro.postedDate >= weekStart && ro.postedDate <= weekEnd
```

**Metrics**:
- Count of rollover completed jobs
- Total dollar value of rollover completed jobs

### Implementation

```javascript
const calculateProductionMetrics = async () => {
  const allROs = await fetchAllPages(getRepairOrders, { shop: selectedShop });
  
  const weekStartDate = new Date(weekStart + 'T00:00:00');
  const weekEndDate = new Date(weekEnd + 'T23:59:59');
  const validStatusIds = [5, 6];
  
  const completedROs = allROs.filter(ro => {
    if (!validStatusIds.includes(ro.repairOrderStatusId)) return false;
    if (!ro.postedDate) return false;
    
    const postedDate = new Date(ro.postedDate);
    return postedDate >= weekStartDate && postedDate <= weekEndDate;
  });
  
  // Calculate metrics including rollover...
};
```

## Section C: Cash & Accounting

### Purpose
Track cash that was **collected** during the week.

### Date Driver
**`updatedDate`** from Repair Orders

**Why**: This represents when the payment was recorded, which is when cash was collected.

### Data Source
- Primary: Repair Orders
- Endpoint: `/api/v1/repair-orders`

### Filters

```javascript
// 1. Updated date must be in week range
ro.updatedDate >= weekStart && ro.updatedDate <= weekEnd

// 2. Must have payment recorded
ro.amountPaid > 0
```

### Metrics Calculated

| Metric | Calculation | Source Field | Notes |
|--------|-------------|--------------|-------|
| Cash Collected | Sum of payments | `ro.amountPaid` | Converted from cents to dollars |
| RO Count with Payments | Count of filtered ROs | - | ROs with payments in week |
| Avg Collected per RO | Cash / Count | Calculated | Average payment per RO |

### Implementation

```javascript
const calculateCashMetrics = async () => {
  const allROs = await fetchAllPages(getRepairOrders, { shop: selectedShop });
  
  const weekStartDate = new Date(weekStart + 'T00:00:00');
  const weekEndDate = new Date(weekEnd + 'T23:59:59');
  
  const paidROs = allROs.filter(ro => {
    if (!ro.updatedDate) return false;
    
    const updatedDate = new Date(ro.updatedDate);
    if (updatedDate < weekStartDate || updatedDate > weekEndDate) return false;
    
    return (ro.amountPaid || 0) > 0;
  });
  
  // Calculate metrics...
};
```

## Critical Rules (Enforced)

### 1. Date Field Separation
**NEVER mix date fields between sections**

- Section A uses **only** `authorizedDate`
- Section B uses **only** `postedDate`
- Section C uses **only** `updatedDate`

### 2. Sales ≠ Production ≠ Cash
These are three different business events:
- **Sales**: When customer approves work
- **Production**: When work is completed and posted
- **Cash**: When payment is received

They can occur in different time periods for the same repair order.

### 3. Tax Exclusion
**Tax must never be included in any calculation**

- Use `subtotal` fields, not `total` fields
- Use `totalSales` which excludes tax
- Never use fields containing tax amounts

### 4. Currency Conversion
**All API values are in cents**

```javascript
const dollars = cents / 100;
```

Always convert before displaying or calculating.

### 5. Rollover Metrics
**Rollover must be explicit, not inferred**

Rollover calculations are clearly defined:
- Sales Rollover: `authorizedDate < weekStart AND createdDate < weekStart`
- Production Rollover: `authorizedDate < weekStart BUT postedDate in week`

## UI Requirements

### Section Layout
Three clearly labeled sections with color coding:
- **Section A (Sales)**: Blue theme (`#3b82f6`)
- **Section B (Production)**: Green theme (`#10b981`)
- **Section C (Cash)**: Yellow/Orange theme (`#f59e0b`)

### Metric Cards
Each metric displays:
- Label
- Value (formatted)
- Tooltip with explanation (ℹ️ icon)

### Tooltips
Every metric has a tooltip explaining:
- Source field
- Date logic used
- Any filters applied

Example:
```javascript
<MetricCard
  label="Authorized Jobs"
  value={formatNumber(salesData.authorizedJobsCount)}
  tooltip="Count of jobs with authorized=true and authorizedDate in week range"
/>
```

### Loading States
Each section has independent loading state:
- Shows spinner during calculation
- Displays "Loading [section] data..." message
- Other sections remain interactive

### Error States
Each section has independent error handling:
- Displays error message in red alert box
- Other sections remain functional
- Error details from API response

### Formatting
- **Currency**: `$1,234.56` format
- **Numbers**: `1,234` format with commas
- **Dates**: ISO format (YYYY-MM-DD) for inputs

## Component Structure

```
WeeklyReport (main component)
├── Global Controls
│   ├── Shop ID input
│   ├── Week Start date picker
│   ├── Week End date picker
│   └── Generate Report button
├── Section A: Sales & Work Sold
│   ├── Metrics grid (7 cards)
│   └── Rollover Sold panel
├── Section B: Production & Completion
│   ├── Metrics grid (5 cards)
│   └── Rollover Completed panel
├── Section C: Cash & Accounting
│   └── Metrics grid (3 cards)
└── Critical Rules reminder panel

MetricCard (reusable component)
├── Label with tooltip icon
└── Value (formatted, styled)
```

## State Management

```javascript
// Global Controls
const [selectedShop, setSelectedShop] = useState('');
const [weekStart, setWeekStart] = useState('');
const [weekEnd, setWeekEnd] = useState('');

// Loading States (per section)
const [loadingSales, setLoadingSales] = useState(false);
const [loadingProduction, setLoadingProduction] = useState(false);
const [loadingCash, setLoadingCash] = useState(false);

// Error States (per section)
const [errorSales, setErrorSales] = useState(null);
const [errorProduction, setErrorProduction] = useState(null);
const [errorCash, setErrorCash] = useState(null);

// Data State
const [salesData, setSalesData] = useState(null);
const [productionData, setProductionData] = useState(null);
const [cashData, setCashData] = useState(null);
```

## Calculation Functions

### Main Functions
1. `calculateSalesMetrics()` - Section A
2. `calculateProductionMetrics()` - Section B
3. `calculateCashMetrics()` - Section C

### Helper Functions
1. `fetchAllPages(fetchFunction, params)` - Pagination handler
2. `formatCurrency(value)` - Currency formatter
3. `formatNumber(value)` - Number formatter
4. `handleGenerateReport()` - Triggers all calculations

## Performance Considerations

### Parallel Execution
All three sections calculate in parallel:
```javascript
const handleGenerateReport = () => {
  calculateSalesMetrics();
  calculateProductionMetrics();
  calculateCashMetrics();
};
```

### Pagination
- Fetches all pages automatically
- No artificial limits (fetches complete dataset)
- Uses async/await for sequential page fetching

### Data Processing
- All calculations done client-side
- No server-side aggregation
- Full dataset loaded for accuracy

## Testing Scenarios

### Test Case 1: Same Week Authorization and Completion
- Create RO on Monday
- Authorize job on Tuesday
- Complete and post RO on Friday
- Collect payment on Friday

**Expected**:
- Section A: Shows in Sales (authorized Tuesday)
- Section B: Shows in Production (posted Friday)
- Section C: Shows in Cash (payment Friday)

### Test Case 2: Rollover Scenario
- Create RO in Week 1
- Authorize job in Week 1
- Complete and post RO in Week 2
- Collect payment in Week 3

**Expected Week 2**:
- Section A: Not in Sales (authorized Week 1)
- Section B: Shows in Production (posted Week 2) AND Rollover Completed
- Section C: Not in Cash (payment Week 3)

**Expected Week 3**:
- Section A: Not in Sales
- Section B: Not in Production
- Section C: Shows in Cash (payment Week 3)

### Test Case 3: Partial Payment
- Complete RO in Week 1
- Collect partial payment in Week 1
- Collect final payment in Week 2

**Expected Week 1**:
- Section C: Shows partial payment amount

**Expected Week 2**:
- Section C: Shows final payment amount (NOT total)

## API Field Reference

### Repair Order Fields Used
```javascript
{
  id: number,
  repairOrderNumber: string,
  repairOrderStatusId: number,
  createdDate: string (ISO),
  updatedDate: string (ISO),
  postedDate: string (ISO),
  completedDate: string (ISO),
  vehicleId: number,
  totalSales: number (cents, no tax),
  laborSales: number (cents),
  partsSales: number (cents),
  amountPaid: number (cents),
  jobs: [Job]
}
```

### Job Fields Used
```javascript
{
  id: number,
  repairOrderId: number,
  name: string,
  authorized: boolean,
  authorizedDate: string (ISO),
  completed: boolean,
  completedDate: string (ISO),
  laborTotal: number (cents),
  partsTotal: number (cents),
  subletTotal: number (cents),
  feeTotal: number (cents),
  discountTotal: number (cents),
  subtotal: number (cents, no tax),
  labor: [LaborItem]
}
```

### Labor Item Fields Used
```javascript
{
  id: number,
  hours: number,
  complete: boolean,
  rate: number (cents)
}
```

## Troubleshooting

### Issue: No data showing
**Check**:
1. Shop ID is set correctly
2. Week range is valid (Monday to Sunday)
3. API credentials are configured
4. Network tab shows successful API calls

### Issue: Metrics don't match expectations
**Check**:
1. Verify date field being used for each section
2. Check RO status filters
3. Confirm tax is not included
4. Verify currency conversion (cents to dollars)

### Issue: Rollover metrics seem wrong
**Check**:
1. Rollover logic is explicit, not inferred
2. Sales rollover uses `createdDate < weekStart`
3. Production rollover uses `authorizedDate < weekStart`

### Issue: Performance is slow
**Check**:
1. Large dataset? (pagination fetches all pages)
2. Network latency?
3. Consider adding progress indicators
4. Could implement data caching

## Future Enhancements

### Potential Additions (Not in Scope)
- Charts and visualizations
- Export to CSV/PDF
- Historical comparison
- Drill-down to individual ROs
- Real-time updates
- Advanced filtering
- Custom date ranges (not just weeks)
- Multi-shop comparison

### Not Implemented (By Design)
- Styling beyond basic layout
- Complex UI animations
- Responsive mobile design
- Print stylesheet
- Keyboard shortcuts

## Code Comments

The component includes extensive inline comments explaining:
- Why each date field is used
- Filter logic for each section
- Currency conversion points
- Rollover calculation logic

Example:
```javascript
// SECTION A: Sales & Work Sold
// Date driver: authorizedDate from Jobs
// Why: This represents when the customer approved the work
```

## Maintenance Notes

### When API Changes
If Tekmetric API changes:
1. Update field mappings in calculations
2. Verify date field names
3. Check status ID values
4. Test currency conversion

### When Adding Features
1. Maintain date field separation
2. Keep sections independent
3. Add tooltips for new metrics
4. Update this documentation

### When Debugging
1. Check browser console for API errors
2. Verify date parsing (timezone issues)
3. Confirm filter logic
4. Validate calculations with known data

## Summary

The Weekly Report page is a production-ready, drift-proof reporting tool that:
- ✅ Implements exact reporting definitions
- ✅ Never mixes date logic between sections
- ✅ Handles pagination automatically
- ✅ Provides clear tooltips and documentation
- ✅ Has independent loading/error states per section
- ✅ Excludes tax from all calculations
- ✅ Converts currency correctly
- ✅ Calculates rollover metrics explicitly
- ✅ Uses client-side calculation for accuracy
- ✅ Includes comprehensive inline comments

**Remember**: Sales ≠ Production ≠ Cash. Each section tells a different story about the business.
