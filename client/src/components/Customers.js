import React, { useState, useEffect } from 'react';
import { getCustomers, createCustomer, updateCustomer } from '../services/api';

function Customers() {
  const [customers, setCustomers] = useState([]);
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    customerTypeId: 1,
    address1: '',
    address2: '',
    city: '',
    state: '',
    zip: '',
    notes: '',
    eligibleForAccountsReceivable: true,
    creditLimit: '',
    okForMarketing: false,
    contactFirstName: '',
    contactLastName: '',
  });

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async (searchQuery = '') => {
    setLoading(true);
    setError(null);
    try {
      const shopId = localStorage.getItem('tekmetric_shop_id');
      const params = { shop: shopId, size: 100 }; // Get more results per page
      
      // Use Tekmetric's built-in search parameter
      if (searchQuery.trim()) {
        params.search = searchQuery;
      }
      
      const response = await getCustomers(params);
      const customerData = Array.isArray(response.data) ? response.data : response.data.content || [];
      setCustomers(customerData);
      setFilteredCustomers(customerData);
    } catch (err) {
      setError(err.response?.data?.error?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    const term = e.target.value;
    setSearchTerm(term);

    // Use API search for better results
    if (term.trim()) {
      loadCustomers(term);
    } else {
      loadCustomers();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      // Prepare data in correct format for Tekmetric API
      const createData = {
        firstName: formData.firstName,
        lastName: formData.lastName || null,
        customerTypeId: formData.customerTypeId,
        eligibleForAccountsReceivable: formData.eligibleForAccountsReceivable,
        okForMarketing: formData.okForMarketing,
      };
      
      // Email must be an array of strings
      if (formData.email && formData.email.trim()) {
        createData.email = [formData.email];
      }
      
      // Phone as array
      if (formData.phone && formData.phone.trim()) {
        createData.phones = [{
          number: formData.phone,
          type: 'Mobile',
          primary: true
        }];
      }
      
      // Address object
      if (formData.address1 || formData.city || formData.state || formData.zip) {
        createData.address = {
          address1: formData.address1 || '',
          address2: formData.address2 || '',
          city: formData.city || '',
          state: formData.state || '',
          zip: formData.zip || ''
        };
      }
      
      // Notes
      if (formData.notes && formData.notes.trim()) {
        createData.notes = formData.notes;
      }
      
      // Credit limit
      if (formData.creditLimit) {
        createData.creditLimit = parseInt(formData.creditLimit) || 0;
      }
      
      // Contact names for business customers
      if (formData.customerTypeId === 2) {
        createData.contactFirstName = formData.contactFirstName || null;
        createData.contactLastName = formData.contactLastName || null;
      }
      
      await createCustomer(createData);
      setSuccess('Customer created successfully!');
      loadCustomers(searchTerm);
      
      // Reset form and close modal after a brief delay
      setTimeout(() => {
        setShowForm(false);
        setFormData({
          firstName: '',
          lastName: '',
          email: '',
          phone: '',
          customerTypeId: 1,
          address1: '',
          address2: '',
          city: '',
          state: '',
          zip: '',
          notes: '',
          eligibleForAccountsReceivable: true,
          creditLimit: '',
          okForMarketing: false,
          contactFirstName: '',
          contactLastName: '',
        });
        setSuccess(null);
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.error?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleCustomerClick = (customer) => {
    setSelectedCustomer(customer);
    setFormData({
      firstName: customer.firstName || '',
      lastName: customer.lastName || '',
      email: Array.isArray(customer.email) && customer.email.length > 0 ? customer.email[0] : (customer.email || ''),
      phone: customer.phone && customer.phone.length > 0 ? customer.phone[0].number : '',
      customerTypeId: customer.customerType?.id || 1,
      address1: customer.address?.address1 || '',
      address2: customer.address?.address2 || '',
      city: customer.address?.city || '',
      state: customer.address?.state || '',
      zip: customer.address?.zip || '',
      notes: customer.notes || '',
      eligibleForAccountsReceivable: customer.eligibleForAccountsReceivable ?? true,
      creditLimit: customer.creditLimit || '',
      okForMarketing: customer.okForMarketing || false,
      contactFirstName: customer.contactFirstName || '',
      contactLastName: customer.contactLastName || '',
    });
    setShowModal(true);
    setError(null);
    setSuccess(null);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedCustomer(null);
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      customerTypeId: 1,
      address1: '',
      address2: '',
      city: '',
      state: '',
      zip: '',
      notes: '',
      eligibleForAccountsReceivable: true,
      creditLimit: '',
      okForMarketing: false,
      contactFirstName: '',
      contactLastName: '',
    });
    setError(null);
    setSuccess(null);
  };

  const handleUpdateCustomer = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      // Prepare data in correct format for Tekmetric API (per documentation)
      const updateData = {
        firstName: formData.firstName,
        lastName: formData.lastName || null,
        customerTypeId: formData.customerTypeId,
        eligibleForAccountsReceivable: formData.eligibleForAccountsReceivable,
        okForMarketing: formData.okForMarketing,
      };
      
      // Email must be an array of strings
      if (formData.email && formData.email.trim()) {
        updateData.email = [formData.email];
      } else {
        updateData.email = [];
      }
      
      // Use "phones" (plural) as per Tekmetric API documentation
      if (formData.phone && formData.phone.trim()) {
        // If customer has existing phone, preserve the ID and update the number
        if (selectedCustomer.phone && selectedCustomer.phone.length > 0) {
          updateData.phones = [{
            id: selectedCustomer.phone[0].id,
            number: formData.phone,
            type: selectedCustomer.phone[0].type || 'Mobile',
            primary: true
          }];
        } else {
          // New phone number
          updateData.phones = [{
            number: formData.phone,
            type: 'Mobile',
            primary: true
          }];
        }
      } else {
        updateData.phones = [];
      }
      
      // Address object
      if (formData.address1 || formData.city || formData.state || formData.zip) {
        updateData.address = {
          address1: formData.address1 || '',
          address2: formData.address2 || '',
          city: formData.city || '',
          state: formData.state || '',
          zip: formData.zip || ''
        };
        
        // If customer has existing address ID, preserve it
        if (selectedCustomer.address?.id) {
          updateData.address.id = selectedCustomer.address.id;
        }
      }
      
      // Notes
      if (formData.notes && formData.notes.trim()) {
        updateData.notes = formData.notes;
      }
      
      // Credit limit
      if (formData.creditLimit) {
        updateData.creditLimit = parseInt(formData.creditLimit) || 0;
      }
      
      // Contact names for business customers
      if (formData.customerTypeId === 2) {
        updateData.contactFirstName = formData.contactFirstName || null;
        updateData.contactLastName = formData.contactLastName || null;
      }
      
      await updateCustomer(selectedCustomer.id, updateData);
      setSuccess('Customer updated successfully!');
      loadCustomers(searchTerm);
      setTimeout(() => {
        handleCloseModal();
      }, 1500);
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
          <h2>Customers</h2>
          <button className="btn btn-primary" onClick={() => setShowForm(true)}>
            + Add Customer
          </button>
        </div>

        {/* Search Bar */}
        <div className="search-container">
          <input
            type="text"
            className="search-input"
            placeholder="Search customers by name, email, phone, or ID..."
            value={searchTerm}
            onChange={handleSearch}
          />
          {searchTerm && (
            <button 
              className="search-clear"
              onClick={() => {
                setSearchTerm('');
                setFilteredCustomers(customers);
              }}
            >
              ✕
            </button>
          )}
          <div className="search-results-count">
            {searchTerm && `Found ${filteredCustomers.length} of ${customers.length} customers`}
          </div>
        </div>

        {error && (
          <div className="alert alert-error" style={{ marginTop: '1rem' }}>
            <strong>Error:</strong> {error}
          </div>
        )}

        {loading ? (
          <div className="spinner"></div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Type</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Address</th>
                  <th>A/R</th>
                  <th>Created</th>
                </tr>
              </thead>
              <tbody>
                {filteredCustomers.length === 0 ? (
                  <tr>
                    <td colSpan="8" style={{ textAlign: 'center', padding: '2rem' }}>
                      {searchTerm ? `No customers found matching "${searchTerm}"` : 'No customers found. Click "Add Customer" to create one.'}
                    </td>
                  </tr>
                ) : (
                  filteredCustomers.map((customer) => (
                    <tr 
                      key={customer.id} 
                      onClick={() => handleCustomerClick(customer)}
                      style={{ cursor: 'pointer' }}
                    >
                      <td>{customer.id}</td>
                      <td>
                        <span style={{
                          padding: '0.25rem 0.5rem',
                          borderRadius: '8px',
                          fontSize: '0.75rem',
                          fontWeight: '600',
                          backgroundColor: customer.customerType?.business ? '#dbeafe' : '#fef3c7',
                          color: customer.customerType?.business ? '#1e40af' : '#92400e'
                        }}>
                          {customer.customerType?.name || 'Person'}
                        </span>
                      </td>
                      <td>
                        <strong>{customer.firstName} {customer.lastName || ''}</strong>
                        {customer.customerType?.business && (customer.contactFirstName || customer.contactLastName) && (
                          <div style={{ fontSize: '0.85rem', color: '#6b7280' }}>
                            Contact: {customer.contactFirstName} {customer.contactLastName}
                          </div>
                        )}
                      </td>
                      <td>{Array.isArray(customer.email) && customer.email.length > 0 ? customer.email[0] : (customer.email || 'N/A')}</td>
                      <td>{customer.phone && customer.phone.length > 0 ? customer.phone[0].number : 'N/A'}</td>
                      <td style={{ fontSize: '0.85rem' }}>
                        {customer.address?.fullAddress || customer.address?.city || 'N/A'}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        {customer.eligibleForAccountsReceivable ? '✓' : '—'}
                      </td>
                      <td>{customer.createdDate ? new Date(customer.createdDate).toLocaleDateString() : 'N/A'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit Customer Modal */}
      {showModal && selectedCustomer && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Edit Customer</h2>
              <button className="modal-close" onClick={handleCloseModal}>&times;</button>
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

            <form onSubmit={handleUpdateCustomer}>
              {/* Basic Info Section */}
              <h3 style={{ marginBottom: '1rem', color: '#374151', fontSize: '1.1rem' }}>Basic Information</h3>
              
              <div className="form-group">
                <label>Customer ID</label>
                <input
                  type="text"
                  value={selectedCustomer.id}
                  disabled
                  style={{ backgroundColor: '#f3f4f6', cursor: 'not-allowed' }}
                />
              </div>

              <div className="form-group">
                <label>Customer Type *</label>
                <select
                  name="customerTypeId"
                  value={formData.customerTypeId}
                  onChange={handleChange}
                  required
                >
                  <option value={1}>Person</option>
                  <option value={2}>Business</option>
                </select>
              </div>

              <div className="grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
                <div className="form-group">
                  <label>First Name *</label>
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Last Name</label>
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                  />
                </div>
              </div>

              {/* Business Contact (only for Business type) */}
              {formData.customerTypeId === 2 && (
                <div className="grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
                  <div className="form-group">
                    <label>Contact First Name</label>
                    <input
                      type="text"
                      name="contactFirstName"
                      value={formData.contactFirstName}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="form-group">
                    <label>Contact Last Name</label>
                    <input
                      type="text"
                      name="contactLastName"
                      value={formData.contactLastName}
                      onChange={handleChange}
                    />
                  </div>
                </div>
              )}

              {/* Contact Info Section */}
              <h3 style={{ marginTop: '2rem', marginBottom: '1rem', color: '#374151', fontSize: '1.1rem' }}>Contact Information</h3>

              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label>Phone</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="555-123-4567"
                />
              </div>

              {/* Address Section */}
              <h3 style={{ marginTop: '2rem', marginBottom: '1rem', color: '#374151', fontSize: '1.1rem' }}>Address</h3>

              <div className="form-group">
                <label>Address Line 1</label>
                <input
                  type="text"
                  name="address1"
                  value={formData.address1}
                  onChange={handleChange}
                  placeholder="123 Main Street"
                />
              </div>

              <div className="form-group">
                <label>Address Line 2</label>
                <input
                  type="text"
                  name="address2"
                  value={formData.address2}
                  onChange={handleChange}
                  placeholder="Apt 4B"
                />
              </div>

              <div className="grid" style={{ gridTemplateColumns: '2fr 1fr 1fr' }}>
                <div className="form-group">
                  <label>City</label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
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
                    placeholder="CA"
                  />
                </div>
                <div className="form-group">
                  <label>ZIP Code</label>
                  <input
                    type="text"
                    name="zip"
                    value={formData.zip}
                    onChange={handleChange}
                    placeholder="12345"
                  />
                </div>
              </div>

              {/* Additional Info Section */}
              <h3 style={{ marginTop: '2rem', marginBottom: '1rem', color: '#374151', fontSize: '1.1rem' }}>Additional Information</h3>

              <div className="form-group">
                <label>Notes</label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  rows="3"
                  placeholder="Add any notes about this customer..."
                />
              </div>

              <div className="grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
                <div className="form-group">
                  <label>Credit Limit ($)</label>
                  <input
                    type="number"
                    name="creditLimit"
                    value={formData.creditLimit}
                    onChange={handleChange}
                    min="0"
                    placeholder="0"
                  />
                </div>
                <div className="form-group">
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <input
                      type="checkbox"
                      name="eligibleForAccountsReceivable"
                      checked={formData.eligibleForAccountsReceivable}
                      onChange={(e) => setFormData({ ...formData, eligibleForAccountsReceivable: e.target.checked })}
                      style={{ width: 'auto', margin: 0 }}
                    />
                    Eligible for Accounts Receivable
                  </label>
                </div>
              </div>

              <div className="form-group">
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <input
                    type="checkbox"
                    name="okForMarketing"
                    checked={formData.okForMarketing}
                    onChange={(e) => setFormData({ ...formData, okForMarketing: e.target.checked })}
                    style={{ width: 'auto', margin: 0 }}
                  />
                  OK for Marketing
                </label>
              </div>

              <div className="form-group">
                <label>Created Date</label>
                <input
                  type="text"
                  value={selectedCustomer.createdDate ? new Date(selectedCustomer.createdDate).toLocaleString() : 'N/A'}
                  disabled
                  style={{ backgroundColor: '#f3f4f6', cursor: 'not-allowed' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem', paddingTop: '1rem', borderTop: '2px solid #e5e7eb' }}>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? 'Updating...' : 'Update Customer'}
                </button>
                <button type="button" className="btn btn-secondary" onClick={handleCloseModal}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Customer Modal */}
      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '900px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="modal-header">
              <h2>Create New Customer</h2>
              <button className="modal-close" onClick={() => setShowForm(false)}>&times;</button>
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

            <form onSubmit={handleSubmit}>
              {/* Basic Information */}
              <div style={{ marginBottom: '2rem', padding: '1.5rem', backgroundColor: '#f9fafb', borderRadius: '8px' }}>
                <h3 style={{ marginBottom: '1rem', color: '#374151', fontSize: '1.1rem' }}>Basic Information</h3>
                
                <div className="form-group">
                  <label>Customer Type *</label>
                  <select
                    name="customerTypeId"
                    value={formData.customerTypeId}
                    onChange={handleChange}
                    required
                  >
                    <option value={1}>Person</option>
                    <option value={2}>Business</option>
                  </select>
                </div>

                <div className="grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
                  <div className="form-group">
                    <label>First Name *</label>
                    <input
                      type="text"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Last Name</label>
                    <input
                      type="text"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                {/* Business Contact (only for Business type) */}
                {formData.customerTypeId === 2 && (
                  <div className="grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
                    <div className="form-group">
                      <label>Contact First Name</label>
                      <input
                        type="text"
                        name="contactFirstName"
                        value={formData.contactFirstName}
                        onChange={handleChange}
                      />
                    </div>
                    <div className="form-group">
                      <label>Contact Last Name</label>
                      <input
                        type="text"
                        name="contactLastName"
                        value={formData.contactLastName}
                        onChange={handleChange}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Contact Information */}
              <div style={{ marginBottom: '2rem', padding: '1.5rem', backgroundColor: '#f9fafb', borderRadius: '8px' }}>
                <h3 style={{ marginBottom: '1rem', color: '#374151', fontSize: '1.1rem' }}>Contact Information</h3>

                <div className="form-group">
                  <label>Email</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                  />
                </div>

                <div className="form-group">
                  <label>Phone</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="555-123-4567"
                  />
                </div>
              </div>

              {/* Address */}
              <div style={{ marginBottom: '2rem', padding: '1.5rem', backgroundColor: '#f9fafb', borderRadius: '8px' }}>
                <h3 style={{ marginBottom: '1rem', color: '#374151', fontSize: '1.1rem' }}>Address</h3>

                <div className="form-group">
                  <label>Address Line 1</label>
                  <input
                    type="text"
                    name="address1"
                    value={formData.address1}
                    onChange={handleChange}
                    placeholder="123 Main Street"
                  />
                </div>

                <div className="form-group">
                  <label>Address Line 2</label>
                  <input
                    type="text"
                    name="address2"
                    value={formData.address2}
                    onChange={handleChange}
                    placeholder="Apt 4B"
                  />
                </div>

                <div className="grid" style={{ gridTemplateColumns: '2fr 1fr 1fr' }}>
                  <div className="form-group">
                    <label>City</label>
                    <input
                      type="text"
                      name="city"
                      value={formData.city}
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
                      placeholder="CA"
                    />
                  </div>
                  <div className="form-group">
                    <label>ZIP Code</label>
                    <input
                      type="text"
                      name="zip"
                      value={formData.zip}
                      onChange={handleChange}
                      placeholder="12345"
                    />
                  </div>
                </div>
              </div>

              {/* Additional Information */}
              <div style={{ marginBottom: '2rem', padding: '1.5rem', backgroundColor: '#f9fafb', borderRadius: '8px' }}>
                <h3 style={{ marginBottom: '1rem', color: '#374151', fontSize: '1.1rem' }}>Additional Information</h3>

                <div className="form-group">
                  <label>Notes</label>
                  <textarea
                    name="notes"
                    value={formData.notes}
                    onChange={handleChange}
                    rows="3"
                    placeholder="Add any notes about this customer..."
                  />
                </div>

                <div className="grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
                  <div className="form-group">
                    <label>Credit Limit ($)</label>
                    <input
                      type="number"
                      name="creditLimit"
                      value={formData.creditLimit}
                      onChange={handleChange}
                      min="0"
                      placeholder="0"
                    />
                  </div>
                  <div className="form-group">
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <input
                        type="checkbox"
                        name="eligibleForAccountsReceivable"
                        checked={formData.eligibleForAccountsReceivable}
                        onChange={(e) => setFormData({ ...formData, eligibleForAccountsReceivable: e.target.checked })}
                        style={{ width: 'auto', margin: 0 }}
                      />
                      Eligible for Accounts Receivable
                    </label>
                  </div>
                </div>

                <div className="form-group">
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <input
                      type="checkbox"
                      name="okForMarketing"
                      checked={formData.okForMarketing}
                      onChange={(e) => setFormData({ ...formData, okForMarketing: e.target.checked })}
                      style={{ width: 'auto', margin: 0 }}
                    />
                    OK for Marketing
                  </label>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1rem', paddingTop: '1rem', borderTop: '2px solid #e5e7eb' }}>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? 'Creating...' : 'Create Customer'}
                </button>
                <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Customers;
