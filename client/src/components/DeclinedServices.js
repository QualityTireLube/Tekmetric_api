import React, { useState } from 'react';
import { getRepairOrders, getRepairOrder } from '../services/api';

function DeclinedServices() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [declinedServices, setDeclinedServices] = useState([]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [sortBy, setSortBy] = useState('date-desc'); // date-desc, date-asc, value-desc, value-asc
  const [filterText, setFilterText] = useState('');
  const [loadingProgress, setLoadingProgress] = useState({ current: 0, total: 0 });
  const [expandedRO, setExpandedRO] = useState(null);
  const [loadingAll, setLoadingAll] = useState(false);
  const [allPagesProgress, setAllPagesProgress] = useState({ current: 0, total: 0 });
  const [pagination, setPagination] = useState({
    currentPage: 0,
    totalPages: 0,
    totalElements: 0,
    size: 20 // Reduced from 50 to 20 to avoid rate limits
  });

  const handleSearch = async (e) => {
    if (e) e.preventDefault();
    
    if (!startDate || !endDate) {
      setError('Please select both start and end dates');
      return;
    }

    await fetchDeclinedServices(0);
  };

  const fetchDeclinedServices = async (page = 0) => {
    setLoading(true);
    setError(null);
    setDeclinedServices([]);

    try {
      const shopId = localStorage.getItem('tekmetric_shop_id');
      
      if (!shopId) {
        throw new Error('Shop ID not found. Please configure your shop settings.');
      }

      console.log(`Fetching repair orders from ${startDate} to ${endDate}`);
      
      // Convert dates to ISO format WITHOUT timezone conversion
      // Use the date string directly with UTC time to avoid timezone issues
      const startDateTime = startDate + 'T00:00:00.000Z';
      const endDateTime = endDate + 'T23:59:59.999Z';
      
      console.log(`ISO Date Range: ${startDateTime} to ${endDateTime}`);
      
      // Fetch repair orders within date range
      // Note: Tekmetric API may not support createdDateEnd, so we fetch from start date
      // and filter client-side for end date
      const params = {
        shop: shopId,
        createdDateStart: startDateTime,
        size: pagination.size,
        page: page
      };
      
      console.log('API Request params:', params);
      
      const roResponse = await getRepairOrders(params);

      let roData = Array.isArray(roResponse.data) 
        ? roResponse.data 
        : roResponse.data.content || [];
      
      console.log(`API returned ${roData.length} repair orders before filtering`);
      
      // Log first few RO dates to debug
      if (roData.length > 0) {
        console.log('Sample RO dates:', roData.slice(0, 3).map(ro => ({
          id: ro.id,
          number: ro.repairOrderNumber,
          createdDate: ro.createdDate
        })));
      }
      
      // Client-side filter to ensure ROs are within date range
      // This is a backup in case the API doesn't filter correctly
      const startTime = new Date(startDateTime).getTime();
      const endTime = new Date(endDateTime).getTime();
      
      const beforeFilterCount = roData.length;
      roData = roData.filter(ro => {
        if (!ro.createdDate) {
          console.log(`RO ${ro.id} has no createdDate, excluding`);
          return false;
        }
        const roTime = new Date(ro.createdDate).getTime();
        const isInRange = roTime >= startTime && roTime <= endTime;
        if (!isInRange) {
          console.log(`RO ${ro.id} (${ro.createdDate}) is outside range, excluding`);
        }
        return isInRange;
      });
      
      console.log(`Client-side filter: ${beforeFilterCount} -> ${roData.length} repair orders`);
      
      const totalPages = roResponse.data.totalPages || 0;
      const totalElements = roResponse.data.totalElements || roData.length;

      console.log(`Found ${roData.length} repair orders within date range`);

      // Collect all declined jobs from all repair orders
      // Add rate limiting to avoid 429 errors
      const allDeclinedJobs = [];
      const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));
      
      setLoadingProgress({ current: 0, total: roData.length });
      
      for (let i = 0; i < roData.length; i++) {
        const ro = roData[i];
        try {
          // Update progress
          setLoadingProgress({ current: i + 1, total: roData.length });
          
          // Add delay between requests to respect rate limits
          if (i > 0 && i % 5 === 0) {
            console.log(`Rate limiting: processed ${i} ROs, waiting 2 seconds...`);
            await delay(2000); // Wait 2 seconds every 5 requests
          }
          
          const fullROResponse = await getRepairOrder(ro.id);
          const fullRO = fullROResponse.data;
          
          if (fullRO.jobs && fullRO.jobs.length > 0) {
            // Filter for declined jobs
            // A job is declined if it's selected (recommended) but NOT authorized by customer
            const declined = fullRO.jobs.filter(job => 
              job.selected === true && job.authorized === false
            );
            
            // Log for debugging
            if (fullRO.jobs.length > 0) {
              console.log(`RO #${fullRO.repairOrderNumber || fullRO.id}: ${fullRO.jobs.length} jobs, ${declined.length} declined`);
            }
            
            if (declined.length > 0) {
              declined.forEach(job => {
                allDeclinedJobs.push({
                  ...job,
                  repairOrderNumber: fullRO.repairOrderNumber || fullRO.id,
                  repairOrderId: fullRO.id,
                  createdDate: fullRO.createdDate,
                  customerName: fullRO.customer?.firstName && fullRO.customer?.lastName 
                    ? `${fullRO.customer.firstName} ${fullRO.customer.lastName}`
                    : 'N/A',
                  vehicleInfo: fullRO.vehicle 
                    ? `${fullRO.vehicle.year} ${fullRO.vehicle.make} ${fullRO.vehicle.model}`
                    : 'N/A'
                });
              });
            }
          }
          
          // Small delay between each request
          await delay(200); // 200ms delay between each request
        } catch (jobErr) {
          console.error(`Error fetching jobs for RO ${ro.id}:`, jobErr);
          // If we hit rate limit, wait longer before continuing
          if (jobErr.response?.status === 429) {
            console.log('Rate limit hit, waiting 5 seconds before continuing...');
            await delay(5000);
          }
        }
      }
      
      console.log(`Total declined services found: ${allDeclinedJobs.length}`);
      setDeclinedServices(allDeclinedJobs);
      setPagination({
        currentPage: page,
        totalPages: totalPages,
        totalElements: totalElements,
        size: pagination.size
      });

    } catch (err) {
      console.error('Error fetching declined services:', err);
      setError(err.response?.data?.error?.message || err.message);
    } finally {
      setLoading(false);
      setLoadingProgress({ current: 0, total: 0 });
    }
  };

  const handlePageChange = (newPage) => {
    fetchDeclinedServices(newPage);
  };

  const handleLoadAll = async () => {
    if (!window.confirm(
      `This will load ALL ${pagination.totalPages} pages (${pagination.totalElements} repair orders).\n\n` +
      `This may take ${Math.ceil(pagination.totalPages * 0.5)} to ${Math.ceil(pagination.totalPages)} minutes due to API rate limits.\n\n` +
      `Are you sure you want to continue?`
    )) {
      return;
    }

    setLoadingAll(true);
    setAllPagesProgress({ current: 0, total: pagination.totalPages });
    
    try {
      const allDeclinedServices = [...declinedServices]; // Start with current page
      
      // Fetch remaining pages
      for (let page = 1; page < pagination.totalPages; page++) {
        setAllPagesProgress({ current: page, total: pagination.totalPages });
        
        // Fetch this page
        const pageServices = await fetchDeclinedServicesForPage(page);
        allDeclinedServices.push(...pageServices);
        
        console.log(`Loaded page ${page + 1}/${pagination.totalPages}, total declined services: ${allDeclinedServices.length}`);
      }
      
      setDeclinedServices(allDeclinedServices);
      console.log(`✅ Loaded all ${allDeclinedServices.length} declined services from ${pagination.totalPages} pages`);
    } catch (err) {
      console.error('Error loading all pages:', err);
      setError(err.response?.data?.error?.message || err.message);
    } finally {
      setLoadingAll(false);
      setAllPagesProgress({ current: 0, total: 0 });
    }
  };

  const fetchDeclinedServicesForPage = async (page) => {
    const shopId = localStorage.getItem('tekmetric_shop_id');
    const startDateTime = startDate + 'T00:00:00.000Z';
    const endDateTime = endDate + 'T23:59:59.999Z';
    
    const params = {
      shop: shopId,
      createdDateStart: startDateTime,
      size: pagination.size,
      page: page
    };
    
    const roResponse = await getRepairOrders(params);
    let roData = Array.isArray(roResponse.data) 
      ? roResponse.data 
      : roResponse.data.content || [];
    
    // Client-side filter
    const startTime = new Date(startDateTime).getTime();
    const endTime = new Date(endDateTime).getTime();
    
    roData = roData.filter(ro => {
      if (!ro.createdDate) return false;
      const roTime = new Date(ro.createdDate).getTime();
      return roTime >= startTime && roTime <= endTime;
    });
    
    // Extract declined services
    const pageDeclinedJobs = [];
    const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));
    
    for (let i = 0; i < roData.length; i++) {
      const ro = roData[i];
      try {
        if (i > 0 && i % 5 === 0) {
          await delay(2000);
        }
        
        const fullROResponse = await getRepairOrder(ro.id);
        const fullRO = fullROResponse.data;
        
        if (fullRO.jobs && fullRO.jobs.length > 0) {
          const declined = fullRO.jobs.filter(job => 
            job.selected === true && job.authorized === false
          );
          
          if (declined.length > 0) {
            declined.forEach(job => {
              pageDeclinedJobs.push({
                ...job,
                repairOrderNumber: fullRO.repairOrderNumber || fullRO.id,
                repairOrderId: fullRO.id,
                createdDate: fullRO.createdDate,
                customerName: fullRO.customer?.firstName && fullRO.customer?.lastName 
                  ? `${fullRO.customer.firstName} ${fullRO.customer.lastName}`
                  : 'N/A',
                vehicleInfo: fullRO.vehicle 
                  ? `${fullRO.vehicle.year} ${fullRO.vehicle.make} ${fullRO.vehicle.model}`
                  : 'N/A'
              });
            });
          }
        }
        
        await delay(200);
      } catch (jobErr) {
        console.error(`Error fetching jobs for RO ${ro.id}:`, jobErr);
        if (jobErr.response?.status === 429) {
          await delay(5000);
        }
      }
    }
    
    return pageDeclinedJobs;
  };

  const handleClear = () => {
    setStartDate('');
    setEndDate('');
    setDeclinedServices([]);
    setFilterText('');
    setError(null);
    setLoadingProgress({ current: 0, total: 0 });
    setPagination({
      currentPage: 0,
      totalPages: 0,
      totalElements: 0,
      size: 20
    });
  };

  const formatCurrency = (cents) => {
    if (!cents && cents !== 0) return '$0.00';
    return `$${(cents / 100).toFixed(2)}`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  const handleROClick = (roId) => {
    if (expandedRO === roId) {
      setExpandedRO(null);
    } else {
      setExpandedRO(roId);
    }
  };

  // Group declined services by repair order
  const getGroupedServices = () => {
    let filtered = [...declinedServices];

    // Apply text filter
    if (filterText.trim()) {
      const searchLower = filterText.toLowerCase();
      filtered = filtered.filter(service => 
        service.name?.toLowerCase().includes(searchLower) ||
        service.customerName?.toLowerCase().includes(searchLower) ||
        service.vehicleInfo?.toLowerCase().includes(searchLower) ||
        service.repairOrderNumber?.toString().includes(searchLower)
      );
    }

    // Group by repair order
    const grouped = filtered.reduce((acc, service) => {
      const roId = service.repairOrderId;
      if (!acc[roId]) {
        acc[roId] = {
          repairOrderId: roId,
          repairOrderNumber: service.repairOrderNumber,
          createdDate: service.createdDate,
          customerName: service.customerName,
          vehicleInfo: service.vehicleInfo,
          services: []
        };
      }
      acc[roId].services.push(service);
      return acc;
    }, {});

    // Convert to array and sort
    let groupedArray = Object.values(grouped);
    
    groupedArray.sort((a, b) => {
      switch (sortBy) {
        case 'date-desc':
          return new Date(b.createdDate) - new Date(a.createdDate);
        case 'date-asc':
          return new Date(a.createdDate) - new Date(b.createdDate);
        case 'value-desc': {
          const aTotal = a.services.reduce((sum, s) => sum + (s.subtotal || 0), 0);
          const bTotal = b.services.reduce((sum, s) => sum + (s.subtotal || 0), 0);
          return bTotal - aTotal;
        }
        case 'value-asc': {
          const aTotal = a.services.reduce((sum, s) => sum + (s.subtotal || 0), 0);
          const bTotal = b.services.reduce((sum, s) => sum + (s.subtotal || 0), 0);
          return aTotal - bTotal;
        }
        default:
          return 0;
      }
    });

    return groupedArray;
  };

  const groupedServices = getGroupedServices();
  const totalServices = declinedServices.filter(service => {
    if (!filterText.trim()) return true;
    const searchLower = filterText.toLowerCase();
    return service.name?.toLowerCase().includes(searchLower) ||
      service.customerName?.toLowerCase().includes(searchLower) ||
      service.vehicleInfo?.toLowerCase().includes(searchLower) ||
      service.repairOrderNumber?.toString().includes(searchLower);
  }).length;
  const totalValue = declinedServices.filter(service => {
    if (!filterText.trim()) return true;
    const searchLower = filterText.toLowerCase();
    return service.name?.toLowerCase().includes(searchLower) ||
      service.customerName?.toLowerCase().includes(searchLower) ||
      service.vehicleInfo?.toLowerCase().includes(searchLower) ||
      service.repairOrderNumber?.toString().includes(searchLower);
  }).reduce((sum, service) => sum + (service.subtotal || 0), 0);

  return (
    <div>
      <div className="card">
        <h2>Declined Services</h2>
        <p style={{ color: '#6b7280', marginBottom: '1rem' }}>
          View all declined services across repair orders within a date range.
        </p>
        <div style={{
          padding: '1rem',
          backgroundColor: '#fef3c7',
          borderRadius: '8px',
          border: '1px solid #fde047',
          marginBottom: '1.5rem',
          fontSize: '0.9rem',
          color: '#854d0e'
        }}>
          <strong>Note:</strong> This page fetches detailed information for each repair order, which may take time due to API rate limits. 
          Each search processes up to 20 repair orders. Use pagination to view more results.
        </div>

        {/* Search Form */}
        <form onSubmit={handleSearch} style={{ marginBottom: '2rem' }}>
          <div className="grid" style={{ gridTemplateColumns: '1fr 1fr 1fr auto', gap: '1rem', alignItems: 'flex-end' }}>
            <div className="form-group" style={{ margin: 0 }}>
              <label>Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                disabled={loading}
                required
              />
            </div>
            <div className="form-group" style={{ margin: 0 }}>
              <label>End Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                disabled={loading}
                required
              />
            </div>
            <button 
              type="submit" 
              className="btn btn-primary" 
              disabled={loading || !startDate || !endDate}
              style={{ minWidth: '120px' }}
            >
              {loading ? 'Searching...' : 'Search'}
            </button>
            {declinedServices.length > 0 && (
              <button 
                type="button" 
                className="btn btn-secondary" 
                onClick={handleClear}
                disabled={loading}
              >
                Clear
              </button>
            )}
          </div>
        </form>

        {/* Error Message */}
        {error && (
          <div className="alert alert-error" style={{ marginBottom: '1.5rem' }}>
            <strong>Error:</strong> {error}
          </div>
        )}

        {/* Loading Spinner with Progress */}
        {(loading || loadingAll) && (
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <div className="spinner"></div>
            
            {/* Page Loading Progress */}
            {loadingAll && allPagesProgress.total > 0 && (
              <div style={{ marginTop: '1rem', marginBottom: '1.5rem' }}>
                <p style={{ color: '#6b7280', marginBottom: '0.5rem', fontSize: '1.1rem', fontWeight: '600' }}>
                  Loading All Pages... {allPagesProgress.current} of {allPagesProgress.total}
                </p>
                <div style={{
                  width: '100%',
                  maxWidth: '500px',
                  height: '12px',
                  backgroundColor: '#e5e7eb',
                  borderRadius: '6px',
                  margin: '0 auto',
                  overflow: 'hidden',
                  border: '1px solid #d1d5db'
                }}>
                  <div style={{
                    width: `${(allPagesProgress.current / allPagesProgress.total) * 100}%`,
                    height: '100%',
                    backgroundColor: '#3b82f6',
                    transition: 'width 0.3s ease'
                  }}></div>
                </div>
                <p style={{ 
                  color: '#6b7280', 
                  fontSize: '0.9rem', 
                  marginTop: '0.75rem'
                }}>
                  Estimated time remaining: ~{Math.ceil((allPagesProgress.total - allPagesProgress.current) * 0.5)} minutes
                </p>
              </div>
            )}
            
            {/* RO Processing Progress */}
            {loadingProgress.total > 0 && (
              <div style={{ marginTop: '1rem' }}>
                <p style={{ color: '#6b7280', marginBottom: '0.5rem' }}>
                  Processing repair orders... {loadingProgress.current} of {loadingProgress.total}
                </p>
                <div style={{
                  width: '100%',
                  maxWidth: '400px',
                  height: '8px',
                  backgroundColor: '#e5e7eb',
                  borderRadius: '4px',
                  margin: '0 auto',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    width: `${(loadingProgress.current / loadingProgress.total) * 100}%`,
                    height: '100%',
                    backgroundColor: '#10b981',
                    transition: 'width 0.3s ease'
                  }}></div>
                </div>
                <p style={{ 
                  color: '#6b7280', 
                  fontSize: '0.85rem', 
                  marginTop: '0.5rem',
                  fontStyle: 'italic'
                }}>
                  {loadingAll ? 'Processing current page...' : 'This may take a while due to API rate limits...'}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Results */}
        {!loading && declinedServices.length > 0 && (
          <div>
            {/* Filter and Sort Controls */}
            <div style={{ 
              display: 'flex', 
              gap: '1rem', 
              marginBottom: '1.5rem',
              alignItems: 'center',
              flexWrap: 'wrap'
            }}>
              <div className="form-group" style={{ flex: 1, minWidth: '250px', margin: 0 }}>
                <label>Filter by Service, Customer, Vehicle, or RO #</label>
                <input
                  type="text"
                  value={filterText}
                  onChange={(e) => setFilterText(e.target.value)}
                  placeholder="Type to filter..."
                  style={{ width: '100%' }}
                />
              </div>
              <div className="form-group" style={{ minWidth: '200px', margin: 0 }}>
                <label>Sort By</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  style={{ width: '100%' }}
                >
                  <option value="date-desc">Date (Newest First)</option>
                  <option value="date-asc">Date (Oldest First)</option>
                  <option value="value-desc">Value (Highest First)</option>
                  <option value="value-asc">Value (Lowest First)</option>
                </select>
              </div>
            </div>

            {/* Summary Stats */}
            <div style={{ 
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '1rem',
              marginBottom: '1.5rem'
            }}>
              <div style={{
                padding: '1rem',
                backgroundColor: '#fef2f2',
                borderRadius: '8px',
                border: '2px solid #fecaca'
              }}>
                <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.25rem' }}>
                  Total Declined Services
                </div>
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#991b1b' }}>
                  {totalServices}
                </div>
              </div>
              <div style={{
                padding: '1rem',
                backgroundColor: '#fef2f2',
                borderRadius: '8px',
                border: '2px solid #fecaca'
              }}>
                <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.25rem' }}>
                  Total Potential Value
                </div>
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#991b1b' }}>
                  {formatCurrency(totalValue)}
                </div>
              </div>
              <div style={{
                padding: '1rem',
                backgroundColor: '#fef2f2',
                borderRadius: '8px',
                border: '2px solid #fecaca'
              }}>
                <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.25rem' }}>
                  Average Value
                </div>
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#991b1b' }}>
                  {totalServices > 0 ? formatCurrency(totalValue / totalServices) : '$0.00'}
                </div>
              </div>
            </div>

            {/* Declined Services Table - Grouped by RO */}
            {groupedServices.length === 0 ? (
              <div style={{ 
                textAlign: 'center', 
                padding: '3rem', 
                backgroundColor: '#f9fafb',
                borderRadius: '8px',
                color: '#6b7280'
              }}>
                <p style={{ fontSize: '1.1rem' }}>No declined services match your filter.</p>
              </div>
            ) : (
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th style={{ width: '40px' }}></th>
                      <th>Date</th>
                      <th>RO #</th>
                      <th>Customer</th>
                      <th>Vehicle</th>
                      <th>Declined Services</th>
                      <th>Total Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {groupedServices.map((ro) => {
                      const isExpanded = expandedRO === ro.repairOrderId;
                      const roTotal = ro.services.reduce((sum, s) => sum + (s.subtotal || 0), 0);
                      
                      return (
                        <React.Fragment key={ro.repairOrderId}>
                          <tr 
                            onClick={() => handleROClick(ro.repairOrderId)}
                            style={{ 
                              cursor: 'pointer',
                              backgroundColor: isExpanded ? '#fef2f2' : 'transparent'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#fef2f2'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = isExpanded ? '#fef2f2' : 'transparent'}
                          >
                            <td style={{ textAlign: 'center' }}>
                              <span style={{ 
                                fontSize: '0.8rem',
                                transition: 'transform 0.2s',
                                display: 'inline-block',
                                transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)'
                              }}>
                                ▶
                              </span>
                            </td>
                            <td>{formatDate(ro.createdDate)}</td>
                            <td>
                              <strong>#{ro.repairOrderNumber}</strong>
                            </td>
                            <td>{ro.customerName}</td>
                            <td style={{ fontSize: '0.9rem' }}>{ro.vehicleInfo}</td>
                            <td>
                              <span style={{
                                padding: '0.25rem 0.75rem',
                                backgroundColor: '#fee2e2',
                                borderRadius: '12px',
                                fontSize: '0.875rem',
                                fontWeight: '600',
                                color: '#991b1b'
                              }}>
                                {ro.services.length} service{ro.services.length !== 1 ? 's' : ''}
                              </span>
                            </td>
                            <td>
                              <strong style={{ color: '#991b1b' }}>
                                {formatCurrency(roTotal)}
                              </strong>
                            </td>
                          </tr>
                          
                          {isExpanded && (
                            <tr>
                              <td colSpan="7" style={{ 
                                padding: 0,
                                backgroundColor: '#fef2f2',
                                borderTop: '2px solid #fecaca'
                              }}>
                                <div style={{ padding: '1.5rem' }}>
                                  <h4 style={{ 
                                    marginBottom: '1rem', 
                                    color: '#991b1b',
                                    fontSize: '1rem'
                                  }}>
                                    Declined Services ({ro.services.length})
                                  </h4>
                                  
                                  <div style={{ 
                                    display: 'flex', 
                                    flexDirection: 'column',
                                    gap: '0.75rem'
                                  }}>
                                    {ro.services.map((service, index) => (
                                      <div 
                                        key={`${service.id}-${index}`}
                                        style={{
                                          padding: '1rem',
                                          backgroundColor: 'white',
                                          borderRadius: '6px',
                                          border: '1px solid #fecaca',
                                          boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                                        }}
                                      >
                                        <div style={{ 
                                          display: 'flex', 
                                          justifyContent: 'space-between',
                                          alignItems: 'center',
                                          gap: '1rem'
                                        }}>
                                          <div style={{ flex: 1 }}>
                                            <div style={{ 
                                              fontSize: '1rem',
                                              fontWeight: '600',
                                              color: '#991b1b'
                                            }}>
                                              {index + 1}. {service.name}
                                            </div>
                                            {service.note && (
                                              <div style={{ 
                                                fontSize: '0.875rem',
                                                color: '#6b7280',
                                                fontStyle: 'italic',
                                                marginTop: '0.25rem'
                                              }}>
                                                Note: {service.note}
                                              </div>
                                            )}
                                          </div>
                                          <div style={{ 
                                            fontSize: '1.125rem',
                                            fontWeight: 'bold',
                                            color: '#991b1b',
                                            whiteSpace: 'nowrap'
                                          }}>
                                            {formatCurrency(service.subtotal)}
                                          </div>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                  
                                  <div style={{ 
                                    marginTop: '1rem',
                                    paddingTop: '1rem',
                                    borderTop: '2px solid #fecaca',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center'
                                  }}>
                                    <div style={{ 
                                      fontSize: '0.875rem',
                                      color: '#6b7280'
                                    }}>
                                      Click row again to collapse
                                    </div>
                                    <div style={{ 
                                      fontSize: '1.125rem',
                                      fontWeight: 'bold',
                                      color: '#991b1b'
                                    }}>
                                      RO Total: {formatCurrency(roTotal)}
                                    </div>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination Info */}
            {pagination.totalPages > 1 && (
              <div style={{ 
                marginTop: '1.5rem',
                padding: '1rem',
                backgroundColor: '#f9fafb',
                borderRadius: '8px',
                textAlign: 'center',
                color: '#6b7280'
              }}>
                <p>
                  Showing page {pagination.currentPage + 1} of {pagination.totalPages}
                  {' '}({pagination.totalElements} total repair orders)
                </p>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'center', 
                  gap: '1rem',
                  marginTop: '1rem',
                  flexWrap: 'wrap'
                }}>
                  <button
                    className="btn btn-secondary"
                    onClick={() => handlePageChange(pagination.currentPage - 1)}
                    disabled={pagination.currentPage === 0 || loading || loadingAll}
                  >
                    Previous
                  </button>
                  <button
                    className="btn btn-primary"
                    onClick={handleLoadAll}
                    disabled={loading || loadingAll}
                    style={{ minWidth: '150px' }}
                  >
                    {loadingAll ? `Loading All... (${allPagesProgress.current}/${allPagesProgress.total})` : 'Load All Pages'}
                  </button>
                  <button
                    className="btn btn-secondary"
                    onClick={() => handlePageChange(pagination.currentPage + 1)}
                    disabled={pagination.currentPage >= pagination.totalPages - 1 || loading || loadingAll}
                  >
                    Next
                  </button>
                </div>
                {pagination.totalPages > 10 && (
                  <div style={{
                    marginTop: '1rem',
                    padding: '0.75rem',
                    backgroundColor: '#fef3c7',
                    borderRadius: '4px',
                    border: '1px solid #fde047',
                    fontSize: '0.85rem',
                    color: '#854d0e'
                  }}>
                    <strong>⚠️ Warning:</strong> Loading all {pagination.totalPages} pages will take approximately{' '}
                    {Math.ceil(pagination.totalPages * 0.5)}-{Math.ceil(pagination.totalPages)} minutes due to API rate limits.
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* No Results */}
        {!loading && declinedServices.length === 0 && startDate && endDate && (
          <div style={{ 
            textAlign: 'center', 
            padding: '3rem', 
            backgroundColor: '#f9fafb',
            borderRadius: '8px',
            color: '#6b7280'
          }}>
            <p style={{ fontSize: '1.1rem' }}>
              No declined services found for the selected date range.
            </p>
            <p style={{ fontSize: '0.9rem', marginTop: '0.5rem' }}>
              Try selecting a different date range or check if there are repair orders with declined services.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default DeclinedServices;
