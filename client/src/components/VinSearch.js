import React, { useState } from 'react';
import { getVehicles, getRepairOrders, getRepairOrder } from '../services/api';

function VinSearch() {
  const [vin, setVin] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [vehicleInfo, setVehicleInfo] = useState(null);
  const [repairOrders, setRepairOrders] = useState([]);
  const [declinedJobs, setDeclinedJobs] = useState([]);
  const [expandedRO, setExpandedRO] = useState(null);
  const [loadingRO, setLoadingRO] = useState(null);
  const [pagination, setPagination] = useState({
    currentPage: 0,
    totalPages: 0,
    totalElements: 0,
    size: 20
  });

  const handleVinChange = (e) => {
    const value = e.target.value.toUpperCase().trim();
    setVin(value);
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    
    if (!vin.trim()) {
      setError('Please enter a VIN');
      return;
    }

    await searchByVin(vin, 0);
  };

  const searchByVin = async (vinNumber, page = 0) => {
    setLoading(true);
    setError(null);
    setVehicleInfo(null);
    setRepairOrders([]);

    try {
      const shopId = localStorage.getItem('tekmetric_shop_id');
      
      if (!shopId) {
        throw new Error('Shop ID not found. Please configure your shop settings.');
      }

      // Step 1: Search for vehicle by VIN
      console.log(`Searching for VIN: ${vinNumber}`);
      const vehicleResponse = await getVehicles({
        search: vinNumber,
        shop: shopId,
        size: 10
      });

      const vehicles = Array.isArray(vehicleResponse.data) 
        ? vehicleResponse.data 
        : vehicleResponse.data.content || [];

      console.log(`Found ${vehicles.length} vehicle(s)`);

      if (vehicles.length === 0) {
        setError(`No vehicle found with VIN: ${vinNumber}`);
        setLoading(false);
        return;
      }

      // Step 2: Find exact VIN match or use first result
      let matchedVehicle = vehicles.find(v => v.vin === vinNumber);
      
      if (!matchedVehicle && vehicles.length > 0) {
        // If no exact match but vehicles returned, use first one and warn user
        matchedVehicle = vehicles[0];
        if (vehicles.length > 1) {
          console.warn(`Multiple vehicles found. Using first match: ${matchedVehicle.vin}`);
        }
      }

      if (!matchedVehicle) {
        setError(`No exact VIN match found for: ${vinNumber}`);
        setLoading(false);
        return;
      }

      console.log(`Matched vehicle ID: ${matchedVehicle.id}`);
      setVehicleInfo(matchedVehicle);

      // Step 3: Fetch repair orders for this vehicle
      console.log(`Fetching repair orders for vehicle ID: ${matchedVehicle.id}`);
      const roResponse = await getRepairOrders({
        vehicleId: matchedVehicle.id,
        shop: shopId,
        size: pagination.size,
        page: page
      });

      const roData = Array.isArray(roResponse.data) 
        ? roResponse.data 
        : roResponse.data.content || [];
      
      const totalPages = roResponse.data.totalPages || 0;
      const totalElements = roResponse.data.totalElements || roData.length;

      console.log(`Found ${roData.length} repair order(s)`);
      setRepairOrders(roData);
      setPagination({
        currentPage: page,
        totalPages: totalPages,
        totalElements: totalElements,
        size: pagination.size
      });

      // Step 4: Collect all declined jobs from all repair orders
      console.log('Collecting declined jobs...');
      const allDeclinedJobs = [];
      
      for (const ro of roData) {
        // Fetch full RO details to get jobs
        try {
          const fullROResponse = await getRepairOrder(ro.id);
          const fullRO = fullROResponse.data;
          
          if (fullRO.jobs && fullRO.jobs.length > 0) {
            console.log(`\n=== RO #${fullRO.repairOrderNumber} has ${fullRO.jobs.length} jobs ===`);
            
            // Log ALL jobs to see the difference between authorized and declined
            fullRO.jobs.forEach((job, idx) => {
              console.log(`Job ${idx + 1}: "${job.name}"`, {
                selected: job.selected,
                authorized: job.authorized,
                declined: job.declined,
                status: job.status,
                subtotal: job.subtotal
              });
            });
            
            // Filter for declined jobs
            // A job is declined if it's selected (recommended) but NOT authorized
            const declined = fullRO.jobs.filter(job => 
              job.selected === true && job.authorized === false
            );
            
            console.log(`✗ Found ${declined.length} DECLINED jobs in RO #${fullRO.repairOrderNumber}`);
            
            if (declined.length > 0) {
              // Add RO context to each declined job
              declined.forEach(job => {
                console.log(`  → Declined: "${job.name}" ($${(job.subtotal / 100).toFixed(2)})`);
                allDeclinedJobs.push({
                  ...job,
                  repairOrderNumber: fullRO.repairOrderNumber || fullRO.id,
                  repairOrderId: fullRO.id,
                  createdDate: fullRO.createdDate
                });
              });
            }
          }
        } catch (jobErr) {
          console.error(`Error fetching jobs for RO ${ro.id}:`, jobErr);
          // Continue with other ROs even if one fails
        }
      }
      
      console.log(`Total declined jobs found: ${allDeclinedJobs.length}`);
      if (allDeclinedJobs.length > 0) {
        console.log('Declined jobs:', allDeclinedJobs.map(j => ({ name: j.name, selected: j.selected, authorized: j.authorized })));
      }
      setDeclinedJobs(allDeclinedJobs);

    } catch (err) {
      console.error('VIN search error:', err);
      setError(err.response?.data?.error?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (newPage) => {
    if (vehicleInfo) {
      searchByVin(vin, newPage);
    }
  };

  const handleClear = () => {
    setVin('');
    setVehicleInfo(null);
    setRepairOrders([]);
    setDeclinedJobs([]);
    setExpandedRO(null);
    setLoadingRO(null);
    setError(null);
    setPagination({
      currentPage: 0,
      totalPages: 0,
      totalElements: 0,
      size: 20
    });
  };

  const handleROClick = async (ro) => {
    // If clicking the same RO, collapse it
    if (expandedRO && expandedRO.id === ro.id) {
      setExpandedRO(null);
      return;
    }

    // If RO already has full details (jobs), just expand it
    if (ro.jobs && ro.jobs.length > 0) {
      setExpandedRO(ro);
      return;
    }

    // Otherwise, fetch full RO details
    try {
      setLoadingRO(ro.id);
      const response = await getRepairOrder(ro.id);
      const fullRO = response.data;
      
      // Update the repair order in the list with full details
      setRepairOrders(prevOrders => 
        prevOrders.map(order => 
          order.id === ro.id ? fullRO : order
        )
      );
      
      setExpandedRO(fullRO);
    } catch (err) {
      console.error('Error fetching RO details:', err);
      setError(err.response?.data?.error?.message || err.message);
    } finally {
      setLoadingRO(null);
    }
  };

  const getStatusColor = (statusCode) => {
    const colors = {
      'ESTIMATE': '#f59e0b',
      'WORKINPROGRESS': '#8b5cf6',
      'COMPLETE': '#10b981',
      'SAVEDFORLATER': '#6b7280',
      'POSTED': '#059669',
      'ACCOUNTSRECEIVABLE': '#dc2626',
      'DELETED': '#ef4444',
    };
    return colors[statusCode] || '#6b7280';
  };

  const formatCurrency = (cents) => {
    if (!cents && cents !== 0) return '$0.00';
    return `$${(cents / 100).toFixed(2)}`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div>
      <div className="card">
        <h2>Search Work Orders by VIN</h2>
        <p style={{ color: '#6b7280', marginBottom: '1.5rem' }}>
          Enter a Vehicle Identification Number (VIN) to retrieve all repair orders for that vehicle.
        </p>

        {/* Search Form */}
        <form onSubmit={handleSearch} style={{ marginBottom: '2rem' }}>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end' }}>
            <div className="form-group" style={{ flex: 1, margin: 0 }}>
              <label>Vehicle Identification Number (VIN)</label>
              <input
                type="text"
                value={vin}
                onChange={handleVinChange}
                placeholder="Enter VIN (17 characters)"
                maxLength="17"
                style={{ 
                  fontFamily: 'monospace', 
                  fontSize: '1.1rem',
                  textTransform: 'uppercase'
                }}
                disabled={loading}
              />
              <small style={{ color: '#6b7280', fontSize: '0.85rem', marginTop: '0.25rem', display: 'block' }}>
                VIN should be 17 characters
              </small>
            </div>
            <button 
              type="submit" 
              className="btn btn-primary" 
              disabled={loading || !vin.trim()}
              style={{ minWidth: '120px' }}
            >
              {loading ? 'Searching...' : 'Search'}
            </button>
            {(vehicleInfo || error) && (
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

        {/* Loading Spinner */}
        {loading && <div className="spinner"></div>}

        {/* Vehicle Information */}
        {vehicleInfo && !loading && (
          <div style={{ marginBottom: '2rem' }}>
            <div style={{ 
              padding: '1.5rem', 
              backgroundColor: '#f0f9ff', 
              borderRadius: '8px',
              border: '2px solid #3b82f6'
            }}>
              <h3 style={{ marginBottom: '1rem', color: '#1e40af' }}>
                Vehicle Information
              </h3>
              <div className="grid" style={{ gridTemplateColumns: '1fr 1fr 1fr' }}>
                <div>
                  <strong>Vehicle:</strong>
                  <div style={{ fontSize: '1.1rem', marginTop: '0.25rem' }}>
                    {vehicleInfo.year} {vehicleInfo.make} {vehicleInfo.model}
                  </div>
                  {vehicleInfo.subModel && (
                    <div style={{ fontSize: '0.9rem', color: '#6b7280' }}>
                      {vehicleInfo.subModel}
                    </div>
                  )}
                </div>
                <div>
                  <strong>VIN:</strong>
                  <div style={{ 
                    fontSize: '1rem', 
                    fontFamily: 'monospace', 
                    marginTop: '0.25rem',
                    color: '#1e40af'
                  }}>
                    {vehicleInfo.vin}
                  </div>
                </div>
                <div>
                  <strong>License Plate:</strong>
                  <div style={{ fontSize: '1rem', marginTop: '0.25rem' }}>
                    {vehicleInfo.licensePlate || 'N/A'}
                    {vehicleInfo.state && ` (${vehicleInfo.state})`}
                  </div>
                </div>
              </div>
              <div className="grid" style={{ gridTemplateColumns: '1fr 1fr 1fr', marginTop: '1rem' }}>
                <div>
                  <strong>Color:</strong>
                  <div style={{ fontSize: '1rem', marginTop: '0.25rem' }}>
                    {vehicleInfo.color || 'N/A'}
                  </div>
                </div>
                <div>
                  <strong>Engine:</strong>
                  <div style={{ fontSize: '1rem', marginTop: '0.25rem' }}>
                    {vehicleInfo.engine || 'N/A'}
                  </div>
                </div>
                <div>
                  <strong>Transmission:</strong>
                  <div style={{ fontSize: '1rem', marginTop: '0.25rem' }}>
                    {vehicleInfo.transmission || 'N/A'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Repair Orders List */}
        {vehicleInfo && !loading && (
          <div>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              marginBottom: '1rem'
            }}>
              <h3>
                Repair Orders 
                {pagination.totalElements > 0 && (
                  <span style={{ color: '#6b7280', fontWeight: 'normal', fontSize: '0.9rem', marginLeft: '0.5rem' }}>
                    ({pagination.totalElements} total)
                  </span>
                )}
              </h3>
            </div>

            {repairOrders.length === 0 ? (
              <div style={{ 
                textAlign: 'center', 
                padding: '3rem', 
                backgroundColor: '#f9fafb',
                borderRadius: '8px',
                color: '#6b7280'
              }}>
                <p style={{ fontSize: '1.1rem' }}>No repair orders found for this vehicle.</p>
              </div>
            ) : (
              <>
                <div className="table-container">
                  <table>
                    <thead>
                      <tr>
                        <th style={{ width: '40px' }}></th>
                        <th>RO #</th>
                        <th>Date Created</th>
                        <th>Date Completed</th>
                        <th>Discounts</th>
                        <th>Total Price</th>
                      </tr>
                    </thead>
                    <tbody>
                      {repairOrders.map((ro) => {
                        const isExpanded = expandedRO && expandedRO.id === ro.id;
                        const isLoading = loadingRO === ro.id;
                        
                        return (
                          <React.Fragment key={ro.id}>
                            <tr 
                              onClick={() => handleROClick(ro)}
                              style={{ 
                                cursor: 'pointer',
                                backgroundColor: isExpanded ? '#f0f9ff' : 'transparent'
                              }}
                              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'}
                              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = isExpanded ? '#f0f9ff' : 'transparent'}
                            >
                              <td style={{ textAlign: 'center' }}>
                                {isLoading ? (
                                  <span style={{ fontSize: '0.8rem' }}>⟳</span>
                                ) : (
                                  <span style={{ 
                                    fontSize: '0.8rem',
                                    transition: 'transform 0.2s',
                                    display: 'inline-block',
                                    transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)'
                                  }}>
                                    ▶
                                  </span>
                                )}
                              </td>
                              <td>
                                <strong>#{ro.repairOrderNumber || ro.id}</strong>
                              </td>
                              <td>{formatDate(ro.createdDate)}</td>
                              <td>{formatDate(ro.completedDate)}</td>
                              <td style={{ color: '#dc2626' }}>
                                {formatCurrency(ro.discountTotal)}
                              </td>
                              <td>
                                <strong>{formatCurrency(ro.totalSales)}</strong>
                              </td>
                            </tr>
                            
                            {isExpanded && expandedRO.jobs && expandedRO.jobs.length > 0 && (() => {
                              // Filter to show only authorized services (exclude declined)
                              const authorizedJobs = expandedRO.jobs.filter(job => job.authorized === true);
                              
                              return authorizedJobs.length > 0 ? (
                                <tr>
                                  <td colSpan="6" style={{ 
                                    padding: 0,
                                    backgroundColor: '#f9fafb',
                                    borderTop: '2px solid #e5e7eb'
                                  }}>
                                    <div style={{ padding: '1.5rem' }}>
                                      <h4 style={{ 
                                        marginBottom: '1rem', 
                                        color: '#374151',
                                        fontSize: '1rem'
                                      }}>
                                        Services Performed ({authorizedJobs.length})
                                      </h4>
                                      
                                      <div style={{ 
                                        display: 'flex', 
                                        flexDirection: 'column',
                                        gap: '1rem'
                                      }}>
                                        {authorizedJobs.map((job, index) => (
                                        <div 
                                          key={job.id}
                                          style={{
                                            padding: '1rem',
                                            backgroundColor: 'white',
                                            borderRadius: '8px',
                                            border: '1px solid #e5e7eb',
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
                                                color: '#111827'
                                              }}>
                                                {index + 1}. {job.name}
                                              </div>
                                              {job.note && (
                                                <div style={{ 
                                                  fontSize: '0.875rem',
                                                  color: '#6b7280',
                                                  fontStyle: 'italic',
                                                  marginTop: '0.25rem'
                                                }}>
                                                  Note: {job.note}
                                                </div>
                                              )}
                                            </div>
                                            <div style={{ 
                                              display: 'flex',
                                              alignItems: 'center',
                                              gap: '1rem'
                                            }}>
                                              {job.authorized && (
                                                <div style={{ 
                                                  fontSize: '0.875rem',
                                                  fontWeight: '500',
                                                  color: '#10b981',
                                                  whiteSpace: 'nowrap'
                                                }}>
                                                  ✓ Authorized
                                                </div>
                                              )}
                                              <div style={{ 
                                                fontSize: '1.125rem',
                                                fontWeight: 'bold',
                                                color: '#111827',
                                                whiteSpace: 'nowrap'
                                              }}>
                                                {formatCurrency(job.subtotal)}
                                              </div>
                                            </div>
                                          </div>
                                          </div>
                                        ))}
                                      </div>
                                      
                                      <div style={{ 
                                        marginTop: '1rem',
                                        paddingTop: '1rem',
                                        borderTop: '2px solid #e5e7eb',
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
                                          color: '#111827'
                                        }}>
                                          Total: {formatCurrency(expandedRO.totalSales)}
                                        </div>
                                      </div>
                                    </div>
                                  </td>
                                </tr>
                              ) : null;
                            })()}
                            
                            {isExpanded && expandedRO.jobs && expandedRO.jobs.length > 0 && 
                             expandedRO.jobs.filter(job => job.authorized === true).length === 0 && (
                              <tr>
                                <td colSpan="6" style={{ 
                                  padding: '1.5rem',
                                  textAlign: 'center',
                                  backgroundColor: '#f9fafb',
                                  color: '#6b7280',
                                  fontStyle: 'italic',
                                  borderTop: '2px solid #e5e7eb'
                                }}>
                                  No authorized services for this repair order. See declined services below.
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {pagination.totalPages > 1 && (
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'center', 
                    alignItems: 'center',
                    gap: '1rem',
                    marginTop: '1.5rem'
                  }}>
                    <button
                      className="btn btn-secondary"
                      onClick={() => handlePageChange(pagination.currentPage - 1)}
                      disabled={pagination.currentPage === 0 || loading}
                      style={{ minWidth: '100px' }}
                    >
                      Previous
                    </button>
                    <span style={{ color: '#6b7280' }}>
                      Page {pagination.currentPage + 1} of {pagination.totalPages}
                    </span>
                    <button
                      className="btn btn-secondary"
                      onClick={() => handlePageChange(pagination.currentPage + 1)}
                      disabled={pagination.currentPage >= pagination.totalPages - 1 || loading}
                      style={{ minWidth: '100px' }}
                    >
                      Next
                    </button>
                  </div>
                )}

                {/* Summary */}
                {repairOrders.length > 0 && (
                  <div style={{ 
                    marginTop: '2rem',
                    padding: '1.5rem',
                    backgroundColor: '#f9fafb',
                    borderRadius: '8px'
                  }}>
                    <h4 style={{ marginBottom: '1rem' }}>Summary</h4>
                    <div className="grid" style={{ gridTemplateColumns: '1fr 1fr 1fr' }}>
                      <div>
                        <strong>Total Repair Orders:</strong>
                        <div style={{ fontSize: '1.1rem', marginTop: '0.25rem' }}>
                          {pagination.totalElements}
                        </div>
                      </div>
                      <div>
                        <strong>Total Discounts:</strong>
                        <div style={{ 
                          fontSize: '1.1rem', 
                          marginTop: '0.25rem',
                          color: '#dc2626',
                          fontWeight: '500'
                        }}>
                          {formatCurrency(repairOrders.reduce((sum, ro) => sum + (ro.discountTotal || 0), 0))}
                        </div>
                      </div>
                      <div>
                        <strong>Total Spent:</strong>
                        <div style={{ fontSize: '1.1rem', marginTop: '0.25rem', fontWeight: 'bold' }}>
                          {formatCurrency(repairOrders.reduce((sum, ro) => sum + (ro.totalSales || 0), 0))}
                        </div>
                      </div>
                    </div>
                    <div style={{ 
                      marginTop: '1rem',
                      paddingTop: '1rem',
                      borderTop: '1px solid #e5e7eb',
                      fontSize: '0.875rem',
                      color: '#6b7280'
                    }}>
                      💡 Tip: Click on any repair order to view detailed services performed
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Declined Services Section - Grouped by Repair Order */}
        {vehicleInfo && !loading && declinedJobs.length > 0 && (
          <div className="card" style={{ marginTop: '2rem' }}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              marginBottom: '1rem'
            }}>
              <h3 style={{ margin: 0 }}>
                Declined Services
                <span style={{ 
                  color: '#6b7280', 
                  fontWeight: 'normal', 
                  fontSize: '0.9rem', 
                  marginLeft: '0.5rem' 
                }}>
                  ({declinedJobs.length} total)
                </span>
              </h3>
            </div>
            
            <p style={{ color: '#6b7280', marginBottom: '1.5rem', fontSize: '0.95rem' }}>
              These services were recommended but not performed at the time.
            </p>

            {/* Group declined jobs by repair order */}
            {(() => {
              // Group jobs by repair order
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

              // Convert to array and sort by date (newest first)
              const sortedROs = Object.values(groupedByRO).sort((a, b) => 
                new Date(b.createdDate) - new Date(a.createdDate)
              );

              return (
                <div style={{ 
                  display: 'flex', 
                  flexDirection: 'column',
                  gap: '1.5rem'
                }}>
                  {sortedROs.map((ro) => (
                    <div 
                      key={ro.repairOrderId}
                      style={{
                        padding: '1.5rem',
                        backgroundColor: '#fef2f2',
                        borderRadius: '8px',
                        border: '2px solid #fecaca',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                      }}
                    >
                      {/* RO Header */}
                      <div style={{ 
                        marginBottom: '1rem',
                        paddingBottom: '0.75rem',
                        borderBottom: '1px solid #fecaca'
                      }}>
                        <div style={{ 
                          fontSize: '1.1rem',
                          fontWeight: '600',
                          color: '#991b1b',
                          marginBottom: '0.25rem'
                        }}>
                          Repair Order #{ro.repairOrderNumber}
                        </div>
                        <div style={{ 
                          fontSize: '0.875rem',
                          color: '#6b7280'
                        }}>
                          {formatDate(ro.createdDate)} • {ro.jobs.length} declined service{ro.jobs.length !== 1 ? 's' : ''}
                        </div>
                      </div>

                      {/* Declined Jobs for this RO */}
                      <div style={{ 
                        display: 'flex', 
                        flexDirection: 'column',
                        gap: '0.75rem'
                      }}>
                        {ro.jobs.map((job, index) => (
                          <div 
                            key={job.id}
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
                                  {index + 1}. {job.name}
                                </div>
                                {job.note && (
                                  <div style={{ 
                                    fontSize: '0.875rem',
                                    color: '#6b7280',
                                    fontStyle: 'italic',
                                    marginTop: '0.25rem'
                                  }}>
                                    Note: {job.note}
                                  </div>
                                )}
                              </div>
                              <div style={{ 
                                display: 'flex',
                                alignItems: 'center',
                                gap: '1rem'
                              }}>
                                <div style={{ 
                                  fontSize: '0.875rem',
                                  fontWeight: '500',
                                  color: '#dc2626',
                                  whiteSpace: 'nowrap'
                                }}>
                                  ✗ Declined
                                </div>
                                <div style={{ 
                                  fontSize: '1.125rem',
                                  fontWeight: 'bold',
                                  color: '#991b1b',
                                  whiteSpace: 'nowrap'
                                }}>
                                  {formatCurrency(job.subtotal)}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* RO Total */}
                      <div style={{ 
                        marginTop: '0.75rem',
                        paddingTop: '0.75rem',
                        borderTop: '1px solid #fecaca',
                        textAlign: 'right',
                        fontSize: '0.95rem',
                        color: '#991b1b',
                        fontWeight: '600'
                      }}>
                        RO Total: {formatCurrency(ro.jobs.reduce((sum, job) => sum + (job.subtotal || 0), 0))}
                      </div>
                    </div>
                  ))}
                </div>
              );
            })()}

            {/* Overall Declined Jobs Summary */}
            <div style={{ 
              marginTop: '1.5rem',
              padding: '1rem',
              backgroundColor: '#fef2f2',
              borderRadius: '8px',
              border: '2px solid #dc2626'
            }}>
              <div style={{ 
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div>
                  <strong style={{ color: '#991b1b' }}>Total Declined Services:</strong>
                  <span style={{ marginLeft: '0.5rem', color: '#6b7280' }}>
                    {declinedJobs.length} service{declinedJobs.length !== 1 ? 's' : ''}
                  </span>
                </div>
                <div>
                  <strong style={{ color: '#991b1b' }}>Potential Value:</strong>
                  <span style={{ 
                    marginLeft: '0.5rem', 
                    fontSize: '1.125rem',
                    fontWeight: 'bold',
                    color: '#991b1b'
                  }}>
                    {formatCurrency(declinedJobs.reduce((sum, job) => sum + (job.subtotal || 0), 0))}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default VinSearch;
