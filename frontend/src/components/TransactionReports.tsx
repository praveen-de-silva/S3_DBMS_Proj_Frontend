import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface BranchTransaction {
  transaction_id: string;
  transaction_type: string;
  amount: number;
  time: string;
  description: string;
  account_id: string;
  employee_id: string;
  employee_name: string;
}

interface TransactionSummary {
  total_deposits: number;
  total_withdrawals: number;
  net_flow: number;
  transaction_count: number;
}

const TransactionReports: React.FC = () => {
  const [transactions, setTransactions] = useState<BranchTransaction[]>([]);
  const [summary, setSummary] = useState<TransactionSummary | null>(null);
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchTransactionData();
  }, [dateRange]);

  const fetchTransactionData = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/manager/transactions', {
        headers: {
          Authorization: `Bearer ${token}`
        },
        params: dateRange
      });
      setTransactions(response.data.transactions);
      setSummary(response.data.summary);
    } catch (error: any) {
      console.error('Failed to fetch transactions:', error);
      alert('Failed to load transaction data');
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
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="transaction-reports">
      <div className="section-header">
        <div>
          <h4>Branch Transaction History</h4>
          <p className="section-subtitle">View branch transactions and financial summary</p>
        </div>
        <div className="date-filter">
          <label>From:</label>
          <input
            type="date"
            value={dateRange.start}
            onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
          />
          <label>To:</label>
          <input
            type="date"
            value={dateRange.end}
            onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
          />
          <button 
            className="btn btn-primary"
            onClick={fetchTransactionData}
            disabled={isLoading}
          >
            {isLoading ? 'Loading...' : 'Apply'}
          </button>
        </div>
      </div>

      {summary && (
        <div className="summary-cards">
          <div className="summary-card">
            <h4>Total Transactions</h4>
            <div className="summary-value">{summary.transaction_count}</div>
            
          </div>
          <div className="summary-card">
            <h4>Total Deposits</h4>
            <div className="summary-value deposit">{formatCurrency(summary.total_deposits)}</div>
            
          </div>
          <div className="summary-card">
            <h4>Total Withdrawals</h4>
            <div className="summary-value withdrawal">{formatCurrency(summary.total_withdrawals)}</div>
            
          </div>
          <div className="summary-card">
            <h4>Net Flow</h4>
            <div className={`summary-value ${summary.net_flow >= 0 ? 'deposit' : 'withdrawal'}`}>
              {formatCurrency(summary.net_flow)}
            </div>
            
          </div>
        </div>
      )}

      <div className="transactions-list">
        <h4>Recent Branch Transactions</h4>
        {isLoading ? (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Loading transactions...</p>
          </div>
        ) : transactions.length === 0 ? (
          <div className="no-data">
            <p>No transactions found for the selected period.</p>
          </div>
        ) : (
          <div className="table-container">
            <table className="transactions-table">
              <thead>
                <tr>
                  <th>Transaction ID</th>
                  <th>Type</th>
                  <th>Amount</th>
                  <th>Account</th>
                  <th>Agent</th>
                  <th>Description</th>
                  <th>Date & Time</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map(transaction => (
                  <tr key={transaction.transaction_id}>
                    <td>{transaction.transaction_id}</td>
                    <td>
                      <span className={`transaction-type ${transaction.transaction_type.toLowerCase()}`}>
                        {transaction.transaction_type}
                      </span>
                    </td>
                    <td className={`amount ${transaction.transaction_type.toLowerCase()}`}>
                      {formatCurrency(transaction.amount)}
                    </td>
                    <td>{transaction.account_id}</td>
                    <td>
                      <span className="agent-name">{transaction.employee_name}</span>
                      <br />
                      <span className="agent-id">{transaction.employee_id}</span>
                    </td>
                    <td className="description">{transaction.description}</td>
                    <td>{formatDateTime(transaction.time)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default TransactionReports;