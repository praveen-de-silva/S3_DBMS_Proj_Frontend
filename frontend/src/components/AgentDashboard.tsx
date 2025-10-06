import React, { useState } from 'react';
import CustomerRegistration from './CustomerRegistration';
import AccountCreation from './AccountCreation';
import FixedDepositCreation from './FixedDepositCreation';
import AccountDetailsView from './AccountDetailsView';
import TransactionProcessing from './TransactionProcessing';
import AgentPerformance from './AgentPerformance';

const AgentDashboard: React.FC = () => {
  const [activeSection, setActiveSection] = useState('register');

  return (
    <div className="agent-dashboard">
      <h2>Agent Dashboard</h2>
      
      <div className="admin-nav">
        <button 
          className={activeSection === 'register' ? 'active' : ''}
          onClick={() => setActiveSection('register')}
        >
          👤 Register Customer
        </button>
        <button 
          className={activeSection === 'account' ? 'active' : ''}
          onClick={() => setActiveSection('account')}
        >
          🏦 Create Savings Account
        </button>
        <button 
          className={activeSection === 'fixed-deposit' ? 'active' : ''}
          onClick={() => setActiveSection('fixed-deposit')}
        >
          💰 Create Fixed Deposit
        </button>
        <button 
          className={activeSection === 'view-accounts' ? 'active' : ''}
          onClick={() => setActiveSection('view-accounts')}
        >
          🔍 View Account Details
        </button>
        <button 
          className={activeSection === 'transactions' ? 'active' : ''}
          onClick={() => setActiveSection('transactions')}
        >
          💳 Process Transaction
        </button>
        <button 
          className={activeSection === 'performance' ? 'active' : ''}
          onClick={() => setActiveSection('performance')}
        >
          📊 My Performance
        </button>
      </div>

      <div className="admin-content">
        {activeSection === 'register' && <CustomerRegistration />}
        {activeSection === 'account' && <AccountCreation />}
        {activeSection === 'fixed-deposit' && <FixedDepositCreation />}
        {activeSection === 'view-accounts' && <AccountDetailsView />}
        {activeSection === 'transactions' && <TransactionProcessing />}
        {activeSection === 'performance' && <AgentPerformance />}
      </div>
    </div>
  );
};

export default AgentDashboard;