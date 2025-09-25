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
  contact_id: string;
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
    contact_id: ''
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
      fetchUsers(); // Refresh the user list
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to create user');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteUser = async (employeeId: string) => {
    if (!window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
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
      
      setSuccessMessage('User deleted successfully');
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

  return (
    <div className="user-management">
      <div className="section-header">
        <h3>User Management</h3>
        <button 
          className="btn btn-primary"
          onClick={() => setIsAddingUser(true)}
        >
          + Add New User
        </button>
      </div>

      {successMessage && (
        <div className="success-message">
          {successMessage}
          <button 
            className="close-btn"
            onClick={() => setSuccessMessage('')}
            style={{ marginLeft: '10px', background: 'none', border: 'none', fontSize: '16px' }}
          >
            ×
          </button>
        </div>
      )}

      {/* Users List */}
      <div className="users-section">
        <h4>Existing Users ({users.length})</h4>
        {users.length === 0 ? (
          <div className="no-users">
            <p>No users found. Add your first user to get started.</p>
          </div>
        ) : (
          <div className="users-grid">
            {users.map((user) => (
              <div key={user.employee_id} className="user-card">
                <div className="user-info">
                  <div className="user-main">
                    <h5>{user.first_name} {user.last_name}</h5>
                    <p className="user-id">ID: {user.employee_id}</p>
                    <span className={`role-badge role-${user.role.toLowerCase()}`}>
                      {user.role}
                    </span>
                  </div>
                  <div className="user-details">
                    <p><strong>Username:</strong> {user.username}</p>
                    <p><strong>NIC:</strong> {user.nic}</p>
                    <p><strong>Branch:</strong> {user.branch_id}</p>
                    <p><strong>Joined:</strong> {formatDate(user.created_at)}</p>
                  </div>
                </div>
                <div className="user-actions">
                  <button 
                    className="btn btn-danger btn-sm"
                    onClick={() => handleDeleteUser(user.employee_id)}
                    disabled={isDeleting === user.employee_id}
                  >
                    {isDeleting === user.employee_id ? 'Deleting...' : 'Delete'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add User Modal */}
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