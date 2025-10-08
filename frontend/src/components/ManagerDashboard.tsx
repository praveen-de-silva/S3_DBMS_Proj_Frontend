import React, { useState } from 'react';
import TeamManagement from './TeamManagement';
import TransactionReports from './TransactionReports';
import CustomerAccounts from './CustomerAccounts';

const ManagerDashboard: React.FC = () => {
  const [activeSection, setActiveSection] = useState('overview');

  return (
    <div className="manager-dashboard">
      <h2>Manager Dashboard</h2>
      
      <div className="admin-nav">
        <button 
          className={activeSection === 'overview' ? 'active' : ''}
          onClick={() => setActiveSection('overview')}
        >
          📊 Overview
        </button>
        <button 
          className={activeSection === 'team' ? 'active' : ''}
          onClick={() => setActiveSection('team')}
        >
          👥 Team Management
        </button>
        <button 
          className={activeSection === 'transactions' ? 'active' : ''}
          onClick={() => setActiveSection('transactions')}
        >
          💰 Transaction Summary
        </button>
        <button 
          className={activeSection === 'customers' ? 'active' : ''}
          onClick={() => setActiveSection('customers')}
        >
          🏦 Customer Accounts
        </button>
      </div>

      <div className="admin-content">
        {activeSection === 'overview' && (
          <div className="dashboard-overview">
            <div className="dashboard-cards">
              <div className="card">
                <h3>Team Management</h3>
                <p>Manage your agents and view their performance</p>
                <button onClick={() => setActiveSection('team')}>Manage Team</button>
              </div>
              <div className="card">
                <h3>Transaction Reports</h3>
                <p>View branch transactions and agent-wise reports</p>
                <button onClick={() => setActiveSection('transactions')}>View Transactions</button>
              </div>
              <div className="card">
                <h3>Customer Accounts</h3>
                <p>Manage customer accounts in your branch</p>
                <button onClick={() => setActiveSection('customers')}>Manage Accounts</button>
              </div>
              
            </div>
          </div>
        )}
        {activeSection === 'team' && <TeamManagement />}
        {activeSection === 'transactions' && <TransactionReports />}
        {activeSection === 'customers' && <CustomerAccounts />}
      </div>
    </div>
  );
};

export default ManagerDashboard;