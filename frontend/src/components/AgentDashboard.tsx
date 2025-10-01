import React from 'react';

const AgentDashboard: React.FC = () => {
  return (
    <div className="agent-dashboard">
      <h2>Agent Dashboard</h2>
      <div className="dashboard-cards">
        <div className="card">
          <h3>New Customer</h3>
          <p>Register new customers</p>
          <button>Register Customer</button>
        </div>
        <div className="card">
          <h3>Transactions</h3>
          <p>Process deposits/withdrawals</p>
          <button>Process Transaction</button>
        </div>
        <div className="card">
          <h3>Account Management</h3>
          <p>Manage customer accounts</p>
          <button>Manage Accounts</button>
        </div>
        <div className="card">
          <h3>My Performance</h3>
          <p>View your performance metrics</p>
          <button>View Performance</button>
        </div>
      </div>
    </div>
  );
};

export default AgentDashboard;