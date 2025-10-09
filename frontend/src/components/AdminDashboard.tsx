import React, { useState } from 'react';
import UserManagement from './UserManagement';
import BranchManagement from './BranchManagement';
import FDInterestManagement from './FDInterestManagement';

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
          className={activeSection === 'fd-interest' ? 'active' : ''}
          onClick={() => setActiveSection('fd-interest')}
        >
          💰 FD Interest
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
        {activeSection === 'fd-interest' && <FDInterestManagement />}
        {activeSection === 'reports' && (
          <div className="reports-section">
            <h4>Reports</h4>
            <p>View system reports and analytics.</p>
            {/* Your existing reports content */}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;