# Reports Page - How It Works

## Overview
The Reports page fetches repair orders from the Tekmetric API and displays technician performance metrics including billed time, clocked time, efficiency, and labor sales.

---

## Data Fetching Process

### 1. Initial Request
When you click "Generate Report", the system:

```javascript
1. Takes your selected date range (e.g., Feb 1 - Feb 6, 2026)
2. Fetches the FIRST page (100 repair orders) from Tekmetric API
3. Checks if there are more pages available
```

**API Request:**
```
GET /api/tekmetric/repair-orders?shop=14082&size=100&page=0
```

### 2. Pagination Handling
Since Tekmetric limits results to 100 per page:

```javascript
- First request returns: 100 ROs + pagination info
- Total available: 31,542 ROs across 316 pages
- System fetches: Pages 1-10 (1,000 ROs total)
- Reason: Performance limit to keep UI responsive
```

**Multiple Page Requests (in parallel):**
```
GET /api/tekmetric/repair-orders?shop=14082&size=100&page=1
GET /api/tekmetric/repair-orders?shop=14082&size=100&page=2
...
GET /api/tekmetric/repair-orders?shop=14082&size=100&page=9
```

### 3. Date Filtering
After fetching 1,000 ROs, the system filters by your selected date range:

#### Date Field Priority (User Selectable)
You can choose which date field to use via the "Filter By Date" dropdown:

1. **Completed Date** (default)
   - When the RO was marked as complete
   - Best for: "What work was finished this week?"

2. **Posted Date**
   - When the RO was posted/invoiced
   - Best for: "What was billed this week?"

3. **Created Date**
   - When the RO was first created
   - Best for: "What work came in this week?"

#### Fallback Logic
If the selected date field doesn't exist on an RO, it falls back to:
```
completedDate → postedDate → updatedDate → createdDate
```

#### Date Comparison
```javascript
// Extracts just the DATE part (ignoring time)
RO Date: 2026-02-06T18:42:32Z → 2026-02-06
Your Range: 2026-02-01 to 2026-02-06

// Includes all ROs where the date falls within range
Result: INCLUDED (Feb 6 is within Feb 1-6)
```

---

## Job Counting Logic

### What Jobs Are Counted?

The system counts jobs that meet ALL of these criteria:

1. ✅ **Has labor items** - Job must have at least one labor line item
2. ✅ **Is authorized** - Job must be authorized by customer (`job.authorized === true`)
3. ✅ **Has OR doesn't have a technician** - Includes both assigned and unassigned jobs

### What Jobs Are NOT Counted?

- ❌ Jobs without labor items
- ❌ Jobs that are not authorized
- ❌ Jobs that are archived (if applicable)

### Example Breakdown

From your data:
```
Total jobs in ROs: 278
├─ Jobs with labor items: 191
├─ Jobs without technician: 55
├─ Jobs not authorized: 77
└─ Jobs counted in report: 191
```

**Why 191 and not 278?**
- 77 jobs are not authorized (declined estimates, etc.)
- 10 jobs don't have labor items yet

---

## Metrics Calculation

### 1. Billed Time (Labor Hours)
**Definition:** Total hours from ALL labor items in authorized jobs

```javascript
// For each authorized job with labor items:
job.labor.forEach(laborItem => {
  billedTime += laborItem.hours
})

// Example:
Job 1: Oil Change
  - Labor Item 1: "R&R Oil Filter" = 0.5 hours
  - Labor Item 2: "Drain & Fill Oil" = 0.3 hours
  - Billed Time = 0.8 hours
```

**Important:** Counts ALL labor hours, not just completed labor items. This represents the hours SOLD to the customer.

### 2. Clocked Time (Logged Hours)
**Definition:** Actual time logged by technician

```javascript
// Currently shows 0.00 because:
job.loggedHours === null  // This field is not populated in API
```

**Note:** The `loggedHours` field exists in the API response but is always `null`. This means:
- Tekmetric may not be tracking clocked time in this endpoint
- Or it requires a separate time clock API call
- Or it's a premium feature not enabled

### 3. Efficiency
**Formula:** `(Clocked Time / Billed Time) × 100%`

```javascript
Example:
Billed Time: 10 hours (sold to customer)
Clocked Time: 8 hours (actual time worked)
Efficiency: (8 / 10) × 100 = 80%
```

**Currently:** Shows "N/A" because clocked time is not available.

### 4. Labor Sales
**Definition:** Total labor revenue in dollars

```javascript
// For each authorized job:
laborSales += (job.laborTotal / 100)  // Convert cents to dollars

// Example:
Job 1: laborTotal = 15000 cents = $150.00
Job 2: laborTotal = 8500 cents = $85.00
Total Labor Sales = $235.00
```

---

## Filters Available

### 1. Date Range
- **Start Date:** Beginning of date range
- **End Date:** End of date range (inclusive)
- **Filter By Date:** Which date field to use (Completed/Posted/Created)

### 2. Technician Filter (Multi-select)
- Filter by one or more technicians
- Shows only ROs with jobs assigned to selected technicians

### 3. RO Status Filter (Multi-select)
- Estimate
- Work-in-Progress
- Complete
- Saved for Later
- Posted
- Accounts Receivable
- Deleted

### 4. Job Filters (Checkboxes)
- **Job Completed:** Shows only ROs with completed labor items
- **Approved Services:** Shows only ROs with authorized jobs

---

## Data Flow Diagram

```
User Clicks "Generate Report"
         ↓
Fetch Page 1 (100 ROs)
         ↓
Check total pages available
         ↓
Fetch Pages 2-10 in parallel (900 more ROs)
         ↓
Total: 1,000 ROs fetched
         ↓
Filter by selected date field + date range
         ↓
Apply user filters (technician, status, etc.)
         ↓
Calculate metrics for each technician
         ↓
Display results
```

---

## Console Debugging

When you run a report, check the browser console (F12) for detailed logs:

### Fetch Debug
```
=== REPAIR ORDERS FETCH DEBUG ===
Date range: 2026-02-01 to 2026-02-06
📊 Total ROs available: 31542 across 316 pages
Fetching pages 2-10...
✅ Fetched 1000 ROs from 10 pages
```

### Date Filtering Debug
```
📅 Date fields used for filtering: {
  completedDate: 85,
  postedDate: 14,
  updatedDate: 0,
  createdDate: 0
}
✅ Filtered ROs in date range: 99
```

### Job Counting Debug
```
=== JOB COUNTING STATS ===
Total jobs processed: 278
Jobs with completed labor: 191
Jobs without technician: 55
Jobs not authorized: 77
Jobs not selected: 6
Jobs counted in report: 191
=== END STATS ===
```

---

## Common Questions

### Q: Why do I only see 99 ROs when there are 31,542 total?
**A:** The system fetches 1,000 ROs but only 99 fall within your selected date range (Feb 1-6).

### Q: Why don't my numbers match Tekmetric exactly?
**A:** Check these factors:
1. **Date field used** - Try switching between Completed/Posted/Created Date
2. **Job authorization** - We only count authorized jobs
3. **Labor items** - We only count jobs with labor items
4. **Pagination** - We fetch max 1,000 ROs; if you have more in the date range, some are excluded

### Q: Why is Clocked Time always 0.00?
**A:** The `loggedHours` field in the Tekmetric API is not populated. This may require:
- A different API endpoint for time clock data
- A premium Tekmetric feature
- Manual time tracking that isn't synced to jobs

### Q: What's the difference between "Billed Time" and "Clocked Time"?
**A:**
- **Billed Time:** Hours sold to the customer (from labor items)
- **Clocked Time:** Actual hours worked by technician (from time clock)
- **Efficiency:** How actual time compares to billed time

### Q: Why does "Unassigned" show up?
**A:** Some jobs have completed labor items but no technician assigned. These are grouped under "Unassigned".

---

## Performance Considerations

### Why Limit to 1,000 ROs?
- **API Rate Limits:** Tekmetric may throttle requests
- **Browser Performance:** Processing 31,000 ROs would freeze the UI
- **Network Time:** Fetching 316 pages would take minutes

### Recommendations
- Use narrower date ranges (1 week instead of 1 month)
- Apply filters to reduce data set
- For full historical reports, consider server-side processing

---

## API Endpoints Used

### Get Repair Orders
```
GET /api/tekmetric/repair-orders
Parameters:
  - shop: Shop ID (required)
  - size: Results per page (max 100)
  - page: Page number (0-indexed)
  
Response:
{
  content: [...], // Array of ROs
  totalElements: 31542,
  totalPages: 316,
  size: 100,
  number: 0
}
```

### Get Employees
```
GET /api/tekmetric/employees
Parameters:
  - shop: Shop ID (required)
  - size: Results per page
  
Response: Array of employee objects
```

---

## Future Enhancements

### Potential Improvements
1. **Server-side pagination** - Fetch all pages server-side
2. **Time clock integration** - Get actual clocked hours
3. **Caching** - Cache RO data to speed up filter changes
4. **Export to CSV** - Download report data
5. **Date range presets** - "This Week", "Last Month", etc.
6. **Real-time updates** - Refresh data automatically

---

## Troubleshooting

### Issue: Wrong number of ROs
**Solution:** 
1. Check which date field is being used (console logs)
2. Try different date field options (Completed/Posted/Created)
3. Verify date range is correct

### Issue: Missing technicians
**Solution:**
1. Check if employees loaded (console logs)
2. Verify shop ID is correct
3. Check if jobs have technicianId assigned

### Issue: Slow loading
**Solution:**
1. Use shorter date ranges
2. Apply filters before generating report
3. Check network tab for slow API responses

---

## Technical Details

### Key Files
- **Component:** `/client/src/components/Reports.js`
- **API Service:** `/client/src/services/api.js`
- **Backend Route:** `/server/routes/tekmetric.js`

### State Management
```javascript
repairOrders      // All ROs after date filtering
filteredData      // ROs after applying user filters
employees         // List of all employees
technicianMap     // Map of technicianId → name
selectedTechnicians // User-selected technician filter
selectedStatuses  // User-selected status filter
dateFilterField   // Which date field to use
```

### Key Functions
- `loadRepairOrders()` - Fetches ROs from API with pagination
- `applyFilters()` - Applies user-selected filters
- `calculateMetrics()` - Calculates summary metrics
- `calculateTechnicianStats()` - Calculates per-technician stats
