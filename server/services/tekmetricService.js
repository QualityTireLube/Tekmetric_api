const axios = require('axios');
const fs = require('fs');
const path = require('path');

class TekmetricService {
  constructor() {
    this.clientId = process.env.TEKMETRIC_CLIENT_ID;
    this.clientSecret = process.env.TEKMETRIC_CLIENT_SECRET;
    this.environment = process.env.TEKMETRIC_ENVIRONMENT;
    this.baseUrl = `https://${this.environment}/api/v1`;
    this.accessToken = null;
    this.tokenExpiry = null;
    
    // Tekmetric might use API key instead of OAuth2
    // The client_id might be the API key
    this.apiKey = process.env.TEKMETRIC_API_KEY || this.clientId;
    
    // File path for storing credentials
    this.credentialsFilePath = path.join(__dirname, '..', 'data', 'credentials.json');
    
    // Saved credential sets (loaded from file)
    this.savedCredentials = [];
    this.currentCredentialId = null;
    
    // Load saved credentials from file
    this.loadCredentialsFromFile();
  }
  
  /**
   * Load credentials from file
   */
  loadCredentialsFromFile() {
    try {
      // Create data directory if it doesn't exist
      const dataDir = path.dirname(this.credentialsFilePath);
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }
      
      // Load credentials if file exists
      if (fs.existsSync(this.credentialsFilePath)) {
        const fileContent = fs.readFileSync(this.credentialsFilePath, 'utf8');
        const data = JSON.parse(fileContent);
        this.savedCredentials = data.credentials || [];
        this.currentCredentialId = data.currentCredentialId || null;
        console.log(`✅ Loaded ${this.savedCredentials.length} saved credential(s) from file`);
        
        // If there's an active credential set, apply it
        if (this.currentCredentialId) {
          const activeCredential = this.savedCredentials.find(c => c.id === this.currentCredentialId);
          if (activeCredential) {
            this.clientId = activeCredential.clientId;
            this.clientSecret = activeCredential.clientSecret;
            this.environment = activeCredential.environment;
            this.baseUrl = `https://${this.environment}/api/v1`;
            console.log(`🔄 Restored active credential: "${activeCredential.name}" (${activeCredential.environment})`);
          }
        }
      }
    } catch (error) {
      console.error('Error loading credentials from file:', error.message);
      this.savedCredentials = [];
      this.currentCredentialId = null;
    }
  }
  
  /**
   * Save credentials to file
   */
  saveCredentialsToFile() {
    try {
      const dataDir = path.dirname(this.credentialsFilePath);
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }
      
      const data = {
        credentials: this.savedCredentials,
        currentCredentialId: this.currentCredentialId,
        lastUpdated: new Date().toISOString()
      };
      
      fs.writeFileSync(this.credentialsFilePath, JSON.stringify(data, null, 2), 'utf8');
      console.log('💾 Credentials saved to file');
    } catch (error) {
      console.error('Error saving credentials to file:', error.message);
      throw new Error('Failed to save credentials to file');
    }
  }

  /**
   * Get OAuth2 access token using client credentials flow with Basic Auth
   */
  async getAccessToken() {
    // Return cached token if still valid
    if (this.accessToken && this.tokenExpiry && Date.now() < this.tokenExpiry) {
      return this.accessToken;
    }

    try {
      const params = new URLSearchParams();
      params.append('grant_type', 'client_credentials');
      
      const basicAuth = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64');

      const response = await axios.post(
        `https://${this.environment}/api/v1/oauth/token`,
        params,
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': `Basic ${basicAuth}`
          }
        }
      );

      this.accessToken = response.data.access_token;
      // Set expiry to 50 minutes (tokens typically last 1 hour)
      this.tokenExpiry = Date.now() + (50 * 60 * 1000);

      console.log('✅ Successfully obtained access token');
      return this.accessToken;
    } catch (error) {
      console.error('Error getting access token:', error.response?.data || error.message);
      throw new Error('Failed to authenticate with Tekmetric API');
    }
  }

  /**
   * Make authenticated request to Tekmetric API
   */
  async makeRequest(method, endpoint, data = null) {
    // Get fresh access token (will use cached if still valid)
    const token = await this.getAccessToken();
    
    try {
      const config = {
        method,
        url: `${this.baseUrl}${endpoint}`,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      };

      if (data) {
        config.data = data;
      }

      console.log(`Making ${method} request to ${this.baseUrl}${endpoint}`);
      if (data && method !== 'GET') {
        console.log('Request body:', JSON.stringify(data, null, 2));
      }
      
      const response = await axios(config);
      console.log('Response:', JSON.stringify(response.data, null, 2));
      return response.data;
    } catch (error) {
      console.error(`Error making ${method} request to ${endpoint}:`);
      console.error(`Status: ${error.response?.status}`);
      console.error(`Response data:`, JSON.stringify(error.response?.data, null, 2));
      
      // If we get 401, clear the token cache to force re-authentication
      if (error.response?.status === 401) {
        console.log('Token expired, clearing cache...');
        this.accessToken = null;
        this.tokenExpiry = null;
      }
      
      throw {
        status: error.response?.status || 500,
        message: error.response?.data?.message || error.message,
        details: error.response?.data
      };
    }
  }

  // ===== Shop Information =====
  async getShops() {
    return this.makeRequest('GET', '/shops');
  }

  async getShop(shopId) {
    return this.makeRequest('GET', `/shops/${shopId}`);
  }

  // ===== Customers =====
  async getCustomers(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString ? `/customers?${queryString}` : '/customers';
    return this.makeRequest('GET', endpoint);
  }

  async getCustomer(customerId) {
    return this.makeRequest('GET', `/customers/${customerId}`);
  }

  async createCustomer(customerData) {
    return this.makeRequest('POST', '/customers', customerData);
  }

  async updateCustomer(customerId, customerData) {
    return this.makeRequest('PATCH', `/customers/${customerId}`, customerData);
  }

  // ===== Vehicles =====
  async getVehicles(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString ? `/vehicles?${queryString}` : '/vehicles';
    return this.makeRequest('GET', endpoint);
  }

  async getVehicle(vehicleId) {
    return this.makeRequest('GET', `/vehicles/${vehicleId}`);
  }

  async createVehicle(vehicleData) {
    return this.makeRequest('POST', '/vehicles', vehicleData);
  }

  async updateVehicle(vehicleId, vehicleData) {
    return this.makeRequest('PATCH', `/vehicles/${vehicleId}`, vehicleData);
  }

  // ===== Repair Orders =====
  async getRepairOrders(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString ? `/repair-orders?${queryString}` : '/repair-orders';
    return this.makeRequest('GET', endpoint);
  }

  async getRepairOrder(repairOrderId) {
    return this.makeRequest('GET', `/repair-orders/${repairOrderId}`);
  }

  async createRepairOrder(repairOrderData) {
    return this.makeRequest('POST', '/repair-orders', repairOrderData);
  }

  async updateRepairOrder(repairOrderId, repairOrderData) {
    return this.makeRequest('PATCH', `/repair-orders/${repairOrderId}`, repairOrderData);
  }

  // ===== Jobs =====
  async getJobs(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString ? `/jobs?${queryString}` : '/jobs';
    return this.makeRequest('GET', endpoint);
  }

  async getJob(jobId) {
    return this.makeRequest('GET', `/jobs/${jobId}`);
  }

  async createJob(repairOrderId, jobData) {
    return this.makeRequest('POST', `/repair-orders/${repairOrderId}/jobs`, jobData);
  }

  async updateJob(jobId, jobData) {
    return this.makeRequest('PATCH', `/jobs/${jobId}`, jobData);
  }

  async getCannedJobs(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString ? `/canned-jobs?${queryString}` : '/canned-jobs';
    return this.makeRequest('GET', endpoint);
  }

  async addCannedJobsToRO(repairOrderId, cannedJobIds) {
    return this.makeRequest('POST', `/repair-orders/${repairOrderId}/canned-jobs`, cannedJobIds);
  }

  async updateJobClock(jobId, data) {
    return this.makeRequest('PUT', `/jobs/${jobId}/job-clock`, data);
  }

  async updateLabor(laborId, data) {
    return this.makeRequest('PATCH', `/labor/${laborId}`, data);
  }

  // ===== Inspections =====
  async getInspections(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString ? `/inspections?${queryString}` : '/inspections';
    return this.makeRequest('GET', endpoint);
  }

  async getInspection(inspectionId) {
    return this.makeRequest('GET', `/inspections/${inspectionId}`);
  }

  // ===== Employees =====
  async getEmployees(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString ? `/employees?${queryString}` : '/employees';
    return this.makeRequest('GET', endpoint);
  }

  async getEmployee(employeeId) {
    return this.makeRequest('GET', `/employees/${employeeId}`);
  }

  // ===== Appointments =====
  async getAppointments(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString ? `/appointments?${queryString}` : '/appointments';
    return this.makeRequest('GET', endpoint);
  }

  async getAppointment(appointmentId) {
    return this.makeRequest('GET', `/appointments/${appointmentId}`);
  }

  async createAppointment(appointmentData) {
    return this.makeRequest('POST', '/appointments', appointmentData);
  }

  async updateAppointment(appointmentId, appointmentData) {
    return this.makeRequest('PATCH', `/appointments/${appointmentId}`, appointmentData);
  }

  async deleteAppointment(appointmentId) {
    return this.makeRequest('DELETE', `/appointments/${appointmentId}`);
  }

  // ===== Inventory =====
  async getInventory(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString ? `/inventory?${queryString}` : '/inventory';
    return this.makeRequest('GET', endpoint);
  }

  async getInventoryPart(partId) {
    return this.makeRequest('GET', `/inventory/${partId}`);
  }

  // ===== Cache Management =====
  /**
   * Clear the cached access token
   * Useful when switching between sandbox and live environments
   */
  clearTokenCache() {
    this.accessToken = null;
    this.tokenExpiry = null;
    console.log('✅ Token cache cleared');
  }

  /**
   * Update API credentials dynamically
   * Allows switching between environments without restarting the server
   */
  updateCredentials(clientId, clientSecret, environment) {
    this.clientId = clientId;
    this.clientSecret = clientSecret;
    this.environment = environment;
    this.baseUrl = `https://${environment}/api/v1`;
    
    // Clear cached token since credentials changed
    this.clearTokenCache();
    
    console.log('✅ Credentials updated');
    console.log(`📡 Environment: ${environment}`);
  }

  /**
   * Get current credentials (for display purposes)
   */
  getCredentials() {
    return {
      clientId: this.clientId,
      clientSecret: this.clientSecret,
      environment: this.environment
    };
  }

  /**
   * Save a new credential set
   */
  saveCredentialSet(name, clientId, clientSecret, environment) {
    // Check if name already exists
    const existingIndex = this.savedCredentials.findIndex(c => c.name === name);
    
    const credential = {
      id: existingIndex >= 0 ? this.savedCredentials[existingIndex].id : Date.now().toString(),
      name: name,
      clientId: clientId,
      clientSecret: clientSecret,
      environment: environment,
      createdAt: existingIndex >= 0 ? this.savedCredentials[existingIndex].createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    if (existingIndex >= 0) {
      // Update existing
      this.savedCredentials[existingIndex] = credential;
    } else {
      // Add new
      this.savedCredentials.push(credential);
    }
    
    // Save to file
    this.saveCredentialsToFile();
    
    console.log(`✅ Credential set "${name}" saved to file`);
    
    // Return masked version
    return {
      id: credential.id,
      name: credential.name,
      clientId: `${credential.clientId.substring(0, 4)}...${credential.clientId.substring(credential.clientId.length - 4)}`,
      clientSecret: '••••••••••••',
      environment: credential.environment,
      createdAt: credential.createdAt,
      updatedAt: credential.updatedAt
    };
  }

  /**
   * Get all saved credential sets (masked)
   */
  getSavedCredentials() {
    return this.savedCredentials.map(cred => ({
      id: cred.id,
      name: cred.name,
      clientId: `${cred.clientId.substring(0, 4)}...${cred.clientId.substring(cred.clientId.length - 4)}`,
      clientSecret: '••••••••••••',
      environment: cred.environment,
      createdAt: cred.createdAt,
      updatedAt: cred.updatedAt,
      isActive: cred.id === this.currentCredentialId
    }));
  }

  /**
   * Switch to a saved credential set
   */
  switchToCredentialSet(id) {
    const credential = this.savedCredentials.find(c => c.id === id);
    
    if (!credential) {
      throw new Error('Credential set not found');
    }
    
    // Update current credentials
    this.updateCredentials(credential.clientId, credential.clientSecret, credential.environment);
    this.currentCredentialId = id;
    
    // Save to file to persist the active credential
    this.saveCredentialsToFile();
    
    console.log(`✅ Switched to credential set "${credential.name}"`);
    
    // Return masked version
    return {
      id: credential.id,
      name: credential.name,
      clientId: `${credential.clientId.substring(0, 4)}...${credential.clientId.substring(credential.clientId.length - 4)}`,
      clientSecret: '••••••••••••',
      environment: credential.environment,
      isActive: true
    };
  }

  /**
   * Delete a saved credential set
   */
  deleteCredentialSet(id) {
    const index = this.savedCredentials.findIndex(c => c.id === id);
    
    if (index === -1) {
      throw new Error('Credential set not found');
    }
    
    const credential = this.savedCredentials[index];
    this.savedCredentials.splice(index, 1);
    
    // If we deleted the active credential, clear the current ID
    if (this.currentCredentialId === id) {
      this.currentCredentialId = null;
    }
    
    // Save to file
    this.saveCredentialsToFile();
    
    console.log(`✅ Credential set "${credential.name}" deleted from file`);
  }
}

module.exports = new TekmetricService();
