# VIN Search - Grouped Declined Services (v2.4.0)

## 🎯 Overview

Declined services are now **grouped by repair order**, making it easier to see which services were declined during each visit.

---

## ✨ New Layout: Grouped by Repair Order

### Structure

```
Work Performed
  └─ Repair Orders (expandable)
      └─ Services performed

Declined Services
  └─ Repair Orders (grouped)
      └─ Services declined
```

---

## 📊 Visual Example

### Complete View

```
┌─────────────────────────────────────────────────────────────┐
│ Work Performed                                              │
│ ┌──┬────────┬──────────────┬────────────────┬───────┬─────┐│
│ │▶ │ #2001  │ 2/1/2026     │ 2/2/2026       │ $0.00 │$410 ││
│ │▶ │ #1985  │ 1/15/2026    │ 1/16/2026      │ $0.00 │$565 ││
│ └──┴────────┴──────────────┴────────────────┴───────┴─────┘│
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ Declined Services (3 total)                                 │
│ These services were recommended but not performed at the    │
│ time.                                                        │
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐│
│ │ Repair Order #2001                                      ││
│ │ 2/1/2026 • 2 declined services                          ││
│ │ ─────────────────────────────────────────────────────── ││
│ │                                                          ││
│ │ ┌─────────────────────────────────────────────────────┐ ││
│ │ │ 1. Brake Pad Replacement  ✗ Declined      $450.00  │ ││
│ │ │ Note: Front brake pads at 30% life                  │ ││
│ │ └─────────────────────────────────────────────────────┘ ││
│ │                                                          ││
│ │ ┌─────────────────────────────────────────────────────┐ ││
│ │ │ 2. Air Filter Replacement ✗ Declined       $35.00  │ ││
│ │ └─────────────────────────────────────────────────────┘ ││
│ │                                                          ││
│ │ RO Total: $485.00                                       ││
│ └─────────────────────────────────────────────────────────┘│
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐│
│ │ Repair Order #1985                                      ││
│ │ 1/15/2026 • 1 declined service                          ││
│ │ ─────────────────────────────────────────────────────── ││
│ │                                                          ││
│ │ ┌─────────────────────────────────────────────────────┐ ││
│ │ │ 1. Transmission Flush     ✗ Declined      $250.00  │ ││
│ │ │ Note: Fluid is dark, recommend service              │ ││
│ │ └─────────────────────────────────────────────────────┘ ││
│ │                                                          ││
│ │ RO Total: $250.00                                       ││
│ └─────────────────────────────────────────────────────────┘│
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐│
│ │ Total Declined Services: 3 services                     ││
│ │ Potential Value: $735.00                                ││
│ └─────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
```

---

## 🎨 Design Details

### Repair Order Card (Red Theme)

```
┌─────────────────────────────────────────────────────────┐
│ Repair Order #[Number]                                  │
│ [Date] • [X] declined service(s)                        │
│ ─────────────────────────────────────────────────────── │
│                                                         │
│ [Service Cards]                                         │
│                                                         │
│ RO Total: $XXX.XX                                       │
└─────────────────────────────────────────────────────────┘
```

### Color Scheme

| Element | Color | Purpose |
|---------|-------|---------|
| RO Card Background | Light Red (#fef2f2) | Group container |
| RO Card Border | Red (#fecaca, 2px) | Strong emphasis |
| Service Card Background | White | Individual services |
| Service Card Border | Red (#fecaca, 1px) | Subtle separation |
| Text | Dark Red (#991b1b) | Declined emphasis |
| Summary Border | Dark Red (#dc2626, 2px) | Final total |

---

## 💡 Benefits of Grouping

### Better Context
- ✅ See which visit each declined service came from
- ✅ Understand the timeline of recommendations
- ✅ Track patterns across visits

### Easier Communication
- ✅ "During your February visit, we recommended..."
- ✅ "You've declined this service twice now..."
- ✅ Clear visit-by-visit breakdown

### Business Intelligence
- ✅ See which ROs have most declined services
- ✅ Track value per visit
- ✅ Identify follow-up priorities

---

## 🔍 Information Hierarchy

### Level 1: Repair Order
- **RO Number** - Which visit
- **Date** - When recommended
- **Count** - How many services declined

### Level 2: Services
- **Service Name** - What was recommended
- **Status** - ✗ Declined
- **Price** - Estimated cost
- **Notes** - Technician recommendations

### Level 3: Totals
- **RO Total** - Value per visit
- **Overall Total** - All declined services

---

## 📋 Sorting

### Repair Orders
- **Sorted by Date** - Newest first
- Shows most recent declined services at top
- Easier to find recent recommendations

### Services within RO
- **Sequential numbering** - 1, 2, 3...
- Order as they appear in the repair order
- Consistent with completed services view

---

## 💬 Customer Conversation Examples

### Example 1: Multiple Declined Services from One Visit

**Service Advisor**: "Looking at your February 1st visit, we recommended two services that you deferred:

1. Brake pad replacement at $450
2. Air filter replacement at $35

The brake pads are the priority for safety. Would you like to address those today?"

### Example 2: Recurring Declined Service

**Service Advisor**: "I notice you've declined the transmission flush on two visits now - once in January and again in February. The fluid was dark both times. We really recommend getting this done soon to avoid transmission damage."

### Example 3: Follow-Up Opportunity

**Service Advisor**: "From your last visit on February 1st, you deferred $485 in services. The brake pads are the most important. Can we at least take care of those today?"

---

## 🎯 Use Cases

### Use Case 1: Visit-Specific Follow-Up
**Scenario**: Customer returns after 3 months

**Service Advisor**:
1. Reviews declined services by RO
2. Focuses on most recent visit
3. "Last time you were here in February..."

**Benefit**: Context-specific recommendations

### Use Case 2: Pattern Recognition
**Scenario**: Customer has declined same service multiple times

**Service Advisor**:
1. Sees service declined in multiple ROs
2. "I notice this has been recommended 3 times now..."
3. Emphasizes importance

**Benefit**: Stronger case for service

### Use Case 3: Budget Planning
**Scenario**: Customer wants to prioritize services

**Service Advisor**:
1. Shows declined services by visit
2. "From your February visit: $485"
3. "From your January visit: $250"
4. "Total deferred: $735"

**Benefit**: Clear financial picture

---

## 🔧 Technical Implementation

### Grouping Logic

```javascript
// Group declined jobs by repair order
const groupedByRO = declinedJobs.reduce((acc, job) => {
  const roId = job.repairOrderId;
  if (!acc[roId]) {
    acc[roId] = {
      repairOrderNumber: job.repairOrderNumber,
      repairOrderId: job.repairOrderId,
      createdDate: job.createdDate,
      jobs: []
    };
  }
  acc[roId].jobs.push(job);
  return acc;
}, {});

// Sort by date (newest first)
const sortedROs = Object.values(groupedByRO).sort((a, b) => 
  new Date(b.createdDate) - new Date(a.createdDate)
);
```

### Data Structure

```javascript
{
  repairOrderNumber: "2001",
  repairOrderId: 5678,
  createdDate: "2026-02-01T...",
  jobs: [
    {
      id: 12345,
      name: "Brake Pad Replacement",
      subtotal: 45000,
      note: "Front pads at 30%",
      selected: false
    },
    // ... more jobs
  ]
}
```

---

## 📊 Comparison: Before vs After

### Before (v2.3.0) - Flat List
```
Declined Services
├─ 1. Brake Pad Replacement (from RO #2001)
├─ 2. Air Filter Replacement (from RO #2001)
└─ 3. Transmission Flush (from RO #1985)
```

### After (v2.4.0) - Grouped by RO
```
Declined Services
├─ Repair Order #2001
│  ├─ 1. Brake Pad Replacement
│  └─ 2. Air Filter Replacement
└─ Repair Order #1985
   └─ 1. Transmission Flush
```

---

## 🎨 Visual Hierarchy

### Primary (Most Prominent)
1. **Repair Order Number** - Bold, dark red
2. **Service Names** - Bold, dark red
3. **Prices** - Bold, larger font

### Secondary (Supporting)
4. **RO Date & Count** - Gray text
5. **Service Notes** - Italic, gray
6. **Status Badges** - Red text

### Tertiary (Context)
7. **RO Totals** - Right-aligned
8. **Overall Summary** - Bottom card

---

## 📱 Responsive Behavior

### Desktop
- Full width RO cards
- All information visible
- Comfortable spacing

### Tablet
- RO cards adjust to width
- May wrap some content
- Maintains hierarchy

### Mobile
- RO cards stack vertically
- Status/price may wrap
- Still clearly grouped

---

## 🎓 Training Tips

### For Service Advisors

1. **Review by Visit**
   - Start with most recent RO
   - Work backwards if needed
   - Focus on high-value items

2. **Use Visit Context**
   - "During your last visit..."
   - "When you were here in February..."
   - "At your January service..."

3. **Show Patterns**
   - "This was recommended twice..."
   - "You've deferred this for 6 months..."
   - "This is the third time..."

4. **Prioritize by RO**
   - Most recent = highest priority
   - Older = less urgent
   - But track recurring items

---

## 📈 Metrics to Track

### By Repair Order
- Average declined value per RO
- Number of declined services per RO
- Conversion rate by RO age

### Overall
- Total declined value
- Most commonly declined services
- Follow-up success rate

---

## ✨ Summary

**Version 2.4.0** groups declined services by repair order:
- ✅ **Better Organization** - Clear visit-by-visit breakdown
- ✅ **Improved Context** - See when services were recommended
- ✅ **Easier Communication** - Reference specific visits
- ✅ **RO Totals** - Value per visit clearly shown
- ✅ **Overall Total** - Complete picture maintained

**Perfect for tracking deferred maintenance and follow-up opportunities!**

---

## 🎊 Benefits Summary

### For Service Advisors
- ✅ Clear visit context
- ✅ Better conversation flow
- ✅ Pattern recognition
- ✅ Prioritization help

### For Customers
- ✅ Understand timeline
- ✅ See visit history
- ✅ Make informed decisions
- ✅ Budget planning

### For Shop Owners
- ✅ Track by visit
- ✅ Measure conversion
- ✅ Identify trends
- ✅ Optimize follow-up

---

**Version**: 2.4.0  
**Date**: February 7, 2026  
**Feature**: Grouped Declined Services  
**Status**: ✅ Complete  
**Organization**: By Repair Order
