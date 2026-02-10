# Weekly Report - Quick Reference Guide

## 🎯 Purpose
Track weekly operations with **drift-proof** reporting: Sales ≠ Production ≠ Cash

## 📍 Location
- **URL**: `/weekly-report`
- **File**: `/client/src/components/WeeklyReport.js`
- **Navigation**: Main menu → "Weekly Report"

## 🚀 Quick Start

### 1. Access Report
```
http://localhost:3000/weekly-report
```

### 2. Set Parameters
- **Shop ID**: Auto-loads from localStorage
- **Week Start**: Monday (defaults to current week)
- **Week End**: Sunday (defaults to current week)

### 3. Generate
Click **"Generate Report"** button

## 📊 Three Sections

### Section A: Sales (Authorized) 🔵
**Date Field**: `authorizedDate`
**Shows**: Work that was **sold** this week

| Metric | What It Means |
|--------|---------------|
| Authorized Jobs | Jobs approved by customer |
| Sold Labor | Labor sold (no tax) |
| Sold Parts | Parts sold (no tax) |
| Sold Sublet | Sublet work sold |
| Fees | Additional fees |
| Discounts | Discounts applied |
| Total Sold | Total sales (no tax) |
| Rollover Sold | Work sold in previous periods |

### Section B: Production (Completed) 🟢
**Date Field**: `postedDate`
**Shows**: Work that was **completed** this week

| Metric | What It Means |
|--------|---------------|
| ROs Completed | Repair orders posted |
| Jobs Completed | Jobs finished |
| Unique Vehicles | Different cars serviced |
| Billable Hours | Hours billed to customers |
| Total Completed | Total production value |
| Rollover Completed | Work sold earlier, completed now |

### Section C: Cash (Collected) 🟡
**Date Field**: `updatedDate`
**Shows**: Cash that was **received** this week

| Metric | What It Means |
|--------|---------------|
| Cash Collected | Total payments received |
| RO Count | Orders with payments |
| Avg per RO | Average payment amount |

## 🎨 Visual Guide

```
┌─────────────────────────────────────────┐
│  GLOBAL CONTROLS                        │
│  [Shop ID] [Week Start] [Week End] [Go]│
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│  📘 SECTION A: SALES (AUTHORIZED)       │
│  Date: authorizedDate                   │
│  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐      │
│  │Jobs │ │Labor│ │Parts│ │Total│      │
│  └─────┘ └─────┘ └─────┘ └─────┘      │
│  Rollover Sold: 5 jobs, $1,234.56      │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│  📗 SECTION B: PRODUCTION (COMPLETED)   │
│  Date: postedDate                       │
│  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐      │
│  │ ROs │ │Jobs │ │Veh. │ │Hours│      │
│  └─────┘ └─────┘ └─────┘ └─────┘      │
│  Rollover Completed: 3 jobs, $890.12   │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│  📙 SECTION C: CASH (COLLECTED)         │
│  Date: updatedDate                      │
│  ┌─────┐ ┌─────┐ ┌─────┐              │
│  │Cash │ │Count│ │ Avg │              │
│  └─────┘ └─────┘ └─────┘              │
└─────────────────────────────────────────┘
```

## 🔍 Understanding the Data

### Why Three Different Numbers?

**Example Scenario**:
```
Week 1: Customer approves $1,000 repair (SALES)
Week 2: Shop completes the repair (PRODUCTION)
Week 3: Customer pays $1,000 (CASH)
```

**Report Shows**:
- Week 1 Sales: $1,000
- Week 1 Production: $0
- Week 1 Cash: $0

- Week 2 Sales: $0
- Week 2 Production: $1,000 (+ Rollover)
- Week 2 Cash: $0

- Week 3 Sales: $0
- Week 3 Production: $0
- Week 3 Cash: $1,000

### Rollover Explained

**Sales Rollover**:
- Work authorized in previous period
- RO created in previous period
- Shows old work still in system

**Production Rollover**:
- Work authorized in previous period
- Completed in current period
- Shows lag between sale and completion

## 📋 Status Codes Reference

### Section A (Sales) - Valid RO Statuses
- `2` = Work-in-Progress
- `3` = Complete
- `5` = Posted
- `6` = Accounts Receivable

### Section B (Production) - Valid RO Statuses
- `5` = Posted
- `6` = Accounts Receivable

### Section C (Cash) - No Status Filter
- Any status with `amountPaid > 0`

## 💡 Tooltips

Hover over **ℹ️** icons to see:
- Which API field is used
- What date logic applies
- What filters are active
- How the metric is calculated

## ⚠️ Critical Rules

### 1. Date Fields Are NEVER Mixed
```
❌ WRONG: Use authorizedDate for production
✅ RIGHT: Use postedDate for production
```

### 2. Tax Is NEVER Included
```
❌ WRONG: Use total (includes tax)
✅ RIGHT: Use subtotal (no tax)
```

### 3. Currency Is Always Converted
```
❌ WRONG: Display 123456 (cents)
✅ RIGHT: Display $1,234.56 (dollars)
```

### 4. Sales ≠ Production ≠ Cash
```
These are THREE DIFFERENT business events
that can happen in different time periods
```

## 🔧 Troubleshooting

### Problem: No Data Showing
**Check**:
1. ✅ Shop ID is correct
2. ✅ Week range is valid (Mon-Sun)
3. ✅ API is connected (Settings page)
4. ✅ Browser console for errors

### Problem: Numbers Look Wrong
**Check**:
1. ✅ Correct date field for each section
2. ✅ Status filters match requirements
3. ✅ No tax included
4. ✅ Currency converted from cents

### Problem: Slow Loading
**Reason**: Fetching all pages of data
**Solution**: Normal for large datasets

## 📱 Using the Report

### Daily Check
```
Monday morning:
1. Open Weekly Report
2. Verify current week is selected
3. Click "Generate Report"
4. Review all three sections
```

### Week-End Review
```
Sunday evening:
1. Generate report for completed week
2. Compare Sales vs Production vs Cash
3. Review rollover metrics
4. Plan for next week
```

### Month-End Analysis
```
Generate reports for each week:
- Week 1 (Mon 1 - Sun 7)
- Week 2 (Mon 8 - Sun 14)
- Week 3 (Mon 15 - Sun 21)
- Week 4 (Mon 22 - Sun 28/30/31)
```

## 🎓 Key Concepts

### Authorized vs Completed
- **Authorized**: Customer said "yes, do the work"
- **Completed**: Shop finished the work

### Posted vs Paid
- **Posted**: Work entered into accounting
- **Paid**: Money received from customer

### Rollover
- **Not a problem**: Normal business lag
- **Track it**: Shows work in progress
- **Explicit**: Calculated with clear rules

## 📊 Typical Patterns

### Healthy Shop
```
Sales ≈ Production ≈ Cash
Low rollover counts
Consistent week-to-week
```

### Growing Shop
```
Sales > Production > Cash
Increasing rollover
Building backlog
```

### Slowing Shop
```
Sales < Production
Production > Cash
Clearing backlog
```

## 🚨 Red Flags

### ⚠️ High Sales Rollover
- Work authorized but not completed
- Check production capacity
- Review job scheduling

### ⚠️ High Production Rollover
- Long time from sale to completion
- Check shop efficiency
- Review parts availability

### ⚠️ Low Cash Collection
- Completed work not paid
- Check AR processes
- Review payment terms

## 💻 Technical Notes

### Data Source
- All data from Tekmetric API
- Fetches complete dataset (all pages)
- Calculations done client-side

### Performance
- Parallel section loading
- Independent error handling
- Automatic pagination

### Accuracy
- No assumptions or estimates
- Explicit filter logic
- Documented calculations

## 📞 Support

### Questions About Metrics
- Check tooltip (ℹ️ icon)
- Read WEEKLY_REPORT_README.md
- Review inline code comments

### Technical Issues
- Check browser console
- Verify API connection
- Review network tab

### Feature Requests
- Document in WEEKLY_REPORT_README.md
- Consider impact on date logic
- Maintain section independence

## ✅ Checklist for Accuracy

Before trusting the report:
- [ ] Shop ID is correct
- [ ] Week range is Monday-Sunday
- [ ] All three sections loaded
- [ ] No error messages
- [ ] Numbers look reasonable
- [ ] Rollover metrics make sense
- [ ] Currency formatted correctly

## 🎯 Remember

**The Golden Rule**:
```
Sales ≠ Production ≠ Cash

Each section tells a different story.
All three stories are important.
Never mix the date logic.
```

---

**Quick Access**:
- Component: `/client/src/components/WeeklyReport.js`
- Full Docs: `/WEEKLY_REPORT_README.md`
- Summary: `/WEEKLY_REPORT_SUMMARY.md`
