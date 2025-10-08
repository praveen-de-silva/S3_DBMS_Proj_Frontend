import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface Branch {
  branch_id: string;
  name: string;
  contact_id: string;
  created_at: string;
  contact_no_1: string;
  contact_no_2: string;
  address: string;
  email: string;
}

interface BranchFormData {
  branch_id: string;
  name: string;
  contact_no_1: string;
  contact_no_2: string;
  address: string;
  email: string;
}

interface FormErrors {
  [key: string]: string;
}

const BranchManagement: React.FC = () => {
  const [isAddingBranch, setIsAddingBranch] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [errors, setErrors] = useState<FormErrors>({});
  const [successMessage, setSuccessMessage] = useState('');
  const [branches, setBranches] = useState<Branch[]>([]);
  const [formData, setFormData] = useState<BranchFormData>({
    branch_id: '',
    name: '',
    contact_no_1: '',
    contact_no_2: '',
    address: '',
    email: ''
  });

  // Fetch branches on component mount
  useEffect(() => {
    fetchBranches();
  }, []);

  const fetchBranches = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/admin/branches', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setBranches(response.data.branches);
    } catch (error: any) {
      console.error('Failed to fetch branches:', error);
      alert('Failed to load branches');
    }
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    
    if (!formData.branch_id.trim()) {
      newErrors.branch_id = 'Branch ID is required';
    } else if (formData.branch_id.length < 3) {
      newErrors.branch_id = 'Branch ID must be at least 3 characters';
    }
    
    if (!formData.name.trim()) {
      newErrors.name = 'Branch name is required';
    }
    
    if (!formData.contact_no_1.trim()) {
      newErrors.contact_no_1 = 'Primary contact number is required';
    }
    
    if (!formData.address.trim()) {
      newErrors.address = 'Address is required';
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAddBranch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post('/api/admin/branches', formData, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      setSuccessMessage(`Branch "${formData.name}" created successfully!`);
      setFormData({
        branch_id: '',
        name: '',
        contact_no_1: '',
        contact_no_2: '',
        address: '',
        email: ''
      });
      setErrors({});
      setIsAddingBranch(false);
      fetchBranches(); // Refresh the branch list
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to create branch');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteBranch = async (branchId: string, branchName: string) => {
    if (!window.confirm(`Are you sure you want to delete branch "${branchName}"? This action will also remove associated contact information.`)) {
      return;
    }

    setIsDeleting(branchId);
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`/api/admin/branches/${branchId}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      setSuccessMessage(`Branch "${branchName}" deleted successfully`);
      fetchBranches(); // Refresh the branch list
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to delete branch');
    } finally {
      setIsDeleting(null);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const generateBranchId = () => {
    const count = branches.length + 1;
    setFormData(prev => ({
      ...prev,
      branch_id: `BR${String(count).padStart(3, '0')}`
    }));
  };

  return (
    <div className="branch-management">
      <div className="section-header">
        <div>
          <h4>Branch Management</h4>
          <p className="section-subtitle">Manage bank branches and their contact information</p>
        </div>
        <button 
          className="btn btn-primary"
          onClick={() => {
            setIsAddingBranch(true);
            generateBranchId();
          }}
        >
          <span className="btn-icon">+</span> Add New Branch
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

      {/* Branches Table */}
      <div className="table-container">
        <div className="table-header">
          <h4>Bank Branches</h4>
          <span className="branch-count">{branches.length} branch(es) found</span>
        </div>
        
        {branches.length === 0 ? (
          <div className="no-data">
            <div className="no-data-icon">🏦</div>
            <h5>No Branches Found</h5>
            <p>Get started by adding your first branch to the system.</p>
            <button 
              className="btn btn-primary"
              onClick={() => {
                setIsAddingBranch(true);
                generateBranchId();
              }}
            >
              Add First Branch
            </button>
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="branches-table">
              <thead>
                <tr>
                  <th>Branch ID</th>
                  <th>Branch Name</th>
                  <th>Contact Number</th>
                  <th>Email</th>
                  <th>Address</th>
                  <th>Created Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {branches.map((branch) => (
                  <tr key={branch.branch_id} className={isDeleting === branch.branch_id ? 'deleting' : ''}>
                    <td>
                      <span className="branch-id">{branch.branch_id}</span>
                    </td>
                    <td>
                      <strong>{branch.name}</strong>
                    </td>
                    <td>
                      <div className="contact-info">
                        <div className="primary-contact">{branch.contact_no_1}</div>
                        {branch.contact_no_2 && (
                          <div className="secondary-contact">{branch.contact_no_2}</div>
                        )}
                      </div>
                    </td>
                    <td>
                      <span className="branch-email">{branch.email}</span>
                    </td>
                    <td>
                      <span className="branch-address" title={branch.address}>
                        {branch.address}
                      </span>
                    </td>
                    <td>
                      <span className="created-date">{formatDate(branch.created_at)}</span>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button 
                          className="btn btn-danger btn-sm"
                          onClick={() => handleDeleteBranch(branch.branch_id, branch.name)}
                          disabled={isDeleting === branch.branch_id}
                          title={`Delete ${branch.name}`}
                        >
                          {isDeleting === branch.branch_id ? (
                            <span className="loading-spinner"></span>
                          ) : (
                            'Delete'
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Branch Modal */}
      {isAddingBranch && (
        <div className="modal-overlay">
          <div className="modal-content large-modal">
            <div className="modal-header">
              <h4>Add New Branch</h4>
              <button 
                className="close-btn"
                onClick={() => setIsAddingBranch(false)}
              >
                ×
              </button>
            </div>

            <form className="branch-form" onSubmit={handleAddBranch}>
              <div className="form-row">
                <div className="form-group">
                  <label>Branch ID *</label>
                  <input
                    type="text"
                    name="branch_id"
                    value={formData.branch_id}
                    onChange={handleInputChange}
                    required
                    placeholder="e.g., BR001"
                    className={errors.branch_id ? 'error' : ''}
                    readOnly
                  />
                  {errors.branch_id && <span className="error-text">{errors.branch_id}</span>}
                  <small className="form-help">Auto-generated branch ID</small>
                </div>

                <div className="form-group">
                  <label>Branch Name *</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    placeholder="e.g., Main Branch, Colombo"
                    className={errors.name ? 'error' : ''}
                  />
                  {errors.name && <span className="error-text">{errors.name}</span>}
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Primary Contact Number *</label>
                  <input
                    type="text"
                    name="contact_no_1"
                    value={formData.contact_no_1}
                    onChange={handleInputChange}
                    required
                    placeholder="e.g., +94112345678"
                    className={errors.contact_no_1 ? 'error' : ''}
                  />
                  {errors.contact_no_1 && <span className="error-text">{errors.contact_no_1}</span>}
                </div>

                <div className="form-group">
                  <label>Secondary Contact Number</label>
                  <input
                    type="text"
                    name="contact_no_2"
                    value={formData.contact_no_2}
                    onChange={handleInputChange}
                    placeholder="e.g., +94112345679"
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Email Address *</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  placeholder="e.g., branch@microbank.com"
                  className={errors.email ? 'error' : ''}
                />
                {errors.email && <span className="error-text">{errors.email}</span>}
              </div>

              <div className="form-group">
                <label>Address *</label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  required
                  placeholder="e.g., 123 Main Street, Colombo 01"
                  className={errors.address ? 'error' : ''}
                />
                {errors.address && <span className="error-text">{errors.address}</span>}
              </div>

              <div className="form-actions">
                <button 
                  type="button" 
                  className="btn btn-secondary"
                  onClick={() => setIsAddingBranch(false)}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <span className="loading-spinner"></span>
                      Creating Branch...
                    </>
                  ) : (
                    'Create Branch'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default BranchManagement;