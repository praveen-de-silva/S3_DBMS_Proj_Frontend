import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface Customer {
  customer_id: string;
  first_name: string;
  last_name: string;
  nic: string;
  date_of_birth: string;
}

interface FdPlan {
  fd_plan_id: string;
  fd_options: string;
  interest: number;
}

interface Account {
  account_id: string;
  balance: number;
  customer_names: string;
  fd_id: string | null;
  plan_type: string; // Add plan_type to identify joint accounts
  customer_count: number; // Add customer count
}

interface FdFormData {
  customer_id: string;
  account_id: string;
  fd_plan_id: string;
  principal_amount: number;
  auto_renewal_status: string;
}

interface FormErrors {
  [key: string]: string;
}

interface ExistingFD {
  fd_id: string;
  fd_balance: number;
  fd_status: string;
  open_date: string;
  maturity_date: string;
  auto_renewal_status: string;
  fd_options: string;
  interest: number;
  account_id: string;
  customer_names: string;
}

const FixedDepositCreation: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [errors, setErrors] = useState<FormErrors>({});
  const [successMessage, setSuccessMessage] = useState('');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [fdPlans, setFdPlans] = useState<FdPlan[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<FdPlan | null>(null);
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  
  // New state for FD management
  const [activeTab, setActiveTab] = useState<'create' | 'manage'>('create');
  const [existingFDs, setExistingFDs] = useState<ExistingFD[]>([]);
  const [searchFdId, setSearchFdId] = useState('');
  const [searchResults, setSearchResults] = useState<ExistingFD[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  
  const [formData, setFormData] = useState<FdFormData>({
    customer_id: '',
    account_id: '',
    fd_plan_id: '',
    principal_amount: 0,
    auto_renewal_status: 'False'
  });

  // Fetch data on component mount
  useEffect(() => {
    fetchData();
  }, []);

  // Load existing FDs when switching to manage tab
  useEffect(() => {
    if (activeTab === 'manage') {
      loadExistingFDs();
    }
  }, [activeTab]);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      const [customersRes, plansRes, accountsRes] = await Promise.all([
        axios.get('/api/agent/customers', {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get('/api/fd-plans', {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get('/api/agent/accounts-with-fd', {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      setCustomers(customersRes.data.customers);
      setFdPlans(plansRes.data.fd_plans);
      setAccounts(accountsRes.data.accounts);
    } catch (error: any) {
      console.error('Failed to fetch data:', error);
      alert('Failed to load required data');
    } finally {
      setIsLoadingData(false);
    }
  };

  const loadExistingFDs = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/agent/fixed-deposits', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setExistingFDs(response.data.fixed_deposits);
    } catch (error: any) {
      console.error('Failed to load existing FDs:', error);
      alert('Failed to load existing fixed deposits');
    }
  };

  const searchFD = async () => {
    if (!searchFdId.trim()) {
      setSearchResults(existingFDs);
      return;
    }

    setIsSearching(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`/api/agent/fixed-deposits/search/${searchFdId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSearchResults(response.data.fixed_deposits);
    } catch (error: any) {
      console.error('Search failed:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const deactivateFD = async (fdId: string) => {
    if (!window.confirm('Are you sure you want to deactivate this Fixed Deposit? This action cannot be undone.')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.post('/api/agent/fixed-deposits/deactivate', 
        { fd_id: fdId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      alert('Fixed Deposit deactivated successfully');
      // Refresh the list
      loadExistingFDs();
      setSearchResults(searchResults.filter(fd => fd.fd_id !== fdId));
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to deactivate fixed deposit');
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

  // Get eligible accounts for the selected customer
  const getEligibleAccounts = (): Account[] => {
    if (!selectedCustomer) return [];

    return accounts.filter(account => {
      // Debug logging to see what's happening
      console.log('Checking account:', account.account_id, {
        customer_names: account.customer_names,
        selected_customer: `${selectedCustomer.first_name} ${selectedCustomer.last_name}`,
        has_fd: account.fd_id,
        plan_type: account.plan_type,
        customer_count: account.customer_count,
        balance: account.balance
      });

      // Check if account belongs to selected customer (more flexible matching)
      const customerFullName = `${selectedCustomer.first_name} ${selectedCustomer.last_name}`;
      const belongsToCustomer = account.customer_names.includes(customerFullName);
      
      if (!belongsToCustomer) {
        console.log('Account does not belong to customer');
        return false;
      }

      // Check if account already has an FD
      if (account.fd_id) {
        console.log('Account already has FD:', account.fd_id);
        return false;
      }

      // Check if account is joint account
      if (account.plan_type === 'Joint') {
        console.log('Account is joint account');
        return false;
      }

      // Check if account has multiple customers (joint account)
      if (account.customer_count > 1) {
        console.log('Account has multiple customers');
        return false;
      }

      // Check if account has sufficient balance
      if (account.balance <= 0) {
        console.log('Account has insufficient balance');
        return false;
      }

      console.log('Account is eligible');
      return true;
    });
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    
    if (!formData.customer_id) {
      newErrors.customer_id = 'Please select a customer';
    }
    
    if (!formData.account_id) {
      newErrors.account_id = 'Please select a savings account';
    } else {
      const selectedAcc = accounts.find(acc => acc.account_id === formData.account_id);
      if (selectedAcc?.fd_id) {
        newErrors.account_id = 'This savings account already has a fixed deposit. One FD per savings account is allowed.';
      }
      if (selectedAcc?.plan_type === 'Joint') {
        newErrors.account_id = 'Joint accounts are not eligible for fixed deposits.';
      }
    }
    
    if (!formData.fd_plan_id) {
      newErrors.fd_plan_id = 'Please select a FD plan';
    }
    
    if (formData.principal_amount <= 0) {
      newErrors.principal_amount = 'Principal amount must be greater than 0';
    } else if (selectedAccount && formData.principal_amount > selectedAccount.balance) {
      newErrors.principal_amount = `Insufficient balance in savings account. Available: LKR ${selectedAccount.balance.toLocaleString()}`;
    }

    // Age validation for FD
    if (selectedCustomer && calculateAge(selectedCustomer.date_of_birth) < 18) {
      newErrors.customer_id = 'Customer must be at least 18 years old for Fixed Deposit';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const calculateMaturityDate = (planOption: string): Date => {
    const today = new Date();
    const maturityDate = new Date(today);
    
    switch (planOption) {
      case '6 months':
        maturityDate.setMonth(today.getMonth() + 6);
        break;
      case '1 year':
        maturityDate.setFullYear(today.getFullYear() + 1);
        break;
      case '3 years':
        maturityDate.setFullYear(today.getFullYear() + 3);
        break;
      default:
        maturityDate.setMonth(today.getMonth() + 6);
    }
    
    return maturityDate;
  };

  const calculateMaturityAmount = (principal: number, interestRate: number, planOption: string): number => {
    let years = 0.5; // Default 6 months
    
    switch (planOption) {
      case '6 months':
        years = 0.5;
        break;
      case '1 year':
        years = 1;
        break;
      case '3 years':
        years = 3;
        break;
    }
    
    const interest = principal * (interestRate / 100) * years;
    return principal + interest;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      
      const submitData = {
        ...formData,
        principal_amount: parseFloat(formData.principal_amount.toString())
      };

      const response = await axios.post('/api/agent/fixed-deposits/create', submitData, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      setSuccessMessage(`Fixed Deposit created successfully! FD Account: ${response.data.fd_account_number}`);
      setFormData({
        customer_id: '',
        account_id: '',
        fd_plan_id: '',
        principal_amount: 0,
        auto_renewal_status: 'False'
      });
      setSelectedCustomer(null);
      setSelectedPlan(null);
      setSelectedAccount(null);
      setErrors({});
      
      // Refresh accounts data to update balances
      fetchData();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to create fixed deposit');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
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

    // Update selected items when they change
    if (name === 'customer_id') {
      const customer = customers.find(c => c.customer_id === value);
      setSelectedCustomer(customer || null);
      // Reset account selection when customer changes
      setFormData(prev => ({
        ...prev,
        account_id: ''
      }));
      setSelectedAccount(null);
    } else if (name === 'fd_plan_id') {
      const plan = fdPlans.find(p => p.fd_plan_id === value);
      setSelectedPlan(plan || null);
    } else if (name === 'account_id') {
      const account = accounts.find(a => a.account_id === value);
      setSelectedAccount(account || null);
    }
  };

  const getPlanDescription = (plan: FdPlan) => {
    return `${plan.fd_options} - ${plan.interest}% interest`;
  };

  const getStatusBadge = (status: string) => {
    const statusColors = {
      'Active': 'success',
      'Matured': 'warning',
      'Closed': 'danger'
    };
    
    const color = statusColors[status as keyof typeof statusColors] || 'secondary';
    return <span className={`badge badge-${color}`}>{status}</span>;
  };

  if (isLoadingData) {
    return (
      <div className="customer-registration">
        <div className="loading">
          <div className="loading-spinner"></div>
          <p>Loading fixed deposit data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed-deposit-creation">
      <div className="section-header">
        <div>
          <h4>Fixed Deposit Management</h4>
          <p className="section-subtitle">Create and manage fixed deposit accounts</p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="tab-navigation">
        <button 
          className={`tab-btn ${activeTab === 'create' ? 'active' : ''}`}
          onClick={() => setActiveTab('create')}
        >
          Create New FD
        </button>
        <button 
          className={`tab-btn ${activeTab === 'manage' ? 'active' : ''}`}
          onClick={() => setActiveTab('manage')}
        >
          Manage Existing FDs
        </button>
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

      {activeTab === 'create' ? (
        <div className="account-form-container">
          <form className="account-form" onSubmit={handleSubmit}>
            <div className="form-section">
              <h4>Customer & Account Selection</h4>
              <div className="form-row">
                <div className="form-group">
                  <label>Select Customer *</label>
                  <select
                    name="customer_id"
                    value={formData.customer_id}
                    onChange={handleInputChange}
                    required
                    className={errors.customer_id ? 'error' : ''}
                  >
                    <option value="">Choose a customer...</option>
                    {customers.map(customer => (
                      <option key={customer.customer_id} value={customer.customer_id}>
                        {customer.first_name} {customer.last_name} (NIC: {customer.nic})
                      </option>
                    ))}
                  </select>
                  {errors.customer_id && <span className="error-text">{errors.customer_id}</span>}
                </div>

                <div className="form-group">
                  <label>Select Savings Account *</label>
                  <select
                    name="account_id"
                    value={formData.account_id}
                    onChange={handleInputChange}
                    required
                    className={errors.account_id ? 'error' : ''}
                    disabled={!selectedCustomer}
                  >
                    <option value="">
                      {selectedCustomer ? 'Choose a savings account...' : 'Select customer first...'}
                    </option>
                    {getEligibleAccounts().map(account => (
                      <option key={account.account_id} value={account.account_id}>
                        {account.account_id} - LKR {account.balance.toLocaleString()} - {account.plan_type}
                      </option>
                    ))}
                  </select>
                  {errors.account_id && <span className="error-text">{errors.account_id}</span>}
                  
                  {selectedCustomer && (
                    <div className="account-selection-info">
                      {getEligibleAccounts().length === 0 ? (
                        <small className="form-help text-warning">
                          No eligible savings accounts found for {selectedCustomer.first_name} {selectedCustomer.last_name}. 
                          Customer needs an individual savings account with positive balance and no existing FD.
                        </small>
                      ) : (
                        <small className="form-help">
                          {getEligibleAccounts().length} eligible account(s) found
                        </small>
                      )}
                    </div>
                  )}
                  
                  {selectedAccount && (
                    <small className="form-help">
                      Available balance: LKR {selectedAccount.balance.toLocaleString()}
                    </small>
                  )}
                </div>
              </div>

              {selectedCustomer && (
                <div className="customer-info-card">
                  <h5>Customer Information</h5>
                  <p><strong>Name:</strong> {selectedCustomer.first_name} {selectedCustomer.last_name}</p>
                  <p><strong>Customer ID:</strong> {selectedCustomer.customer_id}</p>
                  <p><strong>NIC:</strong> {selectedCustomer.nic}</p>
                  <p><strong>Age:</strong> {calculateAge(selectedCustomer.date_of_birth)} years</p>
                </div>
              )}
            </div>

            <div className="form-section">
              <h4>Fixed Deposit Details</h4>
              <div className="form-row">
                <div className="form-group">
                  <label>FD Plan *</label>
                  <select
                    name="fd_plan_id"
                    value={formData.fd_plan_id}
                    onChange={handleInputChange}
                    required
                    className={errors.fd_plan_id ? 'error' : ''}
                  >
                    <option value="">Choose a FD plan...</option>
                    {fdPlans.map(plan => (
                      <option key={plan.fd_plan_id} value={plan.fd_plan_id}>
                        {getPlanDescription(plan)}
                      </option>
                    ))}
                  </select>
                  {errors.fd_plan_id && <span className="error-text">{errors.fd_plan_id}</span>}
                </div>

                <div className="form-group">
                  <label>Auto Renewal</label>
                  <select
                    name="auto_renewal_status"
                    value={formData.auto_renewal_status}
                    onChange={handleInputChange}
                  >
                    <option value="False">No Auto Renewal</option>
                    <option value="True">Auto Renewal</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Principal Amount (LKR) *</label>
                <input
                  type="number"
                  name="principal_amount"
                  value={formData.principal_amount}
                  onChange={handleInputChange}
                  required
                  min="0"
                  step="0.01"
                  placeholder="Enter principal amount"
                  className={errors.principal_amount ? 'error' : ''}
                />
                {errors.principal_amount && <span className="error-text">{errors.principal_amount}</span>}
                {selectedAccount && (
                  <small className="form-help">
                    Maximum amount: LKR {selectedAccount.balance.toLocaleString()}
                  </small>
                )}
              </div>

              {selectedPlan && formData.principal_amount > 0 && (
                <div className="fd-summary">
                  <h5>Fixed Deposit Summary</h5>
                  <div className="summary-grid">
                    <div className="summary-item">
                      <span>Plan Duration:</span>
                      <strong>{selectedPlan.fd_options}</strong>
                    </div>
                    <div className="summary-item">
                      <span>Interest Rate:</span>
                      <strong>{selectedPlan.interest}%</strong>
                    </div>
                    <div className="summary-item">
                      <span>Principal Amount:</span>
                      <strong>LKR {formData.principal_amount.toLocaleString()}</strong>
                    </div>
                    <div className="summary-item">
                      <span>Maturity Date:</span>
                      <strong>{calculateMaturityDate(selectedPlan.fd_options).toLocaleDateString()}</strong>
                    </div>
                    <div className="summary-item">
                      <span>Expected Maturity Amount:</span>
                      <strong>LKR {calculateMaturityAmount(
                        formData.principal_amount, 
                        selectedPlan.interest, 
                        selectedPlan.fd_options
                      ).toLocaleString()}</strong>
                    </div>
                    <div className="summary-item">
                      <span>Auto Renewal:</span>
                      <strong>{formData.auto_renewal_status === 'True' ? 'Yes' : 'No'}</strong>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="form-actions">
              <button 
                type="button" 
                className="btn btn-secondary"
                onClick={() => {
                  setFormData({
                    customer_id: '',
                    account_id: '',
                    fd_plan_id: '',
                    principal_amount: 0,
                    auto_renewal_status: 'False'
                  });
                  setSelectedCustomer(null);
                  setSelectedPlan(null);
                  setSelectedAccount(null);
                  setErrors({});
                }}
              >
                Clear Form
              </button>
              <button 
                type="submit" 
                className="btn btn-primary"
                disabled={isLoading || getEligibleAccounts().length === 0}
              >
                {isLoading ? (
                  <>
                    <span className="loading-spinner"></span>
                    Creating Fixed Deposit...
                  </>
                ) : (
                  'Create Fixed Deposit'
                )}
              </button>
            </div>
          </form>
        </div>
      ) : (
        // ... (Manage tab remains the same as previous implementation)
        <div className="fd-management">
          <div className="search-section">
            <div className="search-box">
              <input
                type="text"
                placeholder="Search by FD Account Number..."
                value={searchFdId}
                onChange={(e) => setSearchFdId(e.target.value)}
                className="search-input"
              />
              <button 
                type="button" 
                className="btn btn-primary"
                onClick={searchFD}
                disabled={isSearching}
              >
                {isSearching ? 'Searching...' : 'Search'}
              </button>
              <button 
                type="button" 
                className="btn btn-secondary"
                onClick={() => {
                  setSearchFdId('');
                  setSearchResults(existingFDs);
                }}
              >
                Clear
              </button>
            </div>
          </div>

          <div className="fd-list">
            <h5>Fixed Deposit Accounts</h5>
            {(searchFdId ? searchResults : existingFDs).length === 0 ? (
              <div className="no-data">
                No fixed deposit accounts found.
              </div>
            ) : (
              <div className="fd-grid">
                {(searchFdId ? searchResults : existingFDs).map(fd => (
                  <div key={fd.fd_id} className="fd-card">
                    <div className="fd-header">
                      <h6>FD Account: {fd.fd_id}</h6>
                      {getStatusBadge(fd.fd_status)}
                    </div>
                    <div className="fd-details">
                      <div className="fd-detail">
                        <span>Linked Savings Account:</span>
                        <strong>{fd.account_id}</strong>
                      </div>
                      <div className="fd-detail">
                        <span>Customer:</span>
                        <strong>{fd.customer_names}</strong>
                      </div>
                      <div className="fd-detail">
                        <span>Principal Amount:</span>
                        <strong>LKR {fd.fd_balance.toLocaleString()}</strong>
                      </div>
                      <div className="fd-detail">
                        <span>Plan:</span>
                        <strong>{fd.fd_options} ({fd.interest}%)</strong>
                      </div>
                      <div className="fd-detail">
                        <span>Open Date:</span>
                        <strong>{new Date(fd.open_date).toLocaleDateString()}</strong>
                      </div>
                      <div className="fd-detail">
                        <span>Maturity Date:</span>
                        <strong>{new Date(fd.maturity_date).toLocaleDateString()}</strong>
                      </div>
                      <div className="fd-detail">
                        <span>Auto Renewal:</span>
                        <strong>{fd.auto_renewal_status === 'True' ? 'Yes' : 'No'}</strong>
                      </div>
                    </div>
                    <div className="fd-actions">
                      {fd.fd_status === 'Active' && (
                        <button
                          type="button"
                          className="btn btn-danger btn-sm"
                          onClick={() => deactivateFD(fd.fd_id)}
                        >
                          Deactivate FD
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default FixedDepositCreation;