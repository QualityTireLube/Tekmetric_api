import React, { useState, useEffect } from 'react';
import { getAppointments, getAppointment, createAppointment, updateAppointment, deleteAppointment, getShops, getCustomers, getVehicles, getCustomerVehicles } from '../services/api';

function Appointments() {
  const [appointments, setAppointments] = useState([]);
  const [filteredAppointments, setFilteredAppointments] = useState([]);
  const [shops, setShops] = useState([]);
  const [currentShop, setCurrentShop] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [customerSearch, setCustomerSearch] = useState('');
  const [vehicleSearch, setVehicleSearch] = useState('');
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [showVehicleDropdown, setShowVehicleDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [customerSearchTimeout, setCustomerSearchTimeout] = useState(null);
  const [vehicleSearchTimeout, setVehicleSearchTimeout] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');
  const [formData, setFormData] = useState({
    shopId: '',
    customerId: '',
    vehicleId: '',
    startTime: '',
    endTime: '',
    title: '',
    description: '',
    color: 'navy',
    dropoffTime: '',
    pickupTime: '',
    rideOption: 'NONE',
    status: 'NONE',
    leadSource: '',
  });

  useEffect(() => {
    loadShops();
    loadAppointments();
    
    // Close dropdowns when clicking outside
    const handleClickOutside = (e) => {
      if (!e.target.closest('.form-group')) {
        setShowCustomerDropdown(false);
        setShowVehicleDropdown(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadShops = async () => {
    try {
      const response = await getShops();
      const shopsData = Array.isArray(response.data) ? response.data : [response.data];
      setShops(shopsData);
      
      // Get the stored shop ID and find the shop details
      const shopId = localStorage.getItem('tekmetric_shop_id');
      if (shopId && shopsData.length > 0) {
        const shop = shopsData.find(s => s.id === parseInt(shopId)) || shopsData[0];
        setCurrentShop(shop);
        
        // Pre-fill the shopId in formData
        setFormData(prev => ({
          ...prev,
          shopId: shop.id.toString()
        }));
      }
    } catch (err) {
      console.error('Error loading shops:', err);
    }
  };

  const searchCustomers = async (query) => {
    if (!query.trim()) {
      setCustomers([]);
      return;
    }
    
    try {
      const shopId = localStorage.getItem('tekmetric_shop_id');
      console.log(`Searching for customers with query: "${query}"`);
      
      // Try searching with the full query first
      let response = await getCustomers({ shop: shopId, search: query, size: 50 });
      let customerData = Array.isArray(response.data) ? response.data : response.data.content || [];
      
      console.log(`Found ${customerData.length} customers with full query`);
      
      // If no results and query has spaces, try searching by first word (first name)
      if (customerData.length === 0 && query.includes(' ')) {
        const firstName = query.split(' ')[0];
        console.log(`Trying search with first name only: "${firstName}"`);
        response = await getCustomers({ shop: shopId, search: firstName, size: 50 });
        customerData = Array.isArray(response.data) ? response.data : response.data.content || [];
        
        // Filter results to match the full query (first name + last name)
        const queryLower = query.toLowerCase();
        customerData = customerData.filter(c => {
          const fullName = `${c.firstName} ${c.lastName}`.toLowerCase();
          return fullName.includes(queryLower);
        });
        
        console.log(`Found ${customerData.length} customers after filtering by full name`);
      }
      
      setCustomers(customerData);
    } catch (err) {
      console.error('Error searching customers:', err);
      setCustomers([]);
    }
  };

  const searchVehicles = async (query) => {
    try {
      const shopId = localStorage.getItem('tekmetric_shop_id');
      
      // If no query, load customer's vehicles if customer is selected
      if (!query.trim() && formData.customerId) {
        const response = await getVehicles({ shop: shopId, customerId: formData.customerId, size: 100 });
        const vehicleData = Array.isArray(response.data) ? response.data : response.data.content || [];
        setVehicles(vehicleData);
        return;
      }
      
      if (!query.trim()) {
        setVehicles([]);
        return;
      }
      
      // Search all vehicles, but if customer is selected, get their vehicles first
      if (formData.customerId) {
        // Get customer's vehicles
        const customerResponse = await getVehicles({ shop: shopId, customerId: formData.customerId, size: 100 });
        const customerVehicles = Array.isArray(customerResponse.data) ? customerResponse.data : customerResponse.data.content || [];
        
        // Search all vehicles
        const searchResponse = await getVehicles({ shop: shopId, search: query, size: 100 });
        const searchResults = Array.isArray(searchResponse.data) ? searchResponse.data : searchResponse.data.content || [];
        
        // Combine: customer vehicles first, then other search results (avoiding duplicates)
        const customerVehicleIds = new Set(customerVehicles.map(v => v.id));
        const otherVehicles = searchResults.filter(v => !customerVehicleIds.has(v.id));
        
        setVehicles([...customerVehicles, ...otherVehicles]);
      } else {
        // No customer selected, just search
        const response = await getVehicles({ shop: shopId, search: query, size: 100 });
        const vehicleData = Array.isArray(response.data) ? response.data : response.data.content || [];
        setVehicles(vehicleData);
      }
    } catch (err) {
      console.error('Error searching vehicles:', err);
    }
  };

  const handleCustomerSearch = (e) => {
    const query = e.target.value;
    setCustomerSearch(query);
    setShowCustomerDropdown(true);
    
    // Clear previous timeout
    if (customerSearchTimeout) {
      clearTimeout(customerSearchTimeout);
    }
    
    // Set new timeout to search after user stops typing (300ms delay)
    const newTimeout = setTimeout(() => {
      searchCustomers(query);
    }, 300);
    
    setCustomerSearchTimeout(newTimeout);
  };

  const handleSelectCustomer = async (customer) => {
    setFormData({ ...formData, customerId: customer.id.toString(), vehicleId: '' });
    setCustomerSearch(`${customer.firstName} ${customer.lastName} (ID: ${customer.id})`);
    setShowCustomerDropdown(false);
    
    // Load customer's vehicles using the API's customerId parameter
    try {
      const shopId = localStorage.getItem('tekmetric_shop_id');
      
      console.log(`Loading vehicles for customer ${customer.id} (${customer.firstName} ${customer.lastName})...`);
      
      // Use the API's built-in customerId parameter
      const response = await getVehicles({ shop: shopId, customerId: customer.id, size: 100 });
      const customerVehicles = Array.isArray(response.data) ? response.data : response.data.content || [];
      
      setVehicles(customerVehicles);
      setVehicleSearch(''); // Clear vehicle search to show customer's vehicles
      
      console.log(`Found ${customerVehicles.length} vehicle(s) for customer ${customer.id}:`, customerVehicles);
      
      if (customerVehicles.length === 0) {
        console.warn(`No vehicles found for customer ${customer.id} (${customer.firstName} ${customer.lastName})`);
      }
    } catch (err) {
      console.error('Error loading customer vehicles:', err);
      setVehicles([]);
    }
  };

  const handleVehicleSearch = (e) => {
    const query = e.target.value;
    setVehicleSearch(query);
    setShowVehicleDropdown(true);
    
    // Clear previous timeout
    if (vehicleSearchTimeout) {
      clearTimeout(vehicleSearchTimeout);
    }
    
    // Set new timeout to search after user stops typing (300ms delay)
    const newTimeout = setTimeout(() => {
      searchVehicles(query);
    }, 300);
    
    setVehicleSearchTimeout(newTimeout);
  };

  const handleVehicleFocus = async () => {
    setShowVehicleDropdown(true);
    // If no search query and customer is selected, load their vehicles
    if (!vehicleSearch && formData.customerId) {
      try {
        const shopId = localStorage.getItem('tekmetric_shop_id');
        const response = await getVehicles({ shop: shopId, customerId: formData.customerId, size: 100 });
        const vehicleData = Array.isArray(response.data) ? response.data : response.data.content || [];
        setVehicles(vehicleData);
      } catch (err) {
        console.error('Error loading customer vehicles:', err);
      }
    }
  };

  const handleSelectVehicle = (vehicle) => {
    setFormData({ ...formData, vehicleId: vehicle.id.toString() });
    setVehicleSearch(`${vehicle.year} ${vehicle.make} ${vehicle.model} (ID: ${vehicle.id})`);
    setShowVehicleDropdown(false);
  };

  const loadAppointments = async (status = '') => {
    setLoading(true);
    setError(null);
    try {
      const shopId = localStorage.getItem('tekmetric_shop_id');
      const params = { shop: shopId, size: 100 };
      
      if (status) {
        // Filter client-side since API doesn't have status filter
        const response = await getAppointments(params);
        const apptData = Array.isArray(response.data) ? response.data : response.data.content || [];
        const filtered = status ? apptData.filter(a => a.appointmentStatus === status) : apptData;
        setAppointments(apptData);
        setFilteredAppointments(filtered);
      } else {
        const response = await getAppointments(params);
        const apptData = Array.isArray(response.data) ? response.data : response.data.content || [];
        setAppointments(apptData);
        setFilteredAppointments(apptData);
      }
    } catch (err) {
      setError(err.response?.data?.error?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusFilter = (e) => {
    const status = e.target.value;
    setStatusFilter(status);
    
    if (status) {
      const filtered = appointments.filter(a => a.appointmentStatus === status);
      setFilteredAppointments(filtered);
    } else {
      setFilteredAppointments(appointments);
    }
  };

  const handleAppointmentClick = async (appointment) => {
    try {
      setLoading(true);
      const response = await getAppointment(appointment.id);
      const fullAppt = response.data;
      
      setSelectedAppointment(fullAppt);
      setFormData({
        shopId: fullAppt.shopId || '',
        customerId: fullAppt.customerId || '',
        vehicleId: fullAppt.vehicleId || '',
        startTime: fullAppt.startTime ? fullAppt.startTime.substring(0, 16) : '',
        endTime: fullAppt.endTime ? fullAppt.endTime.substring(0, 16) : '',
        title: fullAppt.title || '',
        description: fullAppt.description || '',
        color: fullAppt.color || 'navy',
        dropoffTime: fullAppt.dropoffTime ? fullAppt.dropoffTime.substring(0, 16) : '',
        pickupTime: fullAppt.pickupTime ? fullAppt.pickupTime.substring(0, 16) : '',
        rideOption: fullAppt.rideOption?.code || 'NONE',
        status: fullAppt.appointmentStatus || 'NONE',
        leadSource: fullAppt.leadSource || '',
      });
      
      // Clear search fields
      setCustomerSearch('');
      setVehicleSearch('');
      setShowCustomerDropdown(false);
      setShowVehicleDropdown(false);
      
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
    setSelectedAppointment(null);
    setEditMode(false);
    resetFormData();
    setCustomerSearch('');
    setVehicleSearch('');
    setShowCustomerDropdown(false);
    setShowVehicleDropdown(false);
    setError(null);
    setSuccess(null);
  };

  const resetFormData = () => {
    const shopId = localStorage.getItem('tekmetric_shop_id');
    setFormData({
      shopId: shopId || '',
      customerId: '',
      vehicleId: '',
      startTime: '',
      endTime: '',
      title: '',
      description: '',
      color: 'navy',
      dropoffTime: '',
      pickupTime: '',
      rideOption: 'NONE',
      status: 'NONE',
      leadSource: '',
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
      const submitData = {
        shopId: parseInt(formData.shopId),
        startTime: new Date(formData.startTime).toISOString(),
        endTime: new Date(formData.endTime).toISOString(),
        title: formData.title,
        description: formData.description || null,
        color: formData.color,
        rideOption: formData.rideOption,
        status: formData.status,
      };
      
      if (formData.customerId) submitData.customerId = parseInt(formData.customerId);
      if (formData.vehicleId) submitData.vehicleId = parseInt(formData.vehicleId);
      if (formData.dropoffTime) submitData.dropoffTime = new Date(formData.dropoffTime).toISOString();
      if (formData.pickupTime) submitData.pickupTime = new Date(formData.pickupTime).toISOString();
      if (formData.leadSource) submitData.leadSource = formData.leadSource;
      
      await createAppointment(submitData);
      setSuccess('Appointment created successfully!');
      setShowForm(false);
      resetFormData();
      setCustomerSearch('');
      setVehicleSearch('');
      setShowCustomerDropdown(false);
      setShowVehicleDropdown(false);
      loadAppointments(statusFilter);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.response?.data?.error?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateAppointment = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const updateData = {
        shopId: parseInt(formData.shopId),
        startTime: new Date(formData.startTime).toISOString(),
        endTime: new Date(formData.endTime).toISOString(),
        title: formData.title,
        description: formData.description || null,
        color: formData.color,
        rideOption: formData.rideOption,
        status: formData.status,
      };
      
      if (formData.customerId) updateData.customerId = parseInt(formData.customerId);
      if (formData.vehicleId) updateData.vehicleId = parseInt(formData.vehicleId);
      if (formData.dropoffTime) updateData.dropoffTime = new Date(formData.dropoffTime).toISOString();
      if (formData.pickupTime) updateData.pickupTime = new Date(formData.pickupTime).toISOString();
      if (formData.leadSource) updateData.leadSource = formData.leadSource;
      
      await updateAppointment(selectedAppointment.id, updateData);
      setSuccess('Appointment updated successfully!');
      setEditMode(false);
      loadAppointments(statusFilter);
      
      const response = await getAppointment(selectedAppointment.id);
      setSelectedAppointment(response.data);
      
      setTimeout(() => {
        setSuccess(null);
      }, 3000);
    } catch (err) {
      setError(err.response?.data?.error?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAppointment = async () => {
    if (!window.confirm('Are you sure you want to delete this appointment?')) return;
    
    setLoading(true);
    setError(null);
    try {
      await deleteAppointment(selectedAppointment.id);
      setSuccess('Appointment deleted successfully!');
      handleCloseModal();
      loadAppointments(statusFilter);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.response?.data?.error?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      'NONE': '#6b7280',
      'ARRIVED': '#10b981',
      'NO_SHOW': '#dc2626',
      'CANCELLED': '#ef4444',
    };
    return colors[status] || '#6b7280';
  };

  const getColorHex = (colorName) => {
    const colors = {
      'red': '#dc2626',
      'pink': '#ec4899',
      'yellow': '#eab308',
      'orange': '#f97316',
      'light green': '#84cc16',
      'green': '#10b981',
      'blue': '#3b82f6',
      'navy': '#1e40af',
      'lavender': '#a78bfa',
      'purple': '#9333ea',
    };
    return colors[colorName] || colors['navy'];
  };

  return (
    <div>
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2>Appointments</h2>
          <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
            {showForm ? 'Cancel' : '+ Add Appointment'}
          </button>
        </div>

        {/* Status Filter */}
        <div style={{ marginBottom: '1.5rem' }}>
          <div className="form-group" style={{ margin: 0, maxWidth: '250px' }}>
            <select
              value={statusFilter}
              onChange={handleStatusFilter}
              style={{ width: '100%' }}
            >
              <option value="">All Statuses</option>
              <option value="NONE">None</option>
              <option value="ARRIVED">Arrived</option>
              <option value="NO_SHOW">No Show</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>
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
          <form onSubmit={handleSubmit} style={{ marginTop: '2rem', marginBottom: '2rem', padding: '1.5rem', backgroundColor: '#f9fafb', borderRadius: '8px' }}>
            <h3 style={{ marginBottom: '1rem' }}>Create New Appointment</h3>
            
            <div className="form-group">
              <label>Shop *</label>
              {shops.length > 1 ? (
                <select
                  name="shopId"
                  value={formData.shopId}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select a shop...</option>
                  {shops.map(shop => (
                    <option key={shop.id} value={shop.id}>
                      {shop.name} {shop.nickname && `(${shop.nickname})`}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  value={currentShop ? `${currentShop.name}${currentShop.nickname ? ` (${currentShop.nickname})` : ''}` : 'Loading...'}
                  disabled
                  style={{ backgroundColor: '#e5e7eb', cursor: 'not-allowed' }}
                />
              )}
            </div>

            <div className="grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
              <div className="form-group" style={{ position: 'relative' }}>
                <label>Customer</label>
                <input
                  type="text"
                  value={customerSearch}
                  onChange={handleCustomerSearch}
                  onFocus={() => setShowCustomerDropdown(true)}
                  placeholder="Search by name..."
                />
                {showCustomerDropdown && customerSearch.trim() && customers.length === 0 && (
                  <div style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    backgroundColor: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    padding: '1rem',
                    zIndex: 1000,
                    marginTop: '0.25rem',
                    textAlign: 'center',
                    color: '#6b7280'
                  }}>
                    {customerSearchTimeout ? 'Searching...' : 'No customers found'}
                  </div>
                )}
                {showCustomerDropdown && customers.length > 0 && (
                  <div style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    maxHeight: '200px',
                    overflowY: 'auto',
                    backgroundColor: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                    zIndex: 1000,
                    marginTop: '0.25rem'
                  }}>
                    {customers.map(customer => (
                      <div
                        key={customer.id}
                        onClick={() => handleSelectCustomer(customer)}
                        style={{
                          padding: '0.75rem',
                          cursor: 'pointer',
                          borderBottom: '1px solid #f3f4f6',
                          '&:hover': { backgroundColor: '#f9fafb' }
                        }}
                        onMouseEnter={(e) => e.target.style.backgroundColor = '#f9fafb'}
                        onMouseLeave={(e) => e.target.style.backgroundColor = 'white'}
                      >
                        <div><strong>{customer.firstName} {customer.lastName}</strong></div>
                        <div style={{ fontSize: '0.85rem', color: '#6b7280' }}>
                          ID: {customer.id} | {Array.isArray(customer.email) && customer.email.length > 0 ? customer.email[0] : customer.email || 'No email'}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="form-group" style={{ position: 'relative' }}>
                <label>Vehicle</label>
                <input
                  type="text"
                  value={vehicleSearch}
                  onChange={handleVehicleSearch}
                  onFocus={handleVehicleFocus}
                  placeholder={formData.customerId ? "Select customer's vehicle or search..." : "Search by year, make, model..."}
                />
                {showVehicleDropdown && formData.customerId && vehicles.length === 0 && !vehicleSearch && (
                  <div style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    backgroundColor: '#fef3c7',
                    border: '1px solid #fbbf24',
                    borderRadius: '8px',
                    padding: '1rem',
                    zIndex: 1000,
                    marginTop: '0.25rem',
                    textAlign: 'center',
                    color: '#92400e'
                  }}>
                    <strong>No vehicles found for this customer.</strong>
                    <div style={{ fontSize: '0.85rem', marginTop: '0.5rem' }}>
                      Type to search for other vehicles or add a vehicle for this customer first.
                    </div>
                  </div>
                )}
                {showVehicleDropdown && vehicles.length > 0 && (
                  <div style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    maxHeight: '200px',
                    overflowY: 'auto',
                    backgroundColor: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                    zIndex: 1000,
                    marginTop: '0.25rem'
                  }}>
                    {vehicles.map((vehicle, index) => {
                      const isCustomerVehicle = formData.customerId && vehicle.customerId === parseInt(formData.customerId);
                      const prevVehicle = index > 0 ? vehicles[index - 1] : null;
                      const showSeparator = prevVehicle && 
                        formData.customerId && 
                        prevVehicle.customerId === parseInt(formData.customerId) && 
                        vehicle.customerId !== parseInt(formData.customerId);
                      
                      return (
                        <React.Fragment key={vehicle.id}>
                          {showSeparator && (
                            <div style={{
                              padding: '0.5rem 0.75rem',
                              backgroundColor: '#f3f4f6',
                              fontSize: '0.75rem',
                              fontWeight: '600',
                              color: '#6b7280',
                              textTransform: 'uppercase',
                              letterSpacing: '0.05em'
                            }}>
                              Other Vehicles
                            </div>
                          )}
                          <div
                            onClick={() => handleSelectVehicle(vehicle)}
                            style={{
                              padding: '0.75rem',
                              cursor: 'pointer',
                              borderBottom: '1px solid #f3f4f6',
                              backgroundColor: isCustomerVehicle ? '#f0f9ff' : 'white'
                            }}
                            onMouseEnter={(e) => e.target.style.backgroundColor = isCustomerVehicle ? '#e0f2fe' : '#f9fafb'}
                            onMouseLeave={(e) => e.target.style.backgroundColor = isCustomerVehicle ? '#f0f9ff' : 'white'}
                          >
                            <div>
                              <strong>{vehicle.year} {vehicle.make} {vehicle.model}</strong>
                              {isCustomerVehicle && (
                                <span style={{ 
                                  marginLeft: '0.5rem', 
                                  fontSize: '0.75rem', 
                                  color: '#0284c7',
                                  fontWeight: '600'
                                }}>
                                  ✓ Customer's Vehicle
                                </span>
                              )}
                            </div>
                            <div style={{ fontSize: '0.85rem', color: '#6b7280' }}>
                              ID: {vehicle.id} | {vehicle.vin || 'No VIN'} | Customer: {vehicle.customerId}
                            </div>
                          </div>
                        </React.Fragment>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            <div className="form-group">
              <label>Title *</label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
                placeholder="Appointment title"
              />
            </div>

            <div className="grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
              <div className="form-group">
                <label>Start Time *</label>
                <input
                  type="datetime-local"
                  name="startTime"
                  value={formData.startTime}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>End Time *</label>
                <input
                  type="datetime-local"
                  name="endTime"
                  value={formData.endTime}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label>Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows="3"
                placeholder="Appointment description"
              />
            </div>

            <div className="grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
              <div className="form-group">
                <label>Drop-off Time</label>
                <input
                  type="datetime-local"
                  name="dropoffTime"
                  value={formData.dropoffTime}
                  onChange={handleChange}
                />
              </div>
              <div className="form-group">
                <label>Pick-up Time</label>
                <input
                  type="datetime-local"
                  name="pickupTime"
                  value={formData.pickupTime}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="grid" style={{ gridTemplateColumns: '1fr 1fr 1fr' }}>
              <div className="form-group">
                <label>Color</label>
                <select
                  name="color"
                  value={formData.color}
                  onChange={handleChange}
                >
                  <option value="red">Red</option>
                  <option value="pink">Pink</option>
                  <option value="yellow">Yellow</option>
                  <option value="orange">Orange</option>
                  <option value="light green">Light Green</option>
                  <option value="green">Green</option>
                  <option value="blue">Blue</option>
                  <option value="navy">Navy</option>
                  <option value="lavender">Lavender</option>
                  <option value="purple">Purple</option>
                </select>
              </div>
              <div className="form-group">
                <label>Ride Option</label>
                <select
                  name="rideOption"
                  value={formData.rideOption}
                  onChange={handleChange}
                >
                  <option value="NONE">None</option>
                  <option value="RIDE">Ride Required</option>
                  <option value="LOANER">Loaner Required</option>
                </select>
              </div>
              <div className="form-group">
                <label>Status</label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                >
                  <option value="NONE">None</option>
                  <option value="ARRIVED">Arrived</option>
                  <option value="NO_SHOW">No Show</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label>Lead Source</label>
              <input
                type="text"
                name="leadSource"
                value={formData.leadSource}
                onChange={handleChange}
                placeholder="e.g., Drive-By, Yelp, Referral"
              />
            </div>

            <button type="submit" className="btn btn-success" disabled={loading}>
              {loading ? 'Creating...' : 'Create Appointment'}
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
                  <th>Title</th>
                  <th>Customer</th>
                  <th>Vehicle</th>
                  <th>Start Time</th>
                  <th>End Time</th>
                  <th>Status</th>
                  <th>Ride Option</th>
                  <th>Lead Source</th>
                </tr>
              </thead>
              <tbody>
                {filteredAppointments.length === 0 ? (
                  <tr>
                    <td colSpan="9" style={{ textAlign: 'center', padding: '2rem' }}>
                      {statusFilter ? `No appointments found with status "${statusFilter}"` : 'No appointments found. Click "Add Appointment" to create one.'}
                    </td>
                  </tr>
                ) : (
                  filteredAppointments.map((appt) => (
                    <tr 
                      key={appt.id}
                      onClick={() => handleAppointmentClick(appt)}
                      style={{ cursor: 'pointer', borderLeft: `4px solid ${getColorHex(appt.color)}` }}
                    >
                      <td><strong>{appt.id}</strong></td>
                      <td>{appt.title || appt.description?.substring(0, 50) || 'N/A'}</td>
                      <td>{appt.customerId || 'N/A'}</td>
                      <td>{appt.vehicleId || 'N/A'}</td>
                      <td>{appt.startTime ? new Date(appt.startTime).toLocaleString() : 'N/A'}</td>
                      <td>{appt.endTime ? new Date(appt.endTime).toLocaleString() : 'N/A'}</td>
                      <td>
                        <span style={{
                          padding: '0.25rem 0.75rem',
                          borderRadius: '12px',
                          fontSize: '0.75rem',
                          fontWeight: '600',
                          color: 'white',
                          backgroundColor: getStatusColor(appt.appointmentStatus)
                        }}>
                          {appt.appointmentStatus || 'NONE'}
                        </span>
                      </td>
                      <td>{appt.rideOption?.name || 'None'}</td>
                      <td style={{ fontSize: '0.85rem' }}>{appt.leadSource || 'N/A'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit Appointment Modal */}
      {showModal && selectedAppointment && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '900px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="modal-header">
              <h2>{selectedAppointment.title || 'Appointment Details'}</h2>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                {!editMode && (
                  <>
                    <button 
                      className="btn btn-primary" 
                      onClick={() => setEditMode(true)}
                      style={{ fontSize: '0.9rem', padding: '0.5rem 1rem' }}
                    >
                      Edit
                    </button>
                    <button 
                      className="btn" 
                      onClick={handleDeleteAppointment}
                      style={{ fontSize: '0.9rem', padding: '0.5rem 1rem', backgroundColor: '#dc2626', color: 'white' }}
                    >
                      Delete
                    </button>
                  </>
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

            <form onSubmit={handleUpdateAppointment}>
              {/* Basic Information */}
              <div style={{ marginBottom: '2rem', padding: '1.5rem', backgroundColor: '#f9fafb', borderRadius: '8px' }}>
                <h3 style={{ marginBottom: '1rem', color: '#374151', fontSize: '1.1rem' }}>Basic Information</h3>
                
                <div className="grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
                  <div className="form-group">
                    <label>Appointment ID</label>
                    <input
                      type="text"
                      value={selectedAppointment.id}
                      disabled
                      style={{ backgroundColor: '#e5e7eb', cursor: 'not-allowed' }}
                    />
                  </div>
                  <div className="form-group">
                    <label>Status {editMode && '*'}</label>
                    <select
                      name="status"
                      value={formData.status}
                      onChange={handleChange}
                      disabled={!editMode}
                      style={!editMode ? { backgroundColor: '#e5e7eb', cursor: 'not-allowed' } : {}}
                    >
                      <option value="NONE">None</option>
                      <option value="ARRIVED">Arrived</option>
                      <option value="NO_SHOW">No Show</option>
                      <option value="CANCELLED">Cancelled</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label>Shop {editMode && '*'}</label>
                  {editMode && shops.length > 1 ? (
                    <select
                      name="shopId"
                      value={formData.shopId}
                      onChange={handleChange}
                      required
                    >
                      <option value="">Select a shop...</option>
                      {shops.map(shop => (
                        <option key={shop.id} value={shop.id}>
                          {shop.name} {shop.nickname && `(${shop.nickname})`}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      value={currentShop ? `${currentShop.name}${currentShop.nickname ? ` (${currentShop.nickname})` : ''}` : formData.shopId}
                      disabled
                      style={{ backgroundColor: '#e5e7eb', cursor: 'not-allowed' }}
                    />
                  )}
                </div>

                <div className="grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
                  <div className="form-group" style={{ position: 'relative' }}>
                    <label>Customer {editMode && '*'}</label>
                    {editMode ? (
                      <>
                        <input
                          type="text"
                          value={customerSearch}
                          onChange={handleCustomerSearch}
                          onFocus={() => setShowCustomerDropdown(true)}
                          placeholder="Search by name..."
                        />
                        {showCustomerDropdown && customers.length > 0 && (
                          <div style={{
                            position: 'absolute',
                            top: '100%',
                            left: 0,
                            right: 0,
                            maxHeight: '200px',
                            overflowY: 'auto',
                            backgroundColor: 'white',
                            border: '1px solid #e5e7eb',
                            borderRadius: '8px',
                            boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                            zIndex: 1000,
                            marginTop: '0.25rem'
                          }}>
                            {customers.map(customer => (
                              <div
                                key={customer.id}
                                onClick={() => handleSelectCustomer(customer)}
                                style={{
                                  padding: '0.75rem',
                                  cursor: 'pointer',
                                  borderBottom: '1px solid #f3f4f6'
                                }}
                                onMouseEnter={(e) => e.target.style.backgroundColor = '#f9fafb'}
                                onMouseLeave={(e) => e.target.style.backgroundColor = 'white'}
                              >
                                <div><strong>{customer.firstName} {customer.lastName}</strong></div>
                                <div style={{ fontSize: '0.85rem', color: '#6b7280' }}>
                                  ID: {customer.id} | {Array.isArray(customer.email) && customer.email.length > 0 ? customer.email[0] : customer.email || 'No email'}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </>
                    ) : (
                      <input
                        type="text"
                        value={formData.customerId ? `Customer ID: ${formData.customerId}` : 'N/A'}
                        disabled
                        style={{ backgroundColor: '#e5e7eb', cursor: 'not-allowed' }}
                      />
                    )}
                  </div>
                  <div className="form-group" style={{ position: 'relative' }}>
                    <label>Vehicle {editMode && '*'}</label>
                    {editMode ? (
                      <>
                        <input
                          type="text"
                          value={vehicleSearch}
                          onChange={handleVehicleSearch}
                          onFocus={handleVehicleFocus}
                          placeholder={formData.customerId ? "Select customer's vehicle or search..." : "Search by year, make, model..."}
                        />
                        {showVehicleDropdown && formData.customerId && vehicles.length === 0 && !vehicleSearch && (
                          <div style={{
                            position: 'absolute',
                            top: '100%',
                            left: 0,
                            right: 0,
                            backgroundColor: '#fef3c7',
                            border: '1px solid #fbbf24',
                            borderRadius: '8px',
                            padding: '1rem',
                            zIndex: 1000,
                            marginTop: '0.25rem',
                            textAlign: 'center',
                            color: '#92400e'
                          }}>
                            <strong>No vehicles found for this customer.</strong>
                            <div style={{ fontSize: '0.85rem', marginTop: '0.5rem' }}>
                              Type to search for other vehicles or add a vehicle for this customer first.
                            </div>
                          </div>
                        )}
                        {showVehicleDropdown && vehicles.length > 0 && (
                          <div style={{
                            position: 'absolute',
                            top: '100%',
                            left: 0,
                            right: 0,
                            maxHeight: '200px',
                            overflowY: 'auto',
                            backgroundColor: 'white',
                            border: '1px solid #e5e7eb',
                            borderRadius: '8px',
                            boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                            zIndex: 1000,
                            marginTop: '0.25rem'
                          }}>
                            {vehicles.map((vehicle, index) => {
                              const isCustomerVehicle = formData.customerId && vehicle.customerId === parseInt(formData.customerId);
                              const prevVehicle = index > 0 ? vehicles[index - 1] : null;
                              const showSeparator = prevVehicle && 
                                formData.customerId && 
                                prevVehicle.customerId === parseInt(formData.customerId) && 
                                vehicle.customerId !== parseInt(formData.customerId);
                              
                              return (
                                <React.Fragment key={vehicle.id}>
                                  {showSeparator && (
                                    <div style={{
                                      padding: '0.5rem 0.75rem',
                                      backgroundColor: '#f3f4f6',
                                      fontSize: '0.75rem',
                                      fontWeight: '600',
                                      color: '#6b7280',
                                      textTransform: 'uppercase',
                                      letterSpacing: '0.05em'
                                    }}>
                                      Other Vehicles
                                    </div>
                                  )}
                                  <div
                                    onClick={() => handleSelectVehicle(vehicle)}
                                    style={{
                                      padding: '0.75rem',
                                      cursor: 'pointer',
                                      borderBottom: '1px solid #f3f4f6',
                                      backgroundColor: isCustomerVehicle ? '#f0f9ff' : 'white'
                                    }}
                                    onMouseEnter={(e) => e.target.style.backgroundColor = isCustomerVehicle ? '#e0f2fe' : '#f9fafb'}
                                    onMouseLeave={(e) => e.target.style.backgroundColor = isCustomerVehicle ? '#f0f9ff' : 'white'}
                                  >
                                    <div>
                                      <strong>{vehicle.year} {vehicle.make} {vehicle.model}</strong>
                                      {isCustomerVehicle && (
                                        <span style={{ 
                                          marginLeft: '0.5rem', 
                                          fontSize: '0.75rem', 
                                          color: '#0284c7',
                                          fontWeight: '600'
                                        }}>
                                          ✓ Customer's Vehicle
                                        </span>
                                      )}
                                    </div>
                                    <div style={{ fontSize: '0.85rem', color: '#6b7280' }}>
                                      ID: {vehicle.id} | {vehicle.vin || 'No VIN'} | Customer: {vehicle.customerId}
                                    </div>
                                  </div>
                                </React.Fragment>
                              );
                            })}
                          </div>
                        )}
                      </>
                    ) : (
                      <input
                        type="text"
                        value={formData.vehicleId ? `Vehicle ID: ${formData.vehicleId}` : 'N/A'}
                        disabled
                        style={{ backgroundColor: '#e5e7eb', cursor: 'not-allowed' }}
                      />
                    )}
                  </div>
                </div>

                <div className="form-group">
                  <label>Title {editMode && '*'}</label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    disabled={!editMode}
                    style={!editMode ? { backgroundColor: '#e5e7eb', cursor: 'not-allowed' } : {}}
                  />
                </div>

                <div className="form-group">
                  <label>Description {editMode && '*'}</label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    disabled={!editMode}
                    rows="3"
                    style={!editMode ? { backgroundColor: '#e5e7eb', cursor: 'not-allowed' } : {}}
                  />
                </div>
              </div>

              {/* Timing */}
              <div style={{ marginBottom: '2rem', padding: '1.5rem', backgroundColor: '#f9fafb', borderRadius: '8px' }}>
                <h3 style={{ marginBottom: '1rem', color: '#374151', fontSize: '1.1rem' }}>Timing</h3>
                
                <div className="grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
                  <div className="form-group">
                    <label>Start Time {editMode && '*'}</label>
                    <input
                      type="datetime-local"
                      name="startTime"
                      value={formData.startTime}
                      onChange={handleChange}
                      disabled={!editMode}
                      style={!editMode ? { backgroundColor: '#e5e7eb', cursor: 'not-allowed' } : {}}
                    />
                  </div>
                  <div className="form-group">
                    <label>End Time {editMode && '*'}</label>
                    <input
                      type="datetime-local"
                      name="endTime"
                      value={formData.endTime}
                      onChange={handleChange}
                      disabled={!editMode}
                      style={!editMode ? { backgroundColor: '#e5e7eb', cursor: 'not-allowed' } : {}}
                    />
                  </div>
                </div>

                <div className="grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
                  <div className="form-group">
                    <label>Drop-off Time {editMode && '*'}</label>
                    <input
                      type="datetime-local"
                      name="dropoffTime"
                      value={formData.dropoffTime}
                      onChange={handleChange}
                      disabled={!editMode}
                      style={!editMode ? { backgroundColor: '#e5e7eb', cursor: 'not-allowed' } : {}}
                    />
                  </div>
                  <div className="form-group">
                    <label>Pick-up Time {editMode && '*'}</label>
                    <input
                      type="datetime-local"
                      name="pickupTime"
                      value={formData.pickupTime}
                      onChange={handleChange}
                      disabled={!editMode}
                      style={!editMode ? { backgroundColor: '#e5e7eb', cursor: 'not-allowed' } : {}}
                    />
                  </div>
                </div>
              </div>

              {/* Additional Details */}
              <div style={{ marginBottom: '2rem', padding: '1.5rem', backgroundColor: '#f9fafb', borderRadius: '8px' }}>
                <h3 style={{ marginBottom: '1rem', color: '#374151', fontSize: '1.1rem' }}>Additional Details</h3>
                
                <div className="grid" style={{ gridTemplateColumns: '1fr 1fr 1fr' }}>
                  <div className="form-group">
                    <label>Color {editMode && '*'}</label>
                    <select
                      name="color"
                      value={formData.color}
                      onChange={handleChange}
                      disabled={!editMode}
                      style={!editMode ? { backgroundColor: '#e5e7eb', cursor: 'not-allowed' } : {}}
                    >
                      <option value="red">Red</option>
                      <option value="pink">Pink</option>
                      <option value="yellow">Yellow</option>
                      <option value="orange">Orange</option>
                      <option value="light green">Light Green</option>
                      <option value="green">Green</option>
                      <option value="blue">Blue</option>
                      <option value="navy">Navy</option>
                      <option value="lavender">Lavender</option>
                      <option value="purple">Purple</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Ride Option {editMode && '*'}</label>
                    <select
                      name="rideOption"
                      value={formData.rideOption}
                      onChange={handleChange}
                      disabled={!editMode}
                      style={!editMode ? { backgroundColor: '#e5e7eb', cursor: 'not-allowed' } : {}}
                    >
                      <option value="NONE">None</option>
                      <option value="RIDE">Ride Required</option>
                      <option value="LOANER">Loaner Required</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Lead Source {editMode && '*'}</label>
                    <input
                      type="text"
                      name="leadSource"
                      value={formData.leadSource}
                      onChange={handleChange}
                      disabled={!editMode}
                      placeholder="e.g., Drive-By, Yelp"
                      style={!editMode ? { backgroundColor: '#e5e7eb', cursor: 'not-allowed' } : {}}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Arrived</label>
                  <input
                    type="text"
                    value={selectedAppointment.arrived ? 'Yes' : 'No'}
                    disabled
                    style={{ backgroundColor: '#e5e7eb', cursor: 'not-allowed', color: selectedAppointment.arrived ? '#10b981' : '#6b7280' }}
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
                      value={selectedAppointment.createdDate ? new Date(selectedAppointment.createdDate).toLocaleString() : 'N/A'}
                      disabled
                      style={{ backgroundColor: '#e5e7eb', cursor: 'not-allowed' }}
                    />
                  </div>
                  <div className="form-group">
                    <label>Updated Date</label>
                    <input
                      type="text"
                      value={selectedAppointment.updatedDate ? new Date(selectedAppointment.updatedDate).toLocaleString() : 'N/A'}
                      disabled
                      style={{ backgroundColor: '#e5e7eb', cursor: 'not-allowed' }}
                    />
                  </div>
                  <div className="form-group">
                    <label>Deleted Date</label>
                    <input
                      type="text"
                      value={selectedAppointment.deletedDate ? new Date(selectedAppointment.deletedDate).toLocaleString() : 'N/A'}
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
                      setFormData({
                        shopId: selectedAppointment.shopId || '',
                        customerId: selectedAppointment.customerId || '',
                        vehicleId: selectedAppointment.vehicleId || '',
                        startTime: selectedAppointment.startTime ? selectedAppointment.startTime.substring(0, 16) : '',
                        endTime: selectedAppointment.endTime ? selectedAppointment.endTime.substring(0, 16) : '',
                        title: selectedAppointment.title || '',
                        description: selectedAppointment.description || '',
                        color: selectedAppointment.color || 'navy',
                        dropoffTime: selectedAppointment.dropoffTime ? selectedAppointment.dropoffTime.substring(0, 16) : '',
                        pickupTime: selectedAppointment.pickupTime ? selectedAppointment.pickupTime.substring(0, 16) : '',
                        rideOption: selectedAppointment.rideOption?.code || 'NONE',
                        status: selectedAppointment.appointmentStatus || 'NONE',
                        leadSource: selectedAppointment.leadSource || '',
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

export default Appointments;
