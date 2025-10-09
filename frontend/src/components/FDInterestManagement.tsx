import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface FDInterestSummary {
  monthly_interest: number;
  active_fds: {
    count: number;
    total_value: number;
  };
  recent_periods: Array<{
    period_start: string;
    period_end: string;
    processed_at: string;
  }>;
  next_scheduled_run: string;
}

const FDInterestManagement: React.FC = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [summary, setSummary] = useState<FDInterestSummary | null>(null);
  const [lastRun, setLastRun] = useState<string | null>(null);

  const loadSummary = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/admin/fd-interest/summary', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSummary(response.data);
    } catch (error) {
      console.error('Failed to load summary');
    }
  };

  const processInterestNow = async () => {
    if (!window.confirm('Process FD interest now? This will calculate and credit interest for all active FDs for the previous month.')) return;
    
    setIsProcessing(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post('/api/admin/fd-interest/process-now', {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      alert(response.data.message);
      setLastRun(new Date().toLocaleString());
      loadSummary(); // Refresh summary
    } catch (error: any) {
      if (error.response?.status === 400) {
        // This is the "already processed" error
        alert(`⚠️ ${error.response.data.message}\n\n${error.response.data.note}`);
      } else {
        alert(error.response?.data?.message || 'Processing failed');
      }
    } finally {
      setIsProcessing(false);
    }
  };

  useEffect(() => {
    loadSummary();
  }, []);

  return (
    <div className="fd-interest-management">
      <h4>Fixed Deposit Interest Management</h4>
      
      <div className="auto-system-info">
        <div className="info-card success">
          <h5>🔄 Automatic System Status</h5>
          <p><strong>Schedule:</strong> 1st of every month at 3:00 AM</p>
          <p><strong>Action:</strong> Fully automatic calculation AND crediting</p>
          <p><strong>Status:</strong> <span className="status-active">ACTIVE</span></p>
        </div>

        {summary && (
          <div className="summary-grid">
            <div className="summary-item">
              <span>Active Fixed Deposits:</span>
              <strong>{summary.active_fds.count}</strong>
            </div>
            <div className="summary-item">
              <span>Total FD Value:</span>
              <strong>LKR {summary.active_fds.total_value.toLocaleString()}</strong>
            </div>
            <div className="summary-item">
              <span>Interest This Month:</span>
              <strong>LKR {summary.monthly_interest.toLocaleString()}</strong>
            </div>
            <div className="summary-item">
              <span>Next Auto-run:</span>
              <strong>{summary.next_scheduled_run}</strong>
            </div>
          </div>
        )}

        <div className="recent-periods">
          <h6>Recently Processed Periods</h6>
          {summary && summary.recent_periods && summary.recent_periods.length > 0 ? (
            <div className="periods-list">
              {summary.recent_periods.map((period, index) => (
                <div key={index} className="period-item">
                  <span>{period.period_start} to {period.period_end}</span>
                  <small>{new Date(period.processed_at).toLocaleDateString()}</small>
                </div>
              ))}
            </div>
          ) : (
            <p>No periods processed yet.</p>
          )}
        </div>
      </div>

      <div className="manual-control-section">
        <h5>Manual Control (For Testing Only)</h5>
        <p className="warning-text">
          ⚠️ Use only for testing or emergency processing. The system runs automatically every month.
        </p>
        
        <button 
          onClick={processInterestNow}
          disabled={isProcessing}
          className="btn btn-warning"
        >
          {isProcessing ? '🔄 Processing...' : '🚀 Process Interest Now'}
        </button>
        
        {lastRun && (
          <p className="last-run">Last manual run: {lastRun}</p>
        )}
      </div>

      {/* Removed styled-jsx and using regular CSS classes instead */}
    </div>
  );
};

export default FDInterestManagement;