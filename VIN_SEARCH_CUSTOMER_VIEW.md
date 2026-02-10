# VIN Search - Customer View Documentation

## 🎯 Overview

The VIN Search feature has been enhanced with a **customer-focused view** that provides a clean, easy-to-understand interface for viewing vehicle service history. This view is perfect for customer-facing scenarios where you need to show service history in a professional, simplified format.

---

## ✨ Customer View Features

### Simplified Table View

The customer view displays only the most relevant information:

| Column | Description |
|--------|-------------|
| **RO #** | Repair Order Number |
| **Date Created** | When the service was initiated |
| **Date Completed** | When the service was finished |
| **Discounts** | Any discounts applied to the order |
| **Total Price** | Final price for the repair order |

### Expandable Service Details

- **Click any repair order** to expand and view detailed services
- **Services are displayed as cards** with clear pricing breakdown
- **Click again to collapse** the details

---

## 🎨 User Interface

### Main Table
```
┌────┬────────┬──────────────┬────────────────┬───────────┬─────────────┐
│ ▶  │ RO #   │ Date Created │ Date Completed │ Discounts │ Total Price │
├────┼────────┼──────────────┼────────────────┼───────────┼─────────────┤
│ ▶  │ #001   │ 2/1/2026     │ 2/2/2026       │ -$20.00   │ $390.00     │
│ ▶  │ #002   │ 1/15/2026    │ 1/16/2026      │ $0.00     │ $565.00     │
│ ▶  │ #003   │ 1/1/2026     │ N/A            │ $0.00     │ $260.00     │
└────┴────────┴──────────────┴────────────────┴───────────┴─────────────┘
```

### Expanded View (When Clicked)
```
┌────┬────────┬──────────────┬────────────────┬───────────┬─────────────┐
│ ▼  │ #001   │ 2/1/2026     │ 2/2/2026       │ -$20.00   │ $390.00     │
├────┴────────┴──────────────┴────────────────┴───────────┴─────────────┤
│ Services Performed (3)                                                 │
│                                                                        │
│ ┌────────────────────────────────────────────────────────────────┐   │
│ │ 1. Oil Change                                    $45.00        │   │
│ │    Labor: $25.00  │  Parts: $20.00  │  Fees: $0.00            │   │
│ └────────────────────────────────────────────────────────────────┘   │
│                                                                        │
│ ┌────────────────────────────────────────────────────────────────┐   │
│ │ 2. Brake Inspection                              $150.00       │   │
│ │    Labor: $100.00  │  Parts: $50.00  │  Fees: $0.00           │   │
│ └────────────────────────────────────────────────────────────────┘   │
│                                                                        │
│ ┌────────────────────────────────────────────────────────────────┐   │
│ │ 3. Tire Rotation                                 $195.00       │   │
│ │    Labor: $50.00  │  Parts: $0.00  │  Fees: $0.00              │   │
│ │    Discounts: -$20.00  │  ✓ Authorized                         │   │
│ └────────────────────────────────────────────────────────────────┘   │
│                                                                        │
│ Click row again to collapse                      Total: $390.00       │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 💡 How to Use

### For Service Advisors

1. **Search for Vehicle**
   - Enter the customer's VIN
   - Click "Search"

2. **Review Service History**
   - Table shows all repair orders at a glance
   - Easy to see dates and totals

3. **Show Service Details**
   - Click any repair order to expand
   - Shows detailed breakdown of services
   - Professional, easy-to-read format

4. **Discuss with Customer**
   - Clear pricing for each service
   - Shows labor, parts, and fees separately
   - Discounts are clearly visible

### For Customers

The expanded view shows:
- **Service Name** - What work was performed
- **Service Price** - Total cost for that service
- **Breakdown** - Labor, parts, fees shown separately
- **Discounts** - Any savings applied
- **Authorization Status** - Confirmed approved work

---

## 📊 Service Card Details

Each service card displays:

### Header Section
- **Service Number** (1, 2, 3...)
- **Service Name** (e.g., "Oil Change", "Brake Inspection")
- **Total Price** (bold, right-aligned)

### Note Section (if applicable)
- **Service Notes** - Any special notes about the service
- Displayed in italics, gray text

### Breakdown Section
- **Labor** - Labor charges
- **Parts** - Parts charges
- **Fees** - Additional fees
- **Discounts** - Any discounts applied (shown in red)
- **Status** - Authorization status (✓ Authorized)

---

## 🎨 Visual Design

### Color Scheme

| Element | Color | Purpose |
|---------|-------|---------|
| Expanded Row | Light Blue (#f0f9ff) | Highlight active row |
| Hover State | Light Gray (#f9fafb) | Interactive feedback |
| Service Cards | White | Clean, professional look |
| Discounts | Red (#dc2626) | Draw attention to savings |
| Authorized | Green (#10b981) | Positive confirmation |
| Labels | Gray (#6b7280) | Secondary information |

### Typography

- **Service Names**: 1rem, bold (600 weight)
- **Prices**: 1.125rem, bold
- **Labels**: 0.75rem, regular
- **Values**: 0.875rem, medium (500 weight)

### Spacing

- Card padding: 1rem
- Card gap: 1rem
- Section padding: 1.5rem
- Border radius: 8px

---

## 🔄 Interaction Flow

### Click to Expand
```
1. User clicks repair order row
   ↓
2. System checks if RO has job details
   ↓
3a. If yes → Expand immediately
   ↓
3b. If no → Fetch full RO details from API
   ↓
4. Display services in expandable section
   ↓
5. Show loading spinner while fetching (if needed)
```

### Click to Collapse
```
1. User clicks expanded repair order row
   ↓
2. System collapses the expanded section
   ↓
3. Row returns to normal state
```

---

## 📋 Data Display

### Repair Order Row

```javascript
{
  repairOrderNumber: "RO-2026-001",
  createdDate: "2026-02-01T10:00:00Z",
  completedDate: "2026-02-02T15:30:00Z",
  discountTotal: 2000,  // $20.00 in cents
  totalSales: 39000     // $390.00 in cents
}
```

### Service/Job Details

```javascript
{
  id: 12345,
  name: "Oil Change",
  note: "Used synthetic oil",
  subtotal: 4500,        // $45.00 in cents
  laborTotal: 2500,      // $25.00 in cents
  partsTotal: 2000,      // $20.00 in cents
  feeTotal: 0,
  discountTotal: 0,
  authorized: true
}
```

---

## 🎯 Customer-Friendly Features

### 1. Clear Pricing
- All prices shown in standard USD format ($X.XX)
- Breakdown shows exactly what customer paid for
- Discounts clearly visible

### 2. Service Transparency
- Each service listed separately
- Labor and parts costs shown individually
- No hidden fees

### 3. Professional Presentation
- Clean, modern design
- Easy to read and understand
- Professional service cards

### 4. Interactive Experience
- Click to see more details
- Smooth expand/collapse animation
- Visual feedback on hover

---

## 📱 Responsive Design

### Desktop View
- Full table width
- Service cards in single column
- All details visible

### Tablet View
- Table scrolls horizontally if needed
- Service cards adjust to width
- Maintains readability

### Mobile View
- Table scrolls horizontally
- Service cards stack vertically
- Touch-friendly click targets

---

## 🔍 Summary Section

The summary provides quick totals:

```
┌─────────────────────────────────────────────────────────┐
│ Summary                                                 │
│ ┌─────────────────┬──────────────────┬────────────────┐│
│ │ Total Repair    │ Total Discounts  │ Total Spent    ││
│ │ Orders: 15      │ $120.00          │ $4,000.00      ││
│ └─────────────────┴──────────────────┴────────────────┘│
│                                                         │
│ 💡 Tip: Click on any repair order to view detailed     │
│    services performed                                   │
└─────────────────────────────────────────────────────────┘
```

---

## 💼 Use Cases

### Use Case 1: Customer Service History Review
**Scenario**: Customer calls asking about past services

**Steps**:
1. Service advisor enters VIN
2. Reviews list of all repair orders
3. Clicks on specific order to see services
4. Discusses specific services with customer

**Benefit**: Quick access to detailed service history

### Use Case 2: Warranty Claim
**Scenario**: Customer has issue with recent service

**Steps**:
1. Look up vehicle by VIN
2. Find the relevant repair order by date
3. Expand to see exact services performed
4. Review labor, parts, and pricing

**Benefit**: Complete service documentation at fingertips

### Use Case 3: Customer Education
**Scenario**: Explaining past services to customer

**Steps**:
1. Pull up vehicle service history
2. Show customer the clean, professional view
3. Expand specific orders to show services
4. Explain each service and its cost

**Benefit**: Professional presentation builds trust

---

## 🎨 Visual States

### Normal State
- Row has white background
- Arrow points right (▶)
- Standard text colors

### Hover State
- Row background changes to light gray
- Cursor changes to pointer
- Visual feedback for interactivity

### Expanded State
- Row background is light blue
- Arrow points down (▼)
- Services section visible below
- Border separates from other rows

### Loading State
- Spinning icon (⟳) in arrow column
- Indicates data is being fetched
- Prevents duplicate clicks

---

## 🔧 Technical Details

### API Calls

**Initial Load**:
```javascript
getRepairOrders({
  vehicleId: vehicleId,
  shop: shopId,
  size: 20,
  page: 0
})
// Returns: Basic RO info (no jobs)
```

**On Row Click**:
```javascript
getRepairOrder(repairOrderId)
// Returns: Full RO details including jobs array
```

### State Management

```javascript
const [expandedRO, setExpandedRO] = useState(null);
// Stores the currently expanded repair order

const [loadingRO, setLoadingRO] = useState(null);
// Tracks which RO is currently loading details
```

### Optimization

- **Lazy Loading**: Job details only fetched when needed
- **Caching**: Once fetched, job details are stored in the RO object
- **No Re-fetch**: Clicking same RO again just toggles visibility

---

## 📊 Data Flow

```
User clicks RO row
    ↓
Check if RO === expandedRO
    ↓
Yes → Collapse (set expandedRO = null)
    ↓
No → Check if RO has jobs
    ↓
Yes → Expand immediately
    ↓
No → Fetch full RO details
    ↓
Update RO in list with jobs
    ↓
Set as expandedRO
    ↓
Display services
```

---

## 🎯 Key Benefits

### For Service Advisors
- ✅ Quick access to service history
- ✅ Professional customer-facing view
- ✅ Easy to explain services and pricing
- ✅ Builds customer trust

### For Customers
- ✅ Clear, understandable format
- ✅ Transparent pricing
- ✅ Easy to see what was done
- ✅ Professional presentation

### For Shop Owners
- ✅ Improved customer experience
- ✅ Better communication tool
- ✅ Professional image
- ✅ Efficient service review

---

## 🔄 Comparison: Before vs After

### Before (Internal View)
- 11 columns with technical details
- Labor, Parts, Sublets, Fees, etc.
- Amount Paid, Balance calculations
- More data than customer needs

### After (Customer View)
- 6 columns with essential info
- RO #, Dates, Discounts, Total
- Expandable service details
- Clean, focused presentation

---

## 📝 Best Practices

### When Showing to Customers

1. **Start with Overview**
   - Show the main table first
   - Point out total number of services

2. **Drill Down as Needed**
   - Click to expand specific orders
   - Focus on what customer asks about

3. **Explain Clearly**
   - Use the service names
   - Point out labor vs parts
   - Highlight any discounts

4. **Professional Presentation**
   - Keep screen clean and organized
   - Use the summary section for totals
   - Maintain professional demeanor

---

## 🎓 Training Tips

### For New Staff

1. **Practice Navigation**
   - Search for test VINs
   - Practice expanding/collapsing
   - Get comfortable with the interface

2. **Learn the Layout**
   - Understand what each column shows
   - Know where to find service details
   - Memorize the expand/collapse action

3. **Customer Communication**
   - Practice explaining services
   - Point out key information
   - Use professional language

---

## ✨ Summary

The customer view provides:
- ✅ Simplified, customer-friendly interface
- ✅ Essential information at a glance
- ✅ Expandable service details on demand
- ✅ Professional, clean presentation
- ✅ Easy to use and understand

Perfect for customer-facing scenarios where you need to show service history in a clear, professional manner.

---

**Version**: 2.0.0 (Customer View)  
**Date**: February 7, 2026  
**Component**: VinSearch.js  
**View Type**: Customer-Focused
