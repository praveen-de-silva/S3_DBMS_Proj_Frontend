import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface Customer {
  customer_id: string;
  first_name: string;
  last_name: string;
  nic: string;
}

interface AccountFormData {
  customer_id: string;
  saving_plan_id: string;
  initial_deposit: number;
  branch_id: string;
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
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post('/api/agent/accounts/create', formData, {
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
    }
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
          <h3>Create Customer Account</h3>
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
                  <h5>Selected Customer</h5>
                  <p><strong>Name:</strong> {selectedCustomer.first_name} {selectedCustomer.last_name}</p>
                  <p><strong>Customer ID:</strong> {selectedCustomer.customer_id}</p>
                  <p><strong>NIC:</strong> {selectedCustomer.nic}</p>
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