import React, { useState, useEffect } from 'react';
import { getRepairOrders, getRepairOrder, updateRepairOrder } from '../services/api';

function RepairOrders() {
  const [repairOrders, setRepairOrders] = useState([]);
  const [filteredRepairOrders, setFilteredRepairOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [selectedRO, setSelectedRO] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [labelFilter, setLabelFilter] = useState('');
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    keyTag: '',
    milesIn: '',
    milesOut: '',
    technicianId: '',
    serviceWriterId: '',
    customerTimeOut: '',
    repairOrderLabelId: '',
    // Additional fields for display/editing
    customerId: '',
    vehicleId: '',
    appointmentStartTime: '',
    notes: '',
  });

  useEffect(() => {
    loadRepairOrders();
  }, []);

  const loadRepairOrders = async (searchQuery = '', status = '', label = '') => {
    setLoading(true);
    setError(null);
    try {
      const shopId = localStorage.getItem('tekmetric_shop_id');
      const params = { shop: shopId, size: 100 };
      
      if (searchQuery.trim()) {
        params.search = searchQuery;
      }
      
      if (status) {
        params.repairOrderStatusId = status;
      }
      
      if (label) {
        params.repairOrderLabelId = label;
      }
      
      const response = await getRepairOrders(params);
      const roData = Array.isArray(response.data) ? response.data : response.data.content || [];
      setRepairOrders(roData);
      setFilteredRepairOrders(roData);
    } catch (err) {
      setError(err.response?.data?.error?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    const term = e.target.value;
    setSearchTerm(term);
    loadRepairOrders(term, statusFilter, labelFilter);
  };

  const handleStatusFilter = (e) => {
    const status = e.target.value;
    setStatusFilter(status);
    loadRepairOrders(searchTerm, status, labelFilter);
  };

  const handleLabelFilter = (e) => {
    const label = e.target.value;
    setLabelFilter(label);
    loadRepairOrders(searchTerm, statusFilter, label);
  };

  const handleROClick = async (ro) => {
    try {
      setLoading(true);
      // Fetch full RO details
      const response = await getRepairOrder(ro.id);
      const fullRO = response.data;
      
      setSelectedRO(fullRO);
      setFormData({
        keyTag: fullRO.keytag || '',
        milesIn: fullRO.milesIn || '',
        milesOut: fullRO.milesOut || '',
        technicianId: fullRO.technicianId || '',
        serviceWriterId: fullRO.serviceWriterId || '',
        customerTimeOut: fullRO.customerTimeOut ? fullRO.customerTimeOut.substring(0, 16) : '',
        repairOrderLabelId: fullRO.repairOrderLabel?.id?.toString() || '',
        customerId: fullRO.customerId || '',
        vehicleId: fullRO.vehicleId || '',
        appointmentStartTime: fullRO.appointmentStartTime ? fullRO.appointmentStartTime.substring(0, 16) : '',
        notes: '', // Can be used for internal notes
      });
      console.log('Loaded RO with label:', fullRO.repairOrderLabel);
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
    setSelectedRO(null);
    setEditMode(false);
    setFormData({
      keyTag: '',
      milesIn: '',
      milesOut: '',
      technicianId: '',
      serviceWriterId: '',
      customerTimeOut: '',
      repairOrderLabelId: '',
      customerId: '',
      vehicleId: '',
      appointmentStartTime: '',
      notes: '',
    });
    setError(null);
    setSuccess(null);
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleUpdateRO = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      // Check if repair order is active
      const inactiveStatuses = ['COMPLETE', 'INVOICED', 'CLOSED', 'CANCELLED'];
      if (selectedRO.repairOrderStatus && inactiveStatuses.includes(selectedRO.repairOrderStatus.code)) {
        setError(`Cannot update: Repair Order status is "${selectedRO.repairOrderStatus.name}". Only active repair orders can be updated.`);
        setLoading(false);
        return;
      }
      
      const updateData = {};
      
      // Only include changed fields
      if (formData.keyTag !== (selectedRO.keytag || '')) {
        updateData.keyTag = formData.keyTag || null;
      }
      
      if (formData.milesIn && formData.milesIn !== (selectedRO.milesIn || '')) {
        updateData.milesIn = parseInt(formData.milesIn) || null;
      }
      
      if (formData.milesOut && formData.milesOut !== (selectedRO.milesOut || '')) {
        updateData.milesOut = parseInt(formData.milesOut) || null;
      }
      
      if (formData.technicianId && formData.technicianId !== (selectedRO.technicianId || '')) {
        updateData.technicianId = parseInt(formData.technicianId) || null;
      }
      
      if (formData.serviceWriterId && formData.serviceWriterId !== (selectedRO.serviceWriterId || '')) {
        updateData.serviceWriterId = parseInt(formData.serviceWriterId) || null;
      }
      
      if (formData.customerTimeOut) {
        const isoDate = new Date(formData.customerTimeOut).toISOString();
        if (isoDate !== selectedRO.customerTimeOut) {
          updateData.customerTimeOut = isoDate;
        }
      }
      
      if (formData.repairOrderLabelId && formData.repairOrderLabelId !== (selectedRO.repairOrderLabel?.id?.toString() || '')) {
        updateData.repairOrderLabelId = parseInt(formData.repairOrderLabelId);
        console.log(`Updating label from ${selectedRO.repairOrderLabel?.id} to ${formData.repairOrderLabelId}`);
      }
      
      // Check if there are any changes
      if (Object.keys(updateData).length === 0) {
        setError('No changes detected');
        setLoading(false);
        return;
      }
      
      console.log('Sending update data:', updateData);
      await updateRepairOrder(selectedRO.id, updateData);
      setSuccess('Repair Order updated successfully!');
      setEditMode(false);
      loadRepairOrders(searchTerm, statusFilter, labelFilter);
      
      // Refresh the selected RO data
      const response = await getRepairOrder(selectedRO.id);
      setSelectedRO(response.data);
      
      setTimeout(() => {
        setSuccess(null);
      }, 3000);
    } catch (err) {
      setError(err.response?.data?.error?.message || err.message);
    } finally {
      setLoading(false);
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

  return (
    <div>
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2>Repair Orders</h2>
          <button className="btn btn-secondary" onClick={() => loadRepairOrders(searchTerm, statusFilter)}>
            Refresh
          </button>
        </div>

        {/* Search and Filter Bar */}
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
          <div className="search-container" style={{ flex: 1 }}>
            <input
              type="text"
              className="search-input"
              placeholder="Search by RO #, customer name, or vehicle..."
              value={searchTerm}
              onChange={handleSearch}
            />
            {searchTerm && (
              <button 
                className="search-clear"
                onClick={() => {
                  setSearchTerm('');
                  loadRepairOrders('', statusFilter);
                }}
              >
                ✕
              </button>
            )}
          </div>
          <div className="form-group" style={{ margin: 0, minWidth: '200px' }}>
            <select
              value={statusFilter}
              onChange={handleStatusFilter}
              style={{ width: '100%' }}
            >
              <option value="">All Statuses</option>
              <option value="1">Estimate</option>
              <option value="2">Work-in-Progress</option>
              <option value="3">Complete</option>
              <option value="4">Saved for Later</option>
              <option value="5">Posted</option>
              <option value="6">Accounts Receivable</option>
              <option value="7">Deleted</option>
            </select>
          </div>
          <div className="form-group" style={{ margin: 0, minWidth: '200px' }}>
            <select
              value={labelFilter}
              onChange={handleLabelFilter}
              style={{ width: '100%' }}
            >
              <option value="">All Labels</option>
              <option value="1">Work Not Started</option>
              <option value="2">Waiting for Parts</option>
              <option value="3">Waiting for Authorization</option>
              <option value="4">In Progress</option>
              <option value="5">Quality Control</option>
              <option value="6">Ready for Pickup</option>
              <option value="7">Completed</option>
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
                  <th>RO #</th>
                  <th>Status</th>
                  <th>Customer</th>
                  <th>Vehicle</th>
                  <th>Labor</th>
                  <th>Parts</th>
                  <th>Sublets</th>
                  <th>Fees</th>
                  <th>Discounts</th>
                  <th>Total Sales</th>
                  <th>Amount Paid</th>
                  <th>Created</th>
                </tr>
              </thead>
              <tbody>
                {filteredRepairOrders.length === 0 ? (
                  <tr>
                    <td colSpan="12" style={{ textAlign: 'center', padding: '2rem' }}>
                      {searchTerm || statusFilter ? 'No repair orders found matching your filters' : 'No repair orders found.'}
                    </td>
                  </tr>
                ) : (
                  filteredRepairOrders.map((ro) => (
                    <tr 
                      key={ro.id} 
                      onClick={() => handleROClick(ro)}
                      style={{ cursor: 'pointer' }}
                    >
                      <td><strong>#{ro.repairOrderNumber || ro.id}</strong></td>
                      <td>
                        <span style={{
                          padding: '0.25rem 0.75rem',
                          borderRadius: '12px',
                          fontSize: '0.75rem',
                          fontWeight: '600',
                          color: 'white',
                          backgroundColor: getStatusColor(ro.repairOrderStatus?.code)
                        }}>
                          {ro.repairOrderStatus?.name || 'Unknown'}
                        </span>
                      </td>
                      <td>{ro.customerId || 'N/A'}</td>
                      <td>{ro.vehicleId || 'N/A'}</td>
                      <td>{formatCurrency(ro.laborSales)}</td>
                      <td>{formatCurrency(ro.partsSales)}</td>
                      <td>{formatCurrency(ro.subletSales)}</td>
                      <td>{formatCurrency(ro.feeTotal)}</td>
                      <td style={{ color: '#dc2626' }}>{formatCurrency(ro.discountTotal)}</td>
                      <td><strong>{formatCurrency(ro.totalSales)}</strong></td>
                      <td style={{ color: '#10b981' }}>{formatCurrency(ro.amountPaid)}</td>
                      <td>{ro.createdDate ? new Date(ro.createdDate).toLocaleDateString() : 'N/A'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit Repair Order Modal */}
      {showModal && selectedRO && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '1000px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="modal-header">
              <h2>Repair Order #{selectedRO.repairOrderNumber}</h2>
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

            <form onSubmit={handleUpdateRO}>
              {/* Basic Information */}
              <div style={{ marginBottom: '2rem', padding: '1.5rem', backgroundColor: '#f9fafb', borderRadius: '8px' }}>
                <h3 style={{ marginBottom: '1rem', color: '#374151', fontSize: '1.1rem' }}>Basic Information</h3>
                
                <div className="grid" style={{ gridTemplateColumns: '1fr 1fr 1fr' }}>
                  <div className="form-group">
                    <label>RO ID</label>
                    <input
                      type="text"
                      value={selectedRO.id}
                      disabled
                      style={{ backgroundColor: '#e5e7eb', cursor: 'not-allowed' }}
                    />
                  </div>
                  <div className="form-group">
                    <label>RO Number</label>
                    <input
                      type="text"
                      value={selectedRO.repairOrderNumber}
                      disabled
                      style={{ backgroundColor: '#e5e7eb', cursor: 'not-allowed' }}
                    />
                  </div>
                  <div className="form-group">
                    <label>Shop ID</label>
                    <input
                      type="text"
                      value={selectedRO.shopId}
                      disabled
                      style={{ backgroundColor: '#e5e7eb', cursor: 'not-allowed' }}
                    />
                  </div>
                </div>

                <div className="grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
                  <div className="form-group">
                    <label>Status</label>
                    <input
                      type="text"
                      value={selectedRO.repairOrderStatus?.name || 'Unknown'}
                      disabled
                      style={{ backgroundColor: '#e5e7eb', cursor: 'not-allowed' }}
                    />
                  </div>
                  <div className="form-group">
                    <label>Label {editMode && '*'}</label>
                    {editMode ? (
                      <select
                        name="repairOrderLabelId"
                        value={formData.repairOrderLabelId}
                        onChange={handleChange}
                      >
                        <option value="">Select Label...</option>
                        <option value="1">Work Not Started</option>
                        <option value="2">Waiting for Parts</option>
                        <option value="3">Waiting for Authorization</option>
                        <option value="4">In Progress</option>
                        <option value="5">Quality Control</option>
                        <option value="6">Ready for Pickup</option>
                        <option value="7">Completed</option>
                      </select>
                    ) : (
                      <input
                        type="text"
                        value={selectedRO.repairOrderLabel?.name || 'N/A'}
                        disabled
                        style={{ backgroundColor: '#e5e7eb', cursor: 'not-allowed' }}
                      />
                    )}
                  </div>
                </div>

                <div className="grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
                  <div className="form-group">
                    <label>Customer ID</label>
                    <input
                      type="number"
                      name="customerId"
                      value={formData.customerId}
                      onChange={handleChange}
                      disabled={!editMode}
                      style={!editMode ? { backgroundColor: '#e5e7eb', cursor: 'not-allowed' } : {}}
                    />
                  </div>
                  <div className="form-group">
                    <label>Vehicle ID</label>
                    <input
                      type="number"
                      name="vehicleId"
                      value={formData.vehicleId}
                      onChange={handleChange}
                      disabled={!editMode}
                      style={!editMode ? { backgroundColor: '#e5e7eb', cursor: 'not-allowed' } : {}}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Appointment Start Time</label>
                  <input
                    type="datetime-local"
                    name="appointmentStartTime"
                    value={formData.appointmentStartTime}
                    onChange={handleChange}
                    disabled={!editMode}
                    style={!editMode ? { backgroundColor: '#e5e7eb', cursor: 'not-allowed' } : {}}
                  />
                </div>
              </div>

              {/* Vehicle & Service Information */}
              <div style={{ marginBottom: '2rem', padding: '1.5rem', backgroundColor: '#f9fafb', borderRadius: '8px' }}>
                <h3 style={{ marginBottom: '1rem', color: '#374151', fontSize: '1.1rem' }}>Vehicle & Service Information</h3>

                <div className="grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
                  <div className="form-group">
                    <label>Key Tag {editMode && '*'}</label>
                    <input
                      type="text"
                      name="keyTag"
                      value={formData.keyTag}
                      onChange={handleChange}
                      disabled={!editMode}
                      placeholder="Enter key tag number"
                      style={!editMode ? { backgroundColor: '#e5e7eb', cursor: 'not-allowed' } : {}}
                    />
                  </div>
                  <div className="form-group">
                    <label>Promise Time {editMode && '*'}</label>
                    <input
                      type="datetime-local"
                      name="customerTimeOut"
                      value={formData.customerTimeOut}
                      onChange={handleChange}
                      disabled={!editMode}
                      style={!editMode ? { backgroundColor: '#e5e7eb', cursor: 'not-allowed' } : {}}
                    />
                  </div>
                </div>

                <div className="grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
                  <div className="form-group">
                    <label>Miles In {editMode && '*'}</label>
                    <input
                      type="number"
                      name="milesIn"
                      value={formData.milesIn}
                      onChange={handleChange}
                      disabled={!editMode}
                      placeholder="Odometer reading in"
                      style={!editMode ? { backgroundColor: '#e5e7eb', cursor: 'not-allowed' } : {}}
                    />
                  </div>
                  <div className="form-group">
                    <label>Miles Out {editMode && '*'}</label>
                    <input
                      type="number"
                      name="milesOut"
                      value={formData.milesOut}
                      onChange={handleChange}
                      disabled={!editMode}
                      placeholder="Odometer reading out"
                      style={!editMode ? { backgroundColor: '#e5e7eb', cursor: 'not-allowed' } : {}}
                    />
                  </div>
                </div>

                <div className="grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
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
                    <label>Service Writer ID {editMode && '*'}</label>
                    <input
                      type="number"
                      name="serviceWriterId"
                      value={formData.serviceWriterId}
                      onChange={handleChange}
                      disabled={!editMode}
                      placeholder="Employee ID"
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
                    <label>Labor Sales</label>
                    <input
                      type="text"
                      value={formatCurrency(selectedRO.laborSales)}
                      disabled
                      style={{ backgroundColor: '#e5e7eb', cursor: 'not-allowed' }}
                    />
                  </div>
                  <div className="form-group">
                    <label>Parts Sales</label>
                    <input
                      type="text"
                      value={formatCurrency(selectedRO.partsSales)}
                      disabled
                      style={{ backgroundColor: '#e5e7eb', cursor: 'not-allowed' }}
                    />
                  </div>
                  <div className="form-group">
                    <label>Sublet Sales</label>
                    <input
                      type="text"
                      value={formatCurrency(selectedRO.subletSales)}
                      disabled
                      style={{ backgroundColor: '#e5e7eb', cursor: 'not-allowed' }}
                    />
                  </div>
                  <div className="form-group">
                    <label>Fees</label>
                    <input
                      type="text"
                      value={formatCurrency(selectedRO.feeTotal)}
                      disabled
                      style={{ backgroundColor: '#e5e7eb', cursor: 'not-allowed' }}
                    />
                  </div>
                </div>

                <div className="grid" style={{ gridTemplateColumns: '1fr 1fr 1fr 1fr' }}>
                  <div className="form-group">
                    <label>Discounts</label>
                    <input
                      type="text"
                      value={formatCurrency(selectedRO.discountTotal)}
                      disabled
                      style={{ backgroundColor: '#e5e7eb', cursor: 'not-allowed', color: '#dc2626' }}
                    />
                  </div>
                  <div className="form-group">
                    <label>Taxes</label>
                    <input
                      type="text"
                      value={formatCurrency(selectedRO.taxes)}
                      disabled
                      style={{ backgroundColor: '#e5e7eb', cursor: 'not-allowed' }}
                    />
                  </div>
                  <div className="form-group">
                    <label>Total Sales</label>
                    <input
                      type="text"
                      value={formatCurrency(selectedRO.totalSales)}
                      disabled
                      style={{ backgroundColor: '#e5e7eb', cursor: 'not-allowed', fontWeight: 'bold' }}
                    />
                  </div>
                  <div className="form-group">
                    <label>Amount Paid</label>
                    <input
                      type="text"
                      value={formatCurrency(selectedRO.amountPaid)}
                      disabled
                      style={{ backgroundColor: '#e5e7eb', cursor: 'not-allowed', color: '#10b981' }}
                    />
                  </div>
                </div>
              </div>

              {/* Jobs */}
              {selectedRO.jobs && selectedRO.jobs.length > 0 && (
                <div style={{ marginBottom: '2rem', padding: '1.5rem', backgroundColor: '#f9fafb', borderRadius: '8px' }}>
                  <h3 style={{ marginBottom: '1rem', color: '#374151', fontSize: '1.1rem' }}>Jobs ({selectedRO.jobs.length})</h3>
                  {selectedRO.jobs.map((job, index) => (
                    <div key={job.id} style={{ 
                      padding: '1rem', 
                      backgroundColor: 'white', 
                      borderRadius: '6px', 
                      marginBottom: '1rem',
                      border: '1px solid #e5e7eb'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                        <div>
                          <strong style={{ fontSize: '1.05rem' }}>{job.name}</strong>
                          {job.authorized && <span style={{ marginLeft: '0.5rem', color: '#10b981', fontSize: '0.85rem' }}>✓ Authorized</span>}
                          {job.selected && <span style={{ marginLeft: '0.5rem', color: '#3b82f6', fontSize: '0.85rem' }}>● Selected</span>}
                        </div>
                        <div>
                          <strong style={{ fontSize: '1.1rem' }}>{formatCurrency(job.subtotal)}</strong>
                        </div>
                      </div>
                      
                      <div className="grid" style={{ gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '0.5rem', fontSize: '0.85rem', color: '#6b7280' }}>
                        <div><strong>Parts:</strong> {formatCurrency(job.partsTotal)}</div>
                        <div><strong>Labor:</strong> {formatCurrency(job.laborTotal)}</div>
                        <div><strong>Fees:</strong> {formatCurrency(job.feeTotal)}</div>
                        <div><strong>Discounts:</strong> {formatCurrency(job.discountTotal)}</div>
                      </div>
                      
                      {job.note && (
                        <div style={{ fontSize: '0.85rem', color: '#6b7280', marginTop: '0.5rem', fontStyle: 'italic' }}>
                          Note: {job.note}
                        </div>
                      )}
                      
                      {job.technicianId && (
                        <div style={{ fontSize: '0.85rem', color: '#6b7280', marginTop: '0.25rem' }}>
                          Technician ID: {job.technicianId}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Sublets */}
              {selectedRO.sublets && selectedRO.sublets.length > 0 && (
                <div style={{ marginBottom: '2rem', padding: '1.5rem', backgroundColor: '#f9fafb', borderRadius: '8px' }}>
                  <h3 style={{ marginBottom: '1rem', color: '#374151', fontSize: '1.1rem' }}>Sublets ({selectedRO.sublets.length})</h3>
                  {selectedRO.sublets.map((sublet) => (
                    <div key={sublet.id} style={{ 
                      padding: '1rem', 
                      backgroundColor: 'white', 
                      borderRadius: '6px', 
                      marginBottom: '1rem',
                      border: '1px solid #e5e7eb'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <strong>{sublet.name}</strong>
                          {sublet.vendor && (
                            <div style={{ fontSize: '0.85rem', color: '#6b7280', marginTop: '0.25rem' }}>
                              Vendor: {sublet.vendor.name}
                            </div>
                          )}
                        </div>
                        <div>
                          <div><strong>{formatCurrency(sublet.price)}</strong></div>
                          <div style={{ fontSize: '0.85rem', color: '#6b7280' }}>Cost: {formatCurrency(sublet.cost)}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Customer Concerns */}
              {selectedRO.customerConcerns && selectedRO.customerConcerns.length > 0 && (
                <div style={{ marginBottom: '2rem', padding: '1.5rem', backgroundColor: '#f9fafb', borderRadius: '8px' }}>
                  <h3 style={{ marginBottom: '1rem', color: '#374151', fontSize: '1.1rem' }}>Customer Concerns ({selectedRO.customerConcerns.length})</h3>
                  {selectedRO.customerConcerns.map((concern) => (
                    <div key={concern.id} style={{ 
                      padding: '0.75rem', 
                      backgroundColor: 'white', 
                      borderRadius: '6px', 
                      marginBottom: '0.5rem',
                      border: '1px solid #e5e7eb',
                      fontSize: '0.9rem'
                    }}>
                      <div><strong>Concern:</strong> {concern.concern}</div>
                      {concern.techComment && (
                        <div style={{ color: '#6b7280', marginTop: '0.25rem' }}>
                          <strong>Tech Comment:</strong> {concern.techComment}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Fees & Discounts */}
              {((selectedRO.fees && selectedRO.fees.length > 0) || (selectedRO.discounts && selectedRO.discounts.length > 0)) && (
                <div style={{ marginBottom: '2rem', padding: '1.5rem', backgroundColor: '#f9fafb', borderRadius: '8px' }}>
                  <div className="grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
                    {selectedRO.fees && selectedRO.fees.length > 0 && (
                      <div>
                        <h4 style={{ marginBottom: '0.5rem', color: '#374151' }}>Fees</h4>
                        {selectedRO.fees.map((fee) => (
                          <div key={fee.id} style={{ fontSize: '0.9rem', marginBottom: '0.25rem' }}>
                            {fee.name}: {formatCurrency(fee.total)}
                          </div>
                        ))}
                      </div>
                    )}
                    {selectedRO.discounts && selectedRO.discounts.length > 0 && (
                      <div>
                        <h4 style={{ marginBottom: '0.5rem', color: '#374151' }}>Discounts</h4>
                        {selectedRO.discounts.map((discount) => (
                          <div key={discount.id} style={{ fontSize: '0.9rem', marginBottom: '0.25rem', color: '#dc2626' }}>
                            {discount.name}: {formatCurrency(discount.total)}
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
                      value={selectedRO.createdDate ? new Date(selectedRO.createdDate).toLocaleString() : 'N/A'}
                      disabled
                      style={{ backgroundColor: '#e5e7eb', cursor: 'not-allowed' }}
                    />
                  </div>
                  <div className="form-group">
                    <label>Updated Date</label>
                    <input
                      type="text"
                      value={selectedRO.updatedDate ? new Date(selectedRO.updatedDate).toLocaleString() : 'N/A'}
                      disabled
                      style={{ backgroundColor: '#e5e7eb', cursor: 'not-allowed' }}
                    />
                  </div>
                  <div className="form-group">
                    <label>Completed Date</label>
                    <input
                      type="text"
                      value={selectedRO.completedDate ? new Date(selectedRO.completedDate).toLocaleString() : 'N/A'}
                      disabled
                      style={{ backgroundColor: '#e5e7eb', cursor: 'not-allowed' }}
                    />
                  </div>
                </div>
                <div className="grid" style={{ gridTemplateColumns: '1fr 1fr 1fr' }}>
                  <div className="form-group">
                    <label>Posted Date</label>
                    <input
                      type="text"
                      value={selectedRO.postedDate ? new Date(selectedRO.postedDate).toLocaleString() : 'N/A'}
                      disabled
                      style={{ backgroundColor: '#e5e7eb', cursor: 'not-allowed' }}
                    />
                  </div>
                  <div className="form-group">
                    <label>Deleted Date</label>
                    <input
                      type="text"
                      value={selectedRO.deletedDate ? new Date(selectedRO.deletedDate).toLocaleString() : 'N/A'}
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
                        keyTag: selectedRO.keytag || '',
                        milesIn: selectedRO.milesIn || '',
                        milesOut: selectedRO.milesOut || '',
                        technicianId: selectedRO.technicianId || '',
                        serviceWriterId: selectedRO.serviceWriterId || '',
                        customerTimeOut: selectedRO.customerTimeOut ? selectedRO.customerTimeOut.substring(0, 16) : '',
                        customerId: selectedRO.customerId || '',
                        vehicleId: selectedRO.vehicleId || '',
                        appointmentStartTime: selectedRO.appointmentStartTime ? selectedRO.appointmentStartTime.substring(0, 16) : '',
                        notes: '',
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

export default RepairOrders;
