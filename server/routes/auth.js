const express = require('express');
const router = express.Router();
const tekmetricService = require('../services/tekmetricService');
const axios = require('axios');

/**
 * Test authentication with Tekmetric API
 */
router.get('/test', async (req, res, next) => {
  try {
    const token = await tekmetricService.getAccessToken();
    res.json({
      success: true,
      message: 'Successfully authenticated with Tekmetric API',
      tokenPreview: token.substring(0, 20) + '...',
      environment: process.env.TEKMETRIC_ENVIRONMENT
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Get current authentication status
 */
router.get('/status', (req, res) => {
  const credentials = tekmetricService.getCredentials();
  res.json({
    configured: !!(credentials.clientId && credentials.clientSecret),
    environment: credentials.environment,
    hasToken: !!tekmetricService.accessToken,
    tokenExpiry: tekmetricService.tokenExpiry ? new Date(tekmetricService.tokenExpiry).toISOString() : null
  });
});

/**
 * Debug endpoint - test various authentication methods
 */
router.get('/debug', async (req, res) => {
  const results = {
    environment: process.env.TEKMETRIC_ENVIRONMENT,
    clientIdLength: process.env.TEKMETRIC_CLIENT_ID?.length,
    clientSecretLength: process.env.TEKMETRIC_CLIENT_SECRET?.length,
    tests: []
  };

  // Test 1: Check if OAuth endpoint exists
  try {
    const response = await axios.get(`https://${process.env.TEKMETRIC_ENVIRONMENT}/oauth2/token`);
    results.tests.push({ name: 'OAuth endpoint GET', status: 'success', statusCode: response.status });
  } catch (error) {
    results.tests.push({ 
      name: 'OAuth endpoint GET', 
      status: 'failed', 
      statusCode: error.response?.status,
      error: error.message 
    });
  }

  // Test 2: Try form-urlencoded POST
  try {
    const params = new URLSearchParams();
    params.append('grant_type', 'client_credentials');
    params.append('client_id', process.env.TEKMETRIC_CLIENT_ID);
    params.append('client_secret', process.env.TEKMETRIC_CLIENT_SECRET);

    const response = await axios.post(
      `https://${process.env.TEKMETRIC_ENVIRONMENT}/oauth2/token`,
      params,
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    );
    results.tests.push({ name: 'Form-urlencoded POST', status: 'success', statusCode: response.status });
  } catch (error) {
    results.tests.push({ 
      name: 'Form-urlencoded POST', 
      status: 'failed', 
      statusCode: error.response?.status,
      error: error.response?.data || error.message 
    });
  }

  // Test 3: Try API endpoint with Basic Auth
  try {
    const basicAuth = Buffer.from(`${process.env.TEKMETRIC_CLIENT_ID}:${process.env.TEKMETRIC_CLIENT_SECRET}`).toString('base64');
    const response = await axios.get(
      `https://${process.env.TEKMETRIC_ENVIRONMENT}/api/v1/shops`,
      { headers: { 'Authorization': `Basic ${basicAuth}` } }
    );
    results.tests.push({ name: 'API with Basic Auth', status: 'success', statusCode: response.status });
  } catch (error) {
    results.tests.push({ 
      name: 'API with Basic Auth', 
      status: 'failed', 
      statusCode: error.response?.status,
      error: error.response?.data || error.message 
    });
  }

  res.json(results);
});

/**
 * Clear server-side token cache
 * Use this when switching between sandbox and live environments
 */
router.post('/clear-cache', async (req, res) => {
  try {
    tekmetricService.clearTokenCache();
    console.log('🗑️ Server cache cleared');
    res.json({ 
      success: true, 
      message: 'Server cache cleared successfully' 
    });
  } catch (error) {
    console.error('Error clearing cache:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to clear server cache' 
    });
  }
});

/**
 * Update API credentials dynamically
 * Allows switching between sandbox and live without restarting server
 */
router.post('/update-credentials', async (req, res) => {
  try {
    const { clientId, clientSecret, environment } = req.body;
    
    // Validate required fields
    if (!clientId || !clientSecret || !environment) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: clientId, clientSecret, and environment are required'
      });
    }
    
    // Validate environment format
    if (!environment.includes('tekmetric.com')) {
      return res.status(400).json({
        success: false,
        message: 'Invalid environment format. Must be a tekmetric.com domain'
      });
    }
    
    // Update credentials in the service
    tekmetricService.updateCredentials(clientId, clientSecret, environment);
    
    console.log('✅ Credentials updated successfully');
    console.log(`📡 New environment: ${environment}`);
    
    res.json({
      success: true,
      message: 'Credentials updated successfully',
      environment: environment
    });
  } catch (error) {
    console.error('Error updating credentials:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update credentials'
    });
  }
});

/**
 * Get current credentials (masked for security)
 */
router.get('/credentials', (req, res) => {
  const credentials = tekmetricService.getCredentials();
  console.log('📋 Getting current credentials:', {
    clientId: credentials.clientId ? `${credentials.clientId.substring(0, 4)}...${credentials.clientId.substring(credentials.clientId.length - 4)}` : 'Not set',
    environment: credentials.environment || 'Not set'
  });
  res.json({
    clientId: credentials.clientId ? `${credentials.clientId.substring(0, 4)}...${credentials.clientId.substring(credentials.clientId.length - 4)}` : 'Not set',
    clientSecret: credentials.clientSecret ? '••••••••••••' : 'Not set',
    environment: credentials.environment || 'Not set',
    configured: !!(credentials.clientId && credentials.clientSecret && credentials.environment)
  });
});

/**
 * Save a new credential set
 */
router.post('/credentials/save', (req, res) => {
  try {
    const { name, clientId, clientSecret, environment } = req.body;
    
    if (!name || !clientId || !clientSecret || !environment) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: name, clientId, clientSecret, and environment are required'
      });
    }
    
    const savedCredential = tekmetricService.saveCredentialSet(name, clientId, clientSecret, environment);
    
    res.json({
      success: true,
      message: 'Credential set saved successfully',
      credential: savedCredential
    });
  } catch (error) {
    console.error('Error saving credential set:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to save credential set'
    });
  }
});

/**
 * Get all saved credential sets
 */
router.get('/credentials/list', (req, res) => {
  try {
    const credentials = tekmetricService.getSavedCredentials();
    res.json({
      success: true,
      credentials: credentials
    });
  } catch (error) {
    console.error('Error getting credential sets:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get credential sets'
    });
  }
});

/**
 * Switch to a saved credential set
 */
router.post('/credentials/switch', (req, res) => {
  try {
    const { id } = req.body;
    
    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Credential ID is required'
      });
    }
    
    console.log(`🔄 Switching to credential set ID: ${id}`);
    const credential = tekmetricService.switchToCredentialSet(id);
    console.log(`✅ Successfully switched to: ${credential.name} (${credential.environment})`);
    
    res.json({
      success: true,
      message: 'Switched to credential set successfully',
      credential: credential
    });
  } catch (error) {
    console.error('❌ Error switching credential set:', error);
    res.status(404).json({
      success: false,
      message: error.message || 'Failed to switch credential set'
    });
  }
});

/**
 * Delete a saved credential set
 */
router.delete('/credentials/:id', (req, res) => {
  try {
    const { id } = req.params;
    
    tekmetricService.deleteCredentialSet(id);
    
    res.json({
      success: true,
      message: 'Credential set deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting credential set:', error);
    res.status(404).json({
      success: false,
      message: error.message || 'Failed to delete credential set'
    });
  }
});

module.exports = router;
