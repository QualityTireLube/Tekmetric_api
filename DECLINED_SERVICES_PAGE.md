# Declined Services Page

## Overview
A dedicated page to view, filter, and analyze all declined services across repair orders within a specified date range. This helps identify missed revenue opportunities and follow up with customers on previously declined work.

## Features

### 1. Date Range Search
- **Start Date** - Beginning of the search period
- **End Date** - End of the search period
- Fetches all repair orders within the date range
- Extracts declined services from each repair order

### 2. Real-time Filtering
- **Text Filter** - Search by:
  - Service name
  - Customer name
  - Vehicle information
  - Repair order number
- **Live Updates** - Results filter as you type

### 3. Flexible Sorting
Four sorting options:
- **Date (Newest First)** - Most recent declined services first
- **Date (Oldest First)** - Oldest declined services first
- **Value (Highest First)** - Highest dollar value services first
- **Value (Lowest First)** - Lowest dollar value services first

### 4. Summary Statistics
Three key metrics displayed:
- **Total Declined Services** - Count of all declined services
- **Total Potential Value** - Sum of all declined service values
- **Average Value** - Average value per declined service

### 5. Expandable Repair Order Table
Displays repair orders grouped with declined services:

**Main Table View:**
- **Date** - When the repair order was created
- **RO #** - Repair order number (clickable)
- **Customer** - Customer name
- **Vehicle** - Year, make, and model
- **Declined Services** - Count badge showing number of declined services
- **Total Value** - Sum of all declined services for this RO

**Expanded View (click any row):**
- Shows all declined services for that repair order
- Service name and notes
- Individual service values
- RO total for declined services
- Click again to collapse

### 6. Pagination Support
- Handles large datasets efficiently
- Shows current page and total pages
- Navigate between pages with Previous/Next buttons
- Displays total repair orders count

## How It Works

### Backend Process
1. User selects start and end dates
2. System fetches all repair orders in date range
3. For each repair order:
   - Fetches full repair order details
   - Extracts jobs/services
   - Filters for declined services (selected=false AND authorized=false)
4. Aggregates all declined services with context:
   - Repair order information
   - Customer information
   - Vehicle information
   - Service details

### Frontend Processing
1. Displays all declined services in a table
2. Applies text filter (if entered)
3. Sorts by selected criteria
4. Calculates summary statistics
5. Renders paginated results

## Use Cases

### 1. Follow-up Opportunities
**Scenario:** Service advisor wants to contact customers about previously declined services

**Workflow:**
1. Select date range (e.g., last 30 days)
2. Click "Search"
3. Review declined services
4. Sort by value (highest first) to prioritize
5. Contact customers about high-value declined work

### 2. Service Trends Analysis
**Scenario:** Shop manager wants to understand which services are commonly declined

**Workflow:**
1. Select broader date range (e.g., last 3 months)
2. Click "Search"
3. Use filter to search for specific service types
4. Analyze patterns in declined services
5. Adjust pricing or communication strategies

### 3. Customer-Specific Review
**Scenario:** Service advisor preparing for customer return visit

**Workflow:**
1. Select date range covering customer's history
2. Click "Search"
3. Filter by customer name
4. Review all previously declined services
5. Prepare recommendations for upcoming visit

### 4. Revenue Recovery
**Scenario:** Shop wants to identify missed revenue opportunities

**Workflow:**
1. Select date range (e.g., last quarter)
2. Click "Search"
3. Review total potential value
4. Sort by value (highest first)
5. Create targeted follow-up campaign

## Technical Details

### API Calls
1. **getRepairOrders()** - Fetches repair orders in date range
   - Parameters: shop, createdDateStart, createdDateEnd, size, page
   - Dates are converted to ISO format with time boundaries:
     - Start date: 00:00:00.000 (beginning of day)
     - End date: 23:59:59.999 (end of day)
   - Client-side filtering applied as backup to ensure accuracy
2. **getRepairOrder(id)** - Fetches full details for each RO
   - Includes jobs, customer, vehicle information

### Declined Service Criteria
A service is considered "declined" when:
- `selected === true` - Service was recommended/selected by the technician
- `authorized === false` - Customer did NOT authorize the service

**Important:** This identifies services that were recommended but the customer chose not to proceed with. These represent missed revenue opportunities and potential follow-up items.

### Data Enrichment
Each declined service includes:
```javascript
{
  ...job,                          // Original job data
  repairOrderNumber,               // RO number for reference
  repairOrderId,                   // RO ID for linking
  createdDate,                     // RO creation date
  customerName,                    // Customer first + last name
  vehicleInfo                      // Year Make Model
}
```

### Performance Considerations
- Pagination at repair order level (default 20 ROs per page)
- **Rate Limiting** - Built-in delays to avoid API rate limits:
  - 200ms delay between each repair order request
  - 2 second pause every 5 requests
  - 5 second pause if rate limit (429) is hit
- Client-side filtering and sorting for better UX
- Async loading with progress indicators
- Error handling for failed API calls
- Progress bar shows current processing status

## User Interface

### Layout
- **Header** - Title and description
- **Search Form** - Date inputs and search button
- **Filter/Sort Controls** - Text filter and sort dropdown
- **Summary Cards** - Three metric cards in a grid
- **Results Table** - Scrollable table with declined services
- **Pagination** - Page navigation controls

### Color Scheme
- **Red Theme** - Indicates declined/missed opportunities
  - Light red backgrounds (#fef2f2)
  - Red borders (#fecaca)
  - Dark red text (#991b1b)

### Responsive Design
- Grid layouts adapt to screen size
- Table scrolls horizontally on small screens
- Form controls stack on mobile

## Error Handling

### Common Errors
1. **No Shop ID** - User needs to configure shop in settings
2. **No Dates Selected** - Both start and end dates required
3. **API Errors** - Network or authentication issues
4. **No Results** - Helpful message when no declined services found

### Error Display
- Red alert box at top of page
- Clear error message
- Suggested actions to resolve

## Tips & Best Practices

### Optimal Date Ranges
- **Follow-up Calls** - Last 7-30 days
- **Monthly Review** - Previous month
- **Quarterly Analysis** - Last 90 days
- **Annual Planning** - Last 12 months

### Effective Filtering
- Search by service type (e.g., "brake", "tire", "oil")
- Search by customer name for specific follow-ups
- Search by RO number when referencing specific orders
- Use vehicle info to find all declined work for a vehicle

### Sorting Strategies
- **Value-based** - Focus on high-dollar opportunities first
- **Date-based** - Recent declines may be easier to convert
- **Oldest first** - Find long-standing declined work

### Follow-up Best Practices
1. Start with highest value declined services
2. Review customer history before calling
3. Check if declined work is still relevant
4. Offer seasonal promotions on commonly declined services
5. Track conversion rates on follow-up attempts

## Future Enhancements

### Potential Features
- **Export to CSV** - Download declined services for analysis
- **Email Integration** - Send follow-up emails directly
- **Conversion Tracking** - Mark when declined service is completed
- **Service Categories** - Group by service type
- **Customer Portal Links** - Direct links to customer profiles
- **Automated Reminders** - Schedule follow-up reminders
- **Comparison Charts** - Visual analysis of trends
- **Decline Reasons** - Track why services were declined
- **Success Metrics** - Track conversion rates over time

### Analytics Ideas
- Most commonly declined services
- Decline rate by service type
- Average time to conversion
- Seasonal decline patterns
- Price sensitivity analysis

## Integration Points

### Related Features
- **VIN Search** - View declined services for specific vehicle
- **Repair Orders** - Link to full repair order details
- **Customer Management** - Link to customer profiles
- **Reports** - Include in revenue analysis reports

### Data Flow
```
Date Range Selection
    ↓
Fetch Repair Orders (paginated)
    ↓
For Each RO: Fetch Full Details
    ↓
Extract Declined Jobs
    ↓
Enrich with Customer/Vehicle Data
    ↓
Display in Filterable/Sortable Table
    ↓
Calculate Summary Statistics
```

## Troubleshooting

### No Results Showing
- **Check Date Range** - Ensure dates are correct
- **Verify Shop ID** - Go to Settings and configure shop
- **Check API Status** - Verify connection to Tekmetric
- **Review Console** - Look for error messages

### Slow Loading
- **Reduce Date Range** - Smaller ranges load faster
- **Check Network** - Verify internet connection
- **API Rate Limits** - May need to wait between requests
- **Large Datasets** - Use pagination to navigate

### Filter Not Working
- **Clear Filter** - Remove text and try again
- **Check Spelling** - Ensure search terms are correct
- **Case Insensitive** - Searches work regardless of case

## Version History

### v1.0 (Current)
- Initial release
- Date range search
- Text filtering
- Four sort options
- Summary statistics
- Pagination support
- Customer and vehicle information display
