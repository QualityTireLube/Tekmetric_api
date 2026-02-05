/**
 * Cache management utilities for clearing stored data
 * when switching between sandbox and live environments
 */

/**
 * Clear all localStorage data related to Tekmetric
 */
export const clearLocalStorage = () => {
  const keysToRemove = [
    'tekmetric_shop_id',
    'tekmetric_environment',
    'tekmetric_last_shop',
    // Add any other keys your app might use
  ];
  
  keysToRemove.forEach(key => {
    localStorage.removeItem(key);
  });
  
  console.log('✓ Cleared localStorage');
};

/**
 * Clear all session storage data
 */
export const clearSessionStorage = () => {
  sessionStorage.clear();
  console.log('✓ Cleared sessionStorage');
};

/**
 * Clear all browser cache for this app
 */
export const clearAllClientCache = () => {
  clearLocalStorage();
  clearSessionStorage();
  console.log('✓ All client cache cleared');
};

/**
 * Request server to clear its token cache
 */
export const clearServerCache = async () => {
  try {
    const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';
    const response = await fetch(`${API_BASE_URL}/auth/clear-cache`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error('Failed to clear server cache');
    }
    
    console.log('✓ Server cache cleared');
    return true;
  } catch (error) {
    console.error('Error clearing server cache:', error);
    throw error;
  }
};

/**
 * Clear all cache (client and server)
 */
export const clearAllCache = async () => {
  try {
    // Clear client-side cache
    clearAllClientCache();
    
    // Clear server-side cache
    await clearServerCache();
    
    console.log('✅ All cache cleared successfully');
    return true;
  } catch (error) {
    console.error('Error clearing cache:', error);
    throw error;
  }
};

/**
 * Get current environment info from localStorage
 */
export const getCurrentEnvironment = () => {
  return {
    shopId: localStorage.getItem('tekmetric_shop_id'),
    environment: localStorage.getItem('tekmetric_environment'),
  };
};

/**
 * Save environment info to localStorage
 */
export const saveEnvironment = (environment) => {
  if (environment) {
    localStorage.setItem('tekmetric_environment', environment);
  }
};
