import React, { useState } from 'react';
import UserManagement from './UserManagement';

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
          User Management
        </button>
        <button 
          className={activeSection === 'settings' ? 'active' : ''}
          onClick={() => setActiveSection('settings')}
        >
          System Settings
        </button>
        <button 
          className={activeSection === 'reports' ? 'active' : ''}
          onClick={() => setActiveSection('reports')}
        >
          Reports
        </button>
        <button 
          className={activeSection === 'branches' ? 'active' : ''}
          onClick={() => setActiveSection('branches')}
        >
          Branch Management
        </button>
      </div>

      <div className="admin-content">
        {activeSection === 'users' && <UserManagement />}
        {activeSection === 'settings' && (
          <div className="settings-section">
            <h3>System Settings</h3>
            <p>Configure system parameters and preferences.</p>
          </div>
        )}
        {activeSection === 'reports' && (
          <div className="reports-section">
            <h3>Reports</h3>
            <p>View system reports and analytics.</p>
          </div>
        )}
        {activeSection === 'branches' && (
          <div className="branches-section">
            <h3>Branch Management</h3>
            <p>Manage all branches and their configurations.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;