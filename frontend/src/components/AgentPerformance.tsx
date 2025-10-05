import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface PerformanceData {
  today_transactions: number;
  total_customers: number;
  monthly_accounts: number;
  transaction_volume: number;
  recent_activity: Array<{
    type: string;
    description: string;
    time: string;
  }>;
}

const AgentPerformance: React.FC = () => {
  const [performanceData, setPerformanceData] = useState<PerformanceData>({
    today_transactions: 0,
    total_customers: 0,
    monthly_accounts: 0,
    transaction_volume: 0,
    recent_activity: []
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchPerformanceData();
  }, []);

  const fetchPerformanceData = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/agent/performance', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setPerformanceData(response.data);
    } catch (error: any) {
      console.error('Failed to fetch performance data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-LK', {
      style: 'currency',
      currency: 'LKR'
    }).format(amount);
  };

  const formatDateTime = (dateString: string): string => {
    return new Date(dateString).toLocaleString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      month: 'short',
      day: 'numeric'
    });
  };

  if (isLoading) {
    return (
      <div className="performance-loading">
        <div className="loading-spinner"></div>
        <p>Loading performance data...</p>
      </div>
    );
  }

  return (
    <div className="agent-performance">
      <div className="section-header">
        <div>
          <h4>My Performance</h4>
          <p className="section-subtitle">Track your performance metrics and recent activity</p>
        </div>
        <button 
          className="btn btn-secondary"
          onClick={fetchPerformanceData}
        >
          Refresh
        </button>
      </div>

      <div className="performance-grid">
        <div className="performance-card">
          <div className="performance-icon">💳</div>
          <h4>Today's Transactions</h4>
          <div className="performance-value">{performanceData.today_transactions}</div>
          <p>Total transactions processed today</p>
        </div>
        <div className="performance-card">
          <div className="performance-icon">👥</div>
          <h4>Total Customers</h4>
          <div className="performance-value">{performanceData.total_customers}</div>
          <p>Customers registered by you</p>
        </div>
        <div className="performance-card">
          <div className="performance-icon">🏦</div>
          <h4>Accounts Created</h4>
          <div className="performance-value">{performanceData.monthly_accounts}</div>
          <p>Accounts opened this month</p>
        </div>
        
      </div>

      <div className="recent-activity">
        <div className="activity-header">
          <h4>Recent Activity</h4>
          <span className="activity-count">{performanceData.recent_activity.length} activities</span>
        </div>
        {performanceData.recent_activity.length === 0 ? (
          <div className="no-activity">
            <p>No recent activity to display</p>
          </div>
        ) : (
          <div className="activity-grid">
            {performanceData.recent_activity.map((activity, index) => (
              <div key={index} className="activity-card">
                <div className="activity-icon">
                  {activity.type === 'transaction' ? '💸' : 
                   activity.type === 'customer' ? '👤' : '🏦'}
                </div>
                <div className="activity-content">
                  <p className="activity-description">{activity.description}</p>
                  <span className="activity-time">{formatDateTime(activity.time)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AgentPerformance;