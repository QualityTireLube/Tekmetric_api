import React, { useState, useEffect } from 'react';
import { getRepairOrders, getEmployees } from '../services/api';

/**
 * Weekly Operating Report - Drift-Proof Implementation
 * 
 * This component implements exact reporting definitions with strict date logic separation:
 * - Section A (Sales): Uses authorizedDate from Jobs
 * - Section B (Production): Uses postedDate from Repair Orders
 * - Section C (Cash): Uses updatedDate from Repair Orders
 * - Section D (Technician Productivity): Uses postedDate (hours turned)
 * - Section E (Service Writer Productivity): Uses authorizedDate (hours sold)
 * 
 * CRITICAL: These date fields are NEVER mixed. Each section has its own data source and filters.
 */
function WeeklyReport() {
  // Global Controls
  const [selectedShop, setSelectedShop] = useState('');
  const [weekStart, setWeekStart] = useState('');
  const [weekEnd, setWeekEnd] = useState('');
  const [employees, setEmployees] = useState([]); // Employee lookup for names
  
  // Loading and Error States (per section)
  const [loadingSales, setLoadingSales] = useState(false);
  const [loadingProduction, setLoadingProduction] = useState(false);
  const [loadingCash, setLoadingCash] = useState(false);
  const [errorSales, setErrorSales] = useState(null);
  const [errorProduction, setErrorProduction] = useState(null);
  const [errorCash, setErrorCash] = useState(null);
  
  // Data State
  const [salesData, setSalesData] = useState(null);
  const [productionData, setProductionData] = useState(null);
  const [cashData, setCashData] = useState(null);
  const [technicianData, setTechnicianData] = useState(null);
  const [serviceWriterData, setServiceWriterData] = useState(null);

  // Initialize with current week on mount
  useEffect(() => {
    const shop = localStorage.getItem('tekmetric_shop_id');
    if (shop) {
      setSelectedShop(shop);
    }
    
    // Set default to current week (Monday to Sunday)
    const today = new Date();
    const currentDay = today.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const daysToMonday = currentDay === 0 ? -6 : 1 - currentDay; // If Sunday, go back 6 days
    
    const monday = new Date(today);
    monday.setDate(today.getDate() + daysToMonday);
    monday.setHours(0, 0, 0, 0);
    
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);
    
    setWeekStart(monday.toISOString().split('T')[0]);
    setWeekEnd(sunday.toISOString().split('T')[0]);
  }, []);

  // Fetch employees when shop changes
  useEffect(() => {
    if (selectedShop) {
      fetchEmployees();
    }
  }, [selectedShop]);

  /**
   * Fetch employees for name lookup
   */
  const fetchEmployees = async () => {
    if (!selectedShop) return;
    
    try {
      console.log('📋 Fetching employees for name lookup...');
      const response = await getEmployees({ shop: selectedShop });
      const employeeList = response.data?.content || response.data || [];
      setEmployees(employeeList);
      console.log(`✅ Loaded ${employeeList.length} employees`);
    } catch (error) {
      console.warn('⚠️ Could not fetch employees:', error.message);
      // Non-critical - will show IDs instead of names
    }
  };

  /**
   * Get employee name by ID
   */
  const getEmployeeName = (employeeId) => {
    if (!employeeId) return 'Unknown';
    const employee = employees.find(emp => emp.id === employeeId);
    if (employee) {
      // Return full name or firstName + lastName
      return employee.name || `${employee.firstName || ''} ${employee.lastName || ''}`.trim() || `Employee ${employeeId}`;
    }
    return `Employee ${employeeId}`;
  };

  /**
   * Fetch all pages from a paginated endpoint
   * API returns max 100 items per page
   * Includes rate limiting to avoid 429 errors (Too Many Requests)
   */
  const fetchAllPages = async (fetchFunction, params, maxPages = null) => {
    let allData = [];
    let page = 0;
    let hasMore = true;
    
    // Helper function to delay between requests (rate limiting)
    const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));
    
    while (hasMore) {
      // Check max pages limit
      if (maxPages && page >= maxPages) {
        console.warn(`⚠️ Reached max pages limit (${maxPages}), stopping fetch`);
        break;
      }
      
      try {
        // Add delay between requests to avoid rate limiting (except first request)
        if (page > 0) {
          await delay(500); // 500ms delay between requests
        }
        
        console.log(`Fetching page ${page + 1}...`);
        const response = await fetchFunction({ ...params, page, size: 100 });
        const data = response.data;
        
        if (data.content && Array.isArray(data.content)) {
          // Paginated response
          allData = [...allData, ...data.content];
          console.log(`✓ Page ${page + 1}: Got ${data.content.length} items (Total so far: ${allData.length})`);
          
          hasMore = page < data.totalPages - 1;
          page++;
          
          // If no more pages, we're done
          if (!hasMore) {
            console.log(`✅ Completed: Fetched all ${allData.length} items from ${page} pages`);
          }
        } else if (Array.isArray(data)) {
          // Non-paginated response
          allData = data;
          console.log(`✓ Got ${allData.length} items (non-paginated)`);
          hasMore = false;
        } else {
          hasMore = false;
        }
      } catch (error) {
        // Handle rate limiting errors
        if (error.response?.status === 429) {
          console.warn(`⚠️ Rate limit hit on page ${page + 1}. Waiting 2 seconds before retry...`);
          await delay(2000); // Wait 2 seconds before retrying
          // Don't increment page, retry the same page
          continue;
        } else {
          // For other errors, throw to be handled by caller
          throw error;
        }
      }
    }
    
    return allData;
  };

  /**
   * SECTION A: Sales & Work Sold
   * Date driver: authorizedDate from Jobs
   * Source: Jobs endpoint (embedded in Repair Orders)
   */
  const calculateSalesMetricsFromData = (allROs) => {
    try {
      // Filter criteria:
      // 1. Jobs must be authorized = true
      // 2. Jobs must have authorizedDate BETWEEN weekStart AND weekEnd
      // 3. Repair Order must have repairOrderStatusId IN (2,3,5,6)
      //    Status IDs: 2=Work-in-Progress, 3=Complete, 5=Posted, 6=Accounts Receivable
      
      const weekStartDate = new Date(weekStart + 'T00:00:00.000Z');
      const weekEndDate = new Date(weekEnd + 'T23:59:59.999Z');
      
      // Valid RO statuses for sales calculation
      const validStatusIds = [2, 3, 5, 6];
      
      let authorizedJobs = [];
      let rolloverSoldJobs = [];
      
      allROs.forEach(ro => {
        // Check if RO has valid status (API returns nested object)
        const statusId = ro.repairOrderStatus?.id || ro.repairOrderStatusId;
        const hasValidStatus = validStatusIds.includes(statusId);
        if (!hasValidStatus || !ro.jobs) return;
        
        ro.jobs.forEach(job => {
          // Must be authorized
          if (!job.authorized) return;
          
          // Must have authorizedDate
          if (!job.authorizedDate) return;
          
          const authorizedDate = new Date(job.authorizedDate);
          
          // Check if authorized in current week
          if (authorizedDate >= weekStartDate && authorizedDate <= weekEndDate) {
            authorizedJobs.push({ ...job, ro });
          }
          
          // Rollover Sold: Jobs authorized BEFORE week start, but RO created before week start
          if (authorizedDate < weekStartDate && ro.createdDate) {
            const roCreatedDate = new Date(ro.createdDate);
            if (roCreatedDate < weekStartDate) {
              rolloverSoldJobs.push({ ...job, ro });
            }
          }
        });
      });
      
      // Calculate metrics from authorized jobs
      const metrics = {
        authorizedJobsCount: authorizedJobs.length,
        soldLabor: 0,
        soldParts: 0,
        soldSublet: 0,
        fees: 0,
        discounts: 0,
        totalSold: 0,
        rolloverSoldCount: rolloverSoldJobs.length,
        rolloverSoldTotal: 0
      };
      
      // Sum up sales from authorized jobs
      // API returns values in cents, convert to dollars
      authorizedJobs.forEach(job => {
        metrics.soldLabor += (job.laborTotal || 0) / 100;
        metrics.soldParts += (job.partsTotal || 0) / 100;
        // Sublet would be in job.subletTotal if available
        metrics.soldSublet += (job.subletTotal || 0) / 100;
        metrics.fees += (job.feeTotal || 0) / 100;
        metrics.discounts += (job.discountTotal || 0) / 100;
        // Subtotal excludes tax
        metrics.totalSold += (job.subtotal || 0) / 100;
      });
      
      // Calculate rollover sold total
      rolloverSoldJobs.forEach(job => {
        metrics.rolloverSoldTotal += (job.subtotal || 0) / 100;
      });
      
      setSalesData(metrics);
      console.log('✅ Section A (Sales) calculated');
    } catch (error) {
      console.error('Error calculating sales metrics:', error);
      setErrorSales(error.message);
    } finally {
      setLoadingSales(false);
    }
  };

  /**
   * SECTION B: Production & Completion (Drift-Proof, Rollover-Safe)
   * 
   * Date driver: postedDate from Repair Orders
   * Source: Repair Orders with postedDate in selected week ONLY
   * 
   * CRITICAL RULES:
   * - Only ROs posted in selected week are included
   * - Rollover determined ONLY by job.authorizedDate < weekStart
   * - No date range padding or inference
   * - Must under-count rather than over-count
   */
  const calculateProductionMetricsFromData = (allROs) => {
    try {
      console.log('📊 Section B: Calculating Production & Completion...');
      
      // Use UTC to avoid timezone conversion
      const weekStartDate = new Date(weekStart + 'T00:00:00.000Z');
      const weekEndDate = new Date(weekEnd + 'T23:59:59.999Z');
      
      console.log(`   Week range: ${weekStart} to ${weekEnd}`);
      
      // STRICT FILTER: Only ROs posted in selected week
      // Status: 5=Posted, 6=Accounts Receivable
      const validStatusIds = [5, 6];
      
      const completedROs = allROs.filter(ro => {
        // Must have valid status (API returns nested object)
        const statusId = ro.repairOrderStatus?.id || ro.repairOrderStatusId;
        if (!validStatusIds.includes(statusId)) return false;
        
        // Must have postedDate
        if (!ro.postedDate) return false;
        
        const postedDate = new Date(ro.postedDate);
        
        // DATE GUARD: Verify postedDate is within selected week
        const isInWeek = postedDate >= weekStartDate && postedDate <= weekEndDate;
        
        if (!isInWeek) {
          // This should not happen if filtering works correctly
          console.warn(`⚠️ RO ${ro.id} has postedDate ${ro.postedDate} outside selected week - excluding`);
        }
        
        return isInWeek;
      });
      
      // VOLUME GUARD: Warn if too many ROs (indicates filtering bug)
      if (completedROs.length > 500) {
        console.warn(`⚠️ VOLUME WARNING: Section B has ${completedROs.length} ROs - postedDate filter may be broken`);
      }
      
      console.log(`   Found ${completedROs.length} ROs posted in week`);
      
      // Initialize metrics
      const metrics = {
        repairOrdersCompleted: completedROs.length,
        jobsCompleted: 0,
        jobsCurrentWeek: 0,
        jobsRollover: 0,
        uniqueVehicles: new Set(),
        billableLaborHours: 0,
        billableLaborHoursRollover: 0,
        totalCompleted: 0,
        rolloverCompletedTotal: 0,
        warnings: []
      };
      
      let totalLaborLines = 0;
      let completedLaborLines = 0;
      let laborLinesWithoutHours = 0;
      
      // Process each completed RO
      completedROs.forEach(ro => {
        // Track unique vehicles
        if (ro.vehicleId) {
          metrics.uniqueVehicles.add(ro.vehicleId);
        }
        
        // Sum total completed (no tax)
        metrics.totalCompleted += (ro.totalSales || 0) / 100;
        
        // Process jobs
        if (!ro.jobs || ro.jobs.length === 0) return;
        
        ro.jobs.forEach(job => {
          // CLASSIFICATION LOGIC (AUTHORITATIVE)
          // Skip if not authorized
          if (job.authorized !== true) return;
          
          // Count this job
          metrics.jobsCompleted++;
          
          // Determine if rollover based ONLY on authorizedDate
          let isRollover = false;
          if (job.authorizedDate) {
            const authorizedDate = new Date(job.authorizedDate);
            isRollover = authorizedDate < weekStartDate;
          }
          
          if (isRollover) {
            metrics.jobsRollover++;
            metrics.rolloverCompletedTotal += (job.subtotal || 0) / 100;
          } else {
            metrics.jobsCurrentWeek++;
          }
          
          // LABOR HOUR RULES
          // Labor hours must come from job labor lines
          if (job.labor && Array.isArray(job.labor)) {
            job.labor.forEach(laborItem => {
              totalLaborLines++;
              
              // Include labor only if complete and has hours
              if (laborItem.complete === true) {
                completedLaborLines++;
                
                const hours = parseFloat(laborItem.hours || 0);
                if (hours > 0) {
                  metrics.billableLaborHours += hours;
                  
                  if (isRollover) {
                    metrics.billableLaborHoursRollover += hours;
                  }
                } else {
                  laborLinesWithoutHours++;
                }
              }
            });
          }
        });
      });
      
      // Convert Set to count
      metrics.uniqueVehicles = metrics.uniqueVehicles.size;
      
      // VALIDATION & WARNINGS
      console.log(`   Jobs completed: ${metrics.jobsCompleted} (${metrics.jobsCurrentWeek} current, ${metrics.jobsRollover} rollover)`);
      console.log(`   Labor lines: ${totalLaborLines} total, ${completedLaborLines} complete`);
      console.log(`   Billable hours: ${metrics.billableLaborHours.toFixed(2)} (${metrics.billableLaborHoursRollover.toFixed(2)} rollover)`);
      
      if (laborLinesWithoutHours > 0) {
        const warning = `${laborLinesWithoutHours} completed labor lines have no hours`;
        metrics.warnings.push(warning);
        console.warn(`   ⚠️ ${warning}`);
      }
      
      if (totalLaborLines === 0) {
        const warning = 'No labor lines found in posted repair orders';
        metrics.warnings.push(warning);
        console.warn(`   ⚠️ ${warning}`);
      }
      
      if (completedLaborLines === 0 && totalLaborLines > 0) {
        const warning = 'No completed labor lines found (labor.complete !== true)';
        metrics.warnings.push(warning);
        console.warn(`   ⚠️ ${warning}`);
      }
      
      setProductionData(metrics);
      console.log('✅ Section B (Production) calculated');
    } catch (error) {
      console.error('❌ Error calculating production metrics:', error);
      setErrorProduction(error.message);
    } finally {
      setLoadingProduction(false);
    }
  };

  /**
   * SECTION C: Cash & Accounting
   * Date driver: updatedDate from Repair Orders
   * Source: Repair Orders endpoint
   */
  const calculateCashMetricsFromData = (allROs) => {
    try {
      
      // Filter criteria:
      // 1. updatedDate BETWEEN weekStart AND weekEnd
      // 2. amountPaid > 0
      
      const weekStartDate = new Date(weekStart + 'T00:00:00.000Z');
      const weekEndDate = new Date(weekEnd + 'T23:59:59.999Z');
      
      const paidROs = allROs.filter(ro => {
        // Must have updatedDate
        if (!ro.updatedDate) return false;
        
        const updatedDate = new Date(ro.updatedDate);
        
        // updatedDate must be within week
        if (updatedDate < weekStartDate || updatedDate > weekEndDate) return false;
        
        // Must have payment
        return (ro.amountPaid || 0) > 0;
      });
      
      // Calculate metrics
      const metrics = {
        cashCollected: 0,
        roCountWithPayments: paidROs.length,
        avgCollectedPerRO: 0
      };
      
      // Sum cash collected (convert from cents to dollars)
      paidROs.forEach(ro => {
        metrics.cashCollected += (ro.amountPaid || 0) / 100;
      });
      
      // Calculate average
      if (metrics.roCountWithPayments > 0) {
        metrics.avgCollectedPerRO = metrics.cashCollected / metrics.roCountWithPayments;
      }
      
      setCashData(metrics);
      console.log('✅ Section C (Cash) calculated');
    } catch (error) {
      console.error('Error calculating cash metrics:', error);
      setErrorCash(error.message);
    } finally {
      setLoadingCash(false);
    }
  };

  /**
   * SECTION D: Technician Productivity (Hours Turned)
   * Date driver: postedDate from Repair Orders
   * Source: Labor lines from jobs in posted ROs
   * 
   * Why postedDate: Technicians are credited when work is COMPLETED and posted,
   * not when it was authorized. This measures actual production.
   */
  const calculateTechnicianProductivityFromData = (allROs) => {
    try {
      const weekStartDate = new Date(weekStart + 'T00:00:00.000Z');
      const weekEndDate = new Date(weekEnd + 'T23:59:59.999Z');
      const validStatusIds = [5, 6]; // Posted=5, Accounts Receivable=6
      
      // Filter ROs that were posted in the week
      const postedROs = allROs.filter(ro => {
        const statusId = ro.repairOrderStatus?.id || ro.repairOrderStatusId;
        if (!validStatusIds.includes(statusId)) return false;
        if (!ro.postedDate) return false;
        
        const postedDate = new Date(ro.postedDate);
        return postedDate >= weekStartDate && postedDate <= weekEndDate;
      });
      
      // Track technician metrics
      const techMetrics = {};
      const warnings = [];
      let totalLaborHoursFound = 0;
      let laborLinesWithoutTech = 0;
      
      postedROs.forEach(ro => {
        if (!ro.jobs || ro.jobs.length === 0) return;
        
        ro.jobs.forEach(job => {
          // Only count authorized jobs
          // Why: Unauthorized work shouldn't count toward productivity
          if (!job.authorized) return;
          
          // Process labor lines
          if (job.labor && Array.isArray(job.labor)) {
            job.labor.forEach(laborLine => {
              totalLaborHoursFound++;
              
              // Get technician ID from labor line or job
              const techId = laborLine.technicianId || job.technicianId;
              
              if (!techId) {
                laborLinesWithoutTech++;
                return;
              }
              
              // Initialize technician if not exists
              if (!techMetrics[techId]) {
                techMetrics[techId] = {
                  technicianId: techId,
                  name: getEmployeeName(techId),
                  hoursTurned: 0,
                  rosTouched: new Set(),
                  laborLinesCount: 0
                };
              }
              
              // Add hours (labor lines store hours as decimal)
              const hours = parseFloat(laborLine.hours || 0);
              techMetrics[techId].hoursTurned += hours;
              techMetrics[techId].rosTouched.add(ro.id);
              techMetrics[techId].laborLinesCount++;
            });
          }
        });
      });
      
      // Convert to array and calculate averages
      const techArray = Object.values(techMetrics).map(tech => ({
        ...tech,
        rosTouched: tech.rosTouched.size,
        avgHoursPerRO: tech.rosTouched.size > 0 
          ? (tech.hoursTurned / tech.rosTouched.size).toFixed(2)
          : '0.00'
      })).sort((a, b) => b.hoursTurned - a.hoursTurned);
      
      // Validation warnings
      if (laborLinesWithoutTech > 0) {
        warnings.push(`${laborLinesWithoutTech} labor lines missing technician assignment`);
      }
      
      if (totalLaborHoursFound === 0) {
        warnings.push('No labor hours found in posted repair orders');
      }
      
      setTechnicianData({
        technicians: techArray,
        totalHoursTurned: techArray.reduce((sum, t) => sum + t.hoursTurned, 0),
        totalROs: new Set(techArray.flatMap(t => Array(t.rosTouched).fill(0))).size,
        warnings
      });
      
      console.log('✅ Section D (Technician Productivity) calculated');
    } catch (error) {
      console.error('Error calculating technician productivity:', error);
      setTechnicianData({ technicians: [], totalHoursTurned: 0, totalROs: 0, warnings: [error.message] });
    }
  };

  /**
   * SECTION E: Service Writer Productivity (Hours Sold)
   * Date driver: authorizedDate from Jobs
   * Source: Labor lines from jobs authorized in the week
   * 
   * Why authorizedDate: Writers are credited when work is SOLD (authorized),
   * not when it's completed. This measures sales effectiveness.
   */
  const calculateServiceWriterProductivityFromData = (allROs) => {
    try {
      const weekStartDate = new Date(weekStart + 'T00:00:00.000Z');
      const weekEndDate = new Date(weekEnd + 'T23:59:59.999Z');
      
      // Track writer metrics
      const writerMetrics = {};
      const warnings = [];
      let jobsWithoutWriter = 0;
      let totalJobsProcessed = 0;
      
      allROs.forEach(ro => {
        if (!ro.jobs || ro.jobs.length === 0) return;
        
        ro.jobs.forEach(job => {
          totalJobsProcessed++;
          
          // Only count authorized jobs with authorizedDate in week range
          // Why: We're measuring what was SOLD this week
          if (!job.authorized) return;
          if (!job.authorizedDate) return;
          
          const authorizedDate = new Date(job.authorizedDate);
          if (authorizedDate < weekStartDate || authorizedDate > weekEndDate) return;
          
          // Get service writer ID
          const writerId = job.serviceWriterId || job.serviceAdvisorId || job.advisorId;
          
          if (!writerId) {
            jobsWithoutWriter++;
            return;
          }
          
          // Initialize writer if not exists
          if (!writerMetrics[writerId]) {
            writerMetrics[writerId] = {
              serviceWriterId: writerId,
              name: getEmployeeName(writerId),
              hoursSold: 0,
              jobsSold: 0,
              backlogJobs: 0, // Jobs where RO was created before week start
              laborLinesCount: 0
            };
          }
          
          // Count job
          writerMetrics[writerId].jobsSold++;
          
          // Check if this is backlog (RO created before week start)
          if (ro.createdDate) {
            const roCreatedDate = new Date(ro.createdDate);
            if (roCreatedDate < weekStartDate) {
              writerMetrics[writerId].backlogJobs++;
            }
          }
          
          // Sum labor hours from this job
          if (job.labor && Array.isArray(job.labor)) {
            job.labor.forEach(laborLine => {
              const hours = parseFloat(laborLine.hours || 0);
              writerMetrics[writerId].hoursSold += hours;
              writerMetrics[writerId].laborLinesCount++;
            });
          }
        });
      });
      
      // Convert to array and calculate percentages
      const writerArray = Object.values(writerMetrics).map(writer => ({
        ...writer,
        avgHoursPerJob: writer.jobsSold > 0 
          ? (writer.hoursSold / writer.jobsSold).toFixed(2)
          : '0.00',
        backlogPercentage: writer.jobsSold > 0
          ? ((writer.backlogJobs / writer.jobsSold) * 100).toFixed(1)
          : '0.0'
      })).sort((a, b) => b.hoursSold - a.hoursSold);
      
      // Validation warnings
      if (jobsWithoutWriter > 0) {
        warnings.push(`${jobsWithoutWriter} authorized jobs missing service writer assignment`);
      }
      
      if (totalJobsProcessed === 0) {
        warnings.push('No jobs found in repair orders');
      }
      
      setServiceWriterData({
        writers: writerArray,
        totalHoursSold: writerArray.reduce((sum, w) => sum + w.hoursSold, 0),
        totalJobsSold: writerArray.reduce((sum, w) => sum + w.jobsSold, 0),
        warnings
      });
      
      console.log('✅ Section E (Service Writer Productivity) calculated');
    } catch (error) {
      console.error('Error calculating service writer productivity:', error);
      setServiceWriterData({ writers: [], totalHoursSold: 0, totalJobsSold: 0, warnings: [error.message] });
    }
  };

  /**
   * Build Production fetch parameters (Section B only)
   * STRICT: Only fetch ROs posted in selected week, no padding
   */
  const buildProductionFetchParams = () => {
    // API expects ISO 8601 datetime with timezone (ZonedDateTime)
    // Use UTC to avoid timezone conversion issues
    const startDateTime = weekStart + 'T00:00:00.000Z';
    const endDateTime = weekEnd + 'T23:59:59.999Z';
    
    return {
      shop: selectedShop,
      repairOrderStatusId: [5, 6], // Posted, AR
      postedDateStart: startDateTime,
      postedDateEnd: endDateTime
    };
  };

  /**
   * Build Sales fetch parameters (Section A only)
   * Fetch ROs that might have jobs authorized in selected week
   * Uses 14-day lookback window to capture rollover jobs while minimizing data volume
   */
  const buildSalesFetchParams = () => {
    const weekStartDate = new Date(weekStart + 'T00:00:00.000Z');
    
    // 14-day lookback window (reduced from 30 to minimize API load)
    const lookbackStartDate = new Date(weekStartDate);
    lookbackStartDate.setDate(lookbackStartDate.getDate() - 14);
    
    const params = {
      shop: selectedShop,
      repairOrderStatusId: [2, 3, 5, 6], // Authorized, In Progress, Completed, Invoiced
      // Try using createdDateStart to filter at API level
      createdDateStart: lookbackStartDate.toISOString()
    };
    
    return params;
  };

  /**
   * Build Cash fetch parameters (Section C only)
   * Fetch ROs that might have payments in selected week
   * Uses updatedDate filtering to minimize data volume
   */
  const buildCashFetchParams = () => {
    const weekStartDate = new Date(weekStart + 'T00:00:00.000Z');
    const weekEndDate = new Date(weekEnd + 'T23:59:59.999Z');
    
    const params = {
      shop: selectedShop,
      repairOrderStatusId: [5, 6], // Completed, Invoiced (ROs with payments)
      // Try using updatedDateStart/End to filter at API level
      updatedDateStart: weekStartDate.toISOString(),
      updatedDateEnd: weekEndDate.toISOString()
    };
    
    return params;
  };

  /**
   * Generate all reports when week or shop changes
   * 
   * NOTE: Each section uses dedicated fetch with exact parameters
   * - Section A (Sales): Needs 30-day window for job authorization rollover
   * - Section B (Production): Exact week only, posted ROs
   * - Section C (Cash): Exact week only, updated ROs with payments
   */
  const handleGenerateReport = async () => {
    if (!selectedShop || !weekStart || !weekEnd) {
      alert('Please select shop and week range');
      return;
    }
    
    // Set all sections to loading
    setLoadingSales(true);
    setLoadingProduction(true);
    setLoadingCash(true);
    setErrorSales(null);
    setErrorProduction(null);
    setErrorCash(null);
    
    try {
      console.log('🔄 Fetching repair orders...');
      console.log(`📅 Selected Week: ${weekStart} to ${weekEnd}`);
      
      const weekStartDate = new Date(weekStart + 'T00:00:00.000Z');
      const weekEndDate = new Date(weekEnd + 'T23:59:59.999Z');
      
      // SECTION B (PRODUCTION): Dedicated fetch with EXACT dates
      console.log('📊 Section B: Fetching ROs posted in selected week ONLY...');
      
      const productionParams = buildProductionFetchParams();
      console.log(`   Params:`, productionParams);
      
      const productionROs = await fetchAllPages(getRepairOrders, productionParams);
      
      console.log(`✅ Section B: Fetched ${productionROs.length} ROs`);
      
      // HARD GUARD: Verify all ROs are within selected week
      const outsideWeek = productionROs.filter(ro => {
        if (!ro.postedDate) return true;
        const postedDate = new Date(ro.postedDate);
        return postedDate < weekStartDate || postedDate > weekEndDate;
      });
      
      if (outsideWeek.length > 0) {
        throw new Error(
          `Production fetch violation: ${outsideWeek.length} ROs have postedDate outside week range. ` +
          `API filtering failed. First violation: RO ${outsideWeek[0].id} posted ${outsideWeek[0].postedDate}`
        );
      }
      
      // VOLUME GUARD: Warn if pagination explosion
      if (productionROs.length > 500) {
        console.warn(`⚠️ VOLUME WARNING: Section B fetched ${productionROs.length} ROs`);
      }
      
      // Calculate Section B (Production)
      calculateProductionMetricsFromData(productionROs);
      
      // SECTION A (SALES): Fetch and filter for job authorization
      console.log('📊 Section A: Fetching ROs for sales...');
      
      const salesParams = buildSalesFetchParams();
      console.log(`   Params:`, salesParams);
      
      const allSalesROs = await fetchAllPages(getRepairOrders, salesParams, 30); // Max 30 pages
      
      console.log(`📦 Section A: Fetched ${allSalesROs.length} ROs from API`);
      
      // Check if API date filtering worked
      const expandedStartDate = new Date(weekStartDate);
      expandedStartDate.setDate(expandedStartDate.getDate() - 14);
      const outsideDateRange = allSalesROs.filter(ro => {
        if (!ro.createdDate) return false;
        const createdDate = new Date(ro.createdDate);
        return createdDate < expandedStartDate;
      });
      
      if (outsideDateRange.length > 0) {
        console.warn(`⚠️  API date filtering may not be working: ${outsideDateRange.length} ROs created before ${expandedStartDate.toISOString()}`);
      } else {
        console.log(`✅ API date filtering appears to be working correctly`);
      }
      
      // Client-side filter: Keep ROs with jobs authorized in week or rollover potential
      // 14-day lookback window (matches API filter)
      
      const salesROs = allSalesROs.filter(ro => {
        // Keep if RO has jobs (we'll check authorizedDate in calculation)
        if (!ro.jobs || ro.jobs.length === 0) return false;
        
        // Keep if RO was created/updated recently (might have jobs authorized in week)
        if (ro.createdDate) {
          const createdDate = new Date(ro.createdDate);
          if (createdDate >= expandedStartDate) return true;
        }
        if (ro.updatedDate) {
          const updatedDate = new Date(ro.updatedDate);
          if (updatedDate >= expandedStartDate) return true;
        }
        
        return false;
      });
      
      console.log(`🔍 Section A: Filtered to ${salesROs.length} relevant ROs (${((1 - salesROs.length / allSalesROs.length) * 100).toFixed(1)}% reduction)`);
      
      // Calculate Section A (Sales)
      calculateSalesMetricsFromData(salesROs);
      
      // SECTION C (CASH): Fetch and filter for payments in week
      console.log('📊 Section C: Fetching ROs for cash...');
      
      const cashParams = buildCashFetchParams();
      console.log(`   Params:`, cashParams);
      
      const allCashROs = await fetchAllPages(getRepairOrders, cashParams, 30); // Max 30 pages
      
      console.log(`📦 Section C: Fetched ${allCashROs.length} ROs from API`);
      
      // Client-side filter: Keep ROs updated in selected week with payments
      const cashROs = allCashROs.filter(ro => {
        // Must have updatedDate in week
        if (!ro.updatedDate) return false;
        const updatedDate = new Date(ro.updatedDate);
        if (updatedDate < weekStartDate || updatedDate > weekEndDate) return false;
        
        // Must have payment
        return (ro.amountPaid || 0) > 0;
      });
      
      console.log(`🔍 Section C: Filtered to ${cashROs.length} relevant ROs (${((1 - cashROs.length / allCashROs.length) * 100).toFixed(1)}% reduction)`);
      
      // Calculate Section C (Cash)
      calculateCashMetricsFromData(cashROs);
      
      // SECTIONS D & E (PRODUCTIVITY): Use production data for technicians, sales data for writers
      console.log('📊 Sections D & E: Calculating productivity...');
      calculateTechnicianProductivityFromData(productionROs);
      calculateServiceWriterProductivityFromData(salesROs);
      
      // ============================================================
      // DETAILED INCLUSION LOG (for debugging)
      // ============================================================
      console.log('\n' + '='.repeat(80));
      console.log('📋 DETAILED INCLUSION LOG');
      console.log('='.repeat(80));
      
      // Section A (Sales) - Show why ROs were included
      console.log('\n📊 SECTION A (SALES) - Inclusion Analysis');
      console.log(`Total fetched from API: ${allSalesROs.length}`);
      console.log(`After filtering: ${salesROs.length}`);
      console.log(`Reduction: ${((1 - salesROs.length / allSalesROs.length) * 100).toFixed(1)}%`);
      
      const salesInclusionReasons = {};
      salesROs.forEach(ro => {
        let reason = 'Unknown';
        const createdDate = ro.createdDate ? new Date(ro.createdDate) : null;
        const updatedDate = ro.updatedDate ? new Date(ro.updatedDate) : null;
        const expandedStartDate = new Date(weekStartDate);
        expandedStartDate.setDate(expandedStartDate.getDate() - 14);
        
        if (createdDate && createdDate >= expandedStartDate) {
          reason = 'Created within 14 days before week';
        } else if (updatedDate && updatedDate >= expandedStartDate) {
          reason = 'Updated within 14 days before week';
        }
        
        salesInclusionReasons[reason] = (salesInclusionReasons[reason] || 0) + 1;
      });
      
      console.log('\nInclusion reasons breakdown:');
      Object.entries(salesInclusionReasons).forEach(([reason, count]) => {
        console.log(`  - ${reason}: ${count} ROs`);
      });
      
      // Show sample ROs with dates
      console.log('\nSample included ROs (first 5):');
      salesROs.slice(0, 5).forEach(ro => {
        console.log(`  RO #${ro.repairOrderNumber}:`);
        console.log(`    Created: ${ro.createdDate || 'N/A'}`);
        console.log(`    Updated: ${ro.updatedDate || 'N/A'}`);
        console.log(`    Status: ${ro.repairOrderStatusName || 'N/A'}`);
        console.log(`    Jobs: ${ro.jobs?.length || 0}`);
      });
      
      // Section C (Cash) - Show why ROs were included
      console.log('\n📊 SECTION C (CASH) - Inclusion Analysis');
      console.log(`Total fetched from API: ${allCashROs.length}`);
      console.log(`After filtering: ${cashROs.length}`);
      console.log(`Reduction: ${((1 - cashROs.length / allCashROs.length) * 100).toFixed(1)}%`);
      
      const cashDateDistribution = {};
      cashROs.forEach(ro => {
        if (ro.updatedDate) {
          const updatedDate = new Date(ro.updatedDate);
          const dateKey = updatedDate.toISOString().split('T')[0]; // YYYY-MM-DD
          cashDateDistribution[dateKey] = (cashDateDistribution[dateKey] || 0) + 1;
        }
      });
      
      console.log('\nUpdated date distribution (by day):');
      Object.entries(cashDateDistribution)
        .sort(([a], [b]) => a.localeCompare(b))
        .forEach(([date, count]) => {
          console.log(`  ${date}: ${count} ROs`);
        });
      
      // Show sample ROs with payment info
      console.log('\nSample included ROs (first 5):');
      cashROs.slice(0, 5).forEach(ro => {
        console.log(`  RO #${ro.repairOrderNumber}:`);
        console.log(`    Updated: ${ro.updatedDate || 'N/A'}`);
        console.log(`    Status: ${ro.repairOrderStatusName || 'N/A'}`);
        console.log(`    Amount Paid: $${((ro.amountPaid || 0) / 100).toFixed(2)}`);
      });
      
      // Section B (Production) - Already filtered by API
      console.log('\n📊 SECTION B (PRODUCTION) - Inclusion Analysis');
      console.log(`Total fetched from API: ${productionROs.length}`);
      console.log(`Note: This section uses API date filtering (postedDate), so all fetched ROs are included`);
      
      const productionDateDistribution = {};
      productionROs.forEach(ro => {
        if (ro.postedDate) {
          const postedDate = new Date(ro.postedDate);
          const dateKey = postedDate.toISOString().split('T')[0]; // YYYY-MM-DD
          productionDateDistribution[dateKey] = (productionDateDistribution[dateKey] || 0) + 1;
        }
      });
      
      console.log('\nPosted date distribution (by day):');
      Object.entries(productionDateDistribution)
        .sort(([a], [b]) => a.localeCompare(b))
        .forEach(([date, count]) => {
          console.log(`  ${date}: ${count} ROs`);
        });
      
      // Warning if limits were hit
      console.log('\n⚠️  DATA COMPLETENESS WARNINGS:');
      if (allSalesROs.length >= 3000) {
        console.warn(`  ⚠️  Section A hit 30-page limit (3000 ROs). Data may be incomplete!`);
        console.warn(`     Consider reducing the date range or increasing the page limit.`);
      } else if (allSalesROs.length >= 2500) {
        console.warn(`  ⚠️  Section A approaching limit (${allSalesROs.length} ROs). Watch for data loss.`);
      } else {
        console.log(`  ✅ Section A: All data fetched (${allSalesROs.length} ROs)`);
      }
      
      if (allCashROs.length >= 3000) {
        console.warn(`  ⚠️  Section C hit 30-page limit (3000 ROs). Data may be incomplete!`);
        console.warn(`     Consider reducing the date range or increasing the page limit.`);
      } else if (allCashROs.length >= 2500) {
        console.warn(`  ⚠️  Section C approaching limit (${allCashROs.length} ROs). Watch for data loss.`);
      } else {
        console.log(`  ✅ Section C: All data fetched (${allCashROs.length} ROs)`);
      }
      
      console.log('\n' + '='.repeat(80));
      console.log('📋 END OF INCLUSION LOG');
      console.log('='.repeat(80) + '\n');
      
    } catch (error) {
      console.error('Error fetching repair orders:', error);
      const errorMessage = error.response?.data?.error?.message || error.message;
      
      // Set error for all sections
      setErrorSales(errorMessage);
      setErrorProduction(errorMessage);
      setErrorCash(errorMessage);
      
      setLoadingSales(false);
      setLoadingProduction(false);
      setLoadingCash(false);
    }
  };

  /**
   * Format currency for display
   */
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value || 0);
  };

  /**
   * Format number with commas
   */
  const formatNumber = (value) => {
    return new Intl.NumberFormat('en-US').format(value || 0);
  };

  return (
    <div className="card">
      <h2>Weekly Operating Report</h2>
      <p style={{ color: '#6b7280', marginBottom: '1.5rem' }}>
        Drift-proof reporting with strict date logic separation. Sales ≠ Production ≠ Cash.
      </p>

      {/* Global Controls */}
      <div style={{
        display: 'flex',
        gap: '1rem',
        marginBottom: '2rem',
        padding: '1.5rem',
        backgroundColor: '#f9fafb',
        borderRadius: '8px',
        alignItems: 'flex-end',
        flexWrap: 'wrap'
      }}>
        <div className="form-group" style={{ margin: 0, flex: 1, minWidth: '200px' }}>
          <label>Shop ID</label>
          <input
            type="text"
            value={selectedShop}
            onChange={(e) => setSelectedShop(e.target.value)}
            placeholder="Enter shop ID"
            style={{ width: '100%' }}
          />
          <small style={{ color: '#6b7280', fontSize: '0.75rem', marginTop: '0.25rem', display: 'block' }}>
            Current: {localStorage.getItem('tekmetric_shop_id') || 'Not set'}
          </small>
        </div>

        <div className="form-group" style={{ margin: 0, flex: 1, minWidth: '150px' }}>
          <label>Week Start (Monday)</label>
          <input
            type="date"
            value={weekStart}
            onChange={(e) => setWeekStart(e.target.value)}
            style={{ width: '100%' }}
          />
        </div>

        <div className="form-group" style={{ margin: 0, flex: 1, minWidth: '150px' }}>
          <label>Week End (Sunday)</label>
          <input
            type="date"
            value={weekEnd}
            onChange={(e) => setWeekEnd(e.target.value)}
            style={{ width: '100%' }}
          />
        </div>

        <button
          className="btn btn-primary"
          onClick={handleGenerateReport}
          disabled={loadingSales || loadingProduction || loadingCash}
          style={{ marginBottom: 0 }}
        >
          {(loadingSales || loadingProduction || loadingCash) ? 'Loading...' : 'Generate Report'}
        </button>
      </div>

      {/* SECTION A: Sales & Work Sold */}
      <div style={{
        marginBottom: '2rem',
        padding: '1.5rem',
        backgroundColor: '#f0f9ff',
        borderRadius: '8px',
        border: '2px solid #3b82f6'
      }}>
        <h3 style={{ marginBottom: '1rem', color: '#1e40af', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          Section A: Sales & Work Sold (Authorized)
          <span
            style={{ fontSize: '0.85rem', cursor: 'help' }}
            title="Source: Jobs endpoint | Date driver: authorizedDate | Filters: authorized=true, authorizedDate in week range, RO status IN (2,3,5,6)"
          >
            ℹ️
          </span>
        </h3>

        {loadingSales && (
          <div style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>
            <div className="spinner"></div>
            <p>Loading sales data...</p>
          </div>
        )}

        {errorSales && (
          <div className="alert alert-error">
            <strong>Error:</strong> {errorSales}
          </div>
        )}

        {!loadingSales && !errorSales && salesData && (
          <div>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '1rem',
              marginBottom: '1rem'
            }}>
              <MetricCard
                label="Authorized Jobs"
                value={formatNumber(salesData.authorizedJobsCount)}
                tooltip="Count of jobs with authorized=true and authorizedDate in week range"
              />
              <MetricCard
                label="Sold Labor"
                value={formatCurrency(salesData.soldLabor)}
                tooltip="Sum of laborTotal from authorized jobs (no tax)"
              />
              <MetricCard
                label="Sold Parts"
                value={formatCurrency(salesData.soldParts)}
                tooltip="Sum of partsTotal from authorized jobs (no tax)"
              />
              <MetricCard
                label="Sold Sublet"
                value={formatCurrency(salesData.soldSublet)}
                tooltip="Sum of subletTotal from authorized jobs (no tax)"
              />
              <MetricCard
                label="Fees"
                value={formatCurrency(salesData.fees)}
                tooltip="Sum of feeTotal from authorized jobs"
              />
              <MetricCard
                label="Discounts"
                value={formatCurrency(salesData.discounts)}
                tooltip="Sum of discountTotal from authorized jobs"
                valueColor="#dc2626"
              />
              <MetricCard
                label="Total Sold"
                value={formatCurrency(salesData.totalSold)}
                tooltip="Sum of job subtotals (no tax)"
                highlight
              />
            </div>

            {/* Rollover Sold */}
            <div style={{
              padding: '1rem',
              backgroundColor: 'white',
              borderRadius: '6px',
              marginTop: '1rem'
            }}>
              <h4 style={{ marginBottom: '0.5rem', color: '#374151', fontSize: '0.95rem' }}>
                Rollover Sold
                <span
                  style={{ fontSize: '0.8rem', marginLeft: '0.5rem', cursor: 'help' }}
                  title="Jobs where authorizedDate < week start AND RO createdDate < week start"
                >
                  ℹ️
                </span>
              </h4>
              <div style={{ display: 'flex', gap: '2rem' }}>
                <div>
                  <span style={{ fontSize: '0.85rem', color: '#6b7280' }}>Count: </span>
                  <strong>{formatNumber(salesData.rolloverSoldCount)}</strong>
                </div>
                <div>
                  <span style={{ fontSize: '0.85rem', color: '#6b7280' }}>Total: </span>
                  <strong>{formatCurrency(salesData.rolloverSoldTotal)}</strong>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* SECTION B: Production & Completion */}
      <div style={{
        marginBottom: '2rem',
        padding: '1.5rem',
        backgroundColor: '#f0fdf4',
        borderRadius: '8px',
        border: '2px solid #10b981'
      }}>
        <h3 style={{ marginBottom: '1rem', color: '#065f46', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          Section B: Production & Completion (Posted This Week)
          <span
            style={{ fontSize: '0.85rem', cursor: 'help' }}
            title="Source: Repair Orders posted in selected week ONLY | Date driver: postedDate | Rollover determined by authorizedDate < weekStart | No date range padding"
          >
            ℹ️
          </span>
        </h3>

        {loadingProduction && (
          <div style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>
            <div className="spinner"></div>
            <p>Loading production data...</p>
          </div>
        )}

        {errorProduction && (
          <div className="alert alert-error">
            <strong>Error:</strong> {errorProduction}
          </div>
        )}

        {!loadingProduction && !errorProduction && productionData && (
          <div>
            {/* Data Quality Warnings */}
            {productionData.warnings && productionData.warnings.length > 0 && (
              <div style={{
                padding: '0.75rem 1rem',
                backgroundColor: '#fef3c7',
                borderRadius: '6px',
                marginBottom: '1rem',
                fontSize: '0.85rem',
                color: '#92400e',
                border: '1px solid #fbbf24'
              }}>
                <strong>⚠️ Data Quality Warnings:</strong>
                <ul style={{ marginTop: '0.5rem', marginBottom: 0, paddingLeft: '1.5rem' }}>
                  {productionData.warnings.map((warning, idx) => (
                    <li key={idx}>{warning}</li>
                  ))}
                </ul>
              </div>
            )}

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '1rem',
              marginBottom: '1rem'
            }}>
              <MetricCard
                label="Repair Orders Completed"
                value={formatNumber(productionData.repairOrdersCompleted)}
                tooltip="Count of ROs with status IN (5,6) and postedDate in selected week ONLY"
              />
              <MetricCard
                label="Jobs Completed"
                value={formatNumber(productionData.jobsCompleted)}
                tooltip="Count of authorized jobs from ROs posted this week"
              />
              <MetricCard
                label="Unique Vehicles"
                value={formatNumber(productionData.uniqueVehicles)}
                tooltip="Distinct vehicleId count from completed ROs"
              />
              <MetricCard
                label="Billable Labor Hours"
                value={productionData.billableLaborHours.toFixed(2)}
                tooltip="Sum of hours from labor lines where complete=true and hours>0"
              />
              <MetricCard
                label="Total Completed"
                value={formatCurrency(productionData.totalCompleted)}
                tooltip="Sum of totalSales from completed ROs (no tax)"
                highlight
              />
            </div>

            {/* Rollover Completed */}
            <div style={{
              padding: '1rem',
              backgroundColor: 'white',
              borderRadius: '6px',
              marginTop: '1rem'
            }}>
              <h4 style={{ marginBottom: '0.5rem', color: '#374151', fontSize: '0.95rem' }}>
                Rollover Completed
                <span
                  style={{ fontSize: '0.8rem', marginLeft: '0.5rem', cursor: 'help' }}
                  title="Jobs where authorizedDate < weekStart (authorized before week) BUT RO posted in selected week. Determined ONLY by date comparison, no inference."
                >
                  ℹ️
                </span>
              </h4>
              <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
                <div>
                  <span style={{ fontSize: '0.85rem', color: '#6b7280' }}>Jobs: </span>
                  <strong>{formatNumber(productionData.jobsRollover)}</strong>
                  <span style={{ fontSize: '0.75rem', color: '#9ca3af', marginLeft: '0.5rem' }}>
                    of {formatNumber(productionData.jobsCompleted)} total
                  </span>
                </div>
                <div>
                  <span style={{ fontSize: '0.85rem', color: '#6b7280' }}>Hours: </span>
                  <strong>{productionData.billableLaborHoursRollover.toFixed(2)}</strong>
                  <span style={{ fontSize: '0.75rem', color: '#9ca3af', marginLeft: '0.5rem' }}>
                    of {productionData.billableLaborHours.toFixed(2)} total
                  </span>
                </div>
                <div>
                  <span style={{ fontSize: '0.85rem', color: '#6b7280' }}>Total: </span>
                  <strong>{formatCurrency(productionData.rolloverCompletedTotal)}</strong>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* SECTION C: Cash & Accounting */}
      <div style={{
        marginBottom: '2rem',
        padding: '1.5rem',
        backgroundColor: '#fef3c7',
        borderRadius: '8px',
        border: '2px solid #f59e0b'
      }}>
        <h3 style={{ marginBottom: '1rem', color: '#92400e', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          Section C: Cash & Accounting (Collected)
          <span
            style={{ fontSize: '0.85rem', cursor: 'help' }}
            title="Source: Repair Orders endpoint | Date driver: updatedDate | Filters: updatedDate in week range, amountPaid > 0"
          >
            ℹ️
          </span>
        </h3>

        {loadingCash && (
          <div style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>
            <div className="spinner"></div>
            <p>Loading cash data...</p>
          </div>
        )}

        {errorCash && (
          <div className="alert alert-error">
            <strong>Error:</strong> {errorCash}
          </div>
        )}

        {!loadingCash && !errorCash && cashData && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '1rem'
          }}>
            <MetricCard
              label="Cash Collected"
              value={formatCurrency(cashData.cashCollected)}
              tooltip="Sum of amountPaid from ROs with updatedDate in week range"
              highlight
            />
            <MetricCard
              label="RO Count with Payments"
              value={formatNumber(cashData.roCountWithPayments)}
              tooltip="Count of ROs with amountPaid > 0 and updatedDate in week range"
            />
            <MetricCard
              label="Avg Collected per RO"
              value={formatCurrency(cashData.avgCollectedPerRO)}
              tooltip="Cash collected divided by RO count with payments"
            />
          </div>
        )}
      </div>

      {/* Validation Warnings */}
      {(technicianData?.warnings?.length > 0 || serviceWriterData?.warnings?.length > 0) && (
        <div style={{
          padding: '1rem',
          backgroundColor: '#fef3c7',
          borderRadius: '6px',
          border: '1px solid #fbbf24',
          fontSize: '0.85rem',
          color: '#92400e',
          marginBottom: '2rem'
        }}>
          <strong>⚠️ Data Quality Warnings:</strong>
          <ul style={{ marginTop: '0.5rem', marginBottom: 0, paddingLeft: '1.5rem' }}>
            {technicianData?.warnings?.map((warning, idx) => (
              <li key={`tech-${idx}`}>{warning}</li>
            ))}
            {serviceWriterData?.warnings?.map((warning, idx) => (
              <li key={`writer-${idx}`}>{warning}</li>
            ))}
          </ul>
          <p style={{ marginTop: '0.5rem', marginBottom: 0, fontSize: '0.8rem' }}>
            Note: Missing assignments may result in incomplete totals. Verify data in source system.
          </p>
        </div>
      )}

      {/* SECTION D: Technician Productivity */}
      {technicianData && (
        <div style={{
          marginBottom: '2rem',
          padding: '1.5rem',
          backgroundColor: '#ede9fe',
          borderRadius: '8px',
          border: '2px solid #8b5cf6'
        }}>
          <h3 style={{ marginBottom: '1rem', color: '#5b21b6', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            Section D: Technician Productivity (Hours Turned)
            <span
              style={{ fontSize: '0.85rem', cursor: 'help' }}
              title="Source: Labor lines from authorized jobs | Date driver: postedDate (when RO was completed) | Filters: RO status IN (5,6), postedDate in week range"
            >
              ℹ️
            </span>
          </h3>

          {/* Summary Metrics */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '1rem',
            marginBottom: '1.5rem'
          }}>
            <MetricCard
              label="Total Hours Turned"
              value={technicianData.totalHoursTurned.toFixed(2)}
              tooltip="Sum of all labor hours from completed (posted) ROs in week range"
              highlight
            />
            <MetricCard
              label="Technicians Active"
              value={formatNumber(technicianData.technicians.length)}
              tooltip="Count of technicians with hours in completed ROs"
            />
            <MetricCard
              label="ROs Touched"
              value={formatNumber(technicianData.totalROs)}
              tooltip="Total repair orders worked on by all technicians"
            />
          </div>

          {/* Technician Table */}
          {technicianData.technicians.length > 0 ? (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', backgroundColor: 'white', borderRadius: '6px' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f3f4f6', borderBottom: '2px solid #e5e7eb' }}>
                    <th style={{ padding: '0.75rem', textAlign: 'left' }}>
                      Technician
                      <span
                        style={{ fontSize: '0.75rem', marginLeft: '0.25rem', cursor: 'help' }}
                        title="Technician ID from labor lines or job assignment"
                      >
                        ℹ️
                      </span>
                    </th>
                    <th style={{ padding: '0.75rem', textAlign: 'right' }}>
                      Hours Turned
                      <span
                        style={{ fontSize: '0.75rem', marginLeft: '0.25rem', cursor: 'help' }}
                        title="Total labor hours from jobs in ROs posted this week"
                      >
                        ℹ️
                      </span>
                    </th>
                    <th style={{ padding: '0.75rem', textAlign: 'right' }}>
                      ROs Touched
                      <span
                        style={{ fontSize: '0.75rem', marginLeft: '0.25rem', cursor: 'help' }}
                        title="Number of distinct repair orders worked on"
                      >
                        ℹ️
                      </span>
                    </th>
                    <th style={{ padding: '0.75rem', textAlign: 'right' }}>
                      Avg Hours/RO
                      <span
                        style={{ fontSize: '0.75rem', marginLeft: '0.25rem', cursor: 'help' }}
                        title="Hours turned divided by ROs touched"
                      >
                        ℹ️
                      </span>
                    </th>
                    <th style={{ padding: '0.75rem', textAlign: 'right' }}>
                      Labor Lines
                      <span
                        style={{ fontSize: '0.75rem', marginLeft: '0.25rem', cursor: 'help' }}
                        title="Number of individual labor line items"
                      >
                        ℹ️
                      </span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {/* Total Row */}
                  <tr style={{ backgroundColor: '#fef3c7', fontWeight: 'bold', borderBottom: '2px solid #e5e7eb' }}>
                    <td style={{ padding: '0.75rem' }}>TOTAL</td>
                    <td style={{ padding: '0.75rem', textAlign: 'right' }}>
                      {technicianData.totalHoursTurned.toFixed(2)} hrs
                    </td>
                    <td style={{ padding: '0.75rem', textAlign: 'right' }}>
                      {formatNumber(technicianData.totalROs)}
                    </td>
                    <td style={{ padding: '0.75rem', textAlign: 'right' }}>
                      {technicianData.totalROs > 0 
                        ? (technicianData.totalHoursTurned / technicianData.totalROs).toFixed(2)
                        : '0.00'}
                    </td>
                    <td style={{ padding: '0.75rem', textAlign: 'right' }}>
                      {formatNumber(technicianData.technicians.reduce((sum, t) => sum + t.laborLinesCount, 0))}
                    </td>
                  </tr>

                  {/* Individual Technician Rows */}
                  {technicianData.technicians.map((tech) => (
                    <tr key={tech.technicianId} style={{ borderBottom: '1px solid #e5e7eb' }}>
                      <td style={{ padding: '0.75rem' }}>
                        <span style={{ color: '#8b5cf6', fontWeight: '500' }}>
                          {tech.name}
                        </span>
                      </td>
                      <td style={{ padding: '0.75rem', textAlign: 'right' }}>
                        {tech.hoursTurned.toFixed(2)} hrs
                      </td>
                      <td style={{ padding: '0.75rem', textAlign: 'right' }}>
                        {tech.rosTouched}
                      </td>
                      <td style={{ padding: '0.75rem', textAlign: 'right' }}>
                        {tech.avgHoursPerRO}
                      </td>
                      <td style={{ padding: '0.75rem', textAlign: 'right' }}>
                        {tech.laborLinesCount}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '2rem', color: '#6b7280', backgroundColor: 'white', borderRadius: '6px' }}>
              No technician productivity data available for the selected week
            </div>
          )}

          {/* Reconciliation Note */}
          {productionData && (
            <div style={{
              marginTop: '1rem',
              padding: '0.75rem',
              backgroundColor: 'white',
              borderRadius: '6px',
              fontSize: '0.85rem',
              color: '#6b7280'
            }}>
              <strong>Reconciliation:</strong> Total hours turned ({technicianData.totalHoursTurned.toFixed(2)} hrs) 
              should be ≤ billable labor hours in Section B ({productionData.billableLaborHours.toFixed(2)} hrs)
              {technicianData.totalHoursTurned > productionData.billableLaborHours && (
                <span style={{ color: '#dc2626', marginLeft: '0.5rem' }}>
                  ⚠️ Hours turned exceeds billable hours - check data quality
                </span>
              )}
            </div>
          )}
        </div>
      )}

      {/* SECTION E: Service Writer Productivity */}
      {serviceWriterData && (
        <div style={{
          marginBottom: '2rem',
          padding: '1.5rem',
          backgroundColor: '#fce7f3',
          borderRadius: '8px',
          border: '2px solid #ec4899'
        }}>
          <h3 style={{ marginBottom: '1rem', color: '#9f1239', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            Section E: Service Writer Productivity (Hours Sold)
            <span
              style={{ fontSize: '0.85rem', cursor: 'help' }}
              title="Source: Labor lines from authorized jobs | Date driver: authorizedDate (when job was sold) | Filters: authorized=true, authorizedDate in week range"
            >
              ℹ️
            </span>
          </h3>

          {/* Summary Metrics */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '1rem',
            marginBottom: '1.5rem'
          }}>
            <MetricCard
              label="Total Hours Sold"
              value={serviceWriterData.totalHoursSold.toFixed(2)}
              tooltip="Sum of all labor hours from jobs authorized in week range"
              highlight
            />
            <MetricCard
              label="Writers Active"
              value={formatNumber(serviceWriterData.writers.length)}
              tooltip="Count of service writers with authorized jobs"
            />
            <MetricCard
              label="Jobs Sold"
              value={formatNumber(serviceWriterData.totalJobsSold)}
              tooltip="Total jobs authorized by all writers"
            />
          </div>

          {/* Service Writer Table */}
          {serviceWriterData.writers.length > 0 ? (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', backgroundColor: 'white', borderRadius: '6px' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f3f4f6', borderBottom: '2px solid #e5e7eb' }}>
                    <th style={{ padding: '0.75rem', textAlign: 'left' }}>
                      Service Writer
                      <span
                        style={{ fontSize: '0.75rem', marginLeft: '0.25rem', cursor: 'help' }}
                        title="Service writer/advisor ID from job assignment"
                      >
                        ℹ️
                      </span>
                    </th>
                    <th style={{ padding: '0.75rem', textAlign: 'right' }}>
                      Hours Sold
                      <span
                        style={{ fontSize: '0.75rem', marginLeft: '0.25rem', cursor: 'help' }}
                        title="Total labor hours from jobs authorized this week"
                      >
                        ℹ️
                      </span>
                    </th>
                    <th style={{ padding: '0.75rem', textAlign: 'right' }}>
                      Jobs Sold
                      <span
                        style={{ fontSize: '0.75rem', marginLeft: '0.25rem', cursor: 'help' }}
                        title="Number of jobs authorized this week"
                      >
                        ℹ️
                      </span>
                    </th>
                    <th style={{ padding: '0.75rem', textAlign: 'right' }}>
                      Avg Hours/Job
                      <span
                        style={{ fontSize: '0.75rem', marginLeft: '0.25rem', cursor: 'help' }}
                        title="Hours sold divided by jobs sold"
                      >
                        ℹ️
                      </span>
                    </th>
                    <th style={{ padding: '0.75rem', textAlign: 'right' }}>
                      % Backlog Sold
                      <span
                        style={{ fontSize: '0.75rem', marginLeft: '0.25rem', cursor: 'help' }}
                        title="Percentage of jobs where RO was created before week start (sold from backlog)"
                      >
                        ℹ️
                      </span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {/* Total Row */}
                  <tr style={{ backgroundColor: '#fef3c7', fontWeight: 'bold', borderBottom: '2px solid #e5e7eb' }}>
                    <td style={{ padding: '0.75rem' }}>TOTAL</td>
                    <td style={{ padding: '0.75rem', textAlign: 'right' }}>
                      {serviceWriterData.totalHoursSold.toFixed(2)} hrs
                    </td>
                    <td style={{ padding: '0.75rem', textAlign: 'right' }}>
                      {formatNumber(serviceWriterData.totalJobsSold)}
                    </td>
                    <td style={{ padding: '0.75rem', textAlign: 'right' }}>
                      {serviceWriterData.totalJobsSold > 0 
                        ? (serviceWriterData.totalHoursSold / serviceWriterData.totalJobsSold).toFixed(2)
                        : '0.00'}
                    </td>
                    <td style={{ padding: '0.75rem', textAlign: 'right' }}>
                      {serviceWriterData.totalJobsSold > 0
                        ? ((serviceWriterData.writers.reduce((sum, w) => sum + w.backlogJobs, 0) / serviceWriterData.totalJobsSold) * 100).toFixed(1)
                        : '0.0'}%
                    </td>
                  </tr>

                  {/* Individual Writer Rows */}
                  {serviceWriterData.writers.map((writer) => (
                    <tr key={writer.serviceWriterId} style={{ borderBottom: '1px solid #e5e7eb' }}>
                      <td style={{ padding: '0.75rem' }}>
                        <span style={{ color: '#ec4899', fontWeight: '500' }}>
                          {writer.name}
                        </span>
                      </td>
                      <td style={{ padding: '0.75rem', textAlign: 'right' }}>
                        {writer.hoursSold.toFixed(2)} hrs
                      </td>
                      <td style={{ padding: '0.75rem', textAlign: 'right' }}>
                        {writer.jobsSold}
                      </td>
                      <td style={{ padding: '0.75rem', textAlign: 'right' }}>
                        {writer.avgHoursPerJob}
                      </td>
                      <td style={{ padding: '0.75rem', textAlign: 'right' }}>
                        {writer.backlogPercentage}%
                        {writer.backlogJobs > 0 && (
                          <span style={{ fontSize: '0.75rem', color: '#6b7280', marginLeft: '0.25rem' }}>
                            ({writer.backlogJobs})
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '2rem', color: '#6b7280', backgroundColor: 'white', borderRadius: '6px' }}>
              No service writer productivity data available for the selected week
            </div>
          )}

          {/* Reconciliation Note */}
          {salesData && (
            <div style={{
              marginTop: '1rem',
              padding: '0.75rem',
              backgroundColor: 'white',
              borderRadius: '6px',
              fontSize: '0.85rem',
              color: '#6b7280'
            }}>
              <strong>Reconciliation:</strong> Total hours sold ({serviceWriterData.totalHoursSold.toFixed(2)} hrs) 
              should align with sold labor in Section A (jobs: {salesData.authorizedJobsCount})
              {serviceWriterData.totalJobsSold !== salesData.authorizedJobsCount && (
                <span style={{ color: '#f59e0b', marginLeft: '0.5rem' }}>
                  ℹ️ Job counts differ - some jobs may lack writer assignment
                </span>
              )}
            </div>
          )}
        </div>
      )}

      {/* Critical Rules Reminder */}
      <div style={{
        padding: '1rem',
        backgroundColor: '#fef2f2',
        borderRadius: '6px',
        border: '1px solid #fca5a5',
        fontSize: '0.85rem',
        color: '#991b1b'
      }}>
        <strong>⚠️ Critical Rules:</strong>
        <ul style={{ marginTop: '0.5rem', marginBottom: 0, paddingLeft: '1.5rem' }}>
          <li>NEVER mix authorizedDate, postedDate, and updatedDate</li>
          <li>Sales ≠ Production ≠ Cash (each uses different date logic)</li>
          <li>Technicians credited on postedDate (when work completed)</li>
          <li>Writers credited on authorizedDate (when work sold)</li>
          <li>Tax is never included in any calculations</li>
          <li>All currency values converted from cents to dollars</li>
          <li>Rollover metrics are explicit, not inferred</li>
        </ul>
      </div>
    </div>
  );
}

/**
 * Reusable Metric Card Component
 */
function MetricCard({ label, value, tooltip, highlight = false, valueColor = null }) {
  return (
    <div style={{
      padding: '1rem',
      backgroundColor: highlight ? 'white' : '#ffffff99',
      borderRadius: '6px',
      border: highlight ? '2px solid currentColor' : '1px solid #e5e7eb'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.25rem',
        marginBottom: '0.5rem'
      }}>
        <span style={{ fontSize: '0.8rem', color: '#6b7280', fontWeight: '600' }}>
          {label}
        </span>
        {tooltip && (
          <span
            style={{ fontSize: '0.75rem', cursor: 'help', color: '#9ca3af' }}
            title={tooltip}
          >
            ℹ️
          </span>
        )}
      </div>
      <div style={{
        fontSize: highlight ? '1.75rem' : '1.5rem',
        fontWeight: 'bold',
        color: valueColor || (highlight ? 'inherit' : '#374151')
      }}>
        {value}
      </div>
    </div>
  );
}

export default WeeklyReport;
