import React, { useState, useEffect } from 'react';
import { testAuth, getShops } from '../services/api';

function Dashboard({ authStatus }) {
  const [testResult, setTestResult] = useState(null);
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (authStatus?.configured) {
      loadShops();
    }
  }, [authStatus]);

  const handleTestAuth = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await testAuth();
      setTestResult(response.data);
    } catch (err) {
      setError(err.response?.data?.error?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadShops = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getShops();
      const shopsData = Array.isArray(response.data) ? response.data : [response.data];
      setShops(shopsData);
      
      // Store the first shop ID in localStorage for other components to use
      if (shopsData.length > 0) {
        localStorage.setItem('tekmetric_shop_id', shopsData[0].id);
      }
    } catch (err) {
      setError(err.response?.data?.error?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="card">
        <h2>Dashboard</h2>
        <p>Welcome to the Tekmetric API Dashboard. Use this interface to interact with your Tekmetric account.</p>
        
        <div style={{ marginTop: '2rem' }}>
          <h3>Connection Status</h3>
          <div className="grid">
            <div className="stat-card">
              <h3>Configuration</h3>
              <div className="value">{authStatus?.configured ? '✓' : '✗'}</div>
            </div>
            <div className="stat-card">
              <h3>Environment</h3>
              <div className="value" style={{ fontSize: '1.2rem' }}>{authStatus?.environment}</div>
            </div>
            <div className="stat-card">
              <h3>Token Status</h3>
              <div className="value">{authStatus?.hasToken ? '✓' : '✗'}</div>
            </div>
          </div>
        </div>

        <div style={{ marginTop: '2rem' }}>
          <button className="btn btn-primary" onClick={handleTestAuth} disabled={loading}>
            {loading ? 'Testing...' : 'Test Authentication'}
          </button>
        </div>

        {testResult && (
          <div className="alert alert-success" style={{ marginTop: '1rem' }}>
            <strong>Success!</strong> {testResult.message}
            <br />
            <small>Token: {testResult.tokenPreview}</small>
          </div>
        )}

        {error && (
          <div className="alert alert-error" style={{ marginTop: '1rem' }}>
            <strong>Error:</strong> {error}
          </div>
        )}
      </div>

      {shops.length > 0 && (
        <div className="card">
          <h3>Your Shops</h3>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Address</th>
                </tr>
              </thead>
              <tbody>
                {shops.map((shop) => (
                  <tr key={shop.id}>
                    <td>{shop.id}</td>
                    <td>{shop.name}</td>
                    <td>{shop.email || 'N/A'}</td>
                    <td>{shop.phone || 'N/A'}</td>
                    <td>{shop.address?.fullAddress || shop.address?.streetAddress || 'N/A'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;
