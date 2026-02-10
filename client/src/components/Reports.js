import React, { useState, useEffect } from 'react';
import { getRepairOrders, getEmployees } from '../services/api';

function Reports() {
  const [repairOrders, setRepairOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [filteredData, setFilteredData] = useState([]);
  const [expandedRO, setExpandedRO] = useState(null);
  const [selectedJob, setSelectedJob] = useState(null);
  const [showJobModal, setShowJobModal] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [technicianMap, setTechnicianMap] = useState({});
  const [selectedTechnicians, setSelectedTechnicians] = useState([]);
  const [selectedStatuses, setSelectedStatuses] = useState([]);
  const [showCompletedLabor, setShowCompletedLabor] = useState(false);
  const [showAuthorizedOnly, setShowAuthorizedOnly] = useState(false);
  const [paginationWarning, setPaginationWarning] = useState(null);
  const [dateFilterField, setDateFilterField] = useState('completedDate'); // Which date field to use for filtering
  const [filterByJobCompletion, setFilterByJobCompletion] = useState(false); // Filter by job completion dates instead of RO dates
  const [dateFilterMode, setDateFilterMode] = useState('ro'); // 'ro' or 'job' - what to filter by

  // Initialize with current month and load employees
  useEffect(() => {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    
    setStartDate(firstDay.toISOString().split('T')[0]);
    setEndDate(lastDay.toISOString().split('T')[0]);
    
    loadEmployees();
  }, []);

  const loadEmployees = async () => {
    try {
      const shopId = localStorage.getItem('tekmetric_shop_id');
      const response = await getEmployees({ shop: shopId, size: 500 });
      const empData = Array.isArray(response.data) ? response.data : response.data.content || [];
      setEmployees(empData);
      
      // Create a map of technician ID to name
      const techMap = {};
      empData.forEach(emp => {
        techMap[emp.id] = `${emp.firstName || ''} ${emp.lastName || ''}`.trim() || `Employee #${emp.id}`;
      });
      setTechnicianMap(techMap);
    } catch (err) {
      console.error('Error loading employees:', err);
      // Don't show error to user, just log it
    }
  };

  const loadRepairOrders = async () => {
    if (!startDate || !endDate) {
      setError('Please select both start and end dates');
      return;
    }

    setLoading(true);
    setError(null);
    setPaginationWarning(null);
    
    try {
      const shopId = localStorage.getItem('tekmetric_shop_id');
      
      // Format dates for API (YYYY-MM-DD)
      const startDateFormatted = startDate;
      const endDateFormatted = endDate;
      
      console.log('=== REPAIR ORDERS FETCH DEBUG ===');
      console.log('Date range:', startDate, 'to', endDate);
      
      // Fetch first page to get total count
      // Note: Not using completedAfter/completedBefore as they don't seem to work reliably
      // We'll filter client-side instead
      const firstPageParams = { 
        shop: shopId, 
        size: 100, // API max per page
        page: 0
      };
      
      console.log('Fetching first page with params:', firstPageParams);
      const firstResponse = await getRepairOrders(firstPageParams);
      
      let allRoData = [];
      const responseData = firstResponse.data;
      
      // Check if response is paginated
      if (responseData.content && responseData.totalElements) {
        // Paginated response
        const totalElements = responseData.totalElements;
        const totalPages = responseData.totalPages;
        
        console.log(`📊 Total ROs available: ${totalElements} across ${totalPages} pages`);
        
        // Add first page data
        allRoData = [...responseData.content];
        
        // Fetch remaining pages (limit to 10 pages = 1000 records max for performance)
        const maxPages = Math.min(totalPages, 10);
        
        if (totalPages > 1) {
          console.log(`Fetching pages 2-${maxPages}...`);
          
          const pagePromises = [];
          for (let page = 1; page < maxPages; page++) {
            const pageParams = { ...firstPageParams, page };
            pagePromises.push(getRepairOrders(pageParams));
          }
          
          const pageResponses = await Promise.all(pagePromises);
          pageResponses.forEach(response => {
            const pageData = response.data.content || [];
            allRoData = [...allRoData, ...pageData];
          });
          
          console.log(`✅ Fetched ${allRoData.length} ROs from ${maxPages} pages`);
          
          if (totalPages > maxPages) {
            setPaginationWarning(`Showing ${allRoData.length} of ${totalElements} total repair orders. Limited to ${maxPages} pages for performance.`);
          }
        }
      } else {
        // Non-paginated response
        allRoData = Array.isArray(responseData) ? responseData : responseData.content || [];
        console.log('Non-paginated response, total ROs:', allRoData.length);
      }
      
      const roData = allRoData;
      
      console.log('Sample RO data:', roData[0]);
      
      // Count ROs by status
      const statusCounts = {};
      roData.forEach(ro => {
        const status = ro.repairOrderStatus?.code || 'UNKNOWN';
        statusCounts[status] = (statusCounts[status] || 0) + 1;
      });
      console.log('ROs by status:', statusCounts);
      
      // Additional client-side filtering for dates
      // Create date objects at midnight local time for comparison
      const start = new Date(startDate + 'T00:00:00');
      const end = new Date(endDate + 'T23:59:59');
      
      console.log('Date filter range:', start.toISOString(), 'to', end.toISOString());
      
      // Track which date fields are being used
      const dateFieldUsage = {
        completedDate: 0,
        postedDate: 0,
        updatedDate: 0,
        createdDate: 0
      };
      
      let outsideRangeCount = 0;
      let filtered = roData.filter(ro => {
        // Use the selected date field, with fallbacks
        let dateToCheck, dateFieldUsed;
        
        if (dateFilterField === 'completedDate' && ro.completedDate) {
          dateToCheck = ro.completedDate;
          dateFieldUsed = 'completedDate';
        } else if (dateFilterField === 'postedDate' && ro.postedDate) {
          dateToCheck = ro.postedDate;
          dateFieldUsed = 'postedDate';
        } else if (dateFilterField === 'createdDate' && ro.createdDate) {
          dateToCheck = ro.createdDate;
          dateFieldUsed = 'createdDate';
        } else {
          // Fallback chain if selected field doesn't exist
          if (ro.completedDate) {
            dateToCheck = ro.completedDate;
            dateFieldUsed = 'completedDate';
          } else if (ro.postedDate) {
            dateToCheck = ro.postedDate;
            dateFieldUsed = 'postedDate';
          } else if (ro.updatedDate) {
            dateToCheck = ro.updatedDate;
            dateFieldUsed = 'updatedDate';
          } else if (ro.createdDate) {
            dateToCheck = ro.createdDate;
            dateFieldUsed = 'createdDate';
          }
        }
        
        if (!dateToCheck) {
          console.log('⚠️ RO without any date:', ro.id, ro.repairOrderNumber, ro.repairOrderStatus?.name);
          return false;
        }
        
        dateFieldUsage[dateFieldUsed]++;
        
        // Parse the date string (handles both ISO format and other formats)
        const checkDate = new Date(dateToCheck);
        
        // Compare dates - extract just the date part for comparison
        const checkDateOnly = new Date(checkDate.getFullYear(), checkDate.getMonth(), checkDate.getDate());
        const startDateOnly = new Date(start.getFullYear(), start.getMonth(), start.getDate());
        const endDateOnly = new Date(end.getFullYear(), end.getMonth(), end.getDate());
        
        const inRange = checkDateOnly >= startDateOnly && checkDateOnly <= endDateOnly;
        
        if (!inRange) {
          outsideRangeCount++;
          // Only log first 5 to avoid spam
          if (outsideRangeCount <= 5) {
            console.log('Outside range:', ro.repairOrderNumber, 'Using:', dateFieldUsed, 'Date:', dateToCheck, 'Status:', ro.repairOrderStatus?.name);
          }
        }
        
        return inRange;
      });
      
      console.log('📅 Date fields used for filtering:', dateFieldUsage);
      
      console.log('✅ Filtered ROs in date range:', filtered.length);
      
      // Additional filtering by job completion dates if mode is 'job'
      if (dateFilterMode === 'job') {
        console.log('🔍 Applying job completion date filter...');
        
        const startDateOnly = new Date(start.getFullYear(), start.getMonth(), start.getDate());
        const endDateOnly = new Date(end.getFullYear(), end.getMonth(), end.getDate());
        
        filtered = filtered.filter(ro => {
          if (!ro.jobs || ro.jobs.length === 0) return false;
          
          // Check if ANY job in this RO was completed in the date range
          return ro.jobs.some(job => {
            if (!job.completedDate) return false;
            
            const jobCompletedDate = new Date(job.completedDate);
            const jobCompletedDateOnly = new Date(jobCompletedDate.getFullYear(), jobCompletedDate.getMonth(), jobCompletedDate.getDate());
            
            return jobCompletedDateOnly >= startDateOnly && jobCompletedDateOnly <= endDateOnly;
          });
        });
        
        console.log('✅ ROs with jobs completed in date range:', filtered.length);
      }
      
      console.log('=== END DEBUG ===');
      
      setRepairOrders(filtered);
      applyFilters(filtered);
    } catch (err) {
      setError(err.response?.data?.error?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = (data = repairOrders) => {
    let filtered = [...data];

    // Filter by technician
    if (selectedTechnicians.length > 0) {
      filtered = filtered.filter(ro => {
        if (!ro.jobs || ro.jobs.length === 0) return false;
        return ro.jobs.some(job => selectedTechnicians.includes(job.technicianId?.toString()));
      });
    }

    // Filter by RO status
    if (selectedStatuses.length > 0) {
      filtered = filtered.filter(ro => {
        return selectedStatuses.includes(ro.repairOrderStatus?.code);
      });
    }

    // Filter by completed labor items only
    if (showCompletedLabor) {
      filtered = filtered.filter(ro => {
        if (!ro.jobs || ro.jobs.length === 0) return false;
        return ro.jobs.some(job => job.labor && job.labor.some(l => l.complete));
      });
    }

    // Filter by authorized jobs only
    if (showAuthorizedOnly) {
      filtered = filtered.filter(ro => {
        if (!ro.jobs || ro.jobs.length === 0) return false;
        return ro.jobs.some(job => job.authorized);
      });
    }

    setFilteredData(filtered);
  };

  // Apply filters whenever filter criteria changes
  useEffect(() => {
    if (repairOrders.length > 0) {
      applyFilters();
    }
  }, [selectedTechnicians, selectedStatuses, showCompletedLabor, showAuthorizedOnly]);

  const calculateMetrics = () => {
    let totalBillableHours = 0;
    let totalLaborSales = 0;
    let totalSales = 0;
    let totalPartsSales = 0;
    let totalLoggedHours = 0;
    let totalPartsCost = 0;
    let totalLaborCost = 0;
    const uniqueVehicleIds = new Set();

    // Helper to check if job is in date range (only used in 'job' mode)
    const isJobInDateRange = (job) => {
      if (dateFilterMode !== 'job' || !job.completedDate) return true;
      
      const jobDate = new Date(job.completedDate);
      const jobDateOnly = new Date(jobDate.getFullYear(), jobDate.getMonth(), jobDate.getDate());
      const start = new Date(startDate + 'T00:00:00');
      const end = new Date(endDate + 'T23:59:59');
      const startDateOnly = new Date(start.getFullYear(), start.getMonth(), start.getDate());
      const endDateOnly = new Date(end.getFullYear(), end.getMonth(), end.getDate());
      
      return jobDateOnly >= startDateOnly && jobDateOnly <= endDateOnly;
    };

    filteredData.forEach(ro => {
      // Track unique vehicles
      if (ro.vehicleId) {
        uniqueVehicleIds.add(ro.vehicleId);
      }
      // In 'ro' mode: count all RO sales
      // In 'job' mode: only count sales from jobs completed in date range
      if (dateFilterMode === 'ro') {
        totalSales += (ro.totalSales || 0) / 100;
        totalLaborSales += (ro.laborSales || 0) / 100;
        totalPartsSales += (ro.partsSales || 0) / 100;
      }

      // Calculate from jobs
      if (ro.jobs && ro.jobs.length > 0) {
        ro.jobs.forEach(job => {
          // Skip jobs not in date range when in 'job' mode
          if (!isJobInDateRange(job)) return;
          
          // In 'job' mode, sum up sales from individual jobs
          if (dateFilterMode === 'job') {
            totalLaborSales += (job.laborTotal || 0) / 100;
            totalPartsSales += (job.partsTotal || 0) / 100;
            totalSales += (job.subtotal || 0) / 100;
          }
          
          // Only count hours from COMPLETED labor items
          if (job.labor && job.labor.length > 0) {
            job.labor.forEach(laborItem => {
              if (laborItem.complete) {
                // Billable hours - only from completed labor items
                totalBillableHours += parseFloat(laborItem.hours || 0);
              }
            });
          }
          
          // Calculate parts cost
          if (job.parts && job.parts.length > 0) {
            job.parts.forEach(part => {
              totalPartsCost += (part.cost || 0) / 100;
            });
          }
          
          // Logged hours by technician - only if job has completed labor items
          const hasCompletedLabor = job.labor && job.labor.some(l => l.complete);
          if (hasCompletedLabor) {
            // Try multiple possible field names for logged/clocked hours
            const loggedHours = parseFloat(job.loggedHours || job.clockedHours || job.actualHours || 0);
            totalLoggedHours += loggedHours;
          }
        });
      }
    });

    // Calculate gross profit (Sales - Cost of Goods)
    // Note: Labor cost is not typically included in COGS for service businesses
    // Gross Profit = Total Sales - Parts Cost
    const grossProfit = totalSales - totalPartsCost;
    
    // Calculate gross profit margin percentage
    const grossProfitMargin = totalSales > 0 ? ((grossProfit / totalSales) * 100).toFixed(1) : '0.0';

    return {
      totalBillableHours: totalBillableHours.toFixed(2),
      totalLaborSales: totalLaborSales.toFixed(2),
      totalSales: totalSales.toFixed(2),
      totalPartsSales: totalPartsSales.toFixed(2),
      totalPartsCost: totalPartsCost.toFixed(2),
      totalLoggedHours: totalLoggedHours.toFixed(2),
      grossProfit: grossProfit.toFixed(2),
      grossProfitMargin: grossProfitMargin,
      roCount: filteredData.length,
      vehicleCount: uniqueVehicleIds.size,
      efficiency: totalBillableHours > 0 ? ((totalLoggedHours / totalBillableHours) * 100).toFixed(1) : '0.0'
    };
  };

  const formatCurrency = (cents) => {
    if (!cents && cents !== 0) return '$0.00';
    return `$${(cents / 100).toFixed(2)}`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  const getTechnicianName = (technicianId) => {
    if (!technicianId) return 'N/A';
    return technicianMap[technicianId] || `Technician #${technicianId}`;
  };

  const calculateTechnicianStats = () => {
    const techStats = {};
    let debuggedJob = false;
    let totalJobsProcessed = 0;
    let jobsWithCompletedLabor = 0;
    let jobsWithoutTechnician = 0;
    let jobsNotAuthorized = 0;
    let jobsNotSelected = 0;
    let jobsInDateRange = 0;

    // Helper to check if job is in date range (only used in 'job' mode)
    const isJobInDateRange = (job) => {
      if (dateFilterMode !== 'job' || !job.completedDate) return true;
      
      const jobDate = new Date(job.completedDate);
      const jobDateOnly = new Date(jobDate.getFullYear(), jobDate.getMonth(), jobDate.getDate());
      const start = new Date(startDate + 'T00:00:00');
      const end = new Date(endDate + 'T23:59:59');
      const startDateOnly = new Date(start.getFullYear(), start.getMonth(), start.getDate());
      const endDateOnly = new Date(end.getFullYear(), end.getMonth(), end.getDate());
      
      return jobDateOnly >= startDateOnly && jobDateOnly <= endDateOnly;
    };

    filteredData.forEach(ro => {
      if (ro.jobs && ro.jobs.length > 0) {
        ro.jobs.forEach(job => {
          totalJobsProcessed++;
          
          // Skip jobs not in date range when in 'job' mode
          if (!isJobInDateRange(job)) return;
          
          jobsInDateRange++;
          
          // Debug first job to see what fields are available
          if (!debuggedJob && job.labor && job.labor.length > 0) {
            console.log('=== JOB DATA DEBUG ===');
            console.log('Sample job:', job);
            console.log('authorized:', job.authorized);
            console.log('selected:', job.selected);
            console.log('loggedHours:', job.loggedHours);
            console.log('All job keys:', Object.keys(job));
            console.log('Sample labor item:', job.labor[0]);
            console.log('Labor item keys:', Object.keys(job.labor[0]));
            debuggedJob = true;
            
            if (!job.loggedHours && !job.clockedHours && !job.actualHours) {
              console.warn('⚠️ No logged/clocked hours field found in job data. Clocked time will show as 0.00');
            }
          }

          // Track why jobs might be excluded
          if (!job.authorized) jobsNotAuthorized++;
          if (!job.selected) jobsNotSelected++;
          if (!job.technicianId) jobsWithoutTechnician++;

          // Check for labor items
          const completedLaborItems = job.labor?.filter(l => l.complete) || [];
          const allLaborItems = job.labor || [];
          
          if (completedLaborItems.length > 0) {
            jobsWithCompletedLabor++;
          }
          
          // Count all jobs that have labor items (completed or not) and are authorized
          // This seems to match Tekmetric's logic better
          if (allLaborItems.length > 0 && job.authorized) {
            const techId = job.technicianId || 'unassigned';
            
            if (!techStats[techId]) {
              techStats[techId] = {
                name: techId === 'unassigned' ? 'Unassigned' : getTechnicianName(techId),
                jobCount: 0,
                billedTime: 0,
                clockedTime: 0,
                laborSales: 0
              };
            }

            // Count this job
            techStats[techId].jobCount += 1;

            // Sum billed time from ALL labor items (not just completed)
            // This matches Tekmetric's "Billed Time" which is the sold hours
            allLaborItems.forEach(labor => {
              techStats[techId].billedTime += parseFloat(labor.hours || 0);
            });

            // Add clocked time (logged hours) - try multiple possible fields
            const loggedHours = parseFloat(job.loggedHours || job.clockedHours || job.actualHours || 0);
            techStats[techId].clockedTime += loggedHours;

            // Add labor sales (this is the sold labor amount)
            techStats[techId].laborSales += (job.laborTotal || 0) / 100;
          }
        });
      }
    });

    // Log statistics
    console.log('=== JOB COUNTING STATS ===');
    console.log('Date filter mode:', dateFilterMode);
    console.log('Total jobs processed:', totalJobsProcessed);
    console.log('Jobs in date range:', jobsInDateRange);
    console.log('Jobs with completed labor:', jobsWithCompletedLabor);
    console.log('Jobs without technician:', jobsWithoutTechnician);
    console.log('Jobs not authorized:', jobsNotAuthorized);
    console.log('Jobs not selected:', jobsNotSelected);
    console.log('Jobs counted in report:', Object.values(techStats).reduce((sum, t) => sum + t.jobCount, 0));
    console.log('=== END STATS ===');

    // Convert to array and calculate efficiency
    return Object.keys(techStats).map(techId => {
      const stats = techStats[techId];
      const efficiency = stats.billedTime > 0 
        ? ((stats.clockedTime / stats.billedTime) * 100).toFixed(1)
        : 'N/A';
      
      return {
        technicianId: techId,
        ...stats,
        efficiency
      };
    }).sort((a, b) => b.billedTime - a.billedTime); // Sort by billed time descending
  };

  const toggleExpandRO = (roId) => {
    setExpandedRO(expandedRO === roId ? null : roId);
  };

  const handleJobClick = (job, e) => {
    e.stopPropagation(); // Prevent row click from toggling expand
    setSelectedJob(job);
    setShowJobModal(true);
  };

  const handleCloseJobModal = () => {
    setShowJobModal(false);
    setSelectedJob(null);
  };

  const metrics = calculateMetrics();

  return (
    <div>
      <div className="card">
        <h2>Reports - Repair Orders & Jobs Analysis</h2>
        
        {/* Date Range Filter */}
        <div style={{ 
          display: 'flex', 
          gap: '1rem', 
          marginBottom: '1.5rem', 
          alignItems: 'flex-end',
          padding: '1.5rem',
          backgroundColor: '#f9fafb',
          borderRadius: '8px',
          flexWrap: 'wrap'
        }}>
          <div className="form-group" style={{ margin: 0, flex: 1, minWidth: '150px' }}>
            <label>Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              style={{ width: '100%' }}
            />
          </div>
          <div className="form-group" style={{ margin: 0, flex: 1, minWidth: '150px' }}>
            <label>End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              style={{ width: '100%' }}
            />
          </div>
          <div className="form-group" style={{ margin: 0, flex: 1, minWidth: '220px' }}>
            <label>Date Filter Type</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="dateFilterMode"
                  value="ro"
                  checked={dateFilterMode === 'ro'}
                  onChange={(e) => setDateFilterMode(e.target.value)}
                  style={{ width: 'auto', margin: 0 }}
                />
                <span style={{ fontSize: '0.9rem' }}>Filter by Repair Order dates</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="dateFilterMode"
                  value="job"
                  checked={dateFilterMode === 'job'}
                  onChange={(e) => setDateFilterMode(e.target.value)}
                  style={{ width: 'auto', margin: 0 }}
                />
                <span style={{ fontSize: '0.9rem', fontWeight: '600', color: '#2563eb' }}>Filter by Job Completion dates</span>
              </label>
            </div>
          </div>
          {dateFilterMode === 'ro' && (
            <div className="form-group" style={{ margin: 0, flex: 1, minWidth: '180px' }}>
              <label>RO Date Field</label>
              <select
                value={dateFilterField}
                onChange={(e) => setDateFilterField(e.target.value)}
                style={{ width: '100%' }}
              >
                <option value="completedDate">Completed Date</option>
                <option value="postedDate">Posted Date</option>
                <option value="createdDate">Created Date</option>
              </select>
            </div>
          )}
          <button 
            className="btn btn-primary" 
            onClick={loadRepairOrders}
            disabled={loading}
            style={{ marginBottom: 0 }}
          >
            {loading ? 'Loading...' : 'Generate Report'}
          </button>
        </div>

        {paginationWarning && (
          <div style={{ 
            padding: '0.75rem 1rem', 
            backgroundColor: '#fef3c7', 
            borderRadius: '6px',
            marginBottom: '1rem',
            fontSize: '0.9rem',
            color: '#92400e',
            border: '1px solid #fbbf24'
          }}>
            <strong>⚠️ Pagination Warning:</strong> {paginationWarning}
          </div>
        )}

        {repairOrders.length > 0 && (
          <div style={{ 
            padding: '0.75rem 1rem', 
            backgroundColor: '#e0f2fe', 
            borderRadius: '6px',
            marginBottom: '1rem',
            fontSize: '0.9rem',
            color: '#0c4a6e'
          }}>
            <strong>Data Info:</strong> Found {repairOrders.length} repair orders in the selected date range.
            {filteredData.length < repairOrders.length && (
              <span> Showing {filteredData.length} after applying filters.</span>
            )}
          </div>
        )}

        {error && (
          <div className="alert alert-error" style={{ marginTop: '1rem' }}>
            <strong>Error:</strong> {error}
          </div>
        )}

        {/* Additional Filters */}
        {repairOrders.length > 0 && (
          <div style={{ 
            display: 'flex', 
            gap: '1rem', 
            marginBottom: '1.5rem',
            flexWrap: 'wrap',
            padding: '1.5rem',
            backgroundColor: '#f9fafb',
            borderRadius: '8px'
          }}>
            <div className="form-group" style={{ margin: 0, flex: 1, minWidth: '200px' }}>
              <label>Filter by Technician</label>
              <select
                multiple
                value={selectedTechnicians}
                onChange={(e) => {
                  const options = Array.from(e.target.selectedOptions, option => option.value);
                  setSelectedTechnicians(options);
                }}
                style={{ 
                  width: '100%', 
                  minHeight: '80px',
                  padding: '0.5rem'
                }}
              >
                {employees.map(emp => (
                  <option key={emp.id} value={emp.id.toString()}>
                    {`${emp.firstName || ''} ${emp.lastName || ''}`.trim() || `Employee #${emp.id}`}
                  </option>
                ))}
              </select>
              <small style={{ color: '#6b7280', fontSize: '0.75rem', marginTop: '0.25rem', display: 'block' }}>
                Hold Ctrl/Cmd to select multiple
              </small>
            </div>

            <div className="form-group" style={{ margin: 0, flex: 1, minWidth: '200px' }}>
              <label>Filter by RO Status</label>
              <select
                multiple
                value={selectedStatuses}
                onChange={(e) => {
                  const options = Array.from(e.target.selectedOptions, option => option.value);
                  setSelectedStatuses(options);
                }}
                style={{ 
                  width: '100%', 
                  minHeight: '100px',
                  padding: '0.5rem'
                }}
              >
                <option value="ESTIMATE">Estimate</option>
                <option value="WORKINPROGRESS">Work-in-Progress</option>
                <option value="COMPLETE">Complete</option>
                <option value="SAVEDFORLATER">Saved for Later</option>
                <option value="POSTED">Posted</option>
                <option value="ACCOUNTSRECEIVABLE">Accounts Receivable</option>
                <option value="DELETED">Deleted</option>
              </select>
              <small style={{ color: '#6b7280', fontSize: '0.75rem', marginTop: '0.25rem', display: 'block' }}>
                Hold Ctrl/Cmd to select multiple
              </small>
            </div>

            <div className="form-group" style={{ margin: 0, flex: 1, minWidth: '220px' }}>
              <label>Job Filters</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <input
                    type="checkbox"
                    id="completedLaborOnly"
                    checked={showCompletedLabor}
                    onChange={(e) => setShowCompletedLabor(e.target.checked)}
                    style={{ width: 'auto', margin: 0 }}
                  />
                  <label htmlFor="completedLaborOnly" style={{ margin: 0, cursor: 'pointer', fontSize: '0.9rem' }}>
                    Job Completed (labor items)
                  </label>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <input
                    type="checkbox"
                    id="authorizedOnly"
                    checked={showAuthorizedOnly}
                    onChange={(e) => setShowAuthorizedOnly(e.target.checked)}
                    style={{ width: 'auto', margin: 0 }}
                  />
                  <label htmlFor="authorizedOnly" style={{ margin: 0, cursor: 'pointer', fontSize: '0.9rem' }}>
                    Approved Services (authorized)
                  </label>
                </div>
              </div>
            </div>

            {(selectedTechnicians.length > 0 || selectedStatuses.length > 0 || showCompletedLabor || showAuthorizedOnly) && (
              <div style={{ display: 'flex', alignItems: 'flex-end', minWidth: '120px' }}>
                <button 
                  className="btn btn-secondary" 
                  onClick={() => {
                    setSelectedTechnicians([]);
                    setSelectedStatuses([]);
                    setShowCompletedLabor(false);
                    setShowAuthorizedOnly(false);
                  }}
                  style={{ width: '100%' }}
                >
                  Clear Filters
                </button>
              </div>
            )}
          </div>
        )}

        {/* Metrics Summary */}
        {filteredData.length > 0 && (
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '1rem',
            marginBottom: '2rem'
          }}>
            <div className="metric-card" style={{
              padding: '1.5rem',
              backgroundColor: '#f0f9ff',
              borderRadius: '8px',
              border: '2px solid #3b82f6'
            }}>
              <div style={{ fontSize: '0.85rem', color: '#1e40af', fontWeight: '600', marginBottom: '0.5rem' }}>
                REPAIR ORDERS
              </div>
              <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#1e3a8a' }}>
                {metrics.roCount}
              </div>
            </div>

            <div className="metric-card" style={{
              padding: '1.5rem',
              backgroundColor: '#fef3c7',
              borderRadius: '8px',
              border: '2px solid #f59e0b'
            }}>
              <div style={{ fontSize: '0.85rem', color: '#92400e', fontWeight: '600', marginBottom: '0.5rem' }}>
                VEHICLES SERVICED
              </div>
              <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#78350f' }}>
                {metrics.vehicleCount}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#a16207', marginTop: '0.25rem' }}>
                Unique cars
              </div>
            </div>

            <div className="metric-card" style={{
              padding: '1.5rem',
              backgroundColor: '#f0fdf4',
              borderRadius: '8px',
              border: '2px solid #10b981'
            }}>
              <div style={{ fontSize: '0.85rem', color: '#065f46', fontWeight: '600', marginBottom: '0.5rem' }}>
                BILLABLE HOURS
              </div>
              <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#064e3b' }}>
                {metrics.totalBillableHours}
              </div>
            </div>

            <div className="metric-card" style={{
              padding: '1.5rem',
              backgroundColor: '#fef3c7',
              borderRadius: '8px',
              border: '2px solid #f59e0b'
            }}>
              <div style={{ fontSize: '0.85rem', color: '#92400e', fontWeight: '600', marginBottom: '0.5rem' }}>
                LOGGED HOURS
              </div>
              <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#78350f' }}>
                {metrics.totalLoggedHours}
              </div>
            </div>

            <div className="metric-card" style={{
              padding: '1.5rem',
              backgroundColor: '#fce7f3',
              borderRadius: '8px',
              border: '2px solid #ec4899'
            }}>
              <div style={{ fontSize: '0.85rem', color: '#9f1239', fontWeight: '600', marginBottom: '0.5rem' }}>
                EFFICIENCY
              </div>
              <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#881337' }}>
                {metrics.efficiency}%
              </div>
            </div>

            <div className="metric-card" style={{
              padding: '1.5rem',
              backgroundColor: '#f0fdf4',
              borderRadius: '8px',
              border: '2px solid #10b981'
            }}>
              <div style={{ fontSize: '0.85rem', color: '#065f46', fontWeight: '600', marginBottom: '0.5rem' }}>
                SOLD LABOR
              </div>
              <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#064e3b' }}>
                ${metrics.totalLaborSales}
              </div>
            </div>

            <div className="metric-card" style={{
              padding: '1.5rem',
              backgroundColor: '#ede9fe',
              borderRadius: '8px',
              border: '2px solid #8b5cf6'
            }}>
              <div style={{ fontSize: '0.85rem', color: '#5b21b6', fontWeight: '600', marginBottom: '0.5rem' }}>
                TOTAL PARTS
              </div>
              <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#4c1d95' }}>
                ${metrics.totalPartsSales}
              </div>
            </div>

            <div className="metric-card" style={{
              padding: '1.5rem',
              backgroundColor: '#dcfce7',
              borderRadius: '8px',
              border: '2px solid #22c55e'
            }}>
              <div style={{ fontSize: '0.85rem', color: '#14532d', fontWeight: '600', marginBottom: '0.5rem' }}>
                TOTAL SALES
              </div>
              <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#14532d' }}>
                ${metrics.totalSales}
              </div>
            </div>

            <div className="metric-card" style={{
              padding: '1.5rem',
              backgroundColor: '#fef9c3',
              borderRadius: '8px',
              border: '2px solid #eab308'
            }}>
              <div style={{ fontSize: '0.85rem', color: '#713f12', fontWeight: '600', marginBottom: '0.5rem' }}>
                GROSS PROFIT
              </div>
              <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#713f12' }}>
                ${metrics.grossProfit}
              </div>
              <div style={{ fontSize: '0.9rem', color: '#854d0e', marginTop: '0.5rem', fontWeight: '600' }}>
                {metrics.grossProfitMargin}% Margin
              </div>
              <div style={{ fontSize: '0.7rem', color: '#a16207', marginTop: '0.25rem' }}>
                (Sales - Parts Cost)
              </div>
            </div>
          </div>
        )}

        {/* Repair Orders List */}
        {loading ? (
          <div className="spinner"></div>
        ) : filteredData.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#6b7280' }}>
            {startDate && endDate ? 'No completed repair orders found in the selected date range.' : 'Select a date range and click "Generate Report" to view data.'}
          </div>
        ) : (
          <div>
            <h3 style={{ marginBottom: '1rem', color: '#374151' }}>
              {dateFilterMode === 'job' 
                ? `Repair Orders with Jobs Completed in Date Range (${filteredData.length})`
                : `Repair Orders (${filteredData.length})`
              }
            </h3>
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th style={{ width: '40px' }}></th>
                    <th>RO #</th>
                    <th>Status</th>
                    <th>Completed Date</th>
                    <th>Jobs</th>
                    <th>Billable Hrs</th>
                    <th>Logged Hrs</th>
                    <th>Labor $</th>
                    <th>Parts $</th>
                    <th>Total Sales</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredData.map((ro) => {
                    const isExpanded = expandedRO === ro.id;
                    const allJobs = ro.jobs || [];
                    // Calculate billable hours from COMPLETED labor items only
                    const billableHours = allJobs.reduce((sum, j) => {
                      if (j.labor && j.labor.length > 0) {
                        return sum + j.labor.reduce((laborSum, laborItem) => {
                          // Only count completed labor items
                          return laborSum + (laborItem.complete ? parseFloat(laborItem.hours || 0) : 0);
                        }, 0);
                      }
                      return sum;
                    }, 0);
                    // Logged hours - only from jobs with completed labor items
                    const loggedHours = allJobs.reduce((sum, j) => {
                      const hasCompletedLabor = j.labor && j.labor.some(l => l.complete);
                      return sum + (hasCompletedLabor ? parseFloat(j.loggedHours || 0) : 0);
                    }, 0);

                    return (
                      <React.Fragment key={ro.id}>
                        <tr 
                          onClick={() => toggleExpandRO(ro.id)}
                          style={{ cursor: 'pointer', backgroundColor: isExpanded ? '#f9fafb' : 'transparent' }}
                        >
                          <td style={{ textAlign: 'center' }}>
                            <span style={{ fontSize: '1.2rem', color: '#6b7280' }}>
                              {isExpanded ? '▼' : '▶'}
                            </span>
                          </td>
                          <td><strong>#{ro.repairOrderNumber || ro.id}</strong></td>
                          <td>
                            <span style={{
                              padding: '0.25rem 0.75rem',
                              borderRadius: '12px',
                              fontSize: '0.75rem',
                              fontWeight: '600',
                              color: 'white',
                              backgroundColor: ro.repairOrderStatus?.code === 'COMPLETE' ? '#10b981' : '#059669'
                            }}>
                              {ro.repairOrderStatus?.name || 'Unknown'}
                            </span>
                          </td>
                          <td>{formatDate(ro.completedDate)}</td>
                          <td style={{ textAlign: 'center' }}>
                            {ro.jobs?.length || 0}
                          </td>
                          <td style={{ textAlign: 'right', fontWeight: '600' }}>
                            {billableHours.toFixed(2)}
                          </td>
                          <td style={{ textAlign: 'right', fontWeight: '600' }}>
                            {loggedHours.toFixed(2)}
                          </td>
                          <td style={{ textAlign: 'right' }}>{formatCurrency(ro.laborSales)}</td>
                          <td style={{ textAlign: 'right' }}>{formatCurrency(ro.partsSales)}</td>
                          <td style={{ textAlign: 'right', fontWeight: 'bold' }}>{formatCurrency(ro.totalSales)}</td>
                        </tr>
                        
                        {/* Expanded Jobs Details */}
                        {isExpanded && ro.jobs && ro.jobs.length > 0 && (
                          <tr>
                            <td colSpan="10" style={{ padding: 0, backgroundColor: '#f9fafb' }}>
                              <div style={{ padding: '1rem 2rem' }}>
                                <h4 style={{ marginBottom: '0.75rem', color: '#374151' }}>Jobs Details</h4>
                                <table style={{ width: '100%', backgroundColor: 'white' }}>
                                  <thead>
                                    <tr style={{ backgroundColor: '#f3f4f6' }}>
                                      <th>Job Name</th>
                                      <th>Status</th>
                                      <th>Technician</th>
                                      <th>Labor Hrs</th>
                                      <th>Logged Hrs</th>
                                      <th>Labor $</th>
                                      <th>Parts $</th>
                                      <th>Subtotal</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {ro.jobs.map((job) => {
                                      // Calculate billable hours from COMPLETED labor items only
                                      const jobBillableHours = job.labor && job.labor.length > 0
                                        ? job.labor.reduce((sum, laborItem) => {
                                            return sum + (laborItem.complete ? parseFloat(laborItem.hours || 0) : 0);
                                          }, 0)
                                        : 0;
                                      
                                      // Check if job has any completed labor items
                                      const hasCompletedLabor = job.labor && job.labor.some(l => l.complete);
                                      
                                      return (
                                        <tr 
                                          key={job.id}
                                          onClick={(e) => handleJobClick(job, e)}
                                          style={{ cursor: 'pointer' }}
                                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
                                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                        >
                                          <td>{job.name}</td>
                                          <td>
                                            <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap' }}>
                                              {job.completed && (
                                                <span style={{
                                                  padding: '0.15rem 0.5rem',
                                                  borderRadius: '8px',
                                                  fontSize: '0.7rem',
                                                  fontWeight: '600',
                                                  backgroundColor: '#d1fae5',
                                                  color: '#065f46'
                                                }}>
                                                  ✓ Complete
                                                </span>
                                              )}
                                              {job.authorized && (
                                                <span style={{
                                                  padding: '0.15rem 0.5rem',
                                                  borderRadius: '8px',
                                                  fontSize: '0.7rem',
                                                  fontWeight: '600',
                                                  backgroundColor: '#dbeafe',
                                                  color: '#1e40af'
                                                }}>
                                                  Auth
                                                </span>
                                              )}
                                            </div>
                                          </td>
                                          <td>{getTechnicianName(job.technicianId)}</td>
                                          <td style={{ textAlign: 'right' }}>
                                            {jobBillableHours.toFixed(2)}
                                          </td>
                                          <td style={{ textAlign: 'right' }}>
                                            {hasCompletedLabor && job.loggedHours ? parseFloat(job.loggedHours).toFixed(2) : '0.00'}
                                          </td>
                                          <td style={{ textAlign: 'right' }}>{formatCurrency(job.laborTotal)}</td>
                                          <td style={{ textAlign: 'right' }}>{formatCurrency(job.partsTotal)}</td>
                                          <td style={{ textAlign: 'right', fontWeight: 'bold' }}>
                                            {formatCurrency(job.subtotal)}
                                          </td>
                                        </tr>
                                      );
                                    })}
                                  </tbody>
                                </table>
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
          </div>
        )}

        {/* Technician Performance Table */}
        {filteredData.length > 0 && (
          <div style={{ marginTop: '2rem' }}>
            <h3 style={{ marginBottom: '1rem', color: '#374151' }}>
              Technician Performance
            </h3>
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th style={{ textAlign: 'left' }}>Employee</th>
                    <th style={{ textAlign: 'center' }}>Jobs</th>
                    <th style={{ textAlign: 'right' }}>Billed Time</th>
                    <th style={{ textAlign: 'right' }}>Clocked Time</th>
                    <th style={{ textAlign: 'right' }}>Efficiency</th>
                    <th style={{ textAlign: 'right' }}>Labor Sales</th>
                  </tr>
                </thead>
                <tbody>
                  {(() => {
                    const techStats = calculateTechnicianStats();
                    const totals = techStats.reduce((acc, tech) => ({
                      jobCount: acc.jobCount + tech.jobCount,
                      billedTime: acc.billedTime + tech.billedTime,
                      clockedTime: acc.clockedTime + tech.clockedTime,
                      laborSales: acc.laborSales + tech.laborSales
                    }), { jobCount: 0, billedTime: 0, clockedTime: 0, laborSales: 0 });

                    const totalEfficiency = totals.billedTime > 0 
                      ? ((totals.clockedTime / totals.billedTime) * 100).toFixed(1)
                      : 'N/A';

                    return (
                      <>
                        {/* Total Row */}
                        <tr style={{ backgroundColor: '#fef3c7', fontWeight: 'bold' }}>
                          <td>TOTAL</td>
                          <td style={{ textAlign: 'center' }}>{totals.jobCount} jobs</td>
                          <td style={{ textAlign: 'right' }}>{totals.billedTime.toFixed(2)} hrs</td>
                          <td style={{ textAlign: 'right' }}>{totals.clockedTime.toFixed(2)} hrs</td>
                          <td style={{ textAlign: 'right' }}>{totalEfficiency}{totalEfficiency !== 'N/A' ? '%' : ''}</td>
                          <td style={{ textAlign: 'right' }}>${totals.laborSales.toFixed(2)}</td>
                        </tr>

                        {/* Individual Technician Rows */}
                        {techStats.map((tech) => (
                          <tr key={tech.technicianId}>
                            <td>
                              <span style={{ color: '#3b82f6', fontWeight: '500' }}>
                                {tech.name}
                              </span>
                            </td>
                            <td style={{ textAlign: 'center' }}>{tech.jobCount}</td>
                            <td style={{ textAlign: 'right' }}>{tech.billedTime.toFixed(2)} hrs</td>
                            <td style={{ textAlign: 'right' }}>{tech.clockedTime.toFixed(2)} hrs</td>
                            <td style={{ textAlign: 'right' }}>
                              {tech.efficiency !== 'N/A' ? `${tech.efficiency}%` : 'N/A'}
                            </td>
                            <td style={{ textAlign: 'right' }}>${tech.laborSales.toFixed(2)}</td>
                          </tr>
                        ))}

                        {/* Unassigned Row (if any jobs without technician) */}
                        {techStats.length === 0 && (
                          <tr>
                            <td colSpan="6" style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>
                              No technician data available for the selected filters
                            </td>
                          </tr>
                        )}
                      </>
                    );
                  })()}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Job Details Modal */}
      {showJobModal && selectedJob && (
        <div className="modal-overlay" onClick={handleCloseJobModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '1000px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="modal-header">
              <h2>Job: {selectedJob.name}</h2>
              <button className="modal-close" onClick={handleCloseJobModal}>&times;</button>
            </div>

            {/* Basic Information */}
            <div style={{ marginBottom: '2rem', padding: '1.5rem', backgroundColor: '#f9fafb', borderRadius: '8px' }}>
              <h3 style={{ marginBottom: '1rem', color: '#374151', fontSize: '1.1rem' }}>Basic Information</h3>
              
              <div className="grid" style={{ gridTemplateColumns: '1fr 1fr 1fr' }}>
                <div className="form-group">
                  <label>Job ID</label>
                  <input
                    type="text"
                    value={selectedJob.id}
                    disabled
                    style={{ backgroundColor: '#e5e7eb', cursor: 'not-allowed' }}
                  />
                </div>
                <div className="form-group">
                  <label>Repair Order ID</label>
                  <input
                    type="text"
                    value={selectedJob.repairOrderId}
                    disabled
                    style={{ backgroundColor: '#e5e7eb', cursor: 'not-allowed' }}
                  />
                </div>
                <div className="form-group">
                  <label>Sort Order</label>
                  <input
                    type="text"
                    value={selectedJob.sort || 'N/A'}
                    disabled
                    style={{ backgroundColor: '#e5e7eb', cursor: 'not-allowed' }}
                  />
                </div>
              </div>

              <div className="grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
                <div className="form-group">
                  <label>Customer ID</label>
                  <input
                    type="text"
                    value={selectedJob.customerId}
                    disabled
                    style={{ backgroundColor: '#e5e7eb', cursor: 'not-allowed' }}
                  />
                </div>
                <div className="form-group">
                  <label>Vehicle ID</label>
                  <input
                    type="text"
                    value={selectedJob.vehicleId}
                    disabled
                    style={{ backgroundColor: '#e5e7eb', cursor: 'not-allowed' }}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Job Name</label>
                <input
                  type="text"
                  value={selectedJob.name}
                  disabled
                  style={{ backgroundColor: '#e5e7eb', cursor: 'not-allowed' }}
                />
              </div>

              <div className="form-group">
                <label>Job Category</label>
                <input
                  type="text"
                  value={selectedJob.jobCategoryName || 'N/A'}
                  disabled
                  style={{ backgroundColor: '#e5e7eb', cursor: 'not-allowed' }}
                />
              </div>

              {selectedJob.note && (
                <div className="form-group">
                  <label>Notes</label>
                  <textarea
                    value={selectedJob.note}
                    disabled
                    rows="3"
                    style={{ backgroundColor: '#e5e7eb', cursor: 'not-allowed' }}
                  />
                </div>
              )}
            </div>

            {/* Status & Authorization */}
            <div style={{ marginBottom: '2rem', padding: '1.5rem', backgroundColor: '#f9fafb', borderRadius: '8px' }}>
              <h3 style={{ marginBottom: '1rem', color: '#374151', fontSize: '1.1rem' }}>Status & Authorization</h3>
              
              <div className="grid" style={{ gridTemplateColumns: '1fr 1fr 1fr' }}>
                <div className="form-group">
                  <label>Authorized</label>
                  <input
                    type="text"
                    value={selectedJob.authorized ? 'Yes' : 'No'}
                    disabled
                    style={{ 
                      backgroundColor: '#e5e7eb', 
                      cursor: 'not-allowed',
                      color: selectedJob.authorized ? '#10b981' : '#dc2626',
                      fontWeight: 'bold'
                    }}
                  />
                </div>
                <div className="form-group">
                  <label>Selected</label>
                  <input
                    type="text"
                    value={selectedJob.selected ? 'Yes' : 'No'}
                    disabled
                    style={{ 
                      backgroundColor: '#e5e7eb', 
                      cursor: 'not-allowed',
                      color: selectedJob.selected ? '#3b82f6' : '#6b7280'
                    }}
                  />
                </div>
                <div className="form-group">
                  <label>Completed</label>
                  <input
                    type="text"
                    value={selectedJob.completed ? 'Yes' : 'No'}
                    disabled
                    style={{ 
                      backgroundColor: '#e5e7eb', 
                      cursor: 'not-allowed',
                      color: selectedJob.completed ? '#10b981' : '#6b7280',
                      fontWeight: 'bold'
                    }}
                  />
                </div>
              </div>

              {selectedJob.authorizedDate && (
                <div className="form-group">
                  <label>Authorized Date</label>
                  <input
                    type="text"
                    value={new Date(selectedJob.authorizedDate).toLocaleString()}
                    disabled
                    style={{ backgroundColor: '#e5e7eb', cursor: 'not-allowed' }}
                  />
                </div>
              )}

              {selectedJob.completedDate && (
                <div className="form-group">
                  <label>Completed Date</label>
                  <input
                    type="text"
                    value={new Date(selectedJob.completedDate).toLocaleString()}
                    disabled
                    style={{ backgroundColor: '#e5e7eb', cursor: 'not-allowed' }}
                  />
                </div>
              )}
            </div>

            {/* Technician & Hours */}
            <div style={{ marginBottom: '2rem', padding: '1.5rem', backgroundColor: '#f9fafb', borderRadius: '8px' }}>
              <h3 style={{ marginBottom: '1rem', color: '#374151', fontSize: '1.1rem' }}>Technician & Hours</h3>
              
              <div className="grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
                <div className="form-group">
                  <label>Technician</label>
                  <input
                    type="text"
                    value={getTechnicianName(selectedJob.technicianId)}
                    disabled
                    style={{ backgroundColor: '#e5e7eb', cursor: 'not-allowed' }}
                  />
                </div>
                <div className="form-group">
                  <label>Logged Hours</label>
                  <input
                    type="text"
                    value={selectedJob.loggedHours || '0.00'}
                    disabled
                    style={{ backgroundColor: '#e5e7eb', cursor: 'not-allowed' }}
                  />
                </div>
              </div>
            </div>

            {/* Financial Summary */}
            <div style={{ marginBottom: '2rem', padding: '1.5rem', backgroundColor: '#f9fafb', borderRadius: '8px' }}>
              <h3 style={{ marginBottom: '1rem', color: '#374151', fontSize: '1.1rem' }}>Financial Summary</h3>
              
              <div className="grid" style={{ gridTemplateColumns: '1fr 1fr 1fr 1fr' }}>
                <div className="form-group">
                  <label>Labor Total</label>
                  <input
                    type="text"
                    value={formatCurrency(selectedJob.laborTotal)}
                    disabled
                    style={{ backgroundColor: '#e5e7eb', cursor: 'not-allowed' }}
                  />
                </div>
                <div className="form-group">
                  <label>Parts Total</label>
                  <input
                    type="text"
                    value={formatCurrency(selectedJob.partsTotal)}
                    disabled
                    style={{ backgroundColor: '#e5e7eb', cursor: 'not-allowed' }}
                  />
                </div>
                <div className="form-group">
                  <label>Fees Total</label>
                  <input
                    type="text"
                    value={formatCurrency(selectedJob.feeTotal)}
                    disabled
                    style={{ backgroundColor: '#e5e7eb', cursor: 'not-allowed' }}
                  />
                </div>
                <div className="form-group">
                  <label>Discounts</label>
                  <input
                    type="text"
                    value={formatCurrency(selectedJob.discountTotal)}
                    disabled
                    style={{ backgroundColor: '#e5e7eb', cursor: 'not-allowed', color: '#dc2626' }}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Subtotal</label>
                <input
                  type="text"
                  value={formatCurrency(selectedJob.subtotal)}
                  disabled
                  style={{ backgroundColor: '#e5e7eb', cursor: 'not-allowed', fontWeight: 'bold', fontSize: '1.1rem' }}
                />
              </div>
            </div>

            {/* Labor Items */}
            {selectedJob.labor && selectedJob.labor.length > 0 && (
              <div style={{ marginBottom: '2rem', padding: '1.5rem', backgroundColor: '#f9fafb', borderRadius: '8px' }}>
                <h3 style={{ marginBottom: '1rem', color: '#374151', fontSize: '1.1rem' }}>Labor Items ({selectedJob.labor.length})</h3>
                {selectedJob.labor.map((labor) => (
                  <div key={labor.id} style={{ 
                    padding: '1rem', 
                    backgroundColor: 'white', 
                    borderRadius: '6px', 
                    marginBottom: '0.75rem',
                    border: '1px solid #e5e7eb'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <strong>{labor.name}</strong>
                        {labor.complete && <span style={{ marginLeft: '0.5rem', color: '#10b981', fontSize: '0.85rem' }}>✓ Complete</span>}
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div><strong>{formatCurrency(labor.rate)}</strong></div>
                        <div style={{ fontSize: '0.85rem', color: '#6b7280' }}>{labor.hours} hours</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Parts */}
            {selectedJob.parts && selectedJob.parts.length > 0 && (
              <div style={{ marginBottom: '2rem', padding: '1.5rem', backgroundColor: '#f9fafb', borderRadius: '8px' }}>
                <h3 style={{ marginBottom: '1rem', color: '#374151', fontSize: '1.1rem' }}>Parts ({selectedJob.parts.length})</h3>
                {selectedJob.parts.map((part) => (
                  <div key={part.id} style={{ 
                    padding: '1rem', 
                    backgroundColor: 'white', 
                    borderRadius: '6px', 
                    marginBottom: '0.75rem',
                    border: '1px solid #e5e7eb'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                      <div style={{ flex: 1 }}>
                        <div><strong>{part.name || part.model || 'Part'}</strong></div>
                        {part.brand && <div style={{ fontSize: '0.85rem', color: '#6b7280' }}>Brand: {part.brand}</div>}
                        {part.partNumber && <div style={{ fontSize: '0.85rem', color: '#6b7280' }}>Part #: {part.partNumber}</div>}
                        {part.description && <div style={{ fontSize: '0.85rem', color: '#6b7280', marginTop: '0.25rem' }}>{part.description}</div>}
                        <div style={{ fontSize: '0.85rem', color: '#6b7280', marginTop: '0.25rem' }}>
                          Type: {part.partType?.name || 'N/A'} | Qty: {part.quantity}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right', minWidth: '120px' }}>
                        <div><strong>{formatCurrency(part.retail)}</strong></div>
                        <div style={{ fontSize: '0.85rem', color: '#6b7280' }}>Cost: {formatCurrency(part.cost)}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Fees & Discounts */}
            {((selectedJob.fees && selectedJob.fees.length > 0) || (selectedJob.discounts && selectedJob.discounts.length > 0)) && (
              <div style={{ marginBottom: '2rem', padding: '1.5rem', backgroundColor: '#f9fafb', borderRadius: '8px' }}>
                <div className="grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
                  {selectedJob.fees && selectedJob.fees.length > 0 && (
                    <div>
                      <h4 style={{ marginBottom: '0.5rem', color: '#374151' }}>Fees</h4>
                      {selectedJob.fees.map((fee) => (
                        <div key={fee.id} style={{ fontSize: '0.9rem', marginBottom: '0.25rem', padding: '0.5rem', backgroundColor: 'white', borderRadius: '4px' }}>
                          {fee.name}: <strong>{formatCurrency(fee.total)}</strong>
                        </div>
                      ))}
                    </div>
                  )}
                  {selectedJob.discounts && selectedJob.discounts.length > 0 && (
                    <div>
                      <h4 style={{ marginBottom: '0.5rem', color: '#374151' }}>Discounts</h4>
                      {selectedJob.discounts.map((discount) => (
                        <div key={discount.id} style={{ fontSize: '0.9rem', marginBottom: '0.25rem', padding: '0.5rem', backgroundColor: 'white', borderRadius: '4px', color: '#dc2626' }}>
                          {discount.name}: <strong>{formatCurrency(discount.total)}</strong>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Dates */}
            <div style={{ marginBottom: '2rem', padding: '1.5rem', backgroundColor: '#f9fafb', borderRadius: '8px' }}>
              <h3 style={{ marginBottom: '1rem', color: '#374151', fontSize: '1.1rem' }}>Dates</h3>
              <div className="grid" style={{ gridTemplateColumns: '1fr 1fr 1fr' }}>
                <div className="form-group">
                  <label>Created Date</label>
                  <input
                    type="text"
                    value={selectedJob.createdDate ? new Date(selectedJob.createdDate).toLocaleString() : 'N/A'}
                    disabled
                    style={{ backgroundColor: '#e5e7eb', cursor: 'not-allowed' }}
                  />
                </div>
                <div className="form-group">
                  <label>Updated Date</label>
                  <input
                    type="text"
                    value={selectedJob.updatedDate ? new Date(selectedJob.updatedDate).toLocaleString() : 'N/A'}
                    disabled
                    style={{ backgroundColor: '#e5e7eb', cursor: 'not-allowed' }}
                  />
                </div>
                <div className="form-group">
                  <label>Completed Date</label>
                  <input
                    type="text"
                    value={selectedJob.completedDate ? new Date(selectedJob.completedDate).toLocaleString() : 'N/A'}
                    disabled
                    style={{ backgroundColor: '#e5e7eb', cursor: 'not-allowed' }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Reports;
