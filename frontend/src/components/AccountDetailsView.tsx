import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface Account {
  account_id: string;
  balance: number;
  account_status: string;
  open_date: string;
  branch_id: string;
  saving_plan_id: string;
  plan_type: string;
  interest: number;
  min_balance: number;
  customer_names: string;
  customer_count: number;
  fd_id: string | null;
}

interface AccountDetails {
  account_id: string;
  balance: number;
  account_status: string;
  open_date: string;
  branch_name: string;
  plan_type: string;
  interest: number;
  min_balance: number;
  customers: {
    customer_id: string;
    first_name: string;
    last_name: string;
    nic: string;
    date_of_birth: string;
  }[];
  transactions: {
    transaction_id: string;
    transaction_type: string;
    amount: number;
    time: string;
    description: string;
  }[];
}

const AccountDetailsView: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingAccounts, setIsLoadingAccounts] = useState(true);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<AccountDetails | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredAccounts, setFilteredAccounts] = useState<Account[]>([]);
  const [activeStatus, setActiveStatus] = useState<'All' | 'Active' | 'Inactive'>('All');

  // Fetch all accounts on component mount
  useEffect(() => {
    fetchAccounts();
  }, []);

  // Filter accounts based on search term and status
  useEffect(() => {
    let results = accounts;

    // Filter by search term
    if (searchTerm.trim()) {
      results = results.filter(account =>
        account.account_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        account.customer_names.toLowerCase().includes(searchTerm.toLowerCase()) ||
        account.plan_type.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by status
    if (activeStatus !== 'All') {
      results = results.filter(account => 
        account.account_status === activeStatus
      );
    }

    setFilteredAccounts(results);
  }, [searchTerm, activeStatus, accounts]);

  const fetchAccounts = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/agent/all-accounts', {
        headers: { Authorization: `Bearer ${token}` }
      });

      setAccounts(response.data.accounts);
    } catch (error: any) {
      console.error('Failed to fetch accounts:', error);
      alert('Failed to load accounts data');
    } finally {
      setIsLoadingAccounts(false);
    }
  };

  const fetchAccountDetails = async (accountId: string) => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`/api/agent/accounts/${accountId}/details`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setSelectedAccount(response.data.account);
    } catch (error: any) {
      console.error('Failed to fetch account details:', error);
      alert('Failed to load account details');
    } finally {
      setIsLoading(false);
    }
  };

  const calculateAge = (dateOfBirth: string): number => {
    const dob = new Date(dateOfBirth);
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const monthDiff = today.getMonth() - dob.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
      age--;
    }
    return age;
  };

  const getStatusBadge = (status: string) => {
    const statusColors = {
      'Active': 'success',
      'Inactive': 'danger'
    };
    
    const color = statusColors[status as keyof typeof statusColors] || 'secondary';
    return <span className={`badge badge-${color}`}>{status}</span>;
  };

  const getPlanBadge = (planType: string) => {
    const planColors = {
      'Children': 'info',
      'Teen': 'primary',
      'Adult': 'success',
      'Senior': 'warning',
      'Joint': 'secondary'
    };
    
    const color = planColors[planType as keyof typeof planColors] || 'secondary';
    return <span className={`badge badge-${color}`}>{planType}</span>;
  };

  const formatCurrency = (amount: number): string => {
    return `LKR ${amount.toLocaleString()}`;
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (isLoadingAccounts) {
    return (
      <div className="account-details-view">
        <div className="loading">
          <div className="loading-spinner"></div>
          <p>Loading accounts data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="account-details-view">
      <div className="section-header">
        <div>
          <h4>Account Details & Search</h4>
          <p className="section-subtitle">View and search all savings account details</p>
        </div>
      </div>

      <div className="accounts-container">
        {/* Search and Filter Section */}
        <div className="search-filter-section">
          <div className="search-box">
            <input
              type="text"
              placeholder="Search by Account ID, Customer Name, or Plan Type..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
            <button 
              type="button" 
              className="btn btn-secondary"
              onClick={() => setSearchTerm('')}
            >
              Clear
            </button>
          </div>

          <div className="filter-buttons">
            <button
              className={`filter-btn ${activeStatus === 'All' ? 'active' : ''}`}
              onClick={() => setActiveStatus('All')}
            >
              All Accounts
            </button>
            <button
              className={`filter-btn ${activeStatus === 'Active' ? 'active' : ''}`}
              onClick={() => setActiveStatus('Active')}
            >
              Active
            </button>
            <button
              className={`filter-btn ${activeStatus === 'Inactive' ? 'active' : ''}`}
              onClick={() => setActiveStatus('Inactive')}
            >
              Inactive
            </button>
          </div>

          <div className="results-count">
            Showing {filteredAccounts.length} of {accounts.length} accounts
          </div>
        </div>

        {/* Accounts Grid and Details Side by Side */}
        <div className="accounts-layout">
          {/* Accounts List */}
          <div className="accounts-list">
            <h5>Accounts List</h5>
            {filteredAccounts.length === 0 ? (
              <div className="no-data">
                No accounts found matching your search criteria.
              </div>
            ) : (
              <div className="accounts-grid">
                {filteredAccounts.map(account => (
                  <div 
                    key={account.account_id} 
                    className={`account-card ${selectedAccount?.account_id === account.account_id ? 'selected' : ''}`}
                    onClick={() => fetchAccountDetails(account.account_id)}
                  >
                    <div className="account-header">
                      <div className="account-id">{account.account_id}</div>
                      <div className="account-badges">
                        {getStatusBadge(account.account_status)}
                        {getPlanBadge(account.plan_type)}
                        {account.fd_id && (
                          <span className="badge badge-warning">Has FD</span>
                        )}
                      </div>
                    </div>
                    
                    <div className="account-details">
                      <div className="account-detail">
                        <span>Balance:</span>
                        <strong>{formatCurrency(account.balance)}</strong>
                      </div>
                      <div className="account-detail">
                        <span>Customers:</span>
                        <span>{account.customer_names}</span>
                      </div>
                      <div className="account-detail">
                        <span>Plan:</span>
                        <span>{account.plan_type} ({account.interest}%)</span>
                      </div>
                      <div className="account-detail">
                        <span>Open Date:</span>
                        <span>{formatDate(account.open_date)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Account Details Panel */}
          <div className="account-details-panel">
            {selectedAccount ? (
              <div className="details-container">
                {isLoading ? (
                  <div className="loading-panel">
                    <div className="loading-spinner"></div>
                    <p>Loading account details...</p>
                  </div>
                ) : (
                  <>
                    <div className="details-header">
                      <h5>Account Details - {selectedAccount.account_id}</h5>
                      <div className="account-badges">
                        {getStatusBadge(selectedAccount.account_status)}
                        {getPlanBadge(selectedAccount.plan_type)}
                      </div>
                    </div>

                    {/* Basic Account Information */}
                    <div className="details-section">
                      <h6>Account Information</h6>
                      <div className="details-grid">
                        <div className="detail-item">
                          <span>Account ID:</span>
                          <strong>{selectedAccount.account_id}</strong>
                        </div>
                        <div className="detail-item">
                          <span>Balance:</span>
                          <strong>{formatCurrency(selectedAccount.balance)}</strong>
                        </div>
                        <div className="detail-item">
                          <span>Status:</span>
                          <strong>{selectedAccount.account_status}</strong>
                        </div>
                        <div className="detail-item">
                          <span>Open Date:</span>
                          <strong>{formatDate(selectedAccount.open_date)}</strong>
                        </div>
                        <div className="detail-item">
                          <span>Branch:</span>
                          <strong>{selectedAccount.branch_name}</strong>
                        </div>
                        <div className="detail-item">
                          <span>Plan Type:</span>
                          <strong>{selectedAccount.plan_type}</strong>
                        </div>
                        <div className="detail-item">
                          <span>Interest Rate:</span>
                          <strong>{selectedAccount.interest}%</strong>
                        </div>
                        <div className="detail-item">
                          <span>Minimum Balance:</span>
                          <strong>{formatCurrency(selectedAccount.min_balance)}</strong>
                        </div>
                      </div>
                    </div>

                    {/* Customer Information */}
                    <div className="details-section">
                      <h6>Account Holders ({selectedAccount.customers.length})</h6>
                      <div className="customers-list">
                        {selectedAccount.customers.map(customer => (
                          <div key={customer.customer_id} className="customer-card">
                            <div className="customer-info">
                              <strong>{customer.first_name} {customer.last_name}</strong>
                              <div className="customer-details">
                                <span>ID: {customer.customer_id}</span>
                                <span>NIC: {customer.nic}</span>
                                <span>Age: {calculateAge(customer.date_of_birth)} years</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Recent Transactions */}
                    <div className="details-section">
                      <h6>Recent Transactions</h6>
                      {selectedAccount.transactions.length === 0 ? (
                        <div className="no-data">No transactions found</div>
                      ) : (
                        <div className="transactions-table">
                          <table>
                            <thead>
                              <tr>
                                <th>Date & Time</th>
                                <th>Type</th>
                                <th>Amount</th>
                                <th>Description</th>
                              </tr>
                            </thead>
                            <tbody>
                              {selectedAccount.transactions.map(transaction => (
                                <tr key={transaction.transaction_id}>
                                  <td>{formatDate(transaction.time)}</td>
                                  <td>
                                    <span className={`transaction-type ${transaction.transaction_type.toLowerCase()}`}>
                                      {transaction.transaction_type}
                                    </span>
                                  </td>
                                  <td className={transaction.transaction_type === 'Deposit' ? 'text-success' : 'text-danger'}>
                                    {transaction.transaction_type === 'Deposit' ? '+' : '-'}{formatCurrency(transaction.amount)}
                                  </td>
                                  <td>{transaction.description}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="no-selection">
                <div className="no-selection-icon">👆</div>
                <h5>Select an account to view details</h5>
                <p>Click on any account from the list to see detailed information, customer details, and transaction history.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccountDetailsView;