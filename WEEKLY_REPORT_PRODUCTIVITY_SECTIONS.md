# Weekly Report - Technician & Service Writer Productivity

## Overview

Added two new productivity sections to the Weekly Operating Report:
- **Section D**: Technician Productivity (Hours Turned)
- **Section E**: Service Writer Productivity (Hours Sold)

These sections reuse the same repair orders data already fetched, maintaining consistency with Sections A, B, and C.

---

## Section D: Technician Productivity (Hours Turned)

### Purpose
Track labor hours **completed** by technicians during the reporting week.

### Date Driver
**`postedDate`** from Repair Orders

**Why**: Technicians are credited when work is **COMPLETED and posted**, not when it was authorized. This measures actual production output.

### Data Source
- Labor lines from jobs in repair orders
- Same data already fetched for Section B (Production)

### Filters

```javascript
// 1. Repair Order must be posted in week range
ro.repairOrderStatusId IN [5, 6]  // Posted or Accounts Receivable
ro.postedDate >= weekStart && ro.postedDate <= weekEnd

// 2. Job must be authorized
job.authorized === true

// 3. Labor line must have technician assignment
laborLine.technicianId || job.technicianId
```

### Metrics Calculated

| Metric | Calculation | Source | Notes |
|--------|-------------|--------|-------|
| Hours Turned | Sum of labor hours | `laborLine.hours` | Only from posted ROs |
| ROs Touched | Distinct RO count | `ro.id` | Unique ROs worked on |
| Avg Hours/RO | Hours / ROs | Calculated | Average hours per RO |
| Labor Lines | Count of labor items | `laborLine` count | Individual tasks |

### Grouping
- **Group By**: `technicianId` (from labor line or job)
- **Sort By**: Hours turned (descending)

### Rollover Logic

**Completed Not Sold This Week**:
```javascript
// Job authorized BEFORE week start
job.authorizedDate < weekStart

// BUT RO posted IN week range
ro.postedDate >= weekStart && ro.postedDate <= weekEnd
```

**Counts toward**: Technician hours turned (Section D)
**Does NOT count toward**: Writer hours sold (Section E)

### Implementation

```javascript
const calculateTechnicianProductivityFromData = (allROs) => {
  const weekStartDate = new Date(weekStart + 'T00:00:00');
  const weekEndDate = new Date(weekEnd + 'T23:59:59');
  const validStatusIds = [5, 6];
  
  // Filter ROs posted in week
  const postedROs = allROs.filter(ro => {
    if (!validStatusIds.includes(ro.repairOrderStatusId)) return false;
    if (!ro.postedDate) return false;
    
    const postedDate = new Date(ro.postedDate);
    return postedDate >= weekStartDate && postedDate <= weekEndDate;
  });
  
  // Process labor lines
  const techMetrics = {};
  
  postedROs.forEach(ro => {
    ro.jobs?.forEach(job => {
      if (!job.authorized) return;
      
      job.labor?.forEach(laborLine => {
        const techId = laborLine.technicianId || job.technicianId;
        if (!techId) return;
        
        if (!techMetrics[techId]) {
          techMetrics[techId] = {
            hoursTurned: 0,
            rosTouched: new Set(),
            laborLinesCount: 0
          };
        }
        
        techMetrics[techId].hoursTurned += parseFloat(laborLine.hours || 0);
        techMetrics[techId].rosTouched.add(ro.id);
        techMetrics[techId].laborLinesCount++;
      });
    });
  });
  
  return techMetrics;
};
```

### Validation

**Reconciliation Check**:
```
Total Hours Turned ≤ Billable Labor Hours (Section B)
```

**Warnings**:
- Labor lines missing technician assignment
- No labor hours found in posted ROs

---

## Section E: Service Writer Productivity (Hours Sold)

### Purpose
Track labor hours **sold** by service writers during the reporting week.

### Date Driver
**`authorizedDate`** from Jobs

**Why**: Writers are credited when work is **SOLD (authorized)**, not when it's completed. This measures sales effectiveness.

### Data Source
- Labor lines from authorized jobs
- Same data already fetched for Section A (Sales)

### Filters

```javascript
// 1. Job must be authorized
job.authorized === true

// 2. Job authorized in week range
job.authorizedDate >= weekStart && job.authorizedDate <= weekEnd

// 3. Job must have writer assignment
job.serviceWriterId || job.serviceAdvisorId || job.advisorId
```

### Metrics Calculated

| Metric | Calculation | Source | Notes |
|--------|-------------|--------|-------|
| Hours Sold | Sum of labor hours | `laborLine.hours` | From authorized jobs |
| Jobs Sold | Count of jobs | `job.id` | Jobs authorized |
| Avg Hours/Job | Hours / Jobs | Calculated | Average hours per job |
| % Backlog Sold | Backlog jobs / Total | Calculated | Jobs from old ROs |

### Backlog Calculation

**Definition**: Jobs authorized this week from ROs created before the week started.

```javascript
// Job authorized IN week range
job.authorizedDate >= weekStart && job.authorizedDate <= weekEnd

// BUT RO created BEFORE week start
ro.createdDate < weekStart
```

**Interpretation**: Writer is selling work from existing (backlog) repair orders, not new customers.

### Grouping
- **Group By**: `serviceWriterId` (or `serviceAdvisorId`, `advisorId`)
- **Sort By**: Hours sold (descending)

### Rollover Logic

**Sold Not Completed**:
```javascript
// Job authorized IN week range
job.authorizedDate >= weekStart && job.authorizedDate <= weekEnd

// BUT RO not posted yet OR posted after week
ro.postedDate === null || ro.postedDate > weekEnd
```

**Counts toward**: Writer hours sold (Section E)
**Does NOT count toward**: Technician hours turned (Section D)

### Implementation

```javascript
const calculateServiceWriterProductivityFromData = (allROs) => {
  const weekStartDate = new Date(weekStart + 'T00:00:00');
  const weekEndDate = new Date(weekEnd + 'T23:59:59');
  
  const writerMetrics = {};
  
  allROs.forEach(ro => {
    ro.jobs?.forEach(job => {
      if (!job.authorized || !job.authorizedDate) return;
      
      const authorizedDate = new Date(job.authorizedDate);
      if (authorizedDate < weekStartDate || authorizedDate > weekEndDate) return;
      
      const writerId = job.serviceWriterId || job.serviceAdvisorId || job.advisorId;
      if (!writerId) return;
      
      if (!writerMetrics[writerId]) {
        writerMetrics[writerId] = {
          hoursSold: 0,
          jobsSold: 0,
          backlogJobs: 0
        };
      }
      
      writerMetrics[writerId].jobsSold++;
      
      // Check if backlog
      if (ro.createdDate) {
        const roCreatedDate = new Date(ro.createdDate);
        if (roCreatedDate < weekStartDate) {
          writerMetrics[writerId].backlogJobs++;
        }
      }
      
      // Sum labor hours
      job.labor?.forEach(laborLine => {
        writerMetrics[writerId].hoursSold += parseFloat(laborLine.hours || 0);
      });
    });
  });
  
  return writerMetrics;
};
```

### Validation

**Reconciliation Check**:
```
Total Jobs Sold ≈ Authorized Jobs Count (Section A)
```

**Warnings**:
- Authorized jobs missing service writer assignment
- No jobs found in repair orders

---

## UI Design

### Section D: Technician Productivity

**Color Theme**: Purple (`#8b5cf6`)

**Table Columns**:
1. Technician (name/ID)
2. Hours Turned
3. ROs Touched
4. Avg Hours/RO
5. Labor Lines

**Total Row**: Shows sum of all technicians

**Reconciliation**: Compares to Section B billable hours

### Section E: Service Writer Productivity

**Color Theme**: Pink (`#ec4899`)

**Table Columns**:
1. Service Writer (name/ID)
2. Hours Sold
3. Jobs Sold
4. Avg Hours/Job
5. % Backlog Sold

**Total Row**: Shows sum of all writers

**Reconciliation**: Compares to Section A authorized jobs

---

## Data Quality Warnings

### Warning Banner
Displayed at top if any issues detected:
- Labor lines missing technician assignment
- Jobs missing service writer assignment
- No data found

### Example Warning
```
⚠️ Data Quality Warnings:
• 15 labor lines missing technician assignment
• 8 authorized jobs missing service writer assignment

Note: Missing assignments may result in incomplete totals. 
Verify data in source system.
```

---

## Reconciliation Rules

### Rule 1: Technician Hours ≤ Billable Hours
```javascript
technicianData.totalHoursTurned <= productionData.billableLaborHours
```

**Why**: Technician hours are a subset of billable hours. If greater, indicates data quality issue.

### Rule 2: Writer Jobs ≈ Authorized Jobs
```javascript
serviceWriterData.totalJobsSold ≈ salesData.authorizedJobsCount
```

**Why**: Should be similar. Differences indicate missing writer assignments.

### Display
Reconciliation notes shown below each table with:
- ✅ Green check if reconciled
- ⚠️ Warning if discrepancy found
- Explanation of what to check

---

## Example Scenario

### Week 1 (Jan 8-14)

**Monday**: Customer brings car, Writer A creates RO and authorizes 5 hours of work
**Tuesday**: Tech B starts work
**Wednesday**: Tech B completes work, RO posted

**Section A (Sales)**: 
- Writer A: 5 hours sold ✅

**Section B (Production)**:
- 5 hours completed ✅

**Section D (Technician)**:
- Tech B: 5 hours turned ✅

**Section E (Writer)**:
- Writer A: 5 hours sold ✅

### Week 2 (Jan 15-21)

**Monday**: Writer A authorizes additional 3 hours on old RO (created Week 1)
**Friday**: Tech B completes the additional work, RO posted

**Section A (Sales)**:
- Writer A: 3 hours sold ✅

**Section B (Production)**:
- 3 hours completed ✅

**Section D (Technician)**:
- Tech B: 3 hours turned ✅

**Section E (Writer)**:
- Writer A: 3 hours sold ✅
- Backlog: 100% (RO created before week start)

---

## Code Structure

### New State Variables
```javascript
const [technicianData, setTechnicianData] = useState(null);
const [serviceWriterData, setServiceWriterData] = useState(null);
const [validationWarnings, setValidationWarnings] = useState([]);
```

### New Functions
```javascript
calculateTechnicianProductivityFromData(allROs)
calculateServiceWriterProductivityFromData(allROs)
```

### Updated Functions
```javascript
handleGenerateReport() // Now calls 5 calculation functions
```

### No New API Calls
- Reuses `allROs` data already fetched
- No additional network requests
- Calculations done client-side

---

## Performance Impact

### Before (3 sections)
- 1 API fetch (repair orders with pagination)
- 3 calculation functions
- ~10-20 seconds for large datasets

### After (5 sections)
- 1 API fetch (same as before)
- 5 calculation functions
- ~10-20 seconds (no significant change)

**Impact**: Minimal performance impact since no new API calls.

---

## Testing Scenarios

### Test Case 1: Normal Week
**Setup**:
- 10 ROs posted
- All jobs have tech and writer assignments
- All labor lines have hours

**Expected**:
- Section D shows all technicians
- Section E shows all writers
- No warnings
- Reconciliation passes

### Test Case 2: Missing Assignments
**Setup**:
- 5 labor lines without technician ID
- 3 jobs without writer ID

**Expected**:
- Warning banner displayed
- Totals show only assigned items
- Reconciliation shows discrepancies

### Test Case 3: Backlog Sales
**Setup**:
- Writer authorizes work on old RO (created 2 weeks ago)

**Expected**:
- Section E shows 100% backlog
- Hours counted in writer totals
- Not counted in tech totals (not completed yet)

### Test Case 4: Rollover Completion
**Setup**:
- Job authorized Week 1
- RO posted Week 2

**Expected**:
- Week 1: Writer gets credit (Section E)
- Week 2: Tech gets credit (Section D)
- Week 2: Shows in Section D rollover

---

## Troubleshooting

### Issue: No technician data showing
**Check**:
1. Are there ROs with status 5 or 6?
2. Do ROs have postedDate in week range?
3. Do labor lines have technicianId?
4. Are jobs authorized?

### Issue: No writer data showing
**Check**:
1. Are there authorized jobs?
2. Do jobs have authorizedDate in week range?
3. Do jobs have serviceWriterId/advisorId?
4. Do jobs have labor lines?

### Issue: Hours don't reconcile
**Check**:
1. Missing technician assignments?
2. Missing writer assignments?
3. Check validation warnings
4. Verify source data in Tekmetric

### Issue: Backlog percentage seems wrong
**Check**:
1. Verify RO createdDate exists
2. Check if RO was created before week start
3. Confirm job was authorized in week range

---

## API Field Reference

### Fields Used (from existing data)

**Repair Order**:
- `id` - For grouping
- `repairOrderStatusId` - For filtering
- `postedDate` - For Section D filtering
- `createdDate` - For backlog calculation
- `jobs[]` - Array of jobs

**Job**:
- `authorized` - Must be true
- `authorizedDate` - For Section E filtering
- `technicianId` - For tech assignment
- `serviceWriterId` - For writer assignment
- `serviceAdvisorId` - Fallback for writer
- `advisorId` - Fallback for writer
- `labor[]` - Array of labor lines

**Labor Line**:
- `hours` - Hours value (decimal)
- `technicianId` - Tech assignment on labor line

---

## Summary

### What Was Added
✅ Section D: Technician Productivity (Hours Turned)
✅ Section E: Service Writer Productivity (Hours Sold)
✅ Validation warnings for missing assignments
✅ Reconciliation checks against Sections A & B
✅ Backlog percentage calculation
✅ Comprehensive tooltips
✅ Total rows with aggregates

### Key Principles Maintained
✅ No new API calls (reuses existing data)
✅ Date logic separation (postedDate vs authorizedDate)
✅ Explicit rollover logic
✅ Client-side calculations
✅ Comprehensive inline comments
✅ Validation and reconciliation

### Production Ready
✅ No linter errors
✅ Handles missing data gracefully
✅ Shows warnings for data quality issues
✅ Reconciles with existing sections
✅ Fully documented

---

## Quick Reference

### Technician Section (D)
- **Date**: postedDate
- **Measures**: Hours completed
- **Credit**: When work finished

### Writer Section (E)
- **Date**: authorizedDate
- **Measures**: Hours sold
- **Credit**: When work authorized

### Remember
**Technicians** = Production (when completed)
**Writers** = Sales (when sold)

These are different events that can happen at different times!
