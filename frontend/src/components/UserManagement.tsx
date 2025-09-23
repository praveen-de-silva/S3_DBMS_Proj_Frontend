import React, { useState } from 'react';
import axios from 'axios';

interface UserFormData {
  role: string;
  username: string;
  password: string;
  first_name: string;
  last_name: string;
  nic: string;
  gender: string;
  date_of_birth: string;
  branch_id: string;
  contact_id: string;
}

interface FormErrors {
  [key: string]: string;
}

const UserManagement: React.FC = () => {
  const [isAddingUser, setIsAddingUser] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [successMessage, setSuccessMessage] = useState('');
  const [formData, setFormData] = useState<UserFormData>({
    role: 'Agent',
    username: '',
    password: '',
    first_name: '',
    last_name: '',
    nic: '',
    gender: 'Male',
    date_of_birth: '',
    branch_id: '',
    contact_id: ''
  });

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    
    if (!formData.username.trim()) {
      newErrors.username = 'Username is required';
    } else if (formData.username.length < 3) {
      newErrors.username = 'Username must be at least 3 characters';
    }
    
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    
    if (!formData.first_name.trim()) {
      newErrors.first_name = 'First name is required';
    }
    
    if (!formData.last_name.trim()) {
      newErrors.last_name = 'Last name is required';
    }
    
    if (!formData.nic.trim()) {
      newErrors.nic = 'NIC is required';
    }
    
    if (!formData.branch_id.trim()) {
      newErrors.branch_id = 'Branch ID is required';
    }
    
    if (!formData.contact_id.trim()) {
      newErrors.contact_id = 'Contact ID is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post('/api/admin/register', formData, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      setSuccessMessage(`User created successfully! Employee ID: ${response.data.employee_id}`);
      setFormData({
        role: 'Agent',
        username: '',
        password: '',
        first_name: '',
        last_name: '',
        nic: '',
        gender: 'Male',
        date_of_birth: '',
        branch_id: '',
        contact_id: ''
      });
      setErrors({});
      setIsAddingUser(false);
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to create user');
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
  };

  return (
    <div className="user-management">
      <div className="section-header">
        <h3>User Management</h3>
        <button 
          className="btn-primary"
          onClick={() => setIsAddingUser(true)}
        >
          Add New User
        </button>
      </div>

      {successMessage && (
        <div className="success-message">
          {successMessage}
        </div>
      )}

      {isAddingUser && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h4>Add New User</h4>
              <button 
                className="close-btn"
                onClick={() => setIsAddingUser(false)}
              >
                ×
              </button>
            </div>

            <form className="user-form" onSubmit={handleAddUser}>
              <div className="form-row">
                <div className="form-group">
                  <label>Role:</label>
                  <select 
                    name="role" 
                    value={formData.role} 
                    onChange={handleInputChange}
                    required
                  >
                    <option value="Agent">Agent</option>
                    <option value="Manager">Manager</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Username:</label>
                  <input
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleInputChange}
                    required
                    className={errors.username ? 'error' : ''}
                  />
                  {errors.username && <span className="error-text">{errors.username}</span>}
                </div>
              </div>

              <div className="form-group">
                <label>Password:</label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  required
                  className={errors.password ? 'error' : ''}
                />
                {errors.password && <span className="error-text">{errors.password}</span>}
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>First Name:</label>
                  <input
                    type="text"
                    name="first_name"
                    value={formData.first_name}
                    onChange={handleInputChange}
                    required
                    className={errors.first_name ? 'error' : ''}
                  />
                  {errors.first_name && <span className="error-text">{errors.first_name}</span>}
                </div>

                <div className="form-group">
                  <label>Last Name:</label>
                  <input
                    type="text"
                    name="last_name"
                    value={formData.last_name}
                    onChange={handleInputChange}
                    required
                    className={errors.last_name ? 'error' : ''}
                  />
                  {errors.last_name && <span className="error-text">{errors.last_name}</span>}
                </div>
              </div>

              <div className="form-group">
                <label>NIC:</label>
                <input
                  type="text"
                  name="nic"
                  value={formData.nic}
                  onChange={handleInputChange}
                  required
                  className={errors.nic ? 'error' : ''}
                />
                {errors.nic && <span className="error-text">{errors.nic}</span>}
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Gender:</label>
                  <select 
                    name="gender" 
                    value={formData.gender} 
                    onChange={handleInputChange}
                    required
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Date of Birth:</label>
                  <input
                    type="date"
                    name="date_of_birth"
                    value={formData.date_of_birth}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Branch ID:</label>
                  <input
                    type="text"
                    name="branch_id"
                    value={formData.branch_id}
                    onChange={handleInputChange}
                    required
                    className={errors.branch_id ? 'error' : ''}
                  />
                  {errors.branch_id && <span className="error-text">{errors.branch_id}</span>}
                </div>

                <div className="form-group">
                  <label>Contact ID:</label>
                  <input
                    type="text"
                    name="contact_id"
                    value={formData.contact_id}
                    onChange={handleInputChange}
                    required
                    className={errors.contact_id ? 'error' : ''}
                  />
                  {errors.contact_id && <span className="error-text">{errors.contact_id}</span>}
                </div>
              </div>

              <div className="form-actions">
                <button type="button" onClick={() => setIsAddingUser(false)}>
                  Cancel
                </button>
                <button type="submit" disabled={isLoading}>
                  {isLoading ? 'Creating User...' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;