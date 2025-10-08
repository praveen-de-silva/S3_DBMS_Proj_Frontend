import React, { useState } from 'react';
import UserManagement from './UserManagement';
import BranchManagement from './BranchManagement';

const AdminDashboard: React.FC = () => {
  const [activeSection, setActiveSection] = useState('users');

  return (
    <div className="admin-dashboard">
      <h2>Admin Dashboard</h2>
      
      <div className="admin-nav">
        <button 
          className={activeSection === 'users' ? 'active' : ''}
          onClick={() => setActiveSection('users')}
        >
          👥 User Management
        </button>
        <button 
          className={activeSection === 'branches' ? 'active' : ''}
          onClick={() => setActiveSection('branches')}
        >
          🏦 Branch Management
        </button>
        <button 
          className={activeSection === 'reports' ? 'active' : ''}
          onClick={() => setActiveSection('reports')}
        >
          📊 Reports
        </button>
      </div>

      <div className="admin-content">
        {activeSection === 'users' && <UserManagement />}
        {activeSection === 'branches' && <BranchManagement />}
        {activeSection === 'reports' && (
          <div className="reports-section">
            <h4>Reports</h4>
            <p>View system reports and analytics. This section will display various banking reports and performance metrics.</p>
            <div className="reports-grid">
              <div className="report-card">
                <h4>Transaction Summary</h4>
                <p>Overview of all transactions</p>
                <button className="btn btn-secondary">View Report</button>
              </div>
              <div className="report-card">
                <h4>Customer Activity</h4>
                <p>Customer engagement metrics</p>
                <button className="btn btn-secondary">View Report</button>
              </div>
              <div className="report-card">
                <h4>Branch Performance</h4>
                <p>Branch-wise performance analysis</p>
                <button className="btn btn-secondary">View Report</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;