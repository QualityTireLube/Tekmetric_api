import React, { useState, useEffect } from 'react';
import { getVehicles, getVehicle, createVehicle, updateVehicle } from '../services/api';

function Vehicles() {
  const [vehicles, setVehicles] = useState([]);
  const [filteredVehicles, setFilteredVehicles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    customerId: '',
    year: '',
    make: '',
    model: '',
    subModel: '',
    engine: '',
    color: '',
    licensePlate: '',
    state: '',
    vin: '',
    driveType: '',
    transmission: '',
    bodyType: '',
    notes: '',
    unitNumber: '',
  });

  useEffect(() => {
    loadVehicles();
  }, []);

  const loadVehicles = async (searchQuery = '') => {
    setLoading(true);
    setError(null);
    try {
      const shopId = localStorage.getItem('tekmetric_shop_id');
      const params = { shop: shopId, size: 100 };
      
      if (searchQuery.trim()) {
        params.search = searchQuery;
      }
      
      const response = await getVehicles(params);
      const vehicleData = Array.isArray(response.data) ? response.data : response.data.content || [];
      setVehicles(vehicleData);
      setFilteredVehicles(vehicleData);
    } catch (err) {
      setError(err.response?.data?.error?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    const term = e.target.value;
    setSearchTerm(term);
    
    if (term.trim()) {
      loadVehicles(term);
    } else {
      loadVehicles();
    }
  };

  const handleVehicleClick = async (vehicle) => {
    try {
      setLoading(true);
      // Fetch full vehicle details
      const response = await getVehicle(vehicle.id);
      const fullVehicle = response.data;
      
      setSelectedVehicle(fullVehicle);
      setFormData({
        customerId: fullVehicle.customerId || '',
        year: fullVehicle.year || '',
        make: fullVehicle.make || '',
        model: fullVehicle.model || '',
        subModel: fullVehicle.subModel || '',
        engine: fullVehicle.engine || '',
        color: fullVehicle.color || '',
        licensePlate: fullVehicle.licensePlate || '',
        state: fullVehicle.state || '',
        vin: fullVehicle.vin || '',
        driveType: fullVehicle.driveType || '',
        transmission: fullVehicle.transmission || '',
        bodyType: fullVehicle.bodyType || '',
        notes: fullVehicle.notes || '',
        unitNumber: fullVehicle.unitNumber || '',
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
    setSelectedVehicle(null);
    setEditMode(false);
    resetFormData();
    setError(null);
    setSuccess(null);
  };

  const resetFormData = () => {
    setFormData({
      customerId: '',
      year: '',
      make: '',
      model: '',
      subModel: '',
      engine: '',
      color: '',
      licensePlate: '',
      state: '',
      vin: '',
      driveType: '',
      transmission: '',
      bodyType: '',
      notes: '',
      unitNumber: '',
    });
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      // Convert year to integer
      const submitData = {
        ...formData,
        year: parseInt(formData.year),
        customerId: parseInt(formData.customerId),
      };
      
      await createVehicle(submitData);
      setSuccess('Vehicle created successfully!');
      setShowForm(false);
      resetFormData();
      loadVehicles(searchTerm);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.response?.data?.error?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateVehicle = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const updateData = {};
      
      // Only include changed fields
      if (formData.year && formData.year !== selectedVehicle.year) {
        updateData.year = parseInt(formData.year);
      }
      
      if (formData.make !== (selectedVehicle.make || '')) {
        updateData.make = formData.make;
      }
      
      if (formData.model !== (selectedVehicle.model || '')) {
        updateData.model = formData.model;
      }
      
      if (formData.subModel !== (selectedVehicle.subModel || '')) {
        updateData.subModel = formData.subModel || null;
      }
      
      if (formData.engine !== (selectedVehicle.engine || '')) {
        updateData.engine = formData.engine || null;
      }
      
      if (formData.color !== (selectedVehicle.color || '')) {
        updateData.color = formData.color || null;
      }
      
      if (formData.licensePlate !== (selectedVehicle.licensePlate || '')) {
        updateData.licensePlate = formData.licensePlate || null;
      }
      
      if (formData.state !== (selectedVehicle.state || '')) {
        updateData.state = formData.state || null;
      }
      
      if (formData.vin !== (selectedVehicle.vin || '')) {
        updateData.vin = formData.vin || null;
      }
      
      if (formData.driveType !== (selectedVehicle.driveType || '')) {
        updateData.driveType = formData.driveType || null;
      }
      
      if (formData.transmission !== (selectedVehicle.transmission || '')) {
        updateData.transmission = formData.transmission || null;
      }
      
      if (formData.bodyType !== (selectedVehicle.bodyType || '')) {
        updateData.bodyType = formData.bodyType || null;
      }
      
      if (formData.notes !== (selectedVehicle.notes || '')) {
        updateData.notes = formData.notes || null;
      }
      
      if (formData.unitNumber !== (selectedVehicle.unitNumber || '')) {
        updateData.unitNumber = formData.unitNumber || null;
      }
      
      await updateVehicle(selectedVehicle.id, updateData);
      setSuccess('Vehicle updated successfully!');
      setEditMode(false);
      loadVehicles(searchTerm);
      
      // Refresh the selected vehicle data
      const response = await getVehicle(selectedVehicle.id);
      setSelectedVehicle(response.data);
      
      setTimeout(() => {
        setSuccess(null);
      }, 3000);
    } catch (err) {
      setError(err.response?.data?.error?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2>Vehicles</h2>
          <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
            {showForm ? 'Cancel' : '+ Add Vehicle'}
          </button>
        </div>

        {/* Search Bar */}
        <div className="search-container" style={{ marginBottom: '1.5rem' }}>
          <input
            type="text"
            className="search-input"
            placeholder="Search by year, make, model, VIN, or license plate..."
            value={searchTerm}
            onChange={handleSearch}
          />
          {searchTerm && (
            <button 
              className="search-clear"
              onClick={() => {
                setSearchTerm('');
                loadVehicles();
              }}
            >
              ✕
            </button>
          )}
        </div>

        {error && !showModal && (
          <div className="alert alert-error" style={{ marginTop: '1rem' }}>
            <strong>Error:</strong> {error}
          </div>
        )}

        {success && !showModal && (
          <div className="alert alert-success" style={{ marginTop: '1rem' }}>
            <strong>Success!</strong> {success}
          </div>
        )}

        {showForm && (
          <form onSubmit={handleSubmit} style={{ marginTop: '2rem', marginBottom: '2rem' }}>
            <h3 style={{ marginBottom: '1rem' }}>Create New Vehicle</h3>
            
            <div className="grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
              <div className="form-group">
                <label>Customer ID *</label>
                <input
                  type="number"
                  name="customerId"
                  value={formData.customerId}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>Year *</label>
                <input
                  type="number"
                  name="year"
                  value={formData.year}
                  onChange={handleChange}
                  required
                  min="1900"
                  max="2100"
                />
              </div>
            </div>

            <div className="grid" style={{ gridTemplateColumns: '1fr 1fr 1fr' }}>
              <div className="form-group">
                <label>Make *</label>
                <input
                  type="text"
                  name="make"
                  value={formData.make}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>Model *</label>
                <input
                  type="text"
                  name="model"
                  value={formData.model}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>Sub Model</label>
                <input
                  type="text"
                  name="subModel"
                  value={formData.subModel}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
              <div className="form-group">
                <label>VIN</label>
                <input
                  type="text"
                  name="vin"
                  value={formData.vin}
                  onChange={handleChange}
                  maxLength="17"
                />
              </div>
              <div className="form-group">
                <label>Engine</label>
                <input
                  type="text"
                  name="engine"
                  value={formData.engine}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="grid" style={{ gridTemplateColumns: '1fr 1fr 1fr' }}>
              <div className="form-group">
                <label>License Plate</label>
                <input
                  type="text"
                  name="licensePlate"
                  value={formData.licensePlate}
                  onChange={handleChange}
                />
              </div>
              <div className="form-group">
                <label>State</label>
                <input
                  type="text"
                  name="state"
                  value={formData.state}
                  onChange={handleChange}
                  maxLength="2"
                  placeholder="TX"
                />
              </div>
              <div className="form-group">
                <label>Color</label>
                <input
                  type="text"
                  name="color"
                  value={formData.color}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="grid" style={{ gridTemplateColumns: '1fr 1fr 1fr' }}>
              <div className="form-group">
                <label>Drive Type</label>
                <select
                  name="driveType"
                  value={formData.driveType}
                  onChange={handleChange}
                >
                  <option value="">Select...</option>
                  <option value="FWD">FWD</option>
                  <option value="RWD">RWD</option>
                  <option value="AWD">AWD</option>
                  <option value="4WD">4WD</option>
                </select>
              </div>
              <div className="form-group">
                <label>Transmission</label>
                <select
                  name="transmission"
                  value={formData.transmission}
                  onChange={handleChange}
                >
                  <option value="">Select...</option>
                  <option value="Manual">Manual</option>
                  <option value="Automatic">Automatic</option>
                  <option value="Automatic CVT">Automatic CVT</option>
                </select>
              </div>
              <div className="form-group">
                <label>Body Type</label>
                <input
                  type="text"
                  name="bodyType"
                  value={formData.bodyType}
                  onChange={handleChange}
                  placeholder="Sedan, SUV, Truck..."
                />
              </div>
            </div>

            <div className="form-group">
              <label>Unit Number</label>
              <input
                type="text"
                name="unitNumber"
                value={formData.unitNumber}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label>Notes</label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                rows="3"
              />
            </div>

            <button type="submit" className="btn btn-success" disabled={loading}>
              {loading ? 'Creating...' : 'Create Vehicle'}
            </button>
          </form>
        )}

        {loading && !showForm && !showModal ? (
          <div className="spinner"></div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Customer</th>
                  <th>Vehicle</th>
                  <th>VIN</th>
                  <th>License Plate</th>
                  <th>Engine</th>
                  <th>Drive Type</th>
                  <th>Transmission</th>
                  <th>Created</th>
                </tr>
              </thead>
              <tbody>
                {filteredVehicles.length === 0 ? (
                  <tr>
                    <td colSpan="9" style={{ textAlign: 'center', padding: '2rem' }}>
                      {searchTerm ? `No vehicles found matching "${searchTerm}"` : 'No vehicles found. Click "Add Vehicle" to create one.'}
                    </td>
                  </tr>
                ) : (
                  filteredVehicles.map((vehicle) => (
                    <tr 
                      key={vehicle.id}
                      onClick={() => handleVehicleClick(vehicle)}
                      style={{ cursor: 'pointer' }}
                    >
                      <td><strong>{vehicle.id}</strong></td>
                      <td>{vehicle.customerId}</td>
                      <td>
                        <strong>{vehicle.year} {vehicle.make} {vehicle.model}</strong>
                        {vehicle.subModel && <div style={{ fontSize: '0.85rem', color: '#6b7280' }}>{vehicle.subModel}</div>}
                      </td>
                      <td style={{ fontSize: '0.85rem', fontFamily: 'monospace' }}>{vehicle.vin || 'N/A'}</td>
                      <td>
                        {vehicle.licensePlate || 'N/A'}
                        {vehicle.state && <span style={{ fontSize: '0.85rem', color: '#6b7280' }}> ({vehicle.state})</span>}
                      </td>
                      <td style={{ fontSize: '0.85rem' }}>{vehicle.engine || 'N/A'}</td>
                      <td>{vehicle.driveType || 'N/A'}</td>
                      <td style={{ fontSize: '0.85rem' }}>{vehicle.transmission || 'N/A'}</td>
                      <td>{vehicle.createdDate ? new Date(vehicle.createdDate).toLocaleDateString() : 'N/A'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit Vehicle Modal */}
      {showModal && selectedVehicle && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '900px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="modal-header">
              <h2>{selectedVehicle.year} {selectedVehicle.make} {selectedVehicle.model}</h2>
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

            <form onSubmit={handleUpdateVehicle}>
              {/* Basic Information */}
              <div style={{ marginBottom: '2rem', padding: '1.5rem', backgroundColor: '#f9fafb', borderRadius: '8px' }}>
                <h3 style={{ marginBottom: '1rem', color: '#374151', fontSize: '1.1rem' }}>Basic Information</h3>
                
                <div className="grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
                  <div className="form-group">
                    <label>Vehicle ID</label>
                    <input
                      type="text"
                      value={selectedVehicle.id}
                      disabled
                      style={{ backgroundColor: '#e5e7eb', cursor: 'not-allowed' }}
                    />
                  </div>
                  <div className="form-group">
                    <label>Customer ID</label>
                    <input
                      type="text"
                      value={selectedVehicle.customerId}
                      disabled
                      style={{ backgroundColor: '#e5e7eb', cursor: 'not-allowed' }}
                    />
                  </div>
                </div>

                <div className="grid" style={{ gridTemplateColumns: '1fr 1fr 1fr' }}>
                  <div className="form-group">
                    <label>Year {editMode && '*'}</label>
                    <input
                      type="number"
                      name="year"
                      value={formData.year}
                      onChange={handleChange}
                      disabled={!editMode}
                      min="1900"
                      max="2100"
                      style={!editMode ? { backgroundColor: '#e5e7eb', cursor: 'not-allowed' } : {}}
                    />
                  </div>
                  <div className="form-group">
                    <label>Make {editMode && '*'}</label>
                    <input
                      type="text"
                      name="make"
                      value={formData.make}
                      onChange={handleChange}
                      disabled={!editMode}
                      style={!editMode ? { backgroundColor: '#e5e7eb', cursor: 'not-allowed' } : {}}
                    />
                  </div>
                  <div className="form-group">
                    <label>Model {editMode && '*'}</label>
                    <input
                      type="text"
                      name="model"
                      value={formData.model}
                      onChange={handleChange}
                      disabled={!editMode}
                      style={!editMode ? { backgroundColor: '#e5e7eb', cursor: 'not-allowed' } : {}}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Sub Model {editMode && '*'}</label>
                  <input
                    type="text"
                    name="subModel"
                    value={formData.subModel}
                    onChange={handleChange}
                    disabled={!editMode}
                    style={!editMode ? { backgroundColor: '#e5e7eb', cursor: 'not-allowed' } : {}}
                  />
                </div>
              </div>

              {/* Identification */}
              <div style={{ marginBottom: '2rem', padding: '1.5rem', backgroundColor: '#f9fafb', borderRadius: '8px' }}>
                <h3 style={{ marginBottom: '1rem', color: '#374151', fontSize: '1.1rem' }}>Identification</h3>
                
                <div className="form-group">
                  <label>VIN {editMode && '*'}</label>
                  <input
                    type="text"
                    name="vin"
                    value={formData.vin}
                    onChange={handleChange}
                    disabled={!editMode}
                    maxLength="17"
                    style={!editMode ? { backgroundColor: '#e5e7eb', cursor: 'not-allowed', fontFamily: 'monospace' } : { fontFamily: 'monospace' }}
                  />
                </div>

                <div className="grid" style={{ gridTemplateColumns: '2fr 1fr' }}>
                  <div className="form-group">
                    <label>License Plate {editMode && '*'}</label>
                    <input
                      type="text"
                      name="licensePlate"
                      value={formData.licensePlate}
                      onChange={handleChange}
                      disabled={!editMode}
                      style={!editMode ? { backgroundColor: '#e5e7eb', cursor: 'not-allowed' } : {}}
                    />
                  </div>
                  <div className="form-group">
                    <label>State {editMode && '*'}</label>
                    <input
                      type="text"
                      name="state"
                      value={formData.state}
                      onChange={handleChange}
                      disabled={!editMode}
                      maxLength="2"
                      placeholder="TX"
                      style={!editMode ? { backgroundColor: '#e5e7eb', cursor: 'not-allowed', textTransform: 'uppercase' } : { textTransform: 'uppercase' }}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Unit Number {editMode && '*'}</label>
                  <input
                    type="text"
                    name="unitNumber"
                    value={formData.unitNumber}
                    onChange={handleChange}
                    disabled={!editMode}
                    style={!editMode ? { backgroundColor: '#e5e7eb', cursor: 'not-allowed' } : {}}
                  />
                </div>
              </div>

              {/* Specifications */}
              <div style={{ marginBottom: '2rem', padding: '1.5rem', backgroundColor: '#f9fafb', borderRadius: '8px' }}>
                <h3 style={{ marginBottom: '1rem', color: '#374151', fontSize: '1.1rem' }}>Specifications</h3>
                
                <div className="form-group">
                  <label>Engine {editMode && '*'}</label>
                  <input
                    type="text"
                    name="engine"
                    value={formData.engine}
                    onChange={handleChange}
                    disabled={!editMode}
                    style={!editMode ? { backgroundColor: '#e5e7eb', cursor: 'not-allowed' } : {}}
                  />
                </div>

                <div className="grid" style={{ gridTemplateColumns: '1fr 1fr 1fr' }}>
                  <div className="form-group">
                    <label>Drive Type {editMode && '*'}</label>
                    <select
                      name="driveType"
                      value={formData.driveType}
                      onChange={handleChange}
                      disabled={!editMode}
                      style={!editMode ? { backgroundColor: '#e5e7eb', cursor: 'not-allowed' } : {}}
                    >
                      <option value="">Select...</option>
                      <option value="FWD">FWD</option>
                      <option value="RWD">RWD</option>
                      <option value="AWD">AWD</option>
                      <option value="4WD">4WD</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Transmission {editMode && '*'}</label>
                    <select
                      name="transmission"
                      value={formData.transmission}
                      onChange={handleChange}
                      disabled={!editMode}
                      style={!editMode ? { backgroundColor: '#e5e7eb', cursor: 'not-allowed' } : {}}
                    >
                      <option value="">Select...</option>
                      <option value="Manual">Manual</option>
                      <option value="Automatic">Automatic</option>
                      <option value="Automatic CVT">Automatic CVT</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Body Type {editMode && '*'}</label>
                    <input
                      type="text"
                      name="bodyType"
                      value={formData.bodyType}
                      onChange={handleChange}
                      disabled={!editMode}
                      placeholder="Sedan, SUV, Truck..."
                      style={!editMode ? { backgroundColor: '#e5e7eb', cursor: 'not-allowed' } : {}}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Color {editMode && '*'}</label>
                  <input
                    type="text"
                    name="color"
                    value={formData.color}
                    onChange={handleChange}
                    disabled={!editMode}
                    style={!editMode ? { backgroundColor: '#e5e7eb', cursor: 'not-allowed' } : {}}
                  />
                </div>
              </div>

              {/* Additional Information */}
              <div style={{ marginBottom: '2rem', padding: '1.5rem', backgroundColor: '#f9fafb', borderRadius: '8px' }}>
                <h3 style={{ marginBottom: '1rem', color: '#374151', fontSize: '1.1rem' }}>Additional Information</h3>
                
                <div className="form-group">
                  <label>Notes {editMode && '*'}</label>
                  <textarea
                    name="notes"
                    value={formData.notes}
                    onChange={handleChange}
                    disabled={!editMode}
                    rows="3"
                    style={!editMode ? { backgroundColor: '#e5e7eb', cursor: 'not-allowed' } : {}}
                  />
                </div>
              </div>

              {/* Dates */}
              <div style={{ marginBottom: '2rem', padding: '1.5rem', backgroundColor: '#f9fafb', borderRadius: '8px' }}>
                <h3 style={{ marginBottom: '1rem', color: '#374151', fontSize: '1.1rem' }}>Dates</h3>
                <div className="grid" style={{ gridTemplateColumns: '1fr 1fr 1fr' }}>
                  <div className="form-group">
                    <label>Created Date</label>
                    <input
                      type="text"
                      value={selectedVehicle.createdDate ? new Date(selectedVehicle.createdDate).toLocaleString() : 'N/A'}
                      disabled
                      style={{ backgroundColor: '#e5e7eb', cursor: 'not-allowed' }}
                    />
                  </div>
                  <div className="form-group">
                    <label>Updated Date</label>
                    <input
                      type="text"
                      value={selectedVehicle.updatedDate ? new Date(selectedVehicle.updatedDate).toLocaleString() : 'N/A'}
                      disabled
                      style={{ backgroundColor: '#e5e7eb', cursor: 'not-allowed' }}
                    />
                  </div>
                  <div className="form-group">
                    <label>Deleted Date</label>
                    <input
                      type="text"
                      value={selectedVehicle.deletedDate ? new Date(selectedVehicle.deletedDate).toLocaleString() : 'N/A'}
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
                        customerId: selectedVehicle.customerId || '',
                        year: selectedVehicle.year || '',
                        make: selectedVehicle.make || '',
                        model: selectedVehicle.model || '',
                        subModel: selectedVehicle.subModel || '',
                        engine: selectedVehicle.engine || '',
                        color: selectedVehicle.color || '',
                        licensePlate: selectedVehicle.licensePlate || '',
                        state: selectedVehicle.state || '',
                        vin: selectedVehicle.vin || '',
                        driveType: selectedVehicle.driveType || '',
                        transmission: selectedVehicle.transmission || '',
                        bodyType: selectedVehicle.bodyType || '',
                        notes: selectedVehicle.notes || '',
                        unitNumber: selectedVehicle.unitNumber || '',
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

export default Vehicles;
