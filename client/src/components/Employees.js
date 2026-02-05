import React, { useState, useEffect } from 'react';
import { getEmployees, getEmployee, getShops } from '../services/api';

function Employees() {
  const [employees, setEmployees] = useState([]);
  const [filteredEmployees, setFilteredEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [shops, setShops] = useState([]);
  const [selectedShop, setSelectedShop] = useState(null);

  const loadShops = async () => {
    try {
      const response = await getShops();
      const shopsData = Array.isArray(response.data) ? response.data : response.data.content || [];
      setShops(shopsData);
      
      // Auto-select first shop if available
      if (shopsData.length > 0) {
        setSelectedShop(shopsData[0].id);
      }
    } catch (err) {
      console.error('Error loading shops:', err);
      setError('Failed to load shops. Please check your API credentials.');
    }
  };

  const loadEmployees = async (searchQuery = '') => {
    if (!selectedShop) {
      setError('Please select a shop first');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const params = { 
        shop: selectedShop,
        size: 100 
      };
      
      if (searchQuery.trim()) {
        params.search = searchQuery;
      }
      
      console.log('Fetching employees with params:', params);
      const response = await getEmployees(params);
      const empData = Array.isArray(response.data) ? response.data : response.data.content || [];
      setEmployees(empData);
      setFilteredEmployees(empData);
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message;
      setError(errorMsg);
      
      // Log detailed error for debugging
      console.error('Error loading employees:', {
        status: err.response?.status,
        message: errorMsg,
        details: err.response?.data
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadShops();
  }, []);

  useEffect(() => {
    if (selectedShop) {
      loadEmployees();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedShop]);

  const handleSearch = (e) => {
    const term = e.target.value;
    setSearchTerm(term);
    
    if (term.trim()) {
      loadEmployees(term);
    } else {
      loadEmployees();
    }
  };

  const handleEmployeeClick = async (employee) => {
    try {
      setLoading(true);
      const response = await getEmployee(employee.id);
      const fullEmployee = response.data;
      
      setSelectedEmployee(fullEmployee);
      setShowModal(true);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.error?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedEmployee(null);
    setError(null);
  };

  return (
    <div>
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2>Employees</h2>
          <button className="btn btn-secondary" onClick={() => loadEmployees(searchTerm)} disabled={!selectedShop}>
            Refresh
          </button>
        </div>

        {/* Shop Selector */}
        <div className="form-group" style={{ marginBottom: '1.5rem' }}>
          <label>Select Shop</label>
          <select
            value={selectedShop || ''}
            onChange={(e) => setSelectedShop(e.target.value)}
            className="form-control"
            disabled={shops.length === 0}
          >
            <option value="">-- Select a Shop --</option>
            {shops.map((shop) => (
              <option key={shop.id} value={shop.id}>
                {shop.name} (ID: {shop.id})
              </option>
            ))}
          </select>
        </div>

        {/* Search Bar */}
        <div className="search-container" style={{ marginBottom: '1.5rem' }}>
          <input
            type="text"
            className="search-input"
            placeholder="Search employees by name..."
            value={searchTerm}
            onChange={handleSearch}
            disabled={!selectedShop}
          />
          {searchTerm && (
            <button 
              className="search-clear"
              onClick={() => {
                setSearchTerm('');
                loadEmployees();
              }}
            >
              ✕
            </button>
          )}
        </div>

        {error && !showModal && (
          <div className="alert alert-error" style={{ marginTop: '1rem' }}>
            <strong>Error:</strong> {error}
            {error.includes('403') || error.includes('Access Denied') || error.includes('Forbidden') ? (
              <div style={{ marginTop: '0.5rem', fontSize: '0.9rem' }}>
                <strong>Possible Solutions:</strong>
                <ul style={{ marginTop: '0.5rem', marginLeft: '1.5rem' }}>
                  <li>The employees endpoint may require additional API permissions</li>
                  <li>This endpoint may not be available in your sandbox environment</li>
                  <li>Contact Tekmetric support to enable employee access for your API credentials</li>
                  <li>Verify that your API credentials have the correct scopes/permissions</li>
                </ul>
              </div>
            ) : null}
          </div>
        )}

        {loading && !showModal ? (
          <div className="spinner"></div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Can Perform Work</th>
                  <th>Certification #</th>
                  <th>Address</th>
                  <th>Created</th>
                </tr>
              </thead>
              <tbody>
                {filteredEmployees.length === 0 ? (
                  <tr>
                    <td colSpan="8" style={{ textAlign: 'center', padding: '2rem' }}>
                      {searchTerm ? `No employees found matching "${searchTerm}"` : 'No employees found.'}
                    </td>
                  </tr>
                ) : (
                  filteredEmployees.map((employee) => (
                    <tr 
                      key={employee.id}
                      onClick={() => handleEmployeeClick(employee)}
                      style={{ cursor: 'pointer' }}
                    >
                      <td><strong>{employee.id}</strong></td>
                      <td>
                        <strong>{employee.firstName} {employee.lastName}</strong>
                      </td>
                      <td>{employee.email || 'N/A'}</td>
                      <td>
                        <span style={{
                          padding: '0.25rem 0.75rem',
                          borderRadius: '12px',
                          fontSize: '0.75rem',
                          fontWeight: '600',
                          backgroundColor: '#dbeafe',
                          color: '#1e40af'
                        }}>
                          {employee.employeeRole?.name || 'N/A'}
                        </span>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        {employee.canPerformWork ? (
                          <span style={{ color: '#10b981', fontSize: '1.2rem' }}>✓</span>
                        ) : (
                          <span style={{ color: '#6b7280' }}>—</span>
                        )}
                      </td>
                      <td style={{ fontSize: '0.85rem', fontFamily: 'monospace' }}>
                        {employee.certificationNumber || 'N/A'}
                      </td>
                      <td style={{ fontSize: '0.85rem' }}>
                        {employee.address?.fullAddress || employee.address?.city || 'N/A'}
                      </td>
                      <td>{employee.createdDate ? new Date(employee.createdDate).toLocaleDateString() : 'N/A'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Employee Details Modal */}
      {showModal && selectedEmployee && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '800px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="modal-header">
              <h2>{selectedEmployee.firstName} {selectedEmployee.lastName}</h2>
              <button className="modal-close" onClick={handleCloseModal}>&times;</button>
            </div>

            {error && (
              <div className="alert alert-error">
                <strong>Error:</strong> {error}
              </div>
            )}

            {/* Basic Information */}
            <div style={{ marginBottom: '2rem', padding: '1.5rem', backgroundColor: '#f9fafb', borderRadius: '8px' }}>
              <h3 style={{ marginBottom: '1rem', color: '#374151', fontSize: '1.1rem' }}>Basic Information</h3>
              
              <div className="grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
                <div className="form-group">
                  <label>Employee ID</label>
                  <input
                    type="text"
                    value={selectedEmployee.id}
                    disabled
                    style={{ backgroundColor: '#e5e7eb', cursor: 'not-allowed' }}
                  />
                </div>
                <div className="form-group">
                  <label>Email</label>
                  <input
                    type="text"
                    value={selectedEmployee.email || 'N/A'}
                    disabled
                    style={{ backgroundColor: '#e5e7eb', cursor: 'not-allowed' }}
                  />
                </div>
              </div>

              <div className="grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
                <div className="form-group">
                  <label>First Name</label>
                  <input
                    type="text"
                    value={selectedEmployee.firstName || 'N/A'}
                    disabled
                    style={{ backgroundColor: '#e5e7eb', cursor: 'not-allowed' }}
                  />
                </div>
                <div className="form-group">
                  <label>Last Name</label>
                  <input
                    type="text"
                    value={selectedEmployee.lastName || 'N/A'}
                    disabled
                    style={{ backgroundColor: '#e5e7eb', cursor: 'not-allowed' }}
                  />
                </div>
              </div>
            </div>

            {/* Role & Permissions */}
            <div style={{ marginBottom: '2rem', padding: '1.5rem', backgroundColor: '#f9fafb', borderRadius: '8px' }}>
              <h3 style={{ marginBottom: '1rem', color: '#374151', fontSize: '1.1rem' }}>Role & Permissions</h3>
              
              <div className="grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
                <div className="form-group">
                  <label>Employee Role</label>
                  <input
                    type="text"
                    value={selectedEmployee.employeeRole?.name || 'N/A'}
                    disabled
                    style={{ backgroundColor: '#e5e7eb', cursor: 'not-allowed' }}
                  />
                </div>
                <div className="form-group">
                  <label>Role Code</label>
                  <input
                    type="text"
                    value={selectedEmployee.employeeRole?.code || 'N/A'}
                    disabled
                    style={{ backgroundColor: '#e5e7eb', cursor: 'not-allowed' }}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Can Perform Work</label>
                <input
                  type="text"
                  value={selectedEmployee.canPerformWork ? 'Yes' : 'No'}
                  disabled
                  style={{ 
                    backgroundColor: '#e5e7eb', 
                    cursor: 'not-allowed',
                    color: selectedEmployee.canPerformWork ? '#10b981' : '#6b7280',
                    fontWeight: 'bold'
                  }}
                />
              </div>

              <div className="form-group">
                <label>Certification Number</label>
                <input
                  type="text"
                  value={selectedEmployee.certificationNumber || 'N/A'}
                  disabled
                  style={{ backgroundColor: '#e5e7eb', cursor: 'not-allowed', fontFamily: 'monospace' }}
                />
              </div>
            </div>

            {/* Address */}
            {selectedEmployee.address && (
              <div style={{ marginBottom: '2rem', padding: '1.5rem', backgroundColor: '#f9fafb', borderRadius: '8px' }}>
                <h3 style={{ marginBottom: '1rem', color: '#374151', fontSize: '1.1rem' }}>Address</h3>
                
                <div className="form-group">
                  <label>Address Line 1</label>
                  <input
                    type="text"
                    value={selectedEmployee.address.address1 || 'N/A'}
                    disabled
                    style={{ backgroundColor: '#e5e7eb', cursor: 'not-allowed' }}
                  />
                </div>

                <div className="form-group">
                  <label>Address Line 2</label>
                  <input
                    type="text"
                    value={selectedEmployee.address.address2 || 'N/A'}
                    disabled
                    style={{ backgroundColor: '#e5e7eb', cursor: 'not-allowed' }}
                  />
                </div>

                <div className="grid" style={{ gridTemplateColumns: '2fr 1fr 1fr' }}>
                  <div className="form-group">
                    <label>City</label>
                    <input
                      type="text"
                      value={selectedEmployee.address.city || 'N/A'}
                      disabled
                      style={{ backgroundColor: '#e5e7eb', cursor: 'not-allowed' }}
                    />
                  </div>
                  <div className="form-group">
                    <label>State</label>
                    <input
                      type="text"
                      value={selectedEmployee.address.state || 'N/A'}
                      disabled
                      style={{ backgroundColor: '#e5e7eb', cursor: 'not-allowed' }}
                    />
                  </div>
                  <div className="form-group">
                    <label>ZIP Code</label>
                    <input
                      type="text"
                      value={selectedEmployee.address.zip || 'N/A'}
                      disabled
                      style={{ backgroundColor: '#e5e7eb', cursor: 'not-allowed' }}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Full Address</label>
                  <input
                    type="text"
                    value={selectedEmployee.address.fullAddress || 'N/A'}
                    disabled
                    style={{ backgroundColor: '#e5e7eb', cursor: 'not-allowed' }}
                  />
                </div>

                <div className="form-group">
                  <label>Street Address</label>
                  <input
                    type="text"
                    value={selectedEmployee.address.streetAddress || 'N/A'}
                    disabled
                    style={{ backgroundColor: '#e5e7eb', cursor: 'not-allowed' }}
                  />
                </div>
              </div>
            )}

            {/* Dates */}
            <div style={{ marginBottom: '2rem', padding: '1.5rem', backgroundColor: '#f9fafb', borderRadius: '8px' }}>
              <h3 style={{ marginBottom: '1rem', color: '#374151', fontSize: '1.1rem' }}>Dates</h3>
              <div className="grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
                <div className="form-group">
                  <label>Created Date</label>
                  <input
                    type="text"
                    value={selectedEmployee.createdDate ? new Date(selectedEmployee.createdDate).toLocaleString() : 'N/A'}
                    disabled
                    style={{ backgroundColor: '#e5e7eb', cursor: 'not-allowed' }}
                  />
                </div>
                <div className="form-group">
                  <label>Updated Date</label>
                  <input
                    type="text"
                    value={selectedEmployee.updatedDate ? new Date(selectedEmployee.updatedDate).toLocaleString() : 'N/A'}
                    disabled
                    style={{ backgroundColor: '#e5e7eb', cursor: 'not-allowed' }}
                  />
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '1rem', borderTop: '2px solid #e5e7eb' }}>
              <button 
                type="button" 
                className="btn btn-secondary" 
                onClick={handleCloseModal}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Employees;
