import React, { useState, useEffect } from 'react';
import { getInspections } from '../services/api';

function Inspections() {
  const [inspections, setInspections] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadInspections();
  }, []);

  const loadInspections = async () => {
    setLoading(true);
    setError(null);
    try {
      const shopId = localStorage.getItem('tekmetric_shop_id');
      const params = shopId ? { shop: shopId } : {};
      const response = await getInspections(params);
      setInspections(Array.isArray(response.data) ? response.data : response.data.content || []);
    } catch (err) {
      setError(err.response?.data?.error?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2>Inspections</h2>
          <button className="btn btn-secondary" onClick={loadInspections}>
            Refresh
          </button>
        </div>

        {error && (
          <div className="alert alert-error" style={{ marginTop: '1rem' }}>
            <strong>Error:</strong> {error}
            {error.includes('404') || error.includes('not found') ? (
              <div style={{ marginTop: '0.5rem', fontSize: '0.9rem' }}>
                <em>Note: The inspections endpoint may not be available in your sandbox environment or may require different permissions.</em>
              </div>
            ) : null}
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
                  <th>Vehicle</th>
                  <th>Technician</th>
                  <th>Status</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {inspections.length === 0 ? (
                  <tr>
                    <td colSpan="5" style={{ textAlign: 'center', padding: '2rem' }}>
                      No inspections found.
                    </td>
                  </tr>
                ) : (
                  inspections.map((inspection) => (
                    <tr key={inspection.id}>
                      <td>{inspection.id}</td>
                      <td>{inspection.vehicleDescription || 'N/A'}</td>
                      <td>{inspection.technicianName || 'N/A'}</td>
                      <td>{inspection.status || 'N/A'}</td>
                      <td>{inspection.createdDate ? new Date(inspection.createdDate).toLocaleDateString() : 'N/A'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default Inspections;
