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
  customer_names: string;
  saving_plan_id?: string;
  plan_type?: string;
  min_balance?: number;
}

interface FormErrors {
  [key: string]: string;
}

interface SavingPlan {
  saving_plan_id: string;
  plan_type: string;
  interest: number;
  min_balance: number;
}

const TransactionProcessing: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'process' | 'history'>('process');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [successMessage, setSuccessMessage] = useState('');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [savingPlans, setSavingPlans] = useState<SavingPlan[]>([]);
  const [formData, setFormData] = useState<TransactionFormData>({
    account_id: '',
    transaction_type: 'Deposit',
    amount: '',
    description: ''
  });

  // NEW: State for searchable dropdown
  const [accountSearch, setAccountSearch] = useState('');
  const [showAccountDropdown, setShowAccountDropdown] = useState(false);

  // Fetch recent transactions, accounts, and saving plans on component mount
  useEffect(() => {
    fetchRecentTransactions();
    fetchAccounts();
    fetchSavingPlans();
  }, []);

  const fetchRecentTransactions = async () => {
    setIsLoadingHistory(true);
    try {
      const token = localStorage.getItem('token');
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
      const response = await axios.get('/api/agent/all-accounts', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setAccounts(response.data.accounts);
    } catch (error: any) {
      console.error('Failed to fetch accounts:', error);
    }
  };

  const fetchSavingPlans = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/saving-plans', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setSavingPlans(response.data.saving_plans);
    } catch (error: any) {
      console.error('Failed to fetch saving plans:', error);
    }
  };

  // NEW: Filter accounts based on search
  const filteredAccounts = accounts.filter(account =>
    account.account_id.toLowerCase().includes(accountSearch.toLowerCase()) ||
    account.customer_names.toLowerCase().includes(accountSearch.toLowerCase()) ||
    account.plan_type?.toLowerCase().includes(accountSearch.toLowerCase())
  );

  // NEW: Handle account selection
  const handleAccountSelect = (account: Account) => {
    setFormData(prev => ({
      ...prev,
      account_id: account.account_id
    }));
    setAccountSearch(`${account.account_id} - ${account.customer_names} - ${account.plan_type}`);
    setShowAccountDropdown(false);
  };

  // NEW: Handle search input change
  const handleAccountSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setAccountSearch(value);
    setShowAccountDropdown(true);
    
    // If input is cleared, also clear the selected account
    if (!value.trim()) {
      setFormData(prev => ({
        ...prev,
        account_id: ''
      }));
    }
  };

  // NEW: Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = () => {
      setShowAccountDropdown(false);
    };

    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, []);

  // FIXED: Proper amount parsing
  const parseAmount = (amountStr: string): number => {
    const amount = parseFloat(amountStr);
    return isNaN(amount) ? 0 : amount;
  };

  // FIXED: Get minimum balance for account based on saving plan
  const getAccountMinBalance = (account: Account): number => {
    if (account.min_balance) {
      return account.min_balance;
    }
    
    // Find the saving plan for this account
    const savingPlan = savingPlans.find(plan => plan.saving_plan_id === account.saving_plan_id);
    return savingPlan ? savingPlan.min_balance : 0;
  };

  // FIXED: Enhanced validation with minimum balance check
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    
    if (!formData.account_id.trim()) {
      newErrors.account_id = 'Account ID is required';
    }
    
    if (!formData.amount.trim()) {
      newErrors.amount = 'Amount is required';
    } else {
      const amount = parseAmount(formData.amount);
      if (amount <= 0) {
        newErrors.amount = 'Amount must be a positive number';
      } else if (formData.transaction_type === 'Withdrawal') {
        const selectedAccount = accounts.find(acc => acc.account_id === formData.account_id);
        if (selectedAccount) {
          const minBalance = getAccountMinBalance(selectedAccount);
          const newBalance = selectedAccount.balance - amount;
          
          // Check if withdrawal would violate minimum balance requirement
          if (newBalance < minBalance) {
            const maxWithdrawal = selectedAccount.balance - minBalance;
            newErrors.amount = `Withdrawal would violate minimum balance requirement. Maximum withdrawal: LKR ${maxWithdrawal.toLocaleString()}`;
          }
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
        amount: parseAmount(formData.amount)
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
      setAccountSearch('');
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

  // FIXED: Calculate new balance safely
  const calculateNewBalance = (): number => {
    const currentBalance = getSelectedAccount()?.balance || 0;
    const amount = parseAmount(formData.amount);
    
    if (formData.transaction_type === 'Deposit') {
      return currentBalance + amount;
    } else {
      return currentBalance - amount;
    }
  };

  // FIXED: Get maximum withdrawal amount considering minimum balance
  const getMaxWithdrawal = (): number => {
    const selectedAccount = getSelectedAccount();
    if (!selectedAccount) return 0;
    
    const minBalance = getAccountMinBalance(selectedAccount);
    return Math.max(0, selectedAccount.balance - minBalance);
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
                  <label>Search Account *</label>
                  <div className="searchable-dropdown">
                    <input
                      type="text"
                      value={accountSearch}
                      onChange={handleAccountSearchChange}
                      onFocus={() => setShowAccountDropdown(true)}
                      placeholder="Search by Account ID, Customer Name, or Plan Type..."
                      className={errors.account_id ? 'error' : ''}
                      required
                    />
                    {showAccountDropdown && filteredAccounts.length > 0 && (
                      <div className="dropdown-menu">
                        {filteredAccounts.map(account => (
                          <div
                            key={account.account_id}
                            className="dropdown-item"
                            onClick={() => handleAccountSelect(account)}
                          >
                            <div className="account-option">
                              <div className="account-id">{account.account_id}</div>
                              <div className="account-details">
                                <span className="customer-names">{account.customer_names}</span>
                                <span className="plan-type">{account.plan_type}</span>
                                <span className="balance">{formatCurrency(account.balance)}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    {showAccountDropdown && filteredAccounts.length === 0 && accountSearch && (
                      <div className="dropdown-menu">
                        <div className="dropdown-item no-results">
                          No accounts found matching "{accountSearch}"
                        </div>
                      </div>
                    )}
                  </div>
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
                  {getSelectedAccount() && (
                    <div className="account-details">
                      <div className="detail-row">
                        <span>Plan Type:</span>
                        <strong>{getSelectedAccount()?.plan_type || 'Unknown'}</strong>
                      </div>
                      <div className="detail-row">
                        <span>Minimum Balance:</span>
                        <strong>{formatCurrency(getAccountMinBalance(getSelectedAccount()!))}</strong>
                      </div>
                      {formData.transaction_type === 'Withdrawal' && (
                        <div className="detail-row warning">
                          <span>Maximum Withdrawal:</span>
                          <strong>{formatCurrency(getMaxWithdrawal())}</strong>
                        </div>
                      )}
                    </div>
                  )}
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
                  min="0.01"
                  className={errors.amount ? 'error' : ''}
                />
                {errors.amount && <span className="error-text">{errors.amount}</span>}
                {formData.transaction_type === 'Withdrawal' && formData.account_id && (
                  <small className="form-help">
                    Maximum withdrawal: {formatCurrency(getMaxWithdrawal())}
                  </small>
                )}
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
              {formData.amount && formData.account_id && parseAmount(formData.amount) > 0 && (
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
                      <span className="amount">{formatCurrency(parseAmount(formData.amount))}</span>
                    </div>
                    <div className="summary-row">
                      <span>New Balance:</span>
                      <span className="new-balance">
                        {formatCurrency(calculateNewBalance())}
                      </span>
                    </div>
                    {formData.transaction_type === 'Withdrawal' && (
                      <div className="summary-row">
                        <span>Remaining Above Minimum:</span>
                        <span className={
                          calculateNewBalance() >= getAccountMinBalance(getSelectedAccount()!) 
                            ? 'text-success' 
                            : 'text-danger'
                        }>
                          {formatCurrency(calculateNewBalance() - getAccountMinBalance(getSelectedAccount()!))}
                        </span>
                      </div>
                    )}
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