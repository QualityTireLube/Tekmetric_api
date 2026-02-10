# Declined Services - Quick Reference Guide

## Quick Start

### How to View Declined Services

1. **Navigate to Page**
   - Click "Declined Services" in the navigation menu

2. **Select Date Range**
   - Choose **Start Date** (beginning of period)
   - Choose **End Date** (end of period)
   - Click **"Search"** button

3. **View Results**
   - See all declined services in the table
   - Review summary statistics at the top

4. **Filter & Sort**
   - Type in filter box to search
   - Use sort dropdown to reorder results

## Key Features

### 📅 Date Range Search
- Select any date range to analyze
- Fetches all repair orders in that period
- Extracts declined services automatically

### 🔍 Text Filter
Search by:
- Service name (e.g., "brake pads")
- Customer name (e.g., "John Smith")
- Vehicle info (e.g., "2020 Honda Civic")
- RO number (e.g., "12345")

### 📊 Sort Options
- **Date (Newest First)** - Most recent declines
- **Date (Oldest First)** - Oldest declines
- **Value (Highest First)** - Biggest opportunities
- **Value (Lowest First)** - Smallest values

### 📈 Summary Stats
Three cards show:
1. **Total Declined Services** - How many services declined
2. **Total Potential Value** - Sum of all declined work
3. **Average Value** - Average per declined service

## Common Workflows

### 1. Weekly Follow-up Review
```
1. Select last 7 days
2. Click Search
3. Sort by Value (Highest First)
4. Call customers about top 5 declined services
```

### 2. Monthly Revenue Analysis
```
1. Select previous month
2. Click Search
3. Review Total Potential Value
4. Identify trends in declined services
5. Adjust pricing or communication strategy
```

### 3. Customer-Specific Preparation
```
1. Select last 6 months
2. Click Search
3. Filter by customer name
4. Review their declined service history
5. Prepare recommendations for next visit
```

### 4. Service Type Analysis
```
1. Select last 90 days
2. Click Search
3. Filter by service type (e.g., "brake")
4. See how often that service is declined
5. Consider promotional pricing
```

## Understanding the Data

### What is a "Declined Service"?
A service that was:
- ✓ **Selected/Recommended** - Technician recommended the service
- ✗ **Not Authorized** - Customer chose not to proceed

**Key Point:** These are services the shop recommended but the customer declined. They represent follow-up opportunities!

### Table Columns
| Column | Description |
|--------|-------------|
| ▶ | Click to expand/collapse |
| Date | When the repair order was created |
| RO # | Repair order number |
| Customer | Customer's full name |
| Vehicle | Year, make, and model |
| Declined Services | Badge showing count of declined services |
| Total Value | Sum of all declined services for this RO |

**Expanded View:**
- Click any row to see individual declined services
- Shows service names, notes, and individual values
- Click again to collapse

### Summary Calculations
- **Total Services** = Count of all declined services
- **Total Value** = Sum of all subtotals
- **Average Value** = Total Value ÷ Total Services

## Tips for Success

### 🎯 Best Practices
1. **Start with High Value** - Sort by value to prioritize
2. **Recent First** - Newer declines easier to convert
3. **Be Specific** - Use filters to narrow focus
4. **Regular Reviews** - Check weekly or monthly
5. **Track Follow-ups** - Note which customers you contact

### 💡 Pro Tips
- **Seasonal Timing** - Follow up on tire services before winter
- **Service Bundles** - Offer discounts on multiple declined services
- **Customer History** - Review past visits before calling
- **Price Sensitivity** - Note which services are commonly declined
- **Vehicle Age** - Older vehicles may need declined maintenance soon

### ⚠️ Common Mistakes
- ❌ Too wide date range (slow loading)
- ❌ Not filtering results (overwhelming data)
- ❌ Ignoring low-value services (small wins add up)
- ❌ Not following up (missed opportunities)
- ❌ Forgetting to clear filters (confusing results)

## Keyboard Shortcuts

| Action | Shortcut |
|--------|----------|
| Focus filter box | Click in text field |
| Clear filter | Delete/Backspace |
| Submit search | Enter (in date fields) |

## Troubleshooting

### Problem: No results showing
**Solutions:**
- Check date range is correct
- Verify shop is configured in Settings
- Ensure dates have repair orders
- Look for error messages

### Problem: Loading too slow
**Solutions:**
- Reduce date range
- Use smaller time periods
- Check internet connection
- Try during off-peak hours

### Problem: Can't find specific service
**Solutions:**
- Check spelling in filter
- Try partial name (e.g., "brake" not "brake pads")
- Clear filter and browse manually
- Verify service was actually declined

### Problem: Wrong totals showing
**Solutions:**
- Clear any active filters
- Refresh the page
- Re-run the search
- Check if filter is applied

## Date Range Examples

### Common Ranges
- **Last Week** - 7 days ago to today
- **Last Month** - First to last day of previous month
- **Last Quarter** - 90 days ago to today
- **Year to Date** - January 1 to today
- **Custom Period** - Any specific date range

### Recommended Ranges by Use Case
| Use Case | Recommended Range |
|----------|-------------------|
| Daily follow-ups | Last 7 days |
| Weekly review | Last 14 days |
| Monthly analysis | Previous month |
| Quarterly planning | Last 90 days |
| Annual review | Last 365 days |

## Export & Reporting

### Current Capabilities
- View on screen
- Manual note-taking
- Screenshot for records

### Coming Soon
- CSV export
- PDF reports
- Email summaries
- Automated follow-up tracking

## Integration with Other Features

### Related Pages
- **VIN Search** - See declined services for specific vehicle
- **Repair Orders** - View full repair order details
- **Reports** - Include in revenue analysis
- **Weekly Report** - Compare with completed work

### Workflow Integration
```
Declined Services Page
    ↓
Identify High-Value Opportunity
    ↓
VIN Search for Vehicle History
    ↓
Contact Customer
    ↓
Create New Repair Order
    ↓
Complete Previously Declined Work
```

## Performance Notes

### Loading Times
Due to API rate limiting, loading times depend on the number of repair orders:
- **20 ROs** - ~1-2 minutes (with rate limiting)
- **40 ROs** (2 pages) - ~2-4 minutes
- **60 ROs** (3 pages) - ~3-6 minutes

Each page processes up to 20 repair orders with built-in delays to respect API limits.

### Rate Limiting
The page automatically:
- Adds 200ms delay between each request
- Pauses 2 seconds every 5 requests
- Waits 5 seconds if rate limit is hit
- Shows progress bar during loading

### Optimization Tips
1. Use smaller date ranges when possible
2. Start with recent dates (less data to process)
3. Use pagination to navigate through results
4. Be patient - rate limiting is necessary to avoid errors
5. Filter results after loading to narrow focus

## Support & Help

### Getting Help
- Check console for error messages
- Verify API credentials in Settings
- Review Tekmetric API status
- Contact support with specific error details

### Debug Information
Console logs show:
- Date range being searched
- Number of ROs found
- Number of declined services extracted
- Any API errors encountered

## Feature Limitations

### Current Limitations
- No export functionality (yet)
- No email integration (yet)
- No conversion tracking (yet)
- Manual follow-up tracking required
- No automated reminders

### Workarounds
- Take screenshots for records
- Use external spreadsheet for tracking
- Set calendar reminders for follow-ups
- Maintain separate notes on conversions

## Metrics to Track

### Key Performance Indicators
1. **Total Declined Value** - How much revenue is at risk
2. **Conversion Rate** - % of declined services later completed
3. **Average Decline Value** - Typical size of missed opportunity
4. **Follow-up Success** - % of contacts that result in bookings
5. **Time to Conversion** - Days between decline and completion

### Monthly Goals
- Review 100% of declined services
- Contact top 20% by value
- Convert 10-15% of follow-ups
- Track trends over time
- Adjust strategies based on data

## Version Info

**Current Version:** 1.0  
**Last Updated:** 2026-02-07  
**Status:** Production Ready

### Recent Changes
- Initial release
- Date range search
- Filter and sort functionality
- Summary statistics
- Pagination support
