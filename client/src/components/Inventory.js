import React, { useState, useEffect } from 'react';
import { getInventory, getInventoryPart } from '../services/api';

function Inventory() {
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedPart, setSelectedPart] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [partTypeFilter, setPartTypeFilter] = useState('1');
  const [filters, setFilters] = useState({
    partNumbers: '',
    width: '',
    ratio: '',
    diameter: '',
    tireSize: '',
  });

  useEffect(() => {
    loadInventory();
  }, []);

  const loadInventory = async () => {
    setLoading(true);
    setError(null);
    try {
      const shopId = localStorage.getItem('tekmetric_shop_id');
      const params = { 
        shop: shopId, 
        partTypeId: partTypeFilter,
        size: 100 
      };
      
      // Add optional filters
      if (filters.partNumbers.trim()) {
        params.partNumbers = filters.partNumbers.split(',').map(p => p.trim());
      }
      
      // Tire-specific filters (only for partTypeId = 2)
      if (partTypeFilter === '2') {
        if (filters.width.trim()) params.width = filters.width;
        if (filters.ratio.trim()) params.ratio = filters.ratio;
        if (filters.diameter.trim()) params.diameter = filters.diameter;
        if (filters.tireSize.trim()) params.tireSize = filters.tireSize;
      }
      
      const response = await getInventory(params);
      const invData = Array.isArray(response.data) ? response.data : response.data.content || [];
      setInventory(invData);
    } catch (err) {
      setError(err.response?.data?.error?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePartTypeChange = (e) => {
    const newType = e.target.value;
    setPartTypeFilter(newType);
    
    // Clear tire-specific filters when switching away from tires
    if (newType !== '2') {
      setFilters({
        ...filters,
        width: '',
        ratio: '',
        diameter: '',
        tireSize: '',
      });
    }
  };

  const handleFilterChange = (e) => {
    setFilters({
      ...filters,
      [e.target.name]: e.target.value
    });
  };

  const handleSearch = () => {
    loadInventory();
  };

  const handleClearFilters = () => {
    setFilters({
      partNumbers: '',
      width: '',
      ratio: '',
      diameter: '',
      tireSize: '',
    });
    loadInventory();
  };

  const handlePartClick = async (part) => {
    try {
      setLoading(true);
      const response = await getInventoryPart(part.id);
      const fullPart = response.data;
      
      setSelectedPart(fullPart);
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
    setSelectedPart(null);
    setError(null);
  };

  const formatCurrency = (cents) => {
    if (!cents && cents !== 0) return '$0.00';
    return `$${(cents / 100).toFixed(2)}`;
  };

  const getPartTypeName = (typeId) => {
    const types = {
      '1': 'Part',
      '2': 'Tire',
      '5': 'Battery'
    };
    return types[typeId] || 'Unknown';
  };

  return (
    <div>
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2>Inventory <span style={{ fontSize: '0.85rem', color: '#6b7280', fontWeight: 'normal' }}>(Beta)</span></h2>
          <button className="btn btn-secondary" onClick={loadInventory}>
            Refresh
          </button>
        </div>

        {/* Filters */}
        <div style={{ marginBottom: '1.5rem', padding: '1.5rem', backgroundColor: '#f9fafb', borderRadius: '8px' }}>
          <h3 style={{ marginBottom: '1rem', fontSize: '1rem', color: '#374151' }}>Filters</h3>
          
          <div className="grid" style={{ gridTemplateColumns: '1fr 2fr', gap: '1rem', marginBottom: '1rem' }}>
            <div className="form-group" style={{ margin: 0 }}>
              <label>Part Type *</label>
              <select
                value={partTypeFilter}
                onChange={handlePartTypeChange}
                style={{ width: '100%' }}
              >
                <option value="1">Part</option>
                <option value="2">Tire</option>
                <option value="5">Battery</option>
              </select>
            </div>
            <div className="form-group" style={{ margin: 0 }}>
              <label>Part Numbers (comma-separated)</label>
              <input
                type="text"
                name="partNumbers"
                value={filters.partNumbers}
                onChange={handleFilterChange}
                placeholder="e.g., ABC123, XYZ789"
              />
            </div>
          </div>

          {/* Tire-specific filters */}
          {partTypeFilter === '2' && (
            <div className="grid" style={{ gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label>Width</label>
                <input
                  type="text"
                  name="width"
                  value={filters.width}
                  onChange={handleFilterChange}
                  placeholder="e.g., 205"
                />
              </div>
              <div className="form-group" style={{ margin: 0 }}>
                <label>Ratio</label>
                <input
                  type="text"
                  name="ratio"
                  value={filters.ratio}
                  onChange={handleFilterChange}
                  placeholder="e.g., 55"
                />
              </div>
              <div className="form-group" style={{ margin: 0 }}>
                <label>Diameter</label>
                <input
                  type="text"
                  name="diameter"
                  value={filters.diameter}
                  onChange={handleFilterChange}
                  placeholder="e.g., 16"
                />
              </div>
              <div className="form-group" style={{ margin: 0 }}>
                <label>Tire Size</label>
                <input
                  type="text"
                  name="tireSize"
                  value={filters.tireSize}
                  onChange={handleFilterChange}
                  placeholder="e.g., 205/55R16"
                />
              </div>
            </div>
          )}

          <div style={{ display: 'flex', gap: '1rem' }}>
            <button className="btn btn-primary" onClick={handleSearch}>
              Search
            </button>
            <button className="btn btn-secondary" onClick={handleClearFilters}>
              Clear Filters
            </button>
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
                  <th>ID</th>
                  <th>Part Type</th>
                  <th>Brand</th>
                  <th>Name</th>
                  <th>Part Number</th>
                  <th>Description</th>
                  {partTypeFilter === '2' && <th>Tire Size</th>}
                  <th>Cost</th>
                  <th>Retail</th>
                  <th>Quantity</th>
                </tr>
              </thead>
              <tbody>
                {inventory.length === 0 ? (
                  <tr>
                    <td colSpan={partTypeFilter === '2' ? '10' : '9'} style={{ textAlign: 'center', padding: '2rem' }}>
                      No inventory items found for {getPartTypeName(partTypeFilter)}s.
                    </td>
                  </tr>
                ) : (
                  inventory.map((part) => (
                    <tr 
                      key={part.id}
                      onClick={() => handlePartClick(part)}
                      style={{ cursor: 'pointer' }}
                    >
                      <td><strong>{part.id}</strong></td>
                      <td>
                        <span style={{
                          padding: '0.25rem 0.75rem',
                          borderRadius: '12px',
                          fontSize: '0.75rem',
                          fontWeight: '600',
                          backgroundColor: partTypeFilter === '2' ? '#dbeafe' : partTypeFilter === '5' ? '#fef3c7' : '#e0e7ff',
                          color: partTypeFilter === '2' ? '#1e40af' : partTypeFilter === '5' ? '#92400e' : '#4338ca'
                        }}>
                          {part.partType?.name || getPartTypeName(partTypeFilter)}
                        </span>
                      </td>
                      <td>{part.brand || 'N/A'}</td>
                      <td>{part.name || part.model || 'N/A'}</td>
                      <td style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>{part.partNumber || 'N/A'}</td>
                      <td style={{ fontSize: '0.85rem' }}>{part.description || 'N/A'}</td>
                      {partTypeFilter === '2' && (
                        <td style={{ fontFamily: 'monospace' }}>
                          {part.width && part.ratio && part.diameter 
                            ? `${part.width}/${part.ratio}R${part.diameter}` 
                            : 'N/A'}
                        </td>
                      )}
                      <td>{formatCurrency(part.cost)}</td>
                      <td><strong>{formatCurrency(part.retail)}</strong></td>
                      <td style={{ textAlign: 'center' }}>
                        <span style={{
                          padding: '0.25rem 0.75rem',
                          borderRadius: '12px',
                          fontSize: '0.85rem',
                          fontWeight: '600',
                          backgroundColor: part.quantity > 0 ? '#d1fae5' : '#fee2e2',
                          color: part.quantity > 0 ? '#065f46' : '#991b1b'
                        }}>
                          {part.quantity || 0}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Part Details Modal */}
      {showModal && selectedPart && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '800px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="modal-header">
              <h2>{selectedPart.name || selectedPart.model || 'Part Details'}</h2>
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
                  <label>Part ID</label>
                  <input
                    type="text"
                    value={selectedPart.id}
                    disabled
                    style={{ backgroundColor: '#e5e7eb', cursor: 'not-allowed' }}
                  />
                </div>
                <div className="form-group">
                  <label>Part Type</label>
                  <input
                    type="text"
                    value={selectedPart.partType?.name || 'N/A'}
                    disabled
                    style={{ backgroundColor: '#e5e7eb', cursor: 'not-allowed' }}
                  />
                </div>
              </div>

              <div className="grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
                <div className="form-group">
                  <label>Brand</label>
                  <input
                    type="text"
                    value={selectedPart.brand || 'N/A'}
                    disabled
                    style={{ backgroundColor: '#e5e7eb', cursor: 'not-allowed' }}
                  />
                </div>
                <div className="form-group">
                  <label>Name</label>
                  <input
                    type="text"
                    value={selectedPart.name || 'N/A'}
                    disabled
                    style={{ backgroundColor: '#e5e7eb', cursor: 'not-allowed' }}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Part Number</label>
                <input
                  type="text"
                  value={selectedPart.partNumber || 'N/A'}
                  disabled
                  style={{ backgroundColor: '#e5e7eb', cursor: 'not-allowed', fontFamily: 'monospace' }}
                />
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={selectedPart.description || 'N/A'}
                  disabled
                  rows="2"
                  style={{ backgroundColor: '#e5e7eb', cursor: 'not-allowed' }}
                />
              </div>
            </div>

            {/* Tire-specific Information */}
            {selectedPart.partType?.code === 'TIRE' && (
              <div style={{ marginBottom: '2rem', padding: '1.5rem', backgroundColor: '#f9fafb', borderRadius: '8px' }}>
                <h3 style={{ marginBottom: '1rem', color: '#374151', fontSize: '1.1rem' }}>Tire Specifications</h3>
                
                <div className="grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
                  <div className="form-group">
                    <label>Model</label>
                    <input
                      type="text"
                      value={selectedPart.model || 'N/A'}
                      disabled
                      style={{ backgroundColor: '#e5e7eb', cursor: 'not-allowed' }}
                    />
                  </div>
                  <div className="form-group">
                    <label>Tire Size</label>
                    <input
                      type="text"
                      value={selectedPart.width && selectedPart.ratio && selectedPart.diameter 
                        ? `${selectedPart.width}/${selectedPart.ratio}R${selectedPart.diameter}` 
                        : 'N/A'}
                      disabled
                      style={{ backgroundColor: '#e5e7eb', cursor: 'not-allowed', fontFamily: 'monospace' }}
                    />
                  </div>
                </div>

                <div className="grid" style={{ gridTemplateColumns: '1fr 1fr 1fr' }}>
                  <div className="form-group">
                    <label>Width</label>
                    <input
                      type="text"
                      value={selectedPart.width || 'N/A'}
                      disabled
                      style={{ backgroundColor: '#e5e7eb', cursor: 'not-allowed' }}
                    />
                  </div>
                  <div className="form-group">
                    <label>Ratio</label>
                    <input
                      type="text"
                      value={selectedPart.ratio || 'N/A'}
                      disabled
                      style={{ backgroundColor: '#e5e7eb', cursor: 'not-allowed' }}
                    />
                  </div>
                  <div className="form-group">
                    <label>Diameter</label>
                    <input
                      type="text"
                      value={selectedPart.diameter || 'N/A'}
                      disabled
                      style={{ backgroundColor: '#e5e7eb', cursor: 'not-allowed' }}
                    />
                  </div>
                </div>

                <div className="grid" style={{ gridTemplateColumns: '1fr 1fr 1fr' }}>
                  <div className="form-group">
                    <label>Construction Type</label>
                    <input
                      type="text"
                      value={selectedPart.constructionType || 'N/A'}
                      disabled
                      style={{ backgroundColor: '#e5e7eb', cursor: 'not-allowed' }}
                    />
                  </div>
                  <div className="form-group">
                    <label>Load Index</label>
                    <input
                      type="text"
                      value={selectedPart.loadIndex || 'N/A'}
                      disabled
                      style={{ backgroundColor: '#e5e7eb', cursor: 'not-allowed' }}
                    />
                  </div>
                  <div className="form-group">
                    <label>Speed Rating</label>
                    <input
                      type="text"
                      value={selectedPart.speedRating || 'N/A'}
                      disabled
                      style={{ backgroundColor: '#e5e7eb', cursor: 'not-allowed' }}
                    />
                  </div>
                </div>

                {selectedPart.dotNumbers && selectedPart.dotNumbers.length > 0 && (
                  <div className="form-group">
                    <label>DOT Numbers</label>
                    <input
                      type="text"
                      value={selectedPart.dotNumbers.join(', ')}
                      disabled
                      style={{ backgroundColor: '#e5e7eb', cursor: 'not-allowed', fontFamily: 'monospace' }}
                    />
                  </div>
                )}
              </div>
            )}

            {/* Pricing & Inventory */}
            <div style={{ marginBottom: '2rem', padding: '1.5rem', backgroundColor: '#f9fafb', borderRadius: '8px' }}>
              <h3 style={{ marginBottom: '1rem', color: '#374151', fontSize: '1.1rem' }}>Pricing & Inventory</h3>
              
              <div className="grid" style={{ gridTemplateColumns: '1fr 1fr 1fr' }}>
                <div className="form-group">
                  <label>Cost</label>
                  <input
                    type="text"
                    value={formatCurrency(selectedPart.cost)}
                    disabled
                    style={{ backgroundColor: '#e5e7eb', cursor: 'not-allowed' }}
                  />
                </div>
                <div className="form-group">
                  <label>Retail Price</label>
                  <input
                    type="text"
                    value={formatCurrency(selectedPart.retail)}
                    disabled
                    style={{ backgroundColor: '#e5e7eb', cursor: 'not-allowed', fontWeight: 'bold' }}
                  />
                </div>
                <div className="form-group">
                  <label>Quantity in Stock</label>
                  <input
                    type="text"
                    value={selectedPart.quantity || 0}
                    disabled
                    style={{ 
                      backgroundColor: '#e5e7eb', 
                      cursor: 'not-allowed',
                      color: selectedPart.quantity > 0 ? '#10b981' : '#dc2626',
                      fontWeight: 'bold'
                    }}
                  />
                </div>
              </div>

              {selectedPart.quantity > 0 && (
                <div style={{ 
                  marginTop: '1rem', 
                  padding: '0.75rem', 
                  backgroundColor: '#d1fae5', 
                  borderRadius: '6px',
                  color: '#065f46',
                  fontSize: '0.9rem'
                }}>
                  ✓ In Stock
                </div>
              )}
              {selectedPart.quantity === 0 && (
                <div style={{ 
                  marginTop: '1rem', 
                  padding: '0.75rem', 
                  backgroundColor: '#fee2e2', 
                  borderRadius: '6px',
                  color: '#991b1b',
                  fontSize: '0.9rem'
                }}>
                  ✗ Out of Stock
                </div>
              )}
            </div>

            {/* Part Status */}
            {selectedPart.partStatus && (
              <div style={{ marginBottom: '2rem', padding: '1.5rem', backgroundColor: '#f9fafb', borderRadius: '8px' }}>
                <h3 style={{ marginBottom: '1rem', color: '#374151', fontSize: '1.1rem' }}>Status</h3>
                
                <div className="form-group">
                  <label>Part Status</label>
                  <input
                    type="text"
                    value={selectedPart.partStatus || 'N/A'}
                    disabled
                    style={{ backgroundColor: '#e5e7eb', cursor: 'not-allowed' }}
                  />
                </div>
              </div>
            )}

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

export default Inventory;
