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
  res.json({
    configured: !!(process.env.TEKMETRIC_CLIENT_ID && process.env.TEKMETRIC_CLIENT_SECRET),
    environment: process.env.TEKMETRIC_ENVIRONMENT,
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

module.exports = router;
