import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface TransactionFormData {
  account_id: string;
  transaction_type: 'Deposit' | 'Withdrawal';
  amount: string;
  description: string;
}

interface Transaction {
  transaction_id: string;
  transaction_type: string;
  amount: number;
  time: string;
  description: string;
  account_id: string;
  employee_id: string;
}

interface Account {
  account_id: string;
  balance: number;
  account_status: string;
  customer_name?: string;
}

interface FormErrors {
  [key: string]: string;
}

const TransactionProcessing: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'process' | 'history'>('process');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [successMessage, setSuccessMessage] = useState('');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [formData, setFormData] = useState<TransactionFormData>({
    account_id: '',
    transaction_type: 'Deposit',
    amount: '',
    description: ''
  });

  // Fetch recent transactions and accounts on component mount
  useEffect(() => {
    fetchRecentTransactions();
    fetchAccounts();
  }, []);

  const fetchRecentTransactions = async () => {
    setIsLoadingHistory(true);
    try {
      const token = localStorage.getItem('token');
      // This would need a new endpoint - we'll create it in backend
      const response = await axios.get('/api/agent/transactions/recent', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setTransactions(response.data.transactions);
    } catch (error: any) {
      console.error('Failed to fetch transactions:', error);
      alert('Failed to load transaction history');
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const fetchAccounts = async () => {
    try {
      const token = localStorage.getItem('token');
      // We'll create this endpoint to get accounts with balances
      const response = await axios.get('/api/agent/accounts', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setAccounts(response.data.accounts);
    } catch (error: any) {
      console.error('Failed to fetch accounts:', error);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    
    if (!formData.account_id.trim()) {
      newErrors.account_id = 'Account ID is required';
    }
    
    if (!formData.amount.trim()) {
      newErrors.amount = 'Amount is required';
    } else {
      const amount = parseFloat(formData.amount);
      if (isNaN(amount) || amount <= 0) {
        newErrors.amount = 'Amount must be a positive number';
      }
      if (formData.transaction_type === 'Withdrawal') {
        const selectedAccount = accounts.find(acc => acc.account_id === formData.account_id);
        if (selectedAccount && amount > selectedAccount.balance) {
          newErrors.amount = 'Insufficient balance for withdrawal';
        }
      }
    }
    
    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleProcessTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post('/api/agent/transactions/process', {
        ...formData,
        amount: parseFloat(formData.amount)
      }, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      setSuccessMessage(`Transaction processed successfully! Transaction ID: ${response.data.transaction_id}`);
      setFormData({
        account_id: '',
        transaction_type: 'Deposit',
        amount: '',
        description: ''
      });
      setErrors({});
      
      // Refresh data
      fetchRecentTransactions();
      fetchAccounts();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to process transaction');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
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

  const getTransactionTypeClass = (type: string): string => {
    switch (type) {
      case 'Deposit': return 'transaction-type deposit';
      case 'Withdrawal': return 'transaction-type withdrawal';
      case 'Interest': return 'transaction-type interest';
      default: return 'transaction-type';
    }
  };

  const getSelectedAccount = () => {
    return accounts.find(acc => acc.account_id === formData.account_id);
  };

  return (
    <div className="transaction-processing">
      <div className="section-header">
        <div>
          <h4>Transaction Processing</h4>
          <p className="section-subtitle">Process deposits, withdrawals, and view transaction history</p>
        </div>
      </div>

      {successMessage && (
        <div className="success-message">
          <span className="success-icon">✓</span>
          {successMessage}
          <button 
            className="close-btn"
            onClick={() => setSuccessMessage('')}
          >
            ×
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="tabs">
        <button 
          className={`tab ${activeTab === 'process' ? 'active' : ''}`}
          onClick={() => setActiveTab('process')}
        >
          💰 Process Transaction
        </button>
        <button 
          className={`tab ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => setActiveTab('history')}
        >
          📋 Transaction History
        </button>
      </div>

      {/* Process Transaction Tab */}
      {activeTab === 'process' && (
        <div className="tab-content">
          <div className="transaction-form-container">
            <form className="transaction-form" onSubmit={handleProcessTransaction}>
              <div className="form-row">
                <div className="form-group">
                  <label>Account ID *</label>
                  <select 
                    name="account_id" 
                    value={formData.account_id} 
                    onChange={handleInputChange}
                    required
                    className={errors.account_id ? 'error' : ''}
                  >
                    <option value="">Select Account</option>
                    {accounts.map(account => (
                      <option key={account.account_id} value={account.account_id}>
                        {account.account_id} - {formatCurrency(account.balance)} - {account.account_status}
                      </option>
                    ))}
                  </select>
                  {errors.account_id && <span className="error-text">{errors.account_id}</span>}
                </div>

                <div className="form-group">
                  <label>Transaction Type *</label>
                  <select 
                    name="transaction_type" 
                    value={formData.transaction_type} 
                    onChange={handleInputChange}
                    required
                  >
                    <option value="Deposit">Deposit</option>
                    <option value="Withdrawal">Withdrawal</option>
                  </select>
                </div>
              </div>

              {/* Account Balance Display */}
              {formData.account_id && (
                <div className="account-info">
                  <div className="balance-display">
                    <span className="balance-label">Current Balance:</span>
                    <span className="balance-amount">
                      {formatCurrency(getSelectedAccount()?.balance || 0)}
                    </span>
                    <span className={`account-status ${getSelectedAccount()?.account_status.toLowerCase()}`}>
                      {getSelectedAccount()?.account_status}
                    </span>
                  </div>
                </div>
              )}

              <div className="form-group">
                <label>Amount (LKR) *</label>
                <input
                  type="number"
                  name="amount"
                  value={formData.amount}
                  onChange={handleInputChange}
                  required
                  placeholder="Enter amount"
                  step="0.01"
                  min="0"
                  className={errors.amount ? 'error' : ''}
                />
                {errors.amount && <span className="error-text">{errors.amount}</span>}
              </div>

              <div className="form-group">
                <label>Description *</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  required
                  placeholder="Enter transaction description"
                  rows={3}
                  className={errors.description ? 'error' : ''}
                />
                {errors.description && <span className="error-text">{errors.description}</span>}
              </div>

              {/* Transaction Summary */}
              {formData.amount && formData.account_id && (
                <div className="transaction-summary">
                  <h5>Transaction Summary</h5>
                  <div className="summary-details">
                    <div className="summary-row">
                      <span>Account:</span>
                      <span>{formData.account_id}</span>
                    </div>
                    <div className="summary-row">
                      <span>Type:</span>
                      <span className={getTransactionTypeClass(formData.transaction_type)}>
                        {formData.transaction_type}
                      </span>
                    </div>
                    <div className="summary-row">
                      <span>Amount:</span>
                      <span className="amount">{formatCurrency(parseFloat(formData.amount) || 0)}</span>
                    </div>
                    <div className="summary-row">
                      <span>New Balance:</span>
                      <span className="new-balance">
                        {formatCurrency(
                          (getSelectedAccount()?.balance || 0) + 
                          (formData.transaction_type === 'Deposit' 
                            ? parseFloat(formData.amount) 
                            : -parseFloat(formData.amount)
                          )
                        )}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              <div className="form-actions">
                <button 
                  type="submit" 
                  className="btn btn-primary"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <span className="loading-spinner"></span>
                      Processing...
                    </>
                  ) : (
                    `Process ${formData.transaction_type}`
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Transaction History Tab */}
      {activeTab === 'history' && (
        <div className="tab-content">
          <div className="history-header">
            <h4>Recent Transactions</h4>
            <button 
              className="btn btn-secondary"
              onClick={fetchRecentTransactions}
              disabled={isLoadingHistory}
            >
              {isLoadingHistory ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>

          {transactions.length === 0 ? (
            <div className="no-data">
              <div className="no-data-icon">📋</div>
              <h5>No Transactions Found</h5>
              <p>No transactions have been processed yet.</p>
            </div>
          ) : (
            <div className="table-container">
              <div className="table-wrapper">
                <table className="transactions-table">
                  <thead>
                    <tr>
                      <th>Transaction ID</th>
                      <th>Type</th>
                      <th>Amount</th>
                      <th>Account</th>
                      <th>Description</th>
                      <th>Date & Time</th>
                      <th>Processed By</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((transaction) => (
                      <tr key={transaction.transaction_id}>
                        <td>
                          <span className="transaction-id">{transaction.transaction_id}</span>
                        </td>
                        <td>
                          <span className={getTransactionTypeClass(transaction.transaction_type)}>
                            {transaction.transaction_type}
                          </span>
                        </td>
                        <td>
                          <span className={`amount ${transaction.transaction_type.toLowerCase()}`}>
                            {formatCurrency(transaction.amount)}
                          </span>
                        </td>
                        <td>
                          <span className="account-id">{transaction.account_id}</span>
                        </td>
                        <td>
                          <span className="description" title={transaction.description}>
                            {transaction.description}
                          </span>
                        </td>
                        <td>
                          <span className="datetime">{formatDateTime(transaction.time)}</span>
                        </td>
                        <td>
                          <span className="employee-id">{transaction.employee_id}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TransactionProcessing;