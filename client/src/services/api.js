import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Error handling interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const errorMessage = error.response?.data?.error?.message || error.message;
    const url = error.config?.url || '';
    
    // Suppress expected errors for endpoints not available in sandbox
    const isExpectedError = (
      (url.includes('/inspections') && error.response?.status === 404) ||
      (url.includes('/employees') && error.response?.status === 403)
    );
    
    if (!isExpectedError) {
      console.error('API Error:', errorMessage);
    }
    
    return Promise.reject(error);
  }
);

// ===== Auth =====
export const testAuth = () => api.get('/auth/test');
export const getAuthStatus = () => api.get('/auth/status');
export const updateCredentials = (credentials) => api.post('/auth/update-credentials', credentials);
export const getCredentials = () => api.get('/auth/credentials');
export const saveCredentialSet = (data) => api.post('/auth/credentials/save', data);
export const getSavedCredentials = () => api.get('/auth/credentials/list');
export const switchCredentialSet = (id) => api.post('/auth/credentials/switch', { id });
export const deleteCredentialSet = (id) => api.delete(`/auth/credentials/${id}`);

// ===== Shops =====
export const getShops = () => api.get('/tekmetric/shops');
export const getShop = (shopId) => api.get(`/tekmetric/shops/${shopId}`);

// ===== Customers =====
export const getCustomers = (params) => api.get('/tekmetric/customers', { params });
export const getCustomer = (customerId) => api.get(`/tekmetric/customers/${customerId}`);
export const createCustomer = (data) => api.post('/tekmetric/customers', data);
export const updateCustomer = (customerId, data) => api.patch(`/tekmetric/customers/${customerId}`, data);

// ===== Vehicles =====
export const getVehicles = (params) => api.get('/tekmetric/vehicles', { params });
export const getVehicle = (vehicleId) => api.get(`/tekmetric/vehicles/${vehicleId}`);
export const getCustomerVehicles = (customerId, shopId) => api.get(`/tekmetric/customers/${customerId}/vehicles`, { params: { shop: shopId } });
export const createVehicle = (data) => api.post('/tekmetric/vehicles', data);
export const updateVehicle = (vehicleId, data) => api.patch(`/tekmetric/vehicles/${vehicleId}`, data);

// ===== Repair Orders =====
export const getRepairOrders = (params) => api.get('/tekmetric/repair-orders', { params });
export const getRepairOrder = (repairOrderId) => api.get(`/tekmetric/repair-orders/${repairOrderId}`);
export const createRepairOrder = (data) => api.post('/tekmetric/repair-orders', data);
export const updateRepairOrder = (repairOrderId, data) => api.patch(`/tekmetric/repair-orders/${repairOrderId}`, data);

// ===== Jobs =====
export const getJobs = (params) => api.get('/tekmetric/jobs', { params });
export const getJob = (jobId) => api.get(`/tekmetric/jobs/${jobId}`);
export const createJob = (repairOrderId, data) => api.post(`/tekmetric/repair-orders/${repairOrderId}/jobs`, data);
export const updateJob = (jobId, data) => api.patch(`/tekmetric/jobs/${jobId}`, data);
export const getCannedJobs = (params) => api.get('/tekmetric/canned-jobs', { params });
export const addCannedJobsToRO = (repairOrderId, cannedJobIds) => api.post(`/tekmetric/repair-orders/${repairOrderId}/canned-jobs`, cannedJobIds);
export const updateJobClock = (jobId, data) => api.put(`/tekmetric/jobs/${jobId}/job-clock`, data);
export const updateLabor = (laborId, data) => api.patch(`/tekmetric/labor/${laborId}`, data);

// ===== Inspections =====
export const getInspections = (params) => api.get('/tekmetric/inspections', { params });
export const getInspection = (inspectionId) => api.get(`/tekmetric/inspections/${inspectionId}`);

// ===== Employees =====
export const getEmployees = (params) => api.get('/tekmetric/employees', { params });
export const getEmployee = (employeeId) => api.get(`/tekmetric/employees/${employeeId}`);

// ===== Appointments =====
export const getAppointments = (params) => api.get('/tekmetric/appointments', { params });
export const getAppointment = (appointmentId) => api.get(`/tekmetric/appointments/${appointmentId}`);
export const createAppointment = (data) => api.post('/tekmetric/appointments', data);
export const updateAppointment = (appointmentId, data) => api.patch(`/tekmetric/appointments/${appointmentId}`, data);
export const deleteAppointment = (appointmentId) => api.delete(`/tekmetric/appointments/${appointmentId}`);

// ===== Inventory =====
export const getInventory = (params) => api.get('/tekmetric/inventory', { params });
export const getInventoryPart = (partId) => api.get(`/tekmetric/inventory/${partId}`);

export default api;
