import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface Account {
  account_id: string;
  open_date: string;
  account_status: string;
  balance: number;
  saving_plan_id: string;
  branch_id: string;
  customer_id: string;
  first_name: string;
  last_name: string;
  nic: string;
  gender: string;
  date_of_birth: string;
  contact_no_1: string;
  email: string;
  address: string;
  plan_type: string;
  interest: number;
  min_balance: number;
}

interface AccountSummary {
  total_accounts: number;
  active_accounts: number;
  inactive_accounts: number;
  total_balance: number;
  average_balance: number;
}

const CustomerAccounts: React.FC = () => {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [summary, setSummary] = useState<AccountSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('balance');
  const [sortOrder, setSortOrder] = useState('desc');

  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/manager/accounts', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setAccounts(response.data.accounts);
      setSummary(response.data.summary);
    } catch (error: any) {
      console.error('Failed to fetch accounts:', error);
      alert('Failed to load customer accounts');
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

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
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

  const getStatusBadgeClass = (status: string): string => {
    switch (status.toLowerCase()) {
      case 'active': return 'status-badge status-active';
      case 'inactive': return 'status-badge status-inactive';
      default: return 'status-badge';
    }
  };

  const getPlanBadgeClass = (planType: string): string => {
    switch (planType.toLowerCase()) {
      case 'children': return 'plan-badge plan-children';
      case 'teen': return 'plan-badge plan-teen';
      case 'adult': return 'plan-badge plan-adult';
      case 'senior': return 'plan-badge plan-senior';
      case 'joint': return 'plan-badge plan-joint';
      default: return 'plan-badge';
    }
  };

  // Filter and sort accounts
  const filteredAccounts = accounts
    .filter(account => {
      const matchesSearch = 
        account.account_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        account.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        account.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        account.nic.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || account.account_status.toLowerCase() === statusFilter;
      
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      let aValue: any = a[sortBy as keyof Account];
      let bValue: any = b[sortBy as keyof Account];
      
      if (sortBy === 'balance') {
        aValue = parseFloat(aValue);
        bValue = parseFloat(bValue);
      } else if (sortBy === 'open_date') {
        aValue = new Date(aValue).getTime();
        bValue = new Date(bValue).getTime();
      }
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('desc');
    }
  };

  const getSortIcon = (column: string) => {
    if (sortBy !== column) return '↕️';
    return sortOrder === 'asc' ? '↑' : '↓';
  };

  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading customer accounts...</p>
      </div>
    );
  }

  return (
    <div className="customer-accounts">
      <div className="section-header">
        <div>
          <h4>Customer Accounts</h4>
          <p className="section-subtitle">Manage and view all customer accounts in your branch</p>
        </div>
        <button 
          className="btn btn-primary"
          onClick={fetchAccounts}
        >
          Refresh Data
        </button>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="summary-cards">
          <div className="summary-card">
            <div className="summary-icon">🏦</div>
            <div className="summary-content">
              <h4>Total Accounts</h4>
              <div className="summary-value">{summary.total_accounts}</div>
              <div className="summary-detail">
                <span className="active">{summary.active_accounts} Active</span>
                <span className="inactive">{summary.inactive_accounts} Inactive</span>
              </div>
            </div>
          </div>
          
          <div className="summary-card">
            <div className="summary-icon">💰</div>
            <div className="summary-content">
              <h4>Total Balance</h4>
              <div className="summary-value">{formatCurrency(summary.total_balance)}</div>
              <div className="summary-detail">
                Avg: {formatCurrency(summary.average_balance)}
              </div>
            </div>
          </div>
          
          <div className="summary-card">
            <div className="summary-icon">👥</div>
            <div className="summary-content">
              <h4>Customer Demographics</h4>
              <div className="summary-value">{accounts.length} Accounts</div>
              <div className="summary-detail">
                {new Set(accounts.map(acc => acc.customer_id)).size} Unique Customers
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters and Search */}
      <div className="filters-section">
        <div className="search-box">
          <input
            type="text"
            placeholder="Search by account ID, customer name, or NIC..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          <span className="search-icon">🔍</span>
        </div>
        
        <div className="filter-controls">
          <select 
            value={statusFilter} 
            onChange={(e) => setStatusFilter(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
          
          <select 
            value={sortBy} 
            onChange={(e) => setSortBy(e.target.value)}
            className="filter-select"
          >
            <option value="balance">Sort by Balance</option>
            <option value="open_date">Sort by Open Date</option>
            <option value="first_name">Sort by Name</option>
            <option value="account_id">Sort by Account ID</option>
          </select>
        </div>
      </div>

      {/* Accounts Table */}
      <div className="table-container">
        <div className="table-header">
          <h4>Account Details</h4>
          <span className="results-count">
            {filteredAccounts.length} of {accounts.length} accounts
          </span>
        </div>

        {filteredAccounts.length === 0 ? (
          <div className="no-data">
            <div className="no-data-icon">🏦</div>
            <h5>No Accounts Found</h5>
            <p>No accounts match your search criteria.</p>
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="accounts-table">
              <thead>
                <tr>
                  <th onClick={() => handleSort('account_id')}>
                    Account ID {getSortIcon('account_id')}
                  </th>
                  <th onClick={() => handleSort('first_name')}>
                    Customer {getSortIcon('first_name')}
                  </th>
                  <th>Customer Details</th>
                  <th onClick={() => handleSort('balance')}>
                    Balance {getSortIcon('balance')}
                  </th>
                  <th>Account Type</th>
                  <th onClick={() => handleSort('open_date')}>
                    Open Date {getSortIcon('open_date')}
                  </th>
                  <th>Status</th>
                  <th>Contact</th>
                </tr>
              </thead>
              <tbody>
                {filteredAccounts.map(account => (
                  <tr key={account.account_id} className="account-row">
                    <td>
                      <div className="account-id">{account.account_id}</div>
                      <div className="branch-id">Branch: {account.branch_id}</div>
                    </td>
                    
                    <td>
                      <div className="customer-name">
                        <strong>{account.first_name} {account.last_name}</strong>
                      </div>
                      <div className="customer-nic">NIC: {account.nic}</div>
                    </td>
                    
                    <td>
                      <div className="customer-details">
                        <div className="detail-item">
                          <span className="detail-label">Age:</span>
                          <span>{calculateAge(account.date_of_birth)} years</span>
                        </div>
                        <div className="detail-item">
                          <span className="detail-label">Gender:</span>
                          <span>{account.gender}</span>
                        </div>
                        <div className="detail-item">
                          <span className="detail-label">Customer ID:</span>
                          <span>{account.customer_id}</span>
                        </div>
                      </div>
                    </td>
                    
                    <td>
                      <div className="balance-amount">
                        {formatCurrency(account.balance)}
                      </div>
                      {account.min_balance > 0 && account.balance < account.min_balance && (
                        <div className="min-balance-warning">
                          Below min: {formatCurrency(account.min_balance)}
                        </div>
                      )}
                    </td>
                    
                    <td>
                      <div className="account-type">
                        <span className={getPlanBadgeClass(account.plan_type)}>
                          {account.plan_type}
                        </span>
                        <div className="interest-rate">
                          {account.interest}% interest
                        </div>
                      </div>
                    </td>
                    
                    <td>
                      <div className="open-date">
                        {formatDate(account.open_date)}
                      </div>
                      <div className="account-age">
                        {Math.floor((new Date().getTime() - new Date(account.open_date).getTime()) / (1000 * 60 * 60 * 24 * 30))} months
                      </div>
                    </td>
                    
                    <td>
                      <span className={getStatusBadgeClass(account.account_status)}>
                        {account.account_status}
                      </span>
                    </td>
                    
                    <td>
                      <div className="contact-info">
                        <div className="contact-item">
                          <span className="contact-icon">📞</span>
                          {account.contact_no_1}
                        </div>
                        <div className="contact-item">
                          <span className="contact-icon">✉️</span>
                          <span className="email" title={account.email}>
                            {account.email.length > 20 ? account.email.substring(0, 20) + '...' : account.email}
                          </span>
                        </div>
                        <div className="contact-item">
                          <span className="contact-icon">🏠</span>
                          <span className="address" title={account.address}>
                            {account.address.length > 25 ? account.address.substring(0, 25) + '...' : account.address}
                          </span>
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="quick-actions">
        <h4>Quick Actions</h4>
        <div className="action-buttons">
          
          <button className="btn btn-secondary">
            Print Report
          </button>
          
        </div>
      </div>
    </div>
  );
};

export default CustomerAccounts;