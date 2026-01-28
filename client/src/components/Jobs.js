import React, { useState, useEffect } from 'react';
import { getJobs, getJob, updateJob, getCannedJobs, addCannedJobsToRO } from '../services/api';

function Jobs() {
  const [jobs, setJobs] = useState([]);
  const [filteredJobs, setFilteredJobs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [selectedJob, setSelectedJob] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [authorizedFilter, setAuthorizedFilter] = useState('');
  const [roStatusFilter, setRoStatusFilter] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    note: '',
    technicianId: '',
    loggedHours: '',
    completed: false,
  });

  useEffect(() => {
    loadJobs();
  }, []);

  const loadJobs = async (authorized = '', roStatus = '') => {
    setLoading(true);
    setError(null);
    try {
      const shopId = localStorage.getItem('tekmetric_shop_id');
      const params = { shop: shopId, size: 100 };
      
      if (authorized !== '') {
        params.authorized = authorized === 'true';
      }
      
      if (roStatus) {
        params.repairOrderStatusId = roStatus;
      }
      
      const response = await getJobs(params);
      const jobData = Array.isArray(response.data) ? response.data : response.data.content || [];
      setJobs(jobData);
      setFilteredJobs(jobData);
    } catch (err) {
      setError(err.response?.data?.error?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    const term = e.target.value.toLowerCase();
    setSearchTerm(term);
    
    if (term.trim()) {
      const filtered = jobs.filter(job => 
        job.name?.toLowerCase().includes(term) ||
        job.id?.toString().includes(term) ||
        job.repairOrderId?.toString().includes(term) ||
        job.customerId?.toString().includes(term) ||
        job.vehicleId?.toString().includes(term) ||
        job.note?.toLowerCase().includes(term)
      );
      setFilteredJobs(filtered);
    } else {
      setFilteredJobs(jobs);
    }
  };

  const handleAuthorizedFilter = (e) => {
    const value = e.target.value;
    setAuthorizedFilter(value);
    loadJobs(value, roStatusFilter);
  };

  const handleROStatusFilter = (e) => {
    const value = e.target.value;
    setRoStatusFilter(value);
    loadJobs(authorizedFilter, value);
  };

  const handleJobClick = async (job) => {
    try {
      setLoading(true);
      // Fetch full job details
      const response = await getJob(job.id);
      const fullJob = response.data;
      
      setSelectedJob(fullJob);
      setFormData({
        name: fullJob.name || '',
        note: fullJob.note || '',
        technicianId: fullJob.technicianId || '',
        loggedHours: fullJob.loggedHours || '',
        completed: fullJob.completed || false,
      });
      setShowModal(true);
      setEditMode(false);
      setError(null);
      setSuccess(null);
    } catch (err) {
      setError(err.response?.data?.error?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedJob(null);
    setEditMode(false);
    setFormData({
      name: '',
      note: '',
      technicianId: '',
      loggedHours: '',
      completed: false,
    });
    setError(null);
    setSuccess(null);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleUpdateJob = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const updateData = {};
      
      // Only include changed fields
      if (formData.name !== (selectedJob.name || '')) {
        updateData.name = formData.name;
      }
      
      if (formData.note !== (selectedJob.note || '')) {
        updateData.note = formData.note;
      }
      
      if (formData.technicianId && formData.technicianId !== (selectedJob.technicianId || '')) {
        updateData.technicianId = parseInt(formData.technicianId);
      }
      
      if (formData.loggedHours && formData.loggedHours !== (selectedJob.loggedHours || '')) {
        updateData.loggedHours = parseFloat(formData.loggedHours);
      }
      
      if (formData.completed !== (selectedJob.completed || false)) {
        updateData.completed = formData.completed;
      }
      
      await updateJob(selectedJob.id, updateData);
      setSuccess('Job updated successfully!');
      setEditMode(false);
      loadJobs(authorizedFilter, roStatusFilter);
      
      // Refresh the selected job data
      const response = await getJob(selectedJob.id);
      setSelectedJob(response.data);
      
      setTimeout(() => {
        setSuccess(null);
      }, 3000);
    } catch (err) {
      setError(err.response?.data?.error?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (cents) => {
    if (!cents && cents !== 0) return '$0.00';
    return `$${(cents / 100).toFixed(2)}`;
  };

  return (
    <div>
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2>Jobs</h2>
          <button className="btn btn-secondary" onClick={() => loadJobs(authorizedFilter, roStatusFilter)}>
            Refresh
          </button>
        </div>

        {/* Search and Filter Bar */}
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
          <div className="search-container" style={{ flex: 1, minWidth: '250px' }}>
            <input
              type="text"
              className="search-input"
              placeholder="Search by job name, ID, RO, customer, vehicle..."
              value={searchTerm}
              onChange={handleSearch}
            />
            {searchTerm && (
              <button 
                className="search-clear"
                onClick={() => {
                  setSearchTerm('');
                  setFilteredJobs(jobs);
                }}
              >
                ✕
              </button>
            )}
          </div>
          <div className="form-group" style={{ margin: 0, minWidth: '150px' }}>
            <select
              value={authorizedFilter}
              onChange={handleAuthorizedFilter}
              style={{ width: '100%' }}
            >
              <option value="">All Jobs</option>
              <option value="true">Authorized</option>
              <option value="false">Not Authorized</option>
            </select>
          </div>
          <div className="form-group" style={{ margin: 0, minWidth: '180px' }}>
            <select
              value={roStatusFilter}
              onChange={handleROStatusFilter}
              style={{ width: '100%' }}
            >
              <option value="">All RO Statuses</option>
              <option value="1">Estimate</option>
              <option value="2">Work-in-Progress</option>
              <option value="3">Complete</option>
              <option value="4">Saved for Later</option>
              <option value="5">Posted</option>
              <option value="6">Accounts Receivable</option>
            </select>
          </div>
        </div>

        {error && !showModal && (
          <div className="alert alert-error" style={{ marginTop: '1rem' }}>
            <strong>Error:</strong> {error}
          </div>
        )}

        {loading && !showModal ? (
          <div className="spinner"></div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Job ID</th>
                  <th>Name</th>
                  <th>RO #</th>
                  <th>Customer</th>
                  <th>Vehicle</th>
                  <th>Status</th>
                  <th>Category</th>
                  <th>Labor</th>
                  <th>Parts</th>
                  <th>Fees</th>
                  <th>Discounts</th>
                  <th>Subtotal</th>
                  <th>Technician</th>
                  <th>Hours</th>
                </tr>
              </thead>
              <tbody>
                {filteredJobs.length === 0 ? (
                  <tr>
                    <td colSpan="14" style={{ textAlign: 'center', padding: '2rem' }}>
                      {searchTerm || authorizedFilter || roStatusFilter ? 'No jobs found matching your filters' : 'No jobs found.'}
                    </td>
                  </tr>
                ) : (
                  filteredJobs.map((job) => (
                    <tr 
                      key={job.id} 
                      onClick={() => handleJobClick(job)}
                      style={{ cursor: 'pointer' }}
                    >
                      <td><strong>#{job.id}</strong></td>
                      <td>{job.name || 'N/A'}</td>
                      <td>{job.repairOrderId || 'N/A'}</td>
                      <td>{job.customerId || 'N/A'}</td>
                      <td>{job.vehicleId || 'N/A'}</td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap' }}>
                          {job.authorized && (
                            <span style={{
                              padding: '0.15rem 0.5rem',
                              borderRadius: '8px',
                              fontSize: '0.7rem',
                              fontWeight: '600',
                              backgroundColor: '#d1fae5',
                              color: '#065f46'
                            }}>
                              ✓ Auth
                            </span>
                          )}
                          {job.selected && (
                            <span style={{
                              padding: '0.15rem 0.5rem',
                              borderRadius: '8px',
                              fontSize: '0.7rem',
                              fontWeight: '600',
                              backgroundColor: '#dbeafe',
                              color: '#1e40af'
                            }}>
                              Selected
                            </span>
                          )}
                          {job.archived && (
                            <span style={{
                              padding: '0.15rem 0.5rem',
                              borderRadius: '8px',
                              fontSize: '0.7rem',
                              fontWeight: '600',
                              backgroundColor: '#fee2e2',
                              color: '#991b1b'
                            }}>
                              Archived
                            </span>
                          )}
                        </div>
                      </td>
                      <td style={{ fontSize: '0.85rem' }}>{job.jobCategoryName || 'N/A'}</td>
                      <td>{formatCurrency(job.laborTotal)}</td>
                      <td>{formatCurrency(job.partsTotal)}</td>
                      <td>{formatCurrency(job.feeTotal)}</td>
                      <td style={{ color: '#dc2626' }}>{formatCurrency(job.discountTotal)}</td>
                      <td><strong>{formatCurrency(job.subtotal)}</strong></td>
                      <td>{job.technicianId || 'N/A'}</td>
                      <td>
                        <div style={{ fontSize: '0.85rem' }}>
                          <div>{job.laborHours ? `${job.laborHours}h` : 'N/A'}</div>
                          {job.loggedHours && (
                            <div style={{ color: '#6b7280' }}>({job.loggedHours}h logged)</div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit Job Modal */}
      {showModal && selectedJob && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '1000px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="modal-header">
              <h2>Job: {selectedJob.name}</h2>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                {!editMode && (
                  <button 
                    className="btn btn-primary" 
                    onClick={() => setEditMode(true)}
                    style={{ fontSize: '0.9rem', padding: '0.5rem 1rem' }}
                  >
                    Edit
                  </button>
                )}
                <button className="modal-close" onClick={handleCloseModal}>&times;</button>
              </div>
            </div>

            {error && (
              <div className="alert alert-error">
                <strong>Error:</strong> {error}
              </div>
            )}

            {success && (
              <div className="alert alert-success">
                <strong>Success!</strong> {success}
              </div>
            )}

            <form onSubmit={handleUpdateJob}>
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
                  <label>Job Name {editMode && '*'}</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    disabled={!editMode}
                    style={!editMode ? { backgroundColor: '#e5e7eb', cursor: 'not-allowed' } : {}}
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

                <div className="form-group">
                  <label>Notes {editMode && '*'}</label>
                  <textarea
                    name="note"
                    value={formData.note}
                    onChange={handleChange}
                    disabled={!editMode}
                    rows="3"
                    style={!editMode ? { backgroundColor: '#e5e7eb', cursor: 'not-allowed' } : {}}
                  />
                </div>
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
                    <label>Archived</label>
                    <input
                      type="text"
                      value={selectedJob.archived ? 'Yes' : 'No'}
                      disabled
                      style={{ 
                        backgroundColor: '#e5e7eb', 
                        cursor: 'not-allowed',
                        color: selectedJob.archived ? '#dc2626' : '#6b7280'
                      }}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Authorized Date</label>
                  <input
                    type="text"
                    value={selectedJob.authorizedDate ? new Date(selectedJob.authorizedDate).toLocaleString() : 'N/A'}
                    disabled
                    style={{ backgroundColor: '#e5e7eb', cursor: 'not-allowed' }}
                  />
                </div>

                <div className="form-group">
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <input
                      type="checkbox"
                      name="completed"
                      checked={formData.completed}
                      onChange={handleChange}
                      disabled={!editMode}
                      style={{ width: 'auto', margin: 0 }}
                    />
                    Job Completed {editMode && '*'}
                  </label>
                </div>
              </div>

              {/* Technician & Hours */}
              <div style={{ marginBottom: '2rem', padding: '1.5rem', backgroundColor: '#f9fafb', borderRadius: '8px' }}>
                <h3 style={{ marginBottom: '1rem', color: '#374151', fontSize: '1.1rem' }}>Technician & Hours</h3>
                
                <div className="grid" style={{ gridTemplateColumns: '1fr 1fr 1fr' }}>
                  <div className="form-group">
                    <label>Technician ID {editMode && '*'}</label>
                    <input
                      type="number"
                      name="technicianId"
                      value={formData.technicianId}
                      onChange={handleChange}
                      disabled={!editMode}
                      placeholder="Employee ID"
                      style={!editMode ? { backgroundColor: '#e5e7eb', cursor: 'not-allowed' } : {}}
                    />
                  </div>
                  <div className="form-group">
                    <label>Labor Hours</label>
                    <input
                      type="text"
                      value={selectedJob.laborHours || 'N/A'}
                      disabled
                      style={{ backgroundColor: '#e5e7eb', cursor: 'not-allowed' }}
                    />
                  </div>
                  <div className="form-group">
                    <label>Logged Hours {editMode && '*'}</label>
                    <input
                      type="number"
                      name="loggedHours"
                      value={formData.loggedHours}
                      onChange={handleChange}
                      disabled={!editMode}
                      step="0.01"
                      placeholder="0.00"
                      style={!editMode ? { backgroundColor: '#e5e7eb', cursor: 'not-allowed' } : {}}
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

              {/* Action Buttons */}
              {editMode && (
                <div style={{ display: 'flex', gap: '1rem', paddingTop: '1rem', borderTop: '2px solid #e5e7eb' }}>
                  <button type="submit" className="btn btn-primary" disabled={loading}>
                    {loading ? 'Updating...' : 'Save Changes'}
                  </button>
                  <button 
                    type="button" 
                    className="btn btn-secondary" 
                    onClick={() => {
                      setEditMode(false);
                      setError(null);
                      // Reset form data
                      setFormData({
                        name: selectedJob.name || '',
                        note: selectedJob.note || '',
                        technicianId: selectedJob.technicianId || '',
                        loggedHours: selectedJob.loggedHours || '',
                        completed: selectedJob.completed || false,
                      });
                    }}
                  >
                    Cancel
                  </button>
                </div>
              )}
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Jobs;
