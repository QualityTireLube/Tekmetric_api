import React, { useState, useEffect } from 'react';
import { clearAllCache, getCurrentEnvironment } from '../utils/cache';
import { 
  getAuthStatus, 
  getCredentials, 
  saveCredentialSet, 
  getSavedCredentials, 
  switchCredentialSet, 
  deleteCredentialSet 
} from '../services/api';

function Settings() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(null);
  const [error, setError] = useState(null);
  const [authStatus, setAuthStatus] = useState(null);
  const [currentEnv, setCurrentEnv] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [savedCredentials, setSavedCredentials] = useState([]);
  const [currentCredentials, setCurrentCredentials] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    clientId: '',
    clientSecret: '',
    environment: 'sandbox.tekmetric.com'
  });

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = () => {
    loadAuthStatus();
    loadCurrentEnvironment();
    loadCurrentCredentials();
    loadSavedCredentials();
  };

  const loadAuthStatus = async () => {
    try {
      const response = await getAuthStatus();
      setAuthStatus(response.data);
    } catch (err) {
      console.error('Error loading auth status:', err);
    }
  };

  const loadCurrentEnvironment = () => {
    const env = getCurrentEnvironment();
    setCurrentEnv(env);
  };

  const loadCurrentCredentials = async () => {
    try {
      const response = await getCredentials();
      setCurrentCredentials(response.data);
    } catch (err) {
      console.error('Error loading credentials:', err);
    }
  };

  const loadSavedCredentials = async () => {
    try {
      const response = await getSavedCredentials();
      setSavedCredentials(response.data.credentials || []);
    } catch (err) {
      console.error('Error loading saved credentials:', err);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSaveCredential = async (e) => {
    e.preventDefault();
    
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await saveCredentialSet(formData);
      setSuccess(`Credential set "${formData.name}" saved successfully!`);
      setShowAddForm(false);
      
      // Reset form
      setFormData({
        name: '',
        clientId: '',
        clientSecret: '',
        environment: 'sandbox.tekmetric.com'
      });

      // Reload saved credentials
      loadSavedCredentials();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save credential set');
    } finally {
      setLoading(false);
    }
  };

  const handleSwitchCredential = async (id, name) => {
    if (!window.confirm(`Switch to "${name}" credentials?\n\nThis will update your active connection and reload the page.`)) {
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await switchCredentialSet(id);
      setSuccess(`Switched to "${name}" successfully! Reloading page...`);
      
      // Reload the page after a short delay to show the success message
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to switch credential set');
      setLoading(false);
    }
  };

  const handleDeleteCredential = async (id, name) => {
    if (!window.confirm(`Delete "${name}" credential set?\n\nThis action cannot be undone.`)) {
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await deleteCredentialSet(id);
      setSuccess(`Credential set "${name}" deleted successfully!`);
      
      // Reload saved credentials
      loadSavedCredentials();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete credential set');
    } finally {
      setLoading(false);
    }
  };

  const handleClearCache = async () => {
    if (!window.confirm('Are you sure you want to clear all cached data? This will:\n\n• Clear stored shop information\n• Clear OAuth tokens\n• Reset all local settings\n\nYou may need to refresh the page after clearing.')) {
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await clearAllCache();
      setSuccess('Cache cleared successfully! Please refresh the page to reload data with new credentials.');
      loadCurrentEnvironment();
      
      setTimeout(() => {
        loadAuthStatus();
      }, 1000);
    } catch (err) {
      setError(err.message || 'Failed to clear cache');
    } finally {
      setLoading(false);
    }
  };

  const handleRefreshPage = () => {
    window.location.reload();
  };

  return (
    <div>
      <div className="card">
        <h2>Settings & Configuration</h2>
        <p style={{ color: '#6b7280', marginBottom: '2rem' }}>
          Manage your Tekmetric API credentials and cached data
        </p>

        {/* Error/Success Messages */}
        {error && (
          <div className="alert alert-error" style={{ marginBottom: '1rem' }}>
            <strong>Error:</strong> {error}
          </div>
        )}

        {success && (
          <div className="alert alert-success" style={{ marginBottom: '1rem' }}>
            <strong>Success!</strong> {success}
            {success.includes('Refresh') && (
              <button
                onClick={handleRefreshPage}
                className="btn btn-success"
                style={{ marginLeft: '1rem', fontSize: '0.875rem', padding: '0.5rem 1rem' }}
              >
                🔄 Refresh Page
              </button>
            )}
          </div>
        )}

        {/* Current Active Credentials */}
        <div style={{ 
          marginBottom: '2rem', 
          padding: '1.5rem', 
          backgroundColor: '#f0f9ff', 
          borderRadius: '8px',
          border: '2px solid #3b82f6'
        }}>
          <h3 style={{ marginBottom: '1rem', color: '#1e40af' }}>
            🔵 Currently Active
          </h3>
          
          <div style={{ display: 'grid', gap: '0.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontWeight: '600', color: '#6b7280' }}>Client ID:</span>
              <span style={{ fontFamily: 'monospace', color: '#1e40af' }}>
                {currentCredentials?.clientId || 'Not set'}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontWeight: '600', color: '#6b7280' }}>Client Secret:</span>
              <span style={{ fontFamily: 'monospace', color: '#1e40af' }}>
                {currentCredentials?.clientSecret || 'Not set'}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontWeight: '600', color: '#6b7280' }}>Environment:</span>
              <span style={{ color: '#1e40af' }}>
                {authStatus?.environment || 'Not configured'}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontWeight: '600', color: '#6b7280' }}>Status:</span>
              <span className={`status-badge ${authStatus?.configured ? 'success' : 'error'}`}>
                {authStatus?.configured ? '✓ Connected' : '✗ Not Configured'}
              </span>
            </div>
          </div>
        </div>

        {/* Saved Credentials List */}
        <div style={{ marginBottom: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ margin: 0, color: '#374151' }}>
              💾 Saved Credentials ({savedCredentials.length})
            </h3>
            <button
              className="btn btn-primary"
              onClick={() => setShowAddForm(!showAddForm)}
              style={{ fontSize: '0.875rem', padding: '0.5rem 1rem' }}
            >
              {showAddForm ? '✕ Cancel' : '➕ Add New'}
            </button>
          </div>

          {/* Add New Credential Form */}
          {showAddForm && (
            <form onSubmit={handleSaveCredential} style={{ 
              marginBottom: '1.5rem', 
              padding: '1.5rem', 
              backgroundColor: '#f0fdf4', 
              borderRadius: '8px',
              border: '2px solid #10b981'
            }}>
              <h4 style={{ marginBottom: '1rem', color: '#047857' }}>
                ➕ Add New Credential Set
              </h4>

              <div className="form-group">
                <label>Name / Label *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  placeholder="e.g., Production, Sandbox, Client Demo"
                />
                <small style={{ display: 'block', marginTop: '0.25rem', color: '#6b7280' }}>
                  Give this credential set a memorable name
                </small>
              </div>

              <div className="form-group">
                <label>Client ID *</label>
                <input
                  type="text"
                  name="clientId"
                  value={formData.clientId}
                  onChange={handleChange}
                  required
                  placeholder="Enter your Tekmetric Client ID"
                  style={{ fontFamily: 'monospace' }}
                />
              </div>

              <div className="form-group">
                <label>Client Secret *</label>
                <input
                  type="password"
                  name="clientSecret"
                  value={formData.clientSecret}
                  onChange={handleChange}
                  required
                  placeholder="Enter your Tekmetric Client Secret"
                  style={{ fontFamily: 'monospace' }}
                />
              </div>

              <div className="form-group">
                <label>Environment *</label>
                <select
                  name="environment"
                  value={formData.environment}
                  onChange={handleChange}
                  required
                >
                  <option value="sandbox.tekmetric.com">Sandbox (sandbox.tekmetric.com)</option>
                  <option value="shop.tekmetric.com">Live (shop.tekmetric.com)</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: '1rem' }}>
                <button
                  type="submit"
                  className="btn btn-success"
                  disabled={loading}
                  style={{ minWidth: '150px' }}
                >
                  {loading ? 'Saving...' : '💾 Save Credential Set'}
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    setShowAddForm(false);
                    setFormData({
                      name: '',
                      clientId: '',
                      clientSecret: '',
                      environment: 'sandbox.tekmetric.com'
                    });
                  }}
                  disabled={loading}
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          {/* Credentials List */}
          {savedCredentials.length === 0 ? (
            <div style={{ 
              padding: '2rem', 
              textAlign: 'center', 
              backgroundColor: '#f9fafb', 
              borderRadius: '8px',
              border: '1px dashed #d1d5db'
            }}>
              <p style={{ color: '#6b7280', margin: 0 }}>
                No saved credentials yet. Click "➕ Add New" to save your first credential set.
              </p>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '1rem' }}>
              {savedCredentials.map((cred) => (
                <div
                  key={cred.id}
                  style={{
                    padding: '1.5rem',
                    backgroundColor: cred.isActive ? '#f0f9ff' : '#f9fafb',
                    borderRadius: '8px',
                    border: cred.isActive ? '2px solid #3b82f6' : '1px solid #e5e7eb',
                    position: 'relative'
                  }}
                >
                  {cred.isActive && (
                    <div style={{
                      position: 'absolute',
                      top: '0.5rem',
                      right: '0.5rem',
                      padding: '0.25rem 0.75rem',
                      backgroundColor: '#3b82f6',
                      color: 'white',
                      borderRadius: '12px',
                      fontSize: '0.75rem',
                      fontWeight: '600'
                    }}>
                      ✓ ACTIVE
                    </div>
                  )}

                  <div style={{ marginBottom: '1rem' }}>
                    <h4 style={{ margin: 0, color: '#374151', fontSize: '1.1rem' }}>
                      {cred.name}
                    </h4>
                    <small style={{ color: '#6b7280' }}>
                      Created: {new Date(cred.createdAt).toLocaleString()}
                    </small>
                  </div>

                  <div style={{ display: 'grid', gap: '0.5rem', marginBottom: '1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>Client ID:</span>
                      <span style={{ fontSize: '0.875rem', fontFamily: 'monospace', color: '#374151' }}>
                        {cred.clientId}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>Client Secret:</span>
                      <span style={{ fontSize: '0.875rem', fontFamily: 'monospace', color: '#374151' }}>
                        {cred.clientSecret}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>Environment:</span>
                      <span style={{ fontSize: '0.875rem', color: '#374151' }}>
                        {cred.environment}
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    {!cred.isActive && (
                      <button
                        className="btn btn-primary"
                        onClick={() => handleSwitchCredential(cred.id, cred.name)}
                        disabled={loading}
                        style={{ fontSize: '0.875rem', padding: '0.5rem 1rem', flex: 1 }}
                      >
                        🔄 Switch to This
                      </button>
                    )}
                    <button
                      className="btn"
                      onClick={() => handleDeleteCredential(cred.id, cred.name)}
                      disabled={loading || cred.isActive}
                      style={{ 
                        fontSize: '0.875rem', 
                        padding: '0.5rem 1rem', 
                        backgroundColor: cred.isActive ? '#e5e7eb' : '#dc2626', 
                        color: cred.isActive ? '#9ca3af' : 'white',
                        cursor: cred.isActive ? 'not-allowed' : 'pointer'
                      }}
                      title={cred.isActive ? 'Cannot delete active credential' : 'Delete this credential set'}
                    >
                      🗑️ Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Cache Management */}
        <div style={{ 
          marginBottom: '2rem', 
          padding: '1.5rem', 
          backgroundColor: '#fef3c7', 
          borderRadius: '8px',
          border: '1px solid #fbbf24'
        }}>
          <h3 style={{ marginBottom: '1rem', color: '#92400e' }}>
            🗑️ Cache Management
          </h3>
          <p style={{ color: '#92400e', marginBottom: '1rem', fontSize: '0.875rem' }}>
            Clear all cached data including shop information and OAuth tokens. 
            This is useful when switching between environments.
          </p>
          
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button
              className="btn"
              onClick={handleClearCache}
              disabled={loading}
              style={{ 
                backgroundColor: '#dc2626',
                color: 'white',
                minWidth: '200px'
              }}
            >
              {loading ? 'Clearing...' : '🗑️ Clear All Cache'}
            </button>

            <button
              className="btn btn-secondary"
              onClick={loadAuthStatus}
              disabled={loading}
              style={{ minWidth: '200px' }}
            >
              🔍 Check Connection
            </button>
          </div>
        </div>

        {/* Instructions */}
        <div style={{ 
          padding: '1.5rem', 
          backgroundColor: '#eff6ff', 
          borderRadius: '8px',
          border: '1px solid #bfdbfe'
        }}>
          <h3 style={{ marginBottom: '1rem', color: '#1e40af' }}>
            📖 How to Use
          </h3>
          
          <ol style={{ 
            marginLeft: '1.5rem', 
            color: '#1e40af',
            lineHeight: '1.8'
          }}>
            <li>Click "➕ Add New" to save a new credential set</li>
            <li>Give it a memorable name (e.g., "Production", "Sandbox", "Client Demo")</li>
            <li>Enter the Client ID, Client Secret, and Environment</li>
            <li>Click "💾 Save Credential Set"</li>
            <li>To switch: Click "🔄 Switch to This" on any saved credential</li>
            <li>Refresh the page to use the new credentials</li>
          </ol>

          <div style={{ 
            marginTop: '1rem', 
            padding: '0.75rem', 
            backgroundColor: '#dbeafe', 
            borderRadius: '6px',
            fontSize: '0.875rem',
            color: '#1e40af'
          }}>
            <strong>💡 Pro Tip:</strong> Save all your credential sets (Sandbox, Live, Test, etc.) 
            and switch between them instantly without editing files or restarting the server!
          </div>
        </div>
      </div>
    </div>
  );
}

export default Settings;
