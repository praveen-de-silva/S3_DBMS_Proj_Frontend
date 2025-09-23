import React from 'react';

const ManagerDashboard: React.FC = () => {
  return (
    <div className="manager-dashboard">
      <h2>Manager Dashboard</h2>
      <div className="dashboard-cards">
        <div className="card">
          <h3>Team Management</h3>
          <p>Manage your agents</p>
          <button>Manage Team</button>
        </div>
        <div className="card">
          <h3>Transaction Reports</h3>
          <p>View transaction history</p>
          <button>View Transactions</button>
        </div>
        <div className="card">
          <h3>Customer Accounts</h3>
          <p>Manage customer accounts</p>
          <button>Manage Accounts</button>
        </div>
        <div className="card">
          <h3>Performance Metrics</h3>
          <p>View branch performance</p>
          <button>View Metrics</button>
        </div>
      </div>
    </div>
  );
};

export default ManagerDashboard;