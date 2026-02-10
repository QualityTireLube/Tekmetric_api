# Weekly Report - Data Flow Diagram

## Overview Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    WEEKLY REPORT COMPONENT                   │
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │           GLOBAL CONTROLS                          │    │
│  │  Shop ID: [____]  Week: [Mon] to [Sun]  [Go]     │    │
│  └────────────────────────────────────────────────────┘    │
│                          │                                   │
│                          ▼                                   │
│              handleGenerateReport()                         │
│                          │                                   │
│         ┌────────────────┼────────────────┐               │
│         │                │                │               │
│         ▼                ▼                ▼               │
│   Section A        Section B        Section C             │
│   (Sales)          (Production)     (Cash)                │
└─────────────────────────────────────────────────────────────┘
```

## Section A: Sales & Work Sold

```
┌──────────────────────────────────────────────────────────────┐
│  SECTION A: SALES & WORK SOLD                                │
│  Date Driver: authorizedDate                                 │
└──────────────────────────────────────────────────────────────┘
                          │
                          ▼
        ┌─────────────────────────────────┐
        │  calculateSalesMetrics()        │
        └─────────────────────────────────┘
                          │
                          ▼
        ┌─────────────────────────────────┐
        │  fetchAllPages(getRepairOrders) │
        │  + shop parameter               │
        └─────────────────────────────────┘
                          │
                          ▼
        ┌─────────────────────────────────┐
        │  Tekmetric API                  │
        │  GET /api/v1/repair-orders      │
        │  ?shop={id}&page={n}&size=100   │
        └─────────────────────────────────┘
                          │
                          ▼
        ┌─────────────────────────────────┐
        │  Pagination Loop                │
        │  Fetch pages 0,1,2... until end │
        └─────────────────────────────────┘
                          │
                          ▼
        ┌─────────────────────────────────┐
        │  All Repair Orders (with jobs)  │
        └─────────────────────────────────┘
                          │
                          ▼
        ┌─────────────────────────────────┐
        │  FILTER REPAIR ORDERS           │
        │  repairOrderStatusId IN [2,3,5,6]│
        └─────────────────────────────────┘
                          │
                          ▼
        ┌─────────────────────────────────┐
        │  LOOP THROUGH JOBS              │
        │  For each RO.jobs[]             │
        └─────────────────────────────────┘
                          │
                          ▼
        ┌─────────────────────────────────┐
        │  FILTER JOBS                    │
        │  • authorized = true            │
        │  • authorizedDate in week range │
        └─────────────────────────────────┘
                          │
                ┌─────────┴─────────┐
                │                   │
                ▼                   ▼
    ┌───────────────────┐  ┌──────────────────┐
    │ CURRENT WEEK JOBS │  │ ROLLOVER JOBS    │
    │ authorizedDate    │  │ authorizedDate   │
    │ in week range     │  │ < week start     │
    │                   │  │ AND              │
    │                   │  │ RO.createdDate   │
    │                   │  │ < week start     │
    └───────────────────┘  └──────────────────┘
                │                   │
                ▼                   ▼
    ┌───────────────────┐  ┌──────────────────┐
    │ CALCULATE METRICS │  │ ROLLOVER METRICS │
    │ • Count jobs      │  │ • Count jobs     │
    │ • Sum laborTotal  │  │ • Sum subtotal   │
    │ • Sum partsTotal  │  │                  │
    │ • Sum subletTotal │  │                  │
    │ • Sum feeTotal    │  │                  │
    │ • Sum discountTotal│ │                  │
    │ • Sum subtotal    │  │                  │
    │ (all / 100)       │  │ (all / 100)      │
    └───────────────────┘  └──────────────────┘
                │                   │
                └─────────┬─────────┘
                          ▼
                ┌─────────────────┐
                │ setSalesData()  │
                │ Update UI       │
                └─────────────────┘
```

## Section B: Production & Completion

```
┌──────────────────────────────────────────────────────────────┐
│  SECTION B: PRODUCTION & COMPLETION                          │
│  Date Driver: postedDate                                     │
└──────────────────────────────────────────────────────────────┘
                          │
                          ▼
        ┌─────────────────────────────────┐
        │  calculateProductionMetrics()   │
        └─────────────────────────────────┘
                          │
                          ▼
        ┌─────────────────────────────────┐
        │  fetchAllPages(getRepairOrders) │
        │  + shop parameter               │
        └─────────────────────────────────┘
                          │
                          ▼
        ┌─────────────────────────────────┐
        │  Tekmetric API                  │
        │  GET /api/v1/repair-orders      │
        │  ?shop={id}&page={n}&size=100   │
        └─────────────────────────────────┘
                          │
                          ▼
        ┌─────────────────────────────────┐
        │  All Repair Orders              │
        └─────────────────────────────────┘
                          │
                          ▼
        ┌─────────────────────────────────┐
        │  FILTER REPAIR ORDERS           │
        │  • repairOrderStatusId IN [5,6] │
        │  • postedDate in week range     │
        └─────────────────────────────────┘
                          │
                          ▼
        ┌─────────────────────────────────┐
        │  COMPLETED REPAIR ORDERS        │
        └─────────────────────────────────┘
                          │
                          ▼
        ┌─────────────────────────────────┐
        │  CALCULATE METRICS              │
        │  • Count ROs                    │
        │  • Count jobs (RO.jobs.length)  │
        │  • Track unique vehicleIds      │
        │  • Sum billable hours           │
        │  • Sum totalSales / 100         │
        └─────────────────────────────────┘
                          │
                          ▼
        ┌─────────────────────────────────┐
        │  BILLABLE HOURS DETAIL          │
        │  For each job.labor[]           │
        │  If laborItem.complete = true   │
        │  Sum laborItem.hours            │
        └─────────────────────────────────┘
                          │
                          ▼
        ┌─────────────────────────────────┐
        │  ROLLOVER CALCULATION           │
        │  For each job in completed ROs  │
        │  If job.authorizedDate          │
        │     < week start                │
        │  Count and sum                  │
        └─────────────────────────────────┘
                          │
                          ▼
                ┌─────────────────┐
                │setProductionData│
                │ Update UI       │
                └─────────────────┘
```

## Section C: Cash & Accounting

```
┌──────────────────────────────────────────────────────────────┐
│  SECTION C: CASH & ACCOUNTING                                │
│  Date Driver: updatedDate                                    │
└──────────────────────────────────────────────────────────────┘
                          │
                          ▼
        ┌─────────────────────────────────┐
        │  calculateCashMetrics()         │
        └─────────────────────────────────┘
                          │
                          ▼
        ┌─────────────────────────────────┐
        │  fetchAllPages(getRepairOrders) │
        │  + shop parameter               │
        └─────────────────────────────────┘
                          │
                          ▼
        ┌─────────────────────────────────┐
        │  Tekmetric API                  │
        │  GET /api/v1/repair-orders      │
        │  ?shop={id}&page={n}&size=100   │
        └─────────────────────────────────┘
                          │
                          ▼
        ┌─────────────────────────────────┐
        │  All Repair Orders              │
        └─────────────────────────────────┘
                          │
                          ▼
        ┌─────────────────────────────────┐
        │  FILTER REPAIR ORDERS           │
        │  • updatedDate in week range    │
        │  • amountPaid > 0               │
        └─────────────────────────────────┘
                          │
                          ▼
        ┌─────────────────────────────────┐
        │  PAID REPAIR ORDERS             │
        └─────────────────────────────────┘
                          │
                          ▼
        ┌─────────────────────────────────┐
        │  CALCULATE METRICS              │
        │  • Sum amountPaid / 100         │
        │  • Count ROs                    │
        │  • Calculate average            │
        │    (total / count)              │
        └─────────────────────────────────┘
                          │
                          ▼
                ┌─────────────────┐
                │  setCashData()  │
                │  Update UI      │
                └─────────────────┘
```

## Pagination Flow

```
┌─────────────────────────────────────────────────────────┐
│  fetchAllPages(fetchFunction, params)                   │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
        ┌─────────────────────────────────┐
        │  Initialize                     │
        │  allData = []                   │
        │  page = 0                       │
        │  hasMore = true                 │
        └─────────────────────────────────┘
                          │
                          ▼
        ┌─────────────────────────────────┐
        │  LOOP: while (hasMore)          │
        └─────────────────────────────────┘
                          │
                          ▼
        ┌─────────────────────────────────┐
        │  Call API                       │
        │  fetchFunction({                │
        │    ...params,                   │
        │    page: page,                  │
        │    size: 100                    │
        │  })                             │
        └─────────────────────────────────┘
                          │
                          ▼
        ┌─────────────────────────────────┐
        │  Check Response Type            │
        └─────────────────────────────────┘
                          │
                ┌─────────┴─────────┐
                │                   │
                ▼                   ▼
    ┌───────────────────┐  ┌──────────────────┐
    │ PAGINATED         │  │ NON-PAGINATED    │
    │ data.content[]    │  │ data[]           │
    │ data.totalPages   │  │                  │
    └───────────────────┘  └──────────────────┘
                │                   │
                ▼                   ▼
    ┌───────────────────┐  ┌──────────────────┐
    │ Add to allData    │  │ allData = data   │
    │ page++            │  │ hasMore = false  │
    │ Check if more     │  │                  │
    └───────────────────┘  └──────────────────┘
                │                   │
                └─────────┬─────────┘
                          ▼
                ┌─────────────────┐
                │ Return allData  │
                └─────────────────┘
```

## Data Transformation Flow

```
┌──────────────────────────────────────────────────────────┐
│  API RESPONSE (Repair Orders)                            │
│  {                                                        │
│    content: [                                            │
│      {                                                   │
│        id: 123,                                          │
│        repairOrderStatusId: 5,                           │
│        postedDate: "2024-01-15T10:30:00Z",              │
│        totalSales: 125000,  // cents                     │
│        jobs: [                                           │
│          {                                               │
│            authorized: true,                             │
│            authorizedDate: "2024-01-10T14:00:00Z",      │
│            laborTotal: 50000,  // cents                  │
│            subtotal: 125000    // cents                  │
│          }                                               │
│        ]                                                 │
│      }                                                   │
│    ]                                                     │
│  }                                                       │
└──────────────────────────────────────────────────────────┘
                          │
                          ▼
        ┌─────────────────────────────────┐
        │  EXTRACT & FILTER               │
        │  • Check status IDs             │
        │  • Check date ranges            │
        │  • Check authorization          │
        └─────────────────────────────────┘
                          │
                          ▼
        ┌─────────────────────────────────┐
        │  CURRENCY CONVERSION            │
        │  cents / 100 = dollars          │
        │  125000 → $1,250.00             │
        └─────────────────────────────────┘
                          │
                          ▼
        ┌─────────────────────────────────┐
        │  AGGREGATION                    │
        │  Sum, Count, Average            │
        └─────────────────────────────────┘
                          │
                          ▼
        ┌─────────────────────────────────┐
        │  FORMAT FOR DISPLAY             │
        │  • Currency: $1,234.56          │
        │  • Numbers: 1,234               │
        │  • Decimals: 123.45             │
        └─────────────────────────────────┘
                          │
                          ▼
┌──────────────────────────────────────────────────────────┐
│  UI DISPLAY                                              │
│  ┌────────────────────────────────────────────────┐    │
│  │  Total Sales: $1,250.00                        │    │
│  │  Jobs: 1                                       │    │
│  │  Labor: $500.00                                │    │
│  └────────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────┘
```

## Date Logic Comparison

```
┌──────────────────────────────────────────────────────────────┐
│  SAME REPAIR ORDER - THREE DIFFERENT VIEWS                   │
└──────────────────────────────────────────────────────────────┘

Repair Order #12345:
├─ createdDate: 2024-01-08 (Monday, Week 1)
├─ authorizedDate: 2024-01-10 (Wednesday, Week 1)
├─ postedDate: 2024-01-17 (Wednesday, Week 2)
└─ updatedDate: 2024-01-22 (Monday, Week 3)

┌─────────────────────────────────────────────────────────┐
│  WEEK 1 REPORT (Jan 8-14)                               │
├─────────────────────────────────────────────────────────┤
│  Section A (Sales):                                     │
│  ✅ Shows in Sales (authorizedDate = Jan 10)           │
│                                                         │
│  Section B (Production):                               │
│  ❌ Not in Production (postedDate = Jan 17, Week 2)    │
│                                                         │
│  Section C (Cash):                                     │
│  ❌ Not in Cash (updatedDate = Jan 22, Week 3)        │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  WEEK 2 REPORT (Jan 15-21)                              │
├─────────────────────────────────────────────────────────┤
│  Section A (Sales):                                     │
│  ❌ Not in Sales (authorizedDate = Jan 10, Week 1)     │
│                                                         │
│  Section B (Production):                               │
│  ✅ Shows in Production (postedDate = Jan 17)          │
│  ✅ Shows in Rollover (authorizedDate < week start)    │
│                                                         │
│  Section C (Cash):                                     │
│  ❌ Not in Cash (updatedDate = Jan 22, Week 3)        │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  WEEK 3 REPORT (Jan 22-28)                              │
├─────────────────────────────────────────────────────────┤
│  Section A (Sales):                                     │
│  ❌ Not in Sales (authorizedDate = Jan 10, Week 1)     │
│                                                         │
│  Section B (Production):                               │
│  ❌ Not in Production (postedDate = Jan 17, Week 2)    │
│                                                         │
│  Section C (Cash):                                     │
│  ✅ Shows in Cash (updatedDate = Jan 22)               │
└─────────────────────────────────────────────────────────┘
```

## Error Handling Flow

```
┌─────────────────────────────────────────────────────────┐
│  User Clicks "Generate Report"                          │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
        ┌─────────────────────────────────┐
        │  Validate Inputs                │
        │  • Shop ID present?             │
        │  • Week dates valid?            │
        └─────────────────────────────────┘
                          │
                ┌─────────┴─────────┐
                │                   │
                ▼                   ▼
        ┌───────────┐       ┌──────────────┐
        │  VALID    │       │  INVALID     │
        │  Continue │       │  Show alert  │
        └───────────┘       └──────────────┘
                │
                ▼
        ┌─────────────────────────────────┐
        │  Set Loading States             │
        │  loadingSales = true            │
        │  loadingProduction = true       │
        │  loadingCash = true             │
        └─────────────────────────────────┘
                          │
                          ▼
        ┌─────────────────────────────────┐
        │  Call API (each section)        │
        │  try { ... } catch { ... }      │
        └─────────────────────────────────┘
                          │
                ┌─────────┴─────────┐
                │                   │
                ▼                   ▼
        ┌───────────┐       ┌──────────────┐
        │  SUCCESS  │       │  ERROR       │
        │  Set data │       │  Set error   │
        │  state    │       │  state       │
        └───────────┘       └──────────────┘
                │                   │
                ▼                   ▼
        ┌───────────┐       ┌──────────────┐
        │  Display  │       │  Display     │
        │  metrics  │       │  error msg   │
        └───────────┘       └──────────────┘
                │                   │
                └─────────┬─────────┘
                          ▼
        ┌─────────────────────────────────┐
        │  Set Loading States             │
        │  loadingSales = false           │
        │  loadingProduction = false      │
        │  loadingCash = false            │
        └─────────────────────────────────┘
```

## State Management Flow

```
┌──────────────────────────────────────────────────────────┐
│  COMPONENT STATE                                         │
├──────────────────────────────────────────────────────────┤
│  Global Controls:                                        │
│  ├─ selectedShop: string                                 │
│  ├─ weekStart: string (YYYY-MM-DD)                       │
│  └─ weekEnd: string (YYYY-MM-DD)                         │
│                                                          │
│  Loading States:                                         │
│  ├─ loadingSales: boolean                                │
│  ├─ loadingProduction: boolean                           │
│  └─ loadingCash: boolean                                 │
│                                                          │
│  Error States:                                           │
│  ├─ errorSales: string | null                            │
│  ├─ errorProduction: string | null                       │
│  └─ errorCash: string | null                             │
│                                                          │
│  Data States:                                            │
│  ├─ salesData: object | null                             │
│  ├─ productionData: object | null                        │
│  └─ cashData: object | null                              │
└──────────────────────────────────────────────────────────┘
                          │
                          ▼
        ┌─────────────────────────────────┐
        │  USER ACTIONS                   │
        │  • Change shop                  │
        │  • Change dates                 │
        │  • Click generate               │
        └─────────────────────────────────┘
                          │
                          ▼
        ┌─────────────────────────────────┐
        │  STATE UPDATES                  │
        │  • setSelectedShop()            │
        │  • setWeekStart()               │
        │  • setWeekEnd()                 │
        │  • handleGenerateReport()       │
        └─────────────────────────────────┘
                          │
                          ▼
        ┌─────────────────────────────────┐
        │  CALCULATIONS                   │
        │  • calculateSalesMetrics()      │
        │  • calculateProductionMetrics() │
        │  • calculateCashMetrics()       │
        └─────────────────────────────────┘
                          │
                          ▼
        ┌─────────────────────────────────┐
        │  UPDATE DATA STATES             │
        │  • setSalesData()               │
        │  • setProductionData()          │
        │  • setCashData()                │
        └─────────────────────────────────┘
                          │
                          ▼
        ┌─────────────────────────────────┐
        │  REACT RE-RENDERS               │
        │  Display updated metrics        │
        └─────────────────────────────────┘
```

## Summary

The Weekly Report component follows a clear, predictable data flow:

1. **User Input** → Global controls (shop, dates)
2. **Trigger** → Generate Report button
3. **Parallel Fetch** → Three independent API calls
4. **Pagination** → Automatic fetching of all pages
5. **Filter** → Section-specific date and status filters
6. **Calculate** → Sum, count, average metrics
7. **Transform** → Convert cents to dollars
8. **Display** → Format and show in UI

Each section operates independently with:
- Its own date field
- Its own filters
- Its own loading state
- Its own error handling
- Its own data state

This ensures **drift-proof** reporting where date logic is never mixed.
