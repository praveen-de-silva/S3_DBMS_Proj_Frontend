import React, { useState, useEffect } from 'react';
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
  // Contact fields - no more contact_id
  contact_no_1: string;
  contact_no_2: string;
  address: string;
  email: string;
}

interface User {
  employee_id: string;
  username: string;
  first_name: string;
  last_name: string;
  role: string;
  nic: string;
  gender: string;
  date_of_birth: string;
  branch_id: string;
  contact_id: string;
  created_at: string;
}

interface FormErrors {
  [key: string]: string;
}

const UserManagement: React.FC = () => {
  const [isAddingUser, setIsAddingUser] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [errors, setErrors] = useState<FormErrors>({});
  const [successMessage, setSuccessMessage] = useState('');
  const [users, setUsers] = useState<User[]>([]);
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
    contact_no_1: '',
    contact_no_2: '',
    address: '',
    email: ''
  });

  // Fetch users on component mount
  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/admin/users', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setUsers(response.data.users);
    } catch (error: any) {
      console.error('Failed to fetch users:', error);
      alert('Failed to load users');
    }
  };

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
    
    // Contact validation
    if (!formData.contact_no_1.trim()) {
      newErrors.contact_no_1 = 'Primary phone number is required';
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
      
      setSuccessMessage(`User "${formData.first_name} ${formData.last_name}" created successfully! Employee ID: ${response.data.employee_id}`);
      // Reset form data
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
        contact_no_1: '',
        contact_no_2: '',
        address: '',
        email: ''
      });
      setErrors({});
      setIsAddingUser(false);
      fetchUsers(); // Refresh the user list
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to create user');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteUser = async (employeeId: string, userName: string) => {
    if (!window.confirm(`Are you sure you want to delete user "${userName}"? This action cannot be undone.`)) {
      return;
    }

    setIsDeleting(employeeId);
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`/api/admin/users/${employeeId}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      setSuccessMessage(`User "${userName}" deleted successfully`);
      fetchUsers(); // Refresh the user list
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to delete user');
    } finally {
      setIsDeleting(null);
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getRoleBadgeClass = (role: string) => {
    switch (role.toLowerCase()) {
      case 'admin': return 'role-badge role-admin';
      case 'manager': return 'role-badge role-manager';
      case 'agent': return 'role-badge role-agent';
      default: return 'role-badge';
    }
  };

  return (
    <div className="user-management">
      <div className="section-header">
        <div>
          <h4>User Management</h4>
          <p className="section-subtitle">Manage system users and permissions</p>
        </div>
        <button 
          className="btn btn-primary"
          onClick={() => setIsAddingUser(true)}
        >
          <span className="btn-icon">+</span> Add New User
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

      {/* Users Table */}
      <div className="table-container">
        <div className="table-header">
          <h4>System Users</h4>
          <span className="user-count">{users.length} user(s) found</span>
        </div>
        
        {users.length === 0 ? (
          <div className="no-data">
            <div className="no-data-icon">👥</div>
            <h5>No Users Found</h5>
            <p>Get started by adding your first user to the system.</p>
            <button 
              className="btn btn-primary"
              onClick={() => setIsAddingUser(true)}
            >
              Add First User
            </button>
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="users-table">
              <thead>
                <tr>
                  <th>Employee ID</th>
                  <th>Name</th>
                  <th>Username</th>
                  <th>Role</th>
                  <th>NIC</th>
                  <th>Branch</th>
                  <th>Joined Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.employee_id} className={isDeleting === user.employee_id ? 'deleting' : ''}>
                    <td>
                      <span className="employee-id">{user.employee_id}</span>
                    </td>
                    <td>
                      <div className="user-name">
                        <strong>{user.first_name} {user.last_name}</strong>
                        <span className="user-gender">{user.gender}</span>
                      </div>
                    </td>
                    <td>
                      <span className="username">{user.username}</span>
                    </td>
                    <td>
                      <span className={getRoleBadgeClass(user.role)}>
                        {user.role}
                      </span>
                    </td>
                    <td>{user.nic}</td>
                    <td>
                      <span className="branch-id">{user.branch_id}</span>
                    </td>
                    <td>
                      <span className="join-date">{formatDate(user.created_at)}</span>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button 
                          className="btn btn-danger btn-sm"
                          onClick={() => handleDeleteUser(user.employee_id, `${user.first_name} ${user.last_name}`)}
                          disabled={isDeleting === user.employee_id}
                          title={`Delete ${user.first_name} ${user.last_name}`}
                        >
                          {isDeleting === user.employee_id ? (
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

      {/* Add User Modal */}
      {isAddingUser && (
        <div className="modal-overlay">
          <div className="modal-content large-modal">
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
                  <label>Role *</label>
                  <select 
                    name="role" 
                    value={formData.role} 
                    onChange={handleInputChange}
                    required
                  >
                    <option value="Agent">Agent</option>
                    <option value="Manager">Manager</option>
                    <option value="Admin">Admin</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Username *</label>
                  <input
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleInputChange}
                    required
                    placeholder="Enter unique username"
                    className={errors.username ? 'error' : ''}
                  />
                  {errors.username && <span className="error-text">{errors.username}</span>}
                </div>
              </div>

              <div className="form-group">
                <label>Password *</label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  required
                  placeholder="Minimum 6 characters"
                  className={errors.password ? 'error' : ''}
                />
                {errors.password && <span className="error-text">{errors.password}</span>}
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>First Name *</label>
                  <input
                    type="text"
                    name="first_name"
                    value={formData.first_name}
                    onChange={handleInputChange}
                    required
                    placeholder="Enter first name"
                    className={errors.first_name ? 'error' : ''}
                  />
                  {errors.first_name && <span className="error-text">{errors.first_name}</span>}
                </div>

                <div className="form-group">
                  <label>Last Name *</label>
                  <input
                    type="text"
                    name="last_name"
                    value={formData.last_name}
                    onChange={handleInputChange}
                    required
                    placeholder="Enter last name"
                    className={errors.last_name ? 'error' : ''}
                  />
                  {errors.last_name && <span className="error-text">{errors.last_name}</span>}
                </div>
              </div>

              <div className="form-group">
                <label>NIC *</label>
                <input
                  type="text"
                  name="nic"
                  value={formData.nic}
                  onChange={handleInputChange}
                  required
                  placeholder="Enter NIC number"
                  className={errors.nic ? 'error' : ''}
                />
                {errors.nic && <span className="error-text">{errors.nic}</span>}
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Gender *</label>
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
                  <label>Date of Birth *</label>
                  <input
                    type="date"
                    name="date_of_birth"
                    value={formData.date_of_birth}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>

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
                />
                {errors.branch_id && <span className="error-text">{errors.branch_id}</span>}
              </div>

              {/* Contact Information Section */}
              <div className="section-divider">
                <h5>Contact Information</h5>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Primary Phone *</label>
                  <input
                    type="tel"
                    name="contact_no_1"
                    value={formData.contact_no_1}
                    onChange={handleInputChange}
                    required
                    placeholder="e.g., 0771234567"
                    className={errors.contact_no_1 ? 'error' : ''}
                  />
                  {errors.contact_no_1 && <span className="error-text">{errors.contact_no_1}</span>}
                </div>

                <div className="form-group">
                  <label>Secondary Phone</label>
                  <input
                    type="tel"
                    name="contact_no_2"
                    value={formData.contact_no_2}
                    onChange={handleInputChange}
                    placeholder="Optional"
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Email *</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  placeholder="e.g., john.doe@example.com"
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
                  placeholder="Full address"
                  className={errors.address ? 'error' : ''}
                />
                {errors.address && <span className="error-text">{errors.address}</span>}
              </div>

              <div className="form-actions">
                <button 
                  type="button" 
                  className="btn btn-secondary"
                  onClick={() => setIsAddingUser(false)}
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
                      Creating User...
                    </>
                  ) : (
                    'Create User'
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

export default UserManagement;