import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface Customer {
  customer_id: string;
  first_name: string;
  last_name: string;
  nic: string;
  date_of_birth: string;
}

interface AccountFormData {
  customer_id: string;
  saving_plan_id: string;
  initial_deposit: number;
  branch_id: string;
  joint_holders?: string[]; // Array of customer IDs for joint account
}

interface SavingPlan {
  saving_plan_id: string;
  plan_type: string;
  interest: number;
  min_balance: number;
}

interface Branch {
  branch_id: string;
  name: string;
}

interface FormErrors {
  [key: string]: string;
}

const AccountCreation: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [errors, setErrors] = useState<FormErrors>({});
  const [successMessage, setSuccessMessage] = useState('');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [savingPlans, setSavingPlans] = useState<SavingPlan[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<SavingPlan | null>(null);
  const [jointHolders, setJointHolders] = useState<Customer[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<Customer[]>([]);
  const [showSearch, setShowSearch] = useState(false);
  
  const [formData, setFormData] = useState<AccountFormData>({
    customer_id: '',
    saving_plan_id: '',
    initial_deposit: 0,
    branch_id: ''
  });

  // Fetch data on component mount
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      const [customersRes, plansRes, branchesRes] = await Promise.all([
        axios.get('/api/agent/customers', {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get('/api/saving-plans', {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get('/api/branches', {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      setCustomers(customersRes.data.customers);
      setSavingPlans(plansRes.data.saving_plans);
      setBranches(branchesRes.data.branches);
    } catch (error: any) {
      console.error('Failed to fetch data:', error);
      alert('Failed to load required data');
    } finally {
      setIsLoadingData(false);
    }
  };

  // Search for joint holders
  useEffect(() => {
    if (searchTerm.trim()) {
      const results = customers.filter(customer => 
        customer.customer_id !== formData.customer_id && // Exclude primary account holder
        !jointHolders.find(jh => jh.customer_id === customer.customer_id) && // Exclude already added joint holders
        (
          customer.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          customer.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          customer.nic.includes(searchTerm) ||
          customer.customer_id.toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
      setSearchResults(results.slice(0, 5)); // Limit to 5 results
    } else {
      setSearchResults([]);
    }
  }, [searchTerm, customers, formData.customer_id, jointHolders]);

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

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    
    if (!formData.customer_id) {
      newErrors.customer_id = 'Please select a customer';
    }
    
    if (!formData.saving_plan_id) {
      newErrors.saving_plan_id = 'Please select a saving plan';
    }
    
    if (!formData.branch_id) {
      newErrors.branch_id = 'Please select a branch';
    }
    
    if (formData.initial_deposit < 0) {
      newErrors.initial_deposit = 'Initial deposit cannot be negative';
    } else if (selectedPlan && formData.initial_deposit < selectedPlan.min_balance) {
      newErrors.initial_deposit = `Minimum balance for ${selectedPlan.plan_type} plan is LKR ${selectedPlan.min_balance.toLocaleString()}`;
    }

    // Validate joint account requirements
    if (selectedPlan?.plan_type === 'Joint') {
      if (jointHolders.length === 0) {
        newErrors.joint_holders = 'Joint account requires at least one joint holder';
      }
      
      // Validate age for joint holders
      const underageJointHolder = jointHolders.find(holder => calculateAge(holder.date_of_birth) < 18);
      if (underageJointHolder) {
        newErrors.joint_holders = `Joint holder ${underageJointHolder.first_name} ${underageJointHolder.last_name} must be at least 18 years old`;
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      const submitData = {
        ...formData,
        joint_holders: jointHolders.map(holder => holder.customer_id)
      };

      const response = await axios.post('/api/agent/accounts/create', submitData, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      setSuccessMessage(`Account created successfully! Account Number: ${response.data.account_id}`);
      setFormData({
        customer_id: '',
        saving_plan_id: '',
        initial_deposit: 0,
        branch_id: ''
      });
      setSelectedCustomer(null);
      setSelectedPlan(null);
      setJointHolders([]);
      setSearchTerm('');
      setSearchResults([]);
      setShowSearch(false);
      setErrors({});
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to create account');
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

    // Update selected customer and plan when they change
    if (name === 'customer_id') {
      const customer = customers.find(c => c.customer_id === value);
      setSelectedCustomer(customer || null);
    } else if (name === 'saving_plan_id') {
      const plan = savingPlans.find(p => p.saving_plan_id === value);
      setSelectedPlan(plan || null);
      // Clear joint holders if plan is changed from Joint to something else
      if (plan?.plan_type !== 'Joint') {
        setJointHolders([]);
        setShowSearch(false);
      }
    }
  };

  const addJointHolder = (customer: Customer) => {
    if (!jointHolders.find(jh => jh.customer_id === customer.customer_id)) {
      setJointHolders(prev => [...prev, customer]);
      setSearchTerm('');
      setSearchResults([]);
      setShowSearch(false);
    }
  };

  const removeJointHolder = (customerId: string) => {
    setJointHolders(prev => prev.filter(holder => holder.customer_id !== customerId));
  };

  const getPlanDescription = (plan: SavingPlan) => {
    return `${plan.plan_type} Plan - ${plan.interest}% interest, Min: LKR ${plan.min_balance.toLocaleString()}`;
  };

  if (isLoadingData) {
    return (
      <div className="customer-registration">
        <div className="loading">
          <div className="loading-spinner"></div>
          <p>Loading account creation data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="account-creation">
      <div className="section-header">
        <div>
          <h4>Create Customer Account</h4>
          <p className="section-subtitle">Open new savings accounts for registered customers</p>
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

      <div className="account-form-container">
        <form className="account-form" onSubmit={handleSubmit}>
          <div className="form-section">
            <h4>Customer Selection</h4>
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
                    {customer.first_name} {customer.last_name} (NIC: {customer.nic}) - {customer.customer_id}
                  </option>
                ))}
              </select>
              {errors.customer_id && <span className="error-text">{errors.customer_id}</span>}
              
              {selectedCustomer && (
                <div className="customer-info-card">
                  <h5>Primary Account Holder</h5>
                  <p><strong>Name:</strong> {selectedCustomer.first_name} {selectedCustomer.last_name}</p>
                  <p><strong>Customer ID:</strong> {selectedCustomer.customer_id}</p>
                  <p><strong>NIC:</strong> {selectedCustomer.nic}</p>
                  <p><strong>Age:</strong> {calculateAge(selectedCustomer.date_of_birth)} years</p>
                </div>
              )}
            </div>
          </div>

          <div className="form-section">
            <h4>Account Details</h4>
            <div className="form-row">
              <div className="form-group">
                <label>Saving Plan *</label>
                <select
                  name="saving_plan_id"
                  value={formData.saving_plan_id}
                  onChange={handleInputChange}
                  required
                  className={errors.saving_plan_id ? 'error' : ''}
                >
                  <option value="">Choose a saving plan...</option>
                  {savingPlans.map(plan => (
                    <option key={plan.saving_plan_id} value={plan.saving_plan_id}>
                      {getPlanDescription(plan)}
                    </option>
                  ))}
                </select>
                {errors.saving_plan_id && <span className="error-text">{errors.saving_plan_id}</span>}
              </div>

              <div className="form-group">
                <label>Branch *</label>
                <select
                  name="branch_id"
                  value={formData.branch_id}
                  onChange={handleInputChange}
                  required
                  className={errors.branch_id ? 'error' : ''}
                >
                  <option value="">Choose a branch...</option>
                  {branches.map(branch => (
                    <option key={branch.branch_id} value={branch.branch_id}>
                      {branch.name} ({branch.branch_id})
                    </option>
                  ))}
                </select>
                {errors.branch_id && <span className="error-text">{errors.branch_id}</span>}
              </div>
            </div>

            <div className="form-group">
              <label>Initial Deposit (LKR) *</label>
              <input
                type="number"
                name="initial_deposit"
                value={formData.initial_deposit}
                onChange={handleInputChange}
                required
                min="0"
                step="0.01"
                placeholder="Enter initial deposit amount"
                className={errors.initial_deposit ? 'error' : ''}
              />
              {errors.initial_deposit && <span className="error-text">{errors.initial_deposit}</span>}
              {selectedPlan && (
                <small className="form-help">
                  Minimum deposit for {selectedPlan.plan_type} plan: LKR {selectedPlan.min_balance.toLocaleString()}
                </small>
              )}
            </div>

            {/* Joint Account Holders Section */}
            {selectedPlan?.plan_type === 'Joint' && (
              <div className="joint-holders-section">
                <p>Joint Account Holders</p>
                <p className="form-help">
                  Add other customers who will be joint holders of this account. All joint holders must be at least 18 years old.
                </p>
                
                {errors.joint_holders && (
                  <span className="error-text">{errors.joint_holders}</span>
                )}

                {/* Current Joint Holders */}
                {jointHolders.length > 0 && (
                  <div className="joint-holders-list">
                    <h6>Added Joint Holders ({jointHolders.length})</h6>
                    {jointHolders.map(holder => (
                      <div key={holder.customer_id} className="joint-holder-card">
                        <div className="holder-info">
                          <strong>{holder.first_name} {holder.last_name}</strong>
                          <span>ID: {holder.customer_id} | NIC: {holder.nic} | Age: {calculateAge(holder.date_of_birth)}</span>
                        </div>
                        <button
                          type="button"
                          className="btn btn-danger btn-sm"
                          onClick={() => removeJointHolder(holder.customer_id)}
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add Joint Holder Search */}
                <div className="add-joint-holder">
                  {!showSearch ? (
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => setShowSearch(true)}
                    >
                      + Add Joint Holder
                    </button>
                  ) : (
                    <div className="search-joint-holder">
                      <div className="search-box">
                        <input
                          type="text"
                          placeholder="Search customers by name, NIC, or ID..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="search-input"
                        />
                        <button
                          type="button"
                          className="btn btn-secondary"
                          onClick={() => {
                            setShowSearch(false);
                            setSearchTerm('');
                            setSearchResults([]);
                          }}
                        >
                          Cancel
                        </button>
                      </div>
                      
                      {searchResults.length > 0 && (
                        <div className="search-results">
                          {searchResults.map(customer => (
                            <div key={customer.customer_id} className="search-result-item">
                              <div className="customer-info">
                                <strong>{customer.first_name} {customer.last_name}</strong>
                                <span>ID: {customer.customer_id} | NIC: {customer.nic} | Age: {calculateAge(customer.date_of_birth)}</span>
                              </div>
                              <button
                                type="button"
                                className="btn btn-primary btn-sm"
                                onClick={() => addJointHolder(customer)}
                              >
                                Add
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                      
                      {searchTerm && searchResults.length === 0 && (
                        <div className="no-results">
                          No customers found matching your search.
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {selectedPlan && formData.initial_deposit >= selectedPlan.min_balance && (
              <div className="account-summary">
                <h5>Account Summary</h5>
                <div className="summary-grid">
                  <div className="summary-item">
                    <span>Plan Type:</span>
                    <strong>{selectedPlan.plan_type}</strong>
                  </div>
                  <div className="summary-item">
                    <span>Interest Rate:</span>
                    <strong>{selectedPlan.interest}%</strong>
                  </div>
                  <div className="summary-item">
                    <span>Initial Deposit:</span>
                    <strong>LKR {formData.initial_deposit.toLocaleString()}</strong>
                  </div>
                  <div className="summary-item">
                    <span>Minimum Balance:</span>
                    <strong>LKR {selectedPlan.min_balance.toLocaleString()}</strong>
                  </div>
                  {selectedPlan.plan_type === 'Joint' && (
                    <div className="summary-item">
                      <span>Joint Holders:</span>
                      <strong>{jointHolders.length + 1} total</strong>
                    </div>
                  )}
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
                  saving_plan_id: '',
                  initial_deposit: 0,
                  branch_id: ''
                });
                setSelectedCustomer(null);
                setSelectedPlan(null);
                setJointHolders([]);
                setSearchTerm('');
                setSearchResults([]);
                setShowSearch(false);
                setErrors({});
              }}
            >
              Clear Form
            </button>
            <button 
              type="submit" 
              className="btn btn-primary"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <span className="loading-spinner"></span>
                  Creating Account...
                </>
              ) : (
                'Create Account'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AccountCreation;