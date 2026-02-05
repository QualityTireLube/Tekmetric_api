#!/usr/bin/env node

/**
 * Clear Cache Script
 * 
 * This script clears the server-side token cache.
 * Run this when switching between sandbox and live environments.
 * 
 * Usage:
 *   node scripts/clear-cache.js
 *   npm run clear-cache
 */

const axios = require('axios');

const API_URL = process.env.API_URL || 'http://localhost:3001/api';

async function clearCache() {
  console.log('🗑️  Clearing server cache...\n');
  
  try {
    const response = await axios.post(`${API_URL}/auth/clear-cache`);
    
    if (response.data.success) {
      console.log('✅ Server cache cleared successfully!');
      console.log('\n📝 Next steps:');
      console.log('   1. Open your browser');
      console.log('   2. Go to Settings page (http://localhost:3000/settings)');
      console.log('   3. Click "Clear All Cache" button');
      console.log('   4. Refresh the page\n');
    } else {
      console.error('❌ Failed to clear cache:', response.data.message);
      process.exit(1);
    }
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      console.error('❌ Error: Cannot connect to server');
      console.error('   Make sure the backend server is running on port 3001');
      console.error('   Run: npm run dev\n');
    } else {
      console.error('❌ Error clearing cache:', error.message);
    }
    process.exit(1);
  }
}

// Run the script
clearCache();
