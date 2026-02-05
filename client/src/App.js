import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import './App.css';
import Dashboard from './components/Dashboard';
import Customers from './components/Customers';
import Vehicles from './components/Vehicles';
import RepairOrders from './components/RepairOrders';
import Jobs from './components/Jobs';
import Appointments from './components/Appointments';
import Inventory from './components/Inventory';
import Inspections from './components/Inspections';
import Employees from './components/Employees';
import Settings from './components/Settings';
import { getAuthStatus } from './services/api';

function App() {
  const [authStatus, setAuthStatus] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const response = await getAuthStatus();
      setAuthStatus(response.data);
    } catch (error) {
      console.error('Failed to check auth status:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="App">
        <div className="loading">Loading...</div>
      </div>
    );
  }

  return (
    <Router>
      <div className="App">
        <nav className="navbar">
          <div className="nav-brand">
            <h1>Tekmetric API Dashboard</h1>
          </div>
          <div className="nav-links">
            <Link to="/">Dashboard</Link>
            <Link to="/customers">Customers</Link>
            <Link to="/vehicles">Vehicles</Link>
            <Link to="/repair-orders">Repair Orders</Link>
            <Link to="/jobs">Jobs</Link>
            <Link to="/appointments">Appointments</Link>
            <Link to="/inventory">Inventory</Link>
            <Link to="/inspections">Inspections</Link>
            <Link to="/employees">Employees</Link>
            <Link to="/settings">Settings</Link>
          </div>
          <div className="nav-status">
            <span className={`status-badge ${authStatus?.configured ? 'success' : 'error'}`}>
              {authStatus?.configured ? '✓ Connected' : '✗ Not Configured'}
            </span>
            <span className="environment">{authStatus?.environment}</span>
          </div>
        </nav>

        <div className="content">
          <Routes>
            <Route path="/" element={<Dashboard authStatus={authStatus} />} />
            <Route path="/customers" element={<Customers />} />
            <Route path="/vehicles" element={<Vehicles />} />
            <Route path="/repair-orders" element={<RepairOrders />} />
            <Route path="/jobs" element={<Jobs />} />
            <Route path="/appointments" element={<Appointments />} />
            <Route path="/inventory" element={<Inventory />} />
            <Route path="/inspections" element={<Inspections />} />
            <Route path="/employees" element={<Employees />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;
